import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createAnimeProduction,discoverMediaTool,muxEpisodeWithFfmpeg,renderProduction,runMediaTool} from '../src/index.mjs';
import {writeWavPcm16} from '../../voice-performance-runtime/src/index.mjs';

const base={episode_id:'EP01',scene_id:'court',duration:.04,fps:24,resolution:{width:160,height:90},mode:'native-2d',background_layers:[{layer_id:'background:court'}],character_layers:[{layer_id:'character:lan',actor_id:'lan',asset_id:'character:lan'}],key_pose_track:[{frame:0,pose_id:'hold'}],animation:{exposure:'on_twos'},transition:{type:'hard-cut',duration_frames:0}};

test('VideoMuxProvider fails closed when FFmpeg is unavailable',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'anime-mux-missing-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const frames=path.join(dir,'frames');fs.mkdirSync(frames);const audio=path.join(dir,'episode.wav');fs.writeFileSync(audio,writeWavPcm16({sampleRate:22050,samples:new Float32Array(2205)}));const out=path.join(dir,'episode.mp4'),result=muxEpisodeWithFfmpeg({buildDir:dir,framesDir:frames,audioFile:audio,outFile:out,frameManifest:{status:'complete',rendered_frame_count:1,expected_frame_count:1,width:160,height:90,fps:24,duration:1/24,sequence_root:'sequence'},ffmpegPath:path.join(dir,'missing-ffmpeg'),ffprobePath:path.join(dir,'missing-ffprobe')});assert.equal(result.ok,false);assert.equal(result.report.code,'FFMPEG_UNAVAILABLE');assert.equal(fs.existsSync(out),false);
});
test('media process timeout is classified explicitly',()=>{const result=runMediaTool(process.execPath,['-e','setTimeout(()=>{},1000)'],{timeoutMs:10});assert.equal(result.ok,false);assert.equal(result.code,'PROVIDER_TIMEOUT')});

test('real FFmpeg muxes actual PNG frames and WAV, then ffprobe verifies the MP4',t=>{
  const ffmpeg=discoverMediaTool(process.env.FFMPEG_PATH??'ffmpeg','ffmpeg'),ffprobe=discoverMediaTool(process.env.FFPROBE_PATH??'ffprobe','ffprobe');
  if(!ffmpeg.available||!ffprobe.available){if(process.env.ANIME_REQUIRE_FFMPEG==='1')assert.fail(`FFmpeg gate required: ffmpeg=${ffmpeg.code}, ffprobe=${ffprobe.code}`);t.skip('FFmpeg/ffprobe unavailable on this host');return}
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'anime-mux-real-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const production=createAnimeProduction({series:'Mux',episode:'EP01',cuts:[{...base,cut_id:'S01',layout:'wide_establishing'},{...base,cut_id:'S02',layout:'medium_close_up'},{...base,cut_id:'S03',layout:'close_up'}]}),rendered=renderProduction(production,{outDir:dir,width:160,height:90}),samples=new Float32Array(Math.ceil(rendered.manifest.duration*22050));for(let index=0;index<samples.length;index++)samples[index]=Math.sin(index/22050*220*Math.PI*2)*.08;const audio=path.join(dir,'episode.wav');fs.writeFileSync(audio,writeWavPcm16({sampleRate:22050,samples}));const out=path.join(dir,'episode.mp4'),result=muxEpisodeWithFfmpeg({buildDir:dir,framesDir:path.join(dir,'frames'),audioFile:audio,outFile:out,frameManifest:rendered.manifest,ffmpegPath:ffmpeg.executable,ffprobePath:ffprobe.executable});assert.equal(result.ok,true,result.report?.code);assert.equal(result.probe_report.validation.valid,true);assert.equal(result.probe_report.probe.video.frame_count,3);assert.equal(result.probe_report.probe.audio.codec,'aac');assert.ok(fs.statSync(out).size>256);
});
