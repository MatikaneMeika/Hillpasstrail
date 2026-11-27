# PITFALLS_FROM_GIT — 12 Verified Anti-Patterns Never to Reintroduce

Every item below comes directly from real visual or engineering bugs caught and fixed during development of Hill Pass Trail. Treat this list as a mandatory regression checklist.

1. **Floating tunnel portals / terrain clipping through road**: Never build isolated tunnel arches without terrain skirts. Lateral terrain cross-sections (`CROSS_LATS`) must extend to `±155m` with deep grounding skirts.
2. **1st-person cockpit roof disappearing ("convertible bug") or jagged dash**: Keep `COCKPIT_V4_ALIGN` camera eye-point synchronized with `nearPlane = 0.25` and full roof/A-pillar enclosure geometry.
3. **Snow terrain stripes & black ink rings around snow puddles**: Avoid high-contrast regular sine stripes in snow normals; keep `snowPuddleSafe` active in `inkAt()` (`src/frame_post.js`).
4. **Hard black-rimmed "glass marble" lens droplets or bright white droplet rings**: Use organic multi-lobe SDF droplets with subtle refraction/caustics, and gate strictly by `activeRain` so dry sunny weather has zero water droplets.
5. **12-spoke alloy wheel dark/inverted shading**: Verify outward normals and CCW triangle winding when sweeping procedural wheel spokes in `src/rallycar.js`.
6. **Circular dome cutoff artifact on crepuscular god-rays**: Use smooth vertical + radial power falloff (`smoothstep(0.08, 0.62, vUv.y)`) instead of a hard radial radius cutoff.
7. **Cockpit wiper dry-arc bleeding outside the windshield**: Clip `cockpitDryMask` strictly to windshield UV bounds so wiper arcs never paint over the sky or dashboard.
8. **Hard circular vignette ring**: Use a continuous smooth power curve (`1.0 - pow(clamp(vigR * 1.12, 0.0, 1.0), 2.4) * 0.22`) instead of piecewise `smoothstep` knees.
9. **Blinding whiteout on tunnel exit**: Gate tunnel eye-adaptation glare (`uEyeGlare`) by linear depth (`smoothstep(12.0, 58.0, linZ)`) with asymmetric adaptation time constants.
10. **Black gravel speckle noise on dry road surfaces**: Suppress world crease ink on near-field road surfaces (`roadZoneSafe` & `nearPuddle`) so Cel outlines only accentuate crisp architectural/rock silhouettes.
11. **Stale pace notes spoken after stopping or lagging at 160 km/h**: Scale lookahead dynamically with speed and immediately call `speechSynthesis.cancel()` whenever speed `< 4.5 m/s` or paused.
12. **Long-distance floating-point vertex jitter & cross-platform CRLF build drift**: Periodically run floating-origin recentering (`testOriginShift()`) with `mod(z - uOriginS, 4096.0)` world-space noise anchoring, and always write `index.html` with `newline='\n'`.
