import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {startStudioServer} from '../src/server.mjs';

const source=fs.readFileSync(path.resolve(import.meta.dirname,'../../../packages/integration/rcl-anime-production-bridge/examples/shenlinzhe-yanlv.rcl'),'utf8');
const editorialSource=fs.readFileSync(path.resolve(import.meta.dirname,'../../../packages/integration/rcl-anime-production-bridge/examples/shenlinzhe-yanlv-editorial.rcl'),'utf8');
const microEpisodeSource=fs.readFileSync(path.resolve(import.meta.dirname,'../../../packages/integration/rcl-anime-production-bridge/examples/shenlinzhe-yanlv-micro-episode.rcl'),'utf8');
const post=(url,route,value)=>fetch(url+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)}).then(async response=>({status:response.status,value:await response.json()}));

test('Anime Forge Studio preserves the Phase 1 Cut and runs the Phase 3 editorial chain',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'anime-forge-studio-')),started=await startStudioServer({port:0,dataDir:dir});
  try{
    const page=await fetch(started.url+'/anime-forge.html');assert.equal(page.status,200);assert.match(await page.text(),/RNCS Anime Forge v0\.1/);
    const compiled=await post(started.url,'/api/anime-forge/compile',{source});assert.equal(compiled.status,200);assert.equal(compiled.value.ok,true);assert.equal(compiled.value.cut.frame_count,120);assert.ok(compiled.value.asset_family_roots.character);assert.equal(compiled.value.quality.playable,false);assert.deepEqual(compiled.value.quality.failures,['FINAL_MEDIA_NOT_BUILT']);
    const sessionId=compiled.value.session_id;
    const sheet=await post(started.url,'/api/anime-forge/xsheet',{session_id:sessionId});assert.equal(sheet.value.ok,true);assert.equal(sheet.value.xsheet.frames.length,120);assert.equal(sheet.value.xsheet.frames[0].dialogue_state,null);assert.match(sheet.value.xsheet.frames[35].secondary_motion_state.hair_override,/^motion:hair:/);
    const candidate=await post(started.url,'/api/anime-forge/control-plane',{session_id:sessionId});assert.equal(candidate.value.ok,true);assert.equal(candidate.value.status,'candidate');assert.equal(candidate.value.commit_permitted,false);assert.ok(candidate.value.candidate_branch.branch_id);
    const voice=await post(started.url,'/api/anime-forge/voice',{session_id:sessionId});assert.equal(voice.value.ok,true);assert.ok(voice.value.voice.bundle_root);assert.ok(voice.value.voice.viseme_count>0);
    const beforeReplacement=await post(started.url,'/api/anime-forge/session/inspect',{session_id:sessionId});
    const replacement=await post(started.url,'/api/anime-forge/voice',{session_id:sessionId,voice_identity:'alternate',text:'此案重审。'});assert.equal(replacement.value.ok,true);assert.equal(replacement.value.replaced,true);assert.equal(replacement.value.take_id.endsWith(':v2'),true);
    const session=started.animeForgeSessions.get(sessionId);assert.equal(session.production.cut.voice_track.filter(item=>item.active).length,1);assert.ok(session.production.cut.voice_track.filter(item=>item.active===false).length>=1);assert.equal(new Set(session.production.cut.voice_track.map(item=>item.take_id)).size,session.production.cut.voice_track.length);assert.deepEqual(session.inspect().asset_family_roots,beforeReplacement.value.asset_family_roots);
    const rendered=await post(started.url,'/api/anime-forge/render',{session_id:sessionId,quality:'preview',max_frames:120});assert.equal(rendered.value.ok,true);assert.equal(rendered.value.manifest.rendered_frame_count,120);assert.match(rendered.value.preview_frame,/^data:image\/png;base64,/);
    const mixed=await post(started.url,'/api/anime-forge/mix',{session_id:sessionId});assert.equal(mixed.value.ok,true);assert.ok(mixed.value.audio_root);assert.ok(mixed.value.stems.master);
    const verified=await post(started.url,'/api/anime-forge/verify',{session_id:sessionId});assert.equal(verified.value.ok,true);assert.deepEqual(verified.value.errors,[]);
    const replay=await post(started.url,'/api/anime-forge/replay',{session_id:sessionId});assert.equal(replay.value.valid,true);assert.equal(replay.value.frame_count,120);
    const snap=await post(started.url,'/api/anime-forge/snapshot',{session_id:sessionId,id:'phase1'});assert.equal(snap.value.ok,true);
    const rollback=await post(started.url,'/api/anime-forge/rollback',{session_id:sessionId,snapshot_id:'phase1'});assert.equal(rollback.value.status,'restored-authoring-state');assert.equal(rollback.value.frames_preserved,false);
    assert.ok(fs.existsSync(path.join(dir,'anime-forge',sessionId,'render','evidence-ledger.json')));
    const editorial=await post(started.url,'/api/anime-forge/compile',{source:editorialSource});assert.equal(editorial.value.ok,true);assert.equal(editorial.value.cut_count,2);assert.equal(editorial.value.total_frame_count,168);const editorialSession=editorial.value.session_id,secondRef=editorial.value.cuts[1].cut_ref;
    const selected=await post(started.url,'/api/anime-forge/select-cut',{session_id:editorialSession,cut_ref:secondRef});assert.equal(selected.value.ok,true);assert.equal(selected.value.active_cut_ref,secondRef);assert.equal(selected.value.session.cut.cut_id,'S02');assert.equal(selected.value.production_root,editorial.value.production_root);assert.equal(selected.value.session.production_root,editorial.value.production_root);assert.equal(selected.value.production_mutated,false);assert.equal(selected.value.authority,'inspection-only');
    const secondSheet=await post(started.url,'/api/anime-forge/xsheet',{session_id:editorialSession,cut_ref:secondRef});assert.equal(secondSheet.value.xsheet.frame_count,48);assert.equal(secondSheet.value.xsheet.cut_ref,secondRef);
    const secondVoice=await post(started.url,'/api/anime-forge/voice',{session_id:editorialSession});assert.equal(secondVoice.value.ok,true);assert.equal(secondVoice.value.cut_ref,secondRef);
    const partialSequence=await post(started.url,'/api/anime-forge/render',{session_id:editorialSession,quality:'preview',max_frames:4});assert.equal(partialSequence.value.manifest.cut_count,2);assert.equal(partialSequence.value.manifest.status,'partial');const partialReplay=await post(started.url,'/api/anime-forge/replay',{session_id:editorialSession});assert.equal(partialReplay.value.valid,true);assert.equal(partialReplay.value.frame_count,4);
  }finally{await new Promise(resolve=>started.server.close(resolve))}
});

