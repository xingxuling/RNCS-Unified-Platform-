# RNCS Animation Fabric v0.1

RNCS Animation Fabric is a unified presentation-animation runtime seam for 2D and 3D. It **does not create a second timeline owner**. Reality Studio `reality-studio.sequence.v1.7` remains the authored timeline/evaluation authority; Animation Fabric consumes only evaluated `reality-studio.sequence-frame.v1.6` presentation state.

## v0.1 capabilities

- Deterministic scalar/vector STEP, LINEAR and Hermite/CUBICSPLINE curve sampling.
- 2D hierarchical bones, affine FK and linear-blend mesh skinning.
- 2D path morph, blend-shape and bounded bilinear-cage deformation primitives.
- Explicit 2D animation lowering intended for URRF-2D candidate presentation.
- Explicit 3D lowering to existing VSR `animationLayers`, animation graph, constraints and deformation options.
- Mixed 2D + 3D evaluation from one Studio sequence frame while preserving the source authority root.
- Fail-closed domain routing: no silent inference from an arbitrary animation payload.
- Candidate-only output; no Canonical World State mutation.

## Ownership boundary

```text
Reality Studio Sequencer (authored timeline owner)
              ↓ evaluateSequence()
reality-studio.sequence-frame.v1.6
              ↓
       RNCS Animation Fabric
        ┌───────────┴───────────┐
        ↓                       ↓
     2D channel              3D channel
 Bone/Mesh/Path/FFD       VSR animation options
        ↓                       ↓
 URRF-2D presentation       VSR Spatial 3D
```

Camera, audio, dialogue, light and effect tracks remain delegated to their existing owners in v0.1. Animation Fabric deliberately does not reinterpret them.

## Not claimed yet

- Full Toon Boom/Spine/Live2D authoring UI.
- Onion skin, freehand brush authoring, weight-paint UI or production vector editor.
- Motion Matching / Blend Space / Motion Warping.
- Physical cloth/hair/muscle simulation.
- Target-side full Studio Sequence playback.
- FBX/USD interchange or DCC parity.

Run `npm test` inside this package.
