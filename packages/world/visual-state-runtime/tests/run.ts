import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyTransaction, VSRHistory } from '../packages/agent-protocol/src/index.js';
import { projectionToVSR, interactionToSubjectIntent, interactionProposalToSubjectIntent, interactionCommitToRFERequest, RFEVSRConstitutionalJournal, type RFEObserverProjection } from '../packages/adapter-rfe/src/index.js';
import { compileRealityOneUnifiedV02Projection, createRealityOneLiveDocument, createRealityOneObserverProfile, createRealityOneUnifiedV02Document, normalizeRealityOneResult, normalizeRealityOneUnifiedV02, RealityOneVSRSession, RealityOneVSRGatewayBridge, realityOneResultToLifecycleEvents, realityOneResultToVSR, sealRealityOneLifecycleEvent, type RealityOneGatewayTransport } from '../packages/adapter-reality-one/src/index.js';
import { decodePng, encodePng, PixelSurface, rasterizeDisplayState, renderPng } from '../packages/backend-canvas/src/index.js';
import { VSRNullBackend } from '../packages/backend-null/src/index.js';
import { evaluateAt, prepareDocument, reduceEvents, VSRRuntimeSession } from '../packages/core/src/index.js';
import { deterministicRandom, evaluateExpression, parseExpression } from '../packages/expression/src/index.js';
import { projectDisplayForObserver, verifyObserverProjectionSet, type VSRObserverProfile } from '../packages/observer-projection/src/index.js';
import { createDeviceProfile, projectDisplayForDevice, verifyDeviceProjectionSet } from '../packages/device-projection/src/index.js';
import { sealInteractionAuthorization, VSRInteractionController, type VSRInteractionAuthorization, type VSRInteractionProposal, type VSRInteractionCommitReceipt } from '../packages/interaction-runtime/src/index.js';
import { VSRSharedRealityCoordinator, VSRSharedRealityReplica, verifySharedRealityEventChain, type VSRSharedCommitCandidate } from '../packages/shared-coordination/src/index.js';
import { VSRSharedRealityHttpServer } from '../packages/shared-coordination/src/http.js';
import { DeterministicSimulationWorld, replaySimulation, snapshotToCausalDelta, type SimulationWorldConfig } from '../packages/simulation-core/src/index.js';
import { simulateBranch, simulateBranchSet, compareSimulationBranches, selectSimulationBranch, verifySimulationBranchSet, type VSRSimulationBranchPlan } from '../packages/simulation-branch/src/index.js';
import { SimulationBranchVSRBridge, createSimulationBranchDensityDocument, createSimulationBranchDocument, createSimulationBranchObserverProfile } from '../packages/simulation-branch-vsr/src/index.js';
import { RFEVSRSimulationJournal, simulationSelectionToRFERequest } from '../packages/adapter-rsr/src/index.js';
import { buildRealityAssets, verifyRealityBuildManifest } from '../packages/build-pipeline/src/index.js';
import { encodeVideoFromManifest, ffmpegAvailable, renderFrame, renderRange } from '../packages/renderer/src/index.js';
import { cryptographicHash, documentHash, semanticHash, sha256Hex, validateDocument, type VSRDiagnostic, type VSRDocument, type VSRState } from '../packages/spec/src/index.js';
import { compileWebGPUPlan } from '../packages/backend-webgpu/src/index.js';
import { compileHybridRenderPlan, verifyHybridRenderPlan } from '../packages/backend-hybrid/src/index.js';
import { tessellatePath } from '../packages/path-tessellation/src/index.js';
import { applyRealityStudioVSRPatch, compileRealityStudioVSRBridge, createRealityStudioPatchFromVSRDocument, realityStudioProjectToVSR, RealityStudioLiveVSRSession, type RealityStudioLiveEvent, type RealityStudioProject } from '../packages/adapter-reality-studio/src/index.js';
import type { VSRBitmapFont, VSRImageBitmap } from '../packages/backend-canvas/src/index.js';
import { collectDocumentText, collectGlyphs, verifyFrozenFont, type VSRFrozenFont } from '../packages/font-freeze/src/index.js';
import { comparePerceptualPlans, compileVisualRealityPlan, renderVisualRealityReference, resolveRenderBudget, verifyVisualRealityPlan, type VSRVisualRealityConfig } from '../packages/visual-reality-compiler/src/index.js';
import { compileRealityBuildGPURequirement, compileRealityStudioGPUViewport, verifyRealityBuildGPURequirement, verifyRealityStudioGPUViewport } from '../packages/adapter-reality-products/src/index.js';
import { compileRealtimeWebGPUFrame, packWebGPUTextureAtlas, probeRealtimeWebGPU, verifyRealtimeGPUReceipt, verifyRealtimeWebGPUFrame, VSR_LIGHT_CULL_SHADER_V03, VSR_PARTICLE_SHADER_V03, VSR_POST_SHADER_V03, VSR_SCENE_SHADER_V03, type VSRRealtimeGPUFrameReceipt } from '../packages/realtime-webgpu/src/index.js';
import { hashRealtimeWebGPUValue, normalizeRealtimeWebGPUFrame, verifyRealtimeWebGPUFrame as verifyBrowserRealtimeWebGPUFrame } from '../packages/realtime-webgpu/src/browser-executor.js';
import { computeHNACStateRoot, createVSRHNACSnapshot, exportVSRHNACBundle, mergeHNACPortableStates, restoreVSRSessionFromHNACSnapshot, sealHNACPortableState, verifyVSRHNACSnapshot } from '../packages/adapter-hnac-state/src/index.js';

const tests:Array<{name:string;fn:()=>void|Promise<void>}>=[];const test=(name:string,fn:()=>void|Promise<void>)=>tests.push({name,fn});
const load=(path:string)=>JSON.parse(readFileSync(path,'utf8')) as VSRDocument;
const hello=load('examples/hello-title.vsr.json');

test('Visual IR validation and semantic hash',()=>{const report=validateDocument(hello);assert.equal(report.ok,true);const reordered=JSON.parse(JSON.stringify(hello)) as VSRDocument;assert.equal(documentHash(hello),documentHash(reordered));const invalid={...hello,nodes:[...hello.nodes,{...hello.nodes[0],id:hello.nodes[0]!.id}]};assert.equal(validateDocument(invalid).ok,false)});
test('expression parser, dependency extraction and sandbox',()=>{const parsed=parseExpression("clamp(vars.value / 100, 0, 1) + sin(time)");assert.deepEqual(parsed.dependencies,['vars.value']);const result=evaluateExpression(parsed,{time:0,frame:0,fps:30,vars:{value:50},context:{},input:{},seed:7});assert.equal(result,0.5);assert.throws(()=>parseExpression('vars.constructor.constructor(\"return process\")()'))});
test('deterministic random is indexed and stable',()=>{assert.equal(deterministicRandom(1,'a',4),deterministicRandom(1,'a',4));assert.notEqual(deterministicRandom(1,'a',4),deterministicRandom(1,'a',5))});
test('canonical SHA-256 commitment matches the standard vector',()=>{assert.equal(sha256Hex('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');assert.equal(cryptographicHash({b:2,a:1}),cryptographicHash({a:1,b:2}))});
test('event reducer is pure and seekable',()=>{const initial:VSRState={variables:{value:1,flag:false},interaction:{},runtime:{}};const events=[{id:'e1',time:1,type:'increment' as const,target:'value',value:2},{id:'e2',time:2,type:'toggle' as const,target:'flag'}];const d:VSRDiagnostic[]=[];const at1=reduceEvents(initial,events,1,d);const at2=reduceEvents(initial,events,2,d);assert.equal(at1.variables.value,3);assert.equal(at1.variables.flag,false);assert.equal(at2.variables.flag,true);assert.equal(initial.variables.value,1)});
test('direct seek and repeat evaluation are deterministic',()=>{const prepared=prepareDocument(hello);const direct=evaluateAt({document:prepared,time:3.25});evaluateAt({document:prepared,time:1});const again=evaluateAt({document:prepared,time:3.25});assert.equal(direct.semanticHash,again.semanticHash);const a=evaluateAt({document:prepared,time:0.5});evaluateAt({document:prepared,time:4.5});const a2=evaluateAt({document:prepared,time:0.5});assert.equal(a.semanticHash,a2.semanticHash)});
test('responsive context changes layout but preserves document hash',()=>{const landscape=evaluateAt({document:hello,time:1,context:{width:960,height:540}});const portrait=evaluateAt({document:hello,time:1,context:{width:540,height:960}});assert.equal(landscape.displayState.documentHash,portrait.displayState.documentHash);assert.notEqual(landscape.semanticHash,portrait.semanticHash)});
test('null backend emits stable commands',()=>{const state=evaluateAt({document:hello,time:1.5}).displayState;const backend=new VSRNullBackend();assert.equal(backend.render(state).commandHash,backend.render(state).commandHash);assert.ok(backend.render(state).itemCount>=2)});
test('node rasterizer generates a real PNG',()=>{const state=evaluateAt({document:hello,time:1.5,context:{width:320,height:180}}).displayState;const png=renderPng(state);assert.ok(png.byteLength>100);assert.deepEqual([...png.slice(0,8)],[137,80,78,71,13,10,26,10])});
test('agent transaction is atomic and undo/redo restores hashes',()=>{const history=new VSRHistory();const before=documentHash(hello);const result=history.apply(hello,{transactionId:'add',operations:[{type:'addNode',node:{id:'test-node',type:'rect',layout:{x:1,y:1,width:10,height:10},appearance:{fill:{type:'solid',color:'#fff'}}}}]});assert.equal(result.ok,true);const changed=result.document!;assert.notEqual(documentHash(changed),before);const undone=history.undo(changed);assert.equal(undone?.ok,true);assert.equal(documentHash(undone!.document!),before);const redone=history.redo(undone!.document!);assert.equal(redone?.ok,true);assert.equal(documentHash(redone!.document!),result.documentHashAfter);const failure=applyTransaction(hello,{transactionId:'bad',operations:[{type:'removeNode',nodeId:'missing'}]});assert.equal(failure.ok,false);assert.equal(failure.documentHashBefore,before)});
test('RFE adapter preserves observer boundary and emits provisional intent',()=>{const projection:RFEObserverProjection={realityVersion:'r-10',logicalTime:3,observerId:'subject-a',visualSemantics:[{id:'door',kind:'entity',concept:'door',state:{locked:true}},{id:'warn',kind:'warning',concept:'locked'}],omittedInformation:[{category:'secret-room',reason:'unauthorized'}]};const input=projectionToVSR(projection,hello);const rfe=input.variables.rfe as Record<string,unknown>;assert.equal(rfe.observerId,'subject-a');assert.equal(JSON.stringify(input).includes('secret-room'),false);const intent=interactionToSubjectIntent(projection,{type:'open-door',nodeId:'door',time:3});assert.equal(intent.provisional,true);assert.equal(intent.realityVersion,'r-10')});
test('range renderer writes deterministic manifest and optional video',()=>{const out=resolve('outputs/test-range');rmSync(out,{recursive:true,force:true});const manifest=renderRange(hello,{start:0,end:0.2,fps:5,outDir:out,context:{width:160,height:90}});assert.equal(manifest.frames.length,2);assert.ok(existsSync(resolve(out,'frames-manifest.json')));for(const frame of manifest.frames)assert.ok(statSync(frame.filename).size>100);const rerun=renderRange(hello,{start:0,end:0.2,fps:5,outDir:resolve('outputs/test-range-2'),context:{width:160,height:90}});assert.deepEqual(manifest.frames.map(f=>f.semanticHash),rerun.frames.map(f=>f.semanticHash));if(ffmpegAvailable()){const video=resolve('outputs/test-range.mp4');encodeVideoFromManifest(manifest,video,'mp4');assert.ok(existsSync(video));assert.ok(statSync(video).size>100)}});


test('dependency graph enables selective incremental node reuse',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'incremental',title:'Incremental',duration:5,defaultFps:30,seed:1},canvas:{width:200,height:100},variables:{label:'A'},nodes:[
    ...Array.from({length:40},(_,index)=>({id:`static-${index}`,type:'rect' as const,layout:{x:index*4,y:0,width:3,height:20},appearance:{fill:{type:'solid' as const,color:'#fff'}}})),
    {id:'dynamic',type:'text',layout:{x:0,y:30,width:100,height:20},appearance:{fill:{type:'solid',color:'#fff'}},content:{text:{binding:'vars.label'},fontSize:12},tracks:[{id:'move',property:'transform.translateX',mode:'expression',expression:'time * 2'}]}
  ]};
  const session=new VSRRuntimeSession(document);const first=session.evaluate(0);const second=session.evaluate(1);assert.equal(first.evaluationStats.resolvedNodeCount,41);assert.equal(second.evaluationStats.resolvedNodeCount,1);assert.equal(second.evaluationStats.reusedResolvedNodeCount,40);const report=session.dependencyReport();assert.deepEqual(report.variables['vars.label'],['dynamic']);assert.deepEqual(report.timeDependent,['dynamic']);
});

