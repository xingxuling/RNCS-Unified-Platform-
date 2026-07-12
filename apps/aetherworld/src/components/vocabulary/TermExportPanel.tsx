import { useState } from "react";
import { exportVocabulary, type VocabularyExportTarget } from "@/lib/vocabulary/termExportEngine";

export function TermExportPanel() {
  const [target, setTarget] = useState<VocabularyExportTarget>("glossary");
  const [out, setOut] = useState("");
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
      <h3 className="text-sm font-display">词汇导出</h3>
      <div className="flex gap-2 text-xs">
        <select className="h-8 rounded border border-border/60 bg-card/40 px-2" value={target} onChange={(e)=>setTarget(e.target.value as VocabularyExportTarget)}>
          <option value="glossary">术语表（简）</option>
          <option value="markdown">Markdown</option>
          <option value="json">JSON</option>
        </select>
        <button className="px-3 h-8 rounded bg-primary/20 hover:bg-primary/30 text-xs" onClick={() => setOut(exportVocabulary(target))}>
          生成
        </button>
      </div>
      {out && (
        <pre className="text-[11px] bg-muted/20 rounded p-3 max-h-[360px] overflow-auto whitespace-pre-wrap">{out}</pre>
      )}
    </div>
  );
}
