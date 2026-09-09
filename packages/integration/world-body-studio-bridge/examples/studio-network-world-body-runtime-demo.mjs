import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createStudioNetworkWorld } from '../../../../examples/studio-authored-network-world-v03/project.mjs';
import { writeGeneratedArtifacts } from '@taowind/world-body-codegen';
import { compileStudioWorldBodyCandidate } from '../src/index.mjs';

const { session, compilation: networkCompilation } = createStudioNetworkWorld();
const bundle = compileStudioWorldBodyCandidate(session.project, { networkCompilation });
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = fs.mkdtempSync(path.join(packageRoot, '.generated-run-'));
try {
  writeGeneratedArtifacts(bundle.worldBody, output);
  const generatedTest = path.join(output, 'world-body.generated.test.mjs');
  const result = spawnSync(process.execPath, ['--test', generatedTest], {
    cwd: packageRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(JSON.stringify({
    status: 'PASS',
    generatedRuntimeTest: 'world-body.generated.test.mjs',
    worldBodyRoot: bundle.worldBody.manifest.worldBodyRoot,
    semanticDeclarationRoot: bundle.worldBody.compilation.semanticDeclarationRoot,
    authority: bundle.authority,
  }, null, 2));
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
