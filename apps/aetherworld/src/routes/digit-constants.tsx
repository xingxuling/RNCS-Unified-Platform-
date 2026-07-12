import { createFileRoute } from "@tanstack/react-router";
import { DigitConstantsTable } from "@/components/constants-universe/DigitConstantsTable";
import { ConstantSafetyNote } from "@/components/constants-universe/ConstantSafetyNote";

export const Route = createFileRoute("/digit-constants")({
  head: () => ({ meta: [{ title: "数字常数 · Digit Constants v0.2" }, { name: "description", content: "0–9 数字含义的唯一来源，所有引擎共享。" }] }),
  component: () => (
    <div className="container mx-auto px-4 py-6 space-y-4 max-w-7xl">
      <header>
        <h1 className="text-2xl font-semibold">数字常数 · Digit Constants</h1>
        <p className="text-sm text-muted-foreground">MSL / Sequence AI / World Engine / Narrative / Vocal / Currency / Compression 共用。</p>
      </header>
      <ConstantSafetyNote />
      <DigitConstantsTable />
    </div>
  ),
});
