import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createAnimeProduction,createAnimeProviderManifest,createBuiltinAnimeProviderManifests,executeProviderFallback,validateAnimeProduction,validateAnimeProviderManifest,validateEpisodeAuthorityContract,validateEpisodeCompositionContract} from '../src/index.mjs';

const cut={episode_id:'EP01',scene_id:'court',cut_id:'S01',duration:1,fps:24,resolution:{width:960,height:540},mode:'native-2d',background_layers:[{layer_id:'background:court'}],character_layers:[{layer_id:'character:lan',actor_id:'lan',asset_id:'character:lan'}],key_pose_track:[{frame:0,pose_id:'hold'}],animation:{exposure:'on_twos'}};

test('Anime Provider Manifest schema and built-in real-media declarations are sealed',()=>{
  const schema=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'../schemas/anime-provider-manifest.v0.1.schema.json'),'utf8'));
  assert.equal(schema.properties.format.const,'rncs.anime-provider-manifest.v0.1');
  assert.ok(schema.required.includes('determinism'));
  assert.ok(schema.required.includes('failures'));
  const manifests=createBuiltinAnimeProviderManifests();
  assert.equal(manifests.every(item=>validateAnimeProviderManifest(item).valid),true);
  assert.equal(manifests.some(item=>item.role==='asset'&&item.media.produces_media),true);
  const ragf=manifests.find(item=>item.provider_id==='ragf.anime-builtin-generator');
  assert.ok(ragf.outputs.includes('png-character-sequence'));
  assert.ok(ragf.outputs.includes('motion-track.json'));
  assert.ok(ragf.media.media_types.includes('image/png-sequence'));
  assert.ok(ragf.motion.capabilities.includes('secondary-motion-track'));
  assert.equal(ragf.motion.binding_contract.format,'rncs.ragf-motion-xsheet-binding.v0.1');
  assert.equal(ragf.motion.binding_contract.mapping,'floor-by-timebase');
  assert.equal(ragf.motion.binding_contract.default_policy,'loop');
  assert.ok(ragf.motion.binding_contract.policies.includes('loop'));
  assert.ok(ragf.motion.capabilities.includes('loopable-motion-sequence'));
  assert.ok(ragf.motion.capabilities.includes('seam-continuity-quality'));
  assert.ok(ragf.outputs.includes('motion-seam-quality-report'));
  assert.ok(ragf.evidence.outputs.includes('seam-quality'));
  assert.equal(manifests.some(item=>item.role==='frame-render'&&item.outputs.includes('png-frame-sequence')),true);
});

test('Provider validation rejects mock media and authority escalation',()=>{
  const manifest=createAnimeProviderManifest({provider_id:'bad',role:'asset',inputs:['intent'],outputs:['image'],media:{produces_media:true,media_types:['image/png'],mock:true},authority:{identity_write:true}});
  const validation=validateAnimeProviderManifest(manifest);
  assert.equal(validation.valid,false);
  assert.ok(validation.errors.includes('ANIME_PROVIDER_MOCK_OR_FIXTURE_FORBIDDEN'));
  assert.ok(validation.errors.includes('ANIME_PROVIDER_AUTHORITY_ESCALATION'));
});

test('Production seals Episode authority, derived Cut status and Composition contract',()=>{
  const profile={exposure:{anchor:'episode-exposure-v2'},compositing:{colour_anchor:'episode-colour-v2'}},production=createAnimeProduction({series:'Phase 4',episode:'EP01',cuts:[cut,{...cut,cut_id:'S02'}],rendering_profiles:{'EP01/court/S01':profile,'EP01/court/S02':profile}});
  assert.equal(validateAnimeProduction(production).valid,true);
  assert.equal(validateEpisodeAuthorityContract(production.authority_contract).valid,true);
  assert.equal(validateEpisodeCompositionContract(production.composition_contract,production).valid,true);
  assert.equal(production.authority_contract.episode_authoritative,true);
  assert.equal(production.cuts.every(item=>item.authority.derived_from_episode&&!item.authority.creative_authority),true);
  assert.equal(production.composition_contract.cut_contracts.every(item=>item.colour_anchor==='episode-colour-v2'&&item.exposure_anchor==='episode-exposure-v2'),true);
});

test('Provider timeout is recorded and an explicit fallback may be accepted',async()=>{
  const slow={manifest:createAnimeProviderManifest({provider_id:'slow',role:'asset',inputs:['intent'],outputs:['media'],limits:{timeout_ms:5}})},fast={provider_id:'fast'};
  const result=await executeProviderFallback([slow,fast],provider=>provider===slow?new Promise(resolve=>setTimeout(()=>resolve({ok:true}),40)):({ok:true,media_root:'accepted'}),{timeoutMs:50});
  assert.equal(result.ok,true);
  assert.equal(result.provider_id,'fast');
  assert.equal(result.attempts[0].status,'timeout');
  assert.equal(result.attempts[0].timeout_ms,5);
  assert.equal(result.attempts[1].status,'accepted');
});
test('RAGF provider manifest declares pixel-verified visual state evidence',()=>{const ragf=createBuiltinAnimeProviderManifests().find(item=>item.provider_id==='ragf.anime-builtin-generator');assert.ok(ragf.outputs.includes('motion-visual-quality-report'));assert.ok(ragf.motion.capabilities.includes('pixel-verified-state-coverage'));assert.ok(ragf.evidence.outputs.includes('pixel-roots'));});
