import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  normalizeSocietyIntent,compileSocietyGenome,createSocialEcology,generateTechnologyConceptSpace,
  simulateSocietyHistory,compilePlayerTechnologyProposal,generateSocietyGenesisWorkspace,
  verifySocietyGenesisWorkspace,inspectSocietyGenesisWorkspace,SOCIETY_FORMATS,SocietySandboxSession
} from '../src/index.mjs';

const input={
  description:'创建一个无LLM的2.5D社会生态游戏世界，玩家可参与政策、研究、创业和技术发明，历史会连续演化。',
  world_name:'测试城邦',seed:'society-test-seed',population:240,years:60,map_size:10,
  society:{knowledge_openness:7000,risk_tolerance:5200,cooperation:6500,inequality:2500,centralization:3900},
  constraints:{max_agents:48,max_concepts:14}
};
const intent=normalizeSocietyIntent(input),genome=compileSocietyGenome(intent),ecology=createSocialEcology(genome),space=generateTechnologyConceptSpace(genome,{maxConcepts:14});

test('society intent forbids LLM use',()=>assert.equal(intent.design.llm_usage,'forbidden'));
test('society genome uses deterministic rule engine',()=>{assert.equal(genome.simulation.engine,'deterministic-rule-system');assert.equal(genome.simulation.llm_calls,0)});
test('2.5D ecology contains requested map size',()=>{assert.equal(ecology.map.projection,'2.5d-isometric');assert.equal(ecology.map.width,10);assert.equal(ecology.map.tiles.length,100)});
test('social ecology contains agents households institutions factions and links',()=>{assert.equal(ecology.agents.length,48);assert.ok(ecology.households.length>=10);assert.equal(ecology.institutions.length,6);assert.equal(ecology.factions.length,4);assert.ok(ecology.links.length>=48)});
test('technology concept space has deterministic concepts',()=>{const again=generateTechnologyConceptSpace(genome,{maxConcepts:14});assert.equal(space.concept_space_root,again.concept_space_root);assert.equal(space.concepts.length,14)});
test('every technology has a complete engineering path',()=>assert.ok(space.concepts.every(c=>c.engineering_path.length===7)));
test('technology concepts preserve epistemic boundary',()=>assert.ok(space.concepts.every(c=>c.epistemic_status==='simulation-hypothesis'&&c.real_world_validation_required)));
test('history simulation spans requested years',()=>{const h=simulateSocietyHistory({genome,ecology,conceptSpace:space,years:60});assert.equal(h.ledger.length,60);assert.equal(h.summary.years,60)});
test('history creates social and technology events',()=>{const h=simulateSocietyHistory({genome,ecology,conceptSpace:space,years:60});assert.ok(h.summary.event_count>0);assert.ok(h.ledger.some(y=>y.events.some(e=>e.type==='technology')))});
test('at least one technology can emerge or be adopted',()=>{const h=simulateSocietyHistory({genome,ecology,conceptSpace:space,years:60});const progressed=Object.values(h.final_state.concepts).filter(c=>c.progress>=.25);assert.ok(progressed.length>=1)});
test('history is deterministic for same seed and interventions',()=>{const a=simulateSocietyHistory({genome,ecology,conceptSpace:space,years:60}),b=simulateSocietyHistory({genome,ecology,conceptSpace:space,years:60});assert.equal(a.history_root,b.history_root)});
test('player intervention creates a distinct history branch',()=>{const a=simulateSocietyHistory({genome,ecology,conceptSpace:space,years:60}),b=simulateSocietyHistory({genome,ecology,conceptSpace:space,years:60,interventions:[{year:2,type:'allocate-research',value:.28}]});assert.notEqual(a.history_root,b.history_root);assert.ok(b.ledger[1].events.some(e=>e.code==='RESEARCH_REALLOCATED'))});
test('player can propose technology without LLM',()=>{const c=compilePlayerTechnologyProposal({player_id:'player:1',name:'公共热存储网',function:'store-energy',principle:'phase-change',substrate:'salt-hydrate',energy:'solar-thermal',control:'mechanical-governor',manufacturing:'kiln',domains:['materials','energy','organization']},{genome,conceptSpace:space});assert.equal(c.origin,'player-structured-proposal');assert.equal(c.engineering_path.length,7)});
test('invalid player technology component is rejected',()=>assert.throws(()=>compilePlayerTechnologyProposal({function:'magic',principle:'phase-change',substrate:'salt-hydrate',energy:'solar-thermal',control:'manual',manufacturing:'kiln'},{genome}),/PLAYER_TECH_COMPONENT_INVALID/));

