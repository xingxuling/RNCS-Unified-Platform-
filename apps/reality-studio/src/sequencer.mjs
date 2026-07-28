import {createHash,randomUUID} from 'node:crypto';
const clone=v=>structuredClone(v);
const canonical=v=>Array.isArray(v)?v.map(canonical):(v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v);
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const authorityTracks=new Set(['behavior','quest','network','physics','branch']);
const presentationTracks=new Set(['camera','animation','dialogue','audio','effect','light']);
export const SEQUENCER_VERSION='1.7.0-alpha.1';

function assetKind(record){
  if(record?.kind)return String(record.kind);
  return (record?.files??[]).some(file=>String(file.mime??'').startsWith('audio/'))?'audio':'unknown';
}

export function createDefaultSequence(project={}){
  const scene=(project.scenes??[]).find(item=>item.scene_id===project.active_scene_id)??project.scenes?.[0]??{};
  const audioAsset=(project.assets?.order??[]).map(id=>project.assets.registry?.[id]).find(record=>assetKind(record)==='audio');
  const animationClips=(scene.nodes??[]).filter(node=>node.animation||node.components?.animation).map((node,index)=>({
    clip_id:`animation:${node.node_id}`,
    start:0,
    duration:Number(node.animation?.duration??node.components?.animation?.duration??1),
    payload:{node_id:node.node_id,animation:node.animation??node.components.animation}
  }));
  const tracks=[
    {track_id:'track:camera',type:'camera',name:'镜头',clips:[{clip_id:'camera:establishing',start:0,duration:2,payload:{kind:'camera-cut',scene_id:scene.scene_id??null,camera_id:'camera:main'}}]},
    {track_id:'track:animation',type:'animation',name:'动画',clips:animationClips},
    {track_id:'track:audio',type:'audio',name:'音频',clips:audioAsset?[{clip_id:`audio:${audioAsset.asset_id}`,start:0,duration:1,payload:{kind:'audio-cue',asset_id:audioAsset.asset_id,gain:1}}]:[]},
    {track_id:'track:behavior',type:'behavior',name:'权威事件',clips:[]}
  ];
  return normalizeSequence({sequence_id:`sequence:${project.identity?.project_id??'untitled'}`,title:`${scene.title??'Scene'} Timeline`,fps:60,duration:Math.max(2,...tracks.flatMap(track=>track.clips.map(clip=>clip.start+clip.duration))),tracks});
}

export function normalizeSequence(raw={}){
  const tracks=(raw.tracks??[]).map((t,ti)=>({track_id:t.track_id??`track:${ti}`,type:t.type,name:t.name??t.type,muted:Boolean(t.muted),clips:(t.clips??[]).map((c,ci)=>({clip_id:c.clip_id??`${t.track_id??ti}:clip:${ci}`,start:Number(c.start??0),duration:Number(c.duration??0),payload:clone(c.payload??{}),enabled:c.enabled!==false})).sort((a,b)=>a.start-b.start||a.clip_id.localeCompare(b.clip_id))}));
  const seq={format:'reality-studio.sequence.v1.7',version:SEQUENCER_VERSION,sequence_id:raw.sequence_id??`sequence:${randomUUID()}`,title:raw.title??'Untitled Sequence',fps:Number(raw.fps??30),duration:Number(raw.duration??Math.max(0,...tracks.flatMap(t=>t.clips.map(c=>c.start+c.duration)))),tracks};
  seq.sequence_root=hash({fps:seq.fps,duration:seq.duration,tracks});return seq;
}

export function evaluateSequence(sequence,time,{previousTime=-Infinity}={}){
  const seq=normalizeSequence(sequence);const active=[],fired=[];
  for(const track of seq.tracks){if(track.muted)continue;for(const clip of track.clips){if(!clip.enabled)continue;const end=clip.start+clip.duration;if(time>=clip.start&&time<=end)active.push({track_id:track.track_id,track_type:track.type,clip_id:clip.clip_id,local_time:Math.max(0,time-clip.start),progress:clip.duration?Math.min(1,Math.max(0,(time-clip.start)/clip.duration)):1,payload:clone(clip.payload)});if(previousTime<clip.start&&time>=clip.start)fired.push({track_id:track.track_id,track_type:track.type,clip_id:clip.clip_id,payload:clone(clip.payload)});}}
  const authority=fired.filter(x=>authorityTracks.has(x.track_type));const presentation=active.filter(x=>presentationTracks.has(x.track_type));
  return{format:'reality-studio.sequence-frame.v1.6',sequence_id:seq.sequence_id,time,active,fired,authority_events:authority,presentation_state:presentation,authority_root:hash(authority),presentation_root:hash(presentation),frame_root:hash({sequence_root:seq.sequence_root,time,active,fired})};
}

export class SequencerSession{
  constructor(sequence){this.sequence=normalizeSequence(sequence);this.time=0;this.playing=false;this.history=[];this.snapshots=new Map();this.last_frame=evaluateSequence(this.sequence,0);}
  seek(time){const previous=this.time;this.time=Math.min(this.sequence.duration,Math.max(0,Number(time)));const frame=evaluateSequence(this.sequence,this.time,{previousTime:previous});this.last_frame=frame;this.history.push(frame);return frame;}
  step(frames=1){return this.seek(this.time+Number(frames)/this.sequence.fps);}
  play({frames=1}={}){this.playing=true;const out=[];for(let i=0;i<frames&&this.time<this.sequence.duration;i++)out.push(this.step(1));this.playing=false;return out;}
  addClip(trackId,clip){const raw=clone(this.sequence);delete raw.sequence_root;const track=raw.tracks.find(t=>t.track_id===trackId);if(!track)throw new Error(`SEQUENCE_TRACK_UNKNOWN:${trackId}`);track.clips.push(clone(clip));this.sequence=normalizeSequence(raw);return this.sequence;}
  snapshot(label='snapshot'){const snap={label,time:this.time,sequence:clone(this.sequence),history_length:this.history.length,snapshot_root:hash({label,time:this.time,sequence_root:this.sequence.sequence_root,history_length:this.history.length})};this.snapshots.set(label,snap);return clone(snap);}
  restore(label){const snap=this.snapshots.get(label);if(!snap)throw new Error(`SEQUENCE_SNAPSHOT_UNKNOWN:${label}`);this.time=snap.time;this.sequence=clone(snap.sequence);this.history=this.history.slice(0,snap.history_length);return this.inspect();}
  inspect(){return{format:'reality-studio.sequencer-session.v1.7',version:SEQUENCER_VERSION,time:this.time,playing:this.playing,sequence:clone(this.sequence),last_frame:clone(this.last_frame),history_length:this.history.length,session_root:hash({time:this.time,sequence_root:this.sequence.sequence_root,history:this.history.map(x=>x.frame_root)})};}
}

export function recordBehaviorTraceAsSequence(trace,{fps=30,title='Recorded Behavior'}={}){const entries=Array.isArray(trace)?trace:(Array.isArray(trace?.entries)?trace.entries:[]);const clips=entries.map((e,i)=>({clip_id:`behavior:${e.sequence??i}`,start:Number(e.time??0),duration:0,payload:{type:e.type,tick:e.tick,data:clone(e)}}));return normalizeSequence({title,fps,tracks:[{track_id:'track:behavior-recording',type:'behavior',clips}]});}
