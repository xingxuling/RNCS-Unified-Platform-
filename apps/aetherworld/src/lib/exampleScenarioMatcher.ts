import { EXAMPLE_SCENARIO_TYPES } from "@/constants/exampleScenarioTypes";
import { USAGE_EXAMPLES, type UsageExample } from "./usageExampleCalculus";

export function matchScenariosByInput(text: string): typeof EXAMPLE_SCENARIO_TYPES {
  const t = text.toLowerCase();
  const keywords: Record<string, string[]> = {
    SHOULD_I_ACT: ["该不该", "要不要", "犹豫", "机会"],
    PRODUCT_UNCLEAR: ["看不懂", "复杂", "上手", "不会用"],
    CONTENT_SPREAD: ["小红书", "传播", "热度", "标题"],
    RELATIONSHIP_SIGNAL: ["关系", "对方", "暧昧", "感情"],
    VIRTUAL_LIFE_DAY: ["今天", "虚拟生活", "一天"],
    CREATION_SIMULATION: ["产品", "做一个", "可行性", "原型"],
    BUG_OR_FEEDBACK: ["bug", "扫描", "问题", "反馈"],
    FOUNDER_CONTROL: ["创始人", "权限", "founder"],
  };
  const hits = EXAMPLE_SCENARIO_TYPES.filter((s) => (keywords[s.id] ?? []).some((k) => t.includes(k)));
  return hits.length > 0 ? hits : EXAMPLE_SCENARIO_TYPES.slice(0, 3);
}

export function recommendExamples(text: string, limit = 5): UsageExample[] {
  const scenarios = matchScenariosByInput(text).map((s) => s.id);
  return USAGE_EXAMPLES.filter((e) => scenarios.includes(e.scenarioType)).slice(0, limit);
}
