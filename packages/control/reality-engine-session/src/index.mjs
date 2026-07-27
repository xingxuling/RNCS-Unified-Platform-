import {
  authorize as authorizeEnvelope,
  commit as commitEnvelope,
  newProposal,
  rootHash,
  verify as verifyEnvelope,
  without,
} from '@taowind/rncs-core-contract';

export const REALITY_ENGINE_SESSION_FORMAT = 'rncs.reality-engine-session.v0.1';
export const REALITY_ENGINE_SESSION_VERSION = '0.1.0';
export const ENGINE_SIMULATION_FORMAT = 'rncs.reality-engine-simulation.v0.1';
export const ENGINE_ROLLBACK_FORMAT = 'rncs.reality-engine-rollback.v0.1';
export const ZERO_ROOT = '0'.repeat(64);

const clone = value => structuredClone(value);
const isRoot = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const requireCondition = (condition, code) => {
  if (!condition) throw new RealityEngineSessionError(code);
};

export class RealityEngineSessionError extends Error {
  constructor(code, message = code, details = null) {
    super(message);
    this.name = 'RealityEngineSessionError';
    this.code = code;
    this.details = details;
  }
}

function normalizeRoot(value, fallback) {
  if (isRoot(value)) return value;
  return rootHash(value ?? fallback);
}

function normalizeSubject(subject = {}) {
  const subjectId = String(subject.subject_id ?? subject.id ?? '').trim();
  requireCondition(subjectId.length > 0, 'ENGINE_SUBJECT_REQUIRED');
  return {
    subject_id: subjectId,
    kind: String(subject.kind ?? 'system'),
    roles: [...new Set((subject.roles ?? []).map(String))].sort(),
    responsibility_boundary: String(subject.responsibility_boundary ?? 'engine-session'),
    ...(subject.identity_root ? { identity_root: String(subject.identity_root) } : {}),
  };
}

function defaultFoundationGovernance() {
  return {
    explicitVariables: [],
    uncertainty: { status: 'declared', variables: [] },
    providerCapabilities: { required: [], externalSideEffects: false },
    authorityRequirements: [{ action: 'commit', scope: 'rncs.engine-session' }],
    irreversibleEffects: [{ effect: 'advance-reality-generation', reversible: false }],
    invariants: [{ name: 'candidate-root-bound', expression: 'proposal_root remains stable before commit' }],
    adaptiveInvariantField: { version: '0.1.0', mode: 'static-plus-runtime', active: [] },
    causalParents: [],
    evidenceRequirements: [{ kind: 'engine-simulation', required: true }],
  };
}

export function createEngineProposalInput({
  realityId = 'reality:engine-session',
  baseGeneration = 0,
  baseGenerationRoot = ZERO_ROOT,
  transitionId = 'transition:engine-session-0001',
  subject = { subject_id: 'subject:engine-session', kind: 'system' },
  intent = {
    intent_id: 'intent:engine-session',
    source: 'engine session candidate',
    goals: [{ type: 'reality.transition.candidate' }],
    constraints: ['simulate-before-commit'],
  },
  capabilityPlan = {
    plan_id: 'plan:engine-session',
    capabilities: [{ capability_id: 'rncs.engine-session.transition' }],
    host_bindings: [],
    required_scopes: ['rncs.engine-session.commit'],
  },
  inputs = [],
  operations = [],
  causalBasis = { events: [], rules: [], simulation_refs: [] },
  evidence = { nodes: [], edges: [] },
  hostStateRefs = [],
  foundationGovernance = defaultFoundationGovernance(),
  extensions = {},
} = {}) {
  return {
    reality_id: String(realityId),
    base_generation: Number(baseGeneration),
    base_generation_root: String(baseGenerationRoot),
    transition_id: String(transitionId),
    subject: normalizeSubject(subject),
    intent: clone(intent),
    capability_plan: clone(capabilityPlan),
    inputs: clone(inputs),
    provisional_delta: { operations: clone(operations) },
    causal_basis: clone(causalBasis),
    evidence: clone(evidence),
    host_state_refs: clone(hostStateRefs),
    foundation_governance: clone(foundationGovernance),
    extensions: clone(extensions),
  };
}

