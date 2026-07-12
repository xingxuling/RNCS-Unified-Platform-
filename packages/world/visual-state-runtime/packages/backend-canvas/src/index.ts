import { deflateSync, inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import {
  type VSRAsset,
  type VSRClip,
  type VSRDisplayItem,
  type VSRDisplayState,
  type VSRMatrix3,
  type VSRPaint,
  type VSRRect
} from '../../spec/src/index.js';

type RGBA = [number, number, number, number];
interface Point { x: number; y: number }

function clampByte(value:number):number { return Math.max(0,Math.min(255,Math.round(value))); }
export function parseColor(color:string):RGBA {
  const input=color.trim();const hex=input.match(/^#([0-9a-f]{3,8})$/i);
  if(hex){const h=hex[1]!;if(h.length===3||h.length===4)return[parseInt(h[0]!+h[0]!,16),parseInt(h[1]!+h[1]!,16),parseInt(h[2]!+h[2]!,16),h.length===4?parseInt(h[3]!+h[3]!,16):255];if(h.length===6||h.length===8)return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),h.length===8?parseInt(h.slice(6,8),16):255];}
  const rgb=input.match(/^rgba?\(([^)]+)\)$/i);if(rgb){const values=rgb[1]!.split(',').map(Number);return[clampByte(values[0]??0),clampByte(values[1]??0),clampByte(values[2]??0),values.length>3?clampByte((values[3]??1)*255):255];}
  const named:Record<string,RGBA>={transparent:[0,0,0,0],black:[0,0,0,255],white:[255,255,255,255],red:[255,0,0,255],green:[0,128,0,255],blue:[0,0,255,255],yellow:[255,255,0,255]};
  return named[input.toLowerCase()]??[255,0,255,255];
}
function paintColor(paint:VSRPaint|undefined,x=0,y=0):RGBA {
  if(!paint)return[0,0,0,0];if(paint.type==='solid')return parseColor(paint.color);
  const dx=paint.x2-paint.x1,dy=paint.y2-paint.y1,den=dx*dx+dy*dy||1;const t=Math.max(0,Math.min(1,((x-paint.x1)*dx+(y-paint.y1)*dy)/den));
  const stops=[...paint.stops].sort((a,b)=>a.offset-b.offset);if(!stops.length)return[0,0,0,0];if(t<=stops[0]!.offset)return parseColor(stops[0]!.color);if(t>=stops.at(-1)!.offset)return parseColor(stops.at(-1)!.color);
  for(let i=0;i<stops.length-1;i++){const a=stops[i]!,b=stops[i+1]!;if(t>=a.offset&&t<=b.offset){const p=(t-a.offset)/(b.offset-a.offset||1),ca=parseColor(a.color),cb=parseColor(b.color);return ca.map((v,j)=>clampByte(v+(cb[j]!-v)*p)) as RGBA;}}
  return parseColor(stops.at(-1)!.color);
}
function applyMatrix(matrix:VSRMatrix3,x:number,y:number):Point{return{x:matrix[0]*x+matrix[1]*y+matrix[2],y:matrix[3]*x+matrix[4]*y+matrix[5]};}
function inverseMatrix(matrix:VSRMatrix3):VSRMatrix3|null {
  const [a,b,c,d,e,f,g,h,i]=matrix;const A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g,D=-(b*i-c*h),E=a*i-c*g,F=-(a*h-b*g),G=b*f-c*e,H=-(a*f-c*d),I=a*e-b*d;const determinant=a*A+b*B+c*C;if(Math.abs(determinant)<1e-12)return null;return[A/determinant,D/determinant,G/determinant,B/determinant,E/determinant,H/determinant,C/determinant,F/determinant,I/determinant];
}
function transformedBounds(matrix:VSRMatrix3,rect:VSRRect):VSRRect {const points=[applyMatrix(matrix,rect.x,rect.y),applyMatrix(matrix,rect.x+rect.width,rect.y),applyMatrix(matrix,rect.x+rect.width,rect.y+rect.height),applyMatrix(matrix,rect.x,rect.y+rect.height)];const xs=points.map(p=>p.x),ys=points.map(p=>p.y);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);return{x:minX,y:minY,width:maxX-minX,height:maxY-minY};}
function pointInClips(x:number,y:number,clips:VSRClip[]|undefined):boolean {for(const clip of clips??[]){const r=clip.worldBounds;if(x<r.x||y<r.y||x>=r.x+r.width||y>=r.y+r.height)return false;}return true;}
function pointInPolygon(point:Point,polygon:Point[]):boolean {let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i]!,b=polygon[j]!;if(((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y||1e-12)+a.x))inside=!inside;}return inside;}
function isAxisAligned(matrix:VSRMatrix3):boolean{return Math.abs(matrix[1])<1e-12&&Math.abs(matrix[3])<1e-12&&Math.abs(matrix[6])<1e-12&&Math.abs(matrix[7])<1e-12&&Math.abs(matrix[8]-1)<1e-12;}
function clipBounds(rect:VSRRect,clips:VSRClip[]|undefined):VSRRect{let x1=rect.x,y1=rect.y,x2=rect.x+rect.width,y2=rect.y+rect.height;for(const clip of clips??[]){const r=clip.worldBounds;x1=Math.max(x1,r.x);y1=Math.max(y1,r.y);x2=Math.min(x2,r.x+r.width);y2=Math.min(y2,r.y+r.height);}return{x:x1,y:y1,width:Math.max(0,x2-x1),height:Math.max(0,y2-y1)};}

