import type { VocabularyTerm } from "@/lib/vocabulary/vocabularyRegistry";
import { getOrGenerateExamples } from "@/lib/vocabulary/termUsageExampleEngine";
import { getRelatedTerms } from "@/lib/vocabulary/termRelationEngine";
import { Link } from "@tanstack/react-router";

export function TermDetailPanel({ term }: { term: VocabularyTerm }) {
  const related = getRelatedTerms(term.termId);
  const examples = getOrGenerateExamples(term);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-display gold-text">{term.chineseTerm} / {term.englishTerm}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          <Tag>{term.category}</Tag><Tag>{term.systemLayer}</Tag><Tag>{term.maturity}</Tag>
          <Tag>{term.audienceMode}</Tag>{term.founderLocked && <Tag tone="founder">Founder</Tag>}
        </div>
      </header>

      <Section title="一句话定义">{term.shortDefinition}</Section>
      <Section title="普通用户解释">{term.plainDefinition}</Section>
      <Section title="专业解释">{term.technicalDefinition}</Section>

      {term.aliases?.length > 0 && <Section title="别名">{term.aliases.join(" · ")}</Section>}
      {term.correctUsage && <Section title="正确用法">{term.correctUsage}</Section>}
      {term.commonMisuse?.length > 0 && (
        <Section title="常见误用">
          <ul className="list-disc pl-5 space-y-1">{term.commonMisuse.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </Section>
      )}
      <Section title="安全边界" tone="warn">{term.safetyBoundary}</Section>

      <Section title="使用示例">
        <div className="space-y-3">
          {examples.map((ex) => (
            <div key={ex.exampleId} className="rounded-md border border-border/60 p-3 text-sm">
              <div className="text-xs text-muted-foreground">输入场景</div>
              <div className="mt-1">{ex.inputContext}</div>
              <div className="mt-2 text-xs text-green-500">✓ 正确</div><div>{ex.correctUsage}</div>
              {ex.incorrectUsage && (<>
                <div className="mt-2 text-xs text-red-500">✗ 错误</div><div>{ex.incorrectUsage}</div>
              </>)}
              <div className="mt-2 text-xs text-muted-foreground">{ex.explanation}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="多语言译名">
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-muted-foreground"><th className="text-left py-1">Locale</th><th className="text-left">Display</th><th className="text-left">状态</th></tr></thead>
          <tbody>
            {term.localization.map((l) => (
              <tr key={l.locale} className="border-t border-border/40">
                <td className="py-1">{l.locale}</td>
                <td>{l.displayTerm}</td>
                <td>{l.stale ? <span className="text-amber-400">stale</span> : <span className="text-muted-foreground">ok</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {related.length > 0 && (
        <Section title="相关词条">
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.termId} to="/vocabulary-entry" search={{ id: r.termId } as any}
                className="px-2 py-1 rounded bg-muted/30 text-xs hover:bg-muted/50">
                {r.chineseTerm}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {(term.relatedModules?.length || term.relatedEngines?.length || term.relatedCalculus?.length) ? (
        <Section title="相关模块 / 引擎 / 计算法">
          <div className="space-y-1 text-xs text-muted-foreground">
            {term.relatedModules?.length > 0 && <div>模块：{term.relatedModules.join("、")}</div>}
            {term.relatedEngines?.length > 0 && <div>引擎：{term.relatedEngines.join("、")}</div>}
            {term.relatedCalculus?.length > 0 && <div>计算法：{term.relatedCalculus.join("、")}</div>}
          </div>
        </Section>
      ) : null}

      <Section title="版本记录">v{term.version} · {term.updatedAt}</Section>
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "founder" }) {
  const cls = tone === "founder" ? "bg-amber-500/15 text-amber-400" : "bg-muted/40";
  return <span className={`px-1.5 py-0.5 rounded ${cls}`}>{children}</span>;
}

function Section({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "warn" }) {
  return (
    <section className={`rounded-lg border p-4 ${tone === "warn" ? "border-amber-500/30 bg-amber-500/5" : "border-border/60 bg-card/30"}`}>
      <h3 className="text-sm font-display mb-2">{title}</h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}