function envelopeSummary(envelope) {
  return envelope
    ? {
      proposal_root: envelope.proposal_root,
      authority_root: envelope.authority?.decision_root ?? null,
      commit_root: envelope.commit?.commit_root ?? null,
      phase: envelope.phase,
    }
    : { proposal_root: null, authority_root: null, commit_root: null, phase: null };
}

function compactNetworkReceipt(network) {
  if (!network) return null;
  return {
    status: 'started',
    session_id: network.sessionId ?? network.session_id ?? null,
    compilation_root: network.compilationRoot ?? network.compilation_root ?? null,
    project_root: network.projectRoot ?? network.project_root ?? null,
    world_config_root: network.worldConfigRoot ?? network.world_config_root ?? null,
  };
}

export function verifyEngineSessionSnapshot(snapshot) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  check(snapshot?.format === REALITY_ENGINE_SESSION_FORMAT, 'SESSION_FORMAT_INVALID');
  check(snapshot?.version === REALITY_ENGINE_SESSION_VERSION, 'SESSION_VERSION_INVALID');
  check(typeof snapshot?.session_id === 'string' && snapshot.session_id.length > 0, 'SESSION_ID_INVALID');
  for (const event of snapshot?.events ?? []) {
    const eventRoot = event.event_root;
    const payload = without(event, 'event_root');
    check(isRoot(eventRoot) && rootHash(payload) === eventRoot, 'EVENT_ROOT_MISMATCH');
  }
  if (snapshot?.envelope) {
    const verification = verifyEnvelope(snapshot.envelope);
    check(verification.valid, `ENVELOPE_INVALID:${verification.errors.join(',')}`);
  }
  if (snapshot?.simulation) {
    const simulationRoot = snapshot.simulation.simulation_root;
    check(isRoot(simulationRoot), 'SIMULATION_ROOT_INVALID');
    check(rootHash(without(snapshot.simulation, 'simulation_root')) === simulationRoot, 'SIMULATION_ROOT_MISMATCH');
  }
  if (snapshot?.session_root) {
    const sessionRootPayload = snapshot.session_root_payload ?? without(snapshot, 'session_root');
    check(rootHash(sessionRootPayload) === snapshot.session_root, 'SESSION_ROOT_MISMATCH');
  }
  return { valid: errors.length === 0, errors, session_root: snapshot?.session_root ?? null };
}

export class RealityEngineSession {
  constructor({
    sessionId = 'engine-session:default',
    realityId = 'reality:engine-session',
    generation = 0,
    generationRoot = ZERO_ROOT,
    stateRoot = null,
    subject = { subject_id: 'subject:engine-session', kind: 'system' },
    clock = () => 0,
    networkRuntime = null,
    networkCompilation = null,
    networkOptions = {},
  } = {}) {
    requireCondition(Number.isSafeInteger(Number(generation)) && Number(generation) >= 0, 'ENGINE_GENERATION_INVALID');
    this.session_id = String(sessionId);
    this.reality_id = String(realityId);
    this.subject = normalizeSubject(subject);
    this.generation = Number(generation);
    this.generation_root = normalizeRoot(generationRoot, { reality_id: this.reality_id, generation: this.generation });
    this.state_root = normalizeRoot(stateRoot, this.generation_root);
    this.clock = typeof clock === 'function' ? clock : () => 0;
    this.networkRuntime = networkRuntime;
    this.networkCompilation = networkCompilation;
    this.networkOptions = clone(networkOptions);
    this.status = 'draft';
    this.envelope = null;
    this.candidate_root = null;
    this.simulation = null;
    this.network = null;
    this.events = [];
  }

  record(type, payload = {}) {
    const event = {
      format: 'rncs.reality-engine-session-event.v0.1',
      session_id: this.session_id,
      sequence: this.events.length + 1,
      type,
      ...clone(payload),
    };
    event.event_root = rootHash(event);
    this.events.push(event);
    return clone(event);
  }

