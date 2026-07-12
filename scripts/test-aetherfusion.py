#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import hashlib, json, os, re, signal, subprocess, sys, time

ROOT = Path(__file__).resolve().parents[1]
AF = ROOT / 'tools' / 'aetherfusion'
LOG_DIR = ROOT / 'artifacts' / 'test-logs' / 'aetherfusion-matrix'
LOG_DIR.mkdir(parents=True, exist_ok=True)

env = os.environ.copy()
env['PYTHONPATH'] = str(AF) + os.pathsep + env.get('PYTHONPATH', '')
env['PYTEST_DISABLE_PLUGIN_AUTOLOAD'] = '1'
env.pop('PYTEST_CURRENT_TEST', None)

jobs = [
 ('test_apply.py',['tests/test_apply.py'],26),('test_comparer.py',['tests/test_comparer.py'],14),('test_dependency.py',['tests/test_dependency.py'],35),
 ('test_fusion_session.py',['tests/test_fusion_session.py'],24),('test_git_checker.py',['tests/test_git_checker.py'],6),('test_import_fix.py',['tests/test_import_fix.py'],50),
 ('test_json_reporter.py',['tests/test_json_reporter.py'],10),('test_patcher.py',['tests/test_patcher.py'],29),('test_planner.py',['tests/test_planner.py'],15),
 ('test_repair.py',['tests/test_repair.py'],39),('test_reporter.py',['tests/test_reporter.py'],4),('test_rollback_audit.py',['tests/test_rollback_audit.py'],40),
 ('test_scanner.py',['tests/test_scanner.py'],11),('test_verify_main.py',['tests/test_verify.py','-k','not verify_audit_write_failure_no_break'],40),
 ('test_verify_audit_failure.py',['tests/test_verify.py::TestVerifyAudit::test_verify_audit_write_failure_no_break'],1),
]

def terminate_group(proc: subprocess.Popen[str]) -> None:
    if os.name == 'posix':
        try:
            os.killpg(proc.pid, signal.SIGTERM)
            time.sleep(0.05)
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    elif proc.poll() is None:
        proc.kill()

def source_root() -> str:
    digest=hashlib.sha256()
    excluded={'.pytest_cache','__pycache__','.git','reports'}
    for item in sorted(AF.rglob('*')):
        if not item.is_file() or any(part in excluded for part in item.parts):
            continue
        rel=item.relative_to(AF).as_posix().encode()
        digest.update(len(rel).to_bytes(4,'big')); digest.update(rel)
        payload=item.read_bytes(); digest.update(len(payload).to_bytes(8,'big')); digest.update(payload)
    return digest.hexdigest()

results=[]; started=time.time()
for label,args,expected in jobs:
    cmd=[sys.executable,'-m','pytest','-q',*args]
    log_path=LOG_DIR/f'{Path(label).stem}.log'
    status='failed'; count=0; returncode=1; reason=None
    with log_path.open('w',encoding='utf-8') as fh:
        proc=subprocess.Popen(cmd,cwd=AF,env=env,text=True,stdout=fh,stderr=subprocess.STDOUT,start_new_session=(os.name=='posix'))
        try:
            returncode=proc.wait(timeout=240)
        except subprocess.TimeoutExpired:
            reason='timeout'; returncode=124
        finally:
            terminate_group(proc)
    out=log_path.read_text(encoding='utf-8',errors='replace')
    m=re.search(r'(\d+)\s+passed',out); count=int(m.group(1)) if m else 0
    if returncode==0 and count==expected: status='passed'
    elif reason is None: reason=f'expected {expected}, got {count}, rc={returncode}'
    row={'file':label,'status':status,'tests':count,'expected':expected,'returncode':returncode}
    if reason: row['reason']=reason
    results.append(row)
    print(f'{status.upper():7} {label}: {count}/{expected}',flush=True)
    if status!='passed': print(out[-2000:],flush=True)

summary={
 'format':'rncs.aetherfusion-test-summary.v0.2',
 'execution':'isolated-process-groups',
 'groups':len(results),
 'source_test_files':14,
 'passed_groups':sum(x['status']=='passed' for x in results),
 'failed_groups':sum(x['status']!='passed' for x in results),
 'passed_tests':sum(x['tests'] for x in results if x['status']=='passed'),
 'expected_tests':sum(x['expected'] for x in results),
 'duration_seconds':round(time.time()-started,3),
 'source_root':source_root(),
 'results':results,
}
out=ROOT/'artifacts/aetherfusion-test-summary.json'
out.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({k:summary[k] for k in ['groups','source_test_files','passed_groups','failed_groups','passed_tests','expected_tests','duration_seconds']},ensure_ascii=False),flush=True)
raise SystemExit(1 if summary['failed_groups'] or summary['passed_tests']!=344 else 0)
