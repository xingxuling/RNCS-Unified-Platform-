// 训练工厂计算法 · 结果卡
import type { ChatTrainingFactoryCalculusInfo } from "@/lib/training-factory/trainingFactoryChatBridge";

interface Props {
  info: ChatTrainingFactoryCalculusInfo;
}

export function ChatTrainingFactoryCalculusCard({ info }: Props) {
  const { report, focus } = info;

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          训练工厂计算法 · Training Factory Calculus
        </div>
        <a
          href="/system/training-factory-calculus"
          className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
        >
          打开工坊
        </a>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-500">
          焦点 · {info.focusLabel}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          15 步流程
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          四象补法
        </span>
      </div>

      <div className="text-sm text-foreground/90">{info.summary}</div>

      {focus === "FLOW" && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-muted-foreground">流程清单</div>
          <ol className="text-[11px] text-foreground/85 space-y-0.5 list-decimal list-inside">
            {report.calculusFlow.map((s) => (
              <li key={s.id}>
                <span className="text-foreground/90">{s.name}</span>
                <span className="text-muted-foreground"> — {s.description}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {focus === "QUADRANT" && (
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          {report.quadrants
            .filter((q) =>
              info.highlightedQuadrant ? q.quadrant === info.highlightedQuadrant : true,
            )
            .map((q) => (
              <div
                key={q.quadrant}
                className="rounded-md border border-border/40 bg-muted/10 p-2"
              >
                <div className="text-muted-foreground mb-1">{q.label}</div>
                <ul className="text-foreground/85 space-y-0.5">
                  {q.items.map((it) => (
                    <li key={it.id}>
                      · {it.name}
                      <span className="text-muted-foreground"> — {it.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}

      {focus === "RECURSIVE" && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">递归自举</div>
          {report.recursivePlan.map((s) => (
            <div
              key={s.bloodlineStageId}
              className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px]"
            >
              <div className="text-foreground/90">
                {s.modelName} → 反哺：{s.feedbackTargets.join("、")}
              </div>
              <div className="text-muted-foreground text-[10px]">
                能力：{s.feedbackCapabilities.join("、")}
              </div>
            </div>
          ))}
        </div>
      )}

      {focus === "COST" && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">成本样例</div>
          {report.costSamples.map((c) => (
            <div
              key={c.experimentId}
              className="rounded-md border border-border/40 bg-muted/10 p-2 text-[10px] space-y-0.5"
            >
              <div className="text-foreground/90">
                {c.experimentId} · 推荐：
                {c.recommendedForgeMode === "GPU_SERVER" ? "服务器" : "本机"}
              </div>
              <div className="text-muted-foreground">
                金钱 ≈ ¥{c.moneyCost} · 时间 {c.timeCost}h · 注意力 {c.attentionCost}/10 ·
                风险 {c.riskCost}/10 · 血统价值 {c.bloodlineValue}/10
              </div>
            </div>
          ))}
        </div>
      )}

      {focus === "WEIGHT" && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">数据权重样例</div>
          {report.weightSamples.map((w) => (
            <div
              key={w.sampleSource}
              className="rounded-md border border-border/40 bg-muted/10 p-2 text-[10px] flex items-center justify-between gap-2"
            >
              <span className="text-foreground/90">{w.sampleSource}</span>
              <span className="text-muted-foreground">
                weight = {w.datasetWeight} · 安全 {w.safetyStatus}
              </span>
            </div>
          ))}
        </div>
      )}

      {focus === "NEXT_GENERATION" && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">下一代计划</div>
          {report.nextGenerationPlans.map((p) => (
            <div
              key={`${p.fromBloodlineStageId}-${p.toBloodlineStageId}`}
              className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px]"
            >
              <div className="text-foreground/90">
                {p.fromBloodlineStageId} → {p.toBloodlineStageId}
              </div>
              <div className="text-muted-foreground text-[10px]">
                依据：{p.reason} · 预计：{p.estimatedCalendar}
              </div>
              <div className="text-muted-foreground text-[10px]">
                依赖：{p.dependsOn.join("、")}
              </div>
            </div>
          ))}
        </div>
      )}

      {focus === "FORGE_ASSIGN" && (
        <div className="text-[11px] text-foreground/85 space-y-1">
          <div>本机慢跑：Tokenizer / 10M / 50M / 100M / LoRA / QLoRA。</div>
          <div>服务器爆发：300M / 700M / 1.5B / 3B / 7B。</div>
          <div className="text-muted-foreground">
            分配标准 = 参数规模 + 训练时长 + 注意力切换 + 血统关键性。
          </div>
        </div>
      )}

      {focus === "OVERVIEW" && (
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="rounded-md border border-border/40 bg-muted/10 p-2">
            <div className="text-muted-foreground">流程</div>
            <div className="text-foreground/90">{report.calculusFlow.length} 步</div>
          </div>
          <div className="rounded-md border border-border/40 bg-muted/10 p-2">
            <div className="text-muted-foreground">血统线</div>
            <div className="text-foreground/90">{report.bloodline.length} 级</div>
          </div>
          <div className="rounded-md border border-border/40 bg-muted/10 p-2">
            <div className="text-muted-foreground">数据集草案</div>
            <div className="text-foreground/90">{report.datasetVersions.length} 套</div>
          </div>
          <div className="rounded-md border border-border/40 bg-muted/10 p-2">
            <div className="text-muted-foreground">训练实验</div>
            <div className="text-foreground/90">{report.experiments.length} 项</div>
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground">
        说明：Aetherworld 不会自动执行训练 / 上传数据 / 调外部服务器。一切训练由用户在本机或服务器手动启动。
      </div>
    </div>
  );
}
