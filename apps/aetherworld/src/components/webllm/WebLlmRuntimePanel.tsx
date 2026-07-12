import { useEffect, useState } from "react";
import { detectWebLlmAvailability, type WebLlmAvailability } from "@/lib/webllm/webLlmAvailabilityDetector";
import { loadWebLlmModel, getEngineState } from "@/lib/webllm/webLlmEngineLoader";
import { DEFAULT_WEB_LLM_MODEL_ID } from "@/constants/webllm/webLlmModelPresets";
import { DEFAULT_NEURO_CONTROL_PROFILE_ID } from "@/constants/webllm/webLlmNeuroControlProfiles";
import type { WebLlmRuntimeResult } from "@/lib/webllm/aetherWebLlmRuntime";
import { WebLlmAvailabilityPanel } from "./WebLlmAvailabilityPanel";
import { WebLlmModelSelector } from "./WebLlmModelSelector";
import { WebLlmLoadProgressPanel } from "./WebLlmLoadProgressPanel";
import { WebLlmChatConsole } from "./WebLlmChatConsole";
import { WebLlmPromptPreviewPanel } from "./WebLlmPromptPreviewPanel";
import { WebLlmNeuroControlPanel } from "./WebLlmNeuroControlPanel";
import { WebLlmRunTracePanel } from "./WebLlmRunTracePanel";
import { WebLlmQaPanel } from "./WebLlmQaPanel";
import { WebLlmSafetyNote } from "./WebLlmSafetyNote";

export function WebLlmRuntimePanel() {
  const [availability, setAvailability] = useState<WebLlmAvailability | null>(null);
  const [modelId, setModelId] = useState<string>(DEFAULT_WEB_LLM_MODEL_ID);
  const [profile, setProfile] = useState<string>(DEFAULT_NEURO_CONTROL_PROFILE_ID);
  const [result, setResult] = useState<WebLlmRuntimeResult | null>(null);

  useEffect(() => { detectWebLlmAvailability().then(setAvailability); }, []);

  const loaderState = getEngineState();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="space-y-3 lg:col-span-1">
          <WebLlmAvailabilityPanel availability={availability} />
          <WebLlmModelSelector value={modelId} onChange={setModelId} />
          <div className="flex gap-2">
            <button
              onClick={() => loadWebLlmModel(modelId)}
              disabled={loaderState.status === "LOADING"}
              className="flex-1 px-3 py-1.5 text-sm rounded border border-border/40 hover:bg-muted/30"
            >
              {loaderState.status === "LOADING" ? "加载中…" : "加载模型"}
            </button>
          </div>
          <WebLlmLoadProgressPanel />
          <WebLlmNeuroControlPanel value={profile} onChange={setProfile} report={result?.neuroControl ?? null} />
          <WebLlmSafetyNote />
        </div>

        <div className="space-y-3 lg:col-span-1">
          <WebLlmChatConsole modelId={modelId} neuroProfile={profile} onResult={setResult} />
          <WebLlmPromptPreviewPanel promptPreview={result?.promptPreview} />
        </div>

        <div className="space-y-3 lg:col-span-1">
          <WebLlmRunTracePanel r={result} />
          <WebLlmQaPanel qa={result?.qa ?? null} />
          <div className="border border-border/40 rounded p-3 text-[11px] space-y-1">
            <div className="text-muted-foreground uppercase tracking-[0.2em]">Bridges · 接入</div>
            <div>Sequence AI · Digital Roles · App Runtime · Code Sandbox · Vocal · Narrative · Workspace · QA · Constitution</div>
            <div className="text-muted-foreground">所有接入均通过摘要绑定，不传 Full60 原始数列与 Founder-only 原文。</div>
          </div>
        </div>
      </div>
    </div>
  );
}
