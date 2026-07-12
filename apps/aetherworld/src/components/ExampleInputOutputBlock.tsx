import { ExampleCopyButton } from "./ExampleCopyButton";
import type { UsageExample } from "@/lib/usageExampleCalculus";

export function ExampleInputOutputBlock({ example }: { example: UsageExample }) {
  return (
    <div className="space-y-3">
      <div className="aether-card p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">用户可以怎么问</div>
          <ExampleCopyButton text={example.exampleInput} />
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{example.exampleInput}</div>
      </div>
      <div className="aether-card p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">系统会怎么答（摘要）</div>
        <div className="text-sm leading-relaxed text-foreground/90">{example.exampleOutputSummary}</div>
        {example.exampleOutputDetailed && (
          <div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{example.exampleOutputDetailed}</div>
        )}
      </div>
    </div>
  );
}
