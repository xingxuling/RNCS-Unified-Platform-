// 产品文档 · 底层架构面板：术语表 / 回链 / 维护节奏
import { DOC_GLOSSARY } from "@/data/docGlossary";
import { DOC_BACKLINKS } from "@/data/docBacklinks";
import { DOC_MAINTENANCE, CADENCE_LABEL, type Cadence } from "@/data/docMaintenance";
import { DOC_SECTIONS } from "@/data/productDocs";
import { DocCard, VersionBadge } from "@/components/docs/DocPrimitives";

const sectionLabel = (id: string) => {
  const s = DOC_SECTIONS.find((x) => x.id === id);
  return s ? `${s.cn}` : id;
};

// ============= 术语表 =============
export function GlossaryPanel() {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border/50 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium">术语</th>
              <th className="text-left px-3 py-2 font-medium">定义</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">出处</th>
              <th className="text-left px-3 py-2 font-medium">语言层</th>
            </tr>
          </thead>
          <tbody>
            {DOC_GLOSSARY.map((t) => (
              <tr key={t.en} className="border-t border-border/40 align-top">
                <td className="px-3 py-2">
                  <div className="text-foreground">{t.cn}</div>
                  <div className="text-[10px] tracking-widest text-muted-foreground/80">{t.en}</div>
                </td>
                <td className="px-3 py-2 text-foreground/85">
                  <div>{t.short}</div>
                  {t.userFriendly && (
                    <div className="text-[11px] text-muted-foreground mt-1">
                      普通用户语言：{t.userFriendly}
                    </div>
                  )}
                  {t.safety && (
                    <div className="text-[11px] text-destructive/80 mt-1">⚠ {t.safety}</div>
                  )}
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  <a href={`#${t.section}`} className="text-primary hover:underline">{sectionLabel(t.section)}</a>
                </td>
                <td className="px-3 py-2">
                  <VersionBadge tone={t.audience === "PROFESSIONAL" ? "warn" : t.audience === "BOTH" ? "active" : "default"}>
                    {t.audience}
                  </VersionBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        语言层：PROFESSIONAL 仅在专业上下文展示；USER_FRIENDLY 用普通用户改写；BOTH 双语言层并存（首次出现需 tooltip）。
      </p>
    </div>
  );
}

// ============= 回链 =============
export function BacklinkPanel() {
  return (
    <div className="space-y-3">
      {DOC_BACKLINKS.map((b) => (
        <DocCard key={b.section} title={sectionLabel(b.section)} en={b.section}>
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">路由</div>
              <ul className="space-y-0.5 font-mono text-foreground/85">
                {b.routes.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">实现文件</div>
              <ul className="space-y-0.5 font-mono text-[10px] text-foreground/80">
                {b.modules.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">下游消费</div>
              <ul className="space-y-0.5 text-foreground/85">
                {b.consumers.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          </div>
        </DocCard>
      ))}
    </div>
  );
}

// ============= 维护节奏 =============
const cadenceTone = (c: Cadence) =>
  c === "FROZEN" ? "warn"
  : c === "ON_CHANGE" || c === "WEEKLY" ? "active"
  : c === "PER_RELEASE" || c === "BI_WEEKLY" ? "next"
  : "default";

export function MaintenancePanel() {
  return (
    <div className="rounded-md border border-border/50 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/30 text-muted-foreground">
          <tr>
            <th className="text-left px-3 py-2 font-medium">章节</th>
            <th className="text-left px-3 py-2 font-medium">节奏</th>
            <th className="text-left px-3 py-2 font-medium">触发条件</th>
            <th className="text-left px-3 py-2 font-medium hidden md:table-cell">责任面</th>
          </tr>
        </thead>
        <tbody>
          {DOC_MAINTENANCE.map((m) => (
            <tr key={m.section} className="border-t border-border/40 align-top">
              <td className="px-3 py-2">
                <a href={`#${m.section}`} className="text-primary hover:underline">{sectionLabel(m.section)}</a>
              </td>
              <td className="px-3 py-2">
                <VersionBadge tone={cadenceTone(m.cadence) as "default" | "active" | "next" | "warn"}>
                  {CADENCE_LABEL[m.cadence].cn}
                </VersionBadge>
              </td>
              <td className="px-3 py-2 text-foreground/85">
                <ul className="list-disc pl-4 space-y-0.5">
                  {m.triggers.map((t) => <li key={t}>{t}</li>)}
                </ul>
                {m.freezeRule && (
                  <div className="text-[11px] text-muted-foreground mt-1">冻结策略：{m.freezeRule}</div>
                )}
              </td>
              <td className="px-3 py-2 hidden md:table-cell text-foreground/80">{m.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
