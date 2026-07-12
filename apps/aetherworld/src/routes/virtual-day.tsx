import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { runVirtualLife } from "@/lib/virtualLifeCalculus";
import { getActiveSubjectId } from "@/lib/store";
import { useFounderState } from "@/hooks/useFounderState";
import { VirtualDayCard } from "@/components/VirtualDayCard";
import { VirtualLifeQuestBoard } from "@/components/VirtualLifeQuestBoard";
import { VirtualNpcEncounterCard } from "@/components/VirtualNpcEncounterCard";
import { VirtualRealityAnchorCard } from "@/components/VirtualRealityAnchorCard";
import { VirtualLifeSafetyNote } from "@/components/VirtualLifeSafetyNote";

export const Route = createFileRoute("/virtual-day")({
  head: () => ({
    meta: [
      { title: "虚拟的一天 · Virtual Day" },
      { name: "description", content: "快速预览今天的虚拟生活：醒来、任务、NPC、现实锚点。" },
    ],
  }),
  component: VirtualDayRoute,
});

function VirtualDayRoute() {
  const { active } = useFounderState();
  const subjectId = typeof window !== "undefined" ? getActiveSubjectId() : "demo";
  const report = useMemo(() => runVirtualLife({
    subjectId, worldId: "default-world", lifeMode: "LIGHT_PERSONAL_LIFE", founderActive: active,
  }), [subjectId, active]);
  const day = report.day;

  return (
    <div className="container mx-auto px-4 py-8 space-y-5">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Virtual Day · 虚拟的一天</div>
        <h1 className="text-2xl font-display gold-text">今天</h1>
      </header>
      <VirtualLifeSafetyNote />
      <VirtualDayCard day={day} />
      <VirtualLifeQuestBoard main={day.mainQuest} sides={day.sideQuests} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VirtualNpcEncounterCard encounter={day.npcEncounter} />
        <VirtualRealityAnchorCard anchor={day.realityAnchor} />
      </div>
      <div>
        <Link to="/virtual-life" className="text-xs text-primary hover:underline">→ 进入完整虚拟生活</Link>
      </div>
    </div>
  );
}