test('node rasterizer applies affine transform instead of filling world bounds',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'rotate',title:'Rotate',duration:1,defaultFps:30,seed:1},canvas:{width:60,height:60},nodes:[{id:'box',type:'rect',layout:{x:20,y:25,width:20,height:10},transform:{rotation:45,originX:10,originY:5},appearance:{fill:{type:'solid',color:'#ff0000'}}}]};
  const result=evaluateAt({document,time:0});const item=result.displayState.items[0]!;const surface=rasterizeDisplayState(result.displayState);const corner=surface.getPixel(Math.floor(item.worldBounds.x+1),Math.floor(item.worldBounds.y+1));const center=surface.getPixel(30,30);assert.equal(corner[3],0);assert.ok(center[0]>200&&center[3]>200);
});

test('group clipping constrains descendants in node rasterizer',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'clip',title:'Clip',duration:1,defaultFps:30,seed:1},canvas:{width:40,height:40},nodes:[
    {id:'clip-group',type:'group',layout:{x:5,y:5,width:20,height:20},content:{clip:true}},
    {id:'child',parentId:'clip-group',type:'rect',layout:{x:10,y:10,width:20,height:20},appearance:{fill:{type:'solid',color:'#00ff00'}}}
  ]};
  const state=evaluateAt({document,time:0}).displayState;assert.equal(state.items[0]!.clipStack?.length,1);const surface=rasterizeDisplayState(state);assert.ok(surface.getPixel(18,18)[1]>200);assert.equal(surface.getPixel(28,28)[3],0);
});

test('node path rasterizer fills actual SVG path geometry',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'path',title:'Path',duration:1,defaultFps:30,seed:1},canvas:{width:40,height:40},nodes:[{id:'triangle',type:'path',layout:{x:0,y:0,width:40,height:40},appearance:{fill:{type:'solid',color:'#0088ff'}},content:{d:'M 5 35 L 20 5 L 35 35 Z'}}]};
  const surface=rasterizeDisplayState(evaluateAt({document,time:0}).displayState);assert.ok(surface.getPixel(20,20)[2]>200);assert.equal(surface.getPixel(5,5)[3],0);
});

test('local PNG image resources are decoded and rendered',()=>{
  const directory=resolve('outputs/resource-test');rmSync(directory,{recursive:true,force:true});mkdirSync(directory,{recursive:true});const source=new PixelSurface(2,2);source.fillRect({x:0,y:0,width:2,height:2},{type:'solid',color:'#ff3300'});writeFileSync(resolve(directory,'source.png'),encodePng(source));
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'image-resource',title:'Image',duration:1,defaultFps:30,seed:1},canvas:{width:20,height:20},assets:[{id:'source',type:'image',src:'source.png',mimeType:'image/png'}],nodes:[{id:'image',type:'image',layout:{x:0,y:0,width:20,height:20},content:{assetId:'source',fit:'fill'}}]};
  const output=resolve(directory,'rendered.png');renderFrame(document,0,output,{}, {assetBaseDir:directory,strictResources:true});const decoded=decodePng(readFileSync(output));const pixel=decoded.data.slice((10*decoded.width+10)*4,(10*decoded.width+10)*4+4);assert.ok(pixel[0]!>240&&pixel[1]!>30&&pixel[1]!<80&&pixel[3]===255);
});

test('deterministic bitmap font assets are loaded for node rendering',()=>{
  const directory=resolve('outputs/font-test');rmSync(directory,{recursive:true,force:true});mkdirSync(directory,{recursive:true});try{writeFileSync(resolve(directory,'solid.vsrfont.json'),JSON.stringify({format:'vsr-bitmap-font-1',family:'Solid',glyphWidth:5,glyphHeight:7,advance:6,glyphs:{X:['11111','11111','11111','11111','11111','11111','11111'],' ':['00000','00000','00000','00000','00000','00000','00000']}}));
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'font-resource',title:'Font',duration:1,defaultFps:30,seed:1},canvas:{width:20,height:20},assets:[{id:'solid-font',type:'font',src:'solid.vsrfont.json',mimeType:'application/json'}],nodes:[{id:'text',type:'text',layout:{x:0,y:0,width:20,height:20},appearance:{fill:{type:'solid',color:'#00ff00'}},content:{text:'X',fontFamily:'Solid',fontSize:16}}]};
  const output=resolve(directory,'rendered.png');renderFrame(document,0,output,{}, {assetBaseDir:directory,strictResources:true});const decoded=decodePng(readFileSync(output)),index=(10*decoded.width+5)*4;assert.ok(decoded.data[index+1]!>240&&decoded.data[index+3]===255);}finally{rmSync(directory,{recursive:true,force:true});}
});

test('projection cache skips clean branches and preserves stable display item identity',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'projection-cache',title:'Projection Cache',duration:5,defaultFps:30,seed:1},canvas:{width:200,height:120},nodes:[
    {id:'static-group',type:'group',layout:{x:0,y:0,width:100,height:100}},
    ...Array.from({length:20},(_,index)=>({id:`static-child-${index}`,parentId:'static-group',type:'rect' as const,layout:{x:(index%5)*18,y:Math.floor(index/5)*18,width:14,height:14},appearance:{fill:{type:'solid' as const,color:'#ffffff'}}})),
    {id:'dynamic',type:'rect',layout:{x:120,y:20,width:20,height:20},appearance:{fill:{type:'solid',color:'#2f8cff'}},tracks:[{id:'move',property:'transform.translateY',mode:'expression',expression:'time * 3'}]}
  ]};
  const session=new VSRRuntimeSession(document);const first=session.evaluate(0);const second=session.evaluate(1);
  assert.equal(first.displayState.items[0]!.id,first.displayState.items[0]!.nodeId);
  assert.equal(second.evaluationStats.projectedNodeCount,1);
  assert.ok(second.evaluationStats.skippedProjectionNodeCount>=21);
  assert.ok(second.evaluationStats.reusedDisplayItemCount>=20);
  assert.equal(second.displayState.items.length,21);
});

test('projection cache removes descendants when a parent becomes invisible',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'visibility-cache',title:'Visibility Cache',duration:2,defaultFps:30,seed:1},canvas:{width:100,height:100},nodes:[
    {id:'group',type:'group',visible:{expression:'time < 1'},layout:{x:0,y:0,width:100,height:100}},
    {id:'child',parentId:'group',type:'rect',layout:{x:10,y:10,width:20,height:20},appearance:{fill:{type:'solid',color:'#ffffff'}}}
  ]};
  const session=new VSRRuntimeSession(document);assert.equal(session.evaluate(0).displayState.items.length,1);assert.equal(session.evaluate(1.5).displayState.items.length,0);assert.equal(session.evaluate(.5).displayState.items.length,1);
});

test('Reality One adapter produces valid desktop and mobile Visual IR',()=>{
  const result={status:'committed',applicationResultHash:'abc123',intent:{source:'把项目进度提高到30%，生成状态报告并通知我。'},authority:{status:'approved'},execution:{stepReceipts:[{stepId:'step:1:lar.progress.target',status:'completed'},{stepId:'step:2:lar.report.render',status:'completed'}],executionRoot:'exec-root'},atomicReceipt:{status:'committed',finalGlobalRoot:'global-root'},artifact:{identity:{title:'Reality-Native Computing Stack'},semantic:{fields:{progress:{value:30},status:{value:'prototype'},generated_report:{value:'项目状态报告已生成。'}}}}};
  const normalized=normalizeRealityOneResult(result);assert.equal(normalized.phase,'result');assert.equal(normalized.progress,30);assert.equal(normalized.steps[0]!.title,'推进进度');
  const desktop=realityOneResultToVSR(result,{profile:'desktop'});const mobile=realityOneResultToVSR(result,{profile:'mobile'});assert.equal(validateDocument(desktop).ok,true);assert.equal(validateDocument(mobile).ok,true);assert.equal(desktop.canvas.width,1280);assert.equal(mobile.canvas.width,390);assert.ok(desktop.nodes.some(node=>node.id==='progress-fill'));assert.equal(evaluateAt({document:desktop,time:0}).displayState.items.length>10,true);
});



test('runtime session variable patches preserve document and selectively invalidate bindings',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'live-vars',title:'Live Variables',duration:1,defaultFps:30,seed:1},canvas:{width:240,height:100},variables:{label:'A'},nodes:[
    ...Array.from({length:20},(_,index)=>({id:`static-${index}`,type:'rect' as const,layout:{x:index*5,y:0,width:4,height:20},appearance:{fill:{type:'solid' as const,color:'#ffffff'}}})),
    {id:'bound-label',type:'text',layout:{x:0,y:30,width:180,height:30},appearance:{fill:{type:'solid',color:'#ffffff'}},content:{text:{binding:'vars.label'},fontSize:16}}
  ]};
  const session=new VSRRuntimeSession(document);const first=session.evaluate(0);session.setVariables({label:'B'});const second=session.evaluate(0);
  assert.equal(first.displayState.documentHash,second.displayState.documentHash);assert.equal(second.evaluationStats.resolvedNodeCount,1);assert.equal(second.evaluationStats.reusedResolvedNodeCount,20);assert.equal(second.displayState.items.find(item=>item.nodeId==='bound-label')?.content.text,'B');
});

test('Reality One lifecycle replay is deterministic, chained and incrementally projected',()=>{
  const result={status:'committed',applicationResultHash:'abc123',intent:{source:'把项目进度提高到30%，生成状态报告并通知我。'},plan:{requiredScopes:['artifact.write'],requiredHostCapabilities:['display.text'],steps:[{id:'step:1:lar.progress.target',capabilityId:'lar.progress.target'},{id:'step:2:lar.report.render',capabilityId:'lar.report.render'}]},authority:{status:'approved',denied:[]},execution:{stepReceipts:[{stepId:'step:1:lar.progress.target',status:'completed'},{stepId:'step:2:lar.report.render',status:'completed'}],executionRoot:'exec-root'},atomicReceipt:{status:'committed',finalGlobalRoot:'global-root'},artifact:{identity:{title:'Reality-Native Computing Stack'},semantic:{fields:{progress:{value:30},status:{value:'prototype'},generated_report:{value:'项目状态报告已生成。'}}}}};
  const events=realityOneResultToLifecycleEvents(result,'session:test');const first=new RealityOneVSRSession({profile:'desktop'});const manifestA=first.replay(events);const second=new RealityOneVSRSession({profile:'desktop'});const manifestB=second.replay(events);
  assert.equal(manifestA.eventChainRoot,manifestB.eventChainRoot);assert.equal(manifestA.finalStateHash,manifestB.finalStateHash);assert.equal(manifestA.finalDisplayHash,manifestB.finalDisplayHash);assert.equal(first.currentSummary().phase,'result');assert.equal(first.currentSummary().progress,30);assert.equal(first.currentSummary().eventCount,events.length);assert.ok(manifestA.frames.slice(1).some(frame=>frame.evaluation.resolvedNodeCount<first.document.nodes.length));
  const snapshot=first.snapshotDocument();assert.equal(validateDocument(snapshot).ok,true);assert.equal(snapshot.variables?.progress,30);assert.throws(()=>first.append({...events.at(-1)!,sequence:events.length+2}));
});

test('Reality One live template keeps a stable Visual IR across lifecycle phases',()=>{
  const document=createRealityOneLiveDocument({profile:'mobile'});assert.equal(validateDocument(document).ok,true);const session=new RealityOneVSRSession({profile:'mobile'});const initialHash=session.evaluate().displayState.documentHash;
  session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'mobile:1',sequence:1,type:'intent.received',payload:{intentText:'生成状态报告'}});const understanding=session.evaluate();
  session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'mobile:1',sequence:2,type:'authority.resolved',payload:{status:'approved'}});const permission=session.evaluate();
  assert.equal(understanding.displayState.documentHash,initialHash);assert.equal(permission.displayState.documentHash,initialHash);assert.notEqual(understanding.semanticHash,permission.semanticHash);assert.equal(session.currentSummary().phase,'permission');
});

test('Reality One lifecycle protocol rejects unknown event types and exposes formal schema',()=>{
  assert.throws(()=>sealRealityOneLifecycleEvent({format:'reality-one.lifecycle-event.v0.1',sessionId:'s',sequence:1,type:'unknown.event',payload:{}} as never));
  const schema=JSON.parse(readFileSync('schemas/reality-one-lifecycle-event.v0.1.schema.json','utf8')) as Record<string,unknown>;assert.equal(schema['$schema'],'https://json-schema.org/draft/2020-12/schema');const properties=schema.properties as Record<string,unknown>;const type=properties.type as Record<string,unknown>;assert.ok((type.enum as unknown[]).includes('application.committed'));
});

