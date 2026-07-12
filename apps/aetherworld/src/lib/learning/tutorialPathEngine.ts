import { TUTORIAL_PATH_TEMPLATES, type TutorialPathTemplate } from "@/constants/learning/tutorialPathTemplates";
import { getTutorial } from "./tutorialRegistry";
import type { UserLearningLevel } from "@/constants/learning/userLearningLevels";

export function listPaths(): TutorialPathTemplate[] {
  return [...TUTORIAL_PATH_TEMPLATES];
}

export function getPath(id: string): TutorialPathTemplate | undefined {
  return TUTORIAL_PATH_TEMPLATES.find((p) => p.pathId === id);
}

export function recommendPaths(level: UserLearningLevel): TutorialPathTemplate[] {
  return TUTORIAL_PATH_TEMPLATES.filter((p) => p.level === level);
}

export function expandPath(pathId: string) {
  const p = getPath(pathId);
  if (!p) return null;
  return {
    ...p,
    tutorials: p.tutorialIds.map((id) => getTutorial(id)).filter(Boolean),
  };
}
