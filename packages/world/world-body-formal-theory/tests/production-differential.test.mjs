import test from 'node:test';
import assert from 'node:assert/strict';
import { minimalWorldBodyIR } from '../../world-body-ir/examples/minimal-world-body.mjs';
import { rsrWorldConfig } from '../../world-body-codegen/examples/generated/minimal/rsr-world-config.generated.mjs';
import {
  applyWorldBodyVisualBindings,
  visualBindings,
} from '../../world-body-codegen/examples/generated/minimal/vsr-bindings.generated.mjs';
import { bindAuthoritativeFrame } from '../../world-body-codegen/examples/generated/minimal/temporal-network.generated.mjs';
import { runWorldBodyProductionDifferential } from '../src/production-differential.mjs';

test('generated World Body specialization refines the selected real RSR/VSR path', () => {
  const report = runWorldBodyProductionDifferential({
    ir: minimalWorldBodyIR,
    rsrWorldConfig,
    applyWorldBodyVisualBindings,
    visualBindings,
    bindAuthoritativeFrame,
  });
  assert.equal(report.status, 'PASS');
  assert.equal(report.evidenceClass, 'PARTIAL_PRODUCTION_DIFFERENTIAL');
  assert.equal(report.checks.length, 12);
  assert.ok(report.checks.every(check => check.passed));
  assert.deepEqual(report.excludedScope, [
    'real browser or target GPU execution', 'pixel equivalence', 'external physics engines',
    'packet-loss network recovery', 'production asset providers', 'target-hardware performance',
  ]);
});
