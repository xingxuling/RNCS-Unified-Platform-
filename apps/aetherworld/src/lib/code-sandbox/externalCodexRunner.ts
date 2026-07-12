import type { CodeRunTargetFile, CodeErrorSummary, CodexRepairPack, CursorRepairPack } from "./codeRunRequestEngine";

export function generateCodexRepairPack(opts: {
  projectName: string;
  projectSummary: string;
  files: CodeRunTargetFile[];
  errorSummary?: CodeErrorSummary;
  requestedFixes?: string[];
}): CodexRepairPack {
  const fixes = opts.requestedFixes && opts.requestedFixes.length > 0
    ? opts.requestedFixes
    : (opts.errorSummary?.suspectedCauses || ["请按错误摘要修复"]);
  const constraints = [
    "不删除现有功能",
    "必须先 dry-run",
    "不引入大型依赖，除非必要",
    "不读取用户秘密 (.ssh / .env / cookies)",
    "不执行危险命令 (rm -rf / curl|bash / 等)",
    "保持现有业务逻辑",
  ];
  const acceptance = [
    "输出修复计划",
    "输出 changed files 列表",
    "输出测试命令",
    "输出风险评估",
    "输出 next steps",
  ];
  const contract = ["summary", "changedFiles", "testPlan", "risks", "nextSteps"];
  const prompt = [
    `# Codex Repair Pack — ${opts.projectName}`,
    ``,
    `## 项目摘要`,
    opts.projectSummary,
    ``,
    `## 错误摘要`,
    opts.errorSummary
      ? `- [${opts.errorSummary.severity}] ${opts.errorSummary.title}\n${opts.errorSummary.explanation}`
      : "（未检出错误）",
    ``,
    `## 修复要求`,
    ...fixes.map((f) => `- ${f}`),
    ``,
    `## 约束`,
    ...constraints.map((c) => `- ${c}`),
    ``,
    `## 接受标准`,
    ...acceptance.map((a) => `- ${a}`),
    ``,
    `## 输出契约`,
    contract.map((c) => `- ${c}`).join("\n"),
    ``,
    `## 待修复文件（${opts.files.length}）`,
    opts.files.map((f) => `- ${f.path} (${f.language})`).join("\n"),
  ].join("\n");
  return {
    packId: `codex-${Date.now().toString(36)}`,
    title: `Codex 修复包 · ${opts.projectName}`,
    projectSummary: opts.projectSummary,
    filesIncluded: opts.files,
    errorSummary: opts.errorSummary,
    requestedFixes: fixes,
    constraints,
    acceptanceCriteria: acceptance,
    outputContract: contract,
    prompt,
  };
}

export function generateCursorRepairPack(opts: {
  projectName: string;
  files: CodeRunTargetFile[];
  errorSummary?: CodeErrorSummary;
}): CursorRepairPack {
  return {
    packId: `cursor-${Date.now().toString(36)}`,
    title: `Cursor 修复包 · ${opts.projectName}`,
    fileContexts: opts.files.map((f) => ({
      path: f.path,
      purpose: f.role,
      snippet: f.content.slice(0, 400),
    })),
    repairNotes: [
      opts.errorSummary ? `重点修复：${opts.errorSummary.title}` : "按 QA 报告修复",
      "保持现有业务逻辑",
      "不引入新框架",
    ],
    testSuggestions: ["运行 npm run typecheck", "运行 npm test", "在浏览器手动验证主流程"],
    safetyNotes: ["不修改 .env / .ssh", "不执行 rm -rf 等命令"],
  };
}
