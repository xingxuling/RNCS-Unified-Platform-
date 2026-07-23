# Studio-Authored Network World Package v0.3 Verification Report

## 1. Completion Summary

This release closes the G2 authoring-to-authority workflow that remained open
after Sovereign World Package v0.2. Reality Studio now compiles its active
scene, GLB asset bindings, RSR bodies, characters, physics, player slots,
authority policy, and deterministic transport profile into one
content-addressed network-world compilation. Reality Network independently
verifies that compilation before creating the sole authoritative RSR world.

- Status: `PASS`
- Package root: `22d7c82c33e3b892af9309b669bc9ce32cc6fd60dc38876cc9c0bbd13690aac7`
- Studio project root: `0ad8f26a8a44d4ca68d6f4081fd5a452d0285a5c8efec39e68727d03c10c006c`
- Network compilation root: `cf382684e0f9234204f783b94b0cfc62b56a3f4fd7db310e8665be56c9590515`
- World-config root: `1266f77a8e98b4d08694def615c8ffef6700273de8dd55cf4499f507a7f06765`
- Regeneration: `npm run demo:studio-network:v03`
- Integration test: `npm run test:studio-network:v03`

## 2. Implemented Product Path

1. Studio imports a valid embedded GLB and instantiates two scene nodes.
2. Public Studio APIs create and edit the matching RSR bodies and characters.
3. Studio binds each node to a body, character, asset root, and declared player
   slot.
4. The compiler seals source project, workspace, scene, world, authoring, asset,
   and world-config roots into `network-world-compilation.json`.
5. Network independently verifies every root and refuses tampered
   compilations.
6. Two clients join only their declared slots, execute under deterministic
   latency, jitter, packet loss, duplication, and reordering, then converge on
   one authoritative State Root.
7. A disconnected input is retained and committed exactly once after reconnect.
8. The final authoritative snapshot renders the authored GLB meshes through
   VSR, producing a verified non-empty PNG and pixel root.
9. Recompiling the same project and rebuilding it in a fresh Studio instance
   produce the same project and compilation roots; repeating the network
   session produces the same evidence and final State Root.
10. Editing one Studio body recompiles the project and changes the project,
    world-config, compilation, and initial authoritative State Roots.

## 3. Integration Matrix

| Surface | Mode | Verified behavior | Evidence |
| --- | --- | --- | --- |
| Studio scene and spatial authoring | native | Scene nodes bind real GLB assets to RSR bodies and characters | Project, scene, workspace, asset-binding roots |
| Studio network compiler | native | Active authored world becomes a sealed network compilation | Compilation and world-config roots |
| Network ingestion | native | Runtime independently verifies compilation before world creation | Network verification and health source roots |
| Player authority | native | Only declared body/character/subject slots can join | Slot rejection receipts and server guards |
| Two-client recovery | native | Disconnected input survives and commits exactly once | Network replay evidence root |
| Deterministic replay | native | Same compilation, inputs, and fault seed reproduce final authority | Matching evidence and State Roots |
| GLB viewport | projection | Two authored mesh draws render from authoritative body transforms | Viewport, frame, and pixel roots |
| Editor counterfactual | native | Body edit changes compiled and initial runtime authority | Counterfactual root |
| Complete editor parity | none | Not claimed | Explicit limitation |
| Public-WAN multiplayer scale | none | Not claimed | Explicit limitation |

## 4. Test Results

| Suite | Passed | Skipped | Failed |
| --- | ---: | ---: | ---: |
| RCL full suite | 555 | 1 environment-dependent | 0 |
| RCL Foundation conformance | 20 checks | 0 | 0 |
| Reality Studio | 216 | 0 | 0 |
| Reality Network | 25 | 0 | 0 |
| Reality Build | 109 | 8 environment-dependent | 0 |
| Studio Network v0.3 integration | 1 | 0 | 0 |
| Sovereign World v0.2 integration | 2 | 0 | 0 |
| Beyond-engine v0.1 compatibility | 1 | 0 | 0 |
| zhinao serial suite | 152 across 23 files | 0 | 0 |
| Non-overlapping total | 1,061 | 9 | 0 |

Foundation conformance is reported separately and is already covered by the RCL
full suite, so its 20 checks are not added to the total. The RCL skip is the
external DLL import-link test because Zig is unavailable; the signed prebuilt
Windows manifest and artifact hashes passed. The eight Build skips are the
Go/Windows-native paths not advertised by this environment.

## 5. Evidence Snapshot

| Metric | Value |
| --- | ---: |
| Authored bodies | 6 |
| Authored characters | 3 |
| Compiled player slots | 2 |
| Compiled GLB bindings | 2 |
| Authoritative world instances | 1 |
| Final network tick | 26 |
| Initial State Root | `fnv1a64:95671a1389182e12` |
| Final State Root | `fnv1a64:915fe9419d782cf1` |
| Deterministic network replay root | `b303df0e4cdfef1f0043f23ef48856f3d74db317e175539a20d6385e3be6eac5` |
| Viewport root | `d29ff108755863f522a3c3aedfa46cbc4592674a79714b402eaa7e2f9cb65d75` |
| Counterfactual root | `63c0c6d4a7cc65e08d02f78406169907c8d90606981a634fa618b526ff61d458` |

One local evidence run took 1,377.313 ms across Studio authoring/compilation,
two authoritative sessions, and the GLB viewport. Wall-clock metrics are
excluded from deterministic roots.

## 6. Why This Matters Against Conventional Engines

The differentiator proven here is not a larger checkbox count. A scene edit is
cryptographically connected to asset identity, physics, player authority,
network startup, replay, rendering evidence, and a changed runtime State Root.
The network runtime can verify that chain without trusting Studio. Godot and
Unity can implement comparable workflows through custom systems; this package
proves that TaoWind now owns the workflow as a first-class native contract.

That does not yet prove the three-project stack is globally beyond Godot or
Unity. It proves one G2 capability where authored reality, governance, and
runtime evidence are unified rather than assembled as unrelated plugins.

## 7. Remaining G2/G3 Work

- Add an interactive live network inspector with body, character, slot,
  prediction, correction, and evidence-root views.
- Benchmark 10, 50, and 100 clients using the same compiled source and replay
  contract.
- Add public-WAN transport and distributed server recovery evidence.
- Complete production editor workflows for hierarchy, prefab variants,
  animation, materials, terrain, lighting, and collaborative authoring.
- Complete native Windows rendering, Android APK/store signing, and broader
  platform export.

## 8. Branch And PR

- Branch: `codex/foundation-runtime-v01`
- RNCS PR: <https://github.com/xingxuling/RNCS-Unified-Platform-/pull/14>
- RCL PR: <https://github.com/xingxuling/RCL/pull/3>
- zhinao PR: <https://github.com/xingxuling/zhinao/pull/2>
