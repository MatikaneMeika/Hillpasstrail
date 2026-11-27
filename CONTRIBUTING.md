# Contributing to Hill Pass Trail

Thank you for contributing! Whether you are a human developer or collaborating with an AI coding agent, please follow these rules so the project stays zero-dependency, reproducible, and regression-free.

## Development Workflow
1. Edit modular source files under `src/` (never hand-edit `index.html`).
2. Rebuild the single-file bundle:
   ```bash
   python scripts/build.py
   ```
3. Run the full verification suite before opening a Pull Request:
   ```bash
   python scripts/build.py --check
   python scripts/check_hygiene.py
   python qa/verify_gates.py --html index.html
   ```

## Hard PR Gates
- **0 external runtime requests** (true offline single-file HTML).
- **0 console / page / WebGL errors** across all quality presets (`low`, `med`, `high`, `xultra`).
- **0 topology self-intersections & 0 seam gaps** across 60 streamed segments (`auditTopology(60)`).
- **0 NaN** across multi-seed invariants and floating-origin recentering (`testOriginShift()`).
- **0 hygiene violations** (no local paths, secrets, third-party trademarks, dead `build*Geo` builders, or CRLF drift).

Please read `AGENTS.md`, `docs/SPEC_LOCK.md`, and `docs/PITFALLS_FROM_GIT.md` before submitting visual or shader changes.
