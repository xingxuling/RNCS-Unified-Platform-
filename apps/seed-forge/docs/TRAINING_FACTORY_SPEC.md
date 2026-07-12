# Training Factory Specification

> **Repository:** aether-seed-forge  
> **Status:** Specification (documentation only — no runtime changes)  
> **Related:** [FACTORY_ARCHITECTURE.md](./FACTORY_ARCHITECTURE.md) §3.C Training Factory  
> **Primary sources:** `src/seed-runtime/seedRuntime.ts`, `demo.ts`, `integration-demo.ts`, `UniverseForgeService.ts`

---

## 1. Training Factory purpose

The **Training Factory** is the third factory layer in the AetherWorld kernel. It does **not** train models. It **records** the outcome of `SEEDRuntime` simulation cycles and serializes them into **reusable, auditable training samples** for future AetherWorld fine-tuning, rule distillation, or evaluation.

### 1.1 Problem statement

`SEEDRuntime.executeCycle()` already produces rich causal traces:

- **Sense** — time index advance, nine-core entity adjustments (`sensePhase`)
- **Structure** — fate-graph reachability prep (`structurePhase`, currently non-mutating)
- **Project** — timeline advancement, weighted arc selection, branching, correction events, pruning (`projectPhase`)

`RuntimeCycleResult` exposes only `{ worldState, triggeredEvents }`. Demos (`demo.ts`, `integration-demo.ts`) log summaries to `console` but **do not persist** per-cycle before/after deltas. `UniverseForgeService` produces universe **inputs** (COSMO…TFS) but does not connect to cycle logs.

The Training Factory closes that gap by treating each cycle as a **labeled transition**:

```text
(inputWorldState, runtime action semantics, outputWorldState, supervision signals)
```

### 1.2 Outputs (future consumers)

| Consumer | Use |
|----------|-----|
| AetherWorld LLM alignment | Learn fate/timeline/convergence language from real simulation traces |
| Scenario classifiers | Predict `correctionTriggered` / `branchTriggered` from `globalParameters` |
| Regression tests | Golden JSONL fixtures for `executeCycle` parity |
| Evaluation dashboard | Aggregate `qualityScore` and convergence drift |

### 1.3 Non-goals (this spec)

- Modifying `SEEDRuntime` internals
- Invoking external APIs or training jobs
- Replacing `UniverseForge` or `UniverseForgeService` generation logic

---

## 2. Training sample schema

Each **training sample** represents **one** `executeCycle()` transition. Samples are immutable once written.

### 2.1 Type: `TrainingSample`

| Field | Type | Description |
|-------|------|-------------|
| `runId` | `string` | Stable identifier for a simulation session (e.g. `run-20260526-aetherion-001`). Shared across all cycles in one batch. |
| `cycleIndex` | `number` | Zero-based index within `runId` (`0` = first `executeCycle` after logger attach). |
| `inputWorldState` | `WorldState` | Deep clone of world state **immediately before** `executeCycle()` mutates runtime state. |
| `outputWorldState` | `WorldState` | `RuntimeCycleResult.worldState` (post-cycle). |
| `action` | `CycleAction` | Derived semantic label for what the runtime did this cycle (see §2.2). |
| `triggeredEvents` | `Event[]` | Copy of `RuntimeCycleResult.triggeredEvents`. |
| `timelineChanges` | `TimelineChangeSet` | Structured diff of `activeTimelines` (see §2.3). |
| `convergenceBefore` | `number` | Global convergence mean over `ACTIVE` timelines before cycle (same formula as `computeGlobalConvergence` in `seedRuntime.ts`). |
| `convergenceAfter` | `number` | Global convergence after cycle. |
| `convergenceDelta` | `number` | `convergenceAfter - convergenceBefore`. |
| `globalParametersBefore` | `GlobalParameters` | Snapshot before cycle. |
| `globalParametersAfter` | `GlobalParameters` | Snapshot after cycle. |
| `activeTimelineCountBefore` | `number` | Count of timelines with `status === "ACTIVE"` before. |
| `activeTimelineCountAfter` | `number` | Count after. |
| `correctionTriggered` | `boolean` | `true` if any triggered event has `name === "结构校正事件"`. |
| `branchTriggered` | `boolean` | `true` if any event has `timelineEffect.createBranchFromTimelineId` or name `时间线分支`. |
| `mergeTriggered` | `boolean` | `true` if any event has `timelineEffect.mergeTimelineIds` **or** a new timeline `id` starts with `merged-`. |
| `collapseTriggered` | `boolean` | `true` if any timeline newly transitioned to `COLLAPSED` (see §2.3). |
| `metadata` | `TrainingSampleMetadata` | Provenance and reproducibility (see §2.4). |
| `qualityScore` | `number` | `0.0–1.0` heuristic suitability for training (see §2.5). |

