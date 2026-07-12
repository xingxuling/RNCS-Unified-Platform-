import type { CodeRunTargetFile, CodeRunLog } from "./codeRunRequestEngine";
import { createLogger } from "./codeRunLogEngine";

export interface SimulatedBuildOutput {
  status: "PASS" | "WARN" | "FAIL" | "SIMULATED";
  logs: CodeRunLog[];
}

export function runSimulatedBuild(files: CodeRunTargetFile[], command?: string): SimulatedBuildOutput {
  const log = createLogger("SIMULATED_BUILD_RUNNER");
  log.system(`Simulated build started${command ? `（命令：${command}）` : ""}.`);
  log.info(`扫描 ${files.length} 个文件。`);
  log.info("检查 package.json。");
  if (!files.some((f) => f.path.endsWith("package.json"))) log.warn("未发现 package.json。");
  log.info("检查入口文件。");
  if (!files.some((f) => f.path === "src/main.tsx" || f.path === "src/App.tsx" || f.path === "index.html")) log.warn("未发现明确入口。");
  log.info("静态分析 import 路径。");
  log.warn("React draft 在 v0.2 中为代码视图，不真实执行 build。");
  log.info("生成模拟 build 报告。");
  log.system("Simulated build finished. (不执行真实命令)");
  return { status: "SIMULATED", logs: log.logs };
}
