from pathlib import Path
import hashlib, json, zipfile, shutil
root=Path(__file__).resolve().parents[1]
exclude={'.git','output','.pytest_cache'}
files=[]
for p in root.rglob('*'):
    if not p.is_file() or any(x in exclude for x in p.relative_to(root).parts): continue
    if p.name in {'FILE_SHA256SUMS.txt','RELEASE_MANIFEST.json'}: continue
    files.append(p)
files.sort(key=lambda p:p.relative_to(root).as_posix())
lines=[]
for p in files:
    lines.append(f"{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(root).as_posix()}")
(root/'FILE_SHA256SUMS.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
files.append(root/'FILE_SHA256SUMS.txt')
manifest={'format':'reality-one.release-manifest.v0.3','version':'0.3.0','file_count':len(files),'runtime_count':5,'entrypoints':['src/cli.mjs','src/server.mjs','web/index.html']}
(root/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
files.append(root/'RELEASE_MANIFEST.json')
out=root.parent/'Reality_One_Gateway_v0.3.0_完整源码与动态运行包.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(files,key=lambda p:p.relative_to(root).as_posix()):
        arc=f"{root.name}/{p.relative_to(root).as_posix()}"
        info=zipfile.ZipInfo(arc,(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=(0o755 if p.suffix in {'.sh','.mjs'} and p.name in {'cli.mjs'} else 0o644)<<16
        z.writestr(info,p.read_bytes())
sha=hashlib.sha256(out.read_bytes()).hexdigest()
(root.parent/'Reality_One_Gateway_v0.3.0_RELEASE_SHA256SUMS.txt').write_text(f"{sha}  {out.name}\n",encoding='utf-8')
print(json.dumps({'zip':str(out),'sha256':sha,'files':len(files)},ensure_ascii=False,indent=2))
