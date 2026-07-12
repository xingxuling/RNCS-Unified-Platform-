import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aipIntentToSemanticAction, semanticActionToCNPRequest, buildDMLProvider } from '../src/index.mjs';
import { negotiate } from '@taowind/capability-negotiation-protocol';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const aip = JSON.parse(fs.readFileSync(path.join(root, 'integration/hnaf/digital-blue-tianji-workbench.aip.v0.7.json'), 'utf8'));

test('HNAF AIP intent compiles into a CNP-satisfied capability request', () => {
  const action = aipIntentToSemanticAction({
    aip, intent_id: 'goal.pause', payload: { goal_id: 'goal:1' },
    subject: { subject_id: 'subject:dml:blue-tianji-001', kind: 'digital-mechanical-life', roles: ['collaborator'], scopes: [] },
    human_principal: { subject_id: 'subject:human:duhengjie', roles: ['owner'], scopes: ['dml.goal.control'] },
    project_ref: { project_id: 'project:vsr', generation: 0 },
  });
  const request = semanticActionToCNPRequest(action, { host_id: 'host:desktop', capabilities: ['display.text', 'input.activate'] });
  const result = negotiate({ request, providers: [buildDMLProvider()] });
  assert.equal(result.plan.status, 'satisfied');
  assert.equal(result.plan.steps[0].capability_id, 'dml.goal.pause');
});
