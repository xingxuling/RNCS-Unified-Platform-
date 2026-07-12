from pathlib import Path
import hashlib, sys
root=Path(__file__).resolve().parents[1]
errors=[]
for line in (root/'FILE_SHA256SUMS.txt').read_text(encoding='utf-8').splitlines():
    if not line.strip(): continue
    expected, rel=line.split('  ',1); p=root/rel
    if not p.exists(): errors.append(f'MISSING:{rel}'); continue
    actual=hashlib.sha256(p.read_bytes()).hexdigest()
    if actual!=expected: errors.append(f'MISMATCH:{rel}')
print({'valid':not errors,'errors':errors,'checked':len((root/'FILE_SHA256SUMS.txt').read_text().splitlines())})
sys.exit(1 if errors else 0)