test('formal JSON Schema 2020-12 artifact is present and aligned with spec version',()=>{
  const schema=JSON.parse(readFileSync('schemas/vsr-0.1.schema.json','utf8')) as Record<string,unknown>;assert.equal(schema['$schema'],'https://json-schema.org/draft/2020-12/schema');const properties=schema.properties as Record<string,unknown>;const specVersion=properties.specVersion as Record<string,unknown>;assert.equal(specVersion.const,'0.1');
});



test('observer projection fabric applies inherited show redact and hide policies deterministically',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'observer-policy',title:'Observer Policy',duration:1,defaultFps:30,seed:1},canvas:{width:320,height:160},nodes:[
    {id:'public',type:'text',layout:{x:0,y:0,width:120,height:20},content:{text:'public'}},
    {id:'private-group',type:'group',layout:{x:0,y:30,width:300,height:100},extensions:{'vsr:observer-policy':{format:'vsr.observer-policy.v0.1',anyRole:['operator'],deny:'hide',reason:'private-group'}}},
    {id:'secret',parentId:'private-group',type:'text',layout:{x:0,y:0,width:120,height:20},content:{text:'secret'}},
    {id:'redacted',type:'text',layout:{x:0,y:130,width:160,height:20},content:{text:'sensitive'},extensions:{'vsr:observer-policy':{format:'vsr.observer-policy.v0.1',anyScope:['secret.read'],deny:'redact',redactionText:'MASKED'}}}
  ]};
  const source=evaluateAt({document,time:0}).displayState;
  const guest:VSRObserverProfile={format:'vsr.observer-profile.v0.1',observerId:'guest',roles:['guest'],scopes:[],clearance:0};
  const operator:VSRObserverProfile={format:'vsr.observer-profile.v0.1',observerId:'operator',roles:['operator'],scopes:['secret.read'],clearance:2};
  const a=projectDisplayForObserver(document,source,guest,{invariant:{reality:'same'}});const b=projectDisplayForObserver(document,source,guest,{invariant:{reality:'same'}});const op=projectDisplayForObserver(document,source,operator,{invariant:{reality:'same'}});
  assert.equal(a.manifest.projectedDisplayHash,b.manifest.projectedDisplayHash);assert.ok(a.manifest.hiddenNodeIds.includes('secret'));assert.ok(a.manifest.redactedNodeIds.includes('redacted'));assert.equal(a.displayState.items.find(item=>item.nodeId==='redacted')?.content.text,'MASKED');assert.ok(op.manifest.shownNodeIds.includes('secret'));assert.ok(op.manifest.shownNodeIds.includes('redacted'));assert.notEqual(a.displayState.semanticHash,op.displayState.semanticHash);
});

test('Reality One produces observer-relative views with a shared reality invariant',()=>{
  const result={status:'committed',applicationResultHash:'observer-result',intent:{source:'生成内部状态报告并保留证据链。'},plan:{steps:[{id:'step:1:lar.report.render',capabilityId:'lar.report.render'}]},authority:{status:'approved'},execution:{stepReceipts:[{stepId:'step:1:lar.report.render',status:'completed'}],executionRoot:'exec-observer'},atomicReceipt:{status:'committed',finalGlobalRoot:'root-secret'},artifact:{identity:{title:'观察者投影测试'},semantic:{fields:{progress:{value:100},status:{value:'committed'},generated_report:{value:'内部报告：关键项目状态正常。'}}}}};
  const session=new RealityOneVSRSession({profile:'desktop'});session.replay(realityOneResultToLifecycleEvents(result,'observer-session'));
  const owner=createRealityOneObserverProfile('owner');const auditor=createRealityOneObserverProfile('auditor');const guest=createRealityOneObserverProfile('guest');const set=session.evaluateForObservers([owner,auditor,guest]);
  assert.equal(set.verification.ok,true);assert.equal(set.verification.observerCount,3);assert.equal(new Set(set.projections.map(view=>view.manifest.invariantHash)).size,1);assert.equal(new Set(set.projections.map(view=>view.manifest.sourceDisplayHash)).size,1);
  const ownerView=set.projections.find(view=>view.observer.observerId==='observer:owner')!;const guestView=set.projections.find(view=>view.observer.observerId==='observer:guest')!;const auditorView=set.projections.find(view=>view.observer.observerId==='observer:auditor')!;
  assert.ok(ownerView.manifest.shownNodeIds.includes('report'));assert.ok(ownerView.manifest.shownNodeIds.includes('evidence'));assert.ok(guestView.manifest.redactedNodeIds.includes('intent-text'));assert.ok(guestView.manifest.redactedNodeIds.includes('report'));assert.ok(guestView.manifest.hiddenNodeIds.includes('evidence'));assert.ok(auditorView.manifest.redactedNodeIds.includes('intent-text'));assert.ok(auditorView.manifest.shownNodeIds.includes('evidence'));assert.notEqual(ownerView.displayState.semanticHash,guestView.displayState.semanticHash);session.dispose();
});

test('observer projection verification rejects mixed realities and overlapping disclosure sets',()=>{
  const session=new RealityOneVSRSession({profile:'mobile'});session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'mix',sequence:1,type:'intent.received',payload:{intentText:'测试'}});const first=session.evaluateForObserver(createRealityOneObserverProfile('owner'));
  session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'mix',sequence:2,type:'intent.understood',payload:{status:'已理解'}});const second=session.evaluateForObserver(createRealityOneObserverProfile('guest'));
  const mixed=verifyObserverProjectionSet([first,second]);assert.equal(mixed.ok,false);assert.ok(mixed.diagnostics.some(message=>message.includes('different source display hash')||message.includes('different reality invariant hash')));session.dispose();
});

test('observer profile formal schema is present',()=>{
  const schema=JSON.parse(readFileSync('schemas/vsr-observer-profile.v0.1.schema.json','utf8')) as Record<string,unknown>;assert.equal(schema['$schema'],'https://json-schema.org/draft/2020-12/schema');const properties=schema.properties as Record<string,unknown>;const format=properties.format as Record<string,unknown>;assert.equal(format.const,'vsr.observer-profile.v0.1');
});


test('device projection fabric preserves a shared reality invariant across desktop mobile tablet and XR',()=>{
  const source=evaluateAt({document:hello,time:1.25,context:{width:960,height:540}}).displayState;
  const invariant={realityVersion:'r-1',generation:7};
  const projections=['desktop','mobile','tablet','xr'].map(kind=>projectDisplayForDevice(source,createDeviceProfile(kind as 'desktop'|'mobile'|'tablet'|'xr'),{invariant}));
  const verification=verifyDeviceProjectionSet(projections);
  assert.equal(verification.ok,true);assert.equal(verification.deviceCount,4);assert.equal(new Set(projections.map(entry=>entry.manifest.equivalenceHash)).size,1);assert.equal(new Set(projections.map(entry=>entry.displayState.viewport.width)).size,4);assert.ok(projections.every(entry=>entry.displayState.items.length>0));
});

test('device projection verification rejects mixed source realities',()=>{
  const first=evaluateAt({document:hello,time:0}).displayState;const second=evaluateAt({document:hello,time:1}).displayState;
  const mixed=verifyDeviceProjectionSet([projectDisplayForDevice(first,createDeviceProfile('desktop'),{invariant:{reality:'a'}}),projectDisplayForDevice(second,createDeviceProfile('mobile'),{invariant:{reality:'a'}})]);
  assert.equal(mixed.ok,false);assert.ok(mixed.diagnostics.some(message=>message.includes('different source display hash')));
});

test('runtime session display hash remains stable when diagnostics are not part of visual state',()=>{
  const runtime=new VSRRuntimeSession(load('examples/interactive-card.vsr.json'));const first=runtime.evaluate(0);const second=runtime.evaluate(0);assert.equal(first.semanticHash,second.semanticHash);runtime.dispose();
});

test('interaction runtime creates provisional proposals and commits only after authorization',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'interaction',title:'Interaction',duration:3,defaultFps:30,seed:3},canvas:{width:320,height:180},variables:{count:0},nodes:[{id:'button',type:'rect',layout:{x:20,y:20,width:100,height:40},appearance:{fill:{type:'solid',color:'#4488ff'}}},{id:'label',type:'text',layout:{x:20,y:80,width:200,height:30},content:{text:{binding:'vars.count'}}}],interactions:[{id:'increment',nodeId:'button',trigger:'click',action:{type:'setVariable',target:'count',value:{expression:'vars.count + 1'}}},{id:'emit',nodeId:'button',trigger:'click',action:{type:'emit',event:'counter.changed',payload:{next:{expression:'vars.count + 1'}}}}]};
  const runtime=new VSRRuntimeSession(document);const controller=new VSRInteractionController(document,runtime);const proposal=controller.propose({format:'vsr.input-event.v0.1',inputId:'click-1',trigger:'click',nodeId:'button',logicalTime:0});
  assert.equal(proposal.status,'provisional');assert.equal(proposal.variablePatches[0]?.after,1);assert.equal(runtime.evaluate(0).state.variables.count,0);
  const authorization=sealInteractionAuthorization({format:'vsr.interaction-authorization.v0.1',proposalHash:proposal.proposalHash,decision:'approved',authorityId:'subject:owner',grantedScopes:['counter.write'],logicalTime:0,evidenceRoot:'authority-root'});
  const committed=controller.commit(proposal,authorization);assert.equal(committed.receipt.status,'committed');assert.equal(committed.state.variables.count,1);assert.equal(committed.receipt.emissions[0]?.event,'counter.changed');assert.match(committed.receipt.commitHash,/^[a-f0-9]{64}$/);
});

test('interaction runtime rejects denied and stale proposals without mutating state',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'interaction-conflict',title:'Interaction conflict',duration:1,defaultFps:30,seed:1},canvas:{width:100,height:100},variables:{flag:false},nodes:[{id:'button',type:'rect',layout:{x:0,y:0,width:50,height:50}}],interactions:[{id:'toggle',nodeId:'button',trigger:'click',action:{type:'setVariable',target:'flag',value:true}}]};
  const runtime=new VSRRuntimeSession(document);const controller=new VSRInteractionController(document,runtime);const deniedProposal=controller.propose({format:'vsr.input-event.v0.1',inputId:'denied',trigger:'click',nodeId:'button',logicalTime:0});const denied=controller.commit(deniedProposal,{format:'vsr.interaction-authorization.v0.1',proposalHash:deniedProposal.proposalHash,decision:'denied',authorityId:'policy',logicalTime:0,reason:'not-allowed'});assert.equal(denied.receipt.status,'denied');assert.equal(runtime.evaluate(0).state.variables.flag,false);
  const staleProposal=controller.propose({format:'vsr.input-event.v0.1',inputId:'stale',trigger:'click',nodeId:'button',logicalTime:0});runtime.setVariables({flag:true});const stale=controller.commit(staleProposal,{format:'vsr.interaction-authorization.v0.1',proposalHash:staleProposal.proposalHash,decision:'approved',authorityId:'subject:owner',logicalTime:0});assert.equal(stale.receipt.status,'stale');assert.equal(runtime.evaluate(0).state.variables.flag,true);
});

test('Reality One authority UI interaction enters the lifecycle event chain and projects across devices',()=>{
  const session=new RealityOneVSRSession({profile:'desktop'});session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'interactive:1',sequence:1,type:'intent.received',payload:{intentText:'生成报告'}});session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'interactive:1',sequence:2,type:'intent.understood',payload:{status:'已理解'}});session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'interactive:1',sequence:3,type:'authority.requested',payload:{status:'等待权限确认'}});
  const observer=createRealityOneObserverProfile('owner');const device=createDeviceProfile('mobile');const proposal=session.proposeInteraction({format:'vsr.input-event.v0.1',inputId:'approve-1',trigger:'click',nodeId:'authority-approve',logicalTime:0,observerId:observer.observerId,deviceId:device.deviceId},observer,device);assert.equal(proposal.emissions[0]?.event,'reality-one.authority.approve');
  const result=session.commitInteraction(proposal,{format:'vsr.interaction-authorization.v0.1',proposalHash:proposal.proposalHash,decision:'approved',authorityId:'subject:owner',logicalTime:0,evidenceRoot:'constitutional-root'});assert.equal(result.receipt.status,'committed');assert.equal(result.lifecycleEvent?.type,'authority.resolved');assert.equal(session.currentSummary().authorityStatus,'approved');assert.equal(session.eventLog().length,4);
  const devices=session.evaluateForDefaultDevices(observer);assert.equal(devices.verification.ok,true);assert.equal(devices.verification.deviceCount,4);session.dispose();
});

