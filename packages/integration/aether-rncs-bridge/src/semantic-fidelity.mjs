import { createHash } from 'node:crypto';

export const SEMANTIC_FIDELITY_FORMAT = 'rncs.semantic-fidelity-gate.v0.1';
export const SEMANTIC_FIDELITY_VERSION = '0.1.0';
export const AETHER_ISLAND_COMPILER_PROFILE = 'aether-island-template-v1';

const canonical = (value) => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
};
const semanticRoot = (value) => createHash('sha256').update(canonical(value)).digest('hex');
const normalizedText = (value) => String(value ?? '').normalize('NFKC').trim().toLowerCase();

const SOURCE_CONCEPTS = Object.freeze([
  ['aether_island', /以太岛|小型(?:的)?(?:以太)?岛|aether[\s-]*island|small\s+(?:aether\s+)?island/iu],
  ['two_player_spawns', /(?:两个|两处|2\s*个).{0,10}(?:玩家)?出生点|two.{0,10}(?:player\s+)?spawn|2.{0,10}(?:player\s+)?spawn/iu],
  ['door', /门|door/iu],
  ['blue_energy_light', /蓝色.{0,8}(?:能量)?灯|能量灯|blue.{0,10}(?:energy\s+)?(?:light|lamp)/iu],
  ['sensor_zone', /感应(?:区域|区)|传感(?:区域|区)|sensor.{0,10}(?:zone|area)/iu],
  ['player_enters_sensor', /玩家.{0,8}进入.{0,12}(?:感应|传感)(?:区域|区)|player.{0,10}enter(?:s|ed|ing)?.{0,12}sensor/iu],
  ['door_opens', /门.{0,8}(?:自动)?打开|打开.{0,8}门|door.{0,12}open|open.{0,12}door/iu],
  ['light_boost', /灯光?.{0,8}(?:增强|变亮|提升)|(?:增强|变亮|提升).{0,8}灯|light.{0,12}(?:boost|intens|brighten)/iu],
  ['ambient_sound', /环境声音|环境音|ambient.{0,10}(?:sound|audio)/iu],
  ['two_client_consistency', /两个客户端.{0,20}(?:一致|同步)|(?:两端|双端).{0,12}(?:一致|同步)|two.{0,10}clients?.{0,20}(?:consistent|converge|same|synchron)/iu],
]);

const FOREIGN_DOMAIN_SIGNALS = Object.freeze([
  ['neural_input', /脑信号|神经|脑机|\bbci\b|\beeg\b|\bmeg\b|neural|brain[\s-]*computer/iu],
  ['safety_protocol', /拒答|人工确认|回滚|漂移检测|身份锚点|不可逆|safety\s+protocol|identity\s+anchor/iu],
]);

function sourceConcepts(text) {
  return SOURCE_CONCEPTS.filter(([, pattern]) => pattern.test(text)).map(([concept]) => concept);
}

function foreignDomainSignals(text) {
  return FOREIGN_DOMAIN_SIGNALS.filter(([, pattern]) => pattern.test(text)).map(([signal]) => signal);
}

function artifactDefinitions(plan) {
  return (plan?.artifacts ?? []).map((artifact) => artifact?.definition ?? artifact).filter(Boolean);
}

function behaviorActions(plan) {
  return (plan?.behaviors ?? []).flatMap((item) => item?.actions ?? []);
}

function worldChange(plan, path) {
  return (plan?.world_state_changes ?? []).find((change) => change?.op === 'set' && change?.path === path)?.value;
}

export function outputSemanticConcepts(plan) {
  const artifacts = artifactDefinitions(plan);
  const kinds = (kind) => artifacts.filter((artifact) => artifact?.kind === kind);
  const actions = behaviorActions(plan);
  const trigger = (plan?.behaviors ?? []).some((item) => item?.trigger?.event === 'player.entered-zone');
  const concepts = [];
  if (kinds('island').length || worldChange(plan, 'world.world_id') === 'world:aether-island') concepts.push('aether_island');
  if (kinds('spawn-point').length >= 2) concepts.push('two_player_spawns');
  if (kinds('door').length) concepts.push('door');
  if (kinds('light').some((item) => item?.state?.color === '#2788ff' || /蓝色|energy|能量/iu.test(String(item?.name ?? item?.id ?? '')))) concepts.push('blue_energy_light');
  if (kinds('sensor-zone').length) concepts.push('sensor_zone');
  if (trigger) concepts.push('player_enters_sensor');
  if (actions.some((action) => action?.target === 'entity:door.open' && action?.value === true)) concepts.push('door_opens');
  if (actions.some((action) => action?.target === 'entity:lamp.intensity' && Number(action?.value) > 1)) concepts.push('light_boost');
  if (actions.some((action) => action?.target === 'globals.ambient_sound' || action?.capability_id === 'audio.environment.emit')) concepts.push('ambient_sound');
  const networkMode = worldChange(plan, 'world.network.mode');
  if (networkMode === 'server-authoritative-two-client' || (plan?.simulation_requirements ?? []).some((item) => item?.runtime === 'rncs.network' && Number(item?.clients) >= 2)) concepts.push('two_client_consistency');
  return [...new Set(concepts)];
}

