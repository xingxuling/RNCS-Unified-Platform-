from __future__ import annotations
import copy, uuid
from typing import Any
from .canonical import ContractError, root_hash, without, is_hex64

FORMAT = 'rncs.reality-transition-envelope.v0.1'
VERSION = '0.1.0'
PHASES = {'proposed','authorized','committed','rejected','projected'}


def _clone(value): return copy.deepcopy(value)
def _require(cond: bool, code: str):
    if not cond: raise ContractError(code)
def _rooted(value: dict, field: str) -> dict:
    out=_clone(value); out.pop(field, None); out[field]=root_hash(out); return out

def _normalize_subject(subject: dict) -> dict:
    out={
      'subject_id': str(subject.get('subject_id') or subject.get('id') or ''),
      'kind': str(subject.get('kind') or 'human'),
      'roles': sorted(set(map(str, subject.get('roles') or []))),
      'responsibility_boundary': str(subject.get('responsibility_boundary') or 'declared-operation'),
    }
    _require(bool(out['subject_id']), 'SUBJECT_ID_REQUIRED')
    if subject.get('identity_root'): out['identity_root']=str(subject['identity_root'])
    return out

def _normalize_generation(value: dict) -> dict:
    out={'reality_id':str(value.get('reality_id') or ''),'generation':int(value.get('generation',0)),'generation_root':str(value.get('generation_root') or '0'*64)}
    _require(bool(out['reality_id']), 'REALITY_ID_REQUIRED')
    _require(out['generation']>=0, 'GENERATION_NEGATIVE')
    _require(is_hex64(out['generation_root']), 'GENERATION_ROOT_INVALID')
    return out

def _normalize_intent(intent: dict) -> dict:
    out={
      'intent_id':str(intent.get('intent_id') or f'intent:{uuid.uuid4()}'),
      'source':str(intent.get('source') or ''),
      'goals':_clone(intent.get('goals') or []),
      'constraints':_clone(intent.get('constraints') or []),
    }
    _require(bool(out['source']) or bool(out['goals']), 'INTENT_EMPTY')
    return _rooted(out,'intent_root')

def _normalize_plan(plan: dict) -> dict:
    out={
      'plan_id':str(plan.get('plan_id') or f'plan:{uuid.uuid4()}'),
      'capabilities':_clone(plan.get('capabilities') or []),
      'host_bindings':_clone(plan.get('host_bindings') or []),
      'required_scopes':sorted(set(map(str, plan.get('required_scopes') or []))),
    }
    return _rooted(out,'plan_root')

def _normalize_delta(delta: dict|None) -> dict:
    out={'operations':_clone((delta or {}).get('operations') or []),'provisional':True}
    return _rooted(out,'delta_root')

def _normalize_causal(value: dict|None) -> dict:
    value=value or {}
    out={'events':_clone(value.get('events') or []),'rules':_clone(value.get('rules') or []),'simulation_refs':_clone(value.get('simulation_refs') or [])}
    return _rooted(out,'causal_root')

def _normalize_evidence(value: dict|None) -> dict:
    value=value or {}
    nodes=[]
    for raw in value.get('nodes') or []:
        node=_clone(raw)
        node.setdefault('evidence_id',f'evidence:{uuid.uuid4()}')
        node.setdefault('kind','declaration')
        node.setdefault('source','unknown')
        node.pop('node_root',None); node['node_root']=root_hash(node)
        nodes.append(node)
    nodes.sort(key=lambda x:x['evidence_id'].encode('utf-8'))
    edges=_clone(value.get('edges') or [])
    edges.sort(key=lambda x:root_hash(x))
    return _rooted({'nodes':nodes,'edges':edges},'evidence_root')

def proposal_payload(env: dict) -> dict:
    return {
      'format':env['format'],'contract_version':env['contract_version'],'transition_id':env['transition_id'],
      'base_generation':env['base_generation'],'subject':env['subject'],
      'intent_root':env['intent']['intent_root'],'plan_root':env['capability_plan']['plan_root'],
      'inputs':env['inputs'],'delta_root':env['provisional_delta']['delta_root'],
      'causal_root':env['causal_basis']['causal_root'],'evidence_root':env['evidence']['evidence_root'],
      'host_state_refs':env['host_state_refs'],'extensions':env.get('extensions',{}),
    }

def reseal(env: dict) -> dict:
    out=_clone(env); out.pop('envelope_root',None); out['envelope_root']=root_hash(out); return out

def new_proposal(*, reality_id: str, base_generation: int, base_generation_root: str, subject: dict, intent: dict, capability_plan: dict, inputs=None, provisional_delta=None, causal_basis=None, evidence=None, host_state_refs=None, transition_id=None, extensions=None) -> dict:
    env={
      'format':FORMAT,'contract_version':VERSION,'transition_id':transition_id or f'transition:{uuid.uuid4()}',
      'phase':'proposed','base_generation':_normalize_generation({'reality_id':reality_id,'generation':base_generation,'generation_root':base_generation_root}),
      'subject':_normalize_subject(subject),'intent':_normalize_intent(intent),'capability_plan':_normalize_plan(capability_plan),
      'inputs':_clone(inputs or []),'provisional_delta':_normalize_delta(provisional_delta),'causal_basis':_normalize_causal(causal_basis),
      'authority':{'status':'pending','claims':[],'constraints':[]},'evidence':_normalize_evidence(evidence),
      'commit':{'status':'not_committed'},'projections':[],'host_state_refs':_clone(host_state_refs or []),'extensions':_clone(extensions or {}),
    }
    env['proposal_root']=root_hash(proposal_payload(env))
    return reseal(env)

