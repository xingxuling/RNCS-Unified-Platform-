import type { AppHandoffPack } from "@/lib/app-runtime/appProjectObjectEngine";
import { APP_HANDOFF_LABELS } from "@/constants/app-runtime/appHandoffTargets";

export function AppHandoffPackPanel({ packs }: { packs: AppHandoffPack[] }) {
  const copy = (text: string) => navigator.clipboard?.writeText(text);
  return (
    <div className="border border-border/40 rounded p-3 space-y-2 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Handoff Packs · 外部开发工具交接</div>
      {packs.length === 0 && <div className="text-[12px] text-muted-foreground">尚未生成 Handoff Pack。</div>}
      <ul className="space-y-2">
        {packs.map(p => (
          <li key={p.packId} className="border border-border/30 rounded p-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-sm font-medium">{APP_HANDOFF_LABELS[p.targetTool]}</span>
              <button onClick={() => copy(p.prompt)} className="text-[11px] px-2 py-0.5 border border-border/40 rounded hover:bg-muted/40">复制 Prompt</button>
            </div>
            <pre className="text-[11px] font-mono whitespace-pre-wrap text-muted-foreground max-h-40 overflow-auto">{p.prompt}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
