# WebAssembly Component Model Host v0.3

## 1. Boundary crossed

v0.2 executed Core WebAssembly modules through a custom linear-memory ABI. v0.3 executes self-describing WebAssembly Components whose public contracts are represented through typed Component Model interfaces.

The execution chain is:

```text
HNAC manifest
  → execution candidate
  → signed component bytes
  → component import/export introspection
  → WIT contract validation
  → semantic capability declaration check
  → negotiated capability lease check
  → host adapter materialization
  → Wasmtime component instantiation
  → typed export invocation
```

## 2. Why the host implementation is replaceable

The canonical object is not the Python runtime. The canonical objects are:

- the HNAC manifest;
- the signed file map;
- the WIT capability contract;
- the capability lease semantics;
- the component import/export contract;
- the semantic trace format.

The current Python embedding can therefore be replaced by a Rust Wasmtime host without changing application identity or capability meaning.

## 3. Current canonical interfaces

```text
hnaf:capabilities/log@0.3.0
hnaf:capabilities/clock@0.3.0
hnaf:capabilities/environment@0.3.0
hnaf:capabilities/kv@0.3.0
```

Each versioned WIT interface maps to exactly one semantic capability.

## 4. Security rule

A Component Model import is usable only when all conditions hold:

1. the import namespace is recognized;
2. its complete method signature matches the canonical contract;
3. the manifest declares the mapped semantic capability;
4. host negotiation issued a capability lease;
5. a host adapter exists for that interface version.

Failure at any stage blocks instantiation.

## 5. Entry export

The selected execution candidate declares an export name. v0.3 requires the export to:

- exist;
- be a component function;
- require no parameters.

Return values may use Component Model types and are normalized for traces and CLI output.
