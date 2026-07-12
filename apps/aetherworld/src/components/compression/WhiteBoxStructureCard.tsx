import type { WhiteBoxStructure } from "@/lib/compression/whiteBoxStructureExtractor";

export function WhiteBoxStructureCard({ wb }: { wb: WhiteBoxStructure }) {
  return (
    <section className="rounded-md border border-border/60 p-3 space-y-2 text-xs">
      <h3 className="uppercase tracking-wider text-muted-foreground">白箱结构</h3>
      <div><span className="text-muted-foreground">对象：</span>{wb.objectDefinition}</div>
      <div><span className="text-muted-foreground">关键变量：</span>{wb.keyVariables.join(" / ") || "—"}</div>
      <div><span className="text-muted-foreground">证据：</span>{wb.evidencePoints.join("；") || "—"}</div>
      <div><span className="text-muted-foreground">知识来源：</span>{wb.knowledgeSources.join("；") || "—"}</div>
      <div><span className="text-muted-foreground">风险：</span>{wb.riskFactors.join("；") || "—"}</div>
      <div><span className="text-muted-foreground">回验点：</span>{wb.validationPoints.join("；") || "—"}</div>
    </section>
  );
}
