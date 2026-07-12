import type { SequenceObjectInterface } from "@/lib/sequence-object/sequenceObjectInterfaceEngine";
import { INTERFACE_TYPE_LABELS } from "@/constants/sequence-object/sequenceObjectInterfaceTypes";

export function SequenceObjectInterfacePanel({ interfaces }: { interfaces: SequenceObjectInterface[] }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="mb-2 font-medium">跨域接口 · Interfaces ({interfaces.length})</div>
      <div className="grid grid-cols-2 gap-2">
        {interfaces.map((i) => (
          <div key={i.interfaceId} className="rounded border border-border/60 p-2 text-xs">
            <div className="font-medium">{INTERFACE_TYPE_LABELS[i.targetEngine]}</div>
            <div className="text-muted-foreground">{i.targetEngine}</div>
            <div className="mt-1">允许：{i.allowed ? "✓" : "✗"}</div>
            <div className="truncate">变量：{i.transferableVariables.join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
