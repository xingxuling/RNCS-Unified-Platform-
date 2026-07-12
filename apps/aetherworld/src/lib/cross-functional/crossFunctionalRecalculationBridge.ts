// 接入文本动态更新的占位桥：注册哪些 stale text 模块需要在跨域计算法引入后触发。
export const CROSS_FUNCTIONAL_AFFECTED_TEXT_MODULES = [
  "vocal-engine","narrative-engine","model-generation","translation-engine",
  "prompt-forge","workspace","usage-examples","learning-docs","product-encyclopedia",
  "calculus-universe","vocabulary",
];

export function buildCrossFunctionalTextStaleSignal() {
  return {
    triggerType: "CALCULUS_ADDED" as const,
    affectedModuleIds: ["cross-functional-calculus", ...CROSS_FUNCTIONAL_AFFECTED_TEXT_MODULES],
    reason: "Cross-Functional Application Calculus 引入后，多个引擎说明文本需要刷新跨域调用方式",
  };
}

// 接入 Recalculation：标记需要重算的范围。
export const CROSS_FUNCTIONAL_RECALC_SCOPES = ["ENGINE", "WORKFLOW", "TEXT", "UI", "DOCS"];

export function buildCrossFunctionalRecalcRequest(reason: string) {
  return {
    scopes: CROSS_FUNCTIONAL_RECALC_SCOPES,
    reason,
    createdAt: new Date().toISOString(),
  };
}
