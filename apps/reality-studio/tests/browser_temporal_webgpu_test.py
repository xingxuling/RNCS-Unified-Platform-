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

        def render(label, expression):
            receipt = page.evaluate(expression)
            path = artifacts / f'REALITY_STUDIO_TEMPORAL_{label}.png'
            page.locator('#temporalProbeCanvas').screenshot(path=str(path))
            return {**receipt, 'png': str(path), 'png_sha256': sha256(path), 'png_bytes': path.stat().st_size}

        first = render('base', """
            async () => {
              const api = window.VSRSpatial3D;
              const canvas = document.createElement('canvas');
              canvas.id = 'temporalProbeCanvas';
              canvas.width = 160;
              canvas.height = 90;
              canvas.style.width = '640px';
              canvas.style.height = '360px';
              document.body.append(canvas);
              const executor = await api.VSRSpatialWebGPUExecutor.create(canvas);
              const scene = api.createSpatialShowcaseScene();
              scene.meshes = scene.meshes.map(mesh => ({...mesh, uvs1: mesh.uvs ? mesh.uvs.map((value, index) => index % 2 === 0 ? 0 : value) : undefined}));
              scene.textures = [
                {id: 'probe-base', width: 1, height: 1, pixels: [245, 158, 11, 255]}
              ];
              scene.materials[0] = {...scene.materials[0], baseColorTextureId: 'probe-base', alphaMode: 'BLEND', opacity: .9};
              scene.environment.probes = [
                {id: 'probe:left', position: [-2, 1, 0], radius: 5, diffuseColor: '#1d4ed8', specularColor: '#bfdbfe', intensity: 1.2},
                {id: 'probe:right', position: [2, 1, 0], radius: 5, diffuseColor: '#0f766e', specularColor: '#99f6e4', intensity: .8}
              ];
              const lightmapBake = api.bakeSpatialLightmap(scene, {width: 128, height: 128, padding: 1, maxTriangles: 4096});
              const lightmappedScene = api.applySpatialLightmapBake(scene, lightmapBake);
              const bake = api.bakeSpatialIrradianceProbes(lightmappedScene, {count: 4, idPrefix: 'browser'});
              const bakedScene = api.applySpatialIrradianceProbeBake(lightmappedScene, bake);
              const volumeBake = api.bakeSpatialIrradianceVolume(bakedScene, {dimensions: [4, 3, 4], visibilitySamples: 4, shadowBias: .01, updateAlpha: .35});
              const volumeScene = api.applySpatialIrradianceVolume(bakedScene, volumeBake);
              window.__temporalProbe = {api, executor, scene: volumeScene, volumeBake, options: {width: 160, height: 90, qualityTier: 'quality', enableShadows: true, shadowMapSize: 64, postProcess: {ssgiIntensity: .8, ssgiRadius: 4, ssgiSteps: 8, ssgiThickness: .15}}};
              return await executor.render(volumeScene, window.__temporalProbe.options);
            }
        """)
        second = render('history', """
            async () => {
              const probe = window.__temporalProbe;
              const historyScene = structuredClone(probe.scene);
              historyScene.materials[0] = {...historyScene.materials[0], baseColor: '#f97316'};
              probe.historyScene = historyScene;
              return await probe.executor.render(historyScene, probe.options);
            }
        """)
        blended = render('blended', """
            async () => {
              const probe = window.__temporalProbe;
              return await probe.executor.render(probe.scene, {...probe.options, postProcess: {...probe.options.postProcess, temporalBlend: .5}});
            }
        """)
        bright_blended = render('bright-blended', """
            async () => {
              const probe = window.__temporalProbe;
              const brightScene = structuredClone(probe.scene);
              brightScene.materials[0] = {...brightScene.materials[0], emissive: '#ffffff', emissiveStrength: 8};
              probe.brightScene = brightScene;
              return await probe.executor.render(brightScene, {...probe.options, postProcess: {...probe.options.postProcess, temporalBlend: .5}});
            }
        """)
        plain_temporal = render('plain-temporal', """
            async () => {
              const probe = window.__temporalProbe;
              return await probe.executor.render(probe.scene, {...probe.options, postProcess: {...probe.options.postProcess, temporalBlend: .5}});
            }
        """)
        authored_reactive = render('authored-reactive', """
            async () => {
              const probe = window.__temporalProbe;
              const authoredScene = structuredClone(probe.scene);
              authoredScene.textures = [...(authoredScene.textures ?? []), {id: 'probe-reactive', width: 1, height: 1, pixels: [255, 0, 0, 255]}];
              authoredScene.materials[0] = {...authoredScene.materials[0], reactiveMaskTextureId: 'probe-reactive'};
              probe.authoredScene = authoredScene;
              return await probe.executor.render(authoredScene, {...probe.options, postProcess: {...probe.options.postProcess, temporalBlend: .5}});
            }
        """)
        reactive = render('reactive', """
            async () => {
              const probe = window.__temporalProbe;
              return await probe.executor.render(probe.brightScene, {...probe.options, postProcess: {...probe.options.postProcess, temporalBlend: .5, temporalReactive: 1, temporalReactiveThreshold: 0}});
            }
        """)
        reset = render('reset', """
            async () => {
              const probe = window.__temporalProbe;
              return await probe.executor.render(probe.scene, {...probe.options, postProcess: {...probe.options.postProcess, temporalBlend: .5, temporalReset: true}});
            }
        """)
        dynamic = render('dynamic-light', """
            async () => {
              const probe = window.__temporalProbe;
              const changedScene = structuredClone(probe.scene);
              changedScene.lights = changedScene.lights.map((light, index) => index === 1 ? {...light, intensity: (light.intensity ?? 1) * 2.5} : light);
              const updatedVolume = probe.api.updateSpatialIrradianceVolume(changedScene, probe.volumeBake, {updateAlpha: 1});
              const updatedScene = probe.api.applySpatialIrradianceVolume(changedScene, updatedVolume);
              probe.updatedScene = updatedScene;
              return await probe.executor.render(updatedScene, probe.options);
            }
        """)
        multi_volume = render('multi-volume', """
            async () => {
              const probe = window.__temporalProbe;
              const fieldSource = structuredClone(probe.scene);
              delete fieldSource.environment.irradianceVolume;
              delete fieldSource.environment.irradianceVolumeBakeRoot;
              fieldSource.streaming = {worldId: 'world:spatial-showcase', cells: [
                {id: 'cell:left', center: [-2, 1, 0], radius: 4, nodeIds: fieldSource.nodes.map(node => node.id)},
                {id: 'cell:right', center: [2, 1, 0], radius: 4, nodeIds: fieldSource.nodes.map(node => node.id)}
              ]};
              const field = probe.api.bakeSpatialIrradianceVolumeField(fieldSource, {
                blendDistance: 1,
                maxSamples: 128,
                volumes: [
                  {id: 'left', cellId: 'cell:left', boundsMin: [-5, -1, -4], boundsMax: [0, 3, 3], dimensions: [3, 2, 3], visibilitySamples: 4, shadowBias: .01},
                  {id: 'right', cellId: 'cell:right', boundsMin: [0, -1, -4], boundsMax: [5, 3, 3], dimensions: [3, 2, 3], blendWeight: .55, visibilitySamples: 4, shadowBias: .01}
                ]
              });
              const fieldScene = probe.api.applySpatialIrradianceVolumeField(fieldSource, field);
              probe.field = field;
              probe.fieldScene = fieldScene;
              return await probe.executor.render(fieldScene, {...probe.options, streaming: {loadRadius: 0, unloadRadius: 0, forcedCellIds: ['cell:left', 'cell:right']}});
            }
        """)
        velocity_static = render('velocity-static', """
            async () => {
              const probe = window.__temporalProbe;
              const scene = structuredClone(probe.fieldScene ?? probe.scene);
              probe.velocityScene = scene;
              return await probe.executor.render(scene, {...probe.options, postProcess: {...probe.options.postProcess, temporalBlend: .5, temporalClamp: 0, temporalVelocityThreshold: .001, temporalVelocityDilation: 2}});
            }
        """)
        moving_velocity = render('moving-velocity', """
            async () => {
              const probe = window.__temporalProbe;
              const scene = structuredClone(probe.velocityScene);
              const movingId = scene.nodes.find(node => node.meshId)?.id;
              scene.nodes = scene.nodes.map(node => node.id === movingId ? {...node, transform: {...(node.transform ?? {}), translation: [(node.transform?.translation?.[0] ?? 0) + .65, node.transform?.translation?.[1] ?? 0, node.transform?.translation?.[2] ?? 0]}} : node);
              probe.movingVelocityScene = scene;
              return await probe.executor.render(scene, {...probe.options, postProcess: {...probe.options.postProcess, temporalBlend: .5, temporalClamp: 0, temporalVelocityThreshold: .001, temporalVelocityDilation: 2}});
            }
        """)
        residency = render('residency', """
            async () => {
              const probe = window.__temporalProbe;
              const scene = probe.api.createSpatialShowcaseScene();
              scene.meshes = scene.meshes.map(mesh => ({...mesh, id: `residency:${mesh.id}`}));
              scene.nodes = scene.nodes.map(node => ({...node,
                ...(node.meshId ? {meshId: `residency:${node.meshId}`} : {}),
                ...(node.lods ? {lods: node.lods.map(lod => ({...lod, meshId: `residency:${lod.meshId}`}))} : {})
              }));
              const receipt = await probe.executor.render(scene, {...probe.options, enableShadows: false, gpuTextureBudgetBytes: 4, gpuBufferBudgetBytes: 4});
              probe.executor.destroy();
              return receipt;
            }
        """)

        shader_messages = [
            message for message in console_messages
            if any(token in message['text'] for token in ('WGSL', 'Invalid Shader', 'Invalid Pipeline', 'Invalid CommandBuffer'))
        ]
        assert page_errors == [], page_errors
        assert shader_messages == [], shader_messages
        assert failed_requests == [], failed_requests
        assert first['submitted'] and second['submitted'] and blended['submitted'] and bright_blended['submitted'] and plain_temporal['submitted'] and authored_reactive['submitted'] and reactive['submitted'] and reset['submitted'] and dynamic['submitted'] and multi_volume['submitted'] and velocity_static['submitted'] and moving_velocity['submitted'] and residency['submitted']
        assert not first['deviceLost'] and not second['deviceLost'] and not blended['deviceLost'] and not bright_blended['deviceLost'] and not plain_temporal['deviceLost'] and not authored_reactive['deviceLost'] and not reactive['deviceLost'] and not reset['deviceLost'] and not dynamic['deviceLost'] and not multi_volume['deviceLost'] and not velocity_static['deviceLost'] and not moving_velocity['deviceLost'] and not residency['deviceLost']
        assert all(api_receipt for api_receipt in (first, second, blended, bright_blended, plain_temporal, authored_reactive, reactive, reset, dynamic, multi_volume, velocity_static, moving_velocity, residency))
        assert first['velocityPasses'] == 1 and second['velocityPasses'] == 1 and blended['velocityPasses'] == 1 and velocity_static['velocityPasses'] == 1 and moving_velocity['velocityPasses'] == 1
        assert first['oitPasses'] == 2 and second['oitPasses'] == 2 and blended['oitPasses'] == 2 and reset['oitPasses'] == 2
        assert first['transparentDraws'] >= 1, first
        assert second['transparentDraws'] == first['transparentDraws'] and blended['transparentDraws'] == first['transparentDraws'] and reset['transparentDraws'] == first['transparentDraws']
        assert first['ssgiPasses'] == 1 and second['ssgiPasses'] == 1 and blended['ssgiPasses'] == 1 and reset['ssgiPasses'] == 1
        assert first['materialTextureBindings'] >= 1, first
        assert first['irradianceCacheProbes'] == 4 and second['irradianceCacheProbes'] == 4 and blended['irradianceCacheProbes'] == 4 and reset['irradianceCacheProbes'] == 4 and residency.get('irradianceCacheProbes', 0) == 0
        assert first['irradianceVolumeSamples'] == 48 and second['irradianceVolumeSamples'] == 48 and blended['irradianceVolumeSamples'] == 48 and bright_blended['irradianceVolumeSamples'] == 48 and plain_temporal['irradianceVolumeSamples'] == 48 and authored_reactive['irradianceVolumeSamples'] == 48 and reactive['irradianceVolumeSamples'] == 48 and reset['irradianceVolumeSamples'] == 48 and dynamic['irradianceVolumeSamples'] == 48 and multi_volume['irradianceVolumeSamples'] == 36 and residency.get('irradianceVolumeSamples', 0) == 0
        assert authored_reactive['materialTextureBindings'] == first['materialTextureBindings'] + 1, authored_reactive
        assert authored_reactive['textureUploads'] >= 1, authored_reactive
        assert first['frameRoot'] != second['frameRoot']
        assert second['frameRoot'] != blended['frameRoot']
        assert bright_blended['frameRoot'] != reactive['frameRoot']
        assert plain_temporal['frameRoot'] != authored_reactive['frameRoot']
        assert blended['frameRoot'] != reset['frameRoot']
        assert dynamic['frameRoot'] != first['frameRoot']
        assert multi_volume['frameRoot'] != dynamic['frameRoot']
        assert velocity_static['frameRoot'] != moving_velocity['frameRoot']
        assert first['png_sha256'] != blended['png_sha256'], (first, blended)
        assert bright_blended['png_sha256'] != reactive['png_sha256'], (bright_blended, reactive)
        assert plain_temporal['png_sha256'] != authored_reactive['png_sha256'], (plain_temporal, authored_reactive)
        assert first['png_sha256'] == reset['png_sha256'], (first, reset)
        assert first['png_sha256'] != dynamic['png_sha256'], (first, dynamic)
        assert multi_volume['png_sha256'] != dynamic['png_sha256'], (multi_volume, dynamic)
        assert velocity_static['png_sha256'] != moving_velocity['png_sha256'], (velocity_static, moving_velocity)
        assert residency['textureEvictions'] > 0, residency
        assert residency['textureBytesResident'] > 4, residency

        result = {
            'format': 'reality-studio.browser-temporal-webgpu-test.v1.3',
            'ready': True,
            'server': base,
            'health': {'studio_version': health.get('studio_version'), 'vsr_version': health.get('vsr_version')},
            'bundle_loaded': page.evaluate('Boolean(window.VSRSpatial3D)'),
            'webgpu_available': page.evaluate('!!navigator.gpu'),
            'frames': {'base': first, 'history': second, 'blended': blended, 'bright_blended': bright_blended, 'plain_temporal': plain_temporal, 'authored_reactive': authored_reactive, 'reactive': reactive, 'reset': reset, 'dynamic_light': dynamic, 'multi_volume': multi_volume, 'velocity_static': velocity_static, 'moving_velocity': moving_velocity, 'residency': residency},
            'page_errors': page_errors,
            'shader_messages': shader_messages,
            'failed_requests': failed_requests,
        }
        (artifacts / 'REALITY_STUDIO_TEMPORAL_WEBGPU_TEST.json').write_text(
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
