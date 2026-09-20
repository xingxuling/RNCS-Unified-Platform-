import {clamp,dot,norm,len,sub} from './math.mjs';

export const qIdentity=()=>[0,0,0,1];
export const qClone=q=>[q[0],q[1],q[2],q[3]];
export function qNormalize(q){const l=Math.hypot(q[0],q[1],q[2],q[3]);return l<1e-12?qIdentity():q.map(v=>v/l)}
export function qConjugate(q){return [-q[0],-q[1],-q[2],q[3]]}
export function qMul(a,b){
  const [ax,ay,az,aw]=a,[bx,by,bz,bw]=b;
  return qNormalize([
    aw*bx+ax*bw+ay*bz-az*by,
    aw*by-ax*bz+ay*bw+az*bx,
    aw*bz+ax*by-ay*bx+az*bw,
    aw*bw-ax*bx-ay*by-az*bz
  ]);
}
export function qFromAxisAngle(axis,angleRad){const a=norm(axis),s=Math.sin(angleRad/2);return qNormalize([a[0]*s,a[1]*s,a[2]*s,Math.cos(angleRad/2)])}
export function qRotateVec(q,v){
  const [x,y,z,w]=q; const [vx,vy,vz]=v;
  const tx=2*(y*vz-z*vy),ty=2*(z*vx-x*vz),tz=2*(x*vy-y*vx);
  return [vx+w*tx+(y*tz-z*ty),vy+w*ty+(z*tx-x*tz),vz+w*tz+(x*ty-y*tx)];
}
export function qFromTo(from,to){
  const a=norm(from),b=norm(to); const d=clamp(dot(a,b),-1,1);
  if(d>0.999999)return qIdentity();
  if(d<-0.999999){
    let axis=Math.abs(a[0])<0.8?[1,0,0]:[0,1,0];
    axis=norm([a[1]*axis[2]-a[2]*axis[1],a[2]*axis[0]-a[0]*axis[2],a[0]*axis[1]-a[1]*axis[0]]);
    return qFromAxisAngle(axis,Math.PI);
  }
  const c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  return qNormalize([c[0],c[1],c[2],1+d]);
}
export function qSlerp(a,b,t){
  let bb=qClone(b); let cos=a[0]*bb[0]+a[1]*bb[1]+a[2]*bb[2]+a[3]*bb[3];
  if(cos<0){bb=bb.map(v=>-v);cos=-cos}
  if(cos>0.9995)return qNormalize(a.map((v,i)=>v+(bb[i]-v)*t));
  const theta=Math.acos(clamp(cos,-1,1)),sin=Math.sin(theta);
  const w1=Math.sin((1-t)*theta)/sin,w2=Math.sin(t*theta)/sin;
  return qNormalize(a.map((v,i)=>v*w1+bb[i]*w2));
}
export function qFromEulerXYZ(rx,ry,rz){
  const qx=qFromAxisAngle([1,0,0],rx),qy=qFromAxisAngle([0,1,0],ry),qz=qFromAxisAngle([0,0,1],rz);
  return qMul(qMul(qx,qy),qz);
}
export function qAngleDeg(a,b){let d=Math.abs(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]);d=clamp(d,-1,1);return 2*Math.acos(d)*180/Math.PI}
export function qLookDirection(bindDirection,desiredDirection){return qFromTo(bindDirection,desiredDirection)}
