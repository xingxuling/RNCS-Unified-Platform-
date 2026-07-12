// 畅想式融合 · 评分与优先级
import type { ImaginativeFusionIdea } from "./imaginativeFusionTypes";

export function scoreAndPrioritize(idea: ImaginativeFusionIdea): ImaginativeFusionIdea {
  const composite =
    idea.potentialValue * 0.35 +
    idea.strategicFit * 0.3 +
    idea.novelty * 0.15 -
    idea.implementationDifficulty * 0.2;

  let priority: ImaginativeFusionIdea["recommendedPriority"];
  if (idea.riskLevel === "HIGH" && composite < 5) priority = "P3";
  else if (composite >= 6 && idea.riskLevel !== "HIGH") priority = "P0";
  else if (composite >= 4.5) priority = "P1";
  else if (composite >= 3) priority = "P2";
  else priority = "P3";

  return { ...idea, recommendedPriority: priority };
}

export function rankIdeas(ideas: ImaginativeFusionIdea[]): ImaginativeFusionIdea[] {
  const scored = ideas.map(scoreAndPrioritize);
  const weight = (i: ImaginativeFusionIdea) =>
    i.potentialValue * 0.35 + i.strategicFit * 0.3 + i.novelty * 0.15 - i.implementationDifficulty * 0.2;
  return [...scored].sort((a, b) => weight(b) - weight(a));
}
