from pathlib import Path
import json
import os
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
release=Path(os.environ.get('REALITY_BUILD_RELEASE',str(root/'output/冰境试炼-release')))
expect_navigation=os.environ.get('EXPECT_NAVIGATION')=='1'
viewport_width=int(os.environ.get('BROWSER_VIEWPORT_WIDTH','1280'));viewport_height=int(os.environ.get('BROWSER_VIEWPORT_HEIGHT','800'))

def content_for(mode):
    if mode=='web-release':
        d=release/'web-release';html=(d/'index.html').read_text(encoding='utf-8')
        html=html.replace('<script src="build-data.js"></script>',f'<script>{(d/"build-data.js").read_text(encoding="utf-8")}</script>')
        html=html.replace('<script src="runtime.js"></script>',f'<script>{(d/"runtime.js").read_text(encoding="utf-8")}</script>')
        html=html.replace('<script src="rsr-runtime.js"></script>',f'<script>{(d/"rsr-runtime.js").read_text(encoding="utf-8")}</script>')
        html=html.replace('<script src="spatial3d-runtime.js"></script>',f'<script>{(d/"spatial3d-runtime.js").read_text(encoding="utf-8")}</script>')
        html=html.replace('<script src="vsr-runtime.js"></script>',f'<script>{(d/"vsr-runtime.js").read_text(encoding="utf-8")}</script>')
        html=html.replace('<script src="game.js"></script>',f'<script>{(d/"game.js").read_text(encoding="utf-8")}</script>')
        return html
    if mode=='web-single': return (release/'web-single/冰境试炼_单文件版.html').read_text(encoding='utf-8')
    return (release/'windows-portable/冰境试炼.html').read_text(encoding='utf-8')

