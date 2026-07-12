// /system/layer-audit · 分层审计工作台
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { runLayerAudit } from "@/lib/layer-audit/layerAuditRuntime";
import { buildLovablePromptDraft } from "@/lib/layer-audit/layerCompletionPlanner";
import type { LayerAspect, LayerCompletionAction } from "@/lib/layer-audit/layerAuditTypes";

export const Route = createFileRoute("/system/layer-audit")({
  head: () => ({
    meta: [
      { title: "分层审计 · Aetherworld" },
      { name: "description", content: "按 L0-L10 与骨架/肌肉/血液/神经四象，审计 Aetherworld 系统级缺口。" },
    ],
  }),
  component: LayerAuditPage,
});

const ASPECT_LABEL: Record<LayerAspect, string> = {
  SKELETON: "骨架",
  MUSCLE: "肌肉",
  BLOOD: "血液",
  NERVE: "神经",
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: "border-rose-500/40 text-rose-500",
  P1: "border-amber-500/40 text-amber-500",
  P2: "border-sky-500/40 text-sky-500",
  P3: "border-border/60 text-muted-foreground",
};

function ScorePill({ value }: { value: number }) {
  const tone =
    value >= 80 ? "border-emerald-500/40 text-emerald-500" :
    value >= 65 ? "border-sky-500/40 text-sky-500" :
    value >= 50 ? "border-amber-500/40 text-amber-500" :
                  "border-rose-500/40 text-rose-500";
  return (
    <span className={`inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full border ${tone}`}>
      {value}
    </span>
  );
}

