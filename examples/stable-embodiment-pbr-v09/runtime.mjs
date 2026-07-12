import {Buffer} from 'node:buffer';
import {RealityNetworkRuntime} from '@taowind/reality-network-runtime';
import {SpatialEmbodimentWorld,Q,SPATIAL_EMBODIMENT_FORMAT,degrees} from '@taowind/reality-simulation-runtime/spatial-embodiment';
import {gltfAsset,spatial3d} from '@taowind/visual-state-runtime';
import {networkPacketToTemporalState,TemporalPresentationBuffer} from '@taowind/visual-state-runtime/temporal-presentation';

const box=(id,x,y,z,kind='dynamic',hx=500,hy=500,hz=500,extra={})=>({id,kind,position:{x,y,z},fixtures:[{id:`${id}:shape`,shape:{type:'box',halfExtents:{x:hx,y:hy,z:hz}},bodyZone:`${id}:body`}],...extra});
const capsule=(id,x,y,z)=>({id,kind:'dynamic',position:{x,y,z},fixtures:[{id:`${id}:shape`,shape:{type:'capsule',radius:300,halfHeight:700},bodyZone:`${id}:torso`}],fixedRotation:true});

export function createStableWorldConfig(){
  const platform=box('moving-platform',2500,250,1200,'kinematic',1400,250,1200,{velocity:{x:1200,y:0,z:0}});
  const oneWay=box('one-way-platform',0,1800,3200,'static',1600,100,1400);oneWay.fixtures[0].oneWay={normal:{x:0,y:Q,z:0},minApproachSpeed:40,skin:30};
  const rotatedWall=box('rotated-obb-wall',-350,1100,-1200,'static',600,900,120);rotatedWall.rotationDeg={x:0,y:degrees(38),z:0};
  const slider=box('friction-slider',-4200,500,3800,'dynamic',450,500,450,{velocity:{x:2600,y:0,z:0},frictionQ:900000});
  const crateA=box('island-crate-a',4200,500,-3800,'dynamic',450,500,450,{sleepTicks:8,sleepSpeedThreshold:25});
  const crateB=box('island-crate-b',5100,500,-3800,'dynamic',450,500,450,{sleepTicks:8,sleepSpeedThreshold:25});
  return{format:SPATIAL_EMBODIMENT_FORMAT,worldId:'world:stable-aether-island-v09',stepHz:60,floorY:0,gravity:{x:0,y:-9810,z:0},velocityIterations:8,positionIterations:5,maxSubsteps:16,broadPhaseCellSize:2000,contactPersistenceDistance:90,
    bodies:[box('ground',0,-500,0,'static',12000,500,9000),box('step',-1550,150,-1200,'static',300,150,900),platform,oneWay,rotatedWall,slider,crateA,crateB,capsule('player-blue',-2500,1000,-1200),capsule('player-red',2500,1500,1200)],
    characters:[{id:'character:blue',bodyId:'player-blue',walkSpeed:4000,acceleration:40000,jumpSpeed:6000,stepHeight:400,groundSnapDistance:120,coyoteTicks:6,jumpBufferTicks:6},{id:'character:red',bodyId:'player-red',walkSpeed:3000,acceleration:20000,jumpSpeed:6000,groundSnapDistance:80,platformInheritanceQ:Q,coyoteTicks:6,jumpBufferTicks:6}],
    joints:[{id:'crate-link',type:'distance',bodyA:'island-crate-a',bodyB:'island-crate-b',restLength:900,stiffnessQ:900000}],materials:[{id:'default',frictionQ:600000,restitutionQ:0}],listeners:[],reality:{generation:9,realityRoot:'rfe:stable-aether-island-v09'}};
}

