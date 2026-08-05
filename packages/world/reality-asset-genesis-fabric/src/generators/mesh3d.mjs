import {GlbBuilder,encodeFloat32,encodeUint16,minMax,encodeGlb,inspectGlb} from '../gltf.mjs';
import {parseHex} from '../png.mjs';
import {rootHash,seal} from '../canonical.mjs';

const TAU=Math.PI*2;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const normalize=(v)=>{const length=Math.hypot(...v)||1;return v.map(x=>x/length);};
const colorFactor=(hex)=>parseHex(hex).slice(0,3).map(value=>value/255).concat(1);
const quatX=angle=>[Math.sin(angle/2),0,0,Math.cos(angle/2)];
const quatY=angle=>[0,Math.sin(angle/2),0,Math.cos(angle/2)];
const quatZ=angle=>[0,0,Math.sin(angle/2),Math.cos(angle/2)];

function addVertex(g,position,normal,uv,bone){
  g.positions.push(...position);
  g.normals.push(...normalize(normal));
  g.uvs.push(uv[0],uv[1]);
  g.joints.push(bone,0,0,0);
  g.weights.push(1,0,0,0);
}

function addBox(g,{center=[0,0,0],size=[1,1,1],bone=0,uvOffset=[0,0],uvScale=[1,1]}={}){
  const [cx,cy,cz]=center,[sx,sy,sz]=size.map(value=>value/2),[uo,vo]=uvOffset,[us,vs]=uvScale;
  const faces=[
    [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],
    [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
    [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],
    [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
    [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],
    [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]]
  ];
  for(const face of faces){
    const base=g.positions.length/3;
    for(let index=0;index<4;index++){
      const vertex=face[index];
      addVertex(g,[cx+vertex[0]*sx,cy+vertex[1]*sy,cz+vertex[2]*sz],face[4],[uo+(index===0||index===3?0:1)*us,vo+(index<2?0:1)*vs],bone);
    }
    g.indices.push(base,base+1,base+2,base,base+2,base+3);
  }
}

function addEllipsoid(g,{center=[0,0,0],radii=[1,1,1],bone=0,segments=12,rings=5,uvOffset=[0,0],uvScale=[1,1]}={}){
  const base=g.positions.length/3,[cx,cy,cz]=center,[rx,ry,rz]=radii,[uo,vo]=uvOffset,[us,vs]=uvScale;
  for(let ring=0;ring<=rings;ring++){
    const v=ring/rings,theta=v*Math.PI,sinTheta=Math.sin(theta),cosTheta=Math.cos(theta);
    for(let segment=0;segment<=segments;segment++){
      const u=segment/segments,phi=u*TAU,cosPhi=Math.cos(phi),sinPhi=Math.sin(phi);
      const local=[sinTheta*cosPhi,cosTheta,sinTheta*sinPhi];
      addVertex(g,[cx+local[0]*rx,cy+local[1]*ry,cz+local[2]*rz],[local[0]/Math.max(rx,.0001),local[1]/Math.max(ry,.0001),local[2]/Math.max(rz,.0001)],[uo+u*us,vo+v*vs],bone);
    }
  }
  for(let ring=0;ring<rings;ring++)for(let segment=0;segment<segments;segment++){
    const a=base+ring*(segments+1)+segment,b=a+1,c=a+segments+1,d=c+1;
    g.indices.push(a,b,c,b,d,c);
  }
}

function qualityProfile(variant,lod,budget){
  const presets={
    mobile:{segments:10,rings:4,limbSegments:8,limbRings:3,features:2},
    balanced:{segments:14,rings:5,limbSegments:10,limbRings:3,features:3},
    cinematic:{segments:18,rings:6,limbSegments:13,limbRings:4,features:4}
  };
  const base=presets[variant]??presets.balanced;
  const scale=Math.min(1,Math.max(.58,Math.sqrt(Math.max(12,budget??2400)/2400)));
  return{
    profile:`humanoid-rounded-v0.4-${variant}`,
    segments:Math.max(6,Math.floor(base.segments*scale)-lod*2),
    rings:Math.max(3,Math.floor(base.rings*scale)-Math.min(lod,1)),
    limbSegments:Math.max(6,Math.floor(base.limbSegments*scale)-lod),
    limbRings:Math.max(3,Math.floor(base.limbRings*scale)),
    featureLevel:Math.max(0,base.features-lod),
    lod
  };
}

function buildGeometry(profile){
  const g={positions:[],normals:[],uvs:[],joints:[],weights:[],indices:[]};
  const {segments,rings,limbSegments,limbRings,featureLevel}=profile;
  addEllipsoid(g,{center:[0,1.58,0],radii:[.39,.52,.27],bone:2,segments,rings,uvOffset:[0,.18],uvScale:[1,.5]});
  addEllipsoid(g,{center:[0,1.12,0],radii:[.34,.24,.24],bone:1,segments, rings:Math.max(3,rings-1),uvOffset:[0,.62],uvScale:[1,.28]});
  addEllipsoid(g,{center:[0,2.32,0],radii:[.27,.32,.25],bone:3,segments,rings,uvOffset:[0,.02],uvScale:[1,.28]});
  addEllipsoid(g,{center:[0,2.03,0],radii:[.16,.16,.16],bone:2,segments:limbSegments,rings:limbRings,uvOffset:[.5,.1],uvScale:[.5,.18]});
  addEllipsoid(g,{center:[-.43,1.57,0],radii:[.12,.39,.12],bone:4,segments:limbSegments,rings:limbRings,uvOffset:[0,.42],uvScale:[.5,.38]});
  addEllipsoid(g,{center:[.43,1.57,0],radii:[.12,.39,.12],bone:5,segments:limbSegments,rings:limbRings,uvOffset:[.5,.42],uvScale:[.5,.38]});
  addEllipsoid(g,{center:[-.18,.65,0],radii:[.15,.56,.15],bone:6,segments:limbSegments,rings:limbRings,uvOffset:[0,.78],uvScale:[.5,.22]});
  addEllipsoid(g,{center:[.18,.65,0],radii:[.15,.56,.15],bone:7,segments:limbSegments,rings:limbRings,uvOffset:[.5,.78],uvScale:[.5,.22]});
  addEllipsoid(g,{center:[-.18,.13,-.06],radii:[.18,.19,.27],bone:6,segments:limbSegments,rings:Math.max(3,limbRings-1),uvOffset:[0,.88],uvScale:[.5,.12]});
  addEllipsoid(g,{center:[.18,.13,-.06],radii:[.18,.19,.27],bone:7,segments:limbSegments,rings:Math.max(3,limbRings-1),uvOffset:[.5,.88],uvScale:[.5,.12]});
  if(featureLevel>=1){
    addEllipsoid(g,{center:[-.37,1.86,0],radii:[.19,.12,.2],bone:4,segments:limbSegments,rings:3,uvOffset:[0,.3],uvScale:[.5,.16]});
    addEllipsoid(g,{center:[.37,1.86,0],radii:[.19,.12,.2],bone:5,segments:limbSegments,rings:3,uvOffset:[.5,.3],uvScale:[.5,.16]});
    addEllipsoid(g,{center:[0,2.5,-.02],radii:[.29,.23,.27],bone:3,segments:limbSegments,rings:3,uvOffset:[0,.02],uvScale:[1,.18]});
    addEllipsoid(g,{center:[-.25,2.27,-.01],radii:[.09,.3,.12],bone:3,segments:Math.max(6,limbSegments-2),rings:3,uvOffset:[.05,.05],uvScale:[.25,.2]});
    addEllipsoid(g,{center:[.25,2.27,-.01],radii:[.09,.3,.12],bone:3,segments:Math.max(6,limbSegments-2),rings:3,uvOffset:[.7,.05],uvScale:[.25,.2]});
  }
  if(featureLevel>=2){
    addEllipsoid(g,{center:[0,1.68,-.265],radii:[.25,.28,.045],bone:2,segments:limbSegments,rings:3,uvOffset:[.25,.25],uvScale:[.5,.18]});
    addEllipsoid(g,{center:[-.43,1.18,0],radii:[.14,.1,.14],bone:4,segments:Math.max(6,limbSegments-2),rings:3,uvOffset:[0,.55],uvScale:[.3,.15]});
    addEllipsoid(g,{center:[.43,1.18,0],radii:[.14,.1,.14],bone:5,segments:Math.max(6,limbSegments-2),rings:3,uvOffset:[.7,.55],uvScale:[.3,.15]});
    addBox(g,{center:[0,1.38,.27],size:[.42,.32,.06],bone:2,uvOffset:[.25,.44],uvScale:[.5,.12]});
  }
  if(featureLevel>=3){
    addBox(g,{center:[.55,1.42,0],size:[.08,.24,.08],bone:5,uvOffset:[.55,.58],uvScale:[.1,.12]});
    addBox(g,{center:[.65,1.98,0],size:[.07,.92,.07],bone:5,uvOffset:[.6,.7],uvScale:[.08,.28]});
    addBox(g,{center:[.65,2.48,0],size:[.22,.12,.08],bone:5,uvOffset:[.62,.92],uvScale:[.22,.08]});
    addEllipsoid(g,{center:[0,1.42,.28],radii:[.42,.34,.04],bone:2,segments:limbSegments,rings:3,uvOffset:[.25,.56],uvScale:[.5,.14]});
  }
  if(featureLevel>=4){
    addEllipsoid(g,{center:[0,2.6,.02],radii:[.08,.1,.08],bone:3,segments:Math.max(6,limbSegments-2),rings:3,uvOffset:[.45,.02],uvScale:[.1,.08]});
    addBox(g,{center:[-.31,2.27,-.04],size:[.04,.22,.16],bone:3,uvOffset:[.1,.05],uvScale:[.06,.16]});
    addBox(g,{center:[.31,2.27,-.04],size:[.04,.22,.16],bone:3,uvOffset:[.84,.05],uvScale:[.06,.16]});
  }
  const morphPositions=new Array(g.positions.length).fill(0);
  for(let index=0;index<g.positions.length;index+=3){
    const x=g.positions[index],y=g.positions[index+1],z=g.positions[index+2];
    if(y>2.08&&Math.abs(x)<.24){
      const weight=(1-Math.min(1,Math.abs(x)/.24))*.018;
      morphPositions[index+2]=weight*(z<=0?.65:1);
      morphPositions[index+1]=Math.sin((y-2.08)*Math.PI)*.006;
    }
  }
  g.morphTargets=[{id:'expression-soft-smile',positions:morphPositions,defaultWeight:0}];
  return g;
}

const inverseTranslation=(x=0,y=0,z=0)=>[1,0,0,0,0,1,0,0,0,0,1,0,-x,-y,-z,1];

function addAnimationAccessors(builder,channels){
  return channels.map(channel=>{
    const input=builder.addAccessor(encodeFloat32(channel.times),{componentType:5126,type:'SCALAR',count:channel.times.length,min:[channel.times[0]],max:[channel.times.at(-1)]});
    const type=channel.path==='rotation'?'VEC4':'VEC3';
    const output=builder.addAccessor(encodeFloat32(channel.values.flat()),{componentType:5126,type,count:channel.values.length});
    return{input,output,interpolation:channel.interpolation??'LINEAR',target:{node:channel.node,path:channel.path}};
  });
}

function buildAnimations(builder){
  const animations=[];
  const add=(name,channels)=>{const samplers=addAnimationAccessors(builder,channels);animations.push({name,samplers,channels:samplers.map((sampler,index)=>({sampler:index,target:sampler.target}))});};
  add('idle',[
    {node:2,path:'translation',times:[0,.5,1],values:[[0,.55,0],[0,.565,0],[0,.55,0]]},
    {node:3,path:'rotation',times:[0,.5,1],values:[quatZ(-.015),quatZ(.015),quatZ(-.015)]}
  ]);
  add('move',[
    {node:4,path:'rotation',times:[0,.36,.72],values:[quatZ(.28),quatZ(-.28),quatZ(.28)]},
    {node:5,path:'rotation',times:[0,.36,.72],values:[quatZ(-.28),quatZ(.28),quatZ(-.28)]},
    {node:6,path:'rotation',times:[0,.36,.72],values:[quatX(-.32),quatX(.32),quatX(-.32)]},
    {node:7,path:'rotation',times:[0,.36,.72],values:[quatX(.32),quatX(-.32),quatX(.32)]}
  ]);
  add('attack',[
    {node:2,path:'rotation',times:[0,.2,.52,1],values:[quatY(0),quatY(-.08),quatY(.18),quatY(0)]},
    {node:5,path:'rotation',times:[0,.2,.52,.66,1],values:[quatZ(-.15),quatZ(-.55),quatZ(.75),quatZ(.3),quatZ(-.15)]}
  ]);
  add('hit',[
    {node:2,path:'rotation',times:[0,.08,.42],values:[quatZ(0),quatZ(-.16),quatZ(0)]},
    {node:3,path:'rotation',times:[0,.08,.42],values:[quatX(0),quatX(-.12),quatX(0)]}
  ]);
  return animations;
}

function embedPbrTextures(builder,pbr){
  const files=new Map((pbr?.files??[]).map(file=>[file.role,file]));
  const roles=['base-color','normal','occlusion-roughness-metallic','emissive'];
  const images=[],textures=[];
  for(const role of roles){
    const file=files.get(role);
    if(!file)continue;
    images.push({name:file.name,mimeType:file.mime,bufferView:builder.addBuffer(file.buffer)});
    textures.push({name:`${role}:${file.name}`,sampler:0,source:images.length-1});
  }
  const textureIndex=role=>{const index=roles.indexOf(role);return index>=0&&index<textures.length?index:null;};
  return{images,textures,textureIndex};
}

export function generateMesh3d({genome,variant,lod=0,pbr=null}){
  const quality=qualityProfile(variant,lod,genome.budgets.max_triangles),g=buildGeometry(quality),builder=new GlbBuilder(),mm=minMax(g.positions,3);
  const position=builder.addAccessor(encodeFloat32(g.positions),{componentType:5126,type:'VEC3',count:g.positions.length/3,target:34962,min:mm.min,max:mm.max});
  const normal=builder.addAccessor(encodeFloat32(g.normals),{componentType:5126,type:'VEC3',count:g.normals.length/3,target:34962});
  const uv=builder.addAccessor(encodeFloat32(g.uvs),{componentType:5126,type:'VEC2',count:g.uvs.length/2,target:34962});
  const joints=builder.addAccessor(encodeUint16(g.joints),{componentType:5123,type:'VEC4',count:g.joints.length/4,target:34962});
  const weights=builder.addAccessor(encodeFloat32(g.weights),{componentType:5126,type:'VEC4',count:g.weights.length/4,target:34962});
  const indices=builder.addAccessor(encodeUint16(g.indices),{componentType:5123,type:'SCALAR',count:g.indices.length,target:34963,min:[0],max:[Math.max(...g.indices)]});
  const morphAccessors=(g.morphTargets??[]).map(target=>builder.addAccessor(encodeFloat32(target.positions),{componentType:5126,type:'VEC3',count:target.positions.length/3,target:34962}));
  const bindWorld=[[0,0,0],[0,1,0],[0,1.55,0],[0,2.2,0],[-.35,1.9,0],[.35,1.9,0],[-.18,.45,0],[.18,.45,0]];
  const ibm=builder.addAccessor(encodeFloat32(bindWorld.map(value=>inverseTranslation(...value)).flat()),{componentType:5126,type:'MAT4',count:8});
  const animations=buildAnimations(builder),textureBinding=embedPbrTextures(builder,pbr),palette=genome.visual.palette;
  const baseColor=pbr?colorFactor(palette[0]):[1,1,1,1],emissive=pbr?colorFactor(palette[2]??palette[0]):[0,0,0,1];
  const baseTexture=textureBinding.textureIndex('base-color'),normalTexture=textureBinding.textureIndex('normal'),ormTexture=textureBinding.textureIndex('occlusion-roughness-metallic'),emissiveTexture=textureBinding.textureIndex('emissive');
  const material={name:`${genome.semantics.element}-stylized-pbr`,pbrMetallicRoughness:{baseColorFactor:baseColor,metallicFactor:variant==='cinematic'?.42:.18,roughnessFactor:variant==='mobile'?.72:.5,...(baseTexture===null?{}:{baseColorTexture:{index:baseTexture}}),...(ormTexture===null?{}:{metallicRoughnessTexture:{index:ormTexture}})},...(normalTexture===null?{}:{normalTexture:{index:normalTexture,scale:variant==='mobile'?.75:1}}),...(ormTexture===null?{}:{occlusionTexture:{index:ormTexture,strength:.86}}),...(emissiveTexture===null?{}:{emissiveTexture:{index:emissiveTexture}}),emissiveFactor:emissive,emissiveStrength:variant==='cinematic'?.75:.4,doubleSided:false,extras:{ragf:{quality_profile:quality.profile,material_root:pbr?.metadata?.pack_root??null}}};
  const nodes=[
    {name:'Armature',children:[1,8]},
    {name:'hips',children:[2,6,7],translation:[0,1,0]},
    {name:'spine',children:[3,4,5],translation:[0,.55,0]},
    {name:'head',translation:[0,.65,0]},
    {name:'arm_l',translation:[-.35,.35,0]},
    {name:'arm_r',translation:[.35,.35,0]},
    {name:'leg_l',translation:[-.18,-.55,0]},
    {name:'leg_r',translation:[.18,-.55,0]},
    {name:'mesh',mesh:0,skin:0}
  ];
  const json={
    asset:{version:'2.0',generator:'TaoWind RAGF v0.4 deterministic rounded 3D'},
    scene:0,scenes:[{nodes:[0]}],nodes,
    meshes:[{name:genome.identity.name,primitives:[{attributes:{POSITION:position,NORMAL:normal,TEXCOORD_0:uv,JOINTS_0:joints,WEIGHTS_0:weights},indices,material:0,...(morphAccessors.length?{targets:morphAccessors.map(accessor=>({POSITION:accessor}))}:{})}],weights:morphAccessors.length?[0]:undefined}],
    materials:[material],
    skins:[{name:'humanoid-rounded-v0.4',inverseBindMatrices:ibm,skeleton:0,joints:[0,1,2,3,4,5,6,7]}],
    animations,
    ...(textureBinding.images.length?{samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],images:textureBinding.images,textures:textureBinding.textures}:{}),
    buffers:[{byteLength:builder.binary().length}],bufferViews:builder.bufferViews,accessors:builder.accessors,
    extras:{ragf:{asset_id:genome.identity.asset_id,variant,lod,geometry_profile:quality.profile,feature_level:quality.featureLevel,pbr_embedded:textureBinding.images.length===4,morph_targets:(g.morphTargets??[]).map(target=>target.id)}}
  };
  const binary=builder.binary(),glb=encodeGlb(json,binary),inspection=inspectGlb(glb);
  const metadata={format:'reality-asset.mesh-3d.v0.4',asset_id:genome.identity.asset_id,variant,lod,vertex_count:g.positions.length/3,triangle_count:g.indices.length/3,bone_count:8,animation_count:inspection.animation_count,morph_target_count:morphAccessors.length,embedded_texture_count:textureBinding.images.length,bounds:{min:mm.min,max:mm.max},glb_root:inspection.root,gltf_version:'2.0',rigged:true,pbr:true,quality_profile:quality.profile,feature_level:quality.featureLevel,material_root:pbr?.metadata?.pack_root??null};
  return{glb,metadata,geometry:{...g,topology:'triangle-list'}};
}

export function generateLodManifest({genome,variant,meshes}){
  const maxTriangles=genome.budgets.max_triangles;
  return seal({format:'reality-asset.lod-manifest.v0.4',asset_id:genome.identity.asset_id,variant,levels:meshes.map((mesh,lod)=>({lod,role:lod===0?'mesh-glb':`mesh-lod${lod}-glb`,triangle_count:mesh.metadata.triangle_count,triangle_budget:lod===0?maxTriangles:Math.max(12,Math.floor(maxTriangles*(lod===1?.45:.18))),screen_coverage:lod===0?1:lod===1?.45:.16,geometric_error:lod===0?0:lod===1?.018:.055,glb_root:mesh.metadata.glb_root,quality_profile:mesh.metadata.quality_profile})),policy:{selection:'screen-coverage',cross_fade:true,geometry:'rounded-humanoid-progressive-detail',min_resident_level:2},lod_root:''},'lod_root');
}
