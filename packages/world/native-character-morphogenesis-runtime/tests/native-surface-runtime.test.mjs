import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {buildNativeSurfaceFrame,validateNativeSurfaceFrame} from '../src/native-surface-runtime.mjs';

test('native surface frame closes field, mesh, skinning, and visibility contracts',()=>{
  const frame=buildNativeSurfaceFrame(createAnatomySystem(),{view:'three-quarter-right',pose:'action',frame:36,totalFrames:120,width:160,height:90}),report=validateNativeSurfaceFrame(frame);
  assert.equal(report.valid,true,report.errors.join(','));
  assert.ok(frame.native_surface_root);
  assert.equal(frame.authority_flow[2],'Implicit Morphology Field');
  assert.ok(frame.visibility.report.visible_pixel_count>0);
});

test('native surface frame is deterministic for the same episode state',()=>{
  const system=createAnatomySystem(),first=buildNativeSurfaceFrame(system,{view:'front',pose:'neutral',frame:12,totalFrames:120,width:96,height:54}),second=buildNativeSurfaceFrame(system,{view:'front',pose:'neutral',frame:12,totalFrames:120,width:96,height:54});
  assert.equal(first.native_surface_root,second.native_surface_root);
  assert.equal(first.visibility.visibility_root,second.visibility.visibility_root);
});
