import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CivilizationSafetyNote } from "./CivilizationSafetyNote";
import { runCivilizationEvolution, type CivilizationEvolutionResult } from "@/lib/sequence-world/civilization/civilizationEvolutionEngine";
import { exportCivilization, type CivilizationExportTarget } from "@/lib/sequence-world/civilization/civilizationRuntimeExportEngine";
import { resolveActiveMode } from "@/lib/subject/activeSubjectModeResolver";

const PRESETS = [
  "让当前世界文明进入下一个时代。",
  "生成文明历史时间线。",
  "基于 BLOCK 49..60 生成文明再创世史。",
  "生成文明技术树。",
  "生成一次资源危机与改革。",
  "生成一次战争与和平条约。",
  "生成一个历史人物。",
  "生成一个文明神话。",
  "将文明历史压缩成剧情圣经。",
  "导出 Godot 文明 Runtime JSON。",
];

function digitsFromText(text: string): string[] {
  return (text.match(/\d/g) ?? []).slice(0, 60);
}

export function CivilizationEvolutionPanel() {
  const subject = resolveActiveMode();
  const [worldId, setWorldId] = useState("world-civ-demo");
  const [userAction, setUserAction] = useState("");
  const [digitsText, setDigitsText] = useState("1 2 3 4 5 6 7 8 9 0 5 5 5 4 9");
  const [eraSteps, setEraSteps] = useState(6);
  const [maxEvents, setMaxEvents] = useState(24);
  const [mode, setMode] = useState<"SAFE"|"CREATIVE"|"HISTORICAL"|"MYTHIC"|"FOUNDER">("HISTORICAL");
  const [result, setResult] = useState<CivilizationEvolutionResult | null>(null);
  const [exportTarget, setExportTarget] = useState<CivilizationExportTarget>("CHRONICLE_MARKDOWN");
  const [exportText, setExportText] = useState<string>("");

  const isFull60 = subject?.resolvedMode === "FULL_60";

  const run = () => {
    const r = runCivilizationEvolution({
      worldId,
      societyState: {
        factions: [
          { factionId: "f-archive", name: "档案公会" },
          { factionId: "f-wind", name: "风行者" },
          { factionId: "f-forge", name: "资源锻炉" },
        ],
        institutions: [
          { institutionId: "i-council", name: "议会", institutionType: "COUNCIL" },
          { institutionId: "i-archive", name: "档案馆", institutionType: "ARCHIVE" },
          { institutionId: "i-market", name: "市场", institutionType: "MARKET" },
        ],
        npcAgents: [],
        socialConflictsCount: 2,
      },
      evolutionMode: mode,
      userAction: userAction || undefined,
      eraSteps, maxHistoricalEvents: maxEvents,
      sourceDigits: digitsFromText(digitsText),
      subjectMode: subject?.resolvedMode ?? "DEMO",
      isFull60,
    });
    setResult(r);
  };

  const doExport = () => {
    if (!result) return;
    const pkg = exportCivilization({
      target: exportTarget, evolution: result,
      subjectMode: subject?.resolvedMode ?? "DEMO", isFull60,
    });
    setExportText(typeof pkg.payload === "string" ? pkg.payload : JSON.stringify(pkg, null, 2));
  };

  const overview = useMemo(() => {
    if (!result) return null;
    return [
      { label: "当前时代", value: result.currentEra.name },
      { label: "文明阶段", value: result.civilizationPhaseLabel },
      { label: "周期", value: `${result.cycleState.cycleLabel} · ${result.cycleState.currentStage}` },
      { label: "稳定度", value: result.cycleState.stability },
      { label: "崩塌风险", value: result.cycleState.collapseRisk },
      { label: "复兴潜力", value: result.cycleState.renewalPotential },
      { label: "技术等级", value: result.technologyTree.currentLevel },
      { label: "魔法/科技/规则模式", value: result.magicRuleTechState.modeLabel },
      { label: "历史事件数", value: result.timeline.events.length },
      { label: "历史人物数", value: result.historicalFigures.length },
    ];
  }, [result]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Civilization Evolution Core v0.5</h1>
          <p className="text-sm text-muted-foreground">数列驱动文明演化与历史模拟内核</p>
        </div>
        <Badge variant="outline">主体模式：{subject?.resolvedMode ?? "DEMO"}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">演化控制台</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">世界 ID</Label>
              <Input value={worldId} onChange={e => setWorldId(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">演化模式</Label>
              <select className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                value={mode} onChange={e => setMode(e.target.value as typeof mode)}>
                <option value="SAFE">SAFE 稳健</option>
                <option value="CREATIVE">CREATIVE 创作</option>
                <option value="HISTORICAL">HISTORICAL 历史</option>
                <option value="MYTHIC">MYTHIC 神话</option>
                <option value="FOUNDER">FOUNDER 完整</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">时代步数 (1-12)</Label>
              <Input type="number" min={1} max={12} value={eraSteps}
                onChange={e => setEraSteps(Number(e.target.value) || 1)} />
            </div>
            <div>
              <Label className="text-xs">最大历史事件数</Label>
              <Input type="number" min={1} max={80} value={maxEvents}
                onChange={e => setMaxEvents(Number(e.target.value) || 1)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">源数列（数字会被自动提取）</Label>
            <Input value={digitsText} onChange={e => setDigitsText(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">用户介入（可选，将成为历史事件）</Label>
            <Textarea rows={2} value={userAction} onChange={e => setUserAction(e.target.value)}
              placeholder="例如：在裂变时代，主角推动了一次和解会议。" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={run}>运行文明演化</Button>
            {PRESETS.map(p => (
              <Button key={p} variant="outline" size="sm" onClick={() => setUserAction(p)}>{p}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <CivilizationSafetyNote extra={result?.safetyNotes} />

      {result && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">文明总览</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                {overview!.map(o => (
                  <div key={o.label} className="rounded-md border p-2">
                    <div className="text-xs text-muted-foreground">{o.label}</div>
                    <div className="font-medium truncate">{String(o.value)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">时代序列</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {result.eras.map(e => (
                    <li key={e.eraId} className="border-b py-1">
                      <span className="font-medium">{e.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{e.historicalMood}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">历史时间线（前 12）</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {result.timeline.events.slice(0, 12).map(ev => (
                    <li key={ev.eventId} className="border-b py-1">
                      <Badge variant="secondary" className="mr-2">{ev.eventType}</Badge>
                      {ev.title}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">技术树</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {result.technologyTree.nodes.map(n => (
                    <Badge key={n.nodeId} variant={n.unlocked ? "default" : "outline"}>
                      {n.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">战争与和平</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {result.warPeaceRecords.map(w => (
                    <li key={w.recordId} className="border-b py-1">
                      <Badge variant="outline" className="mr-2">{w.warPeaceLabel}</Badge>
                      {w.conflictName}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">历史人物</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {result.historicalFigures.map(f => (
                    <li key={f.figureId} className="border-b py-1">
                      <span className="font-medium">{f.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{f.figureLabel}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">文明神话</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {result.civilizationMyths.map(m => (
                    <li key={m.mythId} className="border-b py-1">
                      <Badge variant="outline" className="mr-2">{m.mythLabel}</Badge>
                      {m.title}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">导出 Runtime 包</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <Label className="text-xs">导出目标</Label>
                  <select className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={exportTarget} onChange={e => setExportTarget(e.target.value as CivilizationExportTarget)}>
                    <option value="CHRONICLE_MARKDOWN">编年史 Markdown</option>
                    <option value="NARRATIVE_BIBLE">剧情圣经</option>
                    <option value="HISTORICAL_TIMELINE_JSON">时间线 JSON</option>
                    <option value="TECHNOLOGY_TREE_JSON">技术树 JSON</option>
                    <option value="FACTION_HISTORY_JSON">阵营历史 JSON</option>
                    <option value="WORLD_KNOWLEDGE_PACK">世界知识包</option>
                    <option value="GODOT_CIVILIZATION_RUNTIME_JSON">Godot Runtime</option>
                    <option value="UNITY_CIVILIZATION_RUNTIME_JSON">Unity Runtime</option>
                    <option value="GENERIC_JSON">通用 JSON</option>
                  </select>
                </div>
                <Button onClick={doExport}>导出</Button>
              </div>
              {exportText && (
                <Textarea readOnly value={exportText} rows={10} className="font-mono text-xs" />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
