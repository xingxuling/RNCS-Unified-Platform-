import { Link } from "@tanstack/react-router";
import { getScenario } from "@/constants/exampleScenarioTypes";
import { getModuleGuide } from "@/constants/exampleModuleTypes";
import { ExampleCopyButton } from "./ExampleCopyButton";
import type { UsageExample } from "@/lib/usageExampleCalculus";
import { ArrowRight } from "lucide-react";

export function ExampleScenarioCard({ example, onOpen }: { example: UsageExample; onOpen?: (e: UsageExample) => void }) {
  const scenario = getScenario(example.scenarioType);
  const mod = getModuleGuide(example.moduleId);
  return (
    <div className="aether-card-elevated p-4 hover:border-primary/40 transition flex flex-col gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {scenario?.title ?? example.scenarioType} · {mod?.moduleName ?? example.moduleId}
        </div>
        <div className="font-display text-base mt-1">{example.title}</div>
        <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{example.exampleInput}</div>
      </div>
      <div className="text-[11px] text-foreground/80 line-clamp-2">{example.exampleOutputSummary}</div>
      <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
        <ExampleCopyButton text={example.exampleInput} label="复制问题" />
        <div className="flex items-center gap-2">
          {onOpen && (
            <button
              onClick={() => onOpen(example)}
              className="text-[11px] px-2 py-1 rounded border border-border/60 hover:border-primary/40"
            >
              查看
            </button>
          )}
          {mod?.route && (
            <Link
              to={mod.route}
              className="text-[11px] px-2 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1"
            >
              用这个开始 <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
