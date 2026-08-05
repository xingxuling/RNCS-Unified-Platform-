# Reality Kernel v0.2

`@taowind/reality-kernel` is the smallest executable bottom layer for the RNCS reality stack. It does not replace RFE, RNCS Contract, LAF, AAF, or RBF. It supplies the shared deterministic seam those systems can use:

```text
reality object ABI → graph query → typed continuity → transition preview/commit → evidence root → RFE adapter
```

## What is implemented

- content-addressed reality objects with tamper verification;
- deterministic object/relation graph snapshots and bounded traversal;
- a previewable transition VM with proposal, authority, commit, stale-base, and atomicity checks;
- typed continuity claims with predecessor binding, epoch rollover, replay/gap rejection, fencing tokens, and bounded fork policy;
- subject-sovereignty envelopes that bind the acting subject and transition to a continuity claim;
- evidence compilation bound to transition roots;
- a duck-typed adapter that can forward a committed transition to the existing RFE local SDK and advance continuity only after the RFE commit succeeds.

## Boundary

This is a local deterministic kernel. It does not implement distributed consensus, production signatures/PKI, network transport, physical-world sensing, or claims about external reality. The continuity ledger is an execution guard, not a distributed identity provider. RFE remains the authoritative persistence and generation layer.

## Run

```bash
npm test
npm run demo
```
