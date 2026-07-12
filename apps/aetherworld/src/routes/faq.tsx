import { createFileRoute } from "@tanstack/react-router";
import { FAQPanel } from "@/components/learning/FAQPanel";
import { DocsSafetyNote } from "@/components/learning/DocsSafetyNote";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "常见问题 · FAQ" }, { name: "description", content: "Aetherworld 常见问题。" }] }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-semibold">常见问题 · FAQ</h1>
      </header>
      <FAQPanel />
      <DocsSafetyNote />
    </div>
  );
}
