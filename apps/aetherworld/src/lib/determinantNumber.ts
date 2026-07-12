// 定数计算引擎 Determinant Number Engine
// 把多计算法输出收束为最终定数判断
import {
  DETERMINATION_STATES,
  DETERMINATION_BANDS,
  type DeterminationStatus,
} from "@/constants/determinationStates";
import { clamp } from "./math";
import type { SignalPurificationResult } from "./signalPurification";
import type { DomainFoldingResult } from "./domainFolding";
import type { BranchResult } from "./branchCollapse";
import type { ResonanceResult } from "./resonanceLock";
import type { ProductVitalityResult } from "./productVitality";
import type { GeoFactorResult } from "./geoFactor";
import type { TriggerResult } from "./predictionEngine";
import type { FeedbackRecord } from "./types";

// ============= 输入接口 =============

export interface DeterminationInput {
  trueSignal: number;            // 0-100  真信号强度
  noise: number;                 // 0-100  噪声强度
  domainFolding: number;         // 0-100  折域同向度
  resonanceLock: number;         // 0-100  共振锁定指数
  branchCollapse: number;        // 0-100  最强分支塌缩度
  feedbackContinuity: number;    // 0-100  回验连续度
  mainlineLegitimacy: number;    // 0-100  主线正当性
  fieldSupport: number;          // 0-100  场域承载力
  humanVariableOpen: number;     // 0-100  人物变量未确认度
  fieldBlocking: number;         // 0-100  场域阻断
  reverseSignal: number;         // 0-100  反向信号强度
  // 可选上下文，用于生成说明
  context?: {
    target?: string;             // 主体 / 事件 / 日期 / 关系 / 产品 / 行动
    label?: string;
    eventType?: string;
  };
}

// ============= 输出接口 =============

export interface DeterminationResult {
  determinationScore: number;
  status: DeterminationStatus;
  statusLabel: string;
  statusDesc: string;
  fixedVariables: string[];
  openVariables: string[];
  falseSignals: string[];
  determiningFactors: string[];
  blockingFactors: string[];
  finalAction: string;
  explanation: string;
  raw: {
    positive: number;
    negative: number;
    overrides: string[];
  };
}

// ============= 变量标签 =============

const POS_LABELS: Array<[keyof DeterminationInput, string]> = [
  ["trueSignal",         "真信号"],
  ["domainFolding",      "折域同向"],
  ["resonanceLock",      "共振锁定"],
  ["branchCollapse",     "分支塌缩"],
  ["feedbackContinuity", "回验连续"],
  ["mainlineLegitimacy", "主线正当"],
  ["fieldSupport",       "场域承载"],
];

const NEG_LABELS: Array<[keyof DeterminationInput, string]> = [
  ["noise",              "噪声污染"],
  ["humanVariableOpen",  "人物未确认"],
  ["fieldBlocking",      "场域阻断"],
  ["reverseSignal",      "反向信号"],
];

// ============= 主函数 =============

