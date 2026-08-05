from pathlib import Path
import json
import shutil
import socket
import subprocess
import time
import urllib.request

from playwright.sync_api import sync_playwright
from PIL import Image


root = Path(__file__).resolve().parents[1]
repo = root.parents[1]
artifacts = repo / 'tmp' / 'playwright' / 'character-genome'
artifacts.mkdir(parents=True, exist_ok=True)
evidence_dir = repo / 'evidence' / 'character-genome-forge-v0.1'
evidence_dir.mkdir(parents=True, exist_ok=True)


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def request(base, route):
    with urllib.request.urlopen(base + route, timeout=5) as response:
        return json.load(response)


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
    for _ in range(120):
        try:
            health = request(base, '/api/health')
            if health.get('character_genome_forge_native'):
                break
        except Exception:
            time.sleep(0.12)
    if not health or not health.get('character_genome_forge_native'):
        raise RuntimeError('Character Genome Forge server capability did not start')

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            args=['--no-sandbox', '--disable-gpu-sandbox'],
        )
        page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
        page_errors = []
        failed_requests = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('requestfailed', lambda req: failed_requests.append({'url': req.url, 'failure': req.failure}))
        page.goto(base + '/character-genome.html', wait_until='load')
        page.wait_for_selector('#statusText', timeout=30000)
        for _ in range(240):
            if 'candidate ready' in (page.locator('#statusText').text_content() or ''):
                break
            page.wait_for_timeout(125)
        else:
            raise RuntimeError(f"Character Genome UI did not settle: {page.locator('#statusText').text_content()}")
        page.wait_for_timeout(300)

        def capture(label, width, height):
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_timeout(250)
            screenshot = artifacts / f'CHARACTER_GENOME_{label}.png'
            canvas_screenshot = artifacts / f'CHARACTER_GENOME_{label}_canvas.png'
            right_screenshot = artifacts / f'CHARACTER_GENOME_{label}_evidence.png'
            page.screenshot(path=str(screenshot), full_page=True)
            page.locator('#mesh').screenshot(path=str(canvas_screenshot))
            with Image.open(canvas_screenshot).convert('RGB') as canvas_image:
                non_background = sum(
                    1 for red, green, blue in canvas_image.get_flattened_data()
                    if abs(red - 223) > 8 or abs(green - 230) > 8 or abs(blue - 233) > 8
                )
                canvas_width, canvas_height = canvas_image.size
            body = page.locator('body').bounding_box()
            right = page.locator('.right').bounding_box()
            viewport = page.locator('.viewport').bounding_box()
            metrics = {
                'body_width': body['width'],
                'viewport_width': width,
                'canvas_width': canvas_width,
                'canvas_height': canvas_height,
                'non_background_pixels': non_background,
                'right': right,
                'viewport': viewport,
                'validation': page.locator('#validation').text_content(),
                'evidence': page.locator('#evidence').text_content(),
            }
            page.locator('.right').screenshot(path=str(right_screenshot))
            metrics['screenshot'] = screenshot.relative_to(repo).as_posix()
            metrics['screenshot_bytes'] = screenshot.stat().st_size
            metrics['evidence_screenshot'] = right_screenshot.relative_to(repo).as_posix()
            metrics['evidence_screenshot_bytes'] = right_screenshot.stat().st_size
            assert metrics['body_width'] <= width + 1, metrics
            assert metrics['canvas_width'] > 0 and metrics['canvas_height'] > 0, metrics
            assert metrics['non_background_pixels'] > 1000, metrics
            assert metrics['right']['width'] > 250 and metrics['right']['height'] > 0, metrics
            assert 'PASS' in metrics['validation'], metrics
            assert 'Evidence' in metrics['evidence'], metrics
            assert metrics['screenshot_bytes'] > 20000, metrics
            assert metrics['evidence_screenshot_bytes'] > 5000, metrics
            page.locator('.top').scroll_into_view_if_needed()
            return metrics

        desktop = capture('desktop', 1440, 900)
        compact = capture('compact', 1024, 900)
        mobile = capture('mobile', 390, 844)
        assert not page_errors, page_errors
        assert not failed_requests, failed_requests
        browser.close()

    report = {
        'format': 'reality-studio.character-genome-browser-evidence.v0.1',
        'ready': True,
        'route': '/character-genome.html',
        'health': {
            'character_genome_forge_native': health['character_genome_forge_native'],
            'character_genome_version': health['character_genome_version'],
            'character_genome_reference_provider': health['character_genome_reference_provider'],
        },
        'viewports': {'desktop': desktop, 'compact': compact, 'mobile': mobile},
        'page_errors': page_errors,
        'failed_requests': failed_requests,
        'boundary': 'Local Chrome reference UI evidence; not clean-machine or human art acceptance.',
    }
    report_path = artifacts / 'browser-evidence.json'
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (evidence_dir / 'studio-browser-evidence.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    shutil.copyfile(artifacts / 'CHARACTER_GENOME_desktop.png', evidence_dir / 'studio-character-genome-desktop.png')
    shutil.copyfile(artifacts / 'CHARACTER_GENOME_mobile_canvas.png', evidence_dir / 'studio-character-genome-mobile-canvas.png')
    shutil.copyfile(artifacts / 'CHARACTER_GENOME_mobile_evidence.png', evidence_dir / 'studio-character-genome-mobile-evidence.png')
    print(json.dumps(report, ensure_ascii=False, indent=2))
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
