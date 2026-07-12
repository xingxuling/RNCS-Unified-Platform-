import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  STAGE_LABEL, clearPreferences, loadPreferences, savePreferences,
  type SubjectPreferences, type SubjectStage,
} from "@/lib/subject/subjectPreferenceStore";

export const Route = createFileRoute("/subject/real")({
  head: () => ({ meta: [{ title: "真实主体 · Aetherworld" }] }),
  component: RealSubjectPage,
});

function RealSubjectPage() {
  const [p, setP] = useState<SubjectPreferences>(() => loadPreferences());
  useEffect(() => { setP(loadPreferences()); }, []);

  const update = (patch: Partial<SubjectPreferences>) => setP(savePreferences(patch));

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-2xl">
      <div className="aether-card p-5 space-y-2">
        <h3 className="text-sm font-medium">主体摘要</h3>
        <p className="text-xs text-muted-foreground">
          一句话描述当前主体画像。对话可使用此摘要，但不会泄漏敏感原文。
        </p>
        <Textarea
          value={p.summary}
          onChange={(e) => setP({ ...p, summary: e.target.value })}
          rows={3}
        />
      </div>

      <div className="aether-card p-5 space-y-3">
        <h3 className="text-sm font-medium">长期方向</h3>
        <Textarea
          value={p.longTermDirection}
          onChange={(e) => setP({ ...p, longTermDirection: e.target.value })}
          rows={2}
          placeholder="例如：应用开发、Aetherworld、音乐、商业……"
        />
      </div>

      <div className="aether-card p-5 space-y-3">
        <h3 className="text-sm font-medium">当前阶段</h3>
        <Select value={p.currentStage} onValueChange={(v) => update({ currentStage: v as SubjectStage })}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(STAGE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="aether-card p-5 space-y-2">
        <h3 className="text-sm font-medium">系统偏好</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>· 中文优先：{p.preferChinese ? "是" : "否"}</li>
          <li>· 极简 UI：开启</li>
          <li>· 对话优先：开启</li>
          <li>· 对象保存：{p.preferSaveObject ? "是" : "否"}</li>
        </ul>
        <p className="text-[11px] text-muted-foreground/80">
          这些偏好来自轻量主体。前往
          <Link to="/subject/light" className="text-foreground underline ml-1">轻量主体</Link>
          调整。
        </p>
      </div>

      <div className="aether-card p-5 space-y-2 border-amber-500/30">
        <h3 className="text-sm font-medium">隐私说明</h3>
        <p className="text-xs text-muted-foreground">
          真实主体不等于公开资料。摘要仅本地保存，不会自动上传，不会用于训练，不会作为可分享内容外发。
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => { savePreferences(p); toast.success("主体已更新"); }}>更新主体摘要</Button>
        <Button asChild variant="ghost"><Link to="/subject">查看主体来源</Link></Button>
        <Button
          variant="ghost"
          className="text-rose-400"
          onClick={() => {
            if (!confirm("确定清除主体摘要？")) return;
            clearPreferences();
            setP(loadPreferences());
            toast.success("已清除");
          }}
        >
          清除主体摘要
        </Button>
        <Button asChild variant="ghost"><Link to="/subject/settings">高级设置</Link></Button>
      </div>
    </div>
  );
}
