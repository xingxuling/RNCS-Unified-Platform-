import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBeyondEngineVerticalSliceV02 } from './runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gameBrainModulePath = process.env.GAMEBRAIN_MODULE_PATH
  ?? path.resolve(root, '..', 'zhinao', 'src', 'index.mjs');
if (!fs.existsSync(gameBrainModulePath)) {
  throw new Error(`GAMEBRAIN_PROVIDER_REQUIRED:${gameBrainModulePath}`);
}
const outDir = path.join(root, 'artifacts', 'beyond-engine-vertical-slice-v02');
const result = await runBeyondEngineVerticalSliceV02({ outDir, gameBrainModulePath });
console.log(JSON.stringify({
  status: result.audit.status.toUpperCase(),
  package_root: result.package.package_root,
  out_dir: outDir,
  build_id: result.build.build_id,
  targets: result.build.targets.map((target) => target.target),
  acceptance: result.package.acceptance,
}, null, 2));
