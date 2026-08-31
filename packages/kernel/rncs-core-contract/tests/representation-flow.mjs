import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRepresentationFlow,
  createRepresentationFlowSample,
  verifyRepresentationFlow,
  verifyRepresentationFlowSample
} from '../src/index.mjs';

const root = letter => letter.repeat(64);

function flow() {
  return createRepresentationFlow({
    flow_id: 'flow:test:translation',
    object_id: 'object:test',
    branch: 'main',
    source_state_root: root('a'),
    target_state_root: root('b'),
    source_representation_root: root('c'),
    target_representation_root: root('d'),
    interval: {
      source_time_ms: 1000,
      target_time_ms: 1050,
      source_tick: 20,
      target_tick: 21
    },
    motion_field: {
      kind: 'TRANSLATION',
      space: 'world',
      unit: 'millimeter',
      source: [0, 0, 0],
      target: [1000, 0, 0]
    },
    interpolation_policy: {
      mode: 'LINEAR',
      extrapolation: 'BOUNDED',
      max_extrapolation_ms: 8,
      max_extrapolation_ticks: 1,
      clamp_to_interval: false
    },
    prediction_budget: {
      max_extrapolation_ms: 8,
      max_extrapolation_ticks: 1,
      max_prediction_error_mm: 20,
      max_prediction_error_mdeg: 50
    },
    error_budget: {
      max_position_error_mm: 20,
      max_rotation_error_mdeg: 50,
      stale_after_ms: 100
    },
    safety_bound: {
      collision_preserving: true,
      max_displacement_mm: 1200
    }
  });
}

test('seals identity, monotonic time, prediction and authority boundaries', () => {
  const candidate = flow();
  assert.equal(verifyRepresentationFlow(candidate).valid, true);
  assert.equal(candidate.identity_continuity.continuous, true);
  assert.equal(candidate.authority.provider_can_write_authoritative_world_state, false);
  assert.equal(candidate.commit_status, 'NOT_COMMITTED');

  const midpoint = createRepresentationFlowSample(candidate, {
    sample_time_ms: 1025,
    now_time_ms: 1025,
    observed_value: [510, 0, 0]
  });
  assert.equal(verifyRepresentationFlowSample(midpoint).valid, true);
  assert.equal(midpoint.interpolation.status, 'INTERPOLATED');
  assert.deepEqual(midpoint.value, [500, 0, 0]);
  assert.equal(midpoint.prediction_error.status, 'PASS');
  assert.equal(midpoint.canonical_state_mutated, false);

  const bounded = createRepresentationFlowSample(candidate, {sample_time_ms: 1058, now_time_ms: 1058});
  assert.equal(verifyRepresentationFlowSample(bounded).valid, true);
  assert.equal(bounded.interpolation.status, 'EXTRAPOLATED');
  assert.equal(bounded.interpolation.alpha_milli, 1160);
  assert.equal(verifyRepresentationFlow(candidate).valid, true);
});

test('rejects stale, over-window, over-error and tampered flow samples', () => {
  const candidate = flow();
  assert.throws(() => createRepresentationFlowSample(candidate, {sample_time_ms: 1059, now_time_ms: 1059}), /RNCS_FLOW_EXTRAPOLATION_WINDOW_EXCEEDED/);
  assert.throws(() => createRepresentationFlowSample(candidate, {sample_time_ms: 1050, now_time_ms: 1151}), /RNCS_FLOW_STALE_STATE/);
  assert.throws(() => createRepresentationFlowSample(candidate, {sample_time_ms: 1025, now_time_ms: 1025, observed_value: [600, 0, 0]}), /RNCS_FLOW_PREDICTION_ERROR_EXCEEDED/);

  const tampered = structuredClone(candidate);
  tampered.target_state_root = root('e');
  assert.equal(verifyRepresentationFlow(tampered).valid, false);
  const sample = createRepresentationFlowSample(candidate, {sample_time_ms: 1025, now_time_ms: 1025});
  sample.value[0] += 1;
  assert.equal(verifyRepresentationFlowSample(sample).valid, false);
});

test('enforces tick extrapolation even when the millisecond window is valid', () => {
  const candidate = createRepresentationFlow({
    ...flow(),
    flow_id: 'flow:test:tick-budget',
    interval: {source_time_ms: 1000, target_time_ms: 1010, source_tick: 20, target_tick: 30},
    interpolation_policy: {mode: 'LINEAR', extrapolation: 'BOUNDED', max_extrapolation_ms: 8, max_extrapolation_ticks: 1},
    prediction_budget: {max_extrapolation_ms: 8, max_extrapolation_ticks: 1, max_prediction_error_mm: 20, max_prediction_error_mdeg: 50}
  });
  assert.throws(() => createRepresentationFlowSample(candidate, {sample_time_ms: 1012, now_time_ms: 1012}), /RNCS_FLOW_EXTRAPOLATION_TICK_WINDOW_EXCEEDED/);
});
