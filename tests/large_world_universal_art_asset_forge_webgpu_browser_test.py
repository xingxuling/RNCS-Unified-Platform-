from pathlib import Path
import hashlib
import json
import socket
import subprocess
import time
import urllib.request

from playwright.sync_api import sync_playwright


root = Path(__file__).resolve().parents[1]
evidence = root / 'docs' / 'verification' / 'URRF_UNIVERSAL_ART_ASSET_FORGE'
report = json.loads((evidence / 'universal-art-asset-vsr-webgpu-report.json').read_text(encoding='utf-8'))
fixture = evidence / 'universal-art-asset-vsr-webgpu.html'
playwright_output = root / 'output' / 'playwright'
playwright_output.mkdir(parents=True, exist_ok=True)
screenshot = playwright_output / 'urrf-universal-art-asset-vsr-webgpu.png'


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


port = free_port()
server = subprocess.Popen(
    ['python', '-m', 'http.server', str(port)],
    cwd=root,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
)

try:
    base = f'http://127.0.0.1:{port}'
    fixture_url = base + '/docs/verification/URRF_UNIVERSAL_ART_ASSET_FORGE/universal-art-asset-vsr-webgpu.html'
    for _ in range(80):
        try:
            with urllib.request.urlopen(fixture_url, timeout=2) as response:
                if response.status == 200:
                    break
        except Exception:
            time.sleep(0.12)
    else:
        raise RuntimeError('static evidence server did not serve the universal-art VSR WebGPU fixture')

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            args=['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-webgpu'],
        )
        page = browser.new_page(viewport={'width': 1280, 'height': 820}, device_scale_factor=1)
        page_errors = []
        console_messages = []
        failed_requests = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('console', lambda message: console_messages.append({'type': message.type, 'text': message.text}))
        page.on('requestfailed', lambda request: failed_requests.append({'url': request.url, 'failure': request.failure}))
        page.goto(fixture_url, wait_until='load')
        page.wait_for_function(
            "window.__URRF_UNIVERSAL_ART_ASSET_VSR_WEBGPU__ && window.__URRF_UNIVERSAL_ART_ASSET_VSR_WEBGPU__.status !== 'PROBE_ONLY'",
            timeout=30000,
        )
        state = page.evaluate('window.__URRF_UNIVERSAL_ART_ASSET_VSR_WEBGPU__')
        if state.get('status') != 'EXECUTED':
            raise RuntimeError('BLOCKED_BROWSER_WEBGPU_UNAVAILABLE_OR_FAILED: ' + json.dumps(state, ensure_ascii=False))
        receipt = state.get('receipt') or {}
        assert state.get('capability', {}).get('available') is True, state
        assert receipt.get('submitted') is True, receipt
        assert receipt.get('deviceLost') is False, receipt
        assert receipt.get('frameRoot') == report['frame_root'], (receipt, report['frame_root'])
        assert state.get('sourceRealityRoot') == report['source_reality_root'], (state, report['source_reality_root'])
        assert receipt.get('triangles', 0) == report['triangle_count'], receipt
        assert receipt.get('materialTextureBindings', 0) == report['material_texture_bindings'], receipt
        assert receipt.get('textureUploads', 0) >= report['texture_count'], receipt
        assert not page_errors, page_errors
        assert not failed_requests, failed_requests
        shader_messages = [
            message for message in console_messages
            if any(token in message['text'] for token in ('WGSL', 'Invalid Shader', 'Invalid Pipeline', 'Invalid CommandBuffer'))
        ]
        assert not shader_messages, shader_messages
        page.locator('#gpu').screenshot(path=str(screenshot))
        assert screenshot.stat().st_size > 10000, screenshot
        browser_evidence = {
            'format': 'urrf.universal-art-asset-vsr-webgpu-browser-receipt.v0.1',
            'version': '0.1.0',
            'status': state['status'],
            'capability': state['capability'],
            'source_reality_root': state['sourceRealityRoot'],
            'assembly_root': report['assembly_root'],
            'projection_root': report['projection_root'],
            'materialization_root': report['materialization_root'],
            'frame_root': state['frameRoot'],
            'cpu_frame_root': report['frame_root'],
            'receipt': receipt,
            'receipt_frame_root_matches_cpu': receipt.get('frameRoot') == report['frame_root'],
            'png': 'output/playwright/urrf-universal-art-asset-vsr-webgpu.png',
            'png_sha256': sha256(screenshot),
            'png_bytes': screenshot.stat().st_size,
            'page_errors': page_errors,
            'shader_messages': shader_messages,
            'failed_requests': failed_requests,
            'authority': {'candidate_only': True, 'authoritative': False, 'canonical_write_authorized': False},
            'notes': 'Actual local Chromium WebGPU execution of the dependency-complete universal art VSR aggregate scene. This is machine-local GPU execution evidence, not target-device performance, physical VRAM residency, or AAA visual grading.'
        }
        (evidence / 'universal-art-asset-vsr-webgpu-browser-receipt.json').write_text(
            json.dumps(browser_evidence, ensure_ascii=False, indent=2) + '\n',
            encoding='utf-8',
        )
        print(json.dumps(browser_evidence, ensure_ascii=False, indent=2))
        browser.close()
finally:
    server.terminate()
    try:
        server.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server.kill()
        server.wait(timeout=5)
