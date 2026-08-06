# Phase 5 Visual Provider Preparation

## Current result

The audited Windows machine is blocked for visual replacement. No model or Provider binary was downloaded, no remote API was called, and no secret value was recorded. The only selected execution route is the local external-process Provider:

`rncs.visual.local-diffusion-video-worker`

The adapter is real, but it reports `MODEL_MISSING` until the preparation gates below are satisfied. It never falls back to the Phase 4 rasterizer and never turns a contract-only receipt into media evidence.

## Required preparation

1. Provide a licensed image/video model with a stable revision, weight path, weight SHA-256, byte size and license source.
2. Provide an actual worker executable or wrapper that performs condition/keyframe/motion-video/temporal-repair work and writes real PNG frames.
3. Provide a GPU or other explicitly validated execution device with enough memory for the selected model. The manifest currently declares an 8 GB VRAM floor as a planning requirement, not as proof that the local machine meets it.
4. Provide raster character references for front, three-quarter, side, full-body and face-closeup views. SVG-only or placeholder references fail the pack validator.
5. Provide complete pose, depth, normal, edge, semantic-mask, camera, layer-order and temporal-context condition inputs.
6. Run the 5–8 second, 1280x720, 24 fps quality shot and review the ordinary viewer output before any selection or commit receipt is created.

## Local configuration

Only these non-secret configuration names are read by the adapter:

```text
VISUAL_PROVIDER_EXECUTABLE=<path to the worker executable>
VISUAL_PROVIDER_ARGS_JSON=["optional","worker","arguments"]
```

The worker receives `--input <visual-provider-input.json>` and `--output <frames-directory>`. A successful worker must write files matching `frame-000000.png`, `frame-000001.png`, and so on. The adapter validates PNG signatures, frame count and output roots, then writes a frame manifest and execution receipt.

The input contract contains Episode Intent, Shot Intent, Character Identity, Reference Pack, Condition Pack, Model Manifest, seed, sampler, scheduler, parameters, resolution, frame rate and output directory. The adapter records arguments and failure tails, but does not record secret environment values.

## Model manifest gate

The model manifest is not complete until `model_id`, `model_revision`, `weight_sha256`, positive `weight_bytes`, a non-missing SPDX/license source and a runtime declaration are present. A model may be non-deterministic; in that case the candidate must record model revision, parameters, seed, input roots, runtime and GPU details.

## Acceptance boundary

Installing a model or producing a candidate does not mean the candidate is accepted. Identity continuity, temporal stability, spatial consistency, motion, seam checks, rights and human visual acceptance remain separate gates. Human acceptance must be recorded by an identified human reviewer. Generated pixels cannot mutate the Character Genome or Episode Intent roots.
