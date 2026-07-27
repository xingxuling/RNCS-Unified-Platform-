import assert from 'node:assert/strict';
import { compileSpatialFrame, renderSpatialReference, sampleSpatialAnimation } from '../packages/spatial-reality-3d/src/index.js';
import { importGltfToSpatialScene, verifyGltfImportReceipt } from '../packages/gltf-asset/src/index.js';

const tests:Array<{name:string;fn:()=>void|Promise<void>}>=[];
const test=(name:string,fn:()=>void|Promise<void>):void=>{tests.push({name,fn})};

function fixture():Record<string,unknown>{
  const positions=new Float32Array([-1,-1,0,1,-1,0,0,1,0]);
  const normals=new Float32Array([0,0,1,0,0,1,0,0,1]);
  const uvs=new Float32Array([0,0,1,0,.5,1]);
  const indices=new Uint16Array([0,1,2]);
  const times=new Float32Array([0,1]);
  const translations=new Float32Array([0,0,0,1,0,0]);
  const chunks=[positions,normals,uvs,indices,times,translations];
  const offsets:number[]=[];let length=0;
  for(const chunk of chunks){while(length%4)length++;offsets.push(length);length+=chunk.byteLength}
  const binary=Buffer.alloc(length);
  chunks.forEach((chunk,index)=>Buffer.from(chunk.buffer,chunk.byteOffset,chunk.byteLength).copy(binary,offsets[index]));
  const views=chunks.map((chunk,index)=>({buffer:0,byteOffset:offsets[index],byteLength:chunk.byteLength}));
  return {
    asset:{version:'2.0',generator:'RNCS VSR test'},
    buffers:[{byteLength:length,uri:`data:application/octet-stream;base64,${binary.toString('base64')}`}],
    bufferViews:views,
    accessors:[
      {bufferView:0,componentType:5126,count:3,type:'VEC3'},
      {bufferView:1,componentType:5126,count:3,type:'VEC3'},
      {bufferView:2,componentType:5126,count:3,type:'VEC2'},
      {bufferView:3,componentType:5123,count:3,type:'SCALAR'},
      {bufferView:4,componentType:5126,count:2,type:'SCALAR'},
      {bufferView:5,componentType:5126,count:2,type:'VEC3'},
    ],
    images:[{extras:{vsrRGBA:{width:2,height:2,pixels:[255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]}}}],
    textures:[{source:0}],
    materials:[{pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:0},metallicFactor:.1,roughnessFactor:.7}}],
    meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,material:0}]}],
    nodes:[{mesh:0,translation:[0,0,0]}],
    scenes:[{nodes:[0]}],scene:0,
    animations:[{samplers:[{input:4,output:5,interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:0,path:'translation'}}]}]
  };
}


