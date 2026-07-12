import { useMemo, useState } from "react";
import { TEXT_REGISTRY } from "@/lib/text-dynamic/textRegistry";
import { TEXT_AUDIENCE_LABELS, TEXT_AUDIENCE_MODES, type TextAudienceMode } from "@/constants/text-dynamic/textAudienceModes";
import { TEXT_TYPE_LABELS } from "@/constants/text-dynamic/textTypes";

export function TextRegistryTable() {
  const [audience, setAudience] = useState<TextAudienceMode | "ALL">("ALL");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return TEXT_REGISTRY.filter((x) => audience === "ALL" || x.audienceMode === audience)
      .filter((x) => !q || x.textId.includes(q) || x.currentText.includes(q) || x.moduleId.includes(q));
  }, [audience, q]);

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-lg">文本注册表 · Text Registry</h2>
        <div className="flex items-center gap-2 text-xs">
          <select value={audience} onChange={(e) => setAudience(e.target.value as TextAudienceMode | "ALL")}
            className="bg-background border border-border rounded px-2 py-1">
            <option value="ALL">全部受众</option>
            {TEXT_AUDIENCE_MODES.map((a) => <option key={a} value={a}>{TEXT_AUDIENCE_LABELS[a]}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索 textId / 模块 / 文本…"
            className="bg-background border border-border rounded px-2 py-1 w-56" />
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="text-left border-b border-border">
              <th className="py-2 pr-3">textId</th>
              <th className="py-2 pr-3">类型</th>
              <th className="py-2 pr-3">scope</th>
              <th className="py-2 pr-3">受众</th>
              <th className="py-2 pr-3">优先级</th>
              <th className="py-2 pr-3">stale</th>
              <th className="py-2">currentText</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.textId} className="border-b border-border/40 align-top">
                <td className="py-2 pr-3 font-mono">{r.textId}</td>
                <td className="py-2 pr-3">{TEXT_TYPE_LABELS[r.textType]}</td>
                <td className="py-2 pr-3">{r.scope}</td>
                <td className="py-2 pr-3">{TEXT_AUDIENCE_LABELS[r.audienceMode]}</td>
                <td className="py-2 pr-3">{r.priority}</td>
                <td className="py-2 pr-3">{r.stale ? <span className="text-amber-500">stale</span> : "—"}</td>
                <td className="py-2 max-w-md">{r.currentText}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">没有匹配的文本条目。</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground">共 {rows.length} 条 · Total {TEXT_REGISTRY.length}</div>
    </section>
  );
}
