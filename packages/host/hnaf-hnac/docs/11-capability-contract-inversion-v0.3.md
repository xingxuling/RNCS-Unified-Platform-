# Capability Contract Boundary Inversion v0.3

## Original boundary

Traditional application runtimes expose operating-system APIs and ask applications to adapt.

## Inverted boundary

HNAC applications declare semantic intent. A host proves that it can materialize that intent through a versioned adapter.

```text
OS API ownership
      ↓ inverted
semantic capability ownership
```

## Five identities that must not be collapsed

1. **Manifest capability ID** — stable semantic identity.
2. **WIT interface ID** — typed transport contract.
3. **Capability lease ID** — scoped runtime authorization.
4. **Host adapter ID** — platform implementation.
5. **OS primitive** — local mechanism.

Collapsing any two recreates platform lock-in.

## Example

```text
host.clock
  ↔ hnaf:capabilities/clock@0.3.0
  ↔ lease 8c9...
  ↔ desktop clock adapter
  ↔ platform time primitive
```

Only the first identity belongs to application meaning. The rest are replaceable projections.
