# Aetherworld RNCS Native Runtime Bridge v0.2

Aetherworld 的原生 RNCS 交互、认知编译与世界制造运行时。它将自然语言、IAL 或 CSL 编译为可执行 Compilation Plan，强制候选分支、AAF 动作级裁决、Behavior 注册、RFE Generation 提交，并复用 RSR v0.7、Network v0.2 与 VSR v0.6。

```bash
npm run bootstrap:workspaces
npm test --workspace @taowind/aether-rncs-bridge
npm run demo:native
```

## Kernel Spatial Binding

`materializeKernelStateToRSR(...)` accepts an `EntityKernel` or sealed `rncs.entity-state-batch.v0.1` and returns the deterministic RSR body/fixture materialization. `projectKernelStateToReality(...)` continues from that authority snapshot into the VSR scene, frame plan and pixel evidence without creating a second writable visual authority.

```bash
npm run test:kernel-binding --workspace @taowind/aether-rncs-bridge
```

## Reality Cell Partition

`projectKernelStateToRealityCell(...)` binds one deterministic state across the Kernel batch, RSR body/contact causal islands, Network Observer Relevance View, LWC sector/local coordinates and the VSR streaming/frame plan. Relevance or causal focus can force a cell to remain active, while observer radius and previous active cells drive deterministic enter/exit transitions. When `assetCatalog` and `assetStreamingRequest` are supplied, the same active cells resolve dependency-first `resident`, `queued`, `deferred` and `evicted` asset sets and seal that resolution into the state/frame roots. The result carries catalog, causality, relevance, asset, VSR and state roots; it still does not pretend that a synchronous resolution is an asynchronous disk payload loader.

```bash
npm run demo:reality-cell --workspace @taowind/aether-rncs-bridge
```

The demo writes `outputs/reality-cell-v01/reality-cell-state.json`, `scene.vsr3d.json`, `frame-plan.json`, `reference.png` and `evidence.json`. The generated scene can be exercised by the real Reality Studio Chromium path:

```bash
python apps/reality-studio/tests/browser_reality_cell_webgpu_test.py
```

That smoke passes the sealed VSR streaming and asset options from the Reality Cell state into the browser executor and requires the submitted WebGPU receipt to match the Node frame root.

## Reality Cell Asset Runtime

`createRealityCellAssetRuntime(...)` adapts the VSR asynchronous asset streamer to a sealed Cell state. `acquireRealityCellAssets(...)` derives the authoritative active-cell request, loads dependency-first bytes with bounded concurrency and SHA-256 verification, and returns a sealed receipt. `prefetchRealityCellAssets(...)` uses the same dependency closure with `lease=false`, so a next Cell can be warmed without taking ownership from the current foreground scene; foreground work has scheduling priority and `maxPrefetchAssets`/`maxPrefetchBytes` cap the warmup. `releaseRealityCellAssets(...)` decrements leases; `evictRealityCellAssets(...)` performs only explicit, unleased eviction. Passing `cacheDirectory` enables a content-addressed `manifest.json` plus verified disk rehydrate, while `cacheByteBudget` applies deterministic LRU trimming by resident bytes. The bridge keeps in-memory leases, explicit eviction and persistent cache ownership separate so a transition cannot silently discard an asset that is still in use.

```bash
npm run demo:reality-cell-assets --workspace @taowind/aether-rncs-bridge
```

The demo writes file-backed payloads and produces `near-cell-state.json`, `far-cell-state.json`, `near-receipt.json`, `far-receipt.json` and `evidence.json` under `outputs/reality-cell-assets-v01`. This proves real asynchronous payload loading and lease/eviction evidence; mesh/texture decoding, GPU resource creation and render-scene binding remain a separate renderer boundary.

The next binding demo closes that renderer boundary for strict GLB and external-buffer glTF paths:

```bash
npm run demo:reality-cell-asset-scene --workspace @taowind/aether-rncs-bridge
```

It loads a SHA-256 verified GLB through the Cell runtime, imports its mesh and `vsrRGBA` texture, assigns the imported nodes to the active Cell, and writes a scene/frame plan requiring a real material texture binding. The bridge also accepts a SHA-256 verified `.gltf` root whose external buffer and image dependencies are separate catalog assets; those dependency roots enter the binding receipt. The matching Chromium smoke is `apps/reality-studio/tests/browser_reality_cell_asset_scene_webgpu_test.py`; it requires actual texture and buffer uploads plus a submitted, non-lost WebGPU receipt.

For Cell-to-Cell replacement, `createRealityCellAssetSceneRuntime(...)` keeps one active scene binding, acquires the next Cell before releasing the previous lease set, and evicts previous Cell assets from the new streaming receipt. `projectKernelStateToRealityCell(...)` accepts this runtime through `assetSceneRuntime`, so the scene, Cell roots, and lifecycle receipt move together:

```bash
npm run demo:reality-cell-asset-transition --workspace @taowind/aether-rncs-bridge
python apps/reality-studio/tests/browser_reality_cell_asset_transition_webgpu_test.py
```

The transition demo writes near/far/near-again Cell scenes, frame plans and a persistent `cache/manifest.json` under `outputs/reality-cell-asset-transition-v01`. The near plan names `cell:far` as a prefetch target; with the five-asset foreground budget, all three far dependencies become resident before promotion, while the far binding performs no asset operations. It records the source-read count, cache hits/misses, manifest root and LRU evictions; the cold output `outputs/reality-cell-asset-transition-prefetch-cold-v01` records five source reads and two cache hits, while the integration test proves prefetch assets remain unleased until promotion. The Chromium test renders near GLB -> far external-buffer glTF -> near GLB in one WebGPU executor and requires all three submissions to remain non-lost, with matching Node/browser frame roots and real upload/eviction receipts. This remains a bounded local cache and format path; multi-process/remote cache coherence, deployment-wide invalidation, BasisU/KTX2 supercompression, Draco/Meshopt, format-aware prefetch scheduling, HLOD/PCG and large-world performance remain separate work.
