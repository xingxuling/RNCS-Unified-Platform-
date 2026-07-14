import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {AetherworldRNCSNativeRuntime} from '../src/index.mjs';
import {compileRclAuthorityPlan} from '../../../control/rncs-rcl-control-plane/src/index.mjs';

test('RCL behavior declarations lower multiple actions and capabilities into one executable program', async () => {
  const runtime = new AetherworldRNCSNativeRuntime({dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'rcl-behavior-actions-'))});
  const compiled = await compileRclAuthorityPlan(`reality RclMultiActionBehavior {
    facet rncs.world.world_id : Text = "world:rcl-multi-action"
    facet rncs.world.behavior.signal.id : Text = "behavior:rcl-multi-action"
    facet rncs.world.behavior.signal.version : Text = "1.0.0"
    facet rncs.world.behavior.signal.trigger.event : Text = "rcl.signal"
    facet rncs.world.behavior.signal.action.open.type : Text = "set"
    facet rncs.world.behavior.signal.action.open.target : Text = "globals.world.runtime.opened"
    facet rncs.world.behavior.signal.action.open.value : Truth = true
    facet rncs.world.behavior.signal.action.open.capability_id : Text = "rcl.open"
    facet rncs.world.behavior.signal.action.light.type : Text = "set"
    facet rncs.world.behavior.signal.action.light.target : Text = "globals.world.runtime.lit"
    facet rncs.world.behavior.signal.action.light.value : Truth = true
    facet rncs.world.behavior.signal.action.light.capability_id : Text = "rcl.light"
    facet rncs.world.behavior.signal.capability.open.id : Text = "rcl.open"
    facet rncs.world.behavior.signal.capability.open.required_scope : Text = "world.object.write"
    facet rncs.world.behavior.signal.capability.open.risk : Text = "medium"
    facet rncs.world.behavior.signal.capability.light.id : Text = "rcl.light"
    facet rncs.world.behavior.signal.capability.light.required_scope : Text = "world.object.write"
    facet rncs.world.behavior.signal.capability.light.risk : Text = "medium"
  }
  `, {roles: ['owner', 'security']});
  const candidate = runtime.createCandidate({plan: compiled.plan});
  await runtime.simulateCandidate({candidateId: candidate.candidate_id});
  runtime.authorizeCandidate({candidateId: candidate.candidate_id, approvalRoles: ['owner', 'security']});
  await runtime.mergeCandidate({candidateId: candidate.candidate_id});
  const execution = runtime.executeBehavior({behaviorId: 'behavior:rcl-multi-action', event: 'rcl.signal'});
  const snapshot = runtime.worldSnapshot();
  assert.equal(snapshot.state.world.runtime.opened, true);
  assert.equal(snapshot.state.world.runtime.lit, true);
  assert.deepEqual(execution.execution.world_changed_paths, ['world.runtime.lit', 'world.runtime.opened']);
  assert.equal(execution.execution.trace.entries.filter(entry => entry.type === 'capability.decision').length, 2);
});
