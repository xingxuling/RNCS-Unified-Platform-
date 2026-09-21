# RNCS Anime Forge Phase 6.6 — Human Visual Review Workspace

## Purpose

`Reality Studio · Native Drawing Review` is the read-only Human Visual Gate for the Phase 6.6 Native Anime Drawing candidate.

It exists to keep three different facts separate:

1. **Spatial engineering evidence** — whether the final DrawingIR actually consumed the six intended visual organs.
2. **Temporal engineering evidence** — whether the final post-Cage / post-Presentation SVG sequence remains stable within each Cut.
3. **Human visual acceptance** — whether a human reviewer accepts the actual video and static views.

A machine PASS on the first two axes does **not** imply Human Visual Acceptance.

---

## Open the workspace

Start Reality Studio normally, then open:

```text
/native-drawing-review.html
```

The page is intentionally standalone and reads evidence through the browser File API. It does not require a new server-side write endpoint.

It has no authority to modify:

- Episode Production IR
- Character Genome
- Canonical Morphology
- Candidate branch selection
- Git / PR state

It only reads an artifact bundle and may export `human-visual-review.json`.

---

## Expected Phase 6.6 artifact contents

The page expects the Phase 6.6 artifact directory produced by the clean-runner workflow.

### Spatial evidence

```text
head-surface-evidence.json
face-surface-evidence.json
hair-surface-evidence.json
garment-surface-evidence.json
cel-shading-evidence.json
mesh-silhouette-evidence.json
direct-visual-bridge.json
```

The six required spatial axes are:

1. Head Surface
2. Face SurfaceAttachment / Visibility
3. Hair / Scalp Surface
4. Garment Surface
5. Cel Shading / NormalBuffer
6. Weighted Mesh / Visibility

### Temporal evidence

```text
temporal-drawing-stability-evidence.json
temporal-evidence-bridge.json
```

Temporal stability is a separate axis from spatial evidence. A valid state may therefore be:

```text
spatial = PASS
temporal = FAIL
human = BLOCKED
```

### Root binding

```text
evidence-ledger.json
evidence-summary.json
phase-status.json
frame-manifest.json
```

### Media

```text
episode.mp4
static-gates/front.png
static-gates/three-quarter-right.png
static-gates/side.png
```

The MP4 is required before `accepted` can be issued.

---

## Loading rules

### Load Artifact Directory

The **Load Artifact Directory** control uses replacement semantics.

Selecting a new artifact directory clears:

- previously loaded files
- previously parsed JSON
- previous Human Review draft
- previous Object URLs / media preview

This prevents an old `episode.mp4` or old evidence file from remaining in memory and being combined with a new evidence bundle.

### Supplemental files

The **Supplemental files** control uses merge semantics.

Typical use:

```text
human-visual-review.json
```

Supplemental files must never be used to combine two engineering evidence bundles.

---

## Evidence integrity rules

The Review Model verifies cross-root consistency before Human Accept is enabled.

### Spatial root binding

Each spatial evidence root must match:

```text
DirectVisualBridge
→ Evidence Ledger
→ Evidence Summary
```

### Temporal root binding

The temporal evidence root and temporal report root must match:

```text
TemporalEvidenceBridge
→ Evidence Ledger
→ Evidence Summary
```

### Integrity failure

Any root mismatch produces:

```text
overall_status = integrity-failed
ready_for_human_review = false
```

No `accepted` review may be generated in this state.

---

## Body visibility semantics

The workspace displays the three-state visibility contract for body semantic groups:

### visible

```text
canonical-present + visible
```

The part exists in canonical morphology and has a visible weighted surface in the current view.

### occluded

```text
canonical-present + occluded
```

The part exists but is fully hidden by current visibility. It must not be replaced by a legacy fake path.

### canonical-missing

```text
canonical-missing
```

The expected body semantic group does not exist in canonical geometry. This is an engineering failure, not an occlusion.

---

## Temporal diagnostics

The Temporal panel reports the final post-Cage, post-Presentation SVG sequence.

The analyzer compares adjacent frames **only within the same Cut**.

It reports at least:

- same-Cut pair count
- core operation missing count
- core topology change count
- non-finite geometry count
- maximum normalized core displacement
- p95 normalized core displacement
- mean operation churn
- p95 operation churn
- Cel path churn
- body visibility-state transitions

Cut boundaries are excluded from temporal comparisons.

---

## Human decision states

Allowed states:

```text
pending
accepted
rejected
revision-requested
```

### accepted

`accepted` is enabled only when:

```text
all required evidence present
AND spatial evidence PASS
AND temporal evidence PASS
AND root integrity PASS
AND episode.mp4 present
```

This only permits a human reviewer to record acceptance. It does not automatically commit or merge anything.

### rejected

Use when the visual output should not proceed without a new candidate.

### revision-requested

Use when the architecture remains useful but the current visual candidate requires another repair iteration.

### pending

Use when the reviewer has not completed visual inspection.

---

## Review artifact

The page exports:

```text
human-visual-review.json
```

Schema:

```text
apps/reality-studio/schemas/human-visual-review.v0.1.schema.json
```

The exported review binds the current:

- Ledger root
- DirectVisualBridge root
- Temporal evidence root
- engineering status snapshot

and always records:

```text
automatic_selection = false
automatic_commit = false
episode_authority_unchanged = true
```

---

## Stale-review protection

A Human Review is valid only for the exact evidence bundle against which it was created.

If any of these change:

```text
Ledger root
DirectVisualBridge root
Temporal evidence root
```

then an old Human Review is considered stale.

In particular, an `accepted` review from an older artifact must **not** authorize a newer artifact.

The Review Model will fall back to the engineering bundle's current Human status and report a stale-root error.

---

## Final Phase 6.6 promotion rule

Phase 6.6 may not be promoted solely because:

- the code exists
- focused tests pass
- the full regression passes
- six spatial evidence roots pass
- temporal stability passes
- FFmpeg produces an MP4

The final promotion condition remains:

```text
Clean Runner PASS
+ Evidence Bundle PASS
+ Human Visual Review of the actual artifact
```

Human acceptance is never inferred from engineering evidence.
