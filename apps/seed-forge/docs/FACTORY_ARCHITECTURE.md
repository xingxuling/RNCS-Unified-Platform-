# Aether-Seed-Forge · Factory Architecture

> **Status:** Architecture reference (documentation only)  
> **Audience:** Cursor agents, contributors, and AetherWorld integrators  
> **Scope:** Maps the current codebase to a **Multi-Universe Runtime & Factory Kernel** mental model.

---

## 1. Project positioning

### 1.1 What this repository is

**aether-seed-forge** is an early **AetherWorld Factory Kernel** bundled inside a Vite + React shell. It is **not** a generic UI demo.

| Layer | Role |
|-------|------|
| **Factory** | Produces structured universe artifacts (models, materials, future training samples) from IAL, OSE, templates, seeds, and presets. |
| **Runtime** | Executes **Sense → Structure → Project** cycles over `WorldState` (timelines, fate graph, events, convergence). |
| **Language** | **IAL** (compile) + **OSE** (execute structure / fate convergence) as the semantic substrate. |
| **Engine (v1)** | `UniverseManager`, `Universe`, `FateWeaver`, `EventManager` — persistence-oriented “Reality Kernel”. |
| **Presentation** | `Index.tsx` mega-console, `SeedControlCenter` focused cockpit, editors and visualizers. |

The product thesis (from UI copy and `docs/seed/universe_forge_v1.md`):

> **THE SEED** — Multi-Universe OS · Reality Kernel · Causal Runtime  
> Civilization Engine with IAL/OSE-aligned generation and fate-driven simulation.

### 1.2 What it is not (yet)

- A single unified backend service (browser-first; `src/server` exists but is not the main path).
- A completed training pipeline or dataset registry.
- Full implementation of all six Universe-Forge v1 modules as separate packages (many are **service stubs** today).

### 1.3 Architectural tension (intentional early state)

Two parallel stacks coexist:

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation (React)                         │
│  Index.tsx · SeedControlCenter · UniverseForgeEditor · v1 UI    │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
    ┌───────────▼──────────┐      ┌───────────▼──────────┐
    │  seed-runtime/       │      │  lib/forge + lib/v1  │
    │  SEEDRuntime         │      │  UniverseForge       │
    │  WorldState          │◄────►│  Universe (v1)       │
    │  universeForge       │ adapter│  UniverseManager     │
    │  (preset factory)    │      │  OSE / IAL           │
    └──────────────────────┘      └──────────────────────┘
```

- **`src/seed-runtime/universeForge.ts`** — lightweight **Material Factory** entry (`UniversePreset` → `WorldState`).
- **`src/lib/forge/UniverseForge.ts`** — full **generation pipeline** (IAL/OSE/template/procedural → `Universe` v1).
- **`UniverseForgeAdapter`** — intended bridge from v1 forge output → `WorldState` (underused in UI today).

---

## 2. Existing factory modules (COSMO · CIV-FAB · CHAR-WEAVE · FATE-STR · ECG · TFS)

Specification source: `docs/seed/universe_forge_v1.md`, `UNIVERSE_FORGE_V1_COMPLETE.md`.  
**Runtime entry:** `UniverseForgeService` (`src/lib/backend/services/UniverseForgeService.ts`).

| Module | Code name | Service method | Implementation maturity |
|--------|-----------|----------------|-------------------------|
| **COSMO** | Cosmogenesis | `generateCosmos()` | **Partial** — builds IAL `W₁`/`CIV` expression, runs `UniverseForge.generateUniverse`, returns cosmos DTO + `Universe` |
| **CIV-FAB** | Civilization Fabricator | `generateCivilization()` | **Partial** — phase-aware IAL, creates universe; civilization object is mostly metadata |
| **CHAR-WEAVE** | Character Weaver | `generateCharacter()` | **Mock-like** — returns character DTO + IAL string; **does not** call `generateUniverse` |
| **FATE-STR** | Fate-Structure Engine | `generateFateStructure()` | **Mock-like** — random nodes in memory only |
| **ECG** | Event Cascade Generator | `generateEvent()` | **Mock-like** — single synthetic event object |
| **TFS** | Timeline Flow System | `generateTimeline()` | **Mock-like** — synthetic timeline with placeholder nodes |

### 2.1 Module → code map

```text
UniverseForgeService
├── generateCosmos      → UniverseForge (IAL) → UniverseManager.createUniverse
├── generateCivilization→ UniverseForge (IAL) → Universe
├── generateCharacter   → static DTO (no Universe)
├── generateFateStructure → in-memory array (no FateWeaver)
├── generateEvent       → in-memory event (no EventManager)
└── generateTimeline      → in-memory timeline (no SEEDRuntime)

