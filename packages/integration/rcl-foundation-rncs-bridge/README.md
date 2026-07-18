# RCL Foundation Native RNCS Bridge

This package consumes canonical RCL Foundation Native Batch A results and compiles them into the existing RNCS Proposal, Authority, and Commit contract.

The six RCL modules remain `bridge` mode. RNCS does not relabel them as native semantics. The lifecycle is:

```text
RCL Native Provider proposal
  -> deterministic RNCS Proposal
  -> explicit human approval
  -> separate commit confirmation
  -> RNCS authoritative generation
```

Run:

```bash
npm test --workspace @taowind/rcl-foundation-rncs-bridge
npm run demo --workspace @taowind/rcl-foundation-rncs-bridge
```

The bridge is also registered in Reality One Gateway as
`rncs.rcl-foundation-native`, with separate `prepare`, `authorize`, `commit`,
and `verify` actions. Gateway preparation remains proposal-only; approval and
commit require distinct explicit calls.

The commit root is bound to the RCL deterministic receipt and final state root. Missing Provider, denied RCL authority, unstable AIF, incomplete evidence, missing human approval, missing commit confirmation, and incomplete 4R governance all fail closed.
