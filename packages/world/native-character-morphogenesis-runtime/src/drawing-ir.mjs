import {rootHash,seal} from './canonical.mjs';
import {compileCharacterDrawing,validateCharacterDrawing} from './character-drawing-compiler.mjs';

const FORMAT='rncs.anime-drawing-ir.v0.1';
const round=v=>Number(Number(v).toFixed(3));
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function catmullRomClosed(points,tension=.84){
  if(!Array.isArray(points)||points.length<3)return '';
  const p=points.map(([x,y])=>[Number(x),Number(y)]),n=p.length,parts=[`M ${round(p[0][0])} ${round(p[0][1])}`];
  for(let i=0;i<n;i++){
    const p0=p[(i-1+n)%n],p1=p[i],p2=p[(i+1)%n],p3=p[(i+2)%n],c1=[p1[0]+(p2[0]-p0[0])*tension/6,p1[1]+(p2[1]-p0[1])*tension/6],c2=[p2[0]-(p3[0]-p1[0])*tension/6,p2[1]-(p3[1]-p1[1])*tension/6];
    parts.push(`C ${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p2[0])} ${round(p2[1])}`);
  }
  parts.push('Z');return parts.join(' ');
}

function polylinePath(points,{closed=false,tension=.72}={}){
  if(closed)return catmullRomClosed(points,tension);
  if(!Array.isArray(points)||points.length<2)return '';
  return `M ${round(points[0][0])} ${round(points[0][1])} `+points.slice(1).map(p=>`L ${round(p[0])} ${round(p[1])}`).join(' ');
}

const path=(id,points,{fill='none',stroke='#14202b',stroke_width=2,closed=true,tension=.78,z=0,role=id}={})=>({kind:'path',id,role,z,d:polylinePath(points,{closed,tension}),fill,stroke,stroke_width,line_join:'round',line_cap:'round'});
const line=(id,a,b,{stroke='#14202b',stroke_width=2,z=0,role=id}={})=>({kind:'line',id,role,z,a,b,stroke,stroke_width,line_cap:'round'});
const ellipse=(id,center,rx,ry,{fill='none',stroke='#14202b',stroke_width=1,z=0,role=id}={})=>({kind:'ellipse',id,role,z,cx:center[0],cy:center[1],rx,ry,fill,stroke,stroke_width});

