# RCL Reality Foundation v0.2

## 1. Foundation formula

```text
RCL Reality Foundation
= Eight Reality Domains
+ Authority Axis
+ Causality and Evidence Axis
+ Cross-domain State Transition Protocol
```

## 2. Eight reality domains

| Domain | Primary question | Current executable primitives |
|---|---|---|
| Meta-computational | How does computation inspect and revise computation? | `meta`, `inspect`, `revise`, `reflect` |
| Computational | How are symbolic and machine states computed? | `facet`, `reckon`, `host`, `call` |
| Physical | How do matter, energy, fields and time evolve? | `physical`, `body`, `field`, `law`, `evolve`, `advance` |
| Perceptual | How does a world become observable to an observer? | `perception`, `observer`, `source`, `channel`, `observe` |
| Neural | How do signals become internal state and action control? | `neural`, `pathway`, `transmit`, `inhibit`, `learn`, `propagate` |
| Living | How does a system maintain itself and act autonomously? | `living`, `need`, `sense`, `maintain`, `cycle`, `live` |
| Genetic | How are structures encoded, expressed and changed across generations? | `genetic`, `gene`, `mutate`, `express`, `inherit` |
| Quantitative | What is measurable and how reliable is the claim? | `quantitative`, `measure`, `derive`, `uncertainty`, `confidence`, `quantify` |

## 3. Quantitative reality

Quantitative reality is both a distinct domain and a cross-domain measurement mechanism.

### 3.1 Minimal measurement object

```text
Measurement := {
  measurand,
  base type,
  value,
  unit,
  scale,
  uncertainty,
  confidence,
  calibration identity,
  evidence lineage
}
```

### 3.2 Why a number is insufficient

`37` may mean temperature, age, count, voltage, rank or probability. Even `37 °C` still omits error, confidence, instrument and calibration. RCL therefore separates:

```text
quantity ≠ measurement ≠ authoritative fact
```

A measurement becomes an authoritative fact only after its constraints and evidence policy are satisfied.

### 3.3 Scale semantics

The current parser recognises:

- `nominal`;
- `ordinal`;
- `interval`;
- `ratio`;
- `probabilistic`.

The alpha runtime currently executes numeric and dimensional interval/ratio measurements. Full scale-specific algebra is a later version.

### 3.4 Dimensional types

Current dimensional types include:

```text
Length, Time, Mass, Velocity, Acceleration,
Force, Energy, Temperature, Frequency, Area,
Volume, Pressure, Power, Information
```

Invalid equations are compile-time diagnostics where the type can be inferred.

## 4. Cross-domain causal loop

```text
Genetic structure
→ living development
→ neural organisation
→ perception
→ intention and action
→ physical change
→ measurable evidence
→ computation and model revision
→ new constraints or genetic/behavioural change
```

Meta-computational reality can inspect the model and its runtime evidence. Authority determines which externally meaningful changes may be realised.

## 5. Authority classes

RCL distinguishes intrinsic domain evolution from externally authorised intervention:

- physical laws: `natural-law`;
- perception: `observation`;
- neural propagation: `intrinsic-neural-dynamics`;
- living cycles: `intrinsic-life-cycle`;
- genetic generation: `lineage-transformation`;
- measurement: `evidentiary-measurement`;
- meta reflection: `metacomputational-self-inspection`;
- external or shared-world mutations: explicit `warrant` + `needs` + `realize`.

This prevents natural evolution from being confused with an agent receiving unlimited permission.

## 6. State transition contract

Every realised transition records at least:

```text
before root
→ causal/domain operation
→ typed changes
→ preserved boundaries
→ evidence/witnesses
→ after root
```

This record is compatible with the existing RNCS proposal bridge for authorised rule transitions.

## 7. Current limits

The foundation defines language semantics, not complete scientific truth. Physics, neural science, genetics, perception and living systems require specialised providers, models and validation. In particular, no syntax declaration is evidence that a simulated entity is conscious or biologically alive.
