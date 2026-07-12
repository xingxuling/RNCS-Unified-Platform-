import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { GeneratedModelSchema } from "@/lib/model-generation/modelSchemaBuilder";
import { exportModel } from "@/lib/model-generation/modelExportEngine";
import { MODEL_EXPORT_TARGETS } from "@/constants/model-generation/modelExportTargets";

export function ModelExportPanel({ schema, defaultTarget = "JSON" }: { schema: GeneratedModelSchema; defaultTarget?: string }) {
  const [target, setTarget] = useState(defaultTarget);
  const result = exportModel(schema, target);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      toast.success("已复制导出内容");
    } catch {
      toast.error("复制失败");
    }
  };

  const download = () => {
    const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = result.filenameSuggestion;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">模型导出</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODEL_EXPORT_TARGETS.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={copy}>复制</Button>
          <Button size="sm" variant="outline" onClick={download}>下载 {result.filenameSuggestion}</Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {result.safetyNotes.map(n => <Badge key={n} variant="outline" className="text-xs">{n}</Badge>)}
        </div>
        <Textarea readOnly value={result.content} rows={14} className="font-mono text-xs" />
      </CardContent>
    </Card>
  );
}
