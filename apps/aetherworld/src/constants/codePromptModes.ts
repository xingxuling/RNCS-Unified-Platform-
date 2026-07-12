// 代码提示词模式 Code Prompt Modes
export interface CodePromptMode {
  id: string;
  name: string;
  description: string;
  toolPreference: "LOVABLE" | "CODEX" | "CURSOR" | "GENERIC";
  preambleStyle: "BUILD_PACKAGE" | "PATCH" | "REFACTOR" | "TASK_LIST";
}

export const CODE_PROMPT_MODES: CodePromptMode[] = [
  { id: "LOVABLE_BUILD_PROMPT", name: "Lovable 完整施工包", toolPreference: "LOVABLE",
    description: "面向 Lovable 的完整模块施工包提示词。", preambleStyle: "BUILD_PACKAGE" },
  { id: "LOVABLE_PATCH_PROMPT", name: "Lovable 小补丁", toolPreference: "LOVABLE",
    description: "面向 Lovable 的小补丁式提示词。", preambleStyle: "PATCH" },
  { id: "CODEX_IMPLEMENTATION_PROMPT", name: "Codex 代码实现", toolPreference: "CODEX",
    description: "面向 Codex 的具体代码修改任务。", preambleStyle: "TASK_LIST" },
  { id: "CURSOR_REFACTOR_PROMPT", name: "Cursor 重构", toolPreference: "CURSOR",
    description: "面向 Cursor 的重构提示词。", preambleStyle: "REFACTOR" },
  { id: "QA_FIX_PROMPT", name: "QA 修复", toolPreference: "GENERIC",
    description: "根据 QA issue 生成修复提示词。", preambleStyle: "PATCH" },
  { id: "DOCS_SYNC_PROMPT", name: "文档/百科同步", toolPreference: "GENERIC",
    description: "同步产品文档与百科条目。", preambleStyle: "PATCH" },
  { id: "BULK_COMPLETION_PROMPT", name: "批量补全施工包", toolPreference: "LOVABLE",
    description: "一次性补一面墙的批量补全提示词。", preambleStyle: "BUILD_PACKAGE" },
  { id: "SAFE_REFACTOR_PROMPT", name: "安全重构", toolPreference: "GENERIC",
    description: "强 do-not-break 约束的重构提示词。", preambleStyle: "REFACTOR" },
  { id: "MODULE_SCAFFOLD_PROMPT", name: "模块脚手架", toolPreference: "LOVABLE",
    description: "新模块脚手架提示词。", preambleStyle: "BUILD_PACKAGE" },
  { id: "TEST_GENERATION_PROMPT", name: "测试生成", toolPreference: "GENERIC",
    description: "生成测试或检查清单。", preambleStyle: "TASK_LIST" },
];

export function pickPromptMode(targetTool: string, scope: string): string {
  if (targetTool === "CODEX") return "CODEX_IMPLEMENTATION_PROMPT";
  if (targetTool === "CURSOR") return "CURSOR_REFACTOR_PROMPT";
  if (scope === "BULK") return "BULK_COMPLETION_PROMPT";
  if (scope === "REFACTOR") return "SAFE_REFACTOR_PROMPT";
  if (scope === "PATCH") return "LOVABLE_PATCH_PROMPT";
  return "LOVABLE_BUILD_PROMPT";
}
