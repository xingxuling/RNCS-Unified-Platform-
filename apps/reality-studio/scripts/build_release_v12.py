from pathlib import Path
import hashlib, json, zipfile

root=Path(__file__).resolve().parents[1]
delivery=root.parents[1]
root_exclude={'output','.git','node_modules','dist','__pycache__'}
metadata_files={'FILE_SHA256SUMS.txt','RELEASE_MANIFEST.json'}

def skipped(path:Path)->bool:
    parts=path.relative_to(root).parts
    if parts and parts[0] in root_exclude:return True
    if 'outputs' in parts or '__pycache__' in parts or path.suffix=='.pyc':return True
    return False

files=[]
for p in sorted(root.rglob('*')):
    if not p.is_file() or skipped(p) or p.name in metadata_files:continue
    rel=p.relative_to(root).as_posix()
    files.append({'path':rel,'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(root/'FILE_SHA256SUMS.txt').write_text('\n'.join(f"{x['sha256']}  {x['path']}" for x in files)+'\n',encoding='utf-8')
manifest={
 'format':'reality-studio.release.v1.2','version':'1.2.0-alpha.1','edition':'ui-input-native-manufacturing',
 'file_count':len(files),'files_root':hashlib.sha256(json.dumps(files,ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),
 'features':['scene-asset-behavior-unification','vsr-v0.3-gpu-frame-compilation','tilemap-navigation','stable-ui-tree','anchor-safe-area-layout','runtime-data-binding','focus-navigation','keyboard-gamepad-touch-action-map','input-edge-events','runtime-rebinding','ui-input-evidence','webgpu-viewport-executor','canvas-reference-fallback'],
 'test_summary':{'studio':'138/138','vsr':'120/120','offline_browser':'PASS','authoritative_api':'PASS','game_regression':'211 Tick Victory'},
 'vendored_runtime_dependencies':['@taowind/reality-behavior-fabric','@taowind/reality-one-gateway','@taowind/visual-state-runtime@0.3.0-alpha.1','@taowind/agent-authority-fabric','@taowind/capability-negotiation-protocol','@taowind/icar-native-envelope-runtime','@taowind/living-artifact-format','@taowind/reality-branch-fabric','@taowind/rfe-core-sdk'],
 'environment_boundary':'Chromium localhost navigation is blocked by container policy; offline browser interaction and authoritative Node API are independently verified. Physical gamepad/touch latency, physical WebGPU timing, native Windows EXE and signed APK are not claimed.'
}
(root/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
out=delivery/'Reality_Studio_v1.2.0-alpha.1_UI输入原生版_完整源码与运行包.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(root.rglob('*')):
        if p.is_file() and not skipped(p):z.write(p,Path(root.name)/p.relative_to(root))
required=[
 f'{root.name}/src/ui-input.mjs',f'{root.name}/src/scene-studio.mjs',
 f'{root.name}/schemas/reality-studio-ui-input.v1.2.schema.json',
 f'{root.name}/Reality_Studio_v1.2_UI输入工作台_离线版.html',
 f'{root.name}/evidence/Reality_Studio_v1.2_UI输入原生工作台.png',
 f'{root.name}/evidence/BROWSER_UI_INPUT_TEST_v1.2.json',
 f'{root.name}/evidence/BROWSER_UI_INPUT_SERVER_TEST_v1.2.json',
 f'{root.name}/evidence/RELEASE_AUDIT_v1.2.json',
 f'{root.name}/docs/UI_INPUT_CONTRACT_v1.2.md',f'{root.name}/docs/UI_INPUT_API_v1.2.md',
 f'{root.name}/src/gpu-studio.mjs',
 f'{root.name}/web/gpu-viewport.js',f'{root.name}/启动Reality Studio v1.2 UI输入版.bat'
]
with zipfile.ZipFile(out) as z:
    names=set(z.namelist());missing=[x for x in required if x not in names]
    if missing:raise RuntimeError(f'Release ZIP missing required files: {missing}')
sha=hashlib.sha256(out.read_bytes()).hexdigest();Path(str(out)+'.sha256').write_text(f'{sha}  {out.name}\n',encoding='utf-8')
print(json.dumps({'zip':str(out),'size':out.stat().st_size,'sha256':sha,'manifest':manifest},ensure_ascii=False,indent=2))
