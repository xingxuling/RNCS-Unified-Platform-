# Codebase Archaeology v0.10

## Frozen facts

RAGF v0.3 already produced real GLB, PBR textures, rig, animations, LOD, collision, Prefab, lineage and continuity bundles. Reality Studio v1.4 already imported assets and edited RSR/VSR spatial worlds. Rebuilding those features would have duplicated working code.

## Minimum change surface

1. Turn RAGF batch workspaces into persistent production sessions with candidate review, readiness gates, targeted regeneration and acceptance.
2. Turn Studio asset import into an Asset Forge workflow that previews actual candidate structures and accepts one candidate into the current project.
3. Bind accepted 3D assets to scene nodes and RSR bodies/characters, then prove VSR projection.
4. Expose the lifecycle through Gateway, server, CLI and browser interfaces.

Network, RSR and VSR protocols remain unchanged because this release changes manufacturing, not world authority transport.
