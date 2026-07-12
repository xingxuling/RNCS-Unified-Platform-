# HNAC v0.2 Reference Threat Model

## Protected properties

- payload integrity;
- signer authenticity at the key level;
- no undeclared payload injection;
- no ambient guest authority;
- bounded guest computation and memory;
- app-scoped state separation;
- inspectable capability use.

## Implemented controls

| Threat | Control |
|---|---|
| Path traversal | normalized logical path validation |
| Duplicate ZIP path ambiguity | duplicate rejection |
| Payload modification | SHA-256 file map |
| Payload deletion/injection | exact indexed file-set comparison |
| Signature substitution | signed canonical integrity object |
| Unknown Wasm imports | import namespace firewall |
| Undeclared capability use | lease validation before linking and call |
| Infinite guest loop | Wasmtime fuel |
| Excessive linear memory | store memory limit |
| Cross-app state collision | state rooted by application identity |
| Invisible authority use | JSONL semantic trace |

## Known non-goals and open risks

v0.2 does not yet implement:

- trusted timestamping, revocation, or delegated threshold signing;
- encrypted state at rest;
- user consent UI;
- network, file, camera, microphone, or secret capabilities;
- process isolation beyond the Wasm runtime boundary;
- supply-chain provenance and dependency attestations;
- rollback protection and update metadata;
- formal verification of ABI memory handling;
- native mobile host policy compliance.

The reference host should therefore be treated as a research runtime, not a production security boundary.
