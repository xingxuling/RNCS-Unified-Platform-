# RCL Knowledge, Inner Reality and Execution Reality Specification v0.3

## 1. Status

- Language: Reality Computation Language
- Version: `0.3.0-alpha.1`
- IR: `rcl.reality-program.v0.3`
- Run record: `rcl.reality-run.v0.3`
- Knowledge object: `Knowledge<T>` / source type `Know<T>`
- Inner plane: `rcl.inner-reality.v0.1`
- Execution plane: `rcl.execution-reality.v0.1`

## 2. Knowledge Reality

Knowledge Reality answers:

> How does a subject turn observations, prior structures and inference into justified, revisable and actionable claims?

### 2.1 Claim structure

A runtime claim contains:

| Field | Meaning |
|---|---|
| `baseType` | Type of the claimed value |
| `value` | Current accepted content |
| `confidence` | Support in `[0,1]` |
| `evidence` | Evidence lineage |
| `source` | Producer, model, sensor or rule |
| `scope` | Context in which the claim applies |
| `status` | provisional, observed, derived, reinforced, contested, revised, decayed or forgotten |
| `dependencies` | Knowledge claims used to derive it |
| `revision` | Monotonic revision number |
| `alternatives` | Retained contradictory candidates |
| `formedAtRoot` | Canonical state root at formation |

### 2.2 Declarations

```rcl
knowledge <name> {
  claim <name> : <BaseType> = <expression>
    confidence <Number expression>
    evidence "<evidence-id>"
    source "<source-id>"
    scope "<scope>"
    status <status>

  derive <name> : <BaseType> = <expression>
    from <knowledge-path>, ...
    confidence <Number expression>
    evidence "<evidence-id>"

  revise <knowledge-path> <- <expression>
    confidence <Number expression>
    evidence "<evidence-id>"

  forget <knowledge-path> by <Number expression>

  preserve <Truth expression>
}

learn <knowledge-name>
```

### 2.3 Built-ins

| Function | Result |
|---|---|
| `knowledge_value(k)` / `belief(k)` | underlying typed value |
| `confidence(k)` / `certainty(k)` | confidence number |
| `known(k)` | claim exists and is not forgotten with confidence ≥ 0.5 |
| `supported(k, threshold)` | confidence and status check |
| `knowledge_status(k)` | status text |
| `contradicts(a, b)` | typed value contradiction |
| `evidence_count(k)` | evidence item count |

### 2.4 Revision law

If a new candidate has the same value, support is reinforced and evidence is merged.

If values conflict:

- stronger support replaces the accepted value and stores the old value as an alternative;
- weaker support leaves the accepted value in place and marks it contested;
- provenance is never silently discarded.

### 2.5 Derivation law

Derived confidence is bounded by the weakest declared dependency:

```text
confidence(derived)
= min(explicit confidence, confidence(dependency₁), ...)
```

Dependency evidence is propagated into the derived claim.

## 3. Inner Reality

Inner Reality is a composite runtime plane, not a tenth domain.

```text
Inner Reality = Perceptual + Neural + Living + Knowledge
```

It contains the current subject-relative percepts, internal signals, needs, claims, uncertainty and unresolved conflicts. It is canonicalized and assigned an independent root.

## 4. Execution Reality

Execution Reality is a composite runtime plane, not an eleventh domain.

```text
Execution Reality
= projections + realized transitions + authority decisions
+ host receipts + causal evidence
```

It records how internal knowledge becomes an authorized external change.

## 5. Minimal AI loop

```text
Measure
→ Observe
→ Learn
→ Foresee
→ Realize
→ Measure again
```

A system can therefore behave intelligently in a bounded domain using explicit prior structure and small amounts of environmental feedback, without requiring an LLM inside the control loop.

## 6. Non-claims

This specification does not claim:

- zero-data intelligence;
- automatic acquisition of all knowledge;
- solved perception or consciousness;
- equivalence to biological cognition;
- replacement of neural models for open-world language and vision.
