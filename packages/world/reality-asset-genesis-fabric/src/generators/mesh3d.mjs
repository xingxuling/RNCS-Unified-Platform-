import {GlbBuilder,encodeFloat32,encodeUint16,minMax,encodeGlb,inspectGlb} from '../gltf.mjs';
import {parseHex} from '../png.mjs';
import {rootHash,seal} from '../canonical.mjs';
import {isRiggedAssetKind,isCreatureAssetKind} from '../contracts.mjs';
import {CREATURE_BONE_WORLD,CREATURE_PROFILE,createCreatureAnimationClips} from './creature-profile.mjs';

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
  if(g.joints){
    g.joints.push(bone,0,0,0);
    g.weights.push(1,0,0,0);
  }
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

function qualityProfile(variant,lod,budget,rigged=true,creature=false){
  const presets={
    mobile:{segments:10,rings:4,limbSegments:8,limbRings:3,features:2},
    balanced:{segments:14,rings:5,limbSegments:10,limbRings:3,features:3},
    cinematic:{segments:18,rings:6,limbSegments:13,limbRings:4,features:4}
  };
  const base=presets[variant]??presets.balanced;
  const scale=Math.min(1,Math.max(.58,Math.sqrt(Math.max(12,budget??2400)/2400)));
  return{
    profile:`${creature?CREATURE_PROFILE:rigged?'humanoid-rounded-v0.4':'family-static-v0.1'}-${variant}`,
    segments:Math.max(6,Math.floor(base.segments*scale)-lod*2),
    rings:Math.max(3,Math.floor(base.rings*scale)-Math.min(lod,1)),
    limbSegments:Math.max(6,Math.floor(base.limbSegments*scale)-lod),
    limbRings:Math.max(3,Math.floor(base.limbRings*scale)),
    featureLevel:Math.max(0,base.features-lod),
    lod
  };
}

