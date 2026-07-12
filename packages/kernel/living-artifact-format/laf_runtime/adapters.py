from __future__ import annotations
import base64, copy, json, pathlib
from .canonical import LAFError, root_hash
from .model import new_artifact, seal_revision

def _hash_safe(value):
    if isinstance(value,float): return format(value,'.15g')
    if isinstance(value,list): return [_hash_safe(v) for v in value]
    if isinstance(value,dict): return {str(k):_hash_safe(v) for k,v in value.items()}
    return copy.deepcopy(value)

def _legacy_field_schema(fields):
    schema={}; values={}
    for key,item in (fields or {}).items():
        if isinstance(item,dict) and 'value' in item:
            values[key]=_hash_safe(item.get('value'))
            schema[key]={k:_hash_safe(v) for k,v in item.items() if k!='value'}
        else: values[key]=_hash_safe(item); schema[key]={'type':'unknown'}
    return schema,values

def migrate_legacy_artifact(raw: dict, *, source='legacy') -> dict:
    version=str(raw.get('laf_version',''))
    if version=='1.0.0' and raw.get('format')=='laf.artifact.v1': return copy.deepcopy(raw)
    ident=raw.get('identity') or {}
    schema,values=_legacy_field_schema((raw.get('semantic') or {}).get('fields') or {})
    relations=[]
    for idx,rel in enumerate((raw.get('semantic') or {}).get('relations') or []):
        relations.append({'relation_id':rel.get('id') or f'relation:{idx}','predicate':rel.get('type') or rel.get('predicate') or 'related_to','target_artifact_id':rel.get('target') or rel.get('target_artifact_id') or '', 'attributes':_hash_safe({k:v for k,v in rel.items() if k not in {'id','type','predicate','target','target_artifact_id'}})})
    art=new_artifact(artifact_id=ident.get('id') or f'artifact:migrated:{root_hash(_hash_safe(raw))[:16]}',kind=ident.get('type','artifact'),title=ident.get('title','Migrated Living Artifact'),owner_subject_id=ident.get('owner','unknown'),values=values,field_schema=schema,relations=relations,tags=['migrated',f'laf-{version or "unknown"}'])
    roles=(raw.get('permissions') or {}).get('roles') or {}
    art['authority']['default_role']=(raw.get('permissions') or {}).get('default_role','viewer')
    art['authority']['roles']={r:{'scopes':sorted(set('artifact.action.'+a for a in acts)) if acts!=['*'] else ['*']} for r,acts in roles.items()}
    art['affordances']=[]
    for action in raw.get('actions') or []:
        art['affordances'].append({
          'affordance_id':action.get('id'),'label':action.get('label',action.get('id','')),
          'intent_patterns':action.get('intent_patterns',[]),'parameters':_hash_safe(action.get('parameters',[])),
          'required_scopes':['artifact.action.'+str(action.get('id'))],
          'capability_requirements':_hash_safe(action.get('host_requires',[])),
          'proposed_operations':_hash_safe(action.get('mutations',[])),'preconditions':_hash_safe(action.get('requires',[])),
        })
    caps=raw.get('capabilities') or {}; art['capabilities']={'provides':_hash_safe(caps.get('provides',[])),'requires':_hash_safe(caps.get('requires',[]))}
    projections=raw.get('projections') or {}
    art['projections']=[{'projection_id':f'projection:{k}','modality':'visual','target_hosts':[k],'definition':_hash_safe(v)} for k,v in projections.items()]
    art['extensions']['laf.legacy']={'source':source,'source_laf_version':version,'legacy_evidence':_hash_safe(raw.get('evidence',{})),'host_policy':_hash_safe(raw.get('host_policy',{})),'composition_policy':_hash_safe(raw.get('composition_policy',{})),'intents':_hash_safe(raw.get('intents',[])),'federation_policy':_hash_safe(raw.get('federation_policy',{})),'mesh_policy':_hash_safe(raw.get('mesh_policy',{})),'session_policy':_hash_safe(raw.get('session_policy',{}))}
    return seal_revision(art,actor_subject_id=ident.get('owner','migration'),message=f'migrate LAF {version or "unknown"} to 1.0',advance=True)