test('RFE adapter converts an interaction proposal into a provisional subject intent with evidence bindings',()=>{
  const projection:RFEObserverProjection={realityVersion:'r-constitutional-1',logicalTime:8,observerId:'observer:owner',visualSemantics:[]};const document:VSRDocument={specVersion:'0.1',metadata:{id:'rfe-interaction',title:'RFE Interaction',duration:1,defaultFps:30,seed:1},canvas:{width:100,height:100},nodes:[{id:'button',type:'rect',layout:{x:0,y:0,width:50,height:50}}],interactions:[{id:'emit-intent',nodeId:'button',trigger:'click',action:{type:'emit',event:'door.open',payload:{doorId:'door:1'}}}]};const runtime=new VSRRuntimeSession(document);const controller=new VSRInteractionController(document,runtime);const proposal=controller.propose({format:'vsr.input-event.v0.1',inputId:'rfe-click',trigger:'click',nodeId:'button',logicalTime:8,observerId:'observer:owner',deviceId:'device:mobile'});const intent=interactionProposalToSubjectIntent(projection,proposal);assert.equal(intent.provisional,true);assert.equal(intent.intentType,'door.open');assert.equal(intent.payload.proposalHash,proposal.proposalHash);assert.equal(intent.realityVersion,'r-constitutional-1');runtime.dispose();
});

test('device and interaction schemas are present',()=>{
  for(const file of ['schemas/vsr-device-profile.v0.1.schema.json','schemas/vsr-input-event.v0.1.schema.json','schemas/vsr-interaction-authorization.v0.1.schema.json']){const schema=JSON.parse(readFileSync(file,'utf8')) as Record<string,unknown>;assert.equal(schema['$schema'],'https://json-schema.org/draft/2020-12/schema')}
});



type SharedFixture = {
  proposal: VSRInteractionProposal;
  authorization: VSRInteractionAuthorization;
  receipt: VSRInteractionCommitReceipt;
};

function makeSharedDocument(): VSRDocument {
  return {
    specVersion:'0.1',metadata:{id:'shared-doc',title:'Shared',duration:10,defaultFps:30,seed:17},canvas:{width:400,height:240},variables:{left:0,right:0},
    nodes:[
      {id:'left-node',type:'rect',layout:{x:20,y:40,width:120,height:80},appearance:{fill:{type:'solid',color:'#4488ff'}}},
      {id:'right-node',type:'rect',layout:{x:220,y:40,width:120,height:80},appearance:{fill:{type:'solid',color:'#44cc88'}}},
    ],
    interactions:[
      {id:'set-left',nodeId:'left-node',trigger:'click',action:{type:'setVariable',target:'left',value:1}},
      {id:'set-right',nodeId:'right-node',trigger:'click',action:{type:'setVariable',target:'right',value:1}},
    ],
  };
}

function makeSharedFixture(document:VSRDocument,nodeId:string,inputId:string,authorityId:string,observerId='observer:owner',deviceId='device:desktop'):SharedFixture {
  const runtime=new VSRRuntimeSession(document);const controller=new VSRInteractionController(document,runtime);
  const proposal=controller.propose({format:'vsr.input-event.v0.1',inputId,trigger:'click',nodeId,logicalTime:0,observerId,deviceId});
  const authorization=sealInteractionAuthorization({format:'vsr.interaction-authorization.v0.1',proposalHash:proposal.proposalHash,decision:'approved',authorityId,logicalTime:0,evidenceRoot:semanticHash({authorityId,inputId})});
  const committed=controller.commit(proposal,authorization);runtime.dispose();
  return {proposal,authorization,receipt:committed.receipt};
}

function toCandidate(sessionId:string,replicaId:string,baseSequence:number,baseEventRoot:string,fixture:SharedFixture):VSRSharedCommitCandidate {
  return {format:'vsr.shared-interaction-candidate.v0.1',candidateId:`candidate:${fixture.proposal.input.inputId}`,sessionId,replicaId,baseSequence,baseEventRoot,logicalTime:fixture.proposal.input.logicalTime,proposal:fixture.proposal,authorization:fixture.authorization,receipt:fixture.receipt};
}

test('shared reality coordinator broadcasts direct commits and replicas verify the event chain',()=>{
  const document=makeSharedDocument();const hash=documentHash(document);const coordinator=new VSRSharedRealityCoordinator({sessionId:'shared:test',documentHash:hash,initialVariables:document.variables});const replica=new VSRSharedRealityReplica({replicaId:'replica:b',sessionId:'shared:test',documentHash:hash,initialVariables:document.variables});
  const broadcast:string[]=[];coordinator.subscribe(event=>broadcast.push(event.eventHash));const fixture=makeSharedFixture(document,'left-node','left-1','authority:owner');const result=coordinator.submit(toCandidate('shared:test','replica:a',0,'',fixture));assert.equal(result.ok,true);if(!result.ok)return;assert.equal(result.mergeMode,'direct');assert.equal(broadcast.length,1);
  const batch=coordinator.eventsAfter(replica.cursor());replica.applyBatch(batch);assert.deepEqual(replica.state(),{left:1,right:0});assert.deepEqual(replica.cursor(),coordinator.cursor());const verification=verifySharedRealityEventChain(batch.events,'shared:test');assert.equal(verification.ok,true);assert.equal(verification.eventRoot,coordinator.cursor().eventRoot);
});

test('shared reality coordinator deterministically rebases disjoint writes and rejects overlaps',()=>{
  const document=makeSharedDocument();const hash=documentHash(document);const coordinator=new VSRSharedRealityCoordinator({sessionId:'shared:merge',documentHash:hash,initialVariables:document.variables});const base=coordinator.cursor();
  const left=makeSharedFixture(document,'left-node','left-merge','authority:a');const right=makeSharedFixture(document,'right-node','right-merge','authority:b');const overlapping=makeSharedFixture(document,'left-node','left-conflict','authority:c');
  const first=coordinator.submit(toCandidate('shared:merge','replica:a',base.sequence,base.eventRoot,left));assert.equal(first.ok,true);const second=coordinator.submit(toCandidate('shared:merge','replica:b',base.sequence,base.eventRoot,right));assert.equal(second.ok,true);if(second.ok)assert.equal(second.mergeMode,'disjoint-rebase');const conflict=coordinator.submit(toCandidate('shared:merge','replica:c',base.sequence,base.eventRoot,overlapping));assert.equal(conflict.ok,false);if(!conflict.ok){assert.equal(conflict.code,'overlapping-write-conflict');assert.deepEqual(conflict.conflictTargets,['left'])}assert.deepEqual(coordinator.snapshot().variables,{left:1,right:1});
});

test('shared reality revocation is broadcast, replayable, and blocks future authority commits',()=>{
  const document=makeSharedDocument();const hash=documentHash(document);const coordinator=new VSRSharedRealityCoordinator({sessionId:'shared:revoke',documentHash:hash,initialVariables:document.variables});const replica=new VSRSharedRealityReplica({replicaId:'replica:offline',sessionId:'shared:revoke',documentHash:hash,initialVariables:document.variables});const before=replica.cursor();
  const event=coordinator.revoke({format:'vsr.shared-revocation-request.v0.1',revocationId:'revoke:owner',sessionId:'shared:revoke',targetKind:'authority',targetId:'authority:owner',revokedBy:'authority:root',logicalTime:1,previousEventRoot:coordinator.cursor().eventRoot});assert.equal(event.type,'authority.revoked');replica.applyBatch(coordinator.eventsAfter(before));assert.deepEqual(replica.revocationState().authorities,['authority:owner']);
  const fixture=makeSharedFixture(document,'left-node','left-after-revoke','authority:owner');const result=coordinator.submit(toCandidate('shared:revoke','replica:a',coordinator.cursor().sequence,coordinator.cursor().eventRoot,fixture));assert.equal(result.ok,false);if(!result.ok)assert.equal(result.code,'authority-revoked');
});

test('offline replica catches up from its cursor and snapshot hydration detects tampering',()=>{
  const document=makeSharedDocument();const hash=documentHash(document);const coordinator=new VSRSharedRealityCoordinator({sessionId:'shared:offline',documentHash:hash,initialVariables:document.variables});const replica=new VSRSharedRealityReplica({replicaId:'replica:offline',sessionId:'shared:offline',documentHash:hash,initialVariables:document.variables});
  const left=makeSharedFixture(document,'left-node','offline-left','authority:a');coordinator.submit(toCandidate('shared:offline','replica:a',0,'',left));replica.applyBatch(coordinator.eventsAfter(replica.cursor()));const disconnected=replica.cursor();const right=makeSharedFixture(document,'right-node','offline-right','authority:b');const second=coordinator.submit(toCandidate('shared:offline','replica:b',disconnected.sequence,disconnected.eventRoot,right));assert.equal(second.ok,true);replica.applyBatch(coordinator.eventsAfter(disconnected));assert.deepEqual(replica.state(),{left:1,right:1});
  const fresh=new VSRSharedRealityReplica({replicaId:'replica:fresh',sessionId:'shared:offline',documentHash:hash});const snapshot=coordinator.snapshot();fresh.hydrate(snapshot);assert.deepEqual(fresh.cursor(),coordinator.cursor());const tampered=JSON.parse(JSON.stringify(snapshot));tampered.variables.left=99;assert.throws(()=>fresh.hydrate(tampered));
});

test('RFE v1 constitutional commit bridge persists a hash-chained journal and reloads it',()=>{
  const document=makeSharedDocument();const hash=documentHash(document);const coordinator=new VSRSharedRealityCoordinator({sessionId:'shared:rfe',documentHash:hash,initialVariables:document.variables});const fixture=makeSharedFixture(document,'left-node','rfe-left','authority:cluster:aurora');const accepted=coordinator.submit(toCandidate('shared:rfe','replica:rfe',0,'',fixture));assert.equal(accepted.ok,true);if(!accepted.ok)return;
  const projection:RFEObserverProjection={realityVersion:'rfe-generation:1',logicalTime:1,observerId:'observer:owner',visualSemantics:[{id:'left-node',kind:'affordance',concept:'set-left'}]};const h=(value:unknown)=>cryptographicHash(value);const request=interactionCommitToRFERequest(projection,fixture.proposal,fixture.authorization,fixture.receipt,{rfeVersion:'1.0.0',epoch:2,configurationHash:h('configuration'),federationRoot:h('federation'),parentCertificateHash:h('certificate'),authorityClusterId:'cluster:aurora'},{sessionId:'shared:rfe',sequence:accepted.event.sequence,eventRoot:accepted.event.eventHash,sharedStateHash:accepted.snapshot.stateHash});
  const path=resolve('outputs/test-rfe-vsr-journal.json');rmSync(path,{force:true});const journal=new RFEVSRConstitutionalJournal(path,'journal:test');const receipt=journal.append(request);assert.equal(receipt.status,'persisted');assert.equal(journal.append(request).recordHash,receipt.recordHash);assert.equal(journal.verify().ok,true);const reopened=new RFEVSRConstitutionalJournal(path,'journal:test');assert.equal(reopened.entries().length,1);const raw=JSON.parse(readFileSync(path,'utf8'));raw.records[0].request.subjectIntent.intentType='tampered';writeFileSync(path,JSON.stringify(raw));assert.throws(()=>new RFEVSRConstitutionalJournal(path,'journal:test'));
});



test('shared reality HTTP transport exposes health, snapshot, event replay, commit, revoke, and SSE',async()=>{
  const document=makeSharedDocument();const hash=documentHash(document);const coordinator=new VSRSharedRealityCoordinator({sessionId:'shared:http',documentHash:hash,initialVariables:document.variables});const server=new VSRSharedRealityHttpServer(coordinator);const port=await server.start(0);const base=`http://127.0.0.1:${port}`;
  try {
    const health=await fetch(`${base}/health`).then(r=>r.json());assert.equal(health.ok,true);assert.equal(health.cursor.sequence,0);
    const fixture=makeSharedFixture(document,'left-node','http-left','authority:http');const candidate=toCandidate('shared:http','replica:http',0,'',fixture);const commitResponse=await fetch(`${base}/commit`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(candidate)});assert.equal(commitResponse.status,200);const committed=await commitResponse.json();assert.equal(committed.ok,true);assert.equal(committed.event.sequence,1);
    const events=await fetch(`${base}/events?after=0&root=`).then(r=>r.json());assert.equal(events.events.length,1);assert.equal(events.toSequence,1);
    const snapshot=await fetch(`${base}/snapshot`).then(r=>r.json());assert.deepEqual(snapshot.variables,{left:1,right:0});
    const abort=new AbortController();const stream=await fetch(`${base}/stream?after=1&root=${encodeURIComponent(committed.event.eventHash)}`,{signal:abort.signal});assert.equal(stream.headers.get('content-type')?.startsWith('text/event-stream'),true);abort.abort();
    const revokeResponse=await fetch(`${base}/revoke`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({format:'vsr.shared-revocation-request.v0.1',revocationId:'http-revoke',sessionId:'shared:http',targetKind:'authority',targetId:'authority:http',revokedBy:'authority:root',logicalTime:2,previousEventRoot:committed.event.eventHash})});assert.equal(revokeResponse.status,200);const revoked=await revokeResponse.json();assert.equal(revoked.event.type,'authority.revoked');
  } finally { await server.close(); }
});



