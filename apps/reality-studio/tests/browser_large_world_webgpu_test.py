from pathlib import Path
import hashlib
import json
import os
import shutil
import socket
import subprocess
import time
import urllib.request

from playwright.sync_api import sync_playwright


studio_root = Path(__file__).resolve().parents[1]
repo = studio_root.parents[1]
fixture_dir = repo / 'output' / 'large-world-webgpu'
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


def executable(name):
    return shutil.which(name) or name


def browser_path(playwright):
    configured = os.environ.get('RNCS_CHROME_PATH')
    candidates = [
        configured,
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        shutil.which('google-chrome'),
        shutil.which('chrome'),
        shutil.which('chromium'),
        shutil.which('chromium-browser'),
        playwright.chromium.executable_path,
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(Path(candidate))
    raise RuntimeError('RNCS_WEBGPU_BROWSER_NOT_FOUND')


subprocess.run(
    [executable('npm'), 'run', 'build', '--workspace', '@taowind/visual-state-runtime'],
    cwd=repo,
    check=True,
)
subprocess.run(
    [executable('node'), 'scripts/generate-large-world-webgpu-fixture.mjs', str(fixture_dir)],
    cwd=repo,
    check=True,
)

scene = json.loads((fixture_dir / 'scene.vsr3d.json').read_text(encoding='utf-8'))
options = json.loads((fixture_dir / 'options.json').read_text(encoding='utf-8'))
expected = json.loads((fixture_dir / 'expected.json').read_text(encoding='utf-8'))
assert expected['canonical_state_mutated'] is False, expected
assert expected['authority']['provider_can_write_authoritative_world_state'] is False, expected
assert expected['canonical_snapshot_stable_after_compile'] is True, expected
assert len(expected['active_chunk_ids']) == 9, expected

port = free_port()
base = f'http://127.0.0.1:{port}'
proc = subprocess.Popen(
    [executable('node'), 'src/cli.mjs', 'serve', '--port', str(port)],
    cwd=studio_root,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
)

try:
    health = None
    for _ in range(100):
        try:
            health = request(base, '/api/health')
            if health.get('spatial_editor') and health.get('vsr_version'):
                break
        except Exception:
            time.sleep(0.12)
    if not health or not health.get('spatial_editor'):
        raise RuntimeError('RNCS_WEBGPU_REALITY_STUDIO_NOT_READY')

    with sync_playwright() as playwright:
        executable_path = browser_path(playwright)
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=executable_path,
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

        capability = page.evaluate(
            """
            async () => {
              if (!navigator.gpu) return {available: false, reason: 'NAVIGATOR_GPU_UNAVAILABLE'};
              const adapter = await navigator.gpu.requestAdapter();
              if (!adapter) return {available: false, reason: 'GPU_ADAPTER_UNAVAILABLE'};
              const info = adapter.info ? {
                vendor: adapter.info.vendor || '',
                architecture: adapter.info.architecture || '',
                device: adapter.info.device || '',
                description: adapter.info.description || ''
              } : {};
              return {
                available: true,
                info,
                features: Array.from(adapter.features || []).sort(),
                limits: {
                  maxBufferSize: Number(adapter.limits?.maxBufferSize || 0),
                  maxTextureDimension2D: Number(adapter.limits?.maxTextureDimension2D || 0),
                  maxBindGroups: Number(adapter.limits?.maxBindGroups || 0)
                }
              };
            }
            """
        )
        if not capability.get('available'):
            raise RuntimeError(f"RNCS_WEBGPU_CAPABILITY_BLOCKED:{capability.get('reason')}")

        compiled = page.evaluate(
            """
            input => {
              const plan = window.VSRSpatial3D.compileSpatialFrame(input.scene, input.options);
              return {
                frameRoot: plan.frameRoot,
                commandRoot: plan.commandRoot,
                geometryRoot: plan.geometryRoot,
                materialRoot: plan.materialRoot,
                assetStreamingRoot: plan.assetStreaming?.root ?? null,
                stats: plan.stats
              };
            }
            """,
            {'scene': scene, 'options': options},
        )
        receipt = page.evaluate(
            """
            async input => {
              const api = window.VSRSpatial3D;
              const canvas = document.createElement('canvas');
              canvas.id = 'largeWorldWebGPUCanvas';
              canvas.width = input.options.width;
              canvas.height = input.options.height;
              canvas.style.width = '640px';
              canvas.style.height = '360px';
              document.body.append(canvas);
              const executor = await api.VSRSpatialWebGPUExecutor.create(canvas);
              const result = await executor.render(input.scene, input.options);
              const verified = typeof api.verifySpatialWebGPUReceipt === 'function'
                ? api.verifySpatialWebGPUReceipt(result)
                : null;
              executor.destroy();
              return {result, verified};
            }
            """,
            {'scene': scene, 'options': options},
        )
        render_receipt = receipt['result']
        receipt_verification = receipt['verified']
        screenshot = artifacts / 'RNCS_LARGE_WORLD_WEBGPU.png'
        page.locator('#largeWorldWebGPUCanvas').screenshot(path=str(screenshot))

        shader_messages = [
            message for message in console_messages
            if any(token in message['text'] for token in ('WGSL', 'Invalid Shader', 'Invalid Pipeline', 'Invalid CommandBuffer'))
        ]
        assert page_errors == [], page_errors
        assert shader_messages == [], shader_messages
        assert failed_requests == [], failed_requests
        assert compiled['frameRoot'] == expected['frame_root'], (compiled, expected)
        assert compiled['commandRoot'] == expected['command_root'], (compiled, expected)
        assert compiled['geometryRoot'] == expected['geometry_root'], (compiled, expected)
        assert compiled['materialRoot'] == expected['material_root'], (compiled, expected)
        assert compiled['assetStreamingRoot'] == expected['asset_streaming_root'], (compiled, expected)
        assert compiled['stats']['nodeCount'] == 9, compiled
        assert render_receipt['submitted'] is True, render_receipt
        assert render_receipt['deviceLost'] is False, render_receipt
        assert render_receipt['frameRoot'] == expected['frame_root'], (render_receipt, expected)
        assert render_receipt['drawCalls'] > 0, render_receipt
        assert render_receipt['triangles'] > 0, render_receipt
        if receipt_verification is not None:
            if isinstance(receipt_verification, dict):
                assert receipt_verification.get('ok', receipt_verification.get('valid', False)) is True, receipt_verification
            else:
                assert receipt_verification is True, receipt_verification
        assert screenshot.stat().st_size > 1000

        result = {
            'format': 'rncs.large-world-webgpu-browser-evidence.v0.1',
            'status': 'RNCS_LARGE_WORLD_WEBGPU_PROJECTION_PASS',
            'ready': True,
            'browser_executable': executable_path,
            'health': {
                'studio_version': health.get('studio_version'),
                'vsr_version': health.get('vsr_version')
            },
            'webgpu': capability,
            'world': {
                'world_id': expected['world_id'],
                'region_root': expected['region_root'],
                'world_root': expected['world_root'],
                'runtime_snapshot_root': expected['runtime_snapshot_root'],
                'active_chunk_ids': expected['active_chunk_ids'],
                'materialization_root': expected['materialization_root'],
                'canonical_state_mutated': expected['canonical_state_mutated'],
                'provider_can_write_authoritative_world_state': expected['authority']['provider_can_write_authoritative_world_state']
            },
            'compiled': compiled,
            'receipt': render_receipt,
            'receipt_verification': receipt_verification,
            'frame_root_matches': render_receipt['frameRoot'] == expected['frame_root'],
            'png': str(screenshot),
            'png_sha256': sha256(screenshot),
            'png_bytes': screenshot.stat().st_size,
            'page_errors': page_errors,
            'shader_messages': shader_messages,
            'failed_requests': failed_requests,
        }
        evidence_path = artifacts / 'RNCS_LARGE_WORLD_WEBGPU.json'
        evidence_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(result, ensure_ascii=False, indent=2))
        browser.close()
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=5)
