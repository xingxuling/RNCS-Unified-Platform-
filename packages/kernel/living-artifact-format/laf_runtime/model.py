from __future__ import annotations
import copy, datetime as dt, uuid
from typing import Any
from .canonical import LAFError, root_hash, is_hex64

FORMAT='laf.artifact.v1'
VERSION='1.0.0'
ZERO_ROOT='0'*64

def _now(): return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def _clone(v): return copy.deepcopy(v)
def _require(cond: bool, code: str):
    if not cond: raise LAFError(code)

def generation_ref(reality_id='reality:local', generation=0, generation_root=ZERO_ROOT):
    return {'reality_id':str(reality_id),'generation':int(generation),'generation_root':str(generation_root)}

def new_artifact(*, artifact_id: str, kind: str, title: str, owner_subject_id: str,
                 values: dict|None=None, field_schema: dict|None=None, relations: list|None=None,
                 tags: list|None=None, reality_id='reality:local') -> dict:
    now=_now()
    artifact={
      'format':FORMAT,'laf_version':VERSION,
      'identity':{
        'artifact_id':str(artifact_id),'kind':str(kind),'title':str(title),
        'owner_subject_id':str(owner_subject_id),'created_at':now,'updated_at':now,
      },
      'semantics':{
        'field_schema':_clone(field_schema or {}),'values':_clone(values or {}),
        'relations':_clone(relations or []),'tags':sorted(set(map(str,tags or []))),
      },
      'authority':{
        'default_role':'viewer',
        'roles':{'viewer':{'scopes':['artifact.read']},'editor':{'scopes':['artifact.read','artifact.propose']},'owner':{'scopes':['*']}},
        'policy_refs':[],'mutations_require_transition':True,
      },
      'affordances':[],
      'capabilities':{'provides':[],'requires':[]},
      'continuity':{
        'current':{
          'revision':0,'revision_root':ZERO_ROOT,'parent_revision_root':None,'branch':'main',
          'binding_status':'unbound','authoritative_generation':generation_ref(reality_id),
          'committed_transition_ref':None,
        },
        'branches':{},'history':[],
      },
      'host_state_refs':[],
      'projections':[],
      'evidence':{},
      'extensions':{},
    }
    return seal_revision(artifact, actor_subject_id=owner_subject_id, message='genesis', advance=False)

def semantic_payload(artifact): return _clone(artifact['semantics'])
def authority_payload(artifact): return _clone(artifact['authority'])
def affordance_payload(artifact): return _clone(artifact['affordances'])
def capability_payload(artifact): return _clone(artifact['capabilities'])
def projection_payload(artifact): return _clone(artifact['projections'])
def host_state_payload(artifact): return _clone(artifact['host_state_refs'])

def compute_component_roots(artifact: dict) -> dict:
    return {
      'semantic_root':root_hash(semantic_payload(artifact)),
      'authority_root':root_hash(authority_payload(artifact)),
      'affordance_root':root_hash(affordance_payload(artifact)),
      'capability_root':root_hash(capability_payload(artifact)),
      'projection_root':root_hash(projection_payload(artifact)),
      'host_state_root':root_hash(host_state_payload(artifact)),
    }

def revision_payload(artifact: dict, roots: dict|None=None) -> dict:
    roots=roots or compute_component_roots(artifact)
    c=artifact['continuity']['current']
    return {
      'artifact_id':artifact['identity']['artifact_id'],
      'revision':c['revision'],'parent_revision_root':c.get('parent_revision_root'),
      'branch':c['branch'],'binding_status':c['binding_status'],
      'authoritative_generation':c['authoritative_generation'],
      'committed_transition_ref':c.get('committed_transition_ref'),
      **roots,
    }

def artifact_payload(artifact: dict) -> dict:
    out=_clone(artifact); out.pop('evidence',None)
    return out

def seal_revision(artifact: dict, *, actor_subject_id: str, message: str, advance=True) -> dict:
    out=_clone(artifact)
    c=out['continuity']['current']
    previous=c.get('revision_root') if is_hex64(c.get('revision_root')) and c.get('revision_root') != ZERO_ROOT else None
    if advance:
        c['revision']=int(c.get('revision',0))+1
        c['parent_revision_root']=previous
        c['binding_status']='unbound'
        c['committed_transition_ref']=None
    out['identity']['updated_at']=_now()
    roots=compute_component_roots(out)
    c['revision_root']=root_hash(revision_payload(out,roots))
    out['continuity']['branches'][c['branch']]=c['revision_root']
    record={
      'revision':c['revision'],'revision_root':c['revision_root'],'parent_revision_root':c.get('parent_revision_root'),
      'branch':c['branch'],'actor_subject_id':str(actor_subject_id),'message':str(message),
      'created_at':out['identity']['updated_at'],'binding_status':c['binding_status'],
      'authoritative_generation':_clone(c['authoritative_generation']),
      **roots,
    }
    history=out['continuity'].setdefault('history',[])
    # replace same revision/root when sealing genesis or binding
    history=[h for h in history if h.get('revision_root')!=record['revision_root']]
    history.append(record)
    out['continuity']['history']=history
    out['evidence']={
      'algorithm':'sha256-rncs-canonical-v1',**roots,
      'revision_root':c['revision_root'],
    }
    out['evidence']['artifact_root']=root_hash(artifact_payload(out))
    return out

