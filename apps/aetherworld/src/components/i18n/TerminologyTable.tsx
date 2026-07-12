import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_TERMS } from "@/constants/i18n/productTerminology";
import { SUPPORTED_LANGUAGES } from "@/constants/i18n/supportedLanguages";

export function TerminologyTable({ founder }: { founder?: boolean }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return PRODUCT_TERMS;
    const lower = q.toLowerCase();
    return PRODUCT_TERMS.filter(t =>
      t.id.toLowerCase().includes(lower) ||
      Object.values(t.translations).some(v => v?.toLowerCase().includes(lower)),
    );
  }, [q]);

  return (
    <Card className="aether-card-elevated overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">术语字典 · Terminology Dictionary</div>
          <div className="text-xs text-muted-foreground">{PRODUCT_TERMS.length} 条术语 × {SUPPORTED_LANGUAGES.length} 语言</div>
        </div>
        <Input placeholder="搜索术语…" value={q} onChange={e => setQ(e.target.value)} className="w-56" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left p-2">ID</th>
              {SUPPORTED_LANGUAGES.map(l => (
                <th key={l.code} className="text-left p-2">{l.code}</th>
              ))}
              <th className="text-left p-2">普通</th>
              <th className="text-left p-2">高阶</th>
              {founder && <th className="text-left p-2">Founder</th>}
              <th className="text-left p-2">禁用译法</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-t border-border align-top">
                <td className="p-2 font-mono whitespace-nowrap">{t.id}</td>
                {SUPPORTED_LANGUAGES.map(l => (
                  <td key={l.code} className="p-2">{t.translations[l.code] ?? <span className="text-muted-foreground">—</span>}</td>
                ))}
                <td className="p-2 text-muted-foreground">{t.plainMeaning}</td>
                <td className="p-2 text-muted-foreground">{t.advancedMeaning}</td>
                {founder && <td className="p-2 text-muted-foreground">{t.founderMeaning}</td>}
                <td className="p-2">
                  {t.avoidTranslations.length === 0 ? "—" : t.avoidTranslations.map(a => (
                    <Badge key={a} variant="outline" className="mr-1 mb-1 text-amber-500">{a}</Badge>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
