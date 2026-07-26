# Reality Engine Session

`@taowind/reality-engine-session` is the RNCS control boundary for a world
transition. It keeps a candidate inert until the following explicit sequence
has completed:

1. `propose()` seals an RNCS Reality Transition Envelope.
2. `simulate()` records the target generation and simulated state root.
3. `authorize()` records the resolver and authority decision.
4. `commit()` performs the canonical RFE commit and only then invokes the
   optional world projector or network runtime adapter.

`rollback()` withdraws a pre-commit candidate. A committed transition cannot
be silently undone; it requires a compensating transition.

The package intentionally accepts a `networkRuntime` adapter instead of
embedding a particular transport. The adapter must expose
`createSessionFromCompilation({ sessionId, compilation, network, clock })`.
This lets Reality Studio and the authoritative network runtime share the same
RFE boundary without granting model or organ output commit authority.
