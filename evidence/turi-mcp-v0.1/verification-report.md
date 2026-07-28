# TURI MCP v0.1 Verification Report

Date: 2026-07-28
Branch: `feat/turi-unified-rcl-rncs-updia-mcp-v0.1`
Decision: `INTEGRATION_CANDIDATE`

## Automated evidence

The focused package suite passed `11/11`:

```text
npm test --workspace @taowind/turi-mcp
```

Covered assertions:

- manifest safety fields, evidence-only boundaries and dynamic registry controls;
- EvidenceReceipt hashing/persistence;
- real-method-only UPDIA JSONL adapter mapping and undefined/authority-field stripping;
- structured ExperienceRecord → Pattern → Protocol → Capability Candidate → evaluation → explicit Promotion Court → dynamic registration → lineage/rollback;
- Streamable HTTP MCP initialize, tools/list, tools/call, resources/list/read;
- real RNCS Gateway candidate compile/validate/create/simulate/diff with unchanged formal state root/revision;
- HTTP origin/Bearer rejection;
- public cloud-shaped HTTP binding (`0.0.0.0` + platform `PORT`), wildcard Host handling behind Bearer/Origin policy, and authenticated Streamable HTTP initialize;
- persisted Job/Artifact identifiers on Windows;
- stdio CLI initialize and tool discovery.

The smoke summary reports 147 registry capabilities and 98 default exposed tools. Native/adapter/provider/evidence-only inventory is captured by `turi_server_info` and `/mcp/manifest`.

The configured WorldSeed bridge was also smoke-tested directly with the existing `asil/living-subject-001-v5.3.checkpoint.json`: `status` returned `updia.local-interaction-status.v6.3` and `health` returned `updia.local-interaction-health.v6.3` with `ready`. A first-boot attempt without a checkpoint correctly failed with `checkpoint-required-for-first-boot`; this is now reflected in `UPDIA_NOT_CONFIGURED` and the configuration docs.

The public deployment package is committed and pushed with a root `render.yaml` Blueprint. The Render apply step is not claimed as live until a Render account creates the service and returns a real `onrender.com` URL; the public endpoint and ChatGPT connector still require that external session.

## Not yet verified

- no real ChatGPT Connector session;
- no MCP Inspector session;
- no configured UPDIA generation/model run in the package test suite (health/status bridge smoke is covered separately above);
- no configured GameBrain/RSR/VSR provider run;
- no human acceptance of formal merge, rollback, cinematic output, or production performance.

Therefore this report intentionally does not claim `VERIFIED` or production “越用越强”。
