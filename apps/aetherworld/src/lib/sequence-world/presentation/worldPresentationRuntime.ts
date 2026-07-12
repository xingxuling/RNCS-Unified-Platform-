import type { SequenceCoreProfile } from "../sequenceCoreEngine";
import { generateRenderRuntime, type SequenceRenderRuntime } from "./sequenceRenderRuntime";
import { generateSemanticPhysicsRuntime, type SemanticPhysicsRuntime } from "./semanticPhysicsRuntime";
import { generateAnimationRuntime, type AnimationRuntime } from "./animationRuntimeEngine";
import { generateCameraLanguage, type CameraLanguageProfile } from "./cameraLanguageEngine";
import { generateWorldAudioAtmosphere, type WorldAudioAtmosphere } from "./worldAudioAtmosphereEngine";
import { generateUIMotion, type UIMotionProfile } from "./uiMotionEngine";
import { runPresentationSafetyCheck } from "./presentationSafetyGuard";
import { generateScenePresentationPacks, type ScenePresentationPack } from "./scenePresentationPackEngine";

export interface WorldPresentationInput {
  worldId: string;
  sequenceCore: SequenceCoreProfile;
  worldState?: { phase?: string; tick?: number; pressure?: number } | null;
  zones?: Array<{ id: string; name: string; biome?: string }>;
  npcAgents?: Array<{ id: string; name: string; role?: string }>;
  activeEvents?: Array<{ id: string; type: string; intensity?: number }>;
  civilizationState?: { eraName?: string; phase?: string } | null;
  presentationMode: "DEMO" | "CREATOR" | "GAME_RUNTIME" | "CINEMATIC" | "FOUNDER";
  targetEngine?: "GENERIC" | "GODOT" | "UNITY" | "THREEJS" | "NARRATIVE" | "VIDEO";
  subjectMode?: string;
  tick?: number;
}

export interface WorldPresentationResult {
  worldId: string;
  presentationMode: string;
  subjectMode: string;
  renderRuntime: SequenceRenderRuntime;
  semanticPhysicsRuntime: SemanticPhysicsRuntime;
  animationRuntime: AnimationRuntime;
  cameraLanguage: CameraLanguageProfile;
  audioAtmosphere: WorldAudioAtmosphere;
  uiMotion: UIMotionProfile;
  scenePacks: ScenePresentationPack[];
  exportOptions: string[];
  safetyNotes: string[];
  warnings: string[];
  metadata: {
    version: "v0.6";
    generatedAt: string;
    sourceDigits: string[];
    targetEngine: string;
  };
}

export function runWorldPresentationRuntime(input: WorldPresentationInput): WorldPresentationResult {
  const render = generateRenderRuntime(input.sequenceCore);
  const physics = generateSemanticPhysicsRuntime(input.sequenceCore);
  const animation = generateAnimationRuntime(input.sequenceCore);
  const camera = generateCameraLanguage(input.sequenceCore);
  const audio = generateWorldAudioAtmosphere(input.sequenceCore);
  const ui = generateUIMotion(input.sequenceCore);
  const subjectMode = input.subjectMode ?? "DEMO";

  const safety = runPresentationSafetyCheck({
    subjectMode,
    exportTarget: input.targetEngine,
    overAnimationRisk: animation.overAnimationRisk,
    visualNoiseRisk: render.visualNoiseRisk,
    reducedMotionSupported: ui.reducedMotionSupported,
  });

  const scenePacks = generateScenePresentationPacks({
    sequenceCore: input.sequenceCore,
    zones: input.zones,
    activeEvents: input.activeEvents,
    civilizationState: input.civilizationState ?? undefined,
    base: { render, physics, animation, camera, audio, ui },
  });

  return {
    worldId: input.worldId,
    presentationMode: input.presentationMode,
    subjectMode,
    renderRuntime: render,
    semanticPhysicsRuntime: physics,
    animationRuntime: animation,
    cameraLanguage: camera,
    audioAtmosphere: audio,
    uiMotion: ui,
    scenePacks,
    exportOptions: ["GENERIC", "GODOT", "UNITY", "THREEJS", "NARRATIVE", "VIDEO", "COMIC"],
    safetyNotes: safety.notes,
    warnings: safety.warnings,
    metadata: {
      version: "v0.6",
      generatedAt: new Date().toISOString(),
      sourceDigits: input.sequenceCore.dominantDigits,
      targetEngine: input.targetEngine ?? "GENERIC",
    },
  };
}
