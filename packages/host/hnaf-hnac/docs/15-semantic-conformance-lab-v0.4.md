# Semantic Conformance Lab v0.4

## Problem

Two runtimes can both claim HNAC support while producing different permission behavior, fallback order, capability calls, or outcomes. Binary execution success is therefore insufficient.

## Contract

The lab compares implementation-independent observations:

1. host context established;
2. capsule integrity and signature status established;
3. execution profile and capability leases negotiated;
4. execution begins;
5. capability calls or denials occur in order;
6. execution completes through the declared profile.

Volatile fields are removed: timestamps, lease IDs, machine names, clock values, elapsed time, fuel counters, and implementation-specific result objects.

## Current gate

```text
same signed HNAC
    |-- Python + Wasmtime Core host
    |-- Node.js + JavaScript WebAssembly host
                 |
        normalize semantic traces
                 |
             exact match
```

The `hnac conformance` command executes both hosts, captures JSONL traces, normalizes them, and emits a structured difference report. A host is not conformant merely because it launches the guest; it must preserve semantic ordering and capability boundaries.

## Why Core Wasm is selected for this gate

The Python host supports Component Model and Core Wasm. The JavaScript reference host currently supports Core Wasm and declarative execution. The lab deliberately selects the mutually supported profile so host implementation is the only changed variable.

A later Rust host may select Component Model and enter a second equivalence class. The canonical semantic capability contract remains unchanged.
