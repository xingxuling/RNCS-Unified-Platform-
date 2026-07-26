import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEngineProposalInput,
  createRealityEngineSession,
  verifyEngineSessionSnapshot,
} from '../src/index.mjs';

const targetRoot = 'a'.repeat(64);

function proposalInput(baseGenerationRoot = '0'.repeat(64)) {
  return createEngineProposalInput({
    realityId: 'reality:test-engine-session',
    baseGenerationRoot,
    transitionId: 'transition:test-engine-session-0001',
    subject: {
      subject_id: 'subject:test-root',
      kind: 'updia-root',
      roles: ['planner', 'root-authority'],
      responsibility_boundary: 'candidate-only-until-authorized',
    },
    intent: {
      intent_id: 'intent:test-engine-session',
      source: 'UPDIA grounded world transition',
      goals: [{ type: 'world.state.advance', target: 'frontier' }],
      constraints: ['model-cannot-commit'],
    },
    capabilityPlan: {
      plan_id: 'plan:test-engine-session',
      capabilities: [{ capability_id: 'rncs.engine-session.transition' }],
      host_bindings: [{ host_id: 'rncs-network-runtime' }],
      required_scopes: ['rncs.engine-session.commit'],
    },
    operations: [{ op: 'replace', target: 'world:frontier', path: '/phase', after: 'frontier' }],
    causalBasis: {
      events: [{ event_id: 'event:grounded-plan', kind: 'grounded-planning' }],
      rules: [{ rule_id: 'frontier-law', expression: 'energy >= 0' }],
      simulation_refs: [],
    },
    evidence: {
      nodes: [{ evidence_id: 'evidence:grounding', kind: 'rgr-packet', source: 'updia-native-rgr' }],
      edges: [],
    },
  });
}

test('engine session keeps candidate effects inert until explicit commit', async () => {
  let applied = 0;
  let networkStarted = 0;
  const networkRuntime = {
    async createSessionFromCompilation({ sessionId, compilation }) {
      networkStarted += 1;
      return {
        sessionId,
        compilationRoot: compilation.compilation_root,
        projectRoot: compilation.project_root,
        worldConfigRoot: compilation.world_config_root,
      };
    },
  };
  const compilation = {
    compilation_root: 'b'.repeat(64),
    project_root: 'c'.repeat(64),
    world_config_root: 'd'.repeat(64),
  };
  const session = createRealityEngineSession({
    sessionId: 'engine-session:test-0001',
    realityId: 'reality:test-engine-session',
    generationRoot: '1'.repeat(64),
    stateRoot: '2'.repeat(64),
    subject: proposalInput('1'.repeat(64)).subject,
    networkRuntime,
    networkCompilation: compilation,
  });
  session.propose(proposalInput('1'.repeat(64)));
  assert.equal(session.snapshot().status, 'proposed');
  assert.equal(applied, 0);
  session.simulate({ afterStateRoot: targetRoot, networkCompilation: compilation });
  session.authorize({ resolver: 'subject:test-root', claims: ['human-approved-test'] });
  const committed = await session.commit({
    apply: ({ envelope }) => {
      applied += 1;
      return { stateRoot: envelope.commit.result_generation.generation_root };
    },
  });
  assert.equal(applied, 1);
  assert.equal(networkStarted, 1);
  assert.equal(committed.envelope.phase, 'committed');
  assert.equal(committed.snapshot.generation, 1);
  assert.equal(committed.snapshot.state_root, targetRoot);
  assert.equal(committed.snapshot.network.session_id, 'engine-session:test-0001');
  assert.deepEqual(session.verify(), { valid: true, errors: [], session_root: committed.snapshot.session_root });
  assert.equal(verifyEngineSessionSnapshot(committed.snapshot).valid, true);
  assert.throws(() => session.rollback(), /ENGINE_COMMITTED_REQUIRES_COMPENSATING_TRANSITION/);
});

test('engine session rejects commit before authority and supports rollback', async () => {
  const session = createRealityEngineSession({
    sessionId: 'engine-session:test-rollback',
    realityId: 'reality:test-engine-session',
    generationRoot: '3'.repeat(64),
    subject: proposalInput('3'.repeat(64)).subject,
  });
  session.propose(proposalInput('3'.repeat(64)));
  session.simulate({ valid: false, diagnostics: ['physics-invariant-failed'] });
  await assert.rejects(() => session.commit(), /ENGINE_COMMIT_PHASE_INVALID/);
  assert.throws(() => session.authorize({ resolver: 'subject:test-root' }), /ENGINE_AUTHORITY_PHASE_INVALID/);
  const rollback = session.rollback({ reason: 'simulation-invariant-failed' });
  assert.equal(rollback.snapshot.status, 'rolled_back');
  assert.equal(rollback.rollback_root.length, 64);
});

test('session snapshot root is deterministic for fixed inputs', () => {
  const make = () => {
    const session = createRealityEngineSession({
      sessionId: 'engine-session:deterministic',
      realityId: 'reality:test-engine-session',
      generationRoot: '4'.repeat(64),
      stateRoot: '5'.repeat(64),
      subject: proposalInput('4'.repeat(64)).subject,
    });
    session.propose(proposalInput('4'.repeat(64)));
    session.simulate({ afterStateRoot: targetRoot });
    session.authorize({ resolver: 'subject:test-root' });
    return session.snapshot();
  };
  assert.deepEqual(make(), make());
});