def authorize(env: dict, *, status: str, resolver: str, claims=None, constraints=None, reason='') -> dict:
    verify(env)
    _require(env['phase']=='proposed','AUTHORITY_PHASE_INVALID')
    _require(status in {'approved','denied'},'AUTHORITY_STATUS_INVALID')
    out=_clone(env)
    decision={'status':status,'resolver':str(resolver),'proposal_root':out['proposal_root'],'claims':_clone(claims or []),'constraints':_clone(constraints or []),'reason':str(reason)}
    decision['decision_root']=root_hash(decision)
    out['authority']=decision
    if status=='approved': out['phase']='authorized'
    else:
        out['phase']='rejected'; out['commit']={'status':'rejected','reason':str(reason),'decision_root':decision['decision_root']}
    return reseal(out)

def commit(env: dict, *, generation: int, generation_root: str, receipt_refs=None) -> dict:
    verify(env)
    _require(env['phase']=='authorized','COMMIT_PHASE_INVALID')
    _require(env['authority']['status']=='approved','COMMIT_AUTHORITY_NOT_APPROVED')
    _require(generation>env['base_generation']['generation'],'COMMIT_GENERATION_NOT_ADVANCED')
    _require(is_hex64(generation_root),'COMMIT_GENERATION_ROOT_INVALID')
    out=_clone(env)
    result={'reality_id':env['base_generation']['reality_id'],'generation':int(generation),'generation_root':generation_root}
    payload={'proposal_root':out['proposal_root'],'decision_root':out['authority']['decision_root'],'result_generation':result,'receipt_refs':_clone(receipt_refs or [])}
    payload['commit_root']=root_hash(payload)
    out['commit']={'status':'committed',**payload}
    out['phase']='committed'
    return reseal(out)

def attach_projection(env: dict, projection: dict) -> dict:
    verify(env)
    _require(env['phase'] in {'committed','projected'},'PROJECTION_REQUIRES_COMMIT')
    p=_clone(projection)
    for key in ('projection_id','observer_id','modality','target_host','semantic_root'):
        _require(bool(p.get(key)),f'PROJECTION_{key.upper()}_REQUIRED')
    _require(is_hex64(p['semantic_root']),'PROJECTION_SEMANTIC_ROOT_INVALID')
    p.pop('projection_root',None); p['projection_root']=root_hash(p)
    out=_clone(env); out['projections'].append(p); out['projections'].sort(key=lambda x:x['projection_id'].encode('utf-8')); out['phase']='projected'
    return reseal(out)

def verify(env: dict) -> dict:
    errors=[]
    def check(cond, code):
        if not cond: errors.append(code)
    check(isinstance(env,dict),'ENVELOPE_NOT_OBJECT')
    if not isinstance(env,dict): return {'valid':False,'errors':errors}
    check(env.get('format')==FORMAT,'FORMAT_INVALID'); check(env.get('contract_version')==VERSION,'VERSION_INVALID'); check(env.get('phase') in PHASES,'PHASE_INVALID')
    try:
        check(root_hash(without(env,'envelope_root'))==env.get('envelope_root'),'ENVELOPE_ROOT_MISMATCH')
        check(root_hash(proposal_payload(env))==env.get('proposal_root'),'PROPOSAL_ROOT_MISMATCH')
        check(root_hash(without(env['intent'],'intent_root'))==env['intent'].get('intent_root'),'INTENT_ROOT_MISMATCH')
        check(root_hash(without(env['capability_plan'],'plan_root'))==env['capability_plan'].get('plan_root'),'PLAN_ROOT_MISMATCH')
        check(root_hash(without(env['provisional_delta'],'delta_root'))==env['provisional_delta'].get('delta_root'),'DELTA_ROOT_MISMATCH')
        check(root_hash(without(env['causal_basis'],'causal_root'))==env['causal_basis'].get('causal_root'),'CAUSAL_ROOT_MISMATCH')
        check(root_hash(without(env['evidence'],'evidence_root'))==env['evidence'].get('evidence_root'),'EVIDENCE_ROOT_MISMATCH')
        for node in env['evidence']['nodes']:
            check(root_hash(without(node,'node_root'))==node.get('node_root'),'EVIDENCE_NODE_ROOT_MISMATCH')
        if env.get('authority',{}).get('status') in {'approved','denied'}:
            check(root_hash(without(env['authority'],'decision_root'))==env['authority'].get('decision_root'),'DECISION_ROOT_MISMATCH')
            check(env['authority'].get('proposal_root')==env.get('proposal_root'),'DECISION_PROPOSAL_MISMATCH')
        if env.get('commit',{}).get('status')=='committed':
            c=env['commit']; check(root_hash(without(c,'status','commit_root'))==c.get('commit_root'),'COMMIT_ROOT_MISMATCH')
            check(c.get('decision_root')==env.get('authority',{}).get('decision_root'),'COMMIT_DECISION_MISMATCH')
            check(c.get('result_generation',{}).get('generation',-1)>env.get('base_generation',{}).get('generation',0),'COMMIT_GENERATION_NOT_ADVANCED')
        for p in env.get('projections',[]): check(root_hash(without(p,'projection_root'))==p.get('projection_root'),'PROJECTION_ROOT_MISMATCH')
        for ref in env.get('host_state_refs',[]):
            check('generation' not in ref,'HOST_STATE_MUST_NOT_DECLARE_GENERATION')
            check('snapshot_sequence' in ref,'HOST_STATE_SNAPSHOT_SEQUENCE_REQUIRED')
    except Exception as exc: errors.append(f'VERIFY_EXCEPTION:{type(exc).__name__}:{exc}')
    return {'valid':not errors,'errors':errors,'envelope_root':env.get('envelope_root'),'phase':env.get('phase')}
