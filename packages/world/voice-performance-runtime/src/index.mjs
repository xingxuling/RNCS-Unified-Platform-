import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const VOICE_PERFORMANCE_FORMAT='rncs.voice-performance-bundle.v0.1';
export const REFERENCE_VOICE_PROVIDER='taowind.voice-forge.reference-synthetic-v0.1';
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const hzFor=char=>150+(Array.from(char).reduce((sum,item)=>sum+item.codePointAt(0),0)%180);

export function writeWavPcm16({sampleRate=22050,channels=1,samples}){
  const pcm=Buffer.alloc(samples.length*2);for(let index=0;index<samples.length;index++)pcm.writeInt16LE(Math.round(clamp(samples[index],-1,1)*32767),index*2);
  const header=Buffer.alloc(44);header.write('RIFF',0);header.writeUInt32LE(36+pcm.length,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(channels,22);header.writeUInt32LE(sampleRate,24);header.writeUInt32LE(sampleRate*channels*2,28);header.writeUInt16LE(channels*2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);return Buffer.concat([header,pcm]);
}

function createTimeline(text,startSeconds){
  const chars=Array.from(String(text)).filter(char=>!/[\s，。！？、,.!?]/u.test(char));const wordTimeline=[],phonemeTimeline=[],visemeTimeline=[];let cursor=startSeconds;
  const shapes=['a','o','i','u'];
  for(const [index,char] of chars.entries()){
    const duration=.16+(char.codePointAt(0)%5)*.018,shape=shapes[index%shapes.length],end=cursor+duration;
    wordTimeline.push({index,text:char,start:cursor,end});phonemeTimeline.push({index,phoneme:`p${index+1}`,start:cursor,end});visemeTimeline.push({index,shape,start:cursor,end});cursor=end+.025;
  }
  return{wordTimeline,phonemeTimeline,visemeTimeline,duration_seconds:Math.max(.2,cursor-startSeconds)};
}

export function createVoiceIdentity({characterId='character:unknown',voiceIdentity='default',language='zh-CN',seed='reference'}={}){return{voice_identity:`${characterId}.${voiceIdentity}`,character_id:characterId,language,seed,provider:REFERENCE_VOICE_PROVIDER,continuity:{base_voiceprint_root:hash({characterId,voiceIdentity,language,seed}),pronunciation_profile:'deterministic-reference',pace_range:[.86,1.12],pitch_range_hz:[140,320],emotion_map:['neutral','restrained_question','resolve'],performance_boundary:'reference-synthetic-not-human-performance'}}}

export function generateVoicePerformance(intent={},options={}){
  const text=String(intent.text??''),sampleRate=Number(options.sampleRate??22050),identity=createVoiceIdentity({characterId:intent.character_id,voiceIdentity:intent.voice_identity??'default',language:intent.language??'zh-CN',seed:options.seed??'voice-reference-v0.1'}),start=Number(intent.start_seconds??0),timeline=createTimeline(text,start),duration=timeline.duration_seconds+.08,totalSamples=Math.ceil(duration*sampleRate),samples=new Float32Array(totalSamples),pace=clamp(Number(intent.pace??1),.5,2),intensity=clamp(Number(intent.intensity??.62),.1,1),pitchOffset=Number(intent.pitch??0);
  for(const item of timeline.phonemeTimeline){const localStart=Math.floor(item.start*sampleRate),localEnd=Math.min(totalSamples,Math.ceil(item.end*sampleRate));const frequency=hzFor(text[item.index]??'a')+pitchOffset;for(let sample=localStart;sample<localEnd;sample++){const t=(sample/sampleRate)-item.start,span=Math.max(.001,item.end-item.start),phase=t*frequency*2*Math.PI,envelope=Math.min(1,t/.025,(item.end-(sample/sampleRate))/.035),value=(Math.sin(phase)+.34*Math.sin(phase*2)+.12*Math.sin(phase*3))*envelope*intensity*.28;samples[sample]+=value/Math.max(1,pace)}}
  const wav=writeWavPcm16({sampleRate,channels:1,samples}),bundle={format:VOICE_PERFORMANCE_FORMAT,version:'0.1.0-alpha.1',dialogue_event_id:String(intent.dialogue_event_id??`dialogue:${hash({text,identity:identity.voice_identity,start}).slice(0,24)}`),voice_identity:identity.voice_identity,character_id:identity.character_id,text,language:identity.language,start_seconds:start,performance:{pronunciation:intent.pronunciation??'default',emotion:intent.emotion??'neutral',intensity,pace,pitch:pitchOffset,pause_policy:intent.pause_policy??'short',breath_policy:intent.breath_policy??'reference'},duration_seconds:duration,sample_rate:sampleRate,transcript:{text,language:identity.language},word_timeline:timeline.wordTimeline,phoneme_timeline:timeline.phonemeTimeline,viseme_timeline:timeline.visemeTimeline.map(item=>({...item,authority:'final-dialogue-audio'})),emotion_curve:[{time:start,value:intent.emotion??'neutral'},{time:start+duration,value:intent.emotion??'neutral'}],prosody_curve:[{time:start,pitch_hz:hzFor(text[0]??'a')+pitchOffset},{time:start+duration,pitch_hz:hzFor(text.at(-1)??'a')+pitchOffset}],breath_timeline:[{time:start,kind:'breath-in'},{time:start+duration,kind:'breath-out'}],waveform_summary:{peak:Math.max(...samples.map(value=>Math.abs(value))),rms:Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/Math.max(1,samples.length)),sample_count:samples.length},provider_receipt:{provider_id:REFERENCE_VOICE_PROVIDER,version:'0.1.0',mode:'reference',authority:'candidate',quality_boundary:'synthetic voiced reference; not a professional Japanese/Chinese actor performance'},identity,authority:{single_active_take:true,dialogue_event_id:String(intent.dialogue_event_id??''),mouth_driver:'viseme_timeline',close_mouth_on_end:true},evidence:{source_root:hash(intent),audio_root:hash(wav.toString('base64')),identity_root:hash(identity)}};
  bundle.bundle_root=hash({...bundle,audio_root:bundle.evidence.audio_root});
  if(options.outDir){fs.mkdirSync(options.outDir,{recursive:true});fs.writeFileSync(path.join(options.outDir,'dialogue.wav'),wav);for(const [name,value] of Object.entries({transcript:bundle.transcript,word_timeline:bundle.word_timeline,phoneme_timeline:bundle.phoneme_timeline,viseme_timeline:bundle.viseme_timeline,emotion_curve:bundle.emotion_curve,prosody_curve:bundle.prosody_curve,breath_timeline:bundle.breath_timeline,waveform_summary:bundle.waveform_summary,provider_receipt:bundle.provider_receipt,evidence:bundle.evidence,voice_identity:bundle.voice_identity,bundle:bundle}))fs.writeFileSync(path.join(options.outDir,`${name}.json`),JSON.stringify(value,null,2));}
  return{bundle,wav};
}

