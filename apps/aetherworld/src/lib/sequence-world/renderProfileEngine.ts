// Render Profile Engine
import type { SequenceCoreProfile } from "./sequenceCoreEngine";
import { DIGIT_RENDER_HINTS, PALETTE_PRESETS } from "@/constants/sequence-world/renderProfileTypes";

export interface RenderProfile {
  paletteName: string;
  primaryColors: string[];
  accentColors: string[];
  backgroundStyle: string;
  lightingStyle: string;
  materialStyle: string[];
  particleDensity: number;       // 0-1
  symbolMotifs: string[];
  cameraMood: string;
  uiDensity: "LOW" | "MEDIUM" | "HIGH";
  visualKeywords: string[];
}

function pickPalette(dominant: string[]): { name: string; colors: string[] } {
  const top = dominant[0];
  if (top === "0" || top === "7") return PALETTE_PRESETS.void_silver;
  if (top === "5") return PALETTE_PRESETS.wind_storm;
  if (top === "6") return PALETTE_PRESETS.bio_garden;
  if (top === "8") return PALETTE_PRESETS.archive_dust;
  if (top === "9") return PALETTE_PRESETS.civilization_halo;
  return PALETTE_PRESETS.obsidian_aether_gold;
}

export function generateRenderProfile(core: SequenceCoreProfile): RenderProfile {
  const palette = pickPalette(core.dominantDigits);
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;

  const motifs = new Set<string>();
  const materials = new Set<string>();
  const accents = new Set<string>();
  const keywords = new Set<string>();
  core.dominantDigits.forEach(d => {
    const h = DIGIT_RENDER_HINTS[d];
    if (!h) return;
    h.motifs.forEach(x => motifs.add(x));
    h.materials.forEach(x => materials.add(x));
    h.palette.forEach(c => accents.add(c));
    keywords.add(h.background);
  });

  const particleDensity = Math.min(1, ((f["5"] ?? 0) + (f["3"] ?? 0) * 0.5) / total * 2 + 0.2);
  const uiDensity: RenderProfile["uiDensity"] =
    (f["3"] ?? 0) / total > 0.25 ? "HIGH" :
    (f["4"] ?? 0) / total > 0.25 ? "MEDIUM" : "LOW";

  const top = core.dominantDigits[0] ?? "5";
  const cameraMood = DIGIT_RENDER_HINTS[top]?.lighting ?? "balanced cinematic";

  return {
    paletteName: palette.name,
    primaryColors: palette.colors.slice(0, 3),
    accentColors: Array.from(accents).slice(0, 4),
    backgroundStyle: Array.from(keywords).join(" + "),
    lightingStyle: DIGIT_RENDER_HINTS[top]?.lighting ?? "soft cinematic",
    materialStyle: Array.from(materials),
    particleDensity: Number(particleDensity.toFixed(2)),
    symbolMotifs: Array.from(motifs),
    cameraMood,
    uiDensity,
    visualKeywords: Array.from(keywords),
  };
}
