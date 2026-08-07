import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {compileArtDirectedMorphology} from '../src/semantic-anatomy.mjs';
import {buildNativeSurfaceFrame} from '../src/native-surface-runtime.mjs';
import {buildSemanticArtProjection} from '../src/semantic-art-projection.mjs';
import {compileCharacterDrawing,validateCharacterDrawing} from '../src/character-drawing-compiler.mjs';
import {renderSemanticAnimeFrame} from '../src/semantic-anime-renderer.mjs';

const asset=()=>{const system=createAnatomySystem({seed:'phase6-5-character-drawing'});return compileArtDirectedMorphology(system.genome,{surface_resolution:'property',certificate_mode:'property'});};
const frame=(value,view='front',pose='neutral')=>buildNativeSurfaceFrame({canonical_morphology_asset:value},{view,pose,frame:28,totalFrames:120,width:320,height:180});

test('Phase 6.4 primitive projection is a RED baseline for the Character Drawing Compiler',()=>{
  const value=asset(),legacy=buildSemanticArtProjection(frame(value,'front'));
  assert.equal(legacy.format,'rncs.semantic-art-projection.v0.3');
  assert.equal(Object.hasOwn(legacy,'drawing_certificate'),false,'legacy projection must not be mistaken for a validated drawing model');
  assert.equal(Object.hasOwn(legacy.torso??{},'armpit_left'),false,'legacy torso has no explicit armpit contour contract');
  assert.equal(Object.hasOwn(legacy.arms?.[0]?.upper??{},'contour'),false,'legacy arm is still radius/capsule oriented');
});

test('front drawing compiles shoulder socket, armpit, torso hierarchy, tapered limbs and readable hands',()=>{
  const drawing=compileCharacterDrawing(frame(asset(),'front')),validation=validateCharacterDrawing(drawing),g=drawing.drawing_certificate.gates;
  assert.equal(validation.valid,true,validation.failures.join(','));
  assert.equal(g.shoulder_socket_continuity.pass,true);
  assert.equal(g.armpit_contour_validity.pass,true);
  assert.equal(g.ribcage_waist_pelvis_hierarchy.pass,true);
  assert.equal(g.limb_taper_continuity.pass,true);
  assert.equal(g.hand_scale_validity.pass,true);
  assert.equal(drawing.face.eyes.length,2);
  assert.equal(drawing.view.kind,'front');
});

test('3/4 drawing is asymmetric and keeps face features inside the constructed head',()=>{
  const drawing=compileCharacterDrawing(frame(asset(),'three-quarter-right')),validation=validateCharacterDrawing(drawing),g=drawing.drawing_certificate.gates;
  assert.equal(validation.valid,true,validation.failures.join(','));
  assert.equal(drawing.view.kind,'three-quarter');
  assert.equal(g.three_quarter_asymmetry_validity.pass,true);
  assert.equal(g.face_feature_surface_containment.pass,true);
  assert.equal(drawing.face.eyes.length,2);
  assert.notEqual(drawing.face.eyes[0].scale,drawing.face.eyes[1].scale);
});

test('profile drawing exposes only the near eye and preserves a coherent character silhouette',()=>{
  const drawing=compileCharacterDrawing(frame(asset(),'side')),validation=validateCharacterDrawing(drawing),g=drawing.drawing_certificate.gates;
  assert.equal(validation.valid,true,validation.failures.join(','));
  assert.equal(drawing.view.kind,'profile');
  assert.equal(drawing.face.eyes.length,1);
  assert.equal(g.profile_feature_visibility.pass,true);
  assert.equal(g.whole_character_silhouette_plausibility.pass,true);
});

test('action pose stays on the same drawing model contract instead of falling back to capsule-body rendering',()=>{
  const value=asset(),surface=frame(value,'three-quarter-right','action'),rendered=renderSemanticAnimeFrame(surface),drawing=rendered.drawing;
  assert.equal(rendered.format,'rncs.native-anime-frame.v0.5');
  assert.equal(rendered.diagnostics.primitive_body_final_path,false);
  assert.equal(rendered.diagnostics.renderer_role,'character-drawing-raster-only');
  assert.equal(validateCharacterDrawing(drawing).valid,true);
  assert.ok(rendered.png.length>1000);
});

test('renderer source no longer uses capsule primitive as the final character-body path',()=>{
  const source=fs.readFileSync(new URL('../src/semantic-anime-renderer.mjs',import.meta.url),'utf8');
  assert.equal(source.includes('.capsule('),false,'Phase 6.5 renderer must consume drawing contours, not draw capsule limbs');
  assert.equal(source.includes('compileCharacterDrawing'),true);
});
