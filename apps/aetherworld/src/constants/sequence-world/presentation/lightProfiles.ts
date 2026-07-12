export interface LightProfileHint {
  digit: string;
  mode: string;
  keyLight: string;
  rimLight: string;
  ambientLight: string;
  shadowIntensity: number;
  bloomIntensity: number;
}

export const DIGIT_LIGHT_PROFILES: Record<string, LightProfileHint> = {
  "0": { digit: "0", mode: "void", keyLight: "none", rimLight: "none", ambientLight: "low_black", shadowIntensity: 0.1, bloomIntensity: 0 },
  "1": { digit: "1", mode: "central_pillar", keyLight: "single_key", rimLight: "high_contrast", ambientLight: "warm", shadowIntensity: 0.7, bloomIntensity: 0.4 },
  "2": { digit: "2", mode: "dual_soft", keyLight: "two_keys", rimLight: "soft", ambientLight: "balanced", shadowIntensity: 0.4, bloomIntensity: 0.2 },
  "3": { digit: "3", mode: "emissive_glyph", keyLight: "diffuse", rimLight: "glyph_glow", ambientLight: "cool_violet", shadowIntensity: 0.3, bloomIntensity: 0.7 },
  "4": { digit: "4", mode: "architectural", keyLight: "directional", rimLight: "structural", ambientLight: "neutral", shadowIntensity: 0.6, bloomIntensity: 0.1 },
  "5": { digit: "5", mode: "wind_rim", keyLight: "moving", rimLight: "fast_rim", ambientLight: "cyan", shadowIntensity: 0.5, bloomIntensity: 0.5 },
  "6": { digit: "6", mode: "warm_diffuse", keyLight: "warm_soft", rimLight: "soft", ambientLight: "warm_green", shadowIntensity: 0.3, bloomIntensity: 0.2 },
  "7": { digit: "7", mode: "volumetric_fog", keyLight: "hidden", rimLight: "obscured", ambientLight: "low_violet", shadowIntensity: 0.8, bloomIntensity: 0.1 },
  "8": { digit: "8", mode: "underlight_drama", keyLight: "underlight", rimLight: "metallic", ambientLight: "deep_gold", shadowIntensity: 0.7, bloomIntensity: 0.3 },
  "9": { digit: "9", mode: "ritual_halo", keyLight: "halo", rimLight: "star", ambientLight: "deep_indigo", shadowIntensity: 0.6, bloomIntensity: 0.8 },
};
