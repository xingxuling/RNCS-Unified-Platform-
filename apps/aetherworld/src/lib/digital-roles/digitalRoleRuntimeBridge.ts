export const DIGITAL_ROLE_RUNTIME_TRIGGERS: RegExp[] = [
  /用数字团队处理/,
  /让数字创始人/,
  /让数字架构师/,
  /让数字产品经理/,
  /让数字程序员/,
  /让数字策划/,
  /让数字\s*QA/i,
  /让数字治理官/,
  /这个任务该分配给谁/,
  /让系统自己组队/,
  /数字团队跑一遍/,
];

export function shouldRouteToDigitalRoles(input: string): boolean {
  return DIGITAL_ROLE_RUNTIME_TRIGGERS.some((r) => r.test(input));
}

export interface DigitalRoleRuntimePayload {
  digitalRolesUsed: boolean;
  assignedRoles: string[];
  primaryRole: string;
  workflowId: string;
  qaRequired: boolean;
  governanceRequired: boolean;
  roleConflictCount: number;
}
