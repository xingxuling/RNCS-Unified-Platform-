export async function createBridge({module}){
  const productionSessions=new Map();
  const societySessions=new Map();
  const clean=value=>JSON.parse(JSON.stringify(value));
  const requireProduction=id=>{const session=productionSessions.get(id);if(!session)throw Object.assign(new Error(id??'missing'),{code:'RAGF_PRODUCTION_SESSION_NOT_FOUND'});return session};
  const requireSociety=id=>{const session=societySessions.get(id);if(!session)throw Object.assign(new Error(id??'missing'),{code:'RAGF_SOCIETY_SESSION_NOT_FOUND'});return session};
  const health=()=>({
    status:'ok',
    protocol:'reality-society-genesis.v0.5',
    protocols:['reality-asset-genesis.v0.4','reality-society-genesis.v0.5'],
    version:module.SOCIETY_GENESIS_VERSION??'0.5.0-alpha.1',
    asset_production_version:module.ASSET_PRODUCTION_VERSION??'0.4.0-alpha.1',
    production_sessions:true,
    society_genesis:true,
    deterministic_history:true,
    technology_concept_grammar:true,
    engineering_pathways:true,
    player_branches:true,
    projection_2_5d:true,
    llm_required:false
  });
  return{
    health,
    invoke:async(action,payload={})=>{
      if(action==='health')return health();
      if(action==='generate')return module.generateAssetWorkspace(payload.intent,{outDir:payload.outDir,providers:payload.providers??[]});
      if(action==='verify')return module.verifyWorkspace(payload.workspace,payload.options??{});
      if(action==='inspect')return module.inspectWorkspace(payload.workspace);
      if(action==='production-create'){
        const session=new module.AssetProductionSession(payload.intent,{rootDir:payload.outDir,providers:payload.providers??[],sessionId:payload.sessionId??null});productionSessions.set(session.session_id,session);return clean(session.inspect());
      }
      if(action==='production-generate')return clean(requireProduction(payload.session_id).generate({label:payload.label??'gateway-generation'}));
      if(action==='production-select')return clean(requireProduction(payload.session_id).select(payload.candidate_id,{reason:payload.reason??'gateway-selection'}));
      if(action==='production-regenerate')return clean(requireProduction(payload.session_id).regenerate(payload.patch??{},{label:payload.label??'gateway-targeted-regeneration'}));
      if(action==='production-accept')return clean(requireProduction(payload.session_id).accept({candidateId:payload.candidate_id,previewPath:payload.preview_path??'preview.html',reason:payload.reason??'gateway-acceptance'}));
      if(action==='production-export')return clean(requireProduction(payload.session_id).exportArtifacts());
      if(action==='society-generate')return clean(module.generateSocietyGenesisWorkspace(payload.intent,{outDir:payload.outDir,interventions:payload.interventions??[]}));
      if(action==='society-verify')return clean(module.verifySocietyGenesisWorkspace(payload.workspace,{baseDir:payload.baseDir??null,verifyFiles:payload.verifyFiles??false}));
      if(action==='society-inspect')return clean(module.inspectSocietyGenesisWorkspace(payload.workspace));
      if(action==='society-session-create'){
        const session=new module.SocietySandboxSession(payload.intent);for(const intervention of payload.interventions??[])session.dispatch(intervention);const sessionId=payload.sessionId??`society-session-${Date.now()}-${Math.random().toString(16).slice(2)}`;societySessions.set(sessionId,session);return clean({session_id:sessionId,...session.snapshot()});
      }
      if(action==='society-session-step')return clean(requireSociety(payload.session_id).step(payload.years??1));
      if(action==='society-session-act'){const session=requireSociety(payload.session_id);const intervention=session.dispatch(payload.action);return clean({intervention,...session.snapshot()});}
      if(action==='society-session-propose')return clean(requireSociety(payload.session_id).proposeTechnology(payload.proposal));
      if(action==='society-session-inspect')return clean(requireSociety(payload.session_id).snapshot());
      throw Object.assign(new Error(`Unsupported RAGF action: ${action}`),{code:'RAGF_ACTION_UNSUPPORTED'});
    }
  };
}
