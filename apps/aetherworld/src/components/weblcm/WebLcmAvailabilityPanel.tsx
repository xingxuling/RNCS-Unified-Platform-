import { useEffect, useState } from "react";
import { detectWebLcmAvailability, type WebLcmAvailability } from "@/lib/weblcm/webLcmAvailabilityDetector";
import { WEB_LCM_EMBEDDING_BACKENDS } from "@/constants/weblcm/webLcmEmbeddingBackends";

export function WebLcmAvailabilityPanel() {
  const [avail, setAvail] = useState<WebLcmAvailability | null>(null);
  useEffect(() => { detectWebLcmAvailability().then(setAvail); }, []);
  if (!avail) return <div className="text-xs text-muted-foreground p-3 rounded border border-border/40">正在检测可用性…</div>;
  return (
    <div className="rounded border border-border/40 p-3 text-xs space-y-2">
      <div className="font-semibold">运行时可用性</div>
      <div className="grid grid-cols-2 gap-1 text-muted-foreground">
        <div>规则后端：{avail.ruleBackendAvailable ? "✓" : "✗"}</div>
        <div>Transformers.js：{avail.transformersJsAvailable ? "✓" : "✗"}</div>
        <div>WebLLM Embedding：{avail.webllmEmbeddingAvailable ? "✓" : "✗"}</div>
        <div>WebGPU：{avail.webGpuAvailable ? "✓" : "✗"}</div>
      </div>
      <div>当前后端：<span className="font-mono">{avail.selectedBackend}</span></div>
      <details>
        <summary className="cursor-pointer text-muted-foreground">查看全部后端 ({WEB_LCM_EMBEDDING_BACKENDS.length})</summary>
        <ul className="mt-1 space-y-1">
          {WEB_LCM_EMBEDDING_BACKENDS.map(b => (
            <li key={b.id}>• {b.title} — {b.available ? "可用" : "未安装"}：{b.description}</li>
          ))}
        </ul>
      </details>
      <ul className="text-muted-foreground text-[10px]">
        {avail.notes.map((n, i) => <li key={i}>• {n}</li>)}
      </ul>
    </div>
  );
}
