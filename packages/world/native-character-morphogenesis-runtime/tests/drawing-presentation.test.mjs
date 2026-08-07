import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {compileFullBodyArtDirectedMorphology} from '../src/lower-body-morphology.mjs';
import {buildNativeSurfaceFrame} from '../src/native-surface-runtime.mjs';
import {compileFullBodyAnimeDrawingIR} from '../src/full-body-drawing-ir.mjs';
import {applyDrawingPresentation,validateDrawingPresentation} from '../src/drawing-presentation.mjs';

function source(){const system=createAnatomySystem({seed:'phase6-6-presentation'}),asset=compileFullBodyArtDirectedMorphology(system.genome,{surface_resolution:'property',certificate_mode:'property'}),frame=buildNativeSurfaceFrame({canonical_morphology_asset:asset},{view:'front',pose:'neutral',frame:0,totalFrames:1,width:640,height:360,scale:.52}),ir=compileFullBodyAnimeDrawingIR(frame);return{system,asset,frame,ir};}

test('Drawing presentation changes display root but preserves upstream identity/drawing authority roots',()=>{const{ir}=source(),presented=applyDrawingPresentation(ir,{translate_y:-50.4,reason:'full-body-safe-frame'}),validation=validateDrawingPresentation(presented);assert.equal(validation.valid,true,validation.errors.join(','));assert.notEqual(presented.drawing_ir_root,ir.drawing_ir_root);assert.equal(presented.presentation_source_root,ir.drawing_ir_root);assert.equal(presented.drawing_root,ir.drawing_root);assert.equal(presented.full_body_drawing_certificate_root,ir.full_body_drawing_certificate_root);assert.equal(presented.lower_body_status,ir.lower_body_status);assert.equal(presented.presentation_transform.translate_y,-50.4);});

test('Drawing presentation rejects invalid scale instead of producing malformed geometry',()=>{const{ir}=source();assert.throws(()=>applyDrawingPresentation(ir,{scale:0}),error=>error?.code==='DRAWING_PRESENTATION_TRANSFORM_INVALID');assert.throws(()=>applyDrawingPresentation(ir,{scale:Number.NaN}),error=>error?.code==='DRAWING_PRESENTATION_TRANSFORM_INVALID');});
