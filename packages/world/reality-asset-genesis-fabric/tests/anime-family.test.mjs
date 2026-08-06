import test from 'node:test';
import assert from 'node:assert/strict';
import {generateAnimeCharacterFamily,generateAnimeBackgroundFamily,validateAnimeCharacterFamily,validateAnimeBackgroundFamily} from '../src/index.mjs';

test('Anime RAGF character and background families pass provider and continuity gates',()=>{const character=generateAnimeCharacterFamily({assetId:'character:test',name:'Test Character'}),background=generateAnimeBackgroundFamily({assetId:'background:test',name:'Test Background'});assert.equal(validateAnimeCharacterFamily(character.family).valid,true);assert.equal(validateAnimeBackgroundFamily(background.family).valid,true);assert.equal(Object.keys(character.files).length,9);assert.equal(Object.keys(background.files).length,1);assert.equal(character.family.optional_3d_proxy.status,'not-implemented');assert.equal(character.family.optional_3d_proxy.provider,null)});
test('Anime RAGF family tampering is rejected',()=>{const family=generateAnimeCharacterFamily({assetId:'character:test'}).family;const tampered={...family,provider:{...family.provider,mode:'external'}};assert.equal(validateAnimeCharacterFamily(tampered).valid,false)});
