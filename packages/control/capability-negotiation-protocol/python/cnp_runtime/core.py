from __future__ import annotations
import copy, hashlib, json, re

class CNPError(ValueError):
    def __init__(self, code: str, message: str, details=None):
        super().__init__(message); self.code=code; self.details=details or {}

def _check(v, path='$'):
    if v is None or isinstance(v,(str,bool)): return
    if isinstance(v,int) and not isinstance(v,bool):
        if abs(v) > 9007199254740991: raise CNPError('NON_SAFE_INTEGER', path)
        return
    if isinstance(v,float): raise CNPError('NON_INTEGER_NUMBER',path)
    if isinstance(v,list):
        for i,x in enumerate(v): _check(x,f'{path}[{i}]')
        return
    if isinstance(v,dict):
        for k,x in v.items():
            if not isinstance(k,str): raise CNPError('NON_STRING_KEY',path)
            _check(x,f'{path}.{k}')
        return
    raise CNPError('UNSUPPORTED_JSON_TYPE',path)

def canonicalize(v):
    _check(v)
    return json.dumps(v,ensure_ascii=False,separators=(',',':'),sort_keys=True)

def sha256_root(v): return hashlib.sha256(canonicalize(v).encode()).hexdigest()
def _seal(v,field):
    x=copy.deepcopy(v); x.pop(field,None); x[field]=sha256_root(x); return x
def _uniq(xs): return sorted(set(xs))
def _semver(v):
    m=re.match(r'^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$',v or '')
    if not m: raise CNPError('INVALID_SEMVER',str(v))
    return int(m[1]),int(m[2]),int(m[3]),m[4]
def _cmp(a,b):
    x,y=_semver(a),_semver(b)
    if x[:3]!=y[:3]: return (x[:3]>y[:3])-(x[:3]<y[:3])
    if x[3]==y[3]: return 0
    if x[3] is None:return 1
    if y[3] is None:return -1
    return (x[3]>y[3])-(x[3]<y[3])
def _satisfies(v,r='*'):
    _semver(v)
    if not r or r=='*':return True
    for c in r.split():
        if c.startswith('^'):
            b=c[1:]; bx=_semver(b); vx=_semver(v)
            ok=vx[0]==bx[0] and _cmp(v,b)>=0
        elif c.startswith('~'):
            b=c[1:]; bx=_semver(b); vx=_semver(v)
            ok=vx[:2]==bx[:2] and _cmp(v,b)>=0
        else:
            op='='; q=c
            for z in ('>=','<=','>','<','='):
                if c.startswith(z): op=z;q=c[len(z):];break
            n=_cmp(v,q); ok={'>=':n>=0,'<=':n<=0,'>':n>0,'<':n<0,'=':n==0}[op]
        if not ok:return False
    return True

def normalize_descriptor(i):
    d=copy.deepcopy(i)
    if not d.get('capability_id') or not d.get('version') or not d.get('provider_id'): raise CNPError('DESCRIPTOR_REQUIRED','required')
    _semver(d['version']); d['format']='cnp.capability-descriptor.v0.1';d['protocol_versions']=_uniq(d.get('protocol_versions',['0.1.0']));d['fulfills']=_uniq(d.get('fulfills',[]));d['inputs']=d.get('inputs',{});d['outputs']=d.get('outputs',{});d['required_scopes']=_uniq(d.get('required_scopes',[]));d['host_requirements']=_uniq(d.get('host_requirements',[]));d['constraints']=d.get('constraints',{})
    r=d.get('risk',{'level':'medium','reasons':[]}); r={'level':r,'reasons':[]} if isinstance(r,str) else r; r['reasons']=_uniq(r.get('reasons',[]));d['risk']=r
    d['reversible']=bool(d.get('reversible',False));d['execution_phase']=d.get('execution_phase','transaction');d['side_effects']=_uniq(d.get('side_effects',[]))
    ev=d.get('evidence',{'produces':[],'requires':[]});ev['produces']=_uniq(ev.get('produces',[]));ev['requires']=_uniq(ev.get('requires',[]));d['evidence']=ev
    c=d.get('cost',{});d['cost']={k:c.get(k,0) for k in ('cpu_millis','memory_mb','network_kb','monetary_microunits')}
    t=d.get('trust',{'level':0,'attestations':[]});t['attestations']=_uniq(t.get('attestations',[]));d['trust']=t;d['transport']=d.get('transport',{'kind':'local'});d['status']=d.get('status','available')
    return _seal(d,'descriptor_root')

