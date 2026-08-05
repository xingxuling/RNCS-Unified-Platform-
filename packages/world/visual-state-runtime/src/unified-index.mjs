export const VSR_VERSION='0.8.0-alpha.1';
export const health=()=>({
  status:'ok',
  protocol:'vsr.spatial-reality-3d.v0.7',
  protocols:['vsr.spatial-reality-3d.v0.7','vsr.spatial-asset-streaming.v0.1','vsr.gltf-import.v0.1','vsr.temporal-presentation.v0.6'],
  version:VSR_VERSION
});
export async function spatial3d(){return import('../dist/packages/spatial-reality-3d/src/index.js');}
export async function spatialAssetStreaming(){return import('../dist/packages/spatial-reality-3d/src/asset-streaming.js');}
export async function realtimeWebGPU(){return import('../dist/packages/realtime-webgpu/src/index.js');}
export async function temporalPresentation(){return import('../dist/packages/temporal-presentation/src/index.js');}

export async function gltfAsset(){return import('../dist/packages/gltf-asset/src/index.js');}
export * from './anime-profile.mjs';
export * from './character-profile.mjs';
