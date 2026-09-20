import {assert,clone,rootHash} from './hash.mjs';
import {sampleChannels} from './curve.mjs';
import {createRig2D,skinMesh2D} from './rig2d.mjs';
import {blendShape2D,morphPath} from './deformation2d.mjs';

export function evaluate2DChannel(channel){
  assert(channel?.domain==='2d','ANIMATION_2D_CHANNEL_DOMAIN_INVALID');const s=channel.spec??{},time=Number(s.timeSeconds??s.time_seconds??channel.local_time??0),sampled=sampleChannels(s.curves??{},time);let rigResult=null,pathResult=null,blendResult=null;
  if(s.rig){const rig=s.rig.format==='rncs.animation-rig2d.v0.1'?s.rig:createRig2D(s.rig),pose={...clone(s.pose??{})};for(const [name,value] of Object.entries(sampled)){const [bone,field]=name.split('.');if(bone&&field){pose[bone]??={};pose[bone][field]=value;}}if(s.mesh)rigResult=skinMesh2D(rig,s.mesh,pose);}
  if(s.pathMorph)pathResult=morphPath(s.pathMorph.from,s.pathMorph.to,s.pathMorph.weight??sampled.pathWeight??channel.progress??0);
  if(s.blendShapes)blendResult=blendShape2D(s.blendShapes.base,s.blendShapes.targets??[],s.blendShapes.weights??[]);
  const out={format:'rncs.animation-fabric.2d-channel-state.v0.1',channelId:channel.channel_id,nodeId:s.nodeId??s.node_id??channel.node_id??null,time,sampled,rigResult,pathResult,blendResult,opacity:s.opacity??sampled.opacity??1,transform:clone(s.transform??{}),candidate_only:true};return {...out,stateRoot:rootHash(out)};
}

export function combineUrrf2DChannels(channels=[]){const states=channels.filter(x=>x.domain==='2d').map(evaluate2DChannel),out={format:'rncs.animation-fabric.urrf2d-projection.v0.1',states,candidate_only:true,authoritative:false,canonical_state_mutated:false};return {...out,projectionRoot:rootHash(out)};}
