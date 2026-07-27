# Reality Build Runtime Evidence Contract v0.1

Reality Build treats deterministic runtime evidence as a first-class release
artifact. A unified project build produces behavior and spatial evidence:

- runtime-evidence.json: the sealed release receipt and summary roots.
- runtime-timeline.json: the active deterministic input timeline.
- runtime-replay.json: the replay verification receipt.
- runtime-checkpoint.json: the initial build checkpoint.
- spatial-snapshot.json: the final RSR spatial world snapshot.
- spatial-causal-delta.json: the RFE causal delta produced from that snapshot.
- spatial-runtime.manifest.json: the sealed workspace, state, frame, and delta roots.
- tilemap-navigation.manifest.json: the sealed collision, navigation grid, and path receipt when the active scene has a TileMap.

The same files are copied into file-based targets such as web-release,
windows-portable, windows-native, and the Android asset directory. Single-file
targets embed the evidence summary in their runtime payload.

The build request contains runtime_trace. When omitted, the builder uses two
empty input frames so every build still proves a non-empty replay path. The
trace is part of the semantic build identity, so changing it cannot reuse a
cache entry for a different runtime proof.

The optional spatial_trace is a list of command frames for the RSR spatial
runtime. It is also part of the semantic build identity. The build runs the
spatial trace twice in independent sessions and records spatial_deterministic;
the release is invalid when the final spatial state roots differ.

The release is valid only when:

- runtime-evidence.json has a valid evidence_root;
- deterministic is true;
- runtime-timeline.json and runtime-replay.json agree on their roots;
- spatial_deterministic is true and spatial-runtime.manifest.json has a valid manifest_root;
- the build receipt hashes every runtime evidence file;
- every target receipt hashes the copied evidence files where the target is
  file-based.

This contract proves deterministic local runtime evidence. It does not claim
network replication, multi-user conflict resolution, physical GPU timing, or
store-signed production packages.