function pbrFixture():Record<string,unknown>{
  const value=fixture() as any;
  value.samplers=[{magFilter:9729,minFilter:9729,wrapS:33071,wrapT:10497}];
  value.images=[
    {extras:{vsrRGBA:{width:1,height:1,pixels:[70,150,255,255]}}},
    {extras:{vsrRGBA:{width:1,height:1,pixels:[0,80,240,255],colorSpace:'linear'}}},
    {extras:{vsrRGBA:{width:1,height:1,pixels:[255,128,255,255],colorSpace:'linear'}}},
    {extras:{vsrRGBA:{width:1,height:1,pixels:[64,64,64,255],colorSpace:'linear'}}},
    {extras:{vsrRGBA:{width:1,height:1,pixels:[0,255,220,255]}}}
  ];
  value.textures=value.images.map((_:unknown,index:number)=>({source:index,sampler:0}));
  value.materials=[{pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:0},metallicFactor:.8,roughnessFactor:.7,metallicRoughnessTexture:{index:1}},normalTexture:{index:2,scale:.75},occlusionTexture:{index:3,strength:.6},emissiveFactor:[.3,.8,1],emissiveTexture:{index:4},alphaMode:'MASK',alphaCutoff:.4}];
  return value;
}
function deformationFixture():Record<string,unknown>{
  const value=fixture() as any,binary=Buffer.from(value.buffers[0].uri.split(',')[1],'base64');
  const append=(data:ArrayBufferView,type:string,componentType:number,count:number)=>{let offset=binary.length;while(offset%4)offset++;const next=Buffer.alloc(offset+data.byteLength);binary.copy(next);Buffer.from(data.buffer,data.byteOffset,data.byteLength).copy(next,offset);value.buffers[0].byteLength=next.length;value.buffers[0].uri=`data:application/octet-stream;base64,${next.toString('base64')}`;value.bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.byteLength});value.accessors.push({bufferView:value.bufferViews.length-1,componentType,count,type});return value.accessors.length-1};
  const joints=append(new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0]),'VEC4',5121,3),weights=append(new Float32Array([1,0,0,0,1,0,0,0,1,0,0,0]),'VEC4',5126,3),morph=append(new Float32Array([.4,0,0,.4,0,0,.4,0,0]),'VEC3',5126,3),inverseBind=append(new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),'MAT4',5126,1);
  value.meshes[0].weights=[1];value.meshes[0].primitives[0].attributes.JOINTS_0=joints;value.meshes[0].primitives[0].attributes.WEIGHTS_0=weights;value.meshes[0].primitives[0].targets=[{POSITION:morph}];value.nodes=[{mesh:0,skin:0,weights:[1]},{translation:[.6,0,0]}];value.scenes=[{nodes:[0,1]}];value.skins=[{joints:[1],inverseBindMatrices:inverseBind}];return value;
}
function cubicRotationFixture():Record<string,unknown>{
  const value=fixture() as any,binary=Buffer.from(value.buffers[0].uri.split(',')[1],'base64');
  const append=(data:ArrayBufferView,type:string,componentType:number,count:number)=>{let offset=binary.length;while(offset%4)offset++;const next=Buffer.alloc(offset+data.byteLength);binary.copy(next);Buffer.from(data.buffer,data.byteOffset,data.byteLength).copy(next,offset);value.buffers[0].byteLength=next.length;value.buffers[0].uri=`data:application/octet-stream;base64,${next.toString('base64')}`;value.bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.byteLength});value.accessors.push({bufferView:value.bufferViews.length-1,componentType,count,type});return value.accessors.length-1};
  const cubicOutput=append(new Float32Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0]),'VEC4',5126,6);value.nodes=[{mesh:0,rotation:[0,0,0,1]}];value.animations=[{samplers:[{input:4,output:cubicOutput,interpolation:'CUBICSPLINE'}],channels:[{sampler:0,target:{node:0,path:'rotation'}}]}];return value;
}
test('glTF 2.0 importer materializes geometry material texture hierarchy and animation',()=>{const result=importGltfToSpatialScene(fixture(),{sceneId:'gltf-test'});assert.equal(result.scene.meshes.length,1);assert.equal(result.scene.materials.length,1);assert.equal(result.scene.textures?.length,1);assert.equal(result.scene.animations?.length,1);assert.equal(result.scene.nodes[0]?.meshId,'mesh:gltf:0:0');assert.equal(verifyGltfImportReceipt(result.receipt),true)});
test('imported glTF compiles into a verified frame with texture resources',()=>{const {scene}=importGltfToSpatialScene(fixture(),{sceneId:'gltf-frame'});const frame=compileSpatialFrame(scene,{width:128,height:128,animation:{clipId:'animation:gltf:0',timeSeconds:.5}});assert.equal(frame.stats.textureCount,1);assert.equal(frame.stats.animationClipCount,1);assert.ok(frame.resources.some(resource=>resource.kind==='texture-2d'));assert.notEqual(frame.animationRoot,'0'.repeat(64))});
test('imported glTF texture and animation affect pixels while reality root remains authoritative',()=>{const {scene}=importGltfToSpatialScene(fixture(),{sceneId:'gltf-render'});const a=renderSpatialReference(scene,{width:128,height:128,enableShadows:false,animation:{clipId:'animation:gltf:0',timeSeconds:0}}),b=renderSpatialReference(scene,{width:128,height:128,enableShadows:false,animation:{clipId:'animation:gltf:0',timeSeconds:.8}});assert.equal(a.framePlan.sourceRealityRoot,b.framePlan.sourceRealityRoot);assert.notEqual(a.framePlan.animationRoot,b.framePlan.animationRoot);assert.notEqual(a.pixelRoot,b.pixelRoot)});

