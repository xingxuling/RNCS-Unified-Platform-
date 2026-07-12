import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ingestRealityData } from "@/lib/reality-data/realityDataIngestionEngine";
import type { DataSourceType } from "@/constants/reality-data/dataSourceTypes";
import { DATA_SOURCE_TYPES } from "@/constants/reality-data/dataSourceTypes";

export function DataIngestionPanel() {
  const [name, setName] = useState("用户粘贴的资料");
  const [type, setType] = useState<DataSourceType>("USER_PROVIDED");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<ReturnType<typeof ingestRealityData> | null>(null);

  return (
    <Card className="p-4 space-y-3">
      <div className="text-sm font-medium">接入外部数据</div>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="数据源名称" />
      <select className="w-full border rounded-md p-2 text-sm bg-background" value={type} onChange={(e) => setType(e.target.value as DataSourceType)}>
        {DATA_SOURCE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label} · {t.en}</option>)}
      </select>
      <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="粘贴榜单/政策/新闻/报告内容" />
      <Button onClick={() => setResult(ingestRealityData({ sourceName: name, sourceType: type, content }))} disabled={!content.trim()}>接入</Button>
      {result && (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-60">{JSON.stringify(result, null, 2)}</pre>
      )}
    </Card>
  );
}
