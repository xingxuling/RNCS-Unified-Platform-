from pathlib import Path
root=Path(__file__).resolve().parents[1]
html=(root/'web/index.html').read_text(encoding='utf-8')
css=(root/'web/style.css').read_text(encoding='utf-8')
sample=(root/'web/sample-behavior.js').read_text(encoding='utf-8').replace('</script','<\\/script')
js=(root/'web/app.js').read_text(encoding='utf-8').replace('</script','<\\/script')
html=html.replace('<link rel="stylesheet" href="style.css">',f'<style>{css}</style>')
html=html.replace('<script src="sample-behavior.js"></script>',f'<script>{sample}</script>')
html=html.replace('<script src="app.js"></script>',f'<script>{js}</script>')
html=html.replace("default-src 'self' 'unsafe-inline' data: blob:; connect-src 'self' http://127.0.0.1:*", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src http://127.0.0.1:*")
out=root/'Reality_Studio_v0.8_行为原生工作台_离线版.html'
out.write_text(html,encoding='utf-8')
print(out, out.stat().st_size)
