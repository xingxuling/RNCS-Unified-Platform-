import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {compileArtDirectedMorphology} from '../src/semantic-anatomy.mjs';
import {buildNativeSurfaceFrame} from '../src/native-surface-runtime.mjs';
import {compileAnimeDrawingIR,validateAnimeDrawingIR,drawingIrToSvg} from '../src/drawing-ir.mjs';

const build=view=>{const system=createAnatomySystem({seed:`phase6-6-${view}`}),asset=compileArtDirectedMorphology(system.genome,{surface_resolution:'validation',certificate_mode:'canonical'}),frame=buildNativeSurfaceFrame({canonical_morphology_asset:asset},{view,pose:view==='front'?'neutral':'alert',frame:0,totalFrames:1,width:640,height:360,scale:1.18});return compileAnimeDrawingIR(frame);};

test('Drawing IR is backend-neutral and uses cubic Bezier character contours',()=>{for(const view of ['front','three-quarter-right','side']){const ir=build(view),validation=validateAnimeDrawingIR(ir);assert.equal(validation.valid,true,`${view}:${validation.errors.join(',')}`);assert.equal(ir.backend_contract.rasterizer_authority,false);assert.ok(ir.operations.filter(op=>op.kind==='path').length>=8);assert.ok(ir.operations.some(op=>op.kind==='path'&&op.d.includes('C ')));assert.equal(ir.lower_body_status,'not-represented-in-canonical-skeleton-v0.1');}});

test('SVG backend preserves vector path semantics instead of primitive raster body',()=>{const ir=build('three-quarter-right'),svg=drawingIrToSvg(ir);assert.match(svg,/shape-rendering="geometricPrecision"/);assert.match(svg,/<path[^>]+ C /);assert.match(svg,/id="garment-body"/);assert.match(svg,/id="sleeve-left"/);assert.match(svg,/id="hair-crown"/);assert.doesNotMatch(svg,/Canvas\.capsule/);});
