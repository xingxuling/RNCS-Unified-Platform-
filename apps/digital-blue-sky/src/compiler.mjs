import { hash } from './canonical.mjs';
import { normalizeSemanticAction } from './contracts.mjs';

const inputTypes = {
  'dml.goal.create': { title: { type: 'string', required: true }, instruction: { type: 'string', required: true } },
  'dml.goal.pause': { goal_id: { type: 'string', required: true } },
  'dml.goal.resume': { goal_id: { type: 'string', required: true } },
  'dml.goal.retry': {},
  'dml.task.execute': { instruction: { type: 'string', required: true }, project_path: { type: 'string', required: false } },
  'dml.task.inspect': {},
  'dml.learning.start': { topic: { type: 'string', required: true } },
  'dml.capability.scan': { project_path: { type: 'string', required: false }, goal: { type: 'string', required: false } },
  'dml.capability.inspect': {},
  'dml.project.inspect': { path: { type: 'string', required: true } },
  'dml.result.approve': { artifact_id: { type: 'string', required: true } },
  'dml.result.reject': { artifact_id: { type: 'string', required: true } },
  'dml.development.run': { project_path: { type: 'string', required: true }, task: { type: 'string', required: false } },
  'dml.branch.inspect': { branch_id: { type: 'string', required: false } },
  'dml.skill.form': { hypothesis_id: { type: 'string', required: true } },
  'dml.skill.transfer.verify': { skill_id: { type: 'string', required: true }, project_path: { type: 'string', required: true } },
};

export function semanticActionToCNPRequest(rawAction, host = {}) {
  const action = normalizeSemanticAction(rawAction);
  const principal = action.human_principal || action.subject;
  return {
    request_id: `request:dml:${action.action_root.slice(0, 24)}`,
    protocol_versions: ['0.1.0'],
    subject: { subject_id: principal.subject_id, scopes: principal.scopes },
    host: {
      host_id: String(host.host_id || 'host:dml-workbench'),
      capabilities: [...new Set([...(host.capabilities || ['display.text', 'input.activate']), ...(action.type === 'dml.project.inspect' || action.type === 'dml.capability.scan' || action.type === 'dml.task.execute' || action.type === 'dml.goal.create' || action.type === 'dml.message.send' ? ['filesystem.read'] : []), ...(action.type === 'dml.development.run' ? ['filesystem.read', 'filesystem.write', 'process.spawn'] : []), ...(action.type === 'dml.skill.transfer.verify' ? ['process.spawn'] : [])])].sort(),
    },
    goals: [{
      goal_id: `goal:${action.action_id}`,
      type: action.type,
      version_range: '^0.1.0',
      inputs: inputTypes[action.type] || {},
    }],
    policy: {
      max_risk: action.authority.max_risk,
      require_reversible: action.authority.require_reversible,
      required_evidence: [],
      minimum_trust: 1,
      cost_budget: {
        cpu_millis: Number(action.constraints.cpu_millis || 100000),
        memory_mb: Number(action.constraints.memory_mb || 4096),
        network_kb: Number(action.constraints.network_kb || 100000),
        monetary_microunits: Number(action.constraints.monetary_microunits || 0),
      },
    },
    constraints: {
      prefer_local: action.constraints.prefer_local ?? true,
      offline_first: action.constraints.offline_first ?? true,
      semantic_action_root: action.action_root,
      project_id: action.project_ref?.project_id || null,
    },
  };
}

export function aipIntentToSemanticAction({ aip, intent_id, payload = {}, subject, human_principal, project_ref }) {
  const intent = aip?.intents?.[intent_id];
  if (!intent) throw Object.assign(new Error(`AIP intent not found: ${intent_id}`), { code: 'AIP_INTENT_NOT_FOUND' });
  return normalizeSemanticAction({
    action_id: `action:aip:${hash({ aip_id: aip.id, intent_id, payload }).slice(0, 24)}`,
    type: intent.goal.type,
    subject,
    human_principal,
    project_ref,
    trigger: `aip:${aip.id}:${intent_id}`,
    payload: { ...(intent.goal.inputs || {}), ...payload },
    constraints: { ...(intent.goal.constraints || {}), aip_id: aip.id, intent_id },
    authority: {
      max_risk: intent.risk || 'medium',
      require_reversible: intent.execution?.failure_policy !== 'fail-fast',
      approval_mode: intent.confirmation ? 'always' : 'when-required',
    },
  });
}
