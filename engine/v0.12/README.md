# RNCS + Aetherworld Engine v0.12

Character Animation Production Runtime reference release.

## Versions

- Mother project: `0.12.0-alpha.1`
- VSR: `0.9.0-alpha.1`
- Reality Studio: `1.7.0-alpha.1`
- Reality Behavior: `0.9.0-alpha.1`
- RAGF: `0.4.0-alpha.1`
- RSR: `0.9.0-alpha.1`
- Network: `0.2.0-alpha.1`

## Closed loop

```text
RAGF character GLB
→ glTF JOINTS_0 / WEIGHTS_0 / skin / inverse bind matrices
→ quaternion animation sampling
→ graph blending, additive layers and bone masks
→ IK, look-at and viseme/morph controls
→ CPU skinning
→ Reality Studio animation session and Sequencer track
→ VSR frame and pixel projection
```

The current source directly passed `1002/1002` tests. HNAC/HNAF is not included in that number because the current container lacks Python `wasmtime`; its binary content and canonical path roots match v0.11.
