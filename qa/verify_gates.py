#!/usr/bin/env python3
"""Portable headless WebGL2 L1+L2 verification suite for Hill Pass Trail."""
import argparse
import json
import os
import sys
import tempfile
import time
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# In-page pixel probe: read the default framebuffer, restore GL bindings, then summarise a
# 320x180 nearest-neighbour downsample (images are compared by luma statistics, so a full-size
# readback bridge payload is unnecessary).
PIXEL_PROBE_JS = """
() => {
  const canvas = document.querySelector('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) return null;
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const prevRead = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, prevRead);
  const TW = 320, TH = 180;
  let sumR = 0, sumG = 0, sumB = 0, sumL = 0, sumL2 = 0, black = 0;
  for (let y = 0; y < TH; y++) {
    const sy = Math.min(h - 1, Math.floor((TH - 1 - y) * h / TH));
    for (let x = 0; x < TW; x++) {
      const sx = Math.min(w - 1, Math.floor(x * w / TW));
      const i = (sy * w + sx) * 4;
      const r = buf[i], g = buf[i + 1], b = buf[i + 2];
      sumR += r; sumG += g; sumB += b;
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sumL += l; sumL2 += l * l;
      if (r === 0 && g === 0 && b === 0) black++;
    }
  }
  const n = TW * TH;
  const mean = sumL / n;
  const std = Math.sqrt(Math.max(0, sumL2 / n - mean * mean));
  return {
    rgb: [sumR / n, sumG / n, sumB / n].map(v => +v.toFixed(1)),
    lumaMean: +mean.toFixed(1),
    lumaStd: +std.toFixed(1),
    blackPct: +(100 * black / n).toFixed(2),
    buffer: [w, h],
  };
}
"""


