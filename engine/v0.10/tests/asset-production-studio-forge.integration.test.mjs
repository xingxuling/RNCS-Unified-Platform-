import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runAssetForge} from '../examples/asset-production-studio-forge.mjs';

test('v0.10 closes asset production and Studio Forge loop',async()=>{
  const project=JSON.parse(fs.readFileSync('apps/reality-studio/examples/冰境试炼.unified-project.json','utf8'));
  const intent=JSON.parse(fs.readFileSync('apps/reality-studio/examples/霜璃.asset-intent.json','utf8'));
  const result=await runAssetForge({project,intent,outDir:fs.mkdtempSync(path.join(os.tmpdir(),'rncs-v010-'))});
  assert.equal(Object.values(result.acceptance).every(Boolean),true);
  assert.ok(result.png.byteLength>100);
});
