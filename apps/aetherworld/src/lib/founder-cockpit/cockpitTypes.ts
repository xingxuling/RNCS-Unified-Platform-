// 创始人中枢驾驶舱 类型定义

export type FiveDomain = "TIAN" | "DI" | "REN" | "SHEN" | "FENG";

export const FIVE_DOMAIN_LABEL: Record<FiveDomain, string> = {
  TIAN: "天 · 世界雷达",
  DI: "地 · 无人工厂",
  REN: "人 · 创始人 × AGI",
  SHEN: "神 · 使命与叙事",
  FENG: "风 · 增长与传播",
};

export interface FiveDomainStatus {
  domain: FiveDomain;
  headline: string;
  detail: string;
  health: "GREEN" | "AMBER" | "RED" | "IDLE";
}

export type SeedKind =
  | "TEXT"
  | "FILE"
  | "FOLDER"
  | "SCREENSHOT"
  | "LINK"
  | "LOVABLE_RETURN"
  | "USER_FEEDBACK"
  | "ERROR_LOG"
  | "PRODUCT_IDEA"
  | "COMPETITOR";

export const SEED_KIND_LABEL: Record<SeedKind, string> = {
  TEXT: "文本",
  FILE: "文件",
  FOLDER: "文件夹",
  SCREENSHOT: "截图",
  LINK: "链接",
  LOVABLE_RETURN: "Lovable 返回",
  USER_FEEDBACK: "用户反馈",
  ERROR_LOG: "错误日志",
  PRODUCT_IDEA: "产品想法",
  COMPETITOR: "竞品资料",
};

export type SeedStage =
  | "SEED"
  | "SKELETON"
  | "MUSCLE"
  | "BLOOD"
  | "NERVE"
  | "ORGAN"
  | "CIVILIZATION";

export const SEED_STAGE_LABEL: Record<SeedStage, string> = {
  SEED: "种子",
  SKELETON: "骨架",
  MUSCLE: "肌肉",
  BLOOD: "血液",
  NERVE: "神经",
  ORGAN: "器官",
  CIVILIZATION: "文明",
};

export type SeedOutcome =
  | "TRAINING_SAMPLE"
  | "DATASET"
  | "DEV_TASK"
  | "CAPABILITY_PACK"
  | "STORE_DRAFT"
  | "PRODUCT_PAGE"
  | "MODEL_EXPERIMENT"
  | "GROWTH_TASK"
  | "RECOVERY_TASK";

export const SEED_OUTCOME_LABEL: Record<SeedOutcome, string> = {
  TRAINING_SAMPLE: "训练样本",
  DATASET: "数据集",
  DEV_TASK: "开发任务",
  CAPABILITY_PACK: "能力包",
  STORE_DRAFT: "商店草案",
  PRODUCT_PAGE: "产品页面",
  MODEL_EXPERIMENT: "模型实验",
  GROWTH_TASK: "用户增长任务",
  RECOVERY_TASK: "失败恢复任务",
};

export interface SeedRecord {
  id: string;
  kind: SeedKind;
  summary: string;
  createdAt: number;
  stage: SeedStage;
  outcomes: SeedOutcome[];
  note?: string;
}

export interface CockpitDecisionView {
  observed: string;
  chosenFactory: string;
  reason: string;
  estimatedValue: "P0" | "P1" | "P2" | "P3";
  nextStep: string;
  needsFounderApproval: boolean;
}

export interface WorldRadarSignal {
  id: string;
  category: "OPPORTUNITY" | "COMPETITOR" | "MODEL" | "TECH" | "USER_SIGNAL";
  title: string;
  detail: string;
  potentialOutcomes: SeedOutcome[];
}

export interface ProductForgeItem {
  id: string;
  name: string;
  kind:
    | "APP"
    | "PAGE"
    | "CAPABILITY"
    | "DATASET"
    | "MODEL"
    | "TEMPLATE"
    | "REPORT"
    | "WORKFLOW"
    | "API"
    | "STORE_DRAFT";
  status: "DRAFT" | "TESTABLE" | "RELEASABLE" | "RELEASED";
  audience: string;
  value: string;
  risk: string;
  nextStep: string;
}

export interface EvolutionRow {
  id: string;
  category: "MODEL" | "DATA" | "PRODUCT" | "FAILURE" | "FEEDBACK";
  title: string;
  delta: string;
  at: number;
}

export interface FactoryCardData {
  factory: "MATERIAL" | "TRAINING" | "DEVELOPMENT" | "COMPANY" | "HEALTH";
  label: string;
  input: string;
  running: string;
  output: string;
  failures: string;
  nextStep: string;
  automationLevel: "L0" | "L1" | "L2" | "L3" | "L4";
}
