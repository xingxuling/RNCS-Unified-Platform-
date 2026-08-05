import {Buffer} from 'node:buffer';
import {RealityNetworkRuntime} from '@taowind/reality-network-runtime';
import {gltfAsset, spatial3d} from '@taowind/visual-state-runtime';
import {networkPacketToTemporalState,TemporalPresentationBuffer} from '@taowind/visual-state-runtime/temporal-presentation';

const Q=1_000_000;
const box=(id,x,y,z,kind='dynamic',hx=500,hy=500,hz=500,extra={})=>({id,kind,position:{x,y,z},fixtures:[{id:`${id}:shape`,shape:{type:'box',halfExtents:{x:hx,y:hy,z:hz}},bodyZone:`${id}:body`}],...extra});
const capsule=(id,x,y,z)=>({id,kind:'dynamic',position:{x,y,z},fixtures:[{id:`${id}:shape`,shape:{type:'capsule',radius:300,halfHeight:700},bodyZone:`${id}:torso`}],fixedRotation:true});

export function createPlayableWorldConfig(){
  const platform=box('moving-platform',2500,250,1200,'kinematic',1400,250,1200,{velocity:{x:1200,y:0,z:0}});
  const oneWay=box('one-way-platform',0,1800,3200,'static',1600,100,1400);
  oneWay.fixtures[0].oneWay={normal:{x:0,y:Q,z:0},minApproachSpeed:40,skin:30};
  return {
    format:'rsr.spatial-embodiment-world.v0.6',worldId:'world:playable-aether-island-v08',stepHz:60,floorY:0,
    gravity:{x:0,y:-9810,z:0},velocityIterations:6,positionIterations:4,maxSubsteps:16,broadPhaseCellSize:2000,contactPersistenceDistance:80,
    bodies:[box('ground',0,-500,0,'static',12000,500,9000),box('step',-1550,150,-1200,'static',300,150,900),platform,oneWay,capsule('player-blue',-2500,1000,-1200),capsule('player-red',2500,1500,1200)],
    characters:[
      {id:'character:blue',bodyId:'player-blue',walkSpeed:4000,acceleration:40000,jumpSpeed:6000,stepHeight:400,groundSnapDistance:120},
      {id:'character:red',bodyId:'player-red',walkSpeed:3000,acceleration:20000,jumpSpeed:6000,groundSnapDistance:80,platformInheritanceQ:Q}
    ],
    materials:[{id:'default',frictionQ:500000,restitutionQ:0}],listeners:[],
    reality:{generation:8,realityRoot:'rfe:playable-aether-island-v08'}
  };
}

function gltfFixture(){
  const positions=new Float32Array([-1,-1,0,1,-1,0,0,1,0]);
  const normals=new Float32Array([0,0,1,0,0,1,0,0,1]);
  const uvs=new Float32Array([0,0,1,0,.5,1]);
  const indices=new Uint16Array([0,1,2]);
  const times=new Float32Array([0,1]);
  const translations=new Float32Array([0,0,0,1.2,0,0]);
  const chunks=[positions,normals,uvs,indices,times,translations],offsets=[];let length=0;
  for(const chunk of chunks){while(length%4)length++;offsets.push(length);length+=chunk.byteLength;}
  const binary=Buffer.alloc(length);chunks.forEach((chunk,index)=>Buffer.from(chunk.buffer,chunk.byteOffset,chunk.byteLength).copy(binary,offsets[index]));
  return {
    asset:{version:'2.0',generator:'RNCS v0.8 playable world'},
    buffers:[{byteLength:length,uri:`data:application/octet-stream;base64,${binary.toString('base64')}`}],
    bufferViews:chunks.map((chunk,index)=>({buffer:0,byteOffset:offsets[index],byteLength:chunk.byteLength})),
    accessors:[
      {bufferView:0,componentType:5126,count:3,type:'VEC3'},
      {bufferView:1,componentType:5126,count:3,type:'VEC3'},
      {bufferView:2,componentType:5126,count:3,type:'VEC2'},
      {bufferView:3,componentType:5123,count:3,type:'SCALAR'},
      {bufferView:4,componentType:5126,count:2,type:'SCALAR'},
      {bufferView:5,componentType:5126,count:2,type:'VEC3'}
    ],
    images:[{extras:{vsrRGBA:{width:2,height:2,pixels:[18,90,255,255,220,245,255,255,8,35,85,255,70,190,255,255]}}}],
    textures:[{source:0}],
    materials:[{pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:0},metallicFactor:.35,roughnessFactor:.4}}],
    meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,material:0}]}],
    nodes:[{mesh:0}],scenes:[{nodes:[0]}],scene:0,
    animations:[{samplers:[{input:4,output:5,interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:0,path:'translation'}}]}]
  };
}

