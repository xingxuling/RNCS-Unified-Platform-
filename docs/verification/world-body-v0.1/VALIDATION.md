# Candidate Validation Run

Run date: 2026-08-02 (Asia/Shanghai)
Host: Windows, Node.js `24.15.0`
Audited baseline: `main-95` at `da9d2da3f8b46f40972c06d3f0f24b1e2b5b20f4`

## Final integrated gate

`npm run verify:world-body` completed successfully in approximately 53 seconds. It executed the real package builds and these suites:

| Gate | Result |
| --- | --- |
| RSR `0.9.0-alpha.1` complete package suite | 191/191 PASS |
| VSR `0.8.0-alpha.1` complete package suite | 215/215 PASS |
| Reality Network Runtime complete suite | 25/25 PASS |
| Six new World Body packages | 81/81 PASS |
| Existing authority/presentation integration | 3/3 PASS |
| Focused World Body RCL kernel | 10/10 checks PASS; reference/native state roots equal |
| Executable theorem receipts | 43 PASS, 0 FAIL, 3 explicitly UNVERIFIED external claims |
| Selected production differential | 12/12 PASS |
| Deterministic code generation | 7 artifacts plus sealed manifest reproduced |

The network suite includes deterministic fault injection for loss, reordering, reconnect, rollback, duplicate suppression, authority uniqueness, and Studio-authored boot. It is not evidence of a real distributed transport deployment.

## Additional regression

`npm run test:rcl` completed with 611 PASS, 0 FAIL, and 1 SKIP across 612 tests. The host had no Zig compiler. The RCL build gate therefore verified the checked Windows native distribution and its source/artifact manifest, then executed those native binaries; this is not a claim that the native executables were rebuilt from source on this host.

`npm run verify:version-contract` checked 42 registered package modules with zero errors while preserving the suite, RSR, and VSR baseline versions.

`npm run modules` listed all six new registry entries, and `npm run health` finished `healthy` across all 18 gateway-discovered runtimes after their tracked source directories were included in the sparse checkout.

`npm audit --omit=dev --audit-level=high` reported three pre-existing production dependency findings outside the six new packages: one high-severity `fast-uri 3.1.3` advisory and two moderate findings on the `@modelcontextprotocol/sdk 1.29.0 -> @hono/node-server 1.x` MCP chain. The audit dry-run offered no non-forced lock-only change; the Hono fix requires moving the MCP SDK beyond its exact declared version. This candidate does not use `npm audit fix --force` or mix an untested MCP upgrade into the World Body change. A focused MCP dependency upgrade remains a release follow-up.

## Test-environment notes

The initial sparse checkout omitted indirect files required by the existing authority/presentation, network, and gateway-health checks. Those first attempts failed or degraded with `ERR_MODULE_NOT_FOUND`; the missing tracked dependency paths were added and the same commands then passed. This was a checkout-coverage issue, not counted as product success and not hidden as a source-code fix.

Existing RSR/VSR tests rewrite tracked fixture manifests with machine-local absolute paths and line-ending-sensitive source hashes. Those test-generated working-tree changes were discarded after the successful run and are not part of this candidate. This pre-existing portability risk is outside World Body v0.1's source changes.

## Honest boundary

No real browser/target GPU capture, pixel oracle, external physics engine, real distributed transport, production asset provider, or target-hardware performance test was run. WB-T10 remains `UNVERIFIED`; the candidate verdict is **F4.5 Partial Production Parity**.
