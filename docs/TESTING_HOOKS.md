# TESTING_HOOKS — `window.__G` Automated Probe Reference

To keep the production global scope clean, `window.__G` is exposed only when `?debug=1` is present in the URL, `window.__HPT_DEBUG` is truthy, or `navigator.webdriver` is true (Playwright / Puppeteer / Selenium).

## 43 Available Probe Methods (`src/hud_audio.js`)

| Category | Methods |
| :--- | :--- |
| **Telemetry & State** | `stats()`, `getGameplayState()`, `getAudioState()`, `getPaceNote()`, `getMobileState()`, `getLanguage()`, `getThemes()`, `getSegments()`, `isSettingsOpen()` |
| **Scene & Camera Control** | `setSeed(seed)`, `resetRandom()`, `setTheme(id, sOffset)`, `setSegment(templateName)`, `setPair(segA, segB, sOffset)`, `setCamMode('chase' \| 'cockpit')`, `setCamOrbit(yaw, dist, height)` |
| **Atmosphere & Graphics** | `setQuality('low' \| 'med' \| 'high' \| 'xultra')`, `setCustomGraphics(key, val)`, `setWeather(key)`, `setTime(key)`, `setFilter(key)`, `setKuwahara(bool)`, `setRain(val)`, `setEyeAdapt(val)`, `setShowFps(bool)` |
| **UI, Gameplay & Audio** | `openSettings()`, `closeSettings()`, `setLanguage('en' \| 'zh' \| 'ja')`, `setGameMode('stage' \| 'cruise')`, `setMobileMode(bool)`, `setMobileAutoGas(bool)`, `setAudioMuted(bool)`, `triggerDrift()`, `triggerPuddle()` |
| **Deterministic Stepping** | `pause()`, `setPaused(bool)`, `step(dt)`, `stepOnce(dt)`, `renderOnce()`, `benchPerf(frames)` |
| **Mathematical Invariant Gates** | `auditTopology(segCount)`, `runInvariants()`, `testOriginShift()` |

> **Note**: Active camera mode (`'chase'` vs `'cockpit'`) is reported under `window.__G.getAudioState().camMode`.
