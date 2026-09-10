import { verifyStudioWorldBodyCandidate } from '@taowind/world-body-studio-bridge';
import { createWorldBodyEventDeliveryPlan } from '@taowind/world-body-ir/event-runtime';
import { rootHash } from './canonical.mjs';

export const REALITY_BUILD_WORLD_BODY_PRESENTATION_FORMAT = 'reality-build.world-body-presentation-candidate.v0.1';
export const REALITY_BUILD_WORLD_BODY_PRESENTATION_VERSION = '0.1.0-alpha.1';

export class RealityBuildWorldBodyCandidateError extends Error {
  constructor(code, message, details = undefined) {
    super(`${code}: ${message}`);
    this.name = 'RealityBuildWorldBodyCandidateError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = undefined) {
  throw new RealityBuildWorldBodyCandidateError(code, message, details);
}

function clone(value) {
  return structuredClone(value);
}

export function createWorldBodyRealityBuildPresentationCandidate({ project, candidate, presentationScene, allowUnmappedBodies = false } = {}) {
  if (!verifyStudioWorldBodyCandidate(candidate)) fail('REALITY_BUILD_WORLD_BODY_CANDIDATE_INVALID', 'Build presentation binding requires a verified Studio World Body candidate');
  if (!project || typeof project !== 'object' || Array.isArray(project)) fail('REALITY_BUILD_WORLD_BODY_PROJECT_INVALID', 'Build presentation binding requires a Unified Project object');
  if (project.project_root !== candidate.manifest.source_roots.project_root) fail('REALITY_BUILD_WORLD_BODY_PROJECT_ROOT_MISMATCH', 'Unified Project root does not match the candidate source root');
  if (!presentationScene || presentationScene.format !== 'vsr.spatial-scene.v0.4' || !Array.isArray(presentationScene.nodes)) {
    fail('REALITY_BUILD_WORLD_BODY_PRESENTATION_SCENE_INVALID', 'Build presentation binding requires a VSR spatial scene');
  }
  const nodeIds = new Set(presentationScene.nodes.map(node => String(node?.id ?? '')));
  const bindings = [];
  const unmappedBodies = [];
  for (const body of candidate.worldBody.ir.physicalBodyState.bodies) {
    const nodeId = `body:${body.id}`;
    if (!nodeIds.has(nodeId)) {
      unmappedBodies.push({ body_id: body.id, expected_node_id: nodeId });
      continue;
    }
    bindings.push({ body_id: body.id, node_id: nodeId, position_scale: 1000, source_entity_id: body.entityId });
  }
  if (unmappedBodies.length > 0 && !allowUnmappedBodies) {
    fail('REALITY_BUILD_WORLD_BODY_PRESENTATION_UNMAPPED', 'Every World Body physical body must have a Build presentation node unless partial binding is explicitly allowed', { unmappedBodies });
  }
  const sourceBase = {
    format: REALITY_BUILD_WORLD_BODY_PRESENTATION_FORMAT,
    version: REALITY_BUILD_WORLD_BODY_PRESENTATION_VERSION,
    authority: 'candidate-build-presentation-only',
    project_root: project.project_root,
    semantic_declaration_root: candidate.manifest.semanticDeclarationRoot,
    world_body_root: candidate.manifest.worldBodyRoot,
    scene_root: rootHash(presentationScene),
    event_delivery_plan: clone(createWorldBodyEventDeliveryPlan(candidate.worldBody.ir)),
    bindings,
    unmapped_bodies: unmappedBodies,
  };
  const presentationSourceRoot = rootHash(sourceBase);
  const presentation = {
    ...sourceBase,
    scene: clone(presentationScene),
    presentation_source_root: presentationSourceRoot,
    presentation_root: rootHash({ ...sourceBase, presentation_source_root: presentationSourceRoot }),
  };
  return { format: REALITY_BUILD_WORLD_BODY_PRESENTATION_FORMAT, version: REALITY_BUILD_WORLD_BODY_PRESENTATION_VERSION, authority: 'candidate-build-presentation-only', presentation };
}

export function verifyWorldBodyBuildPresentationCandidate(value) {
  try {
    if (!value || value.format !== REALITY_BUILD_WORLD_BODY_PRESENTATION_FORMAT || value.version !== REALITY_BUILD_WORLD_BODY_PRESENTATION_VERSION || value.authority !== 'candidate-build-presentation-only') return false;
    const { presentation_root: presentationRoot, scene, ...presentationBase } = value.presentation ?? {};
    if (!presentationRoot || !scene || rootHash(presentationBase) !== presentationRoot) return false;
    const eventPlan = presentationBase.event_delivery_plan;
    if (!eventPlan || eventPlan.sourceWorldBodyRoot !== presentationBase.world_body_root) return false;
    const { deliveryPlanRoot, ...eventPlanBase } = eventPlan;
    if (!deliveryPlanRoot || rootHash(eventPlanBase) !== deliveryPlanRoot) return false;
    return rootHash(scene) === presentationBase.scene_root
      && value.presentation.presentation_source_root === rootHash({ ...presentationBase, presentation_source_root: undefined });
  } catch {
    return false;
  }
}
