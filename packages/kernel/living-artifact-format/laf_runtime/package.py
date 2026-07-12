from __future__ import annotations
import base64, json, mimetypes, os, pathlib, zipfile
from typing import Any
from .canonical import LAFError, root_hash
from .model import validate_artifact

PACKAGE_FORMAT='laf.package.v1'
PACKAGE_VERSION='1.0.0'
FIXED_ZIP_DATE=(1980,1,1,0,0,0)

def _bytes_json(value):
    return (json.dumps(value,ensure_ascii=False,indent=2,sort_keys=True)+'\n').encode('utf-8')

def build_manifest(files: dict[str,bytes], artifact: dict) -> dict:
    records=[]
    import hashlib
    for path in sorted(files,key=lambda x:x.encode('utf-8')):
        data=files[path]
        records.append({'path':path,'media_type':mimetypes.guess_type(path)[0] or 'application/octet-stream','size':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    content_root=root_hash(records)
    return {'format':PACKAGE_FORMAT,'package_version':PACKAGE_VERSION,'artifact_id':artifact['identity']['artifact_id'],'artifact_root':artifact['evidence']['artifact_root'],'entrypoint':'artifact.laf.json','files':records,'content_root':content_root,'signature':None}

def pack_artifact(artifact: dict, output: str|os.PathLike, assets_dir: str|os.PathLike|None=None) -> dict:
    result=validate_artifact(artifact)
    if not result['valid']: raise LAFError('ARTIFACT_INVALID:'+','.join(result['errors']))
    files={'artifact.laf.json':_bytes_json(artifact)}
    if assets_dir:
        root=pathlib.Path(assets_dir)
        for p in sorted(root.rglob('*')):
            if p.is_file(): files['assets/'+p.relative_to(root).as_posix()]=p.read_bytes()
    manifest=build_manifest(files,artifact); files['manifest.lafpkg.json']=_bytes_json(manifest)
    out=pathlib.Path(output); out.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name in sorted(files,key=lambda x:x.encode('utf-8')):
            info=zipfile.ZipInfo(name,FIXED_ZIP_DATE); info.compress_type=zipfile.ZIP_DEFLATED; info.external_attr=0o644<<16
            z.writestr(info,files[name])
    return {'path':str(out),'package_root':root_hash(manifest),'content_root':manifest['content_root'],'artifact_root':manifest['artifact_root'],'files':len(manifest['files'])}

def _safe_name(name):
    p=pathlib.PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts: raise LAFError('PACKAGE_PATH_UNSAFE')

def verify_package(path: str|os.PathLike) -> dict:
    import hashlib
    p=pathlib.Path(path); errors=[]
    try:
        with zipfile.ZipFile(p,'r') as z:
            names=z.namelist(); [_safe_name(n) for n in names]
            manifest=json.loads(z.read('manifest.lafpkg.json'))
            if manifest.get('format')!=PACKAGE_FORMAT: errors.append('PACKAGE_FORMAT_INVALID')
            records=[]
            for rec in manifest.get('files',[]):
                data=z.read(rec['path'])
                if len(data)!=rec['size']: errors.append(f"SIZE_MISMATCH:{rec['path']}")
                if hashlib.sha256(data).hexdigest()!=rec['sha256']: errors.append(f"SHA256_MISMATCH:{rec['path']}")
                records.append(rec)
            if root_hash(records)!=manifest.get('content_root'): errors.append('CONTENT_ROOT_MISMATCH')
            artifact=json.loads(z.read(manifest['entrypoint']))
            vr=validate_artifact(artifact)
            errors.extend(vr['errors'])
            if artifact.get('evidence',{}).get('artifact_root')!=manifest.get('artifact_root'): errors.append('ARTIFACT_ROOT_MANIFEST_MISMATCH')
            return {'valid':not errors,'errors':errors,'manifest':manifest,'artifact':artifact}
    except Exception as exc:
        return {'valid':False,'errors':[f'PACKAGE_EXCEPTION:{type(exc).__name__}:{exc}']}

def unpack_package(path, output_dir):
    result=verify_package(path)
    if not result['valid']: raise LAFError('PACKAGE_INVALID:'+','.join(result['errors']))
    out=pathlib.Path(output_dir); out.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(path,'r') as z:
        for name in z.namelist(): _safe_name(name); z.extract(name,out)
    return result
