export type EncyclopediaStatus =
  | "ACTIVE" | "BETA" | "EXPERIMENTAL" | "PLACEHOLDER" | "LOCKED" | "DEPRECATED";

export const STATUS_LABELS: Record<EncyclopediaStatus, string> = {
  ACTIVE: "已启用",
  BETA: "内测可用",
  EXPERIMENTAL: "实验态",
  PLACEHOLDER: "占位",
  LOCKED: "锁定",
  DEPRECATED: "弃用",
};

export const STATUS_COLORS: Record<EncyclopediaStatus, string> = {
  ACTIVE: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  BETA: "text-sky-400 border-sky-500/40 bg-sky-500/10",
  EXPERIMENTAL: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  PLACEHOLDER: "text-zinc-400 border-zinc-500/40 bg-zinc-500/10",
  LOCKED: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  DEPRECATED: "text-red-400 border-red-500/40 bg-red-500/10",
};
