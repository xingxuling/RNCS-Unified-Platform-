import json,pathlib
from jsonschema import Draft202012Validator
root=pathlib.Path(__file__).parent.parent
schema=json.loads((root/'schemas/living-artifact.v1.schema.json').read_text(encoding='utf-8'))
v=Draft202012Validator(schema); results=[]
for p in sorted(root.glob('examples/*.laf1.json'))+sorted(root.glob('examples/*-laf1-bound.json')):
 errors=[e.message for e in v.iter_errors(json.loads(p.read_text(encoding='utf-8')))]
 results.append({'file':p.name,'valid':not errors,'errors':errors})
out={'passed':sum(r['valid'] for r in results),'total':len(results),'results':results}
(root/'evidence/SCHEMA_VALIDATION_v1.0.0.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,ensure_ascii=False,indent=2))
if out['passed']!=out['total']: raise SystemExit(2)
