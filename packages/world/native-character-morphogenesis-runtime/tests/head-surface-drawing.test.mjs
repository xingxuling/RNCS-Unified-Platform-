import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {compileFullBodyArtDirectedMorphology} from '../src/lower-body-morphology.mjs';
import {buildNativeSurfaceFrame} from '../src/native-surface-runtime.mjs';
import {buildWeightedNativeSurfaceFrame} from '../src/weighted-native-surface-runtime.mjs';
import {buildHeadSurfaceDrawingGuide,validateHeadSurfaceDrawingGuide} from '../src/head-surface-drawing.mjs';
import {buildFaceSurfaceDrawingGuide} from '../src/face-surface-drawing.mjs';
import {compileFullBodyAnimeDrawingIR,validateFullBodyAnimeDrawingIR} from '../src/full-body-drawing-ir.mjs';

function fixture({view='front',pose='neutral',frame=0,weighted=true}={}){const system=createAnatomySystem({seed:'phase6-6-head-surface'}),asset=compileFullBodyArtDirectedMorphology(system.genome,{surface_resolution:'property',certificate_mode:'property'}),options={view,pose,frame,totalFrames:120,width:320,height:180,scale:.52},surface=weighted?buildWeightedNativeSurfaceFrame({canonical_morphology_asset:asset},options):buildNativeSurfaceFrame({canonical_morphology_asset:asset},options);return{system,asset,surface};}
const insideBox=(point,box,pad=2)=>point[0]>=box.left-pad&&point[0]<=box.right+pad&&point[1]>=box.top-pad&&point[1]<=box.bottom+pad;

test('Front, three-quarter and profile head contours come from visible skull surface evidence',()=>{for(const view of ['front','three-quarter-right','side']){const{surface}=fixture({view}),guide=buildHeadSurfaceDrawingGuide(surface),validation=validateHeadSurfaceDrawingGuide(guide);assert.equal(validation.valid,true,`${view}:${validation.errors.join(',')}`);assert.equal(guide.visibility_root,surface.visibility.visibility_root);assert.equal(guide.posed_mesh_root,surface.posed_mesh.posed_mesh_root);assert.ok(guide.source_pixel_count>0);assert.ok(guide.contour.length>=8);assert.equal(guide.stylization.method,'visible-skull-surface-plus-bounded-anime-jaw-taper');}});

test('Visible face surface features remain inside the final surface-head bounds',()=>{for(const view of ['front','three-quarter-right','side']){const{surface}=fixture({view}),head=buildHeadSurfaceDrawingGuide(surface),face=buildFaceSurfaceDrawingGuide(surface);for(const id of ['left_eye','right_eye','nose_tip','mouth_center']){const feature=face.features[id];if(feature.visible)assert.equal(insideBox(feature.screen_position,head.bounds,3),true,`${view}:${id}:${feature.screen_position}:${JSON.stringify(head.bounds)}`);}}});

test('Weighted FullBody DrawingIR replaces legacy head path with skull-surface contour root',()=>{const{surface}=fixture({view:'three-quarter-right',pose:'action',frame:60}),legacy=compileFullBodyAnimeDrawingIR(surface,{useHeadSurface:false}),candidate=compileFullBodyAnimeDrawingIR(surface),validation=validateFullBodyAnimeDrawingIR(candidate,{requireMeshSilhouette:true,requireHeadSurface:true,requireFaceSurface:true,requireHairSurface:true}),oldHead=legacy.operations.find(op=>op.id==='head'),head=candidate.operations.find(op=>op.id==='head');assert.equal(validation.valid,true,validation.errors.join(','));assert.ok(candidate.head_surface_drawing_guide_root);assert.ok(head?.head_surface_contour_root);assert.ok(head?.head_surface_guide_root);assert.notEqual(head.d,oldHead.d);});

test('Legacy non-weighted FullBody DrawingIR keeps previous head construction without skull-surface authority',()=>{const{surface}=fixture({weighted:false}),ir=compileFullBodyAnimeDrawingIR(surface),validation=validateFullBodyAnimeDrawingIR(ir);assert.equal(validation.valid,true,validation.errors.join(','));assert.equal(ir.head_surface_drawing_guide_root,undefined);assert.equal(ir.head_surface_policy,'disabled-compatible');assert.equal(ir.operations.find(op=>op.id==='head')?.head_surface_contour_root,undefined);});
