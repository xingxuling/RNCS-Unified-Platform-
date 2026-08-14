import {clamp,clone,rootHash,seal} from './canonical.mjs';
import {compileArtDirectedMorphology} from './semantic-anatomy.mjs';
import {buildContinuousMorphologyField,validateMorphologyField} from './morphology-field.mjs';
import {buildCanonicalSurfaceMesh,validateCanonicalSurfaceMesh} from './canonical-surface-mesh.mjs';
import {buildSurfaceAttachmentSet,validateSurfaceAttachmentSet} from './surface-attachments.mjs';
import {buildMorphologyCertificateV2,validateMorphologyCertificateV2} from './morphology-certificate-v2.mjs';
import {buildSemanticMorphologyCertificate,validateSemanticMorphologyCertificate} from './semantic-certificate.mjs';

const FORMAT='rncs.full-body-morphology-extension.v0.1';
const CERT_FORMAT='rncs.lower-body-morphology-certificate.v0.1';
const round=value=>Number(Number(value).toFixed(6));
const point=(x,y,z=0)=>[Number(x),Number(y),Number(z)];
const bodyParameter=(genome,id,fallback)=>Number(genome?.morphology_genome?.body_parameters?.[id]??genome?.semantic_morph_graph?.parameters?.find(item=>item.parameter_id===id)?.normalized_value??genome?.body_parameters?.[id]??fallback);
const bone=(id,parent,length,axis,translation,limits={})=>({id,parent,length:round(length),axis:point(...axis),rest_local:{translation:point(...translation),rotation:{pitch:0,yaw:0,roll:0}},local_transform:{translation:point(...translation),rotation:{pitch:0,yaw:0,roll:0}},joint_limits:{pitch:limits.pitch??[-Math.PI/2,Math.PI/2],yaw:limits.yaw??[-Math.PI,Math.PI],roll:limits.roll??[-Math.PI/2,Math.PI/2]}});
const volume=(id,bone_id,kind,dimensions,local_center=[0,0,0],extra={})=>({id,bone_id,kind,dimensions,local_center:[...local_center],...extra});
const gate=(name,measurement,allowed,method,assetRoot,pass)=>({measurement,allowed,method,evidence_root:rootHash({asset_root:assetRoot,gate:name,measurement,allowed,method}),pass:Boolean(pass)});
const inside=(value,range)=>Number.isFinite(Number(value))&&Number(value)>=Number(range[0])-1e-9&&Number(value)<=Number(range[1])+1e-9;

function lowerBodyDimensions(proportions,genome){
  const leg=clamp(bodyParameter(genome,'body.leg_length',.56),0,1),headRadius=Number(proportions.radii.skull[0]),pelvisWidth=Number(proportions.widths.pelvis),pelvisHeight=Number(proportions.bone_lengths.pelvis),thigh=round(.19+leg*.09),shin=round(.175+leg*.085),foot=round(.075+leg*.035),hipOffset=round(pelvisWidth*.245),thighTop=round(headRadius*.30),thighBottom=round(headRadius*.235),knee=round(headRadius*.235),shinTop=round(headRadius*.22),shinBottom=round(headRadius*.155),ankle=round(headRadius*.145),footWidth=round(headRadius*.235),footHeight=round(headRadius*.13),pelvisDepth=Number(proportions.radii.pelvis?.[2]??proportions.radii.ribcage?.[2]??headRadius*.4);
  return{leg_ratio:leg,hip_offset:hipOffset,hip_height:round(pelvisHeight*.26),thigh,shin,foot,radii:{hip:[round(thighTop*1.22),round(thighTop*.96),round(pelvisDepth*.72)],thigh_top:thighTop,thigh_bottom:thighBottom,knee,shin_top:shinTop,shin_bottom:shinBottom,ankle,foot:[footWidth,footHeight,round(foot*.62)]}};
}

