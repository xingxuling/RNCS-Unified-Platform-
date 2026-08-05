import {GlbBuilder,encodeFloat32,encodeUint16,minMax,encodeGlb,inspectGlb} from '../../reality-asset-genesis-fabric/src/gltf.mjs';
import {rootHash} from '../../reality-asset-genesis-fabric/src/canonical.mjs';
import {EXPRESSION_MORPHS,VISEME_MORPHS,getCostumeFamily,getHairFamily,getTopologyFamily} from '../../character-genome-runtime/src/index.mjs';

const TAU=Math.PI*2;
const normalize=value=>{const length=Math.hypot(...value)||1;return value.map(item=>item/length)};
const parameterMap=genome=>new Map(genome.semantic_morph_graph.parameters.map(item=>[item.parameter_id,item.normalized_value]));
const p=(map,id,fallback=.5)=>Number(map.get(id)??fallback);

export const CHARACTER_BONES=Object.freeze([
  {name:'root',parent:null,region:'root'}, {name:'hips',parent:'root',region:'body'}, {name:'spine',parent:'hips',region:'body'},
  {name:'chest',parent:'spine',region:'body'}, {name:'neck',parent:'chest',region:'body'}, {name:'head',parent:'neck',region:'face'},
  {name:'jaw',parent:'head',region:'mouth'}, {name:'eye_l',parent:'head',region:'eyes'}, {name:'eye_r',parent:'head',region:'eyes'},
  {name:'clavicle_l',parent:'chest',region:'body'}, {name:'clavicle_r',parent:'chest',region:'body'},
  {name:'arm_l',parent:'clavicle_l',region:'body'}, {name:'arm_r',parent:'clavicle_r',region:'body'},
  {name:'hand_l',parent:'arm_l',region:'body'}, {name:'hand_r',parent:'arm_r',region:'body'},
  {name:'leg_l',parent:'hips',region:'body'}, {name:'leg_r',parent:'hips',region:'body'},
  {name:'foot_l',parent:'leg_l',region:'body'}, {name:'foot_r',parent:'leg_r',region:'body'},
  {name:'hair_back',parent:'head',region:'hair'}, {name:'coat_back',parent:'chest',region:'costume'},
]);
const boneIndex=Object.fromEntries(CHARACTER_BONES.map((bone,index)=>[bone.name,index]));

function geometry(){return{positions:[],normals:[],uvs:[],joints:[],weights:[],indices:[],regions:[],parts:[]}}
function addVertex(g,position,normal,uv,bone,region,part){g.positions.push(...position);g.normals.push(...normalize(normal));g.uvs.push(uv[0],uv[1]);g.joints.push(boneIndex[bone]??0,0,0,0);g.weights.push(1,0,0,0);g.regions.push(region);g.parts.push(part)}

function addEllipsoid(g,{center,radii,bone='root',region='body',part='body',segments=12,rings=5,range=[0,1]}={}){
  const base=g.positions.length/3,[cx,cy,cz]=center,[rx,ry,rz]=radii;
  addVertex(g,[cx,cy+ry,cz],[0,1,0],[(range[0]+range[1])/2,0],bone,region,part);
  for(let ring=1;ring<rings;ring++){
    const v=ring/rings,theta=v*Math.PI,sinTheta=Math.sin(theta),cosTheta=Math.cos(theta);
    for(let segment=0;segment<segments;segment++){
      const u=segment/segments,phi=u*TAU,local=[sinTheta*Math.cos(phi),cosTheta,sinTheta*Math.sin(phi)];
      addVertex(g,[cx+local[0]*rx,cy+local[1]*ry,cz+local[2]*rz],[local[0]/rx,local[1]/ry,local[2]/rz],[range[0]+u*(range[1]-range[0]),v],bone,region,part);
    }
  }
  const bottom=g.positions.length/3;addVertex(g,[cx,cy-ry,cz],[0,-1,0],[(range[0]+range[1])/2,1],bone,region,part);
  for(let segment=0;segment<segments;segment++)g.indices.push(base,base+1+segment,base+1+(segment+1)%segments);
  for(let ring=0;ring<rings-2;ring++)for(let segment=0;segment<segments;segment++){
    const a=base+1+ring*segments+segment,b=base+1+ring*segments+(segment+1)%segments,c=a+segments,d=b+segments;g.indices.push(a,c,b,b,c,d);
  }
  const last=base+1+(rings-2)*segments;for(let segment=0;segment<segments;segment++)g.indices.push(last+segment,bottom,last+(segment+1)%segments);
}

