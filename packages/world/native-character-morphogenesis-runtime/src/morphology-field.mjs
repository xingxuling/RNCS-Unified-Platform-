import {add3,clamp,composeTransform,distance3,lerp,rootHash,sub3,transformPoint,seal} from './canonical.mjs';

const FIELD_FORMAT='rncs.continuous-morphology-field.v0.1';
const round=value=>Number(Number(value).toFixed(6));
const point=(x,y,z=0)=>[Number(x),Number(y),Number(z)];
const rotation={pitch:0,yaw:0,roll:0};

function fieldFamily(volume){
  if(volume.id.includes('skull'))return['SkullField','shared','ellipsoid'];
  if(volume.id.includes('neck'))return['NeckField','shared','capsule'];
  if(volume.id.includes('ribcage'))return['RibcageField','shared','superellipsoid'];
  if(volume.id.includes('pelvis'))return['PelvisField','shared','ellipsoid'];
  if(volume.id.includes('spine'))return['SpineField','shared','ellipsoid'];
  if(volume.id.includes('deltoid'))return['DeltoidField',volume.id.endsWith('left')?'left':'right','sphere'];
  if(volume.id.includes('upper-arm'))return['UpperArmField',volume.id.endsWith('left')?'left':'right','tapered_capsule'];
  if(volume.id.includes('elbow'))return['ElbowField',volume.id.endsWith('left')?'left':'right','blended_sphere'];
  if(volume.id.includes('forearm'))return['ForearmField',volume.id.endsWith('left')?'left':'right','tapered_capsule'];
  if(volume.id.includes('palm'))return['PalmField',volume.id.endsWith('left')?'left':'right','rounded_wedge'];
  return['AnatomicalField','shared','ellipsoid'];
}

function semanticRegion(volume){
  return volume.id.replace(/-(left|right)$/,'').replace(/-/g,'_');
}

function blendGroup(volume){
  if(volume.id.endsWith('-left'))return 'left-arm';
  if(volume.id.endsWith('-right'))return 'right-arm';
  return 'trunk';
}

function shapeParameters(volume){
  const dimensions=volume.dimensions??{};
  if(dimensions.radii){const radii=dimensions.radii.map(Number);return{radii:[radii[0],radii[1]??radii[0],radii[2]??radii[0]*.75]};}
  if(dimensions.radius){const radius=Array.isArray(dimensions.radius)?Number(dimensions.radius[0]):Number(dimensions.radius);return{radius,length:Number(dimensions.length??radius*2)};}
  if(dimensions.length)return{length:Number(dimensions.length),radius_top:Number(dimensions.radius_top??dimensions.radius_bottom??.01),radius_bottom:Number(dimensions.radius_bottom??dimensions.radius_top??.01)};
  if(dimensions.bulge||dimensions.radius)return{radius:Number(dimensions.radius??.01),bulge:Number(dimensions.bulge??0)};
  return{radii:[Number(dimensions.radii_x??.01),Number(dimensions.radii_y??.01),Number(dimensions.radii_z??.01)]};
}

function extentForField(field){
  const shape=field.shape_parameters??{};
  if(Array.isArray(shape.radii))return Math.max(...shape.radii);
  if(Number.isFinite(shape.length))return Number(shape.length)*.5+Math.max(Number(shape.radius??0),Number(shape.radius_top??0),Number(shape.radius_bottom??0));
  return Number(shape.radius??.01)+Number(shape.bulge??0);
}

function restBoneTransforms(skeleton){
  const transforms=new Map();
  for(const bone of skeleton?.bones??[]){
    const parent=bone.parent?transforms.get(bone.parent):{position:[0,0,0],rotation};
    transforms.set(bone.id,composeTransform(parent,{translation:bone.local_transform?.translation??[0,0,0],rotation:bone.local_transform?.rotation??rotation}));
  }
  return Object.fromEntries([...transforms.entries()].map(([id,value])=>[id,value]));
}

export function smoothUnion(a,b,k=.02){
  const blend=Math.max(Number(k),1e-9),h=clamp(.5+.5*(Number(b)-Number(a))/blend),value=lerp(Number(b),Number(a),h)-blend*h*(1-h);
  return Number(value);
}

export function smoothIntersection(a,b,k=.02){return -smoothUnion(-Number(a),-Number(b),k);}

export function boundedSubtraction(a,b,k=.02){return smoothIntersection(Number(a),-Number(b),k);}

function ellipsoidField(local,radii){
  const [rx,ry,rz]=radii.map(value=>Math.max(Number(value),1e-6)),normalized=Math.hypot(local[0]/rx,local[1]/ry,local[2]/rz),scale=Math.min(rx,ry,rz);
  return (normalized-1)*scale;
}

