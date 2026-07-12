import type { DigitalRoleType } from "@/constants/digital-roles/digitalRoleTypes";
import type { DigitalRoleWorkflowType } from "@/constants/digital-roles/digitalRoleWorkflowTypes";
import type { DigitalRoleAssignment } from "./digitalRoleAssignmentEngine";

export interface DigitalRoleWorkflowStep {
  stepId: string;
  roleId: DigitalRoleType;
  action: string;
  inputSummary: string;
  outputSummary: string;
  status: "PENDING" | "RUNNING" | "DONE" | "BLOCKED" | "FAILED";
}

export interface DigitalRoleWorkflow {
  workflowId: string;
  title: string;
  workflowType: DigitalRoleWorkflowType;
  taskType: string;
  roles: DigitalRoleAssignment[];
  steps: DigitalRoleWorkflowStep[];
  finalOutputType: string;
  workspaceRecordId?: string;
  qaRequired: boolean;
  governanceRequired: boolean;
}

const CHAINS: Record<DigitalRoleWorkflowType, DigitalRoleType[]> = {
  PRODUCT_BUILD_CHAIN: [
    "DIGITAL_FOUNDER", "DIGITAL_PRODUCT_MANAGER", "DIGITAL_ARCHITECT", "DIGITAL_DESIGNER",
    "DIGITAL_PROGRAMMER", "DIGITAL_QA", "DIGITAL_DOCUMENTATION_LEAD", "DIGITAL_GROWTH_STRATEGIST",
  ],
  SYSTEM_BUILD_CHAIN: [
    "DIGITAL_SYSTEM_STRATEGIST", "DIGITAL_ARCHITECT", "DIGITAL_PROGRAMMER",
    "DIGITAL_QA", "DIGITAL_GOVERNANCE_OFFICER", "DIGITAL_DOCUMENTATION_LEAD",
  ],
  CREATIVE_ASSET_CHAIN: [
    "DIGITAL_PLANNER", "DIGITAL_WORLD_BUILDER", "DIGITAL_NARRATIVE_DIRECTOR",
    "DIGITAL_MUSIC_DIRECTOR", "DIGITAL_DESIGNER", "DIGITAL_QA", "DIGITAL_DOCUMENTATION_LEAD",
  ],
  VERSION_UPGRADE_CHAIN: [
    "DIGITAL_SYSTEM_STRATEGIST", "DIGITAL_PRODUCT_MANAGER", "DIGITAL_ARCHITECT",
    "DIGITAL_PROGRAMMER", "DIGITAL_QA",
  ],
  GOVERNANCE_REVIEW_CHAIN: [
    "DIGITAL_QA", "DIGITAL_GOVERNANCE_OFFICER",
  ],
};

export function planDigitalRoleWorkflow(type: DigitalRoleWorkflowType, taskType: string, assignment: DigitalRoleAssignment): DigitalRoleWorkflow {
  const chain = CHAINS[type];
  const steps: DigitalRoleWorkflowStep[] = chain.map((roleId, idx) => ({
    stepId: `step-${idx + 1}`,
    roleId,
    action: `${roleId} 处理 ${taskType}`,
    inputSummary: idx === 0 ? "任务输入" : `${chain[idx - 1]} 的输出`,
    outputSummary: `${roleId} 的结构化输出`,
    status: "PENDING",
  }));
  return {
    workflowId: `wf-${Date.now().toString(36)}`,
    title: `${type} · ${taskType}`,
    workflowType: type,
    taskType,
    roles: [assignment],
    steps,
    finalOutputType: "STRUCTURED_OUTPUT",
    qaRequired: true,
    governanceRequired: chain.includes("DIGITAL_GOVERNANCE_OFFICER"),
  };
}

export function listWorkflowChains() {
  return Object.entries(CHAINS).map(([type, chain]) => ({ type, chain }));
}
