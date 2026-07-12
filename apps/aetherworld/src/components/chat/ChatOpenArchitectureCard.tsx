// Chat 结果卡：开源架构吸收
import { Link } from "@tanstack/react-router";
import type { ChatOpenArchInfo } from "@/lib/open-architecture/openArchitectureChatBridge";
import {
  ABSORPTION_LEVEL_LABEL,
  BRIDGE_TYPE_LABEL,
  LAYER_LABEL,
} from "@/lib/open-architecture/openArchitectureTypes";

interface Props { info: ChatOpenArchInfo }

const LEVEL_COLOR: Record<string, string> = {
  ABSORB_NOW:    "border-emerald-500/30 text-emerald-500",
  AGENT_TOOL:    "border-sky-500/30 text-sky-500",
  STORE_PACKAGE: "border-violet-500/30 text-violet-400",
  BRIDGE_LATER:  "border-amber-500/30 text-amber-500",
  RISKY:         "border-red-500/40 text-red-500",
  REFERENCE_ONLY:"border-zinc-500/30 text-zinc-400",
  IGNORE:        "border-zinc-500/30 text-zinc-500",
};

export function ChatOpenArchitectureCard({ info }: Props) {
  const { analysis, bridgePlan, webxxmDraft } = info.result;
  return (
    <div className="rounded-md border border-border/50 bg-card/60 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          开源架构吸收 · {info.calculusId}
        </div>
        <Link to="/system/open-architecture" className="text-[11px] text-primary hover:underline">
          打开吸收工作台 →
        </Link>
      </div>

      <div className="text-foreground/90">{info.summary}</div>

      <div className="flex flex-wrap gap-1">
        <span className={`px-1.5 py-0.5 rounded border text-[10px] ${LEVEL_COLOR[analysis.absorptionLevel] ?? ""}`}>
          {ABSORPTION_LEVEL_LABEL[analysis.absorptionLevel]}
        </span>
        <span className="px-1.5 py-0.5 rounded border border-border/50 text-[10px] text-muted-foreground">
          {BRIDGE_TYPE_LABEL[bridgePlan.bridgeType]}
        </span>
        <span className="px-1.5 py-0.5 rounded border border-border/50 text-[10px] text-muted-foreground">
          优先级 {bridgePlan.recommendedPriority}
        </span>
      </div>

      {analysis.techStack.length > 0 && (
        <div className="text-[11px] text-muted-foreground">
          技术栈：{analysis.techStack.join("、")}
        </div>
      )}

      {analysis.modules.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">核心模块</div>
          <ul className="space-y-0.5">
            {analysis.modules.slice(0, 6).map((m) => (
              <li key={m.id} className="text-[11px]">
                <span className="text-foreground/90">{m.name}</span>
                <span className="text-muted-foreground"> · {LAYER_LABEL[m.layer]} · 映射：</span>
                <span className="text-foreground/80">{m.mappableToAether.join("、") || "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {bridgePlan.steps.length > 0 && (
        <details className="rounded border border-border/40 bg-muted/20 p-1.5">
          <summary className="cursor-pointer text-[11px] text-foreground/80">Bridge Plan（{bridgePlan.steps.length} 步）</summary>
          <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-muted-foreground">
            {bridgePlan.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </details>
      )}

      {analysis.risks.length > 0 && (
        <details className="rounded border border-amber-500/30 bg-amber-500/5 p-1.5">
          <summary className="cursor-pointer text-[11px] text-amber-500">风险提示（{analysis.risks.length}）</summary>
          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-amber-500/90">
            {analysis.risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </details>
      )}

      {webxxmDraft && (
        <div className="rounded border border-violet-500/30 bg-violet-500/5 p-1.5 text-[11px]">
          <div className="text-violet-400 mb-0.5">WebXXM 包草案：{webxxmDraft.packageName}</div>
          <div className="text-muted-foreground">权限：{webxxmDraft.permissions.join("、")}</div>
        </div>
      )}

      {info.notes.length > 0 && (
        <ul className="list-disc pl-4 text-[10px] text-muted-foreground">
          {info.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
    </div>
  );
}
