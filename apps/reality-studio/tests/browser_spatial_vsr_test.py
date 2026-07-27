from pathlib import Path
import json
import socket
import subprocess
import time
import urllib.request

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
repo = root.parents[1]
artifacts = repo / 'output' / 'playwright'
artifacts.mkdir(parents=True, exist_ok=True)


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def request(base, path):
    with urllib.request.urlopen(base + path, timeout=5) as response:
        return json.load(response)


def screenshot_bytes(path):
    return path.stat().st_size


port = free_port()
base = f'http://127.0.0.1:{port}'
proc = subprocess.Popen(
    ['node', 'src/cli.mjs', 'serve', '--port', str(port)],
    cwd=root,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
)

try:
    health = None
    for _ in range(80):
        try:
            health = request(base, '/api/health')
            if health.get('spatial_editor') and health.get('vsr_version'):
                break
        except Exception:
            time.sleep(0.12)
    if not health or not health.get('spatial_editor'):
        raise RuntimeError('Reality Studio server did not expose spatial VSR capabilities')

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            args=['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-webgpu'],
        )
        page = browser.new_page(viewport={'width': 1600, 'height': 1000}, device_scale_factor=1)
        page_errors = []
        console_messages = []
        failed_requests = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('console', lambda message: console_messages.append({'type': message.type, 'text': message.text}))
        page.on('requestfailed', lambda request_value: failed_requests.append({'url': request_value.url, 'failure': request_value.failure}))

        page.goto(base + '/index.html', wait_until='load')
        page.wait_for_selector('#spatialViewTab', timeout=20000)
        page.wait_for_selector('#spatialPanel', state='attached', timeout=20000)
        page.click('#spatialViewTab')
        for _ in range(200):
            if page.locator('#spatialMode').inner_text() != 'RSR v0.5':
                break
            page.wait_for_timeout(100)
        else:
            raise RuntimeError('spatial VSR mode did not settle')
        page.wait_for_timeout(700)

        def capture(label):
            render_path = artifacts / f'REALITY_STUDIO_SPATIAL_VSR_{label}_render.png'
            gpu_visible = page.locator('#spatialGpuCanvas').is_visible()
            page.locator('#spatialGpuCanvas' if gpu_visible else '#spatialCanvas').screenshot(path=str(render_path))
            page.screenshot(path=str(artifacts / f'REALITY_STUDIO_SPATIAL_VSR_{label}.png'), full_page=True)
            return {
                'mode': page.locator('#spatialMode').inner_text(),
                'frame': page.locator('#spatialFrame').inner_text(),
                'bodies': page.locator('[data-spatial-body]').count(),
                'gpu_visible': gpu_visible,
                'render_screenshot_bytes': screenshot_bytes(render_path),
                'canvas_rect': page.locator('#spatialCanvas').bounding_box(),
                'watch': page.locator('#spatialWatch').inner_text(),
            }

        desktop = capture('desktop')
        assert desktop['mode'] in ('VSR WebGPU', 'VSR CPU预览'), desktop
        assert desktop['bodies'] >= 4, desktop
        assert desktop['canvas_rect']['width'] > 0 and desktop['canvas_rect']['height'] > 0, desktop
        assert desktop['render_screenshot_bytes'] > 10000, desktop
        assert 'Draw Calls' in desktop['watch'], desktop

        tick_before = page.locator('#spatialTick').inner_text()
        page.click('#spatialStepBtn')
        page.wait_for_timeout(250)
        tick_after = page.locator('#spatialTick').inner_text()
        assert tick_before != tick_after, (tick_before, tick_after)

        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(350)
        mobile = capture('mobile')
        assert mobile['bodies'] >= 4, mobile
        assert mobile['canvas_rect']['width'] > 0 and mobile['canvas_rect']['height'] > 0, mobile
        assert mobile['render_screenshot_bytes'] > 8000, mobile

        shader_messages = [
            message for message in console_messages
            if any(token in message['text'] for token in ('WGSL', 'Invalid Shader', 'Invalid Pipeline', 'Invalid CommandBuffer'))
        ]
        assert not page_errors, page_errors
        assert not shader_messages, shader_messages
        assert not failed_requests, failed_requests

        result = {
            'format': 'reality-studio.browser-spatial-vsr-test.v1.0',
            'ready': True,
            'server': base,
            'health': {'studio_version': health.get('studio_version'), 'vsr_version': health.get('vsr_version')},
            'bundle_loaded': page.evaluate('Boolean(window.VSRSpatial3D)'),
            'webgpu_available': page.evaluate('!!navigator.gpu'),
            'desktop': desktop,
            'mobile': mobile,
            'tick_before': tick_before,
            'tick_after': tick_after,
            'page_errors': page_errors,
            'shader_messages': shader_messages,
            'console_messages': console_messages,
            'failed_requests': failed_requests,
        }
        (artifacts / 'REALITY_STUDIO_SPATIAL_VSR_TEST.json').write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + '\n',
            encoding='utf-8',
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
        browser.close()
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=5)
