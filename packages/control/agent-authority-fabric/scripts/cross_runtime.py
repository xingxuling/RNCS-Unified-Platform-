from pathlib import Path
import json,subprocess,sys
R=Path(__file__).parents[1]
sys.path.insert(0,str(R/'python'))
from aaf_runtime import evaluate_authority
x=json.loads((R/'examples/evaluation-input.json').read_text());py=evaluate_authority(**x)
js=json.loads(subprocess.check_output(['node','-e',"import fs from 'node:fs';import {evaluateAuthority} from './src/index.mjs';const x=JSON.parse(fs.readFileSync('./examples/evaluation-input.json'));console.log(JSON.stringify(evaluateAuthority(x)));"],cwd=R,text=True))
out={'status':'PASS' if py['decision_root']==js['decision_root'] else 'FAIL','python_decision_root':py['decision_root'],'node_decision_root':js['decision_root'],'same_authorized_envelope_root':py['authorized_envelope']['envelope_root']==js['authorized_envelope']['envelope_root']};(R/'evidence/CROSS_RUNTIME_AUTHORITY_v0.1.0.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2));raise SystemExit(0 if out['status']=='PASS' and out['same_authorized_envelope_root'] else 1)
