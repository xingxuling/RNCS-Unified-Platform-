from __future__ import annotations
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterable
import copy, json, os, time, uuid
from urllib.parse import quote
from .canonical import canonical_json, root_hash, with_integrity, verify_integrity
from .errors import RFEError, IntegrityError, ConflictError, ValidationError

CONTENT_FORMAT='rfe.content-object.v1'
GENERATION_FORMAT='rfe.generation.v0.3'
POINTER_FORMAT='rfe.branch-pointer.v0.3'
STORE_FORMAT='rfe.local-core-store.v0.1'


def _clone(v): return copy.deepcopy(v)
def _sort_text(values): return sorted(values, key=lambda s:s.encode('utf-16-be', errors='surrogatepass'))
def _json_read(path: Path):
    try: return json.loads(path.read_text('utf-8'))
    except FileNotFoundError: raise RFEError('RFE_FILE_NOT_FOUND', str(path))
def _json_write_atomic(path: Path, value: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp=path.with_name(path.name+f'.tmp-{os.getpid()}-{uuid.uuid4().hex}')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=False)+'\n','utf-8')
    os.replace(tmp,path)

def _active(record: dict[str,Any], logical_time:int) -> bool:
    return int(record.get('validFrom',0)) <= logical_time and (record.get('validTo') is None or logical_time < int(record['validTo']))

def _semantic_relation(r):
    return {'type':r['type'],'from':r['from'],'to':r['to'],'qualifiers':r.get('qualifiers',{})}

def _relation_key(r): return canonical_json(_semantic_relation(r))

def _fact_key(f): return f"{f['subject']}\u0000{f['predicate']}"

def _normalize_operations(operations, authority):
    out=[]
    for raw in operations:
        op=_clone(raw); kind=op.get('op')
        if kind=='createIdentity':
            i=op['identity']; i.setdefault('continuityPolicy','persistent'); i.setdefault('createdAt','$logicalTime'); i.setdefault('retiredAt',None); i.setdefault('lineage',[]); i.setdefault('metadata',{})
        elif kind=='setFact':
            f=op['fact']; f.setdefault('source','source:runtime'); f.setdefault('confidence',1); f.setdefault('visibility',{'type':'public'}); f.setdefault('authority',authority)
        elif kind=='addRelation':
            r=op['relation']; r.setdefault('qualifiers',{}); r.setdefault('authority',authority)
        out.append(op)
    return out

class RealityTransaction:
    def __init__(self, store:'RealityStore', branch_id:str, actor:str, intent:Any, authority:str, base_generation_id:str|None=None, transaction_id:str|None=None, evidence:list|None=None):
        self.store=store; self.branch_id=branch_id; self.actor=actor; self.intent=_clone(intent); self.authority=authority
        self.base_generation_id=base_generation_id or store.current_generation(branch_id)['generationId']
        self.transaction_id=transaction_id or f'transaction:{uuid.uuid4()}'
        self.evidence=_clone(evidence or [])
        self.operations=[]; self._committed=False
    def create_identity(self, identity_id:str, kind:str, *, continuity_policy='persistent', metadata=None):
        self.operations.append({'op':'createIdentity','identity':{'id':identity_id,'kind':kind,'continuityPolicy':continuity_policy,'createdAt':'$logicalTime','retiredAt':None,'lineage':[],'metadata':_clone(metadata or {})}}); return self
    def retire_identity(self, identity_id:str): self.operations.append({'op':'retireIdentity','identityId':identity_id}); return self
    def set_fact(self, subject:str, predicate:str, value:Any, *, source='source:runtime', confidence=1, visibility=None):
        self.operations.append({'op':'setFact','fact':{'subject':subject,'predicate':predicate,'value':_clone(value),'source':source,'confidence':confidence,'visibility':_clone(visibility or {'type':'public'}),'authority':self.authority}}); return self
    def retract_fact(self, subject:str, predicate:str): self.operations.append({'op':'retractFact','subject':subject,'predicate':predicate}); return self
    def add_relation(self, relation_type:str, from_id:str, to_id:str, *, qualifiers=None):
        self.operations.append({'op':'addRelation','relation':{'type':relation_type,'from':from_id,'to':to_id,'qualifiers':_clone(qualifiers or {}),'authority':self.authority}}); return self
    def remove_relation(self, relation_type:str, from_id:str, to_id:str, *, qualifiers=None):
        op={'op':'removeRelation','match':{'type':relation_type,'from':from_id,'to':to_id}}
        if qualifiers is not None: op['match']['qualifiers']=_clone(qualifiers)
        self.operations.append(op); return self
    def add_evidence(self, item:Any): self.evidence.append(_clone(item)); return self
    def commit(self):
        if self._committed: raise RFEError('RFE_TRANSACTION_ALREADY_COMMITTED', self.transaction_id)
        result=self.store.commit(self); self._committed=True; return result

