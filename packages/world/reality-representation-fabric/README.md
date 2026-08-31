# Reality Representation Fabric

`@taowind/reality-representation-fabric` is the generic RNCS/URRF runtime boundary for representation identity, selection, materialization, provider execution, and reversible candidate transitions.

The package deliberately does not own canonical world truth. A `RealityObject` carries an RNCS `state_root` and one or more verified `RepresentationRef` candidates. A provider adapter receives a read-only candidate context and can return an execution root; the runtime seals a `MaterializationReceipt` while keeping `canonical_state_mutated=false`, `authoritative=false`, and `commit_status=NOT_COMMITTED`.

`RealityTransportFabric` is the bounded v0.3 propagation surface. It registers Fiber/WiFi/Bluetooth profiles, discovers and associates local nodes, records candidate roaming/fallback decisions, and sends profile-rooted packets or low-power Bluetooth Organ Links. Pairing, routing, and packet delivery never grant canonical write authority; world mutation still requires an RNCS lease and committed authority receipt.

`RealityResourceGovernor` is the bounded v0.3 Power/Resource Plane. It binds node power and thermal state to CPU/GPU/NPU/VRAM/RAM/Storage/Network/Agent/Simulation/Energy budgets, records provider/network/thermal faults, and emits deterministic load-shedding decisions. Safety, authority, control and Minimum Viable Reality are protected classes; visual/physics/agent/audio/refinement work can be reduced, frozen, offloaded or deferred. The governor is candidate-only and never mutates Canonical World State or grants provider authority.

`RealityRepresentationPortfolioRuntime` adds the missing quantity/composition layer. A portfolio sets per-object `min_slots`/`max_slots`, a quality ladder (`PROXY` through `REFERENCE`), required representation kinds, resource costs, fallback policy, and explicit diversity targets across modality/detail/material/lighting/environment/style/motion/view. It selects a deterministic slot under quality and budget pressure and records local visual evidence with pixel/frame roots plus optional environment/animation roots. `OBSERVED_NOT_GRADED` is intentionally not a subjective art-quality or production-GPU claim.

The adapter interface is intentionally provider-neutral:

```js
const fabric = new RealityRepresentationFabric({
  providers: [{manifest, materialize: async ({object, reference, plan, authority}) => ({
    status: 'EXECUTED',
    output_root: 'a'.repeat(64),
    runtime: 'local-reference'
  })}]
});
```

The runtime can also represent a contract-only provider. In that case it emits an explicit `NOT_EXECUTED` receipt instead of fabricating provider execution.

RealityObject registration now accepts RNCS-owned `property_set` and `law_bindings` contracts. When omitted, the runtime installs explicit empty v0.3 contracts so older representation-only callers remain deterministic. Materialization plans and receipts carry both roots; adapters receive read-only property/law views and fail closed if they claim to mutate canonical property or law state. `createPropertyTransitionCandidate()` records a candidate-only property change and does not commit it.

Materialization requests may carry a v0.3 `detail_vector`; its nine axes are kept independent and sealed in the plan/receipt. Objects with `query_index` metadata can be selected through `createHorizon()`, `createInterestGraph()`, `queryReality()`, and `createCognitiveWorkingSet()`. Query results are deterministic candidates with permission/horizon filters and `canonical_revalidation_required=true`; they never mutate RealityObject state.

This is an executable candidate slice: it proves the generic registry/planning/receipt/transition path, not production GPU coverage, distributed residency, or canonical authority promotion.
