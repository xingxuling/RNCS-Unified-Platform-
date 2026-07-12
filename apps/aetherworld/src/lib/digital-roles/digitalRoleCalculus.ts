import { resolveDigitalRoleTaskType } from "./digitalRoleTypeResolver";
import { assignDigitalRoles, type DigitalRoleAssignment } from "./digitalRoleAssignmentEngine";
import { planDigitalRoleWorkflow, type DigitalRoleWorkflow } from "./digitalRoleWorkflowPlanner";
import { buildCollaborationGraph } from "./digitalRoleCollaborationEngine";
import { buildRoleOutput, type DigitalRoleOutput } from "./digitalRoleOutputAdapter";
import { detectRoleConflicts, type DigitalRoleConflict } from "./digitalRoleConflictDetector";
import { runDigitalRoleQa, type DigitalRoleQaReport } from "./digitalRoleQaBridge";
import { runDigitalRoleGovernance, type GovernanceDecision } from "./digitalRoleGovernanceBridge";
import { runDigitalRoleSafetyGuard } from "./digitalRoleSafetyGuard";
import { saveDigitalRoleWorkflowToWorkspace } from "./digitalRoleWorkspaceBridge";
import type { DigitalRoleWorkflowType } from "@/constants/digital-roles/digitalRoleWorkflowTypes";
import type { DigitalRoleTaskType } from "@/constants/digital-roles/digitalRoleTaskTypes";

export interface DigitalRoleCalculusResult {
  runId: string;
  input: string;
  taskType: DigitalRoleTaskType;
  assignment: DigitalRoleAssignment;
  workflow: DigitalRoleWorkflow;
  collaboration: ReturnType<typeof buildCollaborationGraph>;
  outputs: DigitalRoleOutput[];
  conflicts: DigitalRoleConflict[];
  qa: DigitalRoleQaReport;
  governance: GovernanceDecision;
  safety: ReturnType<typeof runDigitalRoleSafetyGuard>;
  workspaceRecordId: string;
}

const TASK_TO_WORKFLOW: Partial<Record<DigitalRoleTaskType, DigitalRoleWorkflowType>> = {
  IDEA_TO_PRODUCT: "PRODUCT_BUILD_CHAIN",
  PRODUCT_REQUIREMENTS: "PRODUCT_BUILD_CHAIN",
  IDEA_TO_SYSTEM: "SYSTEM_BUILD_CHAIN",
  SYSTEM_ARCHITECTURE: "SYSTEM_BUILD_CHAIN",
  CODE_IMPLEMENTATION_PLAN: "SYSTEM_BUILD_CHAIN",
  CREATIVE_PLANNING: "CREATIVE_ASSET_CHAIN",
  WORLD_BUILDING: "CREATIVE_ASSET_CHAIN",
  NARRATIVE_DESIGN: "CREATIVE_ASSET_CHAIN",
  MUSIC_DIRECTION: "CREATIVE_ASSET_CHAIN",
  VERSION_UPGRADE: "VERSION_UPGRADE_CHAIN",
  CLM_REVIEW: "VERSION_UPGRADE_CHAIN",
  GOVERNANCE_REVIEW: "GOVERNANCE_REVIEW_CHAIN",
  QA_AND_AUDIT: "GOVERNANCE_REVIEW_CHAIN",
  RESEARCH_AND_EVIDENCE: "PRODUCT_BUILD_CHAIN",
  GROWTH_AND_SHOWCASE: "PRODUCT_BUILD_CHAIN",
  DOCS_AND_TUTORIALS: "PRODUCT_BUILD_CHAIN",
  CROSS_FUNCTIONAL_WORKFLOW: "SYSTEM_BUILD_CHAIN",
  OBJECT_COMPILATION: "SYSTEM_BUILD_CHAIN",
};

export interface RunOptions {
  highRisk?: boolean;
  workflowOverride?: DigitalRoleWorkflowType;
  founderMode?: boolean;
}

export function runDigitalRoleCalculus(input: string, options: RunOptions = {}): DigitalRoleCalculusResult {
  const taskType = resolveDigitalRoleTaskType(input);
  const assignment = assignDigitalRoles(taskType, options.highRisk ?? false);
  const wfType = options.workflowOverride ?? TASK_TO_WORKFLOW[taskType] ?? "PRODUCT_BUILD_CHAIN";
  const workflow = planDigitalRoleWorkflow(wfType, taskType, assignment);
  const collaboration = buildCollaborationGraph(workflow);
  const outputs: DigitalRoleOutput[] = workflow.steps.map((s) => buildRoleOutput(s.roleId, taskType, `${s.roleId} 处理 ${taskType} 的草案`));
  const involvedRoles = workflow.steps.map((s) => s.roleId);
  const conflicts = detectRoleConflicts(involvedRoles);
  const qa = runDigitalRoleQa(workflow, conflicts);
  const governance = runDigitalRoleGovernance(workflow);
  const safety = runDigitalRoleSafetyGuard({});
  const save = saveDigitalRoleWorkflowToWorkspace(workflow, outputs);

  return {
    runId: `dr-${Date.now().toString(36)}`,
    input,
    taskType,
    assignment,
    workflow,
    collaboration,
    outputs,
    conflicts,
    qa,
    governance,
    safety,
    workspaceRecordId: save.recordId,
  };
}

export function digitalRoleCalculusMeta() {
  return {
    name: "Digital Role Calculus",
    chinese: "数字角色计算法",
    version: "v1.0",
    formula: "Team Output = Objective × Assignment × Authority × Input × Output × Protocol × Runtime × QA × Governance × Workspace ÷ Conflict ÷ Drift ÷ Overreach ÷ Duplication ÷ Loss ÷ Overclaim",
  };
}
