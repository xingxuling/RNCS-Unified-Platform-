import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import { boundedText, clone, publicError } from '../canonical.mjs';
import { createEvidenceReceipt } from '../evidence/receipt.mjs';
import { ExecutionPolicy } from '../security/policy.mjs';
import { CAPABILITY_BY_ALIAS } from '../registry/manifests.mjs';

const RESULT_SCHEMA = z.object({ ok: z.boolean(), data: z.any().optional(), receipt: z.any().optional(), error: z.any().optional() });

function zodFor(descriptor) {
  if (!descriptor) return z.any();
  if (descriptor.type === 'string') return z.string().min(descriptor.minLength ?? 0);
  if (descriptor.type === 'integer') return z.number().int();
  if (descriptor.type === 'number') return z.number();
  if (descriptor.type === 'boolean') return z.boolean();
  if (descriptor.type === 'array') return z.array(descriptor.items?.type === 'string' ? z.string() : z.any());
  if (descriptor.type === 'object') return z.record(z.any());
  return z.any();
}

function shapeFor(manifest) {
  const shape = {};
  const required = new Set(manifest.inputSchema?.required ?? []);
  for (const [key, descriptor] of Object.entries(manifest.inputSchema?.properties ?? {})) shape[key] = required.has(key) ? zodFor(descriptor) : zodFor(descriptor).optional();
  for (const required of manifest.inputSchema?.required ?? []) shape[required] = shape[required] ?? z.any();
  if (manifest.executionMode !== 'read_only') shape.confirmation_token = z.string().optional();
  return shape;
}

