import type { SocialQaStatus } from "./socialTypes";

export function qaBadgeLabel(status: SocialQaStatus): string {
  switch (status) {
    case "PASS": return "QA 通过";
    case "WARN": return "QA 警告";
    case "FAIL": return "QA 不通过";
    case "BLOCKED": return "已阻断";
    default: return "未检查";
  }
}

export function qaBadgeTone(status: SocialQaStatus): string {
  switch (status) {
    case "PASS": return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    case "WARN": return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    case "FAIL":
    case "BLOCKED": return "text-rose-500 border-rose-500/30 bg-rose-500/10";
    default: return "text-muted-foreground border-border bg-muted/30";
  }
}