### 2.2 `CycleAction` (derived, not stored inside runtime today)

Because `SEEDRuntime` does not emit an explicit action object, `TrainingSampleBuilder` **infers** `action` from state diffs and events:

```ts
interface CycleAction {
  phase: "SENSE_STRUCTURE_PROJECT"; // single public executeCycle() today
  timelineSteps: Array<{
    timelineId: string;
    fromNodeId: string;
    toNodeId: string;
    arcId?: string;
    convergenceDelta: number;
  }>;
  prunedTimelineIds?: string[];
  randomnessNote?: "NON_DETERMINISTIC"; // present when Math.random() used without fixed seed
}
```

**Inference rules (aligned with `projectPhase`):**

1. For each `ACTIVE` timeline, if `currentNodeId` changed → append to `timelineSteps`.
2. If `activeTimelineCountAfter > activeTimelineCountBefore` → branch likely (correlate with `branchTriggered`).
3. If count decreased or statuses include new `COLLAPSED` → collapse/prune (correlate with `collapseTriggered`).
4. `sensePhase` effects: detect `timeIndex` increment and entity `structuralStability` / `fateVector` deltas without timeline movement.

### 2.3 `TimelineChangeSet`

```ts
interface TimelineChangeSet {
  added: Timeline[];      // ids not present before
  removed: Timeline[];    // ids present before, absent after (rare)
  updated: Array<{
    timelineId: string;
    before: Pick<Timeline, "currentNodeId" | "pathHistory" | "convergenceScore" | "status">;
    after: Pick<Timeline, "currentNodeId" | "pathHistory" | "convergenceScore" | "status">;
  }>;
  collapsed: string[];      // timeline ids newly COLLAPSED
}
```

### 2.4 `TrainingSampleMetadata`

```ts
interface TrainingSampleMetadata {
  specVersion: "training-factory/v0.1";
  createdAt: string;          // ISO-8601
  runtimeConfig: SEEDRuntimeConfig;
  universeId: string;
  timeIndexBefore: number;
  timeIndexAfter: number;
  source: "demo" | "integration-demo" | "seed-control-center" | "batch-runner" | "api";
  forgeContext?: {
    generationMethod?: "preset" | "ial" | "ose" | "template" | "procedural";
    cosmosModule?: boolean;   // if preceded by UniverseForgeService.generateCosmos
    ialExpression?: string;
  };
  rngSeed?: string;           // optional; required for deterministic replay claims
}
```

### 2.5 `qualityScore` heuristic (v0.1)

Computed at sample build time only; **not** used by runtime.

| Factor | Weight | Rule |
|--------|--------|------|
| Event richness | 0.25 | `+0.25` if `triggeredEvents.length > 0` |
| Convergence signal | 0.25 | `+0.25` if `|convergenceDelta| >= 0.01` |
| Timeline activity | 0.25 | `+0.25` if `timelineChanges.updated.length > 0` or branch/collapse |
| State validity | 0.25 | `+0.25` if all convergence scores ∈ [0,1] and no NaN |

Penalty: `-0.5` if `inputWorldState` equals `outputWorldState` and no events (degenerate cycle).

Clamp final score to `[0, 1]`.

---

## 3. JSONL export format

