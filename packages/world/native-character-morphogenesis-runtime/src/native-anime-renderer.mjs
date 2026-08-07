import {rootHash,transformPoint} from './canonical.mjs';
import {projectPoint3} from './projection.mjs';
import {Canvas,color} from './raster.mjs';
import {validateNativeSurfaceFrame} from './native-surface-runtime.mjs';
import {createAnimeVisualGrammar,validateAnimeVisualGrammar} from './anime-visual-grammar.mjs';

const FALLBACK_STYLE={palette:{skin:'#e7c9b8',skin_shadow:'#bb8e82',hair:'#111923',hair_light:'#6e879b',ink:'#14202b',coat:'#1d3553',coat_dark:'#12223a',trim:'#c6d7de',eye:'#4f86c6',mouth_inner:'#9b5963',sky_top:'#dbe7eb',sky_bottom:'#8e9da8',building:'#687984',platform:'#455764',platform_line:'#98aab1',shadow:'#18232e'}};
const rgba=value=>Array.isArray(value)?value:color(value??'#000000');
const paletteFor=style=>({...FALLBACK_STYLE.palette,...(style?.palette??{})});
const regionColor=(region,palette)=>{
  const value=String(region??'unassigned');
  if(value.includes('skull')||value.includes('neck'))return palette.skin;
  if(value.includes('palm'))return palette.skin;
  if(value.includes('ribcage')||value.includes('pelvis')||value.includes('spine')||value.includes('deltoid')||value.includes('upper-arm')||value.includes('elbow')||value.includes('forearm'))return palette.coat;
  return palette.coat_dark;
};
const indexAt=(x,y,width)=>y*width+x;

function drawEnvironment(canvas,palette,progress=0){
  const sx=canvas.width/1280,sy=canvas.height/720;canvas.gradient(rgba(palette.sky_top),rgba(palette.sky_bottom));
  for(let index=0;index<12;index+=1){const x=((index*119-progress*70)%1450-100)*sx,height=(70+(index%5)*25)*sy;canvas.rect(x,330*sy-height,78*sx,height,rgba('#687984'));for(let window=0;window<3;window+=1)canvas.rect(x+(12+window*20)*sx,(350*sy-height),8*sx,12*sy,rgba('#bfd0d4',190));}
  canvas.polygon([[0,430*sy],[140*sx,385*sy],[295*sx,420*sy],[450*sx,372*sy],[620*sx,420*sy],[770*sx,382*sy],[960*sx,420*sy],[canvas.width,390*sy],[canvas.width,canvas.height],[0,canvas.height]],rgba(palette.platform));
  canvas.line(0,460*sy,canvas.width,445*sy,rgba(palette.platform_line),Math.max(1,2*sx));canvas.line(0,550*sy,canvas.width,548*sy,rgba('#768991',120),Math.max(1,sx));canvas.ellipse(canvas.width*.5,canvas.height*.892,112*sx,18*sy,rgba(palette.shadow,150));
}

function shade(base,normal,depth,palette,grammar){
  const direction=grammar.lighting.key_direction??[-.35,.55,.74],dot=Math.max(0,normal[0]*direction[0]+normal[1]*direction[1]+normal[2]*direction[2]),light=Math.max(0,Math.min(1,Number(grammar.lighting.ambient??.58)+dot*Number(grammar.lighting.contrast??.42))),depthCue=Math.max(.78,Math.min(1.08,1+Number(depth??0)*.22)),value=String(base).replace('#',''),rgb=[parseInt(value.slice(0,2),16),parseInt(value.slice(2,4),16),parseInt(value.slice(4,6),16)];
  return[rgb[0]*light*depthCue,rgb[1]*light*depthCue,rgb[2]*light*depthCue,255].map((value,index)=>index<3?Math.max(0,Math.min(255,Math.round(value))):value);
}

