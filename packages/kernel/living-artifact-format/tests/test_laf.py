import json, pathlib, tempfile, zipfile
import pytest
from laf_runtime import *
from laf_runtime.model import ZERO_ROOT
from laf_runtime.package import pack_artifact, verify_package
from laf_runtime.adapters import migrate_legacy_artifact, migrate_reality_studio
from laf_runtime.exporters import export_markdown, export_html, export_csv

FIX=pathlib.Path(__file__).parent.parent/'examples'

def base_artifact():
    return new_artifact(artifact_id='artifact:test:中文',kind='project',title='中文项目',owner_subject_id='subject:owner',values={'status':'concept','progress':10,'approved':False,'items':['a']},field_schema={'progress':{'type':'integer'}})

def test_new_artifact_valid():
    a=base_artifact(); assert validate_artifact(a)['valid']; assert a['continuity']['current']['revision']==0

def test_revision_is_local_and_unbound():
    a=base_artifact(); b=apply_operations(a,[{'op':'increment','path':'/semantics/values/progress','value':10}],actor_subject_id='subject:owner')
    assert b['semantics']['values']['progress']==20; assert b['continuity']['current']['revision']==1
    assert b['continuity']['current']['binding_status']=='unbound'; assert b['continuity']['current']['authoritative_generation']['generation']==0
    assert validate_artifact(b)['valid']

def test_operations_guard_boundary():
    with pytest.raises(Exception): apply_operations(base_artifact(),[{'op':'set','path':'/identity/title','value':'x'}],actor_subject_id='x')

def test_branch():
    a=create_branch(base_artifact(),'experiment',actor_subject_id='subject:owner')
    assert a['continuity']['current']['branch']=='experiment'; assert validate_artifact(a)['valid']

def test_three_way_merge_and_conflict():
    base=base_artifact()
    left=apply_operations(base,[{'op':'set','path':'/semantics/values/status','value':'left'}],actor_subject_id='l')
    right=apply_operations(base,[{'op':'set','path':'/semantics/values/status','value':'right'}],actor_subject_id='r')
    merged,conf=three_way_merge(base,left,right)
    assert conf and '$conflict' in merged['semantics']['values']['status']; assert validate_artifact(merged)['valid']

def test_package_deterministic_and_verified(tmp_path):
    a=base_artifact(); p1=tmp_path/'a.lafpkg'; p2=tmp_path/'b.lafpkg'
    r1=pack_artifact(a,p1); r2=pack_artifact(a,p2)
    assert p1.read_bytes()==p2.read_bytes(); assert r1['content_root']==r2['content_root']; assert verify_package(p1)['valid']

def test_package_tamper_rejected(tmp_path):
    a=base_artifact(); p=tmp_path/'a.lafpkg'; pack_artifact(a,p)
    q=tmp_path/'bad.lafpkg'
    with zipfile.ZipFile(p) as src, zipfile.ZipFile(q,'w') as dst:
        for n in src.namelist(): dst.writestr(n, b'{}' if n=='artifact.laf.json' else src.read(n))
    assert not verify_package(q)['valid']

def test_legacy_migration():
    raw=json.loads((FIX/'legacy-laf-v0.7.json').read_text(encoding='utf-8'))
    a=migrate_legacy_artifact(raw); assert a['laf_version']=='1.0.0'; assert a['affordances']; assert validate_artifact(a)['valid']

def test_studio_migration():
    raw=json.loads((FIX/'reality-studio-v0.5-project.json').read_text(encoding='utf-8'))
    a=migrate_reality_studio(raw); assert a['identity']['kind']=='reality-project'; assert a['semantics']['values']['scene_count']>=1; assert validate_artifact(a)['valid']

def test_bind_generation_requires_committed_reference():
    a=base_artifact()
    env={'format':'rncs.reality-transition-envelope.v0.1','phase':'committed','transition_id':'transition:test','commit':{'status':'committed','result_generation':{'reality_id':'reality:test','generation':1,'generation_root':'1'*64}},'extensions':{'artifact_id':a['identity']['artifact_id'],'artifact_root':a['evidence']['artifact_root']}}
    b=bind_generation(a,transition_envelope=env,verifier=lambda _: {'valid':True,'errors':[]})
    assert b['continuity']['current']['binding_status']=='bound'; assert b['continuity']['current']['authoritative_generation']['generation']==1; assert validate_artifact(b)['valid']

def test_host_state_cannot_claim_generation():
    a=base_artifact(); a['host_state_refs']=[{'host_id':'x','generation':1,'snapshot_sequence':1}]
    # resealing is intentionally not done; validator must report both root and boundary issue
    assert 'HOST_STATE_MUST_NOT_DECLARE_GENERATION' in validate_artifact(a)['errors']

def test_exporters():
    a=base_artifact(); assert '# 中文项目' in export_markdown(a); assert '<h1>中文项目</h1>' in export_html(a); assert 'field,value_json' in export_csv(a)
