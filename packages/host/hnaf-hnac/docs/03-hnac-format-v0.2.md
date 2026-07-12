# HNAC Format v0.2

## 1. Container

HNAC v0.2 uses deterministic ZIP64 as a transport container. Logical paths are POSIX-normalized, absolute paths and parent traversal are rejected, duplicate logical paths are forbidden, and file metadata is normalized for reproducible output.

## 2. Required objects

```text
hnac.json
integrity/index.json
<at least one execution entry>
```

A signed capsule additionally contains:

```text
signatures/ed25519.json
```

## 3. Integrity model

`integrity/index.json` contains the SHA-256 digest and byte size of every payload object. Integrity, signature, and attestation folders are excluded from the payload root to avoid recursive signing.

Verification checks both:

- every indexed object matches its digest and size;
- the actual payload file set exactly equals the indexed file set.

This blocks modification, deletion, and undeclared file injection.

## 4. Execution profiles

v0.2 moves entry selection out of `app.entry` and into ordered execution profile objects:

```json
{
  "execution": {
    "primary": {
      "profile": "wasm-core@1",
      "entry": "components/main.wasm",
      "abi": "hnaf-core-abi@0.2"
    },
    "alternatives": [
      {
        "profile": "declarative-v0",
        "entry": "components/fallback.hnc.json"
      }
    ]
  }
}
```

A host selects the first profile supported by both host policy and installed executor implementations.

## 5. Compatibility

The reference runtime accepts v0.1 capsules and translates their string execution declarations into v0.2 internal candidates. v0.2 capsules require runtime `0.2.0` or newer.
