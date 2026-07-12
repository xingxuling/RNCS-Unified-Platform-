import type { CompressedTrace } from "@/lib/compression/traceCompressionEngine";

export function CompressedTraceView({ trace }: { trace: CompressedTrace }) {
  return (
    <section className="rounded-md border border-border/60 p-3 space-y-1 text-xs">
      <h3 className="uppercase tracking-wider text-muted-foreground">压缩 Trace</h3>
      <div><span className="text-muted-foreground">主引擎：</span>{trace.primaryEngine}</div>
      {trace.supportingEngines.length > 0 && (
        <div><span className="text-muted-foreground">协同：</span>{trace.supportingEngines.join(" / ")}</div>
      )}
      {trace.validationEngines.length > 0 && (
        <div><span className="text-muted-foreground">验证：</span>{trace.validationEngines.join(" / ")}</div>
      )}
      {trace.blockedEngines.length > 0 && (
        <div><span className="text-muted-foreground">被阻断：</span>{trace.blockedEngines.join(" / ")}</div>
      )}
      <div className="text-muted-foreground mt-1">{trace.traceSummary}</div>
    </section>
  );
}
