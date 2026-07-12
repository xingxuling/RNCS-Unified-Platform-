import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TriggerSection } from "@/components/trigger-calendar/TriggerSection";
import { useTriggerItems } from "@/hooks/useTriggerItems";
import {
  TRIGGER_TYPES,
  TRIGGER_TYPE_LABEL,
  type TriggerType,
} from "@/lib/trigger-calendar/triggerTypes";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/calendar/triggers")({
  head: () => ({ meta: [{ title: "触发规则 · Aetherworld" }] }),
  component: TriggersPage,
});

function TriggersPage() {
  const items = useTriggerItems();
  const [filter, setFilter] = useState<TriggerType | "ALL">("ALL");

  const filtered = filter === "ALL"
    ? items
    : items.filter((i) => i.triggerType === filter);

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={filter === "ALL" ? "default" : "ghost"}
          onClick={() => setFilter("ALL")}
        >
          全部
        </Button>
        {TRIGGER_TYPES.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={filter === t ? "default" : "ghost"}
            onClick={() => setFilter(t)}
          >
            {TRIGGER_TYPE_LABEL[t]}
          </Button>
        ))}
      </div>

      <TriggerSection
        title="触发规则"
        description="所有已创建的触发，包括周期任务和一次性提醒。"
        items={filtered}
        emptyText="没有匹配的触发。"
      />
    </div>
  );
}
