import type { SequenceObjectRuntimeContract } from "@/lib/sequence-object/sequenceObjectRuntimeContractEngine";

export function SequenceObjectRuntimeContractPanel({ contract }: { contract: SequenceObjectRuntimeContract | null }) {
  if (!contract) {
    return <div className="text-xs text-muted-foreground">该对象层级不要求 Runtime Contract。</div>;
  }
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="mb-2 font-medium">运行契约 · Runtime Contract</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>scope：{contract.scope}</div>
        <div>可逆性：{contract.reversibility}</div>
        <div>超时策略：{contract.timeoutPolicy ?? "—"}</div>
        <div>回滚策略：{contract.rollbackPolicy}</div>
      </div>
      <div className="mt-2 text-xs">允许操作：{contract.allowedOperations.join(", ")}</div>
      <div className="text-xs">禁止操作：{contract.forbiddenOperations.join(", ")}</div>
      <div className="mt-2 text-xs">权限要求：{contract.permissionRequirement.join(", ")}</div>
      <div className="text-xs">审计要求：{contract.auditRequirement.join(", ")}</div>
      <div className="mt-2 text-xs">状态机：{contract.stateModel.states.join(" → ")}</div>
      <div className="mt-2 text-xs text-amber-300">失败条件：{contract.failureConditions.join("; ")}</div>
    </div>
  );
}
