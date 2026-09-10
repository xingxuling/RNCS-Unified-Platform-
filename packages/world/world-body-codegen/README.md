# @taowind/world-body-codegen

This PoC compiles one `World Declaration` into a sealed World Body IR and deterministic specializations for:

- RSR spatial world configuration;
- VSR entity/body/asset/visual-offset bindings;
- authoritative-frame to temporal-presentation bindings;
- Render Graph resources, hazards, barriers, and lifetimes;
- event routes through the shared World Body event delivery plan;
- an RCL world-body facet artifact;
- a candidate proof-receipt template;
- an executable generated runtime test;
- a provenance manifest.

The temporal/network module also emits sealed rollback snapshots and canonical network envelopes with fail-closed deserialization.

Generated artifacts are candidate-only and cannot call RNCS/RFE commit. The generator accepts no executable code from declarations, writes only below an explicit output directory, and rejects path escape.

```bash
npm test --workspace @taowind/world-body-codegen
npm run generate:example --workspace @taowind/world-body-codegen
npm run benchmark --workspace @taowind/world-body-codegen
```

This replaces repeated specialization glue. It does not replace the RSR solver, VSR shaders/backends, network transport, asset decoder, GPU driver, or authority chain.

The generated `event-routes.generated.json` is a delivery plan, not a claim that any consumer has executed. Its provider boundary stays explicit so an absent audio/animation/network consumer cannot be promoted by code generation alone.
