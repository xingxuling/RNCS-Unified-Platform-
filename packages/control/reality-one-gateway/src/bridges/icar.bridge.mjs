import * as canonical from '../canonical.mjs';

export async function createBridge({module}){
 return{health:()=>({status:'ok',protocol:'icar.native-envelope.v0.5',functions:['prepareApplication','commitPreparedApplication']}),invoke:async(action,payload)=>{
  if(action==='health')return{status:'ok',protocol:'icar.native-envelope.v0.5'};
  if(action==='preview')return module.prepareApplication(payload);
  if(action==='commit')return module.commitPreparedApplication(payload.preview,{rfeStorePath:payload.rfeStorePath,clock:payload.clock});
  if(action==='run')return module.runApplication(payload);
  if(action==='rebindAuthority'){
   if(payload.preview?.envelope?.proposal_root!==payload.authorizedEnvelope?.proposal_root)throw Object.assign(new Error('Proposal root mismatch'),{code:'ICAR_AAF_PROPOSAL_MISMATCH'});
   if(payload.authorizedEnvelope?.phase!=='authorized'||payload.authorizedEnvelope?.authority?.status!=='approved')throw Object.assign(new Error('AAF envelope is not authorized'),{code:'ICAR_AAF_NOT_AUTHORIZED'});
   const out=structuredClone(payload.preview);out.envelope=structuredClone(payload.authorizedEnvelope);delete out.preview_root;return canonical.seal(out,'preview_root');
  }
  throw Object.assign(new Error(`Unsupported ICAR action: ${action}`),{code:'ICAR_ACTION_UNSUPPORTED'});
 }};
}
