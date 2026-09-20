import {add,mul,sub,len,rad} from './math.mjs';
import {createCanonicalHumanSkeleton} from './skeleton-v2.mjs';
import {worldJointsToPose} from './world-pose-v3.mjs';
import {qIdentity,qMul,qFromAxisAngle,qRotateVec} from './quaternion.mjs';
import {inferGltfJointMap} from './gltf-rig.mjs';

export const MEDIAPIPE_POSE_INDEX={nose:0,leftShoulder:11,rightShoulder:12,leftElbow:13,rightElbow:14,leftWrist:15,rightWrist:16,leftHip:23,rightHip:24,leftKnee:25,rightKnee:26,leftAnkle:27,rightAnkle:28,leftHeel:29,rightHeel:30,leftFoot:31,rightFoot:32};
const avg=(a,b)=>a.map((v,i)=>(v+b[i])/2);
function p(frame,i,{flipY=true,flipZ=false,scale=1,origin=[0,0,0]}={}){const q=frame[i];if(!q)throw new Error(`missing landmark ${i}`);const y=flipY?-q.y:q.y,z=flipZ?-q.z:q.z;return [q.x*scale+origin[0],y*scale+origin[1],z*scale+origin[2]]}

export function mediaPipeFrameToWorld(frame,{targetHeight=1.74,flipY=true,flipZ=false,floorY=0}={}){
  const I=MEDIAPIPE_POSE_INDEX,raw={}; for(const [k,i] of Object.entries(I))raw[k]=p(frame,i,{flipY,flipZ});
  const pelvis=avg(raw.leftHip,raw.rightHip),shoulderMid=avg(raw.leftShoulder,raw.rightShoulder),bodyScale=Math.max(1e-6,len(sub(shoulderMid,pelvis))); const desiredTorso=targetHeight*0.28,scale=desiredTorso/bodyScale;
  const tr=v=>mul(sub(v,pelvis),scale); const ankleMin=Math.min(tr(raw.leftAnkle)[1],tr(raw.rightAnkle)[1]); const lift=floorY-ankleMin;
  const T=v=>{const x=tr(v);return [x[0],x[1]+lift,x[2]]};
  const chest=T(shoulderMid),pel=T(pelvis),head=T(raw.nose),neck=avg(chest,head);
  return {pelvis:pel,spine:avg(pel,chest),chest,neck,head,shoulderL:T(raw.leftShoulder),elbowL:T(raw.leftElbow),wristL:T(raw.leftWrist),shoulderR:T(raw.rightShoulder),elbowR:T(raw.rightElbow),wristR:T(raw.rightWrist),hipL:T(raw.leftHip),kneeL:T(raw.leftKnee),ankleL:T(raw.leftAnkle),footL:T(raw.leftFoot),hipR:T(raw.rightHip),kneeR:T(raw.rightKnee),ankleR:T(raw.rightAnkle),footR:T(raw.rightFoot)};
}

export function importMediaPipePoseSequence(frames,{profile={},fps=30,...opts}={}){
  const skeleton=createCanonicalHumanSkeleton(profile),keyframes=[],evidence=[]; for(let i=0;i<frames.length;i++){const world=mediaPipeFrameToWorld(frames[i],{targetHeight:skeleton.profile.height,...opts}),r=worldJointsToPose(skeleton,world,{rootPosition:world.pelvis});keyframes.push({t:i/fps,pose:r.state});evidence.push({frame:i,world});}
  return {format:'rncs.mocap.mediapipe.v0.3',skeleton,clip:{id:'mediapipe-import',duration:Math.max(0,(frames.length-1)/fps),fps,keyframes},evidence};
}

