export interface DownloadPlanStep { id: string; label: string; estimate: string; }

export function planCoreModelDownload(opts: { webGpuSupported: boolean }) {
  const steps: DownloadPlanStep[] = [
    { id: "device", label: "检测设备能力", estimate: "<1s" },
    { id: "weblkm", label: "建立本地知识索引（WebLKM）", estimate: "1-3s" },
    { id: "weblcm", label: "初始化概念引擎（WebLCM）", estimate: "1-3s" },
    {
      id: "webllm",
      label: opts.webGpuSupported ? "加载本地语言模型（WebLLM）" : "WebLLM 不可用，进入规则模式",
      estimate: opts.webGpuSupported ? "30s-3min" : "—",
    },
  ];
  return { steps, requiresGpu: !opts.webGpuSupported };
}
