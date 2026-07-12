import test from 'node:test';
import assert from 'node:assert/strict';
import { Rclpedia, generateSeedEntries } from '../src/index.mjs';

test('generates at least 512 typed seed knowledge entries', () => {
  const entries = generateSeedEntries(512);
  assert.equal(entries.length, 512);
  assert.equal(new Set(entries.map(entry => entry.id)).size, 512);
  assert.ok(entries.every(entry => entry.kind === 'KnowledgeClaim'));
});

test('repeated observations revise confidence and evidence', () => {
  const pedia = new Rclpedia([]);
  const first = pedia.observe({ subject: 'rain', relation: 'supports', object: 'biomass', evidence: 'e1' });
  for (let i = 0; i < 8; i += 1) {
    pedia.observe({ subject: 'rain', relation: 'supports', object: 'biomass', evidence: `e${i + 2}` });
  }
  const result = pedia.search('rain')[0];
  assert.equal(pedia.size, 1);
  assert.ok(result.confidence > first.confidence);
  assert.equal(result.observations, 9);
  assert.equal(result.status, 'observed');
});
