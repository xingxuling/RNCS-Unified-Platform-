from pathlib import Path
import json
import os
import shutil
import socket
import subprocess
import time
import urllib.request

from playwright.sync_api import expect, sync_playwright
from PIL import Image


studio_root = Path(__file__).resolve().parents[1]
repo_root = studio_root.parents[1]
artifacts = repo_root / 'tmp' / 'playwright' / 'anime-forge-phase4'
evidence_dir = repo_root / 'evidence' / 'anime-forge-phase4-v0.1'
artifacts.mkdir(parents=True, exist_ok=True)
evidence_dir.mkdir(parents=True, exist_ok=True)


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def request_json(url):
    with urllib.request.urlopen(url, timeout=5) as response:
        return json.load(response)


def browser_executable():
    configured = os.environ.get('CHROME_PATH')
    candidates = [
        configured,
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        shutil.which('google-chrome'),
        shutil.which('chromium'),
        shutil.which('chromium-browser'),
    ]
    return next((str(candidate) for candidate in candidates if candidate and Path(candidate).exists()), None)


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
            if health.get('anime_forge_phase') == 'phase-4-media-closure-active':
                break
        except Exception:
            time.sleep(0.125)
    if not health or health.get('anime_forge_phase') != 'phase-4-media-closure-active':
        raise RuntimeError('Anime Forge Phase 4 server capability did not start')

    build_media = os.environ.get('ANIME_BROWSER_BUILD_MEDIA') == '1'
    with sync_playwright() as playwright:
        launch = {'headless': True, 'args': ['--no-sandbox', '--disable-gpu-sandbox']}
        executable = browser_executable()
        if executable:
            launch['executable_path'] = executable
        browser = playwright.chromium.launch(**launch)
        page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
        page_errors = []
        failed_requests = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('requestfailed', lambda req: failed_requests.append({'url': req.url, 'failure': req.failure}))
        page.goto(base + '/anime-forge.html', wait_until='load')
        expect(page.locator('#sourceState')).to_contain_text('Micro-Episode', timeout=30000)
        page.locator('#compileBtn').click()
        expect(page.locator('#cutSelect option')).to_have_count(3, timeout=30000)

        initial_summary = json.loads(page.locator('#summaryLog').text_content())
        production_root = initial_summary['production_root']
        page.locator('#cutSelect').select_option(index=1)
        selected_summary = initial_summary
        for _ in range(80):
            selected_summary = json.loads(page.locator('#summaryLog').text_content())
            if selected_summary.get('active_cut_ref') != initial_summary['active_cut_ref']:
                break
            page.wait_for_timeout(125)
        assert selected_summary['production_root'] == production_root, selected_summary
        assert selected_summary['active_cut_ref'] != initial_summary['active_cut_ref'], selected_summary

        if build_media:
            page.locator('#mediaBtn').click()
            expect(page.locator('#episodeStatus')).to_have_text('可播放', timeout=150000)
            page.wait_for_selector('#preview video', timeout=10000)
            video_metadata = page.locator('#preview video').evaluate(
                """video => new Promise((resolve, reject) => {
                    const done = () => resolve({duration: video.duration, width: video.videoWidth, height: video.videoHeight});
                    const fail = () => reject(new Error('VIDEO_METADATA_FAILED'));
                    video.addEventListener('error', fail, {once: true});
                    if (video.readyState >= 1) done();
                    else video.addEventListener('loadedmetadata', done, {once: true});
                })"""
            )
            assert 19.9 <= video_metadata['duration'] <= 20.1, video_metadata
            assert video_metadata['width'] == 960 and video_metadata['height'] == 540, video_metadata
            page.wait_for_timeout(350)
            assert page.locator('#failureStatus').text_content() == '无'
            assert page.locator('#evidenceLink').is_visible()

        def capture(label, width, height):
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_timeout(300)
            screenshot = artifacts / f'ANIME_FORGE_PHASE4_{label}.png'
            preview_screenshot = artifacts / f'ANIME_FORGE_PHASE4_{label}_preview.png'
            page.locator('#preview').screenshot(path=str(preview_screenshot))
            with Image.open(preview_screenshot).convert('RGB') as preview_image:
                non_background = sum(1 for red, green, blue in preview_image.get_flattened_data() if red > 30 or green > 34 or blue > 38)
            page.locator('.top').scroll_into_view_if_needed()
            page.wait_for_timeout(500)
            page.screenshot(path=str(screenshot), full_page=False)
            metrics = page.evaluate(
                """({width}) => {
                    const boxes = [...document.querySelectorAll('.quality-cell')].map(node => node.getBoundingClientRect());
                    const buttons = [...document.querySelectorAll('button')].map(node => ({id: node.id, fits: node.scrollWidth <= node.clientWidth + 1}));
                    return {
                        width,
                        body_scroll_width: document.body.scrollWidth,
                        document_scroll_width: document.documentElement.scrollWidth,
                        preview: (() => { const box = document.querySelector('#preview').getBoundingClientRect(); return {top: box.top, bottom: box.bottom, height: box.height}; })(),
                        video: (() => { const box = document.querySelector('#preview video').getBoundingClientRect(); return {top: box.top, bottom: box.bottom, width: box.width, height: box.height}; })(),
                        quality_boxes: boxes.map(box => ({left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height})),
                        buttons,
                    };
                }""",
                {'width': width},
            )
            metrics['screenshot'] = screenshot.relative_to(repo_root).as_posix()
            metrics['screenshot_bytes'] = screenshot.stat().st_size
            metrics['preview_non_background_pixels'] = non_background
            metrics['episode_status'] = page.locator('#episodeStatus').text_content()
            metrics['media_status'] = page.locator('#mediaStatus').text_content()
            metrics['failure_status'] = page.locator('#failureStatus').text_content()
            metrics['quality_text'] = page.locator('#qualityDetails').text_content()
            assert metrics['body_scroll_width'] <= width + 1, metrics
            assert metrics['document_scroll_width'] <= width + 1, metrics
            assert all(box['width'] > 0 and box['height'] > 0 for box in metrics['quality_boxes']), metrics
            assert metrics['preview']['top'] >= 0 and metrics['preview']['bottom'] <= height + 1, metrics
            assert metrics['video']['width'] > 0 and metrics['video']['height'] > 0, metrics
            assert all(button['fits'] for button in metrics['buttons']), metrics
            assert metrics['screenshot_bytes'] > 25000, metrics
            assert metrics['preview_non_background_pixels'] > 1000, metrics
            assert '二级运动' in metrics['quality_text'], metrics
            return metrics

        desktop = capture('desktop', 1440, 900)
        mobile = capture('mobile', 390, 844)
        assert not page_errors, page_errors
        assert not failed_requests, failed_requests
        browser.close()

    report = {
        'format': 'reality-studio.anime-forge-phase4-browser-evidence.v0.1',
        'ready': True,
        'route': '/anime-forge.html',
        'media_built': build_media,
        'production_root_preserved_across_cut_selection': True,
        'health': {
            'anime_forge_native': health['anime_forge_native'],
            'anime_forge_phase': health['anime_forge_phase'],
            'anime_forge_mp4': health['anime_forge_mp4'],
        },
        'viewports': {'desktop': desktop, 'mobile': mobile},
        'page_errors': page_errors,
        'failed_requests': failed_requests,
        'boundary': 'Local Chromium UI regression; not clean-machine or human art-direction acceptance.',
    }
    report_file = artifacts / 'browser-evidence.json'
    report_bytes = (json.dumps(report, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    report_file.write_bytes(report_bytes)
    (evidence_dir / 'studio-browser-evidence.json').write_bytes(report_bytes)
    shutil.copyfile(artifacts / 'ANIME_FORGE_PHASE4_desktop.png', evidence_dir / 'studio-anime-forge-desktop.png')
    shutil.copyfile(artifacts / 'ANIME_FORGE_PHASE4_mobile.png', evidence_dir / 'studio-anime-forge-mobile.png')
    print(json.dumps(report, ensure_ascii=True, indent=2))
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
