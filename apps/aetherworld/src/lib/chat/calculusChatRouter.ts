// 计算法 Chat 路由：根据输入命中一条或多条计算法。
// 与 chatPromptModeRouter 并存：PromptMode 仍可用，但 Chat 主链路优先走 calculus route。
import type { CalculusId, CalculusRoute } from "./calculusRouteResultTypes";
import { CALCULUS_REGISTRY } from "./calculusRouteRegistry";

const CHAIN_RULES: { match: RegExp; chain: CalculusId[]; reason: string }[] = [
  {
    match: /(世界|蓝天机).{0,12}(主题曲|歌|配乐)/,
    chain: ["WORLD_ENGINE_CALCULUS", "NARRATIVE_CALCULUS", "VOCAL_ENGINE_CALCULUS"],
    reason: "命中「世界 → 叙事 → 声乐」跨域链。",
  },
  {
    match: /(网页应用|web\s*app|番茄钟|做.{0,6}应用).{0,30}(代码|检查|静态)/i,
    chain: ["APP_RUNTIME_CALCULUS", "CODE_SANDBOX_CALCULUS"],
    reason: "命中「应用 → 代码沙箱」链。",
  },
  {
    match: /(发布|发到社交).*?(作品|草稿|计划|世界|歌)/,
    chain: ["SOCIAL_PUBLISH_CALCULUS", "GOVERNANCE_CALCULUS"],
    reason: "命中「社交发布 → 风险检查」链。",
  },
];

function newRouteId(): string {
  return `cr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function routeCalculus(rawInput: string): CalculusRoute {
  const text = rawInput.trim();

  for (const rule of CHAIN_RULES) {
    if (rule.match.test(text)) {
      const primary = rule.chain[0];
      return {
        routeId: newRouteId(),
        userIntent: text,
        calculusIds: rule.chain,
        primaryCalculusId: primary,
        routeReason: rule.reason,
        nextActions: CALCULUS_REGISTRY[primary].nextActions,
        createdAt: new Date().toISOString(),
      };
    }
  }

  // 单计算法匹配（取第一个命中的）
  const order: CalculusId[] = [
    "SEQUENCE_PREDICTION_CALCULUS",
    "GOVERNANCE_CALCULUS",
    "CODE_SANDBOX_CALCULUS",
    "APP_RUNTIME_CALCULUS",
    "VOCAL_ENGINE_CALCULUS",
    "WORLD_ENGINE_CALCULUS",
    "NARRATIVE_CALCULUS",
    "SEQUENCE_TASK_CALCULUS",
    "CALENDAR_TRIGGER_CALCULUS",
    "SOCIAL_PUBLISH_CALCULUS",
    "STORE_CAPABILITY_CALCULUS",
  ];
  for (const id of order) {
    if (CALCULUS_REGISTRY[id].keywords.test(text)) {
      return {
        routeId: newRouteId(),
        userIntent: text,
        calculusIds: [id],
        primaryCalculusId: id,
        routeReason: `命中「${CALCULUS_REGISTRY[id].domain}」关键词。`,
        nextActions: CALCULUS_REGISTRY[id].nextActions,
        createdAt: new Date().toISOString(),
      };
    }
  }

  // 无命中：返回空计算法链（外层走 LIGHT_ANSWER PromptMode）
  return {
    routeId: newRouteId(),
    userIntent: text,
    calculusIds: [],
    primaryCalculusId: "GOVERNANCE_CALCULUS", // 占位
    routeReason: "未命中具体计算法，走轻量问答。",
    nextActions: [],
    createdAt: new Date().toISOString(),
  };
}
