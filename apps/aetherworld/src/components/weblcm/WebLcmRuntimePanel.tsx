import { useState } from "react";
import { runAetherWebLcm, type WebLcmRunResult } from "@/lib/weblcm/aetherWebLcmRuntime";
import { DEFAULT_WEB_LCM_RUNTIME_MODE, WEB_LCM_RUNTIME_MODES, type WebLcmRuntimeMode } from "@/constants/weblcm/webLcmRuntimeModes";
import { DEFAULT_WEB_LCM_COMPRESSION_PROFILE, WEB_LCM_COMPRESSION_PROFILES, type WebLcmCompressionProfile } from "@/constants/weblcm/webLcmCompressionProfiles";
import { DEFAULT_WEB_LCM_PREDICTION_MODE, WEB_LCM_PREDICTION_MODES, type WebLcmPredictionMode } from "@/constants/weblcm/webLcmPredictionModes";
import { WEB_LCM_EXAMPLES } from "@/lib/weblcm/webLcmExamplesRegistry";

import { WebLcmAvailabilityPanel } from "./WebLcmAvailabilityPanel";
import { WebLcmConceptExtractorPanel } from "./WebLcmConceptExtractorPanel";
import { WebLcmConceptChainPanel } from "./WebLcmConceptChainPanel";
import { WebLcmConceptGraphPanel } from "./WebLcmConceptGraphPanel";
import { WebLcmConceptSearchPanel } from "./WebLcmConceptSearchPanel";
import { WebLcmConceptPredictionPanel } from "./WebLcmConceptPredictionPanel";
import { WebLcmConceptCompressionPanel } from "./WebLcmConceptCompressionPanel";
import { WebLcmWebLlmBridgePanel } from "./WebLcmWebLlmBridgePanel";
import { WebLcmQaPanel } from "./WebLcmQaPanel";
import { WebLcmSafetyNote } from "./WebLcmSafetyNote";

type TabId = "concepts" | "chain" | "graph" | "search" | "compression" | "prediction" | "expansion" | "qa";

const TABS: { id: TabId; label: string }[] = [
  { id: "concepts", label: "概念" },
  { id: "chain", label: "概念链" },
  { id: "graph", label: "概念图谱" },
  { id: "search", label: "概念检索" },
  { id: "compression", label: "压缩" },
  { id: "prediction", label: "预测" },
  { id: "expansion", label: "WebLLM 展开" },
  { id: "qa", label: "QA" },
];

export function WebLcmRuntimePanel() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<WebLcmRuntimeMode>(DEFAULT_WEB_LCM_RUNTIME_MODE);
  const [profile, setProfile] = useState<WebLcmCompressionProfile>(DEFAULT_WEB_LCM_COMPRESSION_PROFILE);
  const [predMode, setPredMode] = useState<WebLcmPredictionMode>(DEFAULT_WEB_LCM_PREDICTION_MODE);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<WebLcmRunResult | null>(null);
  const [tab, setTab] = useState<TabId>("concepts");

  async function onRun() {
    if (!text.trim()) return;
    setRunning(true);
    try {
      const r = await runAetherWebLcm({
        text, runtimeMode: mode,
        compressionProfile: profile, predictionMode: predMode,
        includeGraph: true, includePrediction: true, includeExpansion: true,
      });
      setResult(r);
    } finally { setRunning(false); }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="space-y-3 lg:col-span-1">
          <WebLcmAvailabilityPanel />

          <div className="rounded border border-border/40 p-3 text-xs space-y-2">
            <div className="font-semibold">运行配置</div>
            <label className="block">
              <div className="text-muted-foreground mb-1">运行时模式</div>
              <select value={mode} onChange={e => setMode(e.target.value as WebLcmRuntimeMode)}
                className="w-full px-2 py-1.5 rounded border border-border/40 bg-background">
                {WEB_LCM_RUNTIME_MODES.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="text-muted-foreground mb-1">压缩档案</div>
              <select value={profile} onChange={e => setProfile(e.target.value as WebLcmCompressionProfile)}
                className="w-full px-2 py-1.5 rounded border border-border/40 bg-background">
                {WEB_LCM_COMPRESSION_PROFILES.map(p => <option key={p.id} value={p.id}>{p.title} (≤{p.maxConcepts})</option>)}
              </select>
            </label>
            <label className="block">
              <div className="text-muted-foreground mb-1">预测模式</div>
              <select value={predMode} onChange={e => setPredMode(e.target.value as WebLcmPredictionMode)}
                className="w-full px-2 py-1.5 rounded border border-border/40 bg-background">
                {WEB_LCM_PREDICTION_MODES.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </label>
          </div>

          <div className="rounded border border-border/40 p-3 text-xs space-y-2">
            <div className="font-semibold">预置示例</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {WEB_LCM_EXAMPLES.map(ex => (
                <button key={ex.id} onClick={() => setText(ex.sampleText)}
                  className="block w-full text-left px-2 py-1 rounded hover:bg-muted/30">
                  • {ex.title}
                </button>
              ))}
            </div>
          </div>

          <WebLcmSafetyNote />
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="rounded border border-border/40 p-3 space-y-2">
            <div className="text-xs font-semibold">输入文本 / 对象描述</div>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="输入要概念化的文本，例如：做一个番茄钟网页，可以开始、暂停、重置。"
              rows={5}
              className="w-full px-2 py-1.5 rounded border border-border/40 bg-background text-xs resize-none" />
            <div className="flex flex-wrap gap-2">
              <button onClick={onRun} disabled={running || !text.trim()}
                className="px-3 py-1.5 text-xs rounded border border-border/40 hover:bg-muted/30 disabled:opacity-50">
                {running ? "运行中…" : "运行 WebLCM"}
              </button>
              <button onClick={() => { setText(""); setResult(null); }}
                className="px-3 py-1.5 text-xs rounded border border-border/40 hover:bg-muted/30">
                清空
              </button>
              {result && (
                <span className="text-[10px] text-muted-foreground self-center">
                  Run {result.runId.slice(-8)} · 概念 {result.concepts.length} · QA {result.qa.status}
                  {result.blocked && <span className="text-red-500"> · BLOCKED</span>}
                </span>
              )}
            </div>
          </div>

          <div className="rounded border border-border/40">
            <div className="flex flex-wrap border-b border-border/40">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-xs ${tab === t.id ? "bg-muted/30 font-semibold" : "text-muted-foreground hover:bg-muted/20"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-3">
              {tab === "concepts"    && <WebLcmConceptExtractorPanel concepts={result?.concepts ?? []} />}
              {tab === "chain"       && <WebLcmConceptChainPanel chain={result?.chain ?? null} />}
              {tab === "graph"       && <WebLcmConceptGraphPanel graph={result?.graph} />}
              {tab === "search"      && <WebLcmConceptSearchPanel />}
              {tab === "compression" && <WebLcmConceptCompressionPanel compression={result?.compression ?? null} />}
              {tab === "prediction"  && <WebLcmConceptPredictionPanel prediction={result?.prediction} />}
              {tab === "expansion"   && <WebLcmWebLlmBridgePanel expansion={result?.expansion} />}
              {tab === "qa"          && <WebLcmQaPanel qa={result?.qa ?? null} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
