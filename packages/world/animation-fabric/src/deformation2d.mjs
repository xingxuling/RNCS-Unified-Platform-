import {assert,clamp} from './hash.mjs';

export function morphPath(from=[],to=[],t=0){
  assert(Array.isArray(from)&&Array.isArray(to)&&from.length===to.length&&from.length>0,'ANIMATION_2D_PATH_MORPH_TOPOLOGY_MISMATCH');
  const u=clamp(Number(t),0,1);
  return from.map((p,i)=>{const q=to[i];assert(Array.isArray(p)&&Array.isArray(q)&&p.length===q.length,'ANIMATION_2D_PATH_POINT_MISMATCH');return p.map((v,j)=>Number(v)+(Number(q[j])-Number(v))*u);});
}

export function deformByBilinearCage(vertices,cage){
  assert(Array.isArray(vertices)&&Array.isArray(cage)&&cage.length===4,'ANIMATION_2D_FFD_INPUT_INVALID');
  const [p00,p10,p11,p01]=cage;
  return vertices.map(v=>{const u=clamp(Number(v.uv?.[0]??v[2]??0),0,1),w=clamp(Number(v.uv?.[1]??v[3]??0),0,1);const x=(1-u)*(1-w)*p00[0]+u*(1-w)*p10[0]+u*w*p11[0]+(1-u)*w*p01[0];const y=(1-u)*(1-w)*p00[1]+u*(1-w)*p10[1]+u*w*p11[1]+(1-u)*w*p01[1];return [x,y];});
}

export function blendShape2D(base,targets=[],weights=[]){
  assert(Array.isArray(base),'ANIMATION_2D_BLEND_BASE_REQUIRED');const out=base.map(v=>[Number(v[0]),Number(v[1])]);
  for(let ti=0;ti<targets.length;ti++){const target=targets[ti],w=Number(weights[ti]??0);assert(target.length===out.length,'ANIMATION_2D_BLEND_TARGET_SIZE_MISMATCH');for(let i=0;i<out.length;i++){out[i][0]+=(Number(target[i][0])-Number(base[i][0]))*w;out[i][1]+=(Number(target[i][1])-Number(base[i][1]))*w;}}
  return out;
}