def normalize_provider(i):
    p=copy.deepcopy(i)
    if not p.get('provider_id'):raise CNPError('PROVIDER_REQUIRED','required')
    p['format']='cnp.provider-manifest.v0.1';p['protocol_versions']=_uniq(p.get('protocol_versions',['0.1.0']));provider_trust=p.get('trust',{'level':0,'attestations':[]});p['capabilities']=sorted([normalize_descriptor({**x,'provider_id':x.get('provider_id',p['provider_id']),'trust':x.get('trust',provider_trust)}) for x in p.get('capabilities',[])],key=lambda x:(x['capability_id'],x['version']));p['transports']=p.get('transports',[{'kind':'local'}]);p['trust']=provider_trust;p['status']=p.get('status','available')
    return _seal(p,'provider_root')

def normalize_request(i):
    r=copy.deepcopy(i)
    if not r.get('request_id') or not r.get('subject') or not r.get('goals'):raise CNPError('REQUEST_REQUIRED','required')
    r['format']='cnp.negotiation-request.v0.1';r['protocol_versions']=_uniq(r.get('protocol_versions',['0.1.0']));r['subject']['scopes']=_uniq(r['subject'].get('scopes',[]));r['host']=r.get('host',{});r['host']['capabilities']=_uniq(r['host'].get('capabilities',[]));p=r.get('policy',{});p['max_risk']=p.get('max_risk','high');p['require_reversible']=bool(p.get('require_reversible',False));p['required_evidence']=_uniq(p.get('required_evidence',[]));p['minimum_trust']=p.get('minimum_trust',0);b=p.get('cost_budget',{});p['cost_budget']={k:b.get(k,2147483647) for k in ('cpu_millis','memory_mb','network_kb','monetary_microunits')};r['policy']=p;r['constraints']=r.get('constraints',{})
    return _seal(r,'request_root')

