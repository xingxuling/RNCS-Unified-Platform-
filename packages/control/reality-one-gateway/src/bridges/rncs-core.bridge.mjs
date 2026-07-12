export async function createBridge({module}){
 return{health:()=>({status:'ok',protocol:'rncs.core-contract.v0.1'}),invoke:async(action,payload)=>{
  if(action==='health')return{status:'ok',protocol:'rncs.core-contract.v0.1'};
  if(action==='newProposal')return module.newProposal(payload);
  if(action==='verify')return module.verify(payload.envelope);
  if(action==='authorize')return module.authorize(payload.envelope,payload.decision);
  throw Object.assign(new Error(`Unsupported RNCS Core action: ${action}`),{code:'RNCS_CORE_ACTION_UNSUPPORTED'});
 }};
}