- **Encoding:** UTF-8, one JSON object per line (JSONL).
- **File naming:** `training-samples/{runId}.jsonl` or `training-samples/{date}/{runId}.jsonl`.
- **Line order:** Strictly ascending `cycleIndex`.
- **Serialization:** `JSON.stringify(sample)` with no pretty-print; stable key order recommended for diffs.

### 3.1 Example line 1 — normal advance

```jsonl
{"runId":"run-demo-univ-1","cycleIndex":0,"inputWorldState":{"universeId":"univ-1","timeIndex":0,"globalParameters":{"aetherDensity":0.5,"structuralPressure":0.4,"entropyLevel":0.3},"activeTimelines":[{"id":"tl-0","currentNodeId":"n0","convergenceScore":0.5,"status":"ACTIVE","pathHistory":["n0"]}],"entities":[{"id":"e-main","type":"Character"}],"fateGraph":{"nodes":[],"arcs":[]},"civilizations":[],"wLayerState":{},"bLayerConstants":{},"gLayerManifestation":{}},"outputWorldState":{"universeId":"univ-1","timeIndex":1,"globalParameters":{"aetherDensity":0.5,"structuralPressure":0.4,"entropyLevel":0.3},"activeTimelines":[{"id":"tl-0","currentNodeId":"n1","convergenceScore":0.45,"status":"ACTIVE","pathHistory":["n0","n1"]}],"entities":[{"id":"e-main","type":"Character"}],"fateGraph":{"nodes":[],"arcs":[]},"civilizations":[],"wLayerState":{},"bLayerConstants":{},"gLayerManifestation":{}},"action":{"phase":"SENSE_STRUCTURE_PROJECT","timelineSteps":[{"timelineId":"tl-0","fromNodeId":"n0","toNodeId":"n1","convergenceDelta":-0.05}]},"triggeredEvents":[],"timelineChanges":{"added":[],"removed":[],"updated":[{"timelineId":"tl-0","before":{"currentNodeId":"n0","convergenceScore":0.5,"status":"ACTIVE","pathHistory":["n0"]},"after":{"currentNodeId":"n1","convergenceScore":0.45,"status":"ACTIVE","pathHistory":["n0","n1"]}}],"collapsed":[]},"convergenceBefore":0.5,"convergenceAfter":0.45,"convergenceDelta":-0.05,"globalParametersBefore":{"aetherDensity":0.5,"structuralPressure":0.4,"entropyLevel":0.3},"globalParametersAfter":{"aetherDensity":0.5,"structuralPressure":0.4,"entropyLevel":0.3},"activeTimelineCountBefore":1,"activeTimelineCountAfter":1,"correctionTriggered":false,"branchTriggered":false,"mergeTriggered":false,"collapseTriggered":false,"metadata":{"specVersion":"training-factory/v0.1","createdAt":"2026-05-26T12:00:00.000Z","runtimeConfig":{"mainlineOriginName":"杜浩麟","convergenceThreshold":0.4,"maxTimelines":16},"universeId":"univ-1","timeIndexBefore":0,"timeIndexAfter":1,"source":"demo"},"qualityScore":0.75}
```

### 3.2 Example line 2 — correction + branch

