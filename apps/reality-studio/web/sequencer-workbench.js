(()=>{
'use strict';
const app=window.RealityStudioApp;if(!app)return;
const $=id=>document.getElementById(id),esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let timer=null;
let offlineTime=0;
function offlineSequence(){return{format:'reality-studio.sequencer-session.v1.7',version:'1.7.0-alpha.1',time:offlineTime,playing:false,sequence:{format:'reality-studio.sequence.v1.7',version:'1.7.0-alpha.1',sequence_id:'sequence:offline',title:'Offline Timeline',fps:60,duration:2,sequence_root:'offline-sequence',tracks:[{track_id:'track:camera',type:'camera',name:'镜头',clips:[{clip_id:'camera:establishing',start:0,duration:2,payload:{kind:'camera-cut'}}]},{track_id:'track:animation',type:'animation',name:'动画',clips:[]},{track_id:'track:audio',type:'audio',name:'音频',clips:[]},{track_id:'track:behavior',type:'behavior',name:'权威事件',clips:[]}]},last_frame:{frame_root:`offline-frame-${offlineTime.toFixed(3)}`,authority_root:'offline-authority',presentation_root:'offline-presentation'},history_length:0,session_root:'offline-sequencer'}}
function sequence(){return app.getInspection()?.sequence??offlineSequence()}
function command(name,payload={}){if(app.isServer())return app.command(name,payload);const s=offlineSequence(),fps=s.sequence.fps;if(name==='sequence-step')offlineTime=Math.min(s.sequence.duration,offlineTime+Number(payload.frames??1)/fps);else if(name==='sequence-seek')offlineTime=Math.min(s.sequence.duration,Math.max(0,Number(payload.time??0)));app.refresh();return Promise.resolve()}
function stop(){if(timer){clearInterval(timer);timer=null}const button=$('sequencePlayBtn');if(button)button.classList.remove('on')}
function seek(time){return command('sequence-seek',{time:Number(time)})}
function render(){
  const s=sequence();if(!s)return;
  const seq=s.sequence??{},duration=Math.max(0.001,Number(seq.duration??2)),time=Math.min(duration,Math.max(0,Number(s.time??offlineTime))),frame=s.last_frame??{};
  const scrub=$('sequenceTime');if(scrub){scrub.max=String(duration);scrub.value=String(time)}
  $('sequenceTimeLabel').textContent=`${time.toFixed(2)}s`;
  $('sequenceTitle').textContent=seq.title||'时间线';
  $('sequenceMeta').textContent=`${seq.tracks?.length||0} 轨道 · ${seq.fps||60} fps · ${duration.toFixed(2)}s`;
  $('sequenceFrameRoot').textContent=`Frame ${String(frame.frame_root||'—').slice(0,12)}`;
  $('sequenceAuthorityRoot').textContent=`Authority ${String(frame.authority_root||'—').slice(0,12)}`;
  $('sequencePresentationRoot').textContent=`Presentation ${String(frame.presentation_root||'—').slice(0,12)}`;
  $('sequenceSessionRoot').textContent=`Session ${String(s.session_root||'—').slice(0,14)}`;
  const tracks=seq.tracks||[];
  $('sequenceTracks').innerHTML=tracks.map(track=>{
    const clips=(track.clips||[]).map(clip=>{const left=Math.max(0,Math.min(100,(Number(clip.start||0)/duration)*100)),width=Math.max(1,Math.min(100-left,(Number(clip.duration||0)/duration)*100));return `<button class="sequence-clip ${track.type}" title="${esc(JSON.stringify(clip.payload||{}))}" style="left:${left}%;width:${width}%"><b>${esc(clip.clip_id)}</b><small>${Number(clip.start||0).toFixed(2)}s</small></button>`}).join('');
    return `<div class="sequence-track"><div class="sequence-track-label"><b>${esc(track.name||track.type)}</b><small>${esc(track.type)}${track.muted?' · muted':''}</small></div><div class="sequence-lane"><i class="sequence-playhead" style="left:${(time/duration)*100}%"></i>${clips||'<span class="sequence-empty">空轨道</span>'}</div></div>`;
  }).join('')||'<div class="empty">没有时间线轨道</div>';
  $('sequenceEvidence').textContent=JSON.stringify({format:s.format,version:s.version,sequence_root:seq.sequence_root,time,frame_root:frame.frame_root,authority_root:frame.authority_root,presentation_root:frame.presentation_root,history_length:s.history_length},null,2);
}
async function play(){if(timer)return;const s=sequence();if(!s)return;const fps=Math.max(1,Number(s.sequence?.fps||60));$('sequencePlayBtn')?.classList.add('on');timer=setInterval(async()=>{const current=sequence();if(!current||Number(current.time??offlineTime)>=Number(current.sequence?.duration??0)){stop();return}await command('sequence-step',{frames:1})},Math.max(16,1000/fps));}
function wire(){
  $('sequencePlayBtn').onclick=play;$('sequencePauseBtn').onclick=stop;$('sequenceStepBtn').onclick=()=>{stop();command('sequence-step',{frames:1})};$('sequenceSnapshotBtn').onclick=()=>command('sequence-snapshot',{label:`timeline-${Date.now().toString(36)}`});$('sequenceTime').oninput=e=>seek(e.target.value);
  window.addEventListener('reality-studio-render',render);render();
}
wire();window.addEventListener('beforeunload',stop);
})();
