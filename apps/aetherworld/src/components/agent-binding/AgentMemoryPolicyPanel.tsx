import type { AgentMemoryPolicy } from "@/lib/agent-binding/agentKnowledgePersonalityBindingCalculus";

export function AgentMemoryPolicyPanel({ policy }: { policy: AgentMemoryPolicy }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[11px] text-muted-foreground">Memory Policy · {policy.memoryMode}</div>
      <div>读取原始数列：<span className={policy.canReadRawSequence ? "text-red-400" : "text-emerald-400"}>{policy.canReadRawSequence ? "允许（风险）" : "禁止"}</span></div>
      <div>写入记忆：{policy.canWriteMemory ? "是" : "否"}</div>
      <div>导出记忆：{policy.canExportMemory ? "是（脱敏）" : "否"}</div>
      <div className="text-muted-foreground">保留策略：{policy.retentionPolicy}</div>
    </div>
  );
}