function toolResult(data, receipt) {
  const value = { ok: true, data, receipt };
  return { structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function toolFailure(error, receipt = null) {
  const value = { ok: false, error: publicError(error), ...(receipt ? { receipt } : {}) };
  return { isError: true, structuredContent: value, content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

const rncsRoots = (status = null) => ({
  stateRoot: status?.state_root ?? status?.stateRoot,
  revision: status?.revision,
  generation: status?.generation ?? status?.generation_id,
});

const CORE_TOOLS = new Map([
  ['turi_server_info', 'turi.server.info'], ['turi_health', 'turi.health'], ['turi_capability_search', 'turi.capability.search'], ['turi_capability_describe', 'turi.capability.describe'], ['turi_capability_invoke', 'turi.capability.invoke'],
  ['turi_subject_status', 'turi.subject.status'], ['turi_intent_compile', 'turi.intent.compile'], ['turi_candidate_execute', 'turi.candidate.execute'], ['turi_candidate_review', 'turi.candidate.review'], ['turi_authorize', 'turi.authorize'], ['turi_merge', 'turi.merge'], ['turi_rollback', 'turi.rollback'], ['turi_evidence_get', 'turi.evidence.get'], ['turi_artifact_export', 'turi.artifact.export'],
  ['turi_intent_to_reality', 'turi.workflow.intent-to-reality'], ['turi_engineering_task', 'turi.workflow.engineering-task'], ['turi_world_task', 'turi.workflow.world-task'], ['turi_cinematic_task', 'turi.workflow.cinematic-task'], ['turi_research_task', 'turi.workflow.research-task'],
  ['turi_job_start', 'turi.job.start'], ['turi_job_status', 'turi.job.status'], ['turi_job_events', 'turi.job.events'], ['turi_job_cancel', 'turi.job.cancel'], ['turi_job_artifacts', 'turi.job.artifacts'],
]);

const ALIAS_TO_CAPABILITY = new Map(CORE_TOOLS);
const DIRECT_DOMAIN_TO_CAPABILITY = new Map([
  ['rcl_status', 'rcl.status'], ['rcl_search', 'rcl.search'], ['rcl_read_file', 'rcl.read_file'], ['rcl_list_examples', 'rcl.list_examples'], ['rcl_package_metadata', 'rcl.package_metadata'], ['rcl_native_vm_status', 'rcl.native_vm_status'], ['rcl_compile_source', 'rcl.compile_source'], ['rcl_compile_file', 'rcl.compile_file'], ['rcl_disassemble_source', 'rcl.disassemble_source'], ['rcl_disassemble_file', 'rcl.disassemble_file'], ['rcl_run_source', 'rcl.run_source'], ['rcl_run_file', 'rcl.run_file'], ['rcl_selfhost_inventory', 'rcl.selfhost_inventory'], ['rcl_bootstrap_smoke', 'rcl.bootstrap_smoke'], ['rcl_validate_reality_spec', 'rcl.validate_reality_spec'], ['rcl_compile_reality_plan', 'rcl.compile_reality_plan'], ['rcl_compile_cinematic_ir', 'rcl.compile_cinematic_ir'], ['rcl_compile_game_rule', 'rcl.compile_game_rule'], ['rcl_compile_asset_protocol', 'rcl.compile_asset_protocol'],
  ['rncs_status', 'rncs.status'], ['rncs_list_runtimes', 'rncs.list_runtimes'], ['rncs_runtime_health', 'rncs.runtime_health'], ['rncs_runtime_action', 'rncs.runtime_action'], ['rncs_compile_plan', 'rncs.compile_plan'], ['rncs_validate_plan', 'rncs.validate_plan'], ['rncs_create_candidate', 'rncs.create_candidate'], ['rncs_get_candidate', 'rncs.get_candidate'], ['rncs_diff_candidate', 'rncs.diff_candidate'], ['rncs_simulate_candidate', 'rncs.simulate_candidate'], ['rncs_authorize_candidate', 'rncs.authorize_candidate'], ['rncs_reject_candidate', 'rncs.reject_candidate'], ['rncs_merge_candidate', 'rncs.merge_candidate'], ['rncs_history', 'rncs.history'], ['rncs_replay_generation', 'rncs.replay_generation'], ['rncs_rollback_generation', 'rncs.rollback_generation'], ['rncs_register_behavior', 'rncs.register_behavior'], ['rncs_update_behavior', 'rncs.update_behavior'], ['rncs_enable_behavior', 'rncs.enable_behavior'], ['rncs_materialize_rsr', 'rncs.materialize_rsr'], ['rncs_rsr_simulate', 'rncs.rsr_simulate'], ['rncs_vsr_render', 'rncs.vsr_render'], ['rncs_run_loopback', 'rncs.run_loopback'], ['rncs_invocation_receipts', 'rncs.invocation_receipts'],
  ['updia_health', 'updia.health'], ['updia_status', 'updia.status'], ['updia_list_organs', 'updia.list_organs'], ['updia_describe_organ', 'updia.describe_organ'], ['updia_subject_load', 'updia.subject_load'], ['updia_subject_checkpoint', 'updia.subject_checkpoint'], ['updia_subject_restore', 'updia.subject_restore'], ['updia_subject_close', 'updia.subject_close'], ['updia_think', 'updia.think'], ['updia_plan', 'updia.plan'], ['updia_organ_invoke', 'updia.organ_invoke'], ['updia_sparse_scheduler_status', 'updia.sparse_scheduler_status'], ['updia_memory_search', 'updia.memory_search'], ['updia_memory_read', 'updia.memory_read'], ['updia_memory_write_candidate', 'updia.memory_write_candidate'], ['updia_memory_commit', 'updia.memory_commit'], ['updia_action_propose', 'updia.action_propose'], ['updia_action_result_ingest', 'updia.action_result_ingest'], ['updia_learn_from_result', 'updia.learn_from_result'], ['gamebrain_status', 'gamebrain.status'], ['gamebrain_simulate', 'gamebrain.simulate'],
  ['developer_execution_status', 'engineering.status'], ['workspace_apply_patch', 'engineering.apply_patch'], ['execution_run_build', 'engineering.run_build'], ['git_status', 'engineering.git_status'], ['git_commit', 'engineering.commit'],
]);
const EXPOSED_COMPATIBILITY_NAMES = new Set([
  'rcl_status', 'rcl_search', 'rcl_package_metadata', 'rcl_native_vm_status', 'rcl_compile_source', 'rcl_disassemble_source', 'rcl_run_source', 'rcl_selfhost_inventory', 'rcl_bootstrap_smoke', 'rcl_compile_reality_plan',
  'rncs_status', 'rncs_list_runtimes', 'rncs_runtime_health', 'rncs_runtime_action', 'rncs_compile_plan', 'rncs_validate_plan', 'rncs_create_candidate', 'rncs_get_candidate', 'rncs_diff_candidate', 'rncs_simulate_candidate', 'rncs_authorize_candidate', 'rncs_merge_candidate', 'rncs_history', 'rncs_replay_generation', 'rncs_rollback_generation', 'rncs_invocation_receipts', 'rncs_rsr_simulate', 'rncs_vsr_render',
  'updia_health', 'updia_status', 'updia_list_organs', 'updia_think', 'updia_memory_search', 'updia_action_propose', 'updia_action_result_ingest',
  'developer_execution_status', 'workspace_apply_patch', 'execution_run_build', 'git_status',
]);
for (const [name, id] of DIRECT_DOMAIN_TO_CAPABILITY) if (EXPOSED_COMPATIBILITY_NAMES.has(name)) ALIAS_TO_CAPABILITY.set(name, id);
for (const [name, id] of CAPABILITY_BY_ALIAS) if (name.startsWith('turi_')) ALIAS_TO_CAPABILITY.set(name, id);
ALIAS_TO_CAPABILITY.set('rncs_candidate_workflow', 'turi.candidate.execute');

export function createTuriMcpServer({ config, registry, orchestrator, receipts, artifacts, jobs, resources, adapters, growth }) {
  const server = new McpServer({ name: 'turi-unified-reality-intelligence', version: config.version }, { capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false } } });
  const policy = new ExecutionPolicy(config);

  const serverInfo = () => ({
    format: 'turi.server-info.v0.1', name: config.name, version: config.version, protocol: '2025-06-18', transports: ['stdio', 'streamable-http'],
    status: 'INTEGRATION_CANDIDATE', authorityMode: config.authorityMode, candidateWrites: config.authorityMode !== 'read_only', authorizedWrites: config.authorizedWritesEnabled, externalEffects: config.externalEffectsEnabled,
    existingMcp: { rcl: '@taowind/reality-computation-language/src/rcl-mcp-server.mjs', rncs: '@taowind/taowind-reality-mcp' }, registry: registry.summary(), updiaConfigured: adapters.updia.configured(), gamebrain: adapters.gamebrain.status(), limitations: ['A real ChatGPT/MCP Inspector session is required before VERIFIED.'],
  });

  const health = async () => {
    const result = { status: 'degraded', turi: { status: 'ok', version: config.version }, rncs: null, rcl: null, updia: null, gamebrain: adapters.gamebrain.status() };
    try { result.rncs = await adapters.rncs.health(); } catch (error) { result.rncs = { status: 'unavailable', error: publicError(error) }; }
    try {
      const rclStatus = await adapters.rcl.status();
      result.rcl = { implementation: 'native-rcl-mcp', ...rclStatus, status: rclStatus?.rncsFusion?.ok === false ? 'degraded' : 'ready' };
    } catch (error) { result.rcl = { status: 'unavailable', error: publicError(error) }; }
    const updiaConfiguration = typeof adapters.updia.configurationStatus === 'function'
      ? adapters.updia.configurationStatus()
      : { configured: adapters.updia.configured() };
    if (updiaConfiguration.configured) {
      try { result.updia = await adapters.updia.health(); }
      catch (error) { result.updia = { status: 'configured_but_unreachable', implementation: 'provider', configuration: updiaConfiguration, error: publicError(error) }; }
    } else {
      result.updia = { status: 'not_configured', implementation: 'provider', configuration: updiaConfiguration };
    }
    const rncsHealthy = result.rncs?.status === 'healthy';
    const rclAvailable = result.rcl?.status !== 'unavailable';
    const updiaReady = result.updia?.status === 'ready';
    result.status = rncsHealthy && rclAvailable && updiaReady ? 'healthy' : rncsHealthy && rclAvailable ? 'degraded' : 'unhealthy';
    return result;
  };

  async function invokeCapability(capabilityId, input = {}) {
    const manifest = registry.get(capabilityId);
    const validated = registry.validateInput(manifest, input);
    policy.authorize(manifest, validated);
    let stateBefore = null;
    if (manifest.domain === 'rncs' && manifest.executionMode !== 'read_only') {
      try { stateBefore = await adapters.rncs.worldStatus(); } catch { /* capability may be tested with an injected adapter */ }
    }
    try {
      const data = await orchestrator.invoke(capabilityId, validated, { serverInfo, health, event: () => {} });
      let output = data;
      let artifactList = [];
      const serialized = JSON.stringify(data);
      if (Buffer.byteLength(serialized, 'utf8') > Math.min(manifest.outputLimitBytes, config.maxOutputBytes)) {
        const artifact = artifacts.put(serialized, { mimeType: 'application/json', name: `${capabilityId.replace(/[^A-Za-z0-9]+/g, '-')}.json` });
        artifactList = [artifact];
        output = { artifact, truncated: true, summary: `Full output is stored in ${artifact.artifactId}.` };
      }
      const stateAfter = manifest.domain === 'rncs' && manifest.executionMode !== 'read_only' ? await adapters.rncs.worldStatus().catch(() => null) : null;
      const invariant = data?.authorityInvariant;
      const receipt = receipts.save(createEvidenceReceipt(manifest, validated, output, {
        executed: manifest.implementation !== 'evidence_only', verified: invariant?.unchanged === true,
        stateRootBefore: invariant?.before?.stateRoot ?? rncsRoots(stateBefore).stateRoot,
        stateRootAfter: invariant?.after?.stateRoot ?? rncsRoots(stateAfter).stateRoot,
        candidateId: data?.candidate?.candidate_id ?? data?.candidate?.candidateId,
        revision: invariant?.after?.revision ?? stateAfter?.revision,
        generation: stateAfter?.generation,
        artifacts: artifactList,
        warnings: data?.limitations ?? [],
        limitations: data?.limitations ?? [],
        rollbackRef: data?.rollbackRef,
      }));
      return { output, receipt };
    } catch (error) {
      const receipt = receipts.save(createEvidenceReceipt(manifest, validated, null, { executed: false, warnings: [error.message], limitations: [manifest.implementation === 'evidence_only' ? 'This capability is evidence-only and has no executable adapter.' : 'The capability did not complete.'], stateRootBefore: rncsRoots(stateBefore).stateRoot }));
      error.turiReceipt = receipt;
      throw error;
    }
  }

  async function specialized(capabilityId, input) {
    if (capabilityId === 'turi.capability.search') return { output: registry.search(input), receipt: null };
    if (capabilityId === 'turi.capability.describe') return { output: registry.describe(input.capabilityId), receipt: null };
    if (capabilityId === 'turi.capability.invoke') return invokeCapability(input.capabilityId, { ...(input.input ?? {}), ...(input.confirmation_token ? { confirmation_token: input.confirmation_token } : {}) });
    if (capabilityId === 'turi.evidence.get') return { output: input.receiptId ? receipts.get(input.receiptId) : receipts.list(input.limit), receipt: null };
    if (capabilityId === 'turi.artifact.export') return { output: artifacts.read(input.artifactId, { maxBytes: input.maxBytes }), receipt: null };
    if (capabilityId === 'turi.job.start') return { output: jobs.start(input.workflow, input.input ?? {}, { timeoutMs: input.timeoutMs }), receipt: null };
    if (capabilityId === 'turi.job.status') return { output: jobs.store.get(input.jobId), receipt: null };
    if (capabilityId === 'turi.job.events') return { output: jobs.store.listEvents(input.jobId), receipt: null };
    if (capabilityId === 'turi.job.cancel') return { output: jobs.cancel(input.jobId), receipt: null };
    if (capabilityId === 'turi.job.artifacts') return { output: jobs.store.get(input.jobId)?.artifacts ?? [], receipt: null };
    if (capabilityId === 'turi.growth.experience.record') return { output: growth.store.recordExperience(input), receipt: null };
    if (capabilityId === 'turi.growth.experience.get') return { output: growth.store.getExperience(input.experienceId), receipt: null };
    if (capabilityId === 'turi.growth.experience.search') return { output: growth.store.searchExperiences(input), receipt: null };
    if (capabilityId === 'turi.growth.experience.compare') return { output: growth.store.compareExperiences(input.experienceIds), receipt: null };
    if (capabilityId === 'turi.growth.pattern.mine') return { output: growth.store.minePattern(input), receipt: null };
    if (capabilityId === 'turi.growth.pattern.status') return { output: growth.store.patternStatus(input.patternId), receipt: null };
    if (capabilityId === 'turi.growth.pattern.evidence') return { output: growth.store.patternEvidence(input.patternId), receipt: null };
    if (capabilityId === 'turi.growth.protocol.create') return { output: growth.store.createProtocol(input), receipt: null };
    if (capabilityId === 'turi.growth.protocol.get') return { output: growth.store.getProtocol(input.protocolId), receipt: null };
    if (capabilityId === 'turi.growth.protocol.compile') return { output: await growth.compileProtocol(input.protocolId, input), receipt: null };
    if (capabilityId === 'turi.growth.protocol.diff') return { output: growth.store.diffProtocol(input.protocolId, input.proposed), receipt: null };
    if (capabilityId === 'turi.growth.protocol.reject') return { output: growth.store.updateProtocol(input.protocolId, { status: 'rejected', rejection: { reason: input.reason, at: new Date().toISOString() } }), receipt: null };
    if (capabilityId === 'turi.growth.capability.build') return { output: growth.store.buildCapabilityCandidate(input), receipt: null };
    if (capabilityId === 'turi.growth.capability.get') return { output: growth.store.getCandidate(input.candidateId), receipt: null };
    if (capabilityId === 'turi.growth.capability.invoke') return { output: await growth.invokeCandidate(input.candidateId, input.input ?? {}), receipt: null };
    if (capabilityId === 'turi.growth.capability.diff') return { output: growth.store.diffCandidate(input.candidateId, input.proposed), receipt: null };
    if (capabilityId === 'turi.growth.evaluation.evaluate') return { output: growth.store.evaluate(input.candidateId, input), receipt: null };
    if (capabilityId === 'turi.growth.evaluation.regression') return { output: growth.store.evaluate(input.candidateId, { ...input, cases: input.cases.map((item) => ({ ...item, kind: 'regression' })) }), receipt: null };
    if (capabilityId === 'turi.growth.evaluation.adversarial') return { output: growth.store.evaluate(input.candidateId, { ...input, cases: input.cases.map((item) => ({ ...item, kind: 'adversarial' })) }), receipt: null };
    if (capabilityId === 'turi.growth.evaluation.benchmark') return { output: { candidateId: input.candidateId, executionGrade: 'STATIC_VERIFIED', cases: input.cases, limitation: 'Benchmark observations are not performance claims until measured by a runtime harness.' }, receipt: null };
    if (capabilityId === 'turi.growth.promotion.request') return { output: growth.requestPromotion(input.candidateId, input.evaluationId), receipt: null };
    if (capabilityId === 'turi.growth.promotion.review') return { output: growth.store.reviewPromotion(input.promotionId, input), receipt: null };
    if (capabilityId === 'turi.growth.promotion.promote') return { output: growth.promote(input.promotionId), receipt: null };
    if (capabilityId === 'turi.growth.promotion.reject') return { output: growth.rejectPromotion(input.promotionId, input.reason), receipt: null };
    if (capabilityId === 'turi.growth.lineage.get') return { output: growth.store.lineage(input.capabilityId), receipt: null };
    if (capabilityId === 'turi.growth.lineage.versions') return { output: growth.store.versions(input.capabilityId), receipt: null };
    if (capabilityId === 'turi.growth.lineage.compare') return { output: growth.store.compareVersions(input.capabilityId, input.left, input.right), receipt: null };
    if (capabilityId === 'turi.growth.lineage.restore') return { output: growth.rollbackPromotion(input.capabilityId, input.version), receipt: null };
    if (capabilityId === 'turi.growth.health') return { output: growth.store.health(input.capabilityId), receipt: null };
    if (capabilityId === 'turi.growth.conflict.scan') return { output: growth.store.conflictScan(), receipt: null };
    if (capabilityId === 'turi.growth.deprecate') { growth.registry.removeDynamic(input.capabilityId); growth.orchestrator.unregisterDynamic(input.capabilityId); return { output: growth.store.deprecate(input.capabilityId, input.reason), receipt: null }; }
    if (capabilityId === 'turi.growth.archive') { growth.registry.removeDynamic(input.capabilityId); growth.orchestrator.unregisterDynamic(input.capabilityId); return { output: growth.store.archive(input.capabilityId, input.reason), receipt: null }; }
    if (capabilityId === 'turi.growth.prune') { growth.registry.removeDynamic(input.capabilityId); growth.orchestrator.unregisterDynamic(input.capabilityId); return { output: growth.store.prune(input.capabilityId), receipt: null }; }
    if (capabilityId === 'turi.growth.learning.report') return { output: growth.report(), receipt: null };
    return null;
  }

  async function call(capabilityId, input = {}) {
    try {
      const result = await specialized(capabilityId, input) ?? await invokeCapability(capabilityId, input);
      let receipt = result.receipt;
      if (!receipt) {
        const manifest = registry.get(capabilityId);
        receipt = receipts.save(createEvidenceReceipt(manifest, input, result.output, { executed: true, verified: manifest.evidenceLevel === 'verified' }));
      }
      return toolResult(result.output, receipt);
    } catch (error) { return toolFailure(error, error.turiReceipt ?? null); }
  }

  for (const [toolName, capabilityId] of ALIAS_TO_CAPABILITY) {
    if (!registry.has(capabilityId)) continue;
    const manifest = registry.get(capabilityId);
    server.registerTool(toolName, { title: manifest.displayName, description: `${manifest.description} [${manifest.implementation}/${manifest.evidenceLevel}/${manifest.executionMode}]`, inputSchema: shapeFor(manifest), outputSchema: RESULT_SCHEMA }, async (input) => call(capabilityId, input));
  }

  for (const resource of resources.list().filter((item) => !item.uri.includes('{'))) {
    server.registerResource(resource.name, resource.uri, { mimeType: resource.mimeType, description: resource.name }, async (uri) => resources.read(uri.toString()));
  }
  for (const [name, template] of [['job', 'turi://jobs/{jobId}'], ['evidence', 'turi://evidence/{receiptId}'], ['artifact', 'turi://artifacts/{artifactId}']]) {
    server.registerResource(`${name}-resource`, new ResourceTemplate(template, { list: undefined }), { mimeType: 'application/json' }, async (uri) => resources.read(uri.toString()));
  }

  server.__turi = { invokeCapability, registry, config, serverInfo, health };
  return server;
}

export { ALIAS_TO_CAPABILITY, CORE_TOOLS, DIRECT_DOMAIN_TO_CAPABILITY };
