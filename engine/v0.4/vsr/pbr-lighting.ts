import { distributionGGX, geometrySmith, fresnelSchlick, type Vec3 } from './ggx.js';
export interface PBRInput{baseColor:Vec3;metallic:number;roughness:number;ior:number;clearcoat:number;clearcoatRoughness:number;normal:Vec3;view:Vec3;light:Vec3;radiance:Vec3;}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scale=(a:Vec3,n:number):Vec3=>[a[0]*n,a[1]*n,a[2]*n];
const mul=(a:Vec3,b:Vec3):Vec3=>[a[0]*b[0],a[1]*b[1],a[2]*b[2]];
const normalize=(a:Vec3):Vec3=>{const n=Math.hypot(...a);return n<1e-9?[0,1,0]:scale(a,1/n);};
const mix=(a:Vec3,b:Vec3,t:number):Vec3=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
export function evaluatePBRLighting(input:PBRInput):Vec3{const n=normalize(input.normal),v=normalize(input.view),l=normalize(input.light),h=normalize(add(v,l));const nDotL=Math.max(0,dot(n,l)),nDotV=Math.max(.0001,dot(n,v)),nDotH=Math.max(0,dot(n,h)),vDotH=Math.max(0,dot(v,h));const metallic=clamp(input.metallic,0,1),roughness=clamp(input.roughness,.04,1),ior=clamp(input.ior,1,2.5),dielectric=((ior-1)/(ior+1))**2,f0=mix([dielectric,dielectric,dielectric],input.baseColor,metallic),f=fresnelSchlick(vDotH,f0),d=distributionGGX(nDotH,roughness),g=geometrySmith(nDotV,nDotL,roughness),specular=scale(f,d*g/Math.max(4*nDotV*nDotL,.0001)),kd=scale([1-f[0],1-f[1],1-f[2]],1-metallic),diffuse=scale(mul(kd,input.baseColor),1/Math.PI),coatRoughness=clamp(input.clearcoatRoughness,.04,1),coatF=fresnelSchlick(vDotH,[.04,.04,.04]),coat=scale(coatF,distributionGGX(nDotH,coatRoughness)*geometrySmith(nDotV,nDotL,coatRoughness)/Math.max(4*nDotV*nDotL,.0001)*clamp(input.clearcoat,0,1));return scale(mul(add(add(diffuse,specular),coat),input.radiance),nDotL);}
