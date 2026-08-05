# @taowind/world-body-ir

World Body IR v0.1 is the deterministic, candidate-only contract between RNCS authority, RSR physical bodies, VSR visual bodies, temporal presentation, assets, observers, events, and backend render plans.

It turns repeated world glue into data that can be validated and generated. It does **not** own an RFE/RNCS commit, replace a physics solver, implement a Shader/GPU driver, or prove an unexecuted backend.

## Seven root objects

1. `authorityState`
2. `physicalBodyState`
3. `visualBodyState`
4. `temporalPresentationState`
5. `assetState`
6. `observerState`
7. `worldEventState`

`bodyMaps` and `renderGraphs` are cross-cutting roots. A sealed document carries a root for every component and one `worldBodyRoot` over the root set.

## Deterministic core

- Only safe integers are accepted as JSON numbers. Fractions use scaled integers or canonical decimal strings.
- Quaternion rotation is normalized at scale `1_000_000`; `q` and `-q` have one canonical sign.
- UTF-8 sorted canonical JSON is SHA-256 sealed.
- IDs, references, node hierarchies, event identity, authority binding, and observer capabilities fail closed.
- Render graphs reject cycles, reads before ordered initialization, unordered hazards, illegal transient escape, overlapping alias lifetimes, and missing/unjustified barriers.
- Render-graph resources, passes, dependencies, and accesses are bounded before transitive hazard analysis to keep untrusted declarations from creating unbounded validation work.

## BodyMap law

```text
visualWorld(t) = present(authorityPhysical(sample(t)), temporalPolicy)
                 compose visualOnlyOffset
```

Changing a `visualOnlyOffset` may change visual/body-map/frame roots, but it must not change authority or physical roots.

## Run

```bash
npm test --workspace @taowind/world-body-ir
```

The JSON Schema is a portable structural contract. The runtime validator is the normative v0.1 invariant checker.
