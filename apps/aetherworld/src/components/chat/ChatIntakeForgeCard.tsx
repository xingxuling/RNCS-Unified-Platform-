// 投喂铸造炉 · 结果卡
import type { ChatIntakeForgeInfo } from "@/lib/intake-forge/intakeForgeChatBridge";

interface Props {
  info: ChatIntakeForgeInfo;
}

export function ChatIntakeForgeCard({ info }: Props) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          AetherSeed Intake Forge · 投喂式训练数据铸造炉
        </div>
        <a
          href="/system/intake-forge"
          className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
        >
          打开投喂炉
        </a>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-500">
          焦点 · {info.focusLabel}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          单文件 ≤ {info.limits.maxFileMb} MB
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          单次 ≤ {info.limits.maxFiles} 文件
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          不自动训练 / 不自动上传
        </span>
      </div>

      <div className="text-sm text-foreground/90 leading-relaxed">{info.summary}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md border border-border/40 bg-muted/10 p-2">
          <div className="text-muted-foreground mb-1">允许后缀</div>
          <div className="text-foreground/80 break-all">{info.allowedExt.join("  ")}</div>
        </div>
        <div className="rounded-md border border-border/40 bg-muted/10 p-2">
          <div className="text-muted-foreground mb-1">禁止后缀</div>
          <div className="text-foreground/80 break-all">{info.forbiddenExt.join("  ")}</div>
        </div>
      </div>

      <details className="text-[11px] text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">安全策略（允许 / 禁止）</summary>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          <ul className="space-y-1 list-disc list-inside">
            {info.allowed.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <ul className="space-y-1 list-disc list-inside">
            {info.forbidden.map((a, i) => (
              <li key={i} className="text-rose-400/80">{a}</li>
            ))}
          </ul>
        </div>
      </details>

      <div className="text-[11px] text-muted-foreground">{info.workbenchHint}</div>
    </div>
  );
}
