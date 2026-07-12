import type { RetrievedKnowledge } from "../weblkm/webLkmKnowledgeRetriever";
import type { WebCmRoute, WebCoMConstraintBundle } from "../webKnowledgeTrinityTypes";
export interface WebLcmInputFromKnowledgeTrinity {
  knowledgeSummaries: string[];
  calculusRouteSummary: string;
  constantConstraints: string[];
  userIntent: string;
  outputGoal: string;
}
export function buildWebLcmInput(opts: {
  retrieved: RetrievedKnowledge[];
  route: WebCmRoute;
  bundle: WebCoMConstraintBundle;
  userIntent: string;
  outputGoal?: string;
}): WebLcmInputFromKnowledgeTrinity {
  return {
    knowledgeSummaries: opts.retrieved.slice(0, 5).map((r) => `${r.item.title}: ${r.item.contentSummary}`),
    calculusRouteSummary: `${opts.route.selectedCalculusIds.join(" → ")} | ${opts.route.routeReason}`,
    constantConstraints: opts.bundle.appliedConstantIds,
    userIntent: opts.userIntent,
    outputGoal: opts.outputGoal ?? "concept-chain",
  };
}
