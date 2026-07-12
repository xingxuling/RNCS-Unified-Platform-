import fs from 'node:fs';import path from 'node:path';
export async function createBridge({module}){
 return{health:()=>({status:'ok',protocol:'rfe.local-core.v0.1',class:typeof module.RealityStore}),invoke:async(action,payload)=>{
  if(action==='health')return{status:'ok',protocol:'rfe.local-core.v0.1'};
  if(action==='init'){const store=module.RealityStore.init(payload.root,{worldId:payload.worldId,branchId:payload.branchId,overwrite:payload.overwrite});return{metadata:store.metadata,generation:store.currentGeneration(),reference:store.generationReference()};}
  if(action==='status'){const store=new module.RealityStore(payload.root);return{metadata:store.metadata,generation:store.currentGeneration(),reference:store.generationReference()};}
  if(action==='materialize'){return new module.RealityStore(payload.root).materialize(payload.options??{});}
  if(action==='verify'){const store=new module.RealityStore(payload.root);const g=store.currentGeneration(payload.branchId);return{valid:true,generation_id:g.generationId,generation_root:g.integrityHash,metadata:store.metadata};}
  throw Object.assign(new Error(`Unsupported RFE action: ${action}`),{code:'RFE_ACTION_UNSUPPORTED'});
 }};
}
