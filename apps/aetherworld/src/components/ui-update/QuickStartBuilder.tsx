import { useMemo, useState } from "react";
import { generateAllQuickStarts } from "@/lib/ui-update/quickStartGenerator";
import { UISafetyNote } from "./UISafetyNote";

export function QuickStartBuilder() {
  const [audience, setAudience] = useState<"PUBLIC" | "ADVANCED" | "FOUNDER">("PUBLIC");
  const all = useMemo(() => generateAllQuickStarts(), []);
  const bundle = all[audience];

  function exportJSON() {
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "quick-start-v0.2.json"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        {(["PUBLIC", "ADVANCED", "FOUNDER"] as const).map((a) => (
          <button key={a} onClick={() => setAudience(a)}
            className={`px-2 py-1 rounded border ${audience === a ? "bg-primary/10 border-primary text-primary" : "border-muted"}`}>
            {a === "PUBLIC" ? "普通用户" : a === "ADVANCED" ? "高阶用户" : "Founder"}
          </button>
        ))}
        <span className="ml-auto text-muted-foreground">覆盖率 {bundle.coverage}%</span>
        <button onClick={exportJSON} className="px-2 py-1 rounded border border-muted">导出 JSON</button>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        {bundle.items.map((it) => (
          <div key={it.id} className="border rounded-md p-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">#{it.priority}</span>
              <h3 className="font-medium text-sm">{it.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{it.description}</p>
            <div className="text-[11px] mt-2 text-muted-foreground">
              路由：<code>{it.targetRoute}</code> · 示例：<code>{it.exampleInput}</code>
            </div>
            {it.safetyNote && <p className="text-[11px] text-amber-600 mt-1">{it.safetyNote}</p>}
          </div>
        ))}
      </div>

      {bundle.missingModules.length > 0 && (
        <div className="border border-amber-400/50 rounded-md p-2 text-xs">
          <strong className="text-amber-700">未覆盖的核心模块：</strong>{" "}
          {bundle.missingModules.join("、")}
        </div>
      )}

      <UISafetyNote />
    </div>
  );
}
