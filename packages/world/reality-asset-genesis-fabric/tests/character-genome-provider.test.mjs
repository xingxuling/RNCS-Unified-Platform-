import assert from 'node:assert/strict';
import test from 'node:test';
import {builtinProviders} from '../src/providers.mjs';

test('RAGF exposes an explicit offline Character Genome provider contract',()=>{
  const provider=builtinProviders().find(item=>item.provider_id==='ragf.character-genome-reference-provider');
  assert.ok(provider);
  assert.equal(provider.mode,'builtin');
  assert.equal(provider.metadata.offline,true);
  assert.equal(provider.metadata.cloud_calls,false);
  assert.equal(provider.metadata.reference,true);
  assert.equal(provider.metadata.identity_authority,'RNCS Character Genome');
  assert.equal(provider.metadata.license,'Apache-2.0');
  assert.deepEqual(provider.capabilities.map(item=>item.capability_id),[
    'character-genome.solve',
    'character-phenotype.compile',
    'character-phenotype.rebuild',
  ]);
  assert.ok(provider.capabilities.every(item=>item.deterministic===true));
});