UniverseForge (lib/forge/UniverseForge.ts)
├── IAL path     → compileIAL → oseEngine.execute → Universe + worlds + fateWeaver hooks
├── OSE path     → descriptionToIAL (heuristic) → IAL path
├── template path→ TemplateSystem → IAL + world/rule/fate templates
└── procedural   → ProceduralGenerator.seedToIAL → IAL path
```

### 2.2 Supporting forge infrastructure

| Component | Path | Role |
|-----------|------|------|
| `TemplateSystem` | `src/lib/forge/TemplateSystem.ts` | In-memory universe templates (`default_universe`, fantasy, sci-fi, …) |
| `ProceduralGenerator` | `src/lib/forge/ProceduralGenerator.ts` | Deterministic seed → IAL glyph triple, name, worlds |
| `GenerationInput` / `GenerationResult` | `UniverseForge.ts` | Typed factory I/O contract |
| `UniverseForgeAdapter` | `src/seed-runtime/UniverseForgeAdapter.ts` | `GenerationResult` → `WorldState` for runtime |

---

## 3. Three factory layers

The kernel organizes work into **Model**, **Material**, and **Training** factories. Below: definitions and **current code mapping**.

### 3.A Model Factory

**Purpose:** Canonical typed schemas for entities the runtime can simulate.

| Model | Primary types / locations | Producer today | Consumer today |
|-------|---------------------------|------------------|----------------|
| **Universe model** | `lib/v1/Universe`, `UniverseConfig`, `types.ts` | `UniverseManager.createUniverse`, `UniverseForge` | v1 UI (`UniverseControl`), persistence |
| **Civilization model** | `Entity` (`type: "Civilization"`), `worldState.civilizations[]` | CIV-FAB stub; preset leaves `civilizations: []` | `SEEDRuntime` (structure only) |
| **Character model** | `Entity`, `IdentityProfile`, `MindProfile`, `AuthorityProfile` | `createWorldFromPreset`, CHAR-WEAVE stub | `SEEDRuntime.sensePhase` (nine-core hooks) |
| **Fate structure model** | `FateGraph`, `FateNode`, `FateArc` | `universeForge` preset graph; `UniverseForge.initializeFateFromOSE`; FATE-STR stub | `SEEDRuntime.structurePhase` / `projectPhase` |
| **Timeline model** | `Timeline`, `TimelineStatus` | `universeForge` initial timeline; TFS stub | `SEEDRuntime` branch/merge/prune |
| **Event model** | `Event`, `structuralEffect`, `timelineEffect` | ECG stub; runtime **correction** & **branch** events | `SEEDRuntime.applyEvent` |

**Canonical runtime bundle:** `WorldState` in `src/seed-runtime/seedRuntime.ts` (single object the loop mutates).

**Secondary model path (v1):** `lib/v1/FateWeaver`, `EventManager`, `SoulEngine`, `AetherLogicEngine` — richer server-side ontology, not fully wired to `SEEDRuntime`.

---

### 3.B Material Factory

**Purpose:** Inputs and intermediate artifacts used to **instantiate** models (not necessarily run them yet).

| Material | Source in codebase | Used by |
|----------|-------------------|---------|
| **IAL source** | User input, `TemplateSystem.ialExpression`, `ProceduralGenerator.seedToIAL` | `compileIAL` → `UniverseForge.generateFromIAL` |
| **OSE description** | `GenerationInput { type: 'ose' }`, `descriptionToIAL()` heuristic | Routed to IAL pipeline |
| **Procedural seed** | `GenerationInput { type: 'procedural', seed }` | `ProceduralGenerator` |
| **Template input** | `TemplateSystem`, `TemplateManager` UI, `WorldCreator` | `generateFromTemplate` |
| **Universe preset** | `UniversePreset`, `UniverseForgeEditor`, `SeedControlCenter` default | `createWorldFromPreset()` |
| **WorldState material** | Output of `createWorldFromPreset` / `UniverseForgeAdapter.convertToWorldState` | `SEEDRuntime` constructor, `loadWorldState` |
| **FateGraph material** | Preset nodes `n0/n1/n2`, adapter-generated graph, OSE convergence hooks | Runtime projection |
| **Event material** | `RuntimeCycleResult.triggeredEvents`, ECG stubs | UI logs, future export |

**UI-facing Material Factory (today):** `UniverseForgeEditor` + `SeedControlCenter` preset — **does not** call `lib/forge/UniverseForge.ts` directly; it materializes `WorldState` via `seed-runtime/universeForge.ts` only.

**Spec-facing Material Factory (today):** `UniverseForge` + IAL/OSE — produces v1 `Universe`, optional adapter conversion.

---

### 3.C Training Factory

**Purpose:** Capture simulation trajectories as **reusable samples** (alignment, branch decisions, corrections) for future fine-tuning or rule distillation.

| Training artifact | Current status | Where it could come from |
|-------------------|------------------|---------------------------|
| **Simulation run logs** | **Partial** — `cycleLog` in `SeedControlCenter`; `logger` utils | Persist `RuntimeCycleResult[]` |
| **State transition records** | **Partial** — implicit in `executeCycle` diffs; not serialized | Hook after each `projectPhase` |
| **Convergence records** | **Implemented in-loop** — timeline `convergenceScore`, global correction threshold | Export from `WorldState.activeTimelines` |
| **Branch / merge / collapse cases** | **Implemented in-loop** — branch timelines, `pruneTimelines`, `mergeTimelines` (merge underused) | Event `timelineEffect` fields |
| **Correction event samples** | **Implemented** — `结构校正事件` when global convergence &lt; threshold | Labeled in `applyMainlineCorrection` |
| **Synthetic dataset export** | **Missing as factory** — `persistenceManager.exportData()`, `exportToFile()` export universes/DB, not cycle traces | New `training/export` module |

**Training Factory maturity:** **Mostly missing as a first-class module**; runtime already emits the **right event shapes** for a future recorder.

---

## 4. Runtime relationship (Factory → SEEDRuntime)

### 4.1 Intended dataflow

```text
┌────────────────── Material Factory ──────────────────┐
│ IAL / OSE / template / seed / UniversePreset         │
└────────────────────────┬─────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
  lib/forge/      seed-runtime/    UniverseForgeAdapter
  UniverseForge   createWorldFromPreset   .convertToWorldState()
         │               │               │
         └───────────────┼───────────────┘
                         ▼
                  WorldState (initial)
                         │
                         ▼
              ┌─────────────────────┐
              │     SEEDRuntime      │
              │  Sense → Structure   │
              │      → Project       │
              └──────────┬──────────┘
                         │
                         ▼
              RuntimeCycleResult
              (worldState + triggeredEvents)
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   React UI state   AGIShellCore    (future) Training
   setWorldState    applyIAL…       Factory export
