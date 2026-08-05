# RNCS Character Genome Forge v0.1 Status

- Date: 2026-08-06
- Status: **reference foundation implemented and locally verifiable; broader Anime Forge work remains active.**

## Runnable chain

`Character RCL -> RCL bytecode -> Character Genome -> constraint solver ->
RAGF request -> Character Phenotype Compiler -> Character Asset Family ->
VSR/RSR profiles -> Reality Studio -> Anime Cut -> Evidence Ledger`

The Lan Tianlin sample compiles into 70 manifested files. It contains three
independent LODs, modular geometry, 28 identity morphs, eight expressions,
fourteen visemes, a 21-bone rig, model and expression sheets, ten Native 2D
layers, 2.5D metadata and seven 3D-assisted 2D passes. The same sealed family is
bound to the 120-frame `何罪之有` Cut with voice and audio receipts.

## Acceptance gates

- Determinism: same source and seed produce the same Genome and asset roots.
- Authority: identity, morphology, appearance and state are separate; Provider,
  VSR, RSR and Anime bindings cannot write identity.
- Continuity: appearance changes preserve the identity signature; cross-media
  projections carry one signature root.
- Incremental rebuild: recolor preserves body, face, rig and collision geometry.
- Recovery: snapshot, replay and rollback verify sealed roots and files.
- Negative tests: invalid topology, unsafe parameters, identity writers,
  continuity drift, damaged manifests and unapproved commits fail closed.
- Studio: controls invoke the real compiler and expose mesh, roots, impact,
  validation, evidence, lineage and license data.

Canonical evidence is stored in
`evidence/character-genome-forge-v0.1/evidence-summary.json`; the same directory
contains the current portrait and Cut frame. Local benchmark receipts are in
`packages/world/character-phenotype-compiler/benchmarks/`. Studio desktop,
compact and mobile browser evidence is recorded in
`evidence/character-genome-forge-v0.1/studio-browser-evidence.json`.

## Commands

```text
npm run test:character-genome
npm run demo:character-genome
npm run benchmark:character-genome
npm run evidence:character-genome
npm run browser:character-genome
npm run package:character-genome
```

## Release boundary

The v0.1 gate proves a real, deterministic reference implementation. It is not
a declaration that RNCS Anime Forge as a whole is complete. Professional
topology and art, licensed production assets, full hair and cloth dynamics,
external Provider/DCC interoperability, target-device GPU evidence and human
art acceptance remain open gates.
