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
hlod_output = repo / 'packages' / 'world' / 'visual-state-runtime' / 'outputs' / 'spatial-hlod-auto'
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


scene_near = json.loads((hlod_output / 'near-scene.vsr3d.json').read_text(encoding='utf-8'))
scene_far = json.loads((hlod_output / 'far-scene.vsr3d.json').read_text(encoding='utf-8'))
near_plan = json.loads((hlod_output / 'near-frame-plan.json').read_text(encoding='utf-8'))
far_plan = json.loads((hlod_output / 'far-frame-plan.json').read_text(encoding='utf-8'))
generation = json.loads((hlod_output / 'generation-report.json').read_text(encoding='utf-8'))
evidence = json.loads((hlod_output / 'evidence.json').read_text(encoding='utf-8'))
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
              const compile = scene => api.compileSpatialFrame(scene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
              const near = compile(input.near);
              const far = compile(input.far);
              return {
                near: {frameRoot: near.frameRoot, hlodRoot: near.hlod?.root ?? null, selectedLevel: near.hlod?.clusters[0]?.selectedLevel ?? null, drawNodeIds: near.drawPackets.map(packet => packet.nodeId), instanceNodeIds: near.drawPackets.flatMap(packet => packet.instances?.map(instance => instance.nodeId) ?? [])},
                far: {frameRoot: far.frameRoot, hlodRoot: far.hlod?.root ?? null, selectedLevel: far.hlod?.clusters[0]?.selectedLevel ?? null, drawNodeIds: far.drawPackets.map(packet => packet.nodeId), instanceNodeIds: far.drawPackets.flatMap(packet => packet.instances?.map(instance => instance.nodeId) ?? [])},
              };
            }
            """,
            {'near': scene_near, 'far': scene_far},
        )
        execution = page.evaluate(
            """
            async input => {
              const api = window.VSRSpatial3D;
              const canvas = document.createElement('canvas');
              canvas.id = 'hlodAutoCanvas';
              canvas.width = 320;
              canvas.height = 180;
              canvas.style.width = '640px';
              canvas.style.height = '360px';
              document.body.append(canvas);
              const executor = await api.VSRSpatialWebGPUExecutor.create(canvas);
              const near = await executor.render(input.near, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
              const far = await executor.render(input.far, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
              executor.destroy();
              return {near, far};
            }
            """,
            {'near': scene_near, 'far': scene_far},
        )
        screenshot = artifacts / 'REALITY_STUDIO_HLOD_AUTO_WEBGPU.png'
        page.locator('#hlodAutoCanvas').screenshot(path=str(screenshot))
        shader_messages = [
            message for message in console_messages
            if any(token in message['text'] for token in ('WGSL', 'Invalid Shader', 'Invalid Pipeline', 'Invalid CommandBuffer'))
        ]
        assert page_errors == [], page_errors
        assert shader_messages == [], shader_messages
        assert failed_requests == [], failed_requests
        assert compiled['near']['frameRoot'] == near_plan['frameRoot'], compiled
        assert compiled['far']['frameRoot'] == far_plan['frameRoot'], compiled
        assert compiled['near']['hlodRoot'] == near_plan['hlod']['root'], compiled
        assert compiled['far']['hlodRoot'] == far_plan['hlod']['root'], compiled
        assert compiled['near']['selectedLevel'] == 'source', compiled
        assert compiled['far']['selectedLevel'] == 0, compiled
        assert compiled['near']['instanceNodeIds'] == ['source:left', 'source:right'], compiled
        assert compiled['far']['drawNodeIds'] == [generation['levels'][0]['nodeId']], compiled
        for receipt, expected in ((execution['near'], near_plan), (execution['far'], far_plan)):
            assert receipt['submitted'] is True, receipt
            assert receipt['deviceLost'] is False, receipt
            assert receipt['frameRoot'] == expected['frameRoot'], (receipt, expected['frameRoot'])
        assert execution['near']['frameRoot'] != execution['far']['frameRoot']
        assert screenshot.stat().st_size > 1000
        result = {
            'format': 'reality-studio.browser-hlod-auto-webgpu-test.v1.0',
            'ready': True,
            'health': {'studio_version': health.get('studio_version'), 'vsr_version': health.get('vsr_version')},
            'roots': {'generationRoot': generation['root'], 'nearFrameRoot': near_plan['frameRoot'], 'farFrameRoot': far_plan['frameRoot'], 'nearHlodRoot': near_plan['hlod']['root'], 'farHlodRoot': far_plan['hlod']['root'], 'evidenceRoot': evidence['evidenceRoot']},
            'compiled': compiled,
            'receipts': execution,
            'automatic_generation_to_gpu': True,
            'png': str(screenshot),
            'png_sha256': sha256(screenshot),
            'png_bytes': screenshot.stat().st_size,
            'page_errors': page_errors,
            'shader_messages': shader_messages,
            'failed_requests': failed_requests,
        }
        (artifacts / 'REALITY_STUDIO_HLOD_AUTO_WEBGPU.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(result, ensure_ascii=False, indent=2))
        browser.close()
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=5)
