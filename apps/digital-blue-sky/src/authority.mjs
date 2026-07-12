import { evaluateAuthority, hash as aafHash, sealApproval, sealPolicyBundle } from '@taowind/agent-authority-fabric';
import { clone, hash, now } from './canonical.mjs';

export function buildProposedEnvelope({ action, negotiation, projectId = 'project:unknown', goalId = null }) {
  const plan = negotiation.plan;
  const proposal = {
    action_root: action.action_root,
    type: action.type,
    payload: action.payload,
    project_id: projectId,
    goal_id: goalId,
    plan_root: plan.plan_root,
  };
  const proposalRoot = hash(proposal);
  const envelope = {
    format: 'rncs.reality-transition-envelope.v0.1',
    contract_version: '0.1.0',
    transition_id: `transition:dml:${proposalRoot.slice(0, 24)}`,
    phase: 'proposed',
    proposal_root: proposalRoot,
    base_generation: {
      reality_id: `reality:dml:${projectId}`,
      generation: action.project_ref?.generation || 0,
      generation_root: action.project_ref?.root || '0'.repeat(64),
    },
    subject: {
      subject_id: action.subject.subject_id,
      kind: action.subject.kind,
      roles: action.subject.roles,
      responsibility_boundary: 'digital-mechanical-life-collaboration',
    },
    intent: {
      intent_id: action.action_id,
      source: action.trigger,
      goals: [{ type: action.type, payload_root: hash(action.payload) }],
      constraints: ['capability-negotiation-required', 'authority-before-state-change'],
      intent_root: hash({ action_id: action.action_id, type: action.type, payload: action.payload }),
    },
    capability_plan: {
      plan_id: `plan:dml:${plan.plan_root.slice(0, 24)}`,
      capabilities: plan.steps.map((step) => ({
        capability_id: step.capability_id,
        provider: step.provider_id,
        required_scopes: step.required_scopes,
        risk: step.risk?.level || 'low',
        reversible: step.reversible,
        cost: step.cost,
      })),
      host_bindings: [{ host_id: 'host:dml-workbench' }],
      required_scopes: plan.required_scopes,
      plan_root: plan.plan_root,
    },
    inputs: [{ kind: 'semantic-action', id: action.action_id, root: action.action_root }],
    provisional_delta: {
      operations: [],
      provisional: true,
      delta_root: hash([]),
    },
    causal_basis: {
      events: [{ event_id: `event:intent:${proposalRoot.slice(0, 16)}`, kind: 'semantic-action-received' }],
      rules: [
        { rule_id: 'cnp-before-execution', expression: 'capability plan must be satisfied' },
        { rule_id: 'aaf-before-execution', expression: 'authority status must be approved' },
      ],
      simulation_refs: [],
      causal_root: hash({ proposal_root: proposalRoot, plan_root: plan.plan_root }),
    },
    authority: { status: 'pending', claims: [], constraints: [] },
    evidence: {
      nodes: [
        { evidence_id: 'evidence:action', kind: 'semantic-action', source: 'DML Core', content_root: action.action_root },
        { evidence_id: 'evidence:plan', kind: 'capability-plan', source: 'CNP v0.1', content_root: plan.plan_root },
      ],
      edges: [{ from: 'evidence:action', to: 'evidence:plan', relation: 'compiled-to' }],
      evidence_root: hash({ action_root: action.action_root, plan_root: plan.plan_root }),
    },
    commit: { status: 'not_committed' },
    projections: [],
    host_state_refs: [],
    extensions: { dml: { action: proposal, semantic_action_root: action.action_root } },
  };
  envelope.envelope_root = aafHash(envelope);
  return envelope;
}

export function defaultPolicyBundle() {
  return sealPolicyBundle({
    bundle_id: 'policy:dml-core-default',
    default_effect: 'deny',
    policies: [
      {
        policy_id: 'allow-dml-low-medium',
        effect: 'allow',
        priority: 10,
        match: { roles_any: ['owner', 'collaborator'], risk_at_most: 'medium' },
        obligations: [{ type: 'evidence-required' }],
      },
      {
        policy_id: 'approve-formal-adoption',
        effect: 'require_approval',
        priority: 60,
        match: { capabilities_any: ['dml.result.approve'] },
        approval: { roles: ['owner'], quorum: 1 },
      },
      {
        policy_id: 'approve-high-risk',
        effect: 'require_approval',
        priority: 70,
        match: { risk_at_least: 'high' },
        approval: { roles: ['owner'], quorum: 1 },
      },
      {
        policy_id: 'deny-critical',
        effect: 'deny',
        priority: 100,
        match: { risk_at_least: 'critical' },
      },
    ],
  });
}

export function decideAuthority({ action, negotiation, envelope, approval = null }) {
  const principal = action.human_principal || action.subject;
  const approvals = [];
  if (approval) {
    approvals.push(sealApproval({
      approval_id: approval.approval_id || `approval:dml:${hash({ root: envelope.proposal_root, at: now() }).slice(0, 20)}`,
      proposal_root: envelope.proposal_root,
      approver_id: approval.approver_id || principal.subject_id,
      approver_roles: approval.approver_roles || principal.roles || ['owner'],
      decision: approval.decision || 'approved',
      issued_at: approval.issued_at || now(),
      expires_at: approval.expires_at || new Date(Date.now() + 3600_000).toISOString(),
    }));
  }
  return evaluateAuthority({
    envelope,
    negotiation,
    policy_bundle: defaultPolicyBundle(),
    approvals,
    identity_scopes: principal.scopes,
    context: {
      now: now(),
      environment: 'local',
      request_id: `authority:${action.action_id}`,
    },
  });
}

export function authoritySummary(decision) {
  return {
    status: decision.status,
    reason: decision.reason,
    decision_root: decision.decision_root,
    proposal_root: decision.proposal_root,
    requirements: clone(decision.requirements || []),
    risk_summary: clone(decision.risk_summary || {}),
  };
}
