import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {buildPhase62Evidence,validatePhase62Evidence} from '../src/build62.mjs';

const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

test('Phase 6.2 evidence build emits ten diagnostic views, three Cuts and a fail-closed media result',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-phase6-2-evidence-')),result=buildPhase62Evidence({outDir:out}),pack=result.validationPack,manifest=result.episode.frameManifest;
  assert.equal(pack.views.length,10);assert.equal(manifest.frame_count,120);assert.equal(result.episode.cuts.length,3);assert.equal(result.episode.episodeIntent.authority,'Episode is authoritative');assert.equal(fs.existsSync(path.join(out,'episode.wav')),true);
  for(const view of pack.views){for(const item of Object.values(view.files)){assert.equal(fs.existsSync(path.join(out,item.path)),true,item.path);assert.equal(item.sha256,hash(path.join(out,item.path)),item.path);}}
  const verification=validatePhase62Evidence(out);assert.deepEqual(verification.missing,[]);assert.equal(verification.verification.checks.validation_pack,true);assert.equal(verification.verification.checks.three_derived_cuts,true);
  if(result.episode.media.status==='blocked'){assert.equal(result.episode.media.mp4,null);assert.equal(fs.existsSync(path.join(out,'episode.mp4')),false);assert.equal(verification.media_ready,false)}else{assert.equal(verification.media_ready,true);assert.equal(fs.existsSync(path.join(out,'episode.mp4')),true)}
});

test('stable Phase 6.2 roots repeat across two clean evidence builds',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-phase6-2-determinism-')),first=buildPhase62Evidence({outDir:out}),second=buildPhase62Evidence({outDir:out});
  assert.equal(second.system.canonical_morphology_asset.morphology_root,first.system.canonical_morphology_asset.morphology_root);assert.equal(second.validationPack.pack_root,first.validationPack.pack_root);assert.equal(second.episode.frameManifest.frame_manifest_root,first.episode.frameManifest.frame_manifest_root);assert.equal(second.episode.episodeIntent.episode_intent_root,first.episode.episodeIntent.episode_intent_root);assert.equal(second.episode.media.wav.sha256,first.episode.media.wav.sha256);
});
