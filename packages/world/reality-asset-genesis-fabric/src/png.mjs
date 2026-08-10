import {deflateSync} from 'node:zlib';

const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type);const out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);return out;}
export function encodePng(width,height,rgba){
  if(rgba.length!==width*height*4)throw new Error('RGBA_SIZE_MISMATCH');
  const raw=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++){raw[y*(width*4+1)]=0;rgba.copy(raw,y*(width*4+1)+1,y*width*4,(y+1)*width*4);}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
export function surface(width,height,bg=[0,0,0,0]){const data=Buffer.alloc(width*height*4);for(let i=0;i<width*height;i++){data.set(bg,i*4);}return{width,height,data};}
export function pixel(s,x,y,c){if(x<0||y<0||x>=s.width||y>=s.height)return;const i=(Math.floor(y)*s.width+Math.floor(x))*4;s.data[i]=c[0];s.data[i+1]=c[1];s.data[i+2]=c[2];s.data[i+3]=c[3]??255;}
export function rect(s,x,y,w,h,c){for(let yy=Math.floor(y);yy<Math.ceil(y+h);yy++)for(let xx=Math.floor(x);xx<Math.ceil(x+w);xx++)pixel(s,xx,yy,c);}
export function circle(s,cx,cy,r,c){for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++)if((x-cx)**2+(y-cy)**2<=r*r)pixel(s,x,y,c);}
export function ellipse(s,cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)pixel(s,x,y,c);}
export function polygon(s,points,c){if(!Array.isArray(points)||points.length<3)return;const xs=points.map(point=>point[0]),ys=points.map(point=>point[1]),minX=Math.max(0,Math.floor(Math.min(...xs))),maxX=Math.min(s.width-1,Math.ceil(Math.max(...xs))),minY=Math.max(0,Math.floor(Math.min(...ys))),maxY=Math.min(s.height-1,Math.ceil(Math.max(...ys)));for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j],cross=(yi>y)!==(yj>y)&&x<((xj-xi)*(y-yi))/(yj-yi)+xi;if(cross)inside=!inside;}if(inside)pixel(s,x,y,c);}}
export function line(s,x0,y0,x1,y1,c,thickness=1){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy,x=x0,y=y0;for(;;){circle(s,x,y,Math.max(.5,thickness/2),c);if(x===x1&&y===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x+=sx;}if(e2<=dx){err+=dx;y+=sy;}}}
export function parseHex(hex){const h=hex.replace('#','');if(h.length===3)return [...h].map(x=>parseInt(x+x,16)).concat(255);return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),h.length>=8?parseInt(h.slice(6,8),16):255];}
