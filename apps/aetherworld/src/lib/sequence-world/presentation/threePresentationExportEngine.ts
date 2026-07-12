import type { WorldPresentationResult } from "./worldPresentationRuntime";

export interface ThreePresentationPackage {
  metadata: {
    version: string;
    source: string;
    exportedAt: string;
    subjectMode: string;
  };
  colors: { primary: string[]; accent: string[]; background: string[] };
  lights: {
    ambient: { color: string; intensity: number };
    key: { color: string; intensity: number };
    bloom: number;
  };
  particles: Array<{ type: string; density: number; speed: number }>;
  camera: { fov: number; mode: string };
  materials: Array<{ type: string; roughness: number; metalness: number }>;
  animationTiming: { defaultBlend: number; tickRate: number };
  uiMotion: { density: string; reducedMotion: boolean };
  safetyNotes: string[];
}

export function exportThreePresentationPackage(p: WorldPresentationResult): ThreePresentationPackage {
  return {
    metadata: {
      version: "v0.6",
      source: "Aether Sequence World Engine v0.6",
      exportedAt: new Date().toISOString(),
      subjectMode: p.subjectMode,
    },
    colors: {
      primary: p.renderRuntime.palette.primary,
      accent: p.renderRuntime.palette.accent,
      background: p.renderRuntime.palette.background,
    },
    lights: {
      ambient: { color: p.renderRuntime.palette.background[0] ?? "#000000", intensity: 0.4 },
      key: { color: p.renderRuntime.palette.primary[1] ?? "#ffffff", intensity: 1 },
      bloom: p.renderRuntime.lighting.bloomIntensity,
    },
    particles: p.renderRuntime.particles.map(x => ({ type: x.particleType, density: x.density, speed: x.speed })),
    camera: { fov: 55, mode: p.cameraLanguage.defaultCameraMode },
    materials: p.renderRuntime.materials.map(m => ({ type: m.materialType, roughness: m.roughness, metalness: m.metallic })),
    animationTiming: { defaultBlend: 0.4, tickRate: 60 },
    uiMotion: { density: p.uiMotion.uiDensity, reducedMotion: p.uiMotion.reducedMotionSupported },
    safetyNotes: p.safetyNotes,
  };
}
