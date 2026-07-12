from __future__ import annotations
from typing import Any
from .canonical import root_hash, is_hex64
from .lifecycle import new_proposal, authorize, commit

def _legacy_root(value: Any) -> str:
    def clean(v):
        if isinstance(v,float): return {'$decimal':format(v,'.15g')}
        if isinstance(v,list): return [clean(x) for x in v]
        if isinstance(v,dict): return {str(k):clean(val) for k,val in v.items()}
        return v
    return root_hash(clean(value))

def adapt_hnac_snapshot(snapshot: dict, host_id: str='unknown-host') -> dict:
    state=snapshot.get('state') or snapshot
    return {
      'kind':'host-state','source_format':snapshot.get('format') or state.get('format') or 'hnaf.portable-state.v0.5',
      'host_id':host_id,'replica_id':str(snapshot.get('replicaId') or snapshot.get('replica_id') or 'unknown-replica'),
      'snapshot_sequence':int(snapshot.get('snapshot_sequence',snapshot.get('generation',0))),
      'state_root':str(snapshot.get('snapshotRoot') or snapshot.get('snapshot_root') or state.get('state_root') or _legacy_root(state)),
      'schema_version':str(state.get('schema_version') or 'unknown'),
      'partitions':sorted((state.get('partitions') or {}).keys()),
      'continuity_class':'replica_snapshot',
    }

def adapt_laf_artifact(artifact: dict) -> dict:
    identity=artifact.get('identity') or {}
    artifact_id=str(identity.get('id') or artifact.get('id') or artifact.get('artifact_id') or 'unknown-artifact')
    revision=(artifact.get('continuity') or {}).get('revision') or artifact.get('revision') or artifact.get('version') or 'unknown'
    return {'kind':'semantic-object','id':artifact_id,'version':str(revision),'root':_legacy_root(artifact),'continuity_class':'object_revision','source_format':str(artifact.get('format') or artifact.get('laf_version') or 'living-artifact')}

def adapt_icar_result(result: dict) -> dict:
    intent=result.get('intent') or {}; plan=result.get('plan') or {}; authority=result.get('authority') or {}; artifact=result.get('artifact') or {}
    atomic=result.get('atomicReceipt') or {}; final_root=str(atomic.get('finalGlobalRoot') or result.get('applicationResultHash') or _legacy_root(result))
    if not is_hex64(final_root): final_root=_legacy_root(final_root)
    art_ref=adapt_laf_artifact(artifact)
    actor=authority.get('actor') or {'id':'unknown-actor','role':'unknown','scopes':[]}
    env=new_proposal(
      reality_id=art_ref['id'],base_generation=0,base_generation_root='0'*64,
      subject={'subject_id':actor.get('id','unknown-actor'),'kind':'human','roles':[actor.get('role','unknown')],'responsibility_boundary':'legacy-icar-import'},
      intent={'intent_id':intent.get('intentHash','legacy-intent'),'source':intent.get('source','legacy ICAR intent'),'goals':intent.get('goals',[]),'constraints':[]},
      capability_plan={'plan_id':plan.get('planHash','legacy-plan'),'capabilities':[{'capability_id':s.get('capabilityId','unknown'),'step_id':s.get('id','')} for s in plan.get('steps',[])],'host_bindings':[],'required_scopes':plan.get('requiredScopes',[])},
      inputs=[art_ref],provisional_delta={'operations':[{'op':'legacy-import','target':art_ref['id'],'after_root':art_ref['root']}]},
      causal_basis={'events':[{'kind':'icar.execution','root':(result.get('execution') or {}).get('executionRoot','')}],'rules':[],'simulation_refs':[]},
      evidence={'nodes':[{'evidence_id':'legacy:icar-result','kind':'legacy-receipt','source':'ICAR v0.4','content_root':str(result.get('applicationResultHash') or _legacy_root(result))}],'edges':[]},
      extensions={'legacy':{'source_format':result.get('format'),'application_result_hash':result.get('applicationResultHash'),'atomic_receipt':atomic}}
    )
    env=authorize(env,status='approved',resolver='legacy-import:icar-v0.4',claims=authority.get('scopeDecisions',[]),constraints=authority.get('hostDecisions',[]),reason='Imported from an already committed legacy ICAR result')
    return commit(env,generation=1,generation_root=final_root,receipt_refs=[{'kind':'legacy-rfe-atomic-receipt','root':final_root}])

def adapt_vsr_authority_request(request: dict, reality_id='vsr-shared-reality') -> dict:
    sr=request.get('sharedReality') or {}
    base=int(sr.get('sequence',0)); state_root=str(sr.get('sharedStateHash') or '0'*64)
    if not is_hex64(state_root): state_root=_legacy_root(state_root)
    si=request.get('subjectIntent') or {}
    return new_proposal(
      reality_id=reality_id,base_generation=base,base_generation_root=state_root,
      subject={'subject_id':str(si.get('subjectId') or si.get('subject_id') or 'vsr-observer'),'kind':str(si.get('kind') or 'observer'),'roles':si.get('roles',[]),'responsibility_boundary':'visual-interaction-proposal'},
      intent={'intent_id':request.get('requestId','vsr-request'),'source':str(si.get('source') or si.get('intent') or 'VSR interaction proposal'),'goals':si.get('goals',[]),'constraints':[]},
      capability_plan={'plan_id':str(request.get('proposalHash') or 'vsr-plan'),'capabilities':[{'capability_id':'vsr.interaction.propose'}],'host_bindings':[{'runtime':request.get('bridgeRuntime','vsr')}],'required_scopes':[]},
      inputs=[{'kind':'projection-proposal','id':str(request.get('requestId','vsr-request')),'root':str(request.get('proposalHash') or _legacy_root(request)),'version':str(request.get('bridgeRuntime','unknown')),'continuity_class':'projection_state'}],
      provisional_delta={'operations':[{'op':'visual-interaction','target':reality_id,'proposal_root':str(request.get('interactionCommitHash') or request.get('proposalHash') or _legacy_root(request))}]},
      causal_basis={'events':[],'rules':[],'simulation_refs':[]},
      evidence={'nodes':[{'evidence_id':'vsr:request','kind':'projection-evidence','source':str(request.get('bridgeRuntime','VSR')),'content_root':str(request.get('requestHash') or _legacy_root(request))}],'edges':[]},
      extensions={'legacy_vsr_request':{'format':request.get('format'),'constitutional':request.get('constitutional',{})}}
    )
