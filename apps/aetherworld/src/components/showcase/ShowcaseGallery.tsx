import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SHOWCASE_EXAMPLES, type ShowcaseKind, type ShowcaseExample } from "@/lib/showcase/showcaseExamples";
import { EmptyState } from "@/components/common/EmptyState";

const KIND_FILTERS: { id: ShowcaseKind | "ALL"; label: string }[] = [
  { id: "ALL",               label: "全部" },
  { id: "WORLD_RUNTIME",     label: "世界运行时" },
  { id: "APP_RUNTIME",       label: "应用运行时" },
  { id: "WEBXXM",            label: "能力包" },
  { id: "CHAT_PERSONA",      label: "对话主体" },
  { id: "STORE_TEMPLATE",    label: "商店模板" },
  { id: "PRODUCT_REFERENCE", label: "产品参考" },
];

export function ShowcaseGallery() {
  const [kind, setKind] = useState<ShowcaseKind | "ALL">("ALL");
  const items: ShowcaseExample[] = kind === "ALL" ? SHOWCASE_EXAMPLES : SHOWCASE_EXAMPLES.filter((e) => e.kind === kind);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl">示例库</h1>
        <p className="text-xs text-muted-foreground mt-1">
          整理自同账号项目群的可吸收范本。点击任意示例可跳转到 Aetherworld 内已有实现。
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {KIND_FILTERS.map((f) => {
          const active = kind === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setKind(f.id)}
              className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                active
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <EmptyState title="该分类下暂无示例" description="可以在对话中说「展示所有示例」来查看全部。" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((ex) => (
            <article
              key={ex.exampleId}
              className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2 hover:border-border transition-colors"
            >
              <header className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {ex.subtitle}
                  </div>
                  <h3 className="text-sm font-display">{ex.title}</h3>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                  {KIND_FILTERS.find((f) => f.id === ex.kind)?.label ?? "示例"}
                </span>
              </header>

              <p className="text-xs text-muted-foreground leading-relaxed">{ex.description}</p>

              {ex.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ex.tags.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {ex.safetyNote && (
                <div className="text-[10px] text-amber-500/90 border border-amber-500/20 bg-amber-500/5 rounded px-2 py-1">
                  {ex.safetyNote}
                </div>
              )}

              <footer className="flex items-center justify-end pt-1">
                {ex.internalRoute && (
                  <Link
                    to={ex.internalRoute}
                    className="text-[12px] rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1"
                  >
                    打开示例
                  </Link>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
