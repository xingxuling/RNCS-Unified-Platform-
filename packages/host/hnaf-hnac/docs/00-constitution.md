# HNAF Architecture Constitution v0.1

## 1. Core object

An application is not a platform-specific executable. It is a **host-neutral application object** that declares:

1. what it is;
2. what components it contains;
3. what capabilities it requires;
4. what interaction semantics it exposes;
5. what state it owns;
6. how it proves identity and integrity;
7. how a host may project it into local execution and distribution forms.

## 2. Non-negotiable invariants

### 2.1 Application identity is not installation identity

A stable application identity survives repackaging into MSIX, `.app`, AAB, IPA, PWA, or future forms. Platform bundle IDs are projections, not the source of truth.

### 2.2 Capabilities are semantic contracts, not OS APIs

Applications request `camera.capture`, `storage.document.open`, or `notification.send`; they do not bind their core logic to CameraX, AVFoundation, WinRT, or another host dialect.

### 2.3 Deny by default

A component receives no ambient authority. Files, network, devices, secrets, sensors, and background execution are granted through explicit, scoped, auditable capabilities.

### 2.4 Graceful degradation is designed, not improvised

Every nonessential capability may declare fallback behavior. Capability negotiation occurs before launch and can produce a deterministic execution plan.

### 2.5 Interface meaning precedes geometry

The application defines actions, information hierarchy, constraints, and interaction intents. The host projects those semantics into mouse, keyboard, touch, pen, controller, voice, accessibility, and future neural-input surfaces.

### 2.6 State is portable by schema

State is addressed through schemas, migrations, ownership rules, and encryption policies rather than implicit platform folders.

### 2.7 Packaging, execution, and distribution are separate layers

A capsule is not a runtime and a runtime is not a store package. One capsule may be executed directly by a compatible host or projected into platform-specific distribution shells.

### 2.8 Replaceable modules

No first implementation is allowed to become an accidental standard. Every subsystem must expose a versioned contract and at least one replacement point.

### 2.9 Verifiability

Build inputs, package contents, signatures, capability decisions, migrations, and projections should be inspectable and reproducible.

### 2.10 Local-first, network-optional

A capsule may be fully offline. Network delivery, cloud state, registries, and remote services are optional capabilities rather than assumptions.

## 3. Architectural scale rule

The total architecture is fixed before the first vertical slice, but implementation proceeds by narrow end-to-end proofs. This prevents two opposite failures:

- a toy prototype whose assumptions cannot scale;
- a grand specification with no executable evidence.
