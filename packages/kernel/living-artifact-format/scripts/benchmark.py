import json,pathlib,statistics,time
from laf_runtime.model import validate_artifact,apply_operations
root=pathlib.Path(__file__).parent.parent
a=json.loads((root/'examples/rncs-project-laf1.json').read_text(encoding='utf-8'))
vals=[]
for _ in range(3000):
 t=time.perf_counter_ns(); validate_artifact(a); vals.append((time.perf_counter_ns()-t)/1e6)
revs=[]
for i in range(500):
 t=time.perf_counter_ns(); apply_operations(a,[{'op':'set','path':'/semantics/values/benchmark_counter','value':i}],actor_subject_id='benchmark'); revs.append((time.perf_counter_ns()-t)/1e6)
out={'validation_iterations':len(vals),'validation_median_ms':round(statistics.median(vals),6),'validation_p95_ms':round(sorted(vals)[int(len(vals)*.95)],6),'revision_iterations':len(revs),'revision_median_ms':round(statistics.median(revs),6),'revision_p95_ms':round(sorted(revs)[int(len(revs)*.95)],6)}
(root/'evidence/BENCHMARK_v1.0.0.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8'); print(json.dumps(out,indent=2))
