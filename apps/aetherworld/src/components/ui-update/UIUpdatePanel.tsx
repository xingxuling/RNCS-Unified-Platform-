import { useMemo, useState } from "react";
import { getUIUpdateBundle } from "@/lib/ui-update/uiInterfaceUpdateEngine";
import { UISafetyNote } from "./UISafetyNote";

const SEV: Record<string, string> = {
  LOW: "text-emerald-600", MEDIUM: "text-amber-600", HIGH: "text-orange-600", CRITICAL: "text-red-600",
};

export function UIUpdatePanel() {
  const [audience, setAudience] = useState<"PUBLIC" | "ADVANCED" | "FOUNDER">("ADVANCED");
  const bundle = useMemo(() => getUIUpdateBundle(audience), [audience]);
  const s = bundle.summary;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">视角：</span>
        {(["PUBLIC", "ADVANCED", "FOUNDER"] as const).map((a) => (
          <button key={a} onClick={() => setAudience(a)}
            className={`px-2 py-1 rounded border ${audience === a ? "bg-primary/10 border-primary text-primary" : "border-muted"}`}>
            {a}
          </button>
        ))}
        <span className="ml-auto text-muted-foreground">宪法版本 · v{s.constitutionVersion}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <Metric label="总模块" value={s.totalModules} />
        <Metric label="带路由" value={s.modulesWithRoutes} />
        <Metric label="Quick Start" value={s.modulesInQuickStart} />
        <Metric label="使用示例" value={`${s.modulesWithExamples} (${s.examplePercent}%)`} />
        <Metric label="空状态" value={`${s.modulesWithEmptyState} (${s.emptyStatePercent}%)`} />
        <Metric label="Safety Note" value={s.modulesWithSafetyNotes} />
        <Metric label="过期 UI" value={s.staleUiCount} highlight={s.staleUiCount > 0} />
        <Metric label="CRITICAL" value={s.criticalUiIssues} highlight={s.criticalUiIssues > 0} />
      </div>

      <section>
        <h3 className="text-sm font-semibold mb-2">UI 审计结果 · {bundle.audit.status}</h3>
        <div className="border rounded-md divide-y">
          {bundle.audit.issues.slice(0, 30).map((i, idx) => (
            <div key={idx} className="p-2 text-xs flex items-start gap-2">
              <span className={`font-semibold ${SEV[i.severity]}`}>{i.severity}</span>
              <span className="font-mono text-muted-foreground">{i.category}</span>
              <span className="flex-1">{i.reason}</span>
            </div>
          ))}
          {bundle.audit.issues.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">通过：当前视角无 UI 问题。</div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2">推荐修复提示词（前 5 条）</h3>
        <div className="space-y-2">
          {bundle.audit.patchPrompts.slice(0, 5).map((p) => (
            <div key={p.id} className="border rounded-md p-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${SEV[p.priority]}`}>{p.priority}</span>
                <span className="font-medium">{p.title}</span>
              </div>
              <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">{p.prompt}</pre>
            </div>
          ))}
          {bundle.audit.patchPrompts.length === 0 && (
            <p className="text-xs text-muted-foreground">无需修复。</p>
          )}
        </div>
      </section>

      <UISafetyNote />
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`border rounded-md p-2 ${highlight ? "border-red-400/60" : ""}`}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
