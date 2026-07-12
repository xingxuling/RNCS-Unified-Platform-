# Capability, Lease, and Host ABI v0.2

## 1. Capability authority

A capability declaration is not authority. It is a request. Authority exists only after negotiation produces a lease.

A lease records:

- capability identity;
- negotiated version;
- scope;
- issuance time;
- expiry boundary;
- opaque lease identifier.

The reference implementation uses session expiry; future hosts may implement one-shot, document, device, work, revocable, and consent-mediated leases.

## 2. HNAF Core ABI v0.2

The Core Wasm guest imports functions from module `hnaf`:

```text
log_write(ptr, len) -> status
clock_now(out_ptr, out_capacity) -> utf8_length
environment_summary(out_ptr, out_capacity) -> utf8_length
kv_get(key_ptr, key_len, out_ptr, out_capacity) -> utf8_length
kv_set(key_ptr, key_len, value_ptr, value_len) -> status
```

Strings are UTF-8 in exported guest memory. Output calls return required byte length. The guest must export:

```text
memory
run() -> i32
```

A zero result means success.

## 3. Import firewall

Before instantiation, every Wasm import is checked:

1. module namespace must be `hnaf`;
2. import name must exist in the ABI map;
3. mapped capability must have a negotiated lease.

The linker still checks calls at broker level. This provides both static preflight rejection and dynamic authority enforcement.

## 4. WIT boundary

`wit/hnaf-capabilities.wit` expresses the intended Component Model interfaces. It is not yet bound to the Python host. A future Rust executor will implement those interfaces directly while preserving the higher-level capability identifiers and leases.