function addBox(g,{center,size,bone='root',region='body',part='body'}={}){
  const [cx,cy,cz]=center,[sx,sy,sz]=size.map(value=>value/2),faces=[
    [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
    [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
    [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]],
  ];
  for(const face of faces){const base=g.positions.length/3;for(let index=0;index<4;index++){const v=face[index];addVertex(g,[cx+v[0]*sx,cy+v[1]*sy,cz+v[2]*sz],face[4],[index===0||index===3?0:1,index<2?0:1],bone,region,part)}g.indices.push(base,base+2,base+1,base,base+3,base+2)}
}

function dimensions(genome){
  const map=parameterMap(genome),topology=getTopologyFamily(genome.topology_family),height=Number(genome.physical_profile.height_m??1.82),headRatio=topology.proportions.head_body_ratio+(p(map,'body.head_body_ratio')-.5)*.55,headHeight=height/headRatio,headCenter=height-headHeight*.52,faceWidth=headHeight*(.64+(p(map,'face.face_width')-.5)*.22),faceLength=headHeight*(.92+(p(map,'face.face_length')-.5)*.2),shoulder=height*(.205*topology.proportions.shoulder_scale+(p(map,'body.shoulder_width')-.5)*.035),limbScale=.94+(p(map,'body.limb_ratio')-.5)*.18,neckScale=.92+(p(map,'body.neck_length')-.5)*.22;
  return{map,topology,height,headRatio,headHeight,headCenter,faceWidth,faceLength,shoulder,limbScale,neckScale};
}

function addBody(g,d,profile,parts){
  if(!parts.has('body'))return;
  const s=profile.segments,r=profile.rings,skin='body';
  addEllipsoid(g,{center:[0,.99,0],radii:[d.shoulder*.72,.3,.125],bone:'spine',region:'torso',part:skin,segments:s,rings:r});
  addEllipsoid(g,{center:[0,1.21,0],radii:[d.shoulder,.28,.15],bone:'chest',region:'torso',part:skin,segments:s,rings:r});
  addEllipsoid(g,{center:[0,.76,0],radii:[d.shoulder*.68,.2,.14],bone:'hips',region:'pelvis',part:skin,segments:s,rings:r});
  addEllipsoid(g,{center:[0,d.headCenter-d.headHeight*.63,0],radii:[.055,d.headHeight*.2*d.neckScale,.052],bone:'neck',region:'neck',part:skin,segments:profile.limbSegments,rings:3});
  const armY=1.02,armLength=.56*d.limbScale,armX=d.shoulder+.055;
  addEllipsoid(g,{center:[-armX,armY,0],radii:[.065,armLength*.5,.07],bone:'arm_l',region:'limb',part:skin,segments:profile.limbSegments,rings:profile.limbRings});
  addEllipsoid(g,{center:[armX,armY,0],radii:[.065,armLength*.5,.07],bone:'arm_r',region:'limb',part:skin,segments:profile.limbSegments,rings:profile.limbRings});
  addEllipsoid(g,{center:[-armX,armY-armLength*.54,0],radii:[.07,.095,.04],bone:'hand_l',region:'hands',part:skin,segments:profile.limbSegments,rings:3});
  addEllipsoid(g,{center:[armX,armY-armLength*.54,0],radii:[.07,.095,.04],bone:'hand_r',region:'hands',part:skin,segments:profile.limbSegments,rings:3});
  const legX=d.shoulder*.38,legLength=.68*d.limbScale;
  addEllipsoid(g,{center:[-legX,.42,0],radii:[.085,legLength*.52,.09],bone:'leg_l',region:'limb',part:skin,segments:profile.limbSegments,rings:profile.limbRings});
  addEllipsoid(g,{center:[legX,.42,0],radii:[.085,legLength*.52,.09],bone:'leg_r',region:'limb',part:skin,segments:profile.limbSegments,rings:profile.limbRings});
  addEllipsoid(g,{center:[-legX,.075,-.035],radii:[.095,.065,.16],bone:'foot_l',region:'feet',part:skin,segments:profile.limbSegments,rings:3});
  addEllipsoid(g,{center:[legX,.075,-.035],radii:[.095,.065,.16],bone:'foot_r',region:'feet',part:skin,segments:profile.limbSegments,rings:3});
}

function addFace(g,d,profile,parts){
  if(!parts.has('face'))return;
  const m=d.map,front=-d.faceWidth*.67,eyeY=d.headCenter+d.headHeight*.08,eyeX=d.faceWidth*(.25+(p(m,'face.eye_spacing')-.5)*.12),eyeR=d.headHeight*(.035+(p(m,'face.eye_size')-.5)*.018);
  addEllipsoid(g,{center:[0,d.headCenter,0],radii:[d.faceWidth,d.faceLength*.52,d.faceWidth*.78],bone:'head',region:'face',part:'face',segments:profile.segments+2,rings:profile.rings+1});
  addEllipsoid(g,{center:[0,d.headCenter-d.headHeight*.04,front-.01],radii:[d.headHeight*.035,d.headHeight*.075,d.headHeight*.045],bone:'head',region:'nose',part:'face',segments:profile.limbSegments,rings:3});
  addEllipsoid(g,{center:[-d.faceWidth*1.02,d.headCenter,0],radii:[d.headHeight*.028,d.headHeight*.08,d.headHeight*.038],bone:'head',region:'ear_l',part:'face',segments:profile.limbSegments,rings:3});
  addEllipsoid(g,{center:[d.faceWidth*1.02,d.headCenter,0],radii:[d.headHeight*.028,d.headHeight*.08,d.headHeight*.038],bone:'head',region:'ear_r',part:'face',segments:profile.limbSegments,rings:3});
  addEllipsoid(g,{center:[-eyeX,eyeY,front-.035],radii:[eyeR*1.45,eyeR*.72,eyeR*.42],bone:'eye_l',region:'eye_l',part:'face',segments:profile.limbSegments,rings:3});
  addEllipsoid(g,{center:[eyeX,eyeY,front-.035],radii:[eyeR*1.45,eyeR*.72,eyeR*.42],bone:'eye_r',region:'eye_r',part:'face',segments:profile.limbSegments,rings:3});
  addBox(g,{center:[-eyeX,eyeY+eyeR*1.7,front-.045],size:[eyeR*2.8,.012,.018],bone:'head',region:'brow_l',part:'face'});
  addBox(g,{center:[eyeX,eyeY+eyeR*1.7,front-.045],size:[eyeR*2.8,.012,.018],bone:'head',region:'brow_r',part:'face'});
  const mouthY=d.headCenter-d.headHeight*.17,mouthW=d.headHeight*(.11+(p(m,'face.mouth_width')-.5)*.055);
  addEllipsoid(g,{center:[0,mouthY,front-.04],radii:[mouthW,d.headHeight*.018,d.headHeight*.018],bone:'jaw',region:'mouth',part:'face',segments:profile.segments,rings:3});
}

function addHair(g,d,profile,parts){
  if(!parts.has('hair'))return;
  const hair=getHairFamily(d.genome.appearance_loadout.hair_family),count=Math.max(3,Math.min(hair.segments,profile.hairSegments));
  addEllipsoid(g,{center:[0,d.headCenter+d.headHeight*.055,.01],radii:[d.faceWidth*1.08,d.faceLength*.56,d.faceWidth*.86],bone:'hair_back',region:'hair_cap',part:'hair',segments:profile.segments,rings:Math.max(3,profile.rings-1)});
  for(let index=0;index<count;index++){
    const t=count===1?0:index/(count-1),x=(t-.5)*d.faceWidth*1.7,length=d.headHeight*(.25+(index%3)*.045),side=Math.abs(t-.5)>.3;
    addEllipsoid(g,{center:[x,d.headCenter+d.headHeight*.02,-d.faceWidth*.68],radii:[d.headHeight*.025,length,d.headHeight*.035],bone:'hair_back',region:'hair_lock',part:'hair',segments:profile.limbSegments,rings:3});
    if(side&&hair.geometry.includes('long'))addEllipsoid(g,{center:[x*1.08,d.headCenter-d.headHeight*.35,.02],radii:[d.headHeight*.035,d.headHeight*.38,d.headHeight*.045],bone:'hair_back',region:'hair_back',part:'hair',segments:profile.limbSegments,rings:3});
  }
  if(hair.geometry==='ponytail')addEllipsoid(g,{center:[0,d.headCenter-d.headHeight*.28,d.faceWidth*.78],radii:[.055,d.headHeight*.48,.06],bone:'hair_back',region:'hair_back',part:'hair',segments:profile.limbSegments,rings:4});
}

function addCostume(g,d,profile,parts){
  if(!parts.has('costume'))return;
  const costume=getCostumeFamily(d.genome.appearance_loadout.costume_family),long=costume.parts.some(item=>item.includes('long')||item.includes('formal'));
  addEllipsoid(g,{center:[0,1.08,.01],radii:[d.shoulder*1.08,.42,.165],bone:'chest',region:'costume_torso',part:'costume',segments:profile.segments,rings:profile.rings});
  if(long){addBox(g,{center:[-.12,.62,.03],size:[.22,.72,.12],bone:'coat_back',region:'coat_tail_l',part:'costume'});addBox(g,{center:[.12,.62,.03],size:[.22,.72,.12],bone:'coat_back',region:'coat_tail_r',part:'costume'})}
  addBox(g,{center:[0,1.18,-.18],size:[.075,.075,.018],bone:'chest',region:'emblem',part:'costume'});
}

function quality(lod){return lod===0?{segments:12,rings:5,limbSegments:8,limbRings:3,hairSegments:8}:lod===1?{segments:9,rings:4,limbSegments:7,limbRings:3,hairSegments:6}:{segments:6,rings:3,limbSegments:5,limbRings:2,hairSegments:4}}

function genericFaceDelta(id,index,{x,y,z,region},d){
  const headY=d.headCenter,headH=d.headHeight,side=x<0?-1:1,front=z<0?1:.35,relativeY=(y-headY)/headH;
  if(!['face','nose','ear_l','ear_r','eye_l','eye_r','brow_l','brow_r','mouth'].includes(region))return[0,0,0];
  const amount=.006+(index%5)*.0015;
  if(id.includes('width')||id.includes('spacing'))return[x===0?0:side*amount*(region.includes('eye')?1.2:1),0,0];
  if(id.includes('height')||id.includes('length'))return[0,amount*(relativeY>=0?1:-.55),0];
  if(id.includes('angle'))return[0,side*amount*.45,region.includes('jaw')?amount*.2:0];
  if(id.includes('projection')||id.includes('bridge')||id.includes('depth'))return[0,0,-amount*front];
  if(id.includes('size'))return[side*amount*.7,amount*.35,-amount*.25];
  if(id.includes('lip')||id.includes('mouth')||id.includes('philtrum'))return region==='mouth'?[side*amount,amount*.3,-amount*.5]:[0,0,0];
  return[side*amount*.4,amount*(relativeY+.2),-amount*.25*front];
}

function expressionDelta(id,index,{x,region},d){
  const side=x<0?-1:1,a=.006+(index%3)*.002;
  if(region==='mouth'){
    if(id==='restrained_smile'||id==='calm')return[side*a*.4,a,0];
    if(id==='sad')return[side*a*.2,-a,0];
    if(id==='surprised')return[0,side===1?a*.2:-a*.2,-a];
    if(id==='angry'||id==='focused')return[side*-a*.25,-a*.2,0];
    return[0,a*.15,-a*.1];
  }
  if(region.startsWith('brow'))return[0,(id==='angry'||id==='focused'?-a:id==='surprised'?a:a*.2)* (region.endsWith('_l')?1:.94),0];
  if(region.startsWith('eye'))return[0,id==='surprised'?a*.55:id==='calm'?-a*.25:0,0];
  return[0,0,0];
}

function visemeDelta(id,index,{x,region}){
  if(region!=='mouth')return[0,0,0];const side=x<0?-1:1,a=.004+(index%4)*.0015;
  if(id==='closed'||id==='M_B_P')return[side*-a*.2,-a*.45,a*.15];
  if(id==='A'||id==='O')return[side*(id==='O'?-a*.45:a*.35),-a,-a*.45];
  if(id==='I'||id==='E')return[side*a,-a*.35,-a*.2];
  if(id==='U'||id==='R')return[side*-a*.55,-a*.5,-a*.7];
  if(id==='F_V'||id==='L'||id==='N_D_T')return[side*a*.15,-a*.65,-a*.3];
  if(id==='S_Z'||id==='SH_CH')return[side*a*.3,-a*.42,-a*.4];
  return[side*a*.2,-a*.18,-a*.15];
}

function createMorphTargets(g,d){
  const definitions=[...d.genome.semantic_morph_graph.parameters.filter(item=>item.parameter_id.startsWith('face.')).map((item,index)=>({id:item.parameter_id.split('.').at(-1),source:item.parameter_id,category:'identity',index})),...EXPRESSION_MORPHS.map((id,index)=>({id,source:`expression.${id}`,category:'expression',index})),...VISEME_MORPHS.map((id,index)=>({id,source:`viseme.${id}`,category:'viseme',index}))];
  return definitions.map(definition=>{
    const positions=new Array(g.positions.length).fill(0);let nonzero=0,maxDelta=0;
    for(let offset=0;offset<g.positions.length;offset+=3){const vertex={x:g.positions[offset],y:g.positions[offset+1],z:g.positions[offset+2],region:g.regions[offset/3]};let delta;
      if(definition.category==='identity')delta=genericFaceDelta(definition.id,definition.index,vertex,d);else if(definition.category==='expression')delta=expressionDelta(definition.id,definition.index,vertex,d);else delta=visemeDelta(definition.id,definition.index,vertex,d);
      positions[offset]=delta[0];positions[offset+1]=delta[1];positions[offset+2]=delta[2];const magnitude=Math.hypot(...delta);if(magnitude>1e-8)nonzero++;maxDelta=Math.max(maxDelta,magnitude);
    }
    return{...definition,positions,defaultWeight:0,nonzero_vertex_count:nonzero,max_delta:maxDelta};
  });
}

export function buildCharacterGeometry(genome,{lod=0,parts=['body','face','hair','costume']}={}){
  const g=geometry(),d={...dimensions(genome),genome},profile=quality(lod),partSet=new Set(parts);addBody(g,d,profile,partSet);addFace(g,d,profile,partSet);addHair(g,d,profile,partSet);addCostume(g,d,profile,partSet);
  g.morphTargets=partSet.has('face')?createMorphTargets(g,d):[];g.topology='triangle-list';
  return{geometry:g,dimensions:{height:d.height,head_body_ratio:d.headRatio,head_height:d.headHeight,shoulder_width:d.shoulder*2},profile:`character-genome-reference-lod${lod}`,lod};
}

function identityMatrices(count){const matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];return Array.from({length:count},()=>matrix).flat()}

