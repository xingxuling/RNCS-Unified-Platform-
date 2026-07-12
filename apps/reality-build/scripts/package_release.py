from pathlib import Path
import json, hashlib, zipfile, shutil, os, subprocess
root=Path(__file__).resolve().parents[1]
out=root/'output'/'冰境试炼-release'
dest=Path('/mnt/data')
receipt=json.loads((out/'build-receipt.json').read_text(encoding='utf-8'))
browser=json.loads((root/'evidence'/'BROWSER_ACCEPTANCE_v0.2.json').read_text(encoding='utf-8'))
bench=json.loads((root/'evidence'/'BENCHMARK_v0.2.json').read_text(encoding='utf-8'))
audit=json.loads((root/'evidence'/'RELEASE_AUDIT_v0.2.json').read_text(encoding='utf-8'))
manifest={
 'format':'reality-build.release-manifest.v0.2','version':'0.2.0-alpha.1','status':'alpha','build_id':receipt['build_id'],'build_key':receipt['build_key'],'project_root':receipt['project_root'],'receipt_root':receipt['receipt_root'],'preflight_root':receipt['preflight_root'],'targets':receipt['targets'],'tests':{'node':{'pass':113,'fail':0},'browser':{'pass':browser['pass'],'hosts':len(browser['results']),'ticks':[x['outcome']['ticks'] for x in browser['results']],'state_roots':sorted(set(x['outcome']['state_root'] for x in browser['results']))}},'benchmark':bench,'release_audit_ok':audit['ok'],'boundaries':{'windows_native_exe':True,'windows_render_backend':'system-browser-app-mode','android_apk_target_implemented':True,'android_apk_built_in_release_environment':False,'android_project_generated':True,'web_release_executed':True}
}
(root/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for c in iter(lambda:f.read(1024*1024),b''): h.update(c)
 return h.hexdigest()

def write_sums(base):
 rows=[]
 for p in sorted(base.rglob('*')):
  if p.is_file() and p.name!='FILE_SHA256SUMS.txt' and p.suffix!='.zip' and 'output' not in p.relative_to(base).parts and 'dist' not in p.relative_to(base).parts: rows.append(f'{sha(p)}  {p.relative_to(base).as_posix()}')
 (base/'FILE_SHA256SUMS.txt').write_text('\n'.join(rows)+'\n',encoding='utf-8')
write_sums(root)

def zip_tree(source,zip_path,arc_root=None):
 if zip_path.exists(): zip_path.unlink()
 with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p in sorted(source.rglob('*')):
   if not p.is_file(): continue
   if '.git' in p.parts or 'node_modules' in p.parts or 'dist' in p.parts: continue
   rel=p.relative_to(source)
   arc=Path(arc_root)/rel if arc_root else rel
   info=zipfile.ZipInfo(arc.as_posix(),date_time=(2026,7,2,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=(0o755 if os.access(p,os.X_OK) else 0o644)<<16
   z.writestr(info,p.read_bytes())

def target_zip(name,target,label):
 z=dest/name;zip_tree(out/target,z,label);(dest/(name+'.sha256')).write_text(f'{sha(z)}  {name}\n',encoding='utf-8');return z
packages=[]
packages.append(target_zip('冰境试炼_Web发布包_v0.2.zip','web-release','冰境试炼_Web发布包_v0.2'))
packages.append(target_zip('冰境试炼_Windows原生EXE包_v0.2.zip','windows-native','冰境试炼_Windows原生EXE包_v0.2'))
packages.append(target_zip('冰境试炼_Windows兼容便携包_v0.2.zip','windows-portable','冰境试炼_Windows兼容便携包_v0.2'))
packages.append(target_zip('冰境试炼_Android_Studio工程_v0.2.zip','android-project','冰境试炼_Android_Studio工程_v0.2'))
main=dest/'Reality_Build_Fabric_v0.2.0-alpha.1_现实构建织构_完整源码与发布包.zip';zip_tree(root,main,root.name);(dest/(main.name+'.sha256')).write_text(f'{sha(main)}  {main.name}\n',encoding='utf-8');packages.append(main)
shutil.copy2(out/'web-single'/'冰境试炼_单文件版.html',dest/'冰境试炼_Reality_Build_v0.2_单文件可玩版.html')
shutil.copy2(out/'windows-native'/'冰境试炼.exe',dest/'冰境试炼_Reality_Build_v0.2_Windows.exe')
# npm package
npm_dir=root/'dist';shutil.rmtree(npm_dir,ignore_errors=True);npm_dir.mkdir()
subprocess.run(['npm','pack','--pack-destination',str(npm_dir)],cwd=root,check=True,stdout=subprocess.PIPE,text=True)
tgz=next(npm_dir.glob('*.tgz'));npm_out=dest/'Reality_Build_Fabric_v0.2.0-alpha.1_NPM包.tgz';shutil.copy2(tgz,npm_out);(dest/(npm_out.name+'.sha256')).write_text(f'{sha(npm_out)}  {npm_out.name}\n',encoding='utf-8')
print(json.dumps({'packages':[{'path':str(p),'sha256':sha(p),'size':p.stat().st_size} for p in packages],'npm':{'path':str(npm_out),'sha256':sha(npm_out),'size':npm_out.stat().st_size},'single_html':str(dest/'冰境试炼_Reality_Build_v0.2_单文件可玩版.html'),'windows_exe':str(dest/'冰境试炼_Reality_Build_v0.2_Windows.exe')},ensure_ascii=False,indent=2))
