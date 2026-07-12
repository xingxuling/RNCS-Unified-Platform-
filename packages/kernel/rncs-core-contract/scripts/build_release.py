from pathlib import Path
import hashlib,json,zipfile
R=Path(__file__).resolve().parents[1]
exclude={'FILE_SHA256SUMS.txt','RELEASE_MANIFEST.json'}
files=[]
for p in sorted(R.rglob('*')):
 if p.is_file() and p.name not in exclude and '__pycache__' not in p.parts and not any(part.endswith('.egg-info') for part in p.parts):
  rel=p.relative_to(R).as_posix();files.append({'path':rel,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
manifest={'format':'rncs.release-manifest.v0.1','name':'RNCS Core Contract','version':'0.1.0','files':files};(R/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n','utf-8');(R/'FILE_SHA256SUMS.txt').write_text(''.join(f"{x['sha256']}  {x['path']}\n" for x in files),'utf-8')
