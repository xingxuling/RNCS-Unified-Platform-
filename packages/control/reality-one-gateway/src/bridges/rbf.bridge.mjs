export async function createBridge({module}){
 return{health:()=>({status:'ok',protocol:'reality-branch.v0.2'}),invoke:async(action,payload)=>{
  if(action==='health')return{status:'ok',protocol:'reality-branch.v0.2'};
  if(action==='createWorkspace')return module.createWorkspace(payload);
  if(action==='validateWorkspace')return module.validateWorkspace(payload.workspace);
  if(action==='simulateBranch'||action==='simulate')return module.simulateBranch(payload.workspace,payload.branch_id,payload.options??{});
  if(action==='compareBranches'||action==='compare')return module.compareBranches(payload.workspace,payload.results??null,payload.options??{});
  if(action==='createMergeProposal')return module.createMergeProposal(payload.workspace,payload.comparison,payload.branch_id,payload.options??{});
  if(action==='createAuthorityRequest')return module.createAuthorityRequest(payload.proposal,payload.options??{});
  if(action==='issueAuthorityDecision')return module.issueAuthorityDecision(payload.request,payload.options??payload.decision??{});
  if(action==='createTransitionDraft')return module.createTransitionDraft(payload.workspace,payload.proposal,payload.options??{});
  if(action==='applyMergeProposal')return module.applyMergeProposal(payload.base_state,payload.proposal,payload.options??{});
  if(action==='rebase'||action==='rebaseWorkspace')return module.rebaseWorkspace(payload.workspace,payload.rebase??payload);
  throw Object.assign(new Error(`Unsupported RBF action: ${action}`),{code:'RBF_ACTION_UNSUPPORTED'});
 }};
}
