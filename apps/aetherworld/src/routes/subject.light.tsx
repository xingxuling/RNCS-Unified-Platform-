import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ANSWER_STYLE_LABEL, loadPreferences, savePreferences,
  type AnswerStyle, type SubjectPreferences,
} from "@/lib/subject/subjectPreferenceStore";

export const Route = createFileRoute("/subject/light")({
  head: () => ({ meta: [{ title: "轻量主体 · Aetherworld" }] }),
  component: LightSubjectPage,
});

const COMMON_CAPS = ["WebCodeM", "WebProductM", "WebDesignM", "WebMusicM", "WebStoryM", "WebResearchM"];

function LightSubjectPage() {
  const [p, setP] = useState<SubjectPreferences>(() => loadPreferences());
  useEffect(() => { setP(loadPreferences()); }, []);

  const update = (patch: Partial<SubjectPreferences>) => {
    const next = savePreferences(patch);
    setP(next);
  };

  const toggleCap = (id: string) => {
    const has = p.frequentCapabilities.includes(id);
    update({
      frequentCapabilities: has
        ? p.frequentCapabilities.filter((c) => c !== id)
        : [...p.frequentCapabilities, id],
    });
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-2xl">
      <div className="aether-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium">当前风格</h3>
          <p className="text-xs text-muted-foreground mt-0.5">影响对话回答的语气与结构。</p>
        </div>
        <Select value={p.answerStyle} onValueChange={(v) => update({ answerStyle: v as AnswerStyle })}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(ANSWER_STYLE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="aether-card p-5 space-y-4">
        <h3 className="text-sm font-medium">常用能力</h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_CAPS.map((c) => {
            const on = p.frequentCapabilities.includes(c);
            return (
              <Button
                key={c}
                size="sm"
                variant={on ? "default" : "ghost"}
                onClick={() => toggleCap(c)}
              >
                {c}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="aether-card p-5 space-y-4">
        <h3 className="text-sm font-medium">快捷设置</h3>
        <Row label="回答更简洁" checked={p.conciseReplies} onChange={(v) => update({ conciseReplies: v })} />
        <Row label="优先生成行动方案" checked={p.preferAction} onChange={(v) => update({ preferAction: v })} />
        <Row label="优先保存对象到工作区" checked={p.preferSaveObject} onChange={(v) => update({ preferSaveObject: v })} />
        <Row label="优先显示中文" checked={p.preferChinese} onChange={(v) => update({ preferChinese: v })} />
      </div>

      <details className="aether-card p-5">
        <summary className="text-sm font-medium cursor-pointer">高级设置</summary>
        <p className="text-xs text-muted-foreground mt-3">
          人格图谱、数列权重、深度建模等高阶项已折叠。可前往
          <a className="text-foreground underline ml-1" href="/subject-mode">主体模式</a> 或
          <a className="text-foreground underline ml-1" href="/subject-sovereignty">主体主权</a> 配置。
        </p>
      </details>

      <div className="text-xs text-muted-foreground">
        最近更新：{new Date(p.updatedAt).toLocaleString("zh-CN")}
        <Button size="sm" variant="ghost" className="ml-3" onClick={() => { update({}); toast.success("已保存"); }}>
          保存
        </Button>
      </div>
    </div>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
