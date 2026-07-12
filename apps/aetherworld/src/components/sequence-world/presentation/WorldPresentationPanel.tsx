import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { buildSequenceCoreProfile, type SequenceMode } from "@/lib/sequence-world/sequenceCoreEngine";
import { runWorldPresentationRuntime, type WorldPresentationResult } from "@/lib/sequence-world/presentation/worldPresentationRuntime";
import { compressPresentation, type PresentationCompressionTarget } from "@/lib/sequence-world/presentation/presentationCompressionEngine";
import { getActiveSubjectProfile } from "@/lib/subject/activeSubjectModeResolver";
import { readFull60, readLight20 } from "@/lib/subject/subjectProfileStore";

import { RenderRuntimePanel } from "./RenderRuntimePanel";
import { SemanticPhysicsRuntimePanel } from "./SemanticPhysicsRuntimePanel";
import { AnimationRuntimePanel } from "./AnimationRuntimePanel";
import { CameraLanguagePanel } from "./CameraLanguagePanel";
import { AudioAtmospherePanel } from "./AudioAtmospherePanel";
import { UIMotionPanel } from "./UIMotionPanel";
import { ScenePresentationPackPanel } from "./ScenePresentationPackPanel";
import { PresentationTickPanel } from "./PresentationTickPanel";
import { PresentationSnapshotPanel } from "./PresentationSnapshotPanel";
import { PresentationExportPanel } from "./PresentationExportPanel";
import { PresentationSafetyNote } from "./PresentationSafetyNote";

const DEMO_SEQUENCES = ["12345", "55555", "21034", "67890", "99999"];

export function WorldPresentationPanel() {
  const profile = useMemo(() => getActiveSubjectProfile(), []);
  const [seedInput, setSeedInput] = useState<string>(() => {
    if (profile.subjectMode === "FULL_60") return readFull60().join("\n");
    if (profile.subjectMode === "LIGHT_20") return readLight20().join("\n");
    return DEMO_SEQUENCES.join("\n");
  });
  const [presentation, setPresentation] = useState<WorldPresentationResult | null>(null);
  const [compression, setCompression] = useState<{ target: PresentationCompressionTarget; text: string } | null>(null);

  const handleGenerate = () => {
    const seqs = seedInput.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const core = buildSequenceCoreProfile({
      id: `world-${Date.now()}`,
      name: profile.displayName,
      sequenceMode: profile.subjectMode as SequenceMode,
      sequences: seqs.length ? seqs : DEMO_SEQUENCES,
      targetType: "WORLD",
    });
    const result = runWorldPresentationRuntime({
      worldId: `world-${profile.subjectId}`,
      sequenceCore: core,
      presentationMode: profile.subjectMode === "FOUNDER" ? "FOUNDER" : "CREATOR",
      targetEngine: "GENERIC",
      subjectMode: profile.subjectMode,
      worldState: { phase: "STABILIZATION", tick: 1, pressure: 0.4 },
      zones: [{ id: "z1", name: "中心枢纽", biome: "structure" }, { id: "z2", name: "风暴边境", biome: "storm" }],
      activeEvents: [{ id: "e1", type: "RITUAL", intensity: 0.5 }],
      civilizationState: { eraName: "黄金时代", phase: "GOLDEN_AGE" },
    });
    setPresentation(result);
    setCompression(null);
  };

  const handleCompress = (target: PresentationCompressionTarget) => {
    if (!presentation) return;
    const r = compressPresentation(presentation, target);
    setCompression({
      target,
      text: [
        r.summary,
        "",
        "[Visual]",
        ...r.keyVisualRules.map(x => `- ${x}`),
        "",
        "[Motion]",
        ...r.keyMotionRules.map(x => `- ${x}`),
        "",
        "[Audio]",
        ...r.keyAudioRules.map(x => `- ${x}`),
        "",
        "[Notes]",
        ...r.exportNotes.map(x => `- ${x}`),
      ].join("\n"),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            World Presentation Runtime v0.6
            <Badge variant="secondary">subjectMode: {profile.subjectMode}</Badge>
            <Badge variant="outline">{profile.privacyLevel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            从数列、世界状态、区域、事件与文明阶段生成渲染 / 语义物理 / 动画 / 镜头 / 声音 / UI 动效，并导出 Godot / Unity / Three.js 表现层包。
          </p>
          <div>
            <div className="text-xs text-muted-foreground mb-1">数列种子（每行一组）</div>
            <Textarea rows={6} value={seedInput} onChange={e => setSeedInput(e.target.value)} className="font-mono text-xs" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate}>生成世界表现</Button>
            <Button variant="outline" disabled={!presentation} onClick={() => handleCompress("ART_DIRECTION_BRIEF")}>压缩为美术方向</Button>
            <Button variant="outline" disabled={!presentation} onClick={() => handleCompress("CINEMATIC_BRIEF")}>压缩为视频说明</Button>
            <Button variant="outline" disabled={!presentation} onClick={() => handleCompress("GAME_RUNTIME_PROFILE")}>压缩为游戏运行时</Button>
            <Button variant="outline" disabled={!presentation} onClick={() => handleCompress("FOUNDER_PRESENTATION_TRACE")}>Founder Trace</Button>
          </div>
          {presentation?.warnings && presentation.warnings.length > 0 && (
            <div className="text-xs text-amber-500">⚠ {presentation.warnings.join("；")}</div>
          )}
        </CardContent>
      </Card>

      <PresentationSafetyNote />

      {presentation && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <RenderRuntimePanel render={presentation.renderRuntime} />
            <SemanticPhysicsRuntimePanel physics={presentation.semanticPhysicsRuntime} />
            <AnimationRuntimePanel animation={presentation.animationRuntime} />
            <CameraLanguagePanel camera={presentation.cameraLanguage} />
            <AudioAtmospherePanel audio={presentation.audioAtmosphere} />
            <UIMotionPanel ui={presentation.uiMotion} />
          </div>
          <ScenePresentationPackPanel packs={presentation.scenePacks} />
          <div className="grid md:grid-cols-2 gap-4">
            <PresentationTickPanel />
            <PresentationSnapshotPanel presentation={presentation} />
          </div>
          {compression && (
            <Card>
              <CardHeader><CardTitle className="text-base">压缩输出 · {compression.target}</CardTitle></CardHeader>
              <CardContent>
                <Textarea readOnly value={compression.text} rows={14} className="font-mono text-xs" />
              </CardContent>
            </Card>
          )}
          <PresentationExportPanel presentation={presentation} />
        </>
      )}
    </div>
  );
}
