# Reality Studio Asset Database v1.4

Reality Studio now has a project-level asset database on top of the v1.3
continuity ledger. The database turns source changes into a deterministic
change plan, preserves stable asset identity, and materializes content-
addressed runtime payloads in a reusable cache.

## Flow

```text
source roots
  -> deterministic scan
  -> added / changed / unchanged / missing plan
  -> stable asset record and generation
  -> content-addressed derived cache
  -> project database and sync receipt
```

The cache key binds the asset identity, source hash, importer, profile, kind,
MIME, size, and dependency list. A source edit therefore creates a new cache
artifact without deleting the previous artifact. Missing files remain in the
project as `missing` records so references can be repaired explicitly.

## CLI

```bash
npm run asset-database-plan --prefix apps/reality-studio
npm run asset-database-sync --prefix apps/reality-studio
node apps/reality-studio/src/cli.mjs asset-database-watch \
  --project apps/reality-studio/examples/冰境试炼.unified-project.json \
  --source-root apps/reality-studio/examples --once
```

`asset-database-watch` performs one safe poll by default. Add
`--auto-sync --duration 10000` for a bounded watch session. The runtime API
exposes the same operations through `asset-database-plan` and
`asset-database-sync` commands on a unified session.

## Evidence

- `reality-studio.asset-change-plan.v1.4` records source changes and cache
  status without embedding machine-specific absolute paths.
- `reality-studio.asset-derived-artifact.v1.4` seals each cached payload.
- `reality-studio.asset-database-sync.v1.4` records the applied operations and
  cache index root.
- The unified project export includes `asset_database.json` and binds its root
  into the asset manifest and build plan.

This is an incremental production layer, not a substitute for format-specific
GLB/FBX importers, texture compression, or a distributed asset farm.