def load_and_migrate(path: str|pathlib.Path) -> dict:
    raw=json.loads(pathlib.Path(path).read_text(encoding='utf-8'))
    if raw.get('package_format')=='LAFPKG-1.0':
        manifest=raw.get('manifest',{}); entry=manifest.get('entrypoint','artifact.laf.json')
        file_rec=next((f for f in raw.get('files',[]) if f.get('path')==entry),None)
        if not file_rec: raise LAFError('LEGACY_PACKAGE_ENTRYPOINT_MISSING')
        artifact=json.loads(base64.b64decode(file_rec['content_base64']).decode('utf-8'))
        return migrate_legacy_artifact(artifact,source='LAFPKG-1.0')
    if raw.get('format','').startswith('reality-studio.project.'):
        return migrate_reality_studio(raw)
    return migrate_legacy_artifact(raw,source='json')

def migrate_reality_studio(project: dict) -> dict:
    pid=project.get('projectId') or project.get('projectUid') or root_hash(project)[:16]
    scenes=project.get('scenes') or []; assets=project.get('assets') or []; prefabs=project.get('prefabs') or []
    values={
      'project_id':pid,'description':project.get('description',''),'active_scene_id':project.get('activeSceneId'),
      'canvas':_hash_safe(project.get('canvas',{})),
      'scene_count':len(scenes),'asset_count':len(assets),'prefab_count':len(prefabs),
      'scenes':_hash_safe(scenes),'assets':_hash_safe(assets),'prefabs':_hash_safe(prefabs),
    }
    schema={k:{'type':'object' if isinstance(v,dict) else 'list' if isinstance(v,list) else 'integer' if isinstance(v,int) else 'text'} for k,v in values.items()}
    art=new_artifact(artifact_id=f'artifact:reality-studio:{pid}',kind='reality-project',title=project.get('title','Reality Studio Project'),owner_subject_id=(project.get('metadata') or {}).get('owner','TaoWind'),values=values,field_schema=schema,tags=['reality-studio','living-asset'])
    art['capabilities']['requires']=[{'capability_id':'rsr.simulation.run','version':'>=0.1'},{'capability_id':'vsr.projection.render','version':'>=0.1'}]
    art['affordances']=[
      {'affordance_id':'open_scene','label':'打开场景','intent_patterns':['打开场景','进入关卡'],'parameters':[{'id':'scene_id','type':'text','required':True}],'required_scopes':['artifact.propose'],'capability_requirements':[{'capability_id':'reality-studio.scene.open'}],'proposed_operations':[],'preconditions':[]},
      {'affordance_id':'run_preview','label':'运行预览','intent_patterns':['运行项目','预览现实'],'parameters':[],'required_scopes':['artifact.propose'],'capability_requirements':[{'capability_id':'rsr.simulation.run'},{'capability_id':'vsr.projection.render'}],'proposed_operations':[],'preconditions':[]},
    ]
    art['projections']=[
      {'projection_id':'projection:studio-editor','modality':'visual','target_hosts':['reality-studio'],'definition':{'kind':'editor','active_scene_path':'/semantics/values/active_scene_id'}},
      {'projection_id':'projection:runtime','modality':'visual-interactive','target_hosts':['browser','desktop','mobile'],'definition':{'kind':'reality-runtime','source':'/semantics/values/scenes'}},
    ]
    art['extensions']['reality_studio']={'source_format':project.get('format'),'source_version':project.get('version'),'source_root':root_hash(_hash_safe(project)),'project_uid':project.get('projectUid')}
    return seal_revision(art,actor_subject_id='adapter:reality-studio',message='migrate Reality Studio project to LAF 1.0',advance=True)
