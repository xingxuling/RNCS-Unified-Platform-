# Changelog

## Unreleased
- Added the live Character Genome workbench, generated mesh and cross-media previews, parameter editing, recovery actions and Anime Forge binding.
- Added responsive evidence panels for desktop, compact desktop and mobile.
- Added the deterministic `reality-studio.sequence.v1.7` multi-track timeline for camera, animation, audio and authority behavior clips.
- Added sequence seek, frame stepping, bounded playback, snapshot/restore, undo/redo persistence, server commands and `sequence.json` build export.
- Added the browser sequence workbench with playhead, track lanes, authority/presentation separation and offline fallback rendering.
- Added HTTP-level regression coverage for sequence editing, frame evaluation, snapshot restore and export integration; the full Studio suite is now 237/237.
- Added VSR-backed runtime asset streaming from the v1.4 content-addressed cache, with dependency-first loading, SHA-256 verification, CLI/API entry points and explicit failure receipts.
- Added a governed behavior live-update transaction for unified sessions.
- Added deterministic candidate replay, explicit resolver authorization and commit confirmation.
- Preserved runtime tick/entity state during committed hot reloads and exported live-update manifest evidence.
- Added server `live-update` commands and regression coverage for inert candidates and stale-base rejection.

## 1.5.0-alpha.1
- Added Asset Forge sessions from intent to three RAGF production candidates.
- Added real mesh, material, prefab and embodiment preview payloads.
- Added targeted regeneration, candidate selection and acceptance receipts.
- Added strict RAGF v0.3/v0.4 continuity import compatibility.
- Accepted 3D assets now instantiate scene nodes and RSR body/character bindings.
- Added native server API, CLI demo and browser/offline workbench.
- Updated runtime facts to RAGF v0.4, RSR v0.9 and VSR v0.8.


## 1.3.0-alpha.1
- Added local file and directory asset import with stable source identity and SHA-256 content addressing.
- Added embedded browser asset import for offline authoring.
- Added manual reimport, generation history, stale and missing source detection.
- Added JSON path dependency discovery, dependency graph, scene usage graph and orphan detection.
- Added asset continuity audit and ledger bound into release exports.
- Added Studio UI, CLI and authoritative API entry points.
- Added 18 asset continuity tests; full Studio suite is now 156/156.

## 1.2.0-alpha.1
- Added stable UI Tree, anchor/safe-area layout, data binding and focus navigation.
- Added keyboard, mouse, gamepad and touch action mapping with edge states and runtime rebinding.
- Added UI canvas, control tree, device preview, action monitor and authoritative server commands.
- Added legacy project upgrade, UI/Input build manifest, Schema, browser/API acceptance and benchmarks.
- Added 29 UI/input tests; full Studio suite is now 138/138.

## 1.1.0-alpha.1
- Added four-layer TileMap authoring with stable roots and tileset identity.
- Added paint, erase, rectangle and flood-fill tools with undo/redo.
- Added deterministic visual batching, collision rectangle baking and navigation cost grids.
- Added dynamic obstacles, deterministic A*, path smoothing and cached navigation agents.
- Added navigation receipts, Studio overlays, CLI path export and build manifests.
- Added 36 TileMap/navigation tests; full Studio suite is now 109/109.

## 1.0.0-alpha.1
- Integrated VSR v0.3 realtime WebGPU frame compilation into the unified manufacturing session.
- Added Studio-to-VSR DisplayState projection with observer and device budgets.
- Added browser WebGPU executor with atlas upload, draw packets, tiled-light compute, GPU particles and postprocess.
- Added explicit Canvas reference fallback and device-loss handling.
- Added GPU viewport controls, frame roots, draw/light/particle counters and compile receipts.
- Added Reality Studio and Reality Build GPU manifests.
- Added 20 GPU Studio mechanism tests; full Studio suite now 73/73.
- Vendored and independently verified VSR v0.3 with 120/120 tests.

## 0.9.0-alpha.1
- Added unified scene, asset and behavior project model.
- Added RAGF continuity bundle import and stable asset registry.
- Added scene canvas, asset shelf, inspector and drag/drop authoring.
- Added bidirectional scene/behavior synchronization.
- Added unified player/debug projections and build export.

## 0.8.0-alpha.1
- Added behavior-native authoring and deterministic debugger.

## 1.4.0-alpha.1

- 新增三维具身工作区与可视化工作台。
- 接入 RSR v0.5 身体、角色、关节、空间声音和触觉事件。
- 接入 VSR v0.4 三维Frame Plan与确定性参考投影。
- 新增空间编辑服务命令、CLI、Schema、导出清单与发布审计。
- 保持v1.3资产连续性及此前全部工作流兼容。
