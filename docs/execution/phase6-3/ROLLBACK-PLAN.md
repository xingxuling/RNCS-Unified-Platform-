# Phase 6.3 Rollback Plan

## Safe boundary

All Phase 6.3 work is isolated on its own branch and worktree. Phase 6.2 remains the last merged mainline behavior. The public `compileMorphology(genome, profile)` API remains the compatibility boundary.

## Rollback actions

1. Stop the Phase 6.3 build or media job on the first failed hard gate.
2. Preserve the failing JSON, image, buffer, hash, and command evidence.
3. Disable the Phase 6.3 profile and use the legacy regression path for existing callers.
4. Revert only the Phase 6.3 commits if the branch must be removed.
5. Re-run the Phase 6.2 focused suite and the affected package suite from a clean checkout.
6. Record the failed gate and root cause in the Evidence Ledger; never delete or relabel it as success.

## Non-destructive policy

Do not reset unrelated worktrees, discard user changes, rewrite Phase 6.2 artifacts, or replace missing FFmpeg output with a GIF, frame directory, JSON, or ZIP. Missing tools are explicit failures.

## Recovery criteria

Recovery is complete when the Phase 6.2 baseline is reproducible, its tests are green, the Phase 6.3 failure evidence is retained, and the next implementation entry point is documented.
