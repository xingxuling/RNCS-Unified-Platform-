import { useState } from "react";
import { RECALL_SIGNAL_TYPES, RECALL_SOURCE_CONTEXTS } from "@/constants/recallSignalTypes";
import { RECALL_RISK_TYPES } from "@/constants/recallRiskTypes";
import type { RecallFragment } from "@/lib/pastLifeRecallCalculus";

interface Props {
  value: RecallFragment;
  onChange: (next: RecallFragment) => void;
}

export function SubconsciousFragmentInput({ value, onChange }: Props) {
  const [symbolDraft, setSymbolDraft] = useState("");

  const update = <K extends keyof RecallFragment>(k: K, v: RecallFragment[K]) => onChange({ ...value, [k]: v });

  const addSymbol = () => {
    const t = symbolDraft.trim();
    if (!t) return;
    if (!value.symbols.includes(t)) update("symbols", [...value.symbols, t]);
    setSymbolDraft("");
  };

  const toggleSource = (id: string) => {
    const next = value.possibleExternalSources.includes(id)
      ? value.possibleExternalSources.filter(x => x !== id)
      : [...value.possibleExternalSources, id];
    update("possibleExternalSources", next);
  };

  return (
    <div className="aether-card p-5 space-y-4">
      <div className="text-sm font-medium">记录一段潜意识材料</div>

      <input
        className="w-full bg-background/40 border border-border/50 rounded px-3 py-2 text-sm"
        placeholder="标题（例：反复出现的白色高塔）"
        value={value.title}
        onChange={e => update("title", e.target.value)}
      />

      <textarea
        className="w-full bg-background/40 border border-border/50 rounded px-3 py-2 text-sm min-h-[100px]"
        placeholder="尽可能客观描述：场景、人物、声音、颜色、情绪、时间感……"
        value={value.description}
        onChange={e => update("description", e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs space-y-1">
          <div className="text-muted-foreground">信号类型</div>
          <select
            className="w-full bg-background/40 border border-border/50 rounded px-2 py-1.5"
            value={value.fragmentType}
            onChange={e => update("fragmentType", e.target.value)}
          >
            {RECALL_SIGNAL_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.userFriendlyName} · {t.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs space-y-1">
          <div className="text-muted-foreground">来源情境</div>
          <select
            className="w-full bg-background/40 border border-border/50 rounded px-2 py-1.5"
            value={value.sourceContext}
            onChange={e => update("sourceContext", e.target.value as RecallFragment["sourceContext"])}
          >
            {RECALL_SOURCE_CONTEXTS.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {([
          ["imageIntensity", "图像强度"],
          ["emotionalCharge", "情绪电荷"],
          ["recurrenceFrequency", "重复频率"],
          ["bodyResonance", "身体共振"],
          ["culturalDistance", "文化距离"],
          ["narrativeCoherence", "叙事连贯度"],
        ] as const).map(([k, label]) => (
          <label key={k} className="space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>{label}</span><span>{value[k]}/10</span>
            </div>
            <input type="range" min={0} max={10} value={value[k] as number}
              onChange={e => update(k, Number(e.target.value) as never)} className="w-full" />
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">符号标签（如：风、塔、剑、文字、神明）</div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-background/40 border border-border/50 rounded px-2 py-1.5 text-sm"
            placeholder="输入一个符号后回车"
            value={symbolDraft}
            onChange={e => setSymbolDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSymbol(); } }}
          />
          <button onClick={addSymbol} className="px-3 py-1.5 text-xs rounded bg-primary/20 hover:bg-primary/30">添加</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {value.symbols.map(s => (
            <button key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-background/60 border border-border/40 hover:border-destructive/60"
              onClick={() => update("symbols", value.symbols.filter(x => x !== s))}>
              {s} ×
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">最近是否接触过这些来源？（用于污染检测）</div>
        <div className="flex flex-wrap gap-1.5">
          {RECALL_RISK_TYPES.map(r => {
            const on = value.possibleExternalSources.includes(r.id);
            return (
              <button key={r.id}
                className={`text-[11px] px-2 py-1 rounded border ${on ? "bg-amber-500/20 border-amber-500/60" : "bg-background/40 border-border/40"}`}
                onClick={() => toggleSource(r.id)}>
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
