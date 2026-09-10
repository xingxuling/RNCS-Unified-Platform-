import assert from 'node:assert/strict';
import { resolveSpatialAssetStreaming, VSRSpatialAssetStreamer, createVSRBrowserAssetCache, verifySpatialAssetStreamingReceipt, verifySpatialAssetTransitionReceipt, type VSRSpatialAssetRecord } from '../packages/spatial-reality-3d/src/index.js';
import { sha256Bytes } from '../packages/spec/src/index.js';

const bytes=(value:string):Uint8Array=>new TextEncoder().encode(value);
const response=(payload:Uint8Array):Response=>new Response(payload.buffer.slice(payload.byteOffset,payload.byteOffset+payload.byteLength) as ArrayBuffer);
const record=(id:string,value:string,extra:Partial<VSRSpatialAssetRecord>={}):VSRSpatialAssetRecord=>({id,uri:`/${id}.bin`,sha256:sha256Bytes(bytes(value)),byteLength:bytes(value).byteLength,kind:'other',...extra});
const tests:Array<{name:string;fn:()=>void|Promise<void>}>=[];
const test=(name:string,fn:()=>void|Promise<void>):void=>{tests.push({name,fn})};

class MemoryCache{
  readonly values=new Map<string,Response>();
  key(input:RequestInfo|URL):string{return typeof input==='string'?input:input instanceof URL?input.toString():input.url}
  async match(input:RequestInfo|URL):Promise<Response|undefined>{return this.values.get(this.key(input))?.clone()}
  async put(input:RequestInfo|URL,response:Response):Promise<void>{this.values.set(this.key(input),response.clone())}
  async delete(input:RequestInfo|URL):Promise<boolean>{return this.values.delete(this.key(input))}
  async keys():Promise<Request[]>{return[...this.values.keys()].map(value=>new Request(value))}
}
class MemoryCacheStorage{readonly cache=new MemoryCache();async open(_name:string):Promise<Cache>{return this.cache as unknown as Cache}}

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

