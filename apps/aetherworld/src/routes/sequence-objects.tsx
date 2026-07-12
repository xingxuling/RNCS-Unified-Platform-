import { createFileRoute } from "@tanstack/react-router";
import { listWorkspaceObjects } from "@/lib/sequence-object/sequenceObjectWorkspaceBridge";

export const Route = createFileRoute("/sequence-objects")({
  head: () => ({ meta: [{ title: "数列对象 · Sequence Objects" }] }),
  component: Page,
});

function Page() {
  const items = listWorkspaceObjects();
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">数列对象 · Sequence Objects</h1>
      <p className="text-sm text-muted-foreground">Workspace 中保存的对象索引。</p>
      {items.length === 0 ? (
        <div className="rounded-md border border-border bg-card/40 p-4 text-sm text-muted-foreground">尚无保存的对象。前往「对象编译器」生成并保存。</div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <a key={r.recordId} href={`/sequence-object-entry?id=${r.objectId}`} className="block rounded-md border border-border bg-card/40 p-3 hover:bg-muted/40">
              <div className="text-sm font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.objectType} · {r.lifecyclePhase} · {r.privacyLevel}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
