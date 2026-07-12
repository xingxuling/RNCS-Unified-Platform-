import { useState } from "react";
import { runAetherWebLlm, type WebLlmRuntimeResult } from "@/lib/webllm/aetherWebLlmRuntime";

export function WebLlmChatConsole({ modelId, neuroProfile, onResult }: {
  modelId: string;
  neuroProfile: string;
  onResult: (r: WebLlmRuntimeResult) => void;
}) {
  const [input, setInput] = useState("写一段关于「番茄钟」App 的 README 草案。");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string>("");

  const submit = async () => {
    setBusy(true);
    try {
      const r = await runAetherWebLlm({ userInput: input, modelId, neuroControlProfile: neuroProfile, saveToWorkspace: true });
      setLast(r.result.rawText);
      onResult(r);
    } finally { setBusy(false); }
  };

  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Chat Console · 测试控制台</div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-24 bg-background border border-border/40 rounded p-2 text-sm font-mono"
      />
      <div className="flex items-center justify-end gap-2">
        <button disabled={busy} onClick={submit} className="px-3 py-1.5 text-sm rounded bg-primary/80 text-primary-foreground disabled:opacity-50">
          {busy ? "运行中…" : "运行 WebLLM"}
        </button>
      </div>
      {last && (
        <pre className="text-[11px] whitespace-pre-wrap border border-border/30 rounded p-2 bg-muted/20 max-h-64 overflow-auto">{last}</pre>
      )}
    </div>
  );
}
