// 顶部角色徽章。
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { ROLE_BADGES_ZH } from "@/lib/auth/authTypes";

export function RoleBadge({ className = "" }: { className?: string }) {
  const u = useCurrentUser();
  if (u.loading) return null;
  const tone =
    u.role === "FOUNDER"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : u.role === "ADMIN"
      ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
      : u.role === "PRO_USER"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : u.role === "USER"
      ? "bg-muted text-foreground/80 border-border"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${tone} ${className}`}>
      {ROLE_BADGES_ZH[u.role]}
    </span>
  );
}
