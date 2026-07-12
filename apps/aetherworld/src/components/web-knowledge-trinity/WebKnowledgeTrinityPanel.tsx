import { useState } from "react";
import { runWebKnowledgeTrinity, type WebKnowledgeTrinityResult } from "@/lib/web-knowledge-trinity/aetherWebKnowledgeTrinityRuntime";
import { WEB_KNOWLEDGE_RETRIEVAL_MODES, DEFAULT_WEB_KNOWLEDGE_RETRIEVAL_MODE, type WebKnowledgeRetrievalMode } from "@/constants/web-knowledge-trinity/webKnowledgeRetrievalModes";
import { WEB_KNOWLEDGE_EXAMPLES } from "@/lib/web-knowledge-trinity/webKnowledgeExamplesRegistry";
import { WebLkmPanel } from "./WebLkmPanel";
import { WebCmPanel } from "./WebCmPanel";
import { WebCoMPanel } from "./WebCoMPanel";
import { WebCalculusRoutePanel } from "./WebCalculusRoutePanel";
import { WebConstantConstraintPanel } from "./WebConstantConstraintPanel";
import { WebKnowledgeQaPanel } from "./WebKnowledgeQaPanel";
import { WebKnowledgeGraphPanel } from "./WebKnowledgeGraphPanel";
import { WebKnowledgeSafetyNote } from "./WebKnowledgeSafetyNote";

type TabId = "knowledge" | "calculus" | "constants" | "concept" | "prompt" | "graph" | "qa";
const TABS: { id: TabId; label: string }[] = [
  { id: "knowledge", label: "Knowledge" },
  { id: "calculus", label: "Calculus Route" },
  { id: "constants", label: "Constants" },
  { id: "concept", label: "Concept Chain" },
  { id: "prompt", label: "WebLLM Prompt" },
  { id: "graph", label: "Graph" },
  { id: "qa", label: "QA" },
];

export function WebKnowledgeTrinityPanel() {
  const [intent, setIntent] = useState("");
  const [mode, setMode] = useState<WebKnowledgeRetrievalMode>(DEFAULT_WEB_KNOWLEDGE_RETRIEVAL_MODE);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<WebKnowledgeTrinityResult | null>(null);
  const [tab, setTab] = useState<TabId>("knowledge");

  function onRun() {
    if (!intent.trim()) return;
    setRunning(true);
    try {
      const r = runWebKnowledgeTrinity({ userIntent: intent, retrievalMode: mode });
      setResult(r);
    } finally { setRunning(false); }
  }

  const stat = result ? {
    knowledge: result.webLkm.retrieved.length,
    calculus: result.webCm.route.selectedCalculusIds.length,
    constants: result.webCoM.bundle.appliedConstantIds.length,
    qa: result.finalQa.status,
  } : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="space-y-3">
          <div className="rounded border border-border/40 p-3 text-xs space-y-2">
            <div className="font-semibold">运行配置</div>
            <label className="block">
              <div className="text-muted-foreground mb-1">检索模式</div>
              <select value={mode} onChange={(e) => setMode(e.target.value as WebKnowledgeRetrievalMode)}
                className="w-full px-2 py-1.5 rounded border border-border/40 bg-background">
                {WEB_KNOWLEDGE_RETRIEVAL_MODES.map((m) => (
                  <option key={m.id} value={m.id} disabled={!m.supported}>{m.title}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded border border-border/40 p-3 text-xs space-y-2">
            <div className="font-semibold">预置示例</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {WEB_KNOWLEDGE_EXAMPLES.map((ex) => (
                <button key={ex.id} onClick={() => setIntent(ex.intent)}
                  className="block w-full text-left px-2 py-1 rounded hover:bg-muted/30">
                  • {ex.title}
                </button>
              ))}
            </div>
          </div>

          <WebKnowledgeSafetyNote />
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="rounded border border-border/40 p-3 space-y-2">
            <div className="text-xs font-semibold">用户意图</div>
            <textarea value={intent} onChange={(e) => setIntent(e.target.value)}
              placeholder="例如：做一个番茄钟网页，可以开始、暂停、重置。"
              rows={4}
              className="w-full px-2 py-1.5 rounded border border-border/40 bg-background text-xs resize-none" />
            <div className="flex flex-wrap gap-2">
              <button onClick={onRun} disabled={running || !intent.trim()}
                className="px-3 py-1.5 text-xs rounded border border-border/40 hover:bg-muted/30 disabled:opacity-50">
                {running ? "运行中…" : "运行三体链路"}
              </button>
              <button onClick={() => { setIntent(""); setResult(null); }}
                className="px-3 py-1.5 text-xs rounded border border-border/40 hover:bg-muted/30">
                清空
              </button>
              {stat && (
                <span className="text-[10px] text-muted-foreground self-center">
                  Run {result?.run.runId.slice(-8)} · K {stat.knowledge} · C {stat.calculus} · Const {stat.constants} · QA {stat.qa}
                  {result?.blocked && <span className="text-red-400"> · BLOCKED</span>}
                </span>
              )}
            </div>
          </div>

          <div className="rounded border border-border/40">
            <div className="flex flex-wrap border-b border-border/40">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-xs ${tab === t.id ? "bg-muted/30 font-semibold" : "text-muted-foreground hover:bg-muted/20"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-3">
              {tab === "knowledge" && <WebLkmPanel retrieved={result?.webLkm.retrieved} />}
              {tab === "calculus" && <WebCalculusRoutePanel result={result?.webCm} />}
              {tab === "constants" && <WebConstantConstraintPanel result={result?.webCoM} />}
              {tab === "concept" && (
                <div className="text-xs space-y-2">
                  <div className="text-muted-foreground">交给 WebLCM 的概念输入预览：</div>
                  <pre className="rounded border border-border/40 p-2 overflow-x-auto whitespace-pre-wrap text-[10px]">
{result ? JSON.stringify(result.webLcmInput, null, 2) : "无"}
                  </pre>
                </div>
              )}
              {tab === "prompt" && (
                <div className="text-xs space-y-2">
                  <div className="text-muted-foreground">将传给 WebLLM 的受控 Prompt：</div>
                  <pre className="rounded border border-border/40 p-2 overflow-x-auto whitespace-pre-wrap text-[10px]">
{result ? `# System\n${result.webLlmPrompt.systemPrompt}\n\n# User\n${result.webLlmPrompt.userPrompt}` : "无"}
                  </pre>
                  <div className="text-[10px] text-muted-foreground">输出合约：{result?.webLlmPrompt.outputContract.join(", ")}</div>
                </div>
              )}
              {tab === "graph" && <WebKnowledgeGraphPanel />}
              {tab === "qa" && <WebKnowledgeQaPanel qa={result?.finalQa} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
