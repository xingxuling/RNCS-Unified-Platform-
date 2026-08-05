# RCL formal drafts

The eight requested World Body surfaces are represented as independently compilable RCL v0.94 drafts:

- `world-body-ir.rcl`
- `rsr-spatial-state.rcl`
- `rsr-contact-constraint.rcl`
- `rsr-authority-replay.rcl`
- `vsr-authority-projection.rcl`
- `vsr-temporal-presentation.rcl`
- `vsr-render-graph.rcl`
- `world-body-closure.rcl`

The verifier compiles every source to RBC, decodes an instruction summary, executes it in the JavaScript reference runtime and the checked native VM, and records source/RBC hashes plus state-root parity. The aggregate `world-body-formal-kernel.rcl` additionally executes the bounded reference checks.

These drafts encode closed boolean contracts that current RCL can express. They do not encode quantification over arbitrary bodies, real-number analysis, graph reachability proofs, GPU semantics, provider behavior, or a complete JavaScript validator. Those remain schema/reference-model or external-backend obligations; no compiler success is presented as proof of them.