function capsuleField(local,length,radiusTop,radiusBottom){
  const half=Math.max(Number(length)*.5,1e-6),y=Number(local[1]),t=clamp((y+half)/(half*2)),radius=lerp(Number(radiusBottom),Number(radiusTop),t),radial=Math.hypot(Number(local[0]),Number(local[2]))-radius,axial=Math.abs(y)-half;
  const outside=Math.hypot(Math.max(radial,0),Math.max(axial,0)),inside=Math.min(Math.max(radial,axial),0);
  return outside+inside;
}

function primitiveDistance(field,local){
  const shape=field.shape_parameters??{};
  if(field.field_function==='ellipsoid_sdf'||field.field_function==='superellipsoid_sdf'||field.field_function==='rounded_wedge_sdf')return ellipsoidField(local,shape.radii??[.01,.01,.01]);
  if(field.field_function==='capsule_sdf')return capsuleField(local,shape.length??.02,shape.radius??.01,shape.radius??.01);
  if(field.field_function==='tapered_capsule_sdf')return capsuleField(local,shape.length??.02,shape.radius_top??.01,shape.radius_bottom??.01);
  if(field.field_function==='sphere_sdf'||field.field_function==='blended_sphere_sdf')return Math.hypot(...local)-(Number(shape.radius??.01)+Number(shape.bulge??0));
  return ellipsoidField(local,shape.radii??[.01,.01,.01]);
}

function inverseRotate(value,rotationValue={}){
  let [x,y,z]=value,pitch=Number(rotationValue.pitch??0),yaw=Number(rotationValue.yaw??0),roll=Number(rotationValue.roll??0),c,s;
  c=Math.cos(-roll);s=Math.sin(-roll);[x,y]=[x*c-y*s,x*s+y*c];
  c=Math.cos(-yaw);s=Math.sin(-yaw);[x,z]=[x*c-z*s,x*s+z*c];
  c=Math.cos(-pitch);s=Math.sin(-pitch);[y,z]=[y*c-z*s,y*s+z*c];
  return[x,y,z];
}

function inverseTransform(transformValue,value){return inverseRotate(sub3(value,transformValue?.position??[0,0,0]),transformValue?.rotation);}

export function buildContinuousMorphologyField({proportions,skeleton,volumes,genome_root=null,law_root=null}={}){
  const boneTransforms=restBoneTransforms(skeleton),spineBridge={id:'spine-bridge',bone_id:'spine',kind:'ellipsoid',dimensions:{radii:[proportions.widths.waist*.5,proportions.bone_lengths.spine*.6,proportions.radii.ribcage[2]*.82]},local_center:[0,proportions.bone_lengths.spine*.5,0],source:'canonical-spine-continuity-bridge'},sourceVolumes=[...(volumes??[]),spineBridge],fields=sourceVolumes.map(volume=>{
    const [family,side,primitiveFamily]=fieldFamily(volume),shape=shapeParameters(volume),fieldFunction=primitiveFamily==='ellipsoid'?'ellipsoid_sdf':primitiveFamily==='superellipsoid'?'superellipsoid_sdf':primitiveFamily==='capsule'?'capsule_sdf':primitiveFamily==='tapered_capsule'?'tapered_capsule_sdf':primitiveFamily==='sphere'?'sphere_sdf':primitiveFamily==='blended_sphere'?'blended_sphere_sdf':'rounded_wedge_sdf';
    return{field_id:side==='shared'?family:`${family}:${side}`,source_volume_id:volume.id,attached_bone:volume.bone_id,local_transform:{translation:[...(volume.local_center??[0,0,0])],rotation:{...rotation}},shape_parameters:shape,field_function:fieldFunction,blend_group:blendGroup(volume),blend_radius:round(volume.id.includes('elbow')?.014:.018),material_region:volume.id.includes('pelvis')||volume.id.includes('ribcage')?'body':'skin',semantic_region:semanticRegion(volume),identity_weight:1,deformation_policy:{mode:'bone-transform-plus-field-preservation',pose_changes_bone_transform_only:true,volume_preservation:true},rest_center:transformPoint(boneTransforms[volume.bone_id]??{position:[0,0,0],rotation},volume.local_center??[0,0,0]),extent:round(extentForField({shape_parameters:shape}))};
  });
  return seal({format:FIELD_FORMAT,version:'0.1.0-alpha.1',units:'normalized-body',coordinate_system:proportions?.coordinate_system??null,genome_root,law_root,fields,bone_transforms:boneTransforms,composition:{operator:'smooth-union-by-blend-group',smooth_union:'polynomial-smooth-min',smooth_intersection:'negated-smooth-union',bounded_subtraction:'smooth-max-with-negated-field'},sampling_policy:{domain:'canonical-body-bounds',camera_independent:true,resolution_independent:true,deterministic_cpu:true},field_root:''},'field_root');
}

