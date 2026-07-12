// 项目融合结果卡片
import type { ChatProjectFusionInfo } from "@/lib/project-fusion/projectFusionChatBridge";

interface Props {
  info: ChatProjectFusionInfo;
}

const RISK_COLOR: Record<string, string> = {
  LOW: "border-emerald-500/40 text-emerald-500",
  MEDIUM: "border-amber-500/40 text-amber-500",
  HIGH: "border-rose-500/40 text-rose-500",
};

export function ChatProjectFusionCard({ info }: Props) {
  const { report, savedLovablePassReport: saved } = info;
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          项目融合 · 同账号
        </div>
        <div className="flex gap-1.5">
          <a
            href="/system/lovable-pass"
            className="text-[10px] px-2 py-0.5 rounded-full border border-sky-500/50 text-sky-500 hover:bg-sky-500/10"
          >
            查看开发期报告
          </a>
          <a
            href="/system/project-fusion"
            className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
          >
            打开离线工作台
          </a>
        </div>
      </div>

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-200/90 leading-relaxed">
        {info.runtimeDisclaimer}
      </div>

      <div className="text-sm text-foreground/90">{info.summary}</div>

      {saved && (
        <div className="rounded-md border border-border/40 bg-muted/10 p-2 space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Lovable 开发期保存的报告（{saved.generatedAt}）
          </div>
          <div className="text-[11px] text-muted-foreground">
            可访问 {saved.totalAccessibleProjects} · 深读 {saved.deepReadSampleCount} · 高价值 {saved.highValueProjects.length} · 计划 {saved.fusionPlans.length}
          </div>
          <div className="space-y-1">
            {saved.highValueProjects.slice(0, 5).map((p) => (
              <div key={p.projectId} className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-[11px] text-foreground/85">{p.projectName}</div>
                <div className="flex gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${RISK_COLOR[p.riskLevel] ?? "border-border/60 text-muted-foreground"}`}>
                    {p.riskLevel}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                    {p.recommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            基于你登记的候选额外生成（离线 · 不代表已扫描账号）
          </div>
          {report.candidates.map((c, i) => {
            const plan = report.plans[i];
            return (
              <div
                key={c.id}
                className="rounded-md border border-border/40 bg-muted/10 p-2 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs font-medium text-foreground/90">{c.projectName}</div>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                      {c.projectType}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                        RISK_COLOR[c.riskLevel] ?? "border-border/60 text-muted-foreground"
                      }`}
                    >
                      {c.riskLevel}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-sky-500/40 text-sky-500">
                      {plan.fusionType}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  目标：{plan.targetSystems.join(" / ")}
                </div>
                {plan.conflicts.length > 0 && (
                  <div className="text-[11px] text-amber-500">
                    冲突：{plan.conflicts.length} 条（详见工作台）
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground">
                  建议：{c.fusionRecommendation} · 优先级 {plan.recommendedPriority}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {info.warnings.length > 0 && (
        <div className="text-[11px] text-amber-500 space-y-0.5">
          {info.warnings.map((w, i) => (
            <div key={i}>· {w}</div>
          ))}
        </div>
      )}

      <div className="text-[10px] text-muted-foreground">
        说明：本卡片仅消费开发期已保存的报告 + 你的显式登记，不在运行时扫描你的 Lovable 账号。
      </div>
    </div>
  );
}