function buildStaticGeometry(kind,profile){
  const g={positions:[],normals:[],uvs:[],indices:[]};
  const {segments,rings,limbSegments,limbRings,featureLevel}=profile;
  const assetKind=String(kind??'prop-3d').toLowerCase();
  if(assetKind==='vehicle-3d'){
    addBox(g,{center:[0,.62,0],size:[2.5,.5,1.2],uvOffset:[0,.2],uvScale:[1,.42]});
    addBox(g,{center:[-.34,1.02,0],size:[1.25,.48,1.02],uvOffset:[0,.02],uvScale:[.52,.28]});
    addBox(g,{center:[.72,.87,0],size:[.55,.22,1.05],uvOffset:[.52,.28],uvScale:[.3,.16]});
    for(const x of [-.82,.82])for(const z of [-.62,.62])addEllipsoid(g,{center:[x,.34,z],radii:[.25,.34,.16],segments:limbSegments,rings:limbRings,uvOffset:[.08,.7],uvScale:[.22,.2]});
    if(featureLevel>=1){
      addBox(g,{center:[-1.28,.64,0],size:[.12,.2,1.02],uvOffset:[.75,.42],uvScale:[.12,.2]});
      addBox(g,{center:[1.28,.64,0],size:[.12,.2,1.02],uvOffset:[.88,.42],uvScale:[.12,.2]});
    }
    return g;
  }
  if(assetKind==='structure-3d'){
    addBox(g,{center:[0,.14,0],size:[3.1,.28,2.45],uvOffset:[0,.72],uvScale:[1,.18]});
    addBox(g,{center:[0,1.32,0],size:[2.5,2.1,1.9],uvOffset:[0,.12],uvScale:[1,.6]});
    for(const x of [-1.15,1.15])for(const z of [-.82,.82])addBox(g,{center:[x,1.45,z],size:[.28,2.35,.28],uvOffset:[.72,.12],uvScale:[.14,.62]});
    addBox(g,{center:[0,2.48,0],size:[3.05,.32,2.35],uvOffset:[0,.82],uvScale:[1,.16]});
    if(featureLevel>=1){
      addBox(g,{center:[0,1.12,-.98],size:[.72,1.55,.08],uvOffset:[.2,.35],uvScale:[.28,.4]});
      addBox(g,{center:[0,1.72,.98],size:[1.2,.45,.08],uvOffset:[.45,.35],uvScale:[.42,.18]});
    }
    if(featureLevel>=2)addBox(g,{center:[0,2.7,0],size:[1.72,.12,1.28],uvOffset:[.72,.82],uvScale:[.24,.08]});
    return g;
  }
  if(assetKind==='environment-3d'){
    addBox(g,{center:[0,-.16,0],size:[5.6,.32,4.4],uvOffset:[0,.78],uvScale:[1,.22]});
    addEllipsoid(g,{center:[-1.55,.42,.3],radii:[1.28,.82,1.05],segments,rings,uvOffset:[0,.12],uvScale:[.48,.5]});
    addEllipsoid(g,{center:[.65,.28,-.5],radii:[1.72,.6,1.3],segments,rings,uvOffset:[.48,.12],uvScale:[.52,.5]});
    addEllipsoid(g,{center:[2.05,.68,1.05],radii:[.72,1.05,.72],segments:limbSegments,rings:limbRings,uvOffset:[.12,.62],uvScale:[.28,.3]});
    if(featureLevel>=1){
      addBox(g,{center:[0,.1,1.65],size:[4.7,.18,.24],uvOffset:[.2,.9],uvScale:[.8,.08]});
      addEllipsoid(g,{center:[-2.15,.2,-1.2],radii:[.52,.42,.48],segments:limbSegments,rings:limbRings,uvOffset:[.65,.62],uvScale:[.2,.2]});
    }
    return g;
  }
  if(assetKind==='vegetation-3d'){
    addEllipsoid(g,{center:[0,1.05,0],radii:[.2,1.05,.2],segments:limbSegments,rings:limbRings,uvOffset:[0,.48],uvScale:[.24,.42]});
    addEllipsoid(g,{center:[0,2.05,0],radii:[.9,.55,.8],segments,rings,uvOffset:[.1,.02],uvScale:[.8,.34]});
    addEllipsoid(g,{center:[-.62,1.78,.12],radii:[.55,.4,.5],segments:limbSegments,rings:limbRings,uvOffset:[.54,.08],uvScale:[.4,.28]});
    addEllipsoid(g,{center:[.62,1.78,-.12],radii:[.55,.4,.5],segments:limbSegments,rings:limbRings,uvOffset:[.54,.42],uvScale:[.4,.28]});
    if(featureLevel>=1)addEllipsoid(g,{center:[0,2.56,.05],radii:[.42,.38,.4],segments:limbSegments,rings:limbRings,uvOffset:[.58,.72],uvScale:[.3,.2]});
    return g;
  }
  if(assetKind==='resource-3d'){
    addBox(g,{center:[0,.18,0],size:[1.7,.36,1.45],uvOffset:[0,.7],uvScale:[1,.2]});
    for(const [x,y,z,s] of [[-.48,.82,0,.42],[0,1.18,.12,.55],[.48,.82,-.08,.38]]){
      addBox(g,{center:[x,y,z],size:[s,.95,s*.72],uvOffset:[.2,.08],uvScale:[.22,.52]});
      addEllipsoid(g,{center:[x,y+.5,z],radii:[s*.34,.18,s*.28],segments:limbSegments,rings:limbRings,uvOffset:[.5,.08],uvScale:[.2,.16]});
    }
    return g;
  }
  // Props and unknown registered static families share a small display-object
  // archetype; URRF performs the profile registration before this path runs.
  addBox(g,{center:[0,.2,0],size:[1.35,.4,1.05],uvOffset:[0,.68],uvScale:[1,.2]});
  addEllipsoid(g,{center:[0,.88,0],radii:[.48,.62,.42],segments,rings,uvOffset:[.08,.04],uvScale:[.84,.48]});
  addBox(g,{center:[0,1.52,0],size:[.18,.42,.18],uvOffset:[.68,.08],uvScale:[.12,.24]});
  if(featureLevel>=1)addEllipsoid(g,{center:[0,1.78,0],radii:[.34,.26,.34],segments:limbSegments,rings:limbRings,uvOffset:[.6,.56],uvScale:[.3,.2]});
  return g;
}

