import {GlbBuilder,encodeFloat32,encodeUint16,minMax,encodeGlb,inspectGlb} from '../gltf.mjs';
import {rootHash,seal} from '../canonical.mjs';

function addBox(g,{center=[0,0,0],size=[1,1,1],bone=0}={}){
  const [cx,cy,cz]=center,[sx,sy,sz]=size.map(x=>x/2);const faces=[
    [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
    [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
    [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]]
  ];
  for(const f of faces){const base=g.positions.length/3;for(let i=0;i<4;i++){const v=f[i];g.positions.push(cx+v[0]*sx,cy+v[1]*sy,cz+v[2]*sz);g.normals.push(...f[4]);g.uvs.push(i===0||i===3?0:1,i<2?0:1);g.joints.push(bone,0,0,0);g.weights.push(1,0,0,0);}g.indices.push(base,base+1,base+2,base,base+2,base+3);}
}
function buildGeometry(detail){
  const g={positions:[],normals:[],uvs:[],joints:[],weights:[],indices:[]};
  addBox(g,{center:[0,1.55,0],size:[.55,.82,.34],bone:2});addBox(g,{center:[0,2.25,0],size:[.48,.48,.46],bone:3});
  if(detail>=1){addBox(g,{center:[-.42,1.55,0],size:[.22,.78,.22],bone:4});addBox(g,{center:[.42,1.55,0],size:[.22,.78,.22],bone:5});addBox(g,{center:[-.18,.72,0],size:[.25,1.15,.27],bone:6});addBox(g,{center:[.18,.72,0],size:[.25,1.15,.27],bone:7});}
  if(detail>=2){addBox(g,{center:[.64,1.38,0],size:[.08,1.55,.12],bone:5});addBox(g,{center:[.64,2.18,0],size:[.28,.12,.18],bone:5});}
  if(detail>=3){addBox(g,{center:[0,1.2,-.28],size:[.7,.7,.12],bone:2});addBox(g,{center:[0,2.55,0],size:[.7,.12,.5],bone:3});}
  return g;
}
const inverseTranslation=(x=0,y=0,z=0)=>[1,0,0,0,0,1,0,0,0,0,1,0,-x,-y,-z,1];
const quatY=a=>[0,Math.sin(a/2),0,Math.cos(a/2)];
export function generateMesh3d({genome,variant,lod=0}){
  const detail=Math.max(0,(variant==='cinematic'?3:variant==='mobile'?2:3)-lod),g=buildGeometry(detail),b=new GlbBuilder();const mm=minMax(g.positions,3);
  const position=b.addAccessor(encodeFloat32(g.positions),{componentType:5126,type:'VEC3',count:g.positions.length/3,target:34962,min:mm.min,max:mm.max});
  const normal=b.addAccessor(encodeFloat32(g.normals),{componentType:5126,type:'VEC3',count:g.normals.length/3,target:34962});
  const uv=b.addAccessor(encodeFloat32(g.uvs),{componentType:5126,type:'VEC2',count:g.uvs.length/2,target:34962});
  const joints=b.addAccessor(encodeUint16(g.joints),{componentType:5123,type:'VEC4',count:g.joints.length/4,target:34962});
  const weights=b.addAccessor(encodeFloat32(g.weights),{componentType:5126,type:'VEC4',count:g.weights.length/4,target:34962});
  const indices=b.addAccessor(encodeUint16(g.indices),{componentType:5123,type:'SCALAR',count:g.indices.length,target:34963,min:[0],max:[Math.max(...g.indices)]});
  const bindWorld=[[0,0,0],[0,1,0],[0,1.55,0],[0,2.2,0],[-.35,1.9,0],[.35,1.9,0],[-.18,.45,0],[.18,.45,0]];const ibm=b.addAccessor(encodeFloat32(bindWorld.map(v=>inverseTranslation(...v)).flat()),{componentType:5126,type:'MAT4',count:8});
  const times=[0,.5,1],timeAcc=b.addAccessor(encodeFloat32(times),{componentType:5126,type:'SCALAR',count:3,min:[0],max:[1]});
  const attack=[quatY(-.15),quatY(.5),quatY(-.15)].flat(),attackAcc=b.addAccessor(encodeFloat32(attack),{componentType:5126,type:'VEC4',count:3});
  const palette=genome.visual.palette;const nodes=[
    {name:'Armature',children:[1,8]},{name:'hips',children:[2,6,7],translation:[0,1,0]},{name:'spine',children:[3,4,5],translation:[0,.55,0]},
    {name:'head',translation:[0,.65,0]},{name:'arm_l',translation:[-.35,.35,0]},{name:'arm_r',translation:[.35,.35,0]},
    {name:'leg_l',translation:[-.18,-.55,0]},{name:'leg_r',translation:[.18,-.55,0]},{name:'mesh',mesh:0,skin:0}
  ];
  const json={asset:{version:'2.0',generator:'TaoWind RAGF v0.3 deterministic 3D'},scene:0,scenes:[{nodes:[0]}],nodes,meshes:[{name:genome.identity.name,primitives:[{attributes:{POSITION:position,NORMAL:normal,TEXCOORD_0:uv,JOINTS_0:joints,WEIGHTS_0:weights},indices,material:0}]}],materials:[{name:`${genome.semantics.element}-pbr`,pbrMetallicRoughness:{baseColorFactor:[.12,.36,.78,1],metallicFactor:variant==='cinematic'?.35:.15,roughnessFactor:variant==='mobile'?.7:.48},emissiveFactor:[.12,.42,.8],doubleSided:false}],skins:[{name:'humanoid-lite',inverseBindMatrices:ibm,skeleton:0,joints:[0,1,2,3,4,5,6,7]}],animations:[{name:'attack',samplers:[{input:timeAcc,output:attackAcc,interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:5,path:'rotation'}}]}],buffers:[{byteLength:b.binary().length}],bufferViews:b.bufferViews,accessors:b.accessors,extras:{ragf:{asset_id:genome.identity.asset_id,variant,lod,geometry_profile:'humanoid-lite-box-v0.3'}}};
  const glb=encodeGlb(json,b.binary()),inspection=inspectGlb(glb),metadata={format:'reality-asset.mesh-3d.v0.3',asset_id:genome.identity.asset_id,variant,lod,vertex_count:g.positions.length/3,triangle_count:g.indices.length/3,bone_count:8,animation_count:1,bounds:{min:mm.min,max:mm.max},glb_root:inspection.root,gltf_version:'2.0',rigged:true,pbr:true};
  return{glb,metadata,geometry:g};
}
export function generateLodManifest({genome,variant,meshes}){return seal({format:'reality-asset.lod-manifest.v0.3',asset_id:genome.identity.asset_id,variant,levels:meshes.map((m,lod)=>({lod,role:lod===0?'mesh-glb':`mesh-lod${lod}-glb`,triangle_count:m.metadata.triangle_count,screen_coverage:lod===0?1:lod===1?.45:.16,glb_root:m.metadata.glb_root})),policy:{selection:'screen-coverage',cross_fade:true},lod_root:''},'lod_root');}
