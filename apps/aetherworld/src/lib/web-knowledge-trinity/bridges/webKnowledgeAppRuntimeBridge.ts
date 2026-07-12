// App Runtime bridge — used when App Runtime wants Trinity-assisted generation
export interface AppRuntimeTrinityHint {
  similarKnowledgeIds: string[];
  recommendedCalculusIds: string[];
  injectedConstantIds: string[];
}
export function buildAppRuntimeHint(opts: {
  knowledgeIds: string[]; calculusIds: string[]; constantIds: string[];
}): AppRuntimeTrinityHint {
  return {
    similarKnowledgeIds: opts.knowledgeIds,
    recommendedCalculusIds: opts.calculusIds,
    injectedConstantIds: opts.constantIds,
  };
}
