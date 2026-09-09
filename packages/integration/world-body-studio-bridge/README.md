# World Body Studio Bridge

`@taowind/world-body-studio-bridge` is the narrow ingress adapter from a Reality Studio Unified Project to the existing World Body compilation spine.

It reuses:

- Studio's active spatial world, scene roots, asset registry, and optional network compilation;
- `taowind.world-declaration.v0.1` as the semantic hand-off;
- `@taowind/world-body-codegen` for World Body IR, RSR, VSR, temporal/network, render/event, RCL, proof-template, and generated-test artifacts.

It does not implement a second physics runtime, renderer, network runtime, asset streamer, or scene IR. Studio-only facets that are not owned by World Body are preserved in a sidecar and listed as gaps.

The adapter is candidate-only. `compileStudioWorldBodyCandidate()` never commits, promotes, or mutates the Studio project. `verifyStudioWorldBodyCandidate()` verifies the bridge manifest and the underlying generated artifact bundle.

For downstream runtime archaeology, `compileStudioWorldBodyAetherProjection()` lowers the candidate's physical bodies into the existing sealed `rncs.entity-state-batch.v0.1` contract, and `projectStudioWorldBodyCandidateToRealityCell()` executes the existing Kernel → RSR → Reality Cell → VSR seam. This is not a complete product integration: lossy projection is blocked by default. Passing `allowLossyProjection: true` is an explicit candidate experiment, and the result records the source World Body root, projection/receipt roots, runtime roots, and each discarded facet.

The current donor cannot consume dynamic mass, secondary fixtures, World Body visual asset bindings, Studio character facets, or verified Network Compilation facets. Those are reported as `RCL_GAP_WB_AETHER_*` losses rather than being silently dropped. `verifyStudioWorldBodyAetherProjection()` binds the receipt to the emitted runtime roots.

The `model-3d` Studio asset kind is explicitly lowered to the closed World Body `mesh` kind. The original kind, asset root, file root, and mapping reason remain in the sidecar. Studio's 2D scene transform is also preserved as source metadata; it is not silently treated as a 3D transform.
