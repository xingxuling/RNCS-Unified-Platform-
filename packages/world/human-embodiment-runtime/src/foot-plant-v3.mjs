import {len,sub,add,mul} from './math.mjs';
import {createPoseState,forwardKinematics,clonePoseState} from './skeleton-v2.mjs';
import {solveMultiTargetIK} from './ik.mjs';
import {enforceJointLimits} from './joint-limits-v3.mjs';
import {samplePoseClip} from './animation-v2.mjs';

export function detectFootContacts(skeleton,frames,{floorY=0,heightThreshold=0.045,speedThreshold=0.12}={}){
  const out=[]; let prev=null;
  for(const frame of frames){
    const state=frame.pose?.localRotations?createPoseState(skeleton,frame.pose):frame.pose; const fk=forwardKinematics(skeleton,state); const cur={};
    for(const side of ['L','R']){const p=fk.world[`foot${side}`].position;let speed=0;if(prev){const dt=Math.max(1e-6,frame.t-prev.t),pp=prev.fk.world[`foot${side}`].position;speed=len(sub(p,pp))/dt}cur[side]=Math.abs(p[1]-floorY)<=heightThreshold&&speed<=speedThreshold;}
    out.push({t:frame.t,contacts:{left:cur.L,right:cur.R},fk,state});prev={t:frame.t,fk};
  }
  return out;
}

export function buildFootPlantTrack(skeleton,frames,opts={}){
  const detected=detectFootContacts(skeleton,frames,opts), locks={left:null,right:null}, track=[];
  for(const f of detected){
    const entry={t:f.t,contacts:f.contacts,locks:{}};
    for(const [side,key] of [['left','L'],['right','R']]){
      if(f.contacts[side]){if(!locks[side])locks[side]=[...f.fk.world[`ankle${key}`].position]; entry.locks[side]=[...locks[side]];}else locks[side]=null;
    }
    track.push(entry);
  }
  return track;
}

export function solveFootPlantFrame(skeleton,inputState,plant,{iterations=4,tolerance=0.008,rootCompensation=0.75,limitJoints=true}={}){
  let state=clonePoseState(inputState), fk=forwardKinematics(skeleton,state), targets={}; const deltas=[];
  if(plant?.contacts?.left&&plant?.locks?.left){targets.legL=plant.locks.left;deltas.push(sub(plant.locks.left,fk.world.ankleL.position));}
  if(plant?.contacts?.right&&plant?.locks?.right){targets.legR=plant.locks.right;deltas.push(sub(plant.locks.right,fk.world.ankleR.position));}
  if(deltas.length){const avg=deltas.reduce((a,b)=>add(a,b),[0,0,0]).map(v=>v/deltas.length);state.rootPosition=add(state.rootPosition,mul(avg,rootCompensation));}
  let ik={state,fk:forwardKinematics(skeleton,state),evidence:[],ok:true}; if(Object.keys(targets).length)ik=solveMultiTargetIK(skeleton,state,targets,{iterations,tolerance}); state=ik.state;
  let limits={state,changed:false,evidence:[]}; if(limitJoints){limits=enforceJointLimits(skeleton,state);state=limits.state;}
  fk=forwardKinematics(skeleton,state);
  const residuals={}; if(targets.legL)residuals.left=len(sub(fk.world.ankleL.position,targets.legL));if(targets.legR)residuals.right=len(sub(fk.world.ankleR.position,targets.legR));
  return {state,fk,residuals,ok:Object.values(residuals).every(v=>v<=tolerance*1.5),ikEvidence:ik.evidence,limitEvidence:limits.evidence};
}

export function stabilizeFootPlants(skeleton,clip,{fps=60,...opts}={}){
  const duration=clip.duration??clip.keyframes.at(-1)?.t??1; const n=Math.max(1,Math.round(duration*fps)),frames=[];
  for(let i=0;i<=n;i++){const t=i/n*duration;frames.push({t,pose:samplePoseClip(skeleton,clip,t)});}
  const track=buildFootPlantTrack(skeleton,frames,opts); const out=[]; for(let i=0;i<frames.length;i++){const r=solveFootPlantFrame(skeleton,frames[i].pose,track[i],opts);out.push({t:frames[i].t,pose:r.state,evidence:{residuals:r.residuals,ok:r.ok,contacts:track[i].contacts}});}
  return {id:`${clip.id??'clip'}:foot-planted`,duration,fps,frames:out,track,ok:out.every(x=>x.evidence.ok)};
}
