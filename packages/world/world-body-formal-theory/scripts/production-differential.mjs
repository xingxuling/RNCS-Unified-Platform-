import { minimalWorldBodyIR } from '../../world-body-ir/examples/minimal-world-body.mjs';
import { rsrWorldConfig } from '../../world-body-codegen/examples/generated/minimal/rsr-world-config.generated.mjs';
import {
  applyWorldBodyVisualBindings,
  visualBindings,
} from '../../world-body-codegen/examples/generated/minimal/vsr-bindings.generated.mjs';
import { bindAuthoritativeFrame } from '../../world-body-codegen/examples/generated/minimal/temporal-network.generated.mjs';
import { runWorldBodyProductionDifferential } from '../src/production-differential.mjs';

const report = runWorldBodyProductionDifferential({
  ir: minimalWorldBodyIR,
  rsrWorldConfig,
  applyWorldBodyVisualBindings,
  visualBindings,
  bindAuthoritativeFrame,
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'PASS') process.exitCode = 1;
