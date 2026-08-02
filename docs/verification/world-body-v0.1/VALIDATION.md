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
| Six new World Body packages | 83/83 PASS |
| Existing authority/presentation integration | 3/3 PASS |
| Focused World Body RCL kernel | 15/15 aggregate checks PASS; eight requested drafts compile to RBC with decoded disassembly and equal reference/native state roots |
| Executable theorem receipts | 43 PASS, 0 FAIL, 3 explicitly UNVERIFIED external claims |
| Selected production differential | 12/12 PASS |
| Deterministic code generation | 9 artifacts plus sealed manifest reproduced; generated runtime test PASS |
| Code-reduction measurement | 177 declaration lines generate 848 specialization lines; 79.13% authored-surface reduction and 59 repeated identifier occurrences moved behind generation |

The network suite includes deterministic fault injection for loss, reordering, reconnect, rollback, duplicate suppression, authority uniqueness, and Studio-authored boot. It is not evidence of a real distributed transport deployment.

## Additional regression

`npm run test:rcl` completed with 611 PASS, 0 FAIL, and 1 SKIP across 612 tests. The host had no Zig compiler. The RCL build gate therefore verified the checked Windows native distribution and its source/artifact manifest, then executed those native binaries; this is not a claim that the native executables were rebuilt from source on this host.

`npm run verify:version-contract` checked 42 registered package modules with zero errors while preserving the suite, RSR, and VSR baseline versions.

`npm run modules` listed all six new registry entries, and `npm run health` finished `healthy` across all 18 gateway-discovered runtimes after their tracked source directories were included in the sparse checkout.

## Pull-request CI entrypoint repair

The PR runs exposed three pre-existing workflow/build-contract failures rather than World Body theorem or differential failures:

- the Windows job called a missing root `verify:native-boundary` script even though the RCL workspace already owned that verifier;
- the Linux execution-plane job ran gateway tests after `npm ci --ignore-scripts` but before building the RSR/VSR distributions imported by the network and Aether bridges.
- the POSIX native build reused a checked Windows object file and attempted to link it into a Linux shared library.

The root scripts now delegate to the existing RCL native-boundary verifier, prepare the RCL compiler, and build RSR (whose prebuild prepares VSR) before gateway tests. POSIX native builds clean cross-platform artifacts before rebuilding. The exact local gates then passed: gateway `26/26`, and the Windows boundary returned `NATIVE_WINDOWS_VERIFIED`. The final GitHub checks passed on Linux and Windows. This verifies the checked Windows executable and Linux source build path; it still does not claim a local Windows native source rebuild.

The diagnostic code-reduction benchmark verified output parity with a direct-handwritten visual-binding control. One Windows x64 / Node.js 24.15.0 run measured 1,384.277 microseconds per generated nine-artifact bundle, 4.193 microseconds per generated two-body binding, and 3.108 microseconds for the direct control (1.349x). These host-sensitive timings are retained as diagnostics, not proof or a release gate.

`npm audit --omit=dev --audit-level=high` reported three pre-existing production dependency findings outside the six new packages: one high-severity `fast-uri 3.1.3` advisory and two moderate findings on the `@modelcontextprotocol/sdk 1.29.0 -> @hono/node-server 1.x` MCP chain. The audit dry-run offered no non-forced lock-only change; the Hono fix requires moving the MCP SDK beyond its exact declared version. This candidate does not use `npm audit fix --force` or mix an untested MCP upgrade into the World Body change. A focused MCP dependency upgrade remains a release follow-up.

## Test-environment notes

The initial sparse checkout omitted indirect files required by the existing authority/presentation, network, and gateway-health checks. Those first attempts failed or degraded with `ERR_MODULE_NOT_FOUND`; the missing tracked dependency paths were added and the same commands then passed. This was a checkout-coverage issue, not counted as product success and not hidden as a source-code fix.

Existing RSR/VSR tests rewrite tracked fixture manifests with machine-local absolute paths and line-ending-sensitive source hashes. Those test-generated working-tree changes were discarded after the successful run and are not part of this candidate. This pre-existing portability risk is outside World Body v0.1's source changes.

## Honest boundary

No real browser/target GPU capture, pixel oracle, external physics engine, real distributed transport, production asset provider, or target-hardware performance test was run. WB-T10 remains `UNVERIFIED`; the candidate verdict is **F4.5 Partial Production Parity**.
