#!/usr/bin/env python3
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];rows=[]
for i in range(1,9): rows += json.loads((ROOT/'artifacts'/f'aetherfusion-shard-{i}.json').read_text('utf-8'))
summary={'format':'rncs.aetherfusion-test-summary.v0.2','shards':8,'files':len(rows),'passed_files':sum(x['status']=='passed' for x in rows),'failed_files':sum(x['status']!='passed' for x in rows),'passed_tests':sum(x['tests'] for x in rows if x['status']=='passed'),'expected_tests':sum(x['expected'] for x in rows),'results':rows}
(ROOT/'artifacts/aetherfusion-test-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({k:summary[k] for k in ['shards','files','passed_files','failed_files','passed_tests','expected_tests']},ensure_ascii=False))
raise SystemExit(1 if summary['failed_files'] or summary['passed_tests']!=344 else 0)
