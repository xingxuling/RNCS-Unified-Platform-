import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {compileMorphology} from '../src/canonical-morphology.mjs';
import {createCharacterDesignTarget,compileArtDirectedMorphology,buildSemanticMorphologyCertificate,validateSemanticMorphologyCertificate} from '../src/semantic-anatomy.mjs';
import {createSemanticAnimeVisualGrammar,validateSemanticAnimeVisualGrammar} from '../src/semantic-anime-visual-grammar.mjs';

test('Phase 6.3 geometric truth asset is RED under semantic character oracle',()=>{
  const system=createAnatomySystem({seed:'phase6-4-red-baseline'}),asset=compileMorphology(system.genome,{surface_resolution:'property',certificate_mode:'property'}),target=createCharacterDesignTarget(),certificate=buildSemanticMorphologyCertificate(asset,target,{evidence_root:'phase6-3-human-rejection-v01'}),validation=validateSemanticMorphologyCertificate(certificate);
  assert.equal(validation.valid,false,'Phase 6.3 baseline must not silently pass the new semantic oracle');
  assert.ok(validation.failures.some(name=>['head_semantics_valid','hair_semantics_valid','garment_semantics_valid','character_target_similarity_valid'].includes(name)),validation.failures.join(','));
});

test('art-directed semantic compiler preserves identity while producing measured GREEN semantic certificate',()=>{
  const system=createAnatomySystem({seed:'phase6-4-semantic-green'}),target=createCharacterDesignTarget(),asset=compileArtDirectedMorphology(system.genome,{target,surface_resolution:'property',certificate_mode:'property'}),validation=validateSemanticMorphologyCertificate(asset.semantic_certificate);
  assert.equal(asset.genome_root,system.genome_root);assert.equal(asset.identity_root,system.character_identity_root);assert.equal(validation.valid,true,validation.failures.join(','));assert.ok(asset.semantic_morphology_root);assert.equal(asset.semantic_target_root,target.target_root);
});

test('semantic certificate core gates are measurements, never naked booleans',()=>{
  const system=createAnatomySystem({seed:'phase6-4-certificate'}),asset=compileArtDirectedMorphology(system.genome,{surface_resolution:'property',certificate_mode:'property'});
  for(const [name,gate] of Object.entries(asset.semantic_certificate.gates)){assert.equal(typeof gate,'object',name);assert.ok(Object.hasOwn(gate,'measurement'),name);assert.ok(Object.hasOwn(gate,'allowed'),name);assert.equal(typeof gate.method,'string',name);assert.ok(gate.evidence_root,name);assert.equal(typeof gate.pass,'boolean',name);}
});

test('AnimeVisualGrammar v0.3 requires visibility then semantic readability before decorative detail',()=>{
  const grammar=createSemanticAnimeVisualGrammar(),validation=validateSemanticAnimeVisualGrammar(grammar),order=grammar.stylization_order;
  assert.equal(validation.valid,true,validation.errors.join(','));assert.ok(order.indexOf('camera-visibility')<order.indexOf('semantic-readability'));assert.ok(order.indexOf('semantic-readability')<order.indexOf('secondary-detail'));assert.equal(grammar.detail_suppression.prohibit_noise_before_semantic_pass,true);
});
