import assert from 'node:assert/strict';
import test from 'node:test';
import {analyzeTemporalDrawingStability,validateTemporalDrawingStability} from '../src/temporal-drawing-stability.mjs';

const pathOp=(id,dx=0,role=id)=>({kind:'path',id,role,z:1,d:`M ${10+dx} 10 C ${12+dx} 8 ${18+dx} 8 ${20+dx} 10 C ${18+dx} 22 ${12+dx} 22 ${10+dx} 10 Z`,fill:'#000',stroke:'#111',stroke_width:1});
const baseIr=(dx=0,extra=[])=>({width:320,height:180,operations:[pathOp('head',dx),pathOp('garment-body',dx),pathOp('neck',dx),pathOp('hair-crown',dx),pathOp('hair-fringe',dx),pathOp('collar-left',dx),pathOp('collar-right',dx),{kind:'line',id:'center-seam',role:'garment-structure-line',z:2,a:[15+dx,12],b:[15+dx,28],stroke:'#fff',stroke_width:1},...extra],mesh_silhouette_occluded_groups:[]});
const seq=(values,cut='A')=>values.map((dx,index)=>({frame_number:index+1,cut_id:cut,ir:baseIr(dx)}));

test('Identical DrawingIR frames pass with zero displacement and zero churn',()=>{const report=analyzeTemporalDrawingStability(seq([0,0,0,0])),validation=validateTemporalDrawingStability(report);assert.equal(validation.valid,true,validation.errors.join(','));assert.equal(report.summary.max_core_normalized_displacement,0);assert.equal(report.summary.mean_operation_churn_ratio,0);assert.equal(report.summary.core_missing_count,0);assert.equal(report.summary.core_topology_change_count,0);});

test('Small coherent motion passes and remains measurable',()=>{const report=analyzeTemporalDrawingStability(seq([0,.5,1,1.5,2]));assert.equal(report.passed,true,report.failures.join(','));assert.ok(report.summary.max_core_normalized_displacement>0);assert.ok(report.summary.max_core_normalized_displacement<.02);});

test('Core contour teleport fails even when path topology remains valid',()=>{const report=analyzeTemporalDrawingStability(seq([0,0,100]),{maxCoreDisplacement:.05});assert.equal(report.passed,false);assert.ok(report.failures.includes('TEMPORAL_DRAWING_CORE_TELEPORT'));});

test('Core path topology mutation is rejected',()=>{const a=baseIr(),b=baseIr();b.operations=b.operations.map(op=>op.id==='head'?{...op,d:'M 10 10 L 20 10 L 15 20 Z'}:op);const report=analyzeTemporalDrawingStability([{frame_number:1,cut_id:'A',ir:a},{frame_number:2,cut_id:'A',ir:b}]);assert.equal(report.passed,false);assert.ok(report.failures.includes('TEMPORAL_DRAWING_CORE_TOPOLOGY_CHANGED'));assert.ok(report.pairs[0].core_topology_change_ids.includes('head'));});

test('Cel path births and deaths are measured separately without masquerading as missing core anatomy',()=>{const cel=pathOp('cel-shadow-torso-1',0,'cel-shadow'),sequence=[{frame_number:1,cut_id:'A',ir:baseIr()},{frame_number:2,cut_id:'A',ir:baseIr(0,[cel])},{frame_number:3,cut_id:'A',ir:baseIr()}],report=analyzeTemporalDrawingStability(sequence);assert.equal(report.summary.core_missing_count,0);assert.equal(report.summary.core_topology_change_count,0);assert.ok(report.summary.cel_path_churn_count>=2);});

test('Cut boundaries are excluded from temporal displacement comparisons',()=>{const sequence=[{frame_number:1,cut_id:'A',ir:baseIr(0)},{frame_number:2,cut_id:'A',ir:baseIr(1)},{frame_number:3,cut_id:'B',ir:baseIr(120)},{frame_number:4,cut_id:'B',ir:baseIr(121)}],report=analyzeTemporalDrawingStability(sequence,{maxCoreDisplacement:.02});assert.equal(report.passed,true,report.failures.join(','));assert.equal(report.summary.adjacent_same_cut_pair_count,2);});
