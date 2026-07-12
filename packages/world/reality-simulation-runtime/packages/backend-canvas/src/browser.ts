import type { VSRDisplayState, VSRPaint, VSRRect } from '../../spec/src/index.js';

function paint(ctx:CanvasRenderingContext2D,value:VSRPaint|undefined,rect:VSRRect):string|CanvasGradient {
  if(!value)return'transparent';if(value.type==='solid')return value.color;
  const gradient=ctx.createLinearGradient(rect.x+value.x1,rect.y+value.y1,rect.x+value.x2,rect.y+value.y2);for(const stop of value.stops)gradient.addColorStop(stop.offset,stop.color);return gradient;
}
function wrappedLines(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,mode:string,maxLines:number):string[] {
  if(mode==='none'||maxWidth<=0)return[text];const units=mode==='character'?[...text]:text.split(/(\s+)/).filter(Boolean);const lines:string[]=[];let current='';
  for(const unit of units){const candidate=current+unit;if(current&&ctx.measureText(candidate).width>maxWidth){lines.push(current.trimEnd());current=unit.trimStart();if(lines.length>=maxLines)break;}else current=candidate;}
  if(lines.length<maxLines&&current)lines.push(current.trimEnd());return lines.slice(0,maxLines);
}
function configureAppearance(ctx:CanvasRenderingContext2D,appearance:Record<string,unknown>):void {
  ctx.globalAlpha=Number(appearance.opacity??1);ctx.lineWidth=Number(appearance.strokeWidth??1);ctx.lineCap=(appearance.lineCap as CanvasLineCap)??'butt';ctx.lineJoin=(appearance.lineJoin as CanvasLineJoin)??'miter';ctx.setLineDash(Array.isArray(appearance.dash)?appearance.dash.map(Number):[]);
  const shadow=appearance.shadow as {color?:string;blur?:number;offsetX?:number;offsetY?:number}|undefined;if(shadow){ctx.shadowColor=shadow.color??'transparent';ctx.shadowBlur=Number(shadow.blur??0);ctx.shadowOffsetX=Number(shadow.offsetX??0);ctx.shadowOffsetY=Number(shadow.offsetY??0);}
  const blend=String(appearance.blendMode??'source-over');const supported=new Set(['source-over','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity']);if(supported.has(blend))ctx.globalCompositeOperation=blend as GlobalCompositeOperation;
}

export function drawDisplayStateToCanvas(state:VSRDisplayState,canvas:HTMLCanvasElement):void {
  const dpr=state.viewport.dpr;canvas.width=Math.round(state.viewport.width*dpr);canvas.height=Math.round(state.viewport.height*dpr);canvas.style.width=`${state.viewport.width}px`;canvas.style.height=`${state.viewport.height}px`;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D unavailable.');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,state.viewport.width,state.viewport.height);ctx.fillStyle=paint(ctx,state.background,{x:0,y:0,width:state.viewport.width,height:state.viewport.height});ctx.fillRect(0,0,state.viewport.width,state.viewport.height);
  for(const item of state.items){const rect=item.localBounds,m=item.worldTransform,appearance=item.appearance as unknown as Record<string,unknown>,content=item.content as Record<string,unknown>;ctx.save();
    if(item.clipStack?.length){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.beginPath();for(const clip of item.clipStack){const r=clip.worldBounds;ctx.rect(r.x,r.y,r.width,r.height);}ctx.clip();}
    ctx.setTransform(m[0]*dpr,m[3]*dpr,m[1]*dpr,m[4]*dpr,m[2]*dpr,m[5]*dpr);configureAppearance(ctx,appearance);ctx.fillStyle=paint(ctx,appearance.fill as VSRPaint|undefined,rect);ctx.strokeStyle=paint(ctx,appearance.stroke as VSRPaint|undefined,rect);
    if(item.type==='rect'){ctx.beginPath();const raw=content.cornerRadius;const radius=Array.isArray(raw)?raw.map(Number):Number(raw??0);ctx.roundRect(rect.x,rect.y,rect.width,rect.height,radius);if(appearance.fill)ctx.fill();if(appearance.stroke)ctx.stroke();}
    else if(item.type==='ellipse'){ctx.beginPath();ctx.ellipse(rect.x+rect.width/2,rect.y+rect.height/2,Math.abs(rect.width/2),Math.abs(rect.height/2),0,0,Math.PI*2);if(appearance.fill)ctx.fill();if(appearance.stroke)ctx.stroke();}
    else if(item.type==='line'){ctx.beginPath();ctx.moveTo(Number(content.x1??rect.x),Number(content.y1??rect.y));ctx.lineTo(Number(content.x2??rect.x+rect.width),Number(content.y2??rect.y+rect.height));ctx.stroke();}
    else if(item.type==='text'){const fontSize=Number(content.fontSize??24);ctx.font=`${String(content.fontWeight??'normal')} ${fontSize}px ${String(content.fontFamily??'sans-serif')}`;ctx.textAlign=(content.align as CanvasTextAlign)??'left';ctx.textBaseline='top';const maxLines=Math.max(1,Number(content.maxLines??1000)),lineHeight=fontSize*Number(content.lineHeight??1.2);const lines=wrappedLines(ctx,String(content.text??''),rect.width,String(content.wrap??'none'),maxLines);const total=lines.length*lineHeight;let y=rect.y;if(content.verticalAlign==='middle')y+=Math.max(0,(rect.height-total)/2);else if(content.verticalAlign==='bottom')y+=Math.max(0,rect.height-total);const x=content.align==='center'?rect.x+rect.width/2:content.align==='right'?rect.x+rect.width:rect.x;for(let index=0;index<lines.length;index++){let line=lines[index]!;if(index===lines.length-1&&lines.length>=maxLines&&content.overflow==='ellipsis'&&ctx.measureText(line).width>rect.width){while(line&&ctx.measureText(`${line}…`).width>rect.width)line=line.slice(0,-1);line+='…';}ctx.fillText(line,x,y+index*lineHeight,rect.width);}}
    else if(item.type==='path'){try{const path=new Path2D(String(content.d??''));if(appearance.fill)ctx.fill(path,String(content.fillRule??'nonzero') as CanvasFillRule);if(appearance.stroke)ctx.stroke(path);}catch{ctx.strokeRect(rect.x,rect.y,rect.width,rect.height);}}
    else if(item.type==='image'){ctx.fillStyle='#54358a';ctx.fillRect(rect.x,rect.y,rect.width,rect.height);ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.moveTo(rect.x,rect.y);ctx.lineTo(rect.x+rect.width,rect.y+rect.height);ctx.moveTo(rect.x+rect.width,rect.y);ctx.lineTo(rect.x,rect.y+rect.height);ctx.stroke();ctx.fillStyle='#ffffff';ctx.font='12px sans-serif';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(`IMAGE:${String(content.assetId??'missing')}`,rect.x+4,rect.y+4,Math.max(0,rect.width-8));}
    ctx.restore();
  }
}