export function extendProportionsWithLowerBody(proportions,genome){
  const next=clone(proportions),lower=lowerBodyDimensions(next,genome),hipY=lower.hip_height,kneeY=hipY-lower.thigh,ankleY=kneeY-lower.shin;
  next.landmarks={...next.landmarks,hip_left:point(-lower.hip_offset,hipY,0),hip_right:point(lower.hip_offset,hipY,0),knee_left:point(-lower.hip_offset,kneeY,0),knee_right:point(lower.hip_offset,kneeY,0),ankle_left:point(-lower.hip_offset,ankleY,0),ankle_right:point(lower.hip_offset,ankleY,0),foot_tip_left:point(-lower.hip_offset,ankleY,lower.foot),foot_tip_right:point(lower.hip_offset,ankleY,lower.foot)};
  next.bone_lengths={...next.bone_lengths,thigh:lower.thigh,shin:lower.shin,foot:lower.foot};
  next.radii={...next.radii,hip:lower.radii.hip,thigh_top:lower.radii.thigh_top,thigh_bottom:lower.radii.thigh_bottom,knee:lower.radii.knee,shin_top:lower.radii.shin_top,shin_bottom:lower.radii.shin_bottom,ankle:lower.radii.ankle,foot:lower.radii.foot};
  next.lower_body={format:'rncs.lower-body-proportion-solution.v0.1',leg_ratio:lower.leg_ratio,hip_offset:lower.hip_offset,hip_height:lower.hip_height,thigh_length:lower.thigh,shin_length:lower.shin,foot_length:lower.foot,full_leg_length:round(lower.thigh+lower.shin),lower_extent:round(lower.thigh+lower.shin+lower.radii.foot[1]),source_parameter:'body.leg_length'};
  next.full_height=round(Number(next.height)+next.lower_body.lower_extent);
  next.identity_drivers={...next.identity_drivers,leg_length:lower.leg_ratio};
  next.proportion_root='';
  return seal(next,'proportion_root');
}

export function extendSkeletonWithLowerBody(skeleton,proportions){
  if((skeleton?.bones??[]).some(item=>item.id==='thigh-left'))return skeleton;
  const b=proportions.bone_lengths,l=proportions.lower_body,hipX=l.hip_offset,hipY=l.hip_height,extra=[
    bone('hip-left','pelvis',0,[0,1,0],[-hipX,hipY,0],{pitch:[-.55,.9],yaw:[-.55,.55],roll:[-.8,.8]}),
    bone('thigh-left','hip-left',b.thigh,[0,-1,0],[0,0,0],{pitch:[-.55,.95],yaw:[-.45,.45],roll:[-.9,.65]}),
    bone('knee-left','thigh-left',0,[0,1,0],[0,-b.thigh,0],{pitch:[-2.35,.08],yaw:[-.12,.12],roll:[-.08,.08]}),
    bone('shin-left','knee-left',b.shin,[0,-1,0],[0,0,0],{pitch:[-.08,.08],yaw:[-.08,.08],roll:[-.12,.12]}),
    bone('ankle-left','shin-left',0,[0,1,0],[0,-b.shin,0],{pitch:[-.6,.55],yaw:[-.22,.22],roll:[-.3,.3]}),
    bone('foot-left','ankle-left',b.foot,[0,0,1],[0,0,0],{pitch:[-.35,.35],yaw:[-.3,.3],roll:[-.18,.18]}),
    bone('hip-right','pelvis',0,[0,1,0],[hipX,hipY,0],{pitch:[-.55,.9],yaw:[-.55,.55],roll:[-.65,.9]}),
    bone('thigh-right','hip-right',b.thigh,[0,-1,0],[0,0,0],{pitch:[-.55,.95],yaw:[-.45,.45],roll:[-.65,.9]}),
    bone('knee-right','thigh-right',0,[0,1,0],[0,-b.thigh,0],{pitch:[-2.35,.08],yaw:[-.12,.12],roll:[-.08,.08]}),
    bone('shin-right','knee-right',b.shin,[0,-1,0],[0,0,0],{pitch:[-.08,.08],yaw:[-.08,.08],roll:[-.12,.12]}),
    bone('ankle-right','shin-right',0,[0,1,0],[0,-b.shin,0],{pitch:[-.6,.55],yaw:[-.22,.22],roll:[-.3,.3]}),
    bone('foot-right','ankle-right',b.foot,[0,0,1],[0,0,0],{pitch:[-.35,.35],yaw:[-.3,.3],roll:[-.18,.18]})
  ];
  const next={...clone(skeleton),version:'0.2.0-alpha.1',bone_order:[...(skeleton.bone_order??skeleton.bones.map(item=>item.id)),...extra.map(item=>item.id)],bones:[...clone(skeleton.bones),...extra],lower_body_policy:'pelvis-rooted-bilateral-leg-chain',skeleton_root:''};
  return seal(next,'skeleton_root');
}

