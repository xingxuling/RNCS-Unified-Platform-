import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAppearanceLoadout,applyStateOverlay,createCharacterGenome,createCharacterIdentitySignature,createReferenceCharacterCatalog,validateCharacterGenome,compareCharacterIdentitySignatures,analyzeCharacterGenomeImpact,CharacterGenomeError} from '../src/index.mjs';

test('Character Genome separates identity, appearance and state authority',()=>{
  const genome=createCharacterGenome({character_id:'character:lan-tianlin',name:'蓝天临',seed:'lan-v1'}),validation=validateCharacterGenome(genome);
  assert.equal(validation.valid,true);assert.ok(validation.face_parameter_count>=24);assert.ok(validation.expression_count>=8);assert.ok(validation.viseme_count>=12);
  const changed=applyAppearanceLoadout(genome,{hair_family:'short-layered',costume_family:'urban-field-v1'}),state=applyStateOverlay(changed,{expression:'focused',fatigue:.2});
  assert.equal(changed.identity_root,genome.identity_root);assert.equal(state.identity_root,genome.identity_root);assert.equal(state.character_id,genome.character_id);
  assert.equal(compareCharacterIdentitySignatures(createCharacterIdentitySignature(genome),createCharacterIdentitySignature(state),{reason:'appearance-and-state'}).status,'pass');
});

test('reference catalog has three implemented topology families and modular libraries',()=>{
  const catalog=createReferenceCharacterCatalog(),implemented=Object.values(catalog.topologies).filter(item=>item.status==='implemented');
  assert.ok(implemented.length>=3);assert.ok(catalog.hair.length>=6);assert.ok(catalog.costumes.length>=3);assert.ok(catalog.palettes.length>=3);assert.ok(catalog.emblems.length>=3);assert.ok(catalog.weapon_slots.length>=2);
});

test('unsafe face parameters and incompatible modules fail closed',()=>{
  assert.throws(()=>createCharacterGenome({parameters:{eye_spacing:.05}}),error=>error instanceof CharacterGenomeError&&error.code==='CHARACTER_CONSTRAINTS_INVALID');
  assert.throws(()=>createCharacterGenome({topology_family:'youth-standard',appearance:{hair_family:'high-ponytail'}}),error=>error instanceof CharacterGenomeError&&error.code==='CHARACTER_CONSTRAINTS_INVALID');
});

test('impact analysis preserves geometry for recolor and identity for costume',()=>{
  const genome=createCharacterGenome({character_id:'character:lan-tianlin',name:'蓝天临'}),color=analyzeCharacterGenomeImpact(genome,{change_path:'hair.color'}),costume=analyzeCharacterGenomeImpact(genome,{change_path:'costume.family'});
  assert.equal(color.scope,'hair-material');assert.ok(color.preserve.includes('body.glb'));assert.equal(color.rebuild.includes('body.glb'),false);
  assert.equal(costume.scope,'costume');assert.ok(costume.preserve.includes('identity_signature.json'));
});
