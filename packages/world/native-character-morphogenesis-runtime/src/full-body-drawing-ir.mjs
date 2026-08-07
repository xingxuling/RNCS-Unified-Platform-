import {seal} from './canonical.mjs';
import {compileAnimeDrawingIR,validateAnimeDrawingIR,drawingIrToSvg} from './drawing-ir.mjs';
import {compileFullBodyCharacterDrawing,validateFullBodyCharacterDrawing} from './full-body-drawing.mjs';
import {buildMeshSilhouetteDrawingGuide,validateMeshSilhouetteDrawingGuide} from './mesh-silhouette-drawing.mjs';
import {applyHeadSurfaceDrawingGuide} from './head-surface-drawing.mjs';
import {applyFaceSurfaceDrawingGuide} from './face-surface-drawing.mjs';
import {applyHairSurfaceDrawingGuide} from './hair-surface-drawing.mjs';
import {applyGarmentSurfaceDrawingGuide} from './garment-surface-drawing.mjs';

const FORMAT='rncs.anime-drawing-ir.v0.1';
const round=value=>Number(Number(value).toFixed(3));

function smoothClosed(points,tension=.76){
  if(!Array.isArray(points)||points.length<3)return'';
  const n=points.length,out=[`M ${round(points[0][0])} ${round(points[0][1])}`];
  for(let i=0;i<n;i++){
    const p0=points[(i-1+n)%n],p1=points[i],p2=points[(i+1)%n],p3=points[(i+2)%n],
      c1=[p1[0]+(p2[0]-p0[0])*tension/6,p1[1]+(p2[1]-p0[1])*tension/6],
      c2=[p2[0]-(p3[0]-p1[0])*tension/6,p2[1]-(p3[1]-p1[1])*tension/6];
    out.push(`C ${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p2[0])} ${round(p2[1])}`);
  }
  out.push('Z');return out.join(' ');
}

const path=(id,points,{fill,stroke,stroke_width,z,role,tension=.76,meshGuideRoot=null,meshGroup=null,meshPartRoot=null}={})=>({
  kind:'path',id,role,z,d:smoothClosed(points,tension),fill,stroke,stroke_width,line_join:'round',line_cap:'round',
  ...(meshGuideRoot?{mesh_silhouette_guide_root:meshGuideRoot}:{}),
  ...(meshGroup?{mesh_silhouette_group:meshGroup}:{}),
  ...(meshPartRoot?{mesh_silhouette_part_root:meshPartRoot}:{})
});

function pathsFromGuide(baseId,guide,{fill,stroke,stroke_width,z,role,tension}={}){
  const parts=guide?.parts?.length?guide.parts:[{part_id:`${guide.group}:visible-1`,part_root:guide.guide_root,contour:guide.contour}],result=[];
  for(let index=0;index<parts.length;index++){
    const part=parts[index],id=index===0?baseId:`${baseId}-visible-${index+1}`;
    result.push(path(id,part.contour,{fill,stroke,stroke_width,z:Number(z)+index*.001,role,tension,meshGuideRoot:guide.guide_root,meshGroup:guide.group,meshPartRoot:part.part_root??guide.guide_root}));
  }
  return result;
}

function guideForOperation(op,guides){
  if(op.id==='garment-body')return guides?.torso;
  if(op.id==='neck')return guides?.neck;
  if(op.id==='sleeve-left')return guides?.['arm-left'];
  if(op.id==='sleeve-right')return guides?.['arm-right'];
  if(op.id==='hand-left')return guides?.['hand-left'];
  if(op.id==='hand-right')return guides?.['hand-right'];
  return null;
}

function replaceMeshDrivenBodyOperations(operations,guides,palette){
  const out=[];
  for(const op of operations){
    const guide=guideForOperation(op,guides);
    if(!guide){out.push(op);continue;}
    const skin=op.id==='neck'||op.id.startsWith('hand-'),fill=op.fill??(skin?palette.skin:palette.coat),stroke=op.stroke??palette.ink,
      width=op.stroke_width??(op.id==='garment-body'?2.4:skin?1.8:2.1),
      tension=op.id==='garment-body'?.88:op.id==='neck'?.65:op.id.startsWith('hand-')?.62:.90;
    out.push(...pathsFromGuide(op.id,guide,{fill,stroke,stroke_width:width,z:op.z,role:op.role,tension}));
  }
  return out;
}

