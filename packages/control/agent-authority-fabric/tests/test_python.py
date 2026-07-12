import json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/'python'))
from aaf_runtime import *
R=Path(__file__).parents[1]
class T(unittest.TestCase):
 @classmethod
 def setUpClass(c):
  c.env=json.loads((R/'examples/proposed-envelope.json').read_text());c.neg=json.loads((R/'examples/cnp-negotiation.json').read_text());c.pol=seal_policy_bundle(json.loads((R/'examples/policy-bundle.raw.json').read_text()));c.now='2026-06-30T12:00:00Z'
 def approval(self,id='a',who='owner'):return seal_approval({'approval_id':id,'proposal_root':self.env['proposal_root'],'approver_id':who,'approver_roles':['owner'],'issued_at':'2026-06-30T11:00:00Z','expires_at':'2026-06-30T13:00:00Z'})
 def ev(self,**kw):return evaluate_authority(envelope=self.env,negotiation=self.neg,policy_bundle=self.pol,identity_scopes=['artifact.read','artifact.write','host.notify'],context={'now':self.now},**kw)
 def test_01_hash(self):self.assertEqual(root_hash({'界':'道','a':1}),root_hash({'a':1,'界':'道'}))
 def test_02_pending(self):self.assertEqual(self.ev()['status'],'pending_approval')
 def test_03_approved(self):self.assertEqual(self.ev(approvals=[self.approval()])['status'],'approved')
 def test_04_stale(self):
  a=seal_approval({'approval_id':'x','proposal_root':'0'*64,'approver_id':'owner','approver_roles':['owner'],'issued_at':'2026-06-30T11:00:00Z','expires_at':'2026-06-30T13:00:00Z'});self.assertEqual(self.ev(approvals=[a])['status'],'pending_approval')
 def test_05_denial(self):
  a=self.approval();a['decision']='denied';a=seal(a,'approval_root');self.assertEqual(self.ev(approvals=[a])['status'],'denied')
 def test_06_delegation(self):
  d=seal_delegation({'delegation_id':'d','issuer_id':'o','delegate_id':self.env['subject']['subject_id'],'scopes':['*'],'capability_patterns':['*'],'not_before':'2026-01-01T00:00:00Z','expires_at':'2027-01-01T00:00:00Z'});r=evaluate_authority(envelope=self.env,negotiation=self.neg,policy_bundle=self.pol,identity_scopes=[],delegations=[d],approvals=[self.approval()],context={'now':self.now});self.assertEqual(r['status'],'approved')
 def test_07_revoke(self):
  d=seal_delegation({'delegation_id':'d','issuer_id':'o','delegate_id':self.env['subject']['subject_id'],'scopes':['*'],'capability_patterns':['*'],'not_before':'2026-01-01T00:00:00Z','expires_at':'2027-01-01T00:00:00Z'});rev=seal_revocations({'registry_id':'r','revoked_delegations':['d']});r=evaluate_authority(envelope=self.env,negotiation=self.neg,policy_bundle=self.pol,identity_scopes=[],delegations=[d],revocations=rev,context={'now':self.now});self.assertEqual(r['status'],'denied')
 def test_08_authorized(self):self.assertEqual(self.ev(approvals=[self.approval()])['authorized_envelope']['phase'],'authorized')
 def test_09_tamper(self):
  e=json.loads(json.dumps(self.env));e['subject']['subject_id']='bad'
  with self.assertRaises(AAFError):evaluate_authority(envelope=e,negotiation=self.neg,policy_bundle=self.pol,identity_scopes=['*'],context={'now':self.now})
 def test_10_root_vector(self):
  x=json.loads((R/'examples/evaluation-input.json').read_text());self.assertEqual(evaluate_authority(**x)['decision_root'],json.loads((R/'examples/evaluation-approved.json').read_text())['decision_root'])
if __name__=='__main__':unittest.main()
