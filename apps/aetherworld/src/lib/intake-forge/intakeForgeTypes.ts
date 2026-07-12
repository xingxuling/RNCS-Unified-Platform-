// AetherSeed Intake Forge · 类型定义 v0.1
// 投喂式训练数据铸造炉：粘贴 / 文件 / 文件夹 → 训练样本候选 + 评测候选

export type IntakeInputMode = "PASTE" | "FILE" | "FOLDER";

export type IntakeSourceType =
  | "CHATGPT_COMPRESSED_EXPORT"
  | "CHATGPT_CONVERSATION"
  | "LOVABLE_PROMPT"
  | "LOVABLE_RESULT"
  | "AETHERWORLD_INTERNAL_DOC"
  | "BUG_AUDIT"
  | "RECORD_CENTER_EXPORT"
  | "MSL_STATE"
  | "SEQUENCE_MEMORY"
  | "SEQUENCE_PREDICTION"
  | "SEQUENCE_AGENT_RUN"
  | "SEQUENCE_AI_RESULT"
  | "PROJECT_FOLDER"
  | "CODE_PROJECT"
  | "README_DOC"
  | "OPEN_ARCHITECTURE_DOC"
  | "NETWORK_SOURCE"
  | "WORLD_CREATIVE"
  | "GENERAL_TEXT"
  | "UNKNOWN";

export const INTAKE_SOURCE_LABEL: Record<IntakeSourceType, string> = {
  CHATGPT_COMPRESSED_EXPORT: "ChatGPT 压缩对话导出",
  CHATGPT_CONVERSATION: "ChatGPT 对话片段",
  LOVABLE_PROMPT: "Lovable Prompt",
  LOVABLE_RESULT: "Lovable 返回结果",
  AETHERWORLD_INTERNAL_DOC: "Aetherworld 内部文档",
  BUG_AUDIT: "Bug 审计",
  RECORD_CENTER_EXPORT: "记录中心导出",
  MSL_STATE: "MSL 状态语言",
  SEQUENCE_MEMORY: "数列记忆",
  SEQUENCE_PREDICTION: "数列预测",
  SEQUENCE_AGENT_RUN: "数列 Agent 执行",
  SEQUENCE_AI_RESULT: "数列 AI 结果",
  PROJECT_FOLDER: "项目文件夹",
  CODE_PROJECT: "代码项目",
  README_DOC: "README 文档",
  OPEN_ARCHITECTURE_DOC: "开源架构文档",
  NETWORK_SOURCE: "联网来源",
  WORLD_CREATIVE: "世界观 / 创作",
  GENERAL_TEXT: "通用文本",
  UNKNOWN: "未知（请人工选择）",
};

export type IntakeSampleType =
  // ChatGPT 压缩对话
  | "STRUCTURED_REASONING"
  | "CIVILIZATION_SEED_COMPILATION"
  | "LOVABLE_HANDOFF"
  | "CALCULUS_ROUTING"
  | "AGENT_PANEL"
  | "SEQUENCE_PREDICTION"
  | "SYSTEM_DESIGN"
  // Lovable Prompt
  | "LOVABLE_PROMPT_SAMPLE"
  | "SYSTEM_IMPLEMENTATION_INSTRUCTION"
  | "ACCEPTANCE_CRITERIA_SAMPLE"
  // Lovable Result
  | "CHANGELOG_SAMPLE"
  | "BUG_AUDIT_SAMPLE"
  | "SYSTEM_STATE_SAMPLE"
  | "QA_VERIFICATION_SAMPLE"
  // MSL
  | "MSL_GENERATION"
  | "STATE_CLASSIFICATION"
  | "STATUS_VALIDATION"
  // 代码 / 文件夹
  | "CODE_ASSIST"
  | "OPEN_ARCHITECTURE_SAMPLE"
  | "PROJECT_FUSION_SAMPLE"
  | "ARCHITECTURE_MAPPING"
  // 世界观
  | "WORLD_GENERATION"
  | "NARRATIVE_SAMPLE"
  | "CHARACTER_SAMPLE"
  | "VOCAL_PROMPT_SAMPLE"
  // 回验
  | "SYSTEM_QA_SAMPLE"
  | "VERIFICATION_REVIEW"
  | "PRODUCT_EVOLUTION_SAMPLE";

