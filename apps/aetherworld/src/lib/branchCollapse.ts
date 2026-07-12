// 多域分支塌缩引擎
import { COLLAPSE_LAYERS, type CollapseLayerKey, type BranchState } from "@/constants/collapseFactors";
import { clamp } from "./math";

export type LayerScores = Record<CollapseLayerKey, number>; // 0-100

export interface Branch {
  id: string;
  name: string;
  scores: LayerScores;
  blockers: string[];
}

export interface BranchResult extends Branch {
  total: number;
  state: BranchState;
  strongest: CollapseLayerKey;
  weakest: CollapseLayerKey;
  needs: string[];
  actionImpact: string;
  likelyEvent: string;
}

const LAYER_WEIGHT: LayerScores = {
  cosmic: 0.10, geo: 0.12, bio: 0.14,
  physical: 0.14, social: 0.25, mainline: 0.25,
};

export function evaluateBranch(b: Branch): BranchResult {
  let total = 0;
  COLLAPSE_LAYERS.forEach((l) => {
    total += (b.scores[l.key] ?? 0) * LAYER_WEIGHT[l.key];
  });
  total = Math.round(clamp(total, 0, 100));

  const sorted = COLLAPSE_LAYERS.map((l) => ({ k: l.key, v: b.scores[l.key] ?? 0 }))
    .sort((a, x) => x.v - a.v);
  const strongest = sorted[0].k;
  const weakest = sorted[sorted.length - 1].k;

  const state: BranchState =
    total >= 92 ? "MANIFESTED" :
    total >= 75 ? "COLLAPSING" :
    total >= 55 ? "COMPETING" :
    total >= 40 ? "NARROW" :
    total >= 20 ? "OPEN" : "CLOSED";

  const needs = COLLAPSE_LAYERS
    .filter((l) => (b.scores[l.key] ?? 0) < 50)
    .map((l) => l.name);

  const actionImpact =
    state === "COLLAPSING" ? "一次关键行动即可推动显化。" :
    state === "COMPETING" ? "明确取舍可让本分支胜出。" :
    state === "NARROW" ? "需要补足 ≥2 个变量才能塌缩。" :
    state === "OPEN" ? "结构未形成，行动收益低。" :
    state === "MANIFESTED" ? "进入运营阶段，重点是承载而非推进。" :
                              "建议关闭分支，释放注意力。";

  const likelyEvent =
    strongest === "social" ? "通过关键人或合作触发" :
    strongest === "mainline" ? "以主线显化方式落地" :
    strongest === "geo" ? "在特定地点/场域落地" :
    strongest === "bio" ? "由身体/精力周期决定时点" :
    strongest === "physical" ? "受成本/阈值/代价制约" :
                               "由更大周期窗口推动";

  return { ...b, total, state, strongest, weakest, needs, actionImpact, likelyEvent };
}

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: "hk-private-beta",
    name: "香港小范围内测",
    scores: { cosmic: 60, geo: 78, bio: 65, physical: 70, social: 72, mainline: 82 },
    blockers: ["UI 可信度", "术语解释", "示例数据安全"],
  },
  {
    id: "global-online",
    name: "全球线上发布",
    scores: { cosmic: 55, geo: 70, bio: 55, physical: 60, social: 50, mainline: 75 },
    blockers: ["市场教育", "支付/合规", "缺少种子用户"],
  },
  {
    id: "shutdown",
    name: "暂缓 / 闭环内部研究",
    scores: { cosmic: 50, geo: 40, bio: 70, physical: 80, social: 30, mainline: 45 },
    blockers: ["失去外部反馈", "进度感缺失"],
  },
];
