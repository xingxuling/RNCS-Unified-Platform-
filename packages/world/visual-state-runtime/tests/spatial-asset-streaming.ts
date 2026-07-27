import assert from 'node:assert/strict';
import { resolveSpatialAssetStreaming, VSRSpatialAssetStreamer, verifySpatialAssetStreamingReceipt, type VSRSpatialAssetRecord } from '../packages/spatial-reality-3d/src/index.js';
import { sha256Bytes } from '../packages/spec/src/index.js';

const bytes=(value:string):Uint8Array=>new TextEncoder().encode(value);
const record=(id:string,value:string,extra:Partial<VSRSpatialAssetRecord>={}):VSRSpatialAssetRecord=>({id,uri:`/${id}.bin`,sha256:sha256Bytes(bytes(value)),byteLength:bytes(value).byteLength,kind:'other',...extra});
const tests:Array<{name:string;fn:()=>void|Promise<void>}>=[];
const test=(name:string,fn:()=>void|Promise<void>):void=>{tests.push({name,fn})};

test('asset streaming resolution orders dependencies, cells, and budgets deterministically',()=>{
  const catalog=[
    record('asset:texture','texture',{kind:'texture',cellIds:['cell:a'],priority:4}),
    record('asset:mesh','mesh',{kind:'mesh',cellIds:['cell:a'],dependencies:['asset:texture'],priority:10}),
    record('asset:background','background',{kind:'texture',cellIds:['cell:b'],priority:1}),
  ];
  const plan=resolveSpatialAssetStreaming(catalog,{activeCellIds:['cell:a'],maxBytes:13});
  assert.deepEqual(plan.requestedAssetIds,['asset:mesh','asset:texture']);
  assert.deepEqual(plan.requiredAssetIds,['asset:texture','asset:mesh']);
  assert.deepEqual(plan.queuedAssetIds,['asset:texture','asset:mesh']);
  assert.deepEqual(plan.deferredAssetIds,[]);
  assert.equal(plan.bytesQueued,11);
  assert.equal(plan.missingAssetIds.length,0);
  assert.equal(plan.root,resolveSpatialAssetStreaming(catalog,{activeCellIds:['cell:a'],maxBytes:13}).root);
});

test('asset streamer loads dependency-first with bounded concurrency and verifies bytes',async()=>{
  const catalog=[record('asset:independent','independent'),record('asset:root','root',{dependencies:['asset:dependency']}),record('asset:dependency','dependency')],payloads=new Map(catalog.map(asset=>[asset.id,bytes(asset.id.replace('asset:',''))])),starts:string[]=[];
  let inFlight=0,maxInFlight=0;
  const streamer=new VSRSpatialAssetStreamer(catalog,async(asset)=>{starts.push(asset.id);inFlight++;maxInFlight=Math.max(maxInFlight,inFlight);await new Promise(resolve=>setTimeout(resolve,2));inFlight--;return payloads.get(asset.id)!},{maxConcurrent:2});
  const receipt=await streamer.acquire({requestedAssetIds:['asset:root','asset:independent']});
  assert.deepEqual(starts,['asset:independent','asset:dependency','asset:root']);
  assert.equal(maxInFlight,2);
  assert.deepEqual(receipt.readyAssetIds,['asset:independent','asset:dependency','asset:root']);
  assert.equal(receipt.failedAssetIds.length,0);
  assert.equal(receipt.blockedAssetIds.length,0);
  assert.equal(verifySpatialAssetStreamingReceipt(receipt),true);
  const second=await streamer.acquire({requestedAssetIds:['asset:root']});
  assert.deepEqual(second.operations,[]);
  assert.equal(starts.length,3);
  assert.ok(streamer.get('asset:root') instanceof Uint8Array);
  streamer.release(['asset:root']);streamer.release(['asset:root']);streamer.release(['asset:independent']);
  assert.deepEqual(streamer.evict(),['asset:dependency','asset:independent','asset:root']);
});

test('asset hash failure blocks dependents and seals failure evidence',async()=>{
  const bad=record('asset:bad','expected'),root=record('asset:root','root',{dependencies:['asset:bad']});bad.sha256='0'.repeat(64);
  const streamer=new VSRSpatialAssetStreamer([bad,root],async asset=>bytes(asset.id==='asset:bad'?'actual':'root'));
  const receipt=await streamer.acquire({requestedAssetIds:['asset:root']});
  assert.deepEqual(receipt.failedAssetIds,['asset:bad']);
  assert.deepEqual(receipt.blockedAssetIds,['asset:root']);
  assert.equal(streamer.state('asset:bad'),'failed');
  assert.equal(streamer.state('asset:root'),'blocked');
  assert.equal(verifySpatialAssetStreamingReceipt(receipt),true);
});

test('asset streaming schema and frame binding stay explicit',()=>{
  const plan=resolveSpatialAssetStreaming([record('asset:mesh','mesh')],{requestedAssetIds:['asset:mesh']});
  assert.equal(plan.format,'vsr.spatial-asset-streaming.v0.1');
  assert.match(plan.root,/^[a-f0-9]{64}$/);
});

let passed=0;
for(const entry of tests){try{await entry.fn();passed++;console.log(`PASS ${entry.name}`)}catch(error){console.error(`FAIL ${entry.name}`);throw error}}
console.log(`VSR spatial asset streaming tests: ${passed}/${tests.length} PASS`);
