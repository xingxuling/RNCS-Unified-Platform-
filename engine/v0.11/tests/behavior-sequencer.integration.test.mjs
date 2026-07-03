import test from 'node:test';
import assert from 'node:assert/strict';
import {runBehaviorSequencer} from '../examples/behavior-sequencer.mjs';

test('RNCS v0.11 closes cooperative behavior and multitrack sequencer loop',async()=>{
  const result=await runBehaviorSequencer();
  assert.equal(Object.values(result.evidence.acceptance).every(Boolean),true);
  assert.equal(result.evidence.quest.status,'completed');
  assert.equal(result.evidence.roots.completed_sequence_state_root,result.evidence.roots.replayed_sequence_state_root);
  assert.equal(result.evidence.roots.completed_sequence_state_root,result.evidence.roots.replica_sequence_state_root);
  assert.notEqual(result.evidence.roots.authority_root,result.evidence.roots.presentation_root);
});
