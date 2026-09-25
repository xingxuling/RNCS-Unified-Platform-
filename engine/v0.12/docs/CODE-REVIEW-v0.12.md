# Code Review v0.12

Resolved findings:

- normalized integer glTF weights are decoded correctly;
- GLB magic, version, length and chunk boundaries are validated;
- glTF column-major inverse bind matrices are converted to runtime row-major matrices;
- skeleton parent ordering and skin joint references are validated;
- Studio previews consume the animator's final pose;
- state switching preserves animator snapshots;
- preview HTTP payloads return evidence roots and PNG only, not full intermediate vertex arrays;
- animation presentation does not mutate the authority reality root.

Boundary: this release uses deterministic CPU skinning. GPU skinning, automatic retargeting, motion matching, Control Rig, cloth, hair and film-grade facial solving remain future work.
