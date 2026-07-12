import type { VersionAuditResult } from "@/lib/version-leap/versionAuditEngine";

const SEV_COLOR: Record<string, string> = {
  LOW: "text-muted-foreground", MEDIUM: "text-amber-600",
  HIGH: "text-orange-600", CRITICAL: "text-rose-600",
};

export function VersionAuditPanel({ audit }: { audit: VersionAuditResult }) {
  return (
    <div className="border border-border/40 rounded-md p-4 bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">版本审计</span>
        <span className={`text-sm font-semibold ${audit.status === "PASS" ? "text-emerald-600" : audit.status === "WARN" ? "text-amber-600" : "text-rose-600"}`}>
          {audit.status}
        </span>
      </div>
      {audit.issues.length === 0 ? (
        <p className="text-xs text-muted-foreground">无版本治理问题。</p>
      ) : (
        <ul className="text-xs space-y-1">
          {audit.issues.map((i) => (
            <li key={i.id} className="flex items-start gap-2">
              <span className={`px-1.5 rounded text-[10px] bg-muted ${SEV_COLOR[i.severity]}`}>{i.severity}</span>
              <span>{i.label} — <span className="text-muted-foreground">{i.hint}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
