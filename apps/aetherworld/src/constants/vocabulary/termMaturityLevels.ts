export const TERM_MATURITY_LEVELS = [
  { id: "DRAFT",          label: "草稿" },
  { id: "ACTIVE",         label: "已启用" },
  { id: "EXPERIMENTAL",   label: "实验中" },
  { id: "FOUNDER_LOCKED", label: "Founder 锁定" },
  { id: "DEPRECATED",     label: "已弃用" },
] as const;
export type TermMaturityId = (typeof TERM_MATURITY_LEVELS)[number]["id"];