def negotiate(request,providers):
    req=normalize_request(request); ps=[normalize_provider(x) for x in providers];risk={'low':0,'medium':1,'high':2,'critical':3};offers={};chosen={}
    for g in req['goals']:
        key=g.get('goal_id',g['type']);cs=[]
        for p in ps:
            for d in p['capabilities']:
                reasons=[]
                if d['status']!='available' or p['status']!='available':reasons.append('provider-unavailable')
                if g['type'] not in d['fulfills']:reasons.append('goal-not-fulfilled')
                if not _satisfies(d['version'],g.get('version_range','*')):reasons.append('version-not-satisfied:'+g.get('version_range','*'))
                common=sorted(set(req['protocol_versions'])&set(d['protocol_versions']),key=lambda x:_semver(x),reverse=True);protocol=common[0] if common else None
                if not protocol:reasons.append('protocol-incompatible')
                ms=[x for x in d['required_scopes'] if x not in req['subject']['scopes']]; mh=[x for x in d['host_requirements'] if x not in req['host']['capabilities']]
                if ms:reasons.append('missing-scopes:'+','.join(ms))
                if mh:reasons.append('missing-host:'+','.join(mh))
                if risk[d['risk']['level']]>risk[req['policy']['max_risk']]:reasons.append('risk-exceeds:'+d['risk']['level'])
                if req['policy']['require_reversible'] and not d['reversible']:reasons.append('not-reversible')
                if d['trust'].get('level',0)<req['policy']['minimum_trust']:reasons.append('trust-below-minimum')
                me=[x for x in req['policy']['required_evidence'] if x not in d['evidence']['produces']]
                if me:reasons.append('missing-evidence:'+','.join(me))
                for k,v in req['policy']['cost_budget'].items():
                    if d['cost'].get(k,0)>v:reasons.append('cost-exceeds:'+k)
                goal_inputs=g.get('inputs',{})
                for name,spec in d.get('inputs',{}).items():
                    got=goal_inputs.get(name)
                    if spec.get('required') and got is None:reasons.append('missing-input:'+name)
                    elif got is not None and spec.get('type') and got.get('type') and spec.get('type')!=got.get('type'):reasons.append('input-type:'+name+':'+got.get('type')+'->'+spec.get('type'))
                rp=risk[d['risk']['level']]*10000; c=d['cost'];cost=c['cpu_millis']*10+c['memory_mb']+c['network_kb']*5+c['monetary_microunits'];tb=d['trust'].get('level',0)*100;rb=200 if d['reversible'] else 0;eb=len(set(d['evidence']['produces'])&set(req['policy']['required_evidence']))*500;v=_semver(d['version']);vb=v[0]*100+v[1]*10+v[2];score=1000000-rp-cost+tb+rb+eb+vb-len(reasons)*1000000
                cs.append({'capability_id':d['capability_id'],'capability_version':d['version'],'provider_id':d['provider_id'],'protocol_version':protocol,'eligible':not reasons,'rejection_reasons':reasons,'warnings':([] if d['reversible'] else ['irreversible'])+(['post-commit-side-effect'] if d['execution_phase']=='post-commit' else []),'score':score,'score_components':{'risk_penalty':rp,'cost_score':cost,'trust_bonus':tb,'reversible_bonus':rb,'evidence_bonus':eb,'version_bonus':vb},'descriptor_root':d['descriptor_root'],'execution_phase':d['execution_phase'],'reversible':d['reversible'],'risk':d['risk'],'cost':d['cost'],'required_scopes':d['required_scopes'],'host_requirements':d['host_requirements'],'evidence':d['evidence'],'transport':d['transport'],'inputs':d['inputs'],'outputs':d['outputs']})
        cs.sort(key=lambda x:(not x['eligible'],-x['score'],x['capability_id'],x['provider_id']))
        offers[key]=cs
        if next((x for x in cs if x['eligible']),None):chosen[key]=next(x for x in cs if x['eligible'])
    unresolved=[g.get('goal_id',g['type']) for g in req['goals'] if g.get('goal_id',g['type']) not in chosen];steps=[]
    for g in req['goals']:
        key=g.get('goal_id',g['type'])
        if key not in chosen:continue
        o=chosen[key];deps=[]
        for spec in g.get('inputs',{}).values():
            if isinstance(spec,dict) and spec.get('from_goal'):
                dep=next((s for s in steps if s['goal_id']==spec['from_goal']),None)
                if dep:deps.append(dep['step_id'])
        steps.append({'step_id':f'step:{len(steps)+1}','goal_id':key,'goal_type':g['type'],'capability_id':o['capability_id'],'capability_version':o['capability_version'],'provider_id':o['provider_id'],'protocol_version':o['protocol_version'],'depends_on':_uniq(deps),'execution_phase':o['execution_phase'],'reversible':o['reversible'],'risk':o['risk'],'cost':o['cost'],'required_scopes':o['required_scopes'],'host_requirements':o['host_requirements'],'evidence':o['evidence'],'descriptor_root':o['descriptor_root'],'transport':o['transport']})
    total={k:sum(s['cost'][k] for s in steps) for k in ('cpu_millis','memory_mb','network_kb','monetary_microunits')}
    plan=_seal({'format':'cnp.negotiation-plan.v0.1','request_id':req['request_id'],'request_root':req['request_root'],'provider_roots':sorted(p['provider_root'] for p in ps),'status':'unsatisfied' if unresolved else 'satisfied','unresolved_goals':unresolved,'steps':steps,'total_cost':total,'required_scopes':_uniq(x for s in steps for x in s['required_scopes']),'warnings':_uniq('contains-irreversible-step' for s in steps if not s['reversible'])},'plan_root')
    return _seal({'format':'cnp.negotiation-result.v0.1','request':req,'offers':offers,'plan':plan},'negotiation_root')
