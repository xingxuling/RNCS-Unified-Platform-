# Architecture Review v0.10

**Decision: ACCEPT.**

The release preserves clear boundaries: RAGF owns candidate production and provenance; Reality Studio owns project editing and acceptance; RSR owns physical authority; VSR owns presentation; Gateway owns capability routing. Asset Forge holds references to a manufacturing session but does not create a second project model. Runtime preview payloads are deliberately excluded from sealed Studio manifests to prevent floating-point mesh data from contaminating deterministic project roots.

Remaining risks: large candidate payloads need streaming, external providers need sandboxing and budgets, and multi-user acceptance requires AAF/RFE policy integration.