test('shared coordination and RFE commit bridge schemas are present',()=>{
  const files=['vsr-shared-reality-event.v0.1.schema.json','vsr-shared-reality-cursor.v0.1.schema.json','vsr-shared-interaction-candidate.v0.1.schema.json','vsr-shared-revocation-request.v0.1.schema.json','rfe-vsr-authority-commit-request.v1.0.schema.json'];
  for(const file of files){const schema=JSON.parse(readFileSync(resolve('schemas',file),'utf8'));assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');assert.ok(schema.$id);}
});



const simulationConfig=JSON.parse(readFileSync('examples/simulation-assets/falling-box.world.json','utf8')) as SimulationWorldConfig;
function simulationPlans(baseTick:number):VSRSimulationBranchPlan[]{return[
  {format:'vsr.simulation-branch-plan.v0.1',branchId:'baseline',label:'自然演化',createdBy:'planner:test',logicalTime:1,baseRealityRoot:cryptographicHash('reality:base'),steps:90,commands:[]},
  {format:'vsr.simulation-branch-plan.v0.1',branchId:'impulse-right',label:'右向冲量',createdBy:'planner:test',logicalTime:1,baseRealityRoot:cryptographicHash('reality:base'),steps:90,commands:[{id:'impulse-right',tick:baseTick+10,type:'apply-impulse',bodyId:'falling-box',impulse:{x:180000,y:-120000}}]},
  {format:'vsr.simulation-branch-plan.v0.1',branchId:'brake',label:'提前制动',createdBy:'planner:test',logicalTime:1,baseRealityRoot:cryptographicHash('reality:base'),steps:90,commands:[{id:'brake',tick:baseTick+20,type:'set-velocity',bodyId:'falling-box',velocity:{x:0,y:0}}]},
]}

test('RSR snapshot roots and causal evidence use canonical SHA-256 commitments',()=>{
  const snapshot=replaySimulation(simulationConfig,60);assert.match(snapshot.stateRoot,/^[a-f0-9]{64}$/);assert.match(snapshot.contactRoot,/^[a-f0-9]{64}$/);const delta=snapshotToCausalDelta(snapshot,cryptographicHash('rfe:base'));assert.match(delta.deltaRoot,/^[a-f0-9]{64}$/);assert.equal(delta.simulationRoot,snapshot.stateRoot);
});

test('simulation branch set deterministically generates multiple candidate futures',()=>{
  const base=replaySimulation(simulationConfig,30);const a=simulateBranchSet(base,simulationPlans(base.tick));const b=simulateBranchSet(base,[...simulationPlans(base.tick)].reverse());assert.equal(a.setRoot,b.setRoot);assert.equal(a.branchCount,3);assert.equal(verifySimulationBranchSet(a).ok,true);assert.notEqual(a.branches.find(branch=>branch.branchId==='baseline')!.finalSnapshot.stateRoot,a.branches.find(branch=>branch.branchId==='impulse-right')!.finalSnapshot.stateRoot);assert.match(a.setRoot,/^[a-f0-9]{64}$/);
});

test('simulation branch comparison exposes body deltas and provisional selection',()=>{
  const base=replaySimulation(simulationConfig,30);const set=simulateBranchSet(base,simulationPlans(base.tick));const comparison=compareSimulationBranches(set.branches.find(branch=>branch.branchId==='baseline')!,set.branches.find(branch=>branch.branchId==='impulse-right')!);assert.equal(comparison.sameBaseSimulationRoot,true);assert.ok(comparison.bodyDifferences.some(item=>item.bodyId==='falling-box'));const selection=selectSimulationBranch(set,'brake','subject:planner',2,'risk review');assert.equal(selection.provisional,true);assert.equal(selection.selectedBranchId,'brake');assert.match(selection.selectionRoot,/^[a-f0-9]{64}$/);
});

test('simulation branch VSR projection preserves one set root across observers and devices',()=>{
  const base=replaySimulation(simulationConfig,30);const set=simulateBranchSet(base,simulationPlans(base.tick));const document=createSimulationBranchDocument(set);assert.equal(validateDocument(document).ok,true);const bridge=new SimulationBranchVSRBridge(set,{width:960,height:540});const rendered=bridge.render([createSimulationBranchObserverProfile('viewer'),createSimulationBranchObserverProfile('planner'),createSimulationBranchObserverProfile('auditor')],['desktop','mobile','xr']);assert.equal(rendered.observerVerification.ok,true);for(const view of rendered.views){assert.equal(view.deviceVerification.ok,true);assert.equal(Object.keys(view.pngHashByDevice).length,3);for(const hash of Object.values(view.pngHashByDevice))assert.match(hash,/^[a-f0-9]{64}$/)}const viewer=rendered.views[0]!,planner=rendered.views[1]!;assert.notEqual(viewer.observerProjection.manifest.projectedDisplayHash,planner.observerProjection.manifest.projectedDisplayHash);
});

test('selected simulation branch becomes an RFE v1 provisional constitutional request and tamper-evident journal',()=>{
  const base=replaySimulation(simulationConfig,30);const set=simulateBranchSet(base,simulationPlans(base.tick));const selection=selectSimulationBranch(set,'brake','subject:planner',2);const bridge=new SimulationBranchVSRBridge(set,{width:640,height:360});const rendered=bridge.render([createSimulationBranchObserverProfile('planner')],['desktop']);const projection=rendered.views[0]!.observerProjection;const device=rendered.views[0]!.devices[0]!;const h=(value:unknown)=>cryptographicHash(value);const request=simulationSelectionToRFERequest(set,selection,{rfeVersion:'1.0.0',epoch:3,configurationHash:h('configuration'),federationRoot:h('federation'),parentCertificateHash:h('parent'),authorityClusterId:'cluster:simulation'},{sourceDocumentHash:rendered.sourceDocumentHash,sourceDisplayHash:rendered.sourceDisplayHash,observerDisplayHash:projection.manifest.projectedDisplayHash,deviceDisplayHash:device.manifest.projectedDisplayHash,realityInvariantHash:projection.manifest.invariantHash});assert.equal(request.provisional,true);assert.equal(request.causalDelta.deltaRoot,selection.selectedCausalDeltaRoot);const path=resolve('outputs/test-rfe-simulation-journal.json');rmSync(path,{force:true});const journal=new RFEVSRSimulationJournal(path,'journal:simulation:test');const receipt=journal.append(request);assert.equal(receipt.status,'persisted');assert.equal(journal.append(request).recordHash,receipt.recordHash);assert.equal(journal.verify().ok,true);const raw=JSON.parse(readFileSync(path,'utf8'));raw.records[0].request.selectedBranch.riskScore=999;writeFileSync(path,JSON.stringify(raw));assert.throws(()=>new RFEVSRSimulationJournal(path,'journal:simulation:test'));
});

test('simulation assets participate in the content-addressed build pipeline',()=>{
  const out=resolve('outputs/test-alpha9-build');rmSync(out,{recursive:true,force:true});const request={format:'reality-build.request.v0.1' as const,projectId:'alpha9-simulation',target:'node' as const,rootDir:process.cwd(),outDir:out,assets:[{id:'world',source:'examples/simulation-assets/falling-box.world.json',type:'json' as const},{id:'style',source:'examples/simulation-assets/render-style.json',type:'json' as const,dependencies:['world']}]};const first=buildRealityAssets(request);const second=buildRealityAssets(request);assert.deepEqual(first.builtAssetIds,['style','world']);assert.deepEqual(second.reusedAssetIds,['style','world']);assert.equal(first.manifest.buildRoot,second.manifest.buildRoot);assert.equal(verifyRealityBuildManifest(first.manifestPath).ok,true);
});


test('simulation density projection is geometry-only and WebGPU compatible',()=>{const base=replaySimulation(simulationConfig,30);const set=simulateBranchSet(base,simulationPlans(base.tick));const document=createSimulationBranchDensityDocument(set,{width:960,height:540});assert.equal(validateDocument(document).ok,true);const state=evaluateAt({document,time:0}).displayState;const plan=compileWebGPUPlan(state);assert.equal(plan.unsupported.length,0);assert.equal(plan.stats.primitives,state.items.length);assert.equal((document.extensions?.['rsr:branch-density'] as Record<string,unknown>).setRoot,set.setRoot);});

test('simulation branch and RFE simulation schemas are present',()=>{const files=['vsr-simulation-branch-plan.v0.1.schema.json','vsr-simulation-branch-set.v0.1.schema.json','vsr-simulation-branch-selection.v0.1.schema.json','rfe-vsr-simulation-commit-request.v1.0.schema.json'];for(const file of files){const schema=JSON.parse(readFileSync(resolve('schemas',file),'utf8'));assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');assert.ok(schema.$id)}});


test('fast software raster preserves deterministic solid and rounded rectangle output',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'fast-raster',title:'Fast Raster',duration:1,defaultFps:30,seed:9},canvas:{width:160,height:100,background:{type:'solid',color:'#000000'}},nodes:[{id:'solid',type:'rect',layout:{x:10,y:10,width:60,height:30},appearance:{fill:{type:'solid',color:'#ff0000'}}},{id:'rounded',type:'rect',layout:{x:80,y:10,width:60,height:60},appearance:{fill:{type:'solid',color:'#00ff00'}},content:{cornerRadius:12}}]};
  const state=evaluateAt({document,time:0}).displayState;const first=renderPng(state);const second=renderPng(state);assert.deepEqual(first,second);const surface=rasterizeDisplayState(state);assert.deepEqual(surface.getPixel(20,20),[255,0,0,255]);assert.deepEqual(surface.getPixel(110,40),[0,255,0,255]);assert.deepEqual(surface.getPixel(80,10),[0,0,0,255]);
});

test('WebGPU plan compiler is deterministic and separates unsupported fallback nodes',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'gpu-plan',title:'GPU Plan',duration:1,defaultFps:60,seed:9},canvas:{width:320,height:180},nodes:[{id:'rect',type:'rect',layout:{x:20,y:20,width:100,height:60},appearance:{fill:{type:'solid',color:'#4488ff'}},content:{cornerRadius:8}},{id:'ellipse',type:'ellipse',layout:{x:140,y:20,width:60,height:60},appearance:{fill:{type:'solid',color:'#44cc88'}}},{id:'label',type:'text',layout:{x:20,y:100,width:200,height:30},appearance:{fill:{type:'solid',color:'#ffffff'}},content:{text:'fallback'}}]};
  const state=evaluateAt({document,time:0}).displayState;const first=compileWebGPUPlan(state),second=compileWebGPUPlan(state);assert.equal(first.planHash,second.planHash);assert.equal(first.stats.primitives,2);assert.equal(first.stats.vertices,12);assert.equal(first.unsupported.length,1);assert.equal(first.unsupported[0]?.nodeId,'label');assert.ok(first.vertexData.byteLength>0);assert.match(first.vertexHash,/^gpu32:[a-f0-9]{16}$/);
});

test('WebGPU plan refuses unsupported appearance semantics and supports solid lines',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'gpu-semantics',title:'GPU Semantics',duration:1,defaultFps:60,seed:9},canvas:{width:240,height:120},nodes:[{id:'line',type:'line',layout:{x:10,y:10,width:120,height:40},appearance:{stroke:{type:'solid',color:'#22c55e'},strokeWidth:4},content:{x1:10,y1:10,x2:130,y2:50}},{id:'stroked-rect',type:'rect',layout:{x:150,y:10,width:60,height:40},appearance:{fill:{type:'solid',color:'#1d4ed8'},stroke:{type:'solid',color:'#ffffff'},strokeWidth:2}},{id:'shadowed',type:'ellipse',layout:{x:150,y:60,width:40,height:40},appearance:{fill:{type:'solid',color:'#f97316'},shadow:{color:'#000000',blur:4}}}]};
  const plan=compileWebGPUPlan(evaluateAt({document,time:0}).displayState);assert.equal(plan.stats.primitives,1);assert.equal(plan.unsupported.length,2);assert.deepEqual(plan.unsupported.map(item=>[item.nodeId,item.reason]),[['stroked-rect','stroke-not-supported'],['shadowed','soft-shadow-not-supported']]);assert.match(plan.vertexHash,/^gpu32:[a-f0-9]{16}$/);
});

test('font freeze helpers collect Unicode glyphs and verify fixed bitmap subsets',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'font-source',title:'Font Source',duration:1,defaultFps:30,seed:9},canvas:{width:100,height:100},nodes:[{id:'text',type:'text',layout:{x:0,y:0,width:100,height:40},content:{text:'现实A现实'}}]};assert.equal(collectDocumentText(document),'现实A现实');assert.deepEqual(collectGlyphs('现实A现实'),['A','实','现']);const rows=['11','11'];const font:VSRFrozenFont={format:'vsr-bitmap-font-1',family:'Test CJK',glyphWidth:2,glyphHeight:2,glyphs:{'现':rows,'实':rows,'A':rows},metadata:{glyphSetHash:'test',glyphCount:3,generatedBy:'test'}};const report=verifyFrozenFont(font,'现实A');assert.equal(report.ok,true);assert.match(report.fontHash,/^[a-f0-9]{64}$/);const missing=verifyFrozenFont(font,'现实B');assert.equal(missing.ok,false);assert.ok(missing.diagnostics.some(message=>message.includes('U+0042')));
});