test('full society genesis workspace verifies with files',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ragf-society-'));const ws=generateSocietyGenesisWorkspace(input,{outDir:dir});const v=verifySocietyGenesisWorkspace(ws,{baseDir:dir,verifyFiles:true});assert.equal(v.valid,true);assert.equal(v.file_integrity_checked,9)});
test('workspace is deterministic across output paths',()=>{const a=fs.mkdtempSync(path.join(os.tmpdir(),'ragf-soc-a-')),b=fs.mkdtempSync(path.join(os.tmpdir(),'ragf-soc-b-'));assert.equal(generateSocietyGenesisWorkspace(input,{outDir:a}).workspace_root,generateSocietyGenesisWorkspace(input,{outDir:b}).workspace_root)});
test('preview is interactive and contains no remote model call',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ragf-preview-'));generateSocietyGenesisWorkspace(input,{outDir:dir});const html=fs.readFileSync(path.join(dir,'preview.html'),'utf8');assert.ok(html.includes('玩家介入'));assert.ok(html.includes('LLM调用：0'));assert.ok(!html.includes('fetch('))});
test('file tampering is detected',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ragf-tamper-'));const ws=generateSocietyGenesisWorkspace(input,{outDir:dir});fs.appendFileSync(path.join(dir,'social-ecology.json'),'x');assert.equal(verifySocietyGenesisWorkspace(ws,{baseDir:dir,verifyFiles:true}).valid,false)});
test('inspect exposes game-production facts',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ragf-inspect-'));const ws=generateSocietyGenesisWorkspace(input,{outDir:dir}),x=inspectSocietyGenesisWorkspace(ws);assert.equal(x.llm_calls,0);assert.equal(x.technology.concepts,14);assert.ok(x.player_actions.includes('propose-technology'))});
test('workspace uses v0.5 society format',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ragf-format-'));const ws=generateSocietyGenesisWorkspace(input,{outDir:dir});assert.equal(ws.format,SOCIETY_FORMATS.workspace)});

test('live society session advances deterministic playable time',()=>{const session=new SocietySandboxSession(input),snap=session.step(5);assert.equal(snap.year,5);assert.equal(snap.state.year,5)});
test('live society session accepts bounded player action',()=>{const session=new SocietySandboxSession(input);session.dispatch({type:'allocate-research',value:.3});const snap=session.step(3);assert.equal(snap.interventions.length,1);assert.equal(snap.state.policies.research_share,.3)});
test('live society session can add a player technology proposal',()=>{const session=new SocietySandboxSession(input),before=session.technology_concept_space.concepts.length;const c=session.proposeTechnology({player_id:'player:2',name:'水力机械规则站',function:'compute-rules',principle:'mechanical-logic',substrate:'steel',energy:'water',control:'mechanical-governor',manufacturing:'precision-assembly',domains:['mechanics','computation','organization']});assert.equal(session.technology_concept_space.concepts.length,before+1);assert.equal(c.origin,'player-structured-proposal')});
test('live society replay is stable',()=>{const session=new SocietySandboxSession(input);session.dispatch({year:2,type:'open-knowledge-commons',value:800});const a=session.replayTo(12),b=session.replayTo(12);assert.equal(a.history_root,b.history_root)});
