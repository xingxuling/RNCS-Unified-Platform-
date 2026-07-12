export async function createBridge({manifest,module}){
 return{health:()=>({status:'ok',format:module.FORMAT,version:module.VERSION}),invoke:async(action,payload)=>{
  if(action==='health')return{status:'ok',format:module.FORMAT,version:module.VERSION};
  if(action==='validate')return module.validateArtifact(payload.artifact);
  if(action==='root')return{artifact_root:module.rootHash(module.artifactPayload(payload.artifact)),component_roots:module.componentRoots(payload.artifact)};
  throw Object.assign(new Error(`Unsupported LAF action: ${action}`),{code:'LAF_ACTION_UNSUPPORTED'});
 }};
}
