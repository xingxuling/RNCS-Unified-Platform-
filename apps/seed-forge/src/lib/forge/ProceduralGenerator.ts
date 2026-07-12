// THE SEED v2.0 - Procedural Generator
// Deterministic procedural generation from seeds

/**
 * Procedural Generator
 * Generates deterministic content from seeds
 */
export class ProceduralGenerator {
  /**
   * Generate IAL expression from seed
   */
  seedToIAL(seed: string): string {
    const hash = this.hashString(seed);
    
    // White layer glyphs
    const whiteGlyphs = ['W₁', 'Æ', 'Ω', 'Ψ', 'Λ', 'Σ', 'Φ', 'Θ', 'Η', 'Ξ', 'ΔΩ', 'Ō'];
    // Blue layer glyphs
    const blueGlyphs = ['Γ', 'Π', 'Χ', 'Z', 'K', 'T', 'B₂', 'F₁', 'S₄', 'R₀', 'NΣ', 'C∞'];
    // Gold layer glyphs
    const goldGlyphs = ['I', 'D', 'V', 'A₊', 'Y', 'Z₊', 'G₁', 'MΩ', 'PΘ', 'L₁', 'EΔ', 'K∞'];
    
    const whiteIndex = Math.abs(hash) % whiteGlyphs.length;
    const blueIndex = Math.abs(hash >> 8) % blueGlyphs.length;
    const goldIndex = Math.abs(hash >> 16) % goldGlyphs.length;
    
    return `${whiteGlyphs[whiteIndex]} : ${blueGlyphs[blueIndex]} : ${goldGlyphs[goldIndex]}`;
  }

  /**
   * Generate universe name from seed
   */
  seedToName(seed: string): string {
    const hash = this.hashString(seed);
    const adjectives = ['Ancient', 'Mystic', 'Vast', 'Infinite', 'Eternal', 'Cosmic', 'Celestial', 'Primal'];
    const nouns = ['Realm', 'Domain', 'Universe', 'Reality', 'Dimension', 'Expanse', 'Void', 'Nexus'];
    
    const adjIndex = Math.abs(hash) % adjectives.length;
    const nounIndex = Math.abs(hash >> 8) % nouns.length;
    
    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
  }

  /**
   * Generate world count from seed
   */
  seedToWorldCount(seed: string, min: number = 1, max: number = 10): number {
    const hash = this.hashString(seed);
    return min + (Math.abs(hash) % (max - min + 1));
  }

  /**
   * Generate world configurations from seed
   */
  seedToWorlds(seed: string, count: number): Array<{ name: string; ialExpression: string }> {
    const worlds: Array<{ name: string; ialExpression: string }> = [];
    
    for (let i = 0; i < count; i++) {
      const worldSeed = `${seed}_world_${i}`;
      const worldHash = this.hashString(worldSeed);
      
      const worldNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
      const worldName = worldNames[Math.abs(worldHash) % worldNames.length] + ` ${i + 1}`;
      
      const ialExpression = this.seedToIAL(worldSeed);
      
      worlds.push({
        name: worldName,
        ialExpression,
      });
    }
    
    return worlds;
  }

  /**
   * Generate random number from seed (deterministic)
   */
  seedToRandom(seed: string, min: number = 0, max: number = 1): number {
    const hash = this.hashString(seed);
    const normalized = (Math.abs(hash) % 1000000) / 1000000;
    return min + normalized * (max - min);
  }

  /**
   * Generate integer from seed
   */
  seedToInt(seed: string, min: number, max: number): number {
    const hash = this.hashString(seed);
    return min + (Math.abs(hash) % (max - min + 1));
  }

  /**
   * Generate boolean from seed
   */
  seedToBool(seed: string): boolean {
    const hash = this.hashString(seed);
    return (hash & 1) === 1;
  }

  /**
   * Generate array of values from seed
   */
  seedToArray<T>(seed: string, generator: (seed: string, index: number) => T, count: number): T[] {
    const array: T[] = [];
    for (let i = 0; i < count; i++) {
      array.push(generator(`${seed}_${i}`, i));
    }
    return array;
  }

  /**
   * Hash string to integer
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Generate noise value (simplified Perlin-like)
   */
  noise(x: number, y: number, seed: string): number {
    const hash = this.hashString(`${seed}_${x}_${y}`);
    return (Math.abs(hash) % 1000) / 1000;
  }

  /**
   * Generate fractal noise
   */
  fractalNoise(
    x: number,
    y: number,
    seed: string,
    octaves: number = 4,
    persistence: number = 0.5
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency, `${seed}_${i}`) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return value / maxValue;
  }
}