```jsonl
{"runId":"run-demo-univ-1","cycleIndex":4,"inputWorldState":{"universeId":"univ-1","timeIndex":4,"globalParameters":{"aetherDensity":0.5,"structuralPressure":0.35,"entropyLevel":0.3},"activeTimelines":[{"id":"tl-0","currentNodeId":"n2","convergenceScore":0.32,"status":"ACTIVE","pathHistory":["n0","n1","n2"]}]},"outputWorldState":{"universeId":"univ-1","timeIndex":5,"globalParameters":{"aetherDensity":0.5,"structuralPressure":0.4,"entropyLevel":0.3},"activeTimelines":[{"id":"tl-0","currentNodeId":"n2","convergenceScore":0.37,"status":"ACTIVE"},{"id":"timeline-branch-1716720000000-abc","currentNodeId":"n1","convergenceScore":0.27,"status":"ACTIVE"}]},"action":{"phase":"SENSE_STRUCTURE_PROJECT","timelineSteps":[],"randomnessNote":"NON_DETERMINISTIC"},"triggeredEvents":[{"id":"evt-correction-5","name":"结构校正事件","structuralEffect":{"globalDelta":{"structuralPressure":0.4}}},{"id":"evt-branch-5-timeline-branch-1716720000000-abc","name":"时间线分支","timelineEffect":{"createBranchFromTimelineId":"tl-0"}}],"timelineChanges":{"added":[{"id":"timeline-branch-1716720000000-abc","status":"ACTIVE"}],"removed":[],"updated":[{"timelineId":"tl-0","before":{"currentNodeId":"n2","convergenceScore":0.32,"status":"ACTIVE"},"after":{"currentNodeId":"n2","convergenceScore":0.37,"status":"ACTIVE"}}],"collapsed":[]},"convergenceBefore":0.32,"convergenceAfter":0.32,"convergenceDelta":0,"globalParametersBefore":{"aetherDensity":0.5,"structuralPressure":0.35,"entropyLevel":0.3},"globalParametersAfter":{"aetherDensity":0.5,"structuralPressure":0.4,"entropyLevel":0.3},"activeTimelineCountBefore":1,"activeTimelineCountAfter":2,"correctionTriggered":true,"branchTriggered":true,"mergeTriggered":false,"collapseTriggered":false,"metadata":{"specVersion":"training-factory/v0.1","createdAt":"2026-05-26T12:00:01.200Z","runtimeConfig":{"mainlineOriginName":"杜浩麟","convergenceThreshold":0.4,"maxTimelines":16},"universeId":"univ-1","timeIndexBefore":4,"timeIndexAfter":5,"source":"demo","rngSeed":"42"},"qualityScore":1.0}
```

> **Note:** Example payloads truncate nested `WorldState` fields for readability. Production export MUST include full `WorldState` per schema or a documented canonical subset policy.

---

## 4. Runtime logging design

All components live **outside** `seedRuntime.ts` and observe via public API only.

### 4.1 `SimulationRunLogger`

**Responsibility:** Session lifecycle and cycle boundaries.

```text
┌──────────────────┐     attach(runId, config)      ┌─────────────────┐
│   SEEDRuntime    │◄──────────────────────────────│ SimulationRun   │
│                  │     getWorldState() before    │ Logger          │
│ executeCycle()   │──────────────────────────────►│                 │
│                  │     RuntimeCycleResult after  │  samples[]      │
└──────────────────┘                               └────────┬────────┘
                                                              │
                                                              ▼
                                                    TrainingSampleBuilder
```

**Public API (proposed):**

```ts
class SimulationRunLogger {
  constructor(runId: string, metadata: Partial<TrainingSampleMetadata>);

  /** Call immediately before runtime.executeCycle() */
  beginCycle(): void;

  /**
   * Call immediately after executeCycle().
   * @param result - return value of executeCycle()
   * @param runtime - same SEEDRuntime instance (for config via future getter or captured config)
   */
  endCycle(result: RuntimeCycleResult, runtime: SEEDRuntime): TrainingSample;

  getSamples(): readonly TrainingSample[];
  reset(): void;
}
```

**Implementation notes:**

- `beginCycle()` calls `runtime.getWorldState()` and stores `inputWorldState` (already returns deep clone per `seedRuntime.ts:207-208`).
- `endCycle()` passes before/after + `result` to `TrainingSampleBuilder`.
- Logger holds `cycleIndex` counter; increments on each `endCycle`.
- Does **not** call `executeCycle` itself.

### 4.2 `TrainingSampleBuilder`

**Responsibility:** Pure functions: `(before, after, result, context) → TrainingSample`.

| Method | Role |
|--------|------|
| `computeGlobalConvergence(timelines)` | Mirror `computeGlobalConvergence` logic (duplicate in training module to avoid importing private runtime helpers). |
| `diffTimelines(before, after)` | Produce `TimelineChangeSet`. |
| `inferCycleAction(before, after, events)` | Build `CycleAction`. |
| `detectFlags(events, timelineChanges)` | Set boolean triggers. |
| `scoreSample(sample)` | Compute `qualityScore`. |

