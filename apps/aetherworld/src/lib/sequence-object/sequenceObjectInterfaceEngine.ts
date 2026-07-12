// sequenceObjectInterfaceEngine.ts
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import type { SequenceObjectInterfaceType } from "@/constants/sequence-object/sequenceObjectInterfaceTypes";

export interface SequenceObjectInterface {
  interfaceId: string;
  objectId: string;
  targetEngine: SequenceObjectInterfaceType;
  allowed: boolean;
  inputAdapter: string;
  outputAdapter: string;
  transferableVariables: string[];
  blockedVariables: string[];
  safetyNotes: string[];
}

const TYPE_INTERFACES: Partial<Record<SequenceObjectType, SequenceObjectInterfaceType[]>> = {
  CHARACTER_OBJECT: ["NARRATIVE","VOCAL","MODEL_GEN","TRANSLATION","PROMPT_FORGE","WORLD_KNOWLEDGE","WORKSPACE","CROSS_FUNCTIONAL"],
  WORLD_OBJECT: ["WORLD_ENGINE","NARRATIVE","VOCAL","MULTI_WORLD","VISUAL_PROMPT","WORLD_KNOWLEDGE","WORKSPACE","CROSS_FUNCTIONAL"],
  SONG_OBJECT: ["TRANSLATION","VOCAL","PROMPT_FORGE","NARRATIVE","WORKSPACE"],
  STORY_OBJECT: ["VOCAL","WORLD_ENGINE","PROMPT_FORGE","TRANSLATION","WORKSPACE"],
  MODEL_OBJECT: ["CODE_GEN","PRODUCT_ENCYCLOPEDIA","DECISION_ENGINE","QA","WORKSPACE"],
  ENGINE_OBJECT: ["RUNTIME_SPINE","QA","VERSION_LEAP","LEARNING_DOCS","PRODUCT_ENCYCLOPEDIA","WORKSPACE"],
  WORKFLOW_OBJECT: ["RUNTIME_SPINE","QA","VERSION_LEAP","CROSS_FUNCTIONAL","WORKSPACE"],
  LANGUAGE_OBJECT: ["MSL","VOCABULARY","CALCULUS_UNIVERSE","SYSTEM_CONSTITUTION","LEARNING_DOCS"],
  CONSTITUTION_OBJECT: ["SYSTEM_CONSTITUTION","GOVERNANCE","CLM","ARCHIVE"],
  CIVILIZATION_PROTOCOL_OBJECT: ["SYSTEM_CONSTITUTION","CLM","WORLD_ENGINE","MULTI_WORLD","GOVERNANCE","ARCHIVE"],
  MULTIWORLD_OBJECT: ["MULTI_WORLD","WORLD_ENGINE","WORLD_KNOWLEDGE","GOVERNANCE","ARCHIVE"],
  GOVERNANCE_OBJECT: ["GOVERNANCE","SYSTEM_CONSTITUTION","CLM","ARCHIVE"],
  CLM_ENTITY_OBJECT: ["CLM","GOVERNANCE","ARCHIVE","WORKSPACE"],
  PRODUCT_OBJECT: ["PRODUCT_ENCYCLOPEDIA","LEARNING_DOCS","CODE_GEN","QA","WORKSPACE"],
  KNOWLEDGE_ENTRY_OBJECT: ["WORLD_KNOWLEDGE","VOCABULARY","LEARNING_DOCS","WORKSPACE"],
  VOCABULARY_TERM_OBJECT: ["VOCABULARY","LEARNING_DOCS","TRANSLATION","WORKSPACE"],
  CALCULUS_ENTRY_OBJECT: ["CALCULUS_UNIVERSE","LEARNING_DOCS","WORKSPACE"],
};

const DEFAULT_INTERFACES: SequenceObjectInterfaceType[] = ["WORKSPACE","CROSS_FUNCTIONAL"];

export function listInterfacesForType(type: SequenceObjectType, objectId: string): SequenceObjectInterface[] {
  const targets = TYPE_INTERFACES[type] ?? DEFAULT_INTERFACES;
  return targets.map((t) => ({
    interfaceId: `iface_${objectId}_${t}`,
    objectId,
    targetEngine: t,
    allowed: true,
    inputAdapter: `to-${t.toLowerCase()}-input`,
    outputAdapter: `from-${t.toLowerCase()}-output`,
    transferableVariables: ["title","summary","tags","coreVariables"],
    blockedVariables: ["__internal","__founderOnly"],
    safetyNotes: ["接口仅在权限允许时启用。", "变量迁移须经过 Cross-Functional 桥。"],
  }));
}
