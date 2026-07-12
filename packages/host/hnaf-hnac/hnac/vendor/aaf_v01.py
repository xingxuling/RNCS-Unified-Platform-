from __future__ import annotations
import copy, hashlib, json, re
from datetime import datetime, timezone
class AAFError(Exception):
    def __init__(self,code,message=None,details=None): super().__init__(message or code); self.code=code; self.details=details or {}
def _clone(x): return copy.deepcopy(x)
def _key(x): return str(x).encode('utf-8')
def canonical_json(v,path='$'):
    if v is None:return 'null'
    if v is True:return 'true'
    if v is False:return 'false'
    if isinstance(v,int) and not isinstance(v,bool):return str(v)
    if isinstance(v,float):raise AAFError('AAF_NON_INTEGER_NUMBER',f'Only integers at {path}')
    if isinstance(v,str):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
    if isinstance(v,list):return '['+','.join(canonical_json(x,f'{path}[]') for x in v)+']'
    if isinstance(v,dict):return '{'+','.join(canonical_json(str(k))+':'+canonical_json(v[k],f'{path}.{k}') for k in sorted(v,key=_key))+'}'
    raise AAFError('AAF_UNSUPPORTED_TYPE',f'Unsupported {type(v).__name__} at {path}')
def root_hash(v):return hashlib.sha256(canonical_json(v).encode()).hexdigest()
def without(o,*fields):return {k:_clone(v) for k,v in o.items() if k not in fields}
def seal(v,field):
    o=_clone(v);o.pop(field,None);o[field]=root_hash(o);return o
def verify_seal(v,field):return isinstance(v,dict) and isinstance(v.get(field),str) and root_hash(without(v,field))==v[field]
def uniq(xs):return sorted(set(map(str,xs or [])),key=_key)
def match(pattern,value):return re.fullmatch(re.escape(str(pattern)).replace(r'\*','.*'),str(value)) is not None
def seal_policy_bundle(raw):
    out={'format':'aaf.policy-bundle.v0.1','bundle_id':str(raw.get('bundle_id','')),'version':str(raw.get('version','0.1.0')),'default_effect':str(raw.get('default_effect','deny')),'policies':sorted(_clone(raw.get('policies',[])),key=lambda x:_key(x.get('policy_id',''))),'metadata':_clone(raw.get('metadata',{}))}
    if not out['bundle_id']:raise AAFError('POLICY_BUNDLE_ID_REQUIRED')
    return seal(out,'policy_bundle_root')
def verify_policy_bundle(v):return v.get('format')=='aaf.policy-bundle.v0.1' and verify_seal(v,'policy_bundle_root')
def seal_delegation(raw):
    out={'format':'aaf.delegation.v0.1','delegation_id':str(raw.get('delegation_id','')),'issuer_id':str(raw.get('issuer_id','')),'delegate_id':str(raw.get('delegate_id','')),'scopes':uniq(raw.get('scopes')),'capability_patterns':uniq(raw.get('capability_patterns',['*'])),'constraints':_clone(raw.get('constraints',{})),'not_before':str(raw.get('not_before','')),'expires_at':str(raw.get('expires_at','')),'max_depth':int(raw.get('max_depth',0)),'parent_delegation_id':raw.get('parent_delegation_id')}
    if not all([out['delegation_id'],out['issuer_id'],out['delegate_id']]):raise AAFError('DELEGATION_IDENTITY_REQUIRED')
    return seal(out,'delegation_root')
def verify_delegation(v):return v.get('format')=='aaf.delegation.v0.1' and verify_seal(v,'delegation_root')
def seal_approval(raw):
    out={'format':'aaf.approval-receipt.v0.1','approval_id':str(raw.get('approval_id','')),'proposal_root':str(raw.get('proposal_root','')),'approver_id':str(raw.get('approver_id','')),'approver_roles':uniq(raw.get('approver_roles')),'decision':str(raw.get('decision','approved')),'scopes':uniq(raw.get('scopes',['*'])),'conditions':_clone(raw.get('conditions',[])),'issued_at':str(raw.get('issued_at','')),'expires_at':str(raw.get('expires_at',''))}
    if not out['approval_id'] or not out['approver_id']:raise AAFError('APPROVAL_IDENTITY_REQUIRED')
    return seal(out,'approval_root')
