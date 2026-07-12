import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Sparkles, ShieldAlert } from "lucide-react";
import { useFounderState } from "@/hooks/useFounderState";
import { getActiveSubject } from "@/lib/store";
import { getSequenceMode } from "@/lib/realSubjectStore";
import { SequenceInputCard } from "./SequenceInputCard";
import { WorldStateCard } from "./WorldStateCard";
import { RenderProfileCard } from "./RenderProfileCard";
import { SemanticPhysicsCard } from "./SemanticPhysicsCard";
import { AnimationProfileCard } from "./AnimationProfileCard";
import { NpcBehaviorCard } from "./NpcBehaviorCard";
import { QuestEventCard } from "./QuestEventCard";
import { EngineExportPanel } from "./EngineExportPanel";
import { SequenceWorldSafetyNote } from "./SequenceWorldSafetyNote";
import { SequenceWorldReport } from "./SequenceWorldReport";
import {
  composeSequenceWorld, exportGenericJSON, exportMarkdownReport,
  type SequenceWorldExport,
} from "@/lib/sequence-world/engineExportAdapter";
import type { SequenceMode, SequenceTargetType } from "@/lib/sequence-world/sequenceCoreEngine";

export function SequenceWorldPanel() {
  const { active: founderActive } = useFounderState();
  const subjectMode = getSequenceMode();
  const subject = getActiveSubject();

  const defaultSeqs = useMemo(
    () => (subject?.digits?.length ? subject.digits.map(row => row.join("")) : ["12345", "67890", "13579"]),
    [subject],
  );

  const [name, setName] = useState(subject?.name ? `${subject.name} 的世界` : "默认世界");
  const [mode, setMode] = useState<SequenceMode>(
    subjectMode === "FULL_60" ? "FULL_60" : subjectMode === "LIGHT_20" ? "LIGHT_20" : "DEMO",
  );
  const [target, setTarget] = useState<SequenceTargetType>("WORLD");
  const [sequences, setSequences] = useState<string[]>(defaultSeqs);
  const [world, setWorld] = useState<SequenceWorldExport | null>(null);

  function handleGenerate() {
    try {
      const result = composeSequenceWorld({
        input: {
          id: `seq-${Date.now()}`,
          name: name || "未命名世界",
          sequenceMode: mode,
          sequences,
          targetType: target,
        },
      });
      setWorld(result);
      toast.success("已生成 Sequence World Profile");
    } catch (e) {
      toast.error(`生成失败：${(e as Error).message}`);
    }
  }

  function copyJson() {
    if (!world) return;
    navigator.clipboard.writeText(exportGenericJSON(world));
    toast.success("已复制 JSON");
  }

  function copyReport() {
    if (!world) return;
    navigator.clipboard.writeText(exportMarkdownReport(world));
    toast.success("已复制 Markdown 报告");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Sequence World Engine · 数列驱动世界引擎
              </CardTitle>
              <CardDescription>
                数列 → 世界逻辑 → 表现参数 → Unity / Godot / JSON 导出。本 SDK 不替代真实渲染器或物理引擎。
              </CardDescription>
            </div>
            {founderActive && <Badge variant="outline" className="gap-1"><Sparkles className="w-3 h-3" /> Founder</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SequenceInputCard
            name={name} setName={setName}
            mode={mode} setMode={setMode}
            target={target} setTarget={setTarget}
            sequences={sequences} setSequences={setSequences}
          />
          {mode === "FULL_60" && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
              <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
              <div>
                <strong>Full 60 隐私提示：</strong>本模式涉及私密深度数列，仅在本地内存与 localStorage 处理，不向云端传输。
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate}>生成 Sequence World Profile</Button>
            <Button variant="outline" onClick={copyJson} disabled={!world}><Copy className="w-3 h-3 mr-1" /> 复制 JSON</Button>
            <Button variant="outline" onClick={copyReport} disabled={!world}>复制 Markdown 报告</Button>
          </div>
        </CardContent>
      </Card>

      {world && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="render">渲染</TabsTrigger>
            <TabsTrigger value="physics">语义物理</TabsTrigger>
            <TabsTrigger value="animation">动画</TabsTrigger>
            <TabsTrigger value="npc">NPC</TabsTrigger>
            <TabsTrigger value="quest">任务/事件</TabsTrigger>
            <TabsTrigger value="zone">区域</TabsTrigger>
            <TabsTrigger value="export">导出</TabsTrigger>
            <TabsTrigger value="report">报告</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4 mt-4">
            <WorldStateCard core={world.sequenceCore} interpretation={world.interpretation} world={world.worldState} />
          </TabsContent>
          <TabsContent value="render" className="mt-4"><RenderProfileCard profile={world.renderProfile} /></TabsContent>
          <TabsContent value="physics" className="mt-4"><SemanticPhysicsCard profile={world.semanticPhysicsProfile} /></TabsContent>
          <TabsContent value="animation" className="mt-4"><AnimationProfileCard profile={world.animationProfile} /></TabsContent>
          <TabsContent value="npc" className="mt-4 space-y-3">
            {world.npcProfiles.map(n => <NpcBehaviorCard key={n.npcName} npc={n} />)}
          </TabsContent>
          <TabsContent value="quest" className="mt-4 space-y-3">
            {world.questEvents.map(q => <QuestEventCard key={q.questTitle} quest={q} />)}
          </TabsContent>
          <TabsContent value="zone" className="mt-4 space-y-3">
            {world.zones.map(z => (
              <Card key={z.zoneName}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {z.zoneLabel}
                    <Badge variant="outline">{z.zoneType}</Badge>
                  </CardTitle>
                  <CardDescription>{z.atmosphere}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div>主导数：{z.dominantDigits.join(" · ")}</div>
                  <div>NPC：{z.residentNpcTypes.join(", ")}</div>
                  <div>风险：{z.risks.join(" · ")}</div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="export" className="mt-4"><EngineExportPanel world={world} /></TabsContent>
          <TabsContent value="report" className="mt-4"><SequenceWorldReport world={world} /></TabsContent>
        </Tabs>
      )}

      <SequenceWorldSafetyNote />
    </div>
  );
}
