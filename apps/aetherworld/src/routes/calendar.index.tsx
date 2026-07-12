import { createFileRoute } from "@tanstack/react-router";
import { TriggerSection } from "@/components/trigger-calendar/TriggerSection";
import { useTriggerItems } from "@/hooks/useTriggerItems";
import {
  selectPending,
  selectToday,
  selectUpcoming,
} from "@/lib/trigger-calendar/triggerSelectors";
import { CreateTriggerDialog } from "@/components/trigger-calendar/CreateTriggerDialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/calendar/")({
  component: CalendarHome,
});

function CalendarHome() {
  const items = useTriggerItems();
  const today = selectToday(items);
  const upcoming = selectUpcoming(items, 7);
  const pending = selectPending(items);

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl">
      <TriggerSection
        title="今天"
        description="今天需要完成或被触发的事项。"
        items={today}
        emptyText="今天没有待办触发。可以新建一个。"
      />
      <TriggerSection
        title="即将到来"
        description="未来 7 天内的重要任务。"
        items={upcoming}
        emptyText="未来 7 天无安排。"
      />
      <TriggerSection
        title="待处理"
        description="已错过、需要确认、安装、修复或复查的事项。"
        items={pending}
        emptyText="无待处理项。"
      />

      <div className="aether-card p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-medium">创建新触发</h3>
          <p className="text-xs text-muted-foreground mt-1">
            支持一次性、每天、工作日、每周、每月。
          </p>
        </div>
        <CreateTriggerDialog
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-1" /> 新建触发
            </Button>
          }
        />
      </div>
    </div>
  );
}
