import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RealityOneGateway } from '../src/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rcl-authority-continuity-'));
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
const SOURCE = `reality RclAuthorityContinuity {
  facet rncs.world.world_id : Text = "world:rcl-authority-continuity"
  facet greenhouse.light : Truth = false
  subject caretaker {
    facet actions : Number = 0
    warrant greenhouse.control on greenhouse
  }
  emergence enact {
    cause caretaker
    when true
    needs greenhouse.control on greenhouse
    alter greenhouse.light <- true
    alter caretaker.actions <- caretaker.actions + 1
    witness "rcl:authority-continuity"
  }
  foresee enact
  realize enact
}`;

test('RCL native authority history is bound into RNCS and survives commit evidence', async () => {
  const g = new RealityOneGateway({ manifestDirs: [path.join(root, 'runtimes')], dataDir: tmp() });
  await g.discover();
  const before = await g.invoke('rncs.aetherworld-native', 'worldStatus', {});
  const result = await g.invoke('rncs.rcl-control', 'authorityWorkflow', {
    source: SOURCE,
    commit: true,
    approvalRoles: ['owner', 'security'],
    expectedStateRoot: before.state_root,
    expectedRevision: before.revision,
  }, { timeoutMs: 120000 });

  assert.equal(result.status, 'committed');
  const evidence = result.execution.authorityEvidence;
  assert.equal(result.plan.rcl_authority_evidence_root, evidence.root);
  assert.equal(result.plan.rcl_authority_transition_count, evidence.transitions.length);
  assert.equal(evidence.transitions.length, 1);
  assert.equal(evidence.transitions[0].subject.subject_id, 'caretaker');
  assert.deepEqual(evidence.transitions[0].capability_plan.required_scopes, ['greenhouse.control@greenhouse']);
  assert.deepEqual(evidence.transitions[0].capability_plan.capabilities, [{ subject: 'caretaker', capability: 'greenhouse.control', target: 'greenhouse' }]);
  assert.ok(evidence.transitions[0].evidence.nodes.some(node => node.source === 'rcl:authority-continuity'));
  assert.equal(result.merge.evidence.rcl_native_evidence.authority_evidence_root, evidence.root);
  assert.equal(result.merge.evidence.rcl_native_evidence.authority_continuity_verified, true);
});

test('RNCS rejects an RCL authority history whose need is no longer backed by a warrant', async () => {
  const g = new RealityOneGateway({ manifestDirs: [path.join(root, 'runtimes')], dataDir: tmp() });
  await g.discover();
  const compiled = await g.invoke('rncs.rcl-control', 'compileAuthorityPlan', { source: SOURCE });
  const plan = structuredClone(compiled.plan);
  const evidence = structuredClone(plan.rcl_authority_evidence);
  evidence.transitions[0].capability_plan.capabilities = [];
  const { root: _root, ...unsignedEvidence } = evidence;
  evidence.root = hash(unsignedEvidence);
  plan.rcl_authority_evidence = evidence;
  plan.source.rcl_authority_evidence_root = evidence.root;
  const candidate = await g.invoke('rncs.aetherworld-native', 'createCandidate', { plan });
  await g.invoke('rncs.aetherworld-native', 'simulateCandidate', { candidateId: candidate.candidate_id });
  await assert.rejects(
    () => g.invoke('rncs.aetherworld-native', 'authorizeCandidate', { candidateId: candidate.candidate_id, approvalRoles: ['owner', 'security'] }),
    error => error.code === 'RCL_AUTHORITY_CONTINUITY_UNBACKED_NEED',
  );
});
