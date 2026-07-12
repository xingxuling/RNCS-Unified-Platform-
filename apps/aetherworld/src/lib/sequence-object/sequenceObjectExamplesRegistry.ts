// sequenceObjectExamplesRegistry.ts
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import type { SequenceObjectLayer } from "@/constants/sequence-object/sequenceObjectLayers";

export interface SequenceObjectExample {
  exampleId: string;
  title: string;
  description: string;
  sourceSequence: string[];
  targetObjectType: SequenceObjectType;
  targetLayer: SequenceObjectLayer;
  reusedIn: string[];
}

export const SEQUENCE_OBJECT_EXAMPLES: SequenceObjectExample[] = [
  { exampleId: "ex01", title: "母体数列 → 角色对象", description: "Full60 切片生成角色对象，可送入声乐与剧情。", sourceSequence: ["1","2","3","5","6","8"], targetObjectType: "CHARACTER_OBJECT", targetLayer: "ASSET_LAYER", reusedIn: ["VOCAL","NARRATIVE","PROMPT_FORGE"] },
  { exampleId: "ex02", title: "母体数列 → 世界对象", description: "高阶数字主导，生成可接入多世界网络的世界对象。", sourceSequence: ["6","9","2","4","8","9"], targetObjectType: "WORLD_OBJECT", targetLayer: "ASSET_LAYER", reusedIn: ["WORLD_ENGINE","MULTI_WORLD","NARRATIVE"] },
  { exampleId: "ex03", title: "母体数列 → 声乐对象", description: "5/3/6 主导，生成 SONG_OBJECT。", sourceSequence: ["5","3","5","6","3","5"], targetObjectType: "SONG_OBJECT", targetLayer: "ASSET_LAYER", reusedIn: ["VOCAL","TRANSLATION","PROMPT_FORGE"] },
  { exampleId: "ex04", title: "母体数列 → 剧情对象", description: "3/5 主导，生成 STORY_OBJECT。", sourceSequence: ["3","3","5","2","6","3"], targetObjectType: "STORY_OBJECT", targetLayer: "CONTENT_LAYER", reusedIn: ["NARRATIVE","VOCAL","WORLD_ENGINE"] },
  { exampleId: "ex05", title: "母体数列 → 模型对象", description: "8/2 主导，生成 MODEL_OBJECT。", sourceSequence: ["8","2","8","4","2","8"], targetObjectType: "MODEL_OBJECT", targetLayer: "STRUCTURE_LAYER", reusedIn: ["CODE_GEN","QA","PRODUCT_ENCYCLOPEDIA"] },
  { exampleId: "ex06", title: "母体数列 → 系统对象", description: "4/7 主导，生成 RUNTIME_OBJECT。", sourceSequence: ["4","7","4","2","7","4"], targetObjectType: "RUNTIME_OBJECT", targetLayer: "RUNTIME_LAYER", reusedIn: ["RUNTIME_SPINE","QA"] },
  { exampleId: "ex07", title: "母体数列 → 引擎对象", description: "4 主导带 8，生成 ENGINE_OBJECT。", sourceSequence: ["4","8","4","4","2","8"], targetObjectType: "ENGINE_OBJECT", targetLayer: "RUNTIME_LAYER", reusedIn: ["RUNTIME_SPINE","QA","LEARNING_DOCS","PRODUCT_ENCYCLOPEDIA"] },
  { exampleId: "ex08", title: "母体数列 → 工作流对象", description: "2/4 桥接生成 WORKFLOW_OBJECT。", sourceSequence: ["2","4","2","5","4","2"], targetObjectType: "WORKFLOW_OBJECT", targetLayer: "RUNTIME_LAYER", reusedIn: ["RUNTIME_SPINE","CROSS_FUNCTIONAL"] },
  { exampleId: "ex09", title: "母体数列 → 语言对象", description: "3/4/2 生成 LANGUAGE_OBJECT。", sourceSequence: ["3","4","2","3","4","2"], targetObjectType: "LANGUAGE_OBJECT", targetLayer: "CIVILIZATION_LAYER", reusedIn: ["MSL","VOCABULARY","CALCULUS_UNIVERSE"] },
  { exampleId: "ex10", title: "母体数列 → 文明协议对象", description: "9 高阶主导，生成 CIVILIZATION_PROTOCOL_OBJECT。", sourceSequence: ["9","4","9","2","4","9"], targetObjectType: "CIVILIZATION_PROTOCOL_OBJECT", targetLayer: "CIVILIZATION_LAYER", reusedIn: ["SYSTEM_CONSTITUTION","CLM","MULTI_WORLD"] },
  { exampleId: "ex11", title: "角色对象 → 声乐引擎", description: "复用角色对象生成 SONG_OBJECT 草案。", sourceSequence: ["1","2","5","3"], targetObjectType: "SONG_OBJECT", targetLayer: "ASSET_LAYER", reusedIn: ["VOCAL"] },
  { exampleId: "ex12", title: "世界对象 → 剧情文本引擎", description: "复用世界对象生成 STORY_OBJECT。", sourceSequence: ["6","3","2","5"], targetObjectType: "STORY_OBJECT", targetLayer: "CONTENT_LAYER", reusedIn: ["NARRATIVE"] },
  { exampleId: "ex13", title: "模型对象 → 代码生成", description: "MODEL_OBJECT 通过 QA 后送入 Code Generation。", sourceSequence: ["8","2","4"], targetObjectType: "PRODUCT_OBJECT", targetLayer: "ASSET_LAYER", reusedIn: ["CODE_GEN","PRODUCT_ENCYCLOPEDIA"] },
  { exampleId: "ex14", title: "引擎对象 → QA + 文档", description: "ENGINE_OBJECT 通过 QA 并生成 Learning Doc。", sourceSequence: ["4","8","4","9"], targetObjectType: "ENGINE_OBJECT", targetLayer: "RUNTIME_LAYER", reusedIn: ["QA","LEARNING_DOCS","VERSION_LEAP"] },
  { exampleId: "ex15", title: "文明对象 → CLM + Constitution 审查", description: "CIVILIZATION_PROTOCOL_OBJECT 进入 CLM 与系统宪法审查。", sourceSequence: ["9","4","2","9"], targetObjectType: "CIVILIZATION_PROTOCOL_OBJECT", targetLayer: "CIVILIZATION_LAYER", reusedIn: ["CLM","SYSTEM_CONSTITUTION","GOVERNANCE"] },
];

export function listSequenceObjectExamples() {
  return [...SEQUENCE_OBJECT_EXAMPLES];
}
