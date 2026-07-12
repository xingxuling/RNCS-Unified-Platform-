#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import json, os, re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
AF=ROOT/'tools/aetherfusion'; LOG=ROOT/'artifacts/test-logs/aetherfusion'; LOG.mkdir(parents=True,exist_ok=True)
env=os.environ.copy();env['PYTHONPATH']=str(AF)+os.pathsep+env.get('PYTHONPATH','');env['PYTEST_DISABLE_PLUGIN_AUTOLOAD']='1';env.pop('PYTEST_CURRENT_TEST',None)
jobs=[
 ('test_apply.py',['tests/test_apply.py'],26),('test_comparer.py',['tests/test_comparer.py'],14),('test_dependency.py',['tests/test_dependency.py'],35),
 ('test_fusion_session.py',['tests/test_fusion_session.py'],24),('test_git_checker.py',['tests/test_git_checker.py'],6),('test_import_fix.py',['tests/test_import_fix.py'],50),
 ('test_json_reporter.py',['tests/test_json_reporter.py'],10),('test_patcher.py',['tests/test_patcher.py'],29),('test_planner.py',['tests/test_planner.py'],15),
 ('test_repair.py',['tests/test_repair.py'],39),('test_reporter.py',['tests/test_reporter.py'],4),('test_rollback_audit.py',['tests/test_rollback_audit.py'],40),
 ('test_scanner.py',['tests/test_scanner.py'],11),('test_verify_main.py',['tests/test_verify.py','-k','not verify_audit_write_failure_no_break'],40),('test_verify_audit_failure.py',['tests/test_verify.py::TestVerifyAudit::test_verify_audit_write_failure_no_break'],1),
]
idx=int(sys.argv[1]); shards=[jobs[i:i+2] for i in range(0,len(jobs),2)]
if idx<1 or idx>len(shards): raise SystemExit(f'shard must be 1..{len(shards)}')
rows=[]
for label,args,expected in shards[idx-1]:
    cmd=[sys.executable,'-m','pytest','-q',*args]; log=LOG/f'{Path(label).stem}.log'
    with log.open('w',encoding='utf-8') as fh:
        run=subprocess.run(cmd,cwd=AF,env=env,text=True,stdout=fh,stderr=subprocess.STDOUT,timeout=240)
    out=log.read_text(encoding='utf-8',errors='replace');m=re.search(r'(\d+)\s+passed',out);count=int(m.group(1)) if m else 0
    status='passed' if run.returncode==0 and count==expected else 'failed'
    row={'file':label,'status':status,'tests':count,'expected':expected,'returncode':run.returncode};rows.append(row)
    print(f'{status.upper():7} {label}: {count}/{expected}',flush=True)
    if status!='passed': print(out[-2000:],flush=True)
out=ROOT/'artifacts'/f'aetherfusion-shard-{idx}.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
raise SystemExit(1 if any(x['status']!='passed' for x in rows) else 0)
