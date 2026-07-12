import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_TERMINOLOGY_MAP, type TerminologyEntry } from "@/constants/productTerminologyMap";

export function ConceptExplanationCard({ entry }: { entry: TerminologyEntry }) {
  return (
    <Card className="p-4 space-y-2 aether-card">
      <div className="flex items-center justify-between">
        <div className="font-medium">{entry.rawTerm}</div>
        <Badge variant="outline" className="text-[10px]">{entry.jargonRisk} · 难度 {entry.difficultyScore}</Badge>
      </div>
      <div className="text-sm text-muted-foreground">{entry.educationalExplanation}</div>
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        <div><span className="text-muted-foreground">用户语言：</span>{entry.userFriendlyTerm}</div>
        <div><span className="text-muted-foreground">行动语言：</span>{entry.actionOrientedTerm}</div>
        <div><span className="text-muted-foreground">企业安全：</span>{entry.enterpriseSafeTerm}</div>
        <div><span className="text-muted-foreground">Microcopy：</span>{entry.microcopy}</div>
      </div>
      <div className="text-[10px] text-muted-foreground/70 border-t border-border/60 pt-2">
        安全边界：术语只描述系统结构，不代表必然未来。
      </div>
    </Card>
  );
}

export function TermGlossaryCard() {
  return (
    <Card className="p-5 space-y-3 aether-card">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Term Glossary · 术语解释卡</div>
      <div className="grid md:grid-cols-2 gap-3">
        {PRODUCT_TERMINOLOGY_MAP.map((e) => (
          <ConceptExplanationCard key={e.rawTerm} entry={e} />
        ))}
      </div>
    </Card>
  );
}
