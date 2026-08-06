import {rootHash} from './canonical.mjs';
import {Canvas,color} from './raster.mjs';

const layerOrder=['background','body-surface','skin-limb','joint-surface','hand-surface','garment-surface','hair','face-outline','face-feature'];
const fallbackPalette={skin:'#e7c9b8',skin_shadow:'#bb8e82',hair:'#111923',hair_light:'#6e879b',ink:'#14202b',coat:'#1d3553',coat_dark:'#12223a',trim:'#c6d7de',eye:'#4f86c6',mouth_inner:'#9b5963',sky_top:'#dbe7eb',sky_bottom:'#8e9da8',building:'#687984',platform:'#455764',platform_line:'#98aab1',shadow:'#18232e'};

function paletteFor(style={}){return{...fallbackPalette,...(style.palette??{})};}
function rgba(value,alpha=255){return Array.isArray(value)?value:color(value??'#000000',alpha);}

function drawEnvironment(canvas,style,progress=0){
  const palette=paletteFor(style);canvas.gradient(rgba(palette.sky_top),rgba(palette.sky_bottom));
  for(let index=0;index<12;index+=1){const x=(index*119-progress*70)%1450-100,height=70+(index%5)*25;canvas.rect(x,330-height,78,height,rgba(palette.building));for(let window=0;window<3;window+=1)canvas.rect(x+12+window*20,350-height,8,12,rgba('#bfd0d4',190));}
  canvas.polygon([[0,430],[140,385],[295,420],[450,372],[620,420],[770,382],[960,420],[1280,390],[1280,720],[0,720]],rgba(palette.platform));canvas.line(0,460,1280,445,rgba(palette.platform_line),2);canvas.line(0,550,1280,548,rgba('#768991',120),1);canvas.line(0,640,1280,650,rgba('#768991',100),1);
  const foregroundX=-120+progress*110;canvas.polygon([[foregroundX,120],[foregroundX+78,95],[foregroundX+170,720],[foregroundX-30,720]],rgba(palette.ink,215));canvas.line(foregroundX+55,118,foregroundX+130,700,rgba('#b2c0c4',95),3);canvas.ellipse(640,642,112,18,rgba(palette.shadow,150));
}

function drawPrimitive(canvas,primitive){
  if(primitive.visible===false)return;
  const fill=primitive.fill?rgba(primitive.fill):null,stroke=primitive.stroke?rgba(primitive.stroke):null,width=Number(primitive.line_width??3),points=primitive.points??[];
  if(primitive.kind==='polygon'){if(fill)canvas.polygon(points,fill);if(stroke)for(let index=0;index<points.length;index+=1){const a=points[index],b=points[(index+1)%points.length];canvas.line(a[0],a[1],b[0],b[1],stroke,width);}return;}
  if(primitive.kind==='line'){for(let index=0;index<points.length-1;index+=1)canvas.line(points[index][0],points[index][1],points[index+1][0],points[index+1][1],stroke??fill??rgba('#000000'),width);return;}
  if(primitive.kind==='ellipse'){const [cx,cy]=primitive.center,[rx,ry]=primitive.radii;if(stroke)canvas.ellipse(cx,cy,rx+width*.5,ry+width*.5,stroke);if(fill)canvas.ellipse(cx,cy,rx,ry,fill);}
}

export function renderFrame(projectedFrameGeometry,renderStyle={}){
  const width=Number(projectedFrameGeometry?.camera?.width??renderStyle.width??1280),height=Number(projectedFrameGeometry?.camera?.height??renderStyle.height??720),canvas=new Canvas(width,height),style=renderStyle?.palette?renderStyle:(projectedFrameGeometry?.style??renderStyle),progress=Number(projectedFrameGeometry?.performance?.progress??0);
  drawEnvironment(canvas,style,progress);
  const primitives=[...(projectedFrameGeometry?.primitives??[])].filter(item=>item.visible!==false).sort((a,b)=>(layerOrder.indexOf(a.layer)-layerOrder.indexOf(b.layer))||String(a.id).localeCompare(String(b.id)));
  for(const primitive of primitives)drawPrimitive(canvas,primitive);
  const png=canvas.png();return{format:'rncs.raster-frame.v0.1',width,height,source_projection_root:projectedFrameGeometry?.projection_root??null,styled_root:projectedFrameGeometry?.styled_root??null,png,frame_root:rootHash({projection_root:projectedFrameGeometry?.projection_root??null,styled_root:projectedFrameGeometry?.styled_root??null,bytes:png.toString('base64')}),diagnostics:{renderer_role:'rasterize-projected-frame-geometry-only',anatomy_authority:false,style_after_projection:true,primitive_count:primitives.length}};
}

export {renderAnatomyFrame} from './legacy-primitive-renderer.mjs';
