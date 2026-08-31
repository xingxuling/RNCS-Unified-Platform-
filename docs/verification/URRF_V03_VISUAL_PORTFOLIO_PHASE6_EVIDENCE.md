# URRF v0.3 Representation Portfolio / Visual Diversity — Phase 6 Evidence

Status: `CANDIDATE / LOCAL_VERIFIED / VISUAL_OBSERVED_NOT_GRADED / NOT_PRODUCTION`

## What is now defined

- RNCS `RepresentationSlot` is a candidate-only, rooted link to an existing
  representation. It carries a quality profile, render profile, resource cost,
  fallback slot, minimum-reality flag, and explicit diversity axes.
- RNCS `RepresentationPortfolio` defines quantity per RealityObject with
  `min_slots`/`max_slots`, required representation kinds, a quality ladder,
  required quality profiles, and per-axis diversity targets. It reports
  `READY` or `INCOMPLETE`; it never invents a missing representation.
- URRF `RealityRepresentationPortfolioRuntime` selects a deterministic slot by
  requested quality, diversity match, and resource budget, then falls back to a
  minimum-reality slot when needed. It can call the existing URRF materializer
  without changing canonical state.
- Visual evidence is stored separately from subjective grading. Each rendered
  sample carries a PNG byte count, pixel root, frame root, geometry statistics,
  and `LOCAL_RENDERED / OBSERVED_NOT_GRADED` status.

## Reproducible checks

```text
node --check packages/kernel/rncs-core-contract/src/representation-portfolio.mjs
node --check packages/world/reality-representation-fabric/src/portfolio-runtime.mjs
npm test --workspace @taowind/rncs-core-contract
npm test --workspace @taowind/reality-representation-fabric
npm run test:urrf-runtime
npm run test:large-world
npm run test:urrf-visual-portfolio
git diff --check
```

Observed on 2026-08-31:

- RNCS Core Contract: `32/32 PASS` (three portfolio contract tests).
- URRF package: `18/18 PASS` (three portfolio runtime tests).
- Existing URRF representation integration: `1/1 PASS`.
- Large-world package: `17/17 PASS`; root integration: `7/7 PASS`.
- Portfolio visual integration: `1/1 PASS`; five deterministic PNGs written.
- Portfolio composition: `READY`; `5` slots in a `4-5` range, three
  representation kinds, five quality/detail levels, and diversity targets met
  for modality, detail, material, lighting, style, and view.
- `git diff --check`: PASS.

## Local visual sample set

The checked-in sample set is under
[`URRF_V03_VISUAL_PORTFOLIO`](./URRF_V03_VISUAL_PORTFOLIO/README.md). Its
report root is recorded in `visual-portfolio-report.json`.

| Slot | Representation | Resolution | Visual variation |
|---|---|---:|---|
| PROXY | world-proxy | 320×180 | abstract / daylight / wide |
| MOBILE | mesh | 480×270 | clean / daylight / hero |
| STANDARD | mesh | 640×360 | realistic / golden-hour / hero |
| CINEMATIC | gaussian-splats candidate | 960×540 | filmic / nocturne / dynamic hero |
| REFERENCE | mesh | 800×450 | stylized / studio / orbit |

## RCL / K400 and authority boundary

This phase adds an RCL gap candidate for generic **representation portfolio
composition**: the existing single-reference contract could select one
representation but could not express bounded quantity, quality ladders, or
multi-axis diversity targets. The new semantics remain owned by RNCS/URRF;
VSR is the execution/lowering runtime.

K400 mapping remains `UNMAPPED_PENDING_CANONICAL_MATRIX`; this evidence does not
declare any K400 gate PASS. The local render proves executable CPU-reference
projection and rooted repeatability only. It does not prove production GPU or
WebGPU quality, browser presentation, art-direction acceptance, distributed
residency, temporal animation quality, or canonical-world promotion.

Every portfolio, slot, selection and visual evidence record keeps
`candidate_only=true`, `authoritative=false`, and
`canonical_write_authorized=false`. Human/RNCS authority is still required for
any durable world-state commit.
