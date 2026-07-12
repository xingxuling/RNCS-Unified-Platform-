// 训练工作流 Chat 卡片
import type { WorkflowChatInfo } from "@/lib/aetherseed-training-workflow/trainingWorkflowChatBridge";

export function ChatTrainingWorkflowCard({ info }: { info: WorkflowChatInfo }) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            训练工作流编排器 · {info.focusLabel}
          </div>
          <div className="text-sm font-medium mt-0.5">{info.headline}</div>
        </div>
        <a
          href="/system/training-workflows"
          className="text-[11px] px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
        >
          打开工作流
        </a>
      </div>
      <ul className="text-xs space-y-1 text-muted-foreground">
        {info.bullets.map((b, i) => (
          <li key={i}>· {b}</li>
        ))}
      </ul>
      {info.workflowId && (
        <div className="text-[11px] text-muted-foreground">
          工作流 ID：<span className="font-mono">{info.workflowId}</span>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-2 pt-2 border-t border-border/40">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">允许</div>
          <ul className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
            {info.safetyAllowed.slice(0, 4).map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">禁止</div>
          <ul className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
            {info.safetyForbidden.slice(0, 4).map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
