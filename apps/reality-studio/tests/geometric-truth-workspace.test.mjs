import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startStudioServer} from '../src/server.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const evidenceDir=path.join(repoRoot,'evidence/anime-forge-phase6-3-geometric-truth-v0.1');
const source=fs.readFileSync(path.join(repoRoot,'packages/integration/rcl-anime-production-bridge/examples/shenlinzhe-yanlv-micro-episode.rcl'),'utf8');

test('Reality Studio exposes the Phase 6.3 geometric truth workspace without changing authority',async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'anime-forge-geometric-truth-')),started=await startStudioServer({port:0,dataDir,geometricTruthEvidenceDir:evidenceDir});
  try{
    const response=await fetch(started.url+'/api/anime-forge/geometric-truth'),workspace=await response.json();
    assert.equal(response.status,200);assert.equal(workspace.format,'reality-studio.anime-geometric-truth-workspace.v0.1');assert.equal(workspace.phase,'phase-6.3-native-morphology-field-geometric-truth');
    assert.equal(workspace.static_validation.status,'pass');assert.equal(workspace.geometric_truth.status,'green');assert.equal(workspace.static_validation.views.length,3);assert.equal(workspace.cut_continuity.cut_count,3);assert.ok(workspace.secondary_motion_tracks.length>0);assert.ok(workspace.provider_usage.some(item=>item.provider_id==='rncs.native-surface-visibility-cpu'&&item.deterministic===true));assert.equal(workspace.authority.episode,'authoritative');assert.equal(workspace.authority.cut,'derived inspection and QA view');assert.equal(workspace.authority.automatic_visual_acceptance,false);
    assert.equal(workspace.playable,workspace.mp4_build.status==='complete'&&workspace.mp4_build.ffprobe_valid===true);assert.ok(workspace.failures.includes('MEDIA_TOOL_NOT_FOUND')||workspace.playable);
    const compiledResponse=await fetch(started.url+'/api/anime-forge/compile',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source})}),compiled=await compiledResponse.json();assert.equal(compiled.ok,true);assert.equal(compiled.geometric_truth.format,'reality-studio.anime-geometric-truth-workspace.v0.1');assert.equal(compiled.geometric_truth.session_id,compiled.session_id);
    const sessionResponse=await fetch(started.url+'/api/anime-forge/geometric-truth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session_id:compiled.session_id})}),sessionWorkspace=await sessionResponse.json();assert.equal(sessionWorkspace.ok,true);assert.equal(sessionWorkspace.evidence_ledger.ledger_root,workspace.evidence_ledger.ledger_root);
    const health=await fetch(started.url+'/api/health').then(result=>result.json());assert.equal(health.anime_forge_geometric_truth_workspace,true);assert.equal(health.anime_forge_geometric_truth_phase,'phase-6.3-native-morphology-field-geometric-truth');
  }finally{await new Promise(resolve=>started.server.close(resolve))}
});

test('Anime Forge page contains desktop and mobile geometric truth surfaces',()=>{
  const html=fs.readFileSync(path.join(repoRoot,'apps/reality-studio/web/anime-forge.html'),'utf8');
  assert.match(html,/geometricTruthPanel/u);assert.match(html,/geometricTruthBtn/u);assert.match(html,/geometricStatus/u);assert.match(html,/geometricMedia/u);assert.match(html,/geometricFailure/u);assert.match(html,/geometricNext/u);assert.match(html,/@media\(max-width:760px\)/u);assert.match(html,/geometric-truth-strip/u);
});
