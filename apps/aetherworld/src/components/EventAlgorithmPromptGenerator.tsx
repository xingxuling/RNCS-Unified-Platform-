import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { EVENT_ALGORITHMS } from "@/constants/eventAlgorithmTypes";
import { EVENT_STAGES, type EventStageId } from "@/constants/eventStages";

const STAGE_HINT: Record<EventStageId, string> = {
  SEED: "请输出探索 / 定义 / 澄清类提示词，禁止激进行动。",
  FORMING: "请输出补材料 / 整理架构 / 准备发布前置物的提示词。",
  TRIGGERED: "请输出小步执行 / 留回验入口的提示词。",
  ESCALATING: "请输出推进 / 沟通 / 发布前确认的提示词。",
  CONFIRMING: "请输出确认 / 复盘 / 记录 / 留存的提示词。",
  PEAKING: "请输出关键动作 / 高优先级执行的提示词，并附风险防护。",
  DECLINING: "请输出收尾 / 转入回验的提示词。",
  BLOCKED: "请输出修复 / 转向 / 降噪 / 重排路径的提示词。",
  REVERSED: "请输出止损 / 重构 / 重新设计的提示词。",
  ARCHIVED: "请输出归档 / 复盘 / 沉淀模板的提示词。",
};

export function EventAlgorithmPromptGenerator() {
  const [eventId, setEventId] = useState(EVENT_ALGORITHMS[0].id);
  const [stage, setStage] = useState<EventStageId>("TRIGGERED");

  const event = EVENT_ALGORITHMS.find((e) => e.id === eventId)!;

  const prompt = useMemo(() => {
    return [
      `# 任务上下文`,
      `主事件：${event.name}（${event.en}）`,
      `维度：${event.dimensionId}`,
      `事件公式：${event.baseFormula}`,
      `当前阶段：${stage}`,
      ``,
      `# 行动许可`,
      `仅允许：${event.actionPermissions.join(" / ")}`,
      ``,
      `# 阶段指令`,
      STAGE_HINT[stage],
      ``,
      `# 输出要求`,
      `1. 不要承诺必然发生。`,
      `2. 不要泄露用户真实数据。`,
      `3. 输出必须可回验，列出 ${event.feedbackMetrics.join(" / ")} 中至少 2 项的检查方式。`,
      `4. 若识别到阻断信号（${event.blockingSignals.join(" / ") || "无"}），立即降级输出并提示用户。`,
    ].join("\n");
  }, [event, stage]);

  return (
    <div className="aether-card p-5 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Event-Aware Prompt · 事件算法提示词生成
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs">
          <span className="text-muted-foreground">事件算法</span>
          <select
            className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
            value={eventId} onChange={(e) => setEventId(e.target.value)}
          >
            {EVENT_ALGORITHMS.map((e) => (
              <option key={e.id} value={e.id}>{e.name} · {e.en}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">事件阶段</span>
          <select
            className="mt-1 w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
            value={stage} onChange={(e) => setStage(e.target.value as EventStageId)}
          >
            {EVENT_STAGES.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {s.en}</option>
            ))}
          </select>
        </label>
      </div>
      <pre className="text-xs font-mono whitespace-pre-wrap bg-background/60 border border-border rounded p-3 max-h-72 overflow-auto">{prompt}</pre>
      <Button
        variant="outline" size="sm"
        onClick={() => { navigator.clipboard.writeText(prompt); toast.success("已复制提示词"); }}
      >
        <Copy className="w-3 h-3 mr-1" /> 复制提示词
        <Wand2 className="w-3 h-3 ml-2 opacity-60" />
      </Button>
    </div>
  );
}
