import { spawnSync } from 'node:child_process';

const result = spawnSync('tsc', [
  '--target', 'ES2022',
  '--module', 'NodeNext',
  '--moduleResolution', 'NodeNext',
  '--strict',
  '--skipLibCheck',
  '--declaration', 'false',
  '--sourceMap', 'false',
  '--rootDir', 'packages/world/visual-state-runtime',
  '--outDir', 'packages/world/visual-state-runtime/dist',
  'packages/world/visual-state-runtime/packages/spec/src/index.ts',
  'packages/world/visual-state-runtime/packages/temporal-presentation/src/index.ts'
], {stdio: 'inherit'});

if (result.status !== 0) process.exit(result.status ?? 1);
console.log('VSR temporal bridge build complete.');
