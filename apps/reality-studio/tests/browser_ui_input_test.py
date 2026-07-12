from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1680,'height':980},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content((root/'Reality_Studio_v1.2_UI输入工作台_离线版.html').read_text(encoding='utf-8'),wait_until='load')
    page.wait_for_selector('#uiCanvas',state='attached',timeout=15000)
    page.wait_for_timeout(1000)
    assert '离线统一制造' in page.locator('#serverText').inner_text()
    page.click('button[data-view="ui"]')
    page.click('button[data-left="ui"]')
    page.wait_for_timeout(250)
    assert page.locator('[data-ui-node]').count()>=10
    assert 'ui:' in page.locator('#uiRoot').inner_text() or page.locator('#uiRoot').inner_text()!='—'
    assert page.locator('#uiCanvas').is_visible()
    page.click('button[data-device="mobile"]')
    page.wait_for_timeout(150)
    assert 'mobile' in page.locator('#uiDeviceBadge').inner_text()
    page.click('button[data-left="input"]')
    page.wait_for_timeout(120)
    assert page.locator('.input-action-card').count()>=8
    page.fill('#rebindKey','KeyL')
    page.click('#rebindAttack')
    page.wait_for_timeout(120)
    page.click('#testAttackBtn')
    page.wait_for_timeout(120)
    assert int(page.locator('#tick').inner_text())>=1
    assert not errors,errors
    shot=root/'evidence/Reality_Studio_v1.2_UI输入原生工作台.png'
    page.screenshot(path=str(shot),full_page=True)
    result={'format':'reality-studio.browser-ui-input-test.v1.2','ready':True,'mode':'offline-file','ui_nodes':page.locator('[data-ui-node]').count(),'input_actions':page.locator('.input-action-card').count(),'device_badge':page.locator('#uiDeviceBadge').inner_text(),'tick':int(page.locator('#tick').inner_text()),'page_errors':errors,'screenshot':'evidence/Reality_Studio_v1.2_UI输入原生工作台.png'}
    (root/'evidence/BROWSER_UI_INPUT_TEST_v1.2.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    browser.close()