function semanticSnapshot(plan) {
  return {
    source: {
      language: plan?.source?.language ?? null,
      text: normalizedText(plan?.source?.text),
      sourceRoot: plan?.source?.source_root ?? null,
      compilerProfile: plan?.source?.compiler_profile ?? null,
    },
    artifacts: artifactDefinitions(plan).map((item) => ({ id: item?.id ?? null, kind: item?.kind ?? null, name: item?.name ?? null })),
    behaviors: (plan?.behaviors ?? []).map((item) => ({ behaviorId: item?.behavior_id ?? null, trigger: item?.trigger ?? null, actions: item?.actions ?? [] })),
    worldStateChanges: plan?.world_state_changes ?? [],
    simulationRequirements: plan?.simulation_requirements ?? [],
  };
}

function isAetherIslandTemplate(plan, outputConcepts) {
  return plan?.source?.compiler_profile === AETHER_ISLAND_COMPILER_PROFILE
    || (plan?.behaviors ?? []).some((item) => item?.behavior_id === 'behavior:aether-island-sensor-v1')
    || outputConcepts.includes('aether_island') && outputConcepts.length >= 6;
}

function sourceDomain(text) {
  if (FOREIGN_DOMAIN_SIGNALS[0][1].test(text)) return 'neural-intent-protocol';
  if (SOURCE_CONCEPTS[0][1].test(text)) return 'aether-island-world';
  return 'unknown';
}

export function createSemanticFidelityGate(plan) {
  const text = normalizedText(plan?.source?.text);
  const sourceMatches = sourceConcepts(text);
  const outputConcepts = outputSemanticConcepts(plan);
  const templateDetected = isAetherIslandTemplate(plan, outputConcepts);
  const unexplainedOutputConcepts = outputConcepts.filter((concept) => !sourceMatches.includes(concept));
  const matchedConcepts = outputConcepts.filter((concept) => sourceMatches.includes(concept));
  const signals = foreignDomainSignals(text);
  const scoreBps = outputConcepts.length ? Math.round((matchedConcepts.length / outputConcepts.length) * 10_000) : 10_000;
  const defaultTemplateFallbackDetected = templateDetected && unexplainedOutputConcepts.length > 0;
  const reasonCodes = [];
  if (defaultTemplateFallbackDetected) reasonCodes.push('DEFAULT_TEMPLATE_FALLBACK_DETECTED');
  if (unexplainedOutputConcepts.length) reasonCodes.push('UNEXPLAINED_OUTPUT_CONCEPTS');
  if (signals.length && sourceDomain(text) !== 'aether-island-world') reasonCodes.push('SOURCE_OUTPUT_DOMAIN_MISMATCH');
  const gate = {
    format: SEMANTIC_FIDELITY_FORMAT,
    version: SEMANTIC_FIDELITY_VERSION,
    compilerProfile: plan?.source?.compiler_profile ?? (templateDetected ? AETHER_ISLAND_COMPILER_PROFILE : null),
    sourceDomain: sourceDomain(text),
    outputDomain: templateDetected ? 'aether-island-world' : 'unknown',
    sourceConcepts: sourceMatches,
    outputConcepts,
    matchedConcepts,
    unexplainedOutputConcepts,
    foreignDomainSignals: signals,
    scoreBps,
    thresholdBps: 10_000,
    defaultTemplateFallbackDetected,
    semanticSnapshotRoot: semanticRoot(semanticSnapshot(plan)),
    status: templateDetected && unexplainedOutputConcepts.length === 0 ? 'passed' : templateDetected ? 'rejected' : 'not_applicable',
    reasonCodes,
  };
  gate.gateRoot = semanticRoot(gate);
  return gate;
}

export function validateSemanticFidelityGate(plan) {
  if (plan?.source?.language === 'RCL') return { valid: true, applicable: false, errors: [], gate: null };
  const expected = createSemanticFidelityGate(plan);
  const applicable = expected.status !== 'not_applicable';
  if (!applicable && !plan?.semantic_fidelity) return { valid: true, applicable: false, errors: [], gate: expected };
  const actual = plan?.semantic_fidelity;
  const errors = [];
  if (!actual) errors.push('SEMANTIC_FIDELITY_GATE_REQUIRED');
  else {
    if (actual.format !== SEMANTIC_FIDELITY_FORMAT || actual.version !== SEMANTIC_FIDELITY_VERSION) errors.push('SEMANTIC_FIDELITY_GATE_FORMAT_INVALID');
    if (actual.semanticSnapshotRoot !== expected.semanticSnapshotRoot || actual.gateRoot !== expected.gateRoot) errors.push('SEMANTIC_FIDELITY_GATE_STALE_OR_TAMPERED');
    if (actual.status !== 'passed' || expected.status !== 'passed' || expected.scoreBps < expected.thresholdBps) errors.push('SEMANTIC_FIDELITY_GATE_FAILED');
  }
  return { valid: errors.length === 0, applicable: true, errors, gate: expected };
}

export function assertSemanticFidelityGate(plan) {
  const validation = validateSemanticFidelityGate(plan);
  if (validation.valid) return validation;
  throw Object.assign(new Error(`SEMANTIC_COMPILATION_GATE_FAILED:${validation.errors.join(',')}`), {
    code: 'SEMANTIC_COMPILATION_GATE_FAILED',
    details: validation,
  });
}