test('WebGPU plan and frozen bitmap font schemas are present',()=>{for(const file of ['vsr-webgpu-plan.v0.1.schema.json','vsr-bitmap-font.v1.schema.json']){const schema=JSON.parse(readFileSync(resolve('schemas',file),'utf8'));assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');assert.ok(schema.$id)}});



test('path tessellation deterministically triangulates concave closed geometry',()=>{
  const first=tessellatePath('M 0 0 L 40 0 L 40 40 L 20 20 L 0 40 Z'),second=tessellatePath('M 0 0 L 40 0 L 40 40 L 20 20 L 0 40 Z');assert.equal(first.diagnostics.length,0);assert.equal(first.triangleCount,3);assert.deepEqual(first,second);
});

test('WebGPU resource plan supports bitmap text, PNG textures and tessellated paths',()=>{
  const font:VSRBitmapFont={format:'vsr-bitmap-font-1',family:'Test GPU',glyphWidth:3,glyphHeight:5,advance:4,glyphs:{A:['010','101','111','101','101'],B:['110','101','110','101','110'],'?':['111','001','010','000','010']}};
  const image:VSRImageBitmap={width:2,height:2,data:new Uint8Array([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255])};
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'gpu-resources',title:'GPU resources',duration:1,defaultFps:60,seed:10},canvas:{width:240,height:140},nodes:[{id:'label',type:'text',layout:{x:10,y:10,width:100,height:40},appearance:{fill:{type:'solid',color:'#ffffff'}},content:{text:'AB',fontFamily:'Test GPU',fontSize:20,wrap:'none'}},{id:'image',type:'image',layout:{x:120,y:10,width:60,height:60},content:{assetId:'checker',fit:'contain'}},{id:'path',type:'path',layout:{x:0,y:0,width:240,height:140},appearance:{fill:{type:'solid',color:'#22c55e'}},content:{d:'M 20 120 L 60 70 L 100 120 Z'}}]};
  const state=evaluateAt({document,time:0}).displayState,plan=compileWebGPUPlan(state,{fonts:new Map([['Test GPU',font]]),images:new Map([['checker',image]])});assert.equal(plan.unsupported.length,0);assert.equal(plan.stats.primitives,3);assert.equal(plan.stats.textures,2);assert.equal(plan.stats.glyphs,2);assert.equal(plan.stats.pathTriangles,1);assert.deepEqual(plan.commands.map(command=>command.nodeId),['label','image','path']);assert.equal(plan.textures.length,2);assert.equal(plan.planHash,compileWebGPUPlan(state,{fonts:new Map([['Test GPU',font]]),images:new Map([['checker',image]])}).planHash);
});

test('hybrid render graph preserves exact display order across GPU and software layers',()=>{
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'hybrid-order',title:'Hybrid order',duration:1,defaultFps:60,seed:10},canvas:{width:200,height:100},nodes:[{id:'gpu-back',type:'rect',layout:{x:0,y:0,width:200,height:100},appearance:{fill:{type:'solid',color:'#111827'}}},{id:'software-shadow',type:'rect',layout:{x:20,y:20,width:80,height:50},appearance:{fill:{type:'solid',color:'#ef4444'},shadow:{color:'#000000',blur:8}}},{id:'gpu-front',type:'ellipse',layout:{x:120,y:20,width:50,height:50},appearance:{fill:{type:'solid',color:'#22c55e'}}}]};const state=evaluateAt({document,time:0}).displayState,plan=compileHybridRenderPlan(state),verification=verifyHybridRenderPlan(state,plan);assert.equal(verification.ok,true);assert.deepEqual(plan.layers.map(layer=>layer.kind),['gpu','software','gpu']);assert.deepEqual(plan.layers.flatMap(layer=>layer.itemIds),['gpu-back','software-shadow','gpu-front']);assert.equal(plan.stats.gpuItems,2);assert.equal(plan.stats.softwareItems,1);assert.equal(plan.stats.gpuCoverage,2/3);
});

test('Reality Studio project compiles into a verified VSR hybrid projection bridge',()=>{
  const project=JSON.parse(readFileSync('examples/reality-studio-first-leap.project.json','utf8')) as RealityStudioProject,bridge=compileRealityStudioVSRBridge(project);assert.equal(bridge.verification.ok,true);assert.equal(bridge.projectId,'first-leap-editable');assert.equal(bridge.document.extensions?.['reality-studio:source-format'],'reality-studio.project.v0.1');assert.ok(bridge.document.nodes.length>project.objects.length);assert.ok(bridge.hybridPlan.stats.gpuItems>=project.objects.length);assert.ok(bridge.hybridPlan.stats.softwareItems>0);assert.match(bridge.bridgeRoot,/^[a-f0-9]{64}$/);
});


test('Alpha.11 WebGPU scissor, hard shadow and additive blend stay on the GPU path',()=>{
  const document=load('examples/gpu-clip-shadow-blend.vsr.json'),state=evaluateAt({document,time:0}).displayState,plan=compileWebGPUPlan(state);assert.equal(plan.unsupported.length,0);assert.equal(plan.stats.primitives,1);assert.equal(plan.stats.clippedItems,1);assert.equal(plan.stats.shadowPrimitives,1);assert.equal(plan.stats.additiveCommands,1);assert.equal(plan.commands[0]?.blendMode,'additive');assert.ok(plan.commands[0]?.scissor);assert.ok((plan.commands[0]?.vertexCount??0)>=12);assert.equal(plan.planHash,compileWebGPUPlan(state).planHash);
});

test('Alpha.11 GPU clip intersection is bounded by the viewport and parent clip',()=>{
  const document=load('examples/gpu-clip-shadow-blend.vsr.json'),state=evaluateAt({document,time:0}).displayState,command=compileWebGPUPlan(state).commands[0]!;assert.deepEqual(command.scissor,{x:30,y:30,width:180,height:100});
});

test('Reality Studio v0.3 multi-scene component contract compiles into deterministic VSR tracks',()=>{
  const project=JSON.parse(readFileSync('examples/reality-studio-component-v03.project.json','utf8')) as RealityStudioProject,bridge=compileRealityStudioVSRBridge(project);assert.equal(bridge.sourceFormat,'reality-studio.project.v0.3');assert.equal(bridge.activeSceneId,'scene-a');assert.equal(bridge.verification.ok,true);assert.match(bridge.componentContractHash,/^[a-f0-9]{64}$/);const core=bridge.document.nodes.find(node=>node.id==='object:core')!,checkpoint=bridge.document.nodes.find(node=>node.id==='object:checkpoint')!;assert.equal(core.tracks?.[0]?.property,'transform.rotation');assert.equal(checkpoint.tracks?.[0]?.property,'appearance.opacity');const first=evaluateAt({document:bridge.document,time:.5}).semanticHash,second=evaluateAt({document:bridge.document,time:.5}).semanticHash;assert.equal(first,second);
});

test('Reality Studio VSR round-trip patch updates editable object state and rejects stale bases',()=>{
  const project=JSON.parse(readFileSync('examples/reality-studio-component-v03.project.json','utf8')) as RealityStudioProject,document=realityStudioProjectToVSR(project),player=document.nodes.find(node=>node.id==='object:player')!;player.layout={...player.layout,x:96};player.appearance={...player.appearance,opacity:.75};const patch=createRealityStudioPatchFromVSRDocument(project,document);assert.equal(patch.changes.length,1);assert.equal(patch.changes[0]?.objectId,'player');const updated=applyRealityStudioVSRPatch(project,patch),updatedScene=updated.scenes?.find(scene=>scene.id==='scene-a');assert.equal(updatedScene?.objects.find(object=>object.id==='player')?.x,96);assert.equal(updatedScene?.objects.find(object=>object.id==='player')?.opacity,.75);assert.throws(()=>applyRealityStudioVSRPatch(updated,patch));
});

test('Reality One v0.2 unified result becomes a six-domain VSR projection with bound roots',()=>{
  const input=JSON.parse(readFileSync('examples/reality-one-unified-result-v02.json','utf8')) as unknown,summary=normalizeRealityOneUnifiedV02(input),document=createRealityOneUnifiedV02Document(input,{profile:'desktop'}),projection=compileRealityOneUnifiedV02Projection(input,{profile:'desktop'});assert.equal(summary.steps,5);assert.deepEqual(summary.observers,['player','debugger']);assert.equal(Object.keys(summary.domainRoots).length,6);assert.ok(document.nodes.some(node=>node.id==='domain:5:card'));assert.equal(projection.domainRoots.rfe,'rfe-final-root-alpha11');assert.match(projection.projectionRoot,/^[a-f0-9]{64}$/);assert.equal(projection.projectionRoot,compileRealityOneUnifiedV02Projection(input,{profile:'desktop'}).projectionRoot);
});


test('HNAC v0.5 state root matches the Python cross-host reference vector',()=>{
  const partitions={portable:{score:7,nested:{b:2,a:1}},device_private:{window:{x:10}},secret:{},cache:{thumb:'abc'}};
  assert.equal(computeHNACStateRoot('vsr-demo','1.0',partitions),'782b6647ca5e27d6135a838b36455dfade8e4370c43376471f1dafc597c2ba24');
});

test('VSR session exports, verifies and restores through HNAC portable state boundaries',()=>{
  const runtime=new VSRRuntimeSession(hello);runtime.replaceVariables({value:42,nested:{ok:true}});runtime.replaceInteractionState({selected:'hero'});runtime.clock.seek(1.25);
  const snapshot=createVSRHNACSnapshot(hello,runtime,{appId:'vsr-demo',replicaId:'phone:a',generation:3,devicePrivate:{window:{x:9}},secret:{token:'never-export'},ephemeral:{pointerX:12}});
  assert.equal(verifyVSRHNACSnapshot(snapshot).ok,true);const bundle=exportVSRHNACBundle(snapshot);assert.equal('device_private' in bundle.partitions,false);assert.equal(JSON.stringify(bundle).includes('never-export'),false);
  const restored=new VSRRuntimeSession(hello);restoreVSRSessionFromHNACSnapshot(restored,snapshot);assert.deepEqual(restored.getVariables(),runtime.getVariables());assert.deepEqual(restored.getInteractionState(),runtime.getInteractionState());assert.equal(restored.clock.time,1.25);const wrong=new VSRRuntimeSession({...hello,metadata:{...hello.metadata,id:'wrong-doc'}});assert.throws(()=>restoreVSRSessionFromHNACSnapshot(wrong,snapshot),/document hash mismatch/);runtime.dispose();restored.dispose();wrong.dispose();
});

test('HNAC three-way merge preserves disjoint edits and emits explicit conflict evidence',()=>{
  const make=(portable:Record<string,unknown>)=>sealHNACPortableState({format:'hnaf.portable-state.v0.5',app_id:'vsr-demo',schema_version:'1.0',partitions:{portable:portable as never,device_private:{},secret:{},cache:{}}});
  const base=make({score:1,mode:'a'}),local=make({score:2,mode:'a',local:true}),incoming=make({score:3,mode:'b',remote:true}),merged=mergeHNACPortableStates(base,local,incoming);
  assert.equal(merged.merged.partitions.portable.local,true);assert.equal(merged.merged.partitions.portable.remote,true);assert.equal(merged.conflicts.length,1);assert.equal(merged.conflicts[0]?.path,'score');assert.match(merged.mergeRoot,/^[a-f0-9]{64}$/);
});

test('Reality Studio v0.4 stable identities and parent graph compile into VSR hierarchy',()=>{
  const project=JSON.parse(readFileSync('examples/reality-studio-reality-graph-v04.project.json','utf8')) as RealityStudioProject,bridge=compileRealityStudioVSRBridge(project,{includeLabels:false});
  assert.equal(bridge.sourceFormat,'reality-studio.project.v0.4');assert.equal(bridge.verification.ok,true);const halo=bridge.document.nodes.find(node=>node.id==='object:core-halo');assert.equal(halo?.parentId,'object:core-a');assert.equal(halo?.data?.sourceUid,'obj-1sm3how');assert.equal((bridge.document.variables?.studio as Record<string,unknown>).blackboard instanceof Object,true);assert.match(bridge.bridgeRoot,/^[a-f0-9]{64}$/);
});

