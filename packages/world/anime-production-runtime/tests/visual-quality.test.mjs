import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CHARACTER_REFERENCE_PACK_FORMAT,
  CONDITION_TYPES,
  REFERENCE_VIEWS,
  createCharacterReferencePack,
  createVisualCandidateBranch,
  createVisualConditionPack,
  createVisualEvidenceLedger,
  createVisualModelManifest,
  createVisualProviderManifest,
  createVisualQualityReport,
  createVisualSelectionReceipt,
  createVisualPatchReceipt,
  analyzeVisualFrameSequence,
  commitVisualCandidate,
  selectVisualCandidate,
  setHumanVisualAcceptance,
  transitionVisualCandidate,
  validateCharacterReferencePack,
  validateVisualCandidateBranch,
  validateVisualConditionPack,
  validateVisualModelManifest,
  validateVisualProviderManifest,
  rootHash,
} from '../src/index.mjs';

const roots={episode:'episode-root',shot:'shot-root',identity:'identity-root'};
const provider=createVisualProviderManifest({provider_id:'test.visual-provider',provider_version:'1.0.0',roles:['condition','keyframe','motion-video','temporal-repair'],inputs:['shot'],outputs:['frames','clip'],execution:{kind:'external-process',binary:'visual-worker'},media:{produces_media:true}});
const model=createVisualModelManifest({model_id:'test-model',model_revision:'rev-1',weight_sha256:'a'.repeat(64),weight_bytes:1024,license:{status:'declared',spdx:'Apache-2.0',source:'test'},status:'available',runtime:{framework:'test',version:'1',device:'cpu'}});
const reference=createCharacterReferencePack({character_id:'character:lan',identity_root:roots.identity,genome_root:'genome-root',appearance_root:'appearance-root',lineage_root:'lineage-root',references:REFERENCE_VIEWS.map(view=>({view_id:view,path:`references/${view}.png`,media_type:'image/png',sha256:'b'.repeat(64),placeholder:false})),human_character_acceptance:'pending',status:'ready'});
const condition=createVisualConditionPack({episode_intent_root:roots.episode,shot_intent_root:roots.shot,character_identity_root:roots.identity,reference_pack_root:reference.reference_pack_root,status:'complete',conditions:CONDITION_TYPES.map(type=>({type,status:'ready',root:rootHash({type,status:'ready'}),path:`conditions/${type}.png`}))});

function candidate(overrides={}){return createVisualCandidateBranch({episode_intent_root:roots.episode,shot_intent_root:roots.shot,character_identity_root:roots.identity,character_reference_pack_root:reference.reference_pack_root,condition_pack_root:condition.condition_pack_root,provider_manifest:provider,model_id:model.model_id,model_revision:model.model_revision,model_license:model.license,model_license_root:model.license_root,model_manifest_root:model.model_manifest_root,seed:17,sampler:'ddim',scheduler:'cosine',reconstruction_parameters:{steps:4,width:1280,height:720},output_frame_root:'frame-root',output_video_root:'video-root',output_media:{produces_media:true,mock:false,fixture:false},...overrides});}

test('visual provider, model and pack schemas are sealed and explicit',()=>{
  assert.equal(validateVisualProviderManifest(provider).valid,true);
  assert.equal(validateVisualModelManifest(model).valid,true);
  assert.equal(reference.format,CHARACTER_REFERENCE_PACK_FORMAT);
  assert.equal(validateCharacterReferencePack(reference).valid,true);
  assert.equal(validateVisualConditionPack(condition,{requireComplete:true}).valid,true);
  const schemas=['visual-provider-manifest.v0.1.schema.json','visual-model-manifest.v0.1.schema.json','character-reference-pack.v0.1.schema.json','visual-condition-pack.v0.1.schema.json','visual-candidate-branch.v0.1.schema.json'];
  for(const file of schemas)assert.ok(fs.existsSync(path.join(import.meta.dirname,'../schemas',file)),file);
});
test('identity root and human acceptance cannot be written by provider automation',()=>{
  const initial=candidate();assert.equal(validateVisualCandidateBranch(initial,{requireGeneratedMedia:true}).valid,true);assert.equal(initial.human_visual_acceptance,'pending');assert.throws(()=>setHumanVisualAcceptance(initial,{status:'accepted',reviewerId:'test:automation',reviewerMode:'test'}),/HUMAN_VISUAL_ACCEPTANCE_REQUIRES_HUMAN_RECEIPT/);const accepted=setHumanVisualAcceptance(initial,{status:'accepted',reviewerId:'human:reviewer-1',reviewerMode:'human',reason:'manual viewing'});assert.equal(accepted.human_visual_acceptance,'accepted');assert.equal(accepted.character_identity_root,roots.identity);
});

