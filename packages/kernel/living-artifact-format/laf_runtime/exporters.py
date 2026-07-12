from __future__ import annotations
import csv, html, io, json

def export_markdown(artifact: dict) -> str:
    i=artifact['identity']; s=artifact['semantics']; c=artifact['continuity']['current']
    lines=[f"# {i['title']}",'',f"- Artifact ID: `{i['artifact_id']}`",f"- Kind: `{i['kind']}`",f"- Revision: `{c['revision']}`",f"- Binding: `{c['binding_status']}`",f"- RFE Generation: `{c['authoritative_generation']['generation']}`",'', '## Fields','']
    for k,v in s['values'].items(): lines.append(f"- **{k}**: `{json.dumps(v,ensure_ascii=False)}`")
    if s['relations']:
        lines += ['', '## Relations','']
        for r in s['relations']: lines.append(f"- `{r['predicate']}` → `{r['target_artifact_id']}`")
    return '\n'.join(lines)+'\n'

def export_html(artifact: dict) -> str:
    i=artifact['identity']; rows=''.join(f'<tr><th>{html.escape(str(k))}</th><td><pre>{html.escape(json.dumps(v,ensure_ascii=False,indent=2))}</pre></td></tr>' for k,v in artifact['semantics']['values'].items())
    return f'''<!doctype html><meta charset="utf-8"><title>{html.escape(i['title'])}</title><style>body{{font-family:system-ui;max-width:960px;margin:40px auto;padding:0 20px}}table{{border-collapse:collapse;width:100%}}th,td{{border:1px solid #ccd;padding:10px;text-align:left;vertical-align:top}}th{{width:24%}}pre{{white-space:pre-wrap;margin:0}}</style><h1>{html.escape(i['title'])}</h1><p><code>{html.escape(i['artifact_id'])}</code></p><table>{rows}</table>'''

def export_csv(artifact: dict) -> str:
    buf=io.StringIO(); w=csv.writer(buf); w.writerow(['field','value_json'])
    for k,v in artifact['semantics']['values'].items(): w.writerow([k,json.dumps(v,ensure_ascii=False,separators=(',',':'))])
    return buf.getvalue()
