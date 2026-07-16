# Reality Studio Runtime Timeline Contract v1.0

Status: 1.0.0-alpha.1

Reality Studio runtime control is represented as a deterministic,
content-addressed timeline. The timeline is an editor artifact, not an
opaque debugger buffer. It can be inspected, replayed, sought, branched,
checkpointed, and exported with the unified project.

## Invariants

- initial.state_root is the state root before the first recorded runtime step.
- Each entry contains the input frame, previous state root, resulting state
  root, and debugger projection root.
- cursor is the active branch position. Entries after the cursor are retained
  until the next step, then discarded as a new branch is recorded.
- Replay starts from initial and only consumes entries before cursor.
- A replay is deterministic only when every checked entry matches its recorded
  after_state_root.
- Project edits reset the runtime timeline because the program or scene root
  may have changed.

## Timeline shape

    {
      "format": "reality-studio.runtime-timeline.v1.0",
      "version": "1.0.0-alpha.1",
      "initial": {
        "tick": 0,
        "state_root": "..."
      },
      "entries": [
        {
          "sequence": 1,
          "tick": 1,
          "input": {},
          "before_state_root": "...",
          "after_state_root": "...",
          "after_projection_root": "..."
        }
      ],
      "checkpoints": [],
      "cursor": 1,
      "timeline_root": "..."
    }

## Unified session commands

POST /api/unified/session/command accepts:

- runtime-replay: verify the active branch and return a signed replay receipt.
- runtime-seek: restore runtime state to a tick on the active branch.
- runtime-checkpoint: capture a stable checkpoint ID, state snapshot, and
  root.
- runtime-restore: restore a checkpoint by checkpoint_id.

The same receipts are available through UnifiedManufacturingSession and are
included in exportArtifacts() as:

- runtime_timeline
- runtime_replay

The runtime gateway advertises runtime.timeline, runtime.replay, runtime.seek,
and runtime.checkpoint. The CLI smoke path is:

    reality-studio-native runtime-timeline-demo --project <unified-project.json>

This contract is the minimum evidence surface for G2 runtime inspection and
time travel. Network replication, long-lived storage, and multi-user conflict
resolution remain later contracts.