test('Reality Studio v0.4 live event stream updates blackboard, signals and structural edits with a hash chain',()=>{
  const project=JSON.parse(readFileSync('examples/reality-studio-reality-graph-v04.project.json','utf8')) as RealityStudioProject,session=new RealityStudioLiveVSRSession(project,'studio-live:test');
  const make=(sequence:number,type:RealityStudioLiveEvent['type'],payload:Record<string,unknown>):RealityStudioLiveEvent=>({format:'reality-studio.live-event.v0.4',sessionId:'studio-live:test',projectId:project.projectId,sequence,type,sceneId:'first-leap',payload});
  session.append(make(1,'blackboard.set',{key:'energy',value:3}));session.append(make(2,'signal.emitted',{signal:'core.collected',subject:'core-a',payload:{energy:3}}));const before=session.manifest();session.append(make(3,'object.updated',{objectUid:'obj-0xnzhd9',set:{x:155,y:233}}));const after=session.manifest();
  assert.equal(before.signalCount,1);assert.equal(after.sequence,3);assert.equal(after.rebuildCount,1);assert.notEqual(before.documentRoot,after.documentRoot);const player=session.currentDocument().nodes.find(node=>node.id==='object:player');assert.equal(player?.layout?.x,155);assert.match(after.eventChainRoot,/^[a-f0-9]{64}$/);const rootBefore=session.manifest().projectRoot;assert.throws(()=>session.append(make(4,'object.updated',{objectUid:'obj-0xnzhd9',set:{width:-1}})),/violate project contract/);assert.equal(session.manifest().projectRoot,rootBefore);assert.equal(session.eventLog().length,3);session.dispose();
});

test('VSR authority interaction can execute through a Reality One v0.2 gateway transport',async()=>{
  const session=new RealityOneVSRSession();
  session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'gateway:test',sequence:1,type:'intent.received',payload:{intentText:'生成现实关卡'}});
  session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'gateway:test',sequence:2,type:'intent.understood',payload:{intentText:'生成现实关卡',artifactTitle:'测试关卡',steps:[]}});
  session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:'gateway:test',sequence:3,type:'authority.requested',payload:{}});
  let previewCalls=0,executeCalls=0;const advanced={status:'committed',intent:{source:'生成现实关卡'},plan:{steps:[]},authority:{status:'approved'},execution:{stepReceipts:[],executionRoot:'exec-root'},artifact:{identity:{title:'测试关卡'},semantic:{fields:{progress:{value:100},status:{value:'validated'},generated_report:{value:'完成'}}}},atomicReceipt:{status:'committed',finalGlobalRoot:'global-root'},applicationResultHash:'app-root'};
  const transport:RealityOneGatewayTransport={async getState(){return{}},async preview(){previewCalls++;return{status:'ready',steps:[]}},async execute(){executeCalls++;return{status:'committed',receipt:{finalGlobalRoot:'global-root'},advanced}}};
  const proposal=session.proposeInteraction({format:'vsr.input-event.v0.1',inputId:'approve-1',deviceId:'desktop',observerId:'owner',nodeId:'authority-approve',trigger:'click',logicalTime:0});
  const bridge=new RealityOneVSRGatewayBridge(session,transport),receipt=await bridge.submitAuthorityInteraction(proposal,{format:'vsr.interaction-authorization.v0.1',proposalHash:proposal.proposalHash,decision:'approved',authorityId:'owner',grantedScopes:['*'],logicalTime:0});
  assert.equal(previewCalls,1);assert.equal(executeCalls,1);assert.equal(receipt.gatewayStatus,'committed');assert.equal(receipt.finalGlobalRoot,'global-root');assert.equal(session.currentSummary().phase,'result');assert.match(receipt.receiptRoot,/^[a-f0-9]{64}$/);session.dispose();
});

test('Alpha.12 integration schemas are present',()=>{for(const file of ['vsr-hnac-state-snapshot.v0.1.schema.json','vsr-reality-studio-live-event.v0.4.schema.json','vsr-reality-one-gateway-interaction.v0.1.schema.json']){const schema=JSON.parse(readFileSync(resolve('schemas',file),'utf8'));assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');assert.ok(schema.$id)}});

test('Alpha.11 integration schemas are present',()=>{for(const file of ['vsr-reality-studio-patch.v0.1.schema.json','vsr-reality-one-unified-projection.v0.2.schema.json']){const schema=JSON.parse(readFileSync(resolve('schemas',file),'utf8'));assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');assert.ok(schema.$id)}});

test('Hybrid and Reality Studio schemas are present',()=>{for(const file of ['vsr-hybrid-render-plan.v0.1.schema.json','vsr-reality-studio-bridge.v0.1.schema.json']){const schema=JSON.parse(readFileSync(resolve('schemas',file),'utf8'));assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');assert.ok(schema.$id)}});


const visualRealityDocument:VSRDocument={
  specVersion:'0.1',metadata:{id:'visual-reality-v02',title:'Visual Reality v0.2',duration:2,defaultFps:60,seed:22},
  canvas:{width:320,height:180,background:{type:'solid',color:'#07111f'}},
  nodes:[
    {id:'background',type:'rect',layout:{x:0,y:0,width:320,height:180},appearance:{fill:{type:'solid',color:'#0b1830'}}},
    {id:'hidden-back',type:'rect',layout:{x:20,y:20,width:80,height:60},appearance:{fill:{type:'solid',color:'#ef4444'}}},
    {id:'cover',type:'rect',layout:{x:20,y:20,width:80,height:60},appearance:{fill:{type:'solid',color:'#111827'}}},
    {id:'hero',type:'ellipse',layout:{x:125,y:55,width:70,height:70},appearance:{fill:{type:'solid',color:'#38bdf8'}},tags:['semantic','hero']},
    {id:'halo',type:'ellipse',layout:{x:105,y:35,width:110,height:110},appearance:{fill:{type:'solid',color:'#2563eb55'},blendMode:'additive'},tags:['decorative','emissive']},
    {id:'particle-a',type:'rect',layout:{x:250,y:40,width:1,height:1},appearance:{fill:{type:'solid',color:'#fbbf24'}},tags:['decorative','particle']},
    {id:'offscreen',type:'rect',layout:{x:500,y:500,width:20,height:20},appearance:{fill:{type:'solid',color:'#ffffff'}}},
    {id:'label',type:'text',layout:{x:90,y:135,width:150,height:30},appearance:{fill:{type:'solid',color:'#ffffff'}},content:{text:'REALITY',fontSize:20,align:'center'}}
  ]
};
const visualRealityConfig:VSRVisualRealityConfig={
  quality:'quality',observer:{id:'observer:player',purpose:'player'},device:{class:'desktop',gpuTier:2},
  materials:[
    {id:'material:hero',baseColor:'#38bdf8',roughness:.25,metallic:.1,receivesLight:true,castsShadow:true,blend:'opaque'},
    {id:'material:halo',baseColor:'#2563eb',emissive:'#60a5fa',emissiveStrength:1.4,receivesLight:false,castsShadow:false,blend:'additive'}
  ],
  bindings:[{materialId:'material:hero',nodeIds:['hero']},{materialId:'material:halo',nodeIds:['halo']}],
  lights:[
    {id:'light:ambient',kind:'ambient',color:'#8fb9ff',intensity:.35},
    {id:'light:key',kind:'point',color:'#7dd3fc',intensity:2.2,x:155,y:70,radius:115,castsShadow:true,priority:10},
    {id:'light:rim',kind:'point',color:'#a78bfa',intensity:1.3,x:245,y:70,radius:90,priority:5}
  ],
  post:{toneMap:'aces',exposure:.25,contrast:1.08,saturation:1.1,bloom:.75,bloomRadius:4,vignette:.18,grain:.03}
};

test('visual reality budget resolves deterministically across device tiers',()=>{
  assert.equal(resolveRenderBudget({device:{class:'server',gpuTier:0}}).quality,'economy');
  assert.equal(resolveRenderBudget({device:{class:'desktop',gpuTier:3}}).quality,'cinematic');
  assert.equal(resolveRenderBudget({quality:'balanced'}).maxLights,8);
});

test('visual reality compiler emits a verified render graph and evidence root',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,visualRealityConfig),verification=verifyVisualRealityPlan(state,plan);
  assert.equal(verification.ok,true);assert.equal(plan.format,'vsr.visual-reality-plan.v0.2');assert.match(plan.planRoot,/^[a-f0-9]{64}$/);assert.match(plan.evidenceRoot,/^[a-f0-9]{64}$/);assert.ok(plan.passes.some(pass=>pass.kind==='lighting'&&pass.enabled));
});

test('visual reality compiler is deterministic for identical source and policy',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:.5}).displayState,a=compileVisualRealityPlan(state,visualRealityConfig),b=compileVisualRealityPlan(state,visualRealityConfig);assert.equal(a.planRoot,b.planRoot);assert.equal(a.evidenceRoot,b.evidenceRoot);assert.deepEqual(a.stats,b.stats);
});

test('visual reality visibility removes offscreen and fully covered geometry',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,visualRealityConfig),reasons=Object.fromEntries(plan.visibility.map(record=>[record.itemId,record.reason]));assert.equal(reasons.offscreen,'viewport-culled');assert.equal(reasons['hidden-back'],'occluded');assert.equal(reasons.hero,'visible');
});

test('visual reality LOD only degrades explicitly decorative micro geometry',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,{...visualRealityConfig,quality:'economy'}),particle=plan.visibility.find(record=>record.itemId==='particle-a');assert.equal(particle?.reason,'lod-degraded');assert.ok(plan.semanticInvariant.degradedDecorativeItemIds.includes('particle-a'));assert.ok(plan.semanticInvariant.preservedItemIds.includes('hero'));
});

test('visual reality material bindings preserve stable assignments',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,visualRealityConfig);assert.equal(plan.materialAssignments.hero,'material:hero');assert.equal(plan.materialAssignments.halo,'material:halo');assert.equal(plan.materialAssignments.label,'material:default');
});

test('visual reality batches compatible instances without reordering evidence',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,visualRealityConfig);assert.ok(plan.batches.length<plan.stats.visibleItems);assert.equal(plan.stats.instances,plan.stats.visibleItems);assert.equal(plan.batches.flatMap(batch=>batch.itemIds).length,plan.stats.visibleItems);
});

test('visual reality light tiling binds local lights to bounded tiles',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,{...visualRealityConfig,lightTileSize:48});assert.ok(plan.lightTiles.length>0);assert.ok(plan.lightTiles.some(tile=>tile.lightIds.includes('light:key')));assert.ok(plan.lightTiles.every(tile=>tile.width<=48&&tile.height<=48));
});

test('visual reality quality budget caps lights and shadow producers',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,many={...visualRealityConfig,quality:'economy' as const,lights:Array.from({length:12},(_,i)=>({id:`light:${i}`,kind:'point' as const,color:'#ffffff',intensity:1,x:i*10,y:50,radius:80,castsShadow:true,priority:i}))},plan=compileVisualRealityPlan(state,many);assert.equal(plan.lights.length,4);assert.equal(plan.stats.shadowLights,0);
});

test('visual reality render graph disables unsupported work instead of silently faking it',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,{...visualRealityConfig,quality:'economy',post:{enabled:false}});const shadow=plan.passes.find(pass=>pass.kind==='shadow'),post=plan.passes.find(pass=>pass.kind==='postprocess');assert.equal(shadow?.enabled,false);assert.equal(post?.enabled,false);assert.ok(shadow?.reason);
});

test('visual reality plan retains legacy WebGPU and hybrid backend compatibility',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,visualRealityConfig);assert.equal(plan.webgpuPlan.sourceDisplayHash,state.semanticHash);assert.ok(plan.hybridPlan.layers.length>0);assert.ok(plan.stats.gpuCoverage>=0&&plan.stats.gpuCoverage<=1);
});

test('visual reality reference backend produces a real deterministic PNG',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,a=renderVisualRealityReference(state,visualRealityConfig),b=renderVisualRealityReference(state,visualRealityConfig);assert.deepEqual([...a.png.slice(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(a.pixelRoot,b.pixelRoot);assert.equal(a.plan.planRoot,b.plan.planRoot);assert.ok(a.png.byteLength>500);
});

test('visual reality post processing changes pixels while preserving source reality',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plain=renderPng(state),graded=renderVisualRealityReference(state,visualRealityConfig);assert.notEqual(semanticHash([...plain]),semanticHash([...graded.png]));assert.equal(graded.plan.semanticInvariant.sourceRealityHash,compileVisualRealityPlan(state,visualRealityConfig).semanticInvariant.sourceRealityHash);
});

test('visual reality observer plans preserve semantic equivalence across quality tiers',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,desktop=compileVisualRealityPlan(state,visualRealityConfig),mobile=compileVisualRealityPlan(state,{...visualRealityConfig,quality:'economy',observer:{id:'observer:mobile',purpose:'player'},device:{class:'mobile',gpuTier:1}}),report=comparePerceptualPlans(desktop,mobile);assert.equal(report.ok,true);assert.equal(report.sharedSourceReality,true);assert.ok(report.allowedDecorativeDifferences.includes('particle-a'));
});

test('visual reality verifier detects evidence tampering',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,visualRealityConfig);const tampered={...plan,evidenceRoot:'0'.repeat(64)};assert.equal(verifyVisualRealityPlan(state,tampered).ok,false);
});

