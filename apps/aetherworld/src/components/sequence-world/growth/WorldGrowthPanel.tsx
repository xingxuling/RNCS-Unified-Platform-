import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { runWorldGrowth, type WorldGrowthResult } from "@/lib/sequence-world/growth/worldGrowthEngine";
import { WORLD_GROWTH_MODES, type WorldGrowthMode } from "@/constants/sequence-world/growth/worldGrowthModes";
import { WORLD_EXPANSION_TYPES, type WorldExpansionType } from "@/constants/sequence-world/growth/worldExpansionTypes";
import { WorldGrowthSafetyNote } from "./WorldGrowthSafetyNote";
import { getActiveSubjectProfile } from "@/lib/subject/activeSubjectModeResolver";
import { useFounderState } from "@/hooks/useFounderState";
import { Sprout, Wand2, GitBranch, AlertTriangle, Layers } from "lucide-react";
import type { SimulatedWorldState, SimulatedNpc } from "@/lib/sequence-world/simulation/worldSimulationCore";
import type { SimulatedZone } from "@/lib/sequence-world/simulation/zoneEcologyEngine";
import { buildDefaultZones } from "@/lib/sequence-world/simulation/zoneEcologyEngine";

const PRESET_EXAMPLES: Array<{ label: string; digits: string[]; mode: WorldGrowthMode; expansion?: WorldExpansionType; msl?: string }> = [
  { label: "让世界安全生长一次", digits: ["5"], mode: "SAFE" },
  { label: "55555 高变化扩张", digits: ["5","5","5"], mode: "CREATIVE", expansion: "ZONE_EXPANSION" },
  { label: "11111 主权核心扩张", digits: ["1"], mode: "CANONICAL", expansion: "ZONE_EXPANSION" },
  { label: "22222 关系网络扩张", digits: ["2"], mode: "CREATIVE", expansion: "RELATION_EXPANSION" },
  { label: "33333 符号城市扩张", digits: ["3"], mode: "CREATIVE", expansion: "ZONE_EXPANSION" },
  { label: "66665 生命承载扩张", digits: ["6","6","6","6","5"], mode: "SAFE", expansion: "ZONE_EXPANSION" },
  { label: "运行 BLOCK 49..60 再创世", digits: ["4","9","5","5","0"], mode: "CANONICAL", msl: "WORLD_EVOLVE { source: BLOCK 49..60; mode: CANONICAL }" },
  { label: "检查并修复矛盾", digits: ["4"], mode: "AUTO_REPAIR" },
  { label: "压缩为剧情圣经", digits: ["3"], mode: "AUTO_REPAIR" },
  { label: "创建分支并导出 Godot", digits: ["9"], mode: "CREATIVE", expansion: "TIMELINE_EXPANSION" },
];

function mockState(digits: string[]): { state: SimulatedWorldState; zones: SimulatedZone[]; npcs: SimulatedNpc[] } {
  const state: SimulatedWorldState = {
    worldId: "world-growth-sandbox",
    phase: "EXPANSION",
    tick: 12,
    entropyLevel: 0.55,
    stability: 0.6,
    eventPressure: 0.4,
    causalDensity: 0.5,
    activeDigits: digits,
    summary: `演示世界｜主导 ${digits.join(",")}`,
  } as SimulatedWorldState;
  const zones = buildDefaultZones(digits);
  const npcs: SimulatedNpc[] = [{
    npcId: "npc-seed", name: "种子守护者", archetype: "守护者",
    currentZone: zones[0]?.zoneId ?? "z-core", currentGoal: "维持核心",
    trust: 0.6, conflict: 0.2, memoryCount: 1, likelyNextAction: "巡视",
  }];
  return { state, zones, npcs };
}

