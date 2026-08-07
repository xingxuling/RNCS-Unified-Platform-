import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {SemanticAnatomyWorkspace} from '../src/semantic-anatomy-studio.mjs';

const json=(root,name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));};

test('Semantic Anatomy workspace separates geometry, semantic and human gates',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-semantic-studio-'));
  json(root,'phase-status.json',{geometric_truth_kernel:'passed',semantic_morphology_certificate:'passed',ground_truth_human_status:'pending',human_visual_acceptance:'pending'});
  json(root,'semantic-certificate.json',{failures:[],gates:{head_semantics_valid:{measurement:.5,allowed:[.46,.58],method:'ratio',evidence_root:'x',pass:true}}});
  json(root,'character-design-target.json',{target_id:'target',target_root:'t',human_status:'pending',silhouette:{},face:{},hair:{},garment:{}});
  json(root,'human-visual-review.json',{review_id:'r',status:'revision-requested',observations:['head semantics invalid'],target_gates:['head_semantics_valid'],evidence_root:'h'});
  json(root,'human-rejection-regression.json',{red:true});
  json(root,'media-result.json',{status:'passed',mp4:{sha256:'m'},wav:{sha256:'w'},ffprobe:{valid:true}});
  json(root,'evidence-ledger.json',{ledger_root:'l',character_design_target_root:'t',semantic_certificate_root:'s',human_review_root:'h'});
  for(const view of ['front','three-quarter-right','side']){const file=path.join(root,'static-gates',`${view}.png`);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.from([137,80,78,71]));}
  json(root,'static-gates.json',{entries:['front','three-quarter-right','side'].map(view=>({view,status:'passed',file:{path:`static-gates/${view}.png`},render_root:view}))});
  const workspace=new SemanticAnatomyWorkspace({evidenceDir:root}),inspection=workspace.inspect();
  assert.equal(inspection.status,'ready-for-human-review');assert.equal(inspection.first_screen.geometry_certificate,'passed');assert.equal(inspection.first_screen.semantic_certificate,'passed');assert.equal(inspection.first_screen.human_visual_acceptance,'pending');assert.equal(inspection.first_screen.can_enter_creative_pass,false);assert.equal(inspection.human_review.status,'revision-requested');assert.equal(workspace.view('three-quarter').view,'three-quarter');
});

test('Semantic Anatomy workspace forbids evidence path traversal',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-semantic-studio-safe-')),workspace=new SemanticAnatomyWorkspace({evidenceDir:root});
  assert.throws(()=>workspace.asset('../secret'),error=>error.code==='SEMANTIC_EVIDENCE_PATH_FORBIDDEN');
});
