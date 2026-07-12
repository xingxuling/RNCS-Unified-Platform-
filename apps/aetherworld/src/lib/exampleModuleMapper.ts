import { MODULE_EXAMPLE_GUIDES, getModuleGuide } from "@/constants/exampleModuleTypes";
import { USAGE_EXAMPLES } from "./usageExampleCalculus";

export function examplesForModule(moduleId: string) {
  return USAGE_EXAMPLES.filter((e) => e.moduleId === moduleId);
}

export function modulesWithoutExamples(): string[] {
  return MODULE_EXAMPLE_GUIDES
    .filter((m) => !USAGE_EXAMPLES.some((e) => e.moduleId === m.moduleId))
    .map((m) => m.moduleId);
}

export { MODULE_EXAMPLE_GUIDES, getModuleGuide };
