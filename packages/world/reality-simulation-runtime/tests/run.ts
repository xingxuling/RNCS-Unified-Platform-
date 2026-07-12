import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyTransaction, VSRHistory } from '../packages/agent-protocol/src/index.js';
import { projectionToVSR, interactionToSubjectIntent, type RFEObserverProjection } from '../packages/adapter-rfe/src/index.js';
import { createRealityOneLiveDocument, createRealityOneObserverProfile, normalizeRealityOneResult, RealityOneVSRSession, realityOneResultToLifecycleEvents, realityOneResultToVSR, sealRealityOneLifecycleEvent } from '../packages/adapter-reality-one/src/index.js';
import { decodePng, encodePng, PixelSurface, rasterizeDisplayState, renderPng } from '../packages/backend-canvas/src/index.js';
import { VSRNullBackend } from '../packages/backend-null/src/index.js';
import { evaluateAt, prepareDocument, reduceEvents, VSRRuntimeSession } from '../packages/core/src/index.js';
import { deterministicRandom, evaluateExpression, parseExpression } from '../packages/expression/src/index.js';
import { projectDisplayForObserver, verifyObserverProjectionSet, type VSRObserverProfile } from '../packages/observer-projection/src/index.js';
import { encodeVideoFromManifest, ffmpegAvailable, renderFrame, renderRange } from '../packages/renderer/src/index.js';
import { documentHash, validateDocument, type VSRDiagnostic, type VSRDocument, type VSRState } from '../packages/spec/src/index.js';

const tests:Array<{name:string;fn:()=>void}>=[];const test=(name:string,fn:()=>void)=>tests.push({name,fn});
const load=(path:string)=>JSON.parse(readFileSync(path,'utf8')) as VSRDocument;
const hello=load('examples/hello-title.vsr.json');

test('Visual IR validation and semantic hash',()=>{const report=validateDocument(hello);assert.equal(report.ok,true);const reordered=JSON.parse(JSON.stringify(hello)) as VSRDocument;assert.equal(documentHash(hello),documentHash(reordered));const invalid={...hello,nodes:[...hello.nodes,{...hello.nodes[0],id:hello.nodes[0]!.id}]};assert.equal(validateDocument(invalid).ok,false)});
test('expression parser, dependency extraction and sandbox',()=>{const parsed=parseExpression("clamp(vars.value / 100, 0, 1) + sin(time)");assert.deepEqual(parsed.dependencies,['vars.value']);const result=evaluateExpression(parsed,{time:0,frame:0,fps:30,vars:{value:50},context:{},input:{},seed:7});assert.equal(result,0.5);assert.throws(()=>parseExpression('vars.constructor.constructor(\"return process\")()'))});
test('deterministic random is indexed and stable',()=>{assert.equal(deterministicRandom(1,'a',4),deterministicRandom(1,'a',4));assert.notEqual(deterministicRandom(1,'a',4),deterministicRandom(1,'a',5))});
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
  const directory=resolve('outputs/font-test');rmSync(directory,{recursive:true,force:true});mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'solid.vsrfont.json'),JSON.stringify({format:'vsr-bitmap-font-1',family:'Solid',glyphWidth:5,glyphHeight:7,advance:6,glyphs:{X:['11111','11111','11111','11111','11111','11111','11111'],' ':['00000','00000','00000','00000','00000','00000','00000']}}));
  const document:VSRDocument={specVersion:'0.1',metadata:{id:'font-resource',title:'Font',duration:1,defaultFps:30,seed:1},canvas:{width:20,height:20},assets:[{id:'solid-font',type:'font',src:'solid.vsrfont.json',mimeType:'application/json'}],nodes:[{id:'text',type:'text',layout:{x:0,y:0,width:20,height:20},appearance:{fill:{type:'solid',color:'#00ff00'}},content:{text:'X',fontFamily:'Solid',fontSize:16}}]};
  const output=resolve(directory,'rendered.png');renderFrame(document,0,output,{}, {assetBaseDir:directory,strictResources:true});const decoded=decodePng(readFileSync(output)),index=(10*decoded.width+5)*4;assert.ok(decoded.data[index+1]!>240&&decoded.data[index+3]===255);
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

let passed=0;const started=performance.now();for(const {name,fn} of tests){try{fn();passed++;console.log(`PASS ${name}`)}catch(error){console.error(`FAIL ${name}`);console.error(error);process.exitCode=1}}
console.log(`\n${passed}/${tests.length} tests passed in ${(performance.now()-started).toFixed(1)}ms.`);if(passed!==tests.length)process.exitCode=1;
