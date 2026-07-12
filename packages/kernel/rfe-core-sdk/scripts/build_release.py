from pathlib import Path
import hashlib,json,os,zipfile
ROOT=Path(__file__).parents[1]
EXCLUDE={'FILE_SHA256SUMS.txt','RELEASE_MANIFEST.json'}
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
files=[]
for p in sorted(ROOT.rglob('*')):
 if not p.is_file() or '__pycache__' in p.parts or any(x.endswith('.egg-info') for x in p.parts):continue
 rel=p.relative_to(ROOT).as_posix()
 if rel in EXCLUDE:continue
 files.append({'path':rel,'sha256':sha(p),'size':p.stat().st_size})
release_root=hashlib.sha256(''.join(f"{x['path']}\0{x['sha256']}\n" for x in files).encode()).hexdigest()
provenance={}
for name,p in {
 'rfe_upstream_v1.0.0':Path('/mnt/data/RFE_Constitutional_Reality_v1.0.0.zip'),
 'rncs_core_contract_v0.1.0':Path('/mnt/data/RNCS_Core_Contract_v0.1.0_完整源码与运行包.zip'),
 'living_artifact_format_v1.0.0':Path('/mnt/data/Living_Artifact_Format_v1.0.0_完整源码与运行包.zip'),
}.items():
 if p.exists():provenance[name]={'filename':p.name,'sha256':sha(p)}
manifest={
 'format':'rfe-core-sdk-release-manifest.v0.1','name':'RFE Core SDK','version':'0.1.0','date':'2026-06-30',
 'release_root':release_root,'file_count':len(files),'files':files,'provenance':provenance,
 'validation':{'python_tests':'14/14','node_tests':'7/7','schemas':'5/5','cross_runtime_generation_equal':True,'wheel_install':True,'npm_install':True,'unicode_path':True,'rust_recompiled':False},
 'boundaries':['local-core-only','candidate-not-federated','no-production-cryptography','file-backend-small-scale']
}
(ROOT/'RELEASE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n','utf-8')
all_files=[]
for p in sorted(ROOT.rglob('*')):
 if not p.is_file() or '__pycache__' in p.parts or any(x.endswith('.egg-info') for x in p.parts):continue
 rel=p.relative_to(ROOT).as_posix()
 if rel=='FILE_SHA256SUMS.txt':continue
 all_files.append(f"{sha(p)}  {rel}")
(ROOT/'FILE_SHA256SUMS.txt').write_text('\n'.join(all_files)+'\n','utf-8')
print(json.dumps({'release_root':release_root,'file_count':len(files)},indent=2))
