# ADR-0001: RCL is a language kernel, not an RNCS DSL

## Status
Accepted for v0.1.

## Decision
RCL owns its lexer, parser, abstract syntax, type rules, causal execution model, authority model and runtime IR. It is not translated into Python, JavaScript, CSL or MSL source. The bootstrap implementation is hosted by Node.js only until a self-hosted compiler and native VM exist.

RCL's primary control structures are `emergence`, `resonance`, `foresee`, `realize`, `warrant`, `preserve`, `reckon` and `host`, rather than borrowing an imperative statement model built around functions, loops and mutable objects.

## Why this is hard to reverse
If RCL were introduced as syntax sugar over an existing language or workflow schema, its semantics would inherit that host's ideas of state, authority, effects and identity. Replacing those semantics later would break every program.

## Trade-off
A new language kernel costs more than a DSL and initially has fewer libraries. In return, RNCS gains control over what counts as computation, change, subject interaction, authority and evidence.