function LayerAuditPage() {
  const report = useMemo(() => runLayerAudit(), []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");

  const avg = report.layers.length
    ? Math.round(report.layers.reduce((s, i) => s + i.maturityScore, 0) / report.layers.length)
    : 0;

  const fourQuadrants: { aspect: LayerAspect; items: string[] }[] = [
    { aspect: "SKELETON", items: report.globalMissingSkeleton },
    { aspect: "MUSCLE", items: report.globalMissingMuscle },
    { aspect: "BLOOD", items: report.globalMissingBlood },
    { aspect: "NERVE", items: report.globalMissingNerve },
  ];

  const handleDraft = (a: LayerCompletionAction) => {
    setDraft(buildLovablePromptDraft(a));
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">System · Layer Audit</div>
        <h1 className="text-2xl font-semibold text-foreground">分层审计</h1>
        <p className="text-sm text-muted-foreground">
          按 L0-L10 与骨架 / 肌肉 / 血液 / 神经四象，识别 Aetherworld 当前系统级缺口与补齐计划。
        </p>
      </header>

      {/* 总览 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="层数" value={report.layers.length} />
        <Stat label="平均成熟度" value={`${avg} / 100`} />
        <Stat label="P0 缺口" value={report.p0CompletionPlan.length} />
        <Stat label="P1 缺口" value={report.p1CompletionPlan.length} />
        <Stat label="缺骨架" value={report.globalMissingSkeleton.length} />
        <Stat label="缺肌肉" value={report.globalMissingMuscle.length} />
        <Stat label="缺血液" value={report.globalMissingBlood.length} />
        <Stat label="缺神经" value={report.globalMissingNerve.length} />
      </section>

      {/* 分层列表 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-foreground/90">分层列表</h2>
        <div className="rounded-xl border border-border/40 divide-y divide-border/40 bg-card/40">
          {report.layers.map((it) => (
            <div key={it.layerId} className="px-4 py-3 space-y-2">
              <button
                onClick={() => setExpanded(expanded === it.layerId ? null : it.layerId)}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
                    {it.layerId}
                  </span>
                  <span className="text-sm text-foreground/90 truncate">{it.layerName}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">成熟度</span>
                  <ScorePill value={it.maturityScore} />
                  <span className="text-[10px] text-muted-foreground ml-2">骨</span>
                  <ScorePill value={it.skeleton.score} />
                  <span className="text-[10px] text-muted-foreground">肌</span>
                  <ScorePill value={it.muscle.score} />
                  <span className="text-[10px] text-muted-foreground">血</span>
                  <ScorePill value={it.blood.score} />
                  <span className="text-[10px] text-muted-foreground">神</span>
                  <ScorePill value={it.nerve.score} />
                </div>
              </button>

              {expanded === it.layerId && (
                <div className="space-y-3 pt-2 pl-2 border-l border-border/40">
                  {(["skeleton", "muscle", "blood", "nerve"] as const).map((k) => {
                    const status = it[k];
                    const aspectKey: LayerAspect =
                      k === "skeleton" ? "SKELETON" : k === "muscle" ? "MUSCLE" : k === "blood" ? "BLOOD" : "NERVE";
                    return (
                      <div key={k} className="text-xs space-y-1">
                        <div className="text-[11px] text-muted-foreground">
                          {ASPECT_LABEL[aspectKey]} · {status.score}/100 · {status.notes}
                        </div>
                        {status.existing.length > 0 && (
                          <div className="text-foreground/80">
                            <span className="text-muted-foreground">已有：</span>{status.existing.join("、")}
                          </div>
                        )}
                        {status.missing.length > 0 && (
                          <div className="text-rose-300/90">
                            <span className="text-muted-foreground">缺：</span>{status.missing.join("、")}
                          </div>
                        )}
                        {status.duplicated.length > 0 && (
                          <div className="text-amber-300/90">
                            <span className="text-muted-foreground">重复：</span>{status.duplicated.join("、")}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {it.risks.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      风险：<span className="text-foreground/80">{it.risks.join("；")}</span>
                    </div>
                  )}

                  {it.recommendedActions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-muted-foreground">建议动作</div>
                      {it.recommendedActions.map((a) => (
                        <div key={a.id} className="rounded-md border border-border/40 bg-muted/10 p-2 text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-foreground/90">{a.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${PRIORITY_COLOR[a.priority]}`}>
                              {a.priority} · {ASPECT_LABEL[a.aspect]}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{a.description}</div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[10px] text-muted-foreground">建议文件：{a.suggestedFiles.join("、")}</div>
                            <button
                              onClick={() => handleDraft(a)}
                              className="text-[10px] px-2 py-0.5 rounded border border-border/60 text-muted-foreground hover:text-foreground"
                            >
                              生成提示词草案
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 四象视图 */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-foreground/90">四象视图（全局缺口）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fourQuadrants.map(({ aspect, items }) => (
            <div key={aspect} className="rounded-xl border border-border/40 bg-card/40 p-3 space-y-1.5">
              <div className="text-xs text-muted-foreground">{ASPECT_LABEL[aspect]} · 共 {items.length} 项</div>
              {items.length === 0 ? (
                <div className="text-[11px] text-muted-foreground">无缺口</div>
              ) : (
                <ul className="text-[11px] text-foreground/80 space-y-0.5 list-disc pl-4">
                  {items.slice(0, 12).map((s, i) => (<li key={i}>{s}</li>))}
                  {items.length > 12 && (
                    <li className="text-muted-foreground">…还有 {items.length - 12} 项</li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Completion Plan */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-foreground/90">Completion Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PlanColumn title="P0 补齐动作" actions={report.p0CompletionPlan} onDraft={handleDraft} />
          <PlanColumn title="P1 补齐动作" actions={report.p1CompletionPlan} onDraft={handleDraft} />
        </div>
      </section>

      {/* 提示词草案 */}
      {draft && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground/90">Lovable 提示词草案</h2>
          <pre className="rounded-xl border border-border/40 bg-muted/20 p-3 text-[11px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
{draft}
          </pre>
          <button
            onClick={() => { void navigator.clipboard?.writeText(draft); }}
            className="text-[11px] px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground"
          >
            复制到剪贴板
          </button>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg text-foreground/90">{value}</div>
    </div>
  );
}

function PlanColumn({
  title, actions, onDraft,
}: {
  title: string;
  actions: LayerCompletionAction[];
  onDraft: (a: LayerCompletionAction) => void;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-3 space-y-2">
      <div className="text-xs text-muted-foreground">{title} · {actions.length} 项</div>
      {actions.length === 0 ? (
        <div className="text-[11px] text-muted-foreground">无</div>
      ) : (
        <ul className="space-y-1.5">
          {actions.map((a) => (
            <li key={a.id} className="rounded-md border border-border/40 bg-muted/10 p-2 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-foreground/90">{a.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${PRIORITY_COLOR[a.priority]}`}>
                  {a.priority} · {ASPECT_LABEL[a.aspect]}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">{a.description}</div>
              <button
                onClick={() => onDraft(a)}
                className="text-[10px] px-2 py-0.5 rounded border border-border/60 text-muted-foreground hover:text-foreground"
              >
                生成提示词
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
