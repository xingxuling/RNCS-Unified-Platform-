import type { ModelFieldType, FieldSource } from "@/constants/model-generation/modelFieldTypes";
import { getModelType } from "@/constants/model-generation/modelTypes";
import { getTemplate } from "@/constants/model-generation/modelTemplates";
import { buildFields } from "@/lib/model-generation/modelFieldGenerator";
import { generateWeights, type ModelWeight } from "@/lib/model-generation/modelWeightEngine";
import { planValidation, type ModelValidationPlan } from "@/lib/model-generation/modelValidationPlanner";

export interface GeneratedModelField {
  fieldName: string;
  fieldType: ModelFieldType;
  required: boolean;
  description: string;
  defaultValue?: unknown;
  allowedValues?: string[];
  source?: FieldSource;
}

export interface GeneratedModelSchema {
  modelId: string;
  modelName: string;
  modelType: string;
  description: string;
  fields: GeneratedModelField[];
  weights: ModelWeight[];
  validationPlan: ModelValidationPlan;
  safetyRules: string[];
  exportTargets: string[];
  createdAt: string;
  version: string;
}

export interface SchemaInput {
  modelType: string;
  objectName: string;
  objectDescription: string;
  targetUse: string;
  subjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
  userLevel: "PLAIN_USER" | "STRUCTURED_USER" | "FOUNDER_TECHNICAL";
}

export function buildSchema(input: SchemaInput): GeneratedModelSchema {
  const def = getModelType(input.modelType);
  const template = getTemplate(input.modelType);
  const fields = buildFields(input, def, template);
  const weights = generateWeights(input.modelType, def);
  const validationPlan = planValidation(input, def);
  const safetyRules = [
    ...(def?.safetyNotes ?? []),
    "结构化模型，需要现实回验",
    ...(input.subjectMode === "FULL_60" ? ["Full 60 模式：含较多个人数列字段，注意隐私"] : []),
  ];
  return {
    modelId: `model-${Date.now().toString(36)}`,
    modelName: input.objectName || def?.userFriendlyName || "Untitled Model",
    modelType: input.modelType,
    description: input.objectDescription || def?.purpose || "",
    fields,
    weights,
    validationPlan,
    safetyRules,
    exportTargets: def?.exportTargets ?? ["JSON", "MARKDOWN"],
    createdAt: new Date().toISOString(),
    version: "0.1.0",
  };
}
