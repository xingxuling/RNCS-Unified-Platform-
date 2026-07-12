import sys,tempfile,shutil,unittest
from pathlib import Path
ROOT=Path(__file__).parents[1]
sys.path.insert(0,'/mnt/data/RNCS_Core_Contract_v0.1.0')
from rfe_core_sdk import RealityStore,commit_authorized_envelope,federation_candidate
from rncs_contract import new_proposal,authorize,verify
class RNCSIntegration(unittest.TestCase):
 def setUp(self): self.tmp=Path(tempfile.mkdtemp());self.s=RealityStore.init(self.tmp/'store',world_id='world:rncs')
 def tearDown(self): shutil.rmtree(self.tmp,ignore_errors=True)
 def test_authorized_envelope_commit(self):
  base=self.s.generation_reference()
  env=new_proposal(reality_id=base['reality_id'],base_generation=base['generation'],base_generation_root=base['generation_root'],subject={'subject_id':'subject:alice'},intent={'intent_id':'intent:1','source':'test','goals':['建立项目']},capability_plan={'plan_id':'plan:1','capabilities':['rfe.identity.create','rfe.fact.set']},provisional_delta={'operations':[{'op':'createIdentity','identity':{'id':'subject:alice','kind':'subject'}},{'op':'createIdentity','identity':{'id':'project:x','kind':'project'}},{'op':'setFact','fact':{'subject':'project:x','predicate':'status','value':'active'}}]},transition_id='transition:1')
  env=authorize(env,status='approved',resolver='authority:owner')
  r=commit_authorized_envelope(self.s,env)
  self.assertEqual(r['envelope']['phase'],'committed');self.assertTrue(verify(r['envelope'])['valid']);self.assertEqual(self.s.get_fact('project:x','status')['value'],'active')
  c=federation_candidate(r,domain_id='domain:local');self.assertEqual(c['status'],'candidate-not-federated');self.assertEqual(c['generationRoot'],r['generation']['integrityHash'])
if __name__=='__main__':unittest.main()
