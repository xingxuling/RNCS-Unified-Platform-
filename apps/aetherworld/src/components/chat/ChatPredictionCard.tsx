// 数列预测结果卡（折叠式，嵌入 ChatAnswerCard）
import { useState } from "react";
import { toast } from "sonner";
import type { SequencePredictionResult } from "@/lib/sequence-prediction/sequencePredictionTypes";
import { bandLabel } from "@/lib/sequence-prediction/sequenceProbabilityEstimator";

interface Props {
  prediction: SequencePredictionResult;
}

const TARGET_LABEL: Record<string, string> = {
  PROJECT: "项目", APP: "应用", CODE_TASK: "代码任务",
  WORLD_OBJECT: "世界对象", MUSIC_OBJECT: "音乐对象",
  SOCIAL_POST: "社交发布", CALENDAR_TASK: "日历任务",
  MODEL_PROVIDER: "模型 Provider", STORE_PACKAGE: "能力包",
  WORKSPACE_OBJECT: "工作区对象", PERSON: "人物",
  RELATIONSHIP: "关系", ORGANIZATION: "组织",
  MARKET: "市场", CUSTOM: "自定义",
};

const PERMISSION_LABEL: Record<string, string> = {
  ALLOW: "可推进", WAIT: "需等待", BLOCK: "禁止推进",
  WATCH: "持续观察", REVIEW: "需复查", ESCALATE: "升级处理",
};

const PERMISSION_TONE: Record<string, string> = {
  ALLOW: "text-emerald-500",
  WAIT: "text-amber-500",
  BLOCK: "text-rose-500",
  WATCH: "text-sky-500",
  REVIEW: "text-amber-500",
  ESCALATE: "text-rose-500",
};

