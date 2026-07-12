import copy,json,subprocess,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from rncs_contract import *
from rncs_contract.adapters import adapt_hnac_snapshot
class TestContract(unittest.TestCase):
 def setUp(self): self.p=json.loads((ROOT/'examples/proposal-input.json').read_text('utf-8'))
 def test_lifecycle(self):
  e=new_proposal(**self.p);self.assertTrue(verify(e)['valid']);e=authorize(e,status='approved',resolver='rfe');e=commit(e,generation=8,generation_root='9'*64);self.assertTrue(verify(e)['valid'])
 def test_denied_cannot_commit(self):
  e=authorize(new_proposal(**self.p),status='denied',resolver='rfe',reason='no');
  with self.assertRaises(Exception):commit(e,generation=8,generation_root='9'*64)
 def test_generation_must_advance(self):
  e=authorize(new_proposal(**self.p),status='approved',resolver='rfe')
  with self.assertRaises(Exception):commit(e,generation=7,generation_root='9'*64)
 def test_projection_preserves_commit_root(self):
  e=commit(authorize(new_proposal(**self.p),status='approved',resolver='rfe'),generation=8,generation_root='9'*64);r=e['commit']['commit_root'];e=attach_projection(e,json.loads((ROOT/'examples/projection-input.json').read_text()));self.assertEqual(r,e['commit']['commit_root']);self.assertTrue(verify(e)['valid'])
 def test_tamper(self):
  e=new_proposal(**self.p);e['intent']['source']='tampered';self.assertFalse(verify(e)['valid'])
 def test_hnac_generation_demoted(self):
  s=json.loads((ROOT/'examples/hnac-legacy-snapshot.json').read_text());r=adapt_hnac_snapshot(s,'phone');self.assertNotIn('generation',r);self.assertEqual(r['snapshot_sequence'],18)
 def test_float_rejected(self):
  with self.assertRaises(Exception):root_hash({'x':1.5})
 def test_cross_runtime_root(self):
  value={'中文':'现实','astral':'𠮷','z':[1,True,None,{'b':2,'a':1}]};py=root_hash(value)
  script="import {rootHash} from './src/index.mjs'; console.log(rootHash("+json.dumps(value,ensure_ascii=False)+"));"
  js=subprocess.check_output(['node','--input-type=module','-e',script],cwd=ROOT,text=True).strip();self.assertEqual(py,js)
if __name__=='__main__':unittest.main()
