import { resolveModelType, type ModelTypeResolution } from "@/lib/model-generation/modelTypeResolver";
import { buildSchema, type GeneratedModelSchema } from "@/lib/model-generation/modelSchemaBuilder";
import { checkModelSafety, type ModelSafetyReport } from "@/lib/model-generation/modelSafetyGuard";

export interface ModelGenerationInput {
  objectName: string;
  objectDescription: string;
  targetUse: string;
  preferredModelType?: string;
  userLevel: "PLAIN_USER" | "STRUCTURED_USER" | "FOUNDER_TECHNICAL";
  subjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
  exportTarget?: string;
  context?: string;
}

export interface ModelGenerationResult {
  resolution: ModelTypeResolution;
  schema: GeneratedModelSchema;
  safety: ModelSafetyReport;
}

export function generateModel(input: ModelGenerationInput): ModelGenerationResult {
  const resolution = resolveModelType(input);
  const schema = buildSchema({
    modelType: resolution.recommendedModelType,
    objectName: input.objectName,
    objectDescription: input.objectDescription,
    targetUse: input.targetUse,
    subjectMode: input.subjectMode,
    userLevel: input.userLevel,
  });
  const safety = checkModelSafety(schema, {
    subjectMode: input.subjectMode,
    userLevel: input.userLevel,
  });
  return { resolution, schema, safety };
}
