# RNCS + Aetherworld Engine v0.6

## Versions

- Mother project: `0.6.0-alpha.1`
- RSR: `0.7.0-alpha.1`
- VSR: `0.6.0-alpha.1`
- Network Runtime: `0.2.0-alpha.1`
- Gateway: `0.3.1-unified.1`

## Upgrade

The network runtime now reuses the RSR authoritative-state protocol instead of maintaining a second physical-state diff model. RSR provides sealed frames, verifiable deltas, bounded history and prediction replay. VSR converts network authority packets into a separate temporal-presentation stream with Hermite interpolation, shortest-angle rotation, bounded extrapolation and teleport snap.

Authority roots and presentation roots are deliberately separate: rendering may smooth state but cannot rewrite world truth.

## Verification

- RSR 170/170
- VSR 167/167
- Network 22/22
- Gateway 10/10
- Reality Studio 188/188
- Reality Build 113/113
- HNAC/HNAF 54/54
- CSL Studio 162/162
- AetherFusion 344/344
- Unified integration 12/12
- E2E 4/4
- Direct test total 1246/1246
- Aetherworld health, AutoRAG, Seed Forge typecheck and release verification: PASS

Full source archive SHA-256: `bea02112ae9835e853dc697684b1bb6fefd075f2ad1884900f4f3a9760069494`.

Observed Skill-assisted delivery speedup: `1.435x` against the adjacent v0.4-to-v0.5 package interval. This is an observational comparison, not a randomized A/B test.
