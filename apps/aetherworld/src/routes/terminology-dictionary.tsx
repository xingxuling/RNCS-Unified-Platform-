import { createFileRoute } from "@tanstack/react-router";
import { TerminologyTable } from "@/components/i18n/TerminologyTable";
import { useFounderState } from "@/hooks/useFounderState";

function Page() {
  const { active } = useFounderState();
  return (
    <div className="container mx-auto px-4 py-8">
      <TerminologyTable founder={active} />
    </div>
  );
}

export const Route = createFileRoute("/terminology-dictionary")({
  head: () => ({
    meta: [
      { title: "术语字典 · Terminology Dictionary" },
      { name: "description", content: "Aether 多语言术语字典：原词 / 七语言译名 / 普通 / 高阶 / Founder 名 / 禁用译法。" },
    ],
  }),
  component: Page,
});
