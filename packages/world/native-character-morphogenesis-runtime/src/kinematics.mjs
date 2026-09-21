import {addRotation,clamp,composeTransform,deg,distance3,normalize3,rootHash,scale3,seal,transformPoint} from './canonical.mjs';

const viewYaw={front:0,'three-quarter-left':-34,'three-quarter-right':34,side:78,'head-turn':28,'shoulder-turn':22,'elbow-bend':0};
const modes={neutral:{bodyYaw:0,headYaw:0,weight:.5,leftShoulder:0,rightShoulder:0,leftElbow:0,rightElbow:0,expression:'neutral'},alert:{bodyYaw:0,headYaw:8,weight:.46,leftShoulder:-.08,rightShoulder:.08,leftElbow:-.18,rightElbow:.18,expression:'alert'},action:{bodyYaw:-8,headYaw:18,weight:.37,leftShoulder:-.2,rightShoulder:.08,leftElbow:-.42,rightElbow:.26,expression:'mild-concern'}};

const rotation=(pitch=0,yaw=0,roll=0)=>({pitch:Number(pitch),yaw:Number(yaw),roll:Number(roll)});

function lowerBodyRotations(asset,{pose,progress,shotRise,weight}){
  const hasLowerBody=(asset?.skeleton?.bones??[]).some(bone=>bone.id==='thigh-left')&&(asset?.skeleton?.bones??[]).some(bone=>bone.id==='thigh-right');
  if(!hasLowerBody)return null;
  const sway=Math.sin(progress*Math.PI*2)*.014,weightBias=(.5-Number(weight??.5))*.16+sway,action=pose==='action'?shotRise:0,alert=pose==='alert'?1:0;
  return{
    'hip-left':rotation(-.012-action*.045,0,weightBias),
    'thigh-left':rotation(-.008-action*.035,0,weightBias*.55),
    'knee-left':rotation(-.032-action*.055-alert*.012,0,0),
    'ankle-left':rotation(.018+action*.020,0,-weightBias*.32),
    'foot-left':rotation(-.008,0,0),
    'hip-right':rotation(.008+action*.018,0,-weightBias),
    'thigh-right':rotation(-.006+action*.012,0,-weightBias*.55),
    'knee-right':rotation(-.028-action*.018-alert*.008,0,0),
    'ankle-right':rotation(.016+action*.008,0,weightBias*.32),
    'foot-right':rotation(-.006,0,0)
  };
}

export function performanceStateForFrame(asset,{view='front',pose='neutral',frame=0,totalFrames=120}={}){
  const progress=clamp(totalFrames<=1?0:Number(frame)/Number(totalFrames-1)),mode=modes[pose]??modes.neutral,shotRise=clamp((progress-.18)/.34),settle=clamp((progress-.72)/.28),bodyYaw=deg(mode.bodyYaw+Math.sin(progress*Math.PI*2)*3),headYaw=deg(mode.headYaw+(view==='head-turn'?28*Math.sin(progress*Math.PI):0)+(view==='front'?12*shotRise:0)),lower=lowerBodyRotations(asset,{pose,progress,shotRise,weight:mode.weight});
  return{format:'rncs.performance-state.v0.1',frame,total_frames:totalFrames,progress,view,pose,view_yaw:deg(viewYaw[view]??0),root_rotation:rotation(0,bodyYaw,0),joint_rotations:{root:rotation(0,bodyYaw,0),'upper-arm-left':rotation(0,0,mode.leftShoulder+(pose==='action'?shotRise*.38:0)),'forearm-left':rotation(0,0,mode.leftElbow+(pose==='action'?shotRise*.48:0)),'upper-arm-right':rotation(0,0,mode.rightShoulder+(pose==='action'?shotRise*.14:0)),'forearm-right':rotation(0,0,mode.rightElbow),'skull':rotation(0,headYaw,0),...(lower??{})},expression:mode.expression,gaze:view==='three-quarter-left'?'left':view==='three-quarter-right'?'right':view==='head-turn'?'right':'center',blink:pose==='action'&&frame%37===0,mouth:pose==='action'&&frame%19<7?'o':'closed',secondary:{hair_lag:Math.sin(progress*Math.PI*2+1)*.012+(pose==='action'?shotRise*.018:0),costume_lag:Math.sin(progress*Math.PI*2)*.008,breath:Math.sin(progress*Math.PI*5)*.004,overshoot:settle<1?Math.sin(settle*Math.PI)*.01:0},lower_body_active:Boolean(lower),source:lower?'Director performance state; canonical lower-body FK enabled; no bone lengths or body dimensions':'Director performance state; no bone lengths or body dimensions'};
}

function clampRotation(value,limits){return{pitch:clamp(value.pitch??0,limits.pitch[0],limits.pitch[1]),yaw:clamp(value.yaw??0,limits.yaw[0],limits.yaw[1]),roll:clamp(value.roll??0,limits.roll[0],limits.roll[1])};}

export function solveKinematics(asset,performanceState={}){
  const requested=performanceState.joint_rotations??{},world=new Map(),posedBones=[];
  for(const sourceBone of asset.skeleton.bones){
    const localRotation=clampRotation(addRotation(sourceBone.local_transform.rotation,requested[sourceBone.id]??{}),sourceBone.joint_limits),local={translation:[...sourceBone.local_transform.translation],rotation:localRotation},parentWorld=sourceBone.parent?world.get(sourceBone.parent).world_transform:{position:[0,0,0],rotation:rotation()},worldTransform=composeTransform(parentWorld,local),worldStart=worldTransform.position,worldEnd=transformPoint(worldTransform,scale3(sourceBone.axis,sourceBone.length)),posed={...sourceBone,local_transform:local,world_transform:worldTransform,world_start:worldStart,world_end:worldEnd};world.set(sourceBone.id,posed);posedBones.push(posed);
  }
  const boneLengthErrors=posedBones.filter(item=>item.length>0).map(item=>({bone_id:item.id,expected:item.length,actual:distance3(item.world_start,item.world_end),delta:distance3(item.world_start,item.world_end)-item.length})).filter(item=>Math.abs(item.delta)>.00001);
  const result={format:'rncs.posed-hierarchical-skeleton.v0.1',asset_root:asset.morphology_root,performance_root:rootHash(performanceState),performance:performanceState,bones:posedBones,bone_length_errors:boneLengthErrors,bone_lengths_pose_invariant:boneLengthErrors.length===0,root_transform:world.get('root')?.world_transform??{position:[0,0,0],rotation:rotation()},kinematic_policy:'FK-derived-world-positions-with-joint-limit-clamping'};
  return seal(result,'pose_root');
}

export function validateKinematics(posedSkeleton){const errors=[];if(!posedSkeleton?.bone_lengths_pose_invariant)errors.push('BONE_LENGTH_POSE_VARIANCE');if(!posedSkeleton?.bones?.length)errors.push('SKELETON_EMPTY');for(const bone of posedSkeleton?.bones??[])if(!bone.world_start||!bone.world_end)errors.push(`BONE_WORLD_POSITION_MISSING:${bone.id}`);return{valid:errors.length===0,errors,pose_root:posedSkeleton?.pose_root??null};}

export function boneMap(posedSkeleton){return new Map((posedSkeleton?.bones??[]).map(item=>[item.id,item]));}