function drawVisibleSurface(canvas,frame,style,grammar){
  const visibility=frame.visibility,palette=paletteFor(style),width=visibility.width,height=visibility.height,visible=visibility.VisibilityBuffer,regions=visibility.RegionIdBuffer,depth=visibility.DepthBuffer,normals=visibility.NormalBuffer;
  for(let y=0;y<height;y+=1)for(let x=0;x<width;x+=1){const pixel=indexAt(x,y,width);if(!visible[pixel])continue;const normal=[normals[pixel*3],normals[pixel*3+1],normals[pixel*3+2]],base=regionColor(regions[pixel],palette);canvas.pixel(x,y,shade(base,normal,depth[pixel],palette,grammar));}
  const exteriorInvisible=new Uint8Array(width*height),queue=[];for(let x=0;x<width;x+=1)for(const y of [0,height-1]){const pixel=indexAt(x,y,width);if(!visible[pixel]&&!exteriorInvisible[pixel]){exteriorInvisible[pixel]=1;queue.push(pixel);}}for(let y=1;y<height-1;y+=1)for(const x of [0,width-1]){const pixel=indexAt(x,y,width);if(!visible[pixel]&&!exteriorInvisible[pixel]){exteriorInvisible[pixel]=1;queue.push(pixel);}}for(let cursor=0;cursor<queue.length;cursor+=1){const current=queue[cursor],cx=current%width,cy=Math.floor(current/width);for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const next=indexAt(nx,ny,width);if(!visible[next]&&!exteriorInvisible[next]){exteriorInvisible[next]=1;queue.push(next);}}}
  const ink=rgba(palette.ink),outlineWidth=Math.max(1,Math.round(Number(grammar.outline_policy.width_px??2)));
  for(let y=0;y<height;y+=1)for(let x=0;x<width;x+=1){const pixel=indexAt(x,y,width);if(!visible[pixel])continue;let edge=false;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height){edge=true;continue;}const neighbor=indexAt(nx,ny,width);if(!visible[neighbor]&&exteriorInvisible[neighbor]){edge=true;break;}}if(edge)for(let oy=-Math.floor(outlineWidth/2);oy<=Math.ceil(outlineWidth/2);oy+=1)for(let ox=-Math.floor(outlineWidth/2);ox<=Math.ceil(outlineWidth/2);ox+=1)canvas.pixel(x+ox,y+oy,ink);}
}

function projectLocal(local,bone,camera){return projectPoint3(transformPoint(bone?.world_transform??{position:[0,0,0],rotation:{}},local),camera);}
function attachmentMap(frame){const skull=frame.posed_skeleton?.bones?.find(bone=>bone.id==='skull'),features=frame.asset?.surface_attachments?.face??[];return{skull,features:Object.fromEntries(features.map(item=>[item.attachment_id.replace('face:',''),item]))};}

function convexHull(points){const unique=[...new Map(points.map(point=>[`${point[0].toFixed(3)}:${point[1].toFixed(3)}`,point])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(unique.length<4)return unique;const cross=(origin,a,b)=>(a[0]-origin[0])*(b[1]-origin[1])-(a[1]-origin[1])*(b[0]-origin[0]);const lower=[];for(const point of unique){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],point)<=0)lower.pop();lower.push(point);}const upper=[];for(const point of [...unique].reverse()){while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],point)<=0)upper.pop();upper.push(point);}return lower.slice(0,-1).concat(upper.slice(0,-1));}

function drawHair(canvas,frame,style){
  const asset=frame.asset,palette=paletteFor(style),skull=frame.posed_skeleton?.bones?.find(bone=>bone.id==='skull'),camera=frame.visibility.camera,scale=Math.max(.75,Math.min(2.5,canvas.width/320));if(!skull)return 0;let curves=0;
  const depthVisible=point=>{const x=Math.round(point[0]),y=Math.round(point[1]);if(x<0||y<0||x>=frame.visibility.width||y>=frame.visibility.height)return false;const pixel=indexAt(x,y,frame.visibility.width);return Boolean(frame.visibility.VisibilityBuffer[pixel])&&point[2]>=frame.visibility.DepthBuffer[pixel]-.035;};
  for(const mass of asset?.surface_attachments?.hair_guides??[]){const projectedCurves=(mass.guide_curves??[]).map(guide=>guide.points.map(point=>projectLocal(point,skull,camera))),allPoints=projectedCurves.flat();if(mass.mass_id==='crown'&&allPoints.length>=4){const hull=convexHull(allPoints);if(hull.length>=3){canvas.outline(hull,rgba(palette.hair),rgba(palette.ink),Math.max(2,Math.round(3*scale)));curves+=projectedCurves.length;continue;}}
    for(const points of projectedCurves)for(let index=0;index<points.length-1;index+=1){const midpoint=[(points[index][0]+points[index+1][0])*.5,(points[index][1]+points[index+1][1])*.5,(points[index][2]+points[index+1][2])*.5];if(index===0||depthVisible(points[index])||depthVisible(midpoint))canvas.line(points[index][0],points[index][1],points[index+1][0],points[index+1][1],rgba(palette.hair),Math.max(3,Math.round(12*scale)));}curves+=projectedCurves.length;}
  return curves;
}