  propose(input = {}) {
    requireCondition(this.status === 'draft', 'ENGINE_PROPOSAL_PHASE_INVALID');
    const proposal = newProposal({
      ...clone(input),
      reality_id: this.reality_id,
      base_generation: input.base_generation ?? this.generation,
      base_generation_root: input.base_generation_root ?? this.generation_root,
      subject: input.subject ?? this.subject,
    });
    requireCondition(proposal.base_generation.reality_id === this.reality_id, 'ENGINE_REALITY_MISMATCH');
    requireCondition(proposal.base_generation.generation === this.generation, 'ENGINE_BASE_GENERATION_MISMATCH');
    requireCondition(proposal.base_generation.generation_root === this.generation_root, 'ENGINE_BASE_ROOT_MISMATCH');
    const verification = verifyEnvelope(proposal);
    requireCondition(verification.valid, `ENGINE_PROPOSAL_INVALID:${verification.errors.join(',')}`);
    this.envelope = proposal;
    this.candidate_root = rootHash({
      format: REALITY_ENGINE_SESSION_FORMAT,
      session_id: this.session_id,
      proposal_root: proposal.proposal_root,
      base_generation: proposal.base_generation,
    });
    this.status = 'proposed';
    this.record('candidate.proposed', {
      candidate_root: this.candidate_root,
      proposal_root: proposal.proposal_root,
    });
    return clone(proposal);
  }

  simulate({
    valid = true,
    targetGeneration = this.generation + 1,
    afterStateRoot = null,
    outputs = [],
    receiptRefs = [],
    networkCompilation = this.networkCompilation,
    diagnostics = [],
  } = {}) {
    requireCondition(this.status === 'proposed', 'ENGINE_SIMULATION_PHASE_INVALID');
    const target = Number(targetGeneration);
    requireCondition(Number.isSafeInteger(target) && target > this.generation, 'ENGINE_TARGET_GENERATION_INVALID');
    const targetRoot = normalizeRoot(afterStateRoot, {
      candidate_root: this.candidate_root,
      outputs,
      target_generation: target,
    });
    const base = {
      format: ENGINE_SIMULATION_FORMAT,
      session_id: this.session_id,
      transition_id: this.envelope.transition_id,
      candidate_root: this.candidate_root,
      base_generation: this.generation,
      target_generation: target,
      before_state_root: this.state_root,
      after_state_root: targetRoot,
      valid: Boolean(valid),
      output_roots: outputs.map(output => normalizeRoot(output?.root, output)),
      receipt_refs: clone(receiptRefs),
      network_compilation_root: networkCompilation?.compilation_root ?? null,
      diagnostics: clone(diagnostics),
    };
    base.simulation_root = rootHash(base);
    this.simulation = base;
    this.status = base.valid ? 'simulated' : 'simulation_failed';
    this.record('candidate.simulated', {
      simulation_root: base.simulation_root,
      valid: base.valid,
      target_generation: base.target_generation,
    });
    return clone(base);
  }

  authorize({
    status = 'approved',
    resolver,
    claims = [],
    constraints = [],
    reason = '',
  } = {}) {
    requireCondition(this.status === 'simulated', 'ENGINE_AUTHORITY_PHASE_INVALID');
    requireCondition(typeof resolver === 'string' && resolver.length > 0, 'ENGINE_RESOLVER_REQUIRED');
    const authorityClaims = [
      ...clone(claims),
      { kind: 'engine-simulation', simulation_root: this.simulation.simulation_root },
    ];
    const envelope = authorizeEnvelope(this.envelope, {
      status,
      resolver,
      claims: authorityClaims,
      constraints,
      reason,
    });
    const verification = verifyEnvelope(envelope);
    requireCondition(verification.valid, `ENGINE_AUTHORITY_INVALID:${verification.errors.join(',')}`);
    this.envelope = envelope;
    this.status = envelope.phase === 'authorized' ? 'authorized' : 'rejected';
    this.record('authority.resolved', {
      status: envelope.authority.status,
      decision_root: envelope.authority.decision_root,
    });
    return clone(envelope);
  }

