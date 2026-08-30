# External Provider License / Provenance Audit v0.1

审计日期：2026-08-21。

## Upstream code license snapshot

| Provider | Upstream | Code license | Adapter status |
|---|---|---|---|
| Spark 2.1.0 | sparkjsdev/spark | MIT | source archive inspected; adapter/manifest only; dependencies and remote example assets remain separately audited |
| TRELLIS.2 | microsoft/TRELLIS.2 | MIT | verified code license; dependency/weights audit required |
| Infinigen | princeton-vl/infinigen | BSD-3-Clause | verified code license; Blender/Python dependency audit required |
| Make-It-Animatable | jasongzy/Make-It-Animatable | MIT | verified code license; model/data/weights audit required |
| TripoSR | VAST-AI-Research/TripoSR | MIT | verified code license; dependency/weights audit required |
| TripoSF | VAST-AI-Research/TripoSF | MIT | verified code license; dependency/weights audit required |

Pinned upstream branch observations used by the adapter audit:

- Spark 2.1.0 supplied source archive: SHA-256 `b84591632a623b9db9fa227473fa2ea03f48f03b3239caaa599d085962fdaed3`; `LICENSE` reports MIT, Copyright © 2025 WORLD LABS TECHNOLOGIES, INC.
- TRELLIS.2 main: 75fbf0183001ed9876c8dbb35de6b68552ee08bd
- Infinigen main: 25a7d284dc21fdea6525cdfc6be4c10e4d79f28f
- Make-It-Animatable main: d60cc7e01ff8da46448e458dbf450e8967b34e77
- TripoSR main: 107cefdc244c39106fa830359024f6a2f1c78871
- TripoSF main: b97b749aa5726fb64ceec359a4ef8e61e79279c7

The upstream code license is not the same as a blanket license for every dependency, pretrained weight, dataset, submodule, or generated input.

## Release policy

- UNVERIFIED blocks default commercial release.
- No external dependency or model weights are vendored into RNCS Core.
- Spark code is not copied into this repository. Any selected remote Spark example asset is **not** covered by the root-code MIT conclusion and requires a separate asset-license record.
- Every result records upstream URL, source revision, generator version, parameters, seed, license record and warnings.
- Default commercial dependency release remains false until dependency, model-weight and data notices are separately audited.
- A Provider may emit a candidate, never an authoritative asset family or authoritative world state.

The executable audit is auditExternalProviderLicenses() and its output is sealed by audit_root.