export function determine(input: DeterminationInput): DeterminationResult {
  const pos =
    input.trueSignal +
    input.domainFolding +
    input.resonanceLock +
    input.branchCollapse +
    input.feedbackContinuity +
    input.mainlineLegitimacy +
    input.fieldSupport;
  const neg =
    input.noise +
    input.humanVariableOpen +
    input.fieldBlocking +
    input.reverseSignal;

  // 归一：正向均分 - 负向均分加权
  const positiveAvg = pos / POS_LABELS.length;       // 0-100
  const negativeAvg = neg / NEG_LABELS.length;        // 0-100
  const raw = positiveAvg - negativeAvg * 0.55;
  const determinationScore = Math.round(clamp(raw, 0, 100));

  // 按分数划档
  let status: DeterminationStatus = "UNDETERMINED";
  for (const b of DETERMINATION_BANDS) {
    if (determinationScore >= b.min && determinationScore <= b.max) {
      status = b.status;
      break;
    }
  }

  const overrides: string[] = [];

  // 特殊覆盖规则
  if (input.reverseSignal >= 60) {
    status = "REVERSE_DETERMINED";
    overrides.push("反向信号≥60，覆盖为反定。");
  } else if (input.noise > input.trueSignal && input.noise >= 50) {
    status = "FALSE_DETERMINED";
    overrides.push("噪声高于真信号，覆盖为假定。");
  } else if (input.resonanceLock >= 70 && input.trueSignal < 50) {
    // 共振强但信号净化弱
    status = determinationScore >= 55 ? "SEMI_DETERMINED" : "FALSE_DETERMINED";
    overrides.push("共振感强，但信号净化不足。");
  } else if (input.branchCollapse >= 75 && input.fieldSupport < 50) {
    status = "SEMI_DETERMINED";
    overrides.push("分支正在收束，但场域未完全承载。");
  }

  const meta = DETERMINATION_STATES[status];

  // 变量分类
  const fixedVariables: string[] = [];
  const openVariables: string[] = [];
  for (const [k, n] of POS_LABELS) {
    const v = input[k] as number;
    if (v >= 70) fixedVariables.push(`${n} ${v}`);
    else if (v >= 30) openVariables.push(`${n} ${v}`);
  }
  // 人物变量开放度高，也列入开放
  if (input.humanVariableOpen >= 50) openVariables.push(`人物变量待确认 ${input.humanVariableOpen}`);
  if (input.fieldBlocking >= 40)   openVariables.push(`场域阻断 ${input.fieldBlocking}`);

  // 假信号 / 噪声来源
  const falseSignals: string[] = [];
  if (input.noise >= 50) falseSignals.push(`噪声水平 ${input.noise}`);
  if (input.reverseSignal >= 40) falseSignals.push(`反向信号 ${input.reverseSignal}`);
  if (input.resonanceLock >= 70 && input.trueSignal < 50) {
    falseSignals.push("强共振 + 弱信号 → 警惕投射");
  }
  if (input.trueSignal < 35) falseSignals.push("真信号过弱，结构未成立");

  // 定数来源 = 当前正向最强 3 项
  const determiningFactors = [...POS_LABELS]
    .map(([k, n]) => ({ k, n, v: input[k] as number }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map((x) => `${x.n}(${x.v})`);

  // 阻断来源 = 当前负向最强 2 项
  const blockingFactors = [...NEG_LABELS]
    .map(([k, n]) => ({ k, n, v: input[k] as number }))
    .filter((x) => x.v >= 30)
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map((x) => `${x.n}(${x.v})`);

  // 最终动作
  const finalAction = resolveFinalAction(status, input);

  // 解释文案
  const explanation = composeExplanation(status, determinationScore, input, overrides);

  return {
    determinationScore,
    status,
    statusLabel: meta.label,
    statusDesc: meta.desc,
    fixedVariables,
    openVariables,
    falseSignals,
    determiningFactors,
    blockingFactors,
    finalAction,
    explanation,
    raw: {
      positive: +positiveAvg.toFixed(1),
      negative: +negativeAvg.toFixed(1),
      overrides,
    },
  };
}

function resolveFinalAction(status: DeterminationStatus, i: DeterminationInput): string {
  switch (status) {
    case "DETERMINED":
      return "进 / 执行：可按结果推进、发布或承诺。";
    case "NEAR_DETERMINED":
      return "稳步推进：补齐最后 1–2 个关键变量后再大动作。";
    case "SEMI_DETERMINED":
      return i.humanVariableOpen >= 50
        ? "守中带进：可小步推进，等待关键人物 / 场域确认。"
        : "守中带进：小步推进，保留撤回余地。";
    case "UNDETERMINED":
      return "观察 / 补证：暂不投入承诺，先收集 1–2 个跨域反馈。";
    case "REVERSE_DETERMINED":
      return "转 / 止损：撤出强承诺，转向更稳定的分支。";
    case "FALSE_DETERMINED":
      return "断 / 净化：暂停判断，先净化情绪 / 愿望 / 恐惧噪声。";
  }
}

function composeExplanation(
  status: DeterminationStatus,
  score: number,
  i: DeterminationInput,
  overrides: string[],
): string {
  const label = DETERMINATION_STATES[status].label;
  const parts: string[] = [
    `状态：${label}，定数值 ${score}/100。`,
  ];
  if (status === "DETERMINED" || status === "NEAR_DETERMINED") {
    parts.push(`真信号 ${i.trueSignal}、折域 ${i.domainFolding}、主线正当 ${i.mainlineLegitimacy} 共同收束，结构已经形成。`);
  } else if (status === "SEMI_DETERMINED") {
    parts.push(`主要方向已经出现，但人物变量 ${i.humanVariableOpen}、场域阻断 ${i.fieldBlocking} 仍在波动；可小步推进，不宜一次性公开发布。`);
  } else if (status === "UNDETERMINED") {
    parts.push(`真信号 ${i.trueSignal} 偏弱、折域 ${i.domainFolding} 未收束，分支仍处于打开态，宜等待跨域复合反馈。`);
  } else if (status === "REVERSE_DETERMINED") {
    parts.push(`反向信号 ${i.reverseSignal} 已经主导走向，表象与结构方向相反；继续投入将放大损失。`);
  } else if (status === "FALSE_DETERMINED") {
    parts.push(`明确感主要来自噪声 ${i.noise} 与共振投射 ${i.resonanceLock}，与真信号 ${i.trueSignal} 不成比例；先净化后再判断。`);
  }
  if (overrides.length) parts.push(`覆盖规则：${overrides.join(" / ")}`);
  return parts.join(" ");
}

// ============= 派生器：从既有引擎结果生成定数输入 =============

export interface DeriveFromKernelArgs {
  signal?: SignalPurificationResult;
  folding?: DomainFoldingResult;
  branch?: BranchResult;
  resonance?: ResonanceResult;
  vitality?: ProductVitalityResult;
  geo?: GeoFactorResult;
  feedback?: FeedbackRecord[];
  context?: DeterminationInput["context"];
}

export function deriveFromKernel(a: DeriveFromKernelArgs): DeterminationInput {
  const signal = a.signal;
  const folding = a.folding;
  const branch = a.branch;
  const resonance = a.resonance;
  const vitality = a.vitality;
  const geo = a.geo;
  const feedback = a.feedback ?? [];

  // 真信号 & 噪声
  const trueSignal = signal ? signal.score : 50;
  const noise = signal ? clamp(signal.noiseSources.length * 20, 0, 100) : 30;

  // 折域 / 分支
  const domainFolding = folding ? folding.index : 50;
  const branchCollapse = branch ? branch.total : 50;

  // 共振
  const resonanceLock = resonance ? resonance.index : 50;

  // 回验连续度：最近 12 次 hitScore 均值
  let feedbackContinuity = 55;
  if (feedback.length) {
    const recent = feedback.slice(-12);
    const avg = recent.reduce((s, r) => s + r.hitScore, 0) / recent.length;
    feedbackContinuity = Math.round(clamp(avg, 0, 100));
  }

  // 主线正当性：折域 shen + 分支 mainline 层
  const mainline = folding?.scores.shen ?? 60;
  const branchMain = branch ? (branch.scores.mainline ?? 60) : 60;
  const mainlineLegitimacy = Math.round((mainline + branchMain) / 2);

  // 场域承载 = geo + folding 中物理/承载/资源/制度
  const carry = folding
    ? ((folding.scores.di ?? 50) + (folding.scores.body ?? 50) + (folding.scores.resource ?? 50) + (folding.scores.institution ?? 50)) / 4
    : 55;
  const fieldSupport = geo
    ? Math.round((geo.score + carry) / 2)
    : Math.round(carry);

  // 人物变量未确认度 = 100 - ren - resonance
  const renScore = folding?.scores.ren ?? 50;
  const humanVariableOpen = Math.round(clamp(100 - (renScore + resonanceLock) / 2, 0, 100));

  // 场域阻断
  const fieldBlocking = Math.round(clamp(100 - fieldSupport, 0, 100));

  // 反向信号
  let reverseSignal = 0;
  if (signal?.type === "reverse") reverseSignal = Math.max(reverseSignal, 70);
  if (signal?.type === "false_sync") reverseSignal = Math.max(reverseSignal, 50);
  if (branch && branch.state === "CLOSED") reverseSignal = Math.max(reverseSignal, 55);
  if (vitality && vitality.level === "Dormant") reverseSignal = Math.max(reverseSignal, 45);

  return {
    trueSignal,
    noise,
    domainFolding,
    resonanceLock,
    branchCollapse,
    feedbackContinuity,
    mainlineLegitimacy,
    fieldSupport,
    humanVariableOpen,
    fieldBlocking,
    reverseSignal,
    context: a.context,
  };
}

// 从单日 TriggerResult + 回验快速生成定数输入（详情页 / 仪表盘逐日使用）
export function deriveFromTrigger(
  result: TriggerResult,
  feedback: FeedbackRecord[] = [],
): DeterminationInput {
  const d = result.domainScores;
  const trueSignal = Math.round(clamp(result.score, 0, 100));
  const noise = Math.round(clamp(result.noiseCandidates.length * 22, 0, 100));
  const domainFolding = Math.round((d.tian + d.di + d.ren + d.shen + d.feng) / 5);
  // 主线 = shen 域
  const mainlineLegitimacy = d.shen;
  // 场域承载 = di
  const fieldSupport = d.di;
  // 人物变量 = 100 - ren
  const humanVariableOpen = clamp(100 - d.ren, 0, 100);
  // 场域阻断
  const fieldBlocking = clamp(100 - d.di, 0, 100);
  // 分支塌缩 ≈ trigger score（同日多域共识强度）
  const branchCollapse = trueSignal;
  // 共振：保持中性
  const resonanceLock = 50;
  // 回验连续度
  let feedbackContinuity = 55;
  if (feedback.length) {
    const recent = feedback.slice(-12);
    feedbackContinuity = Math.round(clamp(recent.reduce((s, r) => s + r.hitScore, 0) / recent.length, 0, 100));
  }
  // 反向信号：falling 相 + 高分 = 表象与结构背离
  let reverseSignal = 0;
  if (result.phase.energy === "falling" && result.score >= 60) reverseSignal = 55;
  if (result.eventTypeId === "obstacle" || result.eventTypeId === "turbulence") reverseSignal = Math.max(reverseSignal, 45);

  return {
    trueSignal,
    noise,
    domainFolding,
    resonanceLock,
    branchCollapse,
    feedbackContinuity,
    mainlineLegitimacy,
    fieldSupport,
    humanVariableOpen,
    fieldBlocking,
    reverseSignal,
    context: { target: "日预测", label: result.date, eventType: result.eventTypeId },
  };
}
