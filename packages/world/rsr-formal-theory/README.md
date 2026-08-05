# @taowind/rsr-formal-theory

Executable five-level theory for the RSR side of World Body IR.

- L1: objects, canonical roots, identity.
- L2: state invariants, static bodies, mass, contact/filter symmetry.
- L3: deterministic fixed-step transitions, integer closure, snapshots, events.
- L4: replay, nested authority roots, presentation exclusion, displacement bounds.
- L5: an explicit observational refinement relation and external-backend boundary.

The included reference step is a small mathematical oracle. It is not a replacement for RSR collision detection, constraint solving, warm start, sleep/wake, character control, or a commercial physics backend. Production parity is credited only by the separate differential harness.

```bash
npm test --workspace @taowind/rsr-formal-theory
```
