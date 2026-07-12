import assert from 'node:assert/strict';
import test from 'node:test';
import { enforceHostPolicy, loadHostPolicy } from '../src/host/policy.mjs';

test('host policy strips remote identity and refuses unmapped project paths', () => {
  const policy = loadHostPolicy();
  const action = {
    action_id: 'a1',
    action: {
      type: 'dml.message.send',
      subject: { subject_id: 'spoofed' },
      human_principal: { subject_id: 'spoofed-owner' },
      authority: { max_risk: 'low' },
      payload: { text: 'hello' },
    },
  };
  const safe = enforceHostPolicy(action, policy);
  assert.equal(safe.action.subject, undefined);
  assert.equal(safe.action.human_principal, undefined);
  assert.throws(() => enforceHostPolicy({
    action: {
      type: 'dml.project.inspect',
      project_ref: { project_id: 'project:unknown' },
      authority: { max_risk: 'medium' },
      payload: { path: '/etc' },
    },
  }, policy), /No local root is mapped/);
});
