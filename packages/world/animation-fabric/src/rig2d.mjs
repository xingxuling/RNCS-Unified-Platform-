import {assert,clone,finite,rootHash} from './hash.mjs';

const ident=()=>[1,0,0,1,0,0];
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const trs=({x=0,y=0,rotation=0,scaleX=1,scaleY=1}={})=>{const c=Math.cos(rotation),s=Math.sin(rotation);return [c*scaleX,s*scaleX,-s*scaleY,c*scaleY,x,y];};
const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
const inverse=m=>{const d=m[0]*m[3]-m[1]*m[2];assert(Math.abs(d)>1e-12,'ANIMATION_2D_MATRIX_SINGULAR');return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];};

export function createRig2D(input={}){
  const bones=(input.bones??[]).map((b,i)=>({id:String(b.id??`bone:${i}`),parentId:b.parentId==null?null:String(b.parentId),bind:{x:Number(b.bind?.x??0),y:Number(b.bind?.y??0),rotation:Number(b.bind?.rotation??0),scaleX:Number(b.bind?.scaleX??1),scaleY:Number(b.bind?.scaleY??1)}}));
  assert(bones.length>0,'ANIMATION_2D_RIG_BONES_REQUIRED');const ids=new Set();for(const b of bones){assert(!ids.has(b.id),'ANIMATION_2D_RIG_DUPLICATE_BONE');ids.add(b.id);assert(Object.values(b.bind).every(finite),'ANIMATION_2D_RIG_BIND_INVALID');}
  for(const b of bones)if(b.parentId)assert(ids.has(b.parentId),'ANIMATION_2D_RIG_PARENT_UNKNOWN');
  const rig={format:'rncs.animation-rig2d.v0.1',rigId:String(input.rigId??input.id??'rig2d'),bones,meshes:clone(input.meshes??[]),candidate_only:true};return {...rig,rigRoot:rootHash(rig)};
}

export function evaluateRig2D(rig,pose={}){
  const world={},bindWorld={},boneMap=new Map(rig.bones.map(b=>[b.id,b]));const visiting=new Set();
  const evalBone=id=>{if(world[id])return world[id];assert(!visiting.has(id),'ANIMATION_2D_RIG_CYCLE');visiting.add(id);const b=boneMap.get(id);assert(b,'ANIMATION_2D_RIG_BONE_UNKNOWN');const localBind=trs(b.bind),localPose=trs(pose[id]??{}),parent=b.parentId?evalBone(b.parentId):ident(),parentBind=b.parentId?bindWorld[b.parentId]:ident();bindWorld[id]=mul(parentBind,localBind);world[id]=mul(parent,mul(localBind,localPose));visiting.delete(id);return world[id];};
  for(const b of rig.bones)evalBone(b.id);return {world,bindWorld,poseRoot:rootHash({rigRoot:rig.rigRoot,pose})};
}

export function skinMesh2D(rig,mesh,pose={}){
  const evald=evaluateRig2D(rig,pose),vertices=(mesh.vertices??[]).map((v,index)=>{const base=[Number(v.position?.[0]??v[0]??0),Number(v.position?.[1]??v[1]??0)],weights=v.weights??[];if(!weights.length)return base;let sum=0,out=[0,0];for(const w of weights){const weight=Number(w.weight??0);if(weight<=0)continue;const bw=evald.bindWorld[w.boneId],ww=evald.world[w.boneId];assert(bw&&ww,`ANIMATION_2D_SKIN_BONE_UNKNOWN:${w.boneId}`);const transformed=point(mul(ww,inverse(bw)),base);out[0]+=transformed[0]*weight;out[1]+=transformed[1]*weight;sum+=weight;}assert(sum>0,`ANIMATION_2D_SKIN_WEIGHTS_ZERO:${index}`);return [out[0]/sum,out[1]/sum];});
  return {format:'rncs.animation-skinned-mesh2d.v0.1',meshId:String(mesh.id??'mesh2d'),vertices,triangles:clone(mesh.triangles??[]),poseRoot:evald.poseRoot,deformationRoot:rootHash({meshId:mesh.id??'mesh2d',vertices,triangles:mesh.triangles??[],poseRoot:evald.poseRoot})};
}
