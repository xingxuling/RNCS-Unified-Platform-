// AetherSeed Auto Training Executor · 命令构建器
// 严格用 executable + args[] 结构化构造，绝不拼接 shell 字符串。
import type { LocalTrainingBundle } from "@/lib/aetherseed-local-training/localTrainingRuntime";
import {
  nextAutoTrainingId,
  type AutoTrainingCommand,
  type AutoTrainingCommandType,
} from "./autoTrainingTypes";
import { checkCommandWhitelist } from "./autoTrainingWhitelistPolicy";

function safeWorkingDirectory(planId: string): string {
  return `./AetherSeed/${planId}`;
}

function build(
  taskId: string,
  commandType: AutoTrainingCommandType,
  executable: AutoTrainingCommand["executable"],
  args: string[],
  workingDirectory: string,
): AutoTrainingCommand {
  const draft: AutoTrainingCommand = {
    id: nextAutoTrainingId("CMD"),
    taskId,
    commandType,
    executable,
    args,
    workingDirectory,
    whitelistStatus: "PASS",
    reason: "",
  };
  const check = checkCommandWhitelist(draft);
  return { ...draft, whitelistStatus: check.status, reason: check.reason };
}

export function buildAutoTrainingCommands(taskId: string, bundle: LocalTrainingBundle): AutoTrainingCommand[] {
  const wd = safeWorkingDirectory(bundle.plan.id);
  const cmds: AutoTrainingCommand[] = [
    build(taskId, "CHECK_ENV", "python", ["check_env.py"], wd),
    build(taskId, "INSTALL_REQUIREMENTS", "python", ["-m", "pip", "install", "-r", "requirements.txt"], wd),
    build(taskId, "PYTHON_TRAIN", "python", ["train.py", "--config", "config.yaml", "--out", "checkpoint"], wd),
    build(taskId, "PYTHON_EVAL", "python", ["eval.py", "--config", "config.yaml", "--checkpoint", `checkpoint/${bundle.plan.targetModel.toLowerCase()}_final.pt`, "--out", "eval_report.json"], wd),
  ];
  return cmds;
}

export function previewCommand(cmd: AutoTrainingCommand): string {
  return `${cmd.executable} ${cmd.args.join(" ")}`;
}