function drawFace(canvas,frame,style){
  const palette=paletteFor(style),camera=frame.visibility.camera,{skull,features}=attachmentMap(frame);if(!skull)return 0;const visibleFeatures=new Map((frame.visibility.report?.feature_samples??[]).map(item=>[item.attachment_id.replace('face:',''),item.visible])),p=id=>features[id]&&visibleFeatures.get(id)!==false?projectLocal(features[id].local_position,skull,camera):null,ink=rgba(palette.ink),featureScale=Math.max(.7,Math.min(2.2,canvas.width/320));
  const leftEye=p('left_eye'),rightEye=p('right_eye'),leftBrow=p('left_brow'),rightBrow=p('right_brow');if(leftBrow)canvas.line(leftBrow[0]-12*featureScale,leftBrow[1]-3*featureScale,leftBrow[0]+12*featureScale,leftBrow[1]-5*featureScale,rgba(palette.hair_light),Math.max(2,Math.round(3*featureScale)));if(rightBrow)canvas.line(rightBrow[0]-12*featureScale,rightBrow[1]-5*featureScale,rightBrow[0]+12*featureScale,rightBrow[1]-3*featureScale,rgba(palette.hair_light),Math.max(2,Math.round(3*featureScale)));
  for(const eye of [leftEye,rightEye])if(eye){canvas.ellipse(eye[0],eye[1],16*featureScale,7*featureScale,ink);canvas.ellipse(eye[0],eye[1],5*featureScale,6*featureScale,rgba(palette.eye));}
  const nose=p('nose_bridge'),tip=p('nose_tip');if(nose&&tip)canvas.line(nose[0],nose[1],tip[0],tip[1],rgba(palette.skin_shadow),Math.max(2,Math.round(2*featureScale)));
  const mouthLeft=p('mouth_left'),mouthCenter=p('mouth_center'),mouthRight=p('mouth_right'),mouthOpen=frame.performance?.face?.mouth==='open'||frame.performance?.mouth==='open'||frame.performance?.mouth==='o';if(mouthLeft&&mouthCenter&&mouthRight){if(mouthOpen){canvas.ellipse(mouthCenter[0],mouthCenter[1],22*featureScale,10*featureScale,ink);canvas.ellipse(mouthCenter[0],mouthCenter[1]-2*featureScale,14*featureScale,4*featureScale,rgba(palette.mouth_inner));}else{canvas.line(mouthLeft[0],mouthLeft[1],mouthCenter[0],mouthCenter[1]-1*featureScale,ink,Math.max(2,Math.round(2*featureScale)));canvas.line(mouthCenter[0],mouthCenter[1]-1*featureScale,mouthRight[0],mouthRight[1],ink,Math.max(2,Math.round(2*featureScale)));}}
  return [leftEye,rightEye,leftBrow,rightBrow,nose,tip,mouthLeft,mouthCenter,mouthRight].filter(Boolean).length;
}

export function renderNativeAnimeFrame(frame,{style={},grammar:grammarInput={}}={}){
  const frameValidation=validateNativeSurfaceFrame(frame),grammar=createAnimeVisualGrammar(grammarInput),grammarValidation=validateAnimeVisualGrammar(grammar);if(!frameValidation.valid)throw Object.assign(new Error(`NATIVE_RENDER_GEOMETRY_GATE_REJECTED:${frameValidation.errors.join(',')}`),{code:'NATIVE_RENDER_GEOMETRY_GATE_REJECTED',validation:frameValidation});if(!grammarValidation.valid)throw Object.assign(new Error(`ANIME_GRAMMAR_REJECTED:${grammarValidation.errors.join(',')}`),{code:'ANIME_GRAMMAR_REJECTED',validation:grammarValidation});
  const width=frame.visibility.width,height=frame.visibility.height,canvas=new Canvas(width,height),palette=paletteFor(style);drawEnvironment(canvas,palette,frame.performance?.progress??0);drawVisibleSurface(canvas,frame,style,grammar);const hairGuideCount=drawHair(canvas,frame,style),faceFeatureCount=drawFace(canvas,frame,style),png=canvas.png(),base={format:'rncs.native-anime-frame.v0.2',version:'0.2.0-alpha.1',width,height,native_surface_root:frame.native_surface_root,visibility_root:frame.visibility.visibility_root,grammar_root:grammar.grammar_root,style_root:rootHash(style),png,diagnostics:{renderer_role:'native-surface-visibility-rasterizer',anatomy_authority:false,geometry_authority:'canonical-surface-mesh',visibility_authority:'native-visibility-buffer',style_after_visibility:true,feature_binding:'SurfaceAttachment',hair_binding:'HairRoot-to-GuideCurve-to-MassEnvelope',hair_guide_count:hairGuideCount,face_feature_count:faceFeatureCount},render_root:''},renderRoot=rootHash({format:base.format,version:base.version,width,height,native_surface_root:base.native_surface_root,visibility_root:base.visibility_root,grammar_root:base.grammar_root,style_root:base.style_root,png_sha256:rootHash(png.toString('base64')),diagnostics:base.diagnostics,render_root:''});
  return{...base,render_root:renderRoot,grammar,style};
}

export function validateNativeAnimeFrame(rendered){const errors=[];if(rendered?.format!=='rncs.native-anime-frame.v0.2')errors.push('NATIVE_ANIME_FRAME_FORMAT_INVALID');if(!Buffer.isBuffer(rendered?.png)||rendered.png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')errors.push('NATIVE_ANIME_FRAME_PNG_INVALID');if(rendered?.diagnostics?.anatomy_authority!==false)errors.push('NATIVE_ANIME_RENDERER_AUTHORITY_INVALID');return{valid:errors.length===0,errors,render_root:rendered?.render_root??null};}
