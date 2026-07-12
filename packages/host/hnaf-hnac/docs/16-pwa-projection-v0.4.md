# PWA Projection Compiler v0.4

## Command

```bash
hnac project-web application.hnac dist/pwa --require-signature
```

## Output

- installable responsive PWA shell;
- embedded canonical `application.hnac`;
- browser ZIP, integrity, and Ed25519 verification logic;
- Core Wasm and declarative executors;
- capability broker for log, clock, environment, and origin-scoped KV state;
- Adaptive Interface Projection renderer;
- offline service worker;
- `projection.json` provenance link;
- configuration for manual import or embedded capsule autorun.

## Canonicality rule

`projection.json` records `canonical_application: false`. The PWA shell is never allowed to silently become the application root. It records both the source capsule SHA-256 and integrity index SHA-256.

## Current browser limits

- Component Model execution is not yet implemented in the browser host, so negotiation selects Core Wasm or declarative fallback.
- JavaScript WebAssembly does not expose deterministic fuel metering; the host reports this limitation instead of pretending to enforce it.
- WebCrypto Ed25519 is required when signature policy is strict. An unsupported cryptographic implementation blocks strict execution.
- browser state is origin-scoped and is therefore a host projection, not the portable-state authority.