export function compileAnimeDrawingIR(frame,{palette={}}={}){
  const drawing=compileCharacterDrawing(frame),validation=validateCharacterDrawing(drawing);if(!validation.valid)throw Object.assign(new Error(`DRAWING_IR_SOURCE_REJECTED:${validation.errors.join(',')}`),{code:'DRAWING_IR_SOURCE_REJECTED',validation});
  const p={skin:'#e7c9b8',skin_shadow:'#bb8e82',hair:'#111923',hair_light:'#6e879b',ink:'#14202b',coat:'#1d3553',coat_dark:'#12223a',trim:'#c6d7de',eye:'#4f86c6',eye_white:'#f4fbff',mouth:'#8f4e5a',...palette},ops=[];
  const far=drawing.limbs.filter(x=>x.depth_order==='far'),near=drawing.limbs.filter(x=>x.depth_order!=='far');
  const emitLimb=(limb,z)=>{ops.push(path(`sleeve-${limb.side}`,limb.full_contour,{fill:p.coat,stroke:p.ink,stroke_width:2.1,tension:.90,z,role:'continuous-sleeve'}));ops.push(path(`hand-${limb.side}`,limb.hand.contour,{fill:p.skin,stroke:p.ink,stroke_width:1.8,tension:.62,z:z+.2,role:'hand-silhouette'}));};
  far.forEach((limb,i)=>emitLimb(limb,10+i));
  ops.push(path('garment-body',drawing.garment.body_contour,{fill:p.coat,stroke:p.ink,stroke_width:2.4,tension:.86,z:20,role:'garment-body-silhouette'}));
  ops.push(path('neck',drawing.neck.contour,{fill:p.skin,stroke:p.ink,stroke_width:1.8,tension:.48,z:22,role:'neck'}));
  ops.push(path('head',drawing.head.contour,{fill:p.skin,stroke:p.ink,stroke_width:2.2,tension:.92,z:24,role:'head-construction'}));
  near.forEach((limb,i)=>emitLimb(limb,26+i));
  if(drawing.garment?.collar){ops.push(path('collar-left',drawing.garment.collar.left,{fill:p.coat_dark,stroke:p.trim,stroke_width:1.6,tension:.42,z:31,role:'collar'}));ops.push(path('collar-right',drawing.garment.collar.right,{fill:p.coat_dark,stroke:p.trim,stroke_width:1.6,tension:.42,z:31,role:'collar'}));}
  if(drawing.garment?.center_seam)ops.push(line('center-seam',drawing.garment.center_seam.a,drawing.garment.center_seam.b,{stroke:p.trim,stroke_width:1.7,z:32,role:'garment-structure-line'}));
  ops.push(path('hair-crown',drawing.hair.crown,{fill:p.hair,stroke:p.ink,stroke_width:2,z:35,tension:.88,role:'hair-main-mass'}));
  ops.push(path('hair-fringe',drawing.hair.fringe,{fill:p.hair,stroke:p.ink,stroke_width:1.7,z:36,tension:.62,role:'hair-fringe'}));
  if(drawing.hair.side_far)ops.push(path('hair-side-far',drawing.hair.side_far,{fill:p.hair,stroke:p.ink,stroke_width:1.7,z:34,tension:.76,role:'hair-side-mass'}));
  if(drawing.hair.side_near)ops.push(path('hair-side-near',drawing.hair.side_near,{fill:p.hair,stroke:p.ink,stroke_width:1.7,z:37,tension:.76,role:'hair-side-mass'}));
  if(drawing.hair.highlight?.length>=2)ops.push(line('hair-highlight',drawing.hair.highlight[0],drawing.hair.highlight[1],{stroke:p.hair_light,stroke_width:2.2,z:38,role:'hair-highlight'}));
  const h=drawing.head,eyeRx=Math.max(2.4,h.width*.072),eyeRy=Math.max(1.5,h.height*.036);for(const eye of drawing.face.eyes){ops.push(ellipse(`eye-white-${eye.side}`,eye.center,eyeRx*eye.scale,eyeRy,{fill:p.eye_white,stroke:p.ink,stroke_width:1.15,z:41,role:'eye'}));const look=Number(drawing.face.look??0),px=eye.center[0]+look*eyeRx*.22;ops.push(ellipse(`eye-pupil-${eye.side}`,[px,eye.center[1]],Math.max(1.1,eyeRx*.27),Math.max(1.1,eyeRy*.66),{fill:p.eye,stroke:'none',stroke_width:0,z:42,role:'pupil'}));}
  for(const brow of drawing.face.brows)ops.push(line(`brow-${brow.side}`,brow.a,brow.b,{stroke:p.ink,stroke_width:1.8,z:43,role:'brow'}));
  ops.push(line('nose-bridge',drawing.face.nose.bridge,drawing.face.nose.tip,{stroke:p.skin_shadow,stroke_width:1.2,z:43,role:'nose'}));
  const m=drawing.face.mouth;if(m.open)ops.push(ellipse('mouth-open',m.center,m.width*.42,Math.max(1.6,h.height*.026),{fill:p.mouth,stroke:p.ink,stroke_width:1,z:43,role:'mouth'}));else ops.push(path('mouth-line',[[m.center[0]-m.width*.5,m.center[1]],[m.center[0],m.center[1]+1],[m.center[0]+m.width*.5,m.center[1]]],{closed:false,fill:'none',stroke:p.ink,stroke_width:1.4,tension:0,z:43,role:'mouth'}));
  const data={format:FORMAT,version:'0.1.0-alpha.1',drawing_root:drawing.drawing_root,drawing_certificate_root:drawing.drawing_certificate_root,native_surface_root:frame.native_surface_root,width:frame.visibility.width,height:frame.visibility.height,view:drawing.view,lower_body_status:drawing.lower_body_status,backend_contract:{path_geometry:'cubic-bezier-capable',rasterizer_authority:false,identity_authority:false,geometry_authority:false},palette:p,operations:ops.sort((a,b)=>a.z-b.z),drawing_ir_root:''};return seal(data,'drawing_ir_root');
}

