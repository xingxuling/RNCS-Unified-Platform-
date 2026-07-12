# HNAF WIT contracts

`hnaf-capabilities.wit` defines the canonical v0.3 capability interfaces consumed by `wasm-component@1` capsules.

The manifest declares semantic capabilities such as `host.log`; the component imports versioned WIT instances such as `hnaf:capabilities/log@0.3.0`; the Contract Forge proves that both descriptions resolve to the same granted lease before instantiation.
