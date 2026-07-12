import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CALCULUS_REGISTRY,
  CALCULUS_CATEGORIES,
  type CalculusCategoryId,
  type CalculusMaturity,
  type CalculusEntry,
} from "@/constants/calculus/calculusRegistry";
import { Copy, ChevronDown, ChevronRight, Lock, ShieldAlert } from "lucide-react";

const MATURITIES: (CalculusMaturity | "ALL")[] = ["ALL", "ACTIVE", "EXPERIMENTAL", "DRAFT", "CONCEPT", "FOUNDER_ONLY"];

const maturityClass = (m: CalculusMaturity) =>
  m === "ACTIVE" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
  : m === "EXPERIMENTAL" ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
  : m === "FOUNDER_ONLY" ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
  : "bg-muted text-muted-foreground border-border";

export function CalculusUniversePanel({ founder = false }: { founder?: boolean }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CalculusCategoryId | "ALL">("ALL");
  const [mat, setMat] = useState<CalculusMaturity | "ALL">("ALL");
  const [engine, setEngine] = useState<string>("ALL");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const engines = useMemo(() => {
    const s = new Set<string>();
    CALCULUS_REGISTRY.forEach(e => e.relatedEngines.forEach(x => s.add(x)));
    return ["ALL", ...Array.from(s).sort()];
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return CALCULUS_REGISTRY.filter(e => {
      if (cat !== "ALL" && e.category !== cat) return false;
      if (mat !== "ALL" && e.maturity !== mat) return false;
      if (engine !== "ALL" && !e.relatedEngines.includes(engine)) return false;
      if (!kw) return true;
      return (
        e.chineseName.toLowerCase().includes(kw) ||
        e.englishName.toLowerCase().includes(kw) ||
        e.id.includes(kw) ||
        e.userExplanation.toLowerCase().includes(kw)
      );
    });
  }, [q, cat, mat, engine]);

  const countByCat = useMemo(() => {
    const m: Record<string, number> = {};
    CALCULUS_REGISTRY.forEach(e => { m[e.category] = (m[e.category] ?? 0) + 1; });
    return m;
  }, []);

  return (
    <div className="space-y-4">
      {/* 安全边界 */}
      <Card className="p-4 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-300 mt-0.5" />
          <p className="text-xs leading-relaxed text-amber-100/90">
            计算法宇宙是 Aetherworld 内部的结构化方法、生成逻辑、判断逻辑与系统治理逻辑集合。
            它不是现实宇宙定律，不保证现实绝对预测，不替代医疗、法律、金融、心理诊断或专业工程判断。
          </p>
        </div>
      </Card>

      {/* 分类总览 */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">计算法分类总览（{CALCULUS_REGISTRY.length} 个条目）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {CALCULUS_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCat(cat === c.id ? "ALL" : c.id)}
              className={`text-left p-3 rounded border transition ${cat === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{c.title}</span>
                <Badge variant="outline" className="text-[10px]">{countByCat[c.id] ?? 0}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground">{c.en}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{c.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* 过滤器 */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="搜索计算法（中英文 / id / 解释）"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm h-8 text-xs"
          />
          <select
            value={mat}
            onChange={(e) => setMat(e.target.value as CalculusMaturity | "ALL")}
            className="h-8 text-xs bg-background border border-border rounded px-2"
          >
            {MATURITIES.map(m => <option key={m} value={m}>{m === "ALL" ? "全部成熟度" : m}</option>)}
          </select>
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            className="h-8 text-xs bg-background border border-border rounded px-2"
          >
            {engines.map(e => <option key={e} value={e}>{e === "ALL" ? "全部引擎" : e}</option>)}
          </select>
          {(cat !== "ALL" || mat !== "ALL" || engine !== "ALL" || q) && (
            <Button size="sm" variant="ghost" className="h-8 text-xs"
              onClick={() => { setCat("ALL"); setMat("ALL"); setEngine("ALL"); setQ(""); }}>
              清除筛选
            </Button>
          )}
          <span className="text-[11px] text-muted-foreground ml-auto">
            命中 {filtered.length} / {CALCULUS_REGISTRY.length}
          </span>
        </div>
      </Card>

      {/* 条目列表 */}
      <div className="space-y-2">
        {filtered.map(entry => (
          <CalculusEntryCard
            key={entry.id}
            entry={entry}
            founder={founder}
            open={!!open[entry.id]}
            onToggle={() => setOpen(o => ({ ...o, [entry.id]: !o[entry.id] }))}
          />
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            没有匹配的计算法条目。如发现缺失，请在 /software-qa 中提交补登。
          </Card>
        )}
      </div>
    </div>
  );
}

function CalculusEntryCard({
  entry, founder, open, onToggle,
}: { entry: CalculusEntry; founder: boolean; open: boolean; onToggle: () => void }) {
  const locked = entry.maturity === "FOUNDER_ONLY" && !founder;
  return (
    <Card className="p-4">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-2">
          {open ? <ChevronDown className="w-4 h-4 mt-0.5" /> : <ChevronRight className="w-4 h-4 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{entry.chineseName}</span>
              <span className="text-[11px] text-muted-foreground">{entry.englishName}</span>
              <Badge variant="outline" className={`text-[10px] ${maturityClass(entry.maturity)}`}>
                {entry.maturity}
              </Badge>
              {locked && <Badge variant="outline" className="text-[10px] gap-1"><Lock className="w-3 h-3" />Founder</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{entry.userExplanation}</p>
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-3 pl-6 space-y-3 border-l-2 border-border/50">
          {locked ? (
            <p className="text-xs text-amber-300">该计算法仅在创始人模式下展开。</p>
          ) : (
            <>
              <div>
                <div className="text-[10px] tracking-[0.18em] text-muted-foreground mb-1">专业解释</div>
                <p className="text-xs leading-relaxed">{entry.technicalExplanation}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="输入" items={entry.inputTypes} />
                <Field label="输出" items={entry.outputTypes} />
                <Field label="相关引擎" items={entry.relatedEngines} />
                <Field label="相关模块" items={entry.relatedModules} />
              </div>
              <div className="rounded border border-border/50 p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] tracking-[0.18em] text-muted-foreground">示例输入</div>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]"
                    onClick={() => navigator.clipboard?.writeText(entry.exampleInput)}>
                    <Copy className="w-3 h-3 mr-1" /> 复制
                  </Button>
                </div>
                <pre className="text-xs whitespace-pre-wrap font-mono">{entry.exampleInput}</pre>
                <div className="text-[10px] tracking-[0.18em] text-muted-foreground mt-2 mb-1">预期输出</div>
                <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">{entry.expectedOutput}</pre>
              </div>
              <div className="text-[11px] text-amber-300/90 border border-amber-500/30 rounded px-2 py-1.5">
                ⚠ 安全边界：{entry.safetyBoundary}
              </div>
              <div className="text-[10px] text-muted-foreground">ID: <span className="font-mono">{entry.id}</span></div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function Field({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-muted-foreground mb-1">{label}</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map(x => (
            <span key={x} className="text-[11px] border border-border/50 rounded px-1.5 py-0.5">{x}</span>
          ))}
        </div>
      )}
    </div>
  );
}
