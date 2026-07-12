import json, os, sys, unittest
ROOT=os.path.dirname(os.path.dirname(__file__));sys.path.insert(0,os.path.join(ROOT,'python'))
from cnp_runtime import canonicalize,sha256_root,normalize_descriptor,normalize_provider,normalize_request,negotiate
class TestCNP(unittest.TestCase):
 def provider(self):return {'provider_id':'本地','trust':{'level':2,'attestations':[]},'capabilities':[{'capability_id':'demo.write','version':'1.2.0','fulfills':['demo.target'],'required_scopes':['write'],'host_requirements':['input.activate'],'risk':'medium','reversible':True,'evidence':{'produces':['demo.receipt'],'requires':[]},'cost':{'cpu_millis':2}}]}
 def request(self):return {'request_id':'请求','subject':{'subject_id':'主体','scopes':['write']},'host':{'capabilities':['input.activate']},'goals':[{'type':'demo.target','version_range':'^1.0.0'}],'policy':{'max_risk':'medium','required_evidence':['demo.receipt'],'minimum_trust':1}}
 def test_unicode_canonical(self):self.assertEqual(sha256_root({'中文':'现实'}),sha256_root(json.loads(canonicalize({'中文':'现实'}))))
 def test_descriptor_root(self):self.assertEqual(len(normalize_descriptor({**self.provider()['capabilities'][0],'provider_id':'本地'})['descriptor_root']),64)
 def test_provider_root(self):self.assertEqual(len(normalize_provider(self.provider())['provider_root']),64)
 def test_request_root(self):self.assertEqual(len(normalize_request(self.request())['request_root']),64)
 def test_satisfied(self):self.assertEqual(negotiate(self.request(),[self.provider()])['plan']['status'],'satisfied')
 def test_scope_rejection(self):r=self.request();r['subject']['scopes']=[];self.assertEqual(negotiate(r,[self.provider()])['plan']['status'],'unsatisfied')
 def test_host_rejection(self):r=self.request();r['host']['capabilities']=[];self.assertEqual(negotiate(r,[self.provider()])['plan']['status'],'unsatisfied')
 def test_evidence_rejection(self):r=self.request();r['policy']['required_evidence']=['missing'];self.assertEqual(negotiate(r,[self.provider()])['plan']['status'],'unsatisfied')
if __name__=='__main__':unittest.main()
