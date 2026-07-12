import { createFileRoute } from "@tanstack/react-router";
import { TriggerSection } from "@/components/trigger-calendar/TriggerSection";
import { useTriggerItems } from "@/hooks/useTriggerItems";

export const Route = createFileRoute("/calendar/tasks")({
  head: () => ({ meta: [{ title: "任务 · Aetherworld" }] }),
  component: TasksPage,
});

function TasksPage() {
  const items = useTriggerItems();
  const tasks = items.filter(
    (i) =>
      i.triggerType === "TASK_TRIGGER" ||
      i.triggerType === "PROJECT_REVIEW_TRIGGER" ||
      i.triggerType === "CODE_CHECK_TRIGGER",
  );
  const pending = tasks.filter((t) => t.status !== "DONE");
  const done = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl">
      <TriggerSection
        title="待办任务"
        items={pending}
        emptyText="暂无待办任务。"
      />
      <TriggerSection
        title="已完成"
        items={done}
        emptyText="尚未完成任何任务。"
        compact
      />
    </div>
  );
}