export class PixelSurface {
  readonly data:Uint8Array;
  constructor(readonly width:number,readonly height:number){if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0)throw new Error('Invalid raster dimensions.');this.data=new Uint8Array(width*height*4);}
  getPixel(x:number,y:number):RGBA {if(x<0||y<0||x>=this.width||y>=this.height)return[0,0,0,0];const index=(Math.floor(y)*this.width+Math.floor(x))*4;return[this.data[index]!,this.data[index+1]!,this.data[index+2]!,this.data[index+3]!];}
  private blend(x:number,y:number,color:RGBA,opacity:number,clips?:VSRClip[]):void {x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=this.width||y>=this.height||!pointInClips(x+.5,y+.5,clips))return;const index=(y*this.width+x)*4;const sourceAlpha=(color[3]/255)*Math.max(0,Math.min(1,opacity)),destinationAlpha=this.data[index+3]!/255,outAlpha=sourceAlpha+destinationAlpha*(1-sourceAlpha);if(outAlpha<=0)return;for(let channel=0;channel<3;channel++)this.data[index+channel]=clampByte((color[channel]!*sourceAlpha+this.data[index+channel]!*destinationAlpha*(1-sourceAlpha))/outAlpha);this.data[index+3]=clampByte(outAlpha*255);}
  fillSolidRectFast(rect:VSRRect,color:RGBA,opacity=1,clips?:VSRClip[]):void {const clipped=clipBounds(rect,clips),minX=Math.max(0,Math.floor(clipped.x)),maxX=Math.min(this.width,Math.ceil(clipped.x+clipped.width)),minY=Math.max(0,Math.floor(clipped.y)),maxY=Math.min(this.height,Math.ceil(clipped.y+clipped.height));if(minX>=maxX||minY>=maxY)return;const alpha=Math.max(0,Math.min(1,opacity))*color[3]/255;if(alpha>=.999999){const width=maxX-minX,row=new Uint8Array(width*4);for(let x=0;x<width;x++){const i=x*4;row[i]=color[0];row[i+1]=color[1];row[i+2]=color[2];row[i+3]=255;}for(let y=minY;y<maxY;y++)this.data.set(row,(y*this.width+minX)*4);return;}for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++)this.blend(x,y,color,opacity);}
  fillAxisAlignedRoundedRect(rect:VSRRect,color:RGBA,opacity:number,radiusX:number,radiusY:number,clips?:VSRClip[]):void {const rX=Math.max(0,Math.min(rect.width/2,radiusX)),rY=Math.max(0,Math.min(rect.height/2,radiusY));if(rX<=0||rY<=0){this.fillSolidRectFast(rect,color,opacity,clips);return;}const minY=Math.max(0,Math.floor(rect.y)),maxY=Math.min(this.height,Math.ceil(rect.y+rect.height));for(let y=minY;y<maxY;y++){const py=y+.5;let inset=0;if(py<rect.y+rY){const dy=(rect.y+rY-py)/rY;inset=rX*(1-Math.sqrt(Math.max(0,1-dy*dy)));}else if(py>rect.y+rect.height-rY){const dy=(py-(rect.y+rect.height-rY))/rY;inset=rX*(1-Math.sqrt(Math.max(0,1-dy*dy)));}this.fillSolidRectFast({x:rect.x+inset,y,width:Math.max(0,rect.width-inset*2),height:1},color,opacity,clips);}}
  fillRect(rect:VSRRect,paint:VSRPaint|undefined,opacity=1,clips?:VSRClip[]):void {if(paint?.type==='solid'){this.fillSolidRectFast(rect,parseColor(paint.color),opacity,clips);return;}const minX=Math.max(0,Math.floor(rect.x)),maxX=Math.min(this.width,Math.ceil(rect.x+rect.width)),minY=Math.max(0,Math.floor(rect.y)),maxY=Math.min(this.height,Math.ceil(rect.y+rect.height));for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++)this.blend(x,y,paintColor(paint,x+.5,y+.5),opacity,clips);}
  fillByInverse(localBounds:VSRRect,matrix:VSRMatrix3,predicate:(x:number,y:number)=>boolean,paint:VSRPaint|undefined,opacity:number,clips?:VSRClip[]):void {const inverse=inverseMatrix(matrix);if(!inverse)return;const bounds=transformedBounds(matrix,localBounds);const minX=Math.max(0,Math.floor(bounds.x)),maxX=Math.min(this.width,Math.ceil(bounds.x+bounds.width)),minY=Math.max(0,Math.floor(bounds.y)),maxY=Math.min(this.height,Math.ceil(bounds.y+bounds.height));for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){const local=applyMatrix(inverse,x+.5,y+.5);if(predicate(local.x,local.y))this.blend(x,y,paintColor(paint,local.x,local.y),opacity,clips);}}
  fillTransformedRect(rect:VSRRect,matrix:VSRMatrix3,paint:VSRPaint|undefined,opacity=1,clips?:VSRClip[],radius=0):void {if(isAxisAligned(matrix)){const a=applyMatrix(matrix,rect.x,rect.y),b=applyMatrix(matrix,rect.x+rect.width,rect.y+rect.height),world={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(b.x-a.x),height:Math.abs(b.y-a.y)};if(radius<=0){this.fillRect(world,paint,opacity,clips);return;}if(paint?.type==='solid'){this.fillAxisAlignedRoundedRect(world,parseColor(paint.color),opacity,radius*Math.abs(matrix[0]),radius*Math.abs(matrix[4]),clips);return;}}const r=Math.max(0,Math.min(Math.min(rect.width,rect.height)/2,radius));this.fillByInverse(rect,matrix,(x,y)=>{if(x<rect.x||y<rect.y||x>rect.x+rect.width||y>rect.y+rect.height)return false;if(r<=0)return true;const cx=x<rect.x+r?rect.x+r:x>rect.x+rect.width-r?rect.x+rect.width-r:x,cy=y<rect.y+r?rect.y+r:y>rect.y+rect.height-r?rect.y+rect.height-r:y;return(x-cx)**2+(y-cy)**2<=r*r;},paint,opacity,clips);}
  strokeTransformedRect(rect:VSRRect,matrix:VSRMatrix3,paint:VSRPaint|undefined,width=1,opacity=1,clips?:VSRClip[],radius=0):void {const half=Math.max(.5,width/2);this.fillByInverse({x:rect.x-half,y:rect.y-half,width:rect.width+width,height:rect.height+width},matrix,(x,y)=>{const outer=x>=rect.x-half&&x<=rect.x+rect.width+half&&y>=rect.y-half&&y<=rect.y+rect.height+half;const inner=x>rect.x+half&&x<rect.x+rect.width-half&&y>rect.y+half&&y<rect.y+rect.height-half;void radius;return outer&&!inner;},paint,opacity,clips);}
  fillTransformedEllipse(rect:VSRRect,matrix:VSRMatrix3,paint:VSRPaint|undefined,opacity=1,clips?:VSRClip[]):void {const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2,rx=Math.max(.001,Math.abs(rect.width/2)),ry=Math.max(.001,Math.abs(rect.height/2));this.fillByInverse(rect,matrix,(x,y)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1,paint,opacity,clips);}
  strokeTransformedEllipse(rect:VSRRect,matrix:VSRMatrix3,paint:VSRPaint|undefined,width=1,opacity=1,clips?:VSRClip[]):void {const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2,rx=Math.max(.001,Math.abs(rect.width/2)),ry=Math.max(.001,Math.abs(rect.height/2)),threshold=Math.max(.01,width/Math.max(rx,ry));this.fillByInverse(rect,matrix,(x,y)=>{const distance=Math.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2);return Math.abs(distance-1)<=threshold;},paint,opacity,clips);}
  lineWorld(start:Point,end:Point,paint:VSRPaint|undefined,width=1,opacity=1,clips?:VSRClip[]):void {const dx=end.x-start.x,dy=end.y-start.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*1.5));const radius=Math.max(.5,width/2);for(let index=0;index<=steps;index++){const t=index/steps,x=start.x+dx*t,y=start.y+dy*t;const minX=Math.floor(x-radius),maxX=Math.ceil(x+radius),minY=Math.floor(y-radius),maxY=Math.ceil(y+radius);for(let py=minY;py<=maxY;py++)for(let px=minX;px<=maxX;px++)if((px+.5-x)**2+(py+.5-y)**2<=radius*radius)this.blend(px,py,paintColor(paint,px+.5,py+.5),opacity,clips);}}
  fillPolygon(points:Point[],paint:VSRPaint|undefined,opacity=1,clips?:VSRClip[]):void {if(points.length<3)return;const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.max(0,Math.floor(Math.min(...xs))),maxX=Math.min(this.width,Math.ceil(Math.max(...xs))),minY=Math.max(0,Math.floor(Math.min(...ys))),maxY=Math.min(this.height,Math.ceil(Math.max(...ys)));for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++)if(pointInPolygon({x:x+.5,y:y+.5},points))this.blend(x,y,paintColor(paint,x+.5,y+.5),opacity,clips);}
  strokePolyline(points:Point[],paint:VSRPaint|undefined,width=1,opacity=1,clips?:VSRClip[],closed=false):void {for(let i=0;i<points.length-1;i++)this.lineWorld(points[i]!,points[i+1]!,paint,width,opacity,clips);if(closed&&points.length>2)this.lineWorld(points.at(-1)!,points[0]!,paint,width,opacity,clips);}
  drawImageTransformed(rect:VSRRect,matrix:VSRMatrix3,image:VSRImageBitmap,fit:'fill'|'contain'|'cover'|'none'='fill',opacity=1,clips?:VSRClip[]):void {
    const inverse=inverseMatrix(matrix);if(!inverse)return;let drawRect={...rect},source={x:0,y:0,width:image.width,height:image.height};
    const sourceAspect=image.width/image.height,targetAspect=rect.width/rect.height;
    if(fit==='contain'){if(sourceAspect>targetAspect){const height=rect.width/sourceAspect;drawRect={x:rect.x,y:rect.y+(rect.height-height)/2,width:rect.width,height};}else{const width=rect.height*sourceAspect;drawRect={x:rect.x+(rect.width-width)/2,y:rect.y,width,height:rect.height};}}
    else if(fit==='cover'){if(sourceAspect>targetAspect){const width=image.height*targetAspect;source={x:(image.width-width)/2,y:0,width,height:image.height};}else{const height=image.width/targetAspect;source={x:0,y:(image.height-height)/2,width:image.width,height};}}
    else if(fit==='none')drawRect={x:rect.x,y:rect.y,width:image.width,height:image.height};
    const bounds=transformedBounds(matrix,drawRect),minX=Math.max(0,Math.floor(bounds.x)),maxX=Math.min(this.width,Math.ceil(bounds.x+bounds.width)),minY=Math.max(0,Math.floor(bounds.y)),maxY=Math.min(this.height,Math.ceil(bounds.y+bounds.height));
    for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){const local=applyMatrix(inverse,x+.5,y+.5);if(local.x<drawRect.x||local.y<drawRect.y||local.x>=drawRect.x+drawRect.width||local.y>=drawRect.y+drawRect.height)continue;const u=(local.x-drawRect.x)/drawRect.width,v=(local.y-drawRect.y)/drawRect.height,sx=Math.max(0,Math.min(image.width-1,Math.floor(source.x+u*source.width))),sy=Math.max(0,Math.min(image.height-1,Math.floor(source.y+v*source.height))),index=(sy*image.width+sx)*4;this.blend(x,y,[image.data[index]!,image.data[index+1]!,image.data[index+2]!,image.data[index+3]!],opacity,clips);}
  }
}

