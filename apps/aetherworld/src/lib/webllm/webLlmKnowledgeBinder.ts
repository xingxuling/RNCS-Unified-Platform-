import { WEB_LLM_FORBIDDEN_KEYS } from "@/constants/webllm/webLlmSafetyRules";

export interface KnowledgeSummary {
  calculusUniverse: string;
  constantUniverse: string;
  worldEngine: string;
  vocabulary: string;
  productEncyclopedia: string;
  workspaceProject?: string;
  qaRules: string[];
  constitutionRules: string[];
}

export function buildKnowledgeSummary(opts?: Partial<KnowledgeSummary>): KnowledgeSummary {
  const base: KnowledgeSummary = {
    calculusUniverse: "Aetherworld 计算法宇宙：MSL、Sequence Object、Cross-Functional、Missing-Layer、Digital Role、App Runtime、Code Sandbox、Agent Binding。",
    constantUniverse: "数列常数、引擎常数、宪法常数。",
    worldEngine: "世界引擎摘要（主体世界、生命体、社会、规则）。",
    vocabulary: "词汇百科：术语 / 翻译 / 类别 / 关系。",
    productEncyclopedia: "产品百科：模块说明、入口、用法示例。",
    qaRules: ["禁止伪造来源", "禁止声称模拟为真实", "草案必须标记"],
    constitutionRules: ["不公开 Full60 原始数列", "不混淆 Demo/Real", "不让虚拟世界现实化"],
    ...opts,
  };
  return scrub(base);
}

function scrub<T>(obj: T): T {
  const s = JSON.stringify(obj);
  for (const k of WEB_LLM_FORBIDDEN_KEYS) {
    if (s.includes(k)) return JSON.parse(s.replaceAll(k, "[REDACTED]")) as T;
  }
  return obj;
}
