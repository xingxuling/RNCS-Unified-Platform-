from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
    page=browser.new_page(viewport={'width':1680,'height':980},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content((root/'Reality_Studio_v1.1_TileMap导航工作台_离线版.html').read_text(encoding='utf-8'),wait_until='load')
    page.wait_for_selector('#sceneCanvas',timeout=15000)
    page.wait_for_timeout(900)
    assert '离线统一制造' in page.locator('#serverText').inner_text()
    assert page.locator('[data-tile]').count()>=6
    assert page.locator('[data-layer]').count()>=4
    assert page.locator('[data-node]').count()>=5
    assert page.locator('#tilemapRoot').inner_text()!='—'
    # Paint a wall cell in offline mode.
    page.click('#paintTool')
    page.locator('[data-tile="2"]').click()
    box=page.locator('#sceneCanvas').bounding_box()
    page.mouse.click(box['x']+box['width']*0.32,box['y']+box['height']*0.35)
    page.wait_for_timeout(150)
    # Build and display a navigation route.
    page.click('button[data-view="navigation"]')
    page.click('#routeScoutBtn')
    page.wait_for_timeout(250)
    assert 'ok' in page.locator('#navSummary').inner_text()
    assert page.locator('#navPathBadge').inner_text()!='Path —'
    before=page.locator('#navWatch').inner_text()
    page.click('#stepBtn')
    page.wait_for_timeout(150)
    after=page.locator('#navWatch').inner_text()
    assert int(page.locator('#tick').inner_text())>=1
    assert not errors,errors
    shot=root/'evidence/Reality_Studio_v1.1_TileMap导航原生工作台.png'
    page.screenshot(path=str(shot),full_page=True)
    result={'format':'reality-studio.browser-tilemap-test.v1.1','ready':True,'mode':'offline-file','nodes':page.locator('[data-node]').count(),'tiles':page.locator('[data-tile]').count(),'layers':page.locator('[data-layer]').count(),'path_badge':page.locator('#navPathBadge').inner_text(),'tick':int(page.locator('#tick').inner_text()),'page_errors':errors,'screenshot':'evidence/Reality_Studio_v1.1_TileMap导航原生工作台.png'}
    (root/'evidence/BROWSER_TILEMAP_TEST_v1.1.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    browser.close()
