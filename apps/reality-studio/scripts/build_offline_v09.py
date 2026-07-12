from pathlib import Path
import json, base64, mimetypes
root=Path(__file__).resolve().parents[1]
html=(root/'web/index.html').read_text(encoding='utf-8')
css=(root/'web/style.css').read_text(encoding='utf-8')
js=(root/'web/app.js').read_text(encoding='utf-8')
project=json.loads((root/'examples/冰境试炼.unified-project.json').read_text(encoding='utf-8'))
for asset in project['assets']['registry'].values():
    url=asset.get('preview_url')
    if not url: continue
    p=root/'web'/url
    if p.exists():
        mime=mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
        asset['preview_url']=f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()
sample='window.SAMPLE_UNIFIED='+json.dumps(project,ensure_ascii=False,separators=(',',':'))+';'
html=html.replace('<link rel="stylesheet" href="style.css">',f'<style>{css}</style>')
html=html.replace('<script src="sample-unified.js"></script><script src="app.js"></script>',f'<script>{sample}</script><script>{js}</script>')
html=html.replace('Reality Studio v0.9 统一制造版','Reality Studio v0.9 统一制造版 · 离线')
(root/'Reality_Studio_v0.9_统一制造工作台_离线版.html').write_text(html,encoding='utf-8')
print(root/'Reality_Studio_v0.9_统一制造工作台_离线版.html')