class RealityStore:
    def __init__(self, root: str|Path): self.root=Path(root)
    @classmethod
    def init(cls, root:str|Path, *, world_id='world:default', branch_id='branch:main', overwrite=False):
        store=cls(root)
        if store.root.exists() and any(store.root.iterdir()):
            if not overwrite: raise RFEError('RFE_STORE_EXISTS', str(store.root))
            import shutil; shutil.rmtree(store.root)
        for d in ['objects','generations','branches']: (store.root/d).mkdir(parents=True,exist_ok=True)
        meta=with_integrity({'format':STORE_FORMAT,'sdkVersion':'0.1.0','worldId':world_id,'defaultBranch':branch_id,'canonical':'rfe-stable-json-v1','digest':'sha256'})
        _json_write_atomic(store.root/'store.json',meta)
        refs={
            'identity':store._put_object('identity-group',[]),
            'event-ledger':store._put_object('event-ledger',[]),
        }
        gen=store._make_generation(branch_id=branch_id, revision=0, logical_time=0, parent=None, parent_evidence=None, refs=refs, authority_event_head=None)
        store._persist_generation(gen); store._write_pointer(branch_id,gen)
        return store
    @property
    def metadata(self):
        m=_json_read(self.root/'store.json')
        if not verify_integrity(m): raise IntegrityError('RFE_STORE_METADATA_TAMPERED', str(self.root/'store.json'))
        return m
    @property
    def world_id(self): return self.metadata['worldId']
    @property
    def default_branch(self): return self.metadata['defaultBranch']
    def transaction(self, *, actor:str, intent:Any, authority:str, branch_id:str|None=None, base_generation_id:str|None=None, transaction_id:str|None=None, evidence:list|None=None):
        return RealityTransaction(self,branch_id or self.default_branch,actor,intent,authority,base_generation_id,transaction_id,evidence)
    def _branch_file(self, branch_id): return self.root/'branches'/f'{root_hash(branch_id)}.CURRENT.json'
    def branch_exists(self, branch_id): return self._branch_file(branch_id).exists()
    def _write_pointer(self, branch_id, generation):
        ptr=with_integrity({'format':POINTER_FORMAT,'branchId':branch_id,'generationId':generation['generationId'],'generationRoot':generation['integrityHash'],'revision':generation['realityRevision']})
        _json_write_atomic(self._branch_file(branch_id),ptr)
    def current_pointer(self, branch_id=None):
        branch_id=branch_id or self.default_branch; p=_json_read(self._branch_file(branch_id))
        if not verify_integrity(p): raise IntegrityError('RFE_POINTER_TAMPERED',branch_id)
        if p.get('branchId')!=branch_id: raise IntegrityError('RFE_POINTER_BRANCH_MISMATCH',branch_id)
        return p
    def current_generation(self, branch_id=None): return self.load_generation(self.current_pointer(branch_id)['generationId'])
    def _generation_path(self,generation_id):
        encoded=self.root/'generations'/quote(generation_id,safe='')/'generation.json'
        legacy=self.root/'generations'/generation_id/'generation.json'
        return encoded if encoded.exists() or encoded==legacy or not legacy.exists() else legacy
    def load_generation(self,generation_id):
        g=_json_read(self._generation_path(generation_id))
        if not verify_integrity(g): raise IntegrityError('RFE_GENERATION_TAMPERED',generation_id)
        marker=self._generation_path(generation_id).parent/'COMMITTED'
        if not marker.exists() or marker.read_text('utf-8').strip()!=g['integrityHash']: raise IntegrityError('RFE_GENERATION_NOT_COMMITTED',generation_id)
        return g
    def _object_path(self,ref): return self.root/'objects'/ref[:2]/f'{ref}.json'
    def _put_object(self, kind, value):
        body={'format':CONTENT_FORMAT,'kind':kind,'value':_clone(value)}; ref=root_hash(body); obj={**body,'integrityHash':ref}
        path=self._object_path(ref)
        if path.exists():
            existing=_json_read(path)
            if existing!=obj: raise IntegrityError('RFE_CONTENT_ADDRESS_COLLISION',ref)
        else: _json_write_atomic(path,obj)
        return ref
    def load_object(self,ref):
        obj=_json_read(self._object_path(ref)); expected=obj.get('integrityHash')
        actual=root_hash({k:v for k,v in obj.items() if k!='integrityHash'})
        if expected!=ref or actual!=ref: raise IntegrityError('RFE_OBJECT_TAMPERED',ref)
        return obj
    def _semantic_root(self,refs):
        return root_hash({'format':'rfe.semantic-root.v1','refs':{k:refs[k] for k in _sort_text([x for x in refs if x!='event-ledger'])}})
    def _evidence_root(self,semantic,event_ref,parent_evidence):
        return root_hash({'format':'rfe.evidence-root.v1','semanticRoot':semantic,'eventLedgerRef':event_ref,'parentEvidenceRoot':parent_evidence})
    def _make_generation(self,*,branch_id,revision,logical_time,parent,parent_evidence,refs,authority_event_head):
        semantic=self._semantic_root(refs); evidence=self._evidence_root(semantic,refs.get('event-ledger',''),parent_evidence)
        seed={'branchId':branch_id,'revision':revision,'parent':parent,'refs':refs,'evidenceRoot':evidence}
        generation_id=f"generation:{revision}:{root_hash(seed)[:20]}"
        body={'format':GENERATION_FORMAT,'worldId':self.world_id,'branchId':branch_id,'generationId':generation_id,'parentGenerationId':parent,'realityRevision':revision,'logicalTime':logical_time,'semanticRoot':semantic,'evidenceRoot':evidence,'authorityEventHead':authority_event_head,'refs':{k:refs[k] for k in _sort_text(list(refs))}}
        return with_integrity(body)
    def _persist_generation(self,generation):
        final=self._generation_path(generation['generationId']).parent
        if final.exists():
            existing=self.load_generation(generation['generationId'])
            if existing!=generation: raise IntegrityError('RFE_GENERATION_ID_COLLISION',generation['generationId'])
            return
        tmp=self.root/'generations'/f".tmp-{quote(generation['generationId'],safe='')}-{uuid.uuid4().hex}"
        tmp.mkdir(parents=True); _json_write_atomic(tmp/'generation.json',generation); (tmp/'COMMITTED').write_text(generation['integrityHash']+'\n','utf-8'); os.replace(tmp,final)
    def _load_state(self,generation):
        identities=_clone(self.load_object(generation['refs']['identity'])['value'])
        facts=[]; relations=[]; events=[]
        for key,ref in generation['refs'].items():
            if key.startswith('fact:'): facts.extend(_clone(self.load_object(ref)['value']))
            elif key.startswith('relation:'): relations.extend(_clone(self.load_object(ref)['value']))
            elif key=='event-ledger': events=_clone(self.load_object(ref)['value'])
        return {'identities':identities,'facts':facts,'relations':relations,'events':events}
    def materialize(self,generation_id=None,branch_id=None):
        g=self.load_generation(generation_id) if generation_id else self.current_generation(branch_id)
        return {'generation':_clone(g),**self._load_state(g)}
    def _validate_state(self,state,logical_time):
        ids=[i['id'] for i in state['identities']]
        if len(ids)!=len(set(ids)): raise ValidationError('RFE_IDENTITY_DUPLICATE','identity IDs must be unique')
        idset=set(ids)
        for f in state['facts']:
            if f['subject'] not in idset: raise ValidationError('RFE_FACT_DANGLING_SUBJECT',f['subject'])
            if f.get('validTo') is not None and int(f['validTo'])<=int(f['validFrom']): raise ValidationError('RFE_FACT_INTERVAL_INVALID',f['id'])
        active={}
        for f in state['facts']:
            if _active(f,logical_time):
                k=_fact_key(f)
                if k in active: raise ValidationError('RFE_ACTIVE_FACT_DUPLICATE',k)
                active[k]=f
        for r in state['relations']:
            if r['from'] not in idset or r['to'] not in idset: raise ValidationError('RFE_RELATION_DANGLING_ENDPOINT',r.get('id','unknown'))
            if r.get('validTo') is not None and int(r['validTo'])<=int(r['validFrom']): raise ValidationError('RFE_RELATION_INTERVAL_INVALID',r['id'])
    def _apply_operations(self,state,operations,logical_time,authority,transaction_id):
        identities=state['identities']; facts=state['facts']; relations=state['relations']
        idmap={i['id']:i for i in identities}
        for index,op in enumerate(operations):
            kind=op.get('op')
            if kind=='createIdentity':
                identity=_clone(op['identity']); identity['createdAt']=logical_time if identity.get('createdAt')=='$logicalTime' else int(identity.get('createdAt',logical_time))
                if identity['id'] in idmap: raise ValidationError('RFE_IDENTITY_EXISTS',identity['id'])
                identities.append(identity); idmap[identity['id']]=identity
            elif kind=='retireIdentity':
                identity=idmap.get(op['identityId'])
                if not identity: raise ValidationError('RFE_IDENTITY_NOT_FOUND',op['identityId'])
                identity['retiredAt']=logical_time
            elif kind=='setFact':
                spec=_clone(op['fact']); subject=spec['subject']; predicate=spec['predicate']
                if subject not in idmap: raise ValidationError('RFE_FACT_DANGLING_SUBJECT',subject)
                for f in facts:
                    if f['subject']==subject and f['predicate']==predicate and _active(f,logical_time): f['validTo']=logical_time
                payload={'transactionId':transaction_id,'operation':index,'subject':subject,'predicate':predicate,'value':spec['value'],'logicalTime':logical_time}
                facts.append({'id':f"fact:{root_hash(payload)[:24]}",'subject':subject,'predicate':predicate,'value':spec['value'],'validFrom':logical_time,'validTo':None,'source':spec.get('source','source:runtime'),'confidence':spec.get('confidence',1),'visibility':spec.get('visibility',{'type':'public'}),'authority':spec.get('authority',authority)})
            elif kind=='retractFact':
                found=False
                for f in facts:
                    if f['subject']==op['subject'] and f['predicate']==op['predicate'] and _active(f,logical_time): f['validTo']=logical_time; found=True
                if not found: raise ValidationError('RFE_FACT_NOT_ACTIVE',f"{op['subject']}:{op['predicate']}")
            elif kind=='addRelation':
                spec=_clone(op['relation'])
                if spec['from'] not in idmap or spec['to'] not in idmap: raise ValidationError('RFE_RELATION_DANGLING_ENDPOINT',f"{spec['from']}->{spec['to']}")
                semantic=_semantic_relation(spec)
                if any(_active(r,logical_time) and _semantic_relation(r)==semantic for r in relations): raise ValidationError('RFE_RELATION_EXISTS',_relation_key(spec))
                payload={'transactionId':transaction_id,'operation':index,'relation':semantic,'logicalTime':logical_time}
                relations.append({'id':f"relation:{root_hash(payload)[:24]}",**semantic,'validFrom':logical_time,'validTo':None,'authority':spec.get('authority',authority)})
            elif kind=='removeRelation':
                match=op['match']; found=False
                for r in relations:
                    same=r['type']==match['type'] and r['from']==match['from'] and r['to']==match['to']
                    if 'qualifiers' in match: same=same and r.get('qualifiers',{})==match['qualifiers']
                    if same and _active(r,logical_time): r['validTo']=logical_time; found=True
                if not found: raise ValidationError('RFE_RELATION_NOT_ACTIVE',canonical_json(match))
            else: raise ValidationError('RFE_OPERATION_UNSUPPORTED',str(kind))
        self._validate_state(state,logical_time)
    @contextmanager
    def _lock(self,timeout=5.0):
        path=self.root/'.write.lock'; start=time.monotonic(); fd=None
        while True:
            try: fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY); os.write(fd,f'{os.getpid()}\n'.encode()); break
            except FileExistsError:
                if time.monotonic()-start>timeout: raise ConflictError('RFE_STORE_LOCK_TIMEOUT',str(path))
                time.sleep(.02)
        try: yield
        finally:
            if fd is not None: os.close(fd)
            try:path.unlink()
            except FileNotFoundError:pass
    def commit(self,tx:RealityTransaction):
        with self._lock():
            current=self.current_generation(tx.branch_id)
            if current['generationId']!=tx.base_generation_id: raise ConflictError('RFE_STALE_BASE',f"expected {current['generationId']}, got {tx.base_generation_id}")
            state=self._load_state(current); logical=int(current['logicalTime'])+1; revision=int(current['realityRevision'])+1
            operations=_normalize_operations(tx.operations,tx.authority)
            self._apply_operations(state,operations,logical,tx.authority,tx.transaction_id)
            op_root=root_hash(operations)
            event_body={'format':'rfe.authority-event.v0.1','eventId':f"event:{root_hash({'tx':tx.transaction_id,'base':current['generationId'],'operationsRoot':op_root})[:24]}",'transactionId':tx.transaction_id,'actor':tx.actor,'intent':_clone(tx.intent),'authority':tx.authority,'baseGenerationId':current['generationId'],'logicalTime':logical,'operationsRoot':op_root,'evidence':_clone(tx.evidence)}
            event=with_integrity(event_body); state['events'].append(event)
            refs={'identity':self._put_object('identity-group',sorted(state['identities'],key=lambda i:i['id'].encode('utf-16-be'))),'event-ledger':self._put_object('event-ledger',state['events'])}
            for predicate in _sort_text(list({f['predicate'] for f in state['facts']})):
                group=sorted([f for f in state['facts'] if f['predicate']==predicate],key=lambda f:(f['subject'].encode('utf-16-be'),int(f['validFrom']),f['id']))
                refs[f'fact:{predicate}']=self._put_object('fact-group',group)
            for rtype in _sort_text(list({r['type'] for r in state['relations']})):
                group=sorted([r for r in state['relations'] if r['type']==rtype],key=lambda r:(r['from'].encode('utf-16-be'),r['to'].encode('utf-16-be'),int(r['validFrom']),r['id']))
                refs[f'relation:{rtype}']=self._put_object('relation-group',group)
            gen=self._make_generation(branch_id=tx.branch_id,revision=revision,logical_time=logical,parent=current['generationId'],parent_evidence=current['evidenceRoot'],refs=refs,authority_event_head=event['eventId'])
            self._persist_generation(gen)
            # Re-check optimistic base immediately before pointer swap.
            if self.current_generation(tx.branch_id)['generationId']!=current['generationId']: raise ConflictError('RFE_POINTER_CHANGED_DURING_COMMIT',tx.branch_id)
            self._write_pointer(tx.branch_id,gen)
            receipt=with_integrity({'format':'rfe.local-commit-receipt.v0.1','transactionId':tx.transaction_id,'branchId':tx.branch_id,'baseGenerationId':current['generationId'],'resultGenerationId':gen['generationId'],'resultGenerationRoot':gen['integrityHash'],'eventId':event['eventId'],'operationsRoot':op_root,'evidenceRoot':gen['evidenceRoot']})
            return {'generation':gen,'event':event,'receipt':receipt}
    def get_identity(self,identity_id,generation_id=None,branch_id=None):
        m=self.materialize(generation_id,branch_id); return next((_clone(i) for i in m['identities'] if i['id']==identity_id),None)
    def get_fact(self,subject,predicate,generation_id=None,branch_id=None):
        m=self.materialize(generation_id,branch_id); t=m['generation']['logicalTime']
        candidates=[f for f in m['facts'] if f['subject']==subject and f['predicate']==predicate and _active(f,t)]
        return _clone(candidates[0]) if candidates else None
    def fact_history(self,subject,predicate,generation_id=None,branch_id=None):
        m=self.materialize(generation_id,branch_id); return [_clone(f) for f in m['facts'] if f['subject']==subject and f['predicate']==predicate]
    def relations(self,relation_type=None,from_id=None,to_id=None,generation_id=None,branch_id=None,current=True):
        m=self.materialize(generation_id,branch_id); t=m['generation']['logicalTime']; out=[]
        for r in m['relations']:
            if relation_type and r['type']!=relation_type: continue
            if from_id and r['from']!=from_id: continue
            if to_id and r['to']!=to_id: continue
            if current and not _active(r,t): continue
            out.append(_clone(r))
        return out
    def events(self,generation_id=None,branch_id=None): return self.materialize(generation_id,branch_id)['events']
    def generation_reference(self,generation_id=None,branch_id=None):
        g=self.load_generation(generation_id) if generation_id else self.current_generation(branch_id)
        return {'format':'rncs.generation-reference.v0.1','reality_id':g['worldId'],'generation':g['realityRevision'],'generation_root':g['integrityHash'],'rfe_generation_id':g['generationId'],'branch_id':g['branchId'],'evidence_root':g['evidenceRoot']}
    def fork_branch(self,new_branch_id,*,from_branch_id=None,from_generation_id=None,actor='subject:system',authority='authority:system'):
        with self._lock():
            if self.branch_exists(new_branch_id): raise ConflictError('RFE_BRANCH_EXISTS',new_branch_id)
            source=self.load_generation(from_generation_id) if from_generation_id else self.current_generation(from_branch_id or self.default_branch)
            state=self._load_state(source); logical=int(source['logicalTime'])+1
            fork_event=with_integrity({'format':'rfe.authority-event.v0.1','eventId':f"event:{root_hash({'fork':new_branch_id,'from':source['generationId']})[:24]}",'transactionId':f'fork:{new_branch_id}','actor':actor,'intent':{'type':'fork-branch','newBranchId':new_branch_id},'authority':authority,'baseGenerationId':source['generationId'],'logicalTime':logical,'operationsRoot':root_hash([]),'evidence':[{'kind':'branch-lineage','sourceBranch':source['branchId']}]})
            state['events'].append(fork_event); refs=dict(source['refs']); refs['event-ledger']=self._put_object('event-ledger',state['events'])
            gen=self._make_generation(branch_id=new_branch_id,revision=0,logical_time=logical,parent=source['generationId'],parent_evidence=source['evidenceRoot'],refs=refs,authority_event_head=fork_event['eventId'])
            self._persist_generation(gen); self._write_pointer(new_branch_id,gen); return gen
    def _current_maps(self,generation):
        state=self._load_state(generation); t=generation['logicalTime']
        ids={i['id']:i for i in state['identities'] if i.get('retiredAt') is None or t<int(i['retiredAt'])}
        facts={_fact_key(f):f for f in state['facts'] if _active(f,t)}
        rels={_relation_key(r):r for r in state['relations'] if _active(r,t)}
        return ids,facts,rels
    def diff(self,left_generation_id,right_generation_id):
        l=self.load_generation(left_generation_id); r=self.load_generation(right_generation_id); li,lf,lr=self._current_maps(l); ri,rf,rr=self._current_maps(r)
        def compare(a,b,strip=()):
            added=[_clone(b[k]) for k in _sort_text([x for x in b if x not in a])]
            removed=[_clone(a[k]) for k in _sort_text([x for x in a if x not in b])]
            changed=[]
            for k in _sort_text([x for x in a if x in b]):
                av={x:y for x,y in a[k].items() if x not in strip}; bv={x:y for x,y in b[k].items() if x not in strip}
                if av!=bv: changed.append({'key':k,'before':_clone(a[k]),'after':_clone(b[k])})
            return {'added':added,'removed':removed,'changed':changed}
        out={'format':'rfe.generation-diff.v0.1','left':left_generation_id,'right':right_generation_id,'identities':compare(li,ri),'facts':compare(lf,rf,('id','validFrom','validTo','authority','source')),'relations':compare(lr,rr,('id','validFrom','validTo','authority'))}
        out['diffRoot']=root_hash(out); return out
    def _ancestor_chain(self,generation_id):
        chain=[]; cur=generation_id
        while cur:
            g=self.load_generation(cur); chain.append(cur); cur=g.get('parentGenerationId')
        return chain
    def common_ancestor(self,a,b):
        aset=set(self._ancestor_chain(a))
        return next((x for x in self._ancestor_chain(b) if x in aset),None)
    def merge(self,source_branch_id,target_branch_id,*,actor,authority,transaction_id=None):
        source=self.current_generation(source_branch_id); target=self.current_generation(target_branch_id); base_id=self.common_ancestor(source['generationId'],target['generationId'])
        if not base_id: raise ConflictError('RFE_NO_COMMON_ANCESTOR',f'{source_branch_id},{target_branch_id}')
        base=self.load_generation(base_id); bi,bf,br=self._current_maps(base); si,sf,sr=self._current_maps(source); ti,tf,tr=self._current_maps(target)
        conflicts=[]
        for key in set(bf)|set(sf)|set(tf):
            bv=bf.get(key,{}).get('value','__missing__'); sv=sf.get(key,{}).get('value','__missing__'); tv=tf.get(key,{}).get('value','__missing__')
            if sv!=bv and tv!=bv and sv!=tv: conflicts.append({'kind':'fact','key':key,'base':bv,'source':sv,'target':tv})
        for key in set(br)|set(sr)|set(tr):
            bp=key in br; sp=key in sr; tp=key in tr
            if sp!=bp and tp!=bp and sp!=tp: conflicts.append({'kind':'relation','key':key,'base':bp,'source':sp,'target':tp})
        if conflicts: return {'merged':False,'baseGenerationId':base_id,'conflicts':conflicts,'conflictRoot':root_hash(conflicts)}
        tx=self.transaction(actor=actor,intent={'type':'merge-branch','source':source_branch_id,'target':target_branch_id,'baseGenerationId':base_id},authority=authority,branch_id=target_branch_id,transaction_id=transaction_id or f"merge:{root_hash({'s':source['generationId'],'t':target['generationId']})[:20]}",evidence=[{'kind':'branch-merge','sourceGenerationId':source['generationId'],'baseGenerationId':base_id}])
        for identity_id in _sort_text([k for k in si if k not in bi and k not in ti]):
            identity=si[identity_id]; tx.create_identity(identity['id'],identity['kind'],continuity_policy=identity.get('continuityPolicy','persistent'),metadata=identity.get('metadata',{}))
        for key in _sort_text(list(set(bf)|set(sf))):
            bv=bf.get(key,{}).get('value','__missing__'); sv=sf.get(key,{}).get('value','__missing__'); tv=tf.get(key,{}).get('value','__missing__')
            if sv==bv or sv==tv: continue
            subject,predicate=key.split('\u0000',1)
            if sv=='__missing__':
                if tv!='__missing__': tx.retract_fact(subject,predicate)
            else: tx.set_fact(subject,predicate,sv,source=sf[key].get('source','source:merge'),confidence=sf[key].get('confidence',1),visibility=sf[key].get('visibility',{'type':'public'}))
        for key in _sort_text(list(set(br)|set(sr))):
            bp=key in br; sp=key in sr; tp=key in tr
            if sp==bp or sp==tp: continue
            sem=json.loads(key)
            if sp: tx.add_relation(sem['type'],sem['from'],sem['to'],qualifiers=sem.get('qualifiers',{}))
            elif tp: tx.remove_relation(sem['type'],sem['from'],sem['to'],qualifiers=sem.get('qualifiers',{}))
        result=tx.commit(); return {'merged':True,'baseGenerationId':base_id,**result}
    def verify(self,deep=True):
        errors=[]; checked_objects=set(); checked_generations=set()
        try:self.metadata
        except Exception as e: errors.append(str(e))
        for p in (self.root/'branches').glob('*.CURRENT.json'):
            try:
                ptr=_json_read(p)
                if not verify_integrity(ptr): raise IntegrityError('RFE_POINTER_TAMPERED',str(p))
                g=self.load_generation(ptr['generationId']); checked_generations.add(g['generationId'])
                if ptr['generationRoot']!=g['integrityHash']: raise IntegrityError('RFE_POINTER_ROOT_MISMATCH',ptr['branchId'])
                if deep:
                    for ref in g['refs'].values(): self.load_object(ref); checked_objects.add(ref)
            except Exception as e: errors.append(str(e))
        return {'valid':not errors,'errors':errors,'checked_generations':len(checked_generations),'checked_objects':len(checked_objects),'store_root':root_hash({'worldId':self.world_id if not errors else 'unknown','branches':sorted([p.name for p in (self.root/'branches').glob('*.json')])})}

def verify_external_generation(generation_path:str|Path, objects_root:str|Path|None=None):
    path=Path(generation_path); g=_json_read(path)
    errors=[]
    if not verify_integrity(g): errors.append('GENERATION_INTEGRITY_MISMATCH')
    if objects_root:
        root=Path(objects_root)
        refs=list(g.get('refs',{}).values()) or g.get('objectRefs',[])
        for ref in refs:
            candidates=[root/ref[:2]/f'{ref}.json',root/f'{ref}.json']
            p=next((x for x in candidates if x.exists()),None)
            if not p: errors.append(f'OBJECT_MISSING:{ref}'); continue
            obj=_json_read(p); body={k:v for k,v in obj.items() if k!='integrityHash'}
            if obj.get('integrityHash')!=ref or root_hash(body)!=ref: errors.append(f'OBJECT_INTEGRITY_MISMATCH:{ref}')
    return {'valid':not errors,'errors':errors,'generation_id':g.get('generationId'),'generation_root':g.get('integrityHash')}
