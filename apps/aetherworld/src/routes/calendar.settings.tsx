import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/calendar/settings")({
  head: () => ({ meta: [{ title: "日历设置 · Aetherworld" }] }),
  component: CalendarSettingsPage,
});

const SETTINGS_KEY = "aether.trigger-calendar.settings.v1";

interface CalendarSettings {
  defaultView: "today" | "week" | "month" | "tasks" | "triggers";
  notifyToast: boolean;
  notifyCritical: boolean;
  defaultNoticeLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const DEFAULTS: CalendarSettings = {
  defaultView: "today",
  notifyToast: true,
  notifyCritical: true,
  defaultNoticeLevel: "MEDIUM",
};

function load(): CalendarSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

function CalendarSettingsPage() {
  const [s, setS] = useState<CalendarSettings>(DEFAULTS);
  useEffect(() => setS(load()), []);

  const save = (patch: Partial<CalendarSettings>) => {
    const next = { ...s, ...patch };
    setS(next);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch {}
  };

  const onClear = () => {
    if (!confirm("确定清空所有触发？此操作不可撤销。")) return;
    localStorage.removeItem("aether.trigger-calendar.items.v1");
    window.dispatchEvent(new CustomEvent("aether:trigger-calendar:changed"));
    toast.success("已清空全部触发");
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-2xl">
      <div className="aether-card p-5 space-y-4">
        <h3 className="text-sm font-medium">默认视图</h3>
        <Select value={s.defaultView} onValueChange={(v) => save({ defaultView: v as any })}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">今天</SelectItem>
            <SelectItem value="week">本周</SelectItem>
            <SelectItem value="month">本月</SelectItem>
            <SelectItem value="tasks">任务</SelectItem>
            <SelectItem value="triggers">触发规则</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="aether-card p-5 space-y-4">
        <h3 className="text-sm font-medium">提醒</h3>
        <div className="flex items-center justify-between">
          <div>
            <Label>触发到期时弹出提醒</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Toast 形式，不打断当前操作。</p>
          </div>
          <Switch checked={s.notifyToast} onCheckedChange={(v) => save({ notifyToast: v })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>关键级触发使用强提醒</Label>
            <p className="text-xs text-muted-foreground mt-0.5">QA / 安全 / 数据类。</p>
          </div>
          <Switch checked={s.notifyCritical} onCheckedChange={(v) => save({ notifyCritical: v })} />
        </div>
        <div className="space-y-1.5">
          <Label>新建触发的默认提醒级别</Label>
          <Select value={s.defaultNoticeLevel} onValueChange={(v) => save({ defaultNoticeLevel: v as any })}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">普通</SelectItem>
              <SelectItem value="MEDIUM">重要</SelectItem>
              <SelectItem value="HIGH">强提醒</SelectItem>
              <SelectItem value="CRITICAL">关键</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="aether-card p-5 space-y-3">
        <h3 className="text-sm font-medium">高级</h3>
        <p className="text-xs text-muted-foreground">清空所有触发数据。仅影响本地存储。</p>
        <Button variant="ghost" className="text-rose-400 hover:text-rose-300" onClick={onClear}>
          清空所有触发
        </Button>
      </div>
    </div>
  );
}
