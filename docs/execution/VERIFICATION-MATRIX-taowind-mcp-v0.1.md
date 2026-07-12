# Verification Matrix — TaoWind Reality MCP v0.1

| Requirement | Evidence |
|---|---|
| Remote MCP handshake | official SDK client initialize + tools/list integration test |
| Runtime discovery | `rncs_list_runtimes` returns packaged runtime registry |
| Candidate-safe workflow | compile → createCandidate → simulateCandidate → diffCandidate test |
| Authority unchanged | before/after `revision` and `state_root` equality assertion |
| No authority tools | tool catalog negative assertions for authorize/merge/rollback/shell |
| Knowledge retrieval | search/fetch opaque-ID integration test |
| No arbitrary path read | unknown/path-traversal fetch rejection |
| Origin validation | malicious browser Origin receives HTTP 403 |
| Public deployment guard | config refuses public no-auth binding without explicit protection |
| Release readiness | package tests, MCP smoke, gateway tests, integration tests, SHA-256 |
