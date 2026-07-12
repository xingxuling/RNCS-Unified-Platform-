import { createFileRoute } from "@tanstack/react-router";
import { TriggerSection } from "@/components/trigger-calendar/TriggerSection";
import { useTriggerItems } from "@/hooks/useTriggerItems";
import { selectToday } from "@/lib/trigger-calendar/triggerSelectors";

export const Route = createFileRoute("/calendar/today")({
  head: () => ({ meta: [{ title: "今日日程 · Aetherworld" }] }),
  component: TodayPage,
});

function TodayPage() {
  const items = useTriggerItems();
  const today = selectToday(items);
  const dateLabel = new Date().toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
  return (
    <div className="p-6 md:p-10 space-y-6 max-w-4xl">
      <div className="aether-card p-4">
        <div className="text-xs text-muted-foreground">今天</div>
        <div className="text-lg font-medium mt-1">{dateLabel}</div>
        <div className="text-xs text-muted-foreground mt-1">共 {today.length} 项</div>
      </div>
      <TriggerSection
        title="今日触发"
        items={today}
        emptyText="今天没有待办触发。"
      />
    </div>
  );
}
