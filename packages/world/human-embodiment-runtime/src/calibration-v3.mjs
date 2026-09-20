import {angleABC,len,sub} from './math.mjs';
import {forwardKinematics,createPoseState} from './skeleton-v2.mjs';
import {importMediaPipePoseSequence} from './mocap-import-v3.mjs';
import {enforceJointLimits} from './joint-limits-v3.mjs';

function angles(fk){const p=Object.fromEntries(Object.entries(fk.world).map(([k,v])=>[k,v.position]));return {kneeL:angleABC(p.hipL,p.kneeL,p.ankleL),kneeR:angleABC(p.hipR,p.kneeR,p.ankleR),elbowL:angleABC(p.shoulderL,p.elbowL,p.wristL),elbowR:angleABC(p.shoulderR,p.elbowR,p.wristR)};}

export function comparePoseStates(skeleton,a,b){const fa=forwardKinematics(skeleton,a),fb=forwardKinematics(skeleton,b),eff=['wristL','wristR','ankleL','ankleR','head'],errors={};for(const j of eff)errors[j]=len(sub(fa.world[j].position,fb.world[j].position));const aa=angles(fa),ab=angles(fb),jointAngleError=Object.fromEntries(Object.keys(aa).map(k=>[k,Math.abs(aa[k]-ab[k])]));const rms=Math.sqrt(Object.values(errors).reduce((s,x)=>s+x*x,0)/Object.values(errors).length);return {endEffectorError:errors,endEffectorRms:rms,jointAngleError};}

export function calibrateMediaPipeSequence(frames,{profile={},fps=30,...opts}={}){const imported=importMediaPipePoseSequence(frames,{profile,fps,...opts}),evidence=[];const keyframes=imported.clip.keyframes.map(k=>{const lim=enforceJointLimits(imported.skeleton,createPoseState(imported.skeleton,k.pose));evidence.push({t:k.t,limitsChanged:lim.changed,limitEvidence:lim.evidence});return {t:k.t,pose:lim.state};});return {format:'rncs.motion-calibration.v0.3',skeleton:imported.skeleton,clip:{...imported.clip,id:'calibrated-mediapipe',keyframes},evidence,source:'MediaPipe Pose landmarks'};}

export function comparePoseClips(skeleton,a,b,{samples=20}={}){const A=a.keyframes,B=b.keyframes,n=Math.min(samples,Math.max(A.length,B.length)),frames=[];for(let i=0;i<n;i++){const ia=Math.round(i*(A.length-1)/(n-1||1)),ib=Math.round(i*(B.length-1)/(n-1||1));const pa=createPoseState(skeleton,A[ia].pose),pb=createPoseState(skeleton,B[ib].pose),c=comparePoseStates(skeleton,pa,pb);frames.push({u:i/(n-1||1),...c});}return {frames,meanEndEffectorRms:frames.reduce((s,x)=>s+x.endEffectorRms,0)/frames.length,maxEndEffectorRms:Math.max(...frames.map(x=>x.endEffectorRms))};}
