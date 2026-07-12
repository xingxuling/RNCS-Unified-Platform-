import { clone, DMLError, hash, now, seal, uniq, verifySeal } from './canonical.mjs';

const actionKinds = new Set([
  'dml.goal.create', 'dml.goal.pause', 'dml.goal.resume', 'dml.goal.retry', 'dml.goal.inspect', 'dml.task.execute', 'dml.task.inspect',
  'dml.learning.start', 'dml.learning.inspect', 'dml.capability.scan', 'dml.capability.inspect', 'dml.skill.inspect',
  'dml.project.inspect', 'dml.result.preview', 'dml.result.approve',
  'dml.result.reject', 'dml.result.alternate', 'dml.system.pause', 'dml.system.resume',
  'dml.message.send', 'dml.project.select', 'dml.development.run', 'dml.branch.inspect',
  'dml.skill.form', 'dml.skill.transfer.verify',
]);

export function normalizeSemanticAction(raw) {
  const input = clone(raw ?? {});
  const action = {
    format: 'dml.semantic-action.v0.4',
    action_id: String(input.action_id || `action:${hash({ raw: input, at: input.created_at || now() }).slice(0, 24)}`),
    type: String(input.type || ''),
    subject: {
      subject_id: String(input.subject?.subject_id || 'subject:dml:blue-tianji-001'),
      kind: String(input.subject?.kind || 'digital-mechanical-life'),
      roles: uniq(input.subject?.roles || ['collaborator']),
      scopes: uniq(input.subject?.scopes || []),
    },
    human_principal: input.human_principal ? {
      subject_id: String(input.human_principal.subject_id || ''),
      roles: uniq(input.human_principal.roles || []),
      scopes: uniq(input.human_principal.scopes || []),
    } : null,
    project_ref: input.project_ref ? {
      project_id: String(input.project_ref.project_id || ''),
      generation: Number.isInteger(input.project_ref.generation) ? input.project_ref.generation : 0,
      root: input.project_ref.root ? String(input.project_ref.root) : null,
    } : null,
    goal_ref: input.goal_ref ? String(input.goal_ref) : null,
    trigger: String(input.trigger || 'workbench'),
    payload: clone(input.payload || {}),
    constraints: clone(input.constraints || {}),
    authority: {
      max_risk: String(input.authority?.max_risk || (input.type === 'dml.result.approve' ? 'high' : 'medium')),
      require_reversible: Boolean(input.authority?.require_reversible ?? (input.type !== 'dml.result.approve')),
      approval_mode: String(input.authority?.approval_mode || 'when-required'),
    },
    created_at: String(input.created_at || now()),
  };
  if (!actionKinds.has(action.type)) throw new DMLError('ACTION_TYPE_UNSUPPORTED', action.type);
  if (!action.subject.subject_id) throw new DMLError('ACTION_SUBJECT_REQUIRED');
  return seal(action, 'action_root');
}

export function validateSemanticAction(value) {
  try {
    const normalized = normalizeSemanticAction(value);
    return { valid: !value.action_root || normalized.action_root === value.action_root, errors: (!value.action_root || normalized.action_root === value.action_root) ? [] : ['action_root mismatch'] };
  } catch (error) {
    return { valid: false, errors: [`${error.code || 'ERROR'}: ${error.message}`] };
  }
}

const eventTypes = new Set([
  'message.added', 'project.selected', 'goal.created', 'goal.status.changed', 'plan.created',
  'step.started', 'step.progressed', 'step.completed', 'step.failed', 'file.observed',
  'file.changed', 'artifact.produced', 'approval.requested', 'approval.resolved',
  'transition.committed', 'skill.formed', 'learning.started', 'learning.updated',
  'system.paused', 'system.resumed', 'notice.added',
  'learning.plan.created', 'source.recorded', 'knowledge.claimed',
  'experiment.completed', 'branch.created', 'branch.changed', 'branch.tested',
  'branch.compared', 'branch.committed', 'experience.recorded', 'skill.hypothesized',
  'skill.transfer.verified',
  'capability.scanned', 'capability.plan.created', 'capability.gap.detected',
  'capability.provider.failed', 'capability.plan.revised', 'capability.goal.blocked', 'capability.goal.resumed',
]);

export function normalizeWorkEvent(raw) {
  const input = clone(raw ?? {});
  const event = {
    format: 'dml.work-event.v0.4',
    event_id: String(input.event_id || `event:${hash({ input, at: input.created_at || now() }).slice(0, 24)}`),
    sequence: Number.isInteger(input.sequence) ? input.sequence : 0,
    subject_id: String(input.subject_id || 'subject:dml:blue-tianji-001'),
    project_id: input.project_id ? String(input.project_id) : null,
    goal_id: input.goal_id ? String(input.goal_id) : null,
    type: String(input.type || ''),
    phase: String(input.phase || 'work'),
    status: String(input.status || 'informational'),
    message: String(input.message || ''),
    data: clone(input.data || {}),
    refs: clone(input.refs || {}),
    evidence: clone(input.evidence || []),
    caused_by: input.caused_by ? String(input.caused_by) : null,
    created_at: String(input.created_at || now()),
  };
  if (!eventTypes.has(event.type)) throw new DMLError('EVENT_TYPE_UNSUPPORTED', event.type);
  if (!event.subject_id) throw new DMLError('EVENT_SUBJECT_REQUIRED');
  return seal(event, 'event_root');
}

export function validateWorkEvent(value) {
  try {
    if (value.event_root && verifySeal(value, 'event_root')) return { valid: true, errors: [] };
    const normalized = normalizeWorkEvent(value);
    return { valid: !value.event_root || normalized.event_root === value.event_root, errors: (!value.event_root || normalized.event_root === value.event_root) ? [] : ['event_root mismatch'] };
  } catch (error) {
    return { valid: false, errors: [`${error.code || 'ERROR'}: ${error.message}`] };
  }
}

export function normalizeProjection(raw) {
  const value = clone(raw ?? {});
  const projection = {
    format: 'dml.workbench-projection.v0.4',
    projection_id: String(value.projection_id || 'projection:dml:workbench'),
    subject_id: String(value.subject_id || 'subject:dml:blue-tianji-001'),
    source_event_sequence: Number.isInteger(value.source_event_sequence) ? value.source_event_sequence : 0,
    generated_at: String(value.generated_at || now()),
    state: clone(value.state || {}),
  };
  return seal(projection, 'projection_root');
}