export function extendVolumesWithLowerBody(volumes,proportions){
  if((volumes??[]).some(item=>item.id==='thigh-left'))return volumes;
  const b=proportions.bone_lengths,r=proportions.radii,extra=[];
  for(const side of ['left','right'])extra.push(
    volume(`hip-${side}`,`hip-${side}`,'ellipsoid',{radii:r.hip},[0,0,0],{semantic_region:'hip',blend_group:`${side}-leg`,field_family:'HipField',side}),
    volume(`thigh-${side}`,`thigh-${side}`,'tapered-capsule',{length:b.thigh,radius_top:r.thigh_top,radius_bottom:r.thigh_bottom},[0,-b.thigh*.5,0],{semantic_region:'thigh',blend_group:`${side}-leg`,field_family:'ThighField',field_function:'tapered_capsule_sdf',side}),
    volume(`knee-${side}`,`knee-${side}`,'blended-volume',{radius:r.knee},[0,0,0],{semantic_region:'knee',blend_group:`${side}-leg`,field_family:'KneeField',field_function:'sphere_sdf',side}),
    volume(`shin-${side}`,`shin-${side}`,'tapered-capsule',{length:b.shin,radius_top:r.shin_top,radius_bottom:r.shin_bottom},[0,-b.shin*.5,0],{semantic_region:'shin',blend_group:`${side}-leg`,field_family:'ShinField',field_function:'tapered_capsule_sdf',side}),
    volume(`foot-${side}`,`foot-${side}`,'rounded-wedge',{radii:r.foot},[0,-r.foot[1]*.12,b.foot*.42],{semantic_region:'foot',blend_group:`${side}-leg`,field_family:'FootField',field_function:'rounded_wedge_sdf',side})
  );
  return[...clone(volumes),...extra].map(item=>({...item,source:item.source??'canonical-lower-body-extension'}));
}

function rebuildField({proportions,skeleton,volumes,genome_root,law_root}){
  const raw=buildContinuousMorphologyField({proportions,skeleton,volumes,genome_root,law_root}),lowerIds=new Map(volumes.filter(item=>item.field_family).map(item=>[item.id,item])),fields=raw.fields.map(descriptor=>{const source=lowerIds.get(descriptor.source_volume_id);if(!source)return descriptor;return{...descriptor,field_id:`${source.field_family}:${source.side}`,field_function:source.field_function??descriptor.field_function,blend_group:source.blend_group,semantic_region:source.semantic_region,material_region:'skin'};});
  return seal({...raw,version:'0.2.0-alpha.1',fields,field_root:''},'field_root');
}

