// AetherSeed Auto Training Executor · 白名单策略
import {
  DEFAULT_AUTO_TRAINING_RESOURCE_POLICY,
  type AutoTrainingCommand,
  type AutoTrainingCommandType,
} from "./autoTrainingTypes";

const ALLOWED_FIRST_ARGS: Record<AutoTrainingCommandType, RegExp[]> = {
  PYTHON_TRAIN: [/^train\.py$/],
  PYTHON_EVAL: [/^eval\.py$/],
  INSTALL_REQUIREMENTS: [/^-m$/],
  CHECK_ENV: [/^check_env\.py$/],
};

/** 校验单条命令是否满足白名单。返回 PASS / BLOCK + 原因。 */
export function checkCommandWhitelist(cmd: AutoTrainingCommand): { status: "PASS" | "BLOCK"; reason: string } {
  const exec = cmd.executable;
  if (!DEFAULT_AUTO_TRAINING_RESOURCE_POLICY.allowedExecutables.includes(exec)) {
    return { status: "BLOCK", reason: `禁止执行器：${exec}` };
  }
  if (!cmd.args.length) {
    return { status: "BLOCK", reason: "命令缺少参数" };
  }
  const head = cmd.args[0];
  const allowed = ALLOWED_FIRST_ARGS[cmd.commandType];
  if (!allowed.some((re) => re.test(head))) {
    return { status: "BLOCK", reason: `命令首参数不在白名单：${head}` };
  }
  for (const arg of cmd.args) {
    for (const bad of DEFAULT_AUTO_TRAINING_RESOURCE_POLICY.forbiddenArgs) {
      if (arg.includes(bad)) {
        return { status: "BLOCK", reason: `命中禁止字符 / 路径：${bad}` };
      }
    }
  }
  // 工作目录必须在允许列表前缀内
  const okWd = DEFAULT_AUTO_TRAINING_RESOURCE_POLICY.allowedWorkingDirectories.some((p) =>
    cmd.workingDirectory.startsWith(p) || cmd.workingDirectory.startsWith("./") || cmd.workingDirectory.startsWith("~/"),
  );
  if (!okWd) {
    return { status: "BLOCK", reason: `工作目录不在白名单：${cmd.workingDirectory}` };
  }
  return { status: "PASS", reason: "命令通过白名单校验" };
}

/** 严禁的字符串拼接型 shell 命令——一律 BLOCK */
export function isForbiddenShellString(raw: string): boolean {
  return /[;&|`$<>]|sudo|rm\s+-rf|curl|wget|git\s+clone|npm\s+install|pip\s+install\s+(?!-r\s)/i.test(raw);
}
