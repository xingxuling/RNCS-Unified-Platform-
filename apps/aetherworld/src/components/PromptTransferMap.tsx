// 迁移图 · Prompt Transfer Map
import { PROMPT_TRANSFER_PATTERNS } from "@/constants/promptTransferPatterns";
import { findDomain } from "@/constants/promptDomains";

interface Props {
  sourceDomain?: string;
  targetDomain?: string;
  value?: string;
  onSelect: (id: string) => void;
}

export function PromptTransferMap({ sourceDomain, targetDomain, value, onSelect }: Props) {
  const list = PROMPT_TRANSFER_PATTERNS.filter((p) =>
    (sourceDomain ? p.sourceDomain === sourceDomain : true) &&
    (targetDomain ? p.targetDomain === targetDomain : true)
  );
  if (!list.length) {
    return (
      <div className="text-xs text-muted-foreground p-3 aether-card rounded-md">
        当前源 / 目标领域暂无内置迁移模式，将使用通用抽象映射。
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      {list.map((p) => {
        const s = findDomain(p.sourceDomain)?.name ?? p.sourceDomain;
        const t = findDomain(p.targetDomain)?.name ?? p.targetDomain;
        const active = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={`text-left aether-card p-3 rounded-md border transition ${
              active ? "border-primary/70 bg-primary/10" : "border-border/40 hover:border-border"
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              <span>{s}</span>
              <span className="text-muted-foreground">→</span>
              <span>{t}</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{p.en}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              步骤：{p.abstractionSteps.join(" → ")}
            </div>
            {p.riskWarnings.length > 0 && (
              <div className="text-[10px] text-amber-400/80 mt-1">⚠ {p.riskWarnings.join("；")}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
