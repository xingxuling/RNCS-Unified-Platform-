# URRF v0.3 Coverage Matrix

Status: `CANDIDATE / LOCAL_VERIFIED / NOT_PRODUCTION`

`urrf-v03-coverage-matrix.json` is the generated, machine-readable mapping
for all 26 URRF v0.3 success criteria and the nine K400 gates. The canonical
matrix definition is exported by
`packages/kernel/rncs-core-contract/src/urrf-v03-coverage.mjs`; the JSON is a
reviewable evidence snapshot, not an authority receipt.

## Reproduce

```text
npm run evidence:urrf-v03-coverage --workspace @taowind/rncs-core-contract
npm test --workspace @taowind/rncs-core-contract
```

The matrix test checks:

- exactly 26 ordered criteria and nine ordered K400 gates;
- every source, schema, test and evidence reference resolves to a real file;
- roots and authority ownership are valid;
- the dedicated VFX contract and independent child-process replication route
  are included as bounded candidate evidence;
- the nine-family Universal Art Asset golden set binds the Forge's profile
  requirements to 18 local positive/boundary executions, nine same-seed
  replays, nine open-domain fail-closed rejections, and rooted contract and
  evidence schemas;
- the URRF gap ledger and candidate Integration Court bind remaining partial
  criteria to `RCL_GAP`/`PROVIDER_GAP`/`MIXED` classifications, Donor references,
  K400 cells and an explicit no-promotion verdict;
- the sensor-inference gate is locally closed while its external authority and
  hardware boundary, plus blocked AI generation status, remain explicit.

## Current bounded result

- Criteria: `20 CANDIDATE_LOCAL_VERIFIED`, `6 CANDIDATE_LOCAL_PARTIAL`,
  `0 NOT_IMPLEMENTED`.
- K400: `5 CANDIDATE_LOCAL_VERIFIED`, `3 CANDIDATE_LOCAL_PARTIAL`,
  `1 BLOCKED_NOT_RUN`.
- `AI_GENERATE`: `BLOCKED_NOT_RUN` because this host has no CUDA/NVIDIA GPU,
  TRELLIS.2 weights or real Provider executor.
- AAA release: `BLOCKED_EXTERNAL_ART_HUMAN_HARDWARE_EVIDENCE`.

Local contract, lowering, deterministic replay and negative-case evidence do
not substitute for multi-host/network consensus, target hardware, model/data/
license audit, art direction, human review or production release authority.
The VFX route covers particle, volume, flipbook and curve representations; it
does not turn a mesh provider into a VFX provider or claim AAA effects quality.
