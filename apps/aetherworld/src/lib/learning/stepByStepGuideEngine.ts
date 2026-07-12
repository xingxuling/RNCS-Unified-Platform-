import { getTutorial } from "./tutorialRegistry";
import type { TutorialDefinition } from "@/constants/learning/lessonTemplates";

export interface StepByStepGuide {
  tutorialId: string;
  title: string;
  objective: string;
  prerequisites: string[];
  steps: { idx: number; title: string; instruction: string; route?: string; example?: string; expected?: string; warning?: string }[];
  saveExportHint: string;
  commonErrors: string[];
}

export function buildStepByStepGuide(tutorialId: string): StepByStepGuide | null {
  const t = getTutorial(tutorialId);
  if (!t) return null;
  return formatGuide(t);
}

export function formatGuide(t: TutorialDefinition): StepByStepGuide {
  return {
    tutorialId: t.tutorialId,
    title: t.chineseTitle,
    objective: `完成 ${t.chineseTitle}，覆盖模块：${t.targetModules.join("、")}`,
    prerequisites: t.prerequisites,
    steps: t.steps.map((s, i) => ({
      idx: i + 1,
      title: s.title,
      instruction: s.instruction,
      route: s.targetRoute,
      example: s.exampleInput,
      expected: s.expectedResult,
      warning: s.warning,
    })),
    saveExportHint: "建议运行 Recalculation 或导出结果到本地。",
    commonErrors: t.safetyNotes,
  };
}
