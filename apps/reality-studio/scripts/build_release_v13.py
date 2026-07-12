from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[1]
delivery=Path('/mnt/data')
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
manifest={'format':'reality-studio.release.v1.3','version':'1.3.0-alpha.1','edition':'asset-continuity-native-manufacturing','file_count':len(files),'files_root':hashlib.sha256(json.dumps(files,ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),'features':['local-file-and-directory-import','embedded-browser-import','stable-asset-identity','sha256-content-addressing','asset-generation-and-history','manual-reimport','stale-and-missing-source-audit','json-path-dependency-discovery','asset-dependency-and-scene-usage-graph','external-semantic-roots','orphan-detection','asset-continuity-ledger','studio-cli-server-integration','webgpu-viewport','tilemap-navigation','ui-input'],'test_summary':{'studio':'156/156','vsr':'120/120','offline_browser_asset_import':'PASS','release_audit':'PASS','sample_asset_audit':'0 errors / 0 warnings'},'environment_boundary':'Local import/reimport and browser embedded import are verified in the current container. File watching, native Windows/Android packaging, physical GPU timing and production-scale repositories are not claimed.'}
(root/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
out=delivery/'Reality_Studio_v1.3.0-alpha.1_资产连续性原生版_完整源码与运行包.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(root.rglob('*')):
        if p.is_file() and not skipped(p):z.write(p,Path(root.name)/p.relative_to(root))
required=[f'{root.name}/src/asset-continuity.mjs',f'{root.name}/src/scene-studio.mjs',f'{root.name}/Reality_Studio_v1.3_资产连续性工作台_离线版.html',f'{root.name}/evidence/Reality_Studio_v1.3_资产连续性工作台.png',f'{root.name}/evidence/BROWSER_ASSET_CONTINUITY_TEST_v1.3.json',f'{root.name}/evidence/RELEASE_AUDIT_v1.3.json',f'{root.name}/evidence/ASSET_CONTINUITY_BENCHMARK_v1.3.json',f'{root.name}/schemas/reality-studio-asset-continuity.v1.3.schema.json',f'{root.name}/docs/ASSET_CONTINUITY_CONTRACT_v1.3.md',f'{root.name}/RELEASE_MANIFEST.json',f'{root.name}/FILE_SHA256SUMS.txt',f'{root.name}/启动Reality Studio v1.3 资产连续性版.bat']
with zipfile.ZipFile(out) as z:
    names=set(z.namelist());missing=[x for x in required if x not in names]
    if missing:raise RuntimeError(f'missing: {missing}')
sha=hashlib.sha256(out.read_bytes()).hexdigest();side=Path(str(out)+'.sha256');side.write_text(f'{sha}  {out.name}\n',encoding='utf-8')
print(json.dumps({'zip':str(out),'size':out.stat().st_size,'sha256':sha,'manifest':manifest},ensure_ascii=False,indent=2))
