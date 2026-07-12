import { createFileRoute } from "@tanstack/react-router";
import { listSequenceObjectExamples } from "@/lib/sequence-object/sequenceObjectExamplesRegistry";
import { SEQUENCE_OBJECT_TYPE_LABELS } from "@/constants/sequence-object/sequenceObjectTypes";
import { SEQUENCE_OBJECT_LAYER_LABELS } from "@/constants/sequence-object/sequenceObjectLayers";

export const Route = createFileRoute("/sequence-object-examples")({
  head: () => ({ meta: [{ title: "对象示例 · Sequence Object Examples" }] }),
  component: Page,
});

function Page() {
  const examples = listSequenceObjectExamples();
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">对象示例 · Sequence Object Examples</h1>
      <p className="text-sm text-muted-foreground">15 个预置示例：从母体数列到角色、世界、声乐、剧情、模型、系统、引擎、工作流、语言与文明对象。</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {examples.map((e) => (
          <div key={e.exampleId} className="rounded-md border border-border bg-card/40 p-3 text-sm">
            <div className="font-medium">{e.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{e.description}</div>
            <div className="mt-2 text-xs">数列：[{e.sourceSequence.join(",")}]</div>
            <div className="text-xs">类型：{SEQUENCE_OBJECT_TYPE_LABELS[e.targetObjectType]}（{e.targetObjectType}）</div>
            <div className="text-xs">层级：{SEQUENCE_OBJECT_LAYER_LABELS[e.targetLayer]}</div>
            <div className="text-xs text-muted-foreground">可复用：{e.reusedIn.join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
