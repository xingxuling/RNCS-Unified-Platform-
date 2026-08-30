# Reality Representation Fabric

`@taowind/reality-representation-fabric` is the generic RNCS/URRF runtime boundary for representation identity, selection, materialization, provider execution, and reversible candidate transitions.

The package deliberately does not own canonical world truth. A `RealityObject` carries an RNCS `state_root` and one or more verified `RepresentationRef` candidates. A provider adapter receives a read-only candidate context and can return an execution root; the runtime seals a `MaterializationReceipt` while keeping `canonical_state_mutated=false`, `authoritative=false`, and `commit_status=NOT_COMMITTED`.

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

This is an executable candidate slice: it proves the generic registry/planning/receipt/transition path, not production GPU coverage, distributed residency, or canonical authority promotion.
