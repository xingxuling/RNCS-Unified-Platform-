// 产品文档系统 · 基础组件
import { ReactNode } from "react";

// ============= VersionBadge =============
export function VersionBadge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "active" | "next" | "warn" }) {
  const cls =
    tone === "active" ? "border-trigger-high/40 text-trigger-high bg-trigger-high/5" :
    tone === "next"   ? "border-trigger-mid/40 text-trigger-mid bg-trigger-mid/5" :
    tone === "warn"   ? "border-destructive/40 text-destructive bg-destructive/5" :
                        "border-primary/30 text-primary bg-primary/5";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] tracking-widest uppercase ${cls}`}>
      {children}
    </span>
  );
}

// ============= DocSection (锚点章节) =============
export function DocSection({
  id, cn, en, children,
}: { id: string; cn: string; en: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 mb-12">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{en}</div>
        <h2 className="font-display text-2xl md:text-3xl gold-text mt-1">{cn}</h2>
        <div className="gold-divider mt-3" />
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// ============= DocCard =============
export function DocCard({
  title, en, badge, children,
}: { title?: string; en?: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <div className="aether-card-elevated p-5">
      {(title || badge) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            {en && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{en}</div>}
            {title && <div className="font-display text-lg text-foreground mt-0.5">{title}</div>}
          </div>
          {badge}
        </div>
      )}
      <div className="text-sm text-foreground/85 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

// ============= DefinitionBox =============
export function DefinitionBox({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
      {title && <div className="text-[10px] uppercase tracking-widest text-primary/80 mb-1">{title}</div>}
      <div className="text-sm text-foreground/90 leading-relaxed">{children}</div>
    </div>
  );
}

// ============= DocTable =============
export function DocTable({ headers, rows }: { headers: string[]; rows: (string | ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border/60">
      <table className="w-full text-xs">
        <thead className="bg-muted/20">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/40">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 align-top text-foreground/85">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============= RoadmapTimeline =============
import type { RoadmapItem } from "@/data/roadmapDocs";

export function RoadmapTimeline({ items }: { items: RoadmapItem[] }) {
  return (
    <ol className="relative border-l border-primary/30 pl-6 space-y-6">
      {items.map((it) => {
        const tone =
          it.status === "Shipped" ? "active" :
          it.status === "Current" ? "default" :
          it.status === "Next"    ? "next" : "warn";
        const dotColor =
          it.status === "Shipped" ? "bg-trigger-high" :
          it.status === "Current" ? "bg-primary" :
          it.status === "Next"    ? "bg-trigger-mid" : "bg-muted";
        return (
          <li key={it.version} className="relative">
            <span className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full ${dotColor} ring-2 ring-background`} />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-lg gold-text">{it.version}</span>
              <span className="text-sm text-foreground">{it.title}</span>
              <span className="text-[10px] text-muted-foreground tracking-widest">{it.en}</span>
              <VersionBadge tone={tone as "default" | "active" | "next" | "warn"}>{it.status}</VersionBadge>
            </div>
            <ul className="mt-2 text-xs text-foreground/80 space-y-0.5">
              {it.items.map((x, i) => <li key={i}>· {x}</li>)}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
