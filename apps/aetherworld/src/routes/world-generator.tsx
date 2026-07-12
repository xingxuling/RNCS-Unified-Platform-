import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { WORLD_GENERATION_MODES, getWorldMode } from "@/constants/worldGenerationModes";
import { WORLD_NARRATIVE_STYLES } from "@/constants/worldNarrativeStyles";
import { useFounderState } from "@/hooks/useFounderState";
import { getSequenceMode } from "@/lib/realSubjectStore";
import { WorldGenerationSafetyNote } from "@/components/WorldGenerationSafetyNote";
import { Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/world-generator")({
  head: () => ({
    meta: [
      { title: "宇宙世界生成模型体验 · Aether Fate Engine" },
      { name: "description", content: "把你的主体结构生成一个可阅读、可视化、可保存的个人世界模型。" },
    ],
  }),
  component: WorldGeneratorPage,
});

function WorldGeneratorPage() {
  const { active: founderActive } = useFounderState();
  const navigate = useNavigate();
  const subjectMode = typeof window !== "undefined" ? getSequenceMode() : "DEMO";

  const modes = useMemo(
    () => WORLD_GENERATION_MODES.filter(m => !m.founderOnly || founderActive),
    [founderActive]
  );
  const [modeId, setModeId] = useState(modes[0].id);
  const [styleId, setStyleId] = useState("friendly");

  const mode = getWorldMode(modeId);
  const fullBlocked = mode.subjectModeRequired === "FULL_60" && subjectMode !== "FULL_60";

  const start = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("aether.personalWorld.input.v1", JSON.stringify({
        subjectMode, selectedMode: modeId, narrativeStyle: styleId,
      }));
    }
    navigate({ to: "/personal-world" });
  };

  return (
    <>
      <PageHeader caption="World Generator · 宇宙世界生成模型"
        title="生成你的个人世界"
        subtitle="选择一种生成模式与叙事风格，把你的主体结构转化为一个象征性个人世界。" />
      <div className="p-6 md:p-10 space-y-6 max-w-6xl">
        <WorldGenerationSafetyNote mode={mode.name} privacyNote={mode.privacyNote} />

        <section>
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Generation Mode · 生成模式</div>
            <h2 className="font-display text-xl">选择一种生成模式</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {modes.map(m => {
              const active = m.id === modeId;
              return (
                <button key={m.id} onClick={() => setModeId(m.id)}
                  className={`text-left aether-card p-4 transition ${active ? "border-primary/60 bg-primary/5" : "hover:border-primary/30"}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-display text-base">{m.name}</div>
                    {m.founderOnly && <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-400">Founder</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground tracking-wider mt-0.5">{m.en}</div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{m.description}</p>
                  <div className="mt-2 text-[11px] text-foreground/80">推荐：{m.recommendedFor}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Narrative Style · 叙事风格</div>
            <h2 className="font-display text-xl">报告语言风格</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {WORLD_NARRATIVE_STYLES.map(s => {
              const active = s.id === styleId;
              return (
                <button key={s.id} onClick={() => setStyleId(s.id)}
                  className={`px-3 py-1.5 rounded-md border text-xs transition ${active ? "border-primary/60 bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                  {s.name}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {WORLD_NARRATIVE_STYLES.find(s => s.id === styleId)?.tone}
          </p>
        </section>

        {fullBlocked && (
          <div className="aether-card p-4 border-l-2 border-amber-500/60 text-sm text-amber-400/90">
            深度个人世界需要 Full 60 主体数列。请先在「我的深度模型」中导入完整数列，或选择其他模式。
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={start} disabled={fullBlocked}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <Sparkles className="w-4 h-4" /> 开始生成 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
