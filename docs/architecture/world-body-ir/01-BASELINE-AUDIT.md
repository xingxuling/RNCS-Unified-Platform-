# Baseline Audit

Audit target: GitHub repository `xingxuling/RNCS-Unified-Platform-`, remote default branch `main-95`, baseline commit `da9d2da3f8b46f40972c06d3f0f24b1e2b5b20f4`.

The prompt's version hints were treated as claims to verify. Repository facts remained authoritative.

## Package and protocol facts

| Surface | Audited fact | Primary evidence |
| --- | --- | --- |
| RNCS Suite | `@taowind/rncs-aetherworld-unified` `0.19.8-alpha.1` | root `package.json`, lockfile, `rncs.modules.json`, `VERSION-MANIFEST-v0.19.8.json` |
| RSR | `@taowind/reality-simulation-runtime` `0.9.0-alpha.1` | package manifest and source constants |
| RSR body protocol | `rsr.spatial-embodiment.v0.6` | spatial-embodiment source, schemas, tests, release audit |
| RSR authority protocol | `rsr.authoritative-state.v0.7` | network-reconciliation source and tests |
| VSR | `@taowind/visual-state-runtime` `0.8.0-alpha.1` | package manifest and source constants |
| VSR spatial protocol | `vsr.spatial-reality-3d.v0.7`; frame format `vsr.spatial-frame-plan.v0.4` | VSR source, schemas, tests, release audit |
| VSR temporal protocol | `vsr.temporal-presentation.v0.6` | temporal-presentation source and tests |
| VSR glTF surfaces | unified discovery advertises `vsr.gltf-import.v0.1`; built importer exports receipt `vsr.gltf-import-receipt.v0.2` and asset `0.2.0-alpha.1` | `src/unified-index.mjs` versus built glTF importer exports |
| RCL workspace package | `@taowind/reality-computation-language` `0.94.0-alpha.1` | package manifest and registry |

No pre-existing World Body IR, BodyMap, or equivalent seven-root module was found. The new package therefore fills an integration gap instead of replacing an existing canonical module.

## Source and runtime audit

- RSR `SpatialEmbodimentWorld` owns fixed-step physical evolution, sealed snapshots, contacts, events, rollback reconstruction, collision filtering, characters, joints, and sensory output. Positions are integer millimetres; rotations are Euler milli-degrees at the production boundary.
- RSR network reconciliation creates and verifies sealed authority frames and deltas, applies deltas against exact base roots, stores history, and replays pending commands.
- The existing RSR-to-VSR bridge hand-maps bodies, fixture geometry, transforms, materials, contacts, and sensory events into VSR scene objects.
- VSR temporal presentation validates nested RSR body roots, binds packets to `sourceStateRoot`, and separates interpolation/extrapolation/correction output roots from authority roots.
- VSR spatial compilation emits passes, resources, draw packets, command roots, and frame roots. Its current production verifier checks dependency/resource/root integrity but does not model explicit read/write hazards, resource lifetimes, alias intervals, or required barriers. World Body Render Graph v0.1 adds those declaration-time checks without claiming to replace the backend.
- The VSR glTF discovery/receipt version mismatch is an audited pre-existing integration risk. World Body v0.1 records it but does not silently rewrite either contract.
- `rncs-core-contract` preserves proposal -> authorize -> commit -> projection. Presentation and generated artifacts own no commit authority.
- The current authority/presentation integration keeps RSR `stateRoot` distinct from VSR `frameRoot` and verifies nested body roots before projection.
- RCL treats GPU, network, database, filesystem, device, and other specialized capabilities as Providers. The new RCL kernel verifies a bounded semantic subset and does not absorb those providers.

## Audited test, schema, manifest, and documentation surfaces

- Root: `package.json`, `package-lock.json`, `rncs.modules.json`, version manifest, README, CHANGELOG, root integration tests, release/version scripts.
- RSR: package manifest, TypeScript sources, schemas, tests, benchmarks, runtime manifest/release audit, README and changelog surfaces.
- VSR: package manifest, TypeScript sources, schemas, tests, browser/runtime manifests, release audit, README and changelog surfaces.
- Bridges: RSR network reconciliation, RSR-to-VSR spatial bridge, VSR temporal presentation, VSR spatial compiler/verifier, RNCS core contract, gateway/network integrations, and engine-v0.6 authority-presentation test.

The historical `engine/v0.6` documentation contains earlier package versions and test counts. It is retained as historical evidence and is not used as current baseline authority.

## Duplication and accidental complexity observed

- Repeated physical/visual entity identity mapping.
- Repeated unit and rotation conversion.
- Handwritten visual offsets and temporal-policy binding.
- Repeated authority-root propagation across frame, packet, scene, and event shapes.
- Hand-authored pass/resource lists without one hazard/lifetime/barrier contract.
- Game-specific event fan-out between physics, animation, audio, haptics, and networking.
- Separate rollback/prediction glue around otherwise deterministic state roots.

## Boundary conclusion

The safe integration seam is a candidate-only declaration and verification layer above existing solvers/providers and below game-specific content. RNCS/RFE remains the only formal-world commit path. This audit authorizes candidate implementation, not automatic production promotion.
