import { listCalculusItems } from "./webCmCalculusIndexer";
import type { WebCmCalculusItem } from "../webKnowledgeTrinityTypes";

interface Rule { match: RegExp[]; calculusIds: string[]; }
const RULES: Rule[] = [
  { match: [/缺什么|缺层|missing/i], calculusIds: ["MISSING_LAYER_DETECTION_CALCULUS"] },
  { match: [/跃迁|leap/i], calculusIds: ["RECURSIVE_SYSTEM_LEAP_RECOGNITION_CALCULUS"] },
  { match: [/(做|生成|创建).*?(app|网页|工具|应用|网站)|tomato|番茄钟/i], calculusIds: ["APP_RUNTIME_CALCULUS"] },
  { match: [/(运行|修|patch|错误|bug).*?(代码|code)|sandbox/i], calculusIds: ["CODE_SANDBOX_CALCULUS"] },
  { match: [/(歌|声乐|歌词|vocal|suno)/i], calculusIds: ["VOCAL_ENGINE_CALCULUS"] },
  { match: [/(剧情|世界观|角色|narrative)/i], calculusIds: ["NARRATIVE_ENGINE_CALCULUS", "WORLD_ENGINE_CALCULUS"] },
  { match: [/跨功能|cross[- ]?functional/i], calculusIds: ["CROSS_FUNCTIONAL_APPLICATION_CALCULUS"] },
  { match: [/(开源|github|项目).*?(接入|集成|吸收)|assimilat/i], calculusIds: ["OPEN_SOURCE_ARCHITECTURE_ASSIMILATION_CALCULUS"] },
  { match: [/agent|代理.*绑定/i], calculusIds: ["AGENT_KNOWLEDGE_PERSONALITY_BINDING"] },
  { match: [/(概念|压缩|concept).*?(图|graph|链|chain)/i], calculusIds: ["WEBLCM_CONCEPT_CALCULUS"] },
  { match: [/本地.*ai|webllm|本地.*模型/i], calculusIds: ["WEBLLM_CONTROL_CALCULUS"] },
  { match: [/(检查|审计|qa)/i], calculusIds: ["SOFTWARE_QA"] },
  { match: [/版本|version/i], calculusIds: ["VERSION_LEAP"] },
  { match: [/文本|text.*update/i], calculusIds: ["TEXT_DYNAMIC_UPDATE"] },
];

export interface CalculusSelection {
  selected: WebCmCalculusItem[];
  reason: string;
}

export function selectCalculus(userIntent: string): CalculusSelection {
  const ids = new Set<string>();
  const matched: string[] = [];
  RULES.forEach((r) => {
    if (r.match.some((re) => re.test(userIntent))) {
      r.calculusIds.forEach((id) => ids.add(id));
      matched.push(r.match[0].toString());
    }
  });
  if (ids.size === 0) {
    // default fallback: cross-functional + missing-layer for analysis
    ids.add("CROSS_FUNCTIONAL_APPLICATION_CALCULUS");
  }
  const all = listCalculusItems();
  const selected = [...ids].map((id) => all.find((c) => c.calculusId === id)).filter(Boolean) as WebCmCalculusItem[];
  return {
    selected,
    reason: matched.length
      ? `按意图匹配规则：${matched.join(", ")}`
      : "未匹配显式规则，回落到跨功能应用计算法。",
  };
}
