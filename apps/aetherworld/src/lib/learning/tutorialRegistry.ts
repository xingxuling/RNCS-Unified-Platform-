import { LESSON_TEMPLATES, type TutorialDefinition } from "@/constants/learning/lessonTemplates";
import type { UserLearningLevel } from "@/constants/learning/userLearningLevels";
import type { TutorialType } from "@/constants/learning/tutorialTypes";

let registry: TutorialDefinition[] = [...LESSON_TEMPLATES];

export function listTutorials(): TutorialDefinition[] {
  return [...registry];
}

export function getTutorial(id: string): TutorialDefinition | undefined {
  return registry.find((t) => t.tutorialId === id);
}

export function filterTutorials(opts: { level?: UserLearningLevel; type?: TutorialType; module?: string } = {}): TutorialDefinition[] {
  return registry.filter((t) => {
    if (opts.level && t.level !== opts.level) return false;
    if (opts.type && t.type !== opts.type) return false;
    if (opts.module && !t.targetModules.includes(opts.module)) return false;
    return true;
  });
}

export function registerTutorial(tut: TutorialDefinition): void {
  const idx = registry.findIndex((t) => t.tutorialId === tut.tutorialId);
  if (idx >= 0) registry[idx] = tut;
  else registry.push(tut);
}

export function tutorialsByModule(): Record<string, TutorialDefinition[]> {
  const map: Record<string, TutorialDefinition[]> = {};
  for (const t of registry) {
    for (const m of t.targetModules) {
      if (!map[m]) map[m] = [];
      map[m].push(t);
    }
  }
  return map;
}

export function searchTutorials(query: string): TutorialDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return registry.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.chineseTitle.includes(q) ||
      t.targetModules.some((m) => m.includes(q))
  );
}
