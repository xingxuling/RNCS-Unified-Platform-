# Host Context and Negotiation v0.2

## 1. Host profile

A host profile is a serializable Resource Context Graph snapshot containing:

- host identity and family;
- executable profiles;
- capability versions;
- interaction modes;
- resource classes;
- policy constraints.

It avoids hard-coding behavior around labels such as “phone” or “desktop.” A restricted kiosk and a powerful tablet may share a touch surface while differing radically in policy and execution capacity.

## 2. Negotiation order

1. verify capsule and host-required signature policy;
2. select the first mutually supported execution profile;
3. negotiate capability versions;
4. issue leases for supported requests;
5. materialize explicit fallbacks for optional requests;
6. block on unresolved required requests;
7. emit a deterministic plan before execution.

## 3. Plan states

- `ready`: selected execution and all requested capabilities available;
- `degraded`: launchable with at least one explicit fallback;
- `blocked`: required capability or execution profile unresolved.

## 4. Host policy

The sample restricted kiosk demonstrates policy participating in execution:

- signatures are mandatory;
- only `declarative-v0` is allowed;
- only clock and logging are exposed;
- Wasm primary execution falls back before launch;
- optional storage and environment requests are degraded.
