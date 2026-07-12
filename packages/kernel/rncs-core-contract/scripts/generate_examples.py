from pathlib import Path
import json,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from rncs_contract.lifecycle import new_proposal,authorize,commit,attach_projection
R=Path(__file__).resolve().parents[1]
def load(p):return json.loads((R/p).read_text('utf-8'))
def save(p,v):(R/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n','utf-8')
p=new_proposal(**load('examples/proposal-input.json'));save('examples/proposed-transition.json',p)
a=authorize(p,status='approved',resolver='rfe:constitutional-resolver',claims=[{'scope':'artifact.write','granted':True},{'scope':'host.notify','granted':True}],constraints=[{'id':'preview','satisfied':True}],reason='All required scopes and constraints satisfied');save('examples/authorized-transition.json',a)
c=commit(a,generation=8,generation_root='9'*64,receipt_refs=[{'kind':'rfe-generation-certificate','root':'a'*64}]);save('examples/committed-transition.json',c)
q=attach_projection(c,load('examples/projection-input.json'));save('examples/projected-transition.json',q)
