// Text Dependency Graph — see spec §5
import { TEXT_REGISTRY, type TextEntry } from "./textRegistry";

export type TextDependencySource =
  | "MODULE" | "ROUTE" | "CONSTANT" | "CONSTITUTION"
  | "USER_MODE" | "SUBJECT_MODE" | "SAFETY_RULE" | "DOCS" | "EXAMPLE";

export interface TextDependency {
  sourceType: TextDependencySource;
  sourceId: string;
  textId: string;
  dependencyStrength: number; // 0..1
  updateRequiredOnChange: boolean;
}

export function buildDependencyGraph(): TextDependency[] {
  const deps: TextDependency[] = [];
  for (const entry of TEXT_REGISTRY) {
    deps.push({
      sourceType: "MODULE", sourceId: entry.moduleId, textId: entry.textId,
      dependencyStrength: 1, updateRequiredOnChange: true,
    });
    if (entry.route) {
      deps.push({
        sourceType: "ROUTE", sourceId: entry.route, textId: entry.textId,
        dependencyStrength: 0.8, updateRequiredOnChange: true,
      });
    }
    for (const c of entry.relatedConstants) {
      deps.push({ sourceType: "CONSTANT", sourceId: c, textId: entry.textId,
        dependencyStrength: 0.7, updateRequiredOnChange: true });
    }
    for (const a of entry.relatedArticles) {
      deps.push({ sourceType: "CONSTITUTION", sourceId: a, textId: entry.textId,
        dependencyStrength: 0.9, updateRequiredOnChange: true });
    }
    if (entry.subjectModeSensitivity !== "NONE") {
      deps.push({ sourceType: "SUBJECT_MODE", sourceId: entry.subjectModeSensitivity, textId: entry.textId,
        dependencyStrength: 0.9, updateRequiredOnChange: true });
    }
  }
  return deps;
}

export function dependenciesFor(textId: string): TextDependency[] {
  return buildDependencyGraph().filter((d) => d.textId === textId);
}

export function dependentsOf(sourceType: TextDependencySource, sourceId: string): TextEntry[] {
  const ids = buildDependencyGraph()
    .filter((d) => d.sourceType === sourceType && d.sourceId === sourceId)
    .map((d) => d.textId);
  return TEXT_REGISTRY.filter((x) => ids.includes(x.textId));
}

export function graphSummary() {
  const deps = buildDependencyGraph();
  const byType: Record<string, number> = {};
  for (const d of deps) byType[d.sourceType] = (byType[d.sourceType] ?? 0) + 1;
  return { totalDependencies: deps.length, byType };
}
