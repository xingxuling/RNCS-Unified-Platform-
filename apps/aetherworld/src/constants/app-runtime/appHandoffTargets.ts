export type AppHandoffTarget = "CODEX" | "CURSOR" | "LOVABLE" | "V0" | "BOLT" | "GITHUB_COPILOT";

export const APP_HANDOFF_TARGETS: AppHandoffTarget[] = [
  "CODEX","CURSOR","LOVABLE","V0","BOLT","GITHUB_COPILOT",
];

export const APP_HANDOFF_LABELS: Record<AppHandoffTarget, string> = {
  CODEX: "OpenAI Codex",
  CURSOR: "Cursor",
  LOVABLE: "Lovable",
  V0: "Vercel v0",
  BOLT: "Bolt",
  GITHUB_COPILOT: "GitHub Copilot",
};
