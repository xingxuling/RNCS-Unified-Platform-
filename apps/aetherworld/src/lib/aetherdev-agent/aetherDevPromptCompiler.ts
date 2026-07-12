// AetherDev · 提示词编译器：一次性产出 codex / cursor / vscode 三套指令。
import type { DevTask } from "./aetherDevTypes";

interface CompileInput {
  title: string;
  issueType: DevTask["issueType"];
  reason: string;
  expectedChange: string;
  targetFiles: string[];
  acceptanceTests: string[];
}

export interface CompiledPrompts {
  codexPrompt: string;
  cursorPrompt: string;
  vscodeSteps: string[];
}

export function compileDevPrompts(input: CompileInput): CompiledPrompts {
  const filesBlock = input.targetFiles.length
    ? input.targetFiles.map((f) => `- ${f}`).join("\n")
    : "- （未确定具体文件，由执行者根据原因定位）";
  const acceptBlock = input.acceptanceTests.length
    ? input.acceptanceTests.map((t, i) => `${i + 1}. ${t}`).join("\n")
    : "1. tsc --noEmit 通过\n2. 相关页面可正常渲染";

  const codexPrompt = [
    `任务：${input.title}`,
    `类型：${input.issueType}`,
    `原因：${input.reason}`,
    `期望改动：${input.expectedChange}`,
    `目标文件：\n${filesBlock}`,
    `验收标准：\n${acceptBlock}`,
    `约束：仅修改上述文件；保持中文 UI；不引入新依赖；保持 tsc --noEmit 通过。`,
  ].join("\n\n");

  const cursorPrompt = [
    `# Cursor 修改指令`,
    `目标：${input.title}`,
    ``,
    `## 上下文`,
    `${input.reason}`,
    ``,
    `## 需要修改`,
    filesBlock,
    ``,
    `## 期望变更`,
    input.expectedChange,
    ``,
    `## 验收`,
    acceptBlock,
    ``,
    `## 约束`,
    `- 中文文案；不引入新依赖；不动其他文件；保持现有命名约定。`,
  ].join("\n");

  const vscodeSteps: string[] = [
    `打开 VSCode 工作区根目录`,
    ...input.targetFiles.map((f) => `打开文件：${f}`),
    `根据「${input.expectedChange}」定位需要修改的代码段`,
    `保存后运行：npx tsc --noEmit`,
    `如有失败，按报错信息回到对应文件修正`,
    `验收对照：${input.acceptanceTests.join(" / ") || "tsc --noEmit 通过"}`,
  ];

  return { codexPrompt, cursorPrompt, vscodeSteps };
}
