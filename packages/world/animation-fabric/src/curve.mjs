import {assert,clamp,finite} from './hash.mjs';

const vec=value=>Array.isArray(value)?value.map(Number):[Number(value)];
const restore=(sample,original)=>Array.isArray(original)?sample:sample[0];
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const mul=(a,s)=>a.map(v=>v*s);

export function normalizeCurve(curve={}){
  const keys=(curve.keys??[]).map((k,index)=>({
    id:String(k.id??`key:${index}`), time:Number(k.time), value:k.value,
    inTangent:k.inTangent??null, outTangent:k.outTangent??null,
    interpolation:String(k.interpolation??curve.interpolation??'LINEAR').toUpperCase()
  })).sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
  assert(keys.length>0,'ANIMATION_CURVE_KEYS_REQUIRED');
  assert(keys.every(k=>finite(k.time)),'ANIMATION_CURVE_TIME_INVALID');
  for(let i=1;i<keys.length;i++)assert(keys[i].time>keys[i-1].time,'ANIMATION_CURVE_TIME_NOT_STRICT');
  return {format:'rncs.animation-curve.v0.1',keys};
}

export function sampleCurve(curve,time){
  const c=normalizeCurve(curve),t=Number(time);assert(finite(t),'ANIMATION_CURVE_SAMPLE_TIME_INVALID');
  if(t<=c.keys[0].time)return structuredClone(c.keys[0].value);
  if(t>=c.keys.at(-1).time)return structuredClone(c.keys.at(-1).value);
  let i=0;while(i<c.keys.length-1&&t>c.keys[i+1].time)i++;
  const a=c.keys[i],b=c.keys[i+1],dt=b.time-a.time,u=clamp((t-a.time)/dt,0,1),av=vec(a.value),bv=vec(b.value);assert(av.length===bv.length,'ANIMATION_CURVE_DIMENSION_MISMATCH');
  if(a.interpolation==='STEP')return structuredClone(a.value);
  if(a.interpolation==='LINEAR')return restore(mix(av,bv,u),a.value);
  if(a.interpolation==='CUBICSPLINE'||a.interpolation==='HERMITE'){
    const m0=vec(a.outTangent??new Array(av.length).fill(0)),m1=vec(b.inTangent??new Array(av.length).fill(0));assert(m0.length===av.length&&m1.length===av.length,'ANIMATION_CURVE_TANGENT_DIMENSION_MISMATCH');
    const u2=u*u,u3=u2*u,h00=2*u3-3*u2+1,h10=u3-2*u2+u,h01=-2*u3+3*u2,h11=u3-u2;
    return restore(add(add(mul(av,h00),mul(m0,h10*dt)),add(mul(bv,h01),mul(m1,h11*dt))),a.value);
  }
  throw new Error(`ANIMATION_CURVE_INTERPOLATION_UNSUPPORTED:${a.interpolation}`);
}

export function sampleChannels(channels={},time){return Object.fromEntries(Object.entries(channels).map(([name,curve])=>[name,sampleCurve(curve,time)]));}
