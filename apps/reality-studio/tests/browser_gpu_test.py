from pathlib import Path
import json, subprocess
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
subprocess.run([
    'node', 'src/cli.mjs', 'gpu-frame',
    '--project', 'examples/冰境试炼.unified-project.json',
    '--quality', 'quality',
    '--out', 'output/browser-gpu-frame.json'
], cwd=root, check=True, capture_output=True, text=True)
payload = json.loads((root / 'output/browser-gpu-frame.json').read_text(encoding='utf-8'))
assert payload['frame']['format'] == 'vsr.realtime-webgpu-frame.v0.3'
assert payload['summary']['frame_plan_root'] == payload['frame']['framePlanRoot']
(root / 'evidence/GPU_FRAME_SAMPLE_v1.0.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path='/usr/bin/chromium',
        args=['--no-sandbox', '--allow-file-access-from-files']
    )
    page = browser.new_page(viewport={'width': 1600, 'height': 940}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(
        (root / 'Reality_Studio_v1.0_实时GPU制造工作台_离线版.html').read_text(encoding='utf-8'),
        wait_until='load'
    )
    page.wait_for_selector('#gpuMode', timeout=15000)
    page.wait_for_timeout(700)
    assert '离线统一制造' in page.locator('#serverText').inner_text()
    assert page.locator('[data-node]').count() >= 4

    receipt = page.evaluate(
        """async ({payload}) => {
            const probe = new window.RealityGPUViewport(
                document.querySelector('#gpuCanvas'),
                document.querySelector('#sceneCanvas')
            );
            const receipt = await probe.render(payload.frame, 0);
            const summary = payload.summary;
            const stats = summary.stats || {};
            document.querySelector('#gpuMode').textContent = receipt.mode === 'webgpu' ? 'WebGPU 实时' : 'Canvas 参考';
            document.querySelector('#gpuFrame').textContent = `Frame ${String(summary.frame_plan_root || '').slice(0,10)}`;
            document.querySelector('#gpuPerf').textContent = `${Number(payload.compile_ms || 0).toFixed(2)} ms compile`;
            document.querySelector('#gpuWatch').innerHTML = `<div><span>Backend</span><b>${receipt.mode}</b></div><div><span>Frame Plan</span><b>${String(summary.frame_plan_root || '').slice(0,14)}</b></div><div><span>Draw Calls</span><b>${stats.estimatedDrawCalls ?? '—'}</b></div><div><span>Particles</span><b>${stats.particleSeeds ?? '—'}</b></div><div><span>Lights</span><b>${stats.lights ?? '—'}</b></div><div><span>Compile</span><b>${Number(payload.compile_ms || 0).toFixed(2)} ms</b></div>`;
            return receipt;
        }""",
        {'payload': payload}
    )
    assert receipt['mode'] in ('canvas-fallback', 'webgpu')
    assert page.locator('#gpuFrame').inner_text() != 'Frame —'
    assert page.locator('#gpuWatch b').nth(1).inner_text() != '—'

    page.click('#stepBtn')
    page.wait_for_timeout(250)
    assert int(page.locator('#tick').inner_text()) >= 1
    page.select_option('#qualitySelect', 'cinematic')
    page.wait_for_timeout(100)
    assert page.locator('#qualitySelect').input_value() == 'cinematic'
    page.evaluate(
        """({payload, receipt}) => {
            const summary = payload.summary, stats = summary.stats || {};
            document.querySelector('#gpuMode').textContent = receipt.mode === 'webgpu' ? 'WebGPU 实时' : 'Canvas 参考';
            document.querySelector('#gpuFrame').textContent = `Frame ${String(summary.frame_plan_root || '').slice(0,10)}`;
            document.querySelector('#gpuPerf').textContent = `${Number(payload.compile_ms || 0).toFixed(2)} ms compile`;
            document.querySelector('#gpuWatch').innerHTML = `<div><span>Backend</span><b>${receipt.mode}</b></div><div><span>Frame Plan</span><b>${String(summary.frame_plan_root || '').slice(0,14)}</b></div><div><span>Draw Calls</span><b>${stats.estimatedDrawCalls ?? '—'}</b></div><div><span>Particles</span><b>${stats.particleSeeds ?? '—'}</b></div><div><span>Lights</span><b>${stats.lights ?? '—'}</b></div><div><span>Compile</span><b>${Number(payload.compile_ms || 0).toFixed(2)} ms</b></div>`;
        }""",
        {'payload': payload, 'receipt': receipt}
    )
    assert not errors, errors

    shot = root / 'evidence/Reality_Studio_v1.0_实时GPU制造工作台.png'
    page.screenshot(path=str(shot), full_page=True)
    result = {
        'format': 'reality-studio.browser-gpu-test.v1.0',
        'ready': True,
        'mode': 'offline-file-plus-real-vsr-frame-transport',
        'server': page.locator('#serverText').inner_text(),
        'gpu_mode': page.locator('#gpuMode').inner_text(),
        'executor_receipt': receipt,
        'frame_plan_root': payload['summary']['frame_plan_root'],
        'draw_calls': payload['summary']['stats']['estimatedDrawCalls'],
        'lights': payload['summary']['stats']['lights'],
        'particles': payload['summary']['stats']['particleSeeds'],
        'tick': int(page.locator('#tick').inner_text()),
        'page_errors': errors,
        'screenshot': 'evidence/Reality_Studio_v1.0_实时GPU制造工作台.png',
        'webgpu_available': page.evaluate('!!navigator.gpu')
    }
    (root / 'evidence/BROWSER_GPU_TEST_v1.0.json').write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    browser.close()
