# RNCS Anime Forge Phase 6.6 — Local Windows Execution

## Why this exists

The Phase 6.6 GitHub Actions workflow may be unavailable for account-level reasons that occur before a runner starts.

Local execution is an independent execution body for engineering evidence. It does **not** weaken any gate:

```text
focused tests
→ full native morphology regression
→ Reality Studio Human Review browser regression
→ 120-frame media build
→ six spatial evidence proofs
→ temporal stability proof
→ Evidence Ledger binding
→ final verifier
→ Human Visual Review
```

A full local engineering PASS still leaves:

```text
human_visual_acceptance = pending
```

until the actual output is reviewed.

---

## Entry points

### Double-click / cmd.exe

```bat
scripts\run-anime-forge-phase6-6-local.cmd
```

### PowerShell

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\run-anime-forge-phase6-6-local.ps1
```

### Force dependency / browser dependency install

```powershell
scripts\run-anime-forge-phase6-6-local.ps1 -Install
```

When needed, `-Install` may install:

- npm workspace dependencies
- Python Playwright package
- Playwright Chromium

It does not replace the formal librsvg raster backend.

### Custom evidence directory

```powershell
scripts\run-anime-forge-phase6-6-local.ps1 -EvidenceDir tmp\phase66-local
```

Absolute evidence paths are also supported.

### Development-only skip flags

```powershell
scripts\run-anime-forge-phase6-6-local.ps1 -SkipFullRegression
scripts\run-anime-forge-phase6-6-local.ps1 -SkipBrowserReviewRegression
```

Either skip flag forces:

```text
status = development-partial-pass-not-release-evidence
full_validation = false
```

A skipped run must not be presented as full Phase 6.6 validation.

---

## Required core tools

The media/evidence runner requires:

- Node.js
- npm
- `rsvg-convert`
- FFmpeg
- ffprobe

The full local validation additionally requires:

- Python
- Python Playwright
- Chromium available to Playwright

Run the doctor directly:

```powershell
node scripts\phase6-6-doctor.mjs
```

Doctor v0.2 reports two separate readiness states:

```text
ready
full_local_validation_ready
```

`ready` covers core media/evidence prerequisites.

`full_local_validation_ready` additionally requires the browser-review regression stack.

The doctor only validates prerequisites. It does not prove Phase 6.6 correctness.

---

## Tool path overrides

If a tool is not on `PATH`, set one of these environment variables:

```text
PHASE66_NODE_PATH
PHASE66_NPM_PATH
PHASE66_PYTHON_PATH
RSVG_CONVERT_PATH
FFMPEG_PATH
FFPROBE_PATH
```

Example:

```powershell
$env:PHASE66_PYTHON_PATH = 'C:\Python312\python.exe'
$env:FFMPEG_PATH = 'C:\tools\ffmpeg\bin\ffmpeg.exe'
$env:FFPROBE_PATH = 'C:\tools\ffmpeg\bin\ffprobe.exe'
$env:RSVG_CONVERT_PATH = 'C:\tools\librsvg\rsvg-convert.exe'
scripts\run-anime-forge-phase6-6-local.ps1
```

The local runner intentionally does not use the standard Node `NODE_PATH` variable as an executable override.

---

## Formal raster backend boundary

Phase 6.6 currently verifies:

```text
AnimeDrawingIR
→ SVG cubic Bezier output
→ librsvg rasterization
→ PNG sequence
→ FFmpeg media
```

Playwright/Chromium is used only for the **Reality Studio Human Review browser regression**.

Chromium is not silently substituted for librsvg in media evidence.

A future raster backend may be added behind the same DrawingIR contract, but it must receive its own backend receipt and A/B evidence before becoming an accepted Phase 6.6 backend.

---

## What the runner executes

### Focused gates

The script runs Phase 6.6 focused tests for:

- Character Drawing Compiler
- DrawingIR
- DrawingMesh / Cage
- Lower-body morphology
- Lower-body performance
- Surface weighting
- Mesh silhouette / visibility
- Head surface
- Face surface
- Hair surface
- Garment surface
- Cel shading
- Temporal drawing stability
- Full-body drawing
- Drawing presentation
- Reality Studio Native Drawing Review Model / Schema / page contract

### Full regression

Unless `-SkipFullRegression` is supplied:

```powershell
npm test --workspace @taowind/native-character-morphogenesis-runtime
```

### Human Review browser regression

Unless `-SkipBrowserReviewRegression` is supplied:

```powershell
python apps/reality-studio/tests/browser_native_drawing_review_test.py
```

The browser regression starts a real Reality Studio server and verifies:

- Artifact directory upload through `webkitdirectory`
- Spatial / Temporal / Integrity status
- Accept button gating
- visible / occluded / canonical-missing display
- Front / 3/4 / Side preview wiring
- Human Review export
- replacement semantics when loading a different artifact
- stale accepted review rejection
- desktop and mobile layout screenshots

The browser test uses a synthetic evidence bundle because its purpose is to validate the **review product and authority boundaries**. Real Phase 6.6 media/evidence is validated separately by the actual build and evidence verifiers.

### Media build

The runner builds:

```text
5 seconds
120 frames
24 fps
1280 × 720
SVG → librsvg PNG → FFmpeg MP4
```

### Spatial evidence

It builds and verifies:

1. Head Surface
2. Face SurfaceAttachment / Visibility
3. Hair / Scalp
4. Garment Surface
5. Cel Shading / NormalBuffer
6. Weighted Mesh / Visibility

### Temporal evidence

It verifies the final post-Cage, post-Presentation SVG sequence.

### Binding

Finally it binds spatial and temporal roots into the Evidence Ledger and runs the Phase 6.6 bundle verifier.

---

## Successful output

Default output directory:

```text
tmp/anime-forge-phase6-6-local-evidence
```

Expected important files include:

```text
episode.mp4
frame-manifest.json
evidence-ledger.json
evidence-summary.json
direct-visual-bridge.json
temporal-drawing-stability-evidence.json
temporal-evidence-bridge.json
local-validation-summary.json
static-gates/front.png
static-gates/three-quarter-right.png
static-gates/side.png
```

A full local summary records:

- `status = engineering-evidence-passed-awaiting-human-review`
- `full_validation = true`
- MP4 SHA-256
- Ledger root
- DirectVisualBridge root
- Temporal evidence root
- Temporal report root
- Browser Review regression = passed
- Full regression = passed
- Human Gate = pending

If any dev-only skip flag is used, the summary is downgraded and cannot be used as full validation evidence.

---

## Human review after local PASS

Open Reality Studio and navigate to:

```text
/native-drawing-review.html
```

Load the complete local evidence directory using **Load Artifact Directory**.

The page uses replacement semantics for a new artifact directory, so files from a previously reviewed artifact cannot remain in memory and contaminate the new bundle.

Review:

- MP4
- Front / 3/4 / Side static gates
- six spatial evidence axes
- visible / occluded / canonical-missing states
- Temporal diagnostics
- root integrity

Then choose one:

```text
accepted
rejected
revision-requested
pending
```

If desired, export:

```text
human-visual-review.json
```

The review is bound to the exact Ledger / Spatial Bridge / Temporal roots. A review from an older artifact becomes stale when those roots change.

---

## Evidence boundary

A **full** successful local run means:

```text
local engineering evidence = PASS
local Human Review browser regression = PASS
```

It does **not** mean:

```text
GitHub clean-runner CI = PASS
Human visual acceptance = accepted
Commercial anime quality = proven
```

Those remain separate claims.
