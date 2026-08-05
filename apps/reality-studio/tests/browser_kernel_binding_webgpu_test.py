from pathlib import Path
import hashlib
import json
import socket
import subprocess
import time
import urllib.request

from playwright.sync_api import sync_playwright


root = Path(__file__).resolve().parents[1]
repo = root.parents[1]
binding_output = repo / 'packages' / 'integration' / 'aether-rncs-bridge' / 'outputs' / 'kernel-rsr-vsr-binding'
artifacts = repo / 'output' / 'playwright'
artifacts.mkdir(parents=True, exist_ok=True)


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def request(base, path):
    with urllib.request.urlopen(base + path, timeout=5) as response:
        return json.load(response)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


scene = json.loads((binding_output / 'scene.vsr3d.json').read_text(encoding='utf-8'))
frame_plan = json.loads((binding_output / 'frame-plan.json').read_text(encoding='utf-8'))
evidence = json.loads((binding_output / 'evidence.json').read_text(encoding='utf-8'))
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
        page = browser.new_page(viewport={'width': 960, 'height': 720}, device_scale_factor=1)
        page_errors = []
        console_messages = []
        failed_requests = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('console', lambda message: console_messages.append({'type': message.type, 'text': message.text}))
        page.on('requestfailed', lambda request_value: failed_requests.append({'url': request_value.url, 'failure': request_value.failure}))
        page.goto(base + '/index.html', wait_until='load')
        page.wait_for_function('Boolean(window.VSRSpatial3D)', timeout=20000)
        receipt = page.evaluate(
            """
            async scene => {
              const api = window.VSRSpatial3D;
              const canvas = document.createElement('canvas');
              canvas.id = 'kernelBindingCanvas';
              canvas.width = 320;
              canvas.height = 180;
              canvas.style.width = '640px';
              canvas.style.height = '360px';
              document.body.append(canvas);
              const executor = await api.VSRSpatialWebGPUExecutor.create(canvas);
              const result = await executor.render(scene, {width: 320, height: 180, qualityTier: 'balanced', enableShadows: true});
              executor.destroy();
              return result;
            }
            """,
            scene,
        )
        screenshot = artifacts / 'REALITY_STUDIO_KERNEL_BINDING_WEBGPU.png'
        page.locator('#kernelBindingCanvas').screenshot(path=str(screenshot))
        shader_messages = [
            message for message in console_messages
            if any(token in message['text'] for token in ('WGSL', 'Invalid Shader', 'Invalid Pipeline', 'Invalid CommandBuffer'))
        ]
        assert page_errors == [], page_errors
        assert shader_messages == [], shader_messages
        assert failed_requests == [], failed_requests
        assert receipt['submitted'] is True, receipt
        assert receipt['deviceLost'] is False, receipt
        assert receipt['frameRoot'] == frame_plan['frameRoot'], (receipt, frame_plan['frameRoot'])
        assert receipt['drawCalls'] >= evidence['counts']['rsr_bodies']
        assert screenshot.stat().st_size > 1000
        result = {
            'format': 'reality-studio.browser-kernel-binding-webgpu-test.v1.0',
            'ready': True,
            'health': {'studio_version': health.get('studio_version'), 'vsr_version': health.get('vsr_version')},
            'source': evidence['source'],
            'roots': evidence['roots'],
            'binding_root': evidence['binding_root'],
            'receipt': receipt,
            'scene_frame_root_matches': receipt['frameRoot'] == frame_plan['frameRoot'],
            'png': str(screenshot),
            'png_sha256': sha256(screenshot),
            'png_bytes': screenshot.stat().st_size,
            'page_errors': page_errors,
            'shader_messages': shader_messages,
            'failed_requests': failed_requests,
        }
        (artifacts / 'REALITY_STUDIO_KERNEL_BINDING_WEBGPU.json').write_text(
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
