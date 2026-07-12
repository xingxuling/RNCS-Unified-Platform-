export const RSR_VERSION='0.9.0-alpha.1';
export const health=()=>({
  status:'ok',
  protocol:'rsr.spatial-embodiment.v0.6',
  protocols:['rsr.spatial-embodiment.v0.6','rsr.authoritative-state.v0.7'],
  version:RSR_VERSION
});
export async function spatial(){return import('../dist/packages/spatial-embodiment/src/index.js');}
export async function spatialVsr(){return import('../dist/packages/spatial-embodiment-vsr/src/index.js');}
export async function networkReconciliation(){return import('../dist/packages/network-reconciliation/src/index.js');}
