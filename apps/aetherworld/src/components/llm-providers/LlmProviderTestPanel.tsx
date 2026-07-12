import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { runLlmChat } from "@/lib/llm-providers/llmProviderRuntime";

export function LlmProviderTestPanel() {
  const [input, setInput] = useState("用一句话介绍你自己。");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [meta, setMeta] = useState<{
    providerId: string;
    modelId: string;
    latencyMs?: number;
    status: string;
    notes: string[];
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    setMeta(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const r = await runLlmChat({
      messages: [{ role: "user", content: input }],
      sourceModule: "llm-test",
      taskType: "test",
      stream: true,
      handlers: {
        onDelta: (d) => setOutput((s) => s + d),
        signal: ctrl.signal,
      },
    });
    setMeta({
      providerId: r.providerId,
      modelId: r.modelId,
      latencyMs: r.latencyMs,
      status: r.status,
      notes: r.safetyNotes,
    });
    setRunning(false);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  return (
    <Card className="p-4 space-y-3">
      <div>
        <div className="text-sm font-medium">模型测试</div>
        <div className="text-xs text-muted-foreground mt-1">
          调用当前默认或自动选定的模型提供者，验证连通性与输出。
        </div>
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        placeholder="输入一句话测试当前模型……"
      />

      <div className="flex gap-2">
        <Button onClick={handleRun} disabled={running}>{running ? "生成中…" : "测试"}</Button>
        <Button variant="outline" onClick={handleStop} disabled={!running}>停止</Button>
      </div>

      {meta && (
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">提供者：{meta.providerId}</Badge>
          <Badge variant="outline">模型：{meta.modelId || "—"}</Badge>
          {meta.latencyMs && <Badge variant="outline">{meta.latencyMs}ms</Badge>}
          <Badge variant={meta.status === "SUCCESS" ? "default" : "destructive"}>{meta.status}</Badge>
        </div>
      )}

      {output && (
        <div className="rounded border bg-muted/30 p-3 text-sm whitespace-pre-wrap min-h-[80px]">
          {output}
        </div>
      )}

      {meta?.notes && meta.notes.length > 0 && (
        <div className="text-xs text-amber-500 space-y-1">
          {meta.notes.map((n, i) => <div key={i}>· {n}</div>)}
        </div>
      )}
    </Card>
  );
}
