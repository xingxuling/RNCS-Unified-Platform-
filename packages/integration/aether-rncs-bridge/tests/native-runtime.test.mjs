import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {AetherworldRNCSNativeRuntime,compileNaturalLanguageToRNCS,validateCompilationPlan,migrateCompilationPlan,createAetherIslandProgram} from '../src/index.mjs';
import {compileRclAuthorityPlan as compileRclAuthorityPlanRaw} from '../../../control/rncs-rcl-control-plane/src/index.mjs';
const compileRclAuthorityPlan=source=>compileRclAuthorityPlanRaw(source,{roles:['owner','security']});
const source='创建一座小型以太岛。岛上有两个玩家出生点、一扇可开关的门、一盏蓝色能量灯和一个感应区域。玩家进入感应区域时，门自动打开，灯光增强并产生环境声音。两个客户端必须看到一致的门状态和玩家位置。';
const runtime=()=>new AetherworldRNCSNativeRuntime({dataDir:fs.mkdtempSync(path.join(os.tmpdir(),'rncs-native-test-'))});
async function authorized(){const r=runtime(),plan=r.compile({source}),candidate=r.createCandidate({plan});await r.simulateCandidate({candidateId:candidate.candidate_id});const authority=r.authorizeCandidate({candidateId:candidate.candidate_id,approvalRoles:['owner','security']});return{r,plan,candidate,authority};}
test('Compilation Plan v0.2 schema accepts executable plan',()=>{const plan=compileNaturalLanguageToRNCS(source);assert.equal(validateCompilationPlan(plan).valid,true);assert.equal(plan.artifacts.length,6);});
test('illegal plan is rejected and cannot directly write authority',()=>{const plan=compileNaturalLanguageToRNCS(source);plan.world_state_changes.push({op:'set',path:'world.authority.state_root',value:'x'});assert.equal(validateCompilationPlan(plan).valid,false);});
test('v0.1 plan migrates to v0.2',()=>{const p=migrateCompilationPlan({format:'rncs.compilation-plan.v0.1',source:{language:'IAL',version:'1',digestBasis:'x'},artifacts:[],behaviors:[],branches:[],projections:[]});assert.equal(p.version,'0.2.0');});
test('candidate branch preserves baseline and diff',()=>{const r=runtime(),plan=r.compile({source}),c=r.createCandidate({plan}),d=r.diffCandidate({candidateId:c.candidate_id});assert.ok(d.diff.length>0);assert.equal(c.rollback_point.revision,1);});
test('candidate simulation is isolated and executable',async()=>{const r=runtime(),p=r.compile({source}),c=r.createCandidate({plan:p}),s=await r.simulateCandidate({candidateId:c.candidate_id});assert.equal(s.execution_receipt.status,'completed');assert.equal(r.worldStatus().world_id,'world:empty');});
test('candidate baseline drift rejects a stale merge',async()=>{const r=runtime(),first=r.compile({source}),second=r.compile({source:`${source} 追加一个可见的世界标题。`}),a=r.createCandidate({plan:first}),b=r.createCandidate({plan:second});await r.simulateCandidate({candidateId:a.candidate_id});await r.simulateCandidate({candidateId:b.candidate_id});r.authorizeCandidate({candidateId:a.candidate_id,approvalRoles:['owner','security']});r.authorizeCandidate({candidateId:b.candidate_id,approvalRoles:['owner','security']});await r.mergeCandidate({candidateId:a.candidate_id});await assert.rejects(()=>r.mergeCandidate({candidateId:b.candidate_id}),error=>error.code==='CANDIDATE_BASELINE_STALE');});
test('AAF returns require approval without quorum and approves with owner plus security',async()=>{const r=runtime(),p=r.compile({source}),c=r.createCandidate({plan:p});await r.simulateCandidate({candidateId:c.candidate_id});const one=r.authorizeCandidate({candidateId:c.candidate_id,approvalRoles:['owner']});assert.ok(one.decisions.some(x=>x.status==='pending_approval'&&x.outcome==='require_approval'));const two=r.authorizeCandidate({candidateId:c.candidate_id,approvalRoles:['owner','security']});assert.ok(two.decisions.filter(x=>x.action!=='delete_world_object').every(x=>x.status==='approved'));});
test('AAF denies critical action',async()=>{const {authority}=await authorized();const d=authority.decisions.find(x=>x.action==='delete_world_object');assert.equal(d.status,'denied');assert.equal(d.outcome,'deny');});
test('formal Behavior identity triggers door light and audio',async()=>{const {r,candidate}=await authorized();const b=r.registerBehavior({candidateId:candidate.candidate_id});assert.equal(b.behavior_id,'behavior:aether-island-sensor-v1');assert.ok(b.program_root);});
test('Behavior can be disabled and enabled',async()=>{const {r,candidate}=await authorized();const b=r.registerBehavior({candidateId:candidate.candidate_id});assert.equal(r.setBehaviorEnabled({behaviorId:b.behavior_id,enabled:false}).enabled,false);assert.equal(r.setBehaviorEnabled({behaviorId:b.behavior_id,enabled:true}).enabled,true);const p=createAetherIslandProgram('1.0.1');assert.ok(r.updateBehavior({behaviorId:b.behavior_id,program:p}).program_root);});
test('merge produces RFE Generation Revision Snapshot Evidence and State Root',async()=>{const {r,candidate}=await authorized();r.registerBehavior({candidateId:candidate.candidate_id});const m=await r.mergeCandidate({candidateId:candidate.candidate_id});assert.ok(m.generation.generationId);assert.ok(m.generation.integrityHash);assert.ok(m.evidence.rfe_commit_receipt.integrityHash);});
test('RSR materializes formal world state',async()=>{const {r,candidate}=await authorized();r.registerBehavior({candidateId:candidate.candidate_id});await r.mergeCandidate({candidateId:candidate.candidate_id});const m=r.materializeRSR();assert.ok(m.physical_entity_count>=8);assert.equal(m.world_id,'world:aether-island');});
test('Network two clients converge and VSR stays presentation-only',async()=>{const {r,candidate}=await authorized();r.registerBehavior({candidateId:candidate.candidate_id});await r.mergeCandidate({candidateId:candidate.candidate_id});const x=await r.runLoopback();assert.equal(x.sensor_entered,true);assert.equal(x.network.converged,true);assert.equal(x.projection.authority_presentation_separated,true);assert.equal(x.door_state,true);assert.ok(x.rfe_event.generation_id);assert.equal(r.worldStatus().revision,x.rfe_event.revision);});
test('rollback and replay create new Generations and restore world',async()=>{const {r,candidate}=await authorized();const before=r.history()[0];r.registerBehavior({candidateId:candidate.candidate_id});const merge=await r.mergeCandidate({candidateId:candidate.candidate_id});const rb=r.rollbackGeneration({generationId:before.generation_id});assert.equal(rb.state.world.world_id,'world:empty');assert.equal(rb.authority.status,'approved');const rp=r.replayGeneration({generationId:merge.generation.generationId});assert.equal(rp.state.world.world_id,'world:aether-island');assert.equal(rp.authority.status,'approved');});
test('complete Aetherworld world manufacturing E2E passes all acceptance rules',async()=>{const result=await runtime().runEndToEnd({source});assert.ok(Object.values(result.acceptance).every(Boolean),JSON.stringify(result.acceptance));});
test('RCL candidate operations execute and persist in the authoritative world snapshot',async()=>{const r=runtime();const compiled=await compileRclAuthorityPlan(`reality RclOperationRuntime {
 facet rncs.world.world_id : Text = "world:rcl-operations"
 facet rncs.world.change.title.op : Text = "set"
 facet rncs.world.change.title.path : Text = "world.title"
 facet rncs.world.change.title.value : Text = "native operation"
 facet rncs.world.change.count.op : Text = "increment"
 facet rncs.world.change.count.path : Text = "world.count"
 facet rncs.world.change.count.value : Number = 2
 facet rncs.world.change.tag.op : Text = "append"
 facet rncs.world.change.tag.path : Text = "world.tags"
 facet rncs.world.change.tag.value : Text = "rcl"
 }
 `);const candidate=r.createCandidate({plan:compiled.plan});await r.simulateCandidate({candidateId:candidate.candidate_id});r.authorizeCandidate({candidateId:candidate.candidate_id,approvalRoles:['owner','security']});await r.mergeCandidate({candidateId:candidate.candidate_id});const snapshot=r.worldSnapshot();assert.equal(snapshot.state.world.title,'native operation');assert.equal(snapshot.state.world.count,2);assert.deepEqual(snapshot.state.world.tags,['rcl']);});
