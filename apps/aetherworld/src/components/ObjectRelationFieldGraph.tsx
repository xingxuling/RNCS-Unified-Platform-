import type { RelationField } from "@/lib/objectRelationFieldMapper";

export function ObjectRelationFieldGraph({ field }: { field: RelationField }) {
  const Section = ({ title, items }: { title: string; items: string[] }) => (
    <div>
      <div className="text-[11px] text-muted-foreground mb-1">{title}</div>
      <ul className="list-disc list-inside text-xs space-y-0.5">
        {items.length ? items.map((s, i) => <li key={i}>{s}</li>) : <li className="text-muted-foreground/70">—</li>}
      </ul>
    </div>
  );
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Relation Field · 关系场</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Section title="支持者" items={field.supporters} />
        <Section title="阻碍者" items={field.blockers} />
        <Section title="依赖" items={field.dependencies} />
        <Section title="竞争者" items={field.competitors} />
        <Section title="协同放大" items={field.amplificationLinks} />
        <Section title="冲突" items={field.conflictLinks} />
      </div>
    </div>
  );
}
