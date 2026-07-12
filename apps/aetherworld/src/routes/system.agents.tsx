// 数列 Agent 总览
// 路径：/system/agents
// 仅作为系统/治理子页面，不进入一级导航。
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { listAllEnabledAgents } from "@/lib/sequence-agent/sequenceAgentRouter";
import { AGENT_TYPE_LABEL, type SequenceAgentType } from "@/lib/sequence-agent/sequenceAgentTypes";

export const Route = createFileRoute("/system/agents")({
  head: () => ({
    meta: [
      { title: "数列 Agent — Aetherworld" },
      { name: "description", content: "Aetherworld 数列 Agent 总览：系统 Agent、职责、权限、允许工具与运行状态。" },
      { property: "og:title", content: "数列 Agent — Aetherworld" },
      { property: "og:description", content: "数列角色 / 数字角色升级为 Aetherworld 内可调度、可计量、可审计的 Agent 运行时。" },
    ],
  }),
  component: AgentsPage,
});

const AUTH_LABEL: Record<string, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  FOUNDER_ONLY: "Founder 专属",
};
const SAFETY_LABEL: Record<string, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
};

function AgentsPage() {
  const [filter, setFilter] = useState<SequenceAgentType | "ALL">("ALL");
  const agents = useMemo(() => listAllEnabledAgents(), []);
  const filtered = filter === "ALL" ? agents : agents.filter((a) => a.agentType === filter);

  const types = Array.from(new Set(agents.map((a) => a.agentType)));

  return (
    <div className="container mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">系统 / Aetherworld</div>
          <h1 className="text-xl font-semibold">数列 Agent</h1>
          <p className="text-xs text-muted-foreground mt-1">
            既有数列角色 / 数字角色已升级为 Aetherworld 可调度、可计量、可审计的 Agent 运行时；当前共 {agents.length} 位。
          </p>
        </div>
        <Link to="/system" className="text-xs text-primary hover:underline">
          ← 返回系统
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-2 py-1 rounded border ${filter === "ALL" ? "bg-primary text-primary-foreground" : "border-border/50 hover:bg-accent/20"}`}
        >
          全部 ({agents.length})
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-2 py-1 rounded border ${filter === t ? "bg-primary text-primary-foreground" : "border-border/50 hover:bg-accent/20"}`}
          >
            {AGENT_TYPE_LABEL[t]} ({agents.filter((a) => a.agentType === t).length})
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((a) => (
          <div key={a.id} className="rounded-lg border border-border/50 bg-card/60 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">{a.cnName}</div>
              <div className="text-[10px] text-muted-foreground">{AGENT_TYPE_LABEL[a.agentType]}</div>
            </div>
            <div className="text-muted-foreground leading-relaxed">{a.description}</div>
            <div className="flex flex-wrap gap-1 pt-1">
              {a.domain.slice(0, 4).map((d) => (
                <span key={d} className="px-1.5 py-0.5 bg-muted/40 rounded text-[10px]">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-muted-foreground">
              <div>权限：{AUTH_LABEL[a.authorityLevel]}</div>
              <div>安全：{SAFETY_LABEL[a.safetyLevel]}</div>
              <div>记忆：{a.memoryScope}</div>
              <div>来源：{a.personaSource}</div>
            </div>
            {a.deniedTools.length > 0 && (
              <div className="text-[10px] text-rose-500/80">
                禁止：{a.deniedTools.slice(0, 3).join("、")}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-3">
        Chat 中可输入「让架构 Agent 分析下一步」「让产品 Agent 和安全 Agent 讨论公开发布」「让 QA Agent 检查风险」等触发多 Agent 评审。
      </div>
    </div>
  );
}
