import type { WorldPresentationResult } from "./worldPresentationRuntime";

export interface UnityPresentationPackage {
  metadata: {
    version: string;
    source: string;
    exportedAt: string;
    subjectMode: string;
    privacyNotes: string[];
  };
  renderProfile: unknown;
  semanticPhysicsProfile: unknown;
  animationProfile: unknown;
  cameraProfile: unknown;
  audioProfile: unknown;
  uiMotionProfile: unknown;
  scenePacks: unknown[];
  safetyNotes: string[];
}

export function exportUnityPresentationPackage(p: WorldPresentationResult): UnityPresentationPackage {
  return {
    metadata: {
      version: "v0.6",
      source: "Aether Sequence World Engine v0.6",
      exportedAt: new Date().toISOString(),
      subjectMode: p.subjectMode,
      privacyNotes: p.subjectMode === "FULL_60" ? ["Full60 表现层默认本地保存"] : [],
    },
    renderProfile: p.renderRuntime,
    semanticPhysicsProfile: p.semanticPhysicsRuntime,
    animationProfile: p.animationRuntime,
    cameraProfile: p.cameraLanguage,
    audioProfile: p.audioAtmosphere,
    uiMotionProfile: p.uiMotion,
    scenePacks: p.scenePacks,
    safetyNotes: p.safetyNotes,
  };
}

export function generateUnityCSharpSkeleton(): string {
  return `using System;
using System.Collections.Generic;

[System.Serializable]
public class AetherPresentationProfile
{
    public RenderProfile renderProfile;
    public SemanticPhysicsProfile semanticPhysicsProfile;
    public AnimationProfile animationProfile;
    public CameraProfile cameraProfile;
    public AudioProfile audioProfile;
    public UIMotionProfile uiMotionProfile;
    public List<ScenePack> scenePacks;
    public List<string> safetyNotes;
}

[System.Serializable] public class RenderProfile { public string renderStyle; public float renderIntensity; public float visualNoiseRisk; }
[System.Serializable] public class SemanticPhysicsProfile { public string globalMotionBias; public string gravityField; public float resistanceField; }
[System.Serializable] public class AnimationProfile { public string movementStyle; public float animationIntensity; }
[System.Serializable] public class CameraProfile { public string defaultCameraMode; public string cameraRhythm; }
[System.Serializable] public class AudioProfile { public string ambientStyle; public string musicMood; }
[System.Serializable] public class UIMotionProfile { public string uiDensity; public string motionStyle; }
[System.Serializable] public class ScenePack { public string packId; public string name; public string targetType; }
`;
}
