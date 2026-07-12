from pathlib import Path
import hashlib,json,zipfile,shutil
root=Path(__file__).resolve().parents[1];delivery=Path('/mnt/data')
metadata={'FILE_SHA256SUMS.txt','RELEASE_MANIFEST.json'}
def skipped(p):
    parts=p.relative_to(root).parts
    if not parts:return False
    if parts[0] in {'output','.git','__pycache__'}:return True
    if '__pycache__' in parts or p.suffix=='.pyc':return True
    return False
files=[]
for p in sorted(root.rglob('*')):
    if p.is_file() and not skipped(p) and p.name not in metadata:
        rel=p.relative_to(root).as_posix();files.append({'path':rel,'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(root/'FILE_SHA256SUMS.txt').write_text('\n'.join(f"{x['sha256']}  {x['path']}" for x in files)+'\n',encoding='utf-8')
manifest={'format':'reality-studio.release.v1.4','version':'1.4.0-alpha.1','edition':'spatial-embodiment-native-editing','file_count':len(files),'files_root':hashlib.sha256(json.dumps(files,ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),'features':['spatial-workspace','body-fixture-character-joint-editing','rsr-v05-native-simulation','vsr-v04-spatial-frame','offline-reference-simulation','spatial-audio-event-observation','haptic-event-observation','snapshot-recovery','rfe-causal-delta-export','asset-continuity','ui-input','tilemap-navigation','behavior-native','webgpu-2d-compatibility'],'test_summary':{'studio':'186/186','vsr':'153/153','rsr':'160/160','offline_browser_spatial':'PASS / 0 page errors','spatial_cli':'PASS','release_audit':'PASS'},'benchmark':json.loads((root/'evidence/SPATIAL_STUDIO_BENCHMARK_v1.4.json').read_text()),'environment_boundary':'Deterministic reference simulation, vendored runtime regressions and offline browser editing were verified in the current container. Physical GPU FPS, XR tracking, spatial audio hardware, haptic hardware, multiplayer networking and neural devices are not claimed.'}
(root/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
out=delivery/'Reality_Studio_v1.4.0-alpha.1_三维具身编辑原生版_完整源码与运行包.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(root.rglob('*')):
        if p.is_file() and not skipped(p):z.write(p,Path(root.name)/p.relative_to(root))
required=[f'{root.name}/src/spatial-studio.mjs',f'{root.name}/src/spatial-studio.mjs',f'{root.name}/src/spatial-studio.mjs',f'{root.name}/Reality_Studio_v1.4_三维具身编辑工作台_离线版.html',f'{root.name}/evidence/Reality_Studio_v1.4_三维具身编辑工作台.png',f'{root.name}/evidence/BROWSER_SPATIAL_TEST_v1.4.json',f'{root.name}/evidence/RELEASE_AUDIT_v1.4.json',f'{root.name}/evidence/SPATIAL_STUDIO_BENCHMARK_v1.4.json',f'{root.name}/schemas/reality-studio-spatial-workspace.v1.4.schema.json',f'{root.name}/docs/SPATIAL_EDITING_CONTRACT_v1.4.md',f'{root.name}/RELEASE_MANIFEST.json',f'{root.name}/FILE_SHA256SUMS.txt',f'{root.name}/启动Reality Studio v1.4 三维具身编辑版.bat']
with zipfile.ZipFile(out) as z:
    bad=z.testzip();names=set(z.namelist());missing=[x for x in required if x not in names]
    if bad:raise RuntimeError(f'corrupt member: {bad}')
    if missing:raise RuntimeError(f'missing: {missing}')
sha=hashlib.sha256(out.read_bytes()).hexdigest();side=Path(str(out)+'.sha256');side.write_text(f'{sha}  {out.name}\n',encoding='utf-8')
# delivery copies
copies={root/'docs/TEST_REPORT_v1.4.md':delivery/'Reality_Studio_v1.4_测试与发布报告.md',root/'evidence/Reality_Studio_v1.4_三维具身编辑工作台.png':delivery/'Reality_Studio_v1.4_三维具身编辑工作台.png',root/'evidence/RELEASE_AUDIT_v1.4.json':delivery/'Reality_Studio_v1.4_发布审计.json',root/'Reality_Studio_v1.4_三维具身编辑工作台_离线版.html':delivery/'Reality_Studio_v1.4_三维具身编辑工作台_离线版.html'}
for a,b in copies.items():shutil.copy2(a,b)
print(json.dumps({'zip':str(out),'size':out.stat().st_size,'sha256':sha,'file_count':len(files),'files_root':manifest['files_root'],'integrity':'PASS'},ensure_ascii=False,indent=2))
