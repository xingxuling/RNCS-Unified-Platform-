import type { EncyclopediaEntry } from "@/constants/encyclopediaSeedEntries";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ENTRY_TYPE_COLORS, ENTRY_TYPE_LABELS } from "@/constants/encyclopediaEntryTypes";
import { getCategory } from "@/constants/encyclopediaCategories";
import { EncyclopediaStatusBadge } from "./EncyclopediaStatusBadge";
import { EncyclopediaUserLanguageBlock } from "./EncyclopediaUserLanguageBlock";
import { EncyclopediaFounderNote } from "./EncyclopediaFounderNote";
import { EncyclopediaRelatedLinks } from "./EncyclopediaRelatedLinks";
import { resolveEntryStatus } from "@/lib/encyclopediaStatusResolver";
import { ShieldAlert } from "lucide-react";

export function EncyclopediaEntryDetail({
  entry, beginner, founder,
}: { entry: EncyclopediaEntry; beginner: boolean; founder: boolean }) {
  const cat = getCategory(entry.category);
  const status = resolveEntryStatus(entry, { beginner, founder });

  const showPro = !beginner || founder;
  const showFounder = founder;

  if (status.requiresFounder && !founder) {
    return (
      <Card className="p-6 border-amber-500/40">
        <div className="flex items-center gap-2 text-amber-300 mb-2">
          <ShieldAlert className="w-4 h-4" />
          <h3 className="text-sm font-medium">该条目受创始人模式保护</h3>
        </div>
        <p className="text-xs text-muted-foreground">{entry.shortDefinition}</p>
        <p className="text-xs text-muted-foreground mt-2">
          仅在创始人模式下可查看完整解释与相关源文件。
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Badge variant="outline" className={`text-[10px] ${ENTRY_TYPE_COLORS[entry.entryType]}`}>
            {ENTRY_TYPE_LABELS[entry.entryType]}
          </Badge>
          <EncyclopediaStatusBadge status={entry.status} />
          {cat && <Badge variant="outline" className="text-[10px]">{cat.title} · {cat.en}</Badge>}
        </div>
        <h1 className="font-display text-2xl gold-text">{entry.title}</h1>
        {entry.aliases.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1">别名：{entry.aliases.join(" / ")}</div>
        )}
        <p className="text-sm text-muted-foreground mt-3">{entry.shortDefinition}</p>
        {status.warning && (
          <div className="mt-3 text-[11px] text-amber-300/90 border border-amber-500/30 rounded px-2 py-1.5">
            ⚠ {status.warning}
          </div>
        )}
      </Card>

      <Tabs defaultValue="user">
        <TabsList>
          <TabsTrigger value="user">用户语言</TabsTrigger>
          {showPro && <TabsTrigger value="pro">专业解释</TabsTrigger>}
          {showFounder && <TabsTrigger value="founder">创始人备注</TabsTrigger>}
          <TabsTrigger value="meta">元信息</TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-3 space-y-3">
          <EncyclopediaUserLanguageBlock entry={entry} />
          <Card className="p-4">
            <div className="text-[10px] tracking-[0.18em] text-muted-foreground mb-1">为什么重要</div>
            <p className="text-sm">{entry.whyItMatters}</p>
          </Card>
          {entry.safetyNotes.length > 0 && (
            <Card className="p-4 border-red-500/30 bg-red-500/5">
              <div className="text-[10px] tracking-[0.18em] text-red-300 mb-1">安全边界</div>
              <ul className="text-xs space-y-1">
                {entry.safetyNotes.map((s, i) => <li key={i}>· {s}</li>)}
              </ul>
            </Card>
          )}
        </TabsContent>

        {showPro && (
          <TabsContent value="pro" className="mt-3 space-y-3">
            <Card className="p-4">
              <div className="text-[10px] tracking-[0.18em] text-muted-foreground mb-1">专业解释</div>
              <p className="text-sm leading-relaxed">{entry.professionalExplanation}</p>
            </Card>
            {entry.technicalTerms.length > 0 && (
              <Card className="p-4">
                <div className="text-[10px] tracking-[0.18em] text-muted-foreground mb-1">技术术语</div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.technicalTerms.map(t => (
                    <span key={t} className="text-[11px] border border-border/50 rounded px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
        )}

        {showFounder && (
          <TabsContent value="founder" className="mt-3 space-y-3">
            <EncyclopediaFounderNote entry={entry} />
            <Card className="p-4">
              <div className="text-[10px] tracking-[0.18em] text-muted-foreground mb-1">挂载页面</div>
              <div className="text-xs">{entry.whereItAppears.join(" · ") || "—"}</div>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="meta" className="mt-3 space-y-3">
          <Card className="p-4 text-xs space-y-1.5">
            <div>条目 ID：<span className="font-mono">{entry.id}</span></div>
            <div>分类：{cat?.title ?? entry.category}</div>
            <div>引入版本：{entry.versionIntroduced}</div>
            <div>关联模块：{entry.relatedModules.join(" · ") || "—"}</div>
            <div>挂载页面：{entry.whereItAppears.join(" · ") || "—"}</div>
          </Card>
        </TabsContent>
      </Tabs>

      <EncyclopediaRelatedLinks entry={entry} />
    </div>
  );
}
