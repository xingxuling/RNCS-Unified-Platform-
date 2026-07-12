from pathlib import Path
import hashlib,json,zipfile
R=Path(__file__).parents[1]
exclude={'RELEASE_MANIFEST.json','FILE_SHA256SUMS.txt','RELEASE_BUILD_v0.1.0.json','FILE_SHA256_VERIFY_v0.1.0.json'}
files=[]
for p in sorted(R.rglob('*')):
 if p.is_file() and p.name not in exclude and '__pycache__' not in p.parts and '.pytest_cache' not in p.parts and 'build' not in p.parts:
  rel=p.relative_to(R).as_posix();h=hashlib.sha256(p.read_bytes()).hexdigest();files.append({'path':rel,'sha256':h,'size':p.stat().st_size})
manifest={'format':'aaf.release-manifest.v0.1','version':'0.1.0','file_count':len(files),'files':files};payload=json.dumps(manifest,ensure_ascii=False,separators=(',',':'),sort_keys=True).encode();manifest['manifest_root']=hashlib.sha256(payload).hexdigest();(R/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(R/'FILE_SHA256SUMS.txt').write_text(''.join(f"{x['sha256']}  {x['path']}\n" for x in files))
print(json.dumps({'file_count':len(files),'manifest_root':manifest['manifest_root']},indent=2))