def _resolve_parent(container: Any, path: str, create=False):
    parts=[p for p in path.strip('/').split('/') if p]
    _require(bool(parts),'OP_PATH_EMPTY')
    cur=container
    for p in parts[:-1]:
        if isinstance(cur,dict):
            if p not in cur:
                _require(create,'OP_PATH_MISSING'); cur[p]={}
            cur=cur[p]
        elif isinstance(cur,list): cur=cur[int(p)]
        else: raise LAFError('OP_PATH_NOT_CONTAINER')
    return cur, parts[-1]

def apply_operations(artifact: dict, operations: list[dict], *, actor_subject_id: str, message='edit') -> dict:
    out=_clone(artifact)
    for op in operations:
        kind=op.get('op'); path=str(op.get('path',''))
        _require(path.startswith('/semantics/values/'),'OP_ONLY_SEMANTIC_VALUES_ALLOWED')
        parent,key=_resolve_parent(out,path,create=(kind=='set'))
        if kind=='set':
            if isinstance(parent,list): parent[int(key)]=_clone(op.get('value'))
            else: parent[key]=_clone(op.get('value'))
        elif kind=='delete':
            if isinstance(parent,list): parent.pop(int(key))
            else: parent.pop(key,None)
        elif kind=='append':
            target=parent[int(key)] if isinstance(parent,list) else parent.get(key)
            _require(isinstance(target,list),'OP_APPEND_TARGET_NOT_LIST'); target.append(_clone(op.get('value')))
        elif kind=='increment':
            target=parent[int(key)] if isinstance(parent,list) else parent.get(key)
            _require(isinstance(target,int) and not isinstance(target,bool),'OP_INCREMENT_TARGET_NOT_INT')
            value=int(op.get('value',1))
            if isinstance(parent,list): parent[int(key)]=target+value
            else: parent[key]=target+value
        elif kind=='toggle':
            target=parent[int(key)] if isinstance(parent,list) else parent.get(key)
            _require(isinstance(target,bool),'OP_TOGGLE_TARGET_NOT_BOOL')
            if isinstance(parent,list): parent[int(key)]=not target
            else: parent[key]=not target
        else: raise LAFError(f'OP_UNSUPPORTED:{kind}')
    return seal_revision(out,actor_subject_id=actor_subject_id,message=message,advance=True)

def create_branch(artifact: dict, branch: str, *, actor_subject_id: str) -> dict:
    out=_clone(artifact); branch=str(branch)
    _require(branch and branch not in out['continuity']['branches'],'BRANCH_EXISTS_OR_EMPTY')
    out['continuity']['branches'][branch]=out['continuity']['current']['revision_root']
    out['continuity']['current']['branch']=branch
    return seal_revision(out,actor_subject_id=actor_subject_id,message=f'create branch {branch}',advance=True)

def bind_generation(artifact: dict, *, transition_envelope: dict, actor_subject_id: str='system', verifier=None) -> dict:
    out=_clone(artifact)
    if verifier is None:
        try:
            from rncs_contract.lifecycle import verify as verifier
        except ImportError as exc:
            raise LAFError('RNCS_CONTRACT_RUNTIME_REQUIRED_FOR_BINDING') from exc
    verification=verifier(transition_envelope)
    _require(bool(verification.get('valid')), 'TRANSITION_VERIFICATION_FAILED:'+','.join(verification.get('errors') or []))
    _require(transition_envelope.get('format')=='rncs.reality-transition-envelope.v0.1','TRANSITION_FORMAT_INVALID')
    _require(transition_envelope.get('phase') in {'committed','projected'},'TRANSITION_NOT_COMMITTED')
    commit=transition_envelope.get('commit',{})
    _require(commit.get('status')=='committed','TRANSITION_NOT_COMMITTED')
    # Require this artifact root or id to be referenced by the transition inputs/extensions/delta.
    blob=str(transition_envelope)
    aid=out['identity']['artifact_id']; aroot=out['evidence']['artifact_root']
    _require(aid in blob or aroot in blob,'TRANSITION_DOES_NOT_REFERENCE_ARTIFACT')
    c=out['continuity']['current']
    c['binding_status']='bound'
    c['authoritative_generation']=_clone(commit['result_generation'])
    c['committed_transition_ref']=transition_envelope.get('transition_id')
    # Binding does not create another local revision; it reseals current revision identity.
    return seal_revision(out,actor_subject_id=actor_subject_id,message='bind authoritative generation',advance=False)

