# Development Roadmap after v0.2

## v0.3 — Component host and contract forge

- Rust Wasmtime host;
- actual `wasm-component@1` executor;
- generated bindings from WIT;
- component composition graph;
- typed resources and handles;
- conformance tests proving Core ABI and Component interfaces expose equivalent semantics.

## v0.4 — Web/PWA host

- browser capsule importer;
- service worker and offline object store;
- WebAssembly execution adapter;
- web capability broker;
- first Adaptive Interface Projection renderer;
- installable PWA projection for PC, Mac, tablet, and phone.

## v0.5 — Portable state fabric

- schema registry and migrations;
- portable/device-private/secret/cache partitions;
- encrypted export/import;
- replica IDs and reconciliation rules;
- deterministic state migration tests.

## v0.6 — Desktop projection compiler

- Windows and macOS shells;
- canonical-to-platform entitlement report;
- MSIX and `.app` projection prototypes;
- reversible local materialization.

## v0.7 — Mobile projections

- Android host/AAB projection;
- iOS/iPadOS Xcode/IPA projection;
- lifecycle, background work, sensors, and store policy mappings.

## v0.8 — Trust and update graph

- delegated roles and threshold signatures;
- key rotation/revocation;
- transparency/provenance adapters;
- delta updates and rollback protection.

## Development invariant

No platform shell may become the canonical application. Every projection must retain a cryptographic link to the canonical HNAC root and emit a projection report.
