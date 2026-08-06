import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd(),summaryFile=path.join(root,'evidence/anime-forge-phase5-visual-body-v0.1/evidence-summary.json'),script=path.join(root,'scripts/generate-anime-phase5-visual-evidence.mjs'),stableKeys=['production_root','episode_intent_root','candidate_branch_root','temporal_stability_root','spatial_consistency_root','visual_ledger_internal_root'];
function build(){const result=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});if(result.status!==0)throw new Error(`PHASE5_EVIDENCE_BUILD_FAILED\n${result.stdout}\n${result.stderr}`);return JSON.parse(fs.readFileSync(summaryFile,'utf8'))}
const first=build(),second=build();for(const key of stableKeys)assert.equal(second[key],first[key],`Non-deterministic stable evidence root: ${key}`);assert.equal(second.status,'failed');assert.equal(second.phase5_visual_replacement_status,'failed');assert.equal(second.provider_code,'MODEL_MISSING');assert.equal(second.media.mp4,null);assert.ok(second.media.wav?.sha256);process.stdout.write(`${JSON.stringify({ok:true,stable_roots:stableKeys,roots:Object.fromEntries(stableKeys.map(key=>[key,second[key]])),volatile_file_sha256:true,media:{mp4:null,wav:'real-component-wav'}},null,2)}\n`);
