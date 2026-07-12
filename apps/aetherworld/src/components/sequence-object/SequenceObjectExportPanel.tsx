import { EXPORT_TARGET_LABELS, SEQUENCE_OBJECT_EXPORT_TARGETS } from "@/constants/sequence-object/sequenceObjectExportTargets";

export function SequenceObjectExportPanel({ onExport }: { onExport?: (target: string) => void }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="mb-2 font-medium">导出 · Export</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SEQUENCE_OBJECT_EXPORT_TARGETS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onExport?.(t)}
            className="rounded border border-border/60 px-2 py-1 text-xs hover:bg-muted/40 text-left"
          >
            {EXPORT_TARGET_LABELS[t]}
            <div className="text-[10px] text-muted-foreground">{t}</div>
          </button>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">导出包含权限元数据；SYSTEM_ONLY 与缺少 Contract 的 Runtime 对象将被阻断。</div>
    </div>
  );
}
