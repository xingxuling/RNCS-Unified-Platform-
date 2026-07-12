# Reality Computation Language v0.1

**Status:** executable alpha language kernel  
**Version:** 0.1.0-alpha.1

## 1. Definition

RCL is a reality-native programming language for computing possible and authoritative changes across shared reality, subject realities and computer reality.

It implements six founding questions:

1. **How reality produces change** — `emergence` defines causal change formation.
2. **How reality is computed** — `reckon` computes values; `foresee` computes candidate realities.
3. **How reality is changed** — `realize` validates and commits simultaneous typed alterations.
4. **How subjects influence one another** — `resonance` changes shared and subject-local facets in one transaction.
5. **How computer reality is computed** — `host` declares typed capabilities; adapters execute them and return receipts.
6. **How reality is opened and constrained together** — `warrant` grants scoped authority while `when`, conditional warrants and `preserve` restrict execution.

## 2. Semantic equation

```text
RealizedChange =
  Cause
  × Trigger
  × ActiveWarrant
  × Computation
  × ProposedDelta
  × PreservedBounds
  × Witness
```

A missing factor does not become a partial reality change.

## 3. Core model

```text
Reality
├── Facets          typed addressable reality
├── Subjects        identities with local facets and warrants
├── Reckonings      pure reusable computation
├── Emergence       subject-caused causal transformation
├── Resonance       inter-subject causal transformation
├── Hosts           typed seams into computer reality
└── History         witnessed realized transitions
```

## 4. Distinctive execution semantics

### 4.1 Simultaneous alteration
All `alter` expressions read the same pre-transition reality. Their results are applied together. Order does not silently change causality.

### 4.2 Candidate before authority
`foresee` computes a complete candidate state but does not commit it. `realize` performs authority checks, host calls, bounds validation and commit.

### 4.3 Positive authority plus negative bounds
A subject must possess an active `warrant`; permission is not inferred from the absence of a prohibition. After the proposed change, every `preserve` clause must still hold.

### 4.4 Subject reality is first-class
`alice.trust` and `bob.trust` are independent facets. One `resonance` may alter both without pretending that all observers share identical state.

### 4.5 Computer effects return into reality
A host call does not vanish as an untracked side effect. Its typed result is written into a declared facet and recorded in transition history.

## 5. Surface syntax

```rcl
reality FirstLight {
  facet world.greeting : Text = "unformed"

  subject founder {
    facet awareness : Number = 0
    warrant world.write on world
  }

  reckon doubled(value : Number) -> Number = value * 2

  emergence hello {
    cause founder
    when world.greeting == "unformed"
    needs world.write on world
    alter world.greeting <- "Hello, reality."
    alter founder.awareness <- doubled(founder.awareness + 1)
    preserve founder.awareness >= 0
    witness "rcl:first-light"
  }

  foresee hello
  realize hello
}
```

## 6. v0.1 type system

Built-in value types:

- `Number`
- `Text`
- `Truth`

Compile-time checks include:

- unknown and duplicate declarations;
- facet initialization types;
- reckoning parameter and return types;
- rule trigger and preserve clause truth types;
- alteration target and value compatibility;
- static warrant existence;
- host capability and receipt type compatibility.

Runtime checks include:

- conditional warrant activation;
- preserve clauses over proposed reality;
- host adapter availability;
- recursion depth and missing state.

## 7. General computation

`reckon` is pure and recursive. Conditional selection is lazy:

```rcl
reckon factorial(n : Number) -> Number =
  choose(n <= 1, 1, n * factorial(n - 1))
```

This gives the language a path to general computation without making imperative mutation the foundation of the language.

## 8. Computer reality

```rcl
host console {
  offers emit -> Text
}

call console.emit("message") -> machine.receipt
```

The RCL program declares the capability and receipt type. The runtime supplies the concrete adapter. This separates language semantics from operating-system or cloud-provider implementation.

## 9. Deliberate v0.1 limits

- No self-hosted compiler yet; the bootstrap compiler runs on Node.js.
- No native bytecode VM yet.
- No distributed consensus or multi-node commit.
- Host effects are receipt-tracked but not yet compensated through a two-phase external transaction protocol.
- No module/package system, algebraic data types, pattern formation or subject perception channels yet.
- `realize` currently commits one local reality process atomically.

These are implementation limits, not a retreat to DSL semantics.

## 10. Next language layers

1. **v0.2 — perception and belief:** observed facts, uncertain claims, subject-specific knowledge and evidence weights.
2. **v0.3 — authority lifecycle:** delegation, attenuation, revocation, expiry, budgets and multi-subject approval.
3. **v0.4 — time and concurrency:** temporal windows, simultaneous subjects, conflict resolution and deterministic replay.
4. **v0.5 — native RCL VM:** bytecode, sandboxed host effects, deterministic snapshots and RFE commit adapter.
5. **v0.6 — self-hosting:** compiler core expressed in RCL and bootstrapped from the v0.5 VM.
