import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildProject,verifyBuild} from '../src/builder.mjs';
import {readJson,verifySeal} from '../src/canonical.mjs';
import {generateFrostTrialTileMap,sealUnifiedProject} from '@taowind/reality-studio-native';

const root=path.resolve(import.meta.dirname,'..');
const projectFile=path.join(root,'examples','冰境试炼.unified-project.json');

test('release builds carry deterministic runtime evidence',()=>{
  const base={project_file:projectFile,targets:['web-release'],mode:'release',quality_profile:'balanced',build_time:'2026-07-15T00:00:00.000Z',runtime_trace:[{move_right:true},{},{attack:true}],spatial_trace:[[{id:'build-test-move',type:'move-character',characterId:'subject:player',direction:{x:1000000,y:0,z:0}}],[{id:'build-test-impulse',type:'apply-impulse',bodyId:'orb',impulse:{x:1000,y:0,z:0}}]],app:{app_id:'com.taowind.runtimeevidence',title:'Runtime Evidence',version_name:'0.1.0',version_code:1}};
  const outA=fs.mkdtempSync(path.join(os.tmpdir(),'reality-build-runtime-a-')),outB=fs.mkdtempSync(path.join(os.tmpdir(),'reality-build-runtime-b-'));
  const a=buildProject({...base,output_dir:outA}),b=buildProject({...base,output_dir:outB});
  assert.equal(a.cache_hit,false);assert.equal(b.cache_hit,false);assert.equal(a.runtime_deterministic,true);assert.equal(b.runtime_deterministic,true);
  const evidenceA=readJson(path.join(outA,'runtime-evidence.json')),evidenceB=readJson(path.join(outB,'runtime-evidence.json'));
  assert.equal(verifySeal(evidenceA,'evidence_root'),true);assert.equal(evidenceA.evidence_root,evidenceB.evidence_root);assert.equal(evidenceA.timeline_root,evidenceB.timeline_root);assert.equal(evidenceA.replay_root,evidenceB.replay_root);assert.equal(evidenceA.spatial_deterministic,true);assert.equal(evidenceA.spatial_final_state_root,evidenceB.spatial_final_state_root);assert.equal(evidenceA.spatial_runtime_manifest_root,evidenceB.spatial_runtime_manifest_root);assert.equal(evidenceA.spatial_replay_deterministic,true);assert.equal(evidenceA.spatial_replay_bundle_root,evidenceB.spatial_replay_bundle_root);assert.equal(evidenceA.spatial_replay_result_root,evidenceB.spatial_replay_result_root);assert.equal(evidenceA.spatial_replay_final_state_root,evidenceA.spatial_final_state_root);assert.equal(evidenceA.gpu_frame_plan_root,evidenceB.gpu_frame_plan_root);assert.equal(evidenceA.gpu_frame_summary_root,evidenceB.gpu_frame_summary_root);
  const gpuPlan=readJson(path.join(outA,'gpu-frame-plan.json')),sourceProject=readJson(projectFile),playerNode=sourceProject.scenes[0].nodes.find(node=>node.node_id==='node:player'),playerBinding=gpuPlan.dynamicBindings.find(binding=>binding.entityId==='player');assert.ok(playerBinding);assert.equal(playerBinding.baseX,playerNode.transform.x);assert.equal(playerBinding.baseY,playerNode.transform.y);
  for(const file of ['runtime-evidence.json','runtime-timeline.json','runtime-replay.json','runtime-checkpoint.json','spatial-snapshot.json','spatial-causal-delta.json','spatial-runtime.manifest.json','spatial-replay-bundle.json','spatial-replay-result.json','gpu-frame-plan.json','gpu-frame-summary.json','gpu-viewport.manifest.json'])assert.ok(fs.existsSync(path.join(outA,file)));
  for(const file of ['runtime-evidence.json','runtime-timeline.json','runtime-replay.json','runtime-checkpoint.json','spatial-snapshot.json','spatial-causal-delta.json','spatial-runtime.manifest.json','spatial-replay-bundle.json','spatial-replay-result.json','gpu-frame-plan.json','gpu-frame-summary.json','gpu-viewport.manifest.json'])assert.ok(fs.existsSync(path.join(outA,'web-release',file)));
  const bundle=readJson(path.join(outA,'spatial-replay-bundle.json')),replayResult=readJson(path.join(outA,'spatial-replay-result.json'));assert.equal(bundle.bundle_root,evidenceA.spatial_replay_bundle_root);assert.equal(replayResult.replay_root,evidenceA.spatial_replay_result_root);
  const graph=readJson(path.join(outA,'build-graph.json'));assert.ok(graph.nodes.some(node=>node.id==='runtime-evidence'));assert.ok(graph.nodes.find(node=>node.id==='runtime-evidence').outputs.includes('spatial-replay-bundle.json'));
  assert.equal(verifyBuild(outA).valid,true);assert.equal(verifyBuild(outB).valid,true);
});

test('TileMap projects carry navigation evidence',()=>{
  const project=readJson(projectFile),tilemap=generateFrostTrialTileMap();
  project.scenes[0].tilemaps=[tilemap];project.editor.active_tilemap_id=tilemap.tilemap_id;project.editor.active_tile_layer_id='layer:terrain';
  const projectDir=fs.mkdtempSync(path.join(os.tmpdir(),'reality-build-navigation-project-')),navProjectFile=path.join(projectDir,'project.json'),out=path.join(projectDir,'out');
  fs.writeFileSync(navProjectFile,JSON.stringify(sealUnifiedProject(project)));
  const build=buildProject({project_file:navProjectFile,output_dir:out,targets:['web-release'],app:{app_id:'com.taowind.navigationevidence',title:'Navigation Evidence',version_name:'0.1.0',version_code:1},spatial_trace:[[{type:'move-character',characterId:'subject:player',direction:{x:1000000,y:0,z:0}}]]});
  const manifest=readJson(path.join(out,'tilemap-navigation.manifest.json'));assert.ok(manifest.manifest_root);assert.equal(build.navigation_manifest_root,manifest.manifest_root);assert.equal(verifyBuild(out).valid,true);assert.ok(fs.existsSync(path.join(out,'web-release','tilemap-navigation.manifest.json')));const browserData=fs.readFileSync(path.join(out,'web-release','build-data.js'),'utf8');assert.match(browserData,/navigation_manifest/);assert.match(browserData,/navigation_root/);
});
