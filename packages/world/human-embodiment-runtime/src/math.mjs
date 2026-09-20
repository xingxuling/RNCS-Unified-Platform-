export const EPS=1e-9;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const len=a=>Math.hypot(...a);
export const norm=a=>{const l=len(a);return l<EPS?a.map(()=>0):a.map(v=>v/l)};
export const lerp=(a,b,t)=>a+(b-a)*t;
export const lerp3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
export const smoothstep=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
export const rad=d=>d*Math.PI/180;
export const deg=r=>r*180/Math.PI;
export function rotateY(v,a){const c=Math.cos(a),s=Math.sin(a);return [v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c]}
export function rotateX(v,a){const c=Math.cos(a),s=Math.sin(a);return [v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c]}
export function angleABC(a,b,c){const u=norm(sub(a,b)),v=norm(sub(c,b));return deg(Math.acos(clamp(dot(u,v),-1,1)))}
export function projectXZ(p){return [p[0],p[2]]}
export function cross2(a,b){return a[0]*b[1]-a[1]*b[0]}
export function distance2(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1])}
export function solveTwoBone(root,target,l1,l2,bendHint=[0,0,1]){
  const rt=sub(target,root), d0=len(rt), d=clamp(d0,1e-6,l1+l2-1e-6), dir=norm(rt);
  const x=(l1*l1-l2*l2+d*d)/(2*d);
  const h=Math.sqrt(Math.max(0,l1*l1-x*x));
  let side=sub(bendHint,mul(dir,dot(bendHint,dir)));
  if(len(side)<1e-6) side=[0,0,1];
  side=norm(side);
  return add(root,add(mul(dir,x),mul(side,h)));
}
