import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adjustRealityDetailVector,
  createCognitiveWorkingSet,
  createRealityDetailVector,
  createRealityHorizon,
  createRealityInterestGraph,
  createRealityQuery,
  evaluateRealityQuery,
  verifyCognitiveWorkingSet,
  verifyRealityDetailVector,
  verifyRealityHorizon,
  verifyRealityInterestGraph,
  verifyRealityQuery,
  verifyRealityQueryResult
} from '../src/index.mjs';

function horizon(subjectId = 'subject:alice') {
  return createRealityHorizon({
    subject_id: subjectId,
    visual: {radius: '200', unit: 'm'},
    auditory: {radius: '50', unit: 'm'},
    spatial: {radius: '100', unit: 'm'},
    semantic: {tags: ['city']},
    social: {scope: ['known-contacts']},
    temporal: {scope: ['recent']},
    causal: {max_depth: 3},
    cognitive: {max_results: 2},
    actionable: {scope: ['public']},
    permission_scope: ['public', 'friend']
  });
}

function object(id, position, tags, price, authorityScope = ['public']) {
  return {
    object_id: id,
    object_root: id === 'object:forge' ? 'a'.repeat(64) : 'b'.repeat(64),
    property_root: 'c'.repeat(64),
    law_bindings_root: 'd'.repeat(64),
    query_index: {
      position,
      semantic_tags: tags,
      state: {price},
      relations: [{type: 'friend', from: 'subject:alice', to: id}],
      temporal: {from: '0', to: '120'},
      authority_scope: authorityScope,
      freshness: '1',
      evidence_refs: [`evidence:${id}`]
    }
  };
}

test('keeps DetailVector axes independent and candidate-only', () => {
  const vector = createRealityDetailVector({visual: 4, physical: 1, causal: 2});
  const changed = adjustRealityDetailVector(vector, {physical: 4, audio: 3});
  assert.equal(vector.axes.visual, 4);
  assert.equal(vector.axes.physical, 1);
  assert.equal(changed.axes.physical, 4);
  assert.equal(changed.axes.audio, 3);
  assert.equal(changed.axes.visual, 4);
  assert.equal(verifyRealityDetailVector(changed).valid, true);
  changed.axes.visual = 1;
  assert.equal(verifyRealityDetailVector(changed).valid, false);
});

test('seals a multi-domain RealityHorizon', () => {
  const value = horizon();
  assert.equal(value.axes.visual.radius, '200');
  assert.equal(value.axes.cognitive.max_results, 2);
  assert.equal(verifyRealityHorizon(value).valid, true);
  value.axes.spatial.radius = '999';
  assert.equal(verifyRealityHorizon(value).valid, false);
});

test('seals InterestGraph weights and rejects unknown edge types', () => {
  const graph = createRealityInterestGraph({
    subject_id: 'subject:alice',
    nodes: [{object_id: 'object:forge', required: true, reasons: ['task'], weights: {task_interest: '10', threat_interest: '1'}}],
    edges: [{from: 'subject:alice', to: 'object:forge', type: 'task_interest', weight: '5', evidence_refs: ['evidence:task']}]
  });
  assert.equal(verifyRealityInterestGraph(graph).valid, true);
  assert.throws(() => createRealityInterestGraph({subject_id: 'subject:alice', edges: [{from: 'a', to: 'b', type: 'unknown', weight: '1'}]}), /RNCS_INTEREST_EDGE_TYPE_INVALID/);
});

test('runs a deterministic spatial, semantic, state, relation, temporal and permission query', () => {
  const graph = createRealityInterestGraph({
    subject_id: 'subject:alice',
    nodes: [
      {object_id: 'object:forge', required: true, reasons: ['task'], weights: {task_interest: '10'}},
      {object_id: 'object:market', weights: {semantic_interest: '2'}}
    ]
  });
  const query = createRealityQuery({
    subject_id: 'subject:alice',
    horizon: horizon(),
    interest_graph: graph,
    filters: {
      spatial: {origin: {x: 0, y: 0, z: 0}, radius: '100', unit: 'm'},
      semantic: {tags: ['forge'], mode: 'any'},
      state: [{property_id: 'price', operator: '<', value: '200'}],
      relations: [{type: 'friend', from: 'subject:alice'}],
      temporal: {from: '10', to: '100'}
    },
    permission_scope: ['public', 'friend'],
    limit: 3
  });
  assert.equal(verifyRealityQuery(query).valid, true);
  const objects = [
    object('object:forge', {x: 10, y: 0, z: 0}, ['city', 'forge'], '150'),
    object('object:market', {x: 20, y: 0, z: 0}, ['city', 'market'], '100'),
    object('object:private', {x: 5, y: 0, z: 0}, ['city', 'forge'], '100', ['private'])
  ];
  const first = evaluateRealityQuery(query, objects);
  const second = evaluateRealityQuery(query, objects);
  assert.equal(verifyRealityQueryResult(first).valid, true);
  assert.deepEqual(first, second);
  assert.deepEqual(first.selected.map(row => row.object_id), ['object:forge']);
  assert.ok(first.omitted.some(row => row.object_id === 'object:private' && row.reason === 'PERMISSION_FILTERED'));
});

test('bounds Cognitive Working Set and keeps canonical revalidation mandatory', () => {
  const query = createRealityQuery({subject_id: 'subject:alice', horizon: horizon(), limit: 3});
  const result = evaluateRealityQuery(query, [object('object:forge', {x: 1, y: 0, z: 0}, ['city'], '150'), object('object:market', {x: 2, y: 0, z: 0}, ['city'], '100')]);
  const workingSet = createCognitiveWorkingSet({query_result: result, capacity: 1});
  assert.equal(workingSet.objects.length, 1);
  assert.equal(workingSet.truncated, true);
  assert.equal(workingSet.canonical_revalidation_required, true);
  assert.equal(verifyCognitiveWorkingSet(workingSet).valid, true);
  workingSet.objects.push({...workingSet.objects[0]});
  assert.equal(verifyCognitiveWorkingSet(workingSet).valid, false);
});

console.log('reality access contract tests: 5 PASS');
