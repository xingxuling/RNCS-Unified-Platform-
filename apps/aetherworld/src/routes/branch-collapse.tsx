import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BranchCollapseView } from "@/components/BranchCollapseView";
import { DEFAULT_BRANCHES, evaluateBranch, type Branch } from "@/lib/branchCollapse";
import { COLLAPSE_LAYERS, type CollapseLayerKey } from "@/constants/collapseFactors";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/branch-collapse")({ component: BranchCollapsePage });

function BranchCollapsePage() {
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [active, setActive] = useState(0);
  const evaluated = useMemo(() => branches.map(evaluateBranch), [branches]);

  const setScore = (k: CollapseLayerKey, v: number) => {
    setBranches((bs) => bs.map((b, i) => i === active ? { ...b, scores: { ...b.scores, [k]: v } } : b));
  };

  return (
    <>
      <PageHeader
        caption="Branch Collapse · 多域分支塌缩"
        title="哪条未来分支正在塌缩"
        subtitle="未来不是开放无限的；六层因子共同决定哪条分支会显化、哪条会关闭。"
      />
      <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {evaluated.map((b, i) => (
            <button key={b.id} onClick={() => setActive(i)} className={`w-full text-left ${i === active ? "ring-1 ring-primary/50 rounded-md" : ""}`}>
              <BranchCollapseView branches={[b]} />
            </button>
          ))}
        </div>
        <div className="aether-card p-5 h-fit sticky top-32">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Adjust Branch</div>
          <div className="font-display text-lg gold-text mt-1">{branches[active].name}</div>
          <div className="mt-4 space-y-3">
            {COLLAPSE_LAYERS.map((l) => {
              const v = branches[active].scores[l.key];
              return (
                <div key={l.key}>
                  <div className="flex justify-between text-xs">
                    <span>{l.name}</span>
                    <span className="font-mono text-muted-foreground">{v}</span>
                  </div>
                  <Slider min={0} max={100} step={1} value={[v]} onValueChange={(x) => setScore(l.key, x[0])} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
