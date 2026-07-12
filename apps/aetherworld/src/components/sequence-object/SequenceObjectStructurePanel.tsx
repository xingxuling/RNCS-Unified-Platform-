import type { SequenceObjectStructure } from "@/lib/sequence-object/sequenceObjectStructureCompiler";

export function SequenceObjectStructurePanel({ structure }: { structure: SequenceObjectStructure }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="mb-2 font-medium">对象结构 · Structure ({structure.structureType})</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground mb-1">必需字段</div>
          <ul className="space-y-0.5">{structure.requiredFields.map((f) => <li key={f}>· {f}</li>)}</ul>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">可选字段</div>
          <ul className="space-y-0.5">{structure.optionalFields.map((f) => <li key={f}>· {f}</li>)}</ul>
        </div>
      </div>
      {structure.constraints.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="text-muted-foreground">约束</div>
          {structure.constraints.map((c, i) => <div key={i}>· {c}</div>)}
        </div>
      )}
      {structure.failureModes.length > 0 && (
        <div className="mt-2 text-xs text-amber-300">
          <div>失败模式</div>
          {structure.failureModes.map((c, i) => <div key={i}>· {c}</div>)}
        </div>
      )}
    </div>
  );
}
