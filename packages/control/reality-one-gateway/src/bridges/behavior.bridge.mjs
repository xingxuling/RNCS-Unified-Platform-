export async function createBridge({module}){
 return{health:()=>({status:'ok',protocol:'reality-behavior.v0.1'}),invoke:async(action,payload)=>{
  if(action==='health')return{status:'ok',protocol:'reality-behavior.v0.1'};
  if(action==='normalize')return module.normalizeProgram(payload.program??payload);
  if(action==='validate')return module.validateProgram(payload.program);
  if(action==='run'){const p=payload.program?.program_root?payload.program:module.normalizeProgram(payload.program);const r=new module.BehaviorRuntime(p,{providers:payload.providers??{}});return{ticks:r.run(payload.ticks??1,()=>payload.input??{}),snapshot:r.snapshot(),delta:r.causalDelta(payload.base_generation_root)};}
  throw Object.assign(new Error(`Unsupported Behavior action: ${action}`),{code:'BEHAVIOR_ACTION_UNSUPPORTED'});
 }};
}
