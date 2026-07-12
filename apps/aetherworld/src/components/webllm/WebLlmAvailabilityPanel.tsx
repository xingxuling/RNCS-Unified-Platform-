import type { WebLlmAvailability } from "@/lib/webllm/webLlmAvailabilityDetector";

export function WebLlmAvailabilityPanel({ availability }: { availability: WebLlmAvailability | null }) {
  if (!availability) return <div className="border border-border/40 rounded p-3 text-sm text-muted-foreground">正在检测 WebGPU / WebLLM 可用性…</div>;
  const row = (k: string, v: string | boolean | undefined) => (
    <div className="flex items-center justify-between text-[12px] py-1 border-b border-border/20 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono">{typeof v === "boolean" ? (v ? "✓" : "—") : (v ?? "—")}</span>
    </div>
  );
  return (
    <div className="border border-border/40 rounded p-3 space-y-1">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Availability · 浏览器能力</div>
      {row("WebGPU supported", availability.webGpuSupported)}
      {row("WebLLM package", availability.webLlmPackageAvailable)}
      {row("Browser", availability.browserName)}
      {row("GPU", availability.gpuInfo)}
      {row("Capability", availability.estimatedCapability)}
      {row("Fallback", availability.fallbackMode)}
      {availability.warnings.length > 0 && (
        <ul className="mt-2 text-[11px] text-amber-300/80 space-y-1">
          {availability.warnings.map((w, i) => <li key={i}>• {w}</li>)}
        </ul>
      )}
    </div>
  );
}