function buildCreatureGeometry(profile){
  const g={positions:[],normals:[],uvs:[],joints:[],weights:[],indices:[]};
  const {segments,rings,limbSegments,limbRings,featureLevel}=profile;
  addEllipsoid(g,{center:[0,.93,.02],radii:[.52,.42,.98],bone:2,segments,rings,uvOffset:[0,.2],uvScale:[.55,.5]});
  addEllipsoid(g,{center:[0,.91,.67],radii:[.5,.4,.56],bone:3,segments,rings,uvOffset:[.52,.2],uvScale:[.48,.5]});
  addEllipsoid(g,{center:[0,.9,1.15],radii:[.32,.3,.42],bone:4,segments:limbSegments,rings:limbRings,uvOffset:[0,.02],uvScale:[.4,.28]});
  addEllipsoid(g,{center:[0,.9,1.45],radii:[.3,.28,.4],bone:5,segments,rings,uvOffset:[.4,.02],uvScale:[.45,.28]});
  addEllipsoid(g,{center:[0,.82,1.77],radii:[.22,.17,.3],bone:5,segments:limbSegments,rings:limbRings,uvOffset:[.78,.02],uvScale:[.22,.2]});
  addEllipsoid(g,{center:[-.22,1.16,1.48],radii:[.11,.2,.12],bone:5,segments:limbSegments,rings:limbRings,uvOffset:[.7,.3],uvScale:[.15,.18]});
  addEllipsoid(g,{center:[.22,1.16,1.48],radii:[.11,.2,.12],bone:5,segments:limbSegments,rings:limbRings,uvOffset:[.86,.3],uvScale:[.14,.18]});
  for(const side of [-1,1]){
    const frontBone=side<0?6:7,hindBone=side<0?8:9;
    addEllipsoid(g,{center:[side*.4,.55,.78],radii:[.14,.42,.14],bone:frontBone,segments:limbSegments,rings:limbRings,uvOffset:[side<0?0:.24,.56],uvScale:[.22,.32]});
    addEllipsoid(g,{center:[side*.4,.27,.88],radii:[.12,.28,.12],bone:frontBone,segments:limbSegments,rings:limbRings,uvOffset:[side<0?0:.24,.78],uvScale:[.22,.22]});
    addEllipsoid(g,{center:[side*.4,.53,-.53],radii:[.17,.46,.17],bone:hindBone,segments:limbSegments,rings:limbRings,uvOffset:[side<0?.46:.7,.56],uvScale:[.22,.32]});
    addEllipsoid(g,{center:[side*.4,.25,-.65],radii:[.13,.3,.13],bone:hindBone,segments:limbSegments,rings:limbRings,uvOffset:[side<0?.46:.7,.78],uvScale:[.22,.22]});
    addBox(g,{center:[side*.4,.07,.92],size:[.28,.14,.36],bone:frontBone,uvOffset:[side<0?.12:.34,.9],uvScale:[.2,.1]});
    addBox(g,{center:[side*.4,.07,-.7],size:[.32,.14,.4],bone:hindBone,uvOffset:[side<0?.58:.82,.9],uvScale:[.2,.1]});
  }
  addEllipsoid(g,{center:[0,.76,-1.12],radii:[.18,.18,.42],bone:10,segments:limbSegments,rings:limbRings,uvOffset:[0,.92],uvScale:[.2,.12]});
  addEllipsoid(g,{center:[0,.74,-1.48],radii:[.14,.14,.38],bone:11,segments:limbSegments,rings:limbRings,uvOffset:[.2,.92],uvScale:[.18,.1]});
  addEllipsoid(g,{center:[0,.78,-1.77],radii:[.1,.1,.3],bone:12,segments:limbSegments,rings:limbRings,uvOffset:[.38,.92],uvScale:[.16,.08]});
  if(featureLevel>=1){
    addEllipsoid(g,{center:[0,1.25,.15],radii:[.42,.18,.55],bone:2,segments:limbSegments,rings:3,uvOffset:[.52,.7],uvScale:[.28,.18]});
    addEllipsoid(g,{center:[0,1.02,-.78],radii:[.3,.2,.22],bone:1,segments:limbSegments,rings:3,uvOffset:[.8,.7],uvScale:[.2,.14]});
    addEllipsoid(g,{center:[0,.82,-2.02],radii:[.18,.14,.14],bone:12,segments:limbSegments,rings:3,uvOffset:[.56,.92],uvScale:[.16,.08]});
  }
  if(featureLevel>=2){
    addBox(g,{center:[0,1.3,.66],size:[.5,.08,.72],bone:3,uvOffset:[.2,.48],uvScale:[.3,.12]});
    addEllipsoid(g,{center:[-.25,.94,1.67],radii:[.055,.07,.06],bone:5,segments:6,rings:3,uvOffset:[.7,.52],uvScale:[.08,.06]});
    addEllipsoid(g,{center:[.25,.94,1.67],radii:[.055,.07,.06],bone:5,segments:6,rings:3,uvOffset:[.78,.52],uvScale:[.08,.06]});
  }
  if(featureLevel>=3){
    addEllipsoid(g,{center:[0,1.3,.0],radii:[.12,.28,.12],bone:2,segments:limbSegments,rings:3,uvOffset:[.52,.88],uvScale:[.12,.1]});
    addBox(g,{center:[-.14,.96,1.72],size:[.05,.12,.08],bone:5,uvOffset:[.86,.52],uvScale:[.05,.08]});
    addBox(g,{center:[.14,.96,1.72],size:[.05,.12,.08],bone:5,uvOffset:[.92,.52],uvScale:[.05,.08]});
  }
  const morphPositions=new Array(g.positions.length).fill(0);
  for(let index=0;index<g.positions.length;index+=3){
    const y=g.positions[index+1],z=g.positions[index+2];
    if(z>1.45){
      const weight=Math.min(1,(z-1.45)/.45)*.02;
      morphPositions[index+2]=weight;
      morphPositions[index+1]=Math.sin((z-1.45)*Math.PI)*.006;
    }
  }
  g.morphTargets=[{id:'expression-snarl',positions:morphPositions,defaultWeight:0}];
  return g;
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

function buildCreatureAnimations(builder){
  const nodeByBone={root:0,pelvis:1,spine:2,chest:3,neck:4,head:5,leg_front_l:6,leg_front_r:7,leg_hind_l:8,leg_hind_r:9,tail_base:10,tail_mid:11,tail_tip:12};
  const animations=[];
  const add=(name,tracks)=>{const samplers=addAnimationAccessors(builder,tracks.map(track=>({...track,node:nodeByBone[track.bone]})));animations.push({name,samplers,channels:samplers.map((sampler,index)=>({sampler:index,target:sampler.target}))});};
  for(const clip of createCreatureAnimationClips(30))add(clip.name,clip.tracks);
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
  const rigged=isRiggedAssetKind(genome.identity.kind),creature=isCreatureAssetKind(genome.identity.kind),quality=qualityProfile(variant,lod,genome.budgets.max_triangles,rigged,creature),g=creature?buildCreatureGeometry(quality):rigged?buildGeometry(quality):buildStaticGeometry(genome.identity.kind,quality),builder=new GlbBuilder(),mm=minMax(g.positions,3);
  const position=builder.addAccessor(encodeFloat32(g.positions),{componentType:5126,type:'VEC3',count:g.positions.length/3,target:34962,min:mm.min,max:mm.max});
  const normal=builder.addAccessor(encodeFloat32(g.normals),{componentType:5126,type:'VEC3',count:g.normals.length/3,target:34962});
  const uv=builder.addAccessor(encodeFloat32(g.uvs),{componentType:5126,type:'VEC2',count:g.uvs.length/2,target:34962});
  const joints=rigged?builder.addAccessor(encodeUint16(g.joints),{componentType:5123,type:'VEC4',count:g.joints.length/4,target:34962}):null;
  const weights=rigged?builder.addAccessor(encodeFloat32(g.weights),{componentType:5126,type:'VEC4',count:g.weights.length/4,target:34962}):null;
  const indices=builder.addAccessor(encodeUint16(g.indices),{componentType:5123,type:'SCALAR',count:g.indices.length,target:34963,min:[0],max:[Math.max(...g.indices)]});
  const morphAccessors=rigged?(g.morphTargets??[]).map(target=>builder.addAccessor(encodeFloat32(target.positions),{componentType:5126,type:'VEC3',count:target.positions.length/3,target:34962})):[];
  const bindWorld=creature?CREATURE_BONE_WORLD:[[0,0,0],[0,1,0],[0,1.55,0],[0,2.2,0],[-.35,1.9,0],[.35,1.9,0],[-.18,.45,0],[.18,.45,0]];
  const ibm=rigged?builder.addAccessor(encodeFloat32(bindWorld.map(value=>inverseTranslation(...value)).flat()),{componentType:5126,type:'MAT4',count:bindWorld.length}):null;
  const animations=rigged?(creature?buildCreatureAnimations(builder):buildAnimations(builder)):[],textureBinding=embedPbrTextures(builder,pbr),palette=genome.visual.palette;
  const baseColor=pbr?colorFactor(palette[0]):[1,1,1,1],emissive=pbr?colorFactor(palette[2]??palette[0]):[0,0,0,1];
  const baseTexture=textureBinding.textureIndex('base-color'),normalTexture=textureBinding.textureIndex('normal'),ormTexture=textureBinding.textureIndex('occlusion-roughness-metallic'),emissiveTexture=textureBinding.textureIndex('emissive');
  const material={name:`${genome.semantics.element}-stylized-pbr`,pbrMetallicRoughness:{baseColorFactor:baseColor,metallicFactor:variant==='cinematic'?.42:.18,roughnessFactor:variant==='mobile'?.72:.5,...(baseTexture===null?{}:{baseColorTexture:{index:baseTexture}}),...(ormTexture===null?{}:{metallicRoughnessTexture:{index:ormTexture}})},...(normalTexture===null?{}:{normalTexture:{index:normalTexture,scale:variant==='mobile'?.75:1}}),...(ormTexture===null?{}:{occlusionTexture:{index:ormTexture,strength:.86}}),...(emissiveTexture===null?{}:{emissiveTexture:{index:emissiveTexture}}),emissiveFactor:emissive,emissiveStrength:variant==='cinematic'?.75:.4,doubleSided:false,extras:{ragf:{quality_profile:quality.profile,material_root:pbr?.metadata?.pack_root??null}}};
  const humanoidNodes=[
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
  const creatureNodes=[
    {name:'Armature',children:[1,13]},
    {name:'pelvis',children:[2,8,9,10],translation:[0,.78,0]},
    {name:'spine',children:[3],translation:[0,.04,.38]},
    {name:'chest',children:[4,6,7],translation:[0,.02,.42]},
    {name:'neck',children:[5],translation:[0,.02,.36]},
    {name:'head',translation:[0,.02,.24]},
    {name:'leg_front_l',translation:[-.42,-.4,.28]},
    {name:'leg_front_r',translation:[.42,-.4,.28]},
    {name:'leg_hind_l',translation:[-.4,-.4,-.34]},
    {name:'leg_hind_r',translation:[.4,-.4,-.34]},
    {name:'tail_base',children:[11],translation:[0,-.02,-.4]},
    {name:'tail_mid',children:[12],translation:[0,-.02,-.38]},
    {name:'tail_tip',translation:[0,.02,-.34]},
    {name:'mesh',mesh:0,skin:0}
  ];
  const nodes=rigged?(creature?creatureNodes:humanoidNodes):[{name:'asset-root',children:[1]},{name:'mesh',mesh:0}];
  const attributes={POSITION:position,NORMAL:normal,TEXCOORD_0:uv,...(rigged?{JOINTS_0:joints,WEIGHTS_0:weights}:{})};
  const json={
    asset:{version:'2.0',generator:'TaoWind RAGF v0.4 deterministic rounded 3D'},
    scene:0,scenes:[{nodes:[0]}],nodes,
    meshes:[{name:genome.identity.name,primitives:[{attributes,indices,material:0,...(morphAccessors.length?{targets:morphAccessors.map(accessor=>({POSITION:accessor}))}:{})}],weights:morphAccessors.length?[0]:undefined}],
    materials:[material],
    ...(rigged?{skins:[{name:creature?CREATURE_PROFILE:'humanoid-rounded-v0.4',inverseBindMatrices:ibm,skeleton:0,joints:Array.from({length:bindWorld.length},(_,index)=>index)}],animations}:{}),
    ...(textureBinding.images.length?{samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],images:textureBinding.images,textures:textureBinding.textures}:{}),
    buffers:[{byteLength:builder.binary().length}],bufferViews:builder.bufferViews,accessors:builder.accessors,
     extras:{ragf:{asset_id:genome.identity.asset_id,variant,lod,geometry_profile:quality.profile,asset_kind:genome.identity.kind,rigged,feature_level:quality.featureLevel,pbr_embedded:textureBinding.images.length===4,morph_targets:(g.morphTargets??[]).map(target=>target.id)}}
  };
  const binary=builder.binary(),glb=encodeGlb(json,binary),inspection=inspectGlb(glb);
  const metadata={format:'reality-asset.mesh-3d.v0.4',asset_id:genome.identity.asset_id,variant,lod,vertex_count:g.positions.length/3,triangle_count:g.indices.length/3,bone_count:rigged?bindWorld.length:0,animation_count:rigged?inspection.animation_count:0,morph_target_count:morphAccessors.length,embedded_texture_count:textureBinding.images.length,bounds:{min:mm.min,max:mm.max},glb_root:inspection.root,gltf_version:'2.0',rigged,pbr:true,quality_profile:quality.profile,asset_kind:genome.identity.kind,feature_level:quality.featureLevel,material_root:pbr?.metadata?.pack_root??null};
  return{glb,metadata,geometry:{...g,topology:'triangle-list'}};
}

export function generateLodManifest({genome,variant,meshes}){
  const maxTriangles=genome.budgets.max_triangles;
  return seal({format:'reality-asset.lod-manifest.v0.4',asset_id:genome.identity.asset_id,variant,levels:meshes.map((mesh,lod)=>({lod,role:lod===0?'mesh-glb':`mesh-lod${lod}-glb`,triangle_count:mesh.metadata.triangle_count,triangle_budget:lod===0?maxTriangles:Math.max(12,Math.floor(maxTriangles*(lod===1?.45:.18))),screen_coverage:lod===0?1:lod===1?.45:.16,geometric_error:lod===0?0:lod===1?.018:.055,glb_root:mesh.metadata.glb_root,quality_profile:mesh.metadata.quality_profile})),policy:{selection:'screen-coverage',cross_fade:true,geometry:isCreatureAssetKind(genome.identity.kind)?'creature-quadruped-progressive-detail':isRiggedAssetKind(genome.identity.kind)?'rounded-humanoid-progressive-detail':'family-static-progressive-detail',min_resident_level:2},lod_root:''},'lod_root');
}