export function encodeCharacterGlb(genome,built,{name='character',role='assembled-character'}={}){
  const g=built.geometry,builder=new GlbBuilder(),bounds=minMax(g.positions,3);
  const position=builder.addAccessor(encodeFloat32(g.positions),{componentType:5126,type:'VEC3',count:g.positions.length/3,target:34962,min:bounds.min,max:bounds.max}),normal=builder.addAccessor(encodeFloat32(g.normals),{componentType:5126,type:'VEC3',count:g.normals.length/3,target:34962}),uv=builder.addAccessor(encodeFloat32(g.uvs),{componentType:5126,type:'VEC2',count:g.uvs.length/2,target:34962}),joints=builder.addAccessor(encodeUint16(g.joints),{componentType:5123,type:'VEC4',count:g.joints.length/4,target:34962}),weights=builder.addAccessor(encodeFloat32(g.weights),{componentType:5126,type:'VEC4',count:g.weights.length/4,target:34962}),indices=builder.addAccessor(encodeUint16(g.indices),{componentType:5123,type:'SCALAR',count:g.indices.length,target:34963,min:[0],max:[Math.max(...g.indices)]});
  const targets=g.morphTargets.filter(item=>item.nonzero_vertex_count>0),targetAccessors=targets.map(target=>builder.addAccessor(encodeFloat32(target.positions),{componentType:5126,type:'VEC3',count:target.positions.length/3,target:34962})),ibm=builder.addAccessor(encodeFloat32(identityMatrices(CHARACTER_BONES.length)),{componentType:5126,type:'MAT4',count:CHARACTER_BONES.length});
  const material={name:'anime-npr-reference',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:.05,roughnessFactor:.72},emissiveFactor:[0,0,0],doubleSided:false,extras:{ragf:{material_authority:'textures/base-color.png',style_profile:genome.style_genome.style_profile,line_profile:genome.style_genome.line_profile}}};
  const nodes=CHARACTER_BONES.map(bone=>({name:bone.name,children:[]}));for(let index=0;index<CHARACTER_BONES.length;index++){const parent=CHARACTER_BONES[index].parent;if(parent)nodes[boneIndex[parent]].children.push(index)}const meshNode=nodes.length;nodes.push({name,mesh:0,skin:0});nodes[0].children.push(meshNode);
  const geometryAuthorityRoot=role==='module-body'
    ? rootHash({topology_family:genome.topology_family,body:genome.body_genome})
    : role==='module-face'
      ? genome.identity_root
      : role==='module-hair'
        ? rootHash({identity_root:genome.identity_root,hair_family:genome.appearance_loadout.hair_family})
        : role==='module-costume'
          ? rootHash({topology_family:genome.topology_family,body:genome.body_genome,costume_family:genome.appearance_loadout.costume_family})
          : rootHash({identity_root:genome.identity_root,body:genome.body_genome,hair_family:genome.appearance_loadout.hair_family,costume_family:genome.appearance_loadout.costume_family});
  const json={asset:{version:'2.0',generator:'TaoWind Character Phenotype Compiler v0.1'},scene:0,scenes:[{nodes:[0]}],nodes,meshes:[{name,primitives:[{attributes:{POSITION:position,NORMAL:normal,TEXCOORD_0:uv,JOINTS_0:joints,WEIGHTS_0:weights},indices,material:0,...(targetAccessors.length?{targets:targetAccessors.map(accessor=>({POSITION:accessor}))}:{})}],weights:targetAccessors.map(()=>0),extras:{targetNames:targets.map(item=>item.id),targetCategories:Object.fromEntries(targets.map(item=>[item.id,item.category]))}}],materials:[material],skins:[{name:'rncs.anime-humanoid-v0.1',inverseBindMatrices:ibm,skeleton:0,joints:CHARACTER_BONES.map((_,index)=>index)}],buffers:[{byteLength:builder.binary().length}],bufferViews:builder.bufferViews,accessors:builder.accessors,extras:{rncs:{character_id:genome.character_id,identity_root:genome.identity_root,geometry_authority_root:geometryAuthorityRoot,topology_family:genome.topology_family,lod:built.lod,role,morph_count:targets.length}}};
  const glb=encodeGlb(json,builder.binary()),inspection=inspectGlb(glb);
  return{buffer:glb,metadata:{format:'ragf.character-mesh.v0.1',role,name,lod:built.lod,vertex_count:g.positions.length/3,triangle_count:g.indices.length/3,bone_count:CHARACTER_BONES.length,morph_target_count:targets.length,identity_morph_count:targets.filter(item=>item.category==='identity').length,expression_morph_count:targets.filter(item=>item.category==='expression').length,viseme_morph_count:targets.filter(item=>item.category==='viseme').length,morph_stats:targets.map(({id,source,category,nonzero_vertex_count,max_delta})=>({id,source,category,nonzero_vertex_count,max_delta})),bounds,dimensions:built.dimensions,glb_valid:inspection.valid,glb_errors:inspection.errors,glb_root:inspection.root,topology_family:genome.topology_family,parts:[...new Set(g.parts)]},geometry:g};
}

