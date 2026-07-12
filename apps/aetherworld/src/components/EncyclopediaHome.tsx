import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EncyclopediaSearchBar } from "./EncyclopediaSearchBar";
import { EncyclopediaCategoryGrid } from "./EncyclopediaCategoryGrid";
import { EncyclopediaEntryCard } from "./EncyclopediaEntryCard";
import { EncyclopediaGlossaryTable } from "./EncyclopediaGlossaryTable";
import { EncyclopediaModuleMap } from "./EncyclopediaModuleMap";
import { EncyclopediaConceptGraph } from "./EncyclopediaConceptGraph";
import { searchEncyclopedia } from "@/lib/encyclopediaSearchEngine";
import { computeEncyclopediaCoverage, getAllEntries, getEntriesByCategory } from "@/lib/encyclopediaEngine";
import { ENCYCLOPEDIA_CATEGORIES } from "@/constants/encyclopediaCategories";
import { Badge } from "@/components/ui/badge";

const NEWBIE_PICKS = [
  { id: "aether-fate-engine", label: "这是什么？" },
  { id: "one-minute-onboarding", label: "我该怎么开始？" },
  { id: "determination", label: "什么是定数？" },
  { id: "feedback-loop", label: "什么是回验？" },
  { id: "demo-persona", label: "Demo 和我的模型有什么区别？" },
];

const HOT_CONCEPTS = [
  "determination", "trigger-calendar", "action-permission",
  "feedback-loop", "full-60", "prompt-forge",
];

export function EncyclopediaHome({
  beginner, founder, initialCategory,
}: { beginner: boolean; founder: boolean; initialCategory?: string }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | undefined>(initialCategory);

  const cov = useMemo(computeEncyclopediaCoverage, []);
  const hits = useMemo(() => searchEncyclopedia(q, 24), [q]);
  const catEntries = useMemo(() => (cat ? getEntriesByCategory(cat) : []), [cat]);

  const allMap = useMemo(() => {
    const m = new Map(getAllEntries().map(e => [e.id, e]));
    return m;
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <div className="text-[10px] tracking-[0.18em] text-muted-foreground">Aether Fate Engine Encyclopedia</div>
            <h1 className="font-display text-2xl gold-text">产品百科全书</h1>
            <p className="text-xs text-muted-foreground mt-1">
              可搜索、分类、分层阅读的产品知识库。想查一个词、一个模块、一个计算法，从这里开始。
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-wider text-muted-foreground">百科覆盖度</div>
            <div className="font-display text-2xl gold-text">{cov.score}</div>
            <Badge variant="outline" className="text-[10px]">{cov.band} · {cov.totalEntries} 条</Badge>
          </div>
        </div>
        <EncyclopediaSearchBar value={q} onChange={setQ} />
      </Card>

      {q.trim() && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">搜索结果（{hits.length}）</h3>
          {hits.length === 0 ? (
            <p className="text-xs text-muted-foreground">没找到匹配条目；试试「定数」「回验」「Full 60」。</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hits.map(h => <EncyclopediaEntryCard key={h.entry.id} entry={h.entry} />)}
            </div>
          )}
        </Card>
      )}

      <Tabs defaultValue="discover">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="discover">推荐</TabsTrigger>
          <TabsTrigger value="categories">分类</TabsTrigger>
          {cat && <TabsTrigger value="cat">当前分类</TabsTrigger>}
          <TabsTrigger value="glossary">术语表</TabsTrigger>
          <TabsTrigger value="modules">模块地图</TabsTrigger>
          <TabsTrigger value="graph">概念图谱</TabsTrigger>
          {!beginner && <TabsTrigger value="advanced">高阶入口</TabsTrigger>}
        </TabsList>

        <TabsContent value="discover" className="mt-4 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">新手推荐阅读</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {NEWBIE_PICKS.map(p => {
                const e = allMap.get(p.id);
                if (!e) return null;
                return (
                  <Link key={p.id} to="/encyclopedia-entry" search={{ id: p.id } as never}
                    className="rounded border border-border/40 p-3 hover:border-primary/50">
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{e.title} · {e.shortDefinition}</div>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">热门概念</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {HOT_CONCEPTS.map(id => {
                const e = allMap.get(id);
                return e ? <EncyclopediaEntryCard key={id} entry={e} /> : null;
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <EncyclopediaCategoryGrid beginner={beginner} />
          <div className="text-[11px] text-muted-foreground mt-3">
            点击分类卡片可以筛选条目。
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {ENCYCLOPEDIA_CATEGORIES
              .filter(c => beginner ? c.beginnerVisible : true)
              .map(c => (
                <button key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`text-[11px] px-2 py-1 rounded border ${cat === c.id ? "border-primary text-primary" : "border-border/50 text-muted-foreground hover:border-primary/50"}`}>
                  {c.title}
                </button>
              ))}
          </div>
        </TabsContent>

        {cat && (
          <TabsContent value="cat" className="mt-4">
            <div className="text-xs text-muted-foreground mb-3">分类：{cat}（{catEntries.length} 条）</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {catEntries.map(e => <EncyclopediaEntryCard key={e.id} entry={e} />)}
            </div>
          </TabsContent>
        )}

        <TabsContent value="glossary" className="mt-4">
          <EncyclopediaGlossaryTable />
        </TabsContent>

        <TabsContent value="modules" className="mt-4">
          <EncyclopediaModuleMap />
        </TabsContent>

        <TabsContent value="graph" className="mt-4">
          <EncyclopediaConceptGraph />
        </TabsContent>

        {!beginner && (
          <TabsContent value="advanced" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {["calculus-universe-encyclopedia", "constant-universe-calculus", "event-universe", "founder-console"]
              .map(id => allMap.get(id))
              .filter((e): e is NonNullable<typeof e> => !!e)
              .map(e => <EncyclopediaEntryCard key={e.id} entry={e} />)}
          </TabsContent>
        )}
      </Tabs>

      <Card className="p-4 border-border/40 bg-card/40">
        <div className="text-[10px] tracking-[0.18em] text-muted-foreground mb-1">百科与文档</div>
        <p className="text-xs text-muted-foreground">
          产品文档（<Link to="/docs" className="underline">/docs</Link>）适合连续阅读，像手册；
          百科全书适合搜索单个概念，像词典。两者互相链接。
        </p>
      </Card>
    </div>
  );
}
