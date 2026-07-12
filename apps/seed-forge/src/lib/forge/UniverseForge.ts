// THE SEED v2.0 - Universe Forge
// IAL/OSE-driven Universe Generation

import { UniverseManager } from '../v1/UniverseManager';
import { Universe } from '../v1/Universe';
import { compileIAL, CompiledIAL } from '@taowind/ial-compiler';
import { oseEngine } from '../ose';
import { UniverseConfig } from '../v1/types';
import { TemplateSystem } from './TemplateSystem';
import { ProceduralGenerator } from './ProceduralGenerator';
import { UniverseTemplate } from './types';

/**
 * Generation Input
 */
export type GenerationInput = 
  | { type: 'ial'; source: string }
  | { type: 'ose'; description: string }
  | { type: 'template'; templateId: string }
  | { type: 'procedural'; seed: string };

/**
 * Generation Result
 */
export interface GenerationResult {
  universe: Universe;
  ialCompiled?: CompiledIAL[];
  oseExecution?: any;
  metadata: {
    generationTime: number;
    method: string;
    input: GenerationInput;
  };
}

/**
 * Universe Forge
 * Generates universes from IAL, OSE, templates, or procedural generation
 */
export class UniverseForge {
  private universeManager: UniverseManager;
  private templateSystem: TemplateSystem;
  private proceduralGenerator: ProceduralGenerator;

  constructor(universeManager: UniverseManager) {
    this.universeManager = universeManager;
    this.templateSystem = new TemplateSystem();
    this.proceduralGenerator = new ProceduralGenerator();
  }

  /**
   * Generate universe from input
   */
  async generateUniverse(
    input: GenerationInput,
    config?: Partial<UniverseConfig>
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    switch (input.type) {
      case 'ial':
        return this.generateFromIAL(input.source, config, startTime);
      
      case 'ose':
        return this.generateFromOSE(input.description, config, startTime);
      
      case 'template':
        return this.generateFromTemplate(input.templateId, config, startTime);
      
      case 'procedural':
        return this.generateProcedural(input.seed, config, startTime);
    }
  }

  /**
   * Generate universe from IAL expression
   */
  private async generateFromIAL(
    source: string,
    config: Partial<UniverseConfig> | undefined,
    startTime: number
  ): Promise<GenerationResult> {
    // 1. Compile IAL
    const compileResult = compileIAL(source);
    
    if (!compileResult.success || !compileResult.compiled) {
      throw new Error(`IAL compilation failed: ${compileResult.errors.map(e => e.message).join(', ')}`);
    }

    // 2. Execute with OSE
    const oseResults = compileResult.compiled.map(compiled => 
      oseEngine.execute(compiled)
    );

    // 3. Extract universe properties from compiled IAL
    const universeName = this.extractUniverseName(compileResult.compiled[0]);
    const universeConfig = this.extractUniverseConfig(compileResult.compiled, config);

    // 4. Create universe
    const universe = this.universeManager.createUniverse(universeName, universeConfig);

    // 5. Apply OSE structure to universe
    await this.applyOSEStructure(universe, oseResults);

    // 6. Generate worlds from IAL
    await this.generateWorldsFromIAL(universe, compileResult.compiled);

    // 7. Initialize fate graph from OSE
    await this.initializeFateFromOSE(universe, oseResults);

    return {
      universe,
      ialCompiled: compileResult.compiled,
      oseExecution: oseResults,
      metadata: {
        generationTime: Date.now() - startTime,
        method: 'ial',
        input: { type: 'ial', source },
      },
    };
  }

  /**
   * Generate universe from OSE description
   */
  private async generateFromOSE(
    description: string,
    config: Partial<UniverseConfig> | undefined,
    startTime: number
  ): Promise<GenerationResult> {
    // 1. Use OSE to reason about description
    // For now, we'll create a simple IAL expression from description
    const ialExpression = this.descriptionToIAL(description);

    // 2. Generate from IAL
    return this.generateFromIAL(ialExpression, config, startTime);
  }

  /**
   * Generate universe from template
   */
  private async generateFromTemplate(
    templateId: string,
    config: Partial<UniverseConfig> | undefined,
    startTime: number
  ): Promise<GenerationResult> {
    const template = this.templateSystem.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // 1. Generate universe from template's IAL
    const result = await this.generateFromIAL(template.ialExpression, config, startTime);

    // 2. Generate worlds from template
    for (const worldTemplate of template.worlds) {
      await this.generateWorldFromTemplate(result.universe, worldTemplate);
    }

    // 3. Generate rules from template
    for (const ruleTemplate of template.rules) {
      await this.generateRuleFromTemplate(result.universe, ruleTemplate);
    }

    // 4. Generate fate nodes from template
    for (const fateTemplate of template.fateNodes) {
      await this.generateFateNodeFromTemplate(result.universe, fateTemplate);
    }

    // Update metadata
    result.metadata.method = 'template';
    result.metadata.input = { type: 'template', templateId };

    return result;
  }

