export interface CodeSandboxWebLlmTask {
  taskType: "EXPLAIN_ERROR" | "REPAIR_SUGGESTION" | "PATCH_DRAFT" | "EXPLAIN_LOG" | "BUILD_CODEX_PACK" | "BUILD_CURSOR_PACK";
  context: Record<string, unknown>;
  forbidden: string[];
}

export function buildCodeSandboxWebLlmTask(taskType: CodeSandboxWebLlmTask["taskType"], context: Record<string, unknown>): CodeSandboxWebLlmTask {
  return {
    taskType,
    context,
    forbidden: [
      "WebLLM 不得直接执行命令",
      "WebLLM 不得声称代码真实运行",
      "WebLLM 不得生成危险命令",
      "WebLLM 不得绕过 Sandbox QA",
    ],
  };
}
