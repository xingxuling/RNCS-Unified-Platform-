from pathlib import Path
import json,tempfile
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='rs-asset-browser-') as td:
    sample=Path(td)/'用户导入角色.svg'
    sample.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#38bdf8"/><circle cx="32" cy="32" r="18" fill="#f8fafc"/></svg>',encoding='utf-8')
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
        page=browser.new_page(viewport={'width':1680,'height':980},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content((root/'Reality_Studio_v1.3_资产连续性工作台_离线版.html').read_text(encoding='utf-8'),wait_until='load')
        page.wait_for_selector('#assetFileInput',state='attached',timeout=15000)
        page.wait_for_timeout(800)
        assert '离线统一制造' in page.locator('#serverText').inner_text()
        before=int(page.locator('#assetCount').inner_text().split()[0])
        page.locator('#assetFileInput').set_input_files(str(sample))
        page.wait_for_timeout(700)
        page.click('button[data-left="assets"]')
        page.wait_for_timeout(300)
        after=int(page.locator('#assetCount').inner_text().split()[0])
        assert after==before+1,(before,after)
        cards=page.locator('.asset-card')
        assert cards.count()==after
        assert page.locator('.asset-card',has_text='用户导入角色').count()==1
        assert page.locator('.asset-audit-summary').is_visible()
        assert page.locator('#panelImportAssetBtn').is_visible()
        assert page.locator('#reimportAllBtn').is_visible()
        assert page.locator('#assetAuditBtn').is_visible()
        assert not errors,errors
        shot=root/'evidence/Reality_Studio_v1.3_资产连续性工作台.png'
        page.screenshot(path=str(shot),full_page=True)
        result={'format':'reality-studio.browser-asset-continuity-test.v1.3','ready':True,'mode':'offline-file','assets_before':before,'assets_after':after,'imported_asset':'用户导入角色','asset_cards':cards.count(),'audit_summary_visible':page.locator('.asset-audit-summary').is_visible(),'page_errors':errors,'screenshot':'evidence/Reality_Studio_v1.3_资产连续性工作台.png'}
        (root/'evidence/BROWSER_ASSET_CONTINUITY_TEST_v1.3.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps(result,ensure_ascii=False,indent=2))
        browser.close()
