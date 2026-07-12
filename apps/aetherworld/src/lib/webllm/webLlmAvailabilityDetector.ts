import type { WebLlmFallbackModeId } from "@/constants/webllm/webLlmFallbackModes";

export interface WebLlmAvailability {
  webGpuSupported: boolean;
  webLlmPackageAvailable: boolean;
  browserName?: string;
  gpuInfo?: string;
  estimatedCapability: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  warnings: string[];
  fallbackMode: WebLlmFallbackModeId;
}

function detectBrowser(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const ua = navigator.userAgent || "";
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Unknown";
}

async function tryLoadPackage(): Promise<boolean> {
  try {
    // Optional dynamic import — package may not be installed.
    // Use indirect specifier so Rollup does not try to resolve it at build time.
    const mod = ["@mlc-ai/", "web-llm"].join("");
    // @ts-ignore
    await import(/* @vite-ignore */ mod);
    return true;
  } catch {
    return false;
  }
}

export async function detectWebLlmAvailability(): Promise<WebLlmAvailability> {
  const warnings: string[] = [];
  const hasNav = typeof navigator !== "undefined";
  // @ts-ignore
  const webGpuSupported = hasNav && !!(navigator as any).gpu;
  if (!webGpuSupported) warnings.push("当前浏览器未检测到 WebGPU。");
  const webLlmPackageAvailable = await tryLoadPackage();
  if (!webLlmPackageAvailable) warnings.push("WebLLM package 尚未安装：@mlc-ai/web-llm。");

  let estimatedCapability: WebLlmAvailability["estimatedCapability"] = "UNKNOWN";
  if (webGpuSupported && webLlmPackageAvailable) estimatedCapability = "MEDIUM";
  else if (webGpuSupported) estimatedCapability = "LOW";

  const fallbackMode: WebLlmFallbackModeId =
    !webGpuSupported ? "NO_WEBGPU" :
    !webLlmPackageAvailable ? "RULE_ONLY" :
    "NONE";

  return {
    webGpuSupported,
    webLlmPackageAvailable,
    browserName: detectBrowser(),
    gpuInfo: webGpuSupported ? "WebGPU adapter available" : undefined,
    estimatedCapability,
    warnings,
    fallbackMode,
  };
}

export function availabilitySync(): WebLlmAvailability {
  const hasNav = typeof navigator !== "undefined";
  // @ts-ignore
  const webGpuSupported = hasNav && !!(navigator as any).gpu;
  return {
    webGpuSupported,
    webLlmPackageAvailable: false,
    browserName: detectBrowser(),
    estimatedCapability: webGpuSupported ? "LOW" : "UNKNOWN",
    warnings: webGpuSupported ? ["WebLLM package 检测需异步进行，UI 将在加载完成后更新。"] : ["WebGPU 不可用。"],
    fallbackMode: webGpuSupported ? "RULE_ONLY" : "NO_WEBGPU",
  };
}
