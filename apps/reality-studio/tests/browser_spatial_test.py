from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files','--disable-gpu-sandbox'])
    page=browser.new_page(viewport={'width':1780,'height':1050},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content((root/'Reality_Studio_v1.4_三维具身编辑工作台_离线版.html').read_text(encoding='utf-8'),wait_until='load')
    page.wait_for_selector('#spatialViewTab',timeout=20000)
    page.wait_for_timeout(1100)
    page.click('#spatialViewTab');page.wait_for_timeout(350)
    assert page.locator('#spatialView').is_visible()
    assert page.locator('#spatialCanvas').is_visible()
    before=page.locator('[data-spatial-body]').count();assert before>=4,before
    page.click('[data-spatial-body="crate-a"]');page.wait_for_timeout(150)
    page.fill('#sbX','1750');page.fill('#sbY','900');page.fill('#sbZ','-450');page.click('[data-testid="apply-spatial-body"]');page.wait_for_timeout(250)
    assert page.locator('#sbX').input_value()=='1750'
    page.click('#addSpatialSphere');page.wait_for_timeout(250)
    after=page.locator('[data-spatial-body]').count();assert after==before+1,(before,after)
    tick0=page.locator('#spatialTick').inner_text();page.click('#spatialStepBtn');page.wait_for_timeout(160);tick1=page.locator('#spatialTick').inner_text();assert tick1!=tick0,(tick0,tick1)
    page.click('[data-spatial-action="forward"]');page.click('[data-spatial-action="jump"]');page.wait_for_timeout(180)
    assert page.locator('#spatialWatch').is_visible()
    assert page.locator('#spatialBodyBadge').inner_text().startswith(str(after))
    assert not errors,errors
    shot=root/'evidence/Reality_Studio_v1.4_三维具身编辑工作台.png';page.screenshot(path=str(shot),full_page=True)
    result={'format':'reality-studio.browser-spatial-test.v1.4','ready':True,'mode':'offline-file','bodies_before':before,'bodies_after':after,'body_patch':{'id':'crate-a','position':{'x':1750,'y':900,'z':-450}},'tick_before':tick0,'tick_after':tick1,'canvas_visible':page.locator('#spatialCanvas').is_visible(),'watch_visible':page.locator('#spatialWatch').is_visible(),'page_errors':errors,'screenshot':'evidence/Reality_Studio_v1.4_三维具身编辑工作台.png'}
    (root/'evidence/BROWSER_SPATIAL_TEST_v1.4.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
