import { visibleLevels, type ExampleComplexityLevel } from "@/constants/exampleComplexityLevels";
import type { UsageExample } from "./usageExampleCalculus";

export function limitByComplexity(
  examples: UsageExample[],
  opts: { beginner: boolean; founder: boolean },
): UsageExample[] {
  const allowed = new Set<ExampleComplexityLevel>(visibleLevels(opts));
  return examples.filter((e) => allowed.has(e.complexityLevel));
}