def validate_artifact(artifact: dict) -> dict:
    errors=[]
    def check(cond,code):
        if not cond: errors.append(code)
    if not isinstance(artifact,dict): return {'valid':False,'errors':['ARTIFACT_NOT_OBJECT']}
    check(artifact.get('format')==FORMAT,'FORMAT_INVALID')
    check(artifact.get('laf_version')==VERSION,'VERSION_INVALID')
    try:
        i=artifact['identity']; check(bool(i.get('artifact_id')),'ARTIFACT_ID_REQUIRED'); check(bool(i.get('kind')),'KIND_REQUIRED'); check(bool(i.get('title')),'TITLE_REQUIRED')
        c=artifact['continuity']['current']; check(isinstance(c.get('revision'),int) and c['revision']>=0,'REVISION_INVALID')
        check(is_hex64(c.get('revision_root')),'REVISION_ROOT_INVALID')
        g=c['authoritative_generation']; check(bool(g.get('reality_id')),'REALITY_ID_REQUIRED'); check(isinstance(g.get('generation'),int) and g['generation']>=0,'GENERATION_INVALID'); check(is_hex64(g.get('generation_root')),'GENERATION_ROOT_INVALID')
        check(c.get('binding_status') in {'unbound','bound'},'BINDING_STATUS_INVALID')
        if c.get('binding_status')=='bound': check(bool(c.get('committed_transition_ref')),'BOUND_TRANSITION_REF_REQUIRED')
        for ref in artifact.get('host_state_refs',[]):
            check('generation' not in ref,'HOST_STATE_MUST_NOT_DECLARE_GENERATION')
            check('snapshot_sequence' in ref,'HOST_STATE_SNAPSHOT_SEQUENCE_REQUIRED')
        roots=compute_component_roots(artifact)
        for k,v in roots.items(): check(artifact.get('evidence',{}).get(k)==v,f'{k.upper()}_MISMATCH')
        check(root_hash(revision_payload(artifact,roots))==c.get('revision_root'),'REVISION_ROOT_MISMATCH')
        check(root_hash(artifact_payload(artifact))==artifact.get('evidence',{}).get('artifact_root'),'ARTIFACT_ROOT_MISMATCH')
        check(artifact['continuity']['branches'].get(c['branch'])==c['revision_root'],'BRANCH_HEAD_MISMATCH')
    except Exception as exc: errors.append(f'VALIDATE_EXCEPTION:{type(exc).__name__}:{exc}')
    return {'valid':not errors,'errors':errors,'artifact_root':artifact.get('evidence',{}).get('artifact_root'),'revision_root':artifact.get('continuity',{}).get('current',{}).get('revision_root')}

def diff_artifacts(left: dict, right: dict) -> dict:
    def walk(a,b,path=''):
        changes=[]
        if type(a)!=type(b): return [{'path':path or '/','left':a,'right':b,'kind':'type-change'}]
        if isinstance(a,dict):
            for k in sorted(set(a)|set(b), key=lambda x:x.encode('utf-8')):
                p=f'{path}/{k}'
                if k not in a: changes.append({'path':p,'left':None,'right':b[k],'kind':'add'})
                elif k not in b: changes.append({'path':p,'left':a[k],'right':None,'kind':'remove'})
                else: changes.extend(walk(a[k],b[k],p))
        elif isinstance(a,list):
            if a!=b: changes.append({'path':path or '/','left':a,'right':b,'kind':'replace'})
        elif a!=b: changes.append({'path':path or '/','left':a,'right':b,'kind':'replace'})
        return changes
    return {'left_revision_root':left['continuity']['current']['revision_root'],'right_revision_root':right['continuity']['current']['revision_root'],'changes':walk(left['semantics'],right['semantics'])}

def three_way_merge(base: dict,left: dict,right: dict, *, actor_subject_id='merge') -> tuple[dict,list]:
    b=base['semantics']['values']; l=left['semantics']['values']; r=right['semantics']['values']
    merged={}; conflicts=[]
    for key in sorted(set(b)|set(l)|set(r), key=lambda x:x.encode('utf-8')):
        bv=b.get(key); lv=l.get(key); rv=r.get(key)
        if lv==rv: merged[key]=_clone(lv)
        elif lv==bv: merged[key]=_clone(rv)
        elif rv==bv: merged[key]=_clone(lv)
        else:
            merged[key]={'$conflict':{'base':_clone(bv),'left':_clone(lv),'right':_clone(rv)}}
            conflicts.append({'path':f'/semantics/values/{key}','base':bv,'left':lv,'right':rv})
    out=_clone(left); out['semantics']['values']=merged
    out['extensions'].setdefault('laf.merge',{})['conflicts']=_clone(conflicts)
    out=seal_revision(out,actor_subject_id=actor_subject_id,message='three-way merge',advance=True)
    return out,conflicts
