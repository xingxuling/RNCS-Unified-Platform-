# Code Review v0.10

## Findings resolved

- Studio imported only `reality-asset.continuity-bundle.v0.1`; current RAGF bundles v0.3 were rejected. Compatibility is now explicit and tested.
- Selecting a non-recommended candidate previously risked reusing recommendation-level continuity structures. Production materialization now rebuilds bundle, family, lineage, Studio import and authority request from the selected candidate.
- Gateway canonical serialization rejected complete acceptance payloads containing undefined optional fields. The bridge now returns clean JSON values.
- Float-heavy preview meshes are runtime-only; sealed preview manifests contain roots, counts and integer millimeter values.

## Accepted limitations

Built-in assets remain deterministic reference assets; no claim is made for film-grade topology, facial rigs, cloth, hair or motion capture.
