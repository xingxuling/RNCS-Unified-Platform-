import { createFileRoute, Link } from "@tanstack/react-router";
import { USAGE_EXAMPLES, moduleExampleCoverage } from "@/lib/usageExampleCalculus";
import { MODULE_EXAMPLE_GUIDES } from "@/constants/exampleModuleTypes";
import { EXAMPLE_COMPLEXITY_LEVELS } from "@/constants/exampleComplexityLevels";
import { ExampleSafetyNote } from "@/components/ExampleSafetyNote";

export const Route = createFileRoute("/example-library")({
  head: () => ({
    meta: [
      { title: "示例库 · Example Library — Aether Fate Engine" },
      { name: "description", content: "全部使用示例索引：按模块、复杂度、场景分组。" },
    ],
  }),
  component: ExampleLibraryPage,
});

function ExampleLibraryPage() {
  const coverage = moduleExampleCoverage();
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Example Library</div>
        <h1 className="font-display text-3xl gold-text">示例库</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          全部 {USAGE_EXAMPLES.length} 个使用示例按模块归组。点击场景跳转完整示例面板。
        </p>
      </header>

      <ExampleSafetyNote />

      <section className="aether-card-elevated p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">模块覆盖度</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {coverage.map((c) => {
            const m = MODULE_EXAMPLE_GUIDES.find((x) => x.moduleId === c.moduleId);
            return (
              <div
                key={c.moduleId}
                className={`p-2.5 rounded border ${c.count === 0 ? "border-amber-500/40 bg-amber-500/5" : "border-border/60"}`}
              >
                <div className="text-xs flex items-center justify-between">
                  <span>{m?.moduleName ?? c.moduleId}</span>
                  <span className={c.count === 0 ? "text-amber-300" : "text-muted-foreground"}>{c.count} 个</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        {EXAMPLE_COMPLEXITY_LEVELS.map((lv) => {
          const items = USAGE_EXAMPLES.filter((e) => e.complexityLevel === lv.id);
          if (items.length === 0) return null;
          return (
            <div key={lv.id} className="aether-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{lv.id}</div>
                  <div className="font-display text-base">{lv.label} · {lv.description}</div>
                </div>
                <div className="text-[11px] text-muted-foreground">{items.length} 个示例</div>
              </div>
              <ul className="mt-3 grid md:grid-cols-2 gap-2">
                {items.map((e) => (
                  <li key={e.id} className="p-2.5 rounded border border-border/60">
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">{e.exampleOutputSummary}</div>
                    <div className="mt-1.5 text-[11px]">
                      <Link to="/usage-examples" className="text-primary hover:underline">查看 → </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