def verify_approval(v):return v.get('format')=='aaf.approval-receipt.v0.1' and verify_seal(v,'approval_root')
def seal_revocations(raw):
    return seal({'format':'aaf.revocation-registry.v0.1','registry_id':str(raw.get('registry_id','')),'revoked_delegations':uniq(raw.get('revoked_delegations')),'revoked_approvals':uniq(raw.get('revoked_approvals')),'updated_at':str(raw.get('updated_at',''))},'revocation_root')
def verify_revocations(v):return v.get('format')=='aaf.revocation-registry.v0.1' and verify_seal(v,'revocation_root')
def _parse(s):
    try:return datetime.fromisoformat(s.replace('Z','+00:00')).timestamp()
    except:return None
def _window(now,a,b):
    n=_parse(now);x=_parse(a) if a else None;y=_parse(b) if b else None
    return n is not None and (x is None or n>=x) and (y is None or n<=y)
def _risk(steps):
    rank={'low':1,'medium':2,'high':3,'critical':4};return max((s.get('risk',{}).get('level','low') for s in steps),key=lambda x:rank.get(x,0),default='low')
def _applies(p,c):
    m=p.get('match',{})
    if m.get('scopes_any') and not any(any(match(x,s) for x in m['scopes_any']) for s in c['scopes']):return False
    if m.get('roles_any') and not any(r in m['roles_any'] for r in c['roles']):return False
    if m.get('capabilities_any') and not any(any(match(x,i) for x in m['capabilities_any']) for i in c['capability_ids']):return False
    if m.get('environments') and c['environment'] not in m['environments']:return False
    rank={'low':1,'medium':2,'high':3,'critical':4}
    if m.get('risk_at_least') and rank[c['risk']]<rank[m['risk_at_least']]:return False
    if m.get('risk_at_most') and rank[c['risk']]>rank[m['risk_at_most']]:return False
    if 'irreversible' in m and m['irreversible']!=c['irreversible']:return False
    if 'monetary_above' in m and c['monetary']<=m['monetary_above']:return False
    return True
def _proposal(envelope):
    e=_clone(envelope)
    if e.get('commit',{}).get('status')=='committed':raise AAFError('COMMITTED_ENVELOPE_CANNOT_REAUTHORIZE')
    if root_hash(without(e,'envelope_root'))!=e.get('envelope_root'):raise AAFError('ENVELOPE_INVALID')
    e['phase']='proposed';e['authority']={'status':'pending','claims':[],'constraints':[]};e['commit']={'status':'not_committed'};e['projections']=[];e.pop('envelope_root',None);e['envelope_root']=root_hash(e);return e
def _apply(e,d):
    if d['status'] not in ('approved','denied'):return e
    a={'status':d['status'],'resolver':'aaf:authority-fabric:v0.1','proposal_root':e['proposal_root'],'claims':d['claims'],'constraints':d['constraints'],'reason':d['reason'],'authority_decision_ref':d['decision_root']};a['decision_root']=root_hash(a);e=_clone(e);e['authority']=a
    if d['status']=='approved':e['phase']='authorized'
    else:e['phase']='rejected';e['commit']={'status':'rejected','reason':d['reason'],'decision_root':a['decision_root']}
    e.pop('envelope_root',None);e['envelope_root']=root_hash(e);return e
