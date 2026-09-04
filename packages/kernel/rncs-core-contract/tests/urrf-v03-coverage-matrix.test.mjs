import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  createURRFV03CoverageMatrix,
  URRF_K400_GATES,
  URRF_V03_COVERAGE_STATUSES,
  verifyURRFV03CoverageMatrix
} from '../src/index.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const matrix = createURRFV03CoverageMatrix();
const referenceFields = ['source_refs', 'schema_refs', 'test_refs', 'evidence_refs'];

test('URRF v0.3 coverage matrix contains all 26 criteria and nine K400 gates', () => {
  assert.equal(verifyURRFV03CoverageMatrix(matrix).valid, true);
  assert.equal(matrix.criteria.length, 26);
  assert.deepEqual(matrix.k400_gates, [...URRF_K400_GATES]);
  assert.deepEqual(matrix.criteria.map(item => item.criterion_id), Array.from({length: 26}, (_, index) => `URRF-${String(index + 1).padStart(2, '0')}`));
  assert.equal(matrix.summary.criterion_count, 26);
  assert.equal(matrix.summary.criterion_status_counts.NOT_IMPLEMENTED, 1);
  assert.equal(matrix.summary.aaa_release_status, 'BLOCKED_EXTERNAL_ART_HUMAN_HARDWARE_EVIDENCE');
  assert.equal(matrix.summary.ai_generate_status, 'BLOCKED_NOT_RUN');
});

test('every coverage reference resolves to a real source, schema, test or evidence file', () => {
  for (const criterion of matrix.criteria) {
    assert.ok(URRF_V03_COVERAGE_STATUSES.includes(criterion.status));
    for (const field of referenceFields) {
      for (const reference of criterion[field]) {
        assert.equal(fs.existsSync(path.join(repoRoot, reference)), true, `${criterion.criterion_id} ${field}: ${reference}`);
      }
    }
    for (const gate of criterion.k400_gates) assert.ok(URRF_K400_GATES.includes(gate), `${criterion.criterion_id}: ${gate}`);
  }
  for (const gate of matrix.gate_status) {
    assert.ok(URRF_V03_COVERAGE_STATUSES.includes(gate.status));
    for (const reference of [...gate.source_refs, ...gate.test_refs]) {
      assert.equal(fs.existsSync(path.join(repoRoot, reference)), true, `${gate.gate}: ${reference}`);
    }
  }
});

test('coverage matrix makes the open sensor gate and blocked AI generation explicit', () => {
  const sensor = matrix.criteria.find(item => item.criterion_id === 'URRF-24');
  assert.equal(sensor.status, 'NOT_IMPLEMENTED');
  assert.equal(sensor.gap.id, 'URRF_GAP_SENSOR_INFERENCE_ACCEPTANCE');
  assert.ok(sensor.remaining.includes('sensor inference adapter, calibrated observation evidence and acceptance gate'));
  const aiGate = matrix.gate_status.find(item => item.gate === 'AI_GENERATE');
  assert.equal(aiGate.status, 'BLOCKED_NOT_RUN');
  assert.ok(aiGate.remaining.includes('TRELLIS.2 weights'));
  assert.ok(aiGate.remaining.includes('CUDA/NVIDIA GPU'));
});

test('coverage root detects tampering', () => {
  const tampered = structuredClone(matrix);
  tampered.criteria[0].status = 'CANDIDATE_LOCAL_PARTIAL';
  assert.equal(verifyURRFV03CoverageMatrix(tampered).valid, false);
  assert.ok(verifyURRFV03CoverageMatrix(tampered).errors.includes('COVERAGE_ROOT_MISMATCH'));
});

test('persisted coverage snapshot matches the canonical matrix definition', () => {
  const persistedPath = path.join(repoRoot, 'docs', 'verification', 'URRF_V03_COVERAGE_MATRIX', 'urrf-v03-coverage-matrix.json');
  assert.equal(fs.existsSync(persistedPath), true);
  const persisted = JSON.parse(fs.readFileSync(persistedPath, 'utf8'));
  assert.equal(verifyURRFV03CoverageMatrix(persisted).valid, true);
  assert.deepEqual(persisted, matrix);
});

console.log('URRF v0.3 coverage matrix tests: 5 PASS');
