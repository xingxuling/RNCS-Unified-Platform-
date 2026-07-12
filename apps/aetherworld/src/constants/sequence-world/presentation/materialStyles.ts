export interface MaterialStyleHint {
  digit: string;
  materialType: string;
  roughness: number;
  metallic: number;
  emission: number;
  transparency: number;
}

export const DIGIT_MATERIAL_HINTS: Record<string, MaterialStyleHint> = {
  "0": { digit: "0", materialType: "void_glass", roughness: 0.9, metallic: 0, emission: 0, transparency: 0.7 },
  "1": { digit: "1", materialType: "polished_gold", roughness: 0.2, metallic: 0.9, emission: 0.2, transparency: 0 },
  "2": { digit: "2", materialType: "frosted_silk", roughness: 0.5, metallic: 0.1, emission: 0.1, transparency: 0.2 },
  "3": { digit: "3", materialType: "holographic", roughness: 0.3, metallic: 0.4, emission: 0.6, transparency: 0.3 },
  "4": { digit: "4", materialType: "concrete_steel", roughness: 0.7, metallic: 0.5, emission: 0, transparency: 0 },
  "5": { digit: "5", materialType: "fluid_plasma", roughness: 0.3, metallic: 0.2, emission: 0.5, transparency: 0.4 },
  "6": { digit: "6", materialType: "bio_fiber", roughness: 0.6, metallic: 0, emission: 0.1, transparency: 0 },
  "7": { digit: "7", materialType: "dark_velvet", roughness: 0.8, metallic: 0, emission: 0, transparency: 0.1 },
  "8": { digit: "8", materialType: "heavy_bronze", roughness: 0.4, metallic: 1, emission: 0.1, transparency: 0 },
  "9": { digit: "9", materialType: "starlit_stone", roughness: 0.5, metallic: 0.6, emission: 0.4, transparency: 0 },
};