**Purity:** No side effects; safe for unit tests with fixtures from `demo.ts` initial state.

### 4.3 `JSONLExporter`

**Responsibility:** Serialize samples to disk or `Blob` (browser).

```ts
class JSONLExporter {
  static serializeLine(sample: TrainingSample): string;
  static serializeAll(samples: TrainingSample[]): string;
  static async writeFile(path: string, samples: TrainingSample[]): Promise<void>; // Node
  static downloadBrowser(filename: string, samples: TrainingSample[]): void;     // DOM
}
```

**Deterministic export:**

- Sort samples by `cycleIndex` before write.
- Optional `canonicalize(worldState)` strips non-semantic fields if size is a concern (future).
- Record `metadata.rngSeed` when caller wraps `Math.random` (see §6.2).

---

## 5. File structure proposal

```text
src/training/
  types.ts                 # TrainingSample, CycleAction, TimelineChangeSet, metadata
  SimulationRunLogger.ts     # Session + cycle boundary observer
  TrainingSampleBuilder.ts # Pure builders + convergence/diff helpers
  JSONLExporter.ts         # JSONL serialization + download/write helpers
  demo.ts                  # CLI/browser demo: replay demo.ts loop with export
  index.ts                 # Public exports (optional)
```

**Dependency direction (enforced):**

```text
src/training/*  →  may import from  src/seed-runtime/seedRuntime.ts (types + SEEDRuntime class)
src/seed-runtime/*  →  must NOT import from  src/training/*
```

**`demo.ts` behavior (proposed):**

1. Reuse or mirror `src/seed-runtime/demo.ts` initial `WorldState`.
2. Instantiate `SEEDRuntime` + `SimulationRunLogger`.
3. Run `N` cycles with logger wrapped calls.
4. Write `training-samples/run-demo-univ-1.jsonl` via `JSONLExporter`.
5. Print summary: mean `qualityScore`, count of correction/branch samples.

**`integration-demo.ts` extension (future, optional):** After `UniverseForgeAdapter.convertToWorldState`, attach logger with `forgeContext.generationMethod: "ial"`.

---

## 6. Integration plan

### 6.1 Principle: observe at call site, not inside runtime

`SEEDRuntime.executeCycle()` remains unchanged. Integration uses a **wrapper pattern** at every call site:

```ts
// Pseudocode — new code only in training/demo or UI opt-in
logger.beginCycle();
const result = runtime.executeCycle();
const sample = logger.endCycle(result, runtime);
```

**Current call sites to wrap (when implementing):**

| Location | Notes |
|----------|-------|
| `src/seed-runtime/demo.ts` | Batch `executeCycles` — wrap inside loop or replace with explicit logger calls |
| `src/seed-runtime/integration-demo.ts` | Log forge → runtime pipeline |
| `src/components/SeedControlCenter.tsx` | `doOneStep` / auto-run — opt-in export button |
| `src/seed-runtime/seedRuntime.ts` `executeCycles` | **Do not modify**; consumers wrap per iteration |

### 6.2 Determinism and `Math.random()`

`projectPhase` uses `Math.random()` for arc selection, branching (30% gate), and branch timeline ids (`Date.now()`). For reproducible JSONL:

| Approach | Impact on runtime |
|----------|-------------------|
| **A. Record-only** | Export samples as-is; set `action.randomnessNote = "NON_DETERMINISTIC"` | None |
| **B. Seeded PRNG injection** | Future optional `SEEDRuntime` config — **out of scope** for v0.1 | Would require runtime change |
| **C. Pre-cycle snapshot replay** | Store full before/after states; replay does not need same random draws | None |

**v0.1 recommendation:** Approach **A** + mandatory `metadata.rngSeed` field when host environment patches `Math.random` (test-only harness in `src/training/demo.ts`, not in `seedRuntime.ts`).

### 6.3 Relationship to `UniverseForgeService`

`UniverseForgeService` provides **initial conditions**, not cycle logs:

