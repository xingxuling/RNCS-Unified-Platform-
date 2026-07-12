from pathlib import Path
import json, tempfile, shutil, sys
ROOT=Path(__file__).parents[1]
sys.path.insert(0,str(ROOT/'python'))
sys.path.insert(0,'/mnt/data/_aaf_inputs/RFE_Core_SDK_v0.1.0')
sys.path.insert(0,'/mnt/data/_aaf_inputs')
from aaf_runtime import seal_policy_bundle,evaluate_authority
from rfe_core_sdk import RealityStore,commit_authorized_envelope
from rncs_contract import new_proposal,verify

tmp=Path(tempfile.mkdtemp(prefix='aaf-rfe-'))
try:
    store=RealityStore.init(tmp/'store',world_id='world:aaf-integration')
    base=store.generation_reference()
    env=new_proposal(
      reality_id=base['reality_id'],base_generation=base['generation'],base_generation_root=base['generation_root'],
      subject={'subject_id':'subject:agent-builder','kind':'agent','roles':['owner'],'responsibility_boundary':'project-authority'},
      intent={'intent_id':'intent:aaf-rfe','source':'建立经权威批准的项目状态','goals':[{'type':'project.status.set','value':'active'}],'constraints':['aaf-authority-required']},
      capability_plan={'plan_id':'plan:aaf-rfe','capabilities':[{'capability_id':'rfe.identity.create','required_scopes':['reality.write'],'risk':'low','reversible':True},{'capability_id':'rfe.fact.set','required_scopes':['reality.write'],'risk':'medium','reversible':True}], 'required_scopes':['reality.write']},
      provisional_delta={'operations':[{'op':'createIdentity','identity':{'id':'subject:agent-builder','kind':'agent'}},{'op':'createIdentity','identity':{'id':'project:aaf','kind':'project'}},{'op':'setFact','fact':{'subject':'project:aaf','predicate':'status','value':'active'}}]},
      transition_id='transition:aaf-rfe-integration')
    policy=seal_policy_bundle({'bundle_id':'policy:aaf-rfe','default_effect':'deny','policies':[{'policy_id':'allow-owner-reality-write','effect':'allow','priority':10,'match':{'roles_any':['owner'],'scopes_any':['reality.write'],'risk_at_most':'medium'},'obligations':[{'type':'rfe-commit-receipt'}]}]})
    decision=evaluate_authority(envelope=env,policy_bundle=policy,identity_scopes=['reality.write'],context={'now':'2026-06-30T12:00:00Z','environment':'local','request_id':'request:aaf-rfe'})
    assert decision['status']=='approved'
    assert decision['authorized_envelope']['phase']=='authorized'
    committed=commit_authorized_envelope(store,decision['authorized_envelope'])
    assert committed['envelope']['phase']=='committed'
    assert verify(committed['envelope'])['valid']
    out={'status':'PASS','aaf_decision_root':decision['decision_root'],'authority_status':decision['status'],'rfe_generation':committed['generation']['realityRevision'],'rfe_generation_root':committed['generation']['integrityHash'],'commit_receipt_root':committed['receipt']['integrityHash'],'final_envelope_phase':committed['envelope']['phase'],'fact':store.get_fact('project:aaf','status')}
    (ROOT/'evidence/AAF_TO_RFE_NATIVE_COMMIT_v0.1.0.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(out,ensure_ascii=False,indent=2))
finally:
    shutil.rmtree(tmp,ignore_errors=True)
