import type { GeneratedModelField } from "@/lib/model-generation/modelSchemaBuilder";

export interface ModelTemplate {
  modelType: string;
  fields: GeneratedModelField[];
}

export const MODEL_TEMPLATES: Record<string, ModelTemplate> = {
  PRODUCT_MODEL: {
    modelType: "PRODUCT_MODEL",
    fields: [
      { fieldName: "name",             fieldType: "string", required: true,  description: "产品名称",   source: "USER_INPUT" },
      { fieldName: "targetUsers",      fieldType: "array",  required: true,  description: "目标用户群", source: "USER_INPUT" },
      { fieldName: "coreValue",        fieldType: "string", required: true,  description: "核心价值",   source: "USER_INPUT" },
      { fieldName: "trustPath",        fieldType: "string", required: true,  description: "信任路径",   source: "DERIVED"    },
      { fieldName: "monetizationPath", fieldType: "string", required: true,  description: "商业路径",   source: "DERIVED"    },
      { fieldName: "riskFlags",        fieldType: "array",  required: false, description: "风险标签",   source: "DERIVED"    },
      { fieldName: "validationSignals",fieldType: "array",  required: true,  description: "回验信号",   source: "DERIVED"    },
    ],
  },
  NPC_MODEL: {
    modelType: "NPC_MODEL",
    fields: [
      { fieldName: "npcName",       fieldType: "string", required: true, description: "NPC 名称",  source: "USER_INPUT" },
      { fieldName: "traits",        fieldType: "array",  required: true, description: "性格特征",  source: "DERIVED"    },
      { fieldName: "trustLevel",    fieldType: "number", required: true, description: "信任等级 0-1", source: "DERIVED" },
      { fieldName: "conflictLevel", fieldType: "number", required: true, description: "冲突等级 0-1", source: "DERIVED" },
      { fieldName: "questAffinity", fieldType: "number", required: true, description: "任务亲和 0-1", source: "DERIVED" },
      { fieldName: "likelyActions", fieldType: "array",  required: true, description: "可能行动",  source: "DERIVED"    },
    ],
  },
  VOCAL_MODEL: {
    modelType: "VOCAL_MODEL",
    fields: [
      { fieldName: "voiceType",            fieldType: "string", required: true, description: "声线类型",   source: "USER_INPUT" },
      { fieldName: "range",                fieldType: "object", required: true, description: "音域",       source: "DERIVED" },
      { fieldName: "emotionProfile",       fieldType: "object", required: true, description: "情绪曲线",   source: "DERIVED" },
      { fieldName: "languageAdaptation",   fieldType: "array",  required: true, description: "多语言适配", source: "DERIVED" },
      { fieldName: "vocalRisks",           fieldType: "array",  required: false,description: "嗓音风险",   source: "DERIVED" },
    ],
  },
};

export function getTemplate(modelType: string): ModelTemplate | undefined {
  return MODEL_TEMPLATES[modelType];
}
