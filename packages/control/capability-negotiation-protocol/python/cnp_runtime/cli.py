import argparse,json,glob,os
from .core import normalize_descriptor,normalize_provider,normalize_request,negotiate

def main():
 p=argparse.ArgumentParser();sp=p.add_subparsers(dest='cmd',required=True)
 s=sp.add_parser('seal');s.add_argument('--kind',choices=['descriptor','provider','request'],required=True);s.add_argument('file');s.add_argument('--out')
 n=sp.add_parser('negotiate');n.add_argument('--request',required=True);n.add_argument('--providers',required=True);n.add_argument('--out')
 a=p.parse_args();load=lambda f:json.load(open(f,encoding='utf-8'))
 if a.cmd=='seal':
  x=load(a.file);y={'descriptor':normalize_descriptor,'provider':normalize_provider,'request':normalize_request}[a.kind](x)
 else:y=negotiate(load(a.request),[load(f) for f in sorted(glob.glob(os.path.join(a.providers,'*.json')))])
 text=json.dumps(y,ensure_ascii=False,indent=2)+'\n'
 if a.out:os.makedirs(os.path.dirname(a.out) or '.',exist_ok=True);open(a.out,'w',encoding='utf-8').write(text)
 else:print(text,end='')
if __name__=='__main__':main()
