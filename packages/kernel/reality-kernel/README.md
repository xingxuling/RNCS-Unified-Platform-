# Reality Kernel v0.1

`@taowind/reality-kernel` is the smallest executable bottom layer for the RNCS reality stack. It does not replace RFE, RNCS Contract, LAF, AAF, or RBF. It supplies the shared deterministic seam those systems can use:

```text
reality object ABI → graph query → transition preview/commit → evidence root → RFE adapter
```

## What is implemented

- content-addressed reality objects with tamper verification;
- deterministic object/relation graph snapshots and bounded traversal;
- a previewable transition VM with proposal, authority, commit, stale-base, and atomicity checks;
- evidence compilation bound to transition roots;
- a duck-typed adapter that can forward a committed transition to the existing RFE local SDK.

## Boundary

This is a local deterministic kernel. It does not implement distributed consensus, production signatures/PKI, network transport, physical-world sensing, or claims about external reality. RFE remains the authoritative persistence and generation layer.

## Run

```bash
npm test
npm run demo
```