test('RCL behavior execution projects its causal state into the authoritative world snapshot',async()=>{const r=runtime();const compiled=await compileRclAuthorityPlan(`reality RclBehaviorProjection {
 facet rncs.world.world_id : Text = "world:rcl-behavior-projection"
 facet rncs.world.behavior.signal.id : Text = "behavior:rcl-projection"
 facet rncs.world.behavior.signal.version : Text = "1.0.0"
 facet rncs.world.behavior.signal.trigger.event : Text = "rcl.signal"
 facet rncs.world.behavior.signal.action.type : Text = "set"
 facet rncs.world.behavior.signal.action.target : Text = "globals.triggered"
 facet rncs.world.behavior.signal.action.value : Truth = true
 facet rncs.world.behavior.signal.action.capability_id : Text = "rcl.state.write"
 facet rncs.world.behavior.signal.capability.id : Text = "rcl.state.write"
 facet rncs.world.behavior.signal.capability.required_scope : Text = "world.object.write"
 facet rncs.world.behavior.signal.capability.risk : Text = "medium"
 }
 `);const candidate=r.createCandidate({plan:compiled.plan});await r.simulateCandidate({candidateId:candidate.candidate_id});r.authorizeCandidate({candidateId:candidate.candidate_id,approvalRoles:['owner','security']});await r.mergeCandidate({candidateId:candidate.candidate_id});const execution=r.executeBehavior({behaviorId:'behavior:rcl-projection',event:'rcl.signal'});const snapshot=r.worldSnapshot();assert.equal(snapshot.state.world.runtime.behavior_globals.triggered,true);assert.ok(execution.execution.world_changed_paths.includes('world.runtime.behavior_globals.triggered'));assert.equal(execution.execution.world_state_root,snapshot.state_root);});
test('RCL authority binding is committed into the RFE authority event',async()=>{const r=runtime();const compiled=await compileRclAuthorityPlan(`reality RclAuthorityBinding {
 facet rncs.world.world_id : Text = "world:rcl-authority-binding"
 facet rncs.world.title : Text = "bound candidate"
 }
 `);const candidate=r.createCandidate({plan:compiled.plan});await r.simulateCandidate({candidateId:candidate.candidate_id});r.authorizeCandidate({candidateId:candidate.candidate_id,approvalRoles:['owner','security']});await r.mergeCandidate({candidateId:candidate.candidate_id});const event=r.store.materialize().events.at(-1);assert.equal(event.authority.status,'approved');assert.match(event.authority.binding_root,/^[0-9a-f]{64}$/);const evidence=event.evidence.find(item=>item.kind==='rncs.rcl-authority-binding');assert.ok(evidence);assert.equal(evidence.root,event.authority.binding_root);});
