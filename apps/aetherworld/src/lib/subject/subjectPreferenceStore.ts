/**
 * 主体偏好（轻量 / 真实 共用一份）。
 * 仅保存在本地 localStorage。
 */

const PREF_KEY = "aether.subject.preferences.v1";

export type AnswerStyle = "BRIEF" | "DETAILED" | "CREATIVE" | "DEV" | "STRATEGY";
export type SubjectStage = "BUILD_SYSTEM" | "STRENGTHEN_CODE" | "REAL_BACKEND" | "CREATE" | "CUSTOM";

export interface SubjectPreferences {
  answerStyle: AnswerStyle;
  preferChinese: boolean;
  preferAction: boolean;
  preferSaveObject: boolean;
  conciseReplies: boolean;
  frequentCapabilities: string[];
  longTermDirection: string;
  currentStage: SubjectStage;
  summary: string;
  updatedAt: string;
}

const DEFAULTS: SubjectPreferences = {
  answerStyle: "BRIEF",
  preferChinese: true,
  preferAction: true,
  preferSaveObject: true,
  conciseReplies: true,
  frequentCapabilities: ["WebCodeM", "WebProductM"],
  longTermDirection: "Aetherworld 系统建设、代码与应用能力强化。",
  currentStage: "BUILD_SYSTEM",
  summary: "偏好中文、极简 UI、对话优先、对象保存；当前阶段聚焦系统建设。",
  updatedAt: new Date().toISOString(),
};

function isBrowser() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadPreferences(): SubjectPreferences {
  if (!isBrowser()) return DEFAULTS;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function savePreferences(patch: Partial<SubjectPreferences>) {
  const next = { ...loadPreferences(), ...patch, updatedAt: new Date().toISOString() };
  if (isBrowser()) {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("aether:subject:changed"));
    } catch {}
  }
  return next;
}

export function clearPreferences() {
  if (isBrowser()) {
    try {
      localStorage.removeItem(PREF_KEY);
      window.dispatchEvent(new CustomEvent("aether:subject:changed"));
    } catch {}
  }
}

export const ANSWER_STYLE_LABEL: Record<AnswerStyle, string> = {
  BRIEF: "简洁",
  DETAILED: "详细",
  CREATIVE: "创作",
  DEV: "开发",
  STRATEGY: "战略",
};

export const STAGE_LABEL: Record<SubjectStage, string> = {
  BUILD_SYSTEM: "构建系统",
  STRENGTHEN_CODE: "强化代码能力",
  REAL_BACKEND: "接入真实后端",
  CREATE: "创作中",
  CUSTOM: "自定义",
};
