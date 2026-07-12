import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import {
  TRIGGER_NOTICE_LABEL,
  TRIGGER_REPEAT_LABEL,
  TRIGGER_TYPE_LABEL,
  type TriggerNoticeLevel,
  type TriggerRepeatRule,
  type TriggerType,
} from "@/lib/trigger-calendar/triggerTypes";
import { newTriggerId, upsertTrigger } from "@/lib/trigger-calendar/triggerStore";
import { todayString } from "@/lib/trigger-calendar/triggerSelectors";

interface Props {
  defaultDate?: string;
  trigger?: React.ReactNode;
}

export function CreateTriggerDialog({ defaultDate, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate ?? todayString());
  const [time, setTime] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("REMINDER_TRIGGER");
  const [repeatRule, setRepeatRule] = useState<TriggerRepeatRule>("NONE");
  const [noticeLevel, setNoticeLevel] = useState<TriggerNoticeLevel>("MEDIUM");

  const reset = () => {
    setTitle("");
    setDescription("");
    setTime("");
    setDate(defaultDate ?? todayString());
    setTriggerType("REMINDER_TRIGGER");
    setRepeatRule("NONE");
    setNoticeLevel("MEDIUM");
  };

  const onSubmit = () => {
    if (!title.trim()) {
      toast.error("请输入标题");
      return;
    }
    const now = new Date().toISOString();
    upsertTrigger({
      triggerId: newTriggerId(),
      title: title.trim(),
      description: description.trim() || undefined,
      triggerType,
      status: "PENDING",
      date,
      time: time || undefined,
      repeatRule,
      sourceModule: "Calendar",
      actionType: "REMIND",
      noticeLevel,
      createdAt: now,
      updatedAt: now,
    });
    toast.success("触发已创建");
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="w-4 h-4 mr-1" /> 新建触发
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新建触发</DialogTitle>
          <DialogDescription>创建一个任务、提醒或系统触发。</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="trg-title">标题</Label>
            <Input
              id="trg-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：检查最新项目 / 安装 WebCodeM"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trg-date">日期</Label>
              <Input id="trg-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trg-time">时间（可选）</Label>
              <Input id="trg-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>类型</Label>
              <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>重复</Label>
              <Select value={repeatRule} onValueChange={(v) => setRepeatRule(v as TriggerRepeatRule)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_REPEAT_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>提醒级别</Label>
            <Select value={noticeLevel} onValueChange={(v) => setNoticeLevel(v as TriggerNoticeLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TRIGGER_NOTICE_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trg-desc">备注（可选）</Label>
            <Textarea
              id="trg-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="补充说明 / 上下文"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={onSubmit}>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
