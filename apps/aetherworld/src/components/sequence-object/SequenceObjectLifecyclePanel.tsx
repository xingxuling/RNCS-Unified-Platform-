import type { SequenceObjectLifecycleState } from "@/lib/sequence-object/sequenceObjectLifecycleBridge";
import { LIFECYCLE_PHASE_LABELS } from "@/constants/sequence-object/sequenceObjectLifecyclePhases";

export function SequenceObjectLifecyclePanel({ state }: { state: SequenceObjectLifecycleState }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="mb-2 font-medium">生命周期 · CLM</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>当前阶段：{LIFECYCLE_PHASE_LABELS[state.phase]}（{state.phase}）</div>
        <div>身份：{state.ownerIdentity}</div>
        <div>能耗：{state.energyDemand}</div>
        <div>回报类型：{state.returnType}</div>
        <div>熵：{state.entropy}</div>
        <div>下次复审：{state.nextReviewSuggestion}</div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{state.clmReason}</div>
    </div>
  );
}
