from pathlib import Path
import tempfile,time,json,statistics,shutil
from rfe_core_sdk import RealityStore
root=Path(tempfile.mkdtemp())/'store';s=RealityStore.init(root);tx=s.transaction(actor='subject:a',intent='seed',authority='authority:a',transaction_id='tx:seed');tx.create_identity('subject:a','subject').create_identity('object:x','object').set_fact('object:x','value',0).commit()
commit=[];query=[]
for i in range(50):
 t=time.perf_counter_ns();tx=s.transaction(actor='subject:a',intent={'i':i},authority='authority:a',transaction_id=f'tx:{i}');tx.set_fact('object:x','value',i+1).commit();commit.append((time.perf_counter_ns()-t)/1e6)
 for _ in range(10):t=time.perf_counter_ns();s.get_fact('object:x','value');query.append((time.perf_counter_ns()-t)/1e6)
def stats(a):return {'median_ms':statistics.median(a),'p95_ms':sorted(a)[int(len(a)*.95)-1],'max_ms':max(a)}
print(json.dumps({'format':'rfe-core-sdk-benchmark.v0.1','commits':len(commit),'queries':len(query),'commit':stats(commit),'query':stats(query),'final_revision':s.current_generation()['realityRevision']},indent=2));shutil.rmtree(root.parent)