| Service method | Training Factory usage |
|----------------|------------------------|
| `generateUniverse` / `generateCosmos` / `generateCivilization` | Populate `metadata.forgeContext`; feed `UniverseForgeAdapter` → initial `WorldState` |
| `generateCharacter` / `generateFateStructure` / `generateEvent` / `generateTimeline` | Stub DTOs — **do not** mix into cycle samples until backed by real `WorldState` mutations |

**Pipeline:**

```text
UniverseForgeService → GenerationResult
        → UniverseForgeAdapter.convertToWorldState()
        → new SEEDRuntime(worldState, config)
        → SimulationRunLogger (N cycles)
        → JSONLExporter
```

### 6.4 Storage backends (v0.1)

| Environment | Backend |
|-------------|---------|
| Browser | `Blob` + download; optional IndexedDB adapter (future) |
| Node / CLI | `fs.writeFile` under `training-samples/` (gitignored) |

No server upload in v0.1.

---

## 7. Safety rules

| Rule | Rationale |
|------|-----------|
| **No mutation of runtime logic** | `seedRuntime.ts` phase bodies are frozen for this initiative. |
| **Logger observes only** | Uses `getWorldState()`, `executeCycle()` return value, and captured config — no private field access. |
| **No monkey-patching** `SEEDRuntime.prototype` | Avoid hidden behavior; explicit wrapper at call sites. |
| **Deterministic export where possible** | Sort by `cycleIndex`; stable JSON key order; document non-determinism explicitly. |
| **No external API calls** | Export is local file / download only. |
| **No model training** | JSONL is data prep; training pipelines are separate repos. |
| **Deep clone before compare** | Never diff live runtime state references. |
| **PII / mainline names** | Samples may contain `mainlineOriginName`; redaction layer belongs in export filters (future). |

---

## 8. Future extensions

| Extension | Description |
|-----------|-------------|
| **Dataset quality scoring** | Aggregate `qualityScore`; filter degenerate cycles; dedupe by `WorldState` hash. |
| **Scenario generation** | Parameterized presets + `UniverseForgeService` grids → batch `runId`s. |
| **Batch simulation** | Worker pool running `executeCycles` with shared logger; progress callbacks. |
| **Evaluation dashboard** | React panel: convergence curves, branch rate, correction rate per `runId`. |
| **Model fine-tuning adapter** | Map `TrainingSample` → chat JSON / HF dataset / AetherWorld training schema. |
| **Merge event coverage** | Today `mergeTimelines` is rarely triggered; add scenarios in Material Factory to exercise `mergeTriggered`. |
| **Collapse-only paths** | Fate graphs with dead-end nodes to increase `collapseTriggered` density. |
| **Canonical WorldState projection** | Export slim schema (ids + scalars only) to reduce JSONL size. |
| **Golden tests** | Commit small `.jsonl` fixtures; CI validates builder against frozen `executeCycle` outputs when RNG seeded. |

---

## Appendix A — Mapping runtime events to flags

| Runtime behavior (`seedRuntime.ts`) | Sample field |
|-------------------------------------|--------------|
| `evt-correction-*`, `name: "结构校正事件"` | `correctionTriggered` |
| `evt-branch-*`, `name: "时间线分支"` | `branchTriggered` |
| `timelineEffect.mergeTimelineIds` | `mergeTriggered` |
| `id` starts with `merged-` after merge | `mergeTriggered` |
| Timeline `status` → `COLLAPSED` (no outgoing arcs or prune) | `collapseTriggered` |
| `pruneTimelines` drops low-convergence actives | `collapseTriggered` + `timelineChanges.collapsed` |

---

## Appendix B — Minimum viable implementation checklist

- [ ] Add `src/training/types.ts` with full `TrainingSample` interface
- [ ] Implement `TrainingSampleBuilder` with tests using `demo.ts` initial state
- [ ] Implement `SimulationRunLogger` (no runtime edits)
- [ ] Implement `JSONLExporter`
- [ ] Add `src/training/demo.ts` entry script
- [ ] Document `training-samples/` in `.gitignore`
- [ ] Cross-link from `FACTORY_ARCHITECTURE.md`

---

*Spec version: training-factory/v0.1 · Documentation only — no source files modified.*
