// sequenceObjectVariableExtractor.ts
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";

export interface SequenceObjectVariable {
  variableId: string;
  name: string;
  variableType: string;
  value: string | number | boolean | object;
  source: string;
  transferable: boolean;
  requiredForRuntime: boolean;
  notes: string[];
}

const REQUIRED_BY_TYPE: Partial<Record<SequenceObjectType, string[]>> = {
  CHARACTER_OBJECT: ["identity","desire","conflict","voice"],
  WORLD_OBJECT: ["worldName","laws","civilizationStage","aesthetics"],
  SONG_OBJECT: ["title","theme","vocalStyle","musicStyle"],
  STORY_OBJECT: ["title","conflict","emotionalTone"],
  MODEL_OBJECT: ["variables","inputs","outputs","assumptions","validationMethod"],
  ENGINE_OBJECT: ["inputSchema","processor","outputSchema","qaRules"],
  WORKFLOW_OBJECT: ["steps","inputs","outputs"],
  LANGUAGE_OBJECT: ["symbols","syntax","semantics","forbiddenRules"],
  CONSTITUTION_OBJECT: ["articles","authority","scope"],
};

function gen() { return `var_${Math.random().toString(36).slice(2, 8)}`; }

export function extractVariables(type: SequenceObjectType, sourceText: string): SequenceObjectVariable[] {
  const required = REQUIRED_BY_TYPE[type] ?? ["title", "summary"];
  return required.map((name) => ({
    variableId: gen(),
    name,
    variableType: "string",
    value: extractField(sourceText, name) ?? `<${name}:auto>`,
    source: "auto-extract",
    transferable: !name.startsWith("__"),
    requiredForRuntime: ["inputSchema","outputSchema","processor","authority","scope","articles"].includes(name),
    notes: [],
  }));
}

function extractField(text: string, name: string): string | null {
  const re = new RegExp(`${name}[:：]\\s*([^\\n,，；;]+)`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : null;
}
