// src/components/UniverseForgeEditor.tsx
import React, { useState } from "react";
import { UniversePreset, createWorldFromPreset } from "../seed-runtime/universeForge";
import { WorldState } from "../seed-runtime/seedRuntime";

import { PlusCircle, Sparkles } from "lucide-react";

const defaultPresets: UniversePreset[] = [
  {
    id: "aetherion-core",
    name: "Aetherion · Core Lineage",
    aetherDensity: 0.7,
    structuralPressure: 0.45,
    entropyLevel: 0.25,
    mainEntityName: "杜浩麟 · 蓝天机",
    description: "主线起源宇宙：以文明级结构意识为核心。",
  },
  {
    id: "mirror-branch",
    name: "Mirror Branch · 反射宇宙",
    aetherDensity: 0.55,
    structuralPressure: 0.5,
    entropyLevel: 0.4,
    mainEntityName: "蓝天机·镜像分身",
    description: "用于模拟偏离主线后，文明自救与重构的支线宇宙。",
  },
];

export const UniverseForgeEditor: React.FC = () => {
  const [presets, setPresets] = useState<UniversePreset[]>(defaultPresets);
  const [selectedId, setSelectedId] = useState<string>(defaultPresets[0].id);

  const selectedPreset = presets.find((p) => p.id === selectedId)!;
  const [editing, setEditing] = useState<UniversePreset>(selectedPreset);

  const [previewWorld, setPreviewWorld] = useState<WorldState>(() =>
    createWorldFromPreset(selectedPreset)
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const p = presets.find((x) => x.id === id)!;
    setEditing(p);
    setPreviewWorld(createWorldFromPreset(p));
  };

  const handleFieldChange = <K extends keyof UniversePreset>(
    key: K,
    value: UniversePreset[K]
  ) => {
    setEditing((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setPresets((prev) =>
      prev.map((p) => (p.id === editing.id ? editing : p))
    );
    setPreviewWorld(createWorldFromPreset(editing));
  };

  const handleAdd = () => {
    const id = `universe-${Date.now()}`;
    const p: UniversePreset = {
      id,
      name: "New Universe",
      aetherDensity: 0.5,
      structuralPressure: 0.4,
      entropyLevel: 0.5,
      mainEntityName: "Unnamed Mainline Node",
      description: "",
    };
    setPresets((prev) => [...prev, p]);
    setSelectedId(id);
    setEditing(p);
    setPreviewWorld(createWorldFromPreset(p));
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* 左侧：宇宙列表 */}
      <div className="col-span-3 border border-slate-800/70 rounded-2xl p-3 bg-slate-950/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Universe Presets
          </span>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-slate-700 hover:bg-slate-900"
          >
            <PlusCircle className="w-3 h-3" />
            New
          </button>
        </div>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs border ${
                p.id === selectedId
                  ? "border-cyan-400/80 bg-cyan-500/10"
                  : "border-slate-800 hover:border-slate-600 hover:bg-slate-900/60"
              }`}
            >
              <div className="font-medium text-slate-100">{p.name}</div>
              <div className="text-[10px] text-slate-400 truncate">
                {p.description || "No description"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 中间：表单编辑 */}
      <div className="col-span-4 border border-slate-800/70 rounded-2xl p-4 bg-slate-950/60">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Universe Config
            </div>
            <div className="text-sm text-slate-100">
              {editing.name || "Unnamed Universe"}
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <LabeledInput
            label="Universe ID"
            value={editing.id}
            onChange={(v) => handleFieldChange("id", v)}
          />
          <LabeledInput
            label="Universe Name"
            value={editing.name}
            onChange={(v) => handleFieldChange("name", v)}
          />
          <LabeledTextArea
            label="Description"
            value={editing.description ?? ""}
            onChange={(v) => handleFieldChange("description", v)}
          />
          <div className="grid grid-cols-3 gap-2">
            <LabeledNumber
              label="Aether Density"
              value={editing.aetherDensity}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => handleFieldChange("aetherDensity", v)}
            />
            <LabeledNumber
              label="Structural Pressure"
              value={editing.structuralPressure}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => handleFieldChange("structuralPressure", v)}
            />
            <LabeledNumber
              label="Entropy Level"
              value={editing.entropyLevel}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => handleFieldChange("entropyLevel", v)}
            />
          </div>
          <LabeledInput
            label="Main Entity Name"
            value={editing.mainEntityName}
            onChange={(v) => handleFieldChange("mainEntityName", v)}
          />

          <button
            onClick={handleSave}
            className="mt-2 w-full text-xs py-2 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 font-semibold"
          >
            Save & Preview Universe
          </button>
        </div>
      </div>

      {/* 右侧：WorldState 概览 */}
      <div className="col-span-5 border border-slate-800/70 rounded-2xl p-4 bg-slate-950/60 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              WorldState Preview
            </div>
            <div className="text-sm text-slate-100">
              universeId: {previewWorld.universeId}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs mb-3">
          <InfoCard
            title="Global Parameters"
            items={[
              ["Aether Density", previewWorld.globalParameters.aetherDensity.toFixed(2)],
              [
                "Structural Pressure",
                previewWorld.globalParameters.structuralPressure.toFixed(2),
              ],
              ["Entropy Level", previewWorld.globalParameters.entropyLevel.toFixed(2)],
            ]}
          />
          <InfoCard
            title="Entities"
            items={[
              ["Count", String(previewWorld.entities.length)],
              [
                "Main Entity",
                previewWorld.entities[0]?.identityProfile?.name ?? "N/A",
              ],
            ]}
          />
          <InfoCard
            title="Fate Graph"
            items={[
              ["Nodes", String(previewWorld.fateGraph.nodes.length)],
              ["Arcs", String(previewWorld.fateGraph.arcs.length)],
              ["Timelines", String(previewWorld.activeTimelines.length)],
            ]}
          />
        </div>

        <div className="flex-1 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-[11px] overflow-y-auto">
          <div className="text-slate-400 mb-1">Raw WorldState (trimmed)</div>
          <pre className="whitespace-pre-wrap text-[10px] text-slate-300/90">
            {JSON.stringify(
              {
                universeId: previewWorld.universeId,
                entities: previewWorld.entities,
                globalParameters: previewWorld.globalParameters,
                activeTimelines: previewWorld.activeTimelines,
                fateNodes: previewWorld.fateGraph.nodes,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};

// 小工具组件
const LabeledInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[10px] text-slate-400">{label}</span>
    <input
      className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-[11px] outline-none focus:border-cyan-400"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

const LabeledTextArea: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[10px] text-slate-400">{label}</span>
    <textarea
      className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-[11px] outline-none focus:border-cyan-400 min-h-[60px]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

const LabeledNumber: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, min, max, step }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[10px] text-slate-400">{label}</span>
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-[11px] outline-none focus:border-cyan-400"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  </label>
);

const InfoCard: React.FC<{ title: string; items: [string, string][] }> = ({
  title,
  items,
}) => (
  <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 p-2">
    <div className="text-[10px] text-slate-400 mb-1">{title}</div>
    <div className="space-y-1">
      {items.map(([k, v]) => (
        <div
          key={k}
          className="flex justify-between gap-2 text-[10px] text-slate-300"
        >
          <span className="text-slate-500">{k}</span>
          <span className="font-mono">{v}</span>
        </div>
      ))}
    </div>
  </div>
);

