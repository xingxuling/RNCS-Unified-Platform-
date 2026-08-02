# @taowind/world-body-codegen

This PoC compiles one `World Declaration` into a sealed World Body IR and deterministic specializations for:

- RSR spatial world configuration;
- VSR entity/body/asset/visual-offset bindings;
- authoritative-frame to temporal-presentation bindings;
- Render Graph resources, hazards, barriers, and lifetimes;
- event routes;
- an RCL world-body facet artifact;
- a provenance manifest.

Generated artifacts are candidate-only and cannot call RNCS/RFE commit. The generator accepts no executable code from declarations, writes only below an explicit output directory, and rejects path escape.

```bash
npm test --workspace @taowind/world-body-codegen
npm run generate:example --workspace @taowind/world-body-codegen
```

This replaces repeated specialization glue. It does not replace the RSR solver, VSR shaders/backends, network transport, asset decoder, GPU driver, or authority chain.
