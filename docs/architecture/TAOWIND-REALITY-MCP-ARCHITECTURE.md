# TaoWind Reality MCP Architecture

## Boundary

```text
ChatGPT / MCP client
        ↓ Streamable HTTP
TaoWind Reality MCP
  ├─ security and session boundary
  ├─ knowledge allow-list index
  └─ candidate-safe tool facade
        ↓
Reality One Gateway
        ↓ dynamic manifests
RNCS / Aetherworld runtimes
```

MCP owns transport, tool schemas, remote-session safety, and projection of results. Reality One Gateway remains the single runtime discovery and invocation authority. Domain logic stays inside RFE, RBF, AAF, RSR, VSR, Network Runtime, RAGF, and Aetherworld Native Runtime.

## State authority

- MCP sessions and search index: TaoWind Reality MCP.
- Runtime registry and invocation receipts: Reality One Gateway.
- Candidate branch state: Aetherworld Native Runtime / Reality Branch Fabric.
- Formal Generation and world state: RFE.
- Authorization: AAF; not exposed in v0.1.

## Security invariant

No MCP tool can transition a candidate into the authoritative world. Tool registration itself is the first security boundary; descriptions and ChatGPT confirmation cards are not treated as authorization.

## Deployment

Local mode binds to loopback. Remote mode requires HTTPS at the hosting layer, explicit host/origin configuration, rate limiting, and either a private path token for single-user Alpha use or OAuth 2.1 in a later production release.
