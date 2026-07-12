import { createFileRoute } from "@tanstack/react-router";
import { GlossaryPanel } from "@/components/learning/GlossaryPanel";
import { DocsSafetyNote } from "@/components/learning/DocsSafetyNote";

export const Route = createFileRoute("/glossary")({
  head: () => ({ meta: [{ title: "术语表 · Glossary" }, { name: "description", content: "Aetherworld 术语表。" }] }),
  component: GlossaryPage,
});

function GlossaryPage() {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <header><h1 className="text-2xl font-semibold">术语表 · Glossary</h1></header>
      <GlossaryPanel />
      <DocsSafetyNote />
    </div>
  );
}
