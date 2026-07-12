// 核心：抽散触发强度计算引擎
// 输出可解释、可复现的触发评分
import type { SubjectModel } from "./types";
import type { Domain } from "@/constants/types";
import { DOMAINS } from "@/constants/types";
import { getNumberConstant } from "@/constants/numberConstants";
import { getPhase, type LifecyclePhase } from "@/constants/lifecycleConstants";
import { getEventType, EVENT_TYPES } from "@/constants/eventTypes";
import { getAction, type ActionPermission } from "@/constants/actionPermissions";
import { clamp, dateDigitRoot, mulberry32, strHash, daysBetween, formatDate, addDays } from "./math";

export type IntensityLevel = "low" | "mid" | "high" | "peak";

export interface DomainScores {
  tian: number; di: number; ren: number; shen: number; feng: number;
}

export interface TriggerResult {
  date: string;             // YYYY-MM-DD
  dayOffset: number;        // 距离今天的天数
  score: number;            // 0-100
  level: IntensityLevel;
  digits: number[];         // 当日对应的五位数字
  digitsIndex: number;      // 数列索引
  dateRoot: number;         // 日期数字根 1-9
  phase: LifecyclePhase;    // 十二长生相位
  domainScores: DomainScores; // 五域权重
  dominantDomain: Domain;
  eventTypeId: string;
  actionKey: string;
  // 计算解释
  breakdown: {
    base: number;
    dateRootBonus: number;
    constantBonus: number;
    scatter: number;
    operatorAdjust: number;
    domainMatch: number;
    phaseAdjust: number;
    feedbackAdjust: number;
  };
  // 噪声候选
  noiseCandidates: string[];
  verification: string;
}

const LEVEL_OF = (s: number): IntensityLevel =>
  s >= 80 ? "peak" : s >= 60 ? "high" : s >= 40 ? "mid" : "low";

function selectActionKey(
  eventId: string,
  phase: LifecyclePhase,
  level: IntensityLevel,
): string {
  if (level === "low") return phase.energy === "void" ? "qingli" : "shou";
  if (phase.energy === "void") return "duan";
  if (phase.energy === "falling") return level === "peak" ? "zhuan" : "huifu";
  if (phase.energy === "seed") return "bucai";
  // rising / peak
  if (eventId === "body_overload") return "huifu";
  if (eventId === "turbulence") return "dengdai";
  if (eventId === "old_ended") return "qingli";
  if (eventId === "partnership" || eventId === "resource_appear") return "hezuo";
  if (eventId === "creation_burst") return "fabu";
  if (eventId === "key_talk") return "goutong";
  if (eventId === "obstacle") return "jujue";
  if (level === "peak") return "jin";
  return "jin";
}

function noiseFor(level: IntensityLevel, phase: LifecyclePhase, ev: string): string[] {
  const arr: string[] = [];
  if (level === "low") arr.push("预测过弱", "外界突发变量");
  if (level === "peak") arr.push("预测过强", "情绪噪声");
  if (phase.energy === "falling") arr.push("时间延迟");
  if (phase.energy === "seed") arr.push("时间提前", "场域不承载");
  if (ev === "relation_warm" || ev === "relation_cool") arr.push("人物变量未到");
  return Array.from(new Set(arr)).slice(0, 3);
}

interface FeedbackHint {
  date: string;
  hitScore: number; // 0-100
}

export interface ComputeOptions {
  feedbackHints?: FeedbackHint[]; // 用于温和调权
}

/**
 * 计算单日触发强度
 */
