import type { SequenceCoreProfile } from "../sequenceCoreEngine";
import type { SequenceRenderRuntime } from "./sequenceRenderRuntime";
import type { SemanticPhysicsRuntime } from "./semanticPhysicsRuntime";
import type { AnimationRuntime } from "./animationRuntimeEngine";
import type { CameraLanguageProfile } from "./cameraLanguageEngine";
import type { WorldAudioAtmosphere } from "./worldAudioAtmosphereEngine";
import type { UIMotionProfile } from "./uiMotionEngine";

export interface ScenePresentationPack {
  packId: string;
  name: string;
  targetType: "ZONE" | "NPC" | "EVENT" | "CIVILIZATION_ERA" | "QUEST" | "TERMINAL";
  renderRuntime: SequenceRenderRuntime;
  semanticPhysicsRuntime: SemanticPhysicsRuntime;
  animationRuntime: AnimationRuntime;
  cameraLanguage: CameraLanguageProfile;
  audioAtmosphere: WorldAudioAtmosphere;
  uiMotion?: UIMotionProfile;
  exportTags: string[];
}

export function generateScenePresentationPacks(input: {
  sequenceCore: SequenceCoreProfile;
  zones?: Array<{ id: string; name: string; biome?: string }>;
  activeEvents?: Array<{ id: string; type: string; intensity?: number }>;
  civilizationState?: { eraName?: string; phase?: string };
  base: {
    render: SequenceRenderRuntime;
    physics: SemanticPhysicsRuntime;
    animation: AnimationRuntime;
    camera: CameraLanguageProfile;
    audio: WorldAudioAtmosphere;
    ui: UIMotionProfile;
  };
}): ScenePresentationPack[] {
  const { base } = input;
  const packs: ScenePresentationPack[] = [];

  (input.zones ?? []).slice(0, 5).forEach(z => {
    packs.push({
      packId: `pack-zone-${z.id}`,
      name: `${z.name} 表现包`,
      targetType: "ZONE",
      renderRuntime: base.render,
      semanticPhysicsRuntime: base.physics,
      animationRuntime: base.animation,
      cameraLanguage: base.camera,
      audioAtmosphere: base.audio,
      uiMotion: base.ui,
      exportTags: ["zone", z.biome ?? "generic"],
    });
  });

  (input.activeEvents ?? []).slice(0, 5).forEach(e => {
    packs.push({
      packId: `pack-event-${e.id}`,
      name: `事件 ${e.type} 表现包`,
      targetType: "EVENT",
      renderRuntime: base.render,
      semanticPhysicsRuntime: base.physics,
      animationRuntime: base.animation,
      cameraLanguage: base.camera,
      audioAtmosphere: base.audio,
      exportTags: ["event", e.type],
    });
  });

  if (input.civilizationState?.eraName) {
    packs.push({
      packId: `pack-era-${input.civilizationState.eraName}`,
      name: `${input.civilizationState.eraName} 时代表现包`,
      targetType: "CIVILIZATION_ERA",
      renderRuntime: base.render,
      semanticPhysicsRuntime: base.physics,
      animationRuntime: base.animation,
      cameraLanguage: base.camera,
      audioAtmosphere: base.audio,
      exportTags: ["civilization_era", input.civilizationState.phase ?? "unknown"],
    });
  }

  if (packs.length === 0) {
    packs.push({
      packId: "pack-default",
      name: "默认世界表现包",
      targetType: "ZONE",
      renderRuntime: base.render,
      semanticPhysicsRuntime: base.physics,
      animationRuntime: base.animation,
      cameraLanguage: base.camera,
      audioAtmosphere: base.audio,
      uiMotion: base.ui,
      exportTags: ["default"],
    });
  }

  return packs;
}
