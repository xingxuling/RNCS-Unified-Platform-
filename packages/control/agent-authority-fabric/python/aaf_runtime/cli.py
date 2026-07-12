import argparse,json
from pathlib import Path
from .core import evaluate_authority
def main():
 p=argparse.ArgumentParser();p.add_argument('command',choices=['evaluate']);p.add_argument('--input',required=True);p.add_argument('--out',required=True);a=p.parse_args();data=json.loads(Path(a.input).read_text(encoding='utf-8'));r=evaluate_authority(**data);Path(a.out).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'status':r['status'],'decision_root':r['decision_root']}))
if __name__=='__main__':main()
