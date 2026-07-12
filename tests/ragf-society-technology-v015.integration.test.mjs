import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateSocietyGenesisWorkspace,verifySocietyGenesisWorkspace,simulateSocietyHistory,compilePlayerTechnologyProposal} from '../packages/world/reality-asset-genesis-fabric/src/index.mjs';

const intent={description:'2.5D无LLM社会生态游戏集成验收',world_name:'集成城邦',seed:'integration-v015',population:180,years:45,map_size:9,constraints:{max_agents:36,max_concepts:12},society:{knowledge_openness:7200,cooperation:6400,risk_tolerance:5200}};
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-ragf-society-')),workspace=generateSocietyGenesisWorkspace(intent,{outDir:dir,interventions:[{year:4,type:'open-knowledge-commons',value:900}]});

test('mother project consumes RAGF society workspace',()=>assert.equal(verifySocietyGenesisWorkspace(workspace,{baseDir:dir,verifyFiles:true}).valid,true));
test('society workspace stays LLM independent',()=>assert.equal(workspace.genome.simulation.llm_calls,0));
test('2.5D projection is exported',()=>assert.equal(workspace.projection_2_5d.projection,'2.5d-isometric'));
test('technology paths are implementation-bearing',()=>assert.ok(workspace.technology_concept_space.concepts.every(c=>c.engineering_path.some(p=>p.name==='component-prototype')&&c.engineering_path.some(p=>p.name==='field-pilot'))));
test('player proposal can join the same technology grammar',()=>{const c=compilePlayerTechnologyProposal({player_id:'player:test',name:'潮差机械计算站',function:'compute-rules',principle:'mechanical-logic',substrate:'steel',energy:'water',control:'mechanical-governor',manufacturing:'precision-assembly',domains:['mechanics','computation','organization']},{genome:workspace.genome,conceptSpace:workspace.technology_concept_space});assert.equal(c.origin,'player-structured-proposal')});
test('player policy creates a distinct replayable branch',()=>{const baseline=simulateSocietyHistory({genome:workspace.genome,ecology:workspace.social_ecology,conceptSpace:workspace.technology_concept_space,years:45}),branch=simulateSocietyHistory({genome:workspace.genome,ecology:workspace.social_ecology,conceptSpace:workspace.technology_concept_space,years:45,interventions:[{year:2,type:'allocate-research',value:.3}]});assert.notEqual(baseline.history_root,branch.history_root)});
