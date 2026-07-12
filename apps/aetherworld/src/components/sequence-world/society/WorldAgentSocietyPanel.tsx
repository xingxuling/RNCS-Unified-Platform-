import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runWorldAgentSociety, type WorldAgentSocietyResult } from "@/lib/sequence-world/society/worldAgentSocietyEngine";
import { buildDefaultZones } from "@/lib/sequence-world/simulation/zoneEcologyEngine";
import { NpcAgentCard } from "./NpcAgentCard";
import { FactionPanel } from "./FactionPanel";
import { InstitutionPanel } from "./InstitutionPanel";
import { SocialGraphPanel } from "./SocialGraphPanel";
import { WorldEconomyPanel } from "./WorldEconomyPanel";
import { BeliefSystemPanel } from "./BeliefSystemPanel";
import { CollectiveMemoryPanel } from "./CollectiveMemoryPanel";
import { AutonomousEventPanel } from "./AutonomousEventPanel";
import { SocialConflictPanel } from "./SocialConflictPanel";
import { CivilizationPhasePanel } from "./CivilizationPhasePanel";
import { UserInfluencePanel } from "./UserInfluencePanel";
import { SocietyCompressionPanel } from "./SocietyCompressionPanel";
import { SocietyRuntimeExportPanel } from "./SocietyRuntimeExportPanel";
import { WorldSocietySafetyNote } from "./WorldSocietySafetyNote";
import { getStoredMode, buildProfile, readFull60, readLight20 } from "@/lib/subject/subjectProfileStore";

const DEMO_DIGITS = ["1","2","3","4","5","6","7","8","9","0","1","4","8","9","2"];

export function WorldAgentSocietyPanel() {
  const profile = (() => {
    try { const mode = getStoredMode() ?? "DEMO"; return buildProfile(mode); } catch { return null; }
  })();
  const digits = useMemo(() => {
    const full = (() => { try { return readFull60(); } catch { return []; } })();
    const light = (() => { try { return readLight20(); } catch { return []; } })();
    if (profile?.subjectMode === "FULL_60" && full.length) return full.flatMap(s => s.split(""));
    if (profile?.subjectMode === "LIGHT_20" && light.length) return light.flatMap(s => s.split(""));
    return DEMO_DIGITS;
  }, [profile]);

  const [tick, setTick] = useState(0);
  const [society, setSociety] = useState<WorldAgentSocietyResult | null>(null);
  const [autoEvents, setAutoEvents] = useState(true);

  const generate = () => {
    const zones = buildDefaultZones(digits.slice(0, 5));
    const next = runWorldAgentSociety({
      worldId: "world-society-demo",
      currentWorldState: { tick, entropyLevel: 0.4, phase: "ACTIVE" } as any,
      zones,
      societyMode: "CIVILIZATION",
      sourceDigits: digits,
      maxAgents: 12, maxFactions: 5, maxInstitutions: 5,
      autonomousEventsEnabled: autoEvents,
      tickCount: tick,
      simulationMode: profile?.subjectMode === "FULL_60" ? "PERSONAL_WORLD" : "DEMO",
      isFull60: profile?.subjectMode === "FULL_60",
      isFounder: profile?.subjectMode === "FOUNDER",
    });
    setSociety(next);
  };

  const runTick = () => { setTick(t => t + 1); setTimeout(generate, 0); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>World Agent Society Core v0.4</span>
            <Badge variant="secondary">数列驱动世界社会智能体</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate}>生成世界社会</Button>
            <Button variant="outline" onClick={runTick}>运行 Society Tick</Button>
            <Button variant="outline" onClick={() => setAutoEvents(v => !v)}>
              自治事件：{autoEvents ? "开" : "关"}
            </Button>
            <Badge variant="outline">主体模式：{profile?.subjectMode ?? "DEMO"}</Badge>
            <Badge variant="outline">tick：{tick}</Badge>
          </div>
          {society && (
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <Stat label="NPC" value={society.npcAgents.length} />
              <Stat label="阵营" value={society.factions.length} />
              <Stat label="制度" value={society.institutions.length} />
              <Stat label="活动冲突" value={society.socialConflicts.length} />
              <Stat label="自治事件" value={society.autonomousEvents.length} />
              <Stat label="文明阶段" value={society.civilizationPhase.phaseLabel} />
              <Stat label="经济张力" value={`${(society.economy.economicTension*100).toFixed(0)}%`} />
              <Stat label="社会稳定" value={`${(society.civilizationPhase.stability*100).toFixed(0)}%`} />
            </div>
          )}
          <WorldSocietySafetyNote />
        </CardContent>
      </Card>

      {society && (
        <>
          <CivilizationPhasePanel phase={society.civilizationPhase} />
          <div className="grid gap-4 lg:grid-cols-2">
            <FactionPanel factions={society.factions} />
            <InstitutionPanel institutions={society.institutions} />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">NPC Agents（{society.npcAgents.length}）</CardTitle></CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {society.npcAgents.map(a => <NpcAgentCard key={a.agentId} agent={a} />)}
            </CardContent>
          </Card>
          <SocialGraphPanel graph={society.socialGraph} />
          <WorldEconomyPanel economy={society.economy} />
          <div className="grid gap-4 lg:grid-cols-2">
            <BeliefSystemPanel beliefs={society.beliefSystems} />
            <CollectiveMemoryPanel memory={society.collectiveMemory} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <AutonomousEventPanel events={society.autonomousEvents} />
            <SocialConflictPanel conflicts={society.socialConflicts} />
          </div>
          <UserInfluencePanel user={society.userInfluence} />
          <SocietyCompressionPanel society={society} />
          <SocietyRuntimeExportPanel society={society} isFull60={profile?.subjectMode === "FULL_60"} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border p-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-base font-medium">{value}</div>
    </div>
  );
}
