// AetherSeed Local Training · Chat 结果卡
import type { ChatLocalTrainingInfo } from "@/lib/aetherseed-local-training/localTrainingChatBridge";

interface Props {
  info: ChatLocalTrainingInfo;
}

const STATUS_COLOR: Record<string, string> = {
  PASS: "text-emerald-500 border-emerald-500/40",
  WARN: "text-amber-500 border-amber-500/40",
  BLOCK: "text-rose-500 border-rose-500/40",
};

export function ChatLocalTrainingCard({ info }: Props) {
  const d = info.draftPlan;
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          AetherSeed Local Training · 本机训练
        </div>
        <a
          href="/system/local-training"
          className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
        >
          打开本机训练
        </a>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-500">
          焦点 · {info.focusLabel}
        </span>
        {d && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-500/40 text-sky-400">
            目标 · {d.targetLabel}
          </span>
        )}
        {d && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-violet-500/40 text-violet-400">
            模式 · {d.trainingModeLabel}
          </span>
        )}
      </div>

      <div className="text-sm text-foreground/90 leading-relaxed">{info.summary}</div>

      {d && (
        <div className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px] space-y-1">
          <div className="text-muted-foreground">训练草案</div>
          <div>预计时长：<span className="text-foreground/90">{d.estimatedDuration}</span></div>
          <div>数据集版本：<span className="text-foreground/90">{d.datasetVersionId}</span></div>
          <div>
            预期产物：
            <span className="text-foreground/90">{d.expectedOutput.join(" · ")}</span>
          </div>
          <div className="text-muted-foreground pt-1">本机训练包文件</div>
          <ul className="list-disc list-inside text-foreground/80">
            {d.packageFileNames.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {info.availableDatasets.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">可用数据集（最多 6）</div>
          <div className="space-y-1">
            {info.availableDatasets.map((dv) => (
              <div
                key={dv.id}
                className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px] flex items-center gap-2 flex-wrap"
              >
                <span className="text-foreground/90">{dv.name}</span>
                <span className="text-muted-foreground">· {dv.version} · {dv.sampleCount} 条</span>
                <span
                  className={`ml-auto px-1.5 py-0.5 rounded-full border text-[10px] ${
                    STATUS_COLOR[dv.safetyStatus] ?? "text-muted-foreground border-border/40"
                  }`}
                >
                  {dv.safetyStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[11px] text-muted-foreground">{info.workbenchHint}</div>

      <details className="text-[11px] text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">安全策略（允许 / 禁止）</summary>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          <ul className="space-y-1 list-disc list-inside">
            {info.safetyAllowed.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <ul className="space-y-1 list-disc list-inside">
            {info.safetyForbidden.map((a, i) => (
              <li key={i} className="text-rose-400/80">{a}</li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