export function computeTrigger(
  subject: SubjectModel,
  date: string,
  opts: ComputeOptions = {},
): TriggerResult {
  const today = formatDate(new Date());
  const dayOffset = daysBetween(today, date);

  // 1. 对应数列
  const idx = ((dayOffset % subject.digits.length) + subject.digits.length) % subject.digits.length;
  const digits = subject.digits[idx];

  // 2. 数列底盘分（五位之和 + 高频数字加权）
  const sum = digits.reduce((a, b) => a + b, 0); // 0-45
  const freq: Record<number, number> = {};
  digits.forEach((d) => { freq[d] = (freq[d] ?? 0) + 1; });
  const maxFreq = Math.max(...Object.values(freq));
  const base = sum / 45 * 20 + (maxFreq - 1) * 3; // 0-26

  // 3. 日期数字根
  const dateRoot = dateDigitRoot(date);

  // 4. 五域匹配度
  const matchHits = digits.filter((d) => d === dateRoot).length;
  const domainMatch = matchHits * 6; // 0-30

  // 5. 常数分（依据五位中每个数字 domain 倾向）
  const constantBonus = digits.reduce((acc, d) => {
    const c = getNumberConstant(d);
    // 9/8/5/1 类带高能数字略加权
    if ([9, 8, 5, 1].includes(c.digit)) return acc + 1.5;
    if ([0, 4].includes(c.digit)) return acc + 0.5;
    return acc + 1;
  }, 0); // 5-7.5

  // 6. 相位
  const phase = getPhase(dayOffset + idx);
  const phaseAdjust =
    phase.energy === "peak" ? 8 :
    phase.energy === "rising" ? 5 :
    phase.energy === "falling" ? -4 :
    phase.energy === "void" ? -6 :
    2; // seed

  // 7. 抽散随机分（伪随机，subjectId+date 决定）
  const rng = mulberry32(strHash(subject.id + "|" + date));
  const scatter = rng() * 18 - 4; // -4 ~ 14

  // 8. 乘除算子调整（基于第5位「风」数字）
  const op = digits[4];
  let operatorAdjust = 0;
  if (op >= 7) operatorAdjust = (op - 6) * 2.5;   // 放大
  else if (op <= 3 && op > 0) operatorAdjust = -(4 - op) * 1.8; // 阻尼
  else if (op === 0) operatorAdjust = -5;

  // 9. 回验修正
  let feedbackAdjust = 0;
  if (opts.feedbackHints && opts.feedbackHints.length) {
    const recent = opts.feedbackHints.slice(-12);
    const avg = recent.reduce((a, b) => a + b.hitScore, 0) / recent.length;
    feedbackAdjust = (avg - 60) * 0.08; // -5 ~ +3
  }

  // 10. 域得分
  const domainScores: DomainScores = { tian: 0, di: 0, ren: 0, shen: 0, feng: 0 };
  digits.forEach((d, i) => {
    const c = getNumberConstant(d);
    const positionDomain = DOMAINS[i] as Domain;
    domainScores[positionDomain] += 3 + (d === dateRoot ? 2 : 0);
    domainScores[c.domain] += 1.5;
  });
  // normalize 0-100
  const dMax = Math.max(...Object.values(domainScores)) || 1;
  (Object.keys(domainScores) as Domain[]).forEach((k) => {
    domainScores[k] = Math.round((domainScores[k] / dMax) * 100);
  });
  const dominantDomain = (Object.keys(domainScores) as Domain[]).reduce(
    (a, b) => (domainScores[a] >= domainScores[b] ? a : b),
  );

  // 总分
  const raw = base + dateRoot * 1.2 + constantBonus + scatter
    + operatorAdjust + domainMatch + phaseAdjust + feedbackAdjust;
  const score = Math.round(clamp(raw + 25, 0, 100));
  const level = LEVEL_OF(score);

  // 事件解码：选择与 dominantDomain 匹配且 hash 决定的具体事件类型
  const candidates = EVENT_TYPES.filter((e) => e.domain === dominantDomain);
  const pickRng = mulberry32(strHash(subject.id + date + dominantDomain));
  const evPool = candidates.length ? candidates : EVENT_TYPES;
  let eventTypeId = evPool[Math.floor(pickRng() * evPool.length)].id;
  // 极端低分/相位映射特殊事件
  if (phase.energy === "void" && level !== "peak") eventTypeId = "old_ended";
  if (phase.energy === "falling" && score >= 60 && dominantDomain === "di") eventTypeId = "body_overload";
  if (score >= 85 && dominantDomain === "shen") eventTypeId = "identity_shift";

  const actionKey = selectActionKey(eventTypeId, phase, level);

  return {
    date,
    dayOffset,
    score,
    level,
    digits,
    digitsIndex: idx,
    dateRoot,
    phase,
    domainScores,
    dominantDomain,
    eventTypeId,
    actionKey,
    breakdown: {
      base: +base.toFixed(1),
      dateRootBonus: +(dateRoot * 1.2).toFixed(1),
      constantBonus: +constantBonus.toFixed(1),
      scatter: +scatter.toFixed(1),
      operatorAdjust: +operatorAdjust.toFixed(1),
      domainMatch,
      phaseAdjust,
      feedbackAdjust: +feedbackAdjust.toFixed(1),
    },
    noiseCandidates: noiseFor(level, phase, eventTypeId),
    verification: getEventType(eventTypeId).verification,
  };
}

/**
 * 生成未来时间线
 */
export function generateTimeline(
  subject: SubjectModel,
  days: number,
  opts: ComputeOptions = {},
): TriggerResult[] {
  const today = new Date();
  const arr: TriggerResult[] = [];
  for (let i = 0; i < days; i++) {
    arr.push(computeTrigger(subject, formatDate(addDays(today, i)), opts));
  }
  return arr;
}

/** 找出 Top N 强触发日 */
export function topTriggers(results: TriggerResult[], n: number): TriggerResult[] {
  return [...results].sort((a, b) => b.score - a.score).slice(0, n);
}

export function getActionMeta(key: string): ActionPermission {
  return getAction(key);
}
