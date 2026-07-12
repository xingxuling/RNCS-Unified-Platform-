import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TRIGGER_NOTICE_LABEL,
  TRIGGER_REPEAT_LABEL,
  TRIGGER_STATUS_LABEL,
  TRIGGER_TYPE_LABEL,
  type TriggerItem,
} from "@/lib/trigger-calendar/triggerTypes";
import {
  deleteTrigger,
  setStatus,
  upsertTrigger,
} from "@/lib/trigger-calendar/triggerStore";
import { shiftDate } from "@/lib/trigger-calendar/triggerSelectors";
import { CalendarClock, CheckCircle2, Clock, Pencil, Trash2 } from "lucide-react";

interface Props {
  trigger: TriggerItem;
  compact?: boolean;
}

export function TriggerCard({ trigger, compact }: Props) {
  const statusColor =
    trigger.status === "DONE"
      ? "text-emerald-400"
      : trigger.status === "MISSED" || trigger.status === "FAILED"
      ? "text-rose-400"
      : trigger.status === "PAUSED"
      ? "text-muted-foreground"
      : "text-amber-300";

  const onComplete = () => {
    setStatus(trigger.triggerId, "DONE");
    toast.success(`已标记完成：${trigger.title}`);
  };

  const onSnooze = () => {
    upsertTrigger({
      ...trigger,
      status: "PENDING",
      date: shiftDate(trigger.date, 1),
      snoozeUntil: shiftDate(trigger.date, 1),
    });
    toast.info("已推迟到明天");
  };

  return (
    <div className="aether-card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-1 w-8 h-8 rounded-md bg-muted/40 flex items-center justify-center">
          <CalendarClock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium truncate">{trigger.title}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border border-border/60 ${statusColor}`}>
              {TRIGGER_STATUS_LABEL[trigger.status]}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {trigger.date}
              {trigger.time ? ` · ${trigger.time}` : ""}
            </span>
            <span>{TRIGGER_TYPE_LABEL[trigger.triggerType]}</span>
            {!compact && trigger.repeatRule !== "NONE" && (
              <span>重复：{TRIGGER_REPEAT_LABEL[trigger.repeatRule]}</span>
            )}
            {!compact && (
              <span>提醒：{TRIGGER_NOTICE_LABEL[trigger.noticeLevel]}</span>
            )}
          </div>
          {!compact && trigger.description && (
            <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2">
              {trigger.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {trigger.status !== "DONE" && (
          <Button size="sm" variant="default" onClick={onComplete}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 标记完成
          </Button>
        )}
        {trigger.status !== "DONE" && (
          <Button size="sm" variant="ghost" onClick={onSnooze}>
            稍后提醒
          </Button>
        )}
        {trigger.targetRoute && (
          <Button asChild size="sm" variant="ghost">
            <a href={trigger.targetRoute}>立即执行</a>
          </Button>
        )}
        <Button asChild size="sm" variant="ghost">
          <Link to="/calendar/triggers">
            <Pencil className="w-3.5 h-3.5 mr-1" /> 编辑
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> 删除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除触发？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作不可撤销，将永久删除「{trigger.title}」。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteTrigger(trigger.triggerId);
                  toast.success("已删除");
                }}
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
