from pathlib import Path
import json
import os
import shutil
import socket
import subprocess
import time
import urllib.request

from playwright.sync_api import expect, sync_playwright


studio_root = Path(__file__).resolve().parents[1]
repo_root = studio_root.parents[1]
artifacts = repo_root / 'tmp' / 'playwright' / 'anime-forge-phase6-3-geometric-truth'
artifacts.mkdir(parents=True, exist_ok=True)


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def request_json(url):
    with urllib.request.urlopen(url, timeout=5) as response:
        return json.load(response)


def browser_executable():
    configured = os.environ.get('CHROME_PATH')
    candidates = [
        configured,
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        shutil.which('google-chrome'),
        shutil.which('chromium'),
        shutil.which('chromium-browser'),
    ]
    return next((str(candidate) for candidate in candidates if candidate and Path(candidate).exists()), None)


port = free_port()
base = f'http://127.0.0.1:{port}'
proc = subprocess.Popen(
    ['node', 'src/cli.mjs', 'serve', '--port', str(port)],
    cwd=studio_root,
    env=os.environ.copy(),
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
)

try:
    health = None
    for _ in range(160):
        try:
            health = request_json(base + '/api/health')
            if health.get('anime_forge_geometric_truth_workspace'):
                break
        except Exception:
            time.sleep(0.125)
    if not health or not health.get('anime_forge_geometric_truth_workspace'):
        raise RuntimeError('Anime Forge Phase 6.3 geometric truth server capability did not start')

    with sync_playwright() as playwright:
        launch = {'headless': True, 'args': ['--no-sandbox', '--disable-gpu-sandbox']}
        executable = browser_executable()
        if executable:
            launch['executable_path'] = executable
        browser = playwright.chromium.launch(**launch)
        page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
        page_errors = []
        failed_requests = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('requestfailed', lambda req: failed_requests.append({'url': req.url, 'failure': req.failure}))
        page.goto(base + '/anime-forge.html', wait_until='load')
        expect(page.locator('#sourceState')).to_contain_text('Micro-Episode', timeout=30000)
        expect(page.locator('#geometricTruthBtn')).to_have_text('几何真值')
        expect(page.locator('#geometricStatus')).not_to_have_text('读取中', timeout=30000)
        expect(page.locator('#geometricTruthPanel')).to_be_visible()

        def capture(label, width, height):
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_timeout(250)
            screenshot = artifacts / f'ANIME_FORGE_PHASE6_3_GEOMETRIC_TRUTH_{label}.png'
            page.screenshot(path=str(screenshot), full_page=False)
            metrics = page.evaluate(
                """({width}) => {
                    const strip = [...document.querySelectorAll('.geometric-truth-strip .quality-cell')].map(node => {
                        const box = node.getBoundingClientRect();
                        return {left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height};
                    });
                    const buttons = [...document.querySelectorAll('button')].map(node => ({id: node.id, fits: node.scrollWidth <= node.clientWidth + 1}));
                    return {
                        width,
                        body_scroll_width: document.body.scrollWidth,
                        document_scroll_width: document.documentElement.scrollWidth,
                        strip_display: getComputedStyle(document.querySelector('.geometric-truth-strip')).display,
                        strip,
                        buttons,
                        geometric_status: document.querySelector('#geometricStatus').textContent,
                        geometric_media: document.querySelector('#geometricMedia').textContent,
                        geometric_failure: document.querySelector('#geometricFailure').textContent,
                    };
                }""",
                {'width': width},
            )
            metrics['screenshot'] = screenshot.relative_to(repo_root).as_posix()
            metrics['screenshot_bytes'] = screenshot.stat().st_size
            assert metrics['body_scroll_width'] <= width + 1, metrics
            assert metrics['document_scroll_width'] <= width + 1, metrics
            assert metrics['strip_display'] == 'grid', metrics
            assert all(box['width'] > 0 and box['height'] > 0 for box in metrics['strip']), metrics
            assert all(button['fits'] for button in metrics['buttons']), metrics
            assert metrics['geometric_status'] in ('静态几何通过', '几何门受阻'), metrics
            assert metrics['screenshot_bytes'] > 10000, metrics
            return metrics

        desktop = capture('desktop', 1440, 900)
        mobile = capture('mobile', 390, 844)
        assert not page_errors, page_errors
        assert not failed_requests, failed_requests
        browser.close()

    report = {
        'format': 'reality-studio.anime-forge-phase6-3-geometric-truth-browser-evidence.v0.1',
        'ready': True,
        'route': '/anime-forge.html',
        'health': {
            'anime_forge_geometric_truth_phase': health['anime_forge_geometric_truth_phase'],
            'anime_forge_geometric_truth_workspace': health['anime_forge_geometric_truth_workspace'],
        },
        'viewports': {'desktop': desktop, 'mobile': mobile},
        'page_errors': page_errors,
        'failed_requests': failed_requests,
        'boundary': 'Local Chromium desktop/mobile layout regression for the read-only Phase 6.3 workspace; not human visual acceptance.',
    }
    report_file = artifacts / 'browser-evidence.json'
    report_file.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True, indent=2))
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
