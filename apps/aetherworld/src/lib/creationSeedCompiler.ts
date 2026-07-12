import { CREATION_OBJECT_TYPES, getObjectType, type CreationObjectType } from "@/constants/creationObjectTypes";

export interface CreationInput {
  name: string;
  objectType: string;
  description: string;
  targetUser?: string;
  targetEnvironment?: string;
  desiredFunction?: string;
  constraints?: string[];
  inspirationSources?: string[];
  safetyLevel?: "LOW" | "MEDIUM" | "HIGH";
}

export interface CreationSeed {
  signature: string;
  name: string;
  objectType: CreationObjectType;
  seedKeywords: string[];
  seedComplexity: number; // 0-100
}

export function compileCreationSeed(input: CreationInput): CreationSeed {
  const objectType = getObjectType(input.objectType) ?? CREATION_OBJECT_TYPES[0];
  const text = [
    input.name, input.description, input.targetUser, input.targetEnvironment, input.desiredFunction,
    ...(input.constraints ?? []), ...(input.inspirationSources ?? []),
  ].filter(Boolean).join(" ");
  // 粗略关键词：取去重的 2+ 字短词
  const words = Array.from(new Set(text.split(/[\s，。,.;:\/、（）()\[\]【】"'""']+/).filter(w => w.length >= 2)));
  const seedKeywords = words.slice(0, 12);
  const complexity = Math.min(100, Math.round(
    text.length * 0.6 +
    (input.constraints?.length ?? 0) * 5 +
    (input.inspirationSources?.length ?? 0) * 4,
  ));
  let h = 0;
  for (let i = 0; i < text.length; i++) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  const signature = (Math.abs(h).toString(36) + "00000000").slice(0, 8).toUpperCase();
  return { signature, name: input.name || "未命名创造物", objectType, seedKeywords, seedComplexity: complexity };
}

export function createBlankCreationInput(): CreationInput {
  return {
    name: "", objectType: "PRODUCT", description: "",
    targetUser: "", targetEnvironment: "", desiredFunction: "",
    constraints: [], inspirationSources: [], safetyLevel: "MEDIUM",
  };
}
