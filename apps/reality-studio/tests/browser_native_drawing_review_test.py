from pathlib import Path
import base64
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
artifacts = repo_root / 'tmp' / 'playwright' / 'native-drawing-review'
artifacts.mkdir(parents=True, exist_ok=True)


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def browser_executable():
    configured = os.environ.get('CHROME_PATH')
    candidates = [
        configured,
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        shutil.which('google-chrome'),
        shutil.which('chromium'),
        shutil.which('chromium-browser'),
    ]
    return next((str(candidate) for candidate in candidates if candidate and Path(candidate).exists()), None)


def request_json(url):
    with urllib.request.urlopen(url, timeout=5) as response:
        return json.load(response)


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def make_bundle(root: Path, *, include_media=True, stale_review=False):
    if root.exists():
        shutil.rmtree(root)
    root.mkdir(parents=True)

    spatial = [
        ('head-surface-evidence.json', 'head_surface_evidence_root', 'spatial-head'),
        ('face-surface-evidence.json', 'face_surface_evidence_root', 'spatial-face'),
        ('hair-surface-evidence.json', 'hair_surface_evidence_root', 'spatial-hair'),
        ('garment-surface-evidence.json', 'garment_surface_evidence_root', 'spatial-garment'),
        ('cel-shading-evidence.json', 'cel_shading_evidence_root', 'spatial-cel'),
        ('mesh-silhouette-evidence.json', 'mesh_silhouette_evidence_root', 'spatial-mesh'),
    ]
    for filename, _, evidence_root in spatial:
        payload = {
            'status': 'passed',
            'human_visual_acceptance': 'pending',
            'evidence_root': evidence_root,
        }
        if filename == 'mesh-silhouette-evidence.json':
            payload['entries'] = [
                {
                    'view': 'front',
                    'pose': 'neutral',
                    'visible_groups': ['torso', 'neck', 'arm-left', 'hand-left', 'leg-left', 'foot-left'],
                    'occluded_groups': ['arm-right', 'hand-right', 'leg-right', 'foot-right'],
                    'missing_canonical_groups': [],
                    'extra_visible_part_count': 0,
                }
            ]
        write_json(root / filename, payload)

    direct_bridge = {
        'format': 'rncs.phase6-6-direct-visual-bridge.v0.4',
        'bridge_root': 'visual-bridge',
        'human_visual_acceptance': 'pending',
    }
    for _, root_field, evidence_root in spatial:
        direct_bridge[root_field] = evidence_root
    write_json(root / 'direct-visual-bridge.json', direct_bridge)

    temporal = {
        'status': 'passed',
        'human_visual_acceptance': 'pending',
        'evidence_root': 'temporal-evidence',
        'validation': {'valid': True, 'errors': []},
        'report': {
            'passed': True,
            'temporal_root': 'temporal-report',
            'failures': [],
            'summary': {
                'frame_count': 120,
                'adjacent_same_cut_pair_count': 117,
                'core_missing_count': 0,
                'core_topology_change_count': 0,
                'non_finite_geometry_count': 0,
                'max_core_normalized_displacement': 0.02,
                'p95_core_normalized_displacement': 0.018,
                'mean_operation_churn_ratio': 0.04,
                'p95_operation_churn_ratio': 0.05,
                'cel_path_churn_count': 2,
                'body_visibility_state_transition_count': 1,
                'thresholds': {
                    'max_core_normalized_displacement': 0.1,
                    'max_mean_operation_churn_ratio': 0.45,
                },
            },
        },
    }
    write_json(root / 'temporal-drawing-stability-evidence.json', temporal)
    write_json(root / 'temporal-evidence-bridge.json', {
        'bridge_root': 'temporal-bridge',
        'temporal_drawing_stability_evidence_root': 'temporal-evidence',
        'temporal_report_root': 'temporal-report',
    })

    ledger = {
        'ledger_root': 'ledger',
        'direct_visual_bridge_root': 'visual-bridge',
        'temporal_drawing_stability_evidence_root': 'temporal-evidence',
        'temporal_evidence_bridge_root': 'temporal-bridge',
    }
    for _, root_field, evidence_root in spatial:
        ledger[root_field] = evidence_root
    write_json(root / 'evidence-ledger.json', ledger)
    write_json(root / 'evidence-summary.json', {
        'ledger_root': 'ledger',
        'direct_visual_bridge_root': 'visual-bridge',
        'temporal_drawing_stability_evidence_root': 'temporal-evidence',
        'frame_count': 120,
        'fps': 24,
        'resolution': {'width': 1280, 'height': 720},
        'provider': 'rncs.native-fullbody-svg-librsvg.cpu',
        'human_visual_acceptance': 'pending',
    })
    write_json(root / 'phase-status.json', {
        'human_visual_acceptance': 'pending',
        'creative_production_review': 'pending-human-review',
        'commercial_anime_quality': 'not-proven',
    })
    write_json(root / 'frame-manifest.json', {
        'frame_count': 120,
        'fps': 24,
        'width': 1280,
        'height': 720,
        'provider_id': 'rncs.native-fullbody-svg-librsvg.cpu',
    })

    if stale_review:
        write_json(root / 'human-visual-review.json', {
            'format': 'rncs.human-visual-review.v0.1',
            'version': '0.1.0-alpha.1',
            'review_id': 'stale-review',
            'reviewer': 'human',
            'source': 'browser-test',
            'status': 'accepted',
            'severity': 'accepted',
            'observations': [],
            'engineering_snapshot': {
                'overall_status': 'ready-for-human-review',
                'spatial_status': 'pass',
                'temporal_status': 'pass',
                'integrity_valid': True,
                'media_present': True,
                'direct_visual_bridge_root': 'visual-bridge',
                'temporal_evidence_root': 'temporal-evidence',
                'ledger_root': 'old-ledger',
            },
            'automatic_selection': False,
            'automatic_commit': False,
            'episode_authority_unchanged': True,
        })

    # 1x1 transparent PNG is sufficient for preview wiring regression.
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
    static_dir = root / 'static-gates'
    static_dir.mkdir(parents=True, exist_ok=True)
    for name in ('front.png', 'three-quarter-right.png', 'side.png'):
        (static_dir / name).write_bytes(png)
    if include_media:
        # The Review Model only requires the media artifact to be present before Human Gate.
        # Playback validity belongs to Phase 6.6 media/ffprobe evidence, not this UI regression.
        (root / 'episode.mp4').write_bytes(b'phase66-browser-review-media-placeholder')


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
            if health:
                break
        except Exception:
            time.sleep(0.125)
    if not health:
        raise RuntimeError('Reality Studio server did not start')

    complete = artifacts / 'bundle-complete'
    media_missing = artifacts / 'bundle-media-missing'
    stale_root = artifacts / 'bundle-stale-review'
    supplemental = artifacts / 'supplemental'
    make_bundle(complete, include_media=True)
    make_bundle(media_missing, include_media=False)
    make_bundle(stale_root, include_media=True, stale_review=True)
    if supplemental.exists():
        shutil.rmtree(supplemental)
    supplemental.mkdir(parents=True)
    stale_review = supplemental / 'human-visual-review.json'
    shutil.copy2(stale_root / 'human-visual-review.json', stale_review)

    with sync_playwright() as playwright:
        launch = {'headless': True, 'args': ['--no-sandbox', '--disable-gpu-sandbox']}
        executable = browser_executable()
        if executable:
            launch['executable_path'] = executable
        browser = playwright.chromium.launch(**launch)
        page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
        page_errors = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.goto(base + '/native-drawing-review.html', wait_until='load')
        expect(page.locator('body')).to_contain_text('Native Drawing Review')

        # Directory load must replace the current bundle and reach the manual Human Gate.
        page.locator('#bundle').set_input_files(str(complete))
        expect(page.locator('#bundleStatus')).to_have_text('ready-for-human-review')
        expect(page.locator('#spatialStatus')).to_have_text('pass')
        expect(page.locator('#temporalStatus')).to_have_text('pass')
        expect(page.locator('#integrityStatus')).to_have_text('valid')
        expect(page.locator('#acceptBtn')).to_be_enabled()
        expect(page.locator('#visibility')).to_contain_text('arm-right')
        assert page.locator('.pill.occluded').count() >= 1

        # Static view switching must use the current bundle.
        page.get_by_role('button', name='3⁄4').click()
        expect(page.locator('#preview img')).to_be_visible()

        # Human review is export-only and remains bound to engineering roots.
        page.locator('#observations').fill('Browser regression review')
        page.get_by_role('button', name='Revision Requested').click()
        expect(page.locator('#humanStatus')).to_have_text('revision-requested')
        expect(page.locator('#exportReview')).to_be_enabled()
        with page.expect_download() as download_info:
            page.locator('#exportReview').click()
        download = download_info.value
        exported = artifacts / 'human-visual-review-export.json'
        download.save_as(exported)
        exported_review = json.loads(exported.read_text(encoding='utf-8'))
        assert exported_review['status'] == 'revision-requested'
        assert exported_review['automatic_selection'] is False
        assert exported_review['automatic_commit'] is False
        assert exported_review['episode_authority_unchanged'] is True
        assert exported_review['engineering_snapshot']['ledger_root'] == 'ledger'

        # Loading a new directory replaces prior media; old episode.mp4 must not survive.
        page.locator('#bundle').set_input_files(str(media_missing))
        expect(page.locator('#bundleStatus')).to_have_text('engineering-pass-media-missing')
        expect(page.locator('#acceptBtn')).to_be_disabled()
        expect(page.locator('#reasons')).to_contain_text('MEDIA:episode.mp4')

        # Supplemental stale acceptance is rejected by root binding instead of being reused.
        page.locator('#bundle').set_input_files(str(complete))
        expect(page.locator('#bundleStatus')).to_have_text('ready-for-human-review')
        page.locator('#extra').set_input_files(str(stale_review))
        expect(page.locator('#humanStatus')).to_have_text('pending')
        expect(page.locator('#reasons')).to_contain_text('HUMAN_REVIEW_LEDGER_ROOT_STALE')

        # Responsive layout smoke checks.
        for label, width, height in [('desktop', 1440, 900), ('mobile', 390, 844)]:
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_timeout(150)
            screenshot = artifacts / f'NATIVE_DRAWING_REVIEW_{label}.png'
            page.screenshot(path=str(screenshot), full_page=False)
            assert screenshot.stat().st_size > 5000
            assert page.evaluate('document.documentElement.scrollWidth') <= max(width + 2, page.evaluate('document.body.scrollWidth'))

        assert not page_errors, page_errors
        browser.close()
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
