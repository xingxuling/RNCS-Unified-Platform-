import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {buildCanonicalSurfaceMesh,validateCanonicalSurfaceMesh} from '../src/canonical-surface-mesh.mjs';

test('deterministic canonical field extraction produces a real connected mesh',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,first=buildCanonicalSurfaceMesh({field:asset.continuous_morphology_field,profile:'property'}),second=buildCanonicalSurfaceMesh({field:asset.continuous_morphology_field,profile:'property'});
  assert.ok(first.mesh_root);
  assert.deepEqual(first,second);
  assert.ok(first.vertices.length>0);
  assert.ok(first.triangles.length>0);
  assert.equal(first.vertices.length,first.normals.length);
  assert.equal(first.vertices.length,first.bone_weights.length);
  assert.equal(first.connected_components.length,1);
  assert.equal(validateCanonicalSurfaceMesh(first).valid,true,validateCanonicalSurfaceMesh(first).errors.join(','));
});

test('canonical mesh stores topology, semantic regions, materials, and normalized bone weights',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,mesh=buildCanonicalSurfaceMesh({field:asset.continuous_morphology_field,profile:'property'});
  assert.equal(mesh.adjacency.length,mesh.vertices.length);
  assert.ok(Array.isArray(mesh.boundary_edges));
  assert.ok(mesh.surface_groups.length>0);
  assert.ok(mesh.region_ids.some(value=>String(value).includes('skull')));
  assert.ok(mesh.material_ids.every(value=>typeof value==='string'));
  assert.ok(mesh.bone_weights.every(weights=>Math.abs(Object.values(weights).reduce((sum,value)=>sum+value,0)-1)<1e-6));
  assert.equal(mesh.camera_independent,true);
  assert.equal(mesh.style_independent,true);
});

test('mesh validator rejects malformed topology instead of certifying it',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,mesh=buildCanonicalSurfaceMesh({field:asset.continuous_morphology_field,profile:'property'}),invalid={...mesh,triangles:[[999,0,1]]};
  const report=validateCanonicalSurfaceMesh(invalid);
  assert.equal(report.valid,false);
  assert.ok(report.errors.includes('MESH_TRIANGLE_INVALID'));
});