function artDirectedGeometryCertificate(baseCertificate,target){
  const next=clone(baseCertificate),ratio=clone(next.gates?.projected_anatomical_ratio_validity??{}),measurement=ratio.measurement??{},allowed={head_to_shoulder:target?.silhouette?.head_to_shoulder??ratio.allowed?.head_to_shoulder,head_to_torso:target?.silhouette?.head_to_torso??ratio.allowed?.head_to_torso},pass=inside(measurement.head_to_shoulder,allowed.head_to_shoulder)&&inside(measurement.head_to_torso,allowed.head_to_torso);next.gates.projected_anatomical_ratio_validity={...ratio,allowed,method:'projected canonical mesh bounds under CharacterDesignTarget with lower-body extension',pass,evidence_root:rootHash({asset_root:next.asset_root,gate:'projected_anatomical_ratio_validity',target_root:target?.target_root??null,measurement,allowed})};next.failures=Object.entries(next.gates).filter(([,item])=>item?.pass!==true).map(([name])=>name);next.enforcement_scope=`art-directed-full-body:${target?.target_id??'unspecified'}`;next.character_design_target_root=target?.target_root??null;next.certificate_root='';return seal(next,'certificate_root');
}

function buildLowerBodyCertificate(asset){
  const bones=new Map((asset.skeleton?.bones??[]).map(item=>[item.id,item])),fields=new Set((asset.continuous_morphology_field?.fields??[]).map(item=>item.field_id)),weights=asset.canonical_surface_mesh?.bone_weights??[],regions=asset.canonical_surface_mesh?.region_ids??[],left=[bones.get('thigh-left'),bones.get('shin-left'),bones.get('foot-left')],right=[bones.get('thigh-right'),bones.get('shin-right'),bones.get('foot-right')],lengthSymmetry=left.every((item,index)=>item&&right[index]&&Math.abs(Number(item.length)-Number(right[index].length))<1e-9),legRatio=(Number(asset.proportions.bone_lengths.thigh)+Number(asset.proportions.bone_lengths.shin))/Math.max(.001,Number(asset.proportions.height)),requiredFields=['HipField:left','ThighField:left','KneeField:left','ShinField:left','FootField:left','HipField:right','ThighField:right','KneeField:right','ShinField:right','FootField:right'],requiredBones=['hip-left','thigh-left','knee-left','shin-left','ankle-left','foot-left','hip-right','thigh-right','knee-right','shin-right','ankle-right','foot-right'],requiredWeightBones=['thigh-left','shin-left','foot-left','thigh-right','shin-right','foot-right'],fieldPresent=requiredFields.every(id=>fields.has(id)),bonePresent=requiredBones.every(id=>bones.has(id)),weightPresence=Object.fromEntries(requiredWeightBones.map(id=>[id,weights.some(item=>Number(item?.[id]??0)>0)])),surfaceBinding=Object.values(weightPresence).every(Boolean),regionDiagnostics=Object.fromEntries(['hip','thigh','knee','shin','foot'].map(region=>[region,regions.filter(item=>item===region).length])),componentCount=asset.canonical_surface_mesh?.connected_components?.length??null,selfIntersections=Number(asset.canonical_surface_mesh?.topology_report?.surface_self_intersection_count??Infinity),gates={};
  gates.lower_body_bone_chain=gate('lower_body_bone_chain',{required_bones:requiredBones,present:bonePresent},{all_present:true},'bilateral pelvis-rooted hip-thigh-knee-shin-ankle-foot hierarchy',asset.morphology_root,bonePresent);
  gates.lower_body_field_chain=gate('lower_body_field_chain',{required_fields:requiredFields,present:fieldPresent},{all_present:true},'bilateral semantic field descriptors with unique field ids',asset.morphology_root,fieldPresent);
  gates.lower_body_mesh_connected=gate('lower_body_mesh_connected',{connected_components:componentCount},{max:1},'canonical mesh adjacency after lower-body field extraction',asset.morphology_root,componentCount===1);
  gates.lower_body_leg_proportion=gate('lower_body_leg_proportion',round(legRatio),[.48,.92],'thigh+shin length divided by preserved upper-body canonical height',asset.morphology_root,inside(legRatio,[.48,.92]));
  gates.lower_body_bilateral_symmetry=gate('lower_body_bilateral_symmetry',lengthSymmetry,true,'paired thigh/shin/foot canonical bone lengths',asset.morphology_root,lengthSymmetry);
  gates.lower_body_foot_attachment=gate('lower_body_foot_attachment',{required_weight_bones:requiredWeightBones,weight_presence:weightPresence,region_diagnostics:regionDiagnostics},{all_required_skin_weights:true},'nonzero canonical mesh skin weights for bilateral thigh/shin/foot; region ids are diagnostic only',asset.morphology_root,surfaceBinding);
  gates.lower_body_self_intersection=gate('lower_body_self_intersection',selfIntersections,{max:0},'canonical mesh non-adjacent triangle intersection count',asset.morphology_root,selfIntersections===0);
  const failures=Object.entries(gates).filter(([,item])=>item.pass!==true).map(([name])=>name);return seal({format:CERT_FORMAT,version:'0.1.1-alpha.1',asset_root:asset.morphology_root,gates,failures,required_gates:Object.keys(gates),rejection_policy:'any-measured-lower-body-gate-false-rejects-candidate',human_visual_acceptance:'not-automated',certificate_root:''},'certificate_root');
}

