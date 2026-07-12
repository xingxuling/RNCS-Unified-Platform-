import type { SubjectModeId } from "./subjectModes";

export interface SubjectModeRule {
  id: string;
  description: string;
}

export const SUBJECT_MODE_RULES: SubjectModeRule[] = [
  { id: "no_default_demo_when_real_exists", description: "用户已有 Light20 或 Full60 时，不得默认 Demo。" },
  { id: "persist_mode_on_refresh", description: "页面刷新后必须保持上次选择的主体模式。" },
  { id: "isolate_demo_real_founder", description: "Demo / Real / Founder 数据严格隔离，不可混用。" },
  { id: "label_all_outputs", description: "所有核心引擎输出必须带 subjectMode metadata。" },
  { id: "full60_local_only", description: "Full60 默认只保存在本地，不自动上传。" },
];

export const DEFAULT_FALLBACK_MODE: SubjectModeId = "DEMO";
