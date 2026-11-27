# Architecture Overview

Hill Pass Trail is a **zero-dependency native WebGL2** engine structured as **12 modular IIFE scripts** plus an HTML head/tail shell, deterministically bundled into a single offline `index.html` (~764 KB) by `scripts/build.py`.

## Module Load Order & `window.PV` Contract

All runtime modules attach to a single global namespace (`window.PV`) in strict topological order:

| Order | File | Lines | Shaders | Primary Responsibility & Key `window.PV` Exports |
| :---: | :--- | :---: | :---: | :--- |
| 0 | `src/shell_head.html` | 1,204 | 0 | DOM skeleton, custom geometric SVG emblem & icons (zero emoji), manga graph-paper settings UI, collision-free responsive HUD CSS |
| 1 | `src/glsl_common.js` | 718 | 0 | `M4` column-major math (Right-handed Y-Up, `+Z` forward), `mulberry32` PRNG, `WEATHER_PRESETS` (9), `TIME_PRESETS` (6), `FILTER_PRESETS` (6), `QUALITY_PRESETS` (4), `composeAtmosphere`, unified 6-speed sequential gearbox telemetry, `PBR_GLSL`, `createProgram`, `createMesh`, `createInstancedMesh` |
| 2 | `src/textures.js` | 1,202 | 0 | `PV.createTextures(gl)` — 21 procedural Canvas2D PBR/atlas/sprite textures + Sobel normal maps (`road`, `grass`, `rock`, `stoneMasonry`, `agedBrick`, `weatheredWood`, `birchBark`, `snowRock`, `flagstone`, `redClay`, `bambooAtlas`, `hydrangeaAtlas`, `pineAtlas`, `broadAtlas`, `farwoods`, `car`, `waterSplash`, `waterMist`, `waterRipple`, `mudClump`, `chevron`) |
| 3 | `src/frame_post.js` | 995 | 11 | `PV.FramePostRenderer` — 3 shadow passes (static, instanced, alpha-tested leaf canopy), `RGBA16F` + `DEPTH_COMPONENT24` HDR framebuffer, semantic Alpha routing, CAS sharpen, optional Kuwahara, 32+5 step SSR, hero-protected radial motion blur, crepuscular god-rays, tunnel eye adaptation, lens raindrops, 6 ACES filmic grades, pause bokeh |
| 4 | `src/sky_backdrop.js` | 548 | 8 | `PV.SkyBackdrop` — 360° seamless procedural mountain ranges & cloud sea (`vec2(cos(az), sin(az))` seam-free sampling) |
| 5 | `src/track_ground.js` | 3,253 | 6 | `PV.TrackGround`, `PV.THEMES` (7), `PV.TEMPLATES` (33), `PV.TRACK_CFG` — 6-segment ring-buffer streaming, ±155m grounded terrain skirts, 4 bridge types + 2 tunnel types, floating-origin recentering, `auditTopology()`, `runInvariants()` |
| 6 | `src/trees_foliage.js` | 2,900 | 8 | `PV.TreesFoliage` — 24 procedural `build*Geo` builders (spherical-lit leaf-card trees, bamboo, shrines/torii, stone lanterns, cabins, kilns, rally arches/flags/tents, bollards, guardrails, street lamps) rendered via hardware instancing |
| 7 | `src/blades_flowers.js` | 736 | 4 | `PV.BladesFlowers` — 6 procedural `build*Geo` builders for 4-ring car-following curved grass blades, ferns, and wildflower/hydrangea clusters |
| 8 | `src/cockpit_v4.js` | 1,582 | 4 | `PV.CockpitV4`, `PV.COCKPIT_V4_ALIGN` — 1st-person interior with roll cage, rotating steering wheel, live Canvas2D digital telemetry LCD, optical mirrors, and wiper geometry |
| 9 | `src/rallycar.js` | 1,404 | 4 | `PV.RallyCar` — `#22` widebody rally car continuous-surface geometry, 12-spoke alloy wheels, arcade-rally drift physics, suspension pitch/roll, nitro boost |
| 10 | `src/fx_rain.js` | 554 | 8 | `PV.RainFX` — 3D rain streaks, falling autumn leaves, tire puddle spray, and mud clump particles |
| 11 | `src/gameplay_mobile.js` | 420 | 0 | `PV.GameplayController` (Stage/Cruise modes, S–D ranks, apex/crest/splash/clean-sector events) & `PV.MobileTouchController` (multi-touch + auto-gas) |
| 12 | `src/hud_audio.js` | 2,808 | 0 | `PV.boot` main loop, `webglcontextlost/restored` recovery, WebAudio procedural boxer engine/turbo/rain/tunnel IR reverb, speed-adaptive pace notes, i18n (`en`/`zh`/`ja`), and `?debug=1 \|\| navigator.webdriver`-gated `window.__G` (43 methods) |
| 13 | `src/shell_tail.html` | 3 | 0 | Closing tags & bootstrap trigger |

## Render Pass Pipeline
1. **Shadow Pass** (`1024` / `1536` / `2048` / `4096` depth texture): Static meshes → Instanced props/trunks → Alpha-tested foliage canopy (`uLeafAtlas.g < 0.36` discard).
2. **Main HDR Pass** (`RGBA16F` + `DEPTH_COMPONENT24`, optional MSAA resolve): Sky backdrop → Track & terrain → Bridges/tunnels → Instanced foliage & roadside props → Car or Cockpit → Rain/spray FX (with `blendFuncSeparate(SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ZERO, ONE)` to preserve semantic Alpha).
3. **Bloom Pyramid Pass**: Bright-pass threshold + multi-mip downsample/upsample.
4. **Composite Post Pass**: CAS → optional Kuwahara → 32+5 step SSR → Hero-protected radial motion blur → Crepuscular god-rays → Tunnel eye adaptation glare → Lens smudges & refractive raindrops (with cockpit wiper dry-arc mask) → 6 ACES filmic color grades → Smooth power vignette → Pause bokeh.
