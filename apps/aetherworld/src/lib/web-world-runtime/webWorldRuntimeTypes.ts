/**
 * WebWorldRuntimeM — 世界运行时能力包
 *
 * 把已有的 sequence-world / virtual-world 引擎统一封装成符合 WebXXM 习惯的
 * Runtime 接口，让对话、商店、工作区都能像调用其它 WebXXM 一样调用世界运行时。
 *
 * 注意：这里不重新实现世界引擎，只做一层薄封装。原 sequence-world 路由保留。
 */

export type WebWorldRuntimeMode =
  | "DEMO"          // 演示世界
  | "LIGHT"         // 轻量世界
  | "FULL"          // 深度世界（需 Full60）
  | "CREATOR"       // 创作者世界
  | "DECISION";     // 决策世界

export interface WebWorldRuntimeInput {
  /** 自然语言种子描述，或主体数列 */
  seed: string;
  mode: WebWorldRuntimeMode;
  /** Tick 步数上限（普通用户最大 10，Founder 可放宽） */
  maxTicks?: number;
  /** 是否生成 NPC / 任务 / 地图 */
  generateNpcs?: boolean;
  generateQuests?: boolean;
  generateMap?: boolean;
}

export interface WebWorldRuntimeResult {
  runId: string;
  worldId: string;
  worldName: string;
  signature: string;
  dominantDomain: string;
  phase: string;
  zonesCount: number;
  questsCount: number;
  npcsCount: number;
  rulesCount: number;
  safetyNotes: string[];
  /** 摘要文本，供对话承接层显示 */
  summary: string;
  createdAt: string;
}

export interface WebWorldRuntimeMeta {
  capabilityId: "WEB_WORLD_RUNTIME_M";
  name: "WebWorldRuntimeM";
  chineseName: "世界运行时";
  version: string;
  description: string;
  status: "ENABLED" | "DISABLED";
}

export const WEB_WORLD_RUNTIME_META: WebWorldRuntimeMeta = {
  capabilityId: "WEB_WORLD_RUNTIME_M",
  name: "WebWorldRuntimeM",
  chineseName: "世界运行时",
  version: "0.1.0",
  description: "统一封装的世界运行时能力包，基于数列世界引擎，可被对话 / 商店 / 工作区调用。",
  status: "ENABLED",
};