```

### 4.2 How key files participate

| File | Factory role | Runtime role |
|------|--------------|--------------|
| `lib/forge/UniverseForge.ts` | Full generation from `GenerationInput` | Indirect via adapter |
| `lib/backend/services/UniverseForgeService.ts` | Module API (COSMO…TFS) | None (no `SEEDRuntime` import) |
| `seed-runtime/universeForge.ts` | Preset → `WorldState` | Bootstrap material |
| `seed-runtime/seedRuntime.ts` | — | **Authoritative loop** |
| `seed-runtime/UniverseForgeAdapter.ts` | v1 `GenerationResult` → `WorldState` | Bridge |
| `components/SeedControlCenter.tsx` | Uses preset factory | Owns `SEEDRuntime`, steps UI |
| `components/UniverseForgeEditor.tsx` | Edits presets, previews `WorldState` | Preview only (no auto-run) |
| `pages/Index.tsx` | Exposes v1 + IAL + OSE + runtime tabs | Multiple parallel runtimes (v1 monitor, `SEEDRuntimeSimulator`, etc.) |
| `agi-shell/agiShellCore.ts` | NL / IAL commands | Mutates runtime via `applyIALToRuntime` |

### 4.3 Connection gaps (important for integrators)

1. **`UniverseForgeService` ↔ `SEEDRuntime`:** No automatic handoff; service returns DTOs or v1 `Universe`, not `WorldState`.
2. **`UniverseForgeEditor` ↔ `lib/forge/UniverseForge`:** Editor never calls v2 forge; only `createWorldFromPreset`.
3. **`SeedControlCenter` ↔ `Index.tsx`:** Control Center is mounted under `TabsContent value="control-center"` but **no tab trigger** exists in `Index.tsx` `TabsList` (orphaned route).
4. **Dual SEEDRuntime implementations:** `seed-runtime/seedRuntime.ts` (used by Control Center) vs `lib/seed-rt/SEEDRuntime.ts` (used by some components) — risk of conceptual drift.

**Recommended integration contract (future, non-breaking):**

```ts
// Pseudocode — documentation only
const result = await universeForgeService.generateCosmos(params);
const world = UniverseForgeAdapter.convertToWorldState(
  { universe: result.universe, metadata: … },
  mainlineName
);
const runtime = new SEEDRuntime(world, config);
```

---

## 5. Current limitations

### 5.1 Implemented (usable)

| Area | Evidence |
|------|----------|
| IAL compile + OSE execute pipeline | `UniverseForge.generateFromIAL`, `lib/ial`, `lib/ose` |
| Deterministic procedural seeds | `ProceduralGenerator` |
| Template registry | `TemplateSystem` defaults |
| Preset → `WorldState` | `createWorldFromPreset` |
| Runtime cycle with branching & correction | `SEEDRuntime.executeCycle` |
| AGI shell IAL bridge | `agiShellCore` + `applyIALToRuntime` |
| v1 universe CRUD + Dexie persistence | `UniverseManager`, `PersistenceManager` |
| Forge adapter spec | `UniverseForgeAdapter.convertToWorldState` |

### 5.2 Partially implemented

| Area | Gap |
|------|-----|
| COSMO / CIV-FAB | Creates real `Universe` but shallow civilization/cosmos DTOs |
| OSE-from-description | Keyword → single IAL glyph; not true NL reasoning |
| Template world/rule application | `generateRuleFromTemplate` empty; world IAL apply commented |
| Fate on v1 universe | Uses `(universe as any).fateWeaver` — fragile |
| UI integration | Many tabs in `Index.tsx`; forge modules not exposed as one workflow |
| Server | `src/server` present; not central to documented factory flow |

### 5.3 Mock-like / stub

| Area | Behavior |
|------|----------|
| CHAR-WEAVE, FATE-STR, ECG, TFS in `UniverseForgeService` | In-memory objects, no graph mutation |
| `generateRuleFromTemplate` | No-op body |
| `descriptionToIAL` | Fixed glyph mapping |
| Procedural extra worlds | Compiled but minimal apply |

### 5.4 Missing

| Area | Notes |
|------|-------|
| **Training Factory** module | No `src/training`, no cycle dataset schema |
| Unified **Factory Controller** orchestrating COSMO→…→TFS→Runtime | Spec in markdown only |
| Single entry UI: preset + full forge + run | Split across Editor vs Control Center vs Index |
| `WorldState` persistence per run | Only universe-level Dexie export |
| Merge timeline in live UI | Code exists; few triggers |
| Tests guarding `executeCycle` determinism | Limited coverage for factory kernel |

---

## 6. Next recommended folder structure

Proposed layout to reduce dual-stack confusion **without requiring immediate moves**:

```text
src/
  core/                    # Shared types: WorldState, GenerationInput, module DTOs
    models/
    contracts/

  factory/                 # All producers (no simulation ticks)
    cosmogenesis/          # COSMO
    civilization/          # CIV-FAB
    character/             # CHAR-WEAVE
    fate/                  # FATE-STR
    events/                # ECG
    timeline/              # TFS
    universe-forge/        # UniverseForge, TemplateSystem, ProceduralGenerator
    presets/               # createWorldFromPreset, UniversePreset
    services/              # UniverseForgeService (thin facades)

  training/                # Recorders & exporters (new)
    recorder/
    schemas/
    export/

  runtime/                 # SEEDRuntime only (merge seed-runtime + seed-rt over time)
    seedRuntime.ts
    loop/
    adapters/
      universeForgeAdapter.ts

  language/                # IAL + OSE
    ial/
    ose/

  engine/                  # v1 Reality Kernel (gradual deprecation or adapter)
    v1/

  server/                  # Optional Node entry
    ...

  components/              # React UI (consumes factory + runtime APIs)
    control-center/
    forge-editor/
    ...
