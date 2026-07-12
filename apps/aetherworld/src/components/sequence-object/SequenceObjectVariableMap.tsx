import type { SequenceObjectVariable } from "@/lib/sequence-object/sequenceObjectVariableExtractor";

export function SequenceObjectVariableMap({ variables }: { variables: SequenceObjectVariable[] }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="mb-2 font-medium">变量图 · Variables ({variables.length})</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr><th className="text-left">name</th><th className="text-left">type</th><th>required</th><th>transferable</th><th className="text-left">value</th></tr>
          </thead>
          <tbody>
            {variables.map((v) => (
              <tr key={v.variableId} className="border-t border-border/40">
                <td>{v.name}</td>
                <td>{v.variableType}</td>
                <td className="text-center">{v.requiredForRuntime ? "✓" : "—"}</td>
                <td className="text-center">{v.transferable ? "✓" : "—"}</td>
                <td className="truncate max-w-[200px]">{String(v.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
