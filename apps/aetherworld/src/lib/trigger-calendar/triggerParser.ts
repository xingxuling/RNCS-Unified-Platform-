/**
 * 极简自然语言触发解析器（中文优先）。
 * 用于 Chat 端识别诸如「明天提醒我检查项目」「每周一复查」等表达。
 * 不依赖外部 NLP 库；只做关键词 + 正则匹配。
 */
import type {
  TriggerItem,
  TriggerNoticeLevel,
  TriggerRepeatRule,
  TriggerType,
} from "./triggerTypes";
import { newTriggerId } from "./triggerStore";
import { shiftDate, todayString } from "./triggerSelectors";

export interface ParsedTriggerDraft {
  matched: boolean;
  title: string;
  date: string;
  time?: string;
  repeatRule: TriggerRepeatRule;
  triggerType: TriggerType;
  noticeLevel: TriggerNoticeLevel;
}

const WEEKDAY_MAP: Record<string, number> = {
  日: 0, 天: 0, "0": 0,
  一: 1, "1": 1,
  二: 2, "2": 2,
  三: 3, "3": 3,
  四: 4, "4": 4,
  五: 5, "5": 5,
  六: 6, "6": 6,
};

function nextWeekday(target: number): string {
  const now = new Date();
  const cur = now.getDay();
  let diff = (target - cur + 7) % 7;
  if (diff === 0) diff = 7;
  return shiftDate(todayString(), diff);
}

function pickType(text: string): TriggerType {
  if (/(代码|code|sandbox|run)/i.test(text)) return "CODE_CHECK_TRIGGER";
  if (/(QA|质量|检查)/i.test(text)) return "QA_TRIGGER";
  if (/(项目|复查|review)/i.test(text)) return "PROJECT_REVIEW_TRIGGER";
  if (/(安装|启用|更新|WebXXM|能力)/i.test(text)) return "CAPABILITY_TRIGGER";
  if (/(模型|WebLLM|WebLCM|WebLKM)/i.test(text)) return "MODEL_TRIGGER";
  if (/(世界|world)/i.test(text)) return "WORLD_EVENT_TRIGGER";
  if (/(任务|todo|完成|交付)/i.test(text)) return "TASK_TRIGGER";
  return "REMINDER_TRIGGER";
}

export function parseTriggerFromText(text: string): ParsedTriggerDraft {
  const t = text.trim();
  const draft: ParsedTriggerDraft = {
    matched: false,
    title: t,
    date: todayString(),
    repeatRule: "NONE",
    triggerType: pickType(t),
    noticeLevel: "MEDIUM",
  };

  // 关键词触发：是否像一个触发请求
  const triggerKeywords = /(提醒|提醒我|记得|安排|每天|每周|每月|工作日|今晚|明天|后天|下周|定时|到点|稍后|计划)/;
  if (!triggerKeywords.test(t)) return draft;

  draft.matched = true;

  // 重复规则
  if (/每天|每日/.test(t)) draft.repeatRule = "DAILY";
  else if (/工作日/.test(t)) draft.repeatRule = "WEEKDAY";
  else if (/每周/.test(t)) draft.repeatRule = "WEEKLY";
  else if (/每月/.test(t)) draft.repeatRule = "MONTHLY";

  // 日期
  if (/后天/.test(t)) draft.date = shiftDate(todayString(), 2);
  else if (/明天|明日/.test(t)) draft.date = shiftDate(todayString(), 1);
  else if (/今晚|今天|今日/.test(t)) draft.date = todayString();
  else if (/下周/.test(t)) draft.date = shiftDate(todayString(), 7);

  // 「每周一/二/...」「周一/星期一」
  const wkMatch = t.match(/(?:每周|周|星期|礼拜)([一二三四五六日天])/);
  if (wkMatch) {
    const wd = WEEKDAY_MAP[wkMatch[1]];
    if (typeof wd === "number") {
      draft.date = nextWeekday(wd);
      if (/每/.test(t)) draft.repeatRule = "WEEKLY";
    }
  }

  // 时间：7点 / 19:30 / 晚上 8 点
  const hhmm = t.match(/(\d{1,2})[:：](\d{2})/);
  if (hhmm) {
    draft.time = `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
  } else {
    const hourMatch = t.match(/(?:上午|早上|晚上|下午|今晚)?\s*(\d{1,2})\s*点/);
    if (hourMatch) {
      let h = parseInt(hourMatch[1], 10);
      if (/(晚上|下午|今晚)/.test(t) && h < 12) h += 12;
      draft.time = `${String(h).padStart(2, "0")}:00`;
    }
  }

  // 噪声词清理 → 标题
  draft.title = t
    .replace(/(?:每天|每日|每周一|每周二|每周三|每周四|每周五|每周六|每周日|工作日|每月)/g, "")
    .replace(/(?:今晚|今天|今日|明天|明日|后天|下周)/g, "")
    .replace(/(?:上午|早上|晚上|下午)?\s*\d{1,2}\s*点/g, "")
    .replace(/\d{1,2}[:：]\d{2}/g, "")
    .replace(/^[，,。.\s]*/, "")
    .replace(/^(?:提醒我|提醒|记得|安排|计划)/, "")
    .replace(/^[，,。.\s]*/, "")
    .trim();
  if (!draft.title) draft.title = "未命名触发";

  return draft;
}

export function buildTriggerFromDraft(
  draft: ParsedTriggerDraft,
  sourceModule = "Chat",
): TriggerItem {
  const now = new Date().toISOString();
  return {
    triggerId: newTriggerId(),
    title: draft.title,
    triggerType: draft.triggerType,
    status: "PENDING",
    date: draft.date,
    time: draft.time,
    repeatRule: draft.repeatRule,
    sourceModule,
    actionType: "REMIND",
    noticeLevel: draft.noticeLevel,
    createdAt: now,
    updatedAt: now,
  };
}
