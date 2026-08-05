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
transition_output = repo / 'packages' / 'integration' / 'aether-rncs-bridge' / 'outputs' / 'reality-cell-asset-transition-v01'
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


def load_state(prefix):
    directory = transition_output / prefix
    return {
        'scene': json.loads((directory / 'scene.vsr3d.json').read_text(encoding='utf-8')),
        'frame_plan': json.loads((directory / 'frame-plan.json').read_text(encoding='utf-8')),
        'cell_state': json.loads((directory / 'cell-state.json').read_text(encoding='utf-8')),
    }


near = load_state('near')
far = load_state('far')
near_again = load_state('near-again')
evidence = json.loads((transition_output / 'evidence.json').read_text(encoding='utf-8'))
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
        compiled = page.evaluate(
            """
            input => {
              const api = window.VSRSpatial3D;
              const compile = value => api.compileSpatialFrame(value.scene, {width: 320, height: 180, qualityTier: 'balanced', enableShadows: true, streaming: value.cell_state.vsr.options, assetStreaming: value.cell_state.assetStreaming, gpuTextureBudgetBytes: 4, gpuBufferBudgetBytes: 4});
              const nearPlan = compile(input.near);
              const farPlan = compile(input.far);
              const nearAgainPlan = compile(input.nearAgain);
              return {near: {frameRoot: nearPlan.frameRoot, assetStreamingRoot: nearPlan.assetStreaming?.root ?? null, stats: nearPlan.stats}, far: {frameRoot: farPlan.frameRoot, assetStreamingRoot: farPlan.assetStreaming?.root ?? null, stats: farPlan.stats}, nearAgain: {frameRoot: nearAgainPlan.frameRoot, assetStreamingRoot: nearAgainPlan.assetStreaming?.root ?? null, stats: nearAgainPlan.stats}};
            }
            """,
            {'near': near, 'far': far, 'nearAgain': near_again},
        )
        execution = page.evaluate(
            """
            async input => {
              const api = window.VSRSpatial3D;
              const canvas = document.createElement('canvas');
              canvas.id = 'realityCellAssetTransitionCanvas';
              canvas.width = 320;
              canvas.height = 180;
              canvas.style.width = '640px';
              canvas.style.height = '360px';
              document.body.append(canvas);
              const executor = await api.VSRSpatialWebGPUExecutor.create(canvas);
              const render = value => executor.render(value.scene, {width: 320, height: 180, qualityTier: 'balanced', enableShadows: true, streaming: value.cell_state.vsr.options, assetStreaming: value.cell_state.assetStreaming, gpuTextureBudgetBytes: 4, gpuBufferBudgetBytes: 4});
              const near = await render(input.near);
              const far = await render(input.far);
              const nearAgain = await render(input.nearAgain);
              executor.destroy();
              return {near, far, nearAgain};
            }
            """,
            {'near': near, 'far': far, 'nearAgain': near_again},
        )
        screenshot = artifacts / 'REALITY_STUDIO_REALITY_CELL_ASSET_TRANSITION_WEBGPU.png'
        page.locator('#realityCellAssetTransitionCanvas').screenshot(path=str(screenshot))
        shader_messages = [
            message for message in console_messages
            if any(token in message['text'] for token in ('WGSL', 'Invalid Shader', 'Invalid Pipeline', 'Invalid CommandBuffer'))
        ]
        assert page_errors == [], page_errors
        assert shader_messages == [], shader_messages
        assert failed_requests == [], failed_requests
        assert compiled['near']['frameRoot'] == near['frame_plan']['frameRoot'], compiled
        assert compiled['far']['frameRoot'] == far['frame_plan']['frameRoot'], compiled
        assert compiled['nearAgain']['frameRoot'] == near_again['frame_plan']['frameRoot'], compiled
        assert compiled['near']['assetStreamingRoot'] == near['cell_state']['assetStreaming']['root'], compiled
        assert compiled['far']['assetStreamingRoot'] == far['cell_state']['assetStreaming']['root'], compiled
        assert compiled['nearAgain']['assetStreamingRoot'] == near_again['cell_state']['assetStreaming']['root'], compiled
        assert near['frame_plan']['frameRoot'] != far['frame_plan']['frameRoot'], compiled
        for key in ('near', 'far', 'nearAgain'):
            assert execution[key]['submitted'] is True, execution[key]
            assert execution[key]['deviceLost'] is False, execution[key]
        assert execution['near']['frameRoot'] == near['frame_plan']['frameRoot'], execution
        assert execution['far']['frameRoot'] == far['frame_plan']['frameRoot'], execution
        assert execution['nearAgain']['frameRoot'] == near_again['frame_plan']['frameRoot'], execution
        assert execution['near']['textureUploads'] > 0, execution
        assert execution['far']['textureUploads'] > 0, execution
        assert execution['nearAgain']['textureUploads'] > 0, execution
        assert execution['far']['textureEvictions'] > 0, execution
        assert execution['far']['bufferEvictions'] > 0, execution
        assert execution['nearAgain']['textureEvictions'] > 0, execution
        assert execution['nearAgain']['bufferEvictions'] > 0, execution
        assert execution['nearAgain']['drawCalls'] >= evidence['counts']['nearDraws'], execution
        assert screenshot.stat().st_size > 1000
        result = {
            'format': 'reality-studio.browser-reality-cell-asset-transition-webgpu-test.v1.0',
            'ready': True,
            'health': {'studio_version': health.get('studio_version'), 'vsr_version': health.get('vsr_version')},
            'roots': evidence['roots'],
            'compiled': compiled,
            'receipts': execution,
            'transition_frame_roots_match': execution['near']['frameRoot'] == near['frame_plan']['frameRoot'] and execution['far']['frameRoot'] == far['frame_plan']['frameRoot'] and execution['nearAgain']['frameRoot'] == near_again['frame_plan']['frameRoot'],
            'png': str(screenshot),
            'png_sha256': sha256(screenshot),
            'png_bytes': screenshot.stat().st_size,
            'page_errors': page_errors,
            'shader_messages': shader_messages,
            'failed_requests': failed_requests,
        }
        (artifacts / 'REALITY_STUDIO_REALITY_CELL_ASSET_TRANSITION_WEBGPU.json').write_text(
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
