import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {seal} from '../../reality-asset-genesis-fabric/src/canonical.mjs';
import {createCharacterGenome} from '../../character-genome-runtime/src/index.mjs';
import {compileCharacterPhenotype,validateCharacterAssetFamily,verifyCharacterAssetDirectory} from '../src/index.mjs';

let out,built;
test.before(()=>{out=fs.mkdtempSync(path.join(os.tmpdir(),'character-negative-'));built=compileCharacterPhenotype(createCharacterGenome({name:'Negative Gate',seed:'negative-gate'}),{outDir:out})});
const reseal=patch=>seal({...structuredClone(built.family),...patch,family_root:''},'family_root');

test('copied or reversed LODs are rejected',()=>{const duplicate=structuredClone(built.family.lods);duplicate[1].root=duplicate[0].root;assert.ok(validateCharacterAssetFamily(reseal({lods:duplicate})).errors.includes('CHARACTER_LOD_ROOT_DUPLICATE'));const reversed=structuredClone(built.family.lods).reverse();assert.ok(validateCharacterAssetFamily(reseal({lods:reversed})).errors.includes('CHARACTER_LOD_ORDER_INVALID'))});
test('cross-media identity divergence is rejected',()=>{const modes=structuredClone(built.family.cross_media.modes);modes[0].identity_signature_root='0'.repeat(64);const family=reseal({cross_media:{...built.family.cross_media,modes}});assert.ok(validateCharacterAssetFamily(family).errors.some(code=>code.startsWith('CHARACTER_MODE_IDENTITY_DIVERGENCE')))});
test('failed geometry or intersection quality cannot be accepted',()=>{const family=reseal({quality:{...built.family.quality,valid:false}});assert.ok(validateCharacterAssetFamily(family).errors.includes('CHARACTER_QUALITY_GATE_FAILED'))});
test('missing VSR, RSR, rig modules or provider identity authority fail closed',()=>{const noRuntime=reseal({runtime_profiles:{}});assert.ok(validateCharacterAssetFamily(noRuntime).errors.includes('CHARACTER_VSR_PROFILE_REQUIRED'));const noFace=reseal({modules:{...built.family.modules,face:null}});assert.ok(validateCharacterAssetFamily(noFace).errors.includes('CHARACTER_MODULE_REQUIRED:face'));const provider=reseal({provider_receipt:{...built.family.provider_receipt,identity_authority:'provider:auto'}});assert.ok(validateCharacterAssetFamily(provider).errors.includes('CHARACTER_PROVIDER_IDENTITY_AUTHORITY_INVALID'))});
test('file tampering, failed retarget profile writes and eyeball edits are detected by roots',()=>{for(const file of ['retarget-profile.json','collision-profile.json','face.glb']){const original=fs.readFileSync(path.join(out,file));fs.writeFileSync(path.join(out,file),Buffer.from('tampered'));assert.equal(verifyCharacterAssetDirectory(out).ok,false,file);fs.writeFileSync(path.join(out,file),original)}assert.equal(verifyCharacterAssetDirectory(out).ok,true)});
