from __future__ import annotations
import argparse, json, pathlib, sys
from .model import new_artifact, validate_artifact, apply_operations, create_branch, diff_artifacts, three_way_merge, bind_generation
from .adapters import load_and_migrate
from .package import pack_artifact, verify_package, unpack_package
from .exporters import export_markdown, export_html, export_csv

def readj(p): return json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
def writej(p,v): pathlib.Path(p).parent.mkdir(parents=True,exist_ok=True); pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def emit(v): print(json.dumps(v,ensure_ascii=False,indent=2))

def main(argv=None):
    p=argparse.ArgumentParser(prog='laf'); sub=p.add_subparsers(dest='cmd',required=True)
    x=sub.add_parser('init'); x.add_argument('output'); x.add_argument('--id',required=True); x.add_argument('--kind',default='artifact'); x.add_argument('--title',required=True); x.add_argument('--owner',required=True)
    x=sub.add_parser('validate'); x.add_argument('input')
    x=sub.add_parser('migrate'); x.add_argument('input'); x.add_argument('output')
    x=sub.add_parser('revise'); x.add_argument('input'); x.add_argument('operations'); x.add_argument('output'); x.add_argument('--actor',required=True); x.add_argument('--message',default='edit')
    x=sub.add_parser('branch'); x.add_argument('input'); x.add_argument('branch'); x.add_argument('output'); x.add_argument('--actor',required=True)
    x=sub.add_parser('diff'); x.add_argument('left'); x.add_argument('right')
    x=sub.add_parser('merge'); x.add_argument('base'); x.add_argument('left'); x.add_argument('right'); x.add_argument('output'); x.add_argument('--actor',default='merge')
    x=sub.add_parser('bind'); x.add_argument('artifact'); x.add_argument('transition'); x.add_argument('output')
    x=sub.add_parser('pack'); x.add_argument('artifact'); x.add_argument('output'); x.add_argument('--assets')
    x=sub.add_parser('verify-package'); x.add_argument('package')
    x=sub.add_parser('unpack'); x.add_argument('package'); x.add_argument('output')
    x=sub.add_parser('export'); x.add_argument('artifact'); x.add_argument('output'); x.add_argument('--format',choices=['markdown','html','csv','json'],required=True)
    a=p.parse_args(argv)
    try:
      if a.cmd=='init': art=new_artifact(artifact_id=a.id,kind=a.kind,title=a.title,owner_subject_id=a.owner); writej(a.output,art); emit(validate_artifact(art))
      elif a.cmd=='validate': emit(validate_artifact(readj(a.input)))
      elif a.cmd=='migrate': art=load_and_migrate(a.input); writej(a.output,art); emit(validate_artifact(art))
      elif a.cmd=='revise': art=apply_operations(readj(a.input),readj(a.operations),actor_subject_id=a.actor,message=a.message); writej(a.output,art); emit(validate_artifact(art))
      elif a.cmd=='branch': art=create_branch(readj(a.input),a.branch,actor_subject_id=a.actor); writej(a.output,art); emit(validate_artifact(art))
      elif a.cmd=='diff': emit(diff_artifacts(readj(a.left),readj(a.right)))
      elif a.cmd=='merge': art,conf=three_way_merge(readj(a.base),readj(a.left),readj(a.right),actor_subject_id=a.actor); writej(a.output,art); emit({'valid':validate_artifact(art)['valid'],'conflicts':conf})
      elif a.cmd=='bind': art=bind_generation(readj(a.artifact),transition_envelope=readj(a.transition)); writej(a.output,art); emit(validate_artifact(art))
      elif a.cmd=='pack': emit(pack_artifact(readj(a.artifact),a.output,a.assets))
      elif a.cmd=='verify-package': r=verify_package(a.package); r.pop('artifact',None); emit(r); sys.exit(0 if r['valid'] else 2)
      elif a.cmd=='unpack': r=unpack_package(a.package,a.output); emit({'valid':r['valid'],'output':a.output})
      elif a.cmd=='export':
        art=readj(a.artifact); data={'markdown':export_markdown,'html':export_html,'csv':export_csv}.get(a.format,lambda x:json.dumps(x,ensure_ascii=False,indent=2)+'\n')(art); pathlib.Path(a.output).write_text(data,encoding='utf-8'); emit({'output':a.output,'format':a.format})
    except Exception as exc:
      emit({'valid':False,'error':f'{type(exc).__name__}:{exc}'}); sys.exit(2)
