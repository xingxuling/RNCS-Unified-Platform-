import { createFileRoute } from "@tanstack/react-router";
import { VIOLATION_TYPES } from "@/constants/constitution/constitutionalViolationTypes";

export const Route = createFileRoute("/constitution-violations")({
  head: () => ({
    meta: [
      { title: "宪法违规类型 · Constitutional Violations · Aetherworld" },
      { name: "description", content: "宪法违规类型登记：虚实混淆、货币金融化、Demo/Real 互写、Founder 锁绕过等。" },
      { property: "og:title", content: "Constitutional Violations · Aetherworld" },
      { property: "og:description", content: "违规分类 · 严重程度 · 强制阻断策略" },
    ],
  }),
  component: ViolationsPage,
});

const SEV_COLOR: Record<string, string> = {
  LOW: "text-emerald-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-orange-600",
  CRITICAL: "text-red-600",
};

function ViolationsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">宪法违规类型 · Constitutional Violations</h1>
        <p className="text-sm text-muted-foreground">
          宪法违规登记：CRITICAL 级别强制阻断输出，HIGH 级别降级并要求修复。
        </p>
      </header>
      <div className="space-y-2">
        {VIOLATION_TYPES.map((v) => (
          <div key={v.violationType} className="border rounded-md p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm">{v.violationType}</span>
              <span className={`text-xs font-semibold ${SEV_COLOR[v.defaultSeverity] ?? ""}`}>{v.defaultSeverity}</span>
              {v.blockRequired && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/15 text-red-600">必须阻断</span>
              )}
            </div>
            <p className="text-sm mt-1">{v.chineseName}</p>
            {v.relatedArticles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">相关条款：{v.relatedArticles.join(", ")}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
