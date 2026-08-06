import {deflateSync} from 'node:zlib';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const mix=(a,b,t)=>a.map((value,index)=>Math.round(value+(b[index]-value)*t));
const color=(value,alpha=255)=>{const text=String(value).replace('#','');return[parseInt(text.slice(0,2),16),parseInt(text.slice(2,4),16),parseInt(text.slice(4,6),16),alpha]};

const crcTable=Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit+=1)value=(value&1)?0xedb88320^(value>>>1):value>>>1;return value>>>0});
function crc32(bytes){let value=0xffffffff;for(const byte of bytes)value=crcTable[(value^byte)&255]^(value>>>8);return(value^0xffffffff)>>>0}
function chunk(type,data){const name=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length,0);crc.writeUInt32BE(crc32(Buffer.concat([name,data])),0);return Buffer.concat([size,name,data,crc])}
export function encodePng(width,height,pixels){const raw=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y+=1){const row=y*(width*4+1);raw[row]=0;pixels.copy(raw,row+1,y*width*4,(y+1)*width*4)}const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:6})),chunk('IEND',Buffer.alloc(0))])}

export class Canvas {
  constructor(width,height){this.width=width;this.height=height;this.pixels=Buffer.alloc(width*height*4);}
  pixel(x,y,rgba){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=this.width||y>=this.height)return;const index=(y*this.width+x)*4,a=(rgba[3]??255)/255;if(a>=.999){this.pixels[index]=rgba[0];this.pixels[index+1]=rgba[1];this.pixels[index+2]=rgba[2];this.pixels[index+3]=255;return}const inverse=1-a;this.pixels[index]=Math.round(rgba[0]*a+this.pixels[index]*inverse);this.pixels[index+1]=Math.round(rgba[1]*a+this.pixels[index+1]*inverse);this.pixels[index+2]=Math.round(rgba[2]*a+this.pixels[index+2]*inverse);this.pixels[index+3]=Math.round(255*(a+(this.pixels[index+3]/255)*inverse));}
  fill(rgba){for(let y=0;y<this.height;y+=1)for(let x=0;x<this.width;x+=1)this.pixel(x,y,rgba)}
  gradient(top,bottom){for(let y=0;y<this.height;y+=1){const t=y/Math.max(1,this.height-1),row=mix(top,bottom,t);for(let x=0;x<this.width;x+=1)this.pixel(x,y,row)}}
  rect(x,y,width,height,rgba){const left=Math.floor(x),right=Math.ceil(x+width),top=Math.floor(y),bottom=Math.ceil(y+height);for(let py=top;py<=bottom;py+=1)for(let px=left;px<=right;px+=1)this.pixel(px,py,rgba)}
  ellipse(cx,cy,rx,ry,rgba){const left=Math.floor(cx-rx),right=Math.ceil(cx+rx),top=Math.floor(cy-ry),bottom=Math.ceil(cy+ry);for(let y=top;y<=bottom;y+=1)for(let x=left;x<=right;x+=1){const dx=(x-cx)/Math.max(1,rx),dy=(y-cy)/Math.max(1,ry);if(dx*dx+dy*dy<=1)this.pixel(x,y,rgba)}}
  line(x1,y1,x2,y2,rgba,width=2){const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));for(let index=0;index<=steps;index+=1){const t=steps?index/steps:0,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;for(let ox=-Math.floor(width/2);ox<=Math.ceil(width/2);ox+=1)for(let oy=-Math.floor(width/2);oy<=Math.ceil(width/2);oy+=1)this.pixel(x+ox,y+oy,rgba)}}
  polygon(points,rgba){if(points.length<3)return;const minY=Math.max(0,Math.floor(Math.min(...points.map(point=>point[1])))),maxY=Math.min(this.height-1,Math.ceil(Math.max(...points.map(point=>point[1]))));for(let y=minY;y<=maxY;y+=1){const intersections=[];for(let index=0;index<points.length;index+=1){const a=points[index],b=points[(index+1)%points.length];if((a[1]>y)!==(b[1]>y))intersections.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))}intersections.sort((a,b)=>a-b);for(let index=0;index<intersections.length;index+=2){const left=Math.max(0,Math.ceil(intersections[index])),right=Math.min(this.width-1,Math.floor(intersections[index+1]??intersections[index]));for(let x=left;x<=right;x+=1)this.pixel(x,y,rgba)}}}
  outline(points,fill,stroke=color('#18202b'),width=3){this.polygon(points,fill);for(let index=0;index<points.length;index+=1){const a=points[index],b=points[(index+1)%points.length];this.line(a[0],a[1],b[0],b[1],stroke,width)}}
  capsule(a,b,radius,fill,stroke=color('#18202b'),width=3){const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,nx=-dy/length*radius,ny=dx/length*radius;const points=[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]];this.outline(points,fill,stroke,width);this.ellipse(a[0],a[1],radius,radius,fill);this.ellipse(b[0],b[1],radius,radius,fill)}
  png(){return encodePng(this.width,this.height,this.pixels)}
}

export {color};
