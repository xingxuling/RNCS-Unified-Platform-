import type { FreeInputRunResult } from "@/lib/free-input/freeInputEngine";
import { Badge } from "@/components/ui/badge";

export function FreeInputTrace({ result }: { result: FreeInputRunResult }) {
  const { normalized, intents, route, plan } = result;
  return (
    <details className="rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs">
      <summary className="cursor-pointer text-muted-foreground">输入解析与引擎路由 · Trace</summary>
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">类型：{normalized.inputType}</Badge>
          <Badge variant="outline">语言：{normalized.detectedLanguage}</Badge>
          <Badge variant="outline">噪声：{(normalized.noiseLevel * 100).toFixed(0)}%</Badge>
          <Badge variant="outline">紧迫度：{(normalized.urgencyLevel * 100).toFixed(0)}%</Badge>
          <Badge variant="outline">主意图：{intents.primary}</Badge>
          <Badge variant="outline">置信：{(intents.confidence * 100).toFixed(0)}%</Badge>
        </div>
        {normalized.numbersOrSequences.length > 0 && (
          <div><span className="text-muted-foreground">数列：</span>{normalized.numbersOrSequences.join(" · ")}</div>
        )}
        {normalized.entities.length > 0 && (
          <div><span className="text-muted-foreground">实体：</span>{normalized.entities.join(" · ")}</div>
        )}
        <div><span className="text-muted-foreground">路由：</span>{route.primaryEngine}（{route.rationale}）</div>
        <div><span className="text-muted-foreground">协同：</span>{route.supportingEngines.join(" · ") || "—"}</div>
        <div><span className="text-muted-foreground">回答模式：</span>{plan.answerMode}</div>
        <div><span className="text-muted-foreground">可导出：</span>{plan.exportOptions.join(" / ")}</div>
      </div>
    </details>
  );
}
