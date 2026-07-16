# Reality Build Runtime Evidence Contract v0.1

Reality Build treats deterministic runtime evidence as a first-class release
artifact. A unified project build produces four root-level JSON files:

- runtime-evidence.json: the sealed release receipt and summary roots.
- runtime-timeline.json: the active deterministic input timeline.
- runtime-replay.json: the replay verification receipt.
- runtime-checkpoint.json: the initial build checkpoint.

The same files are copied into file-based targets such as web-release,
windows-portable, windows-native, and the Android asset directory. Single-file
targets embed the evidence summary in their runtime payload.

The build request contains runtime_trace. When omitted, the builder uses two
empty input frames so every build still proves a non-empty replay path. The
trace is part of the semantic build identity, so changing it cannot reuse a
cache entry for a different runtime proof.

The release is valid only when:

- runtime-evidence.json has a valid evidence_root;
- deterministic is true;
- runtime-timeline.json and runtime-replay.json agree on their roots;
- the build receipt hashes every runtime evidence file;
- every target receipt hashes the copied evidence files where the target is
  file-based.

This contract proves deterministic local runtime evidence. It does not claim
network replication, multi-user conflict resolution, physical GPU timing, or
store-signed production packages.