test('glTF PBR importer maps metallic roughness normal occlusion emissive and alpha contracts',()=>{const result=importGltfToSpatialScene(pbrFixture(),{sceneId:'gltf-pbr'}),material=result.scene.materials[0]!;assert.equal(result.receipt.materialTextureBindingCount,5);assert.equal(material.metallicRoughnessTextureId,'texture:gltf:1');assert.equal(material.normalTextureId,'texture:gltf:2');assert.equal(material.occlusionTextureId,'texture:gltf:3');assert.equal(material.emissiveTextureId,'texture:gltf:4');assert.equal(material.alphaMode,'MASK');assert.equal(material.alphaCutoff,.4);assert.equal(result.scene.textures?.[0]?.filter,'linear');assert.equal(result.scene.textures?.[0]?.wrapU,'clamp')});
test('glTF complete PBR textures change pixels without rewriting authority root',()=>{const {scene}=importGltfToSpatialScene(pbrFixture(),{sceneId:'gltf-pbr-render'}),full=renderSpatialReference(scene,{width:128,height:128,enableShadows:false});const material=scene.materials[0]!;delete material.metallicRoughnessTextureId;delete material.normalTextureId;delete material.occlusionTextureId;delete material.emissiveTextureId;const reduced=renderSpatialReference(scene,{width:128,height:128,enableShadows:false});assert.equal(full.framePlan.sourceRealityRoot,reduced.framePlan.sourceRealityRoot);assert.equal(full.framePlan.stats.materialTextureBindings,5);assert.equal(reduced.framePlan.stats.materialTextureBindings,1);assert.notEqual(full.pixelRoot,reduced.pixelRoot)});
test('glTF PBR import receipt seals material texture binding evidence',()=>{const result=importGltfToSpatialScene(pbrFixture());assert.equal(verifyGltfImportReceipt(result.receipt),true);result.receipt.materialTextureBindingCount--;assert.equal(verifyGltfImportReceipt(result.receipt),false)});
test('glTF importer materializes skin joints weights and morph targets',()=>{const result=importGltfToSpatialScene(deformationFixture(),{sceneId:'gltf-deformation'}),mesh=result.scene.meshes[0]!,node=result.scene.nodes[0]!,frame=compileSpatialFrame(result.scene,{width:128,height:128,enableShadows:false});assert.equal(result.receipt.skinCount,1);assert.equal(result.receipt.morphTargetCount,1);assert.equal(result.scene.skins?.[0]?.joints[0],'node:gltf:1');assert.equal(mesh.jointIndices?.length,12);assert.equal(mesh.jointWeights?.length,12);assert.equal(mesh.morphTargets?.length,1);assert.equal(node.skinId,'skin:gltf:0');assert.deepEqual(node.morphWeights,[1]);assert.equal(frame.stats.skinnedDraws,1);assert.equal(frame.stats.morphedDraws,1);assert.ok(frame.resources.some(resource=>resource.kind==='joint-buffer'));assert.ok(frame.resources.some(resource=>resource.kind==='morph-buffer'));assert.equal(verifyGltfImportReceipt(result.receipt),true)});
test('glTF importer preserves quaternion CUBICSPLINE animation data',()=>{const result=importGltfToSpatialScene(cubicRotationFixture(),{sceneId:'gltf-cubic-rotation'}),channel=result.scene.animations?.[0]?.channels[0]!,sample=sampleSpatialAnimation(result.scene,'animation:gltf:0',.5,false).get('node:gltf:0')?.rotationQuaternion!;assert.equal(channel.path,'rotationQuaternion');assert.equal(channel.interpolation,'CUBICSPLINE');assert.equal(channel.values.length,2);assert.equal(channel.inTangents?.length,2);assert.equal(channel.outTangents?.length,2);assert.ok(Math.abs(sample[2]-Math.sqrt(.5))<1e-6);assert.ok(Math.abs(sample[3]-Math.sqrt(.5))<1e-6);const rest=compileSpatialFrame(result.scene,{width:128,height:128,enableShadows:false,animation:{clipId:'animation:gltf:0',timeSeconds:0}}),animated=compileSpatialFrame(result.scene,{width:128,height:128,enableShadows:false,animation:{clipId:'animation:gltf:0',timeSeconds:.5}});assert.equal(rest.sourceRealityRoot,animated.sourceRealityRoot);assert.notEqual(rest.animationRoot,animated.animationRoot);assert.notEqual(rest.frameRoot,animated.frameRoot);assert.equal(verifyGltfImportReceipt(result.receipt),true)});
test('glTF receipt detects tampering',()=>{const result=importGltfToSpatialScene(fixture());assert.equal(verifyGltfImportReceipt(result.receipt),true);result.receipt.meshCount++;assert.equal(verifyGltfImportReceipt(result.receipt),false)});

let passed=0;for(const entry of tests){try{await entry.fn();passed++;console.log(`PASS ${entry.name}`)}catch(error){console.error(`FAIL ${entry.name}`);throw error}}console.log(`VSR glTF asset tests: ${passed}/${tests.length} PASS`);
