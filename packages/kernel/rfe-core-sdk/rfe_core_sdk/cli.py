from __future__ import annotations
import argparse,json,sys
from pathlib import Path
from .store import RealityStore, verify_external_generation

def out(v): print(json.dumps(v,ensure_ascii=False,indent=2))
def main(argv=None):
 p=argparse.ArgumentParser(prog='rfe-core',description='RFE Local Core SDK')
 sp=p.add_subparsers(dest='cmd',required=True)
 x=sp.add_parser('init');x.add_argument('path');x.add_argument('--world',default='world:default');x.add_argument('--branch',default='branch:main')
 x=sp.add_parser('verify');x.add_argument('path')
 x=sp.add_parser('current');x.add_argument('path');x.add_argument('--branch')
 x=sp.add_parser('get-fact');x.add_argument('path');x.add_argument('subject');x.add_argument('predicate');x.add_argument('--branch')
 x=sp.add_parser('relations');x.add_argument('path');x.add_argument('--type');x.add_argument('--from-id');x.add_argument('--to-id');x.add_argument('--branch')
 x=sp.add_parser('commit');x.add_argument('path');x.add_argument('operations_json');x.add_argument('--actor',required=True);x.add_argument('--authority',required=True);x.add_argument('--intent',default='{}');x.add_argument('--branch');x.add_argument('--transaction-id')
 x=sp.add_parser('fork');x.add_argument('path');x.add_argument('new_branch');x.add_argument('--from-branch');x.add_argument('--actor',default='subject:system');x.add_argument('--authority',default='authority:system')
 x=sp.add_parser('diff');x.add_argument('path');x.add_argument('left');x.add_argument('right')
 x=sp.add_parser('merge');x.add_argument('path');x.add_argument('source');x.add_argument('target');x.add_argument('--actor',required=True);x.add_argument('--authority',required=True)
 x=sp.add_parser('generation-ref');x.add_argument('path');x.add_argument('--branch')
 x=sp.add_parser('verify-external');x.add_argument('generation');x.add_argument('--objects-root')
 a=p.parse_args(argv)
 if a.cmd=='init': out(RealityStore.init(a.path,world_id=a.world,branch_id=a.branch).current_generation(a.branch))
 elif a.cmd=='verify': out(RealityStore(a.path).verify())
 elif a.cmd=='current': out(RealityStore(a.path).current_generation(a.branch))
 elif a.cmd=='get-fact': out(RealityStore(a.path).get_fact(a.subject,a.predicate,branch_id=a.branch))
 elif a.cmd=='relations': out(RealityStore(a.path).relations(a.type,a.from_id,a.to_id,branch_id=a.branch))
 elif a.cmd=='commit':
  ops=json.loads(Path(a.operations_json).read_text('utf-8')) if Path(a.operations_json).exists() else json.loads(a.operations_json)
  intent=json.loads(a.intent)
  s=RealityStore(a.path);tx=s.transaction(actor=a.actor,intent=intent,authority=a.authority,branch_id=a.branch,transaction_id=a.transaction_id);tx.operations=ops;out(tx.commit())
 elif a.cmd=='fork': out(RealityStore(a.path).fork_branch(a.new_branch,from_branch_id=a.from_branch,actor=a.actor,authority=a.authority))
 elif a.cmd=='diff': out(RealityStore(a.path).diff(a.left,a.right))
 elif a.cmd=='merge': out(RealityStore(a.path).merge(a.source,a.target,actor=a.actor,authority=a.authority))
 elif a.cmd=='generation-ref': out(RealityStore(a.path).generation_reference(branch_id=a.branch))
 elif a.cmd=='verify-external': out(verify_external_generation(a.generation,a.objects_root))
 return 0
