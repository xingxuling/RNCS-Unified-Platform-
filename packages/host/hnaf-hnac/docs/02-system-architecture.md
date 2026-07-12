# HNAF System Architecture v0.2

## 1. Architectural rule

The architecture is large; each implementation release is a thin vertical slice. A release may omit a plane only when the omitted plane has a named contract and replacement boundary.

## 2. Runtime path implemented in v0.2

```text
source application
  │
  ├─ hnac.json + Wasm + semantic assets
  ▼
deterministic capsule builder
  ▼
canonical integrity index
  ▼
Ed25519 trust envelope
  ▼
host profile / resource context
  ▼
capability + execution negotiation
  ▼
scoped capability leases
  ▼
Wasmtime Core Wasm executor
  ▼
portable state + semantic trace
```

## 3. Module boundaries

| Boundary | Implementation |
|---|---|
| HNAC object | `hnac/capsule.py` |
| Manifest contract | `hnac/manifest.py` + JSON Schema |
| Trust graph seed | `hnac/trust.py` |
| Resource Context Graph | `hnac/host.py` |
| Capability Negotiation Planner | `hnac/capabilities.py` |
| Host Capability Protocol | `CapabilityBroker` + Core ABI |
| Execution Fabric | `hnac/execution/` |
| Portable State Layer | app-scoped `kv.json` reference adapter |
| Host-neutral trace | `hnac/trace.py` |
| Toolchain | `hnac/cli.py` |

## 4. Executor replacement contract

Each executor consumes:

1. entry payload bytes;
2. a capability broker;
3. the canonical manifest;
4. execution limits.

Each executor returns a serializable execution report. This allows `declarative-v0`, `wasm-core@1`, future `wasm-component@1`, `web@1`, and native projections to coexist without rewriting capsule or trust logic.

## 5. Twelve planes

0. Constitution and invariants
1. Application object and capsule
2. Component execution fabric
3. Capability kernel
4. Host translation
5. Adaptive interface projection
6. Portable state
7. Identity, trust, and supply chain
8. Update state graph
9. Distribution projection
10. Developer and operations tooling
11. Registry, governance, and conformance

v0.2 executes planes 0–4 and a narrow part of planes 6, 7, and 10. The other planes remain specified boundaries rather than hidden omissions.
