from pathlib import Path
import hashlib
import json
import socket
import subprocess
import time
import urllib.request

from playwright.sync_api import sync_playwright


root = Path(__file__).resolve().parents[1]
output = root / 'docs' / 'verification' / 'URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY'
output.mkdir(parents=True, exist_ok=True)
report_path = output / 'large-world-pbr-material-diversity-webgpu-report.json'
report = json.loads(report_path.read_text(encoding='utf-8'))


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
    fixture_url = base + '/docs/verification/URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY/large-world-pbr-material-diversity-webgpu.html'
    for _ in range(80):
        try:
            with urllib.request.urlopen(fixture_url, timeout=2) as response:
                if response.status == 200:
                    break
        except Exception:
            time.sleep(0.12)
    else:
        raise RuntimeError('static evidence server did not serve the PBR WebGPU fixture')

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
            "window.__URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY_WEBGPU__ && window.__URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY_WEBGPU__.status !== 'PROBE_ONLY'",
            timeout=30000,
        )
        state = page.evaluate('window.__URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY_WEBGPU__')
        if state.get('status') != 'EXECUTED':
            raise RuntimeError(json.dumps(state, ensure_ascii=False))
        receipt = state.get('receipt') or {}
        assert state.get('capability', {}).get('available') is True, state
        assert receipt.get('submitted') is True, receipt
        assert receipt.get('deviceLost') is False, receipt
        assert receipt.get('frameRoot') == report['frame_root'], (receipt, report['frame_root'])
        assert state.get('sourceRealityRoot') == report['contact_source_reality_root'], (state, report['contact_source_reality_root'])
        assert receipt.get('materialTextureBindings', 0) >= report['material_texture_bindings'], receipt
        assert receipt.get('textureUploads', 0) >= report['texture_count'], receipt
        assert not page_errors, page_errors
        assert not failed_requests, failed_requests
        shader_messages = [
            message for message in console_messages
            if any(token in message['text'] for token in ('WGSL', 'Invalid Shader', 'Invalid Pipeline', 'Invalid CommandBuffer'))
        ]
        assert not shader_messages, shader_messages
        screenshot = output / 'large-world-pbr-material-diversity-webgpu-browser.png'
        page.locator('#gpu').screenshot(path=str(screenshot))
        assert screenshot.stat().st_size > 10000, screenshot
        browser_evidence = {
            'format': 'urrf.large-world-pbr-material-diversity-webgpu-browser-receipt.v0.1',
            'status': state['status'],
            'capability': state['capability'],
            'source_reality_root': state['sourceRealityRoot'],
            'frame_root': state['frameRoot'],
            'receipt': receipt,
            'receipt_frame_root_matches_cpu': receipt.get('frameRoot') == report['frame_root'],
            'png': 'large-world-pbr-material-diversity-webgpu-browser.png',
            'png_sha256': sha256(screenshot),
            'png_bytes': screenshot.stat().st_size,
            'page_errors': page_errors,
            'shader_messages': shader_messages,
            'failed_requests': failed_requests,
            'authority': {'candidate_only': True, 'authoritative': False, 'canonical_write_authorized': False},
            'notes': 'Actual local Chromium WebGPU execution of the same rooted multi-asset PBR contact scene. This is machine-local execution evidence, not target-device performance, physical VRAM residency, or AAA visual grading.'
        }
        (output / 'large-world-pbr-material-diversity-webgpu-browser-receipt.json').write_text(
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
