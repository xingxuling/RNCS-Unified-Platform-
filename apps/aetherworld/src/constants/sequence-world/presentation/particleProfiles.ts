export interface ParticleProfileHint {
  digit: string;
  particleType: string;
  density: number;
  speed: number;
  directionality: string;
}

export const DIGIT_PARTICLE_PROFILES: Record<string, ParticleProfileHint> = {
  "0": { digit: "0", particleType: "void_dust", density: 0.1, speed: 0.1, directionality: "still" },
  "1": { digit: "1", particleType: "core_spark", density: 0.3, speed: 0.4, directionality: "central" },
  "2": { digit: "2", particleType: "link_thread", density: 0.4, speed: 0.3, directionality: "pair" },
  "3": { digit: "3", particleType: "glyph_stream", density: 0.7, speed: 0.5, directionality: "flow" },
  "4": { digit: "4", particleType: "grid_dot", density: 0.4, speed: 0.2, directionality: "structured" },
  "5": { digit: "5", particleType: "wind_burst", density: 0.9, speed: 0.9, directionality: "turbulent" },
  "6": { digit: "6", particleType: "bio_spore", density: 0.5, speed: 0.3, directionality: "breath" },
  "7": { digit: "7", particleType: "fog_drift", density: 0.6, speed: 0.2, directionality: "drag" },
  "8": { digit: "8", particleType: "gold_shard", density: 0.3, speed: 0.4, directionality: "attract" },
  "9": { digit: "9", particleType: "star_motes", density: 0.6, speed: 0.3, directionality: "ritual_orbit" },
};
