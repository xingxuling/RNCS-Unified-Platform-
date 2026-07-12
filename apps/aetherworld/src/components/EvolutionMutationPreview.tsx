import { Button } from "@/components/ui/button";
import type { EvolutionMutation } from "@/constants/evolutionMutationTypes";
import { getMutationDef } from "@/constants/evolutionMutationTypes";

interface Props {
  mutation: EvolutionMutation;
  onClose: () => void;
  onConfirm: (m: EvolutionMutation) => void;
}

export function EvolutionMutationPreview({ mutation, onClose, onConfirm }: Props) {
  const def = getMutationDef(mutation.type);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="aether-card-elevated p-6 max-w-2xl w-full space-y-4" onClick={e => e.stopPropagation()}>
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Evolution Mutation Preview</div>
          <div className="font-display text-xl gold-text mt-1">{def?.name ?? mutation.type}</div>
          <div className="text-xs text-muted-foreground">{def?.description}</div>
        </div>

        <div className="text-sm text-foreground/95">{mutation.reason}</div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">修改前</div>
            <pre className="text-[11px] bg-background/40 p-2 rounded border border-border overflow-auto max-h-48">{JSON.stringify(mutation.beforeState, null, 2)}</pre>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">修改后</div>
            <pre className="text-[11px] bg-background/40 p-2 rounded border border-border overflow-auto max-h-48">{JSON.stringify(mutation.afterState, null, 2)}</pre>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">
          影响模块：{mutation.affectedModules.join("、") || "（无）"} · 风险：{mutation.riskLevel} · 可回滚：是
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={() => onConfirm(mutation)}>
            {mutation.requiresConfirmation ? "确认应用" : "一键应用"}
          </Button>
        </div>
      </div>
    </div>
  );
}
