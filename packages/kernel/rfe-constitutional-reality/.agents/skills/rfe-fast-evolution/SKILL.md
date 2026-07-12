---
name: rfe-fast-evolution
description: Incrementally evolve an existing RFE release into exactly one new conformance contract while preserving all frozen prior contracts, maintaining Rust/JavaScript parity, generating deterministic evidence, and packaging a verifiable release. Use for RFE version upgrades, conformance additions, recovery/consensus/authority changes, benchmark refreshes, and release assembly. Do not use for unrelated UI, product ideation, or broad architecture expansion.
---

# RFE Fast Evolution

## Objective

Turn an existing validated RFE release `vX` into `vX+1` through one narrowly defined new closed-loop capability, without rewriting or weakening frozen behavior.

## Non-negotiable constraints

1. Preserve every prior conformance vector byte-for-byte unless a versioned migration is explicitly required.
2. Add exactly one new contract `C(n+1)` per release.
3. Prefer composition over modification of prior crates/modules.
4. Keep the public entry path simple: one coordinator, one acceptance scenario, one result object.
5. Every authoritative state transition must leave deterministic evidence.
6. Recovery must be idempotent and testable after an injected interruption.
7. Never claim native validation unless the Rust workspace actually compiled and tests ran.
8. Never claim cross-runtime equivalence unless Rust and JavaScript outputs match canonically.
9. Do not install or execute unreviewed third-party scripts.
10. Stop architecture expansion when the new contract's acceptance conditions are met.

## Workflow

### Phase 1 — Freeze and map

- Extract the previous release and validated source archive.
- Read, in order:
  1. root `Cargo.toml` / package metadata;
  2. latest crate/module;
  3. latest conformance vector;
  4. latest native and JS tests;
  5. release README and evidence.
- Produce a compact map:
  - frozen contracts;
  - latest coordinator state;
  - persistent files;
  - interruption points;
  - metrics;
  - missing reality condition.

### Phase 2 — Define one contract

Write the new contract before implementation:

- anomaly;
- safety invariant;
- liveness invariant;
- deterministic scenario;
- interruption/recovery condition;
- expected evidence;
- rejection conditions;
- performance counters.

Reject the version idea if it cannot be demonstrated in one deterministic acceptance scenario.

### Phase 3 — Implement minimally

- Add a new versioned crate/module rather than mutating the prior implementation.
- Reuse canonical serialization, hashing, persistence, and prior coordinator behavior.
- Add only the state required by the new contract.
- Keep formats versioned (`rfe.*.v0.x`).
- Use stable machine-readable error codes.
- Persist before exposing authority-changing outcomes.

### Phase 4 — Red/green verification

Create tests before finalizing implementation:

- frozen golden result;
- reopen and idempotent recovery;
- unsafe-configuration rejection;
- stale/wrong-parent/wrong-view rejection as applicable;
- deterministic hash stability;
- prior workspace regression.

Run the smallest failing test first, then the full workspace.

### Phase 5 — Cross-runtime parity

- Implement the same acceptance scenario in the JS reference runtime.
- Generate canonical result JSON independently.
- Compare canonical JSON and critical hashes.
- If native execution is unavailable, mark native evidence as `NOT_EXECUTED_IN_CURRENT_ENVIRONMENT`; never fabricate it.

### Phase 6 — Release gate

A release is complete only when it contains:

- validated source archive + SHA-256;
- conformance vector and index entry;
- native test/benchmark evidence or an explicit non-execution notice;
- JS test/benchmark evidence;
- release README;
- conformance document;
- file checksum manifest;
- version/changelog note;
- repository-level `.agents/skills/rfe-fast-evolution/SKILL.md`.

Run `node scripts/check_release.mjs <release-dir>` before packaging.

## Completion report

Report only verified facts:

- contract added;
- files changed;
- tests executed and exact result;
- benchmarks executed and exact result;
- limitations;
- package link.

Do not describe planned work as completed work.
