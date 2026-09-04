# URRF v0.3 Sensor Inference Candidate Gate

Status: `CANDIDATE_LOCAL_VERIFIED / NOT_PRODUCTION`

This packet records the RNCS-owned candidate path required by URRF-24:

```text
Observation
  -> verified calibration and evidence
  -> deterministic inference candidate
  -> candidate PropertySet
  -> lease-bound RNCS acceptance receipt
  -> explicit RNCS promotion
  -> canonical PropertySet
```

The Provider emits observation/inference material only. It cannot write a
canonical property, alter the source root, or bypass the acceptance gate.

## Implemented contracts

- `packages/kernel/rncs-core-contract/src/reality-sensor-inference.mjs`
- `packages/kernel/rncs-core-contract/schemas/reality-sensor-inference-candidate.v0.3.schema.json`
- `packages/kernel/rncs-core-contract/schemas/reality-sensor-inference-acceptance.v0.3.schema.json`
- `packages/kernel/rncs-core-contract/tests/sensor-inference.test.mjs`

The candidate contract roots the observation sample, calibration, inference,
proposed PropertySet and combined evidence. Calibration must be `VERIFIED`,
must contain evidence, and must cover the observation tick. The acceptance
contract binds a committed RNCS decision to an active lease, epoch and fencing
token. Rejected decisions cannot be promoted. Accepted decisions still report
`canonical_property_mutation_performed: false`; only the RNCS promotion
function creates the canonical PropertySet.

## Local verification

- `node --test packages/kernel/rncs-core-contract/tests/sensor-inference.test.mjs`: `4/4 PASS`.
- The focused Ajv 2020-12 run validates both sealed contracts and rejects
  provider/authority escalation and canonical-mutation tampering.
- `npm test --workspace @taowind/rncs-core-contract`: `59/59 PASS`.
- `git diff --check`: no whitespace errors; Windows line-ending conversion
  warnings are environmental only.

Negative cases include missing or unverified calibration, calibration outside
the observation interval, Provider canonical-write escalation, canonical
PropertySet shortcut, missing authority receipt, expired lease, rejected
acceptance, stale candidate root, acceptance flag tampering and acceptance
root tampering.

## Boundary

This is deterministic local contract and root evidence. It does not prove a
physical sensor, an external cryptographic signer, a production keyring,
cross-process sensor replay, target hardware, human review or AAA delivery.
The former `URRF_GAP_SENSOR_INFERENCE_ACCEPTANCE` is locally resolved as a
candidate contract, while those external authority and measurement proofs
remain open.
