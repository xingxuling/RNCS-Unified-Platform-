from pathlib import Path
root=Path(__file__).resolve().parents[1]
html=(root/'web/asset-forge.html').read_text(encoding='utf-8')
css=(root/'web/asset-forge.css').read_text(encoding='utf-8')
js=(root/'web/asset-forge.js').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="asset-forge.css">',f'<style>{css}</style>')
html=html.replace('<script src="asset-forge.js"></script>',f'<script>{js}</script>')
html=html.replace('资产创生工作台 · RAGF v0.4','资产创生工作台 · RAGF v0.4 · 离线可连接原生服务')
out=root/'Reality_Studio_v1.5_资产创生工作台_离线版.html'
out.write_text(html,encoding='utf-8')
print(out)
