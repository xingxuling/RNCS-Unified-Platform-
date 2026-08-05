# RNCS Character Genome Forge v0.1 Baseline Audit

- Date: 2026-08-06
- Worktree: `codex/rncs-ue-high-fidelity-v01`

## Audited baseline

The existing RAGF stack already had deterministic provider manifests, stable
hashing, GLB writing, PBR maps, rig and collision generation, Asset Family,
Manifest, Lineage, Dependency Graph, VSR adapters and RSR embodiment adapters.
The active Anime Forge worktree also had Production IR, X-Sheet, reference
Anime families, frame rendering, voice/viseme timing, audio stems and a Reality
Studio route.

Those implementations were reusable infrastructure, but the generic procedural
character was still a proxy actor: its eight-bone rig, one morph target and
rounded body generator did not encode a durable character identity, a semantic
face graph or cross-media character continuity. Appearance and identity were
not independently governed, and the Studio preview could not prove that a
recolor or costume change preserved the same person.

## Compatibility decision

Character identity is now owned by the separate
`@taowind/character-genome-runtime` contract. RAGF remains the generation
authority through an explicit reference Provider, while
`@taowind/character-phenotype-compiler` owns the deterministic compilation of a
Genome into a Character Asset Family. This preserves existing generic RAGF
assets and adapters instead of silently redefining their contracts.

The new VSR and RSR profiles are additive exports. VSR may choose a projection
and render passes; RSR may materialize body, collision, retarget and bounded
secondary motion. Neither runtime may rewrite identity. Anime Forge binds a
sealed family and the same identity root to a Cut. Durable commit remains an
explicit RNCS control-plane action.

## Real v0.1 implementation

- Four topology catalog entries, with three generated topology families and a
  runnable `youth-standard` compatibility entry.
- 28 semantic face parameters, five body parameters, dependency constraints,
  safe ranges and rebuild scopes.
- 28 identity morphs, eight expression morphs, nine eye states, fourteen
  visemes and a 21-bone humanoid rig.
- Six modular hair families, three costume families, three palettes, four eye
  styles, four brow styles, three original emblem slots and two weapon sockets.
- Independently generated LOD0/LOD1/LOD2 GLBs, modular GLBs, texture maps,
  collision, physics and retarget profiles.
- Native 2D layers, 2.5D projection metadata and 3D-assisted 2D render passes.
- Stable asset IDs, manifest hashes, lineage, impact analysis, incremental
  rebuild, snapshot, replay and rollback.
- RCL parsing, source locations, shadow RCL, real RCL bytecode, CLI and an
  approval-gated commit path.

## Evidence boundary

The built-in Provider is deterministic, offline and Apache-2.0 licensed. Its
output is a reference digital actor used to validate contracts and pipelines.
This audit does not claim professional character sculpting, production hair or
cloth simulation, external DCC parity, target-GPU approval, clean-machine
installation evidence, human art-direction acceptance or commercial Anime
quality.
