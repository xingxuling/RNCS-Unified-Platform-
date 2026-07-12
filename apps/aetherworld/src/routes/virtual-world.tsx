import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { VIRTUAL_WORLD_MODES, type VirtualWorldModeId } from "@/constants/virtualWorldModes";
import { generateVirtualWorld, type VirtualWorldState } from "@/lib/virtualWorldEngine";
import { loadAllWorldStates, loadWorldState, deleteWorldState } from "@/lib/worldMemoryEngine";
import { compileWorldNarrative } from "@/lib/worldNarrativeCompiler";
import { getActiveSubject } from "@/lib/store";
import { useFounderState } from "@/hooks/useFounderState";
import { Button } from "@/components/ui/button";
import { WorldSeedCard } from "@/components/WorldSeedCard";
import { CharacterGenesisCard } from "@/components/CharacterGenesisCard";
import { WorldMapPanel } from "@/components/WorldMapPanel";
import { QuestBoard } from "@/components/QuestBoard";
import { NPCRelationshipMap } from "@/components/NPCRelationshipMap";
import { CausalityChainPanel } from "@/components/CausalityChainPanel";
import { WorldMemoryPanel } from "@/components/WorldMemoryPanel";
import { VirtualWorldNarrativeReport } from "@/components/VirtualWorldNarrativeReport";
import { VirtualWorldSafetyNote } from "@/components/VirtualWorldSafetyNote";
import { VirtualWorldExportPanel } from "@/components/VirtualWorldExportPanel";
import { Trash2, Globe2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/virtual-world")({
  head: () => ({ meta: [
    { title: "虚拟世界｜Aether Fate Engine" },
    { name: "description", content: "把你的结构生成成一个可继续演化的个人虚拟世界。" },
  ]}),
  component: VirtualWorldPage,
});

function VirtualWorldPage() {
  const { active: founderActive } = useFounderState();
  const [mode, setMode] = useState<VirtualWorldModeId>("DEMO_WORLD");
  const [current, setCurrent] = useState<VirtualWorldState | null>(null);
  const [history, setHistory] = useState<VirtualWorldState[]>(() => loadAllWorldStates());

  const modes = useMemo(
    () => VIRTUAL_WORLD_MODES.filter(m => !m.requiresFounder || founderActive),
    [founderActive],
  );

  const subject = getActiveSubject();

  const handleGenerate = () => {
    const m = VIRTUAL_WORLD_MODES.find(x => x.id === mode)!;
    const state = generateVirtualWorld({
      subjectMode: m.recommendedSubjectMode,
      subject,
      selectedWorldMode: mode,
    }, subject);
    setCurrent(state);
    setHistory(loadAllWorldStates());
  };

  const handleLoad = (id: string) => {
    const s = loadWorldState(id);
    if (s) setCurrent(s);
  };

  const handleDelete = (id: string) => {
    deleteWorldState(id);
    setHistory(loadAllWorldStates());
    if (current?.worldId === id) setCurrent(null);
  };

  const report = current ? compileWorldNarrative(current) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Virtual World OS · v0.1</div>
        <h1 className="font-display text-3xl gold-text mt-1 flex items-center gap-3">
          <Globe2 className="w-7 h-7" /> 个人虚拟世界底层系统
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
          这是一个象征性个人世界，不是绝对命运。它帮助你把复杂状态看成一个更容易理解的世界地图。
        </p>
      </header>

      <VirtualWorldSafetyNote worldMode={mode} />

      <section className="aether-card-elevated p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Mode · 选择虚拟世界模式</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {modes.map(m => (
            <button key={m.id}
              className={`text-left aether-card p-3 border transition ${
                mode === m.id ? "border-primary/60" : "border-border hover:border-primary/30"}`}
              onClick={() => setMode(m.id)}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{m.name}</div>
                <span className="text-[10px] text-muted-foreground">{m.enName}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{m.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {m.bias.map(b => (
                  <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{b}</span>
                ))}
              </div>
              <div className="text-[10px] text-amber-400/80 mt-2">{m.safetyHint}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleGenerate}>生成虚拟世界</Button>
          {current && <Button variant="outline" onClick={handleGenerate}><RefreshCw className="w-3.5 h-3.5 mr-1" />重新生成</Button>}
        </div>
      </section>

      {history.length > 0 && (
        <section className="aether-card p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">已保存的世界</div>
          <div className="flex flex-wrap gap-2">
            {history.map(h => (
              <div key={h.worldId} className="flex items-center gap-1">
                <Button size="sm" variant={current?.worldId === h.worldId ? "default" : "outline"}
                  onClick={() => handleLoad(h.worldId)}>{h.worldName}</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(h.worldId)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {current && report && (
        <>
          <VirtualWorldNarrativeReport report={report} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WorldSeedCard seed={current.seed} />
            <CharacterGenesisCard character={current.character} />
          </div>
          <WorldMemoryPanel state={current} />
          <WorldMapPanel zones={current.zones} />
          <QuestBoard quests={current.quests} />
          <NPCRelationshipMap npcs={current.npcs} />
          <CausalityChainPanel chains={current.causalityChains} />

          <section className="aether-card-elevated p-5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">World Laws · 世界法则</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {current.worldLaws.map(l => (
                <div key={l.id} className="aether-card p-3">
                  <div className="text-sm font-medium">{l.userFriendlyName} <span className="text-[10px] text-muted-foreground">{l.name}</span></div>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{l.explanation}</p>
                  <div className="text-[10px] text-primary/80 mt-1">玩法含义：{l.gameplayMeaning}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">来源：{l.technicalBasis.join(" · ")}</div>
                </div>
              ))}
            </div>
          </section>

          <VirtualWorldExportPanel state={current} />

          <nav className="flex flex-wrap gap-2 text-xs">
            <Link to="/world-map" className="px-3 py-1.5 rounded border border-border hover:border-primary/40">地图详情</Link>
            <Link to="/world-character" className="px-3 py-1.5 rounded border border-border hover:border-primary/40">角色详情</Link>
            <Link to="/world-quests" className="px-3 py-1.5 rounded border border-border hover:border-primary/40">任务板</Link>
            <Link to="/world-npcs" className="px-3 py-1.5 rounded border border-border hover:border-primary/40">NPC 关系网</Link>
            <Link to="/world-causality" className="px-3 py-1.5 rounded border border-border hover:border-primary/40">因果链</Link>
          </nav>
        </>
      )}

      {!current && (
        <div className="aether-card p-6 text-center text-sm text-muted-foreground">
          选择上方模式并点击「生成虚拟世界」开始你的个人世界底盘。
        </div>
      )}
    </div>
  );
}
