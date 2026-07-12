// sequenceObjectStructureCompiler.ts
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";

export interface SequenceObjectNode { nodeId: string; nodeType: string; label: string; value?: string; }
export interface SequenceObjectEdge { edgeId: string; fromNodeId: string; toNodeId: string; relationType: string; }
export interface SequenceObjectStructure {
  objectId: string;
  structureType: string;
  nodes: SequenceObjectNode[];
  edges: SequenceObjectEdge[];
  requiredFields: string[];
  optionalFields: string[];
  constraints: string[];
  failureModes: string[];
}

const TEMPLATES: Partial<Record<SequenceObjectType, { required: string[]; optional: string[]; constraints: string[]; failures: string[] }>> = {
  CHARACTER_OBJECT: {
    required: ["identity","desire","conflict","relationship","voice","visualSymbol","narrativeUse","songUse","worldUse"],
    optional: ["backstory","arc"],
    constraints: ["不可跨域人设漂移","声乐使用须保留 voice 字段"],
    failures: ["人设丢失","身份漂移"],
  },
  WORLD_OBJECT: {
    required: ["worldName","laws","civilizationStage","conflictStructure","aesthetics","characters","timeline","musicTone","exportUse"],
    optional: ["map","cosmology"],
    constraints: ["正典隔离","不可现实化"],
    failures: ["正典污染","世界规则冲突"],
  },
  SONG_OBJECT: {
    required: ["title","theme","languageMode","emotionalCore","vocalStyle","musicStyle","rhythm"],
    optional: ["lyricsDraft","promptForSuno","promptForUdio"],
    constraints: ["不得伪装成已发行作品"],
    failures: ["风格漂移","情感与主题不一致"],
  },
  STORY_OBJECT: {
    required: ["title","worldContext","characters","conflict","emotionalTone","narrativeStructure","currentStage"],
    optional: ["beats","themes"],
    constraints: ["与世界正典一致"],
    failures: ["叙事断裂"],
  },
  MODEL_OBJECT: {
    required: ["variables","relations","weights","inputs","outputs","assumptions","validationMethod","failureModes"],
    optional: ["notes"],
    constraints: ["未验证不可标记 VERIFIED","必须列出失败模式"],
    failures: ["过拟合","假设失效"],
  },
  ENGINE_OBJECT: {
    required: ["inputSchema","processor","outputSchema","constraints","safetyRules","qaRules","recalculationTriggers","examples"],
    optional: ["versionPolicy"],
    constraints: ["无 QA 不得 READY","必须有失败条件"],
    failures: ["处理器异常","输出污染"],
  },
  WORKFLOW_OBJECT: {
    required: ["steps","inputs","outputs","permissions","rollback"],
    optional: ["timeoutPolicy"],
    constraints: ["每步可回滚或可审计"],
    failures: ["步骤失败","状态丢失"],
  },
  RUNTIME_OBJECT: {
    required: ["state","transitions","permissions","audit","timeout","rollback"],
    optional: ["scheduler"],
    constraints: ["最小影响、最短时间、最低不可逆性"],
    failures: ["超时","状态机锁死"],
  },
  LANGUAGE_OBJECT: {
    required: ["symbols","syntax","semantics","runtimeRules","forbiddenRules","examples","versioning","governance"],
    optional: ["dialects"],
    constraints: ["禁止规则不可绕过","Versioning 必须存在"],
    failures: ["歧义","禁止规则失效"],
  },
  CONSTITUTION_OBJECT: {
    required: ["articles","amendments","authority","scope","governance","forbiddenCalls"],
    optional: ["history"],
    constraints: ["仅系统宪法，不是现实法律"],
    failures: ["条款冲突"],
  },
  GOVERNANCE_OBJECT: {
    required: ["scope","roles","decisions","audit","archiveRules"],
    optional: [],
    constraints: ["治理范围明确"],
    failures: ["治理失效"],
  },
  MULTIWORLD_OBJECT: {
    required: ["worlds","portals","relations","canonRules","federation"],
    optional: ["events"],
    constraints: ["正典隔离","Demo / Real 隔离"],
    failures: ["正典冲突"],
  },
};

function gen(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 8)}`; }

export function compileObjectStructure(objectId: string, type: SequenceObjectType): SequenceObjectStructure {
  const tpl = TEMPLATES[type] ?? {
    required: ["title","summary"], optional: ["notes"], constraints: [], failures: [],
  };
  const nodes: SequenceObjectNode[] = tpl.required.map((f) => ({ nodeId: gen("n"), nodeType: "field", label: f }));
  const edges: SequenceObjectEdge[] = [];
  for (let i = 1; i < nodes.length; i++) {
    edges.push({ edgeId: gen("e"), fromNodeId: nodes[0].nodeId, toNodeId: nodes[i].nodeId, relationType: "owns" });
  }
  return {
    objectId,
    structureType: type,
    nodes,
    edges,
    requiredFields: tpl.required,
    optionalFields: tpl.optional,
    constraints: tpl.constraints,
    failureModes: tpl.failures,
  };
}

export function listStructureTemplates() {
  return Object.entries(TEMPLATES).map(([k, v]) => ({ type: k, ...v }));
}
