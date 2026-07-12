#!/usr/bin/env python3
from pathlib import Path
import json, hashlib, sys
ROOT=Path(__file__).resolve().parents[1]
EXCLUDE={'.git','node_modules','__pycache__','artifacts','output','outputs','target'}
def files():
  for p in ROOT.rglob('*'):
    if not p.is_file() or any(x in EXCLUDE for x in p.parts): continue
    yield p

def main():
  cmd=sys.argv[1] if len(sys.argv)>1 else 'index'
  registry=json.loads((ROOT/'rncs.modules.json').read_text('utf-8'))
  if cmd=='verify':
    missing=[m['path'] for m in registry['modules'] if not (ROOT/m['path']).exists()]
    print(json.dumps({'valid':not missing,'modules':len(registry['modules']),'missing':missing},ensure_ascii=False))
    raise SystemExit(bool(missing))
  rows=[]
  for p in files():
    rel=p.relative_to(ROOT).as_posix(); b=p.read_bytes()
    rows.append({'path':rel,'size':len(b),'sha256':hashlib.sha256(b).hexdigest(),'suffix':p.suffix.lower()})
  out={'format':'rncs.autorag-project-index.v0.1','suiteVersion':registry['suiteVersion'],'fileCount':len(rows),'files':rows}
  dest=ROOT/'artifacts/project-index.json'; dest.parent.mkdir(exist_ok=True); dest.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n','utf-8')
  print(json.dumps({'indexed':len(rows),'output':str(dest.relative_to(ROOT))},ensure_ascii=False))
if __name__=='__main__': main()
