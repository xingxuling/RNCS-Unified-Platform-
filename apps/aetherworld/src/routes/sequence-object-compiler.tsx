import { createFileRoute } from "@tanstack/react-router";
import { SequenceObjectPanel } from "@/components/sequence-object/SequenceObjectPanel";

export const Route = createFileRoute("/sequence-object-compiler")({
  head: () => ({ meta: [{ title: "对象编译器 · Sequence Object Compiler" }] }),
  component: () => (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">对象编译器 · Sequence Object Compiler</h1>
      <p className="text-sm text-muted-foreground">输入文本或母体数列，编译为可识别、可治理的对象。</p>
      <SequenceObjectPanel />
    </div>
  ),
});
