// 万物本身计算法 · 主编排
import { resolveObjectEssence, type ObjectEssence } from "./objectEssenceResolver";
import { computeObjectBoundary, type ObjectBoundary } from "./objectBoundaryEngine";
import { detectInvariants, type ObjectInvariants } from "./objectInvariantDetector";
import { analyzeDynamicVariables, type ObjectDynamicVariables } from "./objectDynamicVariableEngine";
import { mapRelationField, type RelationField } from "./objectRelationFieldMapper";
import { resolveObjectFunction, type ObjectFunction } from "./objectFunctionResolver";
import { resolveObjectPhase, type ObjectPhaseResult } from "./objectPhaseResolver";
import { computeManifestLatent, type ManifestLatentResult } from "./objectManifestLatentEngine";
import { evaluateSelfConsistency, type SelfConsistencyResult } from "./objectSelfConsistencyEngine";
import { detectMislabeling, type MislabelingResult } from "./objectMislabelingDetector";
import { checkOntologySafety, ONTOLOGY_SAFETY_NOTE, type OntologySafetyFinding } from "./objectOntologySafetyGuard";
import { resolveOntologyType } from "@/constants/objectOntologyTypes";

export interface ThingItselfInput {
  name: string;
  description: string;
  typeId: string;       // ObjectOntologyType id
  phaseHint?: string;
  beginner?: boolean;
}

export interface ThingItselfResult {
  input: ThingItselfInput;
  typeName: string;
  essence: ObjectEssence;
  boundary: ObjectBoundary;
  invariants: ObjectInvariants;
  dynamicVariables: ObjectDynamicVariables;
  relationField: RelationField;
  func: ObjectFunction;
  phase: ObjectPhaseResult;
  manifestLatent: ManifestLatentResult;
  consistency: SelfConsistencyResult;
  mislabeling: MislabelingResult;
  safety: OntologySafetyFinding[];
  safetyNote: string;
  beginnerSummary: {
    whatItIs: string;
    whatItIsNot: string[];
    keyInvariants: string[];
    currentPhase: string;
    biggestMisunderstanding: string;
    nextStep: string;
  };
  nextEngines: string[];
}

export function runThingItself(input: ThingItselfInput): ThingItselfResult {
  const t = resolveOntologyType(input.typeId);
  const essence = resolveObjectEssence(input);
  const boundary = computeObjectBoundary(input);
  const invariants = detectInvariants(input);
  const dynamics = analyzeDynamicVariables(input);
  const relation = mapRelationField(input);
  const func = resolveObjectFunction(input);
  const phase = resolveObjectPhase(input);
  const manifest = computeManifestLatent(input);
  const consistency = evaluateSelfConsistency({ name: input.name, essence, boundary, invariants });
  const mislabel = detectMislabeling(input);

  const allText = [
    essence.essenceStatement, ...essence.notThis,
    ...invariants.primaryInvariants, mislabel.why,
  ].join("\n");
  const safety = checkOntologySafety(allText);

  return {
    input,
    typeName: t.userFriendlyName,
    essence, boundary, invariants,
    dynamicVariables: dynamics,
    relationField: relation,
    func, phase,
    manifestLatent: manifest,
    consistency,
    mislabeling: mislabel,
    safety,
    safetyNote: ONTOLOGY_SAFETY_NOTE,
    beginnerSummary: {
      whatItIs: essence.essenceStatement,
      whatItIsNot: essence.notThis,
      keyInvariants: invariants.primaryInvariants,
      currentPhase: phase.currentPhaseName,
      biggestMisunderstanding: mislabel.isMislabeling ? mislabel.why : (func.mistakenFunction[0] ?? "暂未发现明显误解"),
      nextStep: phase.allowedActions[0] ?? "补充更多对象描述",
    },
    nextEngines: t.bestNextEngines,
  };
}

export function buildOntologyPrompt(r: ThingItselfResult): string {
  return `# 对象本体读取 · ${r.input.name || "未命名"}

类型：${r.typeName}
当前阶段：${r.phase.currentPhaseName}（${r.phase.phaseReason}）

## 本质
${r.essence.essenceStatement}

## 它不是
${r.essence.notThis.map(s => `- ${s}`).join("\n") || "- 暂未指明"}

## 核心不变量
${r.invariants.primaryInvariants.map(s => `- ${s}`).join("\n")}

## 边界
- 允许：${r.boundary.allowedScope.join("；")}
- 禁止：${r.boundary.forbiddenScope.join("；")}
- 边界风险：${r.boundary.boundaryRisk}

## 自洽度
${r.consistency.score}/100 · ${r.consistency.label}

## 安全说明
${r.safetyNote}
`;
}

export const THING_ITSELF_PRESETS: { name: string; description: string; typeId: string }[] = [
  { name: "终极预测操作系统", typeId: "SYSTEM",
    description: "用于结构化预测与行动许可。不是算命，不是宿命论。核心是主体数列、常数宇宙、回验。允许结构化拆解，禁止绝对化预测。" },
  { name: "虚拟生活计算法", typeId: "ALGORITHM",
    description: "把虚拟世界生成系统转化为每日可体验、可行动、可回验的生活入口。不是游戏，不是现实替代品。需要现实锚点。" },
  { name: "万物破解计算法", typeId: "ALGORITHM",
    description: "把任意现实对象拆成可推演、可行动、可回验的结构化破解路径。不替代专业判断。" },
  { name: "小红书帖子", typeId: "CONTENT",
    description: "用于测试用户是否对“行动犹豫”痛点有共鸣。表层是介绍工具，深层是筛选第一批高理解用户。" },
  { name: "一个关系信号", typeId: "RELATIONSHIP",
    description: "对方主动发起的一次对话。需要观察频率、距离与信任变化，不能孤立解读。" },
  { name: "一个新产品想法", typeId: "IDEA",
    description: "刚冒出的产品方向，尚未验证。需要探索与小测，避免对外承诺。" },
  { name: "主体数列", typeId: "SYSTEM",
    description: "用于刻画个人时间-能量-决策结构的核心数列。本地隐私，Demo/Real 隔离。" },
  { name: "一个人的当前状态", typeId: "PERSON",
    description: "结合身体、认知、关系、资源的综合状态。需要回验，不可永久定死。" },
];