test('Anime Forge Studio closes real Phase 4 media and exposes read-only evidence', {skip:!(process.env.FFMPEG_PATH&&process.env.FFPROBE_PATH)},async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'anime-forge-studio-media-')),started=await startStudioServer({port:0,dataDir:dir,ffmpegPath:process.env.FFMPEG_PATH,ffprobePath:process.env.FFPROBE_PATH});
  try{
    const compiled=await post(started.url,'/api/anime-forge/compile',{source:microEpisodeSource});assert.equal(compiled.value.ok,true);assert.equal(compiled.value.cut_count,3);assert.equal(compiled.value.total_frame_count,480);
    const built=await post(started.url,'/api/anime-forge/media',{session_id:compiled.value.session_id,quality:'preview'});assert.equal(built.status,200);assert.equal(built.value.ok,true);assert.equal(built.value.status,'complete');assert.equal(built.value.quality.playable,true);assert.deepEqual(built.value.quality.failures,[]);assert.equal(built.value.quality.character_continuity.status,'pass');assert.equal(built.value.quality.cut_continuity.status,'pass');assert.equal(built.value.quality.cut_continuity.issue_count,0);assert.equal(built.value.quality.audio_video_sync.status,'pass');assert.equal(built.value.quality.mp4_build.ffprobe_valid,true);assert.ok(built.value.quality.secondary_motion_tracks.length>=3);assert.ok(built.value.quality.provider_usage.some(item=>item.provider_id==='rncs.video-mux.ffmpeg'&&item.status==='complete'&&item.deterministic===false));
    const wavFile=path.join(dir,'anime-forge',compiled.value.session_id,'media','episode.wav'),wavSha=crypto.createHash('sha256').update(fs.readFileSync(wavFile)).digest('hex');assert.equal(built.value.summary.wav.sha256,wavSha);
    const video=await fetch(started.url+built.value.media_url),bytes=Buffer.from(await video.arrayBuffer());assert.equal(video.status,200);assert.equal(video.headers.get('content-type'),'video/mp4');assert.ok(bytes.length>100000);assert.equal(bytes.subarray(4,8).toString('ascii'),'ftyp');
    const ledger=await fetch(started.url+built.value.evidence_ledger_url).then(response=>response.json());assert.equal(ledger.status,'complete');assert.equal(ledger.gates.mp4,true);assert.equal(ledger.gates.ffprobe,true);
  }finally{await new Promise(resolve=>started.server.close(resolve))}
});
