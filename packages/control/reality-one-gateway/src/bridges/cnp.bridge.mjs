export async function createBridge({module}){
 return{health:()=>({status:'ok',protocol:'cnp.v0.1',functions:['negotiate','buildRegistry']}),invoke:async(action,payload)=>{
  if(action==='health')return{status:'ok',protocol:'cnp.v0.1'};
  if(action==='negotiate')return module.negotiate({request:payload.request,providers:payload.providers});
  if(action==='buildRegistry')return module.buildRegistry(payload.providers??[]);
  if(action==='validateRequest')return module.validateRequest(payload.request);
  throw Object.assign(new Error(`Unsupported CNP action: ${action}`),{code:'CNP_ACTION_UNSUPPORTED'});
 }};
}
