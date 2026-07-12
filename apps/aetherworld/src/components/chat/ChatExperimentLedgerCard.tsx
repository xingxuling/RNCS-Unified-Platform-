// AetherSeed Experiment Ledger · Chat 结果卡
import type { ChatExperimentLedgerInfo } from "@/lib/aetherseed-experiment-ledger/experimentChatBridge";

interface Props { info: ChatExperimentLedgerInfo }

export function ChatExperimentLedgerCard({ info }: Props) {
  const s = info.snapshot;
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          AetherSeed Experiment Ledger · 实验账本
        </div>
        <a href="/system/experiment-ledger"
           className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground">
          打开实验账本
        </a>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-500">
          焦点 · {info.focusLabel}
        </span>
        {info.detectedTarget && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-500/40 text-sky-400">
            目标 · {info.detectedTarget.label}
          </span>
        )}
        {info.detectedFailureType && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500/40 text-rose-400">
            失败类型 · {info.detectedFailureType.label}
          </span>
        )}
      </div>
      <div className="text-sm text-foreground/90 leading-relaxed">{info.summary}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        <Stat k="总实验" v={s.total} />
        <Stat k="待执行" v={s.readyToRun} />
        <Stat k="训练中" v={s.running} />
        <Stat k="已完成" v={s.completed} />
        <Stat k="已失败" v={s.failed} />
        <Stat k="已评测" v={s.evaluated} />
        <Stat k="checkpoint" v={s.checkpointCount} />
        <Stat k="血统记录" v={s.bloodlineCount} />
      </div>
      {info.recentExperiments.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">最近实验</div>
          {info.recentExperiments.map((e) => (
            <div key={e.id} className="text-[11px] flex flex-wrap gap-x-2">
              <span className="text-foreground/90">{e.name}</span>
              <span className="text-muted-foreground">· {e.target}</span>
              <span className="text-emerald-400">· {e.status}</span>
            </div>
          ))}
        </div>
      )}
      {info.recentFailures.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">最近失败</div>
          {info.recentFailures.map((f) => (
            <div key={f.id} className="text-[11px] text-rose-300">· {f.type} · {f.summary}</div>
          ))}
        </div>
      )}
      {info.recentNextPlans.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">下一炉建议</div>
          {info.recentNextPlans.map((p) => (
            <div key={p.id} className="text-[11px]">
              <span className="text-amber-400">[{p.priority}]</span> {p.title} <span className="text-muted-foreground">· {p.recommendationType}</span>
            </div>
          ))}
        </div>
      )}
      {info.bloodlines.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">模型血统线</div>
          {info.bloodlines.map((b) => (
            <div key={b.modelName} className="text-[11px]">
              <span className="text-foreground/90">{b.generation} · {b.modelName}</span>
              <span className="text-muted-foreground"> · {b.capability.join("、")}</span>
            </div>
          ))}
        </div>
      )}
      <div className="text-[10px] text-muted-foreground leading-relaxed">
        安全：{info.safetyForbidden.slice(0, 3).join("；")}。{info.workbenchHint}
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: number | string }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/10 p-2">
      <div className="text-muted-foreground text-[10px]">{k}</div>
      <div className="text-foreground/90 text-sm">{v}</div>
    </div>
  );
}