export function compileFullBodyAnimeDrawingIR(frame,{palette={},useMeshSilhouette=null,meshSilhouetteOptions={},useHeadSurface=null,useFaceSurface=null,useHairSurface=null,useGarmentSurface=null}={}){
  const initialBase=compileAnimeDrawingIR(frame,{palette}),candidateSurface=Boolean(frame?.surface_weighting_root),
    headSurfaceEnabled=useHeadSurface??candidateSurface,
    faceSurfaceEnabled=useFaceSurface??candidateSurface,
    hairSurfaceEnabled=useHairSurface??candidateSurface,
    headBound=headSurfaceEnabled?applyHeadSurfaceDrawingGuide(initialBase,frame,{requireValid:true}):initialBase,
    faceBound=faceSurfaceEnabled?applyFaceSurfaceDrawingGuide(headBound,frame,{requireValid:true}):headBound,
    base=hairSurfaceEnabled?applyHairSurfaceDrawingGuide(faceBound,frame,{requireValid:true}):faceBound,
    drawing=compileFullBodyCharacterDrawing(frame),drawingValidation=validateFullBodyCharacterDrawing(drawing);
  if(!drawingValidation.valid)throw Object.assign(new Error(`FULL_BODY_DRAWING_IR_SOURCE_REJECTED:${drawingValidation.errors.join(',')}`),{code:'FULL_BODY_DRAWING_IR_SOURCE_REJECTED',drawingValidation});

  const meshSilhouetteEnabled=useMeshSilhouette??candidateSurface;
  let silhouette=null,operations=[...base.operations];
  if(meshSilhouetteEnabled){
    silhouette=buildMeshSilhouetteDrawingGuide(frame,meshSilhouetteOptions);
    const validation=validateMeshSilhouetteDrawingGuide(silhouette,{requireFullBody:true});
    if(!validation.valid)throw Object.assign(new Error(`FULL_BODY_MESH_SILHOUETTE_REJECTED:${validation.errors.join(',')}`),{code:'FULL_BODY_MESH_SILHOUETTE_REJECTED',validation,silhouette});
    operations=replaceMeshDrivenBodyOperations(operations,silhouette.guides,base.palette);
  }

  const p=base.palette,extra=[];
  for(const leg of drawing.lower_body.legs){
    const z=leg.depth_order==='far'?7:18,legGuide=silhouette?.guides?.[`leg-${leg.side}`],footGuide=silhouette?.guides?.[`foot-${leg.side}`];
    if(legGuide)extra.push(...pathsFromGuide(`leg-${leg.side}`,legGuide,{fill:p.coat,stroke:p.ink,stroke_width:2.1,z,role:'continuous-leg-garment',tension:.88}));
    else extra.push(path(`leg-${leg.side}`,leg.full_contour,{fill:p.coat,stroke:p.ink,stroke_width:2.1,z,role:'continuous-leg-garment',tension:.88}));
    if(footGuide)extra.push(...pathsFromGuide(`foot-${leg.side}`,footGuide,{fill:p.coat_dark,stroke:p.ink,stroke_width:1.8,z:z+.3,role:'foot-silhouette',tension:.6}));
    else extra.push(path(`foot-${leg.side}`,leg.foot.contour,{fill:p.coat_dark,stroke:p.ink,stroke_width:1.8,z:z+.3,role:'foot-silhouette',tension:.6}));
  }

  const garmentSurfaceEnabled=useGarmentSurface??candidateSurface;
  if(garmentSurfaceEnabled&&!silhouette)throw Object.assign(new Error('GARMENT_SURFACE_REQUIRES_MESH_SILHOUETTE'),{code:'GARMENT_SURFACE_REQUIRES_MESH_SILHOUETTE'});

  const data={...base,format:FORMAT,version:'0.9.0-alpha.1',drawing_root:drawing.drawing_root,upper_body_drawing_certificate_root:drawing.drawing_certificate_root,full_body_drawing_certificate_root:drawing.full_body_drawing_certificate_root,lower_body_status:drawing.lower_body_status,mesh_silhouette_guide_root:silhouette?.guide_set_root??null,mesh_silhouette_policy:meshSilhouetteEnabled?'weighted-posed-mesh-visible-surface-multipart':'disabled-compatible',head_surface_policy:headSurfaceEnabled?'weighted-skull-visible-surface-art-jaw':'disabled-compatible',face_surface_policy:faceSurfaceEnabled?'surface-attachment-depth-visibility':'disabled-compatible',hair_surface_policy:hairSurfaceEnabled?'scalp-attachment-guide-curve-root-preserving':'disabled-compatible',garment_surface_policy:garmentSurfaceEnabled?'weighted-body-silhouette-semantic-garment-ease':'disabled-compatible',operations:[...operations,...extra].sort((a,b)=>a.z-b.z),drawing_ir_root:''};

  if(garmentSurfaceEnabled)return applyGarmentSurfaceDrawingGuide(data,frame,silhouette,{requireValid:true});
  return seal(data,'drawing_ir_root');
}