test('candidate branch state machine requires shortlist and selection receipt',()=>{
  let value=candidate();value=transitionVisualCandidate(value,'conditioning');value=transitionVisualCandidate(value,'generating');value=transitionVisualCandidate(value,'generated');value=transitionVisualCandidate(value,'shortlisted');assert.throws(()=>selectVisualCandidate(value,{selection_receipt_root:'bad'}),/VISUAL_SELECTION_RECEIPT_INVALID/);const receipt=createVisualSelectionReceipt({candidate:value,actorId:'test:director',authorized:true});const selected=selectVisualCandidate(value,receipt);assert.equal(selected.candidate_status,'selected');assert.equal(selected.selection_receipt_root,receipt.selection_receipt_root);assert.throws(()=>commitVisualCandidate({candidate:value,receipt}),/VISUAL_CANDIDATE_SELECTED_REQUIRED/);
});

test('provider cannot commit Episode and explicit receipt is required',()=>{
  let value=candidate();for(const state of ['conditioning','generating','generated','shortlisted'])value=transitionVisualCandidate(value,state);const receipt=createVisualSelectionReceipt({candidate:value,authorized:true});const selected=selectVisualCandidate(value,receipt);const committed=commitVisualCandidate({candidate:selected,receipt,currentMediaRoot:'previous-media-root'});assert.equal(committed.candidate.candidate_status,'committed');assert.equal(committed.commit_receipt.human_visual_acceptance,'pending');assert.equal(committed.commit_receipt.episode_intent_root,roots.episode);assert.equal(committed.commit_receipt.character_identity_root,roots.identity);assert.equal(committed.preview.impact.episode_intent_changed,false);
});

test('quality report keeps automatic metrics separate from human judgment',()=>{const report=createVisualQualityReport({candidate_branch_root:'candidate-root',metrics:{identity_similarity:.91,temporal_variance:.03},rules:[{id:'identity',pass:true},{id:'human-view',pass:false}],failed_intervals:[{start_frame:8,end_frame:12,reason:'hair-drift'}],human_review_items:['face and costume must be watched'],automatic_score:.91});assert.equal(report.status,'fail');assert.equal(report.automatic_score.cannot_authorize_commit,true);assert.equal(report.human_review_items.length,1)});

test('temporal report rejects incomplete, blank and mostly repeated output',()=>{const report=analyzeVisualFrameSequence({expectedFrameCount:4,frames:[{filename:'a',sha256:'a'},{filename:'b',sha256:'a'},{filename:'c',sha256:'a'}]});assert.equal(report.status,'fail');assert.equal(report.complete,false);assert.equal(report.consecutive_duplicate_frames.length,2)});

test('local visual patch preserves global roots and records rollback scope',()=>{const before=candidate({candidate_id:'before',output_frame_root:'before-frame'}),after=candidate({candidate_id:'after',output_frame_root:'after-frame'}),patch=createVisualPatchReceipt({beforeCandidate:before,afterCandidate:after,interval:{start_frame:40,end_frame:52},region:{kind:'face',mask_root:'mask-root'},reason:'eye drift',episodeIntentRoot:roots.episode,characterIdentityRoot:roots.identity,unaffectedFrameRoots:['f0','f1']});assert.equal(patch.status,'pending-human-review');assert.equal(patch.rollback_allowed,true);assert.equal(patch.episode_intent_root,roots.episode);assert.deepEqual(patch.unaffected_frame_roots,['f0','f1']);
});

test('visual ledger keeps media, file and internal roots distinct',()=>{const ledger=createVisualEvidenceLedger({status:'blocked',episode_intent_root:roots.episode,human_visual_acceptance:'pending',gates:{provider_execution:false}});assert.equal(ledger.format,'rncs.anime-visual-evidence-ledger.v0.1');assert.ok(ledger.ledger_internal_root);assert.equal(ledger.media_sha256,null);assert.equal(ledger.gates.provider_execution,false)});