export const INTAKE_SAMPLE_LABEL: Record<IntakeSampleType, string> = {
  STRUCTURED_REASONING: "结构化推理",
  CIVILIZATION_SEED_COMPILATION: "文明种子编译",
  LOVABLE_HANDOFF: "Lovable 移交",
  CALCULUS_ROUTING: "计算法路由",
  AGENT_PANEL: "Agent 面板",
  SEQUENCE_PREDICTION: "数列预测",
  SYSTEM_DESIGN: "系统设计",
  LOVABLE_PROMPT_SAMPLE: "Lovable Prompt 样本",
  SYSTEM_IMPLEMENTATION_INSTRUCTION: "系统实现指令",
  ACCEPTANCE_CRITERIA_SAMPLE: "验收标准样本",
  CHANGELOG_SAMPLE: "变更日志样本",
  BUG_AUDIT_SAMPLE: "Bug 审计样本",
  SYSTEM_STATE_SAMPLE: "系统状态样本",
  QA_VERIFICATION_SAMPLE: "QA 回验样本",
  MSL_GENERATION: "MSL 生成",
  STATE_CLASSIFICATION: "状态分类",
  STATUS_VALIDATION: "状态校验",
  CODE_ASSIST: "代码辅助",
  OPEN_ARCHITECTURE_SAMPLE: "开源架构样本",
  PROJECT_FUSION_SAMPLE: "项目融合样本",
  ARCHITECTURE_MAPPING: "架构映射",
  WORLD_GENERATION: "世界生成",
  NARRATIVE_SAMPLE: "叙事样本",
  CHARACTER_SAMPLE: "角色样本",
  VOCAL_PROMPT_SAMPLE: "声音提示词样本",
  SYSTEM_QA_SAMPLE: "系统 QA 样本",
  VERIFICATION_REVIEW: "回验复盘",
  PRODUCT_EVOLUTION_SAMPLE: "产品进化样本",
};

export type IntakeSafetyStatus = "PASS" | "WARN" | "BLOCK";

export type IntakeProcessingStatus =
  | "RECEIVED"
  | "EXTRACTED"
  | "SANITIZED"
  | "CLASSIFIED"
  | "CHUNKED"
  | "COMPILED"
  | "EVAL_CREATED"
  | "SAVED"
  | "FAILED";

export type IntakeChunkType =
  | "DIALOGUE"
  | "PROMPT"
  | "RESULT"
  | "CODE"
  | "DOC"
  | "MSL"
  | "WORLD"
  | "BUG"
  | "UNKNOWN";

export type IntakeCompiledOutputType =
  | "PRETRAIN_TEXT"
  | "SFT_JSONL"
  | "CHATML"
  | "ALPACA"
  | "ROUTER_JSON"
  | "MSL_JSON"
  | "TOOL_CALLING_JSON"
  | "LOVABLE_PROMPT_JSON"
  | "EVAL_JSON"
  | "WORKSPACE_OBJECT";

export interface IntakeItem {
  id: string;
  inputMode: IntakeInputMode;
  sourceType: IntakeSourceType;
  originalName?: string;
  fileCount?: number;
  estimatedSizeMb?: number;
  extractedTextLength?: number;
  detectedLanguage?: string;
  safetyStatus: IntakeSafetyStatus;
  processingStatus: IntakeProcessingStatus;
  tags: string[];
  createdAt: string;
  /** 不存原文，避免污染内存；仅存预览 */
  preview?: string;
  notes?: string[];
}

export interface IntakeChunk {
  id: string;
  intakeItemId: string;
  chunkIndex: number;
  textPreview: string;
  tokenEstimate?: number;
  chunkType: IntakeChunkType;
  sampleCandidates: IntakeSampleType[];
  qualityScore: number; // 0~1
  safetyStatus: IntakeSafetyStatus;
}

export interface IntakeCompiledOutput {
  id: string;
  intakeItemId: string;
  outputType: IntakeCompiledOutputType;
  sampleCount: number;
  format: string;
  safetyStatus: IntakeSafetyStatus;
  qualityScore: number; // 0~1
  createdAt: string;
  /** 候选样本简要预览，不存全文 */
  samplePreviews: string[];
}

export interface IntakeEvalItem {
  id: string;
  intakeItemId: string;
  evalType: "ROUTER_HIT" | "MSL_HIT" | "FORMAT_VALID" | "INTENT_HIT" | "WORLD_CONSISTENCY";
  question: string;
  expected: string;
}

export interface IntakeForgeRun {
  id: string;
  inputMode: IntakeInputMode;
  itemCount: number;
  chunkCount: number;
  compiledOutputCount: number;
  evalItemCount: number;
  blockedCount: number;
  warnings: string[];
  suggestedTrainingTasks: string[];
  createdAt: string;
  items: IntakeItem[];
  chunks: IntakeChunk[];
  outputs: IntakeCompiledOutput[];
  evals: IntakeEvalItem[];
  averageQuality: number;
  // ==== 投喂吸收率修正 v0.1 追加（向后兼容，旧消费者忽略即可） ====
  /** 本次投喂使用的吸收模式 */
  intakeMode?: import("./intakeAbsorptionTypes").IntakeMode;
  /** 原始语料文档（保留 rawText，不被短样本生成丢弃） */
  rawDocuments?: import("./intakeAbsorptionTypes").RawCorpusDocument[];
  /** 长 / 中语料切片（用于 continued training / pretrain / SFT 上下文） */
  longChunks?: import("./intakeAbsorptionTypes").LongCorpusChunk[];
  /** 吸收率报告（raw / absorbed / long / short / 未吸收） */
  absorption?: import("./intakeAbsorptionTypes").IntakeAbsorptionReport;
}

let __iid = 0;
export function nextIntakeId(prefix: "IFI" | "IFC" | "IFO" | "IFE" | "IFR"): string {
  __iid += 1;
  return `${prefix}-${Date.now().toString(36)}-${__iid.toString(36)}`;
}
