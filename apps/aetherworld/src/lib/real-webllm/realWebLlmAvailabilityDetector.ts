// 检测 WebGPU 与 @mlc-ai/web-llm 是否可用
export interface RealWebLlmAvailability {
  webGpuSupported: boolean;
  webLlmPackageAvailable: boolean;
  adapterReady: boolean;
  message: string;
  fallback: boolean;
}

export async function detectRealWebLlmAvailability(): Promise<RealWebLlmAvailability> {
  let packageAvailable = false;
  try {
    await import("@mlc-ai/web-llm");
    packageAvailable = true;
  } catch {
    packageAvailable = false;
  }

  const hasGpu = typeof navigator !== "undefined" && !!(navigator as any).gpu;
  let adapterReady = false;
  if (hasGpu) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      adapterReady = !!adapter;
    } catch {
      adapterReady = false;
    }
  }

  if (!packageAvailable) {
    return {
      webGpuSupported: hasGpu,
      webLlmPackageAvailable: false,
      adapterReady,
      message: "未检测到 @mlc-ai/web-llm，请先安装依赖。",
      fallback: true,
    };
  }
  if (!hasGpu) {
    return {
      webGpuSupported: false,
      webLlmPackageAvailable: true,
      adapterReady: false,
      message: "当前浏览器不支持 WebGPU，已切换为规则模式。",
      fallback: true,
    };
  }
  if (!adapterReady) {
    return {
      webGpuSupported: true,
      webLlmPackageAvailable: true,
      adapterReady: false,
      message: "未能获取 GPU 适配器，可能没有可用显卡。已切换为规则模式。",
      fallback: true,
    };
  }
  return {
    webGpuSupported: true,
    webLlmPackageAvailable: true,
    adapterReady: true,
    message: "当前浏览器支持 WebGPU，可以运行真实 WebLLM。",
    fallback: false,
  };
}
