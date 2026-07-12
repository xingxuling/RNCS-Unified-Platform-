import type { CodePatchDraft } from "@/lib/code-sandbox/codeRunRequestEngine";
import { CODE_PATCH_TYPE_LABELS } from "@/constants/code-sandbox/codePatchTypes";

export function CodePatchDraftPanel({ patches }: { patches: CodePatchDraft[] }) {
  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Patch Drafts · 补丁草案</div>
      {patches.length === 0 && <div className="text-[12px] text-muted-foreground">未生成 Patch Draft。</div>}
      {patches.map((p) => (
        <div key={p.patchId} className="border border-border/30 rounded">
          <div className="px-2 py-1 bg-muted/30 flex items-center justify-between text-[11px]">
            <span className="font-mono">{p.affectedFile}</span>
            <span className="text-muted-foreground">{CODE_PATCH_TYPE_LABELS[p.patchType]}</span>
          </div>
          <div className="px-2 py-1 text-[11px] text-muted-foreground">
            before：{p.beforeSummary}<br/>after：{p.afterSummary}
          </div>
          <pre className="px-2 pb-2 text-[10px] font-mono whitespace-pre-wrap text-muted-foreground/80">{p.patchContent}</pre>
          {p.requiresHumanReview && (
            <div className="px-2 pb-2 text-[10px] text-amber-300">⚠️ 需要人工审查后再应用</div>
          )}
        </div>
      ))}
    </div>
  );
}