test('visual reality plan changes when observer budget changes but source invariant does not',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,a=compileVisualRealityPlan(state,visualRealityConfig),b=compileVisualRealityPlan(state,{...visualRealityConfig,quality:'economy'});assert.notEqual(a.planRoot,b.planRoot);assert.equal(a.semanticInvariant.sourceRealityHash,b.semanticInvariant.sourceRealityHash);
});

test('visual reality render scale is explicit and clamped',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,low=compileVisualRealityPlan(state,{...visualRealityConfig,renderScale:.1}),high=compileVisualRealityPlan(state,{...visualRealityConfig,renderScale:4});assert.equal(low.budget.renderScale,.25);assert.equal(high.budget.renderScale,2);assert.equal(low.viewport.renderWidth,80);assert.equal(high.viewport.renderWidth,640);
});

test('visual reality pass dependencies reference existing passes',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileVisualRealityPlan(state,visualRealityConfig),ids=new Set(plan.passes.map(pass=>pass.id));assert.ok(plan.passes.every(pass=>pass.dependsOn.every(id=>ids.has(id))));
});

test('visual reality plan schema is present',()=>{const schema=JSON.parse(readFileSync(resolve('schemas','vsr-visual-reality-plan.v0.2.schema.json'),'utf8'));assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');assert.equal(schema.properties.format.const,'vsr.visual-reality-plan.v0.2')});



test('realtime WebGPU frame compiler is deterministic',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,a=compileRealtimeWebGPUFrame(state,visualRealityConfig),b=compileRealtimeWebGPUFrame(state,visualRealityConfig);assert.equal(a.framePlanRoot,b.framePlanRoot);assert.equal(a.resourceRoot,b.resourceRoot);assert.equal(a.commandRoot,b.commandRoot);assert.deepEqual(a.stats,b.stats);
});

test('realtime WebGPU atlas contains the white fallback and stable regions',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig);assert.ok(plan.atlas.regions.some(region=>region.textureId==='__white'));assert.ok(plan.atlas.width>=64&&plan.atlas.height>=64);assert.equal(new Set(plan.atlas.regions.map(region=>region.textureId)).size,plan.atlas.regions.length);
});

test('realtime WebGPU atlas deduplicates repeated texture ids',()=>{
  const pixel=new Uint8Array([255,0,0,255]),atlas=packWebGPUTextureAtlas([{id:'same',kind:'image',width:1,height:1,data:pixel,textureHash:'a'},{id:'same',kind:'image',width:1,height:1,data:pixel,textureHash:'a'}]);assert.equal(atlas.regions.filter(region=>region.textureId==='same').length,1);
});

test('realtime WebGPU atlas rejects resources larger than the configured limit',()=>{
  assert.throws(()=>packWebGPUTextureAtlas([{id:'huge',kind:'image',width:128,height:128,data:new Uint8Array(128*128*4),textureHash:'huge'}],{atlasMaxSize:64}));
});

test('realtime WebGPU remaps all texture coordinates into the atlas range',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig);for(let index=0;index<plan.vertexData.length;index+=11){assert.ok(plan.vertexData[index+2]!>=0&&plan.vertexData[index+2]!<=1);assert.ok(plan.vertexData[index+3]!>=0&&plan.vertexData[index+3]!<=1);}
});

test('realtime WebGPU draw packets preserve command order while reducing compatible calls',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig);assert.ok(plan.drawPackets.length<=plan.stats.sourceCommands);for(let index=1;index<plan.drawPackets.length;index++)assert.ok(plan.drawPackets[index]!.orderMin>plan.drawPackets[index-1]!.orderMax);assert.equal(plan.drawPackets.reduce((sum,packet)=>sum+packet.nodeIds.length,0),plan.stats.sourceCommands);
});

test('realtime WebGPU light storage and tile records are bounded and consistent',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig);assert.equal(plan.lightData.length,plan.lights.length*12);assert.equal(plan.tileData.length,plan.tilesX*plan.tilesY*17);for(let tile=0;tile<plan.tilesX*plan.tilesY;tile++)assert.ok(plan.tileData[tile*17]!<=16);
});

test('realtime WebGPU extracts deterministic GPU particle seeds from semantic particle tags',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,a=compileRealtimeWebGPUFrame(state,visualRealityConfig),b=compileRealtimeWebGPUFrame(state,visualRealityConfig);assert.ok(a.particleSeeds.some(seed=>seed.id==='particle-a'));assert.deepEqual(a.particleSeeds,b.particleSeeds);assert.deepEqual([...a.particleData],[...b.particleData]);
});

test('realtime WebGPU disables particle work when no particle semantic exists',()=>{
  const state=evaluateAt({document:hello,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,{});assert.equal(plan.particleSeeds.length,0);assert.equal(plan.passes.find(pass=>pass.id==='particle-sim')?.enabled,false);assert.equal(plan.passes.find(pass=>pass.id==='particle-render')?.enabled,false);
});

test('realtime WebGPU render graph dependencies all resolve',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig),ids=new Set(plan.passes.map(pass=>pass.id));assert.ok(plan.passes.every(pass=>pass.dependsOn.every(id=>ids.has(id))));assert.equal(plan.passes.at(-1)?.id,'evidence');
});

test('realtime WebGPU frame preserves the visual reality plan and evidence roots',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,visual=compileVisualRealityPlan(state,visualRealityConfig),frame=compileRealtimeWebGPUFrame(state,visualRealityConfig);assert.equal(frame.visualPlanRoot,visual.planRoot);assert.equal(frame.visualEvidenceRoot,visual.evidenceRoot);assert.equal(frame.sourceDisplayHash,state.semanticHash);
});

test('realtime WebGPU quality changes execution plan but not source reality',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,a=compileRealtimeWebGPUFrame(state,{...visualRealityConfig,quality:'cinematic'}),b=compileRealtimeWebGPUFrame(state,{...visualRealityConfig,quality:'economy'});assert.notEqual(a.framePlanRoot,b.framePlanRoot);assert.equal(a.sourceDisplayHash,b.sourceDisplayHash);assert.ok(a.stats.lights>=b.stats.lights);
});

test('realtime WebGPU verifier accepts a valid frame plan',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig),result=verifyRealtimeWebGPUFrame(plan);assert.equal(result.ok,true);assert.deepEqual(result.diagnostics,[]);
});

test('realtime WebGPU verifier detects resource tampering',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig);plan.vertexData[0]=(plan.vertexData[0]??0)+.1;const result=verifyRealtimeWebGPUFrame(plan);assert.equal(result.ok,false);assert.ok(result.diagnostics.includes('resource-root-mismatch'));
});

test('realtime WebGPU verifier detects command and frame-root tampering',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig),tampered={...plan,drawPackets:plan.drawPackets.map((packet,index)=>index?packet:{...packet,vertexCount:packet.vertexCount+1})};const result=verifyRealtimeWebGPUFrame(tampered);assert.equal(result.ok,false);assert.ok(result.diagnostics.includes('command-root-mismatch'));assert.ok(result.diagnostics.includes('frame-plan-root-mismatch'));
});

test('realtime WebGPU WGSL modules contain real compute and render entry points',()=>{
  assert.ok(VSR_SCENE_SHADER_V03.includes('@vertex fn vs_main')&&VSR_SCENE_SHADER_V03.includes('@fragment fn fs_main'));assert.ok(VSR_LIGHT_CULL_SHADER_V03.includes('@compute')&&VSR_LIGHT_CULL_SHADER_V03.includes('tileLights'));assert.ok(VSR_PARTICLE_SHADER_V03.includes('@compute')&&VSR_PARTICLE_SHADER_V03.includes('@builtin(instance_index)'));assert.ok(VSR_POST_SHADER_V03.includes('tone(')&&VSR_POST_SHADER_V03.includes('glow'));
});

test('realtime WebGPU plan statistics match compiled buffers',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig);assert.equal(plan.stats.vertices,plan.vertexData.length/11);assert.equal(plan.stats.drawPackets,plan.drawPackets.length);assert.equal(plan.stats.atlasTextures,plan.atlas.regions.length);assert.equal(plan.stats.atlasBytes,plan.atlas.data.byteLength);assert.equal(plan.stats.lightTiles,plan.tilesX*plan.tilesY);assert.equal(plan.stats.particleSeeds,plan.particleSeeds.length);
});

test('realtime WebGPU receipt sealing detects tampering',()=>{
  const base={format:'vsr.realtime-webgpu-frame-receipt.v0.3' as const,version:'0.3.0-alpha.1',mode:'plan-only' as const,frameIndex:1,sourceDisplayHash:'source',framePlanRoot:'plan',resourceRoot:'resource',commandRoot:'command',deviceLost:false,submitted:false,drawCalls:3,computePasses:2,compileMs:1,uploadMs:0,encodeMs:0,submitMs:0},receipt={...base,receiptRoot:cryptographicHash(base)} satisfies VSRRealtimeGPUFrameReceipt;assert.equal(verifyRealtimeGPUReceipt(receipt),true);assert.equal(verifyRealtimeGPUReceipt({...receipt,drawCalls:4}),false);
});

test('realtime WebGPU probe is safe in a Node host without navigator.gpu',()=>{
  const result=probeRealtimeWebGPU();assert.equal(result.format,'vsr.realtime-webgpu-capabilities.v0.3');assert.equal(typeof result.available,'boolean');assert.ok(Array.isArray(result.features));
});

test('realtime WebGPU frame schema is present',()=>{const schema=JSON.parse(readFileSync(resolve('schemas','vsr-realtime-webgpu-frame.v0.3.schema.json'),'utf8'));assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');assert.equal(schema.properties.format.const,'vsr.realtime-webgpu-frame.v0.3')});

test('realtime WebGPU compiler exports a serializable evidence view',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig),view={format:plan.format,framePlanRoot:plan.framePlanRoot,resourceRoot:plan.resourceRoot,commandRoot:plan.commandRoot,stats:plan.stats,atlas:{width:plan.atlas.width,height:plan.atlas.height,regions:plan.atlas.regions},passes:plan.passes};const text=JSON.stringify(view);assert.ok(text.includes(plan.framePlanRoot));assert.equal(JSON.parse(text).format,'vsr.realtime-webgpu-frame.v0.3');
});

test('browser WebGPU executor accepts the serialized build frame without Node imports',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig),serialized={...plan,atlas:{...plan.atlas,data_base64:Buffer.from(plan.atlas.data).toString('base64'),data:undefined},vertex_data:Array.from(plan.vertexData),light_data:Array.from(plan.lightData),tile_data:Array.from(plan.tileData),particle_data:Array.from(plan.particleData)},normalized=normalizeRealtimeWebGPUFrame(serialized);assert.equal(verifyBrowserRealtimeWebGPUFrame(normalized).ok,true);assert.equal(normalized.framePlanRoot,plan.framePlanRoot);assert.equal(hashRealtimeWebGPUValue({b:2,a:1}),cryptographicHash({a:1,b:2}));
});



test('realtime WebGPU exports a sealed Reality Studio v0.9 viewport manifest',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig),manifest=compileRealityStudioGPUViewport({project_root:'project-root',active_scene_id:'scene:frost'},plan);assert.equal(manifest.projectRoot,'project-root');assert.equal(manifest.activeSceneId,'scene:frost');assert.equal(manifest.framePlanRoot,plan.framePlanRoot);assert.equal(verifyRealityStudioGPUViewport(manifest),true);
});

test('realtime WebGPU exports a sealed Reality Build capability requirement',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig),requirement=compileRealityBuildGPURequirement('project-root',plan);assert.equal(requirement.preferredBackend,'webgpu');assert.equal(requirement.fallbackBackend,'canvas2d');assert.ok(requirement.artifactCapabilities.includes('gpu-particles'));assert.equal(verifyRealityBuildGPURequirement(requirement),true);
});

test('Reality Studio and Build GPU adapter seals detect tampering',()=>{
  const state=evaluateAt({document:visualRealityDocument,time:0}).displayState,plan=compileRealtimeWebGPUFrame(state,visualRealityConfig),studio=compileRealityStudioGPUViewport({projectRoot:'p'},plan),build=compileRealityBuildGPURequirement('p',plan);assert.equal(verifyRealityStudioGPUViewport({...studio,quality:'economy'}),false);assert.equal(verifyRealityBuildGPURequirement({...build,secureContextRequired:false}),false);
});

test('Reality Studio and Build GPU adapter schemas are present',()=>{
  for(const file of ['vsr-reality-studio-gpu-viewport.v0.3.schema.json','vsr-reality-build-gpu-requirement.v0.3.schema.json']){const schema=JSON.parse(readFileSync(resolve('schemas',file),'utf8'));assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');}
});

let passed=0;const started=performance.now();for(const {name,fn} of tests){try{await fn();passed++;console.log(`PASS ${name}`)}catch(error){console.error(`FAIL ${name}`);console.error(error);process.exitCode=1}}
console.log(`\n${passed}/${tests.length} tests passed in ${(performance.now()-started).toFixed(1)}ms.`);if(passed!==tests.length)process.exitCode=1;
