export const WEB_CONSTANT_MODEL_TYPES = [
  "SYSTEM_CONSTANT",
  "OBJECT_CONSTANT",
  "WORLD_CONSTANT",
  "CALCULUS_CONSTANT",
  "SAFETY_CONSTANT",
  "PRIVACY_CONSTANT",
  "RUNTIME_CONSTANT",
  "GOVERNANCE_CONSTANT",
  "FICTION_REALITY_BOUNDARY",
  "DEMO_REAL_BOUNDARY",
  "FOUNDER_PUBLIC_BOUNDARY",
  "LOCAL_FIRST_CONSTANT",
  "NO_VENDOR_LOCK_CONSTANT",
  "NO_UNSAFE_AUTONOMY_CONSTANT",
] as const;
export type WebConstantModelType = typeof WEB_CONSTANT_MODEL_TYPES[number];

export interface CoreConstantSeed {
  constantId: string;
  name: string;
  chineseName: string;
  constantType: WebConstantModelType;
  definition: string;
  invariantRule: string;
  appliesTo: string[];
  forbiddenMisuse: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "ABSOLUTE";
}

export const CORE_CONSTANTS: CoreConstantSeed[] = [
  { constantId: "LOCAL_FIRST", name: "LOCAL_FIRST", chineseName: "本地优先", constantType: "LOCAL_FIRST_CONSTANT",
    definition: "Aetherworld 优先本地运行。", invariantRule: "外部 API 只能作为可选 Provider。",
    appliesTo: ["RUNTIME", "MODEL"], forbiddenMisuse: ["强制云端依赖"], priority: "ABSOLUTE" },
  { constantId: "RULE_LAYER_PRIORITY", name: "RULE_LAYER_PRIORITY", chineseName: "规则层优先", constantType: "SYSTEM_CONSTANT",
    definition: "计算法结构优先，模型只做补全。", invariantRule: "模型输出受规则层裁决。",
    appliesTo: ["WEBLLM", "WEBLCM"], forbiddenMisuse: ["让模型决定规则"], priority: "ABSOLUTE" },
  { constantId: "NO_VENDOR_LOCK_IN", name: "NO_VENDOR_LOCK_IN", chineseName: "防卡脖子", constantType: "NO_VENDOR_LOCK_CONSTANT",
    definition: "任何能力不得被单一外部供应商卡死。", invariantRule: "必须保留可替换路径。",
    appliesTo: ["MODEL", "RUNTIME"], forbiddenMisuse: ["独家依赖单一供应商"], priority: "HIGH" },
  { constantId: "FULL60_PRIVACY", name: "FULL60_PRIVACY", chineseName: "Full60 隐私", constantType: "PRIVACY_CONSTANT",
    definition: "Full60 原始数列不得公开/传给模型。", invariantRule: "Full60 raw 不出本地。",
    appliesTo: ["KNOWLEDGE", "MODEL"], forbiddenMisuse: ["将 Full60 入公共知识库"], priority: "ABSOLUTE" },
  { constantId: "FOUNDER_ONLY_PROTECTION", name: "FOUNDER_ONLY_PROTECTION", chineseName: "Founder-only 保护", constantType: "PRIVACY_CONSTANT",
    definition: "Founder-only 内容不得泄漏。", invariantRule: "Founder-only 不进公共层。",
    appliesTo: ["KNOWLEDGE"], forbiddenMisuse: ["泄漏 Founder 私密"], priority: "ABSOLUTE" },
  { constantId: "DEMO_REAL_SEPARATION", name: "DEMO_REAL_SEPARATION", chineseName: "Demo/Real 分离", constantType: "DEMO_REAL_BOUNDARY",
    definition: "Demo 与 Real 不得混淆。", invariantRule: "标签强制区分。",
    appliesTo: ["OUTPUT"], forbiddenMisuse: ["把 demo 当 real"], priority: "HIGH" },
  { constantId: "VIRTUAL_NOT_REALITY", name: "VIRTUAL_NOT_REALITY", chineseName: "虚拟不等于现实", constantType: "FICTION_REALITY_BOUNDARY",
    definition: "虚拟世界、常数宇宙、数列推演不得写成现实事实。", invariantRule: "输出加边界标识。",
    appliesTo: ["WORLD", "NARRATIVE"], forbiddenMisuse: ["将虚构现实化"], priority: "ABSOLUTE" },
  { constantId: "NO_FINANCIALIZATION_OF_SEQUENCE_CURRENCY", name: "NO_FINANCIALIZATION_OF_SEQUENCE_CURRENCY", chineseName: "禁止数列货币金融化",
    constantType: "GOVERNANCE_CONSTANT", definition: "数列货币不得金融化。", invariantRule: "无 token 化、无证券化。",
    appliesTo: ["CURRENCY"], forbiddenMisuse: ["发行金融工具"], priority: "ABSOLUTE" },
  { constantId: "SIMULATION_NOT_EXECUTION", name: "SIMULATION_NOT_EXECUTION", chineseName: "模拟不等于执行", constantType: "RUNTIME_CONSTANT",
    definition: "模拟运行不得伪装成真实执行。", invariantRule: "输出注明 simulation。",
    appliesTo: ["CODE_SANDBOX", "APP_RUNTIME"], forbiddenMisuse: ["伪装真实部署"], priority: "HIGH" },
  { constantId: "QA_REQUIRED_FOR_RUNTIME", name: "QA_REQUIRED_FOR_RUNTIME", chineseName: "运行时必须 QA", constantType: "SAFETY_CONSTANT",
    definition: "任何运行时输出必须可 QA。", invariantRule: "QA pipeline 不可绕过。",
    appliesTo: ["ALL_RUNTIME"], forbiddenMisuse: ["跳过 QA"], priority: "ABSOLUTE" },
  { constantId: "NO_DANGEROUS_CODE", name: "NO_DANGEROUS_CODE", chineseName: "禁止危险代码", constantType: "SAFETY_CONSTANT",
    definition: "禁止危险命令/自动删除/自动部署。", invariantRule: "黑名单强制拦截。",
    appliesTo: ["CODE_SANDBOX"], forbiddenMisuse: ["执行 rm -rf"], priority: "ABSOLUTE" },
  { constantId: "WORKSPACE_TRACE_REQUIRED", name: "WORKSPACE_TRACE_REQUIRED", chineseName: "必须 Workspace 留痕", constantType: "GOVERNANCE_CONSTANT",
    definition: "重要输出必须写入 Workspace / Trace。", invariantRule: "记录可审计。",
    appliesTo: ["ALL_RUNTIME"], forbiddenMisuse: ["静默执行"], priority: "HIGH" },
  { constantId: "NO_UNSAFE_AUTONOMY", name: "NO_UNSAFE_AUTONOMY", chineseName: "禁止不安全自主", constantType: "NO_UNSAFE_AUTONOMY_CONSTANT",
    definition: "禁止未确认的自主危险动作。", invariantRule: "高风险动作需人类确认。",
    appliesTo: ["AGENT", "RUNTIME"], forbiddenMisuse: ["未授权自动部署"], priority: "ABSOLUTE" },
  { constantId: "HUMAN_CONFIRMATION_REQUIRED", name: "HUMAN_CONFIRMATION_REQUIRED", chineseName: "需人工确认",
    constantType: "GOVERNANCE_CONSTANT", definition: "执行类高风险动作需人工确认。", invariantRule: "确认前不得执行。",
    appliesTo: ["RUNTIME"], forbiddenMisuse: ["越权执行"], priority: "HIGH" },
];
