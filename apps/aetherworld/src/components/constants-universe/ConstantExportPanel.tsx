import { Button } from "@/components/ui/button";
import {
  exportConstantUniverse, exportDigitConstants, exportEngineWeights,
  exportWorldConstants, exportRiskConstants, exportCompressionConstants,
  exportConstantAuditReport,
} from "@/lib/constants-universe/constantExportEngine";

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const items: { label: string; file: string; mime: string; build: () => string }[] = [
  { label: "Constant Universe JSON", file: "constant_universe.json", mime: "application/json", build: () => JSON.stringify(exportConstantUniverse(), null, 2) },
  { label: "Digit Constants JSON", file: "digit_constants.json", mime: "application/json", build: () => JSON.stringify(exportDigitConstants(), null, 2) },
  { label: "Engine Weights JSON", file: "engine_weights.json", mime: "application/json", build: () => JSON.stringify(exportEngineWeights(), null, 2) },
  { label: "World Constants JSON", file: "world_constants.json", mime: "application/json", build: () => JSON.stringify(exportWorldConstants(), null, 2) },
  { label: "Risk Constants JSON", file: "risk_constants.json", mime: "application/json", build: () => JSON.stringify(exportRiskConstants(), null, 2) },
  { label: "Compression Constants JSON", file: "compression_constants.json", mime: "application/json", build: () => JSON.stringify(exportCompressionConstants(), null, 2) },
  { label: "Constant Audit Report (MD)", file: "constant_audit_report.md", mime: "text/markdown", build: () => exportConstantAuditReport() },
];

export function ConstantExportPanel() {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">所有导出文件均包含 metadata.constantUniverseVersion 与安全声明。</p>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((it) => (
          <Button key={it.file} variant="outline" className="justify-start" onClick={() => download(it.file, it.build(), it.mime)}>
            ⬇ {it.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
