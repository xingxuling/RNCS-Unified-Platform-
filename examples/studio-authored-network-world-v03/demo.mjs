import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runStudioAuthoredNetworkWorldV03 } from './runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'artifacts', 'studio-authored-network-world-v03');
const result = await runStudioAuthoredNetworkWorldV03({ outDir });

console.log(JSON.stringify({
  status: result.audit.status.toUpperCase(),
  package_root: result.package.package_root,
  out_dir: outDir,
  project_root: result.compilation.project_root,
  compilation_root: result.compilation.compilation_root,
  world_config_root: result.compilation.world_config_root,
  final_state_root: result.network.finalSnapshot.stateRoot,
  viewport_root: result.viewport.viewport_root,
  counterfactual_root: result.counterfactual.counterfactual_root,
  acceptance: result.package.acceptance,
}, null, 2));
