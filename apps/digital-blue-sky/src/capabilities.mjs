import { normalizeProvider } from '@taowind/capability-negotiation-protocol';

const base = {
  protocol_versions: ['0.1.0', '0.2.0', '0.3.0', '0.4.0'],
  trust: { level: 3, attestations: ['local-runtime', 'deterministic-event-journal'] },
  status: 'available',
  transports: [{ kind: 'reality-one-gateway', runtime_id: 'rncs.dml-core' }],
};

const cap = (capability_id, options = {}) => ({
  capability_id,
  version: '0.4.0',
  fulfills: options.fulfills || [capability_id],
  inputs: options.inputs || {},
  outputs: options.outputs || { receipt: { type: 'object' } },
  required_scopes: options.required_scopes || [],
  host_requirements: options.host_requirements || [],
  risk: options.risk || { level: 'low', reasons: [] },
  reversible: options.reversible ?? true,
  execution_phase: options.execution_phase || 'transaction',
  side_effects: options.side_effects || [],
  evidence: options.evidence || { produces: ['dml.work-event'], requires: [] },
  cost: options.cost || { cpu_millis: 2, memory_mb: 2, network_kb: 0, monetary_microunits: 0 },
  transport: { kind: 'gateway-runtime', runtime_id: 'rncs.dml-core', action: 'execute' },
});

export function buildDMLProvider() {
  return normalizeProvider({
    ...base,
    provider_id: 'dml-core:local',
    capabilities: [
      cap('dml.goal.create', { required_scopes: ['dml.goal.write'], evidence: { produces: ['dml.goal', 'dml.work-event'], requires: [] } }),
      cap('dml.goal.pause', { required_scopes: ['dml.goal.control'] }),
      cap('dml.goal.resume', { required_scopes: ['dml.goal.control'] }),
      cap('dml.goal.retry', { required_scopes: ['dml.goal.control'], host_requirements: ['filesystem.read'], risk: { level: 'medium', reasons: ['resume-blocked-work'] } }),
      cap('dml.goal.inspect', { required_scopes: ['dml.goal.read'], execution_phase: 'read-only' }),
      cap('dml.task.execute', { required_scopes: ['dml.task.execute'], host_requirements: ['filesystem.read'], risk: { level: 'medium', reasons: ['local-task-side-effects'] }, reversible: true, evidence: { produces: ['dml.task-result', 'dml.work-event'], requires: [] } }),
      cap('dml.task.inspect', { required_scopes: ['dml.task.read'], execution_phase: 'read-only', evidence: { produces: ['dml.task-state'], requires: [] } }),
      cap('dml.learning.start', { required_scopes: ['dml.learning.write'], risk: { level: 'medium', reasons: ['network-learning'] }, evidence: { produces: ['dml.learning-plan', 'dml.work-event'], requires: [] } }),
      cap('dml.learning.inspect', { required_scopes: ['dml.learning.read'], execution_phase: 'read-only' }),
      cap('dml.capability.scan', { required_scopes: ['dml.capability.read'], host_requirements: ['filesystem.read'], execution_phase: 'read-only', evidence: { produces: ['dml.capability-registry'], requires: [] } }),
      cap('dml.capability.inspect', { required_scopes: ['dml.capability.read'], execution_phase: 'read-only', evidence: { produces: ['dml.capability-registry'], requires: [] } }),
      cap('dml.skill.inspect', { required_scopes: ['dml.skill.read'], execution_phase: 'read-only' }),
      cap('dml.project.inspect', { required_scopes: ['project.read'], host_requirements: ['filesystem.read'], execution_phase: 'read-only', evidence: { produces: ['project.snapshot', 'dml.work-event'], requires: [] } }),
      cap('dml.development.run', { required_scopes: ['dml.development.execute'], host_requirements: ['filesystem.read', 'filesystem.write', 'process.spawn'], risk: { level: 'medium', reasons: ['isolated-candidate-code-change', 'test-execution'] }, reversible: true, evidence: { produces: ['learning-plan', 'knowledge-claim', 'reality-branch', 'experiment-record', 'experience-episode', 'skill-hypothesis'], requires: ['project.snapshot'] } }),
      cap('dml.branch.inspect', { required_scopes: ['dml.branch.read'], execution_phase: 'read-only' }),
      cap('dml.skill.form', { required_scopes: ['dml.skill.write'], risk: { level: 'medium', reasons: ['persistent-skill-formation'] }, evidence: { produces: ['skill-capsule'], requires: ['experience-episode', 'skill-hypothesis'] } }),
      cap('dml.skill.transfer.verify', { required_scopes: ['dml.skill.write'], host_requirements: ['process.spawn'], risk: { level: 'medium', reasons: ['test-execution'] }, evidence: { produces: ['skill-transfer-verification'], requires: ['skill-capsule'] } }),
      cap('dml.result.preview', { required_scopes: ['dml.result.read'], execution_phase: 'read-only' }),
      cap('dml.result.approve', { required_scopes: ['dml.result.approve'], risk: { level: 'high', reasons: ['formal-result-adoption'] }, reversible: false, evidence: { produces: ['aaf.approval', 'dml.work-event'], requires: ['dml.artifact'] } }),
      cap('dml.result.reject', { required_scopes: ['dml.result.approve'], evidence: { produces: ['dml.work-event'], requires: ['dml.artifact'] } }),
      cap('dml.result.alternate', { required_scopes: ['dml.goal.write'] }),
      cap('dml.message.send', { required_scopes: ['dml.message.write'] }),
      cap('dml.project.select', { required_scopes: ['dml.project.select'] }),
      cap('dml.system.pause', { required_scopes: ['dml.system.control'], risk: { level: 'medium', reasons: ['global-runtime-state-change'] } }),
      cap('dml.system.resume', { required_scopes: ['dml.system.control'], risk: { level: 'medium', reasons: ['global-runtime-state-change'] } }),
    ],
  });
}
