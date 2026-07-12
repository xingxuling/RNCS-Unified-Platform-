import { useState, useSyncExternalStore } from "react";
import {
  runRealWebLlmChat,
  stopRealWebLlmGeneration,
  getRealWebLlmRuntimeState,
  subscribeRealWebLlmRuntime,
} from "@/lib/real-webllm/aetherRealWebLlmRuntime";

export function RealWebLlmChatTestPanel() {
  const s = useSyncExternalStore(subscribeRealWebLlmRuntime, getRealWebLlmRuntimeState, getRealWebLlmRuntimeState);
  const [input, setInput] = useState("用三句话介绍 Aetherworld。");
  const [output, setOutput] = useState("");
  const [qa, setQa] = useState<string>("");
  const ready = s.engineStatus === "READY";
  const generating = s.engineStatus === "GENERATING";

  const run = async () => {
    setOutput("");
    setQa("");
    const r = await runRealWebLlmChat(
      {
        requestId: "test_" + Date.now(),
        taskType: "TEST_CHAT",
        sourceModule: "real-webllm-test",
        prompt: { userInput: input },
        stream: true,
      },
      {
        onDelta: (_d, full) => setOutput(full),
        onDone: (res) => {
          setQa(`${res.qaStatus}${res.safetyNotes.length ? " · " + res.safetyNotes.join("；") : ""}`);
        },
        onError: (err) => setOutput("出错：" + err),
      },
    );
    if (r.status === "BLOCKED") setOutput("（输出已被 QA 阻断）");
  };

  return (
    <div className="space-y-3">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        className="w-full text-sm bg-card border border-border/60 rounded-md px-3 py-2 outline-none focus:border-border resize-none"
        placeholder="输入要测试的提示词……"
      />
      <div className="flex items-center gap-2">
        <button
          disabled={!ready || generating || !input.trim()}
          onClick={run}
          className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background disabled:opacity-40"
        >
          开始测试
        </button>
        <button
          disabled={!generating}
          onClick={() => stopRealWebLlmGeneration()}
          className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-muted/40 disabled:opacity-40"
        >
          停止生成
        </button>
        <button
          onClick={() => { setOutput(""); setQa(""); }}
          className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-muted/40"
        >
          清空
        </button>
        {!ready && (
          <span className="text-[10px] text-muted-foreground">请先在上方加载模型。</span>
        )}
      </div>
      <div className="aether-card p-3 min-h-[140px] text-sm whitespace-pre-wrap leading-relaxed">
        {output || <span className="text-muted-foreground">输出将显示在这里。</span>}
      </div>
      {qa && <div className="text-[11px] text-muted-foreground">检查结果：{qa}</div>}
    </div>
  );
}
