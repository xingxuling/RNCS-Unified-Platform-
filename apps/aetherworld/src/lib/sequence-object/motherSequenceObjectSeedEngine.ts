// motherSequenceObjectSeedEngine.ts
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import type { SequenceObjectLayer } from "@/constants/sequence-object/sequenceObjectLayers";

export interface SequenceObjectSeed {
  seedId: string;
  sourceSequence: string[];
  seedPattern: string;
  dominantDigits: string[];
  transitionPoints: string[];
  objectPotentialTypes: SequenceObjectType[];
  suggestedObjectLayer: SequenceObjectLayer;
  generationBias: string[];
  safetyNotes: string[];
  patternFlags: {
    phasePattern: string;
    repetitionPattern: string;
    transitionPattern: string;
    zeroPattern: string;
    highValuePattern: string;
    symmetryPattern: string;
    instabilityPattern: string;
    exportPotential: "LOW" | "MEDIUM" | "HIGH";
    runtimePotential: "LOW" | "MEDIUM" | "HIGH";
  };
}

const DIGIT_MEANING: Record<string, string> = {
  "0": "archive/seal/null/reset", "1": "origin/identity/seed", "2": "relation/bridge/dual",
  "3": "narrative/expression/text", "4": "rule/structure/permission", "5": "change/vocal/emotion/flow",
  "6": "life/recovery/continuity", "7": "hidden/dream/inner", "8": "resource/asset/product",
  "9": "civilization/completion/high-order",
};

function dominant(seq: string[]): string[] {
  const counts: Record<string, number> = {};
  seq.forEach((d) => { counts[d] = (counts[d] ?? 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 3).map(([d]) => d);
}

function suggestLayer(dom: string[]): SequenceObjectLayer {
  if (dom.includes("9")) return "CIVILIZATION_LAYER";
  if (dom.includes("4") || dom.includes("7")) return "RUNTIME_LAYER";
  if (dom.includes("2") || dom.includes("8")) return "STRUCTURE_LAYER";
  if (dom.includes("1") || dom.includes("6")) return "ASSET_LAYER";
  return "CONTENT_LAYER";
}

function suggestTypes(dom: string[]): SequenceObjectType[] {
  const out: SequenceObjectType[] = [];
  if (dom.includes("3")) out.push("STORY_OBJECT","LYRIC_OBJECT");
  if (dom.includes("5")) out.push("SONG_OBJECT","NARRATIVE_SCENE_OBJECT");
  if (dom.includes("1")) out.push("CHARACTER_OBJECT");
  if (dom.includes("6")) out.push("WORLD_OBJECT");
  if (dom.includes("8")) out.push("PRODUCT_OBJECT","MODEL_OBJECT");
  if (dom.includes("4")) out.push("ENGINE_OBJECT","PROTOCOL_OBJECT","QA_RULE_OBJECT");
  if (dom.includes("2")) out.push("VARIABLE_MAP_OBJECT","KNOWLEDGE_GRAPH_OBJECT");
  if (dom.includes("7")) out.push("RUNTIME_OBJECT","STATE_MACHINE_OBJECT");
  if (dom.includes("9")) out.push("CONSTITUTION_OBJECT","CIVILIZATION_PROTOCOL_OBJECT","MULTIWORLD_OBJECT");
  if (dom.includes("0")) out.push("EXPORT_PACKAGE_OBJECT");
  return out.length ? out : ["TEXT_OBJECT"];
}

export function buildObjectSeed(sequence: string[], subjectMode: "DEMO" | "USER" = "DEMO"): SequenceObjectSeed {
  const dom = dominant(sequence);
  const layer = suggestLayer(dom);
  const types = suggestTypes(dom);
  const has0 = sequence.includes("0");
  const has9 = sequence.includes("9");
  const repeat = sequence.length - new Set(sequence).size;
  const transitions: string[] = [];
  for (let i = 1; i < sequence.length; i++) {
    if (Math.abs(Number(sequence[i]) - Number(sequence[i - 1])) >= 5) transitions.push(`${i - 1}->${i}`);
  }
  return {
    seedId: `seed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sourceSequence: sequence,
    seedPattern: dom.map((d) => DIGIT_MEANING[d] ?? d).join(" / "),
    dominantDigits: dom,
    transitionPoints: transitions,
    objectPotentialTypes: types,
    suggestedObjectLayer: layer,
    generationBias: dom.map((d) => DIGIT_MEANING[d] ?? d),
    safetyNotes: [
      "对象种子只描述潜在结构，不等于现实事实。",
      subjectMode === "DEMO" ? "Demo 种子只能生成 Demo 对象。" : "用户种子默认 USER_PRIVATE。",
    ],
    patternFlags: {
      phasePattern: transitions.length > 2 ? "MULTI_PHASE" : "SINGLE_PHASE",
      repetitionPattern: repeat > 2 ? "HIGH_REPETITION" : "LOW_REPETITION",
      transitionPattern: transitions.length > 0 ? "HAS_TRANSITIONS" : "STABLE",
      zeroPattern: has0 ? "HAS_ARCHIVE_SLOT" : "NO_ARCHIVE",
      highValuePattern: has9 ? "HIGH_ORDER_PRESENT" : "ORDINARY",
      symmetryPattern: sequence.join("") === sequence.slice().reverse().join("") ? "SYMMETRIC" : "ASYMMETRIC",
      instabilityPattern: transitions.length > 3 ? "UNSTABLE" : "STABLE",
      exportPotential: has9 || dom.includes("8") ? "HIGH" : "MEDIUM",
      runtimePotential: layer === "RUNTIME_LAYER" || layer === "CIVILIZATION_LAYER" ? "HIGH" : layer === "STRUCTURE_LAYER" ? "MEDIUM" : "LOW",
    },
  };
}
