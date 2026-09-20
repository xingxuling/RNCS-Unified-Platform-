# Animation Fabric Architecture v0.1

## North Star

Unify 2D and 3D animation **execution semantics** without duplicating Reality Studio's timeline ownership or VSR/URRF rendering ownership.

## Invariants

1. Studio Sequence stays the only authored timeline owner.
2. Animation Fabric consumes evaluated presentation frames only.
3. Authority events are carried by source roots but are never replayed or committed by this package.
4. 2D output is a candidate deformation/projection state for URRF-2D consumers.
5. 3D output is a VSR animation option projection, not a second 3D animation sampler.
6. All outputs are deterministic, rooted and `canonical_state_mutated=false`.

## v0.1 organs

- Curve Runtime: deterministic STEP/LINEAR/Hermite sampling.
- Rig2D Runtime: hierarchy, FK, bind pose and LBS deformation.
- Deformation2D: path morph, blend shape and bilinear cage primitive.
- Studio Sequence Adapter: explicit domain routing and authority guard.
- URRF-2D Adapter: evaluates 2D presentation channels.
- VSR 3D Adapter: lowers 3D channels into existing VSR animation options.
- Unified Runtime: evaluates both representations from one source sequence frame.

## Next gates

- v0.2: Sprite/Atlas + 2D masks + nested compositions + curve tangent editing contract.
- v0.3: 2D IK + constraint graph + deform cage lattice + weight-map format.
- v0.4: target-side sequence playback bridge for Build, keeping Studio as timeline owner.
- v0.5: HER binding, retarget profile, Blend Space and motion-warping candidate.
