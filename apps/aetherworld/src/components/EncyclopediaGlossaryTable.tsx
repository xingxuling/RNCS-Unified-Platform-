import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import { buildGlossary } from "@/lib/encyclopediaGlossaryBuilder";
import { useMemo, useState } from "react";

export function EncyclopediaGlossaryTable() {
  const [q, setQ] = useState("");
  const all = useMemo(buildGlossary, []);
  const filtered = useMemo(
    () => q ? all.filter(g => g.term.toLowerCase().includes(q.toLowerCase())) : all,
    [all, q],
  );
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-sm font-medium">术语表 · Glossary</h3>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="过滤术语" className="max-w-xs h-8 text-xs" />
      </div>
      <div className="max-h-[420px] overflow-auto rounded border border-border/40">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground text-[10px] tracking-wider sticky top-0 bg-card">
            <tr><th className="text-left p-2">术语</th><th className="text-left p-2">简短解释</th><th className="text-left p-2">条目</th></tr>
          </thead>
          <tbody>
            {filtered.slice(0, 300).map((g, i) => (
              <tr key={i} className="border-t border-border/30">
                <td className="p-2 font-medium">{g.term}</td>
                <td className="p-2 text-muted-foreground">{g.shortDefinition}</td>
                <td className="p-2">
                  <Link to="/encyclopedia-entry" search={{ id: g.entryId } as never} className="text-primary hover:underline">打开</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">共 {all.length} 个术语（含别名）。</div>
    </Card>
  );
}
