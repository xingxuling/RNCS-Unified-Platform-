import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rootHash,validateArtifact} from '../src/index.mjs';
const a=JSON.parse(fs.readFileSync(new URL('../examples/rncs-project-laf1.json',import.meta.url),'utf8'));
assert.equal(validateArtifact(a).valid,true);
assert.equal(rootHash({中文:'现实',z:1}), '797b9286bc6528b0190e2da200356e76d0a19a048c0667e6d18981798a28f407');
const py=JSON.parse(fs.readFileSync(new URL('./fixtures/python-cross-runtime-root.json',import.meta.url),'utf8'));
assert.equal(rootHash(py.payload),py.root);
console.log(JSON.stringify({passed:3,artifact_root:a.evidence.artifact_root,cross_runtime_root:py.root},null,2));
