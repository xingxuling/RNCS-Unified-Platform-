from pathlib import Path
import json
from jsonschema import Draft202012Validator
R=Path(__file__).parents[1]
pairs=[('schemas/policy-bundle.v0.1.schema.json','examples/policy-bundle.json'),('schemas/approval-receipt.v0.1.schema.json','examples/approval-owner.json'),('schemas/authority-decision.v0.1.schema.json','examples/evaluation-approved.json'),('schemas/authority-decision.v0.1.schema.json','examples/evaluation-pending.json')]
results=[]
for s,e in pairs:
 schema=json.loads((R/s).read_text());value=json.loads((R/e).read_text());errs=list(Draft202012Validator(schema).iter_errors(value));results.append({'schema':s,'example':e,'valid':not errs,'errors':[x.message for x in errs]})
out={'valid':all(x['valid'] for x in results),'count':len(results),'results':results};(R/'evidence/SCHEMA_VALIDATION_v0.1.0.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(0 if out['valid'] else 1)
