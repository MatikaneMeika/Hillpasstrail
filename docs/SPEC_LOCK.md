# SPEC_LOCK — Non-Negotiable Numeric & Shader Contracts

Any refactor, extension, or clean-room reproduction by a human or AI agent MUST preserve these verified contracts. Silent simplification below these floors is a regression.

## 1. Main Framebuffer (`RGBA16F`) Semantic Alpha Contract (`src/frame_post.js`)
Every main-pass fragment shader writes a semantic material ID into `gl_FragColor.a`. All translucent passes MUST use `gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE)` so Alpha semantics are never corrupted.

| `scene.a` Range | Material Class | Exact Post-Process Behavior |
| :--- | :--- | :--- |
| `a < 0.60` or `depth >= 0.9992` | Sky dome & 360° distant mountains | Exempt from CAS sharpening and Kuwahara (`isSkyOrMtn`); god-rays pass through; radial blur attenuated to `0.18x` |
| `0.622 < a < 0.715` | Wet road puddles | Triggers 32-step + 5-step binary-refined SSR (`linZ < 78.0m`); world outline ink attenuated by `1.0 - nearPuddle * 0.96` to eliminate gravel black-ring noise |
| `0.72 < a < 0.92` (written as `0.82`) | Hero car `#22` | Triggers dedicated `1.75px` crisp dark ink outline; **100% exempt from radial motion blur** (`carProtect = 0.0`, blur loop skips `0.72 < ss.a < 0.92`); reflected by near puddles (`linZ < 18.0m`) |
| `a = 1.0` | Terrain, trees, foliage, props, bridges, tunnels | Distance-faded world ink (`depthInk` + restricted `creaseInk`) with `snowPuddleSafe` and `roadZoneSafe` suppression masks |

## 2. Procedural PBR Texture Floors (`src/textures.js`)
- All 21 textures are generated offline-free on Canvas2D at boot using deterministic `mulberry32` PRNG and uploaded with mipmaps + `EXT_texture_filter_anisotropic` (up to `16x`).
- Road mud/aggregate, grass, rock, masonry, brick, wood, birch bark, snow rock, flagstone, and red clay all generate paired Albedo + Sobel Normal/Height maps (`buildSobelNormalWithHeight`).

## 3. Endless Streaming Topology & Floating-Origin Invariants (`src/track_ground.js`)
- Active ring buffer: `ACTIVE_SEGS = 6` segments; 33 templates across 7 themed biomes (`THEMES`).
- Lateral terrain cross-section extends to `±155m` with deep grounding skirts (`CROSS_LATS`) so cliff/valley edges never float.
- **Hard Automated Gates**:
  - `auditTopology(60)`: `selfIntersections === 0`, `maxSeamGap <= 0.005`, `backToBack === 0`.
  - `testOriginShift()`: `nanCount === 0`, `carModelDelta < 0.01` across floating-origin resets.
  - Multi-seed `runInvariants()`: `nanCount === 0`, `maxRoadProfileDelta <= 0.01m`, `carGroundDelta <= 0.05m`.

## 4. Quality Presets (`src/glsl_common.js`)
| Key | Label | DPR | Shadow Map | MSAA | SSR | Lens Quality | Grass Density | Fog Far |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `low` | `LOW` | 1.00 | 1024 | 0 | off | 1 | 0.55 | 580m |
| `med` | `MED` | 1.15 | 1536 | 2 | off | 1 | 0.80 | 680m |
| `high` | `ULTRA` | 1.50 | 2048 | 4 | on | 2 | 1.00 | 920m |
| `xultra` | `XULTRA` | 1.75 | 4096 | 4 | on | 3 | 1.00 | 980m |

## 5. Pace Notes & Spatial WebAudio Contract (`src/hud_audio.js`)
- Speed-adaptive lookahead: `lookMax = clamp(speedMs * leadSec + 32, 74, 245)`.
- Immediate silence on stop: when speed `< 4.5 m/s` or paused, call `speechSynthesis.cancel()` and hide pace banner.
- Cockpit view engages cabin low-pass filter; tunnel interiors engage procedural impulse-response (IR) reverb and attenuate exterior rain.
- `window.__G` is gated behind `?debug=1 || window.__HPT_DEBUG || navigator.webdriver` so normal players have a clean global scope while Playwright/QA retains full observability.
