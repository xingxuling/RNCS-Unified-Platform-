import { createFileRoute } from "@tanstack/react-router";
import { listWorkspaceObjects } from "@/lib/sequence-object/sequenceObjectWorkspaceBridge";

export const Route = createFileRoute("/sequence-object-entry")({
  head: () => ({ meta: [{ title: "对象详情 · Sequence Object Entry" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) ?? "" }),
  component: Page,
});

function Page() {
  const { id } = Route.useSearch();
  const rec = listWorkspaceObjects().find((r) => r.objectId === id);
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">对象详情 · Sequence Object Entry</h1>
      {!rec ? (
        <div className="rounded-md border border-border bg-card/40 p-4 text-sm text-muted-foreground">未找到对象（id: {id || "—"}）。</div>
      ) : (
        <div className="rounded-md border border-border bg-card/40 p-4 text-sm space-y-1">
          <div className="font-medium">{rec.title}</div>
          <div className="text-xs text-muted-foreground">{rec.objectType}</div>
          <div className="text-xs">来源：{rec.source}</div>
          <div className="text-xs">生命周期：{rec.lifecyclePhase}</div>
          <div className="text-xs">权限：{rec.privacyLevel}</div>
          <div className="text-xs">可复用引擎：{rec.reusableInEngines.join(", ")}</div>
          <div className="text-xs text-muted-foreground mt-2">{rec.summary}</div>
        </div>
      )}
    </div>
  );
}
