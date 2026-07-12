import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EncyclopediaHome } from "@/components/EncyclopediaHome";
import { useFounderState } from "@/hooks/useFounderState";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { onDataChange } from "@/lib/store";

type EncSearch = { category?: string };

export const Route = createFileRoute("/encyclopedia")({
  validateSearch: (s: Record<string, unknown>): EncSearch => ({
    category: typeof s.category === "string" ? s.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "产品百科全书 · Aether Fate Engine Encyclopedia" },
      { name: "description", content: "Aether Fate Engine 的可搜索分类知识库：概念、模块、计算法、常数、事件、安全边界。" },
    ],
  }),
  component: EncyclopediaPage,
});

function EncyclopediaPage() {
  const { category } = Route.useSearch();
  const { active: founder } = useFounderState();
  const [beginner, setBeginner] = useState(true);
  useEffect(() => {
    const sync = () => setBeginner(isBeginnerMode());
    sync();
    return onDataChange(sync);
  }, []);
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <EncyclopediaHome beginner={beginner} founder={founder} initialCategory={category} />
    </div>
  );
}