function traversalPreflight(){
  const config=(body,character)=>({format:SPATIAL_EMBODIMENT_FORMAT,worldId:'world:traversal-preflight',stepHz:60,floorY:0,gravity:{x:0,y:-9810,z:0},velocityIterations:6,positionIterations:4,maxSubsteps:8,bodies:[body],characters:[character],reality:{generation:9,realityRoot:'rfe:traversal-preflight'}});
  const coyoteBody=capsule('coyote-avatar',0,1000,0),coyote=new SpatialEmbodimentWorld(config(coyoteBody,{id:'coyote-character',bodyId:'coyote-avatar',walkSpeed:3000,acceleration:12000,jumpSpeed:6000,coyoteTicks:3,jumpBufferTicks:3}));
  coyote.step();coyote.step([{id:'leave',tick:2,type:'teleport',bodyId:'coyote-avatar',position:{x:0,y:1800,z:0}}]);const coyoteSnapshot=coyote.step([{id:'late-jump',tick:3,type:'jump-character',characterId:'coyote-character'}]).snapshot;
  const bufferedBody=capsule('buffer-avatar',0,1600,0);bufferedBody.velocity={x:0,y:-30000,z:0};const buffered=new SpatialEmbodimentWorld(config(bufferedBody,{id:'buffer-character',bodyId:'buffer-avatar',walkSpeed:3000,acceleration:12000,jumpSpeed:7000,coyoteTicks:0,jumpBufferTicks:4}));
  buffered.step([{id:'early-jump',tick:1,type:'jump-character',characterId:'buffer-character'}]);const bufferedSnapshot=buffered.step().snapshot;
  return{coyoteJumps:coyoteSnapshot.diagnostics.coyoteJumps,bufferedJumps:bufferedSnapshot.diagnostics.bufferedJumps,coyoteVelocityY:coyoteSnapshot.bodies[0].velocity.y,bufferedVelocityY:bufferedSnapshot.bodies[0].velocity.y};
}

function pbrGltfFixture(){
  const positions=new Float32Array([-1.4,-1,0,1.4,-1,0,0,1.4,0]),normals=new Float32Array([0,0,1,0,0,1,0,0,1]),uvs=new Float32Array([0,0,1,0,.5,1]),indices=new Uint16Array([0,1,2]),times=new Float32Array([0,1]),translations=new Float32Array([0,0,0,.8,0,0]),chunks=[positions,normals,uvs,indices,times,translations],offsets=[];let length=0;
  for(const chunk of chunks){while(length%4)length++;offsets.push(length);length+=chunk.byteLength}const binary=Buffer.alloc(length);chunks.forEach((chunk,index)=>Buffer.from(chunk.buffer,chunk.byteOffset,chunk.byteLength).copy(binary,offsets[index]));
  return{asset:{version:'2.0',generator:'RNCS v0.9 stable embodiment PBR'},buffers:[{byteLength:length,uri:`data:application/octet-stream;base64,${binary.toString('base64')}`}],bufferViews:chunks.map((chunk,index)=>({buffer:0,byteOffset:offsets[index],byteLength:chunk.byteLength})),accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3'},{bufferView:1,componentType:5126,count:3,type:'VEC3'},{bufferView:2,componentType:5126,count:3,type:'VEC2'},{bufferView:3,componentType:5123,count:3,type:'SCALAR'},{bufferView:4,componentType:5126,count:2,type:'SCALAR'},{bufferView:5,componentType:5126,count:2,type:'VEC3'}],
    samplers:[{magFilter:9729,minFilter:9729,wrapS:33071,wrapT:10497}],images:[
      {extras:{vsrRGBA:{width:2,height:2,pixels:[16,80,255,255,180,235,255,255,8,28,90,255,40,190,255,255]}}},
      {extras:{vsrRGBA:{width:1,height:1,pixels:[0,85,230,255],colorSpace:'linear'}}},
      {extras:{vsrRGBA:{width:1,height:1,pixels:[240,128,255,255],colorSpace:'linear'}}},
      {extras:{vsrRGBA:{width:1,height:1,pixels:[72,72,72,255],colorSpace:'linear'}}},
      {extras:{vsrRGBA:{width:1,height:1,pixels:[0,255,220,255]}}}
    ],textures:[0,1,2,3,4].map(source=>({source,sampler:0})),materials:[{pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:0},metallicFactor:.85,roughnessFactor:.65,metallicRoughnessTexture:{index:1}},normalTexture:{index:2,scale:.8},occlusionTexture:{index:3,strength:.7},emissiveFactor:[.2,.8,1],emissiveTexture:{index:4},alphaMode:'MASK',alphaCutoff:.4}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,material:0}]}],nodes:[{mesh:0}],scenes:[{nodes:[0]}],scene:0,animations:[{samplers:[{input:4,output:5,interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:0,path:'translation'}}]}]};
}

