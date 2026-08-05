import assert from 'node:assert/strict';
import test from 'node:test';
import {runPlayableWorld} from '../examples/playable-spatial-world.mjs';

test('RNCS v0.8 playable spatial world closes RSR Network and VSR loop',async()=>{
  const result=await runPlayableWorld();
  assert.equal(Object.values(result.acceptance).every(Boolean),true);
  assert.equal(result.authorityRoot,result.clientRoots.blue);
  assert.equal(result.authorityRoot,result.clientRoots.red);
  assert.notEqual(result.authorityRoot,result.temporalPresentationRoot);
  assert.notEqual(result.authorityRoot,result.assetPresentationRoot);
  assert.ok(result.png.byteLength>100);
});
