/**
 * 内置示例 (Showcase)
 *
 * 这里汇总同账号项目里值得在 Aetherworld 内部以「示例」形式展示的项目和模块。
 * 它不替换原项目，仅在 /showcase 路径下作为可参考的产物索引。
 */
export type ShowcaseKind =
  | "WORLD_RUNTIME"
  | "APP_RUNTIME"
  | "WEBXXM"
  | "CHAT_PERSONA"
  | "STORE_TEMPLATE"
  | "PRODUCT_REFERENCE";

export interface ShowcaseExample {
  exampleId: string;
  title: string;
  subtitle: string;
  description: string;
  kind: ShowcaseKind;
  tags: string[];
  /** 在 Aetherworld 内可跳转到的路由（若已有内置实现） */
  internalRoute?: string;
  /** 原项目链接（仅作参考，不直接跳出） */
  externalRef?: string;
  /** 安全提示，例如「虚拟内容，不构成现实建议」 */
  safetyNote?: string;
}

export const SHOWCASE_EXAMPLES: ShowcaseExample[] = [
  {
    exampleId: "world-seed-runtime",
    title: "种子世界运行时",
    subtitle: "Aetherion Seed Runtime",
    description: "以数列种子驱动的世界运行时母版，已被吸收为内置 WebWorldRuntimeM。",
    kind: "WORLD_RUNTIME",
    tags: ["世界", "运行时", "种子"],
    internalRoute: "/web-world-runtime",
    safetyNote: "虚拟世界，仅用于推演与创作。",
  },
  {
    exampleId: "world-simulation",
    title: "数列世界模拟",
    subtitle: "Sequence World Simulation",
    description: "可 Tick、可快照、可导出 Godot / Unity 的世界模拟内核。",
    kind: "WORLD_RUNTIME",
    tags: ["模拟", "Tick", "导出"],
    internalRoute: "/world-simulation",
  },
  {
    exampleId: "app-runtime-elang",
    title: "应用运行时预览",
    subtitle: "Aether E-Lang App Runtime",
    description: "WebCodeM × App Runtime 的预览范本，已接入设备模拟器。",
    kind: "APP_RUNTIME",
    tags: ["代码", "预览", "设备模拟"],
    internalRoute: "/app-runtime",
  },
  {
    exampleId: "advisor-chat-persona",
    title: "顾问对话主体",
    subtitle: "Advisor Chat Persona",
    description: "可挂载到 Chat 的预设对话主体，作为社交化人格示例。",
    kind: "CHAT_PERSONA",
    tags: ["对话", "主体", "人格"],
    internalRoute: "/chat",
  },
  {
    exampleId: "store-skills-bridge",
    title: "技能桥商店模板",
    subtitle: "Skills Bridge Store Template",
    description: "二阶段交易 UI（发布 → 详情 → 订单）参考蓝本。",
    kind: "STORE_TEMPLATE",
    tags: ["商店", "模板", "交易"],
    internalRoute: "/store",
  },
  {
    exampleId: "oracle-cluster",
    title: "命理 / 塔罗 / 易经 / 哲学人格簇",
    subtitle: "Oracle WebXXM Cluster",
    description: "象征体系组合的 WebOracleM 簇，作为虚拟解读工具示例。",
    kind: "WEBXXM",
    tags: ["象征", "解读", "WebOracleM"],
    safetyNote: "虚拟内容，不构成现实占卜或医疗 / 投资建议。",
  },
];

export function getShowcaseByKind(kind?: ShowcaseKind): ShowcaseExample[] {
  if (!kind) return SHOWCASE_EXAMPLES;
  return SHOWCASE_EXAMPLES.filter((e) => e.kind === kind);
}
