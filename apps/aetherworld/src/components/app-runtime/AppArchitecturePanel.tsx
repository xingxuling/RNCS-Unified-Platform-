import type { AppArchitectureObject } from "@/lib/app-runtime/appProjectObjectEngine";

export function AppArchitecturePanel({ arch }: { arch: AppArchitectureObject }) {
  return (
    <div className="border border-border/40 rounded p-3 space-y-2 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Architecture · {arch.frameworkTarget}</div>
      <div>
        <div className="text-[11px] text-muted-foreground">Pages</div>
        <ul className="list-disc pl-4 text-sm">{arch.pageMap.map(p => <li key={p.pageId}><code>{p.route}</code> — {p.title}</li>)}</ul>
      </div>
      <div>
        <div className="text-[11px] text-muted-foreground">Components</div>
        <ul className="list-disc pl-4 text-sm">{arch.componentMap.map(c => <li key={c.componentId}><b>{c.name}</b> — {c.responsibility}</li>)}</ul>
      </div>
      <div>
        <div className="text-[11px] text-muted-foreground">State</div>
        <div className="text-[11px] font-mono">{arch.stateModel.stateFields.join(", ") || "—"}</div>
      </div>
      {arch.risks.length > 0 && (
        <div>
          <div className="text-[11px] text-muted-foreground">Risks</div>
          <ul className="list-disc pl-4 text-[11px]">{arch.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
