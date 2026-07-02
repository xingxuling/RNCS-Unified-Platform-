# Reality Network Runtime Architecture Map

Goal: add an authoritative two-player synchronization loop without creating a second formal RSR world state.

Skill route used before coding: architecture-router, V6 requirements, V2 reality, V3 system, V1 software. V3 owns final system decisions. V4, V5, V7, V8 and V9 were intentionally not used.

Minimum verified loop:

client input -> AAF-compatible authority check -> deterministic network queue -> fixed server tick -> RSR v0.6 world step -> Snapshot or Delta -> client prediction and replay -> State Root convergence -> RFE-compatible receipt -> Gateway health check.

The server RSR instance is the only formal writer. Client worlds are prediction copies. Visual buffering never writes the authoritative State Root.