export async function runStableEmbodimentPbrWorld(){
  const runtime=new RealityNetworkRuntime(),sessionId='session:stable-aether-island-v09';await runtime.createSession({sessionId,worldConfig:createStableWorldConfig(),network:{seed:909,fixedLatencyTicks:1},clock:()=> '2026-07-03T16:00:00.000Z'});await runtime.joinSession({sessionId,subjectId:'subject:blue',playerId:'blue',characterId:'character:blue',bodyId:'player-blue'});await runtime.joinSession({sessionId,subjectId:'subject:red',playerId:'red',characterId:'character:red',bodyId:'player-red'});
  const temporal=new TemporalPresentationBuffer({interpolationDelayTicks:1,maximumExtrapolationTicks:2});temporal.push(networkPacketToTemporalState(runtime.pullSnapshot({sessionId,reason:'initial'})));const diagnostics={capsuleObbContacts:0,warmStartedFrictionContacts:0,solverIslands:0,largestSolverIsland:0,sleepingIslands:0};
  for(let tick=0;tick<70;tick++){runtime.submitInput({sessionId,playerId:'blue',command:{type:'move',x:Q,z:0}});if(tick===26)runtime.submitInput({sessionId,playerId:'blue',command:{type:'jump'}});const result=runtime.advanceServerTick({sessionId}),d=result.snapshot.rsrSnapshot.diagnostics;for(const key of Object.keys(diagnostics))diagnostics[key]=Math.max(diagnostics[key],d[key]??0);temporal.push(networkPacketToTemporalState(result.snapshot))}
  const ctx=runtime.require(sessionId),authorityRoot=ctx.server.lastSnapshot.stateRoot,blueRoot=ctx.clients.get('blue').lastConfirmed.stateRoot,redRoot=ctx.clients.get('red').lastConfirmed.stateRoot,temporalFrame=temporal.sampleFrame(ctx.server.rsrWorld.tick),traversal=traversalPreflight();
  const {importGltfToSpatialScene}=await gltfAsset(),{renderSpatialReference,verifySpatialFrame}=await spatial3d(),imported=importGltfToSpatialScene(pbrGltfFixture(),{sceneId:'asset:aether-pbr-beacon'});imported.scene.reality={worldId:createStableWorldConfig().worldId,generation:ctx.server.rsrWorld.tick,realityRoot:authorityRoot};imported.scene.cameras[0].transform={translation:[0,0,5]};const projection=renderSpatialReference(imported.scene,{width:320,height:180,enableShadows:false,animation:{clipId:'animation:gltf:0',timeSeconds:.62}});
  const acceptance={stableEmbodiment:diagnostics.capsuleObbContacts>0&&diagnostics.warmStartedFrictionContacts>0&&diagnostics.largestSolverIsland>=2&&diagnostics.sleepingIslands>0,traversalAssistance:traversal.coyoteJumps===1&&traversal.bufferedJumps===1&&traversal.coyoteVelocityY>0&&traversal.bufferedVelocityY>0,twoClientAuthorityConvergence:authorityRoot===blueRoot&&authorityRoot===redRoot,temporalProjectionPreservesAuthority:temporalFrame.authorityStateRoot===authorityRoot&&temporalFrame.frameRoot!==authorityRoot,completePbrProjection:imported.receipt.materialTextureBindingCount===5&&projection.framePlan.stats.materialTextureBindings===5&&verifySpatialFrame(projection.framePlan).ok,authorityPresentationSeparation:imported.scene.reality.realityRoot===authorityRoot&&projection.framePlan.frameRoot!==authorityRoot};
  return{format:'rncs.stable-embodiment-pbr-evidence.v0.9',versions:{mother:'0.9.0-alpha.1',rsr:'0.9.0-alpha.1',vsr:'0.8.0-alpha.1',network:'0.2.0-alpha.1'},sessionId,tick:ctx.server.rsrWorld.tick,authorityRoot,clientRoots:{blue:blueRoot,red:redRoot},temporalPresentationRoot:temporalFrame.frameRoot,assetPresentationRoot:projection.framePlan.frameRoot,materialRoot:projection.framePlan.materialRoot,textureRoot:projection.framePlan.textureRoot,pixelRoot:projection.pixelRoot,diagnostics,traversal,gltfReceipt:imported.receipt,acceptance,png:projection.png};
}