export function validateAnimeDrawingIR(ir){const errors=[];if(ir?.format!==FORMAT)errors.push('DRAWING_IR_FORMAT_INVALID');if(!ir?.drawing_root)errors.push('DRAWING_IR_SOURCE_ROOT_MISSING');if(!ir?.operations?.length)errors.push('DRAWING_IR_EMPTY');if(!(ir?.operations??[]).some(op=>op.kind==='path'&&String(op.d).includes('C ')))errors.push('DRAWING_IR_BEZIER_PATH_MISSING');for(const op of ir?.operations??[]){if(op.kind==='path'&&!op.d)errors.push(`DRAWING_IR_PATH_EMPTY:${op.id}`);if(['path','line','ellipse'].includes(op.kind)&&!Number.isFinite(Number(op.z)))errors.push(`DRAWING_IR_Z_INVALID:${op.id}`);}return{valid:errors.length===0,errors,drawing_ir_root:ir?.drawing_ir_root??null};}

export function drawingIrToSvg(ir,{background=true}={}){const validation=validateAnimeDrawingIR(ir);if(!validation.valid)throw Object.assign(new Error(`DRAWING_IR_INVALID:${validation.errors.join(',')}`),{code:'DRAWING_IR_INVALID',validation});const w=ir.width,h=ir.height,defs='<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dbe7eb"/><stop offset="100%" stop-color="#8e9da8"/></linearGradient></defs>',env=background?`<rect width="${w}" height="${h}" fill="url(#sky)"/><g fill="#687984" opacity=".92">${Array.from({length:12},(_,i)=>{const bw=w*.055,bh=h*(.14+(i%5)*.035),x=((i*.086*w)%w)-bw*.15,y=h*.53-bh;return `<rect x="${round(x)}" y="${round(y)}" width="${round(bw)}" height="${round(bh)}" rx="1"/>`;}).join('')}</g><path d="M 0 ${round(h*.67)} C ${round(w*.13)} ${round(h*.58)}, ${round(w*.22)} ${round(h*.72)}, ${round(w*.34)} ${round(h*.62)} C ${round(w*.48)} ${round(h*.72)}, ${round(w*.61)} ${round(h*.60)}, ${round(w*.74)} ${round(h*.68)} C ${round(w*.86)} ${round(h*.74)}, ${round(w*.93)} ${round(h*.64)}, ${w} ${round(h*.65)} L ${w} ${h} L 0 ${h} Z" fill="#455764"/><ellipse cx="${round(w*.5)}" cy="${round(h*.88)}" rx="${round(w*.08)}" ry="${round(h*.018)}" fill="#18232e" opacity=".58"/>`:'';
  const body=ir.operations.map(op=>{if(op.kind==='path')return `<path id="${esc(op.id)}" d="${esc(op.d)}" fill="${esc(op.fill)}" stroke="${esc(op.stroke)}" stroke-width="${op.stroke_width}" stroke-linejoin="${op.line_join??'round'}" stroke-linecap="${op.line_cap??'round'}"/>`;if(op.kind==='line')return `<line id="${esc(op.id)}" x1="${round(op.a[0])}" y1="${round(op.a[1])}" x2="${round(op.b[0])}" y2="${round(op.b[1])}" stroke="${esc(op.stroke)}" stroke-width="${op.stroke_width}" stroke-linecap="${op.line_cap??'round'}"/>`;if(op.kind==='ellipse')return `<ellipse id="${esc(op.id)}" cx="${round(op.cx)}" cy="${round(op.cy)}" rx="${round(op.rx)}" ry="${round(op.ry)}" fill="${esc(op.fill)}" stroke="${esc(op.stroke)}" stroke-width="${op.stroke_width}"/>`;return '';}).join('');return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">${defs}${env}<g id="character" style="vector-effect:non-scaling-stroke">${body}</g></svg>`;}