export interface VSRImageBitmap { width:number; height:number; data:Uint8Array }
export type VSRImageResourceMap = Map<string,VSRImageBitmap>;
export interface VSRBitmapFont {
  format: 'vsr-bitmap-font-1'; family: string; glyphWidth: number; glyphHeight: number; advance?: number;
  glyphs: Record<string,string[]>; fallback?: string[];
}
export type VSRFontResourceMap = Map<string,VSRBitmapFont>;
export interface VSRRasterResources { images:VSRImageResourceMap; fonts:VSRFontResourceMap }
export type VSRRasterResourceInput = VSRRasterResources | VSRImageResourceMap;
function paeth(a:number,b:number,c:number):number {const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
export function decodePng(bytes:Uint8Array):VSRImageBitmap {
  const buffer=Buffer.from(bytes);if(buffer.length<8||!buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('不是有效 PNG。');
  let offset=8,width=0,height=0,bitDepth=0,colorType=0,interlace=0;const idat:Buffer[]=[];
  while(offset+12<=buffer.length){const length=buffer.readUInt32BE(offset),type=buffer.toString('ascii',offset+4,offset+8),data=buffer.subarray(offset+8,offset+8+length);offset+=12+length;if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];interlace=data[12];}else if(type==='IDAT')idat.push(data);else if(type==='IEND')break;}
  if(!width||!height||bitDepth!==8||interlace!==0)throw new Error('仅支持 8-bit、非交错 PNG。');const channels=({0:1,2:3,4:2,6:4} as Record<number,number>)[colorType];if(!channels)throw new Error(`暂不支持 PNG colorType ${colorType}。`);
  const inflated=inflateSync(Buffer.concat(idat)),stride=width*channels,rgba=new Uint8Array(width*height*4);let sourceOffset=0;let previous=new Uint8Array(stride);
  for(let y=0;y<height;y++){const filter=inflated[sourceOffset++]!,raw=inflated.subarray(sourceOffset,sourceOffset+stride);sourceOffset+=stride;const row=new Uint8Array(stride);for(let x=0;x<stride;x++){const left=x>=channels?row[x-channels]!:0,up=previous[x]??0,upLeft=x>=channels?previous[x-channels]!:0,value=raw[x]??0;row[x]=(value+(filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):filter===4?paeth(left,up,upLeft):(()=>{throw new Error(`不支持 PNG filter ${filter}。`);})()))&255;}
    for(let x=0;x<width;x++){const src=x*channels,dst=(y*width+x)*4;if(colorType===6){rgba[dst]=row[src]!;rgba[dst+1]=row[src+1]!;rgba[dst+2]=row[src+2]!;rgba[dst+3]=row[src+3]!;}else if(colorType===2){rgba[dst]=row[src]!;rgba[dst+1]=row[src+1]!;rgba[dst+2]=row[src+2]!;rgba[dst+3]=255;}else if(colorType===4){rgba[dst]=rgba[dst+1]=rgba[dst+2]=row[src]!;rgba[dst+3]=row[src+1]!;}else{rgba[dst]=rgba[dst+1]=rgba[dst+2]=row[src]!;rgba[dst+3]=255;}}
    previous=row;
  }
  return{width,height,data:rgba};
}
export function loadImageResources(assets:VSRAsset[]|undefined,baseDir=process.cwd(),strict=false):VSRImageResourceMap {
  const resources:VSRImageResourceMap=new Map();for(const asset of assets??[]){if(asset.type!=='image')continue;try{if(/^https?:\/\//i.test(asset.src))throw new Error('Node 离线渲染默认禁止网络图片。');const path=resolve(baseDir,asset.src),bytes=readFileSync(path) as Uint8Array,extension=extname(path).toLowerCase();if(extension!=='.png'&&asset.mimeType!=='image/png')throw new Error(`暂不支持图片格式 ${extension||asset.mimeType||'unknown'}。`);resources.set(asset.id,decodePng(bytes));}catch(error){if(strict)throw error;}}
  return resources;
}

export function loadFontResources(assets:VSRAsset[]|undefined,baseDir=process.cwd(),strict=false):VSRFontResourceMap {
  const resources:VSRFontResourceMap=new Map();for(const asset of assets??[]){if(asset.type!=='font')continue;try{if(/^https?:\/\//i.test(asset.src))throw new Error('Node 离线渲染默认禁止网络字体。');const path=resolve(baseDir,asset.src),raw=JSON.parse(String(readFileSync(path,'utf8'))) as Partial<VSRBitmapFont>;if(raw.format!=='vsr-bitmap-font-1'||!raw.family||!Number.isInteger(raw.glyphWidth)||!Number.isInteger(raw.glyphHeight)||!raw.glyphs)throw new Error('无效的 VSR bitmap font。');const font=raw as VSRBitmapFont;resources.set(asset.id,font);resources.set(font.family,font);}catch(error){if(strict)throw error;}}
  return resources;
}
export function loadRasterResources(assets:VSRAsset[]|undefined,baseDir=process.cwd(),strict=false):VSRRasterResources {return{images:loadImageResources(assets,baseDir,strict),fonts:loadFontResources(assets,baseDir,strict)};}
function normalizeResources(resources:VSRRasterResourceInput|undefined):VSRRasterResources {return resources instanceof Map?{images:resources,fonts:new Map()}:resources??{images:new Map(),fonts:new Map()};}

const FONT:Record<string,string[]>={
  'A':['01110','10001','10001','11111','10001','10001','10001'],'B':['11110','10001','10001','11110','10001','10001','11110'],'C':['01111','10000','10000','10000','10000','10000','01111'],'D':['11110','10001','10001','10001','10001','10001','11110'],'E':['11111','10000','10000','11110','10000','10000','11111'],'F':['11111','10000','10000','11110','10000','10000','10000'],'G':['01111','10000','10000','10111','10001','10001','01111'],'H':['10001','10001','10001','11111','10001','10001','10001'],'I':['11111','00100','00100','00100','00100','00100','11111'],'J':['00111','00010','00010','00010','10010','10010','01100'],'K':['10001','10010','10100','11000','10100','10010','10001'],'L':['10000','10000','10000','10000','10000','10000','11111'],'M':['10001','11011','10101','10101','10001','10001','10001'],'N':['10001','11001','10101','10011','10001','10001','10001'],'O':['01110','10001','10001','10001','10001','10001','01110'],'P':['11110','10001','10001','11110','10000','10000','10000'],'Q':['01110','10001','10001','10001','10101','10010','01101'],'R':['11110','10001','10001','11110','10100','10010','10001'],'S':['01111','10000','10000','01110','00001','00001','11110'],'T':['11111','00100','00100','00100','00100','00100','00100'],'U':['10001','10001','10001','10001','10001','10001','01110'],'V':['10001','10001','10001','10001','10001','01010','00100'],'W':['10001','10001','10001','10101','10101','10101','01010'],'X':['10001','10001','01010','00100','01010','10001','10001'],'Y':['10001','10001','01010','00100','00100','00100','00100'],'Z':['11111','00001','00010','00100','01000','10000','11111'],
  '0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['01110','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],
  ' ':['00000','00000','00000','00000','00000','00000','00000'],'-':['00000','00000','00000','11111','00000','00000','00000'],'.':['00000','00000','00000','00000','00000','01100','01100'],':':['00000','01100','01100','00000','01100','01100','00000']
};
function drawText(surface:PixelSurface,item:VSRDisplayItem,paint:VSRPaint|undefined,fonts:VSRFontResourceMap):void {
  const content=item.content as Record<string,unknown>,text=String(content.text??''),fontSize=Number(content.fontSize??24),family=String(content.fontFamily??''),font=fonts.get(family);
  const glyphs=font?.glyphs??FONT,glyphWidth=font?.glyphWidth??5,glyphHeight=font?.glyphHeight??7,advance=font?.advance??glyphWidth+1,scale=Math.max(1,Math.floor(fontSize/(glyphHeight+1))),characterWidth=advance*scale,total=text.length*characterWidth,rect=item.localBounds;
  let startX=rect.x;if(content.align==='center')startX+=Math.max(0,(rect.width-total)/2);else if(content.align==='right')startX+=Math.max(0,rect.width-total);const startY=rect.y+Math.max(0,(rect.height-glyphHeight*scale)/2);let x=startX;
  const fallback=font?.fallback??Array.from({length:glyphHeight},(_,row)=>row===0||row===glyphHeight-1?'1'.repeat(glyphWidth):`1${'0'.repeat(Math.max(0,glyphWidth-2))}1`);
  for(const raw of text){const glyph=glyphs[raw]??glyphs[raw.toUpperCase()]??fallback;for(let gy=0;gy<glyphHeight;gy++){const row=glyph[gy]??'';for(let gx=0;gx<glyphWidth;gx++)if(row[gx]==='1')surface.fillTransformedRect({x:x+gx*scale,y:startY+gy*scale,width:scale,height:scale},item.worldTransform,paint,item.opacity,item.clipStack);}x+=characterWidth;if(x>rect.x+rect.width)break;}
}

interface ParsedPath { points:Point[]; closed:boolean }
function tokenizePath(data:string):string[]{return data.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g)??[];}
export function parsePathData(data:string):ParsedPath[] {
  const tokens=tokenizePath(data);const paths:ParsedPath[]=[];let index=0,command='',current:Point={x:0,y:0},start:Point={x:0,y:0},active:ParsedPath|undefined;
  const number=()=>{const token=tokens[index++];if(token===undefined||/[a-zA-Z]/.test(token))throw new Error('Invalid SVG path number.');return Number(token);};
  const point=(relative:boolean):Point=>{const x=number(),y=number();return relative?{x:current.x+x,y:current.y+y}:{x,y};};
  const append=(p:Point)=>{if(!active){active={points:[],closed:false};paths.push(active);}active.points.push(p);current=p;};
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
function renderPath(surface:PixelSurface,item:VSRDisplayItem,fill:VSRPaint|undefined,stroke:VSRPaint|undefined,width:number):void {try{const paths=parsePathData(String((item.content as Record<string,unknown>).d??''));for(const path of paths){const world=path.points.map(p=>applyMatrix(item.worldTransform,p.x,p.y));if(fill&&path.closed)surface.fillPolygon(world,fill,item.opacity,item.clipStack);if(stroke)surface.strokePolyline(world,stroke,width,item.opacity,item.clipStack,path.closed);}}catch{surface.strokeTransformedRect(item.localBounds,item.worldTransform,stroke??fill,width,item.opacity,item.clipStack);}}

export function rasterizeDisplayState(state:VSRDisplayState,resourceInput?:VSRRasterResourceInput):PixelSurface {
  const resources=normalizeResources(resourceInput);const surface=new PixelSurface(Math.round(state.viewport.width),Math.round(state.viewport.height));surface.fillRect({x:0,y:0,width:surface.width,height:surface.height},state.background,1);
  for(const item of state.items){const appearance=item.appearance,fill=appearance.fill as VSRPaint|undefined,stroke=appearance.stroke as VSRPaint|undefined,width=Number(appearance.strokeWidth??1),content=item.content as Record<string,unknown>;
    if(item.type==='rect'){const radius=Array.isArray(content.cornerRadius)?Number(content.cornerRadius[0]??0):Number(content.cornerRadius??0);if(fill)surface.fillTransformedRect(item.localBounds,item.worldTransform,fill,item.opacity,item.clipStack,radius);if(stroke)surface.strokeTransformedRect(item.localBounds,item.worldTransform,stroke,width,item.opacity,item.clipStack,radius);}
    else if(item.type==='ellipse'){if(fill)surface.fillTransformedEllipse(item.localBounds,item.worldTransform,fill,item.opacity,item.clipStack);if(stroke)surface.strokeTransformedEllipse(item.localBounds,item.worldTransform,stroke,width,item.opacity,item.clipStack);}
    else if(item.type==='line'){const start=applyMatrix(item.worldTransform,Number(content.x1??item.localBounds.x),Number(content.y1??item.localBounds.y)),end=applyMatrix(item.worldTransform,Number(content.x2??item.localBounds.x+item.localBounds.width),Number(content.y2??item.localBounds.y+item.localBounds.height));surface.lineWorld(start,end,stroke??fill,width,item.opacity,item.clipStack);}
    else if(item.type==='text')drawText(surface,item,fill??{type:'solid',color:'#ffffff'},resources.fonts);
    else if(item.type==='path')renderPath(surface,item,fill,stroke,width);
    else if(item.type==='image'){const image=resources.images.get(String(content.assetId??''));if(image)surface.drawImageTransformed(item.localBounds,item.worldTransform,image,String(content.fit??'fill') as 'fill'|'contain'|'cover'|'none',item.opacity,item.clipStack);else{surface.fillTransformedRect(item.localBounds,item.worldTransform,{type:'solid',color:'#54358a'},item.opacity,item.clipStack);const a=applyMatrix(item.worldTransform,item.localBounds.x,item.localBounds.y),b=applyMatrix(item.worldTransform,item.localBounds.x+item.localBounds.width,item.localBounds.y+item.localBounds.height),c=applyMatrix(item.worldTransform,item.localBounds.x+item.localBounds.width,item.localBounds.y),d=applyMatrix(item.worldTransform,item.localBounds.x,item.localBounds.y+item.localBounds.height);surface.lineWorld(a,b,{type:'solid',color:'#ffffff'},1,item.opacity,item.clipStack);surface.lineWorld(c,d,{type:'solid',color:'#ffffff'},1,item.opacity,item.clipStack);}}
  }
  return surface;
}

function crc32(data:Uint8Array):number {let crc=0xffffffff;for(const byte of data){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function u32(value:number):Buffer {const buffer=Buffer.alloc(4);buffer.writeUInt32BE(value>>>0,0);return buffer;}
function chunk(type:string,data:Buffer):Buffer {const typeBytes=Buffer.from(type,'ascii');return Buffer.concat([u32(data.length),typeBytes,data,u32(crc32(Buffer.concat([typeBytes,data])))]);}
export interface VSREncodePngOptions { compressionLevel?:number }
export function encodePng(surface:PixelSurface,options:VSREncodePngOptions={}):Uint8Array {const raw=Buffer.alloc((surface.width*4+1)*surface.height);for(let y=0;y<surface.height;y++){const row=y*(surface.width*4+1);raw[row]=0;Buffer.from(surface.data.buffer,surface.data.byteOffset+y*surface.width*4,surface.width*4).copy(raw,row+1);}const header=Buffer.alloc(13);header.writeUInt32BE(surface.width,0);header.writeUInt32BE(surface.height,4);header[8]=8;header[9]=6;header[10]=0;header[11]=0;header[12]=0;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:Math.max(0,Math.min(9,Math.round(options.compressionLevel??6)))})),chunk('IEND',Buffer.alloc(0))]);}
export function renderPng(state:VSRDisplayState,resources?:VSRRasterResourceInput,options:VSREncodePngOptions={}):Uint8Array {return encodePng(rasterizeDisplayState(state,resources),options);}