export function validateVoicePerformance(bundle){const errors=[];if(bundle?.format!==VOICE_PERFORMANCE_FORMAT)errors.push('VOICE_BUNDLE_FORMAT_INVALID');if(!bundle?.dialogue_event_id)errors.push('DIALOGUE_EVENT_ID_REQUIRED');if(!bundle?.voice_identity)errors.push('VOICE_IDENTITY_REQUIRED');if(!bundle?.authority?.single_active_take)errors.push('VOICE_SINGLE_AUTHORITY_REQUIRED');if(bundle?.authority?.mouth_driver!=='viseme_timeline')errors.push('VOICE_MOUTH_AUTHORITY_INVALID');if((bundle?.viseme_timeline??[]).some(item=>item.end<item.start))errors.push('VISEME_TIME_INVALID');return{valid:errors.length===0,errors,bundle_root:bundle?.bundle_root??null};}

export function buildMouthTrackFromVoice(bundle,{fps=24,closeFrame=null}={}){const frames=[];for(const item of bundle.viseme_timeline??[]){const start=Math.max(0,Math.floor(item.start*fps)),end=Math.max(start,Math.ceil(item.end*fps)-1);frames.push({dialogue_event_id:bundle.dialogue_event_id,start_frame:start,end_frame:end,shape:item.shape,authority:'final-dialogue-audio'});}const last=closeFrame??Math.ceil(((bundle.start_seconds??0)+(bundle.duration_seconds??0))*fps);frames.push({dialogue_event_id:bundle.dialogue_event_id,start_frame:last,end_frame:last,shape:'closed',authority:'final-dialogue-audio'});return frames;}
