# RCL → RSR Spatial Command Bridge

`@taowind/rcl-rsr-spatial-bridge` is the explicit candidate-only lowering seam between the existing RCL native authority plan, the Kernel command envelope, and the existing RSR/VSR engine session.

The current RCL compiler does not have a first-class typed spatial command primitive. Until that gap is resolved, a bounded RCL source may declare commands through the `rncs.spatial.command.<alias>.*` facet namespace. The RCL control plane validates those declarations into `rncs.rcl-spatial-command-plan.v0.1` and the rooted `rcl.physical-command-profile.v0.1`; this package verifies those roots, creates a candidate `rncs.entity-command-batch.v0.1`, and lowers it to the existing `SpatialCommand` path.

```text
RCL native self-host execution
  → rooted RCL spatial command plan
  → candidate Kernel entity command batch (source/profile/target roots)
  → explicit candidate lowering receipt
  → existing RSR/VSR engine session
  → candidate simulation and replay
```

The bridge admits the existing bounded `patch-heightfield` and `set-velocity` command paths. It does not own terrain generation, canonical world mutation, RFE commit, release promotion, device capability, dynamic-body terrain, continuous full terrain manifolds or production performance. RSR remains the spatial execution owner and VSR remains the presentation owner.

```bash
npm test --workspace @taowind/rcl-rsr-spatial-bridge
```
