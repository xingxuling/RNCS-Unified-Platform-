import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {buildNativeSurfaceFrame} from '../src/native-surface-runtime.mjs';
import {createAnimeVisualGrammar,validateAnimeVisualGrammar} from '../src/anime-visual-grammar.mjs';
import {renderNativeAnimeFrame,validateNativeAnimeFrame} from '../src/native-anime-renderer.mjs';

test('AnimeVisualGrammar v0.2 places style after geometry and visibility',()=>{
  const grammar=createAnimeVisualGrammar(),validation=validateAnimeVisualGrammar(grammar);
  assert.equal(validation.valid,true,validation.errors.join(','));
  assert.deepEqual(grammar.geometry_precondition.required,['continuous_morphology_field','canonical_surface_mesh','posed_surface_mesh']);
  assert.equal(grammar.face_feature_policy.occlusion,'DepthBuffer-required');
  assert.ok(grammar.grammar_root);
});

test('native anime renderer consumes real surface and visibility buffers',()=>{
  const system=createAnatomySystem({seed:'phase6-3-native-render'}),frame=buildNativeSurfaceFrame(system,{view:'three-quarter-right',pose:'action',frame:36,totalFrames:120,width:320,height:180}),rendered=renderNativeAnimeFrame(frame),validation=validateNativeAnimeFrame(rendered);
  assert.equal(validation.valid,true,validation.errors.join(','));
  assert.equal(rendered.diagnostics.anatomy_authority,false);
  assert.ok(rendered.diagnostics.hair_guide_count>0);
  assert.ok(rendered.diagnostics.face_feature_count>0);
  assert.ok(new Set(rendered.png).size>16,'native frame should not be a flat placeholder');
  const second=renderNativeAnimeFrame(frame);assert.equal(rendered.render_root,second.render_root);
});

test('native renderer rejects a frame that fails the geometry gate',()=>{
  assert.throws(()=>renderNativeAnimeFrame({format:'rncs.native-surface-frame.v0.1',visibility:{}}),error=>error.code==='NATIVE_RENDER_GEOMETRY_GATE_REJECTED');
});
