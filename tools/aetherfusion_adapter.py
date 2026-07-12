#!/usr/bin/env python3
from pathlib import Path
import json, os, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
AF=ROOT/'tools/aetherfusion'
REG=json.loads((ROOT/'rncs.modules.json').read_text('utf-8'))
def module(mid):
    for m in REG['modules']:
        if m['id']==mid:return m
    raise SystemExit(f'未知模块: {mid}')
def run(args):
    env=os.environ.copy();env['PYTHONPATH']=str(AF)+os.pathsep+env.get('PYTHONPATH','')
    return subprocess.run([sys.executable,'-m','aetherfusion',*args],cwd=ROOT,env=env).returncode
def main():
    if len(sys.argv)==1 or sys.argv[1] in {'-h','--help'}:
        print('用法: python tools/aetherfusion_adapter.py <source> <target-module-id> <module-names> [--apply] [--verify]')
        print('示例: python tools/aetherfusion_adapter.py ../new-rbf rbf src --verify')
        return
    if sys.argv[1]=='verify':
        code=run(['--help']);raise SystemExit(code)
    source=Path(sys.argv[1]).resolve(); target=module(sys.argv[2]); names=sys.argv[3]
    reports=ROOT/'artifacts'/'fusion'/target['id']; reports.mkdir(parents=True,exist_ok=True)
    args=['fusion-session','--source',str(source),'--target',str(ROOT/target['path']),'--modules',names,'--reports',str(reports)]
    if '--apply' in sys.argv: args.append('--apply-confirm')
    if '--verify' in sys.argv: args.append('--verify')
    code=run(args)
    if code==0 and '--apply' in sys.argv:
        test=subprocess.run(['npm','run','test:affected','--',target['path']],cwd=ROOT)
        code=test.returncode
    raise SystemExit(code)
if __name__=='__main__':main()
