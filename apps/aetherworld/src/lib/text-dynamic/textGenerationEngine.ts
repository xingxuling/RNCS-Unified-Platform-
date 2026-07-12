// Text Generation Engine — see spec §7
import type { TextLocale } from "@/constants/text-dynamic/textLocalizationLocales";
import type { TextAudienceMode } from "@/constants/text-dynamic/textAudienceModes";
import type { TextToneProfile } from "@/constants/text-dynamic/textToneProfiles";
import { getText, type TextEntry } from "./textRegistry";

export interface TextGenerationInput {
  textId: string;
  targetLocale?: TextLocale;
  audienceMode?: TextAudienceMode;
  subjectMode?: string;
  toneProfile?: TextToneProfile;
  context?: Record<string, unknown>;
}

export interface TextGenerationOutput {
  textId: string;
  oldText: string;
  newText: string;
  reason: string;
  safetyNotes: string[];
  confidence: number;
}

function audiencePrefix(audience: TextAudienceMode): string {
  switch (audience) {
    case "PUBLIC": return "";
    case "ADVANCED": return "【高阶】";
    case "FOUNDER": return "【Founder · 治理】";
  }
}

function appendSubjectModeNote(text: string, subjectMode?: string): string {
  if (!subjectMode) return text;
  if (subjectMode === "FULL_60") return `${text}（Full60：默认仅本地保存）`;
  if (subjectMode === "DEMO") return `${text}（Demo：结果不基于真实主体数列）`;
  if (subjectMode === "LIGHT_20") return `${text}（Light20 轻量真实主体）`;
  return text;
}

export function generateTextCandidate(input: TextGenerationInput): TextGenerationOutput {
  const entry: TextEntry | undefined = getText(input.textId);
  const oldText = entry?.currentText ?? "";
  const audience = input.audienceMode ?? entry?.audienceMode ?? "PUBLIC";
  const safetyNotes: string[] = [];

  let core = oldText;

  // Refresh heuristics — keep it deterministic and safe
  if (entry?.moduleId === "sequence-currency") {
    core = "数列货币是系统内部记账单位，仅用于回验与贡献结算；不可提现、不可兑换现实货币、不构成投资建议。";
    safetyNotes.push("NO_CURRENCY_CASHOUT");
  } else if (entry?.moduleId === "system-constitution") {
    core = "系统宪法是 Aetherworld 内部规则集合，用于约束引擎输出与权限，不具有现实法律效力。";
    safetyNotes.push("NO_CONSTITUTION_AS_LAW");
  } else if (entry?.subjectModeSensitivity === "FULL60_AWARE") {
    core = "Full60 完整真实主体数据默认仅在本地保存，未经你授权不会上传或同步。";
    safetyNotes.push("FULL60_REQUIRES_PRIVACY");
  } else if (entry?.moduleId === "world-presentation" || entry?.scope === "worldEngine.descriptions") {
    core = oldText.includes("不等于现实") ? oldText
      : `${oldText} 输出为虚拟世界表现层，不等于现实渲染或预测。`;
  } else {
    core = oldText;
  }

  const newText = appendSubjectModeNote(`${audiencePrefix(audience)}${core}`.trim(), input.subjectMode);
  const confidence = entry ? (newText === oldText ? 0.5 : 0.85) : 0.3;

  return {
    textId: input.textId,
    oldText, newText,
    reason: `根据当前模块、主体模式与安全规则刷新文案。audience=${audience}.`,
    safetyNotes, confidence,
  };
}

export function generateBatch(textIds: string[], opts?: Pick<TextGenerationInput, "audienceMode" | "subjectMode" | "targetLocale">): TextGenerationOutput[] {
  return textIds.map((id) => generateTextCandidate({ textId: id, ...opts }));
}
