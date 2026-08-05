# World Body code-reduction experiment

## Scope

The measured family is the authoritative capsule character plus static floor in `minimal-world.declaration.json`. The generated RSR configuration, authority-frame/rollback/network bindings, VSR body bindings, event routes, Render Graph, RCL facet, proof template, and generated test are executed against the repository's real RSR v0.9 and VSR v0.8 path by the production differential and generated runtime test.

There was no pre-existing cross-layer World Body implementation to delete. Therefore this report does **not** invent a historic deleted-line number. It compares the physical, non-minified declaration with the exact physical specialization surface that would otherwise need to be maintained by hand.

## Deterministic measurement

Reproduce with:

```bash
npm test --workspace @taowind/world-body-codegen
npm run evidence:world-body
```

The sealed `code-reduction-evidence.json` records:

| Metric | Measured result |
| --- | ---: |
| Authored declaration | 177 non-blank lines / 5,799 bytes |
| Equivalent generated specialization | 848 non-blank lines / 26,052 bytes |
| Generator-owned artifacts | 9 |
| Net manually maintained line delta | 671 lines |
| Authored-surface reduction | 79.13% |
| Stable semantic identifiers | 23 |
| Identifier occurrences in declaration | 30 |
| Identifier occurrences in generated surface | 89 |
| Repeated occurrences moved behind generator | 59 |

This measures semantic-maintenance transfer, not textual minification: the declaration and generated artifacts are committed in readable pretty-printed form. The generated surface still exists at build/runtime boundaries, but its repeated roots, IDs, offsets, policy bindings, and routes are derived from one declaration instead of being independently authored.

## Correctness and diagnostic performance

The generated runtime test executes a real RSR snapshot, authoritative frame, VSR temporal adapter, rollback seal/restore, and canonical network envelope. The production differential remains 12/12 PASS.

On Windows x64, Node.js v24.15.0, one diagnostic run reported:

| Measurement | Median |
| --- | ---: |
| Generate and seal one nine-artifact bundle | 1,384.277 microseconds |
| Apply generated two-body visual binding | 4.193 microseconds |
| Apply executable direct-handwritten control | 3.108 microseconds |
| Generated/direct ratio | 1.349x |

The generated path was output-equivalent to the direct control in the benchmark. These timings are host-sensitive diagnostics, not a proof or release gate; the observed 34.9% microbenchmark overhead is retained rather than hidden. No claim is made that code generation speeds up the underlying solver, renderer, GPU, provider, or transport.

## Honest boundary

- The experiment proves reduction for one bounded object family and nine explicit specialization surfaces.
- It does not prove the same percentage for a full game or all entity archetypes.
- It does not count necessary shared solver, shader, transport, asset-decoder, or backend code as removable duplication.
- Scaling and target-hardware performance remain F5/R5 work.