  async commit({
    generation = this.simulation?.target_generation,
    generationRoot = this.simulation?.after_state_root,
    receiptRefs = [],
    apply = null,
    startNetwork = true,
  } = {}) {
    requireCondition(this.status === 'authorized', 'ENGINE_COMMIT_PHASE_INVALID');
    const nextGeneration = Number(generation);
    const nextRoot = normalizeRoot(generationRoot, this.simulation?.after_state_root);
    requireCondition(Number.isSafeInteger(nextGeneration) && nextGeneration > this.generation, 'ENGINE_COMMIT_GENERATION_INVALID');
    requireCondition(isRoot(nextRoot), 'ENGINE_COMMIT_ROOT_INVALID');
    const refs = [
      ...clone(this.simulation.receipt_refs ?? []),
      { kind: 'engine-simulation', root: this.simulation.simulation_root },
      ...clone(receiptRefs),
    ];
    let committed;
    try {
      committed = commitEnvelope(this.envelope, {
        generation: nextGeneration,
        generation_root: nextRoot,
        receipt_refs: refs,
      });
    } catch (error) {
      this.record('commit.rejected', { code: error.code ?? 'COMMIT_REJECTED', message: error.message });
      throw error;
    }
    this.envelope = committed;
    try {
      const applied = typeof apply === 'function'
        ? await apply({
          sessionId: this.session_id,
          candidateRoot: this.candidate_root,
          simulation: clone(this.simulation),
          envelope: clone(committed),
        })
        : null;
      if (applied?.stateRoot) requireCondition(applied.stateRoot === nextRoot, 'ENGINE_APPLY_ROOT_MISMATCH');
      let network = null;
      if (startNetwork && this.networkRuntime && this.networkCompilation) {
        requireCondition(typeof this.networkRuntime.createSessionFromCompilation === 'function', 'ENGINE_NETWORK_ADAPTER_INVALID');
        network = await this.networkRuntime.createSessionFromCompilation({
          sessionId: this.session_id,
          compilation: clone(this.networkCompilation),
          network: clone(this.networkOptions),
          clock: this.clock,
        });
        this.network = compactNetworkReceipt(network);
      }
      this.generation = nextGeneration;
      this.generation_root = nextRoot;
      this.state_root = nextRoot;
      this.status = 'committed';
      this.record('commit.completed', {
        commit_root: committed.commit.commit_root,
        generation: nextGeneration,
        network: this.network,
      });
      return {
        envelope: clone(committed),
        applied: clone(applied),
        network: clone(this.network),
        snapshot: this.snapshot(),
      };
    } catch (error) {
      this.status = 'commit_partial';
      const failure = {
        code: error.code ?? 'ENGINE_COMMIT_EFFECT_FAILED',
        message: error.message,
        commit_root: committed.commit.commit_root,
      };
      this.record('commit.effect-failed', failure);
      throw new RealityEngineSessionError('ENGINE_COMMIT_EFFECT_FAILED', error.message, failure);
    }
  }

  rollback({ reason = 'candidate-withdrawn' } = {}) {
    requireCondition(this.status !== 'committed' && this.status !== 'commit_partial', 'ENGINE_COMMITTED_REQUIRES_COMPENSATING_TRANSITION');
    const rollback = {
      format: ENGINE_ROLLBACK_FORMAT,
      session_id: this.session_id,
      prior_status: this.status,
      candidate_root: this.candidate_root,
      simulation_root: this.simulation?.simulation_root ?? null,
      reason: String(reason),
    };
    rollback.rollback_root = rootHash(rollback);
    this.status = 'rolled_back';
    this.record('candidate.rolled-back', { rollback_root: rollback.rollback_root, reason: rollback.reason });
    return { ...clone(rollback), snapshot: this.snapshot() };
  }

  snapshot() {
    const snapshot = {
      format: REALITY_ENGINE_SESSION_FORMAT,
      version: REALITY_ENGINE_SESSION_VERSION,
      session_id: this.session_id,
      reality_id: this.reality_id,
      subject: clone(this.subject),
      status: this.status,
      generation: this.generation,
      generation_root: this.generation_root,
      state_root: this.state_root,
      candidate_root: this.candidate_root,
      envelope: this.envelope ? clone(this.envelope) : null,
      simulation: this.simulation ? clone(this.simulation) : null,
      network: clone(this.network),
      events: clone(this.events),
    };
    snapshot.session_root = rootHash(snapshot);
    return snapshot;
  }

  verify() {
    return verifyEngineSessionSnapshot(this.snapshot());
  }
}

export function createRealityEngineSession(options = {}) {
  return new RealityEngineSession(options);
}
