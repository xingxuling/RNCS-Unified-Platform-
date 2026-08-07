# Phase 6.3 Migration Plan

## Compatibility

Keep `compileMorphology(genome, profile)` stable. Existing callers receive the Phase 6.2-compatible fields and the new field, mesh, attachment, skinning, visibility, and certificate data when the Phase 6.3 profile is selected.

## Authority migration

1. Move dimension solving into measured constraint solving inside the existing canonical compiler.
2. Convert the existing primitive volume descriptors into field descriptors without deleting their compatibility representation.
3. Add the canonical surface mesh as the only source for Phase 6.3 rendering.
4. Route pose changes through surface skinning.
5. Route feature, scalp, hair, and garment placement through surface attachments and clearance checks.
6. Route projection through visibility buffers before style.
7. Keep contour rendering behind an explicit legacy/regression profile.

## Data versioning

- morphology certificate: `v0.2`
- field payload: `rncs.native-morphology-field.v0.1`
- canonical mesh payload: `rncs.canonical-surface-mesh.v0.1`
- visibility payload: `rncs.native-visibility-buffer.v0.1`
- Anime grammar: `v0.2`

## Roll-forward

Enable Phase 6.3 only when the static validation pack is complete. Promote the profile in a later phase after human review. Do not silently change Phase 6.2 evidence or regenerate old artifacts under a new label.

## Rollback trigger

Rollback if any public API changes, phase 3/4/5/6.1/6.2 regression fails, topology is nondeterministic, field sampling exceeds the bounded budget, or Reality Studio shows a green status without a corresponding evidence root.
