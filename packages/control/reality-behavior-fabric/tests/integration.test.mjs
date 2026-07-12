import test from 'node:test';import assert from 'node:assert/strict';import {BehaviorRuntime,replayProgram} from '../src/runtime.mjs';import {createGatewayManifest,createRsrCommandBatch,createStudioImport,createVsrDocument,createWorkspace,verifyWorkspace} from '../src/adapters.mjs';import {createPlayableHtml,renderStateSvg} from '../src/render.mjs';import {verifySeal} from '../src/canonical.mjs';import {loadProgram,providers,autopilot} from './helpers.mjs';
function completed(){const r=new BehaviorRuntime(loadProgram(),{providers});while(r.state.tick<500&&!r.state.globals.victory)r.tick(autopilot(r));return r;}
test('RSR 命令批次有效',()=>{const r=completed(),b=createRsrCommandBatch(r);assert.ok(b.commands.length>0);assert.equal(verifySeal(b,'batch_root'),true);});
test('VSR 玩家文档包含核心节点',()=>{const d=createVsrDocument(completed(),{observer:'player'});assert.equal(d.specVersion,'0.1');assert.ok(d.nodes.some(x=>x.id==='player'));assert.ok(d.nodes.some(x=>x.id==='hud'));});
test('VSR 调试文档包含调试节点',()=>{const d=createVsrDocument(completed(),{observer:'debugger'});assert.ok(d.nodes.some(x=>x.id==='debug'));});
test('Studio 导入提案密封',()=>{const i=createStudioImport(completed(),{trace:'trace.json'});assert.equal(i.format,'reality-studio.behavior-import.v0.1');assert.equal(verifySeal(i,'import_root'),true);});
test('Gateway Manifest 暴露关键能力',()=>{const m=createGatewayManifest();assert.ok(m.capabilities.some(x=>x.capability_id==='behavior.hot-reload'));assert.ok(m.capabilities.some(x=>x.capability_id==='behavior.commit-delta'));});
test('Workspace 完整验证',()=>{const r=completed(),w=createWorkspace({runtime:r,outputs:{trace:'trace.json'}});assert.equal(verifyWorkspace(w).valid,true);assert.equal(w.summary.victory,true);});
test('Workspace 篡改被检测',()=>{const r=completed(),w=createWorkspace({runtime:r,outputs:{trace:'trace.json'}});w.summary.score++;assert.equal(verifyWorkspace(w).valid,false);});
test('因果增量记录状态根',()=>{const r=completed(),d=r.causalDelta();assert.equal(d.state_root,r.stateRoot());assert.equal(verifySeal(d,'delta_root'),true);});
test('Trace 密封且包含规则与状态机',()=>{const r=completed(),t=r.exportTrace();assert.equal(verifySeal(t,'trace_root'),true);assert.ok(t.entries.some(x=>x.type==='rule.fired'));assert.ok(t.entries.some(x=>x.type==='machine.transition'));});
test('可玩 HTML 嵌入程序根',()=>{const p=loadProgram(),h=createPlayableHtml(p);assert.ok(h.includes(p.program_root));assert.ok(h.includes('canvas'));assert.ok(h.includes('Space/J'));});
test('玩家 SVG 可生成',()=>{const s=renderStateSvg(completed(),{debug:false});assert.ok(s.startsWith('<svg'));assert.ok(s.includes('试炼完成'));});
test('调试 SVG 包含状态根',()=>{const r=completed(),s=renderStateSvg(r,{debug:true});assert.ok(s.includes(r.stateRoot().slice(0,28)));assert.ok(s.includes('Behavior Debugger'));});
test('完成路线的重放根一致',()=>{const r=completed(),x=replayProgram(loadProgram(),r.state.input_log,{providers});assert.equal(x.stateRoot(),r.stateRoot());});
