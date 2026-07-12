# AetherSeed Kernel Contracts

AetherSeed Kernel is the minimal life-loop layer for AetherSeed before any desktop shell or autonomous execution layer.

It defines the local-first, auditable loop:

```text
Observe -> Record -> Judge -> Gate -> Act/Defer -> Feedback -> Compile
```

The kernel does **not** give the model direct computer or GitHub access. It only accepts explicit evidence from approved sources such as scanners, Aetherworld registries, exported datasets, user-provided text, and tool results.

## Current scope

This folder contains JSON Schema contracts, sample fixtures, a local record appender, an event-to-prompt builder, and a conservative feedback dataset builder. It does not modify Aetherworld runtime behavior.

```text
tools/aetherseed-kernel/
  schemas/
    event.schema.json
    judgement.schema.json
    next_action.schema.json
    feedback_sample.schema.json
  samples/
    event.sample.json
    judgement.sample.json
    next_action.sample.json
    feedback_sample.sample.json
  validate_samples.py
  prompt_from_event.py
  record_event.py
  build_feedback_dataset.py
```

Generated local outputs are ignored by `.gitignore`:

```text
records/
datasets/
prompts/
*.jsonl
*.manifest.json
*.prompt.txt
```

## Contract roles

| Contract | Purpose |
|---|---|
| `event.schema.json` | Records an observed local event or evidence package. |
| `judgement.schema.json` | Records AetherSeed's structured analysis over an event. |
| `next_action.schema.json` | Records a proposed gated next action. |
| `feedback_sample.schema.json` | Converts event/judgement/action outcomes into future training material. |

## Safety principles

AetherSeed Kernel must preserve these invariants:

1. Explicit local boundary: only user-specified roots, files, events, or summaries are processed.
2. No fake capability: AetherSeed must not claim it scanned or executed unless a tool provided evidence.
3. Secrets do not enter the record chain: tokens, keys, credentials, and private raw secrets are redacted or represented only as risk flags.
4. Founder-only / Full60 material must not be exported into public or general training samples.
5. High-risk actions require a gate before execution.
6. Records must be traceable enough to become future training/evaluation data.

## Permission levels

```text
READ_ONLY            Observe or analyze only.
DRAFT                Generate draft text, prompt, patch plan, or runbook only.
DRY_RUN              Simulate or produce commands without execution.
CONFIRM_TO_EXECUTE   Requires explicit user confirmation before execution.
BLOCKED              Must not proceed.
```

## Local commands

Run from the repository root.

### Validate schema/sample wiring

```powershell
python tools\aetherseed-kernel\validate_samples.py
```

If the optional `jsonschema` package is installed and strict Draft 2020-12 validation is required:

```powershell
python tools\aetherseed-kernel\validate_samples.py --require-jsonschema
```

The validator checks:

- sample fixture structure if `jsonschema` is available
- malicious feedback safety case: `containsSecrets=true + exportAllowed=true` must be rejected
- `judgement -> next_action` join
- `event -> judgement -> next_action -> feedback_sample` lineage join

### Build an AetherSeed prompt from an event

Print a Chinese prompt to stdout:

```powershell
python tools\aetherseed-kernel\prompt_from_event.py --event tools\aetherseed-kernel\samples\event.sample.json
```

Write the prompt to an ignored local file:

```powershell
python tools\aetherseed-kernel\prompt_from_event.py --event tools\aetherseed-kernel\samples\event.sample.json --out tools\aetherseed-kernel\prompts\event_prompt.txt
```

English prompt:

```powershell
python tools\aetherseed-kernel\prompt_from_event.py --event tools\aetherseed-kernel\samples\event.sample.json --language en
```

Then analyze it with the local Ollama wrapper:

```powershell
ollama run aetherseed-tiny
```

Paste the generated prompt into the Ollama session. The prompt explicitly tells AetherSeed to analyze only the provided event JSON and not to claim direct computer, GitHub, or command execution access.

### Dry-run record append

```powershell
python tools\aetherseed-kernel\record_event.py --input tools\aetherseed-kernel\samples\event.sample.json --dry-run
```

### Append sample records to the local JSONL log

```powershell
python tools\aetherseed-kernel\record_event.py --input tools\aetherseed-kernel\samples\event.sample.json
python tools\aetherseed-kernel\record_event.py --input tools\aetherseed-kernel\samples\judgement.sample.json
python tools\aetherseed-kernel\record_event.py --input tools\aetherseed-kernel\samples\next_action.sample.json
python tools\aetherseed-kernel\record_event.py --input tools\aetherseed-kernel\samples\feedback_sample.sample.json
```

Default log:

```text
tools/aetherseed-kernel/records/kernel_events.jsonl
```

### Build feedback dataset

Dry-run:

```powershell
python tools\aetherseed-kernel\build_feedback_dataset.py --dry-run
```

Write exportable samples:

```powershell
python tools\aetherseed-kernel\build_feedback_dataset.py
```

Default dataset output:

```text
tools/aetherseed-kernel/datasets/feedback_samples.jsonl
```

Only `aetherseed.feedback_sample.v1` records with `exportAllowed=true` and no secrets / Full60 / Founder-only flags are exported.

## Minimum manual loop

```text
1. Produce an event JSON from a scanner, registry slice, user note, or tool result.
2. Build an AetherSeed prompt with prompt_from_event.py.
3. Ask aetherseed-tiny to produce a structured judgement.
4. Convert the accepted judgement into a judgement JSON record.
5. Propose a next_action JSON record.
6. Append records with record_event.py.
7. Export safe accepted feedback samples with build_feedback_dataset.py.
```

The current scripts cover steps 2, 6, and 7. Steps 1, 4, and 5 are intentionally still explicit/human-supervised until the record chain stabilizes.

## How this fits Aetherworld

Aetherworld remains the mother matrix: it provides function lines such as canonical registry, scanner, intake forge, dataset builder, training factory, provider registry, scheduler, record center, and world engine.

AetherSeed is the bloodline/child line: it can become a portable local brain, but it should grow through explicit evidence, records, gates, feedback, and compilation rather than pretending to have native access to everything.

The child can eventually become more portable and user-facing than the mother matrix, but the kernel must first preserve the life-loop contracts that allow safe growth and feedback into Aetherworld.

## Next implementation step

After these contracts and scripts are stable:

1. Connect scanner outputs into `event.schema.json` records.
2. Add a judgement capture helper for converting accepted AetherSeed output into `judgement.schema.json`.
3. Add a human acceptance marker so accepted judgements/actions can become feedback samples.
4. Add a stricter JSON Schema validator dependency or local validation mode if needed.

Do not build a desktop app until the schema and feedback loop are stable.