export function parseBvh(text){
  const lines=text.replace(//g,'').split('
').map(x=>x.trim()).filter(Boolean); let i=0,stack=[],joints=[],current=null,channelCursor=0;
  if(lines[i++]!=='HIERARCHY')throw new Error('BVH: missing HIERARCHY');
  while(i<lines.length&&lines[i]!=='MOTION'){
    const line=lines[i++];
    if(line.startsWith('ROOT ')||line.startsWith('JOINT ')){const name=line.split(/s+/)[1],j={name,parent:stack.at(-1)?.name??null,offset:[0,0,0],channels:[],channelStart:channelCursor};joints.push(j);current=j;continue}
    if(line==='{'){if(current&&stack.at(-1)!==current)stack.push(current);continue}
    if(line==='}'){stack.pop();current=stack.at(-1)??null;continue}
    if(line.startsWith('OFFSET ')&&current){current.offset=line.split(/s+/).slice(1).map(Number);continue}
    if(line.startsWith('CHANNELS ')&&current){const a=line.split(/s+/),n=+a[1];current.channels=a.slice(2,2+n);current.channelStart=channelCursor;channelCursor+=n;continue}
    if(line.startsWith('End Site')){let depth=0;while(i<lines.length){const x=lines[i++];if(x==='{')depth++;else if(x==='}'){if(depth===0)break;depth--}}continue}
  }
  if(lines[i++]!=='MOTION')throw new Error('BVH: missing MOTION'); const frameCount=+lines[i++].match(/Frames:s*(d+)/i)?.[1]; const frameTime=+lines[i++].match(/Frame Time:s*([d.eE+-]+)/i)?.[1]; const frames=[];for(let f=0;f<frameCount&&i<lines.length;f++)frames.push(lines[i++].split(/s+/).map(Number));
  return {format:'bvh',joints,frameCount,frameTime,frames,totalChannels:channelCursor};
}

function channelTransform(joint,values,{scale=0.01}={}){
  let t=[...joint.offset].map(v=>v*scale),q=qIdentity();
  for(let k=0;k<joint.channels.length;k++){
    const ch=joint.channels[k],v=values[joint.channelStart+k]??0;
    if(ch==='Xposition')t[0]+=v*scale;else if(ch==='Yposition')t[1]+=v*scale;else if(ch==='Zposition')t[2]+=v*scale;
    else if(ch==='Xrotation')q=qMul(q,qFromAxisAngle([1,0,0],rad(v)));else if(ch==='Yrotation')q=qMul(q,qFromAxisAngle([0,1,0],rad(v)));else if(ch==='Zrotation')q=qMul(q,qFromAxisAngle([0,0,1],rad(v)));
  }
  return {translation:t,rotation:q};
}

export function bvhFrameToWorld(parsed,frameIndex,{scale=0.01}={}){
  const values=parsed.frames[frameIndex];if(!values)throw new Error(`BVH frame ${frameIndex} missing`);const world={};
  for(const j of parsed.joints){const local=channelTransform(j,values,{scale});if(!j.parent)world[j.name]={position:local.translation,rotation:local.rotation};else{const p=world[j.parent];world[j.name]={position:add(p.position,qRotateVec(p.rotation,local.translation)),rotation:qMul(p.rotation,local.rotation)};}}
  return world;
}

export function importBvhToPoseClip(text,{profile={},scale=0.01,floorY=0}={}){
  const parsed=typeof text==='string'?parseBvh(text):text,skeleton=createCanonicalHumanSkeleton(profile),jointMap=inferGltfJointMap(parsed.joints.map(j=>({name:j.name}))),keyframes=[],evidence=[];
  for(let fi=0;fi<parsed.frames.length;fi++){
    const bw=bvhFrameToWorld(parsed,fi,{scale}),mapped={};for(const [rncs,index] of Object.entries(jointMap)){const w=bw[parsed.joints[index].name];if(w)mapped[rncs]=[...w.position];}
    if(!mapped.pelvis)throw new Error('BVH import: pelvis/hips mapping missing');
    // Ground to floor if ankles exist; preserve inter-frame horizontal root motion.
    const feet=[mapped.ankleL,mapped.ankleR,mapped.footL,mapped.footR].filter(Boolean);if(feet.length){const minY=Math.min(...feet.map(x=>x[1])),dy=floorY-minY;for(const k of Object.keys(mapped))mapped[k]=[mapped[k][0],mapped[k][1]+dy,mapped[k][2]];}
    const r=worldJointsToPose(skeleton,mapped,{rootPosition:mapped.pelvis});keyframes.push({t:fi*parsed.frameTime,pose:r.state});evidence.push({frame:fi,mappedJoints:Object.keys(mapped).length});
  }
  return {format:'rncs.mocap.bvh.v0.3',skeleton,source:parsed,clip:{id:'bvh-import',duration:Math.max(0,(parsed.frames.length-1)*parsed.frameTime),fps:parsed.frameTime?1/parsed.frameTime:0,keyframes},jointMap,evidence};
}
