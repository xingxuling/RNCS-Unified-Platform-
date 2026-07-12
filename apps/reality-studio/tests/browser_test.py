from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1600,'height':940},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content((root/'Reality_Studio_v0.9_统一制造工作台_离线版.html').read_text(encoding='utf-8'),wait_until='load')
    page.wait_for_selector('#sceneCanvas',timeout=15000)
    page.wait_for_timeout(800)
    assert '离线统一制造' in page.locator('#serverText').inner_text()
    assert page.locator('[data-node]').count()>=4
    page.click('button[data-left="assets"]')
    assert page.locator('[data-asset]').count()>=4
    page.click('button[data-left="scene"]')
    page.locator('[data-node]').nth(1).click()
    page.locator('#fX').fill('144')
    page.click('#applyNode')
    page.click('button[data-view="behavior"]')
    assert page.locator('#machineGraph').count()==1
    page.click('button[data-view="scene"]')
    page.click('#stepBtn')
    page.wait_for_timeout(200)
    assert int(page.locator('#tick').inner_text())>=1
    assert not errors, errors
    screenshot=root/'evidence/Reality_Studio_v0.9_场景资产行为统一工作台.png'
    page.screenshot(path=str(screenshot),full_page=True)
    result={'format':'reality-studio.browser-test.v0.9','ready':True,'mode':'offline-file','scene_nodes':page.locator('[data-node]').count(),'assets':4,'tick':int(page.locator('#tick').inner_text()),'server_text':page.locator('#serverText').inner_text(),'page_errors':errors,'screenshot':'evidence/Reality_Studio_v0.9_场景资产行为统一工作台.png'}
    (root/'evidence/BROWSER_TEST_v0.9.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    browser.close()
