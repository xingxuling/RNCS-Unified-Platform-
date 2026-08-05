import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {applyAppearanceLoadout,createCharacterGenome} from '../../character-genome-runtime/src/index.mjs';
import {compileCharacterPhenotype,rebuildCharacterPhenotype,rollbackCharacterAsset,snapshotCharacterAsset,verifyCharacterAssetDirectory} from '../src/index.mjs';
import {validateCharacterVisualProfile} from '../../visual-state-runtime/src/character-profile.mjs';
import {validateCharacterBodyProfile} from '../../reality-simulation-runtime/src/character-body.mjs';

const temp=name=>fs.mkdtempSync(path.join(os.tmpdir(),`rncs-character-${name}-`));
const fixture=(overrides={})=>createCharacterGenome({name:'Lan Tianlin',seed:'lan-tianlin-test-v1',topology_family:'young-male-slim',identity_parameters:{'face.jaw_definition':.62,'face.eye_spacing':.48,'face.nose_bridge':.56,'face.mouth_width':.51},body_parameters:{'body.head_body_ratio':.58,'body.shoulder_width':.55},...overrides});

test('reference provider compiles a real cross-media character family',()=>{
  const out=temp('compile'),result=compileCharacterPhenotype(fixture(),{outDir:out});
  assert.equal(result.validation.valid,true);
  assert.equal(result.quality.valid,true);
  assert.equal(result.family.counts.identity_morphs,28);
  assert.equal(result.family.counts.expressions,8);
  assert.equal(result.family.counts.visemes,14);
  assert.equal(result.family.counts.bones,21);
  assert.deepEqual(result.family.lods.map(item=>item.lod),[0,1,2]);
  assert.equal(new Set(result.family.lods.map(item=>item.root)).size,3);
  assert.ok(result.family.lods[0].triangles>result.family.lods[1].triangles);
  assert.ok(result.family.lods[1].triangles>result.family.lods[2].triangles);
  for(const file of ['character.glb','body.glb','face.glb','hair.glb','costume.glb','native-2d/face.svg','2.5d/manifest.json','3d-assisted-2d/color.png'])assert.ok(fs.statSync(path.join(out,file)).size>32,file);
  const layers=['back-hair','body','costume','face','eyes','brows','mouth','front-hair','shadow','highlight'].map(layer=>fs.readFileSync(path.join(out,'native-2d',`${layer}.svg`),'utf8'));
  assert.equal(new Set(layers).size,layers.length);
  assert.equal(validateCharacterVisualProfile(JSON.parse(fs.readFileSync(path.join(out,'vsr-character-profile.json'),'utf8'))).valid,true);
  assert.equal(validateCharacterBodyProfile(JSON.parse(fs.readFileSync(path.join(out,'rsr-character-body-profile.json'),'utf8'))).valid,true);
  assert.equal(verifyCharacterAssetDirectory(out).ok,true);
});

test('same seed and inputs reproduce genome, asset and file roots',()=>{
  const genomeA=fixture(),genomeB=fixture(),a=compileCharacterPhenotype(genomeA,{outDir:temp('det-a')}),b=compileCharacterPhenotype(genomeB,{outDir:temp('det-b')});
  assert.equal(genomeA.genome_root,genomeB.genome_root);
  assert.equal(a.family.asset_root,b.family.asset_root);
  assert.deepEqual(a.manifest.files.map(item=>[item.path,item.root]),b.manifest.files.map(item=>[item.path,item.root]));
});

test('three implemented topology families generate distinct valid geometry',()=>{
  const roots=[];
  for(const topology of ['young-male-slim','young-male-standard','young-female-standard']){
    const result=compileCharacterPhenotype(fixture({seed:`topology-${topology}`,topology_family:topology,appearance:{costume_family:'urban-field-v1'}}),{outDir:temp(topology)});
    assert.equal(result.validation.valid,true,topology);
    roots.push(result.family.lods[0].root);
  }
  assert.equal(new Set(roots).size,3);
});

test('recolor uses a material-only rebuild and preserves all geometry roots',()=>{
  const out=temp('recolor'),before=fixture(),initial=compileCharacterPhenotype(before,{outDir:out}),after=applyAppearanceLoadout(before,{hair_color:'#293654'}),next=rebuildCharacterPhenotype(before,after,{outDir:out,changePath:'hair.color'});
  assert.equal(after.identity_root,before.identity_root);
  assert.equal(next.rebuild_receipt.valid,true);
  assert.equal(next.performance.mesh_morph_and_lod_ms,0);
  for(const file of ['character.glb','character-lod0.glb','character-lod1.glb','character-lod2.glb','body.glb','face.glb','hair.glb','costume.glb'])assert.equal(initial.manifest.files.find(item=>item.path===file).root,next.manifest.files.find(item=>item.path===file).root,file);
});

test('hair and costume swaps preserve body, face and identity authority',()=>{
  const hairOut=temp('hair'),before=fixture(),initial=compileCharacterPhenotype(before,{outDir:hairOut}),hairGenome=applyAppearanceLoadout(before,{hair_family:'short-layered'}),hair=rebuildCharacterPhenotype(before,hairGenome,{outDir:hairOut,changePath:'hair.family'});
  assert.equal(hair.family.identity_root,initial.family.identity_root);
  assert.equal(hair.family.modules.body,initial.family.modules.body);
  assert.equal(hair.family.modules.face,initial.family.modules.face);
  assert.notEqual(hair.family.modules.hair,initial.family.modules.hair);
  const costumeGenome=applyAppearanceLoadout(hairGenome,{costume_family:'urban-field-v1'}),costume=rebuildCharacterPhenotype(hairGenome,costumeGenome,{outDir:hairOut,changePath:'costume.family'});
  assert.equal(costume.family.identity_root,initial.family.identity_root);
  assert.equal(costume.family.modules.body,initial.family.modules.body);
  assert.equal(costume.family.modules.face,initial.family.modules.face);
  assert.notEqual(costume.family.modules.costume,initial.family.modules.costume);
});

test('snapshot, tamper detection and rollback restore the exact identity',()=>{
  const out=temp('rollback'),genome=fixture(),built=compileCharacterPhenotype(genome,{outDir:out}),snapshot=snapshotCharacterAsset(out,'accepted');
  fs.writeFileSync(path.join(out,'face.glb'),Buffer.from('tampered'));
  assert.equal(verifyCharacterAssetDirectory(out).ok,false);
  const rollback=rollbackCharacterAsset(out,'accepted');
  assert.equal(rollback.identity_signature_root,built.family.identity_signature.signature_root);
  assert.equal(rollback.asset_root,snapshot.asset_root);
  assert.equal(verifyCharacterAssetDirectory(out).ok,true);
});

test('unknown providers and unlicensed families fail closed',()=>{
  assert.throws(()=>compileCharacterPhenotype(fixture(),{outDir:temp('provider'),provider:'cloud-auto'}),/CHARACTER_PROVIDER_NOT_CONFIGURED/);
  const out=temp('license'),built=compileCharacterPhenotype(fixture(),{outDir:out}),family=structuredClone(built.family);delete family.provider_receipt.license;
  fs.writeFileSync(path.join(out,'family.json'),JSON.stringify(family));
  assert.equal(verifyCharacterAssetDirectory(out).ok,false);
});
