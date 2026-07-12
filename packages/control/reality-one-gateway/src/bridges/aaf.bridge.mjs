export async function createBridge({module}){
 return{health:()=>({status:'ok',protocol:'aaf.v0.1',functions:['evaluateAuthority','sealPolicyBundle','sealApproval']}),invoke:async(action,payload)=>{
  if(action==='health')return{status:'ok',protocol:'aaf.v0.1'};
  if(action==='sealPolicy')return module.sealPolicyBundle(payload.raw);
  if(action==='sealApproval')return module.sealApproval(payload.raw);
  if(action==='evaluate')return module.evaluateAuthority(payload);
  if(action==='verifyPolicy')return{valid:module.verifyPolicyBundle(payload.policy_bundle)};
  throw Object.assign(new Error(`Unsupported AAF action: ${action}`),{code:'AAF_ACTION_UNSUPPORTED'});
 }};
}
