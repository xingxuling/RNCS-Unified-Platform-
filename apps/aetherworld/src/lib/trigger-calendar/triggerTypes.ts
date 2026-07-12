/**
 * 触发日历核心类型。
 * 触发日历是 Aetherworld 的时间触发中枢，统一管理任务、提醒、模型触发、能力触发、QA 触发等。
 */

export const TRIGGER_TYPES = [
  "REMINDER_TRIGGER",
  "TASK_TRIGGER",
  "MODEL_TRIGGER",
  "CAPABILITY_TRIGGER",
  "QA_TRIGGER",
  "PROJECT_REVIEW_TRIGGER",
  "CODE_CHECK_TRIGGER",
  "WORLD_EVENT_TRIGGER",
  "STORE_UPDATE_TRIGGER",
  "CUSTOM_TRIGGER",
] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];

export const TRIGGER_TYPE_LABEL: Record<TriggerType, string> = {
  REMINDER_TRIGGER: "提醒",
  TASK_TRIGGER: "任务",
  MODEL_TRIGGER: "模型触发",
  CAPABILITY_TRIGGER: "能力触发",
  QA_TRIGGER: "QA 检查",
  PROJECT_REVIEW_TRIGGER: "项目复查",
  CODE_CHECK_TRIGGER: "代码检查",
  WORLD_EVENT_TRIGGER: "世界事件",
  STORE_UPDATE_TRIGGER: "商店更新",
  CUSTOM_TRIGGER: "自定义",
};

export type TriggerStatus =
  | "PENDING"
  | "ACTIVE"
  | "DONE"
  | "MISSED"
  | "PAUSED"
  | "FAILED";

export const TRIGGER_STATUS_LABEL: Record<TriggerStatus, string> = {
  PENDING: "待处理",
  ACTIVE: "进行中",
  DONE: "已完成",
  MISSED: "已错过",
  PAUSED: "已暂停",
  FAILED: "失败",
};

export type TriggerNoticeLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const TRIGGER_NOTICE_LABEL: Record<TriggerNoticeLevel, string> = {
  LOW: "普通",
  MEDIUM: "重要",
  HIGH: "强提醒",
  CRITICAL: "关键",
};

/**
 * 重复规则：极简版（不引入 RRULE 库）。
 *  NONE     一次性
 *  DAILY    每天
 *  WEEKDAY  工作日
 *  WEEKLY   每周
 *  MONTHLY  每月（按日期）
 *  CUSTOM   预留
 */
export type TriggerRepeatRule =
  | "NONE"
  | "DAILY"
  | "WEEKDAY"
  | "WEEKLY"
  | "MONTHLY"
  | "CUSTOM";

export const TRIGGER_REPEAT_LABEL: Record<TriggerRepeatRule, string> = {
  NONE: "仅一次",
  DAILY: "每天",
  WEEKDAY: "工作日",
  WEEKLY: "每周",
  MONTHLY: "每月",
  CUSTOM: "自定义",
};

export interface TriggerItem {
  triggerId: string;
  title: string;
  description?: string;
  triggerType: TriggerType;
  status: TriggerStatus;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** HH:mm */
  time?: string;
  repeatRule: TriggerRepeatRule;
  sourceModule: string;
  targetObjectId?: string;
  targetCapabilityId?: string;
  targetRoute?: string;
  actionType: string;
  noticeLevel: TriggerNoticeLevel;
  createdAt: string;
  updatedAt: string;
  /** 标记完成时间，用于稍后提醒滚动 */
  completedAt?: string;
  /** 稍后提醒下一次时间 */
  snoozeUntil?: string;
}
