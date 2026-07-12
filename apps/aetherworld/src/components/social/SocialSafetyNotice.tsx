import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { SocialSafetyReport } from "@/lib/social/socialTypes";

export function SocialSafetyNotice({ report }: { report: SocialSafetyReport }) {
  if (!report.risks.length) {
    return (
      <div className="text-xs text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 rounded-md px-3 py-2">
        安全检查通过，可以发布。
      </div>
    );
  }
  const blocked = report.risks.some((r) => r.severity === "BLOCK");
  const Icon = blocked ? ShieldAlert : AlertTriangle;
  const tone = blocked
    ? "text-rose-500 border-rose-500/30 bg-rose-500/10"
    : "text-amber-500 border-amber-500/30 bg-amber-500/10";
  return (
    <div className={`text-xs border rounded-md px-3 py-2 space-y-1 ${tone}`}>
      <div className="flex items-center gap-2 font-medium">
        <Icon className="w-3.5 h-3.5" />
        {blocked ? "发现高风险内容，禁止公开发布" : "发现潜在风险，建议修改后发布"}
      </div>
      <ul className="list-disc pl-5 space-y-0.5">
        {report.risks.map((r) => (
          <li key={r.id}>{r.message}</li>
        ))}
      </ul>
    </div>
  );
}
