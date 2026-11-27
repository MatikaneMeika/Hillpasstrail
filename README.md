# Hill Pass Trail

[简体中文](./README.zh-CN.md)

A zero-dependency, single-file (**~764 KB**) **native WebGL2** endless rainy mountain rally game that runs directly in any modern desktop or mobile browser — no Three.js, no Unity, no external assets, and no bundler required to play.

## Highlights
- **Pure Native WebGL2 Engine (`12` IIFE modules → `1` offline `index.html`)**: 18,327 lines of modular source compiled by a 0-dependency Python bundler into a deterministic LF-normalized single HTML file (`0` external HTTP requests).
- **Stylized-PBR Hybrid Pipeline**: 4K soft directional shadows, `RGBA16F` HDR framebuffer with semantic Alpha-channel routing (hero-car 1.75px ink & motion-blur protection, 32+5 step wet-road puddle SSR, sky exemption), optional depth-adaptive Kuwahara filter, 36-tap crepuscular god-rays, tunnel eye adaptation, refractive lens raindrops, and 6 ACES filmic color grades.
- **Endless Procedural Mountain World**: 33 road templates across 7 biomes (Switchback Pass, Snow Peak, Lakeside Loop, Cloud Cliff, Golden Birch, Quarry Gorge, Bamboo Shrine), seamless bridges & tunnels, 6-segment ring-buffer streaming, and **floating-origin recentering** for infinite driving with sub-millimeter precision.
- **Procedural Audio, Pace Notes & Gameplay**: WebAudio boxer engine / turbo / gravel / rain / tunnel IR reverb synthesis, speed-adaptive rally co-driver pace notes (auto-silencing when stopped), Stage/Cruise scoring & ranks, full 1st-person cockpit view, and responsive manga-grid UI (`English`, `简体中文`, `日本語`) with multi-touch mobile controls.
- **Agent-Reproducible Engineering Package**: Ships with `AGENTS.md`, `docs/SPEC_LOCK.md`, `docs/VERTICAL_SLICES.md`, `docs/PITFALLS_FROM_GIT.md`, and a portable Playwright L1+L2 gate suite (`qa/verify_gates.py`) so anyone — or any AI coding agent — can study, verify, and reproduce the same engineering bar without degradation.

## Quick Start
1. Double-click `index.html` or deploy the repository root to GitHub Pages / Cloudflare Pages / Vercel.
2. Adjust graphics/audio presets on the manga graph-paper launch overlay and click **`START STAGE`** (`Enter` / `Esc`).

## Controls
| Key | Action |
| :--- | :--- |
| `W / A / S / D` or Arrow Keys | Drive / Steer |
| `Space` | Handbrake Drift |
| `Shift` | Nitro Boost |
| `V` | Toggle Camera (3rd-Person Chase / 1st-Person Cockpit) |
| `T` / `C` / `F` | Cycle Weather / Time of Day / Color Grade |
| `R` | Generate New Stage Seed |
| `M` | Toggle Audio Mute |
| `Esc` | Open / Close Settings Overlay |

## Build & Automated Verification
```bash
# 1. Syntax check all 12 source modules (Node.js)
node --check src/*.js

# 2. Deterministically build index.html from src/ and verify byte-for-byte match
python scripts/build.py
python scripts/build.py --check

# 3. Run privacy, trademark, URL, and dead-code hygiene gate
python scripts/check_hygiene.py

# 4. Run full headless WebGL2 L1+L2 Playwright verification suite
pip install -r qa/requirements.txt
playwright install chromium
python qa/verify_gates.py --html index.html --save-shots
```

## Documentation for Developers & AI Agents
- [`AGENTS.md`](./AGENTS.md) — Anti-degradation execution contract for AI coding agents
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Module dependency graph, `window.PV` exports, shader & texture index
- [`docs/SPEC_LOCK.md`](./docs/SPEC_LOCK.md) — Non-negotiable numeric & shader contracts (Alpha routing, SSR, Ink, Topology)
- [`docs/VERTICAL_SLICES.md`](./docs/VERTICAL_SLICES.md) — 7-slice step-by-step build & verification roadmap
- [`docs/PITFALLS_FROM_GIT.md`](./docs/PITFALLS_FROM_GIT.md) — 12 real visual/engineering anti-patterns and their verified fixes
- [`docs/TESTING_HOOKS.md`](./docs/TESTING_HOOKS.md) — `window.__G` 43-method automated probe reference

## Credits & Acknowledgments
- Stylized foliage, spherical leaf-card lighting, curved grass-blade LOD, and painterly post-processing concepts were inspired by open-source WebGL landscape experiments including [`lucienlmy/painted-valley`](https://github.com/lucienlmy/painted-valley).
- Standard published / public-domain graphics algorithms used: ACES Filmic Tone Mapping approximation (Krzysztof Narkowicz), Interleaved Gradient Noise (Jorge Jimenez), Mulberry32 PRNG, Kuwahara filter, and Poisson disk shadow sampling.

## License
Released under the [GNU Affero General Public License v3.0 (AGPL-3.0-or-later)](./LICENSE).
