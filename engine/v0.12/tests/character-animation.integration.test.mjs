import test from 'node:test';
import assert from 'node:assert/strict';
import {createCharacterAnimationDemo} from '../examples/character-animation.mjs';

test('v0.12 closes RAGF character GLB to VSR skinning and Studio animation projection', () => {
  const result = createCharacterAnimationDemo({name:'Frost Blade Character',category:'character'}, './outputs/v012-character');
  const rig = result.imported.scene.characterRigs[0];
  assert.ok(rig.bones.length > 0);
  assert.ok(rig.clips.length > 0);
  assert.notEqual(result.rest.animated_geometry_root, result.animated.animated_geometry_root);
  assert.notEqual(result.rest.pixel_root, result.animated.pixel_root);
  assert.equal(result.rest.reality_root, result.animated.reality_root);
});
