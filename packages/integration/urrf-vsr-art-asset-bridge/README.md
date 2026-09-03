# URRF ↔ VSR Art Asset Bridge

`@taowind/urrf-vsr-art-asset-bridge` binds the reusable Visual State Runtime
consumer handlers to the URRF/Large World Runtime sealed component registry.
It covers all eleven current component representation kinds:

- mesh: glTF/PBR component import;
- rig and animation: standalone or optional geometry-fused rig/clip import;
- particle: RAGF particle-preset normalization;
- sdf, voxel, point-cloud, gaussian-splat, neural-field, curve, and material:
  descriptor/payload-page validation. An explicit four-channel RAGF PBR pack
  is routed through `createVsrPbrMaterialComponentImportHandler`, which
  verifies `pbr/material.json`, channel roots, color spaces, and logical-to-
  physical resource bindings; generic material descriptors remain available as
  the fallback. `createUrrfVsrArtAssetSpatialImportBinding` additionally
  connects the particle, SDF, voxel, point-cloud, Gaussian, neural-field, and
  curve candidate lowerers to the handler output; material remains a
  candidate-only material package, not a GPU-rendered scene.

The bridge keeps responsibilities separate: URRF/LWR selects components,
rehashes bytes, records coverage and execution receipts; VSR interprets the
representation. The registry and all results remain candidate-only and cannot
write RNCS authoritative state. The fixed neural-field, Gaussian, SDF, voxel,
curve, and point-cloud profiles are bounded CPU candidates; this package does
not prove arbitrary model training, GPU-native rendering, target-device
performance, or AAA art direction.
