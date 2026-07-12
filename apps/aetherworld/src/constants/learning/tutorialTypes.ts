export type TutorialType =
  | "QUICK_START"
  | "STEP_BY_STEP"
  | "CONCEPT_EXPLAINER"
  | "WORKFLOW"
  | "EXAMPLE_RUN"
  | "TROUBLESHOOTING"
  | "ADVANCED_GUIDE"
  | "FOUNDER_MANUAL"
  | "EXPORT_GUIDE"
  | "SAFETY_GUIDE";

export const TUTORIAL_TYPES: { id: TutorialType; label: string; chineseLabel: string }[] = [
  { id: "QUICK_START", label: "Quick Start", chineseLabel: "快速开始" },
  { id: "STEP_BY_STEP", label: "Step by Step", chineseLabel: "逐步教程" },
  { id: "CONCEPT_EXPLAINER", label: "Concept Explainer", chineseLabel: "概念解释" },
  { id: "WORKFLOW", label: "Workflow", chineseLabel: "完整工作流" },
  { id: "EXAMPLE_RUN", label: "Example Run", chineseLabel: "示例运行" },
  { id: "TROUBLESHOOTING", label: "Troubleshooting", chineseLabel: "故障排查" },
  { id: "ADVANCED_GUIDE", label: "Advanced Guide", chineseLabel: "高阶指南" },
  { id: "FOUNDER_MANUAL", label: "Founder Manual", chineseLabel: "Founder 手册" },
  { id: "EXPORT_GUIDE", label: "Export Guide", chineseLabel: "导出指南" },
  { id: "SAFETY_GUIDE", label: "Safety Guide", chineseLabel: "安全边界指南" },
];