export function generateCharacterGeometrySet(genome){
  const lods=[0,1,2].map(lod=>{const built=buildCharacterGeometry(genome,{lod}),encoded=encodeCharacterGlb(genome,built,{name:`${genome.character_id}:lod${lod}`,role:`character-lod${lod}`});return{...encoded,lod}}),mainBuilt=buildCharacterGeometry(genome,{lod:0}),main=encodeCharacterGlb(genome,mainBuilt,{name:`${genome.character_id}:main`,role:'character'}),modules={};
  for(const part of ['body','face','hair','costume']){const built=buildCharacterGeometry(genome,{lod:0,parts:[part]});modules[part]=encodeCharacterGlb(genome,built,{name:`${genome.character_id}:${part}`,role:`module-${part}`})}
  return{main,lods,modules,rig:{format:'ragf.character-rig.v0.1',profile:'rncs.anime-humanoid-v0.1',bones:CHARACTER_BONES,sockets:[{id:'weapon-back-right',bone:'chest',translation:[.18,.1,.08]},{id:'weapon-hip-left',bone:'hips',translation:[-.18,0,.05]},{id:'emblem',bone:'chest',translation:[0,.08,-.17]}],facial_channels:{jaw:'jaw',eyes:['eye_l','eye_r'],morph_authority:'character-genome'},secondary_motion:{hair:['hair_back'],costume:['coat_back']},rig_root:rootHash({character_id:genome.character_id,bones:CHARACTER_BONES})}};
}
