// 旧模块总登记类型定义
// 用于统一登记 Aetherworld 的历史 / 老系统资产，规划接入 Aetherworld 新运行链。

export type LegacyModuleCategory =
  | "VIRTUAL_LIFE"
  | "VIRTUAL_WORLD"
  | "PRODUCT_EVOLUTION"
  | "RECORD_CENTER"
  | "VERIFICATION_CENTER"
  | "WEIGHT_ENGINE"
  | "PREDICTION_CALIBRATION"
  | "EVENT_ENGINE"
  | "JOURNAL"
  | "REALITY_CALIBRATION"
  | "SYSTEM_AUDIT"
  | "OTHER";

export const LEGACY_CATEGORY_LABEL: Record<LegacyModuleCategory, string> = {
  VIRTUAL_LIFE: "虚拟生活",
  VIRTUAL_WORLD: "虚拟世界",
  PRODUCT_EVOLUTION: "产品自进化",
  RECORD_CENTER: "记录中心",
  VERIFICATION_CENTER: "回验中心",
  WEIGHT_ENGINE: "权重引擎",
  PREDICTION_CALIBRATION: "预测校准",
  EVENT_ENGINE: "事件算法",
  JOURNAL: "虚拟日记 / 创造",
  REALITY_CALIBRATION: "现实校准",
  SYSTEM_AUDIT: "治理 / 审计",
  OTHER: "其他",
};

export type LegacyModuleLayer =
  | "INTERFACE"
  | "RUNTIME"
  | "MEMORY"
  | "PREDICTION"
  | "SCHEDULER"
  | "STATE"
  | "VALUE"
  | "WORLD"
  | "LIFE"
  | "GOVERNANCE";

export const LEGACY_LAYER_LABEL: Record<LegacyModuleLayer, string> = {
  INTERFACE: "界面层",
  RUNTIME: "运行时",
  MEMORY: "记忆层",
  PREDICTION: "预测层",
  SCHEDULER: "调度层",
  STATE: "状态层",
  VALUE: "价值层",
  WORLD: "世界层",
  LIFE: "生活层",
  GOVERNANCE: "治理层",
};

export type LegacyModuleStatus =
  | "ACTIVE"
  | "PARTIAL"
  | "READ_ONLY"
  | "DEMO"
  | "PLACEHOLDER"
  | "LEGACY"
  | "DUPLICATE"
  | "DISABLED";

export const LEGACY_STATUS_LABEL: Record<LegacyModuleStatus, string> = {
  ACTIVE: "已运行",
  PARTIAL: "部分接入",
  READ_ONLY: "只读保留",
  DEMO: "演示态",
  PLACEHOLDER: "占位",
  LEGACY: "历史模块",
  DUPLICATE: "可能重复",
  DISABLED: "暂不启用",
};

export type ActivationPriority = "P0" | "P1" | "P2" | "P3";

export type RecommendedAction =
  | "ACTIVATE_NOW"
  | "BRIDGE_ONLY"
  | "MERGE"
  | "KEEP_READ_ONLY"
  | "DEFER"
  | "DEPRECATE";

export const RECOMMENDED_ACTION_LABEL: Record<RecommendedAction, string> = {
  ACTIVATE_NOW: "立即激活",
  BRIDGE_ONLY: "仅桥接",
  MERGE: "考虑合并",
  KEEP_READ_ONLY: "只读保留",
  DEFER: "暂缓",
  DEPRECATE: "建议下线",
};

export interface LegacyConnectableTo {
  chat: boolean;
  fusion: boolean;
  memory: boolean;
  currency: boolean;
  msl: boolean;
  prediction: boolean;
  scheduler: boolean;
  calendar: boolean;
  workspace: boolean;
  store: boolean;
  social: boolean;
  qa: boolean;
}

export interface LegacyBridgePlan {
  /** 接入目标说明 */
  goal: string;
  /** 需要连接的子系统 */
  targets: string[];
  /** 可复用的现有文件 */
  reusableFiles: string[];
  /** 需要新增的 Bridge */
  newBridges: string[];
  /** 风险提示 */
  risks: string[];
  /** Lovable 下一轮提示词草案 */
  promptDraft: string;
}

export interface LegacyModule {
  id: string;
  name: string;
  cnName: string;
  category: LegacyModuleCategory;
  layer: LegacyModuleLayer;
  currentStatus: LegacyModuleStatus;
  routes: string[];
  files: string[];
  capabilities: string[];
  connectableTo: LegacyConnectableTo;
  activationPriority: ActivationPriority;
  recommendedAction: RecommendedAction;
  risks: string[];
  notes: string;
  bridgePlan?: LegacyBridgePlan;
}