export function validateFullBodyAnimeDrawingIR(ir,{requireMeshSilhouette=false,requireHeadSurface=false,requireFaceSurface=false,requireHairSurface=false,requireGarmentSurface=false}={}){
  const base=validateAnimeDrawingIR(ir),errors=[...base.errors],
    legOps=(ir?.operations??[]).filter(op=>op.role==='continuous-leg-garment'),
    footOps=(ir?.operations??[]).filter(op=>op.role==='foot-silhouette'),
    sleeveOps=(ir?.operations??[]).filter(op=>op.role==='continuous-sleeve'),
    garmentOps=(ir?.operations??[]).filter(op=>op.role==='garment-body-silhouette'),
    neckOps=(ir?.operations??[]).filter(op=>op.role==='neck'),
    handOps=(ir?.operations??[]).filter(op=>op.role==='hand-silhouette');

  if(ir?.lower_body_status!=='represented-in-canonical-morphology-v0.2-candidate')errors.push('FULL_BODY_DRAWING_IR_STATUS_INVALID');
  if(legOps.length<2)errors.push('FULL_BODY_DRAWING_IR_LEG_COUNT_INVALID');
  if(footOps.length<2)errors.push('FULL_BODY_DRAWING_IR_FOOT_COUNT_INVALID');
  if(!ir?.full_body_drawing_certificate_root)errors.push('FULL_BODY_DRAWING_IR_CERTIFICATE_ROOT_MISSING');

  if(requireMeshSilhouette){
    if(!ir?.mesh_silhouette_guide_root)errors.push('FULL_BODY_DRAWING_IR_MESH_SILHOUETTE_ROOT_MISSING');
    const meshOps=[...garmentOps,...neckOps,...sleeveOps,...handOps,...legOps,...footOps],groups=new Set(meshOps.map(op=>op.mesh_silhouette_group).filter(Boolean)),requiredGroups=['torso','neck','arm-left','arm-right','hand-left','hand-right','leg-left','leg-right','foot-left','foot-right'];
    for(const group of requiredGroups)if(!groups.has(group))errors.push(`FULL_BODY_DRAWING_IR_MESH_GROUP_MISSING:${group}`);
    for(const op of meshOps)if(!op.mesh_silhouette_guide_root||!op.mesh_silhouette_group||!op.mesh_silhouette_part_root)errors.push(`FULL_BODY_DRAWING_IR_MESH_GUIDE_BINDING_MISSING:${op.id}`);
  }

  if(requireHeadSurface){
    const head=ir.operations?.find(op=>op.id==='head');
    if(!ir?.head_surface_drawing_guide_root||!ir?.head_surface_visibility_root||!head?.head_surface_contour_root||!head?.head_surface_guide_root)errors.push('FULL_BODY_DRAWING_IR_HEAD_SURFACE_BINDING_INCOMPLETE');
  }

  if(requireFaceSurface){
    if(!ir?.face_surface_drawing_guide_root||!ir?.face_surface_visibility_root)errors.push('FULL_BODY_DRAWING_IR_FACE_SURFACE_ROOT_MISSING');
    const faceOps=(ir?.operations??[]).filter(op=>['eye','pupil','brow','nose','mouth'].includes(op.role));
    if(!faceOps.length||faceOps.some(op=>!op.face_surface_entry_root))errors.push('FULL_BODY_DRAWING_IR_FACE_SURFACE_BINDING_INCOMPLETE');
  }

  if(requireHairSurface){
    if(!ir?.hair_surface_drawing_guide_root||!ir?.hair_surface_attachment_root)errors.push('FULL_BODY_DRAWING_IR_HAIR_SURFACE_ROOT_MISSING');
    const requiredHair=['hair-crown','hair-fringe','hair-side-near'],hairOps=(ir?.operations??[]).filter(op=>op.id.startsWith('hair-'));
    for(const id of requiredHair)if(!hairOps.some(op=>op.id===id&&op.hair_surface_contour_root))errors.push(`FULL_BODY_DRAWING_IR_HAIR_SURFACE_BINDING_MISSING:${id}`);
    if(hairOps.some(op=>['hair-crown','hair-fringe','hair-side-near','hair-side-far'].includes(op.id)&&!op.hair_surface_contour_root))errors.push('FULL_BODY_DRAWING_IR_HAIR_SURFACE_BINDING_INCOMPLETE');
  }

  if(requireGarmentSurface){
    if(!ir?.garment_surface_drawing_guide_root||!ir?.garment_surface_attachment_root)errors.push('FULL_BODY_DRAWING_IR_GARMENT_SURFACE_ROOT_MISSING');
    if(ir?.garment_large_form_authority!=='GarmentSurfaceDrawingGuide'||ir?.garment_secondary_motion_authority!=='DrawingMeshCage')errors.push('FULL_BODY_DRAWING_IR_GARMENT_AUTHORITY_INVALID');
    for(const op of [...garmentOps,...sleeveOps])if(!op.garment_surface_guide_root||!op.garment_surface_part_root||op.garment_secondary_motion_authority!=='DrawingMeshCage')errors.push(`FULL_BODY_DRAWING_IR_GARMENT_SURFACE_BINDING_MISSING:${op.id}`);
    for(const id of ['collar-left','collar-right','center-seam'])if(!ir.operations?.find(op=>op.id===id)?.garment_surface_guide_root)errors.push(`FULL_BODY_DRAWING_IR_GARMENT_STRUCTURE_BINDING_MISSING:${id}`);
  }

  return{valid:errors.length===0,errors,drawing_ir_root:ir?.drawing_ir_root??null,mesh_silhouette_guide_root:ir?.mesh_silhouette_guide_root??null,head_surface_drawing_guide_root:ir?.head_surface_drawing_guide_root??null,face_surface_drawing_guide_root:ir?.face_surface_drawing_guide_root??null,hair_surface_drawing_guide_root:ir?.hair_surface_drawing_guide_root??null,garment_surface_drawing_guide_root:ir?.garment_surface_drawing_guide_root??null};
}

export function fullBodyDrawingIrToSvg(ir,options={}){
  const validation=validateFullBodyAnimeDrawingIR(ir,{requireMeshSilhouette:Boolean(ir?.mesh_silhouette_guide_root),requireHeadSurface:Boolean(ir?.head_surface_drawing_guide_root),requireFaceSurface:Boolean(ir?.face_surface_drawing_guide_root),requireHairSurface:Boolean(ir?.hair_surface_drawing_guide_root),requireGarmentSurface:Boolean(ir?.garment_surface_drawing_guide_root)});
  if(!validation.valid)throw Object.assign(new Error(`FULL_BODY_DRAWING_IR_INVALID:${validation.errors.join(',')}`),{code:'FULL_BODY_DRAWING_IR_INVALID',validation});
  return drawingIrToSvg(ir,options);
}
