import type { GeneratedQuest } from "@/lib/questGenerationEngine";
import { STAGE_LABEL } from "@/constants/questTypes";

export function QuestBoard({ quests, limit }: { quests: GeneratedQuest[]; limit?: number }) {
  const list = limit ? quests.slice(0, limit) : quests;
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Quest Board · 任务板</div>
      <div className="mt-3 space-y-2">
        {list.map(q => (
          <div key={q.id} className="aether-card p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">{q.title}</div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">{q.questType}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-3">
              <span>阶段：{STAGE_LABEL[q.stage]}</span>
              <span>难度 {q.difficulty}</span>
              <span>紧急 {q.urgency}</span>
              <span>奖励：{q.rewardType}</span>
            </div>
            <p className="text-xs text-foreground/90 mt-2 leading-snug">{q.objective}</p>
            <div className="text-[11px] text-primary/85 mt-1">建议行动：{q.recommendedAction}</div>
            <div className="text-[10px] text-muted-foreground mt-1">回验：{q.validationMethod} · 风险：{q.failureRisk}</div>
          </div>
        ))}
        {list.length === 0 && <div className="text-xs text-muted-foreground">暂无任务。</div>}
      </div>
    </div>
  );
}
