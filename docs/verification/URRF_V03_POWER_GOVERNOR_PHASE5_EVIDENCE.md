# URRF v0.3 Power / Resource Governor Phase 5 Evidence

Status: `CANDIDATE / LOCAL_VERIFIED / NOT_PRODUCTION`

## Implemented surface

- RNCS `RealityPowerProfile` binds node power state, battery/grid/charging,
  exact milli-Celsius thermal envelope, derived power mode and load-shedding
  level. Subject identity is separate from body availability.
- RNCS `RealityResourceBudget` and `RealityResourceDemand` cover CPU, GPU, NPU,
  VRAM, RAM, Storage, Network, Agent Compute, Simulation and Energy with
  deterministic capacity/usage/reserve/available roots.
- RNCS `RealityFault` records provider, network, GPU-memory, battery, thermal
  and power failures without turning a fault declaration into authority.
- RNCS `MinimumViableReality` preserves a rooted canonical state reference and
  a bounded recovery chain beginning with a world proxy, collision and
  semantic layers.
- RNCS `RealityLoadSheddingPlan` protects safety/authority/control and minimum
  reality, then deterministically reduces, freezes, offloads, drops or defers
  soft work. Every decision keeps `canonical_write_authorized=false`.
- URRF `RealityResourceGovernor` binds the contracts, records faults and
  demands, emits sealed plans, exposes admission decisions, and verifies a
  candidate-only snapshot. It does not become a canonical scheduler or power
  controller.

## Reproducible checks

```text
node --check packages/kernel/rncs-core-contract/src/reality-power.mjs
node --check packages/world/reality-representation-fabric/src/resource-governor-runtime.mjs
npm test --workspace @taowind/rncs-core-contract
npm test --workspace @taowind/reality-representation-fabric
npm run test:urrf-runtime
npm run test:large-world
```

Observed on 2026-08-31:

- RNCS Core Contract: `29/29 PASS` (including four Power/Resource tests).
- URRF package: `15/15 PASS` (including two Resource Governor tests).
- URRF representation integration: `1/1 PASS`.
- Large-world package: `17/17 PASS`; root integration: `7/7 PASS`.
- New module syntax and `git diff --check`: PASS.

## Evidence boundary

This is a deterministic local candidate governor. It does not claim physical
battery/thermal sensor control, OS scheduler or GPU driver enforcement,
production radio/network failover, distributed power consensus, persistent
hardware telemetry, production deployment, or production CI execution. A
load-shedding plan is a candidate decision; it cannot mutate Canonical World
Truth or grant Authority.
