export interface CodeSandboxTrinityHint {
  errorRelatedKnowledgeIds: string[];
  recommendedCalculusIds: string[];
  injectedConstantIds: string[];
}
export function buildCodeSandboxHint(opts: {
  knowledgeIds: string[]; calculusIds: string[]; constantIds: string[];
}): CodeSandboxTrinityHint {
  return {
    errorRelatedKnowledgeIds: opts.knowledgeIds,
    recommendedCalculusIds: opts.calculusIds,
    injectedConstantIds: opts.constantIds,
  };
}
