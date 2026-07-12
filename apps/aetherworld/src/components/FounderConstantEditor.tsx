import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConstantUniverse } from "@/lib/constantUniverseEngine";
import { appendVersion } from "@/lib/constantVersionManager";
import { useFounderState } from "@/hooks/useFounderState";

export function FounderConstantEditor() {
  const { active } = useFounderState();
  const [json, setJson] = useState<string>(() => JSON.stringify(ConstantUniverse, null, 2));
  const [confirming, setConfirming] = useState(false);

  if (!active) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>创始人常数编辑器</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">需要进入创始人模式才能编辑常数。</p>
        </CardContent>
      </Card>
    );
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(ConstantUniverse, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "constant-universe.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!confirming) { setConfirming(true); return; }
    try {
      JSON.parse(json);
      appendVersion({
        version: `Constant Universe v1.0.${Date.now()}`,
        changedBy: "founder",
        changedGroups: ["NUMBER","FIVE_DOMAIN","EVENT","FEEDBACK","USER","PLATFORM"],
        notes: "创始人从 JSON 导入常数（运行时覆盖，不会持久化文件）。",
      });
      toast.success("已记录版本", { description: "刷新页面后会回到默认常数；如需持久化请提交代码改动。" });
      setConfirming(false);
    } catch (e) {
      toast.error("JSON 解析失败", { description: String(e) });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>创始人常数编辑器</CardTitle>
          <Badge variant="destructive">HIGH RISK</Badge>
        </div>
        <p className="text-xs text-muted-foreground">查看、导出、导入常数 JSON。导入仅记录版本，文件持久化需走代码提交。</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea rows={14} value={json} onChange={(e) => setJson(e.target.value)} className="font-mono text-xs" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>导出 JSON</Button>
          <Button variant={confirming ? "destructive" : "default"} onClick={handleImport}>
            {confirming ? "再次点击确认导入" : "导入 JSON"}
          </Button>
          {confirming && <Button variant="ghost" onClick={() => setConfirming(false)}>取消</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
