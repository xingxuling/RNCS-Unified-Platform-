# Roadmap after v0.3

## v0.3.1 — Rust host equivalence gate

- implement the same Contract Forge and capability registry in Rust;
- use Wasmtime `component::bindgen!` generated bindings;
- run the same signed capsules against Python and Rust hosts;
- require trace-level semantic equivalence;
- add typed resource handles and destructor tests;
- prohibit Rust-only semantics from entering the canonical contract.

## v0.4 — Web/PWA host

- browser capsule importer;
- offline object store and service worker;
- browser Component Model adapter or component-to-Web projection;
- first Adaptive Interface Projection renderer;
- installable PWA projection across desktop, tablet, and phone;
- web capability broker and policy report.

## v0.5 — Portable State Fabric

- schema registry and deterministic migrations;
- portable, device-private, secret, and cache partitions;
- encrypted export/import;
- replica identity and reconciliation;
- rollback-safe migration testing.

## v0.6 — Desktop Projection Compiler

- Windows and macOS host shells;
- canonical-to-platform entitlement mapping;
- MSIX and `.app` projection prototypes;
- projection provenance report;
- reversible local materialization.

## v0.7 — Mobile Projection Compiler

- Android host and AAB projection;
- iOS/iPadOS host and Xcode projection;
- lifecycle, sensors, background work, and store-policy mapping;
- touch, keyboard, pointer, voice, and spatial interaction contexts.

## v0.8 — Trust and Update Graph

- delegated signing roles;
- threshold signatures;
- key rotation and revocation;
- transparency and provenance adapters;
- delta updates and rollback protection.

## Invariant

No host implementation, platform shell, store package, or projection may become the canonical application. Every projection must retain a cryptographic and semantic link to the HNAC root.
