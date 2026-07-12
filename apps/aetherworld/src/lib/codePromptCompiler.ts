// 代码提示词编译器
import type { CodeGenerationInput } from "./codeGenerationCalculus";
import type { PlannedFile } from "./codeTaskPlanner";
import { CODE_PROMPT_MODES } from "@/constants/codePromptModes";

export interface CompileCodePromptInput {
  input: CodeGenerationInput;
  promptModeId: string;
  plan: PlannedFile[];
  acceptance: string[];
  doNotBreak: string[];
  dependencyWarnings: string[];
}

export function compileCodePrompt(c: CompileCodePromptInput): string {
  const mode = CODE_PROMPT_MODES.find(m => m.id === c.promptModeId);
  const { input } = c;
  const header = c.promptModeId.startsWith("LOVABLE")
    ? "请在当前 Aether Fate Engine / 以太命运引擎项目基础上"
    : "请在指定代码库中";

  const newFiles = c.plan.filter(p => p.intent === "create");
  const editFiles = c.plan.filter(p => p.intent === "edit");

  return `${header}，完成以下任务：

【目标功能】
${input.targetFeature}

【任务类型】
${input.taskType} · 范围模式 ${input.scopeMode} · 目标工具 ${input.targetTool}
提示词模式：${mode?.name ?? c.promptModeId}

【新增文件】
${newFiles.length ? newFiles.map(f => `- ${f.path}  // ${f.reason}`).join("\n") : "（无）"}

【需要修改的文件】
${editFiles.length ? editFiles.map(f => `- ${f.path}  // ${f.reason}`).join("\n") : "（无）"}

【需要接入的现有模块】
${input.affectedModules.length ? input.affectedModules.map(m => `- ${m}`).join("\n") : "（无）"}

【不要破坏的模块（do-not-break）】
${c.doNotBreak.map(m => `- ${m}`).join("\n")}

【依赖警告】
${c.dependencyWarnings.length ? c.dependencyWarnings.map(w => `- ${w}`).join("\n") : "（无）"}

【数据结构与 UI 要求】
- 类型签名清晰，导出供其他模块使用。
- UI 使用 src/styles.css 的设计 tokens，禁止使用裸色值。
- 界面文案默认中文。
- 包含加载态 / 空状态 / 错误状态。

【安全边界（必须保留）】
- 不绝对预测未来；不承诺准确率。
- 不删除现有主体/回验数据。
- 不破坏 Demo / Real 隔离。
- Founder-only 模块不可对普通用户开放。
- Safety Boundary 文案不可移除。

【验收标准】
${c.acceptance.map(a => `- ${a}`).join("\n")}

【输出要求】
- 直接修改代码，不要只生成报告。
- 不要重写整个项目。
- 不要删除现有功能。
- 完成后给出简短的变更总结。
`;
}