def launch_browser(p, software_gl=False):
    if software_gl:
        args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
    elif sys.platform == 'win32':
        args = ['--use-gl=angle', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-gpu-sandbox']
    else:
        args = ['--enable-webgl', '--ignore-gpu-blocklist']

    channels = (None, 'chrome', 'msedge') if sys.platform != 'win32' else ('msedge', 'chrome', None)
    for ch in channels:
        try:
            kw = {'headless': True, 'args': args}
            if ch:
                kw['channel'] = ch
            return p.chromium.launch(**kw), (ch or 'chromium')
        except Exception:
            continue
    raise RuntimeError('No Chromium/Chrome/Edge browser available for Playwright.')


def run_gates(html_path, out_dir=None, save_shots=False, software_gl=False, boot_timeout=180, scene_quality='high'):
    html_abs = os.path.abspath(html_path)
    if not os.path.isfile(html_abs):
        raise FileNotFoundError(f'HTML bundle not found: {html_abs}')

    tmp_ctx = None
    if save_shots:
        shot_dir = os.path.abspath(out_dir or os.path.join(ROOT, 'qa_out'))
        os.makedirs(shot_dir, exist_ok=True)
    else:
        tmp_ctx = tempfile.TemporaryDirectory(prefix='hpt_qa_')
        shot_dir = tmp_ctx.name

    errors = []
    ext_requests = []
    failures = []
    results = {'html': html_abs}

    try:
        with sync_playwright() as p:
            browser, ch = launch_browser(p, software_gl=software_gl)
            results['browserChannel'] = ch
            page = browser.new_page(viewport={'width': 1280, 'height': 720})
            page.set_default_timeout(boot_timeout * 1000)
            page.on('pageerror', lambda e: errors.append(f'PAGEERROR: {e}'))
            page.on('console', lambda m: errors.append(f'CONSOLE_{m.type}: {m.text}') if m.type == 'error' else None)
            page.on(
                'request',
                lambda req: ext_requests.append(req.url)
                if not req.url.startswith(('file:', 'data:', 'blob:'))
                else None,
            )

            url = 'file:///' + html_abs.replace('\\', '/') + '?debug=1'
            t0 = time.perf_counter()
            page.goto(url, wait_until='domcontentloaded', timeout=boot_timeout * 1000)
            page.wait_for_function(
                '() => window.__G && window.__G.stats && window.__G.stats().frames > 1',
                timeout=boot_timeout * 1000,
            )
            results['bootMs'] = round((time.perf_counter() - t0) * 1000)
            results['externalRequests'] = ext_requests
            print(f'[boot] {results["bootMs"]}ms channel={ch}', flush=True)

            # Gate 1: Launch overlay + real DOM click START STAGE
            init_open = page.evaluate('() => window.__G.isSettingsOpen()')
            if init_open:
                btn = page.locator("#startBtn, #btnStart, .start-btn, button:has-text('START')").first
                if btn.count() > 0:
                    btn.click()
                    time.sleep(0.15)
            after_open = page.evaluate('() => window.__G.isSettingsOpen()')
            results['launchOverlay'] = {'initialOpen': init_open, 'afterStartOpen': after_open}
            if after_open:
                failures.append('START STAGE click did not close launch overlay')

            # Gate 2: Real keyboard driving + camera toggle + gameplay/audio wiring
            page.evaluate('() => { if (window.__G.isSettingsOpen()) window.__G.closeSettings(); window.__G.setPaused(false); }')
            s0 = page.evaluate('() => window.__G.stats().s')
            page.keyboard.down('KeyW')
            for _ in range(35):
                page.evaluate('() => { window.__G.stepOnce(0.033); }')
            page.keyboard.down('ShiftLeft')
            for _ in range(15):
                page.evaluate('() => { window.__G.stepOnce(0.033); }')
            page.keyboard.up('ShiftLeft')
            page.keyboard.down('KeyD')
            page.keyboard.down('Space')
            for _ in range(15):
                page.evaluate('() => { window.__G.stepOnce(0.033); }')
            page.keyboard.up('Space')
            page.keyboard.up('KeyD')
            page.keyboard.up('KeyW')

            drive = page.evaluate(
                '() => ({ s: window.__G.stats().s, gameplay: window.__G.getGameplayState(), '
                'pace: window.__G.getPaceNote(), audio: window.__G.getAudioState() })'
            )
            dist = round(drive['s'] - s0, 2)
            results['driveTest'] = {
                'distanceDrivenM': dist,
                'bestScore': drive['gameplay'].get('bestScore'),
                'eventsTriggered': drive['gameplay'].get('eventsTriggered'),
                'paceCall': drive['pace'].get('call'),
                'audioReady': drive['audio'].get('ready'),
                'rpm': drive['audio'].get('rpm'),
                'gear': drive['audio'].get('gear'),
            }
            if dist < 40.0:
                failures.append(f'Real keyboard drive moved only {dist}m (< 40m)')

            cam_before = page.evaluate('() => window.__G.getAudioState().camMode')
            page.keyboard.press('KeyV')
            page.evaluate('() => { window.__G.stepOnce(0.016); }')
            cam_after = page.evaluate('() => window.__G.getAudioState().camMode')
            page.keyboard.press('KeyV')
            page.evaluate('() => { window.__G.stepOnce(0.016); }')
            results['cameraKeyV'] = {'before': cam_before, 'after': cam_after}
            if cam_before == cam_after:
                failures.append(f'KeyV failed to toggle camera ({cam_before} -> {cam_after})')

            # Gate 3: 60-segment endless topology, floating-origin shift & 5-seed invariants
            page.evaluate('() => { window.__G.setPaused(true); }')
            topo = page.evaluate('() => window.__G.auditTopology(60)')
            results['topology60'] = topo
            if topo.get('selfIntersections', 1) != 0:
                failures.append(f"Topology selfIntersections={topo.get('selfIntersections')}")
            if topo.get('maxSeamGap', 1) > 0.005:
                failures.append(f"Topology maxSeamGap={topo.get('maxSeamGap')}")
            if topo.get('backToBack', 1) != 0:
                failures.append(f"Topology backToBack={topo.get('backToBack')}")

            origin = page.evaluate('() => window.__G.testOriginShift()')
            results['originShift'] = origin
            if origin.get('nanCount', 1) != 0 or origin.get('carModelDelta', 1) >= 0.01:
                failures.append(f'Origin shift failed: {origin}')

            seed_invs = []
            for sd in (1001, 2026, 7777, 99991, 202601):
                iv = page.evaluate(f'() => {{ window.__G.setSeed({sd}); window.__G.stepOnce(0.016); return window.__G.runInvariants(); }}')
                seed_invs.append({'seed': sd, **iv})
                if iv.get('nanCount', 1) != 0:
                    failures.append(f'Seed {sd} nanCount={iv.get("nanCount")}')
                if iv.get('maxRoadProfileDelta', 1) > 0.01:
                    failures.append(f'Seed {sd} maxRoadProfileDelta={iv.get("maxRoadProfileDelta")}')
                if iv.get('carGroundDelta', 1) > 0.05:
                    failures.append(f'Seed {sd} carGroundDelta={iv.get("carGroundDelta")}')
            results['seedInvariants'] = seed_invs

            # Gate 4: All 4 quality presets render with gl.getError() == 0
            qual_perf = {}
            for q in ('low', 'med', 'high', 'xultra'):
                qp = page.evaluate(f"""() => {{
                    window.__G.setQuality('{q}');
                    window.__G.setTheme(0, 72);
                    window.__G.setWeather('drizzle');
                    window.__G.setTime('morning');
                    window.__G.setCamMode('chase');
                    window.__G.stepOnce(0.016);
                    const t0 = performance.now();
                    for (let i = 0; i < 4; i++) window.__G.renderOnce();
                    const gl = document.querySelector('canvas').getContext('webgl2');
                    return {{ avgCpuMs: +((performance.now() - t0) / 4).toFixed(2), glErr: gl.getError() }};
                }}""")
                qual_perf[q] = qp
                if qp.get('glErr', -1) != 0:
                    failures.append(f'Quality {q} glErr={qp.get("glErr")}')
            results['qualityPerf'] = qual_perf

            # Gate 5: 10-scene pixel liveness (7 biomes + cockpit + tunnel + bridge)
            # Pixels are read straight from the default framebuffer instead of page.screenshot():
            # the headless-shell compositor can stall indefinitely when the render loop is paused,
            # while an in-page readPixels readback is deterministic, portable and ~100x cheaper.
            page.evaluate(f"() => {{ window.__G.setQuality('{scene_quality}'); }}")
            results['sceneQuality'] = scene_quality
            results['sceneCapture'] = 'gl-readpixels'
            print(f'[gate5] sceneQuality={scene_quality} capture=gl-readpixels', flush=True)
            scenes = [
                ('01_alpine',  "window.__G.setTheme(0, 72); window.__G.setWeather('drizzle'); window.__G.setTime('morning'); window.__G.setCamMode('chase');"),
                ('02_snow',    "window.__G.setTheme(1, 88); window.__G.setWeather('clear'); window.__G.setTime('morning'); window.__G.setCamMode('chase');"),
                ('03_lake',    "window.__G.setTheme(2, 74); window.__G.setWeather('dawn'); window.__G.setCamMode('chase');"),
                ('04_cliff',   "window.__G.setTheme(3, 85); window.__G.setWeather('downpour'); window.__G.setTime('bluehour'); window.__G.setCamMode('chase');"),
                ('05_birch',   "window.__G.setTheme(4, 90); window.__G.setWeather('goldmist'); window.__G.setCamMode('chase');"),
                ('06_quarry',  "window.__G.setTheme(5, 95); window.__G.setWeather('dusk'); window.__G.setCamMode('chase');"),
                ('07_shrine',  "window.__G.setTheme(6, 76); window.__G.setWeather('goldmist'); window.__G.setCamMode('chase');"),
                ('08_cockpit', "window.__G.setTheme(0, 72); window.__G.setWeather('drizzle'); window.__G.setCamMode('cockpit');"),
                ('09_tunnel',  "window.__G.setPair('gentle_curve', 'rock_tunnel', 268); window.__G.setCamMode('chase');"),
                ('10_bridge',  "window.__G.setPair('lake_overlook', 'arch_bridge', 212); window.__G.setCamMode('chase');"),
            ]
            pixel_report = []
            shot_paths = []
            for label, js in scenes:
                tr = time.perf_counter()
                st = page.evaluate(
                    f'() => {{ {js} window.__G.stepOnce(0.016); window.__G.renderOnce(); return ({PIXEL_PROBE_JS})(); }}'
                )
                tr = round((time.perf_counter() - tr) * 1000)
                if not st:
                    failures.append(f'Scene {label}: WebGL2 canvas unavailable for pixel probe')
                    continue
                print(
                    f'[gate5] {label} render+probe={tr}ms lumaMean={st["lumaMean"]} '
                    f'lumaStd={st["lumaStd"]} black={st["blackPct"]}%',
                    flush=True,
                )
                pixel_report.append({'scene': label, **st})
                if save_shots:
                    sp = os.path.join(shot_dir, f'{label}.png')
                    try:
                        page.screenshot(path=sp, type='png')
                        shot_paths.append((label, sp))
                    except Exception as exc:  # screenshots are for humans; never fail the gate on them
                        print(f'[gate5] {label} screenshot skipped: {exc}', flush=True)
                if not (25.0 <= st['lumaMean'] <= 230.0) or st['lumaStd'] < 18.0:
                    failures.append(f'Scene {label} failed pixel liveness: {st}')
            results['scenePixels'] = pixel_report

            if save_shots and shot_paths:
                cols, rows = 2, (len(shot_paths) + 1) // 2
                grid = Image.new('RGB', (cols * 640, rows * 360), (14, 16, 20))
                draw = ImageDraw.Draw(grid)
                for idx, (label, sp) in enumerate(shot_paths):
                    im = Image.open(sp).resize((640, 360), Image.LANCZOS)
                    gx, gy = (idx % cols) * 640, (idx // cols) * 360
                    grid.paste(im, (gx, gy))
                    draw.rectangle([gx + 6, gy + 6, gx + 170, gy + 28], fill=(0, 0, 0))
                    draw.text((gx + 12, gy + 11), label, fill=(255, 240, 180))
                atlas = os.path.join(shot_dir, 'contact_sheet.png')
                grid.save(atlas, 'PNG')
                results['contactSheet'] = atlas

            # Gate 6: Mobile responsive layout check (390x844)
            page.set_viewport_size({'width': 390, 'height': 844})
            mob = page.evaluate('() => { window.__G.setMobileMode(true); window.__G.stepOnce(0.016); window.__G.renderOnce(); return window.__G.getMobileState(); }')
            results['mobileState'] = mob
            if not mob.get('enabled'):
                failures.append('Mobile touch controller did not enable at 390x844')

            browser.close()
    finally:
        if tmp_ctx is not None:
            tmp_ctx.cleanup()

    if errors:
        failures.append(f'Runtime errors ({len(errors)}): {errors[:3]}')
    if ext_requests:
        failures.append(f'External network requests detected: {ext_requests[:3]}')

    results['errorCount'] = len(errors)
    results['failures'] = failures
    results['ok'] = len(failures) == 0
    print(json.dumps(results, indent=2, ensure_ascii=False))
    if failures:
        sys.exit(1)


def main():
    ap = argparse.ArgumentParser(description='Run Hill Pass Trail automated L1+L2 WebGL2 verification gates.')
    ap.add_argument('--html', default=os.path.join(ROOT, 'index.html'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'qa_out'))
    ap.add_argument('--save-shots', action='store_true', help='Save 10 scene PNGs and contact_sheet.png to --out.')
    ap.add_argument('--software-gl', action='store_true', help='Force SwiftShader software WebGL2 for headless Linux CI.')
    ap.add_argument(
        '--boot-timeout',
        type=int,
        default=180,
        help='Seconds allowed for first-render boot; SwiftShader CI runners need a wider budget than real GPUs.',
    )
    ap.add_argument(
        '--scene-quality',
        choices=('low', 'med', 'high', 'xultra'),
        default='high',
        help='Quality preset for the 10-scene pixel-liveness gate (CI software rasterizers use med).',
    )
    args = ap.parse_args()
    run_gates(
        args.html,
        out_dir=args.out,
        save_shots=args.save_shots,
        software_gl=args.software_gl,
        boot_timeout=args.boot_timeout,
        scene_quality=args.scene_quality,
    )


if __name__ == '__main__':
    main()