export function ChatPredictionCard({ prediction }: Props) {
  const [open, setOpen] = useState(true);
  const targetText = TARGET_LABEL[prediction.targetType] ?? prediction.targetType;

  const handleCreateReminder = (label: string) => {
    toast.info(`复查提醒草案：${label}`, {
      description: "已生成提醒草案，请前往日历完成确认。",
    });
  };

  const handleSaveReport = () => {
    toast.info("已生成预测报告草案", {
      description: "预测报告将保存为 Workspace PREDICTION_REPORT，需人工确认。",
    });
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2 text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80">
            数列预测结果
          </span>
          <span className="font-medium text-foreground">{targetText}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono">{prediction.currentSequenceState}</span>
          <span className="text-muted-foreground">·</span>
          <span className={PERMISSION_TONE[prediction.actionPermission.status]}>
            {PERMISSION_LABEL[prediction.actionPermission.status]}
          </span>
          <span className="text-muted-foreground">·</span>
          <span>可信度 {(prediction.confidence * 100).toFixed(0)}%</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{open ? "收起" : "展开"}</span>
      </button>

      {open && (
        <div className="space-y-2.5 pt-1 border-t border-border/40">
          {/* 五域状态 */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              五域状态
            </div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {(["heaven","earth","human","spirit","wind"] as const).map((k) => {
                const v = prediction.fiveDomainState[k];
                const label = { heaven: "天", earth: "地", human: "人", spirit: "神", wind: "风" }[k];
                return (
                  <div key={k} className="rounded border border-border/40 bg-muted/20 py-1">
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                    <div className="font-mono text-sm">{v}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 变量摘要 */}
          <details className="rounded border border-border/40 bg-muted/20 px-2 py-1.5">
            <summary className="cursor-pointer text-[11px] hover:text-foreground">
              变量（不变 {prediction.variables.invariants.length} · 动态 {prediction.variables.dynamicVariables.length} · 风险 {prediction.variables.riskVariables.length} · 窗口 {prediction.variables.windowVariables.length} · 跃迁 {prediction.variables.leapVariables.length}）
            </summary>
            <div className="mt-1.5 space-y-1 text-[10px]">
              {([
                ["不变量", prediction.variables.invariants],
                ["动态变量", prediction.variables.dynamicVariables],
                ["乘法变量", prediction.variables.multiplierVariables],
                ["除法变量", prediction.variables.divisorVariables],
                ["风险变量", prediction.variables.riskVariables],
                ["窗口变量", prediction.variables.windowVariables],
                ["跃迁变量", prediction.variables.leapVariables],
              ] as const).map(([k, arr]) => arr.length > 0 && (
                <div key={k}>
                  <span className="text-muted-foreground">{k}：</span>
                  <span>{arr.join(" · ")}</span>
                </div>
              ))}
            </div>
          </details>

          {/* 未来轨迹 */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              未来轨迹（共 {prediction.trajectories.length} 条）
            </div>
            {prediction.trajectories.map((t) => (
              <div key={t.id} className="rounded border border-border/40 bg-background/40 p-2 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-medium text-[11px]">{t.label}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-[10px]">{bandLabel(t.probabilityBand)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">{t.probabilityRange}</span>
                  {t.nextSequenceState && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-mono text-[10px]">→ {t.nextSequenceState}</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-foreground/80">{t.description}</div>
                {t.risks.length > 0 && (
                  <div className="text-[10px] text-amber-500/80">风险：{t.risks.join(" · ")}</div>
                )}
                {t.opportunities.length > 0 && (
                  <div className="text-[10px] text-emerald-500/80">机会：{t.opportunities.join(" · ")}</div>
                )}
                {t.suggestedActions.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">建议：{t.suggestedActions.join(" · ")}</div>
                )}
              </div>
            ))}
          </div>

          {/* 行动许可 */}
          <div className="rounded border border-border/40 bg-background/40 p-2 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                行动许可
              </span>
              <span className={`text-[11px] font-medium ${PERMISSION_TONE[prediction.actionPermission.status]}`}>
                {PERMISSION_LABEL[prediction.actionPermission.status]}
              </span>
            </div>
            <div className="text-[10px] text-foreground/80">{prediction.actionPermission.reason}</div>
            {prediction.actionPermission.allowedActions.length > 0 && (
              <div className="text-[10px] text-emerald-500/80">
                允许：{prediction.actionPermission.allowedActions.join(" · ")}
              </div>
            )}
            {prediction.actionPermission.blockedActions.length > 0 && (
              <div className="text-[10px] text-rose-500/80">
                禁止：{prediction.actionPermission.blockedActions.join(" · ")}
              </div>
            )}
          </div>

          {/* 复查节点 */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              复查节点
            </div>
            <div className="space-y-1">
              {prediction.reviewNodes.map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-2 rounded border border-border/40 px-2 py-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px]">{n.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{n.suggestedDateOffset} · {n.reason}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateReminder(n.label)}
                    className="text-[10px] px-2 py-0.5 rounded border border-border/60 hover:border-border hover:text-foreground text-muted-foreground whitespace-nowrap"
                  >
                    创建提醒
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 参考摘要 */}
          <div className="text-[10px] text-muted-foreground">
            已参考：数列记忆 {prediction.referenceSummary.memoryUnits} 条 ·
            MSL 状态帧 {prediction.referenceSummary.mslFrames} 条 ·
            价值账本事件 {prediction.referenceSummary.valueEvents} 条 ·
            融合 {prediction.referenceSummary.fusionUsed ? "已启用" : "未启用"}
          </div>

          {/* 安全说明 */}
          {prediction.safetyNotes.length > 0 && (
            <div className="rounded border border-amber-500/30 bg-amber-500/5 p-1.5 text-[10px] text-amber-600/90 dark:text-amber-400/90 space-y-0.5">
              {prediction.safetyNotes.map((n, i) => (
                <div key={i}>· {n}</div>
              ))}
            </div>
          )}

          {/* 操作 */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
            <button
              type="button"
              onClick={handleSaveReport}
              className="text-[10px] px-2 py-1 rounded border border-border/60 hover:border-border hover:text-foreground text-muted-foreground"
            >
              保存预测报告（草案）
            </button>
            <span className="text-[10px] text-muted-foreground self-center">
              预测结果是结构化辅助判断，不是确定性事实。
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