export function WorldGrowthPanel() {
  const profile = getActiveSubjectProfile();
  const { active: isFounder } = useFounderState();
  const [mode, setMode] = useState<WorldGrowthMode>("SAFE");
  const [expansion, setExpansion] = useState<WorldExpansionType | "AUTO">("AUTO");
  const [digits, setDigits] = useState("5");
  const [steps, setSteps] = useState(6);
  const [msl, setMsl] = useState("");
  const [result, setResult] = useState<WorldGrowthResult | null>(null);

  const isFull60 = profile.subjectMode === "FULL_60";
  const seed = useMemo(() => mockState(digits.split(/[,\s]+/).filter(Boolean)), [digits]);

  const run = (overrides?: Partial<{ mode: WorldGrowthMode; expansion: WorldExpansionType; digits: string[]; msl: string }>) => {
    const m = overrides?.mode ?? mode;
    const e = overrides?.expansion ?? (expansion === "AUTO" ? undefined : expansion);
    const d = overrides?.digits ?? digits.split(/[,\s]+/).filter(Boolean);
    const seedData = mockState(d);
    const r = runWorldGrowth({
      worldId: seedData.state.worldId,
      worldState: seedData.state,
      zones: seedData.zones,
      npcs: seedData.npcs,
      growthMode: m,
      mslProgram: (overrides?.msl ?? msl) || undefined,
      maxGrowthSteps: steps,
      preferredExpansion: e,
      sourceDigits: d,
      isFull60,
      isFounder,
    });
    setResult(r);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Sprout className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Self-Growing World OS · v0.3</h1>
          <Badge variant="outline" className="ml-1">数列世界操作系统</Badge>
          <Badge variant="secondary">主体：{profile.subjectMode}</Badge>
          {isFounder && <Badge>FOUNDER</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          世界生长 = 模拟态 × MSL 演化 × 区域扩张 × NPC生成 × 任务变异 × 规则演化 × 资源经济 × 叙事记忆 × 正典 × 用户反馈 ÷ 矛盾 ÷ 膨胀 ÷ 滥用 ÷ 虚实混淆。
        </p>
      </header>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-medium">当前世界状态（沙盘）</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Stat label="相位" value={seed.state.phase} />
          <Stat label="Tick" value={String(seed.state.tick)} />
          <Stat label="熵值" value={seed.state.entropyLevel.toFixed(2)} />
          <Stat label="主导数" value={seed.state.activeDigits.join("·") || "—"} />
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">生长模式</label>
            <Select value={mode} onValueChange={v => setMode(v as WorldGrowthMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORLD_GROWTH_MODES.map(m => (
                  <SelectItem key={m.id} value={m.id} disabled={m.id === "FOUNDER" && !isFounder}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">扩张类型</label>
            <Select value={expansion} onValueChange={v => setExpansion(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">自动选择</SelectItem>
                {WORLD_EXPANSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">来源数字（空格分隔）</label>
            <Input value={digits} onChange={e => setDigits(e.target.value)} placeholder="例如 5 5 5" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">最大生长步数（≤24）</label>
            <Input type="number" min={1} max={24} value={steps} onChange={e => setSteps(Number(e.target.value || 1))} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">MSL 演化程序（可选）</label>
          <Input value={msl} onChange={e => setMsl(e.target.value)} placeholder="WORLD_EVOLVE { source: BLOCK 49..60; mode: CANONICAL }" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run()}><Sprout className="size-4 mr-1" />Grow World</Button>
          <Button variant="outline" onClick={() => run({ expansion: "ZONE_EXPANSION" })}>Expand Zone</Button>
          <Button variant="outline" onClick={() => run({ expansion: "NPC_EXPANSION" })}>Create NPC</Button>
          <Button variant="outline" onClick={() => run({ expansion: "QUEST_EXPANSION" })}>Generate Quest Chain</Button>
          <Button variant="outline" onClick={() => run({ mode: "AUTO_REPAIR" })}><AlertTriangle className="size-4 mr-1" />Check Contradictions</Button>
          <Button variant="outline" onClick={() => run({ mode: "AUTO_REPAIR" })}><Layers className="size-4 mr-1" />Compress World</Button>
          <Button variant="outline" onClick={() => run({ expansion: "TIMELINE_EXPANSION" })}><GitBranch className="size-4 mr-1" />Create Branch</Button>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">预置示例</div>
          <div className="flex flex-wrap gap-2">
            {PRESET_EXAMPLES.map((p, i) => (
              <Button key={i} size="sm" variant="secondary" onClick={() => {
                setMode(p.mode); setDigits(p.digits.join(" ")); if (p.expansion) setExpansion(p.expansion); if (p.msl) setMsl(p.msl);
                run({ mode: p.mode, expansion: p.expansion, digits: p.digits, msl: p.msl });
              }}>
                <Wand2 className="size-3 mr-1" />{i + 1}. {p.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {result && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge>步骤 {result.growthSteps.length}</Badge>
            <Badge variant="outline">新区域 {result.newZones.length}</Badge>
            <Badge variant="outline">新NPC {result.newNpcs.length}</Badge>
            <Badge variant="outline">新规则 {result.newRules.length}</Badge>
            <Badge variant="outline">正典 {result.canonUpdates.length}</Badge>
            <Badge variant={result.contradictions.length ? "destructive" : "outline"}>矛盾 {result.contradictions.length}</Badge>
            <Badge variant="outline">分支 {result.branchTimelines.length}</Badge>
          </div>

          <Section title="生长步骤（含原因）">
            <ul className="space-y-1 text-xs">
              {result.growthSteps.map(s => (
                <li key={s.stepId} className="flex gap-2">
                  <Badge variant="outline" className="shrink-0">{s.stepType}</Badge>
                  <span className="text-foreground/90">{s.resultSummary}</span>
                  <span className="text-muted-foreground">— {s.reason}（来源 {s.sourceTrigger}）</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="新增正典（自动草拟）">
            <ul className="text-xs space-y-1">
              {result.canonUpdates.map(c => (
                <li key={c.id}>
                  <Badge variant="secondary" className="mr-1">{c.canonLevel}</Badge>
                  <span className="font-medium">{c.title}</span>
                  <span className="text-muted-foreground"> · {c.entryType} · {c.knowledgeMarker} · {c.accessLevel}</span>
                </li>
              ))}
            </ul>
          </Section>

          {result.contradictions.length > 0 && (
            <Section title="矛盾与建议修复">
              <ul className="text-xs space-y-1">
                {result.contradictions.map(c => (
                  <li key={c.id}>
                    <Badge variant="destructive" className="mr-1">{c.severity}</Badge>
                    <span>{c.contradictionType} — {c.explanation}</span>
                    <span className="text-muted-foreground"> → {c.suggestedFix}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {result.compressionResult && (
            <Section title="压缩结果">
              <div className="text-xs text-muted-foreground">{result.compressionResult.summary}</div>
              <div className="text-xs">下一步：{result.compressionResult.nextRecommendedAction}</div>
            </Section>
          )}

          {result.branchTimelines.length > 0 && (
            <Section title="生成的分支时间线">
              <ul className="text-xs space-y-1">
                {result.branchTimelines.map(t => (
                  <li key={t.timelineId}>
                    <Badge variant="outline" className="mr-1">{t.currentPhase}</Badge>
                    {t.name} · tick {t.branchPointTick} · {t.branchReason}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="资产注册（内部价值，不可交易）">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {result.registeredAssets.map(a => (
                <div key={a.assetId} className="border rounded px-2 py-1">
                  <div className="font-medium truncate">{a.name}</div>
                  <div className="text-muted-foreground">{a.assetType} · 价值 {a.valueScore}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="下一步建议">
            <p className="text-sm">{result.nextRecommendedAction}</p>
          </Section>
        </Card>
      )}

      <WorldGrowthSafetyNote notes={result?.safetyNotes} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded px-2 py-1.5">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
      {children}
    </div>
  );
}
