from pathlib import Path
import json,sys,time,statistics
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from rncs_contract.lifecycle import verify
R=Path(__file__).resolve().parents[1];e=json.loads((R/'examples/projected-transition.json').read_text())
t=[]
for _ in range(3000):
 s=time.perf_counter_ns();verify(e);t.append((time.perf_counter_ns()-s)/1e6)
out={'iterations':len(t),'verify_ms_median':statistics.median(t),'verify_ms_p95':sorted(t)[int(len(t)*.95)],'valid':verify(e)['valid']}
(R/'evidence/BENCHMARK_v0.1.0.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
