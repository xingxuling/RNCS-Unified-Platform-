# Aetherworld

Aetherworld is a local-first AI civilization workbench and experimental operating system for building structured decision engines, model bloodlines, training/data pipelines, and creator-facing AI workflows.

The project is not just a UI demo. It is a growing system composed of:

- **Aetherworld** — the mother matrix: the main product body, function hub, registry, data factory, training factory, and governance surface.
- **AetherSeed** — the bloodline / child line: the local model lineage, Ollama wrapper, feedback dataset path, and future SFT/LoRA evolution track.
- **Function lines** — MSL, Sequence AI, Intake Forge, Dataset Builder, Training Factory, Model Forge, Local Bridge, Provider tools, Registry, Store, Agent workflows, and related runtime modules.

## Current status

This repository is under active development. The current focus is engineering consolidation and AetherSeed kernel formation:

1. Canonical module / engine / route registry.
2. AetherSeed tiny training smoke pipeline.
3. Ollama-callable `aetherseed-tiny` wrapper.
4. Safe local task discovery bridge.
5. AetherSeed Kernel contracts for event → judgement → next action → feedback sample.

The project intentionally separates **planning**, **dry-run**, **recording**, and **execution**. High-risk local actions should remain gated by explicit confirmation.

## Tech stack

Main app:

- React 19
- TypeScript
- TanStack Router / TanStack Start
- Vite
- Tailwind CSS
- Radix UI
- WebLLM / Ollama provider experiments

Tooling / sidecar workspaces:

- Python scripts for AetherSeed training, local scanning, kernel records, and feedback dataset generation.
- Ollama wrapper files for local model identity.
- JSON Schema contracts for AetherSeed kernel records.

## Quick start

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Format:

```bash
npm run format
```

## AetherSeed local model

AetherSeed currently has an Ollama wrapper model path. The wrapper is not yet a fine-tuned model; it is a local identity around an existing Ollama base model plus AetherSeed system behavior.

Create the local wrapper:

```powershell
ollama create aetherseed-tiny -f tools/aetherseed-training/ollama/Modelfile.aetherseed-tiny
```

Run it:

```powershell
ollama run aetherseed-tiny
```

Default base model:

```text
qwen3:8b
```

If the base model is missing:

```powershell
ollama pull qwen3:8b
```

For local clients that use an OpenAI-compatible endpoint, the user environment may use:

```text
http://localhost:11435/v1
```

For native Ollama scripts, use the native base URL without `/v1`:

```text
http://localhost:11435
```

## AetherSeed training smoke path

The minimal training package lives under:

```text
tools/aetherseed-training/
```

Typical CPU smoke run:

```powershell
cd tools/aetherseed-training
python prepare_dataset.py --input data/smoke/aetherseed_tiny.jsonl --output data/processed/aetherseed_tiny_tokens.npz
python train_tiny_clm.py --dataset data/processed/aetherseed_tiny_tokens.npz --out-dir outputs/smoke-run --device cpu --steps 10 --batch-size 2 --block-size 32 --n-embd 32 --n-head 4 --n-layer 1
python eval_smoke.py --checkpoint outputs/smoke-run/tiny_clm.pt --dataset data/processed/aetherseed_tiny_tokens.npz --device cpu --prompt AetherSeed
```

Generated checkpoints, processed datasets, and metrics should remain local and should not be committed.

## AetherSeed Local Bridge

The local bridge is a safe, read-only scanner. It does not give the model native access to the computer. Instead, it scans user-specified directories and produces a JSON summary that can be given to AetherSeed for analysis.

```powershell
python tools/aetherseed-local-bridge/scanner.py --root C:\Users\User\Documents\Playground --out outputs/task_scan.json
```

Then analyze the JSON with:

```powershell
ollama run aetherseed-tiny
```

The model should only reason over the provided summary and must not claim direct access to the computer.

## AetherSeed Kernel

The AetherSeed Kernel defines the minimal life loop:

```text
Observe -> Record -> Judge -> Gate -> Act/Defer -> Feedback -> Compile
```

Kernel folder:

```text
tools/aetherseed-kernel/
```

Core contracts:

- `event.schema.json`
- `judgement.schema.json`
- `next_action.schema.json`
- `feedback_sample.schema.json`

Useful commands:

```powershell
python tools\aetherseed-kernel\validate_samples.py
python tools\aetherseed-kernel\record_event.py --input tools\aetherseed-kernel\samples\event.sample.json --dry-run
python tools\aetherseed-kernel\record_event.py --input tools\aetherseed-kernel\samples\feedback_sample.sample.json
python tools\aetherseed-kernel\build_feedback_dataset.py
```

The kernel is designed to convert local events and accepted judgements into safe feedback samples for future AetherSeed SFT/LoRA training.

## Safety model

Aetherworld and AetherSeed should preserve these invariants:

- No fake capability claims: the model must not claim it scanned, edited, or executed unless a tool provided evidence.
- Secrets, API keys, credentials, Full60 material, and Founder-only material must not enter exportable datasets.
- Local scanning must be explicit and directory-scoped.
- High-risk actions should go through dry-run and confirmation gates.
- Model wrappers must be clearly labeled as wrappers unless real fine-tuned weights are produced.
- Training outputs and local records should not be committed unless intentionally sanitized.

Permission levels:

```text
READ_ONLY            Observe or analyze only.
DRAFT                Generate draft text, prompt, patch plan, or runbook only.
DRY_RUN              Simulate or produce commands without execution.
CONFIRM_TO_EXECUTE   Requires explicit user confirmation before execution.
BLOCKED              Must not proceed.
```

## Development workflow

Recommended workflow for risky changes:

1. Create a branch.
2. Make the smallest safe change.
3. Avoid touching provider/gateway/secret/safety/training execution files unless the task explicitly requires it.
4. Run relevant validation.
5. Open a draft PR.
6. Review before merging.

Suggested validation commands:

```bash
npm run build
npm run lint
```

For AetherSeed kernel-only changes:

```powershell
python tools\aetherseed-kernel\validate_samples.py
```

## Roadmap

Near-term priorities:

1. Stabilize AetherSeed kernel schemas and record chain.
2. Connect scanner outputs into event records.
3. Add prompt generation from event records for `aetherseed-tiny`.
4. Add human acceptance markers for useful judgements/actions.
5. Build feedback datasets for future SFT/LoRA.
6. Keep Aetherworld as the mother matrix while allowing AetherSeed to evolve into a lightweight, portable child product.

Longer-term possibilities:

- AetherSeed SFT/LoRA model lineage.
- GGUF/Ollama import for fine-tuned AetherSeed variants.
- Desktop or installable shell after the kernel loop stabilizes.
- Aetherworld function-line integration: Dataset Builder, Training Factory, Registry, Record Center, Scheduler, Agent Runtime, and Provider systems.

## Repository note

This repository is private and experimental. Treat all internal data, generated records, local model artifacts, and training outputs as sensitive unless explicitly sanitized for export.
