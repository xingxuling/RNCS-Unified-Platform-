import { useEffect, useState } from "react";
import { CoreModelCard } from "./CoreModelCard";
import { CoreModelDeviceCheck } from "./CoreModelDeviceCheck";
import { CoreModelSkipNotice } from "./CoreModelSkipNotice";
import { CoreModelProgressPanel, type CoreModelProgressItem } from "./CoreModelProgressPanel";
import { loadFirstUseState, type FirstUseCoreModelState } from "@/lib/first-use/firstUseSetupEngine";
import { initializeWebLcm, initializeWebLkm, loadWebLlm, completeFirstUse, enterRuleMode } from "@/lib/first-use/coreModelInitializationEngine";
import { detectCoreModelStatus } from "@/lib/first-use/coreModelStatusDetector";
import { recordFirstUseEvent } from "@/lib/first-use/firstUseWorkspaceBridge";

function statusFor(s: FirstUseCoreModelState["webLlmStatus"] | FirstUseCoreModelState["webLcmStatus"] | FirstUseCoreModelState["webLkmStatus"]) {
  switch (s) {
    case "READY": return { label: "已就绪", tone: "ready" as const };
    case "FALLBACK": return { label: "降级模式", tone: "warn" as const };
    case "ERROR": return { label: "错误", tone: "error" as const };
    case "NOT_INSTALLED": return { label: "未下载", tone: "muted" as const };
    case "NOT_LOADED": return { label: "未加载", tone: "muted" as const };
    case "NOT_INITIALIZED": return { label: "未初始化", tone: "muted" as const };
    default: return { label: String(s), tone: "muted" as const };
  }
}

export function CoreModelSetupPanel({ onDone, onSkip }: { onDone?: () => void; onSkip?: () => void }) {
  const [state, setState] = useState<FirstUseCoreModelState>(loadFirstUseState());
  const [steps, setSteps] = useState<CoreModelProgressItem[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => { detectCoreModelStatus().then(setState); }, []);

  const refresh = () => setState(loadFirstUseState());

  const initAll = async () => {
    setRunning(true);
    const list: CoreModelProgressItem[] = [
      { id: "device", label: "检测设备能力", status: "running" },
      { id: "weblkm", label: "建立本地知识索引（WebLKM）", status: "pending" },
      { id: "weblcm", label: "初始化概念引擎（WebLCM）", status: "pending" },
      { id: "webllm", label: "加载本地语言模型（WebLLM）", status: "pending" },
    ];
    setSteps([...list]);
    const detected = await detectCoreModelStatus();
    list[0].status = "done"; list[0].note = detected.webGpuSupported ? "WebGPU 可用" : "WebGPU 不可用";
    list[1].status = "running"; setSteps([...list]);
    await initializeWebLkm();
    list[1].status = "done";
    list[2].status = "running"; setSteps([...list]);
    await initializeWebLcm();
    list[2].status = "done";
    if (!detected.webGpuSupported) {
      list[3].status = "skip"; list[3].note = "进入规则模式";
      setSteps([...list]);
      await enterRuleMode();
      recordFirstUseEvent("first-use:skip-webllm-no-gpu");
    } else {
      list[3].status = "running"; setSteps([...list]);
      const res = await loadWebLlm();
      list[3].status = res === "READY" ? "done" : res === "FALLBACK" ? "skip" : "error";
      setSteps([...list]);
      await completeFirstUse();
      recordFirstUseEvent("first-use:complete", { webllm: res });
    }
    refresh();
    setRunning(false);
    onDone?.();
  };

  const skip = async () => {
    await enterRuleMode();
    recordFirstUseEvent("first-use:rule-mode");
    refresh();
    onSkip?.();
  };

  const llm = statusFor(state.webLlmStatus);
  const lcm = statusFor(state.webLcmStatus);
  const lkm = statusFor(state.webLkmStatus);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-display">欢迎使用 Aetherworld</div>
        <p className="text-xs text-muted-foreground mt-1">
          你可以直接问问题，也可以让我帮你创建、检查、生成、运行。完整能力建议先初始化三个核心模型层。
        </p>
      </div>

      <CoreModelDeviceCheck />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CoreModelCard
          title="语言模型" tag="WebLLM"
          description="用于生成回答、代码、歌词、剧情和文档。"
          status={llm.label} statusTone={llm.tone}
          primaryLabel="下载 / 加载"
          onPrimary={() => loadWebLlm().then(refresh)}
          disabled={running}
        />
        <CoreModelCard
          title="概念模型" tag="WebLCM"
          description="用于抽取概念、生成概念链和压缩上下文。"
          status={lcm.label} statusTone={lcm.tone}
          primaryLabel="初始化"
          onPrimary={() => initializeWebLcm().then(refresh)}
          disabled={running}
        />
        <CoreModelCard
          title="知识模型" tag="WebLKM"
          description="用于建立本地知识索引、检索项目和管理记忆。"
          status={lkm.label} statusTone={lkm.tone}
          primaryLabel="初始化"
          onPrimary={() => initializeWebLkm().then(refresh)}
          disabled={running}
        />
      </div>

      {steps.length > 0 && (
        <div className="aether-card p-3">
          <div className="text-xs font-medium mb-2">初始化进度</div>
          <CoreModelProgressPanel items={steps} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={initAll}
          disabled={running}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
        >
          {running ? "正在初始化…" : "开始初始化"}
        </button>
        <button onClick={skip} disabled={running} className="px-4 py-2 rounded-md border border-border/40 text-sm">
          先用规则模式
        </button>
      </div>

      <CoreModelSkipNotice />
    </div>
  );
}
