// AetherDev · 统一运行时入口
import { newDevId, saveDevRun } from "./aetherDevStore";
import { scanProjectSnapshot } from "./aetherDevProjectScanner";
import { planDevTasks } from "./aetherDevTaskPlanner";
import { devRunCommand } from "./aetherDevGatewayBridge";
import type {
  DevAgentRun,
  DevAgentRunMode,
  DevAutomationLevel,
  DevCommandCheck,
  DevTask,
} from "./aetherDevTypes";
import { AETHERDEV_DEFAULT_LEVEL } from "./aetherDevTypes";

interface StartRunInput {
  mode?: DevAgentRunMode;
  goal?: string;
  level?: DevAutomationLevel;
}

export function observeAndPlan(input: StartRunInput = {}): DevAgentRun {
  const id = newDevId("DEV-RUN");
  const snapshot = scanProjectSnapshot();
  const tasks: DevTask[] = planDevTasks(id, snapshot);
  const now = new Date().toISOString();
  const run: DevAgentRun = {
    id,
    mode: input.mode ?? "PLAN",
    goal: input.goal ?? "扫描项目状态并生成开发任务",
    projectRoot: snapshot.projectRoot,
    status: tasks.some((t) => t.riskLevel === "HIGH") ? "NEEDS_CONFIRMATION" : "COMPLETED",
    automationLevel: input.level ?? AETHERDEV_DEFAULT_LEVEL,
    snapshot,
    tasks,
    checks: [],
    patches: [],
    recordedToBugAudit: false,
    recordedToRecordCenter: false,
    notes: [
      `共生成 ${tasks.length} 个开发任务`,
      `本地网关：${snapshot.localGateway.statusLabel}`,
    ],
    createdAt: now,
    updatedAt: now,
  };
  return saveDevRun(run);
}

export async function dryRunTypecheck(run: DevAgentRun): Promise<DevAgentRun> {
  const check = await devRunCommand({
    runId: run.id,
    command: "npx tsc --noEmit",
    level: run.automationLevel,
  });
  const next: DevAgentRun = {
    ...run,
    checks: [...run.checks, check],
    snapshot: {
      ...run.snapshot,
      lastTypecheck: {
        status: check.status,
        summary: check.outputSummary,
        at: check.createdAt,
      },
    },
  };
  return saveDevRun(next);
}

export function markRecorded(run: DevAgentRun, opts: { bugAudit?: boolean; recordCenter?: boolean; trainingSampleId?: string }): DevAgentRun {
  return saveDevRun({
    ...run,
    recordedToBugAudit: opts.bugAudit ?? run.recordedToBugAudit,
    recordedToRecordCenter: opts.recordCenter ?? run.recordedToRecordCenter,
    trainingSampleId: opts.trainingSampleId ?? run.trainingSampleId,
  });
}

export function summarizeRun(run: DevAgentRun) {
  const p = (k: DevTask["priority"]) => run.tasks.filter((t) => t.priority === k).length;
  return {
    total: run.tasks.length,
    p0: p("P0"),
    p1: p("P1"),
    p2: p("P2"),
    p3: p("P3"),
    highRisk: run.tasks.filter((t) => t.riskLevel === "HIGH").length,
    lastCheck: run.checks[run.checks.length - 1],
  };
}

export type { DevCommandCheck };
