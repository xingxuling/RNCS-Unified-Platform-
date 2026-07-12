// 虚拟创造物计算法 · 主编排
import { compileCreationSeed, type CreationInput, type CreationSeed } from "./creationSeedCompiler";
import { evaluateAllDomains, aggregateFeasibility, type DomainScore, type FeasibilityAggregation } from "./creationFeasibilityEngine";
import { identifyRisks, type IdentifiedRisk } from "./creationRiskAnalyzer";
import { simulateDesign, type DesignSimulation } from "./creationDesignSimulator";
import { planEvolution, type EvolutionRoadmap } from "./creationEvolutionPlanner";
import { resolveFeasibility } from "@/constants/creationFeasibilityLevels";
import { CREATION_REALITY_BOUNDARY_TEXT } from "@/constants/creationRiskTypes";

export interface CreationSimulationResult {
  creationName: string;
  objectType: string;
  objectTypeName: string;
  seed: CreationSeed;
  viabilityScore: number;
  feasibilityLevel: string;
  feasibilityLevelName: string;
  feasibilityDescription: string;
  feasibilityAdvice: string;
  strongestDomains: string[];
  weakestDomains: string[];
  domainScores: DomainScore[];
  aggregation: FeasibilityAggregation;
  scienceConstantAnalysis: Record<string, { score: number; weight: number; weighted: number; topConstants: { name: string; hint: string }[] }>;
  mainRisks: IdentifiedRisk[];
  designRecommendations: string[];
  firstPrototypePath: string[];
  validationPlan: string[];
  evolutionPotential: string;
  evolutionRoadmap: EvolutionRoadmap;
  safetyNote: string;
}

export function runVirtualCreation(input: CreationInput): CreationSimulationResult {
  const seed = compileCreationSeed(input);
  const domainScores = evaluateAllDomains(seed, input);
  const aggregation = aggregateFeasibility(domainScores);
  const risks = identifyRisks(input);

  // 风险扣减
  const penalty = risks.reduce((s, r) =>
    s + (r.severity === "CRITICAL" ? 12 : r.severity === "HIGH" ? 7 : r.severity === "MEDIUM" ? 4 : 1), 0);
  const viability = Math.max(0, Math.min(100, aggregation.rawScore - penalty));
  const level = resolveFeasibility(viability);

  const design: DesignSimulation = simulateDesign(seed, aggregation, risks);
  const roadmap = planEvolution({ ...aggregation, rawScore: viability });

  const scienceAnalysis: CreationSimulationResult["scienceConstantAnalysis"] = {};
  domainScores.forEach(d => {
    scienceAnalysis[d.domainId] = {
      score: d.score, weight: d.weight, weighted: d.weighted,
      topConstants: d.topConstants.map(t => ({ name: t.name, hint: t.hint })),
    };
  });

  return {
    creationName: seed.name,
    objectType: seed.objectType.id,
    objectTypeName: seed.objectType.userFriendlyName,
    seed,
    viabilityScore: viability,
    feasibilityLevel: level.id,
    feasibilityLevelName: level.userFriendlyName,
    feasibilityDescription: level.description,
    feasibilityAdvice: level.advice,
    strongestDomains: aggregation.strongest.map(s => s.domainName),
    weakestDomains: aggregation.weakest.map(s => s.domainName),
    domainScores,
    aggregation,
    scienceConstantAnalysis: scienceAnalysis,
    mainRisks: risks,
    designRecommendations: design.designRecommendations,
    firstPrototypePath: design.firstPrototypePath,
    validationPlan: design.validationPlan,
    evolutionPotential: roadmap.potential,
    evolutionRoadmap: roadmap,
    safetyNote: CREATION_REALITY_BOUNDARY_TEXT,
  };
}

// 生成 Lovable / Codex Prompt
export function buildLovablePrompt(r: CreationSimulationResult): string {
  return `# Build Prompt · ${r.creationName}

Object Type: ${r.objectTypeName} (${r.objectType})
Viability: ${r.viabilityScore}/100 · ${r.feasibilityLevelName}

## Strong Domains
${r.strongestDomains.map(s => `- ${s}`).join("\n")}

## Weak Domains (need patch)
${r.weakestDomains.map(s => `- ${s}`).join("\n")}

## Prototype Path
${r.firstPrototypePath.map(s => `- ${s}`).join("\n")}

## Validation Plan
${r.validationPlan.map(s => `- ${s}`).join("\n")}

## Safety Boundary
${r.safetyNote}
`;
}
