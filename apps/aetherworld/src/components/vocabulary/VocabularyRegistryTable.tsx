import { useState, useMemo } from "react";
import { VOCABULARY_REGISTRY } from "@/lib/vocabulary/vocabularyRegistry";
import { TERM_CATEGORIES } from "@/constants/vocabulary/termCategories";
import { TERM_SYSTEM_LAYERS } from "@/constants/vocabulary/termSystemLayers";
import { TERM_MATURITY_LEVELS } from "@/constants/vocabulary/termMaturityLevels";
import { TERM_AUDIENCE_MODES } from "@/constants/vocabulary/termAudienceModes";
import { TermCard } from "./TermCard";

export function VocabularyRegistryTable() {
  const [cat, setCat] = useState<string>("ALL");
  const [layer, setLayer] = useState<string>("ALL");
  const [maturity, setMaturity] = useState<string>("ALL");
  const [audience, setAudience] = useState<string>("ALL");
  const [founder, setFounder] = useState(false);

  const filtered = useMemo(() => VOCABULARY_REGISTRY.filter((t) => {
    if (cat !== "ALL" && t.category !== cat) return false;
    if (layer !== "ALL" && t.systemLayer !== layer) return false;
    if (maturity !== "ALL" && t.maturity !== maturity) return false;
    if (audience !== "ALL" && t.audienceMode !== audience) return false;
    if (founder && !t.founderLocked) return false;
    return true;
  }), [cat, layer, maturity, audience, founder]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        <select className="h-9 rounded border border-border/60 bg-card/40 px-2" value={cat} onChange={(e)=>setCat(e.target.value)}>
          <option value="ALL">全部分类</option>
          {TERM_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select className="h-9 rounded border border-border/60 bg-card/40 px-2" value={layer} onChange={(e)=>setLayer(e.target.value)}>
          <option value="ALL">全部系统层</option>
          {TERM_SYSTEM_LAYERS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <select className="h-9 rounded border border-border/60 bg-card/40 px-2" value={maturity} onChange={(e)=>setMaturity(e.target.value)}>
          <option value="ALL">全部成熟度</option>
          {TERM_MATURITY_LEVELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <select className="h-9 rounded border border-border/60 bg-card/40 px-2" value={audience} onChange={(e)=>setAudience(e.target.value)}>
          <option value="ALL">全部受众</option>
          {TERM_AUDIENCE_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={founder} onChange={(e)=>setFounder(e.target.checked)} />
          仅 Founder 锁定
        </label>
      </div>
      <p className="text-xs text-muted-foreground">显示 {filtered.length} / {VOCABULARY_REGISTRY.length} 条</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t) => <TermCard key={t.termId} term={t} />)}
      </div>
      {filtered.length === 0 && (
        <div className="rounded-md border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          当前筛选下没有词条。试试清空筛选或更换分类。
        </div>
      )}
    </section>
  );
}
