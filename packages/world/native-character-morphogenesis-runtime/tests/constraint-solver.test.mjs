import assert from 'node:assert/strict';
import test from 'node:test';
import {createCharacterGenome} from '../../character-genome-runtime/src/index.mjs';
import {createMorphologyLawSet,solveProportions,compileMorphology} from '../src/canonical-morphology.mjs';

test('relational constraint solver records requested, solved, adjustments, and measured ratios',()=>{
  const genome=createCharacterGenome({seed:'phase6-3-law-solver',body_parameters:{'body.shoulder_width':.31,'body.head_body_ratio':.39,'body.neck_length':.68,'body.limb_ratio':.38,'body.torso_length':.66},identity_parameters:{'face.jaw_width':.7}});
  const law=createMorphologyLawSet(genome),solution=solveProportions(genome,law),constraint=solution.constraint_solution;
  assert.equal(constraint.solver,'deterministic-relational-projection');
  assert.equal(constraint.law_root,law.law_root);
  assert.ok(constraint.solution_root);
  assert.ok(constraint.adjustments.length>=1);
  assert.ok(constraint.measurements.head_to_body>=law.anime_stylization_ranges.head_to_body[0]-1e-6);
  assert.ok(constraint.measurements.head_to_body<=law.anime_stylization_ranges.head_to_body[1]+1e-6);
  assert.ok(constraint.measurements.shoulder_to_head>=law.anime_stylization_ranges.shoulder_to_head[0]-1e-6);
  assert.ok(constraint.measurements.shoulder_to_head<=law.anime_stylization_ranges.shoulder_to_head[1]+1e-6);
  assert.deepEqual(constraint.violations,[]);
});

test('invalid law range rejects before geometry is emitted',()=>{
  const genome=createCharacterGenome({seed:'phase6-3-invalid-law'}),law=createMorphologyLawSet(genome);
  law.hard_constraints.maximum_head_unit=law.hard_constraints.minimum_head_unit-.001;
  assert.throws(()=>solveProportions(genome,law),error=>error.code==='MORPHOLOGY_LAW_RANGE_INVALID');
});

test('compiled asset exposes the law solution without moving authority into renderer',()=>{
  const asset=compileMorphology(createCharacterGenome({seed:'phase6-3-compiled-law'}));
  assert.equal(asset.proportions.constraint_solution.law_root,asset.law_set.law_root);
  assert.equal(asset.skeleton.bone_length_source,'Canonical Proportion Solver');
  assert.equal(asset.proportions.constraint_solution.rejection_policy,'unsatisfiable-relational-laws-reject');
});