test('asset streamer honors a provider-backed load priority without changing resolution',async()=>{
  const catalog=[record('asset:a','a'),record('asset:b','b'),record('asset:c','c')],starts:string[]=[],streamer=new VSRSpatialAssetStreamer(catalog,async asset=>{starts.push(asset.id);return bytes(asset.id.slice(-1))},{maxConcurrent:1,loadPriority:asset=>asset.id==='asset:c'?10:0});
  const receipt=await streamer.acquire({requestedAssetIds:['asset:a','asset:b','asset:c']});
  assert.deepEqual(starts,['asset:c','asset:a','asset:b']);
  assert.deepEqual(receipt.resolution.requestedAssetIds,['asset:a','asset:b','asset:c']);
  assert.equal(receipt.failedAssetIds.length,0);
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

test('asset transition releases the previous lease set before evicting over-budget residents',async()=>{
  const catalog=[record('asset:near','near',{cellIds:['cell:near']}),record('asset:far','far',{cellIds:['cell:far']})],streamer=new VSRSpatialAssetStreamer(catalog,async asset=>bytes(asset.id.replace('asset:','')));
  const near=await streamer.acquire({activeCellIds:['cell:near','cell:far'],maxBytes:7}),far=await streamer.acquire({activeCellIds:['cell:near'],maxBytes:4}),transition=streamer.reconcile(near,far);
  assert.deepEqual(transition.releasedAssetIds,['asset:far','asset:near']);
  assert.deepEqual(transition.evictedAssetIds,['asset:far']);
  assert.deepEqual(transition.receipt.readyAssetIds,['asset:near']);
  assert.equal(streamer.state('asset:far'),'evicted');
  assert.equal(streamer.inspect().bytesResident,4);
  assert.equal(verifySpatialAssetTransitionReceipt(transition),true);
});

test('asset streaming schema and frame binding stay explicit',()=>{
  const plan=resolveSpatialAssetStreaming([record('asset:mesh','mesh')],{requestedAssetIds:['asset:mesh']});
  assert.equal(plan.format,'vsr.spatial-asset-streaming.v0.1');
  assert.match(plan.root,/^[a-f0-9]{64}$/);
});

test('asset format and external-resource metadata participate in catalog identity',()=>{
  const base=record('asset:scene','scene'),glb=resolveSpatialAssetStreaming([{...base,format:'glb'}],{requestedAssetIds:['asset:scene']}),gltf=resolveSpatialAssetStreaming([{...base,format:'gltf',metadata:{resourceUri:'scene.bin'}}],{requestedAssetIds:['asset:scene']});
  assert.notEqual(glb.catalogRoot,gltf.catalogRoot);
  assert.notEqual(glb.root,gltf.root);
});

test('foreground assets get priority over a bounded Cell prefetch plan',async()=>{
  const catalog=[record('asset:near','near',{cellIds:['cell:near'],priority:10}),record('asset:far','far',{cellIds:['cell:far'],priority:1})],plan=resolveSpatialAssetStreaming(catalog,{activeCellIds:['cell:near'],prefetchCellIds:['cell:far'],maxAssets:2,maxBytes:8,maxPrefetchAssets:1,maxPrefetchBytes:3});
  assert.deepEqual(plan.requestedAssetIds,['asset:near']);
  assert.deepEqual(plan.requiredAssetIds,['asset:near']);
  assert.deepEqual(plan.prefetchAssetIds,['asset:far']);
  assert.deepEqual(plan.queuedAssetIds,['asset:near']);
  assert.deepEqual(plan.prefetchQueuedAssetIds,['asset:far']);
  assert.equal(plan.bytesQueued,4);
  assert.equal(plan.prefetchBytesQueued,3);
  const starts:string[]=[],streamer=new VSRSpatialAssetStreamer(catalog,async asset=>{starts.push(asset.id);return bytes(asset.id.replace('asset:',''))});
  const prefetched=await streamer.prefetch({prefetchCellIds:['cell:far'],maxAssets:2,maxBytes:8,maxPrefetchAssets:1,maxPrefetchBytes:3});
  assert.deepEqual(prefetched.readyAssetIds,['asset:far']);
  assert.deepEqual(prefetched.leasedAssetIds,[]);
  const near=await streamer.acquire({activeCellIds:['cell:near'],maxAssets:2,maxBytes:8});
  assert.deepEqual(near.leasedAssetIds,['asset:near']);
  assert.deepEqual(starts,['asset:far','asset:near']);
  const far=await streamer.acquire({activeCellIds:['cell:far'],maxAssets:2,maxBytes:8});
  assert.deepEqual(far.operations,[]);
  assert.deepEqual(far.leasedAssetIds,['asset:far']);
  streamer.release(near.leasedAssetIds);streamer.release(far.leasedAssetIds);
  assert.deepEqual(streamer.evict(),['asset:far','asset:near']);
});

test('browser cache provider rehydrates bytes and invalidates a changed scene revision',async()=>{
  const storage=new MemoryCacheStorage(),payload=bytes('browser-payload'),descriptor=record('asset:browser','browser-payload'),options={cacheName:'test-spatial-assets',revisionRoot:'revision:a',cacheStorage:storage as unknown as CacheStorage,cryptoApi:{subtle:globalThis.crypto.subtle},origin:'https://rncs.test'};
  const cache=createVSRBrowserAssetCache(options);await cache.write(descriptor,payload);const cold=createVSRBrowserAssetCache(options),rehydrated=await cold.read(descriptor);if(!rehydrated)throw new Error('BROWSER_CACHE_REHYDRATE_FAILED');assert.deepEqual([...rehydrated],[...payload]);assert.equal(cold.inspect().cacheHits,1);const revised=createVSRBrowserAssetCache({...options,revisionRoot:'revision:b'});await revised.ready();assert.equal(await revised.read(descriptor),undefined);assert.ok(revised.inspect().diagnostics.some(value=>value.includes('REVISION_CHANGED')));
});

test('browser cache provider rejects a tampered payload and applies deterministic LRU',async()=>{
  const storage=new MemoryCacheStorage(),first=bytes('first'),second=bytes('second'),one=record('asset:first','first'),two=record('asset:second','second'),options={cacheName:'test-spatial-assets-lru',revisionRoot:'revision:lru',maxBytes:second.byteLength,cacheStorage:storage as unknown as CacheStorage,cryptoApi:{subtle:globalThis.crypto.subtle},origin:'https://rncs.test'};
  const cache=createVSRBrowserAssetCache(options);assert.equal(cache.inspect().maxBytes,second.byteLength);await cache.write(one,first);await cache.write(two,second);assert.equal(await cache.read(one),undefined);const resident=await cache.read(two);if(!resident)throw new Error('BROWSER_CACHE_LRU_RESIDENT_MISSING');assert.deepEqual([...resident],[...second]);const payloadKey=(await storage.cache.keys()).find(request=>request.url.endsWith(`${two.sha256}.bin`))!;await storage.cache.put(payloadKey,response(bytes('bad')));const tampered=createVSRBrowserAssetCache(options);assert.equal(await tampered.read(two),undefined);assert.equal(tampered.inspect().cacheMisses,1);assert.equal(tampered.inspect().cacheEvictions,0);
});

let passed=0;
for(const entry of tests){try{await entry.fn();passed++;console.log(`PASS ${entry.name}`)}catch(error){console.error(`FAIL ${entry.name}`);throw error}}
console.log(`VSR spatial asset streaming tests: ${passed}/${tests.length} PASS`);
