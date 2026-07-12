let runtimePromise;
export async function createBridge({module}){
 const runtime=await (runtimePromise??=Promise.resolve(module.createDeveloperExecutionRuntime(process.env)));
 return{
  health:()=>runtime.invoke('health',{}),
  invoke:(action,payload,options)=>runtime.invoke(action,payload??{},options??{})
 };
}
