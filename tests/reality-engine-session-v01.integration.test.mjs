import assert from 'node:assert/strict';
import test from 'node:test';
import { rootHash } from '@taowind/rncs-core-contract';
import { createRealityEngineSession, createEngineProposalInput } from '@taowind/reality-engine-session';
import { RealityNetworkRuntime } from '@taowind/reality-network-runtime';
import { createStudioNetworkWorld } from '../examples/studio-authored-network-world-v03/project.mjs';

test('RNCS engine session commits a Studio-authored world before starting network authority', async () => {
  const { compilation } = createStudioNetworkWorld();
  const generationRoot = rootHash({
    projectRoot: compilation.project_root,
    worldConfigRoot: compilation.world_config_root,
    generation: 0,
  });
  const targetRoot = rootHash({
    projectRoot: compilation.project_root,
    worldConfigRoot: compilation.world_config_root,
    generation: 1,
    phase: 'running',
  });
  const networkRuntime = new RealityNetworkRuntime();
  const session = createRealityEngineSession({
    sessionId: 'engine-session:studio-network-v01',
    realityId: compilation.world_id,
    generationRoot,
    stateRoot: compilation.world_config_root,
    subject: {
      subject_id: 'subject:updia-root',
      kind: 'updia-root',
      roles: ['planner', 'world-authority'],
      responsibility_boundary: 'candidate-until-rncs-commit',
    },
    networkRuntime,
    networkCompilation: compilation,
    clock: () => 0,
  });
  const proposalInput = createEngineProposalInput({
    realityId: compilation.world_id,
    baseGenerationRoot: generationRoot,
    transitionId: 'transition:studio-network-v01',
    subject: session.subject,
    intent: {
      intent_id: 'intent:studio-network-v01',
      source: 'UPDIA grounded world candidate',
      goals: [{ type: 'network.world.start', world_id: compilation.world_id }],
      constraints: ['rcl-rfe-aaf-bound', 'simulate-before-commit'],
    },
    capabilityPlan: {
      plan_id: 'plan:studio-network-v01',
      capabilities: [{ capability_id: 'network.authority.start' }],
      host_bindings: [{ host_id: 'rncs-network-runtime' }],
      required_scopes: ['rncs.engine-session.commit', 'network.world.start'],
    },
    operations: [{
      op: 'start-network-authority',
      world_id: compilation.world_id,
      compilation_root: compilation.compilation_root,
    }],
    causalBasis: {
      events: [{ event_id: 'event:studio-compiled', kind: 'studio-network-compilation' }],
      rules: [{ rule_id: 'compiled-world-root', expression: 'compilation_root is verified before start' }],
      simulation_refs: [compilation.compilation_root],
    },
    evidence: {
      nodes: [
        { evidence_id: 'evidence:studio-project', kind: 'studio-project-root', source: compilation.project_root },
        { evidence_id: 'evidence:network-compilation', kind: 'network-compilation-root', source: compilation.compilation_root },
      ],
      edges: [],
    },
  });
  session.propose(proposalInput);
  session.simulate({
    afterStateRoot: targetRoot,
    networkCompilation: compilation,
    receiptRefs: [{ kind: 'studio-network-compilation', root: compilation.compilation_root }],
  });
  session.authorize({
    resolver: 'subject:updia-root',
    claims: ['studio-compilation-verified', 'network-authority-explicitly-approved'],
  });
  const result = await session.commit();
  const health = networkRuntime.getSessionHealth({ sessionId: 'engine-session:studio-network-v01' });

  assert.equal(result.envelope.phase, 'committed');
  assert.equal(result.envelope.commit.result_generation.generation, 1);
  assert.equal(result.snapshot.network.session_id, 'engine-session:studio-network-v01');
  assert.equal(health.server.status, 'healthy');
  assert.equal(health.source.compilationRoot, compilation.compilation_root);
  assert.equal(session.verify().valid, true);
});
