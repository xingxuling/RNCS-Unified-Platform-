import type { DigitalRoleType } from "@/constants/digital-roles/digitalRoleTypes";
import type { DigitalRoleTaskType } from "@/constants/digital-roles/digitalRoleTaskTypes";

export interface DigitalRoleAssignment {
  assignmentId: string;
  taskType: DigitalRoleTaskType;
  primaryRole: DigitalRoleType;
  secondaryRoles: DigitalRoleType[];
  requiredRoles: DigitalRoleType[];
  optionalRoles: DigitalRoleType[];
  blockedRoles: DigitalRoleType[];
  reason: string;
}

const TABLE: Record<DigitalRoleTaskType, { primary: DigitalRoleType; secondary: DigitalRoleType[] }> = {
  IDEA_TO_PRODUCT: {
    primary: "DIGITAL_PRODUCT_MANAGER",
    secondary: ["DIGITAL_ARCHITECT", "DIGITAL_DESIGNER", "DIGITAL_QA", "DIGITAL_DOCUMENTATION_LEAD"],
  },
  IDEA_TO_SYSTEM: {
    primary: "DIGITAL_ARCHITECT",
    secondary: ["DIGITAL_PROGRAMMER", "DIGITAL_QA", "DIGITAL_GOVERNANCE_OFFICER"],
  },
  SYSTEM_ARCHITECTURE: {
    primary: "DIGITAL_ARCHITECT",
    secondary: ["DIGITAL_PROGRAMMER", "DIGITAL_QA"],
  },
  PRODUCT_REQUIREMENTS: {
    primary: "DIGITAL_PRODUCT_MANAGER",
    secondary: ["DIGITAL_DESIGNER", "DIGITAL_QA"],
  },
  CODE_IMPLEMENTATION_PLAN: {
    primary: "DIGITAL_PROGRAMMER",
    secondary: ["DIGITAL_ARCHITECT", "DIGITAL_QA"],
  },
  CREATIVE_PLANNING: {
    primary: "DIGITAL_PLANNER",
    secondary: ["DIGITAL_NARRATIVE_DIRECTOR", "DIGITAL_DESIGNER"],
  },
  WORLD_BUILDING: {
    primary: "DIGITAL_WORLD_BUILDER",
    secondary: ["DIGITAL_NARRATIVE_DIRECTOR", "DIGITAL_MUSIC_DIRECTOR", "DIGITAL_QA"],
  },
  NARRATIVE_DESIGN: {
    primary: "DIGITAL_NARRATIVE_DIRECTOR",
    secondary: ["DIGITAL_WORLD_BUILDER", "DIGITAL_MUSIC_DIRECTOR"],
  },
  MUSIC_DIRECTION: {
    primary: "DIGITAL_MUSIC_DIRECTOR",
    secondary: ["DIGITAL_NARRATIVE_DIRECTOR"],
  },
  RESEARCH_AND_EVIDENCE: {
    primary: "DIGITAL_RESEARCHER",
    secondary: ["DIGITAL_QA"],
  },
  QA_AND_AUDIT: {
    primary: "DIGITAL_QA",
    secondary: ["DIGITAL_GOVERNANCE_OFFICER"],
  },
  DOCS_AND_TUTORIALS: {
    primary: "DIGITAL_DOCUMENTATION_LEAD",
    secondary: ["DIGITAL_PRODUCT_MANAGER"],
  },
  GROWTH_AND_SHOWCASE: {
    primary: "DIGITAL_GROWTH_STRATEGIST",
    secondary: ["DIGITAL_DESIGNER", "DIGITAL_PRODUCT_MANAGER", "DIGITAL_GOVERNANCE_OFFICER"],
  },
  GOVERNANCE_REVIEW: {
    primary: "DIGITAL_GOVERNANCE_OFFICER",
    secondary: ["DIGITAL_QA"],
  },
  VERSION_UPGRADE: {
    primary: "DIGITAL_SYSTEM_STRATEGIST",
    secondary: ["DIGITAL_ARCHITECT", "DIGITAL_PROGRAMMER", "DIGITAL_QA"],
  },
  CLM_REVIEW: {
    primary: "DIGITAL_SYSTEM_STRATEGIST",
    secondary: ["DIGITAL_GOVERNANCE_OFFICER"],
  },
  CROSS_FUNCTIONAL_WORKFLOW: {
    primary: "DIGITAL_ARCHITECT",
    secondary: ["DIGITAL_PROGRAMMER", "DIGITAL_QA"],
  },
  OBJECT_COMPILATION: {
    primary: "DIGITAL_ARCHITECT",
    secondary: ["DIGITAL_PRODUCT_MANAGER", "DIGITAL_QA"],
  },
};

export function assignDigitalRoles(taskType: DigitalRoleTaskType, highRisk = false): DigitalRoleAssignment {
  const entry = TABLE[taskType];
  const secondary = [...entry.secondary];
  if (highRisk) {
    if (!secondary.includes("DIGITAL_GOVERNANCE_OFFICER")) secondary.push("DIGITAL_GOVERNANCE_OFFICER");
    if (!secondary.includes("DIGITAL_QA")) secondary.push("DIGITAL_QA");
  }
  return {
    assignmentId: `assign-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
    taskType,
    primaryRole: entry.primary,
    secondaryRoles: secondary,
    requiredRoles: [entry.primary, ...secondary.filter((r) => r === "DIGITAL_QA" || r === "DIGITAL_GOVERNANCE_OFFICER")],
    optionalRoles: [],
    blockedRoles: [],
    reason: `任务类型 ${taskType} 默认由 ${entry.primary} 主导；${highRisk ? "已强制加入 QA 与治理。" : "次要角色协作。"}`,
  };
}
