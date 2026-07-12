# TaoWind Reality MCP v0.1 Implementation Plan

1. Add an integration package instead of modifying runtime internals.
2. Reuse the singleton Reality One Gateway and its dynamic runtime manifests.
3. Serve MCP 2025-era Streamable HTTP with the production v1 TypeScript SDK.
4. Register read-only knowledge/runtime tools and candidate-only planning tools.
5. Enforce authority isolation by not registering authorize/merge/rollback/shell tools.
6. Add allow-listed knowledge indexing, opaque artifact IDs, origin/host/rate protections, and session expiry.
7. Test with the official MCP client and prove authoritative state remains unchanged.
8. Add Docker and hosted-container deployment recipes, then package and hash the complete source.
