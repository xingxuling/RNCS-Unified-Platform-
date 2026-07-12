import json,tempfile,shutil,unittest
from pathlib import Path
from rfe_core_sdk import *
class CoreTests(unittest.TestCase):
 def setUp(self): self.tmp=Path(tempfile.mkdtemp(prefix='rfe-核心-'));self.s=RealityStore.init(self.tmp/'现实仓库',world_id='world:测试')
 def tearDown(self): shutil.rmtree(self.tmp,ignore_errors=True)
 def seed(self):
  tx=self.s.transaction(actor='subject:alice',intent={'goal':'建立门'},authority='authority:owner',transaction_id='tx:seed')
  tx.create_identity('subject:alice','subject').create_identity('object:door','door').create_identity('place:a','place').create_identity('place:b','place')
  tx.set_fact('object:door','state','locked').add_relation('located_in','subject:alice','place:a')
  return tx.commit()
 def test_canonical_vector(self):
  v=json.loads((Path(__file__).parents[1]/'examples/upstream-c1-canonical.json').read_text())
  for c in v['cases']: self.assertEqual(canonical_json(c['value']),c['canonical']);self.assertEqual(root_hash(c['value']),c['sha256'])
 def test_init(self): self.assertTrue(self.s.verify()['valid']);self.assertEqual(self.s.current_generation()['realityRevision'],0)
 def test_generation_directory_is_portable(self):
  generation=self.s.current_generation();self.assertNotIn(':',self.s._generation_path(generation['generationId']).parent.name);self.assertEqual(self.s.load_generation(generation['generationId'])['generationId'],generation['generationId'])
 def test_commit_and_query(self):
  r=self.seed();self.assertEqual(self.s.get_fact('object:door','state')['value'],'locked');self.assertEqual(r['generation']['realityRevision'],1);self.assertTrue(self.s.verify()['valid'])
 def test_fact_history(self):
  self.seed();tx=self.s.transaction(actor='subject:alice',intent='unlock',authority='authority:owner',transaction_id='tx:unlock');tx.set_fact('object:door','state','unlocked').commit();h=self.s.fact_history('object:door','state');self.assertEqual([x['value'] for x in h],['locked','unlocked']);self.assertEqual(h[0]['validTo'],2)
 def test_stale_base(self):
  self.seed();old=self.s.current_generation()['generationId'];a=self.s.transaction(actor='subject:alice',intent='a',authority='authority:owner',base_generation_id=old,transaction_id='tx:a');b=self.s.transaction(actor='subject:alice',intent='b',authority='authority:owner',base_generation_id=old,transaction_id='tx:b');a.set_fact('object:door','state','open').commit();b.set_fact('object:door','state','closed');self.assertRaises(ConflictError,b.commit)
 def test_atomic_failure(self):
  self.seed();before=self.s.current_generation()['generationId'];tx=self.s.transaction(actor='subject:alice',intent='bad',authority='authority:owner');tx.add_relation('owns','subject:alice','missing');self.assertRaises(ValidationError,tx.commit);self.assertEqual(before,self.s.current_generation()['generationId'])
 def test_fork_diff(self):
  self.seed();self.s.fork_branch('branch:试验');tx=self.s.transaction(actor='subject:alice',intent='open',authority='authority:owner',branch_id='branch:试验',transaction_id='tx:open');tx.set_fact('object:door','state','open').commit();d=self.s.diff(self.s.current_generation()['generationId'],self.s.current_generation('branch:试验')['generationId']);self.assertEqual(d['facts']['changed'][0]['after']['value'],'open')
 def test_merge_non_conflict(self):
  self.seed();self.s.fork_branch('branch:功能');tx=self.s.transaction(actor='subject:alice',intent='new fact',authority='authority:owner',branch_id='branch:功能',transaction_id='tx:new');tx.set_fact('object:door','color','blue').commit();m=self.s.merge('branch:功能','branch:main',actor='subject:alice',authority='authority:owner');self.assertTrue(m['merged']);self.assertEqual(self.s.get_fact('object:door','color')['value'],'blue')
 def test_merge_conflict(self):
  self.seed();self.s.fork_branch('branch:a');self.s.fork_branch('branch:b');
  for b,v in [('branch:a','open'),('branch:b','unlocked')]:
   tx=self.s.transaction(actor='subject:alice',intent=v,authority='authority:owner',branch_id=b,transaction_id='tx:'+b);tx.set_fact('object:door','state',v).commit()
  m=self.s.merge('branch:a','branch:b',actor='subject:alice',authority='authority:owner');self.assertFalse(m['merged']);self.assertEqual(m['conflicts'][0]['kind'],'fact')
 def test_tamper_object(self):
  self.seed();g=self.s.current_generation();ref=g['refs']['identity'];p=self.s._object_path(ref);o=json.loads(p.read_text());o['value'][0]['kind']='hacked';p.write_text(json.dumps(o));self.assertFalse(self.s.verify()['valid'])
 def test_generation_reference(self): self.seed();r=self.s.generation_reference();self.assertEqual(r['generation'],1);self.assertEqual(len(r['generation_root']),64)
 def test_event_evidence(self): self.seed();e=self.s.events()[-1];self.assertTrue(verify_integrity(e));self.assertEqual(e['actor'],'subject:alice')
 def test_external_c4_fixture(self):
  base=Path(__file__).parents[1]/'examples/upstream-c4-door-store';res=verify_external_generation(base/'generations/g-conformance-c4-0001/generation.json',base/'objects');self.assertTrue(res['valid'],res)
if __name__=='__main__':unittest.main()
