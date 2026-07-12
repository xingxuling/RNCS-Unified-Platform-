from pathlib import Path
import hashlib, json, zipfile

root=Path(__file__).resolve().parents[1]
delivery=root.parents[1]
root_exclude={'output','.git','node_modules','dist'}
metadata_files={'FILE_SHA256SUMS.txt','RELEASE_MANIFEST.json'}

def skipped(path:Path)->bool:
    parts=path.relative_to(root).parts
    if parts and parts[0] in root_exclude:return True
    if 'outputs' in parts:return True
    if '__pycache__' in parts or path.suffix=='.pyc':return True
    return False

files=[]
for p in sorted(root.rglob('*')):
    if not p.is_file() or skipped(p) or p.name in metadata_files:continue
    rel=p.relative_to(root).as_posix()
    files.append({'path':rel,'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(root/'FILE_SHA256SUMS.txt').write_text('\n'.join(f"{x['sha256']}  {x['path']}" for x in files)+'\n',encoding='utf-8')
manifest={
 'format':'reality-studio.release.v1.1','version':'1.1.0-alpha.1','edition':'tilemap-navigation-native-manufacturing',
 'file_count':len(files),'files_root':hashlib.sha256(json.dumps(files,ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),
 'features':['scene-asset-behavior-unification','vsr-v0.3-gpu-frame-compilation','tilemap-four-layer-authoring','collision-rectangle-baking','navigation-cost-grid','deterministic-a-star','dynamic-obstacles','cached-navigation-agents','navigation-evidence','webgpu-viewport-executor','canvas-reference-fallback'],
 'vendored_runtime_dependencies':['@taowind/reality-behavior-fabric','@taowind/reality-one-gateway','@taowind/visual-state-runtime@0.3.0-alpha.1','@taowind/agent-authority-fabric','@taowind/capability-negotiation-protocol','@taowind/icar-native-envelope-runtime','@taowind/living-artifact-format','@taowind/reality-branch-fabric','@taowind/rfe-core-sdk'],
 'environment_boundary':'Finite grid TileMap and deterministic A* reference navigation. Polygon NavMesh, RVO crowd avoidance and physical WebGPU timing are not claimed.'
}
(root/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
out=delivery/'Reality_Studio_v1.1.0-alpha.1_TileMap导航原生版_完整源码与运行包.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(root.rglob('*')):
        if p.is_file() and not skipped(p):z.write(p,Path(root.name)/p.relative_to(root))
required=[
 f'{root.name}/src/tilemap-navigation.mjs',f'{root.name}/src/scene-studio.mjs',
 f'{root.name}/schemas/reality-studio-tilemap-navigation.v1.1.schema.json',
 f'{root.name}/Reality_Studio_v1.1_TileMap导航工作台_离线版.html',
 f'{root.name}/evidence/Reality_Studio_v1.1_TileMap导航原生工作台.png',
 f'{root.name}/docs/TILEMAP_NAVIGATION_CONTRACT_v1.1.md',
 f'{root.name}/src/gpu-studio.mjs',
 f'{root.name}/web/gpu-viewport.js'
]
with zipfile.ZipFile(out) as z:
    names=set(z.namelist());missing=[x for x in required if x not in names]
    if missing:raise RuntimeError(f'Release ZIP missing required files: {missing}')
sha=hashlib.sha256(out.read_bytes()).hexdigest();(Path(str(out)+'.sha256')).write_text(f'{sha}  {out.name}\n',encoding='utf-8')
print(json.dumps({'zip':str(out),'size':out.stat().st_size,'sha256':sha,'manifest':manifest},ensure_ascii=False,indent=2))
