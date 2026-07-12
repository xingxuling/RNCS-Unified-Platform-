export interface DigitRenderHint {
  digit: string;
  palette: string[];
  background: string;
  lighting: string;
  motifs: string[];
  materials: string[];
}

export const DIGIT_RENDER_HINTS: Record<string, DigitRenderHint> = {
  "0": { digit:"0", palette:["#05070d","#0b0f1a"], background:"void fog, deep black, low saturation", lighting:"flat ambient, near darkness", motifs:["empty ring","sealed cube"], materials:["matte black","obsidian"] },
  "1": { digit:"1", palette:["#fefce8","#facc15"], background:"central light pillar", lighting:"single key light, high contrast rim", motifs:["central pillar","north star"], materials:["polished gold","white marble"] },
  "2": { digit:"2", palette:["#67e8f9","#a5f3fc"], background:"twin nodes connected by gentle lines", lighting:"soft dual light", motifs:["double ring","interaction line"], materials:["frosted glass","silk"] },
  "3": { digit:"3", palette:["#c084fc","#f0abfc"], background:"floating glyphs and information streams", lighting:"emissive text glow", motifs:["runes","UI panels","data flow"], materials:["holographic","glyph metal"] },
  "4": { digit:"4", palette:["#94a3b8","#475569"], background:"grid and architectural geometry", lighting:"directional architectural light", motifs:["grid","frame","wall"], materials:["concrete","steel"] },
  "5": { digit:"5", palette:["#22d3ee","#0ea5e9"], background:"wind field with flowing particles", lighting:"moving rim light", motifs:["wind ring","spiral","particle trail"], materials:["fluid","plasma"] },
  "6": { digit:"6", palette:["#86efac","#34d399"], background:"living textures, soft greens", lighting:"warm diffused light", motifs:["plant","heart","cocoon"], materials:["bio fiber","wood"] },
  "7": { digit:"7", palette:["#1e293b","#312e81"], background:"deep mist, hidden symbols", lighting:"low volumetric fog", motifs:["mask","hidden glyph","shadow"], materials:["dark velvet","ink"] },
  "8": { digit:"8", palette:["#92400e","#d4af37"], background:"resource vault, heavy gravity center", lighting:"dramatic underlight", motifs:["coin stack","gravity well","forge"], materials:["bronze","heavy gold"] },
  "9": { digit:"9", palette:["#1e1b4b","#d4af37"], background:"starfield with civilization ruins", lighting:"ritual halo light", motifs:["temple ring","star halo","monument"], materials:["aged stone","starlit gold"] },
};

export const PALETTE_PRESETS: Record<string, { name: string; colors: string[] }> = {
  obsidian_aether_gold: { name: "Obsidian Aether Gold", colors: ["#05070d","#111827","#d4af37","#38bdf8"] },
  void_silver:          { name: "Void Silver",          colors: ["#0a0a0a","#1f2937","#e5e7eb"] },
  wind_storm:           { name: "Wind Storm",           colors: ["#0c4a6e","#22d3ee","#f0f9ff"] },
  bio_garden:           { name: "Bio Garden",           colors: ["#064e3b","#86efac","#fefce8"] },
  archive_dust:         { name: "Archive Dust",         colors: ["#1c1917","#78716c","#fafaf9"] },
  civilization_halo:    { name: "Civilization Halo",    colors: ["#1e1b4b","#a78bfa","#d4af37"] },
};