```

**Migration principle:** Move files with re-exports from old paths first; do not change `executeCycle` semantics in the same PR as moves.

---

## 7. Cursor-safe next tasks

Tasks that **do not change runtime behavior** (documentation, wiring, types, tests against frozen fixtures):

| Priority | Task | Safety rationale |
|----------|------|------------------|
| P0 | Add `docs/FACTORY_ARCHITECTURE.md` (this file) | Docs only |
| P0 | Add `Index.tsx` tab for `control-center` → `SeedControlCenter` | UI routing only |
| P1 | Document + implement **read-only** `connectForgeToRuntime()` helper in `adapters/` that calls existing `UniverseForgeAdapter` | New file; opt-in |
| P1 | Align `UniverseForgeService.generateCharacter` to return `GenerationResult` or call adapter (behind feature flag) | Extend stubs without changing `SEEDRuntime` |
| P1 | Add `training/schemas/cycleRecord.ts` types mirroring `RuntimeCycleResult` | Types only |
| P2 | `training/recorder`: subscribe to Control Center logs, write to IndexedDB | Additive persistence |
| P2 | Unit tests: `createWorldFromPreset` snapshot; `executeCycle` golden files with fixed RNG seed | Test-only |
| P2 | Consolidation plan doc for `lib/seed-rt` vs `seed-runtime` | Docs only |
| P3 | Extract COSMO…TFS into `factory/*/index.ts` re-exporting current service methods | Move + re-export, no logic change |
| P3 | Wire `UniverseForgeEditor` “Run in Runtime” button → `loadWorldState` | New UI action; default path unchanged |

### 7.1 Tasks to avoid (high breakage risk)

- Rewriting `SEEDRuntime.projectPhase` branching probabilities without golden tests.
- Replacing `lib/v1/Universe` with `WorldState` in one pass.
- Changing `compileIAL` / `oseEngine.execute` contracts used by live IAL tab.
- Deleting `lib/seed-rt` before parity checklist.

### 7.2 Suggested Cursor prompt template

```text
Read docs/FACTORY_ARCHITECTURE.md.
Task: [specific P1 item].
Constraints: no edits to SEEDRuntime.executeCycle body; no behavior change to UniverseForge.generateFromIAL.
Add tests if touching adapters.
```

---

## Appendix A — File quick reference

| Path | One-line role |
|------|----------------|
| `src/lib/forge/UniverseForge.ts` | v2 universe generator (IAL/OSE/template/procedural) |
| `src/lib/backend/services/UniverseForgeService.ts` | COSMO…TFS service facades |
| `src/seed-runtime/seedRuntime.ts` | Causal runtime loop + `WorldState` |
| `src/seed-runtime/universeForge.ts` | Preset material → `WorldState` |
| `src/seed-runtime/UniverseForgeAdapter.ts` | v1 forge output → `WorldState` |
| `src/components/SeedControlCenter.tsx` | Runtime cockpit + forge tab shell |
| `src/components/UniverseForgeEditor.tsx` | Preset editor + `WorldState` preview |
| `src/pages/Index.tsx` | Full kernel dashboard (v1 + IAL + OSE + runtime) |
| `docs/seed/universe_forge_v1.md` | Normative module spec (target state) |

---

## Appendix B — WBG layer mapping (runtime)

| Phase | Layer (conceptual) | Code |
|-------|-------------------|------|
| `sensePhase` | White | Entity nine-core perception, time index |
| `structurePhase` | Blue | Fate graph arc selection prep |
| `projectPhase` | Gold | Timeline advance, events, correction |

---

*Document version: 0.1 · Generated from repository analysis · No runtime source files were modified.*
