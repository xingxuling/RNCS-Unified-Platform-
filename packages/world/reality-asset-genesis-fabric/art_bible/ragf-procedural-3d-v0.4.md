# RAGF Procedural 3D Art Bible v0.4

## Visual target

The built-in provider produces a deterministic stylized procedural reference asset. The target is readable gameplay silhouette with enough rounded surface structure for VSR lighting, not film or AAA final art.

## Quality axes

- Silhouette: rounded torso, separated pelvis, head, limbs, boots, shoulder mass and one readable held prop.
- Surface: UVs, smoothed normals, layered base color, normal relief, ORM variation and restrained emissive accents.
- Motion: root, hips, spine, head, arms and legs share one eight-bone humanoid hierarchy; idle, move, attack and hit are embedded and externally described.
- Continuity: geometry GLB is palette-independent; PBR, projection and adapter roots change when material intent changes.
- Runtime: three descending LODs, fixed collision authority, semantic weapon sensor and a single stable asset identity.

## Variant budgets

| Variant | Intent | LOD0 reference | Texture ceiling |
| --- | --- | ---: | ---: |
| mobile | low memory and touch play | about 900 triangles | 128 px |
| balanced | default gameplay | about 1,350 triangles | 256 px |
| cinematic | highest built-in reference tier | about 2,080 triangles | 512 px |

The exact triangle count is budget-scaled and must remain below the requested `max_triangles` value.

## Palette and material

The four intent colors are mapped to primary, highlight, accent and shadow roles. PBR maps are deterministic and separate from geometry so palette-only regeneration can reuse mesh roots. Optional GLB export can embed the same maps for standalone interchange.

## Explicit boundary

This bible does not claim professional retopology, production UV packing, facial rigs, hair, cloth, motion capture, photoreal textures, automatic convex decomposition or target-GPU performance parity. Those capabilities belong to replaceable providers and must pass the same manifest gates.
