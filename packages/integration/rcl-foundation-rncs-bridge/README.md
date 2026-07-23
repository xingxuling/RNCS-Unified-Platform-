# RCL Foundation Native RNCS Bridge

This package consumes canonical RCL Foundation Native Batch A and Meta Batch B
results and compiles them into the existing RNCS Proposal, Authority, and
Commit contract.

The nine covered Foundation entries remain `bridge` mode. RNCS does not relabel
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
```

Meta Batch B binds the causal timeline, bounded acceleration, fidelity floor,
reversible root representation, and restore proof into the sealed proposal.
Non-integer numbers use deterministic decimal strings at the RNCS hash
boundary.

Run:

```bash
npm run verify:foundation-native-rcl-source
npm test --workspace @taowind/rcl-foundation-rncs-bridge
npm run demo --workspace @taowind/rcl-foundation-rncs-bridge
npm run evidence:foundation-native-rncs
```

The bridge is registered in Reality One Gateway as
`rncs.rcl-foundation-native`, with separate `prepare`, `authorize`, `commit`,
and `verify` actions. Pass `batch: "meta-batch-b"` to Gateway `prepare`.
Preparation remains proposal-only; approval and commit require distinct calls.

The commit root is bound to the RCL deterministic receipt, semantic state, and
final state root. Missing Provider, denied RCL authority, unstable AIF,
incomplete evidence, malformed semantics, missing human approval, missing
commit confirmation, and incomplete 4R governance all fail closed.
