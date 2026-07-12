# Component Contract Forge v0.3

## Purpose

The Contract Forge prevents a component binary from smuggling behavior through a gap between human-readable manifest declarations and actual machine imports.

## Inputs

- verified component bytes;
- HNAC manifest;
- selected export name;
- negotiated capability leases;
- canonical interface registry.

## Outputs

- typed import graph;
- typed export graph;
- WIT-to-capability mapping;
- declaration status;
- lease status;
- interface-signature status;
- component composition graph;
- final contract status.

## Exact signature validation

The package-like import name is insufficient. For example, this is rejected:

```text
hnaf:capabilities/log@0.3.0
write(message: u32)
```

The canonical interface requires:

```text
write(message: string)
```

The entire method map is compared, not only the interface name.

## Composition graph

The forge emits nodes and edges such as:

```text
component
  ├─ imports → WIT interface
  │             └─ maps-to → semantic capability
  │                              └─ materialized-by → host adapter
  └─ provides → entry export
```

This graph will later become the basis for component composition, policy reasoning, capability provenance, and compatibility testing.
