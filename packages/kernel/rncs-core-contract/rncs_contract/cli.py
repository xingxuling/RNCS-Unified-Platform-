from __future__ import annotations
import argparse, json
from pathlib import Path
from .lifecycle import new_proposal, authorize, commit, attach_projection, verify
from .adapters import adapt_hnac_snapshot, adapt_icar_result, adapt_vsr_authority_request, adapt_laf_artifact

def load(path): return json.loads(Path(path).read_text('utf-8'))
def save(path,value): Path(path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n','utf-8')

def main(argv=None):
    p=argparse.ArgumentParser(prog='rncs-contract'); sub=p.add_subparsers(dest='cmd',required=True)
    x=sub.add_parser('propose'); x.add_argument('--input',required=True); x.add_argument('--out',required=True)
    x=sub.add_parser('authorize'); x.add_argument('--envelope',required=True); x.add_argument('--status',choices=['approved','denied'],required=True); x.add_argument('--resolver',required=True); x.add_argument('--reason',default=''); x.add_argument('--out',required=True)
    x=sub.add_parser('commit'); x.add_argument('--envelope',required=True); x.add_argument('--generation',type=int,required=True); x.add_argument('--generation-root',required=True); x.add_argument('--out',required=True)
    x=sub.add_parser('project'); x.add_argument('--envelope',required=True); x.add_argument('--projection',required=True); x.add_argument('--out',required=True)
    x=sub.add_parser('verify'); x.add_argument('--envelope',required=True)
    for name in ['adapt-hnac','adapt-icar','adapt-vsr','adapt-laf']:
        x=sub.add_parser(name); x.add_argument('--input',required=True); x.add_argument('--out',required=True); x.add_argument('--host-id',default='unknown-host')
    a=p.parse_args(argv)
    if a.cmd=='propose':
        d=load(a.input); out=new_proposal(**d); save(a.out,out)
    elif a.cmd=='authorize': save(a.out,authorize(load(a.envelope),status=a.status,resolver=a.resolver,reason=a.reason))
    elif a.cmd=='commit': save(a.out,commit(load(a.envelope),generation=a.generation,generation_root=a.generation_root))
    elif a.cmd=='project': save(a.out,attach_projection(load(a.envelope),load(a.projection)))
    elif a.cmd=='verify': print(json.dumps(verify(load(a.envelope)),ensure_ascii=False,indent=2))
    else:
        raw=load(a.input)
        out={'adapt-hnac':lambda:adapt_hnac_snapshot(raw,a.host_id),'adapt-icar':lambda:adapt_icar_result(raw),'adapt-vsr':lambda:adapt_vsr_authority_request(raw),'adapt-laf':lambda:adapt_laf_artifact(raw)}[a.cmd]()
        save(a.out,out)
if __name__=='__main__': main()
