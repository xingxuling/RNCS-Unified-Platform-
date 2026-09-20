import {qNormalize} from './quaternion.mjs';
export function m4Identity(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}
export function m4Mul(a,b){const o=new Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
export function m4FromRT(q,t){const [x,y,z,w]=qNormalize(q);const x2=x+x,y2=y+y,z2=z+z;const xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;return [1-(yy+zz),xy+wz,xz-wy,0,xy-wz,1-(xx+zz),yz+wx,0,xz+wy,yz-wx,1-(xx+yy),0,t[0],t[1],t[2],1]}
export function m4TransformPoint(m,p){const x=p[0],y=p[1],z=p[2];return [m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]]}
export function m4InverseRigid(m){const r=[m[0],m[1],m[2],0,m[4],m[5],m[6],0,m[8],m[9],m[10],0,0,0,0,1];const rt=[r[0],r[4],r[8],0,r[1],r[5],r[9],0,r[2],r[6],r[10],0,0,0,0,1];const t=[m[12],m[13],m[14]];rt[12]=-(rt[0]*t[0]+rt[4]*t[1]+rt[8]*t[2]);rt[13]=-(rt[1]*t[0]+rt[5]*t[1]+rt[9]*t[2]);rt[14]=-(rt[2]*t[0]+rt[6]*t[1]+rt[10]*t[2]);return rt}
