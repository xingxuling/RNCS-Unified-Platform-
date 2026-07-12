import { getVocabularySummary, getTermsGroupedByCategory } from "@/lib/vocabulary/vocabularyEncyclopediaEngine";
import { TERM_CATEGORIES } from "@/constants/vocabulary/termCategories";
import { Link } from "@tanstack/react-router";

export function VocabularyHomePanel() {
  const s = getVocabularySummary();
  const grouped = getTermsGroupedByCategory();
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="总词条" value={s.totalTerms} />
        <Metric label="启用中" value={s.activeTerms} />
        <Metric label="Founder 锁定" value={s.founderLockedTerms} />
        <Metric label="分类数" value={s.categories} />
        <Metric label="系统层" value={s.systemLayers} />
        <Metric label="审计问题" value={s.auditIssues} />
        <Metric label="本地化 stale" value={s.staleCount} />
        <Metric label="版本" value={s.version} />
      </div>
      <div>
        <h2 className="text-lg font-display mb-3">分类总览</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TERM_CATEGORIES.map((c) => (
            <Link key={c.id} to="/vocabulary-categories" search={{ category: c.id } as any}
              className="rounded-lg border border-border/60 bg-card/40 p-4 hover:border-primary/50">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-base">{c.label}</span>
                <span className="text-xs text-muted-foreground">{c.en}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{(grouped[c.id]?.length ?? 0)} 条</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-display">{value}</div>
    </div>
  );
}
