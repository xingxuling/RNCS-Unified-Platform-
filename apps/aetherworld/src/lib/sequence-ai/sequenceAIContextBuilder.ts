import { SEQUENCE_AI_TOOL_POLICIES } from "@/constants/sequence-ai/sequenceAIToolPolicies";

export type SequenceAISubjectMode = "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";

export interface SequenceAIContext {
  subjectMode: SequenceAISubjectMode;
  language: string;
  availableEngines: string[];
  currentRoute?: string;
  activeSequenceSummary?: string;
  userLevel: "PLAIN_USER" | "STRUCTURED_USER" | "FOUNDER_TECHNICAL";
  privacyNotes: string[];
  founderActive: boolean;
  beginnerMode: boolean;
}

interface BuildOptions {
  founderActive?: boolean;
  beginnerMode?: boolean;
  language?: string;
  currentRoute?: string;
  subjectMode?: SequenceAISubjectMode;
  activeSequenceSummary?: string;
}

export function buildSequenceAIContext(opts: BuildOptions = {}): SequenceAIContext {
  const founderActive = !!opts.founderActive;
  const beginnerMode = opts.beginnerMode ?? !founderActive;
  const subjectMode = opts.subjectMode ?? "DEMO";
  const language = opts.language ?? (typeof window !== "undefined" ? (localStorage.getItem("aether.lang") ?? "zh-CN") : "zh-CN");

  const userLevel: SequenceAIContext["userLevel"] = founderActive
    ? "FOUNDER_TECHNICAL"
    : beginnerMode
      ? "PLAIN_USER"
      : "STRUCTURED_USER";

  const availableEngines = SEQUENCE_AI_TOOL_POLICIES
    .filter((p) => p.requiredMode !== "FOUNDER" || founderActive)
    .map((p) => p.engineId);

  const privacyNotes: string[] = [];
  if (subjectMode === "FULL_60") {
    privacyNotes.push("Full 60 已启用：所有结果默认仅本地，不自动上传。");
  }
  if (subjectMode === "DEMO") {
    privacyNotes.push("当前为 Demo 模式：输出仅用于演示，不代表真实主体结果。");
  }
  if (founderActive) {
    privacyNotes.push("Founder Mode 已启用：可看到完整引擎调用链与高级控制项。");
  }

  return {
    subjectMode,
    language,
    availableEngines,
    currentRoute: opts.currentRoute,
    activeSequenceSummary: opts.activeSequenceSummary,
    userLevel,
    privacyNotes,
    founderActive,
    beginnerMode,
  };
}
