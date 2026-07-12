// 模板编译器 · Prompt Template Compiler
import type { PromptTemplateFamily } from "@/constants/promptTemplateFamilies";

export interface TemplateVariables {
  [key: string]: string | undefined;
}

export function compileTemplate(template: PromptTemplateFamily, vars: TemplateVariables): string {
  return template.defaultPromptSkeleton.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v !== undefined && v !== "" ? v : `（未填写 ${key}）`;
  });
}

export function listMissingVars(template: PromptTemplateFamily, vars: TemplateVariables): string[] {
  return template.requiredInputs.filter((k) => !vars[k] || vars[k]?.trim() === "");
}