results=[]
with sync_playwright() as p:
    candidates=[os.environ.get('CHROME_PATH'),shutil.which('chromium'),shutil.which('google-chrome'),r'C:\Program Files\Google\Chrome\Application\chrome.exe',r'C:\Program Files\Microsoft\Edge\Application\msedge.exe']
    executable=next((candidate for candidate in candidates if candidate and Path(candidate).exists()),None)
    browser_args=['--no-sandbox']
    if os.environ.get('ENABLE_WEBGPU')=='1': browser_args.extend(['--enable-unsafe-webgpu','--use-angle=swiftshader','--disable-gpu-sandbox'])
    browser_options={'headless':True,'args':browser_args}
    if executable and Path(executable).exists(): browser_options['executable_path']=executable
    browser=p.chromium.launch(**browser_options)
    for mode in ['web-release','web-single','windows-portable']:
      page=browser.new_page(viewport={'width':viewport_width,'height':viewport_height},device_scale_factor=1)
      errors=[];page.on('pageerror',lambda e,errors=errors: errors.append(str(e)))
      page.set_content(content_for(mode),wait_until='load');page.wait_for_selector('#game',timeout=15000);page.wait_for_function('window.__RNCS_GAME__ && window.__RNCS_GAME__.runtime',timeout=15000)
      outcome=page.evaluate('''(expectNavigation)=>{const g=window.__RNCS_GAME__;g.reset();const r=g.runtime,initial_gpu=g.gpuFrameSnapshot(),initial_spatial=structuredClone(g.spatial),initial_spatial3d=structuredClone(g.spatial3d),initial_spatial3d_frame=g.spatial3dFrameSnapshot(),navigation=expectNavigation?g.queryNavigation({x:24,y:32},{x:616,y:336}):null;let ticks=0;while(ticks<500&&!r.state.globals.victory&&!r.state.globals.defeat){const p=r.state.entities.player.variables,e=r.state.entities.enemy?.variables??{health:0,x:0};let input={move_left:false,move_right:false,attack:false,restart:false};if(!p.has_key)input.move_right=true;else if((e.health??0)>0){const d=Math.abs(p.x-e.x);if(d>56)input.move_right=p.x<e.x;else input.attack=true;}else input.move_right=true;g.step(input);ticks++;}return{ticks,victory:r.state.globals.victory,defeat:r.state.globals.defeat,score:r.state.globals.score,state_root:r.stateRoot(),player:r.state.entities.player.variables,enemy:r.state.entities.enemy?.variables??null,navigation,spatial:{initial:initial_spatial,final:structuredClone(g.spatial)},spatial3d:{initial:initial_spatial3d,final:structuredClone(g.spatial3d),initial_frame:initial_spatial3d_frame,final_frame:g.spatial3dFrameSnapshot()},dynamic_gpu:{initial:initial_gpu,final:g.gpuFrameSnapshot()}};}''',expect_navigation)
      page.wait_for_timeout(500);runtime_info=page.evaluate('''()=>{const g=window.__RNCS_GAME__;return{vsr_loaded:Boolean(window.__RNCSVSR__),rsr_loaded:Boolean(window.__RNCSRSR__),navigator_gpu:Boolean(navigator.gpu),gpu_ready:Boolean(g?.gpu?.ready),gpu_error:g?.gpu?.error??'',gpu_receipt:g?.gpu?.receipt?.format??null,spatial:g?.spatial??null,spatial3d:g?.spatial3d??null}}''');assert outcome['victory'] is True, outcome;assert runtime_info['vsr_loaded'] is True, runtime_info;assert runtime_info['rsr_loaded'] is True, runtime_info;assert runtime_info['spatial']['verified'] is True, runtime_info;assert runtime_info['spatial']['binding_count'] > 0, runtime_info;assert not errors, errors
      spatial3d_canvas=page.evaluate("""()=>{const c=document.querySelector('#spatial-game');let non_background_pixels=0;try{const x=c?.getContext('2d'),d=x?.getImageData(0,0,c.width,c.height).data;if(d)for(let i=0;i<d.length;i+=16)if(d[i]+d[i+1]+d[i+2]>24)non_background_pixels++;}catch{}return{width:c?.width??0,height:c?.height??0,non_background_pixels};}""")
      assert outcome['dynamic_gpu']['initial']['verified'] is True, outcome
      assert outcome['dynamic_gpu']['final']['verified'] is True, outcome
      assert outcome['dynamic_gpu']['final']['dynamicBindings'] > 0, outcome
      assert outcome['dynamic_gpu']['initial']['sourceDisplayHash'] != outcome['dynamic_gpu']['final']['sourceDisplayHash'], outcome
      assert outcome['dynamic_gpu']['initial']['spatialStateRoot'] == outcome['spatial']['initial']['state_root'], outcome
      assert outcome['dynamic_gpu']['final']['spatialStateRoot'] == outcome['spatial']['final']['state_root'], outcome
      assert outcome['dynamic_gpu']['initial']['spatialStateRoot'] != outcome['dynamic_gpu']['final']['spatialStateRoot'], outcome
      assert outcome['spatial']['final']['tick'] > outcome['spatial']['initial']['tick'], outcome
      assert outcome['spatial']['initial']['state_root'] != outcome['spatial']['final']['state_root'], outcome
      assert outcome['spatial3d']['initial']['available'] is True, outcome
      assert outcome['spatial3d']['initial']['verified'] is True, outcome
      assert outcome['spatial3d']['initial']['draw_count'] > 0, outcome
      assert outcome['spatial3d']['final']['verified'] is True, outcome
      assert outcome['spatial3d']['final']['draw_count'] > 0, outcome
      assert outcome['spatial3d']['final']['tick'] > outcome['spatial3d']['initial']['tick'], outcome
      assert outcome['spatial3d']['initial']['state_root'] != outcome['spatial3d']['final']['state_root'], outcome
      assert outcome['spatial3d']['initial']['frame_root'] != outcome['spatial3d']['final']['frame_root'], outcome
      assert runtime_info['spatial3d']['available'] is True, runtime_info
      assert spatial3d_canvas['width'] > 0 and spatial3d_canvas['height'] > 0, spatial3d_canvas
      if outcome['spatial3d']['final']['mode'] == 'canvas2d-projective': assert spatial3d_canvas['non_background_pixels'] > 0, spatial3d_canvas
      if expect_navigation:
        assert outcome['spatial']['initial']['navigation_available'] is True, outcome
        assert outcome['navigation']['status'] == 'ok', outcome
        assert len(outcome['navigation']['cells']) > 1, outcome
        assert outcome['navigation']['navigation_root'] == outcome['spatial']['initial']['navigation_root'], outcome
      shot=root/f'evidence/Reality_Build_v0.2_{mode}.png';page.screenshot(path=str(shot),full_page=True)
      results.append({'mode':mode,'outcome':outcome,'page_errors':errors,'runtime':runtime_info,'screenshot':shot.relative_to(root).as_posix()});page.close()
    browser.close()
out={'format':'reality-build.browser-acceptance.v0.2','results':results,'pass':all(x['outcome']['victory'] and not x['page_errors'] for x in results)}
(root/'evidence/BROWSER_ACCEPTANCE_v0.2.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2))