def evaluate_authority(*,envelope,negotiation=None,policy_bundle,delegations=None,approvals=None,revocations=None,identity_scopes=None,context=None,**_):
    e=_proposal(envelope);delegations=delegations or [];approvals=approvals or [];identity_scopes=identity_scopes or [];context=context or {}
    if not verify_policy_bundle(policy_bundle):raise AAFError('POLICY_BUNDLE_INVALID')
    steps=_clone((negotiation or {}).get('plan',{}).get('steps') or [{'capability_id':c.get('capability_id'),'required_scopes':c.get('required_scopes',[]),'risk':{'level':c.get('risk','low')},'reversible':c.get('reversible',True),'cost':c.get('cost',{})} for c in e.get('capability_plan',{}).get('capabilities',[])])
    scopes=uniq(e.get('capability_plan',{}).get('required_scopes',[])+sum((s.get('required_scopes',[]) for s in steps),[]));caps=uniq(s.get('capability_id') for s in steps);now=str(context.get('now',''));risk=_risk(steps);irr=any(not s.get('reversible',True) for s in steps);money=int(context.get('monetary_microunits',sum(int(s.get('cost',{}).get('monetary_microunits',0)) for s in steps)))
    revoked_d=set((revocations or {}).get('revoked_delegations',[]));revoked_a=set((revocations or {}).get('revoked_approvals',[]));direct=set(map(str,identity_scopes));claims=[]
    for scope in scopes:
        if '*' in direct or scope in direct:claims.append({'scope':scope,'granted':True,'source':'identity','reason':'direct-scope'});continue
        found=None
        for d in delegations:
            if verify_delegation(d) and d['delegation_id'] not in revoked_d and d['delegate_id']==e['subject']['subject_id'] and _window(now,d['not_before'],d['expires_at']) and any(match(x,scope) for x in d['scopes']) and all(any(match(x,c) for x in d['capability_patterns']) for c in caps):found=d;break
        claims.append({'scope':scope,'granted':bool(found),'source':'delegation' if found else 'none','reason':'delegated' if found else 'scope-not-held',**({'delegation_id':found['delegation_id']} if found else {})})
    c={'scopes':scopes,'roles':uniq(e['subject'].get('roles',[])),'capability_ids':caps,'environment':str(context.get('environment','local')),'risk':risk,'irreversible':irr,'monetary':money}
    matched=sorted([p for p in policy_bundle.get('policies',[]) if _applies(p,c)],key=lambda p:(-int(p.get('priority',0)),_key(p.get('policy_id',''))));denies=[p for p in matched if p.get('effect')=='deny'];reqs=[p for p in matched if p.get('effect')=='require_approval'];allows=[p for p in matched if p.get('effect')=='allow'];constraints=[{'policy_id':p['policy_id'],**x} for p in matched for x in p.get('constraints',[])];obligations=[{'policy_id':p['policy_id'],**x} for p in matched for x in p.get('obligations',[])];requirements=[]
    if any(not x['granted'] for x in claims):status,reason='denied','required-scope-not-held'
    elif denies:status,reason='denied','denied-by:'+','.join(p['policy_id'] for p in denies)
    elif reqs:
        roles=uniq(sum((p.get('approval',{}).get('roles',[]) for p in reqs),[]));quorum=max([int(p.get('approval',{}).get('quorum',1)) for p in reqs]+[1]);valid=[];denied=None
        for a in approvals:
            if not verify_approval(a) or a['approval_id'] in revoked_a or a['proposal_root']!=e['proposal_root'] or not _window(now,a['issued_at'],a['expires_at']):continue
            if a['decision']=='denied':denied=a;break
            if not roles or any(r in roles for r in a['approver_roles']):valid.append(a)
        unique=sorted(set(a['approver_id'] for a in valid))
        if denied:status,reason='denied','denied-by-approver:'+denied['approver_id']
        elif len(unique)>=quorum:status,reason='approved','approval-quorum-satisfied'
        else:status,reason='pending_approval',f'approval-required:{len(unique)}/{quorum}'
        requirements=[{'kind':'human-approval','roles':roles,'quorum':quorum,'proposal_root':e['proposal_root'],'policy_ids':[p['policy_id'] for p in reqs],'valid_approvers':unique,'invalid_approvals':[]}]
    elif allows or policy_bundle.get('default_effect')=='allow':status,reason='approved','allowed-by:'+','.join(p['policy_id'] for p in allows) if allows else 'allowed-by-default'
    else:status,reason='denied','default-deny'
    req={'format':'aaf.authority-request.v0.1','request_id':str(context.get('request_id','authority:'+e['transition_id'])),'proposal_root':e['proposal_root'],'envelope_root':e['envelope_root'],'subject':_clone(e['subject']),'requested_scopes':scopes,'capability_steps':steps,'context':{**_clone(context),'risk':risk,'irreversible':irr,'monetary_microunits':money},'policy_bundle_root':policy_bundle['policy_bundle_root'],'delegation_roots':uniq(d.get('delegation_root') for d in delegations),'approval_roots':uniq(a.get('approval_root') for a in approvals)};req=seal(req,'authority_request_root')
    result={'format':'aaf.authority-decision.v0.1','request':req,'proposal_root':e['proposal_root'],'status':status,'reason':reason,'claims':claims,'constraints':constraints,'obligations':obligations,'requirements':requirements,'risk_summary':{'level':risk,'irreversible':irr,'monetary_microunits':money,'capability_ids':caps},'matched_policies':[{'policy_id':p['policy_id'],'effect':p['effect'],'priority':int(p.get('priority',0))} for p in matched],'delegation_evidence':[{'scope':x['scope'],'delegation_id':x['delegation_id']} for x in claims if x.get('delegation_id')],'evaluated_at':now};result['decision_root']=root_hash(result);result['authorized_envelope']=_apply(e,result);return result
