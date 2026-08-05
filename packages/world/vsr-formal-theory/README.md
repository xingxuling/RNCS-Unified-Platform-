# @taowind/vsr-formal-theory

Executable five-level theory for World Body presentation and VSR.

- L1: projection objects, source roots, visual/asset identity.
- L2: authority non-interference, BodyMap composition, observer and asset invariants.
- L3: deterministic projection, interpolation, bounded extrapolation, correction.
- L4: render graph safety/barriers, visual-only source invariance, bounded diffuse PBR.
- L5: an explicit projection refinement relation and external GPU/pixel boundary.

The fixed-point diffuse function is a narrow oracle, not a replacement for the production Cook-Torrance/glTF/Shader pipeline. Real browser GPU resources, shadows, pixels, and target performance remain unverified until the external differential gate is executed.

```bash
npm test --workspace @taowind/vsr-formal-theory
```
