import { useMemo, useState } from "react";
import { runUIAudit } from "@/lib/ui-update/uiAuditEngine";
import { UISafetyNote } from "./UISafetyNote";
import { toast } from "sonner";

const SEV: Record<string, string> = {
  LOW: "text-emerald-600", MEDIUM: "text-amber-600", HIGH: "text-orange-600", CRITICAL: "text-red-600",
};

type Sev = "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Cat = "ALL" | "QUICK_START" | "USAGE_EXAMPLE" | "EMPTY_STATE" | "SAFETY_NOTE" | "ROUTE" | "PERMISSION" | "SUBJECT_BADGE";
type Aud = "PUBLIC" | "ADVANCED" | "FOUNDER";

export function UIAuditPanel() {
  const [audience, setAudience] = useState<Aud>("ADVANCED");
  const [sev, setSev] = useState<Sev>("ALL");
  const [cat, setCat] = useState<Cat>("ALL");
  const audit = useMemo(() => runUIAudit({ audience }), [audience]);

  const filtered = audit.issues.filter((i) =>
    (sev === "ALL" || i.severity === sev) && (cat === "ALL" || i.category === cat));

  const summary = useMemo(() => {
    const byAud: Record<string, number> = { PUBLIC: 0, ADVANCED: 0, FOUNDER: 0 };
    audit.issues.forEach((i) => {
      const reason = i.reason || "";
      if (reason.includes("PUBLIC")) byAud.PUBLIC++;
      else if (reason.includes("ADVANCED")) byAud.ADVANCED++;
      else if (reason.includes("FOUNDER")) byAud.FOUNDER++;
    });
    const top5 = audit.patchPrompts.slice(0, 5);
    return { byAud, top5 };
  }, [audit]);

  function exportJSON() {
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ui-audit.json"; a.click();
    URL.revokeObjectURL(url);
  }

  async function copyFixPrompt(prompt: string) {
    await navigator.clipboard.writeText(prompt);
    toast.success("修复提示词已复制");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className="font-semibold">状态：</span>
        <span className={SEV[audit.status === "FAIL" ? "CRITICAL" : audit.status === "WARN" ? "HIGH" : "LOW"]}>{audit.status}</span>
        <span className="text-muted-foreground">· 问题数 {audit.issues.length}</span>
        <button onClick={exportJSON} className="ml-auto px-2 py-1 rounded border border-muted text-xs">导出 JSON</button>
      </div>

      <div className="grid md:grid-cols-3 gap-2 text-xs">
        <div className="border rounded p-2">
          <div className="text-muted-foreground mb-1">缺失分布</div>
          <div>PUBLIC：{summary.byAud.PUBLIC}　ADVANCED：{summary.byAud.ADVANCED}　FOUNDER：{summary.byAud.FOUNDER}</div>
        </div>
        <div className="border rounded p-2 md:col-span-2">
          <div className="text-muted-foreground mb-1">Top 5 推荐修复</div>
          <ol className="list-decimal pl-4 space-y-0.5">
            {summary.top5.map((p) => <li key={p.id}>{p.title}</li>)}
            {summary.top5.length === 0 && <li className="list-none text-muted-foreground">无</li>}
          </ol>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="text-muted-foreground self-center">视角：</span>
        {(["PUBLIC","ADVANCED","FOUNDER"] as Aud[]).map((a) => (
          <button key={a} onClick={() => setAudience(a)}
            className={`px-2 py-0.5 rounded border ${audience===a?"bg-primary/10 border-primary text-primary":"border-muted"}`}>{a}</button>
        ))}
        <span className="text-muted-foreground self-center ml-2">严重度：</span>
        {(["ALL","CRITICAL","HIGH","MEDIUM","LOW"] as Sev[]).map((s) => (
          <button key={s} onClick={() => setSev(s)}
            className={`px-2 py-0.5 rounded border ${sev===s?"bg-primary/10 border-primary text-primary":"border-muted"}`}>{s}</button>
        ))}
        <span className="text-muted-foreground self-center ml-2">类别：</span>
        {(["ALL","QUICK_START","USAGE_EXAMPLE","EMPTY_STATE","SAFETY_NOTE","ROUTE","PERMISSION"] as Cat[]).map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-2 py-0.5 rounded border ${cat===c?"bg-primary/10 border-primary text-primary":"border-muted"}`}>{c}</button>
        ))}
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">严重</th>
              <th className="p-2">类别</th>
              <th className="p-2">模块</th>
              <th className="p-2">原因</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i, idx) => (
              <tr key={idx} className="border-t">
                <td className={`p-2 font-semibold ${SEV[i.severity]}`}>{i.severity}</td>
                <td className="p-2 font-mono">{i.category}</td>
                <td className="p-2">{i.moduleId}</td>
                <td className="p-2 text-muted-foreground">{i.reason}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">该过滤条件下无问题</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">查看 {audit.patchPrompts.length} 条修复提示词</summary>
        <div className="mt-2 space-y-2">
          {audit.patchPrompts.map((p) => (
            <div key={p.id} className="border rounded p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{p.title}</div>
                <button onClick={() => copyFixPrompt(p.prompt)}
                  className="px-2 py-0.5 rounded border border-muted text-[11px]">复制提示词</button>
              </div>
              <pre className="whitespace-pre-wrap text-muted-foreground mt-1">{p.prompt}</pre>
            </div>
          ))}
        </div>
      </details>

      <UISafetyNote />
    </div>
  );
}
