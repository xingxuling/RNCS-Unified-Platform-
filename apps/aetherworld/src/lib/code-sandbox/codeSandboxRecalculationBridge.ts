export interface CodeSandboxRecalcTriggers {
  triggers: string[];
  affectedModules: string[];
}

export function buildRecalcTriggers(): CodeSandboxRecalcTriggers {
  return {
    triggers: [
      "Recalculate Code Run Requests",
      "Recalculate Code Run Results",
      "Recalculate Code Run Logs",
      "Recalculate Error Summaries",
      "Recalculate Repair Suggestions",
      "Recalculate Patch Drafts",
      "Recalculate Code Sandbox QA",
      "Recalculate App Project Runtime Status",
      "Recalculate Workspace Code Run Records",
    ],
    affectedModules: [
      "app-runtime", "app-projects", "code-generation", "workspace",
      "digital-roles", "software-qa", "version-leap", "learning-docs",
      "usage-examples", "sequence-terminal", "product-encyclopedia",
      "vocabulary", "calculus-universe", "text-dynamic-update",
    ],
  };
}
