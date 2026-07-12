#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, sys
ROOT=Path(__file__).resolve().parents[1]
AF=ROOT/'tools/aetherfusion'
SUMMARY=ROOT/'artifacts/aetherfusion-test-summary.json'
EXCLUDE={'.pytest_cache','__pycache__','.git','reports'}

def source_root():
    h=hashlib.sha256()
    for p in sorted(AF.rglob('*')):
        if not p.is_file() or any(part in EXCLUDE for part in p.parts):
            continue
        rel=p.relative_to(AF).as_posix().encode()
        h.update(len(rel).to_bytes(4,'big')); h.update(rel)
        b=p.read_bytes(); h.update(len(b).to_bytes(8,'big')); h.update(b)
    return h.hexdigest()

def main():
    if not SUMMARY.exists():
        print(json.dumps({'valid':False,'reason':'summary_missing'},ensure_ascii=False)); return 1
    d=json.loads(SUMMARY.read_text('utf-8'))
    actual=source_root()
    valid=(d.get('passed_tests')==344 and d.get('failed_groups')==0 and d.get('source_root')==actual)
    print(json.dumps({'valid':valid,'passed_tests':d.get('passed_tests'),'expected_tests':344,'source_root_matches':d.get('source_root')==actual,'execution':d.get('execution')},ensure_ascii=False))
    return 0 if valid else 1
if __name__=='__main__': raise SystemExit(main())