export function evaluateMorphologyField(field,worldPoint,{boneTransforms=null}={}){
  const transforms=boneTransforms??field?.bone_transforms??{},samples=[];
  for(const descriptor of field?.fields??[]){
    const transformValue=transforms[descriptor.attached_bone]??{position:[0,0,0],rotation};
    const local=inverseTransform(transformValue,worldPoint),relative=sub3(local,descriptor.local_transform?.translation??[0,0,0]),distance=primitiveDistance(descriptor,relative);
    samples.push({distance,field_id:descriptor.field_id,semantic_region:descriptor.semantic_region,material_region:descriptor.material_region,attached_bone:descriptor.attached_bone,local_point:relative});
  }
  if(!samples.length)return{distance:Infinity,field_id:null,semantic_region:null,material_region:null,contributors:[]};
  let result={...samples[0],distance:Number(samples[0].distance)};
  for(const candidate of samples.slice(1)){
    const blended=smoothUnion(result.distance,candidate.distance,Math.min(...[result,candidate].map(item=>Number(field.fields.find(item2=>item2.field_id===item.field_id)?.blend_radius??.018))));
    if(candidate.distance<result.distance)result={...candidate,distance:blended,contributors:[...(result.contributors??[]),result.field_id]};
    else result={...result,distance:blended,contributors:[...(result.contributors??[]),candidate.field_id]};
  }
  return result;
}

function connectedComponents(fields){
  const adjacency=new Map(fields.map(field=>[field.field_id,new Set()]));
  for(let left=0;left<fields.length;left+=1)for(let right=left+1;right<fields.length;right+=1){
    const a=fields[left],b=fields[right],distance=distance3(a.rest_center,b.rest_center),threshold=a.extent+b.extent+Math.max(a.blend_radius,b.blend_radius);
    if(distance<=threshold){adjacency.get(a.field_id).add(b.field_id);adjacency.get(b.field_id).add(a.field_id);}
  }
  const components=[];const visited=new Set();
  for(const field of fields){if(visited.has(field.field_id))continue;const queue=[field.field_id],component=[];visited.add(field.field_id);while(queue.length){const id=queue.shift();component.push(id);for(const neighbor of adjacency.get(id)??[]){if(!visited.has(neighbor)){visited.add(neighbor);queue.push(neighbor);}}}components.push(component.sort());}
  return{adjacency:Object.fromEntries([...adjacency.entries()].map(([id,neighbors])=>[id,[...neighbors].sort()])),components};
}

export function validateMorphologyField(field,{sample_points=[]}={}){
  const errors=[],fields=field?.fields??[],required=['field_id','attached_bone','local_transform','shape_parameters','field_function','blend_group','material_region','semantic_region','identity_weight','deformation_policy'];
  if(fields.length<14)errors.push('FIELD_PRIMITIVE_COUNT_LOW');
  for(const descriptor of fields)for(const key of required)if(descriptor[key]===undefined)errors.push(`FIELD_KEY_MISSING:${descriptor.field_id}:${key}`);
  const topology=connectedComponents(fields),points=sample_points.length?sample_points:fields.map(item=>item.rest_center),samples=points.map(pointValue=>evaluateMorphologyField(field,pointValue));
  const fieldBreaks=samples.filter(sample=>!Number.isFinite(sample.distance)).length;
  const jointCollapseCount=fields.filter(item=>/ElbowField|UpperArmField|ForearmField/.test(item.field_id)&&item.extent<=0).length;
  const illegalOverlapPairs=fields.filter(item=>!item.blend_group).map(item=>item.field_id);
  if(fieldBreaks)errors.push('FIELD_BREAKS_PRESENT');
  if(topology.components.length>1)errors.push('FIELD_DISCONNECTED_COMPONENTS');
  if(jointCollapseCount)errors.push('FIELD_JOINT_COLLAPSE');
  if(illegalOverlapPairs.length)errors.push('FIELD_ILLEGAL_OVERLAP_POLICY_MISSING');
  const report={format:'rncs.morphology-field-validation.v0.1',field_root:field?.field_root??null,field_count:fields.length,field_breaks:fieldBreaks,illegal_overlap_pairs:illegalOverlapPairs,joint_collapse_count:jointCollapseCount,connected_components:topology.components,adjacency:topology.adjacency,sample_count:samples.length,errors};
  return{...report,valid:errors.length===0,validation_root:rootHash(report)};
}
