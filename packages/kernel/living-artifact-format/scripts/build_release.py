import hashlib,json,pathlib,zipfile,os
root=pathlib.Path(__file__).parent.parent
skip={'FILE_SHA256SUMS.txt','RELEASE_MANIFEST.json'}
records=[]
for p in sorted(root.rglob('*')):
 if p.is_file() and p.name not in skip and '__pycache__' not in p.parts and '.pytest_cache' not in p.parts and 'build' not in p.parts and not p.name.endswith('.pyc'):
  rel=p.relative_to(root).as_posix(); data=p.read_bytes(); records.append({'path':rel,'size':len(data),'sha256':hashlib.sha256(data).hexdigest()})
manifest={'format':'laf.release.v1','name':'Living Artifact Format','version':'1.0.0','files':records}
manifest['manifest_root']=hashlib.sha256(json.dumps(records,ensure_ascii=False,separators=(',',':'),sort_keys=True).encode()).hexdigest()
(root/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'FILE_SHA256SUMS.txt').write_text(''.join(f"{r['sha256']}  {r['path']}\n" for r in records),encoding='utf-8')
print(json.dumps({'files':len(records),'manifest_root':manifest['manifest_root']},indent=2))
