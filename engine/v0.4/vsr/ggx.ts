export type Vec3 = [number, number, number];
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function distributionGGX(nDotH:number,roughness:number):number{const a=Math.max(0.04,roughness)**2;const a2=a*a;const d=nDotH*nDotH*(a2-1)+1;return a2/Math.max(Math.PI*d*d,1e-9);}
export function geometrySchlickGGX(nDotV:number,roughness:number):number{const r=roughness+1;const k=r*r/8;return nDotV/Math.max(nDotV*(1-k)+k,1e-9);}
export function geometrySmith(nDotV:number,nDotL:number,roughness:number):number{return geometrySchlickGGX(nDotV,roughness)*geometrySchlickGGX(nDotL,roughness);}
export function fresnelSchlick(cosTheta:number,f0:Vec3):Vec3{const factor=Math.pow(clamp(1-cosTheta,0,1),5);return[f0[0]+(1-f0[0])*factor,f0[1]+(1-f0[1])*factor,f0[2]+(1-f0[2])*factor];}
