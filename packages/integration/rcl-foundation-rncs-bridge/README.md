# RCL Foundation Native RNCS Bridge

This package consumes canonical RCL Foundation Native Batch A, Meta Batch B,
Batch C, Batch D, and Batch E results and compiles them into the existing RNCS Proposal,
Authority, and Commit contract.

The sixteen covered Foundation entries remain `bridge` mode. RNCS does not relabel
them as native syntax. The lifecycle is:

```text
RCL Native Provider results
  -> semantic parameters and roots in RNCS provisional delta
  -> deterministic RNCS Proposal
  -> explicit human approval
  -> separate commit confirmation
  -> RNCS authoritative generation
```

Batch A remains the default. Select Meta Batch B with either:

```js
prepareFoundationNativeMetaRncsTransition(request);
prepareFoundationNativeRncsTransition(request, { batch: 'meta-batch-b' });
prepareFoundationNativeBatchCRncsTransition(request);
prepareFoundationNativeRncsTransition(request, { batch: 'batch-c' });
prepareFoundationNativeBatchDRncsTransition(request);
prepareFoundationNativeRncsTransition(request, { batch: 'batch-d' });
prepareFoundationNativeBatchERncsTransition(request);
prepareFoundationNativeRncsTransition(request, { batch: 'batch-e' });
```

Meta Batch B binds the causal timeline, bounded acceleration, fidelity floor,
reversible root representation, and restore proof into the sealed proposal.
Non-integer numbers use deterministic decimal strings at the RNCS hash
boundary.

Batch C binds a bounded deterministic physical step to an authority-bounded
embodiment command. Its `embodiment` result must carry the preceding physical
`afterRoot`, so the physical-to-body transition cannot be detached from the
causal chain.

Batch D binds bounded energy transfer to elemental composition and neural signal
integration. The elemental result must carry the energy result's `afterRoot`,
and the neural result must carry the elemental result's `afterRoot`.

Batch E binds a bounded metacomputation plan to computation execution. The
computation result must carry the metacomputation result's `afterRoot`, and the
arithmetic result, operation, and instruction budget are rechecked before RNCS
authority can commit.

Run:

```bash
npm run verify:foundation-native-rcl-source
npm test --workspace @taowind/rcl-foundation-rncs-bridge
npm run demo --workspace @taowind/rcl-foundation-rncs-bridge
npm run evidence:foundation-native-rncs
```

The bridge is registered in Reality One Gateway as
`rncs.rcl-foundation-native`, with separate `prepare`, `authorize`, `commit`,
and `verify` actions. Pass `batch: "meta-batch-b"`, `batch: "batch-c"`, or
`batch: "batch-d"` or `batch: "batch-e"` to
Gateway `prepare`.
Preparation remains proposal-only; approval and commit require distinct calls.

The commit root is bound to the RCL deterministic receipt, semantic state, and
final state root. Missing Provider, denied RCL authority, unstable AIF,
incomplete evidence, malformed semantics, missing human approval, missing
commit confirmation, and incomplete 4R governance all fail closed.
