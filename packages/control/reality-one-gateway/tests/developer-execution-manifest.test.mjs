import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {discoverRuntimeManifests} from '../src/discovery.mjs';

 test('developer execution runtime is declared in the unified RNCS runtime registry',()=>{
 const manifestDir=path.resolve(import.meta.dirname,'../runtimes');
 const {registry}=discoverRuntimeManifests([manifestDir],{gatewayProtocol:'0.3.0'});
 const runtime=registry.runtimes.find(item=>item.runtime_id==='rncs.developer-execution');
 assert.ok(runtime);
 assert.ok(runtime.actions.includes('engineeringWorkflow'));
 assert.ok(runtime.actions.includes('vsrRender'));
 assert.equal(registry.runtimes.length,17);
});
