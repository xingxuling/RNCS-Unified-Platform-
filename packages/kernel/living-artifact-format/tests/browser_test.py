from playwright.sync_api import sync_playwright
import json, pathlib
root=pathlib.Path(__file__).parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000}, device_scale_factor=1)
    page.set_content((root/'LAF_1.0_Workbench_离线版.html').read_text(encoding='utf-8'), wait_until='load')
    page.wait_for_timeout(500)
    title=page.locator('#title').inner_text()
    valid=page.locator('#valid').inner_text()
    revision=page.locator('#revision').inner_text()
    generation=page.locator('#generation').inner_text()
    assert title=='Reality-Native Computing Stack'
    assert valid=='通过'
    assert revision.startswith('r1')
    assert generation=='G1'
    shot=root/'evidence/LAF_1.0_Workbench_验收截图.png'
    page.screenshot(path=str(shot),full_page=True)
    result={'title':title,'valid':valid,'revision':revision,'generation':generation,'screenshot':shot.name}
    (root/'evidence/BROWSER_TEST_v1.0.0.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    browser.close()
