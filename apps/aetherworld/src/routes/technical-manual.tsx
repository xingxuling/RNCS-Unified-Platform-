import { createFileRoute } from "@tanstack/react-router";
import { TechnicalManualPanel } from "@/components/learning/TechnicalManualPanel";
import { DocsSafetyNote } from "@/components/learning/DocsSafetyNote";

export const Route = createFileRoute("/technical-manual")({
  head: () => ({ meta: [{ title: "技术手册 · Technical Manual" }, { name: "description", content: "Aetherworld 开发者 / Founder 技术手册。" }] }),
  component: TechnicalManualPage,
});

function TechnicalManualPage() {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <header><h1 className="text-2xl font-semibold">技术手册 · Technical Manual</h1></header>
      <TechnicalManualPanel />
      <DocsSafetyNote />
    </div>
  );
}
