from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
release=root/'output/冰境试炼-release'

def content_for(mode):
    if mode=='web-release':
        d=release/'web-release';html=(d/'index.html').read_text(encoding='utf-8')
        html=html.replace('<script src="build-data.js"></script>',f'<script>{(d/"build-data.js").read_text(encoding="utf-8")}</script>')
        html=html.replace('<script src="runtime.js"></script>',f'<script>{(d/"runtime.js").read_text(encoding="utf-8")}</script>')
        html=html.replace('<script src="game.js"></script>',f'<script>{(d/"game.js").read_text(encoding="utf-8")}</script>')
        return html
    if mode=='web-single': return (release/'web-single/冰境试炼_单文件版.html').read_text(encoding='utf-8')
    return (release/'windows-portable/冰境试炼.html').read_text(encoding='utf-8')

results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for mode in ['web-release','web-single','windows-portable']:
      page=browser.new_page(viewport={'width':1280,'height':800},device_scale_factor=1)
      errors=[];page.on('pageerror',lambda e,errors=errors: errors.append(str(e)))
      page.set_content(content_for(mode),wait_until='load');page.wait_for_selector('#game',timeout=15000);page.wait_for_function('window.__RNCS_GAME__ && window.__RNCS_GAME__.runtime',timeout=15000)
      outcome=page.evaluate('''()=>{const g=window.__RNCS_GAME__;g.reset();const r=g.runtime;let ticks=0;while(ticks<500&&!r.state.globals.victory&&!r.state.globals.defeat){const p=r.state.entities.player.variables,e=r.state.entities.enemy?.variables??{health:0,x:0};let input={move_left:false,move_right:false,attack:false,restart:false};if(!p.has_key)input.move_right=true;else if((e.health??0)>0){const d=Math.abs(p.x-e.x);if(d>56)input.move_right=p.x<e.x;else input.attack=true;}else input.move_right=true;r.tick(input);ticks++;}return{ticks,victory:r.state.globals.victory,defeat:r.state.globals.defeat,score:r.state.globals.score,state_root:r.stateRoot(),player:r.state.entities.player.variables,enemy:r.state.entities.enemy?.variables??null};}''')
      page.wait_for_timeout(100);assert outcome['victory'] is True, outcome;assert not errors, errors
      shot=root/f'evidence/Reality_Build_v0.2_{mode}.png';page.screenshot(path=str(shot),full_page=True)
      results.append({'mode':mode,'outcome':outcome,'page_errors':errors,'screenshot':shot.relative_to(root).as_posix()});page.close()
    browser.close()
out={'format':'reality-build.browser-acceptance.v0.2','results':results,'pass':all(x['outcome']['victory'] and not x['page_errors'] for x in results)}
(root/'evidence/BROWSER_ACCEPTANCE_v0.2.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2))