function meshProfileFor(baseProfile){if(typeof baseProfile==='object')return baseProfile;if(baseProfile==='property')return{x:8,y:20,z:8};if(baseProfile==='high')return{x:30,y:64,z:24};if(baseProfile==='validation')return{x:24,y:56,z:20};return{x:16,y:34,z:14};}
function hasLowerBodySampling(mesh){const required=['thigh-left','shin-left','foot-left','thigh-right','shin-right','foot-right'];return required.every(boneId=>(mesh?.bone_weights??[]).some(weights=>Number(weights?.[boneId]??0)>0));}
function buildLowerBodyMesh(field,profile,requestedProfile){let mesh=buildCanonicalSurfaceMesh({field,profile});if(requestedProfile==='property'&&!hasLowerBodySampling(mesh)){
  // Property previews stay bounded without silently erasing thin canonical legs.
  mesh=buildCanonicalSurfaceMesh({field,profile:{x:16,y:44,z:12}});
}
return mesh;}

export function extendArtDirectedMorphologyWithLowerBody(baseAsset,genome,{surface_resolution=null,certificate_mode='canonical'}={}){
  if(!baseAsset?.semantic_certificate_root)throw Object.assign(new Error('LOWER_BODY_SEMANTIC_ASSET_REQUIRED'),{code:'LOWER_BODY_SEMANTIC_ASSET_REQUIRED'});
  const proportions=extendProportionsWithLowerBody(baseAsset.proportions,genome),skeleton=extendSkeletonWithLowerBody(baseAsset.skeleton,proportions),volumes=extendVolumesWithLowerBody(baseAsset.volumes,proportions),field=rebuildField({proportions,skeleton,volumes,genome_root:baseAsset.genome_root,law_root:baseAsset.law_set.law_root}),fieldValidation=validateMorphologyField(field);if(!fieldValidation.valid)throw Object.assign(new Error(`LOWER_BODY_FIELD_REJECTED:${fieldValidation.errors.join(',')}`),{code:'LOWER_BODY_FIELD_REJECTED',fieldValidation});
  let meshProfile=meshProfileFor(surface_resolution??baseAsset.mesh_profile??'validation'),mesh=buildLowerBodyMesh(field,meshProfile,surface_resolution??baseAsset.mesh_profile);meshProfile=mesh.resolution;const meshValidation=validateCanonicalSurfaceMesh(mesh);if(!meshValidation.valid)throw Object.assign(new Error(`LOWER_BODY_MESH_REJECTED:${meshValidation.errors.join(',')}`),{code:'LOWER_BODY_MESH_REJECTED',meshValidation});
  const base=clone(baseAsset);for(const key of ['continuous_morphology_field','field_validation','canonical_surface_mesh','mesh_validation','surface_attachments','attachment_validation','certificate','certificate_root','semantic_certificate','semantic_certificate_root','semantic_morphology_root','full_body_morphology_root','lower_body_certificate','lower_body_certificate_root'])delete base[key];Object.assign(base,{version:'0.2.0-alpha.1',proportions,skeleton,volumes,continuous_morphology_field:field,field_validation:fieldValidation,canonical_surface_mesh:mesh,mesh_validation:meshValidation,mesh_profile:meshProfile,lower_body_status:'represented-in-canonical-morphology-v0.2-candidate',morphology_root:''});
  const preAttachmentRoot=rootHash(base),attachments=buildSurfaceAttachmentSet({...base,morphology_root:preAttachmentRoot}),attachmentValidation=validateSurfaceAttachmentSet(attachments,{asset:{...base,morphology_root:preAttachmentRoot}});if(!attachmentValidation.valid)throw Object.assign(new Error(`LOWER_BODY_ATTACHMENT_REJECTED:${attachmentValidation.errors.join(',')}`),{code:'LOWER_BODY_ATTACHMENT_REJECTED',attachmentValidation});
  const withAttachments={...base,surface_attachments:attachments,attachment_validation:attachmentValidation},morphologyRoot=rootHash({...withAttachments,morphology_root:''}),asset={...withAttachments,morphology_root:morphologyRoot},rawGeometryCertificate=buildMorphologyCertificateV2(asset,certificate_mode==='property'?{raster_width:32,raster_height:18,validation_mode:'property'}:{}),geometryCertificate=artDirectedGeometryCertificate(rawGeometryCertificate,asset.semantic_target),geometryValidation=validateMorphologyCertificateV2(geometryCertificate);if(!geometryValidation.valid)throw Object.assign(new Error(`LOWER_BODY_GEOMETRY_CERTIFICATE_REJECTED:${geometryValidation.failures.join(',')}`),{code:'LOWER_BODY_GEOMETRY_CERTIFICATE_REJECTED',geometryValidation,geometryCertificate});
  const semanticCertificate=buildSemanticMorphologyCertificate({...asset,certificate:geometryCertificate},asset.semantic_target,{evidence_root:`semantic-full-body:${asset.semantic_target_root??asset.semantic_target?.target_root??'unknown'}`}),semanticValidation=validateSemanticMorphologyCertificate(semanticCertificate);if(!semanticValidation.valid)throw Object.assign(new Error(`LOWER_BODY_SEMANTIC_CERTIFICATE_REJECTED:${semanticValidation.failures.join(',')}`),{code:'LOWER_BODY_SEMANTIC_CERTIFICATE_REJECTED',semanticValidation,semanticCertificate});
  const lowerBodyCertificate=buildLowerBodyCertificate(asset);if(lowerBodyCertificate.failures.length)throw Object.assign(new Error(`LOWER_BODY_CERTIFICATE_REJECTED:${lowerBodyCertificate.failures.join(',')}`),{code:'LOWER_BODY_CERTIFICATE_REJECTED',lowerBodyCertificate});
  const semantic=seal({...asset,certificate:geometryCertificate,certificate_root:geometryCertificate.certificate_root,semantic_certificate:semanticCertificate,semantic_certificate_root:semanticCertificate.certificate_root,lower_body_certificate:lowerBodyCertificate,lower_body_certificate_root:lowerBodyCertificate.certificate_root,semantic_morphology_root:''},'semantic_morphology_root');return seal({...semantic,format_extension:FORMAT,full_body_morphology_root:''},'full_body_morphology_root');
}

export function compileFullBodyArtDirectedMorphology(genome,options={}){const base=compileArtDirectedMorphology(genome,options);return extendArtDirectedMorphologyWithLowerBody(base,genome,options);}

export function validateLowerBodyCertificate(certificate){const failures=Object.entries(certificate?.gates??{}).filter(([,item])=>item?.pass!==true).map(([name])=>name);return{valid:Boolean(certificate&&certificate.format===CERT_FORMAT&&failures.length===0),failures,gates:certificate?.gates??{},certificate_root:certificate?.certificate_root??null};}
