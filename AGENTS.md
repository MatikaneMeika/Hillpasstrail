# AGENTS.md — Hill Pass Trail Anti-Degradation & Reproduction Contract

This repository is engineered to be studied, extended, and reproduced by both human developers and AI Coding Agents without quality degradation, placeholder shortcuts, or silent regressions.

## 1. Non-Negotiable Architecture Rules
- **Zero External Dependencies**: Pure native WebGL2 (`GLSL ES 3.00`), Canvas2D procedural PBR textures, procedural 3D meshes, SVG UI icons, and WebAudio procedural sound synthesis. Never add Three.js, Babylon.js, external fonts, CDN scripts, or external image/audio URLs.
- **Single Source of Truth**: Edit ONLY files inside `src/`. Never hand-edit `index.html`. Always rebuild with `python scripts/build.py` (LF line endings) and verify determinism via `python scripts/build.py --check`.
- **Namespace & Coordinate System**: All 12 JS modules are IIFEs attached to `window.PV`, loaded in the exact order defined in `scripts/build.py`. Right-handed Y-Up (`+Z` forward), column-major `Float32Array(16)`.
- **Zero Silent Simplification**: Never substitute procedural lofted geometry, Sobel PBR textures, 32+5 step SSR, spherical-lit foliage, or instanced roadside ecosystems with placeholder boxes, flat colors, or reduced counts. Never weaken assertions in `qa/verify_gates.py`.
- **Privacy & Compliance**: Never commit personal paths, emails, API tokens, third-party trademarks, or reference media. Keep `python scripts/check_hygiene.py` green at all times.

## 2. Mandatory Verification Before Any Completion Claim
Every code or shader change MUST pass all 4 commands with exit code `0`:

```bash
node --check src/glsl_common.js src/textures.js src/frame_post.js src/sky_backdrop.js src/track_ground.js src/trees_foliage.js src/blades_flowers.js src/cockpit_v4.js src/rallycar.js src/fx_rain.js src/gameplay_mobile.js src/hud_audio.js
python scripts/build.py && python scripts/build.py --check
python scripts/check_hygiene.py
python qa/verify_gates.py --html index.html
```

> GPU-less CI runners use the same suite with `--software-gl --scene-quality med --boot-timeout 600`: SwiftShader needs a far wider first-render budget than a real GPU, and a single `high`/1280x720 frame there costs ~30s, so the 10 pixel-liveness scenes run at the `med` preset (local GPU runs stay at `high`; `results.sceneQuality` records which was used). Pixels come from an in-page `gl.readPixels` probe on the default framebuffer instead of `page.screenshot()`, because the headless-shell compositor can stall indefinitely while the render loop is paused. Thresholds and assertions are identical in both profiles — never lower them to make CI green.

## 3. Required Reading Before Modifying Subsystems
- **Architecture & `window.PV` contract**: `docs/ARCHITECTURE.md`
- **Hard numeric & shader contracts (Alpha channel, SSR, Ink, Topology, Textures)**: `docs/SPEC_LOCK.md`
- **Rebuilding from scratch via 7 gated vertical slices**: `docs/VERTICAL_SLICES.md`
- **12 historical visual/engineering anti-patterns to never reintroduce**: `docs/PITFALLS_FROM_GIT.md`
- **Automated testing & probe API (`window.__G`)**: `docs/TESTING_HOOKS.md`

## 4. Visual Verification Rule
When modifying rendering, shaders, geometry, lighting, or UI layout, run `python qa/verify_gates.py --html index.html --save-shots` and inspect the generated screenshots and contact sheet in `qa_out/` directly. Never claim visual quality from static code inspection alone.
