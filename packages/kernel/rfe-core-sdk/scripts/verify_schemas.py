import json
from pathlib import Path
root=Path(__file__).parents[1]
# Structural smoke check without third-party jsonschema dependency.
files=sorted((root/'schemas').glob('*.json'))
for p in files:
 s=json.loads(p.read_text());assert s.get('$schema') and s.get('type')=='object'
print(f'{len(files)}/{len(files)} schema documents parsed')
