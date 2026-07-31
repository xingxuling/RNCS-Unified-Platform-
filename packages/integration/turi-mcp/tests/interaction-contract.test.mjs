import test from 'node:test';
import assert from 'node:assert/strict';
import { interactionFor, normalizeInteractionStatus, statusFromData } from '../src/ux/interaction-contract.mjs';
import { exposedToolsFor } from '../src/server/mcp-server.mjs';

test('interaction contract turns host intervention into an actionable continuation', () => {
  const interaction = interactionFor({
    capabilityId: 'turi.workflow.research-task',
    data: { status: 'REQUIRES_HOST_REASONING', resumeToken: 'signed-token' },
  });

  assert.equal(interaction.format, 'turi.interaction.v0.1');
  assert.equal(interaction.status, 'input_required');
  assert.equal(interaction.terminal, false);
  assert.equal(interaction.resumable, true);
  assert.equal(interaction.nextAction.tool, 'turi_resume_with_host_contribution');
  assert.deepEqual(interaction.nextAction.requiredFields, ['resumeToken', 'hostContribution']);
});

test('interaction contract maps durable jobs to polling instead of false completion', () => {
  const interaction = interactionFor({
    capabilityId: 'turi.job.start',
    data: { jobId: 'job:test', status: 'RUNNING' },
  });

  assert.equal(interaction.status, 'running');
  assert.equal(interaction.terminal, false);
  assert.deepEqual(interaction.nextAction.arguments, { jobId: 'job:test' });
  assert.equal(interaction.nextAction.tool, 'turi_job_status');
  assert.equal(statusFromData({ job: { status: 'SUCCEEDED' } }), 'completed');
});

test('tool profiles reduce choice overload without removing registry capabilities', () => {
  const compat = exposedToolsFor('compat');
  const core = exposedToolsFor('core');
  const research = exposedToolsFor('research');

  assert.ok(compat.length > 100);
  assert.ok(core.length < compat.length);
  assert.ok(core.includes('turi_research_task'));
  assert.ok(research.includes('updia_memory_search'));
  assert.throws(() => exposedToolsFor('unknown'), /Unknown TURI tool profile/);
  assert.equal(normalizeInteractionStatus('REQUIRES_HOST_REASONING'), 'input_required');
});
