import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SceneGeneratorPanel } from "./SceneGeneratorPanel";
import { NarrativeModeSelector } from "./NarrativeModeSelector";
import { StorySeedCard } from "./StorySeedCard";
import { PlotStructureCard } from "./PlotStructureCard";
import { NarrativeOutputCard } from "./NarrativeOutputCard";
import { DialogueEditor } from "./DialogueEditor";
import { CharacterArcCard } from "./CharacterArcCard";
import { ConflictMap } from "./ConflictMap";
import { PacingPanel } from "./PacingPanel";
import { ContinuityCheckPanel } from "./ContinuityCheckPanel";
import { NarrativeSafetyNote } from "./NarrativeSafetyNote";
import { NarrativeExportPanel } from "./NarrativeExportPanel";
import { generateNarrative, type NarrativeGenerationResult } from "@/lib/narrative/narrativeTextEngine";

export function NarrativeEnginePanel({ defaultMode }: { defaultMode?: string }) {
  const [title, setTitle] = useState("");
  const [worldName, setWorldName] = useState("");
  const [characters, setCharacters] = useState("");
  const [premise, setPremise] = useState("");
  const [conflict, setConflict] = useState("");
  const [location, setLocation] = useState("");
  const [tone, setTone] = useState("");
  const [lore, setLore] = useState("");
  const [sequenceContext, setSequenceContext] = useState("");

  const [mode, setMode] = useState(defaultMode ?? "__auto__");
  const [platform, setPlatform] = useState("__none__");
  const [structure, setStructure] = useState("THREE_ACT");
  const [phase, setPhase] = useState("OPENING_HOOK");
  const [sceneType, setSceneType] = useState("CONFRONTATION");
  const [style, setStyle] = useState("RESTRAINED");
  const [pov, setPov] = useState("THIRD_PERSON_LIMITED");

  const [result, setResult] = useState<NarrativeGenerationResult | null>(null);

  const handleGenerate = () => {
    if (!premise.trim()) { toast.error("请填写故事前提"); return; }
    const chars = characters.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    const r = generateNarrative({
      title, worldName, characterNames: chars, storyPremise: premise, currentConflict: conflict,
      targetMode: mode === "__auto__" ? "" : mode,
      targetPlatform: platform === "__none__" ? undefined : platform,
      emotionalTone: tone, existingLore: lore, sequenceContext,
      sceneType, location, style, pov: pov as never,
      preferredStructure: structure, currentPhase: phase,
      subjectMode: "DEMO", userLevel: "STRUCTURED_USER",
    });
    setResult(r);
    toast.success(`已生成 ${r.modeResolution.recommendedMode}`);
  };

  const recommended = useMemo(() => result?.modeResolution.recommendedMode, [result]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SceneGeneratorPanel
          title={title} setTitle={setTitle}
          worldName={worldName} setWorldName={setWorldName}
          characters={characters} setCharacters={setCharacters}
          premise={premise} setPremise={setPremise}
          conflict={conflict} setConflict={setConflict}
          location={location} setLocation={setLocation}
          tone={tone} setTone={setTone}
          lore={lore} setLore={setLore}
          sequenceContext={sequenceContext} setSequenceContext={setSequenceContext}
        />
        <NarrativeModeSelector
          mode={mode} setMode={setMode}
          platform={platform} setPlatform={setPlatform}
          structure={structure} setStructure={setStructure}
          phase={phase} setPhase={setPhase}
          sceneType={sceneType} setSceneType={setSceneType}
          style={style} setStyle={setStyle}
          pov={pov} setPov={setPov}
          recommended={recommended}
        />
      </div>
      <Button onClick={handleGenerate}><Sparkles className="h-4 w-4 mr-2" />Generate Narrative 生成剧情</Button>

      {result && (
        <div className="space-y-4">
          <NarrativeSafetyNote report={result.safety} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StorySeedCard seed={result.storySeed} />
            <PlotStructureCard plot={result.plotStructure} />
          </div>
          <NarrativeOutputCard scene={result.scene} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DialogueEditor dialogue={result.dialogue} />
            <CharacterArcCard arc={result.characterArc} />
            <ConflictMap conflict={result.conflict} />
            <PacingPanel pacing={result.pacing} />
          </div>
          <ContinuityCheckPanel check={result.continuity} />
          <NarrativeExportPanel result={result} />
        </div>
      )}
    </div>
  );
}
