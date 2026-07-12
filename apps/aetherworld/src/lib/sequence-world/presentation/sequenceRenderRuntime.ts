import type { SequenceCoreProfile } from "../sequenceCoreEngine";
import { DIGIT_RENDER_STYLES } from "@/constants/sequence-world/presentation/renderStyles";
import { DIGIT_MATERIAL_HINTS } from "@/constants/sequence-world/presentation/materialStyles";
import { DIGIT_LIGHT_PROFILES } from "@/constants/sequence-world/presentation/lightProfiles";
import { DIGIT_PARTICLE_PROFILES } from "@/constants/sequence-world/presentation/particleProfiles";

export interface RenderPalette {
  primary: string[];
  accent: string[];
  background: string[];
  contrastLevel: number;
  saturationLevel: number;
}

export interface LightingProfile {
  mode: string;
  keyLight: string;
  rimLight: string;
  ambientLight: string;
  shadowIntensity: number;
  bloomIntensity: number;
}

export interface MaterialProfile {
  materialType: string;
  roughness: number;
  metallic: number;
  emission: number;
  transparency: number;
  sequenceDigitBias: string[];
}

export interface ParticleProfile {
  particleType: string;
  density: number;
  speed: number;
  directionality: string;
  triggerCondition: string;
}

export interface PostProcessingProfile {
  bloom: number;
  vignette: number;
  chromaticAberration: number;
  grain: number;
  toneMapping: string;
}

export interface EnvironmentalEffect {
  effectId: string;
  type: string;
  intensity: number;
}

export interface SymbolicOverlay {
  overlayId: string;
  motif: string;
  meaning: string;
}

export interface SequenceRenderRuntime {
  renderStyle: string;
  palette: RenderPalette;
  lighting: LightingProfile;
  materials: MaterialProfile[];
  particles: ParticleProfile[];
  postProcessing: PostProcessingProfile;
  environmentalEffects: EnvironmentalEffect[];
  symbolicOverlays: SymbolicOverlay[];
  renderIntensity: number;
  visualNoiseRisk: number;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function generateRenderRuntime(core: SequenceCoreProfile): SequenceRenderRuntime {
  const top = core.dominantDigits[0] ?? "5";
  const second = core.dominantDigits[1] ?? top;
  const styleTop = DIGIT_RENDER_STYLES[top];
  const lightTop = DIGIT_LIGHT_PROFILES[top];

  const primary = (styleTop?.paletteBias ?? ["#111827", "#d4af37"]).slice();
  const accent: string[] = [];
  core.dominantDigits.forEach(d => DIGIT_RENDER_STYLES[d]?.paletteBias.forEach(c => accent.push(c)));

  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;
  const intensity = clamp01(((f["5"] ?? 0) + (f["1"] ?? 0) * 0.5 + (f["9"] ?? 0) * 0.5) / total * 2 + 0.2);
  const visualNoiseRisk = clamp01(((f["5"] ?? 0) + (f["3"] ?? 0) * 0.5) / total * 1.5);

  const materials: MaterialProfile[] = core.dominantDigits.map(d => {
    const h = DIGIT_MATERIAL_HINTS[d];
    return {
      materialType: h?.materialType ?? "neutral",
      roughness: h?.roughness ?? 0.5,
      metallic: h?.metallic ?? 0.2,
      emission: h?.emission ?? 0.1,
      transparency: h?.transparency ?? 0,
      sequenceDigitBias: [d],
    };
  });

  const particles: ParticleProfile[] = core.dominantDigits.map(d => {
    const h = DIGIT_PARTICLE_PROFILES[d];
    return {
      particleType: h?.particleType ?? "neutral_dust",
      density: h?.density ?? 0.3,
      speed: h?.speed ?? 0.3,
      directionality: h?.directionality ?? "ambient",
      triggerCondition: `digit:${d}`,
    };
  });

  return {
    renderStyle: styleTop?.styleName ?? "默认",
    palette: {
      primary: primary.slice(0, 3),
      accent: Array.from(new Set(accent)).slice(0, 4),
      background: [primary[0] ?? "#0b0f1a"],
      contrastLevel: clamp01(0.4 + intensity * 0.5),
      saturationLevel: clamp01(0.3 + intensity * 0.6),
    },
    lighting: {
      mode: lightTop?.mode ?? "balanced",
      keyLight: lightTop?.keyLight ?? "diffuse",
      rimLight: lightTop?.rimLight ?? "soft",
      ambientLight: lightTop?.ambientLight ?? "neutral",
      shadowIntensity: lightTop?.shadowIntensity ?? 0.5,
      bloomIntensity: lightTop?.bloomIntensity ?? 0.3,
    },
    materials,
    particles,
    postProcessing: {
      bloom: lightTop?.bloomIntensity ?? 0.3,
      vignette: 0.3,
      chromaticAberration: visualNoiseRisk * 0.4,
      grain: 0.2,
      toneMapping: top === "9" ? "filmic" : top === "0" ? "linear" : "aces",
    },
    environmentalEffects: [
      { effectId: `env-${top}`, type: styleTop?.styleName ?? "ambient", intensity },
      { effectId: `env-${second}`, type: DIGIT_RENDER_STYLES[second]?.styleName ?? "ambient", intensity: intensity * 0.6 },
    ],
    symbolicOverlays: core.dominantDigits.flatMap(d => (DIGIT_RENDER_STYLES[d]?.motifs ?? []).map(m => ({
      overlayId: `ov-${d}-${m}`, motif: m, meaning: `digit ${d}`,
    }))),
    renderIntensity: intensity,
    visualNoiseRisk,
  };
}
