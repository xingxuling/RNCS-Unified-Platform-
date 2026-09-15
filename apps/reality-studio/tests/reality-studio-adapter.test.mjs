import test from 'node:test';
import assert from 'node:assert/strict';
import { RealityStudioAdapter } from '../src/reality-studio-adapter.mjs';

const findNode = (state, id) => state.graph.nodes.find(node => node.id === id);

test('Reality Studio adapter projects real RNCS runtime state into the Reality Graph', async () => {
  const session = await RealityStudioAdapter.create({ sessionId: 'test:reality-studio-adapter' });
  const initial = session.inspect();

  assert.equal(initial.status, 'ready');
  assert.equal(initial.project.validation.valid, true);
  assert.equal(initial.runtime.status, 'healthy');
  assert.equal(initial.runtime.tick, 0);
  assert.equal(initial.viewport.frame_verified, true);
  assert.equal(initial.viewport.image_available, true);
  assert.equal(findNode(initial, 'world-body').status, 'candidate');
  assert.deepEqual(findNode(initial, 'world-body').metrics, { entities: 6, bodies: 6, unmapped_scene_nodes: 4 });
  assert.equal(findNode(initial, 'agent-hub').status, 'unavailable');
  assert.equal(initial.candidate_reality.status, 'unavailable');
  assert.equal(initial.commit_gate.status, 'locked');
  assert.equal(initial.commit_gate.production_promotion_permitted, false);
  assert.ok(initial.evidence.ledger_root);
  assert.ok(initial.inspector.source_roots.network_compilation_root);
  assert.equal(initial.integration.status, 'recorded');
  assert.equal(initial.integration.entry_count, 0);
  assert.equal(initial.controls.replay.available, false);

  const viewport = await session.command('viewport');
  assert.match(viewport.viewport_png_data_url, /^data:image\/png;base64,/);
  assert.deepEqual(Buffer.from(viewport.viewport_png_data_url.split(',')[1], 'base64').subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  const beforeRoot = initial.runtime.state_root;
  const stepped = await session.command('step', {
    behavior_input: { move_right: true },
    network_input: { player_id: 'blue', command: { type: 'move', x: 1000000, z: 0 } },
  });
  assert.equal(stepped.runtime.tick, 1);
  assert.notEqual(stepped.runtime.state_root, beforeRoot);
  assert.equal(stepped.runtime.clients.blue.syncStatus, 'synchronized');
  assert.ok(stepped.runtime.transport.sent > 0);
  assert.ok(stepped.event_tail.some(event => event.type === 'runtime.step'));
  assert.equal(stepped.integration.entry_count, 1);
  assert.equal(stepped.integration.entries[0].tick_aligned, true);
  assert.equal(stepped.integration.entries[0].network_input_present, true);
  assert.ok(stepped.integration.timeline_root);
  assert.equal(stepped.controls.replay.available, true);

  const snapshot = await session.command('snapshot', { label: 'adapter-test-snapshot' });
  assert.equal(snapshot.snapshots.length, 1);
  assert.ok(snapshot.snapshots[0].snapshot_root);
  assert.ok(snapshot.snapshots[0].network_checkpoint_root);
  assert.ok(snapshot.snapshots[0].behavior_checkpoint_root);

  const replay = await session.command('replay', { verify: true });
  assert.equal(replay.replay.deterministic, true);
  assert.equal(replay.replay.status, 'verified');
  assert.ok(replay.replay.replay_root);
  assert.equal(replay.replay.scope, 'isolated-behavior-network-replay');
  assert.equal(replay.replay.canonical_state_mutated, false);
  assert.equal(replay.replay.active_runtime_unchanged, true);
  assert.equal(replay.replay.checks.length, 1);
  assert.equal(replay.replay.checks[0].behavior_match, true);
  assert.equal(replay.replay.checks[0].network_match, true);
  assert.equal(replay.replay.checks[0].receipt_match, true);
  assert.equal(replay.replay.checks[0].entry_integrity_match, true);
  assert.equal(replay.controls.replay.scope, 'isolated-behavior-network-replay');
  assert.equal(replay.event_tail.at(-1).details.scope, 'isolated-behavior-network-replay');
  assert.equal(replay.runtime.state_root, stepped.runtime.state_root);
  assert.equal(replay.evidence.entries.find(entry => entry.entry_id === 'integrated-replay').status, 'verified');
});

test('Reality Studio reports an isolated replay mismatch without changing the active runtime', async () => {
  const session = await RealityStudioAdapter.create({ sessionId: 'test:reality-studio-integrated-replay-mismatch' });
  const stepped = await session.command('step', {
    behavior_input: { move_right: true },
    network_input: { player_id: 'blue', command: { type: 'move', x: 1000000, z: 0 } },
  });
  const activeBefore = stepped.runtime.state_root;
  const epoch = session._activeIntegrationEpoch();
  epoch.entries[0].network_state_root = 'tampered-network-state-root';

  const replay = await session.command('replay', { verify: true });
  assert.equal(replay.replay.status, 'failed');
  assert.equal(replay.replay.deterministic, false);
  assert.equal(replay.replay.canonical_state_mutated, false);
  assert.equal(replay.replay.active_runtime_unchanged, true);
  assert.equal(replay.replay.checks[0].network_match, false);
  assert.equal(replay.replay.checks[0].entry_integrity_match, false);
  assert.equal(replay.runtime.state_root, activeBefore);
  assert.equal(replay.evidence.entries.find(entry => entry.entry_id === 'integrated-replay').status, 'failed');
  assert.equal(replay.gaps.find(gap => gap.code === 'GAP_NETWORK_REPLAY_COUPLING').status, 'failed');
});

test('Reality Studio candidate path keeps authority and confirmation as separate gates', async () => {
  const session = await RealityStudioAdapter.create({ sessionId: 'test:reality-studio-candidate' });
  const base = session.inspect();
  const baseProjectRoot = base.inspector.source_roots.project_root;
  const baseIntegrationEpochRoot = base.integration.epoch_root;

  const proposed = await session.command('candidate-propose', {
    patches: [{ op: 'set', path: 'identity.title', value: 'Adapter Candidate Reality' }],
  });
  assert.equal(proposed.candidate_reality.phase, 'simulated');
  assert.equal(proposed.candidate_reality.deterministic, true);
  assert.equal(proposed.commit_gate.status, 'locked');

  await assert.rejects(
    () => session.command('candidate-commit', { confirmed: true }),
    error => error.code === 'LIVE_UPDATE_COMMIT_PHASE_INVALID',
  );

  const authorized = await session.command('candidate-authorize', {
    resolver: 'local-ui:adapter-test',
    reason: 'Automated local candidate gate test',
  });
  assert.equal(authorized.candidate_reality.phase, 'authorized');
  assert.equal(authorized.commit_gate.status, 'awaiting-explicit-confirmation');
  assert.equal(authorized.commit_gate.local_candidate_commit_ready, true);
  assert.equal(authorized.commit_gate.commit_permitted, false);

  await assert.rejects(
    () => session.command('candidate-commit', { confirmed: false }),
    error => error.code === 'STUDIO_COMMIT_CONFIRMATION_REQUIRED',
  );

  const committed = await session.command('candidate-commit', { confirmed: true });
  assert.equal(committed.candidate_reality.phase, 'committed');
  assert.equal(committed.candidate_reality.status, 'committed-local-candidate');
  assert.equal(committed.candidate_reality.verification.valid, true);
  assert.equal(committed.commit_gate.status, 'candidate-committed');
  assert.equal(committed.commit_gate.production_promotion_permitted, false);
  assert.notEqual(committed.inspector.source_roots.project_root, baseProjectRoot);
  assert.equal(committed.runtime.status, 'healthy');
  assert.equal(committed.runtime.tick, 0);
  assert.notEqual(committed.integration.epoch_root, baseIntegrationEpochRoot);
  assert.equal(committed.integration.entry_count, 0);
  assert.ok(committed.event_tail.some(event => event.type === 'candidate.committed-local'));
  assert.ok(committed.evidence.ledger_root);
});
