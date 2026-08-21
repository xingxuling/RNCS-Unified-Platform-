# RAGF v0.8.0-alpha.1

## External Asset Provider Fabric

- unified AssetProviderManifest, AssetGenerationJob and AssetProviderResult contracts;
- TRELLIS.2, Infinigen, Make-It-Animatable, TripoSR and TripoSF adapter manifests;
- isolated external-process boundary with ComputeRequirement;
- normalized files, geometry, materials, PBR, provenance, license, seed, parameters, evidence and warnings;
- Asset Production Court with geometry, topology, material/PBR, rig, animation, collision, LOD/platform, license, provenance, VSR and RSR gates;
- ALWR GameBrain AssetRequirement and village blacksmith placement candidate;
- LAF package binding candidate and RNCS commit request;
- sealed Asset Evidence Ledger;
- contract-only runtime state when external model/GPU/worker execution is unavailable;
- 207 RAGF package tests passing, including the historical 190-test baseline.

The five upstream projects remain external providers. No Python/CUDA/Blender runtime or model weights are vendored into RNCS Core.
