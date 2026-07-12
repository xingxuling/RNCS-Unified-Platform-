import type { GeneratedModelSchema } from "@/lib/model-generation/modelSchemaBuilder";

export function generateLovablePrompt(schema: GeneratedModelSchema): string {
  return `请在当前项目基础上，根据以下模型生成实现：\n\n模型名：${schema.modelName}\n类型：${schema.modelType}\n字段：\n${schema.fields.map(f => `- ${f.fieldName}: ${f.fieldType}${f.required ? " (必填)" : ""}`).join("\n")}\n\n验收：\n${schema.validationPlan.successCriteria.map(s => `- ${s}`).join("\n")}\n\n安全：\n${schema.safetyRules.map(s => `- ${s}`).join("\n")}\n`;
}

export function generateCodexPrompt(schema: GeneratedModelSchema): string {
  return `根据以下结构模型生成 TypeScript 实现、Zod Schema 与单元测试骨架：\n\n${JSON.stringify(schema, null, 2)}`;
}

export function generateGenericPrompt(schema: GeneratedModelSchema, goal: string): string {
  return `目标：${goal}\n\n基于模型 ${schema.modelName} (${schema.modelType}) 完成上述目标。\n`;
}
