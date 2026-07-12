import type { VSRMatrix3 } from '../../spec/src/index.js';

export const VSR_PATH_TESSELLATION_VERSION = '0.1.0-alpha.12';
export interface VSRPoint { x:number; y:number }
export interface VSRParsedPath { points:VSRPoint[]; closed:boolean }
export interface VSRTessellationResult { format:'vsr.path-tessellation.v0.1'; triangles:VSRPoint[]; polygonCount:number; triangleCount:number; diagnostics:string[] }

function tokenize(data:string):string[]{return data.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g)??[];}
export function parsePathData(data:string):VSRParsedPath[]{
  const tokens=tokenize(data),paths:VSRParsedPath[]=[];let index=0,command='',current:VSRPoint={x:0,y:0},start:VSRPoint={x:0,y:0},active:VSRParsedPath|undefined;
  const number=()=>{const token=tokens[index++];if(token===undefined||/[a-zA-Z]/.test(token))throw new Error('Invalid SVG path number.');const value=Number(token);if(!Number.isFinite(value))throw new Error('SVG path number must be finite.');return value;};
  const point=(relative:boolean):VSRPoint=>{const x=number(),y=number();return relative?{x:current.x+x,y:current.y+y}:{x,y};};
  const append=(p:VSRPoint)=>{if(!active){active={points:[],closed:false};paths.push(active);}active.points.push(p);current=p;};
  while(index<tokens.length){if(/[a-zA-Z]/.test(tokens[index]!))command=tokens[index++]!;if(!command)throw new Error('SVG path must begin with a command.');const relative=command===command.toLowerCase();switch(command.toUpperCase()){
    case'M':{const p=point(relative);active={points:[p],closed:false};paths.push(active);current=p;start=p;command=relative?'l':'L';break;}
    case'L':append(point(relative));break;
    case'H':{const x=number();append({x:relative?current.x+x:x,y:current.y});break;}
    case'V':{const y=number();append({x:current.x,y:relative?current.y+y:y});break;}
    case'Q':{const control=point(relative),end=point(relative),origin=current;for(let step=1;step<=12;step++){const t=step/12,u=1-t;append({x:u*u*origin.x+2*u*t*control.x+t*t*end.x,y:u*u*origin.y+2*u*t*control.y+t*t*end.y});}break;}
    case'C':{const c1=point(relative),c2=point(relative),end=point(relative),origin=current;for(let step=1;step<=16;step++){const t=step/16,u=1-t;append({x:u*u*u*origin.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*end.x,y:u*u*u*origin.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*end.y});}break;}
    case'Z':if(active){active.closed=true;current=start;}command='';break;
    default:throw new Error(`Unsupported SVG path command ${command}.`);
  }}return paths;
}
function area(points:VSRPoint[]):number{let sum=0;for(let i=0;i<points.length;i++){const a=points[i]!,b=points[(i+1)%points.length]!;sum+=a.x*b.y-b.x*a.y;}return sum/2;}
function cross(a:VSRPoint,b:VSRPoint,c:VSRPoint):number{return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function insideTriangle(p:VSRPoint,a:VSRPoint,b:VSRPoint,c:VSRPoint):boolean{const ab=cross(a,b,p),bc=cross(b,c,p),ca=cross(c,a,p);const neg=ab<0||bc<0||ca<0,pos=ab>0||bc>0||ca>0;return!(neg&&pos);}
function clean(points:VSRPoint[]):VSRPoint[]{const out:VSRPoint[]=[];for(const point of points){const prev=out.at(-1);if(!prev||Math.abs(prev.x-point.x)>1e-9||Math.abs(prev.y-point.y)>1e-9)out.push(point);}if(out.length>2){const first=out[0]!,last=out.at(-1)!;if(Math.abs(first.x-last.x)<1e-9&&Math.abs(first.y-last.y)<1e-9)out.pop();}return out;}
export function triangulatePolygon(input:VSRPoint[]):VSRPoint[]{
  const points=clean(input);if(points.length<3)return[];const indices=points.map((_,index)=>index);if(area(points)<0)indices.reverse();const triangles:VSRPoint[]=[];let guard=points.length*points.length;
  while(indices.length>3&&guard-->0){let clipped=false;for(let i=0;i<indices.length;i++){const ia=indices[(i-1+indices.length)%indices.length]!,ib=indices[i]!,ic=indices[(i+1)%indices.length]!,a=points[ia]!,b=points[ib]!,c=points[ic]!;if(cross(a,b,c)<=1e-10)continue;let contains=false;for(const index of indices){if(index===ia||index===ib||index===ic)continue;if(insideTriangle(points[index]!,a,b,c)){contains=true;break;}}if(contains)continue;triangles.push(a,b,c);indices.splice(i,1);clipped=true;break;}if(!clipped)break;}
  if(indices.length===3)triangles.push(points[indices[0]!]!,points[indices[1]!]!,points[indices[2]!]!);return triangles;
}
export function transformPoints(points:VSRPoint[],matrix:VSRMatrix3):VSRPoint[]{return points.map(point=>({x:matrix[0]*point.x+matrix[1]*point.y+matrix[2],y:matrix[3]*point.x+matrix[4]*point.y+matrix[5]}));}
export function tessellatePath(data:string,matrix?:VSRMatrix3):VSRTessellationResult{
  const diagnostics:string[]=[],triangles:VSRPoint[]=[];let polygonCount=0;try{for(const path of parsePathData(data)){if(!path.closed){diagnostics.push('open-path-skipped');continue;}const polygon=matrix?transformPoints(path.points,matrix):path.points;const result=triangulatePolygon(polygon);if(!result.length){diagnostics.push('polygon-not-triangulated');continue;}polygonCount++;triangles.push(...result);}}catch(error){diagnostics.push(error instanceof Error?error.message:String(error));}
  return{format:'vsr.path-tessellation.v0.1',triangles,polygonCount,triangleCount:triangles.length/3,diagnostics};
}
