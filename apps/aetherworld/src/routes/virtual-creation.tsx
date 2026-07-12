import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { VirtualCreationInput } from "@/components/VirtualCreationInput";
import { CreationSeedCard } from "@/components/CreationSeedCard";
import { CreationFeasibilityRadar } from "@/components/CreationFeasibilityRadar";
import { CreationRiskPanel } from "@/components/CreationRiskPanel";
import { CreationDesignSimulation } from "@/components/CreationDesignSimulation";
import { CreationEvolutionRoadmap } from "@/components/CreationEvolutionRoadmap";
import { CreationReport } from "@/components/CreationReport";
import { CreationRealityBoundaryNote } from "@/components/CreationRealityBoundaryNote";
import { createBlankCreationInput, type CreationInput } from "@/lib/creationSeedCompiler";
import { runVirtualCreation } from "@/lib/virtualCreationCalculus";

export const Route = createFileRoute("/virtual-creation")({
  head: () => ({
    meta: [
      { title: "虚拟创造物计算法 · Virtual Creation Calculus" },
      { name: "description", content: "输入你想创造的东西，系统基于现实科学常数评估可行度、风险、原型路径与演化方向。" },
    ],
  }),
  component: VirtualCreationRoute,
});

function VirtualCreationRoute() {
  const [input, setInput] = useState<CreationInput>(() => createBlankCreationInput());
  const [submitted, setSubmitted] = useState<CreationInput | null>(null);

  const result = useMemo(() => (submitted ? runVirtualCreation(submitted) : null), [submitted]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Virtual Creation Calculus Engine</div>
        <h1 className="text-2xl md:text-3xl font-display gold-text">虚拟创造物计算法</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          把你想造的东西交给系统：它会根据 10 大现实科学常数域进行可行度评估，识别关键风险，给出第一原型路径与演化路线。
        </p>
      </header>

      <CreationRealityBoundaryNote />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VirtualCreationInput value={input} onChange={setInput} />
        <div className="aether-card p-5 space-y-3">
          <div className="text-sm font-medium">运行模拟</div>
          <p className="text-xs text-muted-foreground">
            输入越具体，结果越可用。系统不替代真实研发验证、医疗/法律/金融/安全评估。
          </p>
          <button
            onClick={() => setSubmitted({ ...input })}
            disabled={!input.name.trim() || !input.description.trim()}
            className="text-sm px-4 py-2 rounded bg-primary/80 hover:bg-primary text-primary-foreground disabled:opacity-40"
          >
            生成可行度报告
          </button>
          {submitted && (
            <button
              onClick={() => setSubmitted(null)}
              className="ml-2 text-xs px-3 py-1.5 rounded bg-background/60 border border-border/40"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CreationSeedCard seed={result.seed} />
            <CreationFeasibilityRadar
              scores={result.domainScores}
              viability={result.viabilityScore}
              levelName={result.feasibilityLevelName}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CreationRiskPanel risks={result.mainRisks} />
            <CreationEvolutionRoadmap roadmap={result.evolutionRoadmap} />
          </div>
          <CreationDesignSimulation
            recommendations={result.designRecommendations}
            prototypePath={result.firstPrototypePath}
            validationPlan={result.validationPlan}
          />
          <CreationReport result={result} />
        </div>
      )}
    </div>
  );
}
