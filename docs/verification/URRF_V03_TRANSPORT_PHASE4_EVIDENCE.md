# URRF v0.3 Reality Transport Phase 4 Evidence

Status: `CANDIDATE / LOCAL_VERIFIED / NOT_PRODUCTION`

## Implemented surface

- RNCS transport profiles distinguish Fiber, WiFi, Bluetooth and RDN with
  explicit QoS class, bandwidth, latency, reliability, freshness, loss mode,
  discovery/roaming, low-power, fallback and authority requirements.
- Profile-rooted transport packets carry source/target, sequence, payload root,
  optional Authority Lease and committed authority receipt references.
- WiFi-style Node Discovery, Association and Roaming Decision contracts record
  local coverage, link quality, fallback profile and candidate route changes.
- Bluetooth-style low-power Organ Links bind device identity, capability
  manifest, pairing, permission scope and state sequence. Pairing explicitly
  keeps `authority_granted=false`; world-mutation admission requires the RNCS
  lease/fencing and committed authority receipt gates.
- URRF `RealityTransportFabric` registers profiles/nodes and executes the
  bounded discovery, association, roaming, packet and Organ Link candidate
  paths without owning Canonical State.

## Reproducible checks

```text
npm test --workspace @taowind/rncs-core-contract
npm test --workspace @taowind/reality-representation-fabric
npm run test:urrf-runtime
npm run test:large-world
```

Observed on 2026-08-31:

- RNCS Core Contract: `25/25 PASS` (including four Reality Transport tests).
- URRF package: `13/13 PASS` (including two transport-runtime tests).
- URRF representation integration: `1/1 PASS`.
- Large-world package: `17/17 PASS`; root integration: `7/7 PASS`.
- Syntax and `git diff --check`: PASS.

## Evidence boundary

The runtime is a deterministic local candidate fabric. It does not claim
physical WiFi/Bluetooth radio operation, QUIC/WebRTC production transport,
distributed routing or consensus, power/thermal governance, production
hardware, or production CI execution.