export async function runPlayableWorld(){
  const runtime=new RealityNetworkRuntime(),sessionId='session:playable-aether-island-v08';
  await runtime.createSession({sessionId,worldConfig:createPlayableWorldConfig(),network:{seed:808,fixedLatencyTicks:1},clock:()=> '2026-07-03T12:00:00.000Z'});
  await runtime.joinSession({sessionId,subjectId:'subject:blue',playerId:'blue',characterId:'character:blue',bodyId:'player-blue'});
  await runtime.joinSession({sessionId,subjectId:'subject:red',playerId:'red',characterId:'character:red',bodyId:'player-red'});
  const temporal=new TemporalPresentationBuffer({interpolationDelayTicks:1,maximumExtrapolationTicks:2});
  temporal.push(networkPacketToTemporalState(runtime.pullSnapshot({sessionId,reason:'initial'})));
  let stepped=0,platformTransfers=0,warmStarted=0,broadPhaseCells=0;
  for(let tick=0;tick<45;tick++){
    runtime.submitInput({sessionId,playerId:'blue',command:{type:'move',x:Q,z:0}});
    if(tick===24)runtime.submitInput({sessionId,playerId:'blue',command:{type:'jump'}});
    const result=runtime.advanceServerTick({sessionId});const snapshot=result.snapshot.rsrSnapshot;
    stepped=Math.max(stepped,snapshot.diagnostics.steppedCharacters);
    platformTransfers=Math.max(platformTransfers,snapshot.diagnostics.movingPlatformTransfers);
    warmStarted=Math.max(warmStarted,snapshot.diagnostics.warmStartedContacts);
    broadPhaseCells=Math.max(broadPhaseCells,snapshot.diagnostics.broadPhaseCells);
    temporal.push(networkPacketToTemporalState(result.snapshot));
  }
  const ctx=runtime.require(sessionId),authorityRoot=ctx.server.lastSnapshot.stateRoot;
  const blueRoot=ctx.clients.get('blue').lastConfirmed.stateRoot,redRoot=ctx.clients.get('red').lastConfirmed.stateRoot;
  const temporalFrame=temporal.sampleFrame(ctx.server.rsrWorld.tick);
  const {importGltfToSpatialScene}=await gltfAsset();
  const {renderSpatialReference,verifySpatialFrame}=await spatial3d();
  const imported=importGltfToSpatialScene(gltfFixture(),{sceneId:'asset:aether-beacon'});
  imported.scene.reality={worldId:createPlayableWorldConfig().worldId,generation:ctx.server.rsrWorld.tick,realityRoot:authorityRoot};
  imported.scene.cameras[0].transform={translation:[0,0,5]};
  const projection=renderSpatialReference(imported.scene,{width:256,height:144,enableShadows:false,animation:{clipId:'animation:gltf:0',timeSeconds:.65}});
  const acceptance={
    rsrPlayableFeatures:stepped>0&&platformTransfers>0&&warmStarted>0&&broadPhaseCells>0,
    twoClientAuthorityConvergence:authorityRoot===blueRoot&&authorityRoot===redRoot,
    temporalProjectionPreservesAuthority:temporalFrame.authorityStateRoot===authorityRoot&&temporalFrame.frameRoot!==authorityRoot,
    gltfAssetProjected:imported.receipt.meshCount===1&&imported.receipt.textureCount===1&&projection.framePlan.stats.animationClipCount===1&&verifySpatialFrame(projection.framePlan).ok,
    authorityPresentationSeparation:projection.framePlan.sourceRealityRoot!==projection.framePlan.frameRoot
  };
  return {
    format:'rncs.playable-spatial-world-evidence.v0.8',
    versions:{mother:'0.8.0-alpha.1',rsr:'0.8.0-alpha.1',vsr:'0.7.0-alpha.1',network:'0.2.0-alpha.1'},
    sessionId,tick:ctx.server.rsrWorld.tick,authorityRoot,clientRoots:{blue:blueRoot,red:redRoot},
    temporalPresentationRoot:temporalFrame.frameRoot,assetPresentationRoot:projection.framePlan.frameRoot,pixelRoot:projection.pixelRoot,
    diagnostics:{stepped,platformTransfers,warmStarted,broadPhaseCells},gltfReceipt:imported.receipt,acceptance,png:projection.png
  };
}
