import { useState } from "react";
import { CREATION_OBJECT_TYPES } from "@/constants/creationObjectTypes";
import type { CreationInput } from "@/lib/creationSeedCompiler";

interface Props {
  value: CreationInput;
  onChange: (v: CreationInput) => void;
}

export function VirtualCreationInput({ value, onChange }: Props) {
  const [constraintDraft, setConstraintDraft] = useState("");
  const [inspDraft, setInspDraft] = useState("");
  const u = <K extends keyof CreationInput>(k: K, v: CreationInput[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="aether-card p-5 space-y-3">
      <div className="text-sm font-medium">输入你想创造的东西</div>
      <input className="w-full bg-background/40 border border-border/50 rounded px-3 py-2 text-sm"
        placeholder="名称（例：低成本通用 MR 设备）" value={value.name} onChange={e => u("name", e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs space-y-1">
          <div className="text-muted-foreground">对象类型</div>
          <select className="w-full bg-background/40 border border-border/50 rounded px-2 py-1.5"
            value={value.objectType} onChange={e => u("objectType", e.target.value)}>
            {CREATION_OBJECT_TYPES.map(t => <option key={t.id} value={t.id}>{t.userFriendlyName} · {t.name}</option>)}
          </select>
        </label>
        <label className="text-xs space-y-1">
          <div className="text-muted-foreground">安全等级</div>
          <select className="w-full bg-background/40 border border-border/50 rounded px-2 py-1.5"
            value={value.safetyLevel ?? "MEDIUM"} onChange={e => u("safetyLevel", e.target.value as CreationInput["safetyLevel"])}>
            <option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option>
          </select>
        </label>
      </div>

      <textarea className="w-full bg-background/40 border border-border/50 rounded px-3 py-2 text-sm min-h-[100px]"
        placeholder="描述这个创造物的形态、材料、功能、用法、灵感来源……"
        value={value.description} onChange={e => u("description", e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <input className="bg-background/40 border border-border/50 rounded px-3 py-1.5"
          placeholder="目标用户（例：独立创作者）" value={value.targetUser ?? ""} onChange={e => u("targetUser", e.target.value)} />
        <input className="bg-background/40 border border-border/50 rounded px-3 py-1.5"
          placeholder="目标场域（例：开发者社区/小红书）" value={value.targetEnvironment ?? ""} onChange={e => u("targetEnvironment", e.target.value)} />
        <input className="bg-background/40 border border-border/50 rounded px-3 py-1.5 md:col-span-2"
          placeholder="期望主要功能" value={value.desiredFunction ?? ""} onChange={e => u("desiredFunction", e.target.value)} />
      </div>

      <ChipEditor label="约束条件" items={value.constraints ?? []} draft={constraintDraft} setDraft={setConstraintDraft}
        onChange={list => u("constraints", list)} />
      <ChipEditor label="灵感来源（用于污染识别）" items={value.inspirationSources ?? []} draft={inspDraft} setDraft={setInspDraft}
        onChange={list => u("inspirationSources", list)} />
    </div>
  );
}

function ChipEditor({ label, items, draft, setDraft, onChange }: {
  label: string; items: string[]; draft: string;
  setDraft: (s: string) => void; onChange: (l: string[]) => void;
}) {
  const add = () => {
    const t = draft.trim();
    if (!t || items.includes(t)) { setDraft(""); return; }
    onChange([...items, t]); setDraft("");
  };
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex gap-2">
        <input className="flex-1 bg-background/40 border border-border/50 rounded px-2 py-1.5 text-sm"
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="输入后回车" />
        <button onClick={add} className="px-3 py-1.5 text-xs rounded bg-primary/20 hover:bg-primary/30">添加</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(s => (
          <button key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-background/60 border border-border/40 hover:border-destructive/60"
            onClick={() => onChange(items.filter(x => x !== s))}>{s} ×</button>
        ))}
      </div>
    </div>
  );
}
