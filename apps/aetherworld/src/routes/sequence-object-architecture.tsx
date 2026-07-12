import { createFileRoute } from "@tanstack/react-router";
import { SequenceObjectPanel } from "@/components/sequence-object/SequenceObjectPanel";

export const Route = createFileRoute("/sequence-object-architecture")({
  head: () => ({ meta: [{ title: "数列对象架构 · Sequence Object Architecture" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Sequence Object Architecture Engine</h1>
        <p className="text-sm text-muted-foreground">数列对象架构引擎 — 把母体数列、MSL、用户输入和引擎输出编译成可识别、可保存、可调用、可复用、可治理的系统对象。</p>
      </div>
      <SequenceObjectPanel />
    </div>
  );
}
