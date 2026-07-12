import type { DigitalRoleType } from "@/constants/digital-roles/digitalRoleTypes";
import type { DigitalRoleTaskType } from "@/constants/digital-roles/digitalRoleTaskTypes";

export interface DigitalRoleOutput {
  outputId: string;
  roleId: DigitalRoleType;
  taskType: DigitalRoleTaskType;
  title: string;
  summary: string;
  structuredOutput: Record<string, unknown>;
  nextRoleSuggestions: DigitalRoleType[];
  nextEngineSuggestions: string[];
  workspaceSaveRecommended: boolean;
  qaRequired: boolean;
  governanceRequired: boolean;
  safetyNotes: string[];
}

const TEMPLATES: Partial<Record<DigitalRoleType, Record<string, unknown>>> = {
  DIGITAL_FOUNDER: { directionDecision: "", priority: "P1", whyNow: "", whyNot: "", nextDecisionGate: "" },
  DIGITAL_ARCHITECT: { moduleMap: [], dataFlow: [], objectModel: [], runtimeContract: {}, risks: [] },
  DIGITAL_PRODUCT_MANAGER: { userStories: [], featureList: [], MVP: [], acceptanceCriteria: [], priority: "P1" },
  DIGITAL_PROGRAMMER: { filePlan: [], implementationSteps: [], testPlan: [], technicalRisks: [], fallbackPlan: "" },
  DIGITAL_PLANNER: { contentPlan: [], phasePlan: [], taskChain: [], resourceNeeds: [], milestone: [] },
  DIGITAL_QA: { result: "PASS", issues: [], severity: [], blockers: [], recommendedFixes: [] },
  DIGITAL_GOVERNANCE_OFFICER: { constitutionCheck: "PASS", permissionCheck: "PASS", clmCheck: "PASS", blockDecision: false, archiveSuggestion: false },
};

export function buildRoleOutput(role: DigitalRoleType, taskType: DigitalRoleTaskType, summary: string): DigitalRoleOutput {
  return {
    outputId: `out-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
    roleId: role,
    taskType,
    title: `${role} · ${taskType}`,
    summary,
    structuredOutput: TEMPLATES[role] ?? { note: "通用输出模板" },
    nextRoleSuggestions: [],
    nextEngineSuggestions: [],
    workspaceSaveRecommended: true,
    qaRequired: role !== "DIGITAL_QA",
    governanceRequired: role === "DIGITAL_GROWTH_STRATEGIST" || role === "DIGITAL_FOUNDER",
    safetyNotes: [],
  };
}