  /**
   * Generate universe procedurally
   */
  private async generateProcedural(
    seed: string,
    config: Partial<UniverseConfig> | undefined,
    startTime: number
  ): Promise<GenerationResult> {
    // 1. Generate IAL from seed
    const ialExpression = this.proceduralGenerator.seedToIAL(seed);
    
    // 2. Generate universe name from seed
    const universeName = this.proceduralGenerator.seedToName(seed);
    
    // 3. Generate world count
    const worldCount = this.proceduralGenerator.seedToWorldCount(seed, 1, 5);
    
    // 4. Generate universe from IAL
    const result = await this.generateFromIAL(ialExpression, config, startTime);
    
    // 5. Rename universe
    const data = result.universe.getData();
    data.name = universeName;
    
    // 6. Generate additional worlds procedurally
    const worlds = this.proceduralGenerator.seedToWorlds(seed, worldCount - 1);
    for (const world of worlds) {
      const worldCompiled = compileIAL(world.ialExpression);
      if (worldCompiled.success && worldCompiled.compiled) {
        const worldUniverse = result.universe.createWorld(world.name);
        // Apply IAL to world if needed
      }
    }

    // Update metadata
    result.metadata.method = 'procedural';
    result.metadata.input = { type: 'procedural', seed };

    return result;
  }

  // Helper methods

  /**
   * Extract universe name from compiled IAL
   */
  private extractUniverseName(compiled: CompiledIAL): string {
    if (compiled.target === 'universe') {
      return `Universe-${compiled.operation}`;
    }
    return `Universe-${Date.now()}`;
  }

  /**
   * Extract universe config from compiled IAL
   */
  private extractUniverseConfig(
    compiled: CompiledIAL[],
    baseConfig?: Partial<UniverseConfig>
  ): Partial<UniverseConfig> {
    const config: Partial<UniverseConfig> = { ...baseConfig };

    // Extract config from IAL parameters
    for (const c of compiled) {
      if (c.parameters) {
        if (c.parameters.tickInterval) {
          config.tickInterval = c.parameters.tickInterval as number;
        }
        if (c.parameters.timeScale) {
          config.timeScale = c.parameters.timeScale as number;
        }
        if (c.parameters.maxWorlds) {
          config.maxWorlds = c.parameters.maxWorlds as number;
        }
      }
    }

    return config;
  }

  /**
   * Apply OSE structure to universe
   */
  private async applyOSEStructure(universe: Universe, oseResults: any[]): Promise<void> {
    // Apply OSE state to universe metadata
    for (const result of oseResults) {
      if (result.state) {
        const data = universe.getData();
        const metadata = data.metadata || {};
        metadata.ose = {
          white: result.state.white,
          blue: {
            nodeCount: result.state.blue.nodes.length,
            edgeCount: result.state.blue.edges.length,
          },
          gold: result.state.gold,
          fateConvergence: result.fateConvergence,
        };
        // Update metadata through data object
        data.metadata = metadata;
      }
    }
  }

  /**
   * Generate worlds from IAL
   */
  private async generateWorldsFromIAL(
    universe: Universe,
    compiled: CompiledIAL[]
  ): Promise<void> {
    for (const c of compiled) {
      if (c.target === 'world') {
        const worldName = `World-${c.operation}`;
        universe.createWorld(worldName);
      }
    }
  }

  /**
   * Initialize fate graph from OSE
   */
  private async initializeFateFromOSE(
    universe: Universe,
    oseResults: any[]
  ): Promise<void> {
    // Use OSE fate convergence to initialize fate graph
    for (const result of oseResults) {
      if (result.fateConvergence && result.fateConvergence > 0.7) {
        // High convergence - create mainline node
        const fateWeaver = (universe as any).fateWeaver;
        if (fateWeaver) {
          fateWeaver.createNode(universe.getData().id, {
            name: 'Mainline Node',
            type: 'mainline',
            convergence: result.fateConvergence,
          });
        }
      }
    }
  }

  /**
   * Convert description to IAL expression
   */
  private descriptionToIAL(description: string): string {
    // Enhanced heuristic: map keywords to IAL glyphs
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('universe') || lowerDesc.includes('create')) {
      return 'W₁ : Γ : I';
    }
    if (lowerDesc.includes('world')) {
      return 'Ψ : Γ K : V';
    }
    if (lowerDesc.includes('fate') || lowerDesc.includes('destiny')) {
      return 'ΔΩ : Γ : MΩ';
    }
    if (lowerDesc.includes('magic') || lowerDesc.includes('spell')) {
      return 'Λ : Σ Φ : A₊';
    }
    if (lowerDesc.includes('structure') || lowerDesc.includes('build')) {
      return 'Γ : Π Χ : D';
    }
    
    // Default
    return 'Æ : Σ : Φ';
  }

  /**
   * Generate world from template
   */
  private async generateWorldFromTemplate(
    universe: Universe,
    template: any
  ): Promise<void> {
    const world = universe.createWorld(template.name);
    
    // Apply IAL to world structure if needed
    if (template.ialExpression) {
      const compiled = compileIAL(template.ialExpression);
      if (compiled.success && compiled.compiled) {
        // Apply IAL structure to world
        // This would modify world properties based on IAL
      }
    }
  }

  /**
   * Generate rule from template
   */
  private async generateRuleFromTemplate(
    universe: Universe,
    template: any
  ): Promise<void> {
    // Create rule in universe
    // This would use universe's rule system
  }

  /**
   * Generate fate node from template
   */
  private async generateFateNodeFromTemplate(
    universe: Universe,
    template: any
  ): Promise<void> {
    const fateWeaver = (universe as any).fateWeaver;
    if (fateWeaver) {
      fateWeaver.createNode(universe.getData().id, {
        name: template.name,
        type: template.type,
        convergence: template.convergence,
      });
    }
  }

  /**
   * Get template system
   */
  getTemplateSystem(): TemplateSystem {
    return this.templateSystem;
  }

  /**
   * Get procedural generator
   */
  getProceduralGenerator(): ProceduralGenerator {
    return this.proceduralGenerator;
  }
}

