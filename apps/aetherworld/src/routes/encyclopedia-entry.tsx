import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EncyclopediaEntryDetail } from "@/components/EncyclopediaEntryDetail";
import { CalculusUniversePanel } from "@/components/calculus/CalculusUniversePanel";
import { getEntryById } from "@/lib/encyclopediaEngine";
import { useFounderState } from "@/hooks/useFounderState";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { onDataChange } from "@/lib/store";
import { ChevronLeft } from "lucide-react";

type EntrySearch = { id: string };

export const Route = createFileRoute("/encyclopedia-entry")({
  validateSearch: (s: Record<string, unknown>): EntrySearch => ({
    id: typeof s.id === "string" ? s.id : "",
  }),
  head: () => ({
    meta: [
      { title: "百科条目 · Encyclopedia Entry" },
      { name: "description", content: "Aether Fate Engine 百科条目详情。" },
    ],
  }),
  component: EncyclopediaEntryPage,
});

function EncyclopediaEntryPage() {
  const { id } = Route.useSearch();
  const { active: founder } = useFounderState();
  const [beginner, setBeginner] = useState(true);
  useEffect(() => {
    const sync = () => setBeginner(isBeginnerMode());
    sync();
    return onDataChange(sync);
  }, []);

  const entry = id ? getEntryById(id) : undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
      <Link to="/encyclopedia" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-3 h-3 mr-1" /> 返回百科首页
      </Link>
      {!entry ? (
        <div className="text-sm text-muted-foreground py-12 text-center">
          找不到条目「{id || "—"}」。
          <div className="mt-2">
            <Link to="/encyclopedia" className="text-primary underline">回到百科搜索</Link>
          </div>
        </div>
      ) : (
        <>
          <EncyclopediaEntryDetail entry={entry} beginner={beginner} founder={founder} />
          {entry.id === "calculus-universe-encyclopedia" && (
            <CalculusUniversePanel founder={founder} />
          )}
        </>
      )}
    </div>
  );
}
