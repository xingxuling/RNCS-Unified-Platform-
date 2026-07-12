// sequenceObjectArchitectureEngine.ts — top-level façade
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import type { SequenceObjectLayer } from "@/constants/sequence-object/sequenceObjectLayers";
import type { SequenceObjectPermissionLevel } from "@/constants/sequence-object/sequenceObjectPermissionLevels";
import { buildObjectSeed, type SequenceObjectSeed } from "./motherSequenceObjectSeedEngine";
import { resolveObjectType, type ObjectTypeResolutionResult } from "./sequenceObjectTypeResolver";
import { compileObjectStructure, type SequenceObjectStructure } from "./sequenceObjectStructureCompiler";
import { buildRuntimeContract, type SequenceObjectRuntimeContract } from "./sequenceObjectRuntimeContractEngine";
import { initialLifecycle, type SequenceObjectLifecycleState } from "./sequenceObjectLifecycleBridge";
import { listInterfacesForType, type SequenceObjectInterface } from "./sequenceObjectInterfaceEngine";
import { extractVariables, type SequenceObjectVariable } from "./sequenceObjectVariableExtractor";
import { buildPermissions, type SequenceObjectPermission } from "./sequenceObjectPermissionGuard";
import { runObjectQa, type SequenceObjectQaResult } from "./sequenceObjectQaBridge";
import { detectObjectMeaningDrift, type MeaningDriftCheck } from "./sequenceObjectMeaningDriftDetector";
import { runObjectSafetyGuard, type SafetyGuardResult, SEQUENCE_OBJECT_SAFETY_NOTE } from "./sequenceObjectSafetyGuard";
import { buildObjectRecalcRequest, buildObjectTextStaleSignal } from "./sequenceObjectRecalculationBridge";
import { buildObjectVersionRecord } from "./sequenceObjectVersionBridge";
import { listSequenceObjectExamples } from "./sequenceObjectExamplesRegistry";

export interface SequenceObject {
  objectId: string;
  objectName: string;
  objectType: SequenceObjectType;
  objectLayer: SequenceObjectLayer;
  sourceType: "MOTHER_SEQUENCE" | "FULL60" | "LIGHT20" | "MSL" | "USER_INPUT" | "WORKSPACE" | "ENGINE_OUTPUT" | "DEMO";
  sourceSequence?: string[];
  sourceInputSummary?: string;
  domainContext: string[];
  coreVariables: SequenceObjectVariable[];
  runtimeContract: SequenceObjectRuntimeContract | null;
  lifecycleState: SequenceObjectLifecycleState;
  interfaces: SequenceObjectInterface[];
  permissions: SequenceObjectPermission;
  reusableInEngines: string[];
  relatedObjects: string[];
  qaStatus: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  version: string;
  privacyLevel: SequenceObjectPermissionLevel;
  safetyNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompileObjectInput {
  text: string;
  objectName?: string;
  objectTypeHint?: SequenceObjectType;
  sourceSequence?: string[];
  sourceType?: SequenceObject["sourceType"];
  userMode?: "PUBLIC" | "ADVANCED" | "FOUNDER";
  domainContext?: string[];
}

export interface CompileObjectResult {
  seed: SequenceObjectSeed | null;
  resolution: ObjectTypeResolutionResult;
  structure: SequenceObjectStructure;
  object: SequenceObject;
  qa: SequenceObjectQaResult;
  drift: MeaningDriftCheck;
  safety: SafetyGuardResult;
  recalc: ReturnType<typeof buildObjectRecalcRequest>;
  textStale: ReturnType<typeof buildObjectTextStaleSignal>;
  versionRecord: ReturnType<typeof buildObjectVersionRecord>;
  safetyNote: string;
}

function makeId(prefix = "obj") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function compileSequenceObject(input: CompileObjectInput): CompileObjectResult {
  const sourceType = input.sourceType ?? (input.sourceSequence ? "MOTHER_SEQUENCE" : "USER_INPUT");
  const seed = input.sourceSequence ? buildObjectSeed(input.sourceSequence, sourceType === "DEMO" ? "DEMO" : "USER") : null;
  const resolution = resolveObjectType(input.text, input.objectTypeHint ?? seed?.objectPotentialTypes[0]);
  const objectId = makeId();
  const objectName = input.objectName?.trim() || `${resolution.objectType}_${objectId.slice(-6)}`;

  const structure = compileObjectStructure(objectId, resolution.objectType);
  const variables = extractVariables(resolution.objectType, input.text);
  const contract = buildRuntimeContract(objectId, resolution.objectType, resolution.objectLayer);
  const lifecycle = initialLifecycle(resolution.objectLayer);
  const interfaces = listInterfacesForType(resolution.objectType, objectId);
  const permissions = buildPermissions({
    type: resolution.objectType,
    layer: resolution.objectLayer,
    source: sourceType,
    userMode: input.userMode,
  });

  const safetyNotes: string[] = [
    SEQUENCE_OBJECT_SAFETY_NOTE.slice(0, 80) + "…",
    ...permissions.permissionNotes,
  ];
  if (resolution.objectLayer === "CIVILIZATION_LAYER") safetyNotes.push("Civilization 对象需 governance / 封存规则。");

  const obj: SequenceObject = {
    objectId,
    objectName,
    objectType: resolution.objectType,
    objectLayer: resolution.objectLayer,
    sourceType,
    sourceSequence: input.sourceSequence,
    sourceInputSummary: input.text.slice(0, 200),
    domainContext: input.domainContext ?? [],
    coreVariables: variables,
    runtimeContract: contract,
    lifecycleState: lifecycle,
    interfaces,
    permissions,
    reusableInEngines: interfaces.map((i) => i.targetEngine),
    relatedObjects: [],
    qaStatus: "PASS",
    version: "v1.0",
    privacyLevel: permissions.accessLevel,
    safetyNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const qa = runObjectQa({
    objectId, type: obj.objectType, layer: obj.objectLayer,
    variables, contract, lifecycle, permission: permissions, safetyNotes,
  });
  obj.qaStatus = qa.status;

  const drift = detectObjectMeaningDrift(input.text, resolution.objectType);
  const safety = runObjectSafetyGuard(drift, qa);

  return {
    seed,
    resolution,
    structure,
    object: obj,
    qa,
    drift,
    safety,
    recalc: buildObjectRecalcRequest(`Compile ${resolution.objectType}`),
    textStale: buildObjectTextStaleSignal(),
    versionRecord: buildObjectVersionRecord("OBJECT_COMPILED", objectId, `Compiled ${resolution.objectType}`),
    safetyNote: SEQUENCE_OBJECT_SAFETY_NOTE,
  };
}

export function sequenceObjectArchitectureMeta() {
  return {
    engineName: "Sequence Object Architecture Engine",
    engineChineseName: "数列对象架构引擎",
    version: "v1.0",
    examples: listSequenceObjectExamples().length,
  };
}

export { listSequenceObjectExamples };
