// === track_ground.js ===
// Fold-Free Continuous Road+Terrain Mesh, Stratified Wet Basalt Cliffs, Mountain-Embedded Tunnels,
// Material-Tagged Riveted Bridges & Diverse Endless Procedural Rally Stage Generator
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});

  const SEG_LEN = 120.0;
  const ROAD_SEG_LEN = 228.0;     // ~2x longer regular rally segments for flowing rhythm & pace-note buffer
  const SPECIAL_SEG_LEN = 120.0;  // Bridges & tunnels stay crisp 120m set-pieces
  const SAMPLES_PER_SEG = 34;
  const DS = 120.0 / 34.0;        // Constant ~3.53m longitudinal mesh spacing
  const ACTIVE_SEGS = 6;          // 6 x 228m = 1368m active sightline (longer horizon, fewer draw calls!)
  const ROAD_HALF_W = 5.6;

  // Curated Combinatorial Vegetation Presets (rolled per segment with biome weights)
  const VEG_PRESETS = {
    dense_canopy:    { key: 'dense_canopy',    treeStep: 4.0, treeSkip: 0.03, shrubMul: 1.38, flowerMul: 1.08, rockMul: 0.95, birchBias: 0.0,  broadBias: 0.0,  larchBias: 0.0,  sakuraBoost: false },
    open_meadow:     { key: 'open_meadow',     treeStep: 6.2, treeSkip: 0.18, shrubMul: 0.92, flowerMul: 1.75, rockMul: 0.88, birchBias: 0.15, broadBias: 0.15, larchBias: 0.0,  sakuraBoost: false },
    mixed_autumn:    { key: 'mixed_autumn',    treeStep: 4.6, treeSkip: 0.08, shrubMul: 1.12, flowerMul: 1.22, rockMul: 1.02, birchBias: 0.34, broadBias: 0.24, larchBias: 0.0,  sakuraBoost: false },
    rocky_alpine:    { key: 'rocky_alpine',    treeStep: 5.4, treeSkip: 0.14, shrubMul: 0.95, flowerMul: 0.72, rockMul: 1.85, birchBias: -0.1, broadBias: -0.1, larchBias: 0.34, sakuraBoost: false },
    blossom_grove:   { key: 'blossom_grove',   treeStep: 4.8, treeSkip: 0.10, shrubMul: 1.18, flowerMul: 1.50, rockMul: 0.85, birchBias: 0.12, broadBias: 0.18, larchBias: 0.0,  sakuraBoost: true  },
    windswept_ridge: { key: 'windswept_ridge', treeStep: 6.4, treeSkip: 0.22, shrubMul: 1.02, flowerMul: 0.85, rockMul: 1.62, birchBias: 0.0,  broadBias: -0.1, larchBias: 0.22, sakuraBoost: false },
  };

  // Curated Combinatorial Architecture & Roadside Prop Presets
  const ARCH_PRESETS = {
    hamlet_cluster:   { key: 'hamlet_cluster',   cabinCount: 2, stationCount: 0, kilnCount: 0, lanternMul: 0.0, flagMul: 1.0, tireMul: 1.0 },
    shrine_sanctuary: { key: 'shrine_sanctuary', cabinCount: 0, stationCount: 0, kilnCount: 0, lanternMul: 1.2, flagMul: 0.5, tireMul: 0.4 },
    lonely_outpost:   { key: 'lonely_outpost',   cabinCount: 1, stationCount: 1, kilnCount: 0, lanternMul: 0.0, flagMul: 0.7, tireMul: 0.6 },
    industrial_mill:  { key: 'industrial_mill',  cabinCount: 0, stationCount: 0, kilnCount: 2, lanternMul: 0.0, flagMul: 0.8, tireMul: 0.8 },
    rally_stage_pro:  { key: 'rally_stage_pro',  cabinCount: 0, stationCount: 0, kilnCount: 0, lanternMul: 0.0, flagMul: 1.6, tireMul: 1.4 },
    wild_untouched:   { key: 'wild_untouched',   cabinCount: 0, stationCount: 0, kilnCount: 0, lanternMul: 0.0, flagMul: 0.2, tireMul: 0.3 },
  };

  PV.TRACK_CFG = { SEG_LEN, ROAD_SEG_LEN, SPECIAL_SEG_LEN, SAMPLES_PER_SEG, DS, ACTIVE_SEGS, ROAD_HALF_W };

  const TEMPLATES = {
    // Theme 0: Switchback Pass (Steep climbs, descents, banked hairpins, crests)
    gentle_curve:      { name: 'ALPINE PASS',          curv: 0.0056, elev:  0.115, elevProfile: 'climb_steep',  bank: 0.07, wet: 0.48, sharp: false, hillMode: -1, surfMode: 0, sign: -1, biome: 0, themeId: 0 },
    hairpin:           { name: 'SWITCHBACK CLIMB',     curv: 0.0114, elev:  0.135, elevProfile: 'climb_steep',  bank: 0.12, wet: 0.50, sharp: true,  hillMode: -1, surfMode: 0, sign: -1, biome: 0, themeId: 0 },
    switchback_descent:{ name: 'SWITCHBACK PLUNGE',    curv: 0.0108, elev: -0.132, elevProfile: 'descent_fast', bank: 0.11, wet: 0.52, sharp: true,  hillMode:  1, surfMode: 0, sign:  1, biome: 0, themeId: 0 },
    hill_undulation:   { name: 'RIDGE CREST JUMP',     curv: 0.0048, elev:  0.148, elevProfile: 'crest_jump',   bank: 0.06, wet: 0.48, sharp: false, hillMode:  1, surfMode: 0, sign:  1, biome: 0, themeId: 0 },
    village_pass:      { name: 'PINE HAMLET',          curv: 0.0044, elev:  0.078, elevProfile: 'roller_waves', bank: 0.04, wet: 0.46, sharp: false, hillMode: -1, surfMode: 0, sign:  1, biome: 1, themeId: 0 },
    alpine_hamlet:     { name: 'TIMBER VILLAGE',       curv: 0.0046, elev: -0.082, elevProfile: 'descent_fast', bank: 0.05, wet: 0.46, sharp: false, hillMode: -1, surfMode: 0, sign:  1, biome: 1, themeId: 0 },
    flower_valley:     { name: 'WILDFLOWER GLEN',      curv: 0.0048, elev:  0.086, elevProfile: 'roller_waves', bank: 0.05, wet: 0.44, sharp: false, hillMode: -1, surfMode: 0, sign: -1, biome: 2, themeId: 0 },
    canyon_right:      { name: 'BASALT GORGE',         curv: 0.0076, elev:  0.120, elevProfile: 'climb_steep',  bank: 0.08, wet: 0.50, sharp: false, hillMode:  1, surfMode: 0, sign:  1, biome: 0, themeId: 0 },
    straight:          { name: 'VALLEY ROLLERS',       curv: 0.0014, elev:  0.110, elevProfile: 'roller_waves', bank: 0.01, wet: 0.46, sharp: false, hillMode: -1, surfMode: 0, sign:  1, biome: 2, themeId: 0 },

    // Theme 1: High-Altitude Mountain Peak / Ridge (Snow-dusted granite, talus scree, windbreaks, weather station)
    peak_climb:        { name: 'ALPINE PEAK ASCENT',   curv: 0.0072, elev:  0.152, elevProfile: 'climb_steep',  bank: 0.09, wet: 0.56, sharp: false, hillMode: -1, surfMode: 0, sign: -1, biome: 0, themeId: 1 },
    summit_crest:      { name: 'SUMMIT PASS CREST',    curv: 0.0058, elev:  0.158, elevProfile: 'crest_jump',   bank: 0.08, wet: 0.58, sharp: false, hillMode:  1, surfMode: 0, sign:  1, biome: 0, themeId: 1 },
    scree_descent:     { name: 'GLACIER SCREE DROP',   curv: 0.0082, elev: -0.146, elevProfile: 'descent_fast', bank: 0.10, wet: 0.60, sharp: true,  hillMode: -1, surfMode: 0, sign: -1, biome: 0, themeId: 1 },

    // Theme 2: Lakeside Island Loop (Animated 3D reflective lake, seawall boardwalk, mid-lake island & lighthouse, reeds)
    lake_overlook:     { name: 'LAKESIDE LOOP',        curv: 0.0056, elev:  0.016, elevProfile: 'flat_water',   bank: 0.04, wet: 0.52, sharp: false, hillMode: -1, surfMode: 0, sign:  1, biome: 1, themeId: 2 },
    lakeside_bay:      { name: 'ALPINE LAKESIDE BAY',  curv: 0.0068, elev:  0.014, elevProfile: 'flat_water',   bank: 0.05, wet: 0.56, sharp: false, hillMode: -1, surfMode: 0, sign: -1, biome: 1, themeId: 2 },
    water_crossing:    { name: 'LAKESIDE RIVER FORD',  curv: 0.0042, elev: -0.014, elevProfile: 'flat_water',   bank: 0.03, wet: 0.88, sharp: false, hillMode: -1, surfMode: 0, sign: -1, biome: 2, themeId: 2 },

    // Theme 3: Cliffside Cloud Edge (Sheer rock wall, deep abyss cloud-sea, cantilevered steel-cable guardrail)
    misty_cliffside:   { name: 'CLIFFSIDE CLOUD EDGE', curv: 0.0072, elev:  0.118, elevProfile: 'roller_waves', bank: 0.09, wet: 0.54, sharp: false, hillMode: -1, surfMode: 0, sign: -1, biome: 0, themeId: 3 },
    cliff_plunge:      { name: 'ABYSS CLIFF PLUNGE',   curv: 0.0078, elev: -0.150, elevProfile: 'descent_fast', bank: 0.10, wet: 0.56, sharp: true,  hillMode: -1, surfMode: 0, sign:  1, biome: 0, themeId: 3 },
    cliff_crest:       { name: 'SKYLINE LEDGE CREST',  curv: 0.0064, elev:  0.145, elevProfile: 'crest_jump',   bank: 0.08, wet: 0.52, sharp: false, hillMode:  1, surfMode: 0, sign: -1, biome: 0, themeId: 3 },

    // Theme 4: Golden Birch Forest / Valley (Peeling white birch, golden/lime canopies, fallen leaf road, creek crossing)
    autumn_birch:      { name: 'GOLDEN BIRCH VALLEY',  curv: 0.0076, elev:  0.095, elevProfile: 'roller_waves', bank: 0.07, wet: 0.52, sharp: false, hillMode:  2, surfMode: 0, sign: -1, biome: 3, themeId: 4 },
    forest_chicanes:   { name: 'BIRCH CREST CHICANE',  curv: 0.0082, elev:  0.132, elevProfile: 'crest_jump',   bank: 0.08, wet: 0.52, sharp: false, hillMode:  2, surfMode: 0, sign:  1, biome: 3, themeId: 4 },
    creek_crossing:    { name: 'BIRCH CREEK HOLLOW',   curv: 0.0054, elev: -0.088, elevProfile: 'descent_fast', bank: 0.05, wet: 0.82, sharp: false, hillMode:  1, surfMode: 0, sign:  1, biome: 3, themeId: 4 },

    // Theme 5: Red-Brick Quarry / Industrial Gorge (Terracotta clay mud, brick kilns, rusted steel mine gantry, floodlights)
    redbrick_village:  { name: 'BRICK KILN QUARRY',    curv: 0.0046, elev:  0.120, elevProfile: 'climb_steep',  bank: 0.06, wet: 0.54, sharp: false, hillMode:  2, surfMode: 0, sign: -1, biome: 1, themeId: 5 },
    quarry_gorge:      { name: 'IRON MILL GORGE',      curv: 0.0074, elev: -0.125, elevProfile: 'descent_fast', bank: 0.08, wet: 0.58, sharp: false, hillMode:  1, surfMode: 0, sign:  1, biome: 1, themeId: 5 },
    quarry_crest:      { name: 'QUARRY BENCH CREST',   curv: 0.0058, elev:  0.136, elevProfile: 'crest_jump',   bank: 0.07, wet: 0.54, sharp: false, hillMode:  2, surfMode: 0, sign: -1, biome: 1, themeId: 5 },

    // Theme 6: Bamboo / Misty Cedar Shrine Pass (Segmented emerald bamboo, vermilion Torii gates, stone lanterns, flagstone road)
    bamboo_climb:      { name: 'BAMBOO SHRINE PASS',   curv: 0.0068, elev:  0.122, elevProfile: 'climb_steep',  bank: 0.07, wet: 0.58, sharp: false, hillMode:  2, surfMode: 0, sign: -1, biome: 2, themeId: 6 },
    shrine_pass:       { name: 'MISTY CEDAR SHRINE',   curv: 0.0060, elev:  0.092, elevProfile: 'roller_waves', bank: 0.06, wet: 0.62, sharp: false, hillMode: -1, surfMode: 0, sign:  1, biome: 2, themeId: 6 },
    cedar_descent:     { name: 'TORII VALLEY DROP',    curv: 0.0076, elev: -0.118, elevProfile: 'descent_fast', bank: 0.08, wet: 0.60, sharp: false, hillMode:  2, surfMode: 0, sign: -1, biome: 2, themeId: 6 },

    // Iconic Special Set-Pieces (Bridges & Tunnels — smoothly leveled entry/exit!)
    timber_bridge:     { name: 'CREEK TRUSS BRIDGE',   curv: 0.0012, elev:  0.004, elevProfile: 'flat_water',   bank: 0.01, wet: 0.56, sharp: false, hillMode:  0, surfMode: 1, sign:  1, biome: 0, bridgeStyle: 'truss', themeId: 0 },
    arch_bridge:       { name: 'IRON ARCH BRIDGE',     curv: 0.0010, elev:  0.004, elevProfile: 'flat_water',   bank: 0.01, wet: 0.58, sharp: false, hillMode:  0, surfMode: 1, sign: -1, biome: 0, bridgeStyle: 'arch',  themeId: 1 },
    viaduct_gorge:     { name: 'QUARRY VIADUCT SPAN',  curv: 0.0014, elev:  0.005, elevProfile: 'flat_water',   bank: 0.01, wet: 0.56, sharp: false, hillMode:  0, surfMode: 1, sign:  1, biome: 1, bridgeStyle: 'arch',  themeId: 5 },
    stone_bridge:      { name: 'VALLEY ARCH BRIDGE',   curv: 0.0010, elev:  0.004, elevProfile: 'flat_water',   bank: 0.01, wet: 0.58, sharp: false, hillMode:  0, surfMode: 1, sign: -1, biome: 2, bridgeStyle: 'arch',  themeId: 4 },
    rock_tunnel:       { name: 'MOUNTAIN TUNNEL',      curv: 0.0014, elev:  0.005, elevProfile: 'flat_water',   bank: 0.01, wet: 0.34, sharp: false, hillMode:  2, surfMode: 2, sign: -1, biome: 0, themeId: 0 },
    cedar_tunnel:      { name: 'CEDAR PASS TUNNEL',    curv: 0.0018, elev:  0.006, elevProfile: 'flat_water',   bank: 0.01, wet: 0.38, sharp: false, hillMode:  2, surfMode: 2, sign:  1, biome: 3, themeId: 6 },
  };
  PV.TEMPLATES = TEMPLATES;

  // 7 Distinct Procedural Rally Themes (randomized order on every boot / R reset!)
  const THEMES = [
    { id: 0, key: 'switchback_pass', name: 'SWITCHBACK PASS',        biome: 0, pool: ['gentle_curve', 'village_pass', 'flower_valley', 'hairpin', 'switchback_descent', 'hill_undulation', 'alpine_hamlet'], special: 'rock_tunnel',   len: 7 },
    { id: 1, key: 'alpine_peak',     name: 'ALPINE PEAK RIDGE',      biome: 0, pool: ['peak_climb', 'summit_crest', 'scree_descent', 'gentle_curve', 'canyon_right'],                                         special: 'arch_bridge',   len: 6 },
    { id: 2, key: 'lakeside_loop',   name: 'ALPINE LAKESIDE LOOP',   biome: 1, pool: ['lake_overlook', 'lakeside_bay', 'water_crossing'],                                                                     special: 'stone_bridge',  len: 6 },
    { id: 3, key: 'cliffside_edge',  name: 'CLIFFSIDE CLOUD EDGE',   biome: 0, pool: ['misty_cliffside', 'cliff_plunge', 'cliff_crest', 'canyon_right'],                                                      special: 'rock_tunnel',   len: 6 },
    { id: 4, key: 'birch_valley',    name: 'GOLDEN BIRCH VALLEY',    biome: 3, pool: ['autumn_birch', 'forest_chicanes', 'creek_crossing', 'flower_valley', 'straight'],                                      special: 'timber_bridge', len: 7 },
    { id: 5, key: 'brick_quarry',    name: 'RED BRICK QUARRY GORGE', biome: 1, pool: ['redbrick_village', 'quarry_gorge', 'quarry_crest', 'alpine_hamlet'],                                                   special: 'viaduct_gorge', len: 6 },
    { id: 6, key: 'bamboo_shrine',   name: 'BAMBOO SHRINE PASS',     biome: 2, pool: ['bamboo_climb', 'shrine_pass', 'cedar_descent', 'flower_valley'],                                                       special: 'cedar_tunnel',  len: 7 },
  ];
  PV.THEMES = THEMES;



  // Extended lateral profile out to +-155m (outermost column forms a deep grounding skirt so NO floating hillside edge can EVER appear!)
  const CROSS_LATS = [
    -155.0, -110.0, -76.0, -54.0, -38.0, -26.0, -18.0, -12.6, -9.2, -7.2, -6.2,
    -5.6, -4.6, -3.5, -2.2, -1.1, 0.0, 1.1, 2.2, 3.5, 4.6, 5.6,
     6.2,  7.2,  9.2, 12.6, 18.0, 26.0, 38.0, 54.0, 76.0, 110.0, 155.0
  ];

  const mulberry32 = PV.mulberry32;

  PV.TrackGround = class TrackGround {
    constructor(gl, textures) {
      this.gl = gl;
      this.tex = textures;
      this.segments = [];
      this.nextSegId = 0;
      this.originOffset = [0, 0, 0];
      this.originResets = 0;
      this.forcedType = null;
      this.endPos = [0, 0, 0];
      this.endYaw = 0;
      this.endS = 0;
      this.rng = mulberry32(20261123);
      this.recentTypes = [];
      this.sinceSpecial = 0;
      this._frustum = new Float32Array(24); // 6 normalized frustum planes (zero per-frame alloc!)
      this._initShaders();
      this.reset();
    }

    _initShaders() {
      const gl = this.gl;

      this.unifiedProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aNrm;
        layout(location=2) in vec2 aUv;
        layout(location=3) in vec3 aAttr;
        uniform mat4 uViewProj;
        uniform vec3 uCamPos;
        uniform float uSurfMode;
        uniform float uTime;
        uniform float uSegSpawnTime;
        uniform float uSegSStart;
        out vec3 vWorldPos;
        out vec3 vNrm;
        out vec2 vUv;
        out vec3 vAttr;
        out float vSurfMode;
        void main() {
          float segAge = max(0.0, uTime - uSegSpawnTime);
          float tPop = clamp(segAge / 0.85, 0.0, 1.0);
          float easePop = 1.0 - pow(1.0 - tPop, 3.0);
          float seamSafe = smoothstep(0.0, 32.0, max(0.0, aAttr.z - uSegSStart));
          float farMask = smoothstep(155.0, 245.0, length(aPos - uCamPos));
          vec3 wp = aPos;
          wp.y -= (1.0 - easePop) * 12.0 * seamSafe * farMask;
          vWorldPos = wp; vNrm = aNrm; vUv = aUv; vAttr = aAttr; vSurfMode = uSurfMode;
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vNrm;
        in vec2 vUv;
        in vec3 vAttr;
        in float vSurfMode;
        uniform sampler2D uRoadAlb;
        uniform sampler2D uRoadNrm;
        uniform sampler2D uGrassAlb;
        uniform sampler2D uGrassNrm;
        uniform sampler2D uRockAlb;
        uniform sampler2D uRockNrm;
        uniform sampler2D uSnowRockAlb;
        uniform sampler2D uSnowRockNrm;
        uniform sampler2D uFlagstoneAlb;
        uniform sampler2D uFlagstoneNrm;
        uniform sampler2D uRedClayAlb;
        uniform sampler2D uRedClayNrm;
        uniform float uThemeId;
        uniform float uPrevThemeId;
        uniform float uSegSStart;
        uniform vec2 uOriginOffset;
        ${PV.PBR_GLSL}
        out vec4 fragColor;

        // Distance-Tiered 5x5 + 3x3 Expanding-Ring Ripple Normals (zero cell-border clipping, >60% ALU savings beyond 28m with zero visual loss!)
        vec3 rainRipples3Oct(vec2 wp, float t, float vDist) {
          float wetAmp = smoothstep(0.16, 0.84, uWetness);
          if (wetAmp < 0.02) return vec3(0.0);
          vec2 totN = vec2(0.0);
          float ringSparkle = 0.0;
          // Octave 0: 5x5 wide-radius macro puddle rings (near-field < 30m, smooth fade 22..30m)
          float nearFade = smoothstep(30.0, 21.0, vDist);
          if (nearFade > 0.02) {
            vec2 p = wp * 0.88;
            vec2 baseCell = floor(p);
            vec2 f = fract(p);
            for (int dy = -2; dy <= 2; dy++) {
              for (int dx = -2; dx <= 2; dx++) {
                vec2 cell = baseCell + vec2(float(dx), float(dy));
                float h = pvHash21(cell + 13.7);
                if (h < 0.36) continue;
                float ph = fract(t * (0.92 + h * 0.32) + h * 3.7);
                vec2 center = vec2(dx, dy) + 0.15 + 0.70 * vec2(pvHash21(cell + 3.1), pvHash21(cell + 9.7));
                vec2 d = f - center;
                float dist = length(d) + 1e-4;
                float ringR = ph * 1.48;
                float fade = (1.0 - ph) * (1.0 - ph) * smoothstep(0.0, 0.07, ph);
                float ring1 = exp(-pow((dist - ringR) / 0.048, 2.0)) * fade;
                float ring2 = exp(-pow((dist - ringR * 0.68) / 0.032, 2.0)) * fade * 0.56;
                float wave = sin((dist - ringR) * 42.0) * (ring1 + ring2);
                totN += (d / dist) * wave * 0.175 * nearFade;
                ringSparkle += (ring1 * 0.54 + ring2 * 0.24) * nearFade;
              }
            }
          }
          // Octave 1: 3x3 high-frequency fine capillary splash rings
          {
            vec2 p = wp * 2.25;
            vec2 baseCell = floor(p);
            vec2 f = fract(p);
            for (int dy = -1; dy <= 1; dy++) {
              for (int dx = -1; dx <= 1; dx++) {
                vec2 cell = baseCell + vec2(float(dx), float(dy));
                float h = pvHash21(cell + 51.3);
                float ph = fract(t * (1.42 + h * 0.36) + h * 5.1);
                vec2 center = vec2(dx, dy) + 0.18 + 0.64 * vec2(pvHash21(cell + 11.4), pvHash21(cell + 23.9));
                vec2 d = f - center;
                float dist = length(d) + 1e-4;
                float ringR = ph * 0.84;
                float fade = (1.0 - ph) * (1.0 - ph) * smoothstep(0.0, 0.08, ph);
                float ring1 = exp(-pow((dist - ringR) / 0.036, 2.0)) * fade;
                float wave = sin((dist - ringR) * 52.0) * ring1;
                totN += (d / dist) * wave * 0.105;
                ringSparkle += ring1 * 0.36;
              }
            }
          }
          return vec3(totN * wetAmp, clamp(ringSparkle * wetAmp, 0.0, 0.82));
        }

        void main() {
          vec3 V = normalize(uCamPos - vWorldPos);
          float viewDist = length(uCamPos - vWorldPos);
          vec3 baseN = normalize(vNrm);

          // === BRIDGE TIMBER SLEEPER DECK + BOLTED STEEL TREAD PLATES + MUD TIRE RUTS (1:1 matches 桥面.jpg!) ===
          if (vSurfMode > 0.5 && vSurfMode < 1.5 && vAttr.x <= 1.02) {
            float plankScale = 2.35;
            // 4-step Parallax Occlusion Mapping (POM) for real 3D sleeper gap depth!
            float pomZ = vAttr.z;
            float viewSlope = clamp(dot(V, vec3(0.0, 0.0, 1.0)) / max(V.y, 0.25), -2.2, 2.2);
            for (int pi = 0; pi < 4; pi++) {
              float pf = fract(pomZ * plankScale);
              float pGap = smoothstep(0.0, 0.095, pf) * smoothstep(1.0, 0.905, pf);
              pomZ -= viewSlope * (1.0 - pGap) * 0.018;
            }
            float plankId = floor(pomZ * plankScale);
            float plankF = fract(pomZ * plankScale);
            // Crisp shadowed crevices + sharp narrow plank edge bevels (FLAT weathered timber top, ZERO wavy plastic tubes!)
            float seam = smoothstep(0.0, 0.085, plankF) * smoothstep(1.0, 0.915, plankF);
            float edgeSlope = (1.0 - smoothstep(0.06, 0.15, plankF)) - (1.0 - smoothstep(0.85, 0.94, plankF));
            float plankHash = pvHash21(vec2(plankId, 1.3));
            float plankShift = pvHash21(vec2(plankId, 7.1));
            // High-frequency multi-octave wood fibers running along each sleeper + weathered splits & knots
            float fiberCoarse = pvFbm2(vec2(vUv.x * 26.0 + plankShift * 17.0, plankId * 5.3 + plankF * 4.5));
            float fiberFine = pvNoise2(vec2(vUv.x * 165.0 + plankShift * 9.0, plankId * 11.7 + plankF * 18.0));
            float grain = fiberCoarse * 0.58 + fiberFine * 0.42;
            float splitCrack = smoothstep(0.74, 0.90, pvNoise2(vec2(vUv.x * 22.0 + plankHash * 11.0, plankId * 3.1 + plankF * 2.0)));
            vec3 wood = mix(vec3(0.072, 0.044, 0.025), vec3(0.235, 0.152, 0.088), grain * 0.68 + plankHash * 0.32);
            wood *= (1.0 - splitCrack * 0.48);
            // Forged rusted iron bridge tie-bolts fastening sleepers near edges
            float tieX = min(abs(vUv.x - 0.11), abs(vUv.x - 0.89));
            float tieR = length(vec2(tieX * 14.0, (plankF - 0.5) * 1.6));
            float tieBolt = smoothstep(0.22, 0.12, tieR);
            wood = mix(wood, vec3(0.16, 0.09, 0.055), smoothstep(0.38, 0.18, tieR) * 0.55);
            wood = mix(wood, vec3(0.22, 0.24, 0.26), tieBolt * 0.88);
            // Damp moss & trapped wet grit inside timber sleeper gaps
            float seamMoss = (1.0 - seam) * smoothstep(0.46, 0.80, pvNoise2(vec2(vUv.x * 18.0, plankId * 0.9)));
            wood = mix(wood * (0.09 + 0.91 * seam), vec3(0.048, 0.140, 0.040), seamMoss * 0.82);
            // Heavy forged bolted steel tread-plates along wheel tracks (crisp raised iron slabs — NOT faint streaks!)
            float plateL = smoothstep(0.125, 0.114, abs(vUv.x - 0.27));
            float plateR = smoothstep(0.125, 0.114, abs(vUv.x - 0.73));
            float plateMask = clamp(plateL + plateR, 0.0, 1.0);
            float plateEdge = (smoothstep(0.128, 0.116, abs(vUv.x - 0.27)) - smoothstep(0.114, 0.104, abs(vUv.x - 0.27)))
                            + (smoothstep(0.128, 0.116, abs(vUv.x - 0.73)) - smoothstep(0.114, 0.104, abs(vUv.x - 0.73)));
            float plateSegF = fract(vAttr.z * 0.65);
            float plateJoint = smoothstep(0.0, 0.045, plateSegF) * smoothstep(1.0, 0.955, plateSegF);
            // Large 3D-shaded hex bolt heads with dark AO washer rings at plate corners
            float boltX = min(abs(vUv.x - 0.195), min(abs(vUv.x - 0.345), min(abs(vUv.x - 0.655), abs(vUv.x - 0.805))));
            float boltZ = min(abs(plateSegF - 0.15), abs(plateSegF - 0.85));
            float boltR = length(vec2(boltX * 11.0, boltZ * 4.2));
            float boltAO = smoothstep(0.24, 0.14, boltR) * plateMask;
            float boltHead = smoothstep(0.145, 0.085, boltR) * plateMask;
            float steelRust = smoothstep(0.48, 0.82, pvFbm2(vec2(vUv.x * 16.0, vAttr.z * 0.9)));
            float steelScratch = pvNoise2(vec2(vUv.x * 65.0, vAttr.z * 3.5));
            vec3 steelCol = mix(vec3(0.065, 0.078, 0.095), vec3(0.24, 0.115, 0.052), steelRust * 0.50);
            steelCol *= (0.76 + 0.32 * steelScratch) * (0.28 + 0.72 * plateJoint);
            steelCol = mix(steelCol, vec3(0.025, 0.030, 0.036), boltAO * 0.70);
            steelCol = mix(steelCol, vec3(0.32, 0.35, 0.38), boltHead * 0.90);
            wood = mix(wood, steelCol, plateMask * 0.96);
            wood *= (1.0 - clamp(plateEdge, 0.0, 1.0) * 0.52);
            // Crisp knobby wet mud tire tracks stamped across planks & inner plate edges
            float mudTrack = smoothstep(0.075, 0.015, abs(vUv.x - 0.38)) * 0.78
                           + smoothstep(0.075, 0.015, abs(vUv.x - 0.62)) * 0.78
                           + smoothstep(0.065, 0.020, abs(vUv.x - 0.50)) * 0.45;
            float treadChevron = sin(vAttr.z * 28.0 + abs(vUv.x - 0.50) * 46.0) * 0.5 + 0.5;
            float mudMask = clamp(mudTrack * (0.50 + 0.50 * pvNoise2(vec2(vUv.x * 14.0, vAttr.z * 1.1))), 0.0, 0.86);
            // Smooth 8.5m organic mud-carry feathering at BOTH bridge ends (ZERO razor-sharp road-to-bridge cut!)
            float dBridgeEnd = min(abs(vAttr.z - uSegSStart), abs((uSegSStart + 120.0) - vAttr.z));
            float approachMud = smoothstep(8.5, 0.0, dBridgeEnd) * (0.52 + 0.48 * pvFbm2(vWorldPos.xz * 0.45));
            mudMask = clamp(max(mudMask, approachMud * 0.94), 0.0, 0.95);
            vec3 mudCol = mix(vec3(0.10, 0.075, 0.048), vec3(0.21, 0.155, 0.098), treadChevron * 0.72);
            wood = mix(wood, mudCol, max(mudMask * 0.68, approachMud * 0.88));
            // Weather-differentiated selective rainwater puddles (pooled in hollows & plate centers — NEVER washes out planks/bolts!)
            float bWet = clamp(uWetness, 0.0, 1.0);
            float bHollow = pvFbm2(vec2(vUv.x * 5.2, vAttr.z * 0.16));
            float bPuddleField = (mix(0.02, 0.28, bWet) + vAttr.y * 0.14 + plateMask * 0.18 - bHollow) * smoothstep(0.96, 0.78, vAttr.x);
            float bPuddle = smoothstep(0.04, 0.18, bPuddleField) * (1.0 - boltHead * 0.85) * (0.35 + 0.65 * seam) * smoothstep(0.18, 0.62, bWet);
            float bCapRim = smoothstep(-0.08, 0.06, bPuddleField) * mix(0.25, 1.0, bWet);
            wood *= mix(1.0, 0.64, bCapRim * 0.58);
            vec3 bRip = (bPuddle > 0.03 && viewDist < 48.0) ? rainRipples3Oct(vWorldPos.xz * 1.55, uTime, viewDist) : vec3(0.0);
            // Flat weathered timber normal + sharp narrow edge bevel + crisp wood fiber micro-bump (ZERO plastic waves!)
            vec3 woodN = normalize(baseN + vec3(
              (fiberFine - 0.5) * 0.26 + (fiberCoarse - 0.5) * 0.18 + boltHead * 0.45 + tieBolt * 0.35 + plateEdge * 0.35,
              0.0,
              edgeSlope * 0.58 + (fiberFine - 0.5) * 0.22 + splitCrack * 0.28 + mudMask * (treadChevron - 0.5) * 0.26
            ));
            vec3 waterN = normalize(baseN + vec3(bRip.x * 0.38, 0.0, bRip.y * 0.38));
            vec3 N = normalize(mix(woodN, waterN, bPuddle * 0.75));
            float rough = mix(mix(0.58, 0.24, bCapRim), 0.035, bPuddle);
            float met = plateMask * 0.62 * (1.0 - bPuddle * 0.45);
            float shadowVal = sampleShadowPCF(vWorldPos, baseN);
            vec3 col = evalPBR(vWorldPos, N, V, wood, rough, met, 0.94, mix(0.24, 0.82, bPuddle), shadowVal);
            if (bPuddle > 0.02) {
              float NdotV = max(dot(N, V), 0.0);
              float fres = 0.14 + 0.72 * pow(1.0 - NdotV, 2.8);
              vec3 R = reflect(-V, N);
              // Reflect sky + subtle overhead steel arch/truss X-lattice silhouette in bridge puddles (1:1 桥面.jpg!)
              float trussRefl = smoothstep(0.74, 0.92, abs(sin((vWorldPos.x + vWorldPos.z) * 0.85)) * abs(sin((vWorldPos.x - vWorldPos.z) * 0.85)));
              vec3 envRefl = sampleRainyIBL(R, 0.025) * mix(vec3(0.92, 0.96, 1.02), vec3(0.16, 0.20, 0.24), trussRefl * 0.82);
              vec3 puddleCol = mix(col * 0.58, envRefl * (0.82 + 0.22 * shadowVal), clamp(fres * 0.76, 0.20, 0.74));
              puddleCol += vec3(0.82, 0.88, 0.96) * bRip.z * 0.24;
              col = mix(col, puddleCol, bPuddle * 0.82);
            }
            col += evalWetCarReflection(vWorldPos, vec3(bRip.x, 0.0, bRip.y), bPuddle, bCapRim, rough);
            col += evalCarHeadlights(vWorldPos, N, V, wood, rough);
            col = applyFog(col, vWorldPos);
            float bOutAlpha = (bPuddle > 0.20) ? (0.62 + clamp(bPuddle, 0.0, 1.0) * 0.09) : 1.0;
            fragColor = vec4(col, bOutAlpha);
            return;
          }

          // === TUNNEL WET ASPHALT & CURB (vSurfMode == 2) ===
          if (vSurfMode > 1.5 && vAttr.x <= 1.25) {
            if (vAttr.x <= 1.02) {
              vec2 uvA = vec2(vUv.x * 11.2, vAttr.z) / 1.6;
              // 2-Step Height Parallax Occlusion Mapping (POM) for wet tunnel asphalt & side drainage channels
              float tPomFade = smoothstep(38.0, 6.0, viewDist);
              vec2 tViewXZ = V.xz / (abs(V.y) + 0.52);
              if (tPomFade > 0.01) {
                float th0 = texture(uRoadNrm, uvA * 0.36).a;
                uvA -= tViewXZ * (0.5 - th0) * 0.042 * tPomFade;
                float th1 = texture(uRoadNrm, uvA * 0.36).a;
                uvA -= tViewXZ * (0.5 - th1) * 0.022 * tPomFade;
              }
              vec3 roadTex = texture(uRoadAlb, uvA * 0.36).rgb;
              vec3 nTex = texture(uRoadNrm, uvA * 0.36).xyz * 2.0 - 1.0;
              float microGrain = pvNoise2(vWorldPos.xz * 14.0) * 0.55 + pvNoise2(vWorldPos.xz * 32.0) * 0.45;
              vec3 asp = mix(vec3(0.032, 0.036, 0.042), vec3(0.090, 0.096, 0.106), roadTex.r * 0.65 + microGrain * 0.35);
              float tTrack = exp(-pow((vUv.x - 0.32) / 0.09, 2.0)) + exp(-pow((vUv.x - 0.68) / 0.09, 2.0));
              asp *= mix(1.0, 0.68, clamp(tTrack, 0.0, 1.0));
              // === CONTINUOUS LONGITUDINAL TUNNEL DRAINAGE CHANNELS (长排水渠) ON BOTH ROAD EDGES ===
              float sideEdgeDist = min(vUv.x, 1.0 - vUv.x);
              float gutterLipL = smoothstep(0.012, 0.003, abs(sideEdgeDist - 0.088));
              float gutterLipR = smoothstep(0.010, 0.003, abs(sideEdgeDist - 0.016));
              float gutterRecess = smoothstep(0.082, 0.064, sideEdgeDist) * smoothstep(0.016, 0.028, sideEdgeDist);
              float grateSlotZ = smoothstep(0.28, 0.62, sin(vAttr.z * 38.0));
              float grateBarZ  = smoothstep(0.92, 0.98, abs(sin(vAttr.z * 3.14159)));
              float grateMask  = gutterRecess * max(grateSlotZ * 0.72, grateBarZ);
              float gutterWater = gutterRecess * (1.0 - grateMask * 0.68);
              // Organic 16m mud-to-asphalt tire-track feathering at tunnel portals (ZERO razor-sharp seam!)
              float tLocalS = clamp(vAttr.z - uSegSStart, 0.0, 120.0);
              float tPortalDist = min(tLocalS, 120.0 - tLocalS);
              float tInteriorFade = smoothstep(0.5, 13.5, tPortalDist);
              float tMudNoise = pvFbm2(vec2(vUv.x * 7.5, vAttr.z * 0.24));
              float tMudDrag = 1.0 - smoothstep(1.5, 17.5, tPortalDist + (tMudNoise - 0.5) * 7.5 - clamp(tTrack, 0.0, 1.0) * 3.8);
              float cLine1 = smoothstep(0.011, 0.004, abs(vUv.x - 0.486));
              float cLine2 = smoothstep(0.011, 0.004, abs(vUv.x - 0.514));
              float lineWear = smoothstep(0.28, 0.72, pvNoise2(vec2(vUv.x * 18.0, vAttr.z * 0.6)));
              float edgeLine = smoothstep(0.016, 0.006, abs(vUv.x - 0.112)) + smoothstep(0.016, 0.006, abs(vUv.x - 0.888));
              float lineMask = 1.0 - tMudDrag * 0.92;
              asp = mix(asp, vec3(0.72, 0.52, 0.12), clamp(cLine1 + cLine2, 0.0, 1.0) * (0.45 + 0.55 * lineWear) * lineMask);
              asp = mix(asp, vec3(0.58, 0.61, 0.64), clamp(edgeLine, 0.0, 1.0) * 0.55 * lineMask);
              // Dark recessed concrete trough + cast-iron grate bars + bright wet concrete curb lips
              asp = mix(asp, vec3(0.016, 0.020, 0.024), gutterRecess * 0.88);
              asp = mix(asp, vec3(0.11, 0.12, 0.135), grateMask * 0.78);
              asp = mix(asp, vec3(0.18, 0.19, 0.20), clamp(gutterLipL + gutterLipR, 0.0, 1.0) * 0.80);
              vec3 entryMudCol = roadTex * vec3(0.52, 0.37, 0.24) * (0.72 + 0.45 * tMudNoise);
              asp = mix(asp, entryMudCol, clamp(tMudDrag * (0.78 + 0.22 * clamp(tTrack, 0.0, 1.0)), 0.0, 0.96));
              // Differentiated Tunnel Seepage & Wet Asphalt Puddles + Ceiling-Drip Ripples + Warm Lamp Mirror Reflections
              float tWet = max(0.45, clamp(uWetness, 0.0, 1.0));
              float dampF = pvFbm2(vec2(vUv.x * 4.4, vAttr.z * 0.12)) + clamp(tTrack, 0.0, 1.0) * 0.22 + (tWet - 0.52) * 0.16;
              float damp = smoothstep(0.30, 0.66, dampF) * tWet;
              float puddleT = max(smoothstep(0.44, 0.62, dampF) * smoothstep(0.22, 0.76, tWet), gutterWater * 0.94);
              vec3 tRip = (puddleT > 0.05 && viewDist < 42.0) ? rainRipples3Oct(vWorldPos.xz * 0.82, uTime * 0.68, viewDist) * 0.42 : vec3(0.0);
              float flowRip = sin(vAttr.z * 9.0 - uTime * 5.2 + pvNoise2(vWorldPos.xz * 5.0) * 4.0) * 0.12 * gutterWater;
              float rough = mix(mix(0.50, 0.20, damp), 0.018, puddleT);
              float lipSlope = (gutterLipL - gutterLipR) * (vUv.x < 0.5 ? 0.55 : -0.55);
              vec3 tN = normalize(baseN + vec3(nTex.x * 0.44 + lipSlope, 0.0, nTex.y * 0.44 + flowRip) * (1.0 - puddleT * 0.84) + vec3(tRip.x * 0.45, 0.0, tRip.y * 0.45) * puddleT);
              float lampCycle = abs(fract(vAttr.z / 15.0) - 0.5) * 15.0;
              float lampPool = exp(-lampCycle * lampCycle * 0.072) * (1.0 - vAttr.x * 0.20) * tInteriorFade;
              vec3 outdoorAmb = mix(uFogColor * 0.58 + uLightColor * 0.32, vec3(0.20), tInteriorFade);
              vec3 col = asp * mix(1.0, 0.58, damp * 0.62) * (outdoorAmb + vec3(0.92, 0.62, 0.30) * lampPool * 1.15);
              vec3 R = reflect(-V, tN);
              float NdotV = max(dot(tN, V), 0.001);
              float fres = 0.10 + 0.85 * pow(1.0 - NdotV, 3.0);
              float specGlint = pow(max(dot(R, normalize(vec3(0.0, 0.58, 0.81))), 0.0), mix(22.0, 140.0, puddleT));
              col += vec3(1.18, 0.72, 0.28) * lampPool * (damp * 0.18 + puddleT * fres * 0.85) * (0.25 + 0.95 * specGlint);
              col += vec3(0.92, 0.72, 0.45) * tRip.z * puddleT * 0.28 * tInteriorFade;
              // Real Analytical Tunnel Mirror Reflection in Wet Puddles (smoothly hands off to sky IBL at tunnel portals!)
              if (puddleT > 0.02) {
                float rVert = clamp(R.y, 0.02, 1.0);
                float reflZ = vAttr.z + (R.z / (rVert + 0.14)) * 4.8;
                float rLampCyc = abs(fract(reflZ / 13.0) - 0.5) * 13.0;
                float rLampGlow = exp(-rLampCyc * rLampCyc * 0.24) * smoothstep(0.52, 0.10, abs(R.x));
                float rStripGlow = exp(-pow(abs(R.x) * 6.5, 2.0)) * smoothstep(0.08, 0.48, R.y) * rLampGlow;
                float rRibDark = smoothstep(0.35, 0.75, sin(reflZ * 0.78));
                float rPortalLight = smoothstep(0.62, 0.98, abs(R.z)) * smoothstep(0.02, 0.28, R.y) * smoothstep(42.0, 2.0, tPortalDist);
                float rTileWall = smoothstep(0.32, 0.76, abs(R.x)) * (0.55 + 0.45 * sin(reflZ * 2.4));
                vec3 tunnelMirror = mix(vec3(0.015, 0.018, 0.024), vec3(0.14, 0.14, 0.13), rTileWall * 0.62) * (0.68 + 0.32 * rRibDark);
                tunnelMirror += vec3(1.62, 0.96, 0.36) * (rLampGlow * 0.74 + rStripGlow * 0.98 + gutterWater * 0.52 * lampPool);
                tunnelMirror += uFogColor * (0.90 + 0.40 * uLightColor) * rPortalLight * 1.18;
                vec3 portalSkyRefl = sampleRainyIBL(R, 0.035) * 0.85;
                vec3 finalRefl = mix(portalSkyRefl, tunnelMirror, tInteriorFade);
                col = mix(col, finalRefl, clamp((0.25 + 0.72 * fres) * puddleT, 0.0, 0.88));
              }
              col += evalWetCarReflection(vWorldPos, vec3(tRip.x, 0.0, tRip.y), puddleT * 0.96, damp, rough);
              // Warm amber-gold sodium ceiling lamp reflections gleaming along wet tunnel asphalt (fades cleanly at portal!)
              float tLampDist = abs(fract(vAttr.z / 13.5) - 0.5) * 13.5;
              float tLampPool = exp(-tLampDist * tLampDist * 0.085) * smoothstep(0.92, 0.15, abs(vUv.x - 0.5) * 2.0) * tInteriorFade;
              col += vec3(0.95, 0.62, 0.22) * tLampPool * (0.14 + 0.32 * puddleT);
              col += evalCarHeadlights(vWorldPos, tN, V, asp, rough) * 1.80;
              float studZ = abs(fract(vAttr.z / 6.0) - 0.5) * 6.0;
              float studX = min(abs(vUv.x - 0.105), abs(vUv.x - 0.895));
              float studMask = smoothstep(0.016, 0.005, studX) * smoothstep(0.28, 0.06, studZ);
              col += vec3(2.10, 1.22, 0.26) * studMask;
              float expJoint = smoothstep(0.045, 0.012, abs(fract(vAttr.z / 10.0) - 0.5) * 10.0);
              col *= (1.0 - expJoint * 0.28);
              col = applyFog(col, vWorldPos);
              float tOutAlpha = (puddleT > 0.14) ? (0.62 + clamp(puddleT, 0.0, 1.0) * 0.09) : 1.0;
              fragColor = vec4(col, tOutAlpha);
              return;
            } else {
              float damp = pvNoise2(vec2(vWorldPos.x * 0.9, vAttr.z * 0.28));
              vec3 curb = mix(vec3(0.08, 0.085, 0.092), vec3(0.16, 0.168, 0.178), damp);
              float tLocalS = clamp(vAttr.z - uSegSStart, 0.0, 120.0);
              float tIntF = smoothstep(0.5, 12.0, min(tLocalS, 120.0 - tLocalS));
              float lampCycle = abs(fract(vAttr.z / 15.0) - 0.5) * 15.0;
              float lampPool = exp(-lampCycle * lampCycle * 0.065) * tIntF;
              float curbFres = pow(1.0 - max(dot(baseN, V), 0.0), 3.0);
              vec3 col = curb * (mix(0.55, 0.24, tIntF) + vec3(0.92, 0.62, 0.30) * lampPool * 1.05);
              col += vec3(0.85, 0.56, 0.24) * lampPool * curbFres * 0.32;
              col += evalCarHeadlights(vWorldPos, baseN, V, curb, 0.32) * 1.15;
              col = applyFog(col, vWorldPos);
              fragColor = vec4(col, 1.0);
              return;
            }
          }

          // 1. Directional Compacted Wet Mud PBR + Packed Height
          vec2 wuv = vec2(vUv.x * 11.2, vAttr.z);
          vec2 uvA = wuv / 2.2;
          vec2 uvB = wuv.yx / 6.0 + vec2(0.37);
          vec3 mudAlbA = texture(uRoadAlb, uvA * 0.24).rgb;
          vec3 mudAlbB = texture(uRoadAlb, uvB * 0.24).rgb;
          float microFade = smoothstep(48.0, 14.0, viewDist);
          vec3 mudAlb = mix(mudAlbB, mix(mudAlbB, mudAlbA, 0.64), microFade);

          vec4 nhA = texture(uRoadNrm, uvA * 0.24);
          vec4 nhB = texture(uRoadNrm, uvB * 0.24);
          vec3 mudNMap = normalize(mix(nhB.xyz * 2.0 - 1.0, nhA.xyz * 2.0 - 1.0, 0.64));
          float mudH = mix(nhB.a, nhA.a, 0.64);

          // 2. Next-Gen 4-Layer Differential Alpine Slope + 2-Step Height Parallax (Bare Fractured Rock / Moss Ledges / Rich Alpine Turf / Wet Humus)
          vec2 wXZ = vWorldPos.xz + uOriginOffset;
          float pomFade = smoothstep(46.0, 10.0, viewDist) * smoothstep(0.95, 1.25, vAttr.x);
          vec2 pomShift = vec2(0.0);
          if (pomFade > 0.01) {
            vec2 viewXZ = V.xz / (abs(V.y) + 0.55);
            float h0 = texture(uRockNrm, wXZ * 0.22).a;
            vec2 p1 = wXZ * 0.22 - viewXZ * (0.5 - h0) * 0.055 * pomFade;
            float h1 = texture(uRockNrm, p1).a;
            pomShift = -viewXZ * (0.5 - (h0 * 0.45 + h1 * 0.55)) * 0.085 * pomFade;
          }
          vec2 wpPom = wXZ + pomShift * 4.5;
          // Stochastic 37-deg Dual-Frequency Anti-Tiling (eliminates repeating grid artifacts on wide mountain slopes!)
          mat2 rot37 = mat2(0.7986, -0.6018, 0.6018, 0.7986);
          float tileBreak = smoothstep(0.24, 0.76, pvFbm2(wpPom * 0.052 + vec2(3.7, -2.1)));
          vec2 gA = wpPom / 4.2;
          vec2 gB = (rot37 * wpPom) / 11.8 + vec2(0.37, 0.61);
          vec2 gC = (rot37 * wpPom) / 3.7 + vec2(0.53, 0.19);
          vec3 grassMicro = mix(texture(uGrassAlb, gA).rgb, texture(uGrassAlb, gC).rgb, tileBreak);
          vec3 grassAlb = mix(texture(uGrassAlb, gB).rgb, grassMicro, 0.66);
          vec4 gnhA = texture(uGrassNrm, gA);
          vec4 gnhB = texture(uGrassNrm, gB);
          vec3 grassNMap = normalize(mix(gnhB.xyz * 2.0 - 1.0, gnhA.xyz * 2.0 - 1.0, 0.68));
          float grassH = mix(gnhB.a, gnhA.a, 0.65);

          float ultraMacro = pvFbm2(wpPom * 0.018 + vec2(-5.4, 2.7));
          float macroG = pvFbm2(wpPom * 0.065);
          float detailG = pvFbm2(wpPom * 0.32 + vec2(2.1, -3.7));
          float microTuft = pvNoise2(wpPom * 1.85 + vec2(-1.3, 4.2));
          float soilPatch = smoothstep(0.54, 0.78, pvNoise2(wpPom * 0.22 + vec2(3.1, -5.2)));
          float mossCushion = smoothstep(0.40, 0.74, pvFbm2(wpPom * 0.28 - vec2(4.5, 1.9)));
          float heatherPatch = smoothstep(0.52, 0.80, pvFbm2((rot37 * wpPom) * 0.09 + vec2(7.1, -4.3)));
          float pineDuff = smoothstep(0.44, 0.78, ultraMacro * 0.6 + macroG * 0.4) * smoothstep(2.0, 12.0, vAttr.x);
          vec3 deepSlope = grassAlb * vec3(0.36, 0.62, 0.34);
          vec3 litSlope  = grassAlb * vec3(1.04, 1.16, 0.54);
          grassAlb = mix(deepSlope, litSlope, smoothstep(0.16, 0.82, macroG * 0.55 + detailG * 0.30 + microTuft * 0.15));
          grassAlb = mix(grassAlb, vec3(0.085, 0.195, 0.072), mossCushion * 0.46);
          grassAlb = mix(grassAlb, vec3(0.13, 0.17, 0.08), heatherPatch * 0.38);
          grassAlb = mix(grassAlb, vec3(0.11, 0.12, 0.065), pineDuff * 0.44);
          grassAlb = mix(grassAlb, vec3(0.18, 0.138, 0.095), soilPatch * 0.54);
          grassAlb *= (0.86 + 0.26 * microTuft);

          // True 3-Axis World-Space Triplanar Fractured Basalt/Granite Cliff Rock + Parallax Depth (ZERO UV stretching & ZERO mosaic blur!)
          vec3 triW = pow(abs(baseN), vec3(4.0));
          triW /= max(triW.x + triW.y + triW.z, 1e-4);
          vec2 rUvX = (vec2(wXZ.y, vWorldPos.y) + pomShift * 3.2) * vec2(0.24, 0.28);
          vec2 rUvY = wpPom * 0.22;
          vec2 rUvY2 = (rot37 * wpPom) * 0.13 + vec2(0.41, 0.73);
          vec2 rUvZ = (vec2(wXZ.x, vWorldPos.y) + pomShift * 3.2) * vec2(0.24, 0.28);
          vec3 rockY = mix(texture(uRockAlb, rUvY).rgb, texture(uRockAlb, rUvY2).rgb, tileBreak * 0.58);
          vec3 rockAlb = texture(uRockAlb, rUvX).rgb * triW.x
                       + rockY * triW.y
                       + texture(uRockAlb, rUvZ).rgb * triW.z;
          vec4 rnh = texture(uRockNrm, rUvX) * triW.x
                   + mix(texture(uRockNrm, rUvY), texture(uRockNrm, rUvY2), tileBreak * 0.50) * triW.y
                   + texture(uRockNrm, rUvZ) * triW.z;
          vec3 rockNMap = normalize(rnh.xyz * 2.0 - 1.0);
          float rockH = rnh.a;
          // Multi-octave geological strata, fracture veins, bare rock vs moss-draped shelves
          float microCrag = pvNoise2(wpPom * 3.4 + vec2(vWorldPos.y * 3.8, -vWorldPos.y * 2.2));
          float strata = 0.5 + 0.5 * sin(vWorldPos.y * 3.2 + pvFbm2(wpPom * 0.24) * 4.4);
          float cragF = pvFbm2(vec2((vWorldPos.x + vWorldPos.z) * 0.34, vWorldPos.y * 0.52));
          float creviceAO = smoothstep(0.18, 0.58, rockH);
          float gWet = clamp(uWetness, 0.0, 1.0);
          float wetStreakR = smoothstep(0.38, 0.78, pvNoise2(vec2((vWorldPos.x + vWorldPos.z) * 0.96, vWorldPos.y * 0.20))) * mix(0.22, 1.0, gWet);
          vec3 darkSlate = vec3(0.048, 0.056, 0.064);
          vec3 midBasalt = vec3(0.165, 0.178, 0.184);
          vec3 warmGranite = vec3(0.22, 0.21, 0.19);
          rockAlb = mix(darkSlate, mix(midBasalt, warmGranite, smoothstep(0.55, 0.85, cragF)), clamp(rockAlb.r * 0.58 + strata * 0.24 + cragF * 0.26 + (microCrag - 0.5) * 0.22, 0.0, 1.0));
          rockAlb *= (0.64 + 0.36 * creviceAO);
          // Lush differential moss-covered rock ledges clinging to upward-facing crevices
          float cliffMoss = smoothstep(0.28, 0.70, baseN.y + (cragF - 0.42) * 0.48) * smoothstep(0.26, 0.68, pvFbm2(wpPom * 0.28 + 2.7)) * smoothstep(0.22, 0.65, rockH);
          vec3 mossCol = mix(vec3(0.058, 0.168, 0.052), vec3(0.135, 0.275, 0.085), detailG);
          rockAlb = mix(rockAlb, mossCol, cliffMoss * 0.76);
          rockAlb *= mix(1.0, 0.58, wetStreakR * 0.60);

          // 3. Sculpted Rally Mud Ruts + Poking Gravel + Shattered Sky-Reflecting Puddles
          float rutWobble = (pvNoise2(vec2(vAttr.z * 0.045, 1.7)) - 0.5) * 0.045;
          float dL = vUv.x - (0.31 + rutWobble);
          float dR = vUv.x - (0.69 + rutWobble);
          float rutL = exp(-pow(dL / 0.092, 2.0));
          float rutR = exp(-pow(dR / 0.092, 2.0));
          float rutMask = clamp(rutL + rutR, 0.0, 1.0) * smoothstep(0.98, 0.72, vAttr.x);
          float bermL = exp(-pow((abs(dL) - 0.115) / 0.042, 2.0));
          float bermR = exp(-pow((abs(dR) - 0.115) / 0.042, 2.0));
          float bermMask = clamp(bermL + bermR, 0.0, 1.0) * smoothstep(0.98, 0.72, vAttr.x);
          float centerCrown = exp(-pow((vUv.x - 0.50) / 0.13, 2.0)) * smoothstep(0.95, 0.65, vAttr.x);

          float mudClod = pvFbm2(vec2(vUv.x * 16.0, vAttr.z * 0.52));
          float gravelStones = smoothstep(0.56, 0.80, pvNoise2(vWorldPos.xz * 3.8 + vec2(1.7, -2.3))) * 0.65
                             + smoothstep(0.60, 0.84, pvNoise2(vWorldPos.xz * 9.5 - vec2(4.1, 2.9))) * 0.35;
          float mudChunk = smoothstep(0.54, 0.78, pvFbm2(vWorldPos.xz * 1.45 + vec2(0.8, 3.1)));
          float mudStreak = pvNoise2(vec2(vUv.x * 38.0, vAttr.z * 0.42)) * 0.65 + pvNoise2(vec2(vUv.x * 74.0, vAttr.z * 0.18)) * 0.35;
          float edgeFbm = pvFbm2(vWorldPos.xz * 0.34);
          float macroHollow = pvFbm2(vec2(vUv.x * 4.2, vAttr.z * 0.095));
          float puddlePatch = pvFbm2(vec2(vUv.x * 3.2 + 1.3, vAttr.z * 0.075));
          float puddleBreak = pvNoise2(vWorldPos.xz * 0.85 + vec2(-2.4, 5.1));

          float rutBreak = 0.55 + 0.45 * pvNoise2(vec2(vUv.x * 2.6, vAttr.z * 0.11));
          float mudIsland = smoothstep(0.46, 0.76, pvFbm2(vec2(vUv.x * 5.8 - 1.9, vAttr.z * 0.24)));
          float surfH = mudH * 0.36 + macroHollow * 0.30 + mudClod * 0.20 + gravelStones * 0.24 + mudChunk * 0.16
                      + mudIsland * 0.14 - rutMask * 0.38 * rutBreak + bermMask * 0.18 + centerCrown * 0.12 * rutBreak;
          float ditchZone = smoothstep(0.70, 0.86, vAttr.x) * (1.0 - smoothstep(0.90, 1.02, vAttr.x));
          float waterLvl = mix(0.16, 0.39, gWet) + vAttr.y * 0.22 + (puddlePatch - 0.5) * 0.38 + (puddleBreak - 0.5) * 0.28 - ditchZone * 0.08;
          float roadArea = 1.0 - smoothstep(0.82, 0.99, vAttr.x + (edgeFbm - 0.5) * 0.18);
          float waterDepth = (waterLvl - surfH) * roadArea;

          float puddleMask   = smoothstep(0.012, 0.056, waterDepth) * (1.0 - smoothstep(0.68, 0.88, gravelStones) * 0.58) * smoothstep(0.14, 0.52, gWet);
          float shallowWater = smoothstep(0.014, 0.15, waterDepth);
          float capillaryRim = smoothstep(-0.15, 0.028, waterDepth) * (1.0 - puddleMask * 0.65) * roadArea * mix(0.22, 1.0, gWet);

          vec3 dryMudTint = vec3(1.02, 0.80, 0.58);
          vec3 wetMudTint = vec3(0.27, 0.195, 0.135);
          mudAlb *= mix(dryMudTint, wetMudTint, clamp(capillaryRim * 0.86 + rutMask * 0.42, 0.0, 1.0));
          mudAlb *= (0.74 + 0.46 * mudClod) * (0.86 + 0.24 * mudStreak);
          vec3 wetStoneCol = mix(vec3(0.15, 0.145, 0.135), vec3(0.28, 0.27, 0.255), pvNoise2(vWorldPos.xz * 14.0));
          mudAlb = mix(mudAlb, wetStoneCol, smoothstep(0.48, 0.82, gravelStones) * 0.62 * roadArea);
          mudAlb = mix(mudAlb, vec3(0.17, 0.12, 0.078), mudChunk * 0.42 * (1.0 - puddleMask));
          mudAlb = mix(mudAlb, vec3(0.10, 0.076, 0.048), clamp(shallowWater * 0.62 + ditchZone * 0.45, 0.0, 0.82));

          // 4. Organic Mud-Grass-Rock Differential Transition (crisp rock strata outcrops even on medium embankments + mossy crevices!)
          float edgeCoord = vAttr.x + (edgeFbm - 0.48) * 0.24 + (mudH - grassH) * 0.16;
          float mossStrip = smoothstep(0.88, 1.03, edgeCoord) * (1.0 - smoothstep(1.05, 1.24, edgeCoord));
          float grassMask = smoothstep(0.94, 1.18, edgeCoord);
          float slope = 1.0 - clamp(baseN.y, 0.0, 1.0);
          // Multi-scale undulating terrain cross-blending (bare rock veins + gravel scree + humus earth + mossy ledges — NEVER monotonous moss!)
          float rockOutcropNoise = pvFbm2(wpPom * 0.14 + vec2(-1.7, 3.4));
          float screeVein = pvFbm2(wpPom * 0.34 + vec2(5.1, -2.8));
          float earthPatch = smoothstep(0.42, 0.76, pvFbm2(wpPom * 0.19 + vec2(-4.3, 1.6)));
          // Round 13: Stronger steep-bank triplanar basalt exposure (slope > 0.22) eliminates stretched XZ UV striations on cut-banks!
          float steepCutBank = smoothstep(0.18, 0.42, slope);
          float rockMask = clamp(max(
            smoothstep(0.065, 0.24, slope + (rockH - 0.42) * 0.32 + (cragF - 0.45) * 0.26 + (rockOutcropNoise - 0.46) * 0.22),
            steepCutBank * 0.92
          ), 0.0, 1.0) * smoothstep(1.02, 1.24, vAttr.x);
          vec3 screeMix = mix(grassAlb, mix(mudAlb * 0.92, rockAlb * 0.88, smoothstep(0.35, 0.72, screeVein)), earthPatch * 0.52 * (1.0 - rockMask));
          vec3 groundAlb = mix(mudAlb, mix(screeMix, rockAlb, rockMask), grassMask);
          groundAlb = mix(groundAlb, vec3(0.10, 0.21, 0.088), mossStrip * 0.56);

          // === 8-THEME SEAMLESS MULTI-BIOME 512px PBR MATERIAL MODULATION ===
          // Organic 76m FBM-noise-warped biome climate transition (ZERO razor-sharp horizontal stripe across hillsides!)
          float blendNoise = (pvFbm2(wpPom * 0.045 + vec2(3.7, -2.1)) - 0.5) * 28.0 + (pvNoise2(wpPom * 0.16) - 0.5) * 9.0;
          float segBlend = smoothstep(0.0, 76.0, (vAttr.z - uSegSStart) + blendNoise);
          float wPeak   = mix(float(abs(uPrevThemeId - 1.0) < 0.5), float(abs(uThemeId - 1.0) < 0.5), segBlend);
          float wLake   = mix(float(abs(uPrevThemeId - 2.0) < 0.5), float(abs(uThemeId - 2.0) < 0.5), segBlend);
          float wCliff  = mix(float(abs(uPrevThemeId - 3.0) < 0.5), float(abs(uThemeId - 3.0) < 0.5), segBlend);
          float wBirch  = mix(float(abs(uPrevThemeId - 4.0) < 0.5), float(abs(uThemeId - 4.0) < 0.5), segBlend);
          float wQuarry = mix(float(abs(uPrevThemeId - 5.0) < 0.5), float(abs(uThemeId - 5.0) < 0.5), segBlend);
          float wBamboo = mix(float(abs(uPrevThemeId - 6.0) < 0.5), float(abs(uThemeId - 6.0) < 0.5), segBlend);

          vec3 themeNExtra = vec3(0.0);
          float themeRoughBias = 0.0;
          float themeCCExtra = 0.0;
          float peakSnowCov = 0.0;

          if (wPeak > 0.01) {
            // Theme 1: High-Altitude Snow Peak — Deep wind-sculpted snowdrifts (成片积雪), exposed frost-cracked granite, glazed ice sheets & meltwater slush puddles!
            vec3 srAlbY = mix(texture(uSnowRockAlb, rUvY).rgb, texture(uSnowRockAlb, rUvY2).rgb, tileBreak * 0.60);
            vec3 srAlb = texture(uSnowRockAlb, rUvX).rgb * triW.x + srAlbY * triW.y + texture(uSnowRockAlb, rUvZ).rgb * triW.z;
            vec3 srNrm = (mix(texture(uSnowRockNrm, rUvY), texture(uSnowRockNrm, rUvY2), tileBreak * 0.55).xyz * 2.0 - 1.0);
            vec2 snowWarp = wpPom * 0.11 + vec2(pvFbm2(wpPom * 0.07 + 2.3), pvFbm2(wpPom * 0.07 - 5.1)) * 0.95;
            float driftH = pvFbm2(snowWarp + vec2(4.2, -1.7)) * 0.64 + pvFbm2(snowWarp * 2.7) * 0.36;
            float driftDX = (pvFbm2(snowWarp * 1.9 + vec2(0.18, 0.0)) - pvFbm2(snowWarp * 1.9 - vec2(0.18, 0.0))) * 1.85;
            float driftDZ = (pvFbm2(snowWarp * 1.9 + vec2(0.0, 0.18)) - pvFbm2(snowWarp * 1.9 - vec2(0.0, 0.18))) * 1.85;
            // Broad snowdrifts on shoulders & slopes + snowbanks encroaching onto road edges
            float edgeSnowBank = smoothstep(0.76, 1.18, vAttr.x) * smoothstep(0.30, 0.68, driftH);
            float snowPatch = clamp(smoothstep(0.24, 0.62, driftH + baseN.y * 0.48 - slope * 0.58 - (1.0 - grassMask) * 0.46) + edgeSnowBank * 0.55, 0.0, 1.0);
            // Glazed refrozen ice sheets & meltwater slush puddles along shoulders & hollows
            float iceNoise = pvFbm2(wpPom * 0.28 + vec2(-3.1, 6.4));
            // Round 12: Softer feathering on snow-road ice/slush puddles for natural alpine meltwater transitions!
            float iceSheet = smoothstep(0.48, 0.80, iceNoise) * (1.0 - snowPatch * 0.78) * smoothstep(0.45, 1.35, vAttr.x);
            float sunFacing = clamp(dot(normalize(baseN + vec3(driftDX, 0.0, driftDZ)), uLightDir) * 0.5 + 0.5, 0.0, 1.0);
            vec3 snowSSS = mix(vec3(0.56, 0.67, 0.84), vec3(0.97, 0.96, 0.95), smoothstep(0.14, 0.78, sunFacing));
            float sparkle = pow(pvNoise2(wpPom * 20.0 + V.xz * 4.5), 14.0) * snowPatch * 0.92;
            vec3 exposedGranite = mix(rockAlb * vec3(0.68, 0.74, 0.84), srAlb * vec3(0.52, 0.58, 0.68), 0.52);
            vec3 iceTint = mix(vec3(0.28, 0.40, 0.52), vec3(0.54, 0.68, 0.80), sunFacing);
            vec3 alpineSlope = mix(exposedGranite, snowSSS + vec3(sparkle), snowPatch * 0.92);
            alpineSlope = mix(alpineSlope, iceTint, iceSheet * 0.72);
            // Director V3: Frozen icy permafrost earth & dark crushed-gravel road with light wind-blown snow patches
            vec3 screeRoad = mix(mudAlb * vec3(0.76, 0.80, 0.88), srAlb * vec3(0.42, 0.48, 0.56), 0.42) * mix(1.0, 0.60, rutMask * 0.68);
            float crownSnowDust = smoothstep(0.56, 0.86, driftH) * smoothstep(0.48, 0.08, rutMask) * smoothstep(0.72, 0.22, vAttr.x) * 0.28;
            float roadSnowMask = clamp(edgeSnowBank * 0.56 + crownSnowDust, 0.0, 0.66);
            screeRoad = mix(screeRoad, snowSSS * 0.90, roadSnowMask);
            screeRoad = mix(screeRoad, iceTint * 0.72, iceSheet * (1.0 - roadSnowMask) * 0.44);
            vec3 peakAlb = mix(screeRoad, alpineSlope, grassMask);
            groundAlb = mix(groundAlb, peakAlb, wPeak);
            themeNExtra += (vec3(srNrm.x, 0.0, srNrm.y) * 0.48 * (1.0 - snowPatch * 0.88) + vec3(driftDX, 0.0, driftDZ) * 0.42 * snowPatch) * wPeak;
            peakSnowCov = clamp(snowPatch * wPeak * grassMask, 0.0, 1.0);
            puddleMask = max(puddleMask, iceSheet * wPeak * 0.72);
            themeRoughBias += (snowPatch * 0.10 - iceSheet * 0.58 - (1.0 - grassMask) * 0.08) * wPeak;
            themeCCExtra += (iceSheet * 0.72 + (1.0 - grassMask) * 0.14 + snowPatch * 0.04) * wPeak;
          }
          if (wLake > 0.01) {
            // Theme 2: Lakeside Loop — lush damp emerald meadow, wet shoreline pebbles & darker damp gravel shoulders
            vec3 lakeGrass = grassAlb * vec3(0.88, 1.12, 0.94);
            float shorePebble = smoothstep(0.85, 1.25, vAttr.x) * (1.0 - smoothstep(1.35, 1.95, vAttr.x));
            vec3 lakeAlb = mix(mudAlb * vec3(0.92, 0.94, 0.96), mix(lakeGrass, rockAlb, rockMask), grassMask);
            lakeAlb = mix(lakeAlb, vec3(0.24, 0.26, 0.25) * (0.7 + 0.5 * gravelStones), shorePebble * 0.55);
            groundAlb = mix(groundAlb, lakeAlb, wLake);
          }
          if (wCliff > 0.01) {
            // Theme 3: Cliffside Cloud Edge — sheer dramatic dark slate/basalt cliffs & wet dark alpine road
            vec3 sheerRock = rockAlb * vec3(0.78, 0.84, 0.92);
            vec3 cliffAlb = mix(mudAlb * vec3(0.82, 0.85, 0.90), mix(grassAlb * vec3(0.74, 0.88, 0.84), sheerRock, clamp(rockMask * 1.45, 0.0, 1.0)), grassMask);
            groundAlb = mix(groundAlb, cliffAlb, wCliff);
          }
          if (wBirch > 0.01) {
            // Theme 4: Golden Birch Valley — fallen amber/ochre leaf carpet on forest floor & road shoulders!
            float leafNoise = pvFbm2(vWorldPos.xz * 0.42 + 1.9);
            float leafCarpet = smoothstep(0.32, 0.72, leafNoise) * smoothstep(0.55, 1.15, vAttr.x) * (1.0 - rockMask * 0.8);
            vec3 goldenLeaves = mix(vec3(0.32, 0.21, 0.055), vec3(0.46, 0.30, 0.075), pvNoise2(vWorldPos.xz * 2.2));
            vec3 birchAlb = mix(groundAlb, goldenLeaves, leafCarpet * 0.78);
            birchAlb = mix(birchAlb, birchAlb * vec3(1.08, 1.02, 0.86), grassMask * 0.45);
            groundAlb = mix(groundAlb, birchAlb, wBirch);
          }
          if (wQuarry > 0.01) {
            // Theme 5: Red-Brick Quarry Gorge — 512px iron-rich terracotta red-clay road + crushed gravel scree speckles & stratified ochre cliffs!
            vec3 rcAlb = texture(uRedClayAlb, uvA * 0.32).rgb;
            vec3 rcNrm = texture(uRedClayNrm, uvA * 0.32).xyz * 2.0 - 1.0;
            float qScree = smoothstep(0.58, 0.84, pvNoise2(wpPom * 3.8)) * smoothstep(0.55, 1.05, vAttr.x);
            vec3 quarryRoad = mix(rcAlb * mix(vec3(0.98, 0.76, 0.62), vec3(0.38, 0.20, 0.14), clamp(capillaryRim * 0.8 + rutMask * 0.4, 0.0, 1.0)), mudAlb, 0.18);
            quarryRoad = mix(quarryRoad, vec3(0.46, 0.32, 0.22), qScree * 0.45);
            vec3 ochreCliff = mix(rockAlb * vec3(1.48, 0.84, 0.56), vec3(0.32, 0.14, 0.08), strata * 0.52);
            vec3 dryScrub = mix(grassAlb * vec3(1.12, 0.86, 0.54), ochreCliff * 0.88, smoothstep(0.28, 0.75, cragF));
            vec3 quarryAlb = mix(quarryRoad, mix(dryScrub, ochreCliff, clamp(rockMask * 1.65 + 0.28, 0.0, 1.0)), grassMask);
            groundAlb = mix(groundAlb, quarryAlb, wQuarry);
            themeNExtra += (vec3(rcNrm.x, 0.0, rcNrm.y) * 0.48 * (1.0 - grassMask) + vec3(rockNMap.x, 0.0, rockNMap.y) * 0.38 * grassMask) * wQuarry;
          }
          if (wBamboo > 0.01) {
            // Theme 6: Bamboo / Misty Cedar Shrine Pass — Crisp 10x8 mossy beveled flagstones + lush jade moss slopes!
            vec3 fsAlb = texture(uFlagstoneAlb, wuv * 0.28).rgb;
            vec3 fsNrm = texture(uFlagstoneNrm, wuv * 0.28).xyz * 2.0 - 1.0;
            float stonePath = smoothstep(0.92, 0.52, vAttr.x) * (0.58 + 0.42 * smoothstep(0.28, 0.72, pvFbm2(wuv * 0.12)));
            vec3 shrineRoad = mix(mudAlb * vec3(0.76, 0.84, 0.72), fsAlb * mix(vec3(0.88, 0.94, 0.90), vec3(0.52, 0.60, 0.54), clamp(capillaryRim * 0.7, 0.0, 1.0)), stonePath * 0.86);
            vec3 jadeMoss = grassAlb * vec3(0.72, 1.18, 0.82);
            vec3 bambooAlb = mix(shrineRoad, mix(jadeMoss, rockAlb * vec3(0.78, 0.92, 0.82), rockMask), grassMask);
            groundAlb = mix(groundAlb, bambooAlb, wBamboo);
            themeNExtra += vec3(fsNrm.x, 0.0, fsNrm.y) * 0.72 * wBamboo * stonePath * (1.0 - grassMask);
            themeCCExtra += 0.24 * wBamboo * stonePath * (1.0 - grassMask);
          }

          // Director V3: Tasteful Sparse Wind-Blown Fallen Leaves on Track (occasional along road verges, rare isolated strays on inner track; ZERO dense carpet!)
          float leafAllowed = (1.0 - puddleMask * 0.92) * (1.0 - wPeak * 0.92) * (1.0 - wLake * 0.72) * smoothstep(1.18, 0.88, vAttr.x) * smoothstep(42.0, 8.0, viewDist);
          float roadLeafMask = 0.0;
          if (leafAllowed > 0.04) {
            vec2 lGrid = vWorldPos.xz * 1.42;
            vec2 lCell = floor(lGrid);
            vec2 lF = fract(lGrid) - 0.5;
            float lh1 = fract(sin(dot(lCell, vec2(127.1, 311.7))) * 43758.5453);
            float lh2 = fract(sin(dot(lCell, vec2(269.5, 183.3))) * 43758.5453);
            float lh3 = fract(sin(dot(lCell, vec2(419.2, 137.9))) * 43758.5453);
            float vergeZone = smoothstep(0.56, 0.92, vAttr.x);
            float thresh = mix(0.948, 0.825, vergeZone);
            if (lh1 > thresh) {
              vec2 lOff = lF - (vec2(lh2, lh3) - 0.5) * 0.52;
              float ang = lh1 * 28.0;
              float ca = cos(ang), sa = sin(ang);
              vec2 lr = vec2(lOff.x * ca - lOff.y * sa, lOff.x * sa + lOff.y * ca);
              float lScale = mix(0.15, 0.24, fract(lh2 * 9.7));
              vec2 lp = lr / lScale;
              // Organic pointed elliptical leaf silhouette with central vein crease
              float lDist = length(vec2(lp.x * 1.0, lp.y * (1.85 + 0.55 * abs(lp.x))));
              float lShape = smoothstep(1.0, 0.46, lDist) * leafAllowed;
              float vein = smoothstep(0.18, 0.0, abs(lp.y)) * 0.26;
              vec3 leafCol = mix(
                mix(vec3(0.38, 0.18, 0.055), vec3(0.56, 0.33, 0.082), lh2),
                vec3(0.30, 0.28, 0.095),
                step(0.68, lh3)
              ) * (0.88 + vein);
              // Subtle grounding shadow right under each leaf
              float lShad = smoothstep(1.30, 0.72, lDist) * (1.0 - lShape) * leafAllowed * 0.34;
              groundAlb *= (1.0 - lShad);
              groundAlb = mix(groundAlb, leafCol, lShape * 0.92);
              roadLeafMask = lShape;
            }
          }

          vec3 dPdx = dFdx(vWorldPos), dPdy = dFdy(vWorldPos);
          vec2 dUdx = dFdx(vUv), dUdy = dFdy(vUv);
          vec3 tanW = normalize(dPdx * dUdy.y - dPdy * dUdx.y + vec3(1e-5, 0.0, 0.0));
          vec3 bitanW = normalize(cross(baseN, tanW));

          float rutSlopeX = (dL / 0.092 * rutL + dR / 0.092 * rutR) * 0.78 * smoothstep(0.98, 0.72, vAttr.x);
          float stoneGradX = (pvNoise2(vWorldPos.xz * 4.8 + vec2(0.07, 0.0)) - pvNoise2(vWorldPos.xz * 4.8 - vec2(0.07, 0.0))) * 1.45;
          float stoneGradZ = (pvNoise2(vWorldPos.xz * 4.8 + vec2(0.0, 0.07)) - pvNoise2(vWorldPos.xz * 4.8 - vec2(0.0, 0.07))) * 1.45;
          vec3 mudN = normalize(
            tanW * (mudNMap.x * 1.25 * microFade + rutSlopeX + stoneGradX * microFade) +
            bitanW * (mudNMap.y * 1.18 * microFade + stoneGradZ * microFade) +
            baseN
          );
          // Suppress horizontal strata & rock normal ripples completely under alpine snowdrifts (ZERO snow stripes!)
          float strataSuppress = 1.0 - peakSnowCov;
          vec3 cliffN = normalize(baseN + vec3(rockNMap.x * 0.96, (strata - 0.5) * 0.44, rockNMap.y * 0.96) * strataSuppress);
          // Undulating macro-micro slope normal relief so roadside embankments have palpable sculptural depth!
          float undX = (pvFbm2(wpPom * 0.28 + vec2(0.16, 0.0)) - pvFbm2(wpPom * 0.28 - vec2(0.16, 0.0))) * 1.45;
          float undZ = (pvFbm2(wpPom * 0.28 + vec2(0.0, 0.16)) - pvFbm2(wpPom * 0.28 - vec2(0.0, 0.16))) * 1.45;
          vec3 hillN = normalize(mix(
            normalize(baseN + vec3(grassNMap.x * 0.85 * strataSuppress + undX * mix(0.45, 1.0, strataSuppress), 0.0, grassNMap.y * 0.85 * strataSuppress + undZ * mix(0.45, 1.0, strataSuppress))),
            cliffN + vec3(undX * 0.45 * strataSuppress, 0.0, undZ * 0.45 * strataSuppress), rockMask
          ));
          // Director V3: High-frequency mineral grit micro-normal & cavity breakup
          float gritNX = (pvNoise2(wpPom * 16.5 + vec2(0.08, 0.0)) - pvNoise2(wpPom * 16.5 - vec2(0.08, 0.0))) * 1.05 * microFade * strataSuppress;
          float gritNZ = (pvNoise2(wpPom * 16.5 + vec2(0.0, 0.08)) - pvNoise2(wpPom * 16.5 - vec2(0.0, 0.08))) * 1.05 * microFade * strataSuppress;
          float gritCavity = 0.86 + 0.22 * pvNoise2(wpPom * 14.0);
          vec3 solidN = normalize(mix(mudN, hillN, grassMask) + themeNExtra + vec3(gritNX, 0.0, gritNZ));

          vec3 rip = (puddleMask > 0.02 && viewDist < 48.0) ? rainRipples3Oct(vWorldPos.xz, uTime, viewDist) : vec3(0.0);
          vec3 toCar = vWorldPos - uCarPos;
          float wakeBack = -dot(toCar, uCarFwd);
          float wakeLat = dot(toCar, uCarRight);
          if (puddleMask > 0.02 && wakeBack > 0.6 && wakeBack < 11.0 && abs(wakeLat) < 2.4) {
            float wl = abs(abs(wakeLat) - 0.92);
            float wakeEnv = exp(-wl * 3.8) * exp(-(wakeBack - 0.6) * 0.28);
            float wakeWave = sin(wl * 24.0 - wakeBack * 3.2 - uTime * 9.0) * wakeEnv * 0.14;
            rip.x += sign(wakeLat) * wakeWave;
            rip.z = min(0.55, rip.z + abs(wakeWave) * 1.1);
          }

          vec3 waterN = normalize(baseN + vec3(rip.x * 0.95, 0.0, rip.y * 0.95));
          vec3 N = normalize(mix(solidN, waterN, mix(puddleMask * 0.92, puddleMask, shallowWater)));

          // Director V3: Gritty matte mineral roughness on compacted earth & crushed gravel
          float mudRough = mix(0.84, 0.46, clamp(capillaryRim * 0.82 + rutMask * 0.34, 0.0, 1.0));
          mudRough = mix(mudRough, 0.44, smoothstep(0.55, 0.82, gravelStones) * roadArea);
          mudRough = mix(mudRough, 0.78, roadLeafMask * 0.85);
          mudRough = mix(mudRough, 0.020, puddleMask);
          float hillRough = mix(mix(0.96, 0.88, gWet), mix(0.88, 0.66, wetStreakR * 0.60), rockMask);
          float rough = clamp(mix(mudRough, hillRough, grassMask) + themeRoughBias, 0.02, 0.96);

          float shadowVal = sampleShadowPCF(vWorldPos, baseN);
          float ao = mix(0.92 - rutMask * 0.26 + bermMask * 0.05, mix(0.86, 0.76 + 0.22 * strata * strataSuppress, rockMask), grassMask) * mix(1.0, gritCavity, 0.65 * microFade);
          float cc = clamp(mix(0.02 * gWet + puddleMask * 0.74 + capillaryRim * 0.10, rockMask * (0.01 + 0.04 * wetStreakR), grassMask) + themeCCExtra, 0.0, 0.95);
          vec3 col = evalPBR(vWorldPos, N, V, groundAlb, rough, 0.0, ao, cc, shadowVal);

          if (puddleMask > 0.01) {
            float NdotV = max(dot(N, V), 0.0);
            float fres = 0.22 + 0.74 * pow(1.0 - NdotV, 2.5);
            vec3 R = reflect(-V, N);
            vec3 envRefl = sampleRainyIBL(R, 0.032) * vec3(0.92, 0.97, 1.06);
            float cloudPatch = smoothstep(0.36, 0.74, pvFbm2(R.xz / max(0.18, R.y + 0.22) * 1.15 + vec2(uTime * 0.02, 0.0)));
            envRefl = mix(envRefl * 0.84, envRefl * vec3(1.06, 1.08, 1.12), cloudPatch * 0.50);
            float treeSilhouette = smoothstep(0.34, 0.84, vAttr.x) * (0.52 + 0.38 * pvNoise2(vWorldPos.xz * 0.38));
            envRefl = mix(envRefl, vec3(0.032, 0.072, 0.048), treeSilhouette * 0.74);
            vec3 murkyWaterBase = mix(groundAlb * 0.52, vec3(0.13, 0.095, 0.058), 0.62);
            float ditchMuddy = ditchZone * 0.42;
            float reflStrength = clamp(fres * mix(0.56, 0.86, shallowWater) * (1.0 - ditchMuddy), 0.24, 0.84);
            vec3 puddleCol = mix(murkyWaterBase, envRefl * (0.80 + 0.20 * shadowVal), reflStrength);
            vec3 edgeWetCol = mix(groundAlb * 0.38, puddleCol, smoothstep(0.04, 0.40, shallowWater));
            edgeWetCol += vec3(0.82, 0.90, 1.00) * rip.z * 0.20 * (0.45 + 0.55 * shadowVal);
            col = mix(col, edgeWetCol, puddleMask);
          }

          if (vAttr.x < 1.15) {
            col = max(col + evalWetCarReflection(vWorldPos, vec3(rip.x, 0.0, rip.y), puddleMask, capillaryRim, rough), vec3(0.01));
          }

          col += evalCarHeadlights(vWorldPos, N, V, groundAlb, rough);
          float mudSheen = pow(1.0 - max(dot(N, V), 0.0), 3.6) * (1.0 - grassMask) * (1.0 - puddleMask * 0.7) * clamp(capillaryRim * 0.7 + rutMask * 0.4, 0.0, 1.0);
          col += sampleRainyIBL(reflect(-V, N), 0.34) * mudSheen * 0.10;
          col = applyFog(col, vWorldPos);
          // Smooth Far-Horizon Atmospheric Mist Dissolve so distant segment boundaries NEVER cut sharply against fog!
          // Round 17: Earlier atmospheric mist dissolve (195m..480m) blends distant lake headlands seamlessly into mountain sky!
          float horizonDissolve = smoothstep(195.0, 480.0, viewDist);
          col = mix(col, uFogColor, horizonDissolve * 0.94);
          // Encode puddle wetness into alpha (0.94..1.00 -> normal terrain; 0.62..0.71 -> reflective puddle for SSR pass!)
          // Round 8: Smooth puddle alpha transition eliminates 1px contour rim around icy snow-peak puddles!
          float pMaskRoad = smoothstep(0.16, 0.30, puddleMask) * smoothstep(1.06, 0.94, vAttr.x);
          float outAlpha = mix(1.0, 0.62 + clamp(puddleMask, 0.0, 1.0) * 0.09, pMaskRoad);
          fragColor = vec4(col, outAlpha);
        }
      `);

      // Explicit Material-ID Struct Shader (aUv.y = matId: 0=Steel, 1=StoneMasonry, 2=Timber, 3=TunnelConcrete, 4=Emissive, 5=Reflector)
      this.structProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aNrm;
        layout(location=2) in vec2 aUv;
        layout(location=3) in vec3 aCol;
        uniform mat4 uViewProj;
        out vec3 vWorldPos;
        out vec3 vNrm;
        out vec2 vUv;
        out vec3 vCol;
        void main() {
          vWorldPos = aPos; vNrm = aNrm; vUv = aUv; vCol = aCol;
          gl_Position = uViewProj * vec4(aPos, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vNrm;
        in vec2 vUv;
        in vec3 vCol;
        uniform sampler2D uStoneAlb;
        uniform sampler2D uStoneNrm;
        uniform sampler2D uBrickAlb;
        uniform sampler2D uBrickNrm;
        uniform sampler2D uWoodAlb;
        uniform sampler2D uWoodNrm;
        uniform sampler2D uRockAlb;
        uniform sampler2D uRockNrm;
        uniform sampler2D uGrassAlb;
        uniform sampler2D uGrassNrm;
        ${PV.PBR_GLSL}
        out vec4 fragColor;
        void main() {
          int matId = int(floor(vUv.y + 0.5));
          if (matId == 4) {
            fragColor = vec4(vCol, 1.0);
            return;
          }
          vec3 N = normalize(vNrm);
          vec3 V = normalize(uCamPos - vWorldPos);
          vec3 alb = vCol;
          float rough = 0.50, cc = 0.18, met = 0.10, ao = 0.92;

          if (matId == 0) {
            // Structural Painted/Weathered Steel Bridge Truss & Bolted Deck Tread Plates (rivets, diamond tread, mud grime — ZERO chrome glare!)
            float streak = pvNoise2(vec2((vWorldPos.x + vWorldPos.z) * 3.2, vWorldPos.y * 0.75));
            float rust = smoothstep(0.58, 0.84, pvFbm2(vWorldPos.xz * 0.55 + vec2(vWorldPos.y * 0.4, 1.7)));
            float rivet = smoothstep(0.84, 0.96, sin(vWorldPos.x * 18.0) * sin(vWorldPos.y * 18.0) * sin(vWorldPos.z * 18.0));
            alb = vCol * mix(0.82, 1.08, streak);
            alb = mix(alb, vec3(0.22, 0.10, 0.055), rust * 0.36);
            alb *= (1.0 + rivet * 0.14);
            if (N.y > 0.82) {
              // AAA Forged Industrial Diamond-Checker Steel Tread-Plate: crisp alternating 90° raised lozenges + hex bolts + mud grime (ZERO blurry sine dots!)
              vec2 dpUv = vWorldPos.xz * 14.5;
              vec2 cellId = floor(dpUv);
              vec2 cellF = fract(dpUv) - 0.5;
              float alt = mod(cellId.x + cellId.y, 2.0);
              vec2 loz = (alt > 0.5) ? cellF.xy : cellF.yx;
              float lozD = abs(loz.x) * 3.1 + abs(loz.y) * 1.15;
              float ribH = smoothstep(0.46, 0.22, lozD);
              vec2 ribGrad = (alt > 0.5 ? vec2(sign(loz.x) * 3.1, sign(loz.y) * 1.15) : vec2(sign(loz.y) * 1.15, sign(loz.x) * 3.1)) * smoothstep(0.48, 0.28, lozD) * smoothstep(0.10, 0.26, lozD);
              float plateSeam = smoothstep(0.0, 0.025, fract(vWorldPos.z * 0.45)) * smoothstep(1.0, 0.975, fract(vWorldPos.z * 0.45));
              float brushed = pvNoise2(vec2(vWorldPos.x * 48.0, vWorldPos.z * 6.5));
              float mudGrime = smoothstep(0.36, 0.74, pvFbm2(vWorldPos.xz * 0.95 + 3.1)) * (1.0 - ribH * 0.42);
              // Countersunk forged hex-bolt heads with dark rust rings near plate seams
              vec2 bCell = fract(vWorldPos.xz * vec2(2.6, 0.90)) - 0.5;
              float bDist = length(bCell);
              float bRing = smoothstep(0.14, 0.08, bDist);
              float bHead = smoothstep(0.075, 0.045, bDist);
              vec3 plateMetal = mix(vec3(0.075, 0.088, 0.102), vec3(0.165, 0.185, 0.205), ribH * 0.72 + brushed * 0.28);
              plateMetal = mix(plateMetal, vec3(0.20, 0.095, 0.048), rust * 0.48 + bRing * 0.35);
              alb = mix(plateMetal, vec3(0.105, 0.078, 0.052), mudGrime * 0.72) * (0.42 + 0.58 * plateSeam);
              alb = mix(alb, vec3(0.26, 0.28, 0.30), bHead * 0.90);
              N = normalize(N + vec3(ribGrad.x * 0.18 + (brushed - 0.5) * 0.08, 0.0, ribGrad.y * 0.18 + bHead * 0.25));
              rough = mix(mix(0.36, 0.22, ribH), 0.76, mudGrime);
              met = mix(0.56, 0.08, mudGrime);
              cc = mix(0.32, 0.06, mudGrime);
            } else {
              N = normalize(N + vec3((streak - 0.5) * 0.10, rivet * 0.18, (streak - 0.5) * 0.10));
              rough = mix(0.34, 0.58, rust);
              met = mix(0.62, 0.25, rust);
              cc = 0.28;
            }
          } else if (matId == 1) {
            // AAA 1024px Matte Weathered Irregular Alpine Granite Ashlar (bridge abutments, piers, tunnel portals — ZERO shiny plastic grid!)
            float horizCoord = vWorldPos.x * N.z - vWorldPos.z * N.x;
            vec2 suv = (abs(N.y) > 0.72) ? (vWorldPos.xz * 0.19) : vec2(horizCoord * 0.19, vWorldPos.y * 0.22);
            vec3 sAlb = texture(uStoneAlb, suv).rgb;
            vec4 sNrmT = texture(uStoneNrm, suv);
            vec3 sNrm = sNrmT.xyz * 2.0 - 1.0;
            float sH = sNrmT.a;
            float macroStone = pvFbm2(vWorldPos.xz * 0.18 + vec2(vWorldPos.y * 0.22, 3.4));
            float sWet = clamp(uWetness, 0.0, 1.0);
            float wetStreak = smoothstep(0.42, 0.84, pvNoise2(vec2(horizCoord * 1.45, vWorldPos.y * 0.36)));
            float mossPatch = smoothstep(0.34, 0.72, pvFbm2(vWorldPos.xz * 0.48 + vec2(vWorldPos.y * 0.28, 4.1))) * smoothstep(-0.20, 0.62, N.y + 0.42);
            alb = sAlb * mix(vec3(0.82), vCol * 2.9, 0.36) * mix(0.76, 1.14, macroStone);
            alb = mix(alb, vec3(0.052, 0.138, 0.046), mossPatch * (0.62 + (1.0 - sH) * 0.38));
            alb *= mix(0.96, 0.66, wetStreak * 0.52 * sWet);
            ao *= mix(0.56, 1.0, sH);
            N = normalize(N + vec3(sNrm.x * 0.52, sNrm.y * 0.42, sNrm.x * 0.52));
            rough = mix(mix(0.88, 0.64, sH), 0.44, wetStreak * sWet * 0.65);
            cc = mix(0.02, 0.16, wetStreak * sWet * sH);
            met = 0.0;
          } else if (matId == 6) {
            // AAA 512px PBR Aged Alpine Brick Masonry (tunnel retaining wing walls, viaduct arches, aged masonry)
            float horizCoord = vWorldPos.x * N.z - vWorldPos.z * N.x;
            vec2 buv = (abs(N.y) > 0.72) ? (vWorldPos.xz * 0.42) : vec2(horizCoord * 0.42, vWorldPos.y * 0.46);
            vec3 bAlb = texture(uBrickAlb, buv).rgb;
            vec4 bNrmT = texture(uBrickNrm, buv);
            vec3 bNrm = bNrmT.xyz * 2.0 - 1.0;
            float bH = bNrmT.a;
            float bWet = clamp(uWetness, 0.0, 1.0);
            float damp = smoothstep(0.32, 0.78, pvFbm2(vWorldPos.xz * 0.45 + vec2(vWorldPos.y * 0.3, 2.3)));
            float moss = smoothstep(0.45, 0.78, pvNoise2(vWorldPos.xz * 0.8 + 1.9)) * (1.0 - bH * 0.65);
            alb = bAlb * mix(vec3(0.92), vCol * 2.6, 0.25);
            alb = mix(alb, vec3(0.055, 0.135, 0.048), moss * 0.62);
            alb *= mix(1.0, 0.60, damp * 0.58 * bWet);
            ao *= mix(0.65, 1.0, bH);
            N = normalize(N + vec3(bNrm.x * 0.58, bNrm.y * 0.46, bNrm.x * 0.58));
            rough = mix(mix(0.90, 0.70, bH), 0.54, damp * bWet);
            cc = mix(0.0, 0.10, damp * bWet * bH);
            met = 0.0;
          } else if (matId == 5) {
            // True 3-Axis Triplanar Fractured Alpine Cliff Rock + Lush Mossy Turf (1:1 seamless match with terrain slopes!)
            vec3 triM = pow(abs(N), vec3(4.0));
            triM /= max(triM.x + triM.y + triM.z, 1e-4);
            vec2 rX = vWorldPos.zy * vec2(0.24, 0.28);
            vec2 rY = vWorldPos.xz * 0.22;
            vec2 rZ = vWorldPos.xy * vec2(0.24, 0.28);
            vec3 rockTex = texture(uRockAlb, rX).rgb * triM.x + texture(uRockAlb, rY).rgb * triM.y + texture(uRockAlb, rZ).rgb * triM.z;
            vec4 rnhM = texture(uRockNrm, rX) * triM.x + texture(uRockNrm, rY) * triM.y + texture(uRockNrm, rZ) * triM.z;
            vec3 rockNrm = normalize(rnhM.xyz * 2.0 - 1.0);
            float rockHM = rnhM.a;
            vec3 grassTex = mix(texture(uGrassAlb, vWorldPos.xz / 13.5).rgb, texture(uGrassAlb, vWorldPos.xz / 4.2).rgb, 0.64);
            vec3 grassNrm = texture(uGrassNrm, vWorldPos.xz / 4.2).xyz * 2.0 - 1.0;
            float strata = 0.5 + 0.5 * sin(vWorldPos.y * 3.2 + pvFbm2(vWorldPos.xz * 0.24) * 4.4);
            float cragM = pvFbm2(vec2((vWorldPos.x + vWorldPos.z) * 0.30, vWorldPos.y * 0.46));
            // Expose craggy stratified basalt cliffs above tunnel portals (only upper crest N.y > 0.58 carries mossy turf!)
            float topGrass = smoothstep(0.58, 0.86, N.y + (cragM - 0.46) * 0.38);
            vec3 rockCol = mix(vec3(0.055, 0.064, 0.072), vec3(0.185, 0.195, 0.198), clamp(rockTex.r * 0.58 + strata * 0.24 + cragM * 0.24, 0.0, 1.0)) * (0.66 + 0.34 * smoothstep(0.18, 0.58, rockHM));
            vec3 grassCol = grassTex * mix(vec3(0.45, 0.72, 0.38), vec3(0.95, 1.08, 0.54), smoothstep(0.25, 0.78, cragM));
            alb = mix(rockCol, grassCol, topGrass * 0.78);
            float mWet = clamp(uWetness, 0.0, 1.0);
            alb *= mix(1.0, 0.76, mWet * (1.0 - topGrass * 0.45));
            vec3 nPert = mix(rockNrm * 0.85, grassNrm * 0.58, topGrass);
            N = normalize(N + vec3(nPert.x, nPert.y * 0.38, nPert.y * 0.72));
            rough = mix(mix(0.82, 0.64, mWet), 0.92, topGrass);
            cc = mix(0.08 * mWet, 0.02, topGrass);
            met = 0.0;
          } else if (matId == 2) {
            // AAA 512px PBR Weathered Rain-Soaked Alpine Timber (guardrails, ranch fences, bridge curbs & beams)
            float horizCoord = vWorldPos.x * N.z - vWorldPos.z * N.x;
            vec2 wuv = (abs(N.y) > 0.72) ? (vWorldPos.xz * 0.46) : vec2(horizCoord * 0.46, vWorldPos.y * 0.52);
            vec3 wAlb = texture(uWoodAlb, wuv).rgb;
            vec4 wNrmT = texture(uWoodNrm, wuv);
            vec3 wNrm = wNrmT.xyz * 2.0 - 1.0;
            float wH = wNrmT.a;
            float wWet = clamp(uWetness, 0.0, 1.0);
            float algae = smoothstep(0.52, 0.84, pvNoise2(vWorldPos.xz * 0.75 + 5.1));
            bool isVermilion = (vCol.r > 0.65 && vCol.g < 0.22);
            if (isVermilion) {
              // Weathered shrine vermilion lacquer over cedar wood-grain + subtle chipped-paint patina & base moss!
              float grain = smoothstep(0.18, 0.86, wAlb.r);
              float wear = smoothstep(0.62, 0.88, pvFbm2(vWorldPos.xz * 1.4 + vec2(vWorldPos.y * 0.65, 3.7)));
              vec3 rawCedar = vec3(0.28, 0.16, 0.10) * (0.75 + 0.45 * grain);
              alb = mix(vCol * (0.78 + 0.38 * grain), rawCedar, wear * 0.34);
              alb = mix(alb, vec3(0.06, 0.15, 0.05), algae * 0.26 * smoothstep(2.4, 0.2, vWorldPos.y));
              alb *= mix(1.0, 0.74, wWet * 0.42);
            } else {
              alb = wAlb * mix(vec3(0.85), vCol * 3.8, 0.36);
              alb = mix(alb, vec3(0.06, 0.14, 0.05), algae * 0.35);
              alb *= mix(1.0, 0.68, wWet * 0.55);
            }
            ao *= mix(0.68, 1.0, wH);
            N = normalize(N + vec3(wNrm.x * 0.40, wNrm.y * 0.32, wNrm.x * 0.40));
            rough = mix(mix(0.66, 0.38, wH), 0.16, wWet);
            cc = mix(0.10, 0.64, wWet * wH);
            met = 0.0;
          } else if (matId == 3) {
            // AAA High-Detail Smooth Tunnel Vault + 2-Step POM Height Parallax (concrete panel reliefs, glazed ceramic tiles & wet seepage!)
            float along = vCol.r;
            vec3 baseConcreteCol = vec3(vCol.g, vCol.b, vCol.b + 0.01);
            float arcH = clamp(vUv.x, 0.0, 1.0); // Smoothly interpolated 0 (curb) -> 1 (crown)
            // 2-Step POM Parallax Offset along tunnel wall tangent
            float tViewDist = length(uCamPos - vWorldPos);
            float tPomFade = smoothstep(38.0, 6.0, tViewDist);
            vec2 tPomShift = vec2(0.0);
            if (tPomFade > 0.01) {
              float vAlong = dot(V, normalize(vec3(N.z, 0.0, -N.x) + vec3(1e-5, 0.0, 0.0)));
              float h0 = texture(uStoneNrm, vec2(along * 0.22, arcH * 2.4)).a;
              vec2 p1 = vec2(along * 0.22, arcH * 2.4) - vec2(vAlong, V.y) * (0.5 - h0) * 0.032 * tPomFade;
              float h1 = texture(uStoneNrm, p1).a;
              tPomShift = -vec2(vAlong, V.y) * (0.5 - (h0 * 0.45 + h1 * 0.55)) * 0.048 * tPomFade;
            }
            float alongP = along + tPomShift.x * 2.2;
            float arcHP = clamp(arcH + tPomShift.y * 0.22, 0.0, 1.0);
            vec2 vaultUv = vec2(alongP * 0.22, arcHP * 2.4);
            vec3 vStoneAlb = texture(uStoneAlb, vaultUv).rgb;
            vec4 vStoneNrmT = texture(uStoneNrm, vaultUv);
            vec3 vStoneNrm = vStoneNrmT.xyz * 2.0 - 1.0;
            float vStoneH = vStoneNrmT.a;
            // Cast-in-place concrete formwork panel seams + recessed tie-rod bolt holes
            float panelZ = fract(alongP * 0.28);
            float panelY = fract(arcHP * 6.0);
            float jointZ = smoothstep(0.0, 0.028, panelZ) * smoothstep(1.0, 0.972, panelZ);
            float jointY = smoothstep(0.0, 0.028, panelY) * smoothstep(1.0, 0.972, panelY);
            float tieHole = smoothstep(0.055, 0.02, length(vec2(panelZ - 0.5, (panelY - 0.5) * 0.65)));
            float concGrain = pvFbm2(vec2(alongP * 2.2, arcHP * 12.0));
            float seep = smoothstep(0.40, 0.80, pvFbm2(vec2(alongP * 1.45, arcHP * 2.8)));
            float stainDrip = smoothstep(0.52, 0.84, pvNoise2(vec2(alongP * 3.4, arcHP * 1.6))) * smoothstep(0.95, 0.35, arcHP);
            float soot = smoothstep(0.62, 0.98, arcHP) * 0.34;
            // Lower glazed ceramic square-tile dado wall (arcH < 0.42, 1:1 隧道内.jpg off-white tiles + curb moss!)
            float tileBand = smoothstep(0.43, 0.405, arcHP);
            float tileCap = smoothstep(0.020, 0.004, abs(arcHP - 0.415));
            float tileRow = floor(arcHP * 26.0);
            float tileV = fract(arcHP * 26.0);
            float tileUCoord = alongP * 2.8;
            float tileCol = floor(tileUCoord);
            float tileU = fract(tileUCoord);
            float groutV = smoothstep(0.0, 0.09, tileV) * smoothstep(1.0, 0.91, tileV);
            float groutU = smoothstep(0.0, 0.08, tileU) * smoothstep(1.0, 0.92, tileU);
            float tileGrout = groutU * groutV;
            float tileVar = pvHash21(vec2(tileCol, tileRow));
            float bevU = (tileU < 0.5 ? 1.0 : -1.0) * (1.0 - smoothstep(0.08, 0.22, min(tileU, 1.0 - tileU)));
            float bevV = (tileV < 0.5 ? 1.0 : -1.0) * (1.0 - smoothstep(0.09, 0.24, min(tileV, 1.0 - tileV)));
            vec3 concrete = mix(baseConcreteCol * 1.18, vStoneAlb * vec3(0.92, 0.90, 0.84), 0.56)
                          * mix(0.72, 1.12, concGrain) * (0.68 + 0.32 * jointZ * jointY) * (1.0 - tieHole * 0.45) * (1.0 - soot);
            // Rich weathered water seepage, rust stains & moss streaks dripping down tunnel arch & lower ceramic tile dado (1:1 隧道内.jpg!)
            float rustStreak = smoothstep(0.54, 0.86, pvFbm2(vec2(alongP * 2.1, arcHP * 0.95)));
            concrete = mix(concrete, vec3(0.11, 0.09, 0.065), stainDrip * 0.58);
            concrete = mix(concrete, vec3(0.06, 0.11, 0.055), rustStreak * smoothstep(0.65, 0.38, arcHP) * 0.42);
            float tileGrime = smoothstep(0.28, 0.02, arcHP) * (0.45 + 0.55 * pvFbm2(vec2(alongP * 1.8, arcHP * 4.5)));
            vec3 tileBase = mix(vec3(0.46, 0.48, 0.45), vec3(0.58, 0.59, 0.54), tileVar);
            tileBase = mix(tileBase, vec3(0.07, 0.11, 0.06), tileGrime * 0.58);
            vec3 tiles = mix(vec3(0.075, 0.082, 0.088), tileBase, tileGrout);
            float curbMoss = smoothstep(0.15, 0.02, arcH) * smoothstep(0.56, 0.84, pvFbm2(vec2(along * 1.2, arcH * 6.5)));
            float curbGrime = smoothstep(0.14, 0.01, arcH);
            tiles = mix(tiles, vec3(0.09, 0.085, 0.075), curbGrime * 0.62);
            tiles = mix(tiles, vec3(0.055, 0.105, 0.042), curbMoss * 0.65);
            alb = mix(concrete, tiles, tileBand * 0.96);
            alb = mix(alb, vec3(0.12, 0.13, 0.15), tileCap * 0.85);
            alb *= mix(1.0, 0.62, seep * 0.56);
            ao *= mix(0.68, 1.0, mix(vStoneH, tileGrout, tileBand));
            N = normalize(N + vec3(bevU * 0.16 * tileBand + vStoneNrm.x * 0.34 * (1.0 - tileBand),
                                   bevV * 0.16 * tileBand + vStoneNrm.y * 0.24 * (1.0 - tileBand),
                                   vStoneNrm.x * 0.22 * (1.0 - tileBand)));
            rough = mix(mix(0.64, 0.38, vStoneH), 0.12, max(seep * 0.72, tileBand * tileGrout * 0.92));
            cc = mix(0.12, 0.76, max(seep * 0.62, tileBand * tileGrout * 0.88));
            met = 0.0;
            float lampCycle = abs(fract(along / 13.0) - 0.5) * 13.0;
            float lampPool = exp(-lampCycle * lampCycle * 0.055);
            float crownWarm = smoothstep(0.48, 1.0, arcH) * 0.45 + 0.55;
            // Round 18: Natural balanced sodium-vapor tunnel illumination (less orange oversaturation on wet exit asphalt!)
            vec3 tCol = alb * (0.22 + vec3(1.12, 0.84, 0.48) * lampPool * 1.28 * crownWarm);
            float tileSpec = pow(max(dot(reflect(-V, N), normalize(vec3(0.0, 0.76, 0.65))), 0.0), 36.0) * tileBand * tileGrout * lampPool;
            tCol += vec3(1.25, 0.86, 0.42) * tileSpec * 0.62;
            tCol += evalCarHeadlights(vWorldPos, N, V, alb, rough) * 1.65;
            tCol = applyFog(tCol, vWorldPos);
            fragColor = vec4(tCol, 1.0);
            return;
          } else if (matId == 8) {
            // Crisp Retro-Reflective Safety Sign / Guardrail Delineator
            alb = vCol;
            rough = 0.18;
            cc = 0.65;
            met = 0.15;
          } else if (matId == 7) {
            // Organic Mid-Lake Rocky Island (wet dark granite shoreline + craggy basalt cliff + mossy emerald turf crown!)
            vec2 rUvXZ = vWorldPos.xz * 0.18;
            vec2 rUvSide = vec2((vWorldPos.x + vWorldPos.z) * 0.20, vWorldPos.y * 0.26);
            vec2 rUv = mix(rUvSide, rUvXZ, smoothstep(0.45, 0.82, abs(N.y)));
            vec3 rTex = texture(uRockAlb, rUv).rgb;
            vec3 rNrm = texture(uRockNrm, rUv).xyz * 2.0 - 1.0;
            vec3 gTex = texture(uGrassAlb, vWorldPos.xz * 0.22).rgb;
            vec3 gNrm = texture(uGrassNrm, vWorldPos.xz * 0.22).xyz * 2.0 - 1.0;
            float hAboveLake = vWorldPos.y - vCol.r;
            float strata = pvFbm2(vec2((vWorldPos.x + vWorldPos.z) * 0.22, vWorldPos.y * 0.52));
            float crownMask = smoothstep(0.38, 0.72, N.y + (strata - 0.5) * 0.25) * smoothstep(1.2, 3.0, hAboveLake);
            float wetSplash = 1.0 - smoothstep(-0.2, 1.35, hAboveLake);
            vec3 cragRock = rTex * mix(vec3(0.42, 0.45, 0.48), vec3(0.76, 0.78, 0.76), strata);
            vec3 lushCrown = gTex * vec3(0.66, 0.96, 0.62);
            alb = mix(cragRock, lushCrown, crownMask * 0.88);
            alb *= mix(1.0, 0.44, wetSplash * 0.85);
            vec3 nPert = mix(rNrm * 0.65, gNrm * 0.36, crownMask);
            N = normalize(N + vec3(nPert.x, nPert.y * 0.32, nPert.y * 0.60));
            rough = mix(mix(0.60, 0.14, wetSplash), 0.76, crownMask);
            cc = mix(0.14 + 0.58 * wetSplash, 0.04, crownMask);
            met = 0.0;
          }

          float shadowVal = sampleShadowPCF(vWorldPos, N);
          vec3 col = evalPBR(vWorldPos, N, V, alb, rough, met, ao, cc, shadowVal);
          col += evalCarHeadlights(vWorldPos, N, V, alb, rough);
          col = applyFog(col, vWorldPos);
          fragColor = vec4(col, 1.0);
        }
      `);

      // Dedicated Animated 3D Lake Water / Cliffside Cloud-Sea / Hydro Dam Spillway Mist Shader
      this.waterProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aNrm;
        layout(location=2) in vec2 aUv;
        layout(location=3) in vec3 aCol;
        uniform mat4 uViewProj;
        uniform float uTime;
        uniform float uWaterMode;
        uniform vec2 uOriginOffset;
        out vec3 vWorldPos;
        out vec3 vNrm;
        out vec2 vUv;
        out vec3 vCol;
        out float vWaveH;
        void main() {
          vec3 p = aPos;
          float wH = 0.0;
          if (uWaterMode < 0.5) {
            // Subtle organic multi-frequency swell displacement (low amplitude to avoid mesh grid faceting!)
            vec2 wp = p.xz + uOriginOffset;
            float isRiver = aCol.g;
            float shoreDist = isRiver > 0.5 ? (1.0 - abs(aUv.x * 2.0 - 1.0)) : aUv.x;
            float shoreAmp = smoothstep(0.02, 0.22, shoreDist) * (isRiver > 0.5 ? 0.55 : (1.0 - smoothstep(0.86, 1.0, aUv.x)));
            float g1 = sin(dot(wp, vec2(0.073, 0.051)) + uTime * 1.05) * 0.085;
            float g2 = sin(dot(wp, vec2(-0.049, 0.092)) - uTime * 1.32) * 0.062;
            float g3 = sin(dot(wp, vec2(0.118, -0.077)) + uTime * 1.68) * 0.036;
            wH = (g1 + g2 + g3) * shoreAmp;
            p.y += wH;
          }
          vWorldPos = p; vNrm = aNrm; vUv = aUv; vCol = aCol; vWaveH = wH;
          gl_Position = uViewProj * vec4(p, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vNrm;
        in vec2 vUv;
        in vec3 vCol;
        in float vWaveH;
        uniform float uWaterMode; // 0 = Alpine Lake Water, 1 = Cliffside Cloud Sea, 2 = Dam Spillway Mist/Cascade
        uniform float uThemeId;
        uniform vec2 uOriginOffset;
        ${PV.PBR_GLSL}
        // Golden-Angle Rotated Domain-Warped Water Height (mathematically ZERO regular grid / crosshatch!)
        float waterHeightOrganic(vec2 p, float t, float detailW) {
          const mat2 rotG = mat2(0.80, 0.60, -0.60, 0.80);
          vec2 q = p * 0.18;
          float h = 0.0;
          float amp = 0.44;
          vec2 w = vec2(pvNoise2(q * 0.65 + vec2(t * 0.14, -t * 0.11)), pvNoise2(q * 0.65 + vec2(-t * 0.12 + 4.3, t * 0.15 + 1.9))) - 0.5;
          q += w * 1.35;
          h += (pvNoise2(q * vec2(1.0, 1.55) + vec2(t * 0.28, -t * 0.19)) - 0.5) * amp;
          q = rotG * q * 1.92; amp *= 0.52;
          h += (pvNoise2(q * vec2(1.15, 1.65) + vec2(-t * 0.36, t * 0.27) + 7.1) - 0.5) * amp;
          q = rotG * q * 2.04; amp *= 0.50;
          h += (pvNoise2(q * vec2(1.20, 1.50) + vec2(t * 0.48, t * 0.34) + 13.7) - 0.5) * amp;
          if (detailW > 0.02) {
            q = rotG * q * 2.12; amp *= 0.48 * detailW;
            h += (pvNoise2(q + vec2(-t * 0.68, t * 0.52) + 21.4) - 0.5) * amp;
            q = rotG * q * 2.18; amp *= 0.46;
            h += (pvNoise2(q + vec2(t * 0.92, -t * 0.74) + 33.9) - 0.5) * amp;
          }
          return h;
        }
        out vec4 fragColor;
        void main() {
          vec3 V = normalize(uCamPos - vWorldPos);
          if (uWaterMode < 0.5) {
            // === NEXT-GEN GRID-FREE ORGANIC WATER (5-octave rotated FBM ripples + crisp mirror Fresnel reflections + turquoise Beer-Lambert refraction!) ===
            vec2 wp = vWorldPos.xz + uOriginOffset;
            float viewDist = length(uCamPos - vWorldPos);
            float detailFade = smoothstep(68.0, 12.0, viewDist);
            float isRiver = vCol.g;
            vec2 flowShift = isRiver > 0.5 ? vec2(uTime * 1.45, -uTime * 0.65) : vec2(uTime * 0.14, -uTime * 0.09);
            vec2 warp = vec2(
              pvFbm2(wp * 0.028 + flowShift * 0.28),
              pvFbm2(wp * 0.028 - flowShift * 0.22 + 6.7)
            ) - 0.5;
            // Wind-gust calmness patches (glassy mirror streaks alternating with rippled wind-chop)
            float windPatch = mix(0.32, 1.18, smoothstep(0.24, 0.78, pvFbm2(wp * 0.022 + warp * 1.3 + flowShift * 0.18)));
            float eps = mix(0.18, 0.95, smoothstep(10.0, 140.0, viewDist));
            vec2 pW = wp + flowShift * 2.2;
            float hC = waterHeightOrganic(pW, uTime, detailFade);
            float hX = waterHeightOrganic(pW + vec2(eps, 0.0), uTime, detailFade);
            float hZ = waterHeightOrganic(pW + vec2(0.0, eps), uTime, detailFade);
            vec2 dH = vec2(hX - hC, hZ - hC) / eps * (0.48 * windPatch * mix(1.0, 0.38, smoothstep(25.0, 160.0, viewDist)));
            float waveHeight = vWaveH * 2.4 + hC * 1.25;
            // 2-Octave Fine & Sparse Expanding Raindrop Ripples on Water
            float rainRingSparkle = 0.0;
            float rainStrength = smoothstep(0.14, 0.78, uWetness);
            if (rainStrength > 0.02 && viewDist < 62.0) {
              float rFade = smoothstep(62.0, 10.0, viewDist) * rainStrength;
              // Octave A: 3x3 sparse delicate concentric rings
              vec2 rp1 = wp * 1.10;
              vec2 rc1 = floor(rp1), rf1 = fract(rp1);
              for (int dy = -1; dy <= 1; dy++) {
                for (int dx = -1; dx <= 1; dx++) {
                  vec2 cell = rc1 + vec2(float(dx), float(dy));
                  float rh = pvHash21(cell + 19.3);
                  if (rh < 0.72) continue;
                  float ph = fract(uTime * (0.92 + rh * 0.36) + rh * 6.7);
                  vec2 rd = rf1 - (vec2(float(dx), float(dy)) + 0.22 + 0.56 * vec2(pvHash21(cell + 2.7), pvHash21(cell + 8.1)));
                  float rDist = length(rd) + 1e-4;
                  float ringR = ph * 0.54;
                  float env = pow(1.0 - ph, 1.55) * smoothstep(0.0, 0.08, ph);
                  float w1 = exp(-pow((rDist - ringR) / 0.030, 2.0)) * env;
                  float w2 = exp(-pow((rDist - ringR * 0.58) / 0.020, 2.0)) * env * 0.55;
                  dH += (rd / rDist) * sin((rDist - ringR) * 52.0) * (w1 + w2) * 0.28 * rFade;
                  rainRingSparkle += (w1 * 0.48 + w2 * 0.24) * rFade;
                }
              }
              // Octave B: sparse tiny pin-drop splashes
              vec2 rp2 = wp * 2.35;
              vec2 rc2 = floor(rp2), rf2 = fract(rp2);
              float rh2 = pvHash21(rc2 + 61.7);
              if (rh2 >= 0.74) {
                float ph2 = fract(uTime * (1.38 + rh2 * 0.42) + rh2 * 5.9);
                vec2 rd2 = rf2 - (0.24 + 0.52 * vec2(pvHash21(rc2 + 11.4), pvHash21(rc2 + 29.1)));
                float rDist2 = length(rd2) + 1e-4;
                float ring2 = exp(-pow((rDist2 - ph2 * 0.34) / 0.026, 2.0)) * pow(1.0 - ph2, 1.4);
                dH += (rd2 / rDist2) * sin((rDist2 - ph2 * 0.34) * 68.0) * ring2 * 0.16 * rFade;
                rainRingSparkle += ring2 * 0.28 * rFade;
              }
            }
            vec3 N = normalize(vec3(-dH.x * 1.12, 1.0, -dH.y * 1.12));
            float NdotV = max(dot(N, V), 0.02);
            float waveCrest = smoothstep(-0.35, 0.48, waveHeight);

            // Physically-grounded Schlick Fresnel (F0=0.03 -> crystal clear shallow look-down, vivid mirror reflections at grazing!)
            float fres = clamp(0.03 + 0.92 * pow(1.0 - NdotV, 4.0), 0.03, 0.94);
            vec3 R = reflect(-V, N);
            R.y = max(R.y, 0.005);
            // Rich Multi-Layer Sky, Sun-Horizon Glow & Volumetric Cloud Reflection
            vec3 zenithRefl = mix(vec3(0.09, 0.19, 0.36), uFogColor * 0.72, 0.35) * (0.78 + 0.30 * uLightColor);
            vec3 horizRefl  = mix(uFogColor * 1.08, uLightColor * vec3(1.14, 0.96, 0.78), 0.42);
            vec3 skyRefl = mix(horizRefl, zenithRefl, smoothstep(0.02, 0.44, R.y));
            float sunAlign = max(dot(R, normalize(uLightDir)), 0.0);
            skyRefl += uLightColor * vec3(1.22, 0.96, 0.68) * pow(sunAlign, 5.5) * 0.56;
            vec2 cloudUv = R.xz / (R.y + 0.22) * 0.95 + vec2(uTime * 0.010, -uTime * 0.007);
            float cloudRefl = smoothstep(0.42, 0.80, pvFbm2(cloudUv) * 0.7 + pvFbm2(cloudUv * 2.3 + 4.1) * 0.3);
            vec3 cloudCol = mix(uFogColor * 0.85, vec3(0.96, 0.94, 0.88) * (0.75 + 0.35 * uLightColor), 0.55 + 0.45 * pow(sunAlign, 2.0));
            skyRefl = mix(skyRefl, cloudCol, cloudRefl * 0.52 * smoothstep(0.04, 0.34, R.y));

            // High-Detail Organic FBM Alpine Mountain Peaks & Layered Shoreline Forest Reflections (ZERO sine spikes!)
            float az = atan(R.x, R.z) + dH.x * 0.42;
            vec2 azCoord = vec2(cos(az), sin(az));
            float mtnFbm = pvFbm2(azCoord * 2.4 + 1.3) * 0.14 + pvFbm2(azCoord * 6.2 + 5.7) * 0.055;
            float mtnRidge = 0.08 + mtnFbm;
            float mtnSnow = smoothstep(mtnRidge - 0.032, mtnRidge - 0.006, R.y + dH.y * 0.18);
            float treeFbm = pvFbm2(azCoord * 18.0 + 3.1) * 0.042 + pvNoise2(azCoord * 42.0) * 0.018;
            float treeBand = mtnRidge * 0.56 + treeFbm;
            float yDistort = R.y + dH.y * 0.22;
            float isMtn = smoothstep(mtnRidge + 0.014, mtnRidge - 0.008, yDistort);
            float isForest = smoothstep(treeBand + 0.012, treeBand - 0.006, yDistort);
            float shoreTreeRefl = (1.0 - smoothstep(0.02, 0.42, vUv.x)) * smoothstep(0.28, 0.82, pvFbm2(wp * 0.09 + vec2(0.0, dH.y * 1.8))) * (1.0 - isRiver);
            float forestMask = clamp(max(isForest * (0.78 + 0.22 * waveCrest), shoreTreeRefl * 0.86), 0.0, 1.0);
            vec3 mtnBase = mix(vec3(0.035, 0.078, 0.155), vec3(0.11, 0.18, 0.28), smoothstep(0.02, mtnRidge, yDistort));
            vec3 mtnCol = mix(mtnBase, vec3(0.68, 0.74, 0.82), mtnSnow * 0.68) * (0.74 + 0.36 * uLightColor);
            vec3 forestCol = mix(vec3(0.014, 0.054, 0.038), vec3(0.055, 0.135, 0.078), waveCrest * 0.55 + pvNoise2(azCoord * 14.0) * 0.45) * (0.74 + 0.34 * uLightColor);
            vec3 envRefl = mix(skyRefl, mtnCol, isMtn * 0.92);
            envRefl = mix(envRefl, forestCol, forestMask * 0.94);

            float shoreDist = isRiver > 0.5 ? (1.0 - abs(vUv.x * 2.0 - 1.0)) : vUv.x;
            float waterDepthM = clamp(pow(shoreDist, 1.35) * (isRiver > 0.5 ? 7.5 : 16.0), 0.04, 16.0);
            vec2 refractWp = wp + N.xz * clamp(waterDepthM * 0.26, 0.08, 0.95);
            float sandTone = pvFbm2(refractWp * 0.38);
            float cobble = pvNoise2(refractWp * 3.2) * 0.55 + pvNoise2(refractWp * 8.4 + 2.7) * 0.45;
            float subRock = smoothstep(0.64, 0.82, pvFbm2(refractWp * 0.26 + 4.1));
            // Domain-warped organic Voronoi-like FBM water caustics (ZERO checkerboard square grid artifacts!)
            vec2 cUv1 = mat2(0.82, 0.57, -0.57, 0.82) * (refractWp * 0.62) + warp * 0.55 + vec2(uTime * 0.24, -uTime * 0.18);
            vec2 cUv2 = mat2(0.60, -0.80, 0.80, 0.60) * (refractWp * 0.96) - warp * 0.40 + vec2(-uTime * 0.20, uTime * 0.27);
            float r1 = 1.0 - abs(pvFbm2(cUv1) * 2.0 - 1.0);
            float r2 = 1.0 - abs(pvFbm2(cUv2) * 2.0 - 1.0);
            float caustic = pow(clamp(r1 * r2, 0.0, 1.0), 3.6) * exp(-waterDepthM * 0.38) * detailFade * 1.35;
            vec3 sandyBed = mix(vec3(0.16, 0.15, 0.11), vec3(0.26, 0.24, 0.18), sandTone * 0.58 + cobble * 0.42);
            vec3 bedCol = mix(sandyBed, vec3(0.035, 0.075, 0.080), subRock * 0.86) * (0.72 + 0.32 * uLightColor);
            bedCol += vec3(0.26, 0.48, 0.44) * uLightColor * caustic * 1.25;

            vec3 transmittance = exp(-waterDepthM * vec3(0.68, 0.26, 0.18));
            // Biome-Aware Lake Water: Winter Glacial Sapphire-Ice (t=1), Autumn Mirror Slate-Teal (t=4), Kyoto Jade (t=6), Emerald Alpine (default)
            float isWinterLake = float(abs(uThemeId - 1.0) < 0.5);
            float isAutumnLake = float(abs(uThemeId - 4.0) < 0.5);
            float isShrineLake = float(abs(uThemeId - 6.0) < 0.5);
            vec3 shallowJade = mix(vec3(0.055, 0.265, 0.260), vec3(0.18, 0.38, 0.46), isWinterLake);
            shallowJade = mix(shallowJade, vec3(0.09, 0.22, 0.20), isAutumnLake * 0.65);
            shallowJade = mix(shallowJade, vec3(0.05, 0.27, 0.22), isShrineLake * 0.70);
            vec3 midTealBlue = mix(vec3(0.016, 0.110, 0.210), vec3(0.042, 0.165, 0.295), isWinterLake);
            vec3 deepOcean   = mix(vec3(0.008, 0.036, 0.105), vec3(0.018, 0.068, 0.165), isWinterLake);
            vec3 scatterCol = mix(mix(shallowJade, midTealBlue, smoothstep(0.03, 0.26, shoreDist)), deepOcean, smoothstep(0.20, 0.68, shoreDist));
            // Sunlit Subsurface Wave Scatter + Winter Glacial Ice-Crystal Rim!
            float waveSSS = pow(clamp(dot(V, -uLightDir) * 0.5 + 0.5, 0.0, 1.0), 2.4) * waveCrest * 0.52;
            scatterCol = (scatterCol + mix(vec3(0.045, 0.16, 0.15), vec3(0.12, 0.24, 0.34), isWinterLake) * waveSSS) * (0.78 + 0.36 * uLightColor);
            vec3 waterBody = mix(scatterCol, bedCol, transmittance);
            // Winter shoreline frost-ice shelf (crisp crystalline white-blue rim hugging the snowy bank!)
            if (isWinterLake > 0.5 && isRiver < 0.5) {
              float iceNoise = pvFbm2(wp * 0.85 + vec2(3.1, -2.4));
              float iceShelf = (1.0 - smoothstep(0.01, 0.14 + iceNoise * 0.08, shoreDist)) * smoothstep(0.28, 0.68, iceNoise);
              vec3 iceCol = mix(vec3(0.68, 0.80, 0.90), vec3(0.94, 0.96, 0.99), smoothstep(0.35, 0.78, iceNoise)) * (0.82 + 0.24 * uLightColor);
              waterBody = mix(waterBody, iceCol, iceShelf * 0.82);
            }
            vec3 col = mix(waterBody, envRefl, fres * mix(0.38, 0.94, smoothstep(0.0, 0.26, shoreDist)));

            vec3 sunDirW = normalize(vec3(uLightDir.x, max(uLightDir.y, 0.24), uLightDir.z));
            vec3 H = normalize(V + sunDirW);
            float ndh = max(dot(N, H), 0.0);
            float specSharp = pow(ndh, 190.0) * 2.25 + pow(ndh, 46.0) * 0.42;
            // Rotated organic sun-path sparkle glints (ZERO axis-aligned grid dots!)
            vec2 spUv = mat2(0.80, 0.60, -0.60, 0.80) * wp * 3.4 + dH * 18.0;
            float microGlint = smoothstep(0.62, 0.88, pvNoise2(spUv + vec2(uTime * 0.72, -uTime * 0.48))) * pow(ndh, 18.0) * 1.45;
            vec3 sunTint = mix(vec3(1.00, 0.95, 0.84), uLightColor * 1.24, 0.50);
            col += sunTint * min(specSharp + microGlint, 1.75);
            col += mix(vec3(0.86, 0.94, 0.98), sunTint, 0.30) * clamp(rainRingSparkle, 0.0, 0.85) * 0.58;

            float foamNoise = pvFbm2(wp * 1.85 + flowShift * 0.6);
            float foamWave = sin((shoreDist + warp.x * 0.06) * 44.0 - uTime * 2.8 + foamNoise * 6.5) * 0.5 + 0.5;
            float shoreFoam = (1.0 - smoothstep(0.0, 0.042, shoreDist)) * smoothstep(0.38, 0.78, foamWave * 0.58 + foamNoise * 0.64);
            float riverRiffle = isRiver * smoothstep(0.66, 0.88, foamNoise * 0.7 + waveCrest * 0.35) * 0.38;
            col = mix(col, vec3(0.88, 0.92, 0.93) * (0.76 + 0.22 * uLightColor), clamp(shoreFoam * 0.58 + riverRiffle, 0.0, 0.72));

            float farEdgeMist = isRiver > 0.5 ? 0.0 : smoothstep(0.74, 0.99, vUv.x);
            col = mix(col, applyFog(col, vWorldPos), clamp(0.34 + farEdgeMist * 0.62, 0.0, 0.94));
            float coveFade = clamp(vCol.r, 0.0, 1.0) * (isRiver > 0.5 ? 1.0 : (1.0 - smoothstep(0.90, 1.0, vUv.x)));
            float alpha = mix(0.28, 0.97, smoothstep(0.0, 0.22, shoreDist)) * smoothstep(0.0, 0.025, shoreDist) * coveFade;
            fragColor = vec4(col, alpha);
            return;
          } else if (uWaterMode < 1.5) {
            // === POETIC NEGATIVE-SPACE VOLUMETRIC CLOUD SEA (Zero hard polygon edges, soft wispy FBM valley mist!) ===
            vec2 cp = (vWorldPos.xz + uOriginOffset) * 0.017 + vec2(uTime * 0.012, -uTime * 0.008);
            vec2 cWarp = vec2(pvFbm2(cp * 0.8 + 1.7), pvFbm2(cp * 0.8 - 4.2)) - 0.5;
            float c1 = pvFbm2(cp + cWarp * 0.95);
            float c2 = pvFbm2(cp * 2.3 + cWarp * 0.45 - vec2(uTime * 0.016, 0.0));
            float billow = c1 * 0.64 + c2 * 0.36;
            float bX = pvFbm2(cp + cWarp * 0.95 + vec2(0.08, 0.0));
            float bZ = pvFbm2(cp + cWarp * 0.95 + vec2(0.0, 0.08));
            vec3 cNrm = normalize(vec3((c1 - bX) * 3.8, 1.0, (c1 - bZ) * 3.8));
            float sunLit = clamp(dot(cNrm, normalize(uLightDir)) * 0.5 + 0.5, 0.0, 1.0);
            float wisp = smoothstep(0.32, 0.82, billow);
            float coveC = clamp(vCol.r, 0.0, 1.0);
            // Wide feathered inner & outer dissolution so cloud banks NEVER show a straight ribbon border!
            float edgeFade = coveC * smoothstep(0.02, 0.30, vUv.x) * smoothstep(1.0, 0.42, vUv.x);
            vec3 shadowCloud = mix(uFogColor * 0.72, vec3(0.28, 0.36, 0.46), 0.32);
            vec3 sunlitCloud = mix(uFogColor * 1.02, vec3(0.97, 0.96, 0.93) * (0.76 + 0.32 * uLightColor), 0.58);
            vec3 cloudCol = mix(shadowCloud, sunlitCloud, clamp(sunLit * 0.60 + wisp * 0.40, 0.0, 1.0));
            cloudCol = mix(cloudCol, applyFog(cloudCol, vWorldPos), 0.46);
            fragColor = vec4(cloudCol, wisp * edgeFade * 0.68);
            return;
          } else {
            // === CLIFFSIDE ABYSS VOLUMETRIC CLOUD SEA (Enhanced sunlit billow rim!) ===
            vec2 cp = vWorldPos.xz * 0.026 + vec2(uTime * 0.018, -uTime * 0.012);
            float c1 = pvFbm2(cp);
            float c2 = pvFbm2(cp * 2.4 - vec2(uTime * 0.025, 0.0));
            float density = smoothstep(0.24, 0.76, c1 * 0.64 + c2 * 0.36);
            float edgeFade = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
            vec3 cloudCol = mix(uFogColor * 0.78, mix(uFogColor, vec3(0.96, 0.97, 0.99) * uLightColor, 0.64), density * 0.86);
            cloudCol = applyFog(cloudCol, vWorldPos);
            fragColor = vec4(cloudCol, density * edgeFade * 0.82);
            return;
          }
        }
      `);
    }

    reset(customSeed, skipBuild) {
      for (const seg of this.segments) this._disposeSeg(seg);
      this.segments = [];
      this.nextSegId = 0;
      this.originOffset = [0, 0, 0];
      this.originResets = 0;
      this.forcedType = null;
      this.endPos = [0, 0, 0];
      this.endYaw = 0;
      this.endS = 0;
      this.seed = (typeof customSeed === 'number' && Number.isFinite(customSeed))
        ? (customSeed >>> 0)
        : ((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
      this._deterministicSeed = (typeof customSeed === 'number' && Number.isFinite(customSeed));
      this.rng = mulberry32(this.seed);
      this.recentTypes = [];
      this.recentThemes = [];
      this.sinceSpecial = 0;

      // True Non-Repeating Weighted Markov Biome Director (ZERO cyclic themeOrder loop!)
      // Pure 5-Biome Ecological Pool (Lakeside & Cliffside are orthogonal Landforms combinable with ALL 5 Biomes!)
      const ECO_BIOMES = [0, 1, 4, 5, 6];
      this.curThemeId = ECO_BIOMES[Math.floor(this.rng() * ECO_BIOMES.length)];
      this.recentThemes.push(this.curThemeId);
      this.stageTargetLen = 4 + Math.floor(this.rng() * 4); // 4..7 segments per macro-sector, freshly rolled every transition!
      this.macroStageStep = 0;
      this.sectorCount = 1;
      this._bootSettled = false;

      if (!skipBuild) {
        for (let i = 0; i < ACTIVE_SEGS; i++) {
          this._appendNextRuleSegment();
        }
        this._bootSettled = true;
      }
    }

    _rand() {
      // When running live (no explicit test seed), mix live Math.random() entropy so endless play NEVER repeats a sequence!
      if (!this._deterministicSeed) {
        const a = this.rng();
        return (a * 0.35 + Math.random() * 0.65) % 1.0;
      }
      return this.rng();
    }

    _disposeSeg(seg) {
      if (!seg) return;
      const gl = this.gl;
      const freeMesh = (m) => { if (!m) return; gl.deleteVertexArray(m.vao); for (const b of m.bufs) gl.deleteBuffer(b); };
      freeMesh(seg.groundMesh); seg.groundMesh = null;
      freeMesh(seg.roadMesh);   seg.roadMesh = null;
      freeMesh(seg.structMesh); seg.structMesh = null;
      freeMesh(seg.waterMesh);  seg.waterMesh = null;
      this.disposedSegs = (this.disposedSegs || 0) + 1;
    }

    _pickNextProceduralType() {
      const r = () => this._rand();
      const themeIdx = (typeof this.curThemeId === 'number') ? this.curThemeId : 0;
      const stage = THEMES[themeIdx] || THEMES[0];
      const targetLen = this.stageTargetLen || stage.len || 5;
      this.macroStageStep = (this.macroStageStep || 0) + 1;

      const advanceBiome = () => {
        // Pick next pure ecological biome via non-repeating Markov selection (5 biomes x 6 landforms = 30+ natural worlds!)
        const ECO_BIOMES = [0, 1, 4, 5, 6];
        const avoid = this.recentThemes.slice(-2);
        const pool = ECO_BIOMES.filter((t) => !avoid.includes(t));
        const nextT = pool.length ? pool[Math.floor(r() * pool.length)] : ECO_BIOMES[0];
        this.curThemeId = nextT;
        this.recentThemes.push(nextT);
        if (this.recentThemes.length > 6) this.recentThemes.shift();
        this.macroStageStep = 0;
        this.stageTargetLen = 4 + Math.floor(r() * 4);
        this.sectorCount = (this.sectorCount || 1) + 1;
      };

      // Balanced Rally Pacing: 84%+ regular scenic rally stages, bridges/tunnels are rare iconic landmarks (cooldown >= 5, never back-to-back!)
      if (this.macroStageStep >= targetLen && this.sinceSpecial >= 5 && this.nextSegId >= 4) {
        const specialType = stage.special;
        advanceBiome();
        this.sinceSpecial = 0;
        return { type: specialType, themeId: themeIdx };
      }
      if (this.macroStageStep >= targetLen + 2) {
        advanceBiome();
      }
      this.sinceSpecial = (this.sinceSpecial || 0) + 1;
      const cands = stage.pool.filter((t) => !this.recentTypes.slice(-2).includes(t));
      const picked = cands.length ? cands[Math.floor(r() * cands.length)] : stage.pool[0];
      return { type: picked, themeId: themeIdx };
    }

    _profileTargetsFor(hm, surfMode, themeId, landform) {
      // Continuous side terrain elevation factor in [-1.0 (deep valley/gorge) .. +1.0 (tall rocky mountain)]
      if (surfMode === 2) return [1.0, 1.0];      // Tunnel: solid mountain on BOTH sides
      if (surfMode === 1) return [-1.0, -1.0];    // Bridge: deep river gorge on BOTH sides
      if (landform === 'lakeside_shore') return hm === 1 ? [-0.96, 0.92] : [0.92, -0.96];
      if (landform === 'cliff_abyss')    return hm === 1 ? [-1.0, 1.0] : [1.0, -1.0];
      if (landform === 'plain_meadow') return [-0.22, -0.22]; // Wide open flat/gentle meadow on BOTH sides
      if (landform === 'ridge_crest')  return [-0.72, -0.72]; // Exposed mountain ridge with drop-offs BOTH sides
      if (landform === 'valley_gorge' || hm === 2) return [0.95, 0.95];
      if (hm === -1) return [0.95, -0.78];        // Mountain left, valley right
      if (hm === 1)  return [-0.78, 0.95];        // Valley left, mountain right
      return [-0.45, -0.45];
    }

    _appendNextRuleSegment() {
      let type, themeId;
      let allowVariation = true;
      if (this.forcedType && TEMPLATES[this.forcedType]) {
        type = this.forcedType;
        themeId = TEMPLATES[type].themeId || 0;
        allowVariation = false;
      } else {
        const pick = this._pickNextProceduralType();
        type = pick.type;
        themeId = pick.themeId;
        allowVariation = this.nextSegId >= 1;
      }
      this.forcedType = null;
      this._appendSegment(type, allowVariation, themeId);
    }

    _appendSegment(type, allowVariation, forcedThemeId) {
      const tpl = TEMPLATES[type] || TEMPLATES.gentle_curve;
      const segId = this.nextSegId++, sStart = this.endS, pts = [];
      this.recentTypes.push(type);
      if (this.recentTypes.length > 8) this.recentTypes.shift();

      const prevSeg = this.segments.length ? this.segments[this.segments.length - 1] : null;
      // Round 1 (Biome Inheritance): Bridges & tunnels inherit prevSeg's active ecological biome (ZERO snow pines on summer bridges!)
      const rawThemeId = (typeof forcedThemeId === 'number') ? forcedThemeId : (tpl.themeId || 0);
      const themeId = (tpl.surfMode !== 0 && prevSeg && typeof prevSeg.themeId === 'number' && typeof forcedThemeId !== 'number')
        ? prevSeg.themeId
        : rawThemeId;
      const themeObj = THEMES[themeId] || THEMES[0];

      // Dynamic per-segment length: regular rally segments are ~2x longer (228m) for pace-note breathing room
      const segLen = (tpl.surfMode === 0) ? ROAD_SEG_LEN : SPECIAL_SEG_LEN;
      const segSamples = Math.max(24, Math.round(segLen / DS));
      const segDS = segLen / segSamples;

      // Procedural mirroring now ENABLED for ALL road themes including Lakeside (left OR right lake!)
      const mirrorFlip = (allowVariation && tpl.surfMode === 0 && this._rand() < 0.48) ? -1 : 1;
      const curvJitter = allowVariation ? (0.82 + this._rand() * 0.36) : 1.0;
      const elevJitter = allowVariation ? (0.84 + this._rand() * 0.34) : 1.0;
      const wetJitter  = allowVariation ? ((this._rand() - 0.5) * 0.14) : 0.0;

      let sign = tpl.sign * mirrorFlip * (type === 'forest_chicanes' ? (segId % 2 === 0 ? 1 : -1) : 1);
      if (this.endYaw > 0.62 && sign > 0) sign = -1;
      else if (this.endYaw < -0.62 && sign < 0) sign = 1;

      // 12-Archetype Curated Natural Biome-Landform Director (includes 28% Winter Glacial Lakeside, 24% Autumn Birch Lake, 22% Kyoto Shrine Lake!)
      let landform = 'slope_open';
      if (tpl.surfMode === 0) {
        const pickWeighted = (table) => {
          let sum = 0; for (const [, w] of table) sum += w;
          let r = this._rand() * sum;
          for (const [k, w] of table) { r -= w; if (r <= 0) return k; }
          return table[table.length - 1][0];
        };
        if (themeId === 2) {
          landform = (allowVariation && this._rand() < 0.18) ? 'plain_meadow' : 'lakeside_shore';
        } else if (themeId === 3) {
          landform = (allowVariation && this._rand() < 0.22) ? 'ridge_crest' : 'cliff_abyss';
        } else if (allowVariation) {
          const allowLake = !(prevSeg && prevSeg.hasCloudSea);
          const allowCliff = !(prevSeg && prevSeg.hasLake);
          const tables = {
            0: [['plain_meadow', 22], ['lakeside_shore', allowLake ? 22 : 0], ['slope_open', 22], ['valley_gorge', 18], ['cliff_abyss', allowCliff ? 10 : 0], ['ridge_crest', 8]],
            1: [['lakeside_shore', allowLake ? 28 : 0], ['cliff_abyss', allowCliff ? 22 : 0], ['ridge_crest', 18], ['valley_gorge', 16], ['slope_open', 16]],
            4: [['lakeside_shore', allowLake ? 24 : 0], ['plain_meadow', 22], ['slope_open', 22], ['valley_gorge', 18], ['cliff_abyss', allowCliff ? 14 : 0]],
            5: [['valley_gorge', 32], ['cliff_abyss', allowCliff ? 26 : 0], ['slope_open', 22], ['ridge_crest', 12], ['lakeside_shore', allowLake ? 8 : 0]],
            6: [['valley_gorge', 30], ['lakeside_shore', allowLake ? 24 : 0], ['slope_open', 20], ['cliff_abyss', allowCliff ? 14 : 0], ['plain_meadow', 12]],
          };
          landform = pickWeighted(tables[themeId] || tables[0]);
        } else {
          landform = (themeId === 1) ? 'lakeside_shore' : (tpl.hillMode === 2 ? 'valley_gorge' : 'slope_open');
        }
      }

      let hillMode = (tpl.hillMode === -1 || tpl.hillMode === 1) ? (tpl.hillMode * mirrorFlip) : tpl.hillMode;
      if (tpl.surfMode === 0) {
        if (landform === 'lakeside_shore' || landform === 'cliff_abyss') {
          // Freely mirror left (-1) or right (+1) mountain/lake side; keep same side on consecutive lake segments!
          if (prevSeg && (prevSeg.hasLake || prevSeg.hasCloudSea) && (prevSeg.hillMode === -1 || prevSeg.hillMode === 1)) {
            hillMode = prevSeg.hillMode;
          } else {
            hillMode = this._rand() < 0.5 ? -1 : 1;
          }
        } else if (landform === 'valley_gorge') {
          hillMode = 2;
        } else if (landform === 'plain_meadow' || landform === 'ridge_crest') {
          hillMode = 0;
        } else if (allowVariation && prevSeg && prevSeg.surfMode === 0) {
          if ((prevSeg.hillMode === -1 && hillMode === 1) || (prevSeg.hillMode === 1 && hillMode === -1)) {
            hillMode = (this._rand() < 0.55) ? prevSeg.hillMode : 2;
          }
        }
      }

      const hasLake = (tpl.surfMode === 0) && (landform === 'lakeside_shore');
      const hasCloudSea = (tpl.surfMode === 0) && (landform === 'cliff_abyss');

      // Orthogonal Vegetation & Architecture Preset Rolls (biome-weighted)
      const pickFrom = (arr) => arr[Math.floor(this._rand() * arr.length) % arr.length];
      const vegPools = {
        0: ['dense_canopy', 'open_meadow', 'mixed_autumn', 'rocky_alpine'],
        1: ['rocky_alpine', 'windswept_ridge', 'dense_canopy'],
        2: ['open_meadow', 'dense_canopy', 'mixed_autumn'],
        3: ['rocky_alpine', 'windswept_ridge', 'dense_canopy'],
        4: ['mixed_autumn', 'open_meadow', 'dense_canopy'],
        5: ['rocky_alpine', 'mixed_autumn', 'windswept_ridge'],
        6: ['blossom_grove', 'dense_canopy', 'open_meadow'],
      };
      const archPools = {
        0: ['hamlet_cluster', 'lonely_outpost', 'rally_stage_pro', 'wild_untouched'],
        1: ['lonely_outpost', 'rally_stage_pro', 'wild_untouched'],
        2: ['hamlet_cluster', 'lonely_outpost', 'rally_stage_pro', 'wild_untouched'],
        3: ['rally_stage_pro', 'lonely_outpost', 'wild_untouched'],
        4: ['hamlet_cluster', 'rally_stage_pro', 'lonely_outpost', 'wild_untouched'],
        5: ['industrial_mill', 'rally_stage_pro', 'lonely_outpost', 'wild_untouched'],
        6: ['shrine_sanctuary', 'wild_untouched', 'rally_stage_pro'],
      };
      const vegPreset = VEG_PRESETS[pickFrom(vegPools[themeId] || vegPools[0])] || VEG_PRESETS.dense_canopy;
      let archPreset = ARCH_PRESETS[pickFrom(archPools[themeId] || archPools[0])] || ARCH_PRESETS.wild_untouched;
      if (landform === 'cliff_abyss' && archPreset.cabinCount > 0) archPreset = ARCH_PRESETS.rally_stage_pro;

      const biome = tpl.biome !== undefined ? tpl.biome : themeObj.biome;
      const segWet = Math.max(0.24, Math.min(0.92, tpl.wet + wetJitter));

      // Elevation Profile Roll synchronized with landform & altitude bounds
      let elevProfile = tpl.elevProfile || 'roller_waves';
      let elevAmp = (tpl.elev || 0.06) * elevJitter;
      if (tpl.surfMode === 0) {
        if (hasLake) {
          elevProfile = 'flat_water';
          elevAmp = 0.012;
        } else if (landform === 'plain_meadow') {
          elevProfile = this._rand() < 0.65 ? 'flat_plain' : 'roller_waves';
          elevAmp = Math.min(0.045, Math.abs(elevAmp) * 0.55);
        } else if (landform === 'ridge_crest') {
          elevProfile = 'crest_jump';
          elevAmp = Math.max(0.11, Math.abs(elevAmp));
        } else if (allowVariation && this._rand() < 0.35) {
          elevProfile = pickFrom(['climb_steep', 'descent_fast', 'crest_jump', 'roller_waves', 'flat_plain']);
          if (elevProfile === 'descent_fast') elevAmp = -Math.abs(elevAmp);
          else if (elevProfile === 'flat_plain') elevAmp = 0.025;
        }
        if (elevProfile !== 'flat_water') {
          if (this.endPos[1] > 95.0 && elevAmp > 0) { elevProfile = 'descent_fast'; elevAmp = -Math.abs(elevAmp); }
          else if (this.endPos[1] < -12.0 && elevAmp < 0) { elevProfile = 'climb_steep'; elevAmp = Math.abs(elevAmp); }
        }
      }

      let x = this.endPos[0], y = this.endPos[1], z = this.endPos[2], yaw = this.endYaw;
      const YAW_MAX = 1.06;

      // 8-Shape Compound Modular Corner Generator
      const shapeRoll = this._rand();
      const curveShape = !allowVariation ? 'bell' : (
        type === 'forest_chicanes' ? 's_chicane' :
        (shapeRoll < 0.16 ? 's_flow' :
         shapeRoll < 0.32 ? 'double_s' :
         shapeRoll < 0.48 ? 'late_apex' :
         shapeRoll < 0.64 ? 'early_apex' :
         shapeRoll < 0.80 ? 'decreasing_apex' : 'bell')
      );
      const curvPhase = this._rand() * 0.55;
      const ecoRecipe = {
        rockDensity: (0.72 + this._rand() * 0.72) * vegPreset.rockMul,
        shrubDensity: (0.72 + this._rand() * 0.68) * vegPreset.shrubMul,
        flowerDrift: (0.62 + this._rand() * 0.78) * vegPreset.flowerMul,
        slabBias: this._rand(),
        landmarkSlot: this._rand(),
      };

      const smoothstep = (e0, e1, v) => {
        const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
        return t * t * (3.0 - 2.0 * t);
      };
      // Longer 228m road segments get ~30m straight buffer on BOTH ends + gentler curvature scaling so rhythm feels like real rally!
      const lenCurvScale = (tpl.surfMode === 0) ? 0.68 : 1.0;

      for (let i = 0; i <= segSamples; i++) {
        const u = i / segSamples, s = sStart + i * segDS;
        const bell = Math.sin(u * Math.PI);
        const endFade = bell * bell;
        // Entry/Exit Straight Buffer on 228m regular segments (flowing lead-in & exit straights for pace notes!)
        const straightBuf = (tpl.surfMode === 0) ? (smoothstep(0.0, 0.13, u) * smoothstep(1.0, 0.87, u)) : 1.0;
        let curvWave = bell * 1.16 * straightBuf;
        if (curveShape === 's_chicane' || curveShape === 's_flow') {
          curvWave = Math.sin(u * Math.PI * 2.0) * bell * 1.30 * straightBuf;
        } else if (curveShape === 'double_s') {
          curvWave = Math.sin(u * Math.PI * 3.0 + curvPhase) * bell * 1.22 * straightBuf;
        } else if (curveShape === 'decreasing_apex') {
          curvWave = (0.55 + 0.95 * u * u) * bell * 1.44 * straightBuf;
        } else if (curveShape === 'late_apex') {
          curvWave = Math.pow(u, 0.72) * bell * 1.50 * straightBuf;
        } else if (curveShape === 'early_apex') {
          curvWave = Math.pow(1.0 - u, 0.72) * bell * 1.50 * straightBuf;
        }
        let curv = tpl.curv * lenCurvScale * curvJitter * sign * curvWave;
        if (yaw > 0.80 && curv > 0) curv *= Math.max(0.0, 1.0 - (yaw - 0.80) / 0.24);
        else if (yaw < -0.80 && curv < 0) curv *= Math.max(0.0, 1.0 - (-yaw - 0.80) / 0.24);
        if (Math.abs(yaw) > 0.90) curv += (-Math.sign(yaw) * 0.0046 * endFade);
        if (i === 0 || i === segSamples) curv = 0.0;

        let pitch = 0.0;
        if (elevProfile === 'flat_plain') {
          pitch = elevAmp * 0.35 * Math.sin(u * Math.PI * 2.0) * endFade;
        } else if (elevProfile === 'climb_steep') {
          pitch = Math.abs(elevAmp) * 0.72 * Math.pow(bell, 0.82);
        } else if (elevProfile === 'descent_fast') {
          pitch = -Math.abs(elevAmp) * 0.72 * Math.pow(bell, 0.82);
        } else if (elevProfile === 'crest_jump') {
          pitch = Math.abs(elevAmp) * (Math.sin(u * Math.PI * 2.0) + 0.20 * Math.sin(u * Math.PI)) * Math.min(1.0, bell * 2.5);
        } else if (elevProfile === 'roller_waves') {
          pitch = elevAmp * (0.72 * Math.sin(u * Math.PI * 2.0) + 0.42 * Math.sin(u * Math.PI * 3.0)) * Math.min(1.0, bell * 2.5);
        } else {
          pitch = elevAmp * bell * 0.38;
        }
        pitch = Math.max(-0.165, Math.min(0.165, pitch));
        if (i === 0 || i === segSamples) pitch = 0.0;

        const bank = (i === 0 || i === segSamples) ? 0.0 : (tpl.bank * sign * curvWave * 0.85);
        const fwd = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
        const fl = Math.hypot(fwd[0], fwd[1], fwd[2]) || 1;
        fwd[0]/=fl; fwd[1]/=fl; fwd[2]/=fl;
        const right = [-Math.cos(yaw), 0, Math.sin(yaw)];
        pts.push({ s, pos: [x, y, z], yaw, pitch, bank, curv, fwd, right, wet: segWet });

        if (i < segSamples) {
          yaw = Math.max(-YAW_MAX, Math.min(YAW_MAX, yaw + curv * segDS));
          x += Math.sin(yaw) * Math.cos(pitch) * segDS;
          z += Math.cos(yaw) * Math.cos(pitch) * segDS;
          y = Math.max(-35.0, Math.min(145.0, y + Math.sin(pitch) * segDS));
        }
      }
      const last = pts[pts.length - 1];
      this.endPos = last.pos.slice(); this.endYaw = last.yaw; this.endS = last.s;

      const [tgtL, tgtR] = this._profileTargetsFor(hillMode, tpl.surfMode, themeId, landform);
      let leftStart = prevSeg ? prevSeg.leftEnd : tgtL;
      let rightStart = prevSeg ? prevSeg.rightEnd : tgtR;
      if (tpl.surfMode === 2 && prevSeg && prevSeg.surfMode === 0) {
        prevSeg.leftEnd = 1.0;
        prevSeg.rightEnd = 1.0;
        prevSeg.nextIsTunnel = true;
        this._disposeSeg(prevSeg);
        this._buildSegmentMeshes(prevSeg);
        leftStart = 1.0;
        rightStart = 1.0;
      } else if (tpl.surfMode === 1 && prevSeg && prevSeg.surfMode === 0) {
        prevSeg.leftEnd = -0.92;
        prevSeg.rightEnd = -0.92;
        prevSeg.nextIsBridge = true;
        this._disposeSeg(prevSeg);
        this._buildSegmentMeshes(prevSeg);
        leftStart = -0.92;
        rightStart = -0.92;
      }

      const seg = {
        id: segId, type, name: tpl.name, sharp: tpl.sharp, sign, wet: segWet,
        hillMode, surfMode: tpl.surfMode, bridgeStyle: tpl.bridgeStyle || 'truss', biome,
        len: segLen, samples: segSamples, landform, hasLake, hasCloudSea, vegPreset, archPreset,
        themeId, themeName: themeObj.name, curveShape, ecoRecipe,
        prevThemeId: prevSeg ? (prevSeg.themeId !== undefined ? prevSeg.themeId : themeId) : themeId,
        elevProfile,
        prevHillMode: prevSeg ? prevSeg.hillMode : hillMode,
        prevSurfMode: prevSeg ? prevSeg.surfMode : tpl.surfMode,
        prevLakeY: prevSeg && prevSeg.lakeY !== undefined ? prevSeg.lakeY : undefined,
        leftStart, leftEnd: tgtL, rightStart, rightEnd: tgtR,
        spawnTime: this._bootSettled ? (this._simTime || 0.0) : -10.0,
        sStart, sEnd: last.s, pts, groundMesh: null, roadMesh: null, structMesh: null, waterMesh: null, waterMode: -1,
      };
      this.segments.push(seg);
      this._buildSegmentMeshes(seg);
      if (prevSeg) {
        prevSeg.nextHasSameLake = !!(prevSeg.hasLake && seg.hasLake && seg.hillMode === prevSeg.hillMode);
        prevSeg.nextHasSameCloud = !!(prevSeg.hasCloudSea && seg.hasCloudSea && seg.hillMode === prevSeg.hillMode);
        this._disposeSeg(prevSeg);
        this._buildSegmentMeshes(prevSeg);
      }
      // Global neighbor re-carve when a bridge or lakeside segment is added so curved adjacent slopes never poke into bridge sides!
      if (seg.surfMode === 1 || seg.hasLake) {
        const startIdx = Math.max(0, this.segments.length - 4);
        for (let si = startIdx; si < this.segments.length - 1; si++) {
          const nseg = this.segments[si];
          if (nseg === prevSeg) continue;
          this._disposeSeg(nseg);
          this._buildSegmentMeshes(nseg);
        }
      }
    }

    mapLat(p, lat) {
      const kappa = (p && p.curv) ? p.curv : 0;
      const absK = Math.abs(kappa);
      if (absK > 1e-4 && lat * kappa < 0 && Math.abs(lat) > ROAD_HALF_W + 2.0) {
        const maxSafe = Math.max(ROAD_HALF_W + 3.0, 0.66 / absK);
        const signL = lat < 0 ? -1 : 1;
        const excess = Math.abs(lat) - (ROAD_HALF_W + 2.0);
        const span = maxSafe - (ROAD_HALF_W + 2.0);
        const compressed = span * (1.0 - Math.exp(-excess / Math.max(span, 1.0)));
        return signL * (ROAD_HALF_W + 2.0 + compressed);
      }
      return lat;
    }

    sampleRoadSurfaceY(s, lat) {
      const sp = this.sampleAtS(s);
      if (!sp) return 0;
      const clampedLat = Math.max(-ROAD_HALF_W, Math.min(ROAD_HALF_W, lat));
      const bankY = Math.sin(sp.bank) * clampedLat;
      if (sp.seg.surfMode !== 0) {
        return sp.pos[1] + bankY + 0.03;
      }
      const u = Math.abs(clampedLat) / ROAD_HALF_W;
      const rut = Math.exp(-Math.pow((u - 0.42) / 0.22, 2)) * 0.06;
      const prof = 0.04 * (1.0 - u * u) - rut - (u > 0.85 ? (u - 0.85) * 0.8 : 0);
      return sp.pos[1] + bankY + prof;
    }

    _clearanceCapY(wx, wz, skipSegId, isWater, currentS) {
      let capY = 1e9;
      const hasS = typeof currentS === 'number';
      for (let si = 0; si < this.segments.length; si++) {
        const oseg = this.segments[si];
        if (oseg.id === skipSegId) continue;
        const opts = oseg.pts;
        const n = opts.length;
        const pMid = opts[n >> 1].pos;
        const dxM = wx - pMid[0], dzM = wz - pMid[2];
        const boundR = (oseg.len || ROAD_SEG_LEN) * 0.56 + 52.0;
        if (dxM * dxM + dzM * dzM > boundR * boundR) continue;
        const clearR = (oseg.surfMode === 1 ? (ROAD_HALF_W + 11.5) : (ROAD_HALF_W + 4.8));
        const padSpan = oseg.surfMode === 1 ? 18.0 : 26.0;
        const padR = clearR + padSpan;
        const padR2 = padR * padR;
        const step = oseg.surfMode === 1 ? 1 : 2;
        for (let k = 0; k < n; k += step) {
          const opObj = opts[k];
          // CRITICAL SEAM-INTEGRITY FIX: never let an adjacent segment's spline points smash the shared boundary seam down!
          if (hasS && Math.abs(opObj.s - currentS) < 38.0) continue;
          const op = opObj.pos;
          const dx = wx - op[0], dz = wz - op[2];
          const d2 = dx * dx + dz * dz;
          if (d2 < padR2) {
            const d = Math.sqrt(d2);
            const drop = oseg.surfMode === 1 ? (isWater ? 6.0 : 14.5) : (isWater ? 3.2 : 4.6);
            const targetY = op[1] - drop;
            if (d <= clearR) {
              if (targetY < capY) capY = targetY;
            } else {
              const t = (d - clearR) / padSpan;
              const sm = t * t * (3.0 - 2.0 * t);
              const blendY = targetY + sm * 28.0;
              if (blendY < capY) capY = blendY;
            }
          }
        }
      }
      return capY;
    }

    isNearAnyRoad(wx, wz, skipSegId, minClearance) {
      const r = minClearance || (ROAD_HALF_W + 3.0);
      const r2 = r * r;
      for (let si = 0; si < this.segments.length; si++) {
        const oseg = this.segments[si];
        if (oseg.id === skipSegId) continue;
        const opts = oseg.pts;
        const n = opts.length;
        const pMid = opts[n >> 1].pos;
        const dxM = wx - pMid[0], dzM = wz - pMid[2];
        const nearBoundR = (oseg.len || ROAD_SEG_LEN) * 0.56 + 38.0;
        if (dxM * dxM + dzM * dzM > nearBoundR * nearBoundR) continue;
        for (let k = 0; k < n; k += 2) {
          const op = opts[k].pos;
          const dx = wx - op[0], dz = wz - op[2];
          if (dx * dx + dz * dz < r2) return true;
        }
      }
      return false;
    }

    _evalContinuousHeight(sideProfile, lat, s, surfMode, uSeg) {
      const absL = Math.abs(lat);
      if (absL <= ROAD_HALF_W) {
        const u = absL / ROAD_HALF_W;
        const rut = Math.exp(-Math.pow((u - 0.42) / 0.22, 2)) * 0.06;
        return 0.04 * (1.0 - u * u) - rut - (u > 0.85 ? (u - 0.85) * 0.8 : 0);
      }
      const d = absL - ROAD_HALF_W;
      const evalCurve = (pts) => {
        for (let i = 0; i < pts.length - 1; i++) {
          if (d <= pts[i + 1][0]) {
            const t = (d - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
            return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
          }
        }
        return pts[pts.length - 1][1];
      };
      // Extended 155m AAA Alpine Geology: gentle outer shoulder taper (eliminates sharp 100m vertical skirt spike in distant fog!)
      const hMtn    = evalCurve([[0,-0.08],[1.6,-0.22],[3.2,0.42],[7.4,2.85],[14.5,7.45],[26.0,15.4],[44.0,25.5],[72.0,35.8],[110.0,40.5],[138.0,31.0],[155.0,14.0]]);
      const hValley = evalCurve([[0,-0.08],[2.4,-0.48],[6.4,-2.85],[14.5,-8.2],[28.0,-16.2],[50.0,-24.2],[76.0,-28.5],[110.0,-25.5],[138.0,-22.0],[155.0,-18.0]]);
      // True Negative-Space Cliff Abyss: sheer basalt drop into deep misty space (ZERO artificial bald rising mesh wall — distant sky_backdrop alpine ranges frame the vista!)
      const hAbyss  = evalCurve([[0,-0.08],[1.8,-0.85],[4.8,-7.8],[10.5,-19.5],[22.0,-32.0],[46.0,-42.0],[88.0,-48.0],[155.0,-52.0]]);
      // Bridge Gorge: drops to -17.5m sparkling riverbed under bridge (d=6..28m), then RISES into forested canyon flanks (+24m at d=110m)
      const hGorge  = evalCurve([[0,-0.12],[2.4,-4.80],[6.8,-14.8],[15.0,-17.8],[26.0,-16.8],[42.0,-8.5],[68.0,6.8],[104.0,23.5],[138.0,24.0],[155.0,12.0]]);

      const w = Math.max(0.0, Math.min(1.0, (sideProfile + 1.0) * 0.5));
      let hBase = hValley + (hMtn - hValley) * w;
      if (sideProfile < -0.975) {
        const abyssMix = Math.min(1.0, (-0.975 - sideProfile) / 0.025);
        hBase = hBase + (hAbyss - hBase) * (abyssMix * abyssMix * (3.0 - 2.0 * abyssMix));
      }
      let h = hBase;
      if (surfMode === 1) {
        // Bridge gorge: smoothly ramp gorge depth down between u=0.06..0.94 so bridge abutments seal seamlessly!
        const bEnv = Math.min(1.0, Math.min(uSeg / 0.12, (1.0 - uSeg) / 0.12));
        const bSm = bEnv * bEnv * (3.0 - 2.0 * bEnv);
        h = hBase + (hGorge - hBase) * bSm;
      }
      // Multi-scale alpine geology: eroded ridge gullies + stepped sedimentary rock benches + craggy macro spurs (damped to 0 on outer grounding skirt!)
      const skirtFade = d > 132.0 ? Math.max(0.0, 1.0 - (d - 132.0) / 18.0) : 1.0;
      const und = (
        Math.sin(s * 0.082 + d * 0.16) * 1.45 +
        Math.cos(s * 0.036 - d * 0.105) * 2.15 +
        Math.sin(s * 0.175 - d * 0.28) * 0.62 +
        Math.cos(s * 0.019 + d * 0.052) * 2.40
      ) * Math.min(1.0, d / 12.0) * skirtFade;
      // Stepped geological strata benches + transverse rain-erosion gullies on mountain slopes
      const gully = -Math.pow(Math.abs(Math.sin(s * 0.068 + Math.sin(d * 0.09) * 1.6)), 3.0) * 1.65 * Math.min(1.0, d / 14.0) * skirtFade;
      // Low-frequency organic mountain spurs (wavelength >> CROSS_LATS spacing -> ZERO parallel mesh-contour stripes!)
      const ledge = sideProfile > 0.08 ? ((Math.sin(d * 0.14 + s * 0.042) * 1.35 + Math.cos(d * 0.22 - s * 0.068) * 0.68) * Math.min(1.0, d / 8.5) * skirtFade) : 0.0;
      return h + und + ledge + (sideProfile > 0.0 ? gully : 0.0);
    }

    _profBlend(seg, u) {
      // Smooth C1 terrain transition over first 38% (~86m on 228m segments) so lake headlands & cliff faces taper organically!
      if (seg && seg.surfMode === 0 && !seg.nextIsBridge && !seg.nextIsTunnel && (seg.len || 120) > 160) {
        const t = Math.max(0, Math.min(1, u / 0.38));
        return t * t * (3.0 - 2.0 * t);
      }
      return u * u * (3.0 - 2.0 * u);
    }

    _buildSegmentMeshes(seg) {
      seg._meshRev = (seg._meshRev || 0) + 1;
      const pts = seg.pts, N = pts.length;
      const cols = CROSS_LATS.length;
      const grid = [];

      for (let i = 0; i < N; i++) {
        const p = pts[i], row = [];
        const u = i / (N - 1);
        const sm = this._profBlend(seg, u);
        const profL = seg.leftStart + (seg.leftEnd - seg.leftStart) * sm;
        const profR = seg.rightStart + (seg.rightEnd - seg.rightStart) * sm;

        // MATHEMATICAL ANTI-FOLDING CLAMP
        const kappa = p.curv || 0;
        const absK = Math.abs(kappa);

        for (let j = 0; j < cols; j++) {
          const lat = CROSS_LATS[j];
          const latEff = this.mapLat(p, lat);

          const bankY = Math.sin(p.bank) * Math.max(-ROAD_HALF_W, Math.min(ROAD_HALF_W, latEff));
          const sideProf = latEff < 0 ? profL : profR;
          // CRITICAL ANTI-CLIPPING FIX: evaluate terrain height at compressed physical lateral distance latEff (eliminates 75-deg inner-curve spikes!)
          let h = this._evalContinuousHeight(sideProf, latEff, p.s, seg.surfMode, u);
          if (seg.surfMode === 1 && Math.abs(latEff) <= ROAD_HALF_W + 30.0) {
            // Full-width canyon drop strictly inside bridge abutments (u=0.05..0.95) so wing walls seal 100%!
            const gDrop = Math.min(1.0, Math.min(Math.max(0, u - 0.02) / 0.07, Math.max(0, 0.98 - u) / 0.07));
            const gSm = gDrop * gDrop * (3.0 - 2.0 * gDrop);
            const latFade = Math.abs(latEff) <= ROAD_HALF_W + 14.0 ? 1.0 : Math.max(0.0, 1.0 - (Math.abs(latEff) - (ROAD_HALF_W + 14.0)) / 16.0);
            h = h + (-19.0 - h) * gSm * latFade;
          } else if (seg.surfMode === 2 && Math.abs(latEff) <= ROAD_HALF_W + 2.0) {
            // Exact Tunnel Barrel Envelope Carving: depress terrain cleanly below tunnel roadMesh & concrete curbs (ZERO wall/floor clipping!)
            const tEnv = Math.min(1.0, Math.min(Math.max(0, u - 0.03) / 0.06, Math.max(0, 0.97 - u) / 0.06));
            const tSm = tEnv * tEnv * (3.0 - 2.0 * tEnv);
            const latCarve = Math.abs(latEff) <= ROAD_HALF_W + 1.25 ? 1.0 : Math.max(0.0, 1.0 - (Math.abs(latEff) - (ROAD_HALF_W + 1.25)) / 0.75);
            h = h + (-0.55 - h) * tSm * latCarve;
          }
          const wx = p.pos[0] + p.right[0] * latEff;
          const wz = p.pos[2] + p.right[2] * latEff;
          let wy = p.pos[1] + bankY + h;
          if (Math.abs(lat) > ROAD_HALF_W + 0.5) {
            const capY = this._clearanceCapY(wx, wz, seg.id, false, p.s);
            if (wy > capY) wy = capY;
          }
          row.push([wx, wy, wz]);
        }
        grid.push(row);
      }
      seg._seamStartRow = grid[0];
      seg._seamEndRow   = grid[N - 1];

      const gPos = [], gNrm = [], gUv = [], gAttr = [], gIdx = [];
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < cols; j++) {
          const c = grid[i][j];
          const i0 = Math.max(0, i-1), i1 = Math.min(N-1, i+1), j0 = Math.max(0, j-1), j1 = Math.min(cols-1, j+1);
          const dsV = [grid[i1][j][0]-grid[i0][j][0], grid[i1][j][1]-grid[i0][j][1], grid[i1][j][2]-grid[i0][j][2]];
          const dlV = [grid[i][j1][0]-grid[i][j0][0], grid[i][j1][1]-grid[i][j0][1], grid[i][j1][2]-grid[i][j0][2]];
          let nx = dsV[1]*dlV[2]-dsV[2]*dlV[1], ny = dsV[2]*dlV[0]-dsV[0]*dlV[2], nz = dsV[0]*dlV[1]-dsV[1]*dlV[0];
          if (ny < 0) { nx=-nx; ny=-ny; nz=-nz; }
          const nl = Math.hypot(nx, ny, nz) || 1;
          const lat = CROSS_LATS[j];
          gPos.push(c[0], c[1], c[2]);
          gNrm.push(nx/nl, ny/nl, nz/nl);
          gUv.push(lat / (2.0 * ROAD_HALF_W) + 0.5, pts[i].s * 0.085);
          gAttr.push(Math.abs(lat) / ROAD_HALF_W, seg.wet, pts[i].s);
        }
      }
      for (let i = 0; i < N - 1; i++) for (let j = 0; j < cols - 1; j++) {
        const a = i * cols + j, b = a + cols;
        gIdx.push(a, a + 1, b, a + 1, b + 1, b);
      }
      seg.groundMesh = PV.createMesh(this.gl, { positions: gPos, normals: gNrm, uvs: gUv, colors: gAttr, indices: gIdx });

      if (seg.surfMode !== 0) {
        const rPos = [], rNrm = [], rUv = [], rAttr = [], rIdx = [];
        const roadU = [-1.0, -0.5, 0.0, 0.5, 1.0];
        const rc = roadU.length;
        for (let i = 0; i < N; i++) {
          const p = pts[i];
          for (let j = 0; j < rc; j++) {
            const lat = roadU[j] * ROAD_HALF_W;
            const bankY = Math.sin(p.bank) * lat;
            rPos.push(p.pos[0] + p.right[0] * lat, p.pos[1] + bankY + 0.03, p.pos[2] + p.right[2] * lat);
            rNrm.push(-p.right[0] * Math.sin(p.bank), Math.cos(p.bank), -p.right[2] * Math.sin(p.bank));
            rUv.push(roadU[j] * 0.5 + 0.5, p.s * 0.085);
            rAttr.push(Math.abs(roadU[j]), seg.wet, p.s);
          }
        }
        for (let i = 0; i < N - 1; i++) for (let j = 0; j < rc - 1; j++) {
          const a = i * rc + j, b = a + rc;
          rIdx.push(a, a + 1, b, a + 1, b + 1, b);
        }
        seg.roadMesh = PV.createMesh(this.gl, { positions: rPos, normals: rNrm, uvs: rUv, colors: rAttr, indices: rIdx });
      }
      seg.structMesh = this._buildSetPieceMesh(seg);
      seg.waterMesh = this._buildWaterMesh(seg);
    }

    _buildWaterMesh(seg) {
      const pts = seg.pts, N = pts.length;
      const tid = seg.themeId || 0;
      if (seg.surfMode === 2) { seg.waterMode = -1; return null; }
      if (seg.surfMode === 0 && !seg.hasLake && !seg.hasCloudSea) { seg.waterMode = -1; return null; }

      const valleySide = seg.hillMode === 1 ? -1 : 1;
      const pos = [], nrm = [], uv = [], col = [], idx = [];
      let minY = 1e9;
      for (let i = 0; i < N; i++) if (pts[i].pos[1] < minY) minY = pts[i].pos[1];

      if (seg.surfMode === 1) {
        // EVERY Bridge Segment: Real Translucent Sparkling Alpine Gorge River beneath the bridge deck (eliminates sky-void pop-in!)
        seg.waterMode = 0;
        const riverY = minY - 12.8;
        const rLats = [-42.0, -30.0, -20.0, -11.0, -4.0, 4.0, 11.0, 20.0, 30.0, 42.0];
        const cols = rLats.length;
        for (let i = 0; i < N; i++) {
          const p = pts[i], v = i / (N - 1);
          const endFade = Math.min(1.0, Math.min(v / 0.08, (1.0 - v) / 0.08));
          const cSm = endFade * endFade * (3.0 - 2.0 * endFade);
          for (let j = 0; j < cols; j++) {
            const lat = rLats[j];
            const wx = p.pos[0] + p.right[0] * lat;
            const wz = p.pos[2] + p.right[2] * lat;
            pos.push(wx, riverY, wz);
            nrm.push(0, 1, 0);
            uv.push(j / (cols - 1), v);
            // vCol.r = endFade, vCol.g = 1.0 (river flag!)
            col.push(cSm, 1.0, 0.25);
          }
        }
        for (let i = 0; i < N - 1; i++) for (let j = 0; j < cols - 1; j++) {
          const a = i * cols + j, b = a + cols;
          idx.push(a, a + 1, b, a + 1, b + 1, b);
        }
      } else if (seg.hasLake) {
        // Mirrorable Left/Right Animated 3D-Wave Translucent Alpine Lake across any biome!
        seg.waterMode = 0;
        const baseLakeY = minY - 2.45;
        const prevSeg = this.segments.find((x) => x.id === seg.id - 1);
        const sameLakePrev = !!(prevSeg && prevSeg.hasLake && prevSeg.hillMode === seg.hillMode);
        seg.lakeY = (seg.prevLakeY !== undefined && sameLakePrev)
          ? Math.min(seg.prevLakeY, baseLakeY)
          : baseLakeY;
        const lats = [
          ROAD_HALF_W + 1.2, ROAD_HALF_W + 4.5, ROAD_HALF_W + 9.5, ROAD_HALF_W + 16.5,
          ROAD_HALF_W + 26.0, ROAD_HALF_W + 40.0, ROAD_HALF_W + 60.0, ROAD_HALF_W + 86.0,
          ROAD_HALF_W + 118.0, ROAD_HALF_W + 154.0, ROAD_HALF_W + 192.0, ROAD_HALF_W + 235.0
        ];
        const cols = lats.length;
        const fadeStart = !sameLakePrev;
        const fadeEnd = !!seg.nextIsBridge || (seg.nextHasSameLake === false);
        for (let i = 0; i < N; i++) {
          const p = pts[i];
          const v = i / (N - 1);
          const inFade = fadeStart ? Math.min(1.0, v / 0.16) : 1.0;
          const outFade = fadeEnd ? Math.min(1.0, (1.0 - v) / 0.18) : 1.0;
          const coveFade = Math.min(inFade, outFade);
          const coveSm = coveFade * coveFade * (3.0 - 2.0 * coveFade);
          for (let j = 0; j < cols; j++) {
            const rawLat = valleySide * (ROAD_HALF_W + 1.2 + (lats[j] - (ROAD_HALF_W + 1.2)) * (0.28 + 0.72 * coveSm));
            const lat = this.mapLat(p, rawLat);
            const wx = p.pos[0] + p.right[0] * lat;
            const wz = p.pos[2] + p.right[2] * lat;
            let wy = seg.lakeY;
            const capY = this._clearanceCapY(wx, wz, seg.id, true);
            if (wy > capY) wy = capY;
            pos.push(wx, wy, wz);
            nrm.push(0, 1, 0);
            uv.push(j / (cols - 1), v);
            // vCol.r = coveSm, vCol.g = 0.0 (lake flag!)
            col.push(coveSm, 0.0, 0.28);
          }
        }
        for (let i = 0; i < N - 1; i++) for (let j = 0; j < cols - 1; j++) {
          const a = i * cols + j, b = a + cols;
          if (valleySide > 0) idx.push(a, a + 1, b, a + 1, b + 1, b);
          else idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      } else if (seg.hasCloudSea) {
        // Cliffside Abyss Layered Volumetric Cloud-Sea (mirrorable left/right + smooth entry/exit fade!)
        seg.waterMode = 1;
        const prevSegC = this.segments.find((x) => x.id === seg.id - 1);
        const sameCloudPrev = !!(prevSegC && prevSegC.hasCloudSea && prevSegC.hillMode === seg.hillMode);
        const cFadeStart = !sameCloudPrev;
        const cFadeEnd = (seg.nextHasSameCloud === false);
        // Deep negative-space abyss cloud sea (sits well below adjacent curved roads; dissolves cleanly near any neighbor segment!)
        const layerOffsets = [-22.5, -34.0];
        const lats = [ROAD_HALF_W + 9.0, ROAD_HALF_W + 32.0, ROAD_HALF_W + 72.0, ROAD_HALF_W + 125.0, ROAD_HALF_W + 190.0];
        const cols = lats.length;
        for (let li = 0; li < layerOffsets.length; li++) {
          const base = pos.length / 3;
          const lOff = layerOffsets[li];
          for (let i = 0; i < N; i++) {
            const p = pts[i], v = i / (N - 1);
            const cIn = cFadeStart ? Math.min(1.0, v / 0.14) : 1.0;
            const cOut = cFadeEnd ? Math.min(1.0, (1.0 - v) / 0.14) : 1.0;
            const cF = Math.min(cIn, cOut);
            const cSm = cF * cF * (3.0 - 2.0 * cF);
            // Follow road elevation smoothly so steep descent/climb segments never intersect flat slopes!
            const baseLy = p.pos[1] * 0.65 + minY * 0.35 + lOff;
            for (let j = 0; j < cols; j++) {
              const rawLat = valleySide * (ROAD_HALF_W + 6.5 + (lats[j] - (ROAD_HALF_W + 6.5)) * (0.35 + 0.65 * cSm));
              const lat = this.mapLat(p, rawLat);
              const wx = p.pos[0] + p.right[0] * lat;
              const wz = p.pos[2] + p.right[2] * lat;
              const capY = this._clearanceCapY(wx, wz, seg.id, true);
              const ly = Math.min(baseLy, capY - 6.0);
              const nearNeighbor = this.isNearAnyRoad(wx, wz, seg.id, 38.0);
              pos.push(wx, ly, wz);
              nrm.push(0, 1, 0);
              uv.push(j / (cols - 1), v);
              col.push(nearNeighbor ? 0.0 : cSm, 0.80, 0.86);
            }
          }
          for (let i = 0; i < N - 1; i++) for (let j = 0; j < cols - 1; j++) {
            const a = base + i * cols + j, b = a + cols;
            if (valleySide > 0) idx.push(a, a + 1, b, a + 1, b + 1, b);
            else idx.push(a, b, a + 1, a + 1, b, b + 1);
          }
        }
      }
      if (!idx.length) return null;
      return PV.createMesh(this.gl, { positions: pos, normals: nrm, uvs: uv, colors: col, indices: idx });
    }

    _buildSetPieceMesh(seg) {
      const pts = seg.pts, N = pts.length;
      const pos = [], nrm = [], uv = [], col = [], idx = [];

      // matId encoded in uv.y: 0=Steel, 1=StoneMasonry, 2=Timber, 3=TunnelConcrete, 4=Emissive, 5=Reflector
      const addQuad = (p0, p1, p2, p3, c, matId, uVal) => {
        const b = pos.length / 3;
        const ux = p1[0]-p0[0], uy = p1[1]-p0[1], uz = p1[2]-p0[2];
        const vx = p2[0]-p0[0], vy = p2[1]-p0[1], vz = p2[2]-p0[2];
        let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx/=nl; ny/=nl; nz/=nl;
        const m = matId !== undefined ? matId : 0;
        const uvx = uVal !== undefined ? uVal : 0;
        for (const p of [p0, p1, p2, p3]) {
          pos.push(p[0], p[1], p[2]); nrm.push(nx, ny, nz); uv.push(uvx, m); col.push(c[0], c[1], c[2]);
        }
        idx.push(b, b+1, b+2, b, b+2, b+3);
      };

      // Smoothly shaded quad with per-vertex analytical normals & interpolated UVs (ZERO faceted tunnel strips!)
      const addSmoothQuad = (p0, p1, p2, p3, n0, n1, n2, n3, u0, u1, u2, u3, c, matId, cPerVert) => {
        const b = pos.length / 3;
        const m = matId !== undefined ? matId : 0;
        const pts4 = [p0, p1, p2, p3], nrms4 = [n0, n1, n2, n3], uvs4 = [u0, u1, u2, u3];
        for (let k = 0; k < 4; k++) {
          const ck = cPerVert ? cPerVert[k] : c;
          pos.push(pts4[k][0], pts4[k][1], pts4[k][2]);
          nrm.push(nrms4[k][0], nrms4[k][1], nrms4[k][2]);
          uv.push(uvs4[k], m);
          col.push(ck[0], ck[1], ck[2]);
        }
        idx.push(b, b+1, b+2, b, b+2, b+3);
      };

      // Smooth 12-sided cylindrical pipe/jet-fan housing (replaces boxy low-poly beams for fans & conduits!)
      const addCylinder = (a, b, r, segs, c, matId) => {
        const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2];
        const up = Math.abs(dy) > Math.hypot(dx, dz) * 0.9 ? [1,0,0] : [0,1,0];
        let sx = dy*up[2]-dz*up[1], sy = dz*up[0]-dx*up[2], sz = dx*up[1]-dy*up[0];
        const sl = Math.hypot(sx, sy, sz) || 1; sx/=sl; sy/=sl; sz/=sl;
        let tx = dy*sz-dz*sy, ty = dz*sx-dx*sz, tz = dx*sy-dy*sx;
        const tl = Math.hypot(tx, ty, tz) || 1; tx/=tl; ty/=tl; tz/=tl;
        const m = matId !== undefined ? matId : 0;
        for (let k = 0; k < segs; k++) {
          const a0 = (k / segs) * Math.PI * 2, a1 = ((k + 1) / segs) * Math.PI * 2;
          const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
          const n0 = [sx*c0 + tx*s0, sy*c0 + ty*s0, sz*c0 + tz*s0];
          const n1 = [sx*c1 + tx*s1, sy*c1 + ty*s1, sz*c1 + tz*s1];
          const p0 = [a[0]+n0[0]*r, a[1]+n0[1]*r, a[2]+n0[2]*r];
          const p1 = [a[0]+n1[0]*r, a[1]+n1[1]*r, a[2]+n1[2]*r];
          const p2 = [b[0]+n1[0]*r, b[1]+n1[1]*r, b[2]+n1[2]*r];
          const p3 = [b[0]+n0[0]*r, b[1]+n0[1]*r, b[2]+n0[2]*r];
          addSmoothQuad(p0, p1, p2, p3, n0, n1, n1, n0, k/segs, (k+1)/segs, (k+1)/segs, k/segs, c, m);
        }
      };

      const addBeam = (a, b, r, c, matId) => {
        const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2];
        const up = Math.abs(dy) > Math.hypot(dx, dz) * 0.9 ? [1,0,0] : [0,1,0];
        let sx = dy*up[2]-dz*up[1], sy = dz*up[0]-dx*up[2], sz = dx*up[1]-dy*up[0];
        const sl = Math.hypot(sx, sy, sz) || 1; sx=sx/sl*r; sy=sy/sl*r; sz=sz/sl*r;
        let tx = dy*sz-dz*sy, ty = dz*sx-dx*sz, tz = dx*sy-dy*sx;
        const tl = Math.hypot(tx, ty, tz) || 1; tx=tx/tl*r; ty=ty/tl*r; tz=tz/tl*r;
        const ring = (p) => [
          [p[0]+sx+tx, p[1]+sy+ty, p[2]+sz+tz],
          [p[0]-sx+tx, p[1]-sy+ty, p[2]-sz+tz],
          [p[0]-sx-tx, p[1]-sy-ty, p[2]-sz-tz],
          [p[0]+sx-tx, p[1]+sy-ty, p[2]+sz-tz],
        ];
        const ra = ring(a), rb = ring(b);
        for (let k = 0; k < 4; k++) {
          const kn = (k + 1) % 4;
          addQuad(ra[k], ra[kn], rb[kn], rb[k], c, matId);
        }
      };

      const ptAt = (p, lat, h) => [p.pos[0] + p.right[0]*lat, p.pos[1] + h, p.pos[2] + p.right[2]*lat];

      if (seg.surfMode === 0) {
        const tid = seg.themeId || 0;
        const valleySide = seg.hillMode === 1 ? -1 : 1;
        const mtnSide = -valleySide;
        // Remove stiff lakeside boardwalk & guardrail completely so irregular reeds & rocks open directly onto the sparkling lake!
        const hasGuardrail = (seg.hillMode !== 2 || seg.hasCloudSea) && (seg.type !== 'water_crossing') && (!seg.hasLake) && (seg.landform !== 'plain_meadow');
        // Round 3 (Architecture De-Collision): never overlap wooden ranch fence with stone retaining wall on mountain side!
        const hasRetainingWall = (tid === 0 && seg.hillMode !== 0 && (seg.sharp || seg.type === 'canyon_right'));
        const hasRanchFence = (tid === 0 || tid === 4) && !hasRetainingWall && (seg.type === 'village_pass' || seg.type === 'flower_valley' || seg.type === 'alpine_hamlet' || seg.id % 3 === 0);
        const timberPost = [0.22, 0.15, 0.095];
        const timberRail = [0.29, 0.21, 0.135];
        const timberDark = [0.16, 0.115, 0.08];
        const steelBracket = [0.14, 0.16, 0.18];
        const steelCable = [0.28, 0.31, 0.34];
        const stoneWallC = [0.24, 0.25, 0.25];
        const vermilionC = [0.76, 0.12, 0.08];
        const reflectorW = [0.92, 0.94, 0.96];
        const reflectorR = [0.92, 0.22, 0.14];
        const amberLamp  = [3.4, 2.15, 0.72];
        const W = ROAD_HALF_W + 0.84;

        // 1. Guardrails & Embankment Walls (Differentiated per Theme!)
        if (hasGuardrail) {
          // Continuous span with clean portal setbacks so guardrails NEVER clip into tunnel stone faces!
          const gStart = (seg.prevSurfMode === 2) ? 4 : 0;
          const gEnd = seg.nextIsTunnel ? Math.max(gStart + 1, N - 5) : (N - 1);
          for (let i = gStart; i < gEnd; i++) {
            const p0 = pts[i], p1 = pts[i + 1];
            const lat = valleySide * W;
            const b0 = Math.sin(p0.bank) * (valleySide * ROAD_HALF_W);
            const b1 = Math.sin(p1.bank) * (valleySide * ROAD_HALF_W);

            if (tid === 3 || seg.hasCloudSea) {
              // Cliffside Abyss: Cantilevered Galvanized Steel I-Beam + 3-Strand Tensioned Cable Barrier!
              addBeam(ptAt(p0, lat, b0 + 0.98), ptAt(p1, lat, b1 + 0.98), 0.055, steelCable, 0);
              addBeam(ptAt(p0, lat, b0 + 0.68), ptAt(p1, lat, b1 + 0.68), 0.036, steelCable, 0);
              addBeam(ptAt(p0, lat, b0 + 0.40), ptAt(p1, lat, b1 + 0.40), 0.036, steelCable, 0);
              addBeam(ptAt(p0, lat + valleySide * 0.18, b0 - 1.20), ptAt(p0, lat + valleySide * 0.18, b0 + 1.12), 0.11, steelBracket, 0);
              addBeam(ptAt(p0, lat - valleySide * 0.32, b0 - 0.10), ptAt(p0, lat + valleySide * 0.42, b0 - 0.10), 0.14, steelBracket, 0);
              if (i % 2 === 0) {
                addBeam(ptAt(p0, lat - valleySide * 0.06, b0 + 0.84), ptAt(p0, lat - valleySide * 0.06, b0 + 1.06), 0.042, (i % 4 === 0) ? reflectorR : [0.98, 0.72, 0.12], 5);
              }
            } else {
              // Upgraded Alpine Timber + Steel-Backed Guardrail with Concrete Footings, Steel Straps & Reflectors
              addBeam(ptAt(p0, lat, b0 + 0.86), ptAt(p1, lat, b1 + 0.86), 0.094, timberRail, 2);
              addBeam(ptAt(p0, lat, b0 + 0.46), ptAt(p1, lat, b1 + 0.46), 0.074, timberDark, 2);
              addBeam(ptAt(p0, lat - valleySide * 0.06, b0 + 0.86), ptAt(p1, lat - valleySide * 0.06, b1 + 0.86), 0.034, steelBracket, 0);
              addBeam(ptAt(p0, lat + valleySide * 0.08, b0 - 0.55), ptAt(p0, lat + valleySide * 0.08, b0 + 0.16), 0.155, [0.25, 0.26, 0.27], 1);
              addBeam(ptAt(p0, lat + valleySide * 0.08, b0 - 0.45), ptAt(p0, lat + valleySide * 0.08, b0 + 1.02), 0.108, timberPost, 2);
              addBeam(ptAt(p0, lat + valleySide * 0.08, b0 + 1.00), ptAt(p0, lat + valleySide * 0.08, b0 + 1.09), 0.130, steelBracket, 0);
              if (i % 3 === 0) {
                addBeam(ptAt(p0, lat + valleySide * 0.05, b0 + 0.18), ptAt(p1, lat + valleySide * 0.05, b1 + 0.82), 0.044, timberDark, 2);
              }
              if (i % 2 === 0) {
                addBeam(ptAt(p0, lat - valleySide * 0.08, b0 + 0.72), ptAt(p0, lat - valleySide * 0.08, b0 + 0.90), 0.036, (i % 4 === 0) ? reflectorR : reflectorW, 5);
              }
            }
          }
        }

        // 2. Theme-Specific Retaining Walls & Roadside Architecture
        if (tid === 0 && seg.hillMode !== 0 && (seg.sharp || seg.type === 'canyon_right')) {
          // Theme 0: Intermittent weathered stone retaining wall ONLY on steep hairpin/gorge apexes, tapering naturally into embankment!
          const rLat = mtnSide * (ROAD_HALF_W + 1.35);
          const iStart = Math.max(5, Math.round(N * 0.16)), iEnd = Math.min(N - 6, Math.round(N * 0.84));
          for (let i = iStart; i < iEnd; i++) {
            const p0 = pts[i], p1 = pts[i + 1];
            const t0 = Math.min(1.0, Math.min((i - iStart) / 3.0, (iEnd - i) / 3.0));
            const t1 = Math.min(1.0, Math.min((i + 1 - iStart) / 3.0, (iEnd - (i + 1)) / 3.0));
            const h0 = 0.25 + 1.45 * (t0 * t0 * (3.0 - 2.0 * t0));
            const h1 = 0.25 + 1.45 * (t1 * t1 * (3.0 - 2.0 * t1));
            const b0 = Math.sin(p0.bank) * (mtnSide * ROAD_HALF_W);
            const b1 = Math.sin(p1.bank) * (mtnSide * ROAD_HALF_W);
            addQuad(ptAt(p0, rLat, b0 - 0.8), ptAt(p1, rLat, b1 - 0.8), ptAt(p1, rLat, b1 + h1), ptAt(p0, rLat, b0 + h0), stoneWallC, 1);
            addBeam(ptAt(p0, rLat, b0 + h0 + 0.05), ptAt(p1, rLat, b1 + h1 + 0.05), 0.22, [0.30, 0.31, 0.30], 1);
          }
        } else if (tid === 1) {
          // Theme 1 (Snow Peak): Alpine Snow-Depth Marker Poles cleanly placed outside guardrails (ZERO post overlap!)
          const poleSides = (hasGuardrail || seg.hasLake || seg.hasCloudSea) ? [mtnSide] : [-1, 1];
          for (const side of poleSides) {
            // Round 3: widen snow-depth marker pole spacing & offset outside chevron signs (ZERO post-sign intersection!)
            const sLat = side * (ROAD_HALF_W + 2.05);
            for (let i = 4; i < N - 4; i += 3) {
              const p0 = pts[i];
              const b0 = Math.sin(p0.bank) * (side * ROAD_HALF_W);
              addCylinder(ptAt(p0, sLat, b0 - 0.7), ptAt(p0, sLat, b0 + 2.05), 0.072, 8, timberPost, 2);
              addCylinder(ptAt(p0, sLat, b0 + 1.48), ptAt(p0, sLat, b0 + 1.72), 0.084, 8, reflectorW, 5);
              addCylinder(ptAt(p0, sLat, b0 + 1.74), ptAt(p0, sLat, b0 + 2.02), 0.088, 8, reflectorR, 5);
            }
          }
        } else if (tid === 2) {
          // Theme 2 (Lakeside Loop): Pure uninterrupted alpine lake vista (mid-lake island & lighthouse removed!)
        } else if (tid === 6) {
          // Theme 6 (Bamboo / Misty Cedar Shrine Pass): AAA Sculpted Curved Myojin Torii Gates scaled across 228m segments!
          const toriiIndices = N > 50 ? [Math.round(N * 0.20), Math.round(N * 0.52), Math.round(N * 0.82)] : [11, 26];
          for (const ti of toriiIndices) {
            const pt = pts[ti];
            const colX = ROAD_HALF_W + 1.65;
            const gateH = 7.4;
            const copperCap = [0.11, 0.14, 0.13];
            const blackCollar = [0.09, 0.10, 0.11];
            const kSpan = colX + 3.35;
            const uCol = (colX - 0.30) / (kSpan * 0.96);
            const soriAtCol = Math.pow(Math.abs(uCol), 2.35) * 1.28;
            const colTopH = gateH + soriAtCol + 0.14;
            const ptT = (x, y, z) => [pt.pos[0] + pt.right[0]*x + pt.fwd[0]*z, pt.pos[1] + y, pt.pos[2] + pt.right[2]*x + pt.fwd[2]*z];
            for (const sgn of [-1, 1]) {
              addCylinder(ptT(sgn * colX, -4.5, 0), ptT(sgn * colX, 0.75, 0), 0.76, 8, [0.22, 0.23, 0.22], 1);
              addCylinder(ptT(sgn * colX, 0.75, 0), ptT(sgn * colX, 1.05, 0), 0.62, 8, [0.16, 0.17, 0.16], 1);
              addCylinder(ptT(sgn * colX, 1.00, 0), ptT(sgn * (colX - 0.05), 1.82, 0), 0.52, 16, blackCollar, 0);
              addCylinder(ptT(sgn * (colX - 0.05), 1.78, 0), ptT(sgn * (colX - 0.30), colTopH, 0), 0.41, 16, vermilionC, 2);
              addCylinder(ptT(sgn * (colX - 0.28), colTopH - 0.40, 0), ptT(sgn * (colX - 0.30), colTopH + 0.02, 0), 0.51, 16, blackCollar, 0);
              addBeam(ptT(sgn * (colX - 0.22), gateH - 1.56, 0), ptT(sgn * (colX - 0.22), gateH - 1.06, 0), 0.44, blackCollar, 0);
            }
            addBeam(ptT(-(colX + 1.85), gateH - 1.34, 0), ptT((colX + 1.85), gateH - 1.34, 0), 0.28, vermilionC, 2);
            const kSegs = 18;
            const sweepBeam = (halfWBot, halfWTop, yBotOff, yTopOff, spanScale, colArr, matId) => {
              const stations = [];
              for (let ks = 0; ks <= kSegs; ks++) {
                const u = (ks / kSegs) * 2 - 1;
                const x = u * kSpan * spanScale;
                const sori = Math.pow(Math.abs(u), 2.35) * 1.28;
                const flare = 1.0 + Math.pow(Math.abs(u), 2.0) * 0.24;
                const yb = gateH + yBotOff + sori;
                const yt = gateH + yTopOff + sori * 1.12;
                const wb = halfWBot * flare, wt = halfWTop * flare;
                stations.push([ptT(x, yb, -wb), ptT(x, yb, wb), ptT(x, yt, wt), ptT(x, yt, -wt)]);
              }
              for (let ks = 0; ks < kSegs; ks++) {
                const s0 = stations[ks], s1 = stations[ks + 1];
                for (let f = 0; f < 4; f++) {
                  const fn = (f + 1) % 4;
                  addQuad(s0[f], s1[f], s1[fn], s0[fn], colArr, matId);
                }
              }
              addQuad(stations[0][0], stations[0][3], stations[0][2], stations[0][1], colArr, matId);
              const lastS = stations[kSegs];
              addQuad(lastS[0], lastS[1], lastS[2], lastS[3], colArr, matId);
            };
            sweepBeam(0.32, 0.36, -0.02, 0.34, 0.96, vermilionC, 2);
            sweepBeam(0.42, 0.62,  0.32, 0.78, 1.04, copperCap, 1);
            addQuad(ptT(-0.48, gateH - 1.24, -0.32), ptT(0.48, gateH - 1.24, -0.32), ptT(0.42, gateH - 0.04, -0.32), ptT(-0.42, gateH - 0.04, -0.32), [0.09, 0.08, 0.08], 2);
            addQuad(ptT( 0.48, gateH - 1.24,  0.32), ptT(-0.48, gateH - 1.24, 0.32), ptT(-0.42, gateH - 0.04, 0.32), ptT( 0.42, gateH - 0.04, 0.32), [0.09, 0.08, 0.08], 2);
            addBeam(ptT(0, gateH - 1.26, 0), ptT(0, gateH - 0.02, 0), 0.34, [0.09, 0.08, 0.08], 2);
            addBeam(ptT(0, gateH - 1.10, -0.26), ptT(0, gateH - 0.18, -0.26), 0.16, [0.82, 0.64, 0.22], 0);
            // Braided golden-straw Shimenawa ceremonial rope & hanging white paper Shide zigzags under the Torii nuki beam!
            const ropeC = [0.68, 0.56, 0.28], shideC = [0.94, 0.94, 0.92];
            for (let rs = 0; rs < 12; rs++) {
              const u0 = (rs / 12) * 2 - 1, u1 = ((rs + 1) / 12) * 2 - 1;
              const rx0 = u0 * (colX - 0.35), rx1 = u1 * (colX - 0.35);
              const sag0 = (1 - u0 * u0) * 0.52, sag1 = (1 - u1 * u1) * 0.52;
              const radR = 0.09 + (1 - Math.abs(u0)) * 0.11;
              addCylinder(ptT(rx0, gateH - 1.56 - sag0, 0), ptT(rx1, gateH - 1.56 - sag1, 0), radR, 8, ropeC, 2);
              if (rs === 2 || rs === 5 || rs === 7 || rs === 9) {
                // Crisp tapered 2-step zigzag white paper Shide talismans!
                const sy0 = gateH - 1.64 - sag0;
                addQuad(ptT(rx0 - 0.06, sy0, 0.02), ptT(rx0 + 0.06, sy0, 0.02), ptT(rx0 + 0.10, sy0 - 0.34, 0.02), ptT(rx0 - 0.02, sy0 - 0.34, 0.02), shideC, 5);
                addQuad(ptT(rx0 - 0.02, sy0 - 0.32, 0.02), ptT(rx0 + 0.10, sy0 - 0.32, 0.02), ptT(rx0 + 0.02, sy0 - 0.68, 0.02), ptT(rx0 - 0.08, sy0 - 0.68, 0.02), shideC, 5);
              }
            }
          }
        }

        if (hasRanchFence) {
          const fenceSide = hasGuardrail ? -valleySide : ((seg.hasLake || seg.hasCloudSea) ? mtnSide : valleySide);
          const fLat = fenceSide * (ROAD_HALF_W + 1.24);
          const fStart = (seg.prevSurfMode === 2) ? 5 : 2;
          const fEnd = seg.nextIsTunnel ? Math.max(fStart + 1, N - 6) : (N - 3);
          for (let i = fStart; i < fEnd; i++) {
            const p0 = pts[i], p1 = pts[i + 1];
            const b0 = Math.sin(p0.bank) * (fenceSide * ROAD_HALF_W) + 0.08;
            const b1 = Math.sin(p1.bank) * (fenceSide * ROAD_HALF_W) + 0.08;
            addBeam(ptAt(p0, fLat, b0 + 0.98), ptAt(p1, fLat, b1 + 0.98), 0.056, timberRail, 2);
            addBeam(ptAt(p0, fLat, b0 + 0.56), ptAt(p1, fLat, b1 + 0.56), 0.050, timberDark, 2);
            addBeam(ptAt(p0, fLat, b0 - 0.45), ptAt(p0, fLat, b0 + 0.12), 0.125, [0.25, 0.26, 0.27], 1);
            addBeam(ptAt(p0, fLat, b0 - 0.35), ptAt(p0, fLat, b0 + 1.16), 0.082, timberPost, 2);
            if (i % 4 === 0) {
              addBeam(ptAt(p0, fLat, b0 + 0.12), ptAt(p1, fLat, b1 + 0.96), 0.042, timberDark, 2);
            }
          }
        }

        // 3. Continuous World-Space Catenary Power Lines connecting exact roadside utility poles (ZERO clipping into tunnel/bridge portals!)
        seg.utilityPoles = [];
        if (tid === 0 || tid === 2 || tid === 4 || tid === 5) {
          // Always anchor utility poles on the solid mountain side (NEVER floating over cliff abyss or lake water!)
          const pSide = (seg.hasLake || seg.hasCloudSea) ? mtnSide : ((seg.hillMode === 1) ? 1 : -1);
          const pLat = pSide * (ROAD_HALF_W + 4.4);
          const polePts = [];
          const iPoleStart = seg.prevSurfMode !== 0 ? 7 : 3;
          const iPoleEnd = (seg.nextIsBridge || seg.nextIsTunnel) ? (N - 10) : (N - 4);
          for (let i = iPoleStart; i <= iPoleEnd; i += 6) {
            const p = pts[i];
            const u = i / (N - 1);
            const sm = this._profBlend(seg, u);
            const sideProf = pSide < 0 ? (seg.leftStart + (seg.leftEnd - seg.leftStart) * sm) : (seg.rightStart + (seg.rightEnd - seg.rightStart) * sm);
            const latEff = this.mapLat(p, pLat);
            const wx = p.pos[0] + p.right[0] * latEff;
            const wz = p.pos[2] + p.right[2] * latEff;
            const gy = p.pos[1] + Math.sin(p.bank) * Math.max(-ROAD_HALF_W, Math.min(ROAD_HALF_W, pLat)) + this._evalContinuousHeight(sideProf, pLat, p.s, seg.surfMode, u);
            const capY = this._clearanceCapY(wx, wz, seg.id, false, p.s);
            const finalY = Math.min(gy, capY);
            if (finalY < p.pos[1] - 2.2) continue; // Guard against abyss/gorge drop-off floating poles!
            const yaw = p.yaw;
            seg.utilityPoles.push({ x: wx, y: finalY, z: wz, yaw });
            // Insulator crossarm tips at y + 8.65m, offset +/- 1.05m along road-right
            const rx = -Math.cos(yaw) * 1.05, rz = Math.sin(yaw) * 1.05;
            polePts.push([
              [wx + rx, finalY + 8.65, wz + rz],
              [wx - rx, finalY + 8.65, wz - rz],
            ]);
          }
          // Span continuous sagging 6-segment catenary power cables between consecutive poles!
          const cableCol = [0.06, 0.065, 0.072];
          for (let k = 0; k < polePts.length - 1; k++) {
            for (let w = 0; w < 2; w++) {
              const a = polePts[k][w], b = polePts[k + 1][w];
              const dist = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
              const sag = Math.min(1.6, dist * 0.042);
              const segs = 6;
              for (let s = 0; s < segs; s++) {
                const t0 = s / segs, t1 = (s + 1) / segs;
                const q0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0 - Math.sin(t0 * Math.PI) * sag, a[2] + (b[2] - a[2]) * t0];
                const q1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1 - Math.sin(t1 * Math.PI) * sag, a[2] + (b[2] - a[2]) * t1];
                addBeam(q0, q1, 0.026, cableCol, 0);
              }
            }
          }
        }
        if (!pos.length) return null;
        return PV.createMesh(this.gl, { positions: pos, normals: nrm, uvs: uv, colors: col, indices: idx });
      } else if (seg.surfMode === 1) {
        // === DUAL BRIDGE ARCHITECTURE: RIVETED STEEL PARABOLIC ARCH BRIDGE (image_4db069) + STEEL BOX-TRUSS BRIDGE (image_4db3ab) ===
        const isArchBridge = seg.bridgeStyle === 'arch';
        const steelMain  = isArchBridge ? [0.18, 0.21, 0.23] : [0.15, 0.19, 0.21];
        const steelFlange= [0.10, 0.12, 0.14];
        const steelGusset= [0.22, 0.25, 0.27];
        const timberCurb = [0.20, 0.14, 0.09];
        const stoneAbut  = [0.22, 0.23, 0.24];
        const stoneCap   = [0.27, 0.28, 0.29];
        const amberLamp  = [3.2, 2.05, 0.65];
        const W = ROAD_HALF_W + 0.92;

        // Massive Dressed Stone-Masonry Bridge Abutments with Aged Brick Spandrel Inlays, Overhanging Coping Capstones & Warm Lanterns
        const brickAbut = [0.56, 0.28, 0.19];
        for (const endIdx of [0, N - 2]) {
          const p0 = pts[endIdx], p1 = pts[endIdx + 1];
          const endSign = endIdx === 0 ? -1 : 1;
          const ptA = (p, lat, h, fz) => [p.pos[0] + p.right[0]*lat + p.fwd[0]*fz, p.pos[1] + h, p.pos[2] + p.right[2]*lat + p.fwd[2]*fz];
          for (const side of [-1, 1]) {
            // Sculpted battered (sloped-face) dressed-stone masonry abutment + flared angled wing-wall receding into hillside (1:1 桥.jpg!)
            const latIn = side * (W + 0.08);
            const latMid = side * (W + 1.95);
            const latWing = side * (W + 5.4);
            const f0 = endSign * 1.4, f1 = -endSign * 2.6, fWing = endSign * 6.2;
            // Sloped battered inner pier face (wider at base -14m, tapered cleanly to road deck +1.55m)
            addQuad(ptA(p0, latIn - side * 0.12, -14.0, f0), ptA(p0, latIn - side * 0.12, -14.0, f1), ptA(p0, latIn, 1.55, f1), ptA(p0, latIn, 1.55, f0), stoneAbut, 1);
            // Front battered face with recessed aged-brick spandrel panel
            addQuad(ptA(p0, latIn, -14.0, f0), ptA(p0, latMid + side * 0.85, -14.0, f0), ptA(p0, latMid, 1.55, f0), ptA(p0, latIn, 1.55, f0), stoneAbut, 1);
            addQuad(ptA(p0, latIn + side * 0.35, -9.5, f0 + endSign * 0.06), ptA(p0, latMid - side * 0.20, -9.5, f0 + endSign * 0.06), ptA(p0, latMid - side * 0.20, 1.25, f0 + endSign * 0.06), ptA(p0, latIn + side * 0.35, 1.25, f0 + endSign * 0.06), brickAbut, 6);
            // Flared angled stone wing-wall tapering smoothly down into hillside embankment (-0.45m outer bury -> ZERO sticking-up rectangular block!)
            addQuad(ptA(p0, latMid + side * 0.85, -14.0, f0), ptA(p0, latWing, -14.0, fWing), ptA(p0, latWing, -0.45, fWing), ptA(p0, latMid, 1.45, f0), stoneAbut, 1);
            addQuad(ptA(p0, latMid, 1.45, f0), ptA(p0, latWing, -0.45, fWing), ptA(p0, latWing, -0.45, fWing - endSign * 1.2), ptA(p0, latMid, 1.45, f1), stoneCap, 1);
            // Beveled projecting stone coping slab crowning abutment pier
            addQuad(ptA(p0, latIn - side * 0.16, 1.62, f0 + endSign * 0.22), ptA(p0, latMid + side * 0.18, 1.62, f0 + endSign * 0.22), ptA(p0, latMid + side * 0.18, 1.62, f1), ptA(p0, latIn - side * 0.16, 1.62, f1), stoneCap, 1);
            addBeam(ptA(p0, latIn, 1.58, f0), ptA(p0, latIn, 1.58, f1), 0.26, stoneCap, 1);
            // Octagonal stone bollard + hexagonal wrought-iron warm amber lantern
            addCylinder(ptA(p0, latIn + side * 0.45, 1.62, f0 * 0.25), ptA(p0, latIn + side * 0.45, 2.08, f0 * 0.25), 0.34, 8, stoneCap, 1);
            addCylinder(ptA(p0, latIn + side * 0.45, 2.08, f0 * 0.25), ptA(p0, latIn + side * 0.45, 2.34, f0 * 0.25), 0.16, 6, steelFlange, 0);
            addCylinder(ptA(p0, latIn + side * 0.45, 2.34, f0 * 0.25), ptA(p0, latIn + side * 0.45, 2.66, f0 * 0.25), 0.20, 6, amberLamp, 4);
            addCylinder(ptA(p0, latIn + side * 0.45, 2.66, f0 * 0.25), ptA(p0, latIn + side * 0.45, 2.86, f0 * 0.25), 0.28, 6, steelFlange, 0);
          }
        }
        // Curved Under-Deck Stone-and-Brick Viaduct Arch Ribs springing between piers (authentic curved alpine masonry!)
        for (let i = 4; i < N - 8; i += 8) {
          const spanEnd = Math.min(N - 2, i + 8);
          for (const side of [-1, 1]) {
            const pLat = side * (W * 0.82);
            for (let k = i; k < spanEnd; k++) {
              const u0 = (k - i) / (spanEnd - i), u1 = (k + 1 - i) / (spanEnd - i);
              const y0 = -6.8 + Math.sin(u0 * Math.PI) * 5.8;
              const y1 = -6.8 + Math.sin(u1 * Math.PI) * 5.8;
              addBeam(ptAt(pts[k], pLat, y0), ptAt(pts[k + 1], pLat, y1), 0.56, stoneCap, 1);
              addBeam(ptAt(pts[k], pLat, y0 - 0.52), ptAt(pts[k + 1], pLat, y1 - 0.52), 0.42, brickAbut, 6);
            }
          }
        }

        // 3D Raised Bolted Steel Tread-Plate Wheel Tracks + Timber Wheel-Guard Curbs across bridge deck (1:1 桥面.jpg!)
        for (let i = 0; i < N - 1; i++) {
          const p0 = pts[i], p1 = pts[i + 1];
          for (const side of [-1, 1]) {
            const tLat = side * 1.72;
            // Raised dark riveted steel runner plates sitting cleanly at y = +0.045m above timber sleepers
            addQuad(
              ptAt(p0, tLat - 0.42, 0.045), ptAt(p0, tLat + 0.42, 0.045),
              ptAt(p1, tLat + 0.42, 0.045), ptAt(p1, tLat - 0.42, 0.045),
              steelFlange, 0
            );
            // Beveled inner & outer steel edge lips for crisp 3D parallax & specular catchlights
            addBeam(ptAt(p0, tLat - 0.42, 0.032), ptAt(p1, tLat - 0.42, 0.032), 0.032, steelMain, 0);
            addBeam(ptAt(p0, tLat + 0.42, 0.032), ptAt(p1, tLat + 0.42, 0.032), 0.032, steelMain, 0);
            // Heavy bolted outer timber wheel-guard curb beam along both edges of the deck
            addBeam(ptAt(p0, side * (ROAD_HALF_W - 0.14), 0.14), ptAt(p1, side * (ROAD_HALF_W - 0.14), 0.14), 0.16, timberCurb, 2);
          }
          // Transverse riveted steel deck expansion joint strips every 4 bays
          if (i % 4 === 0) {
            addBeam(ptAt(p0, -ROAD_HALF_W + 0.2, 0.038), ptAt(p0, ROAD_HALF_W - 0.2, 0.038), 0.06, steelGusset, 0);
          }
        }

        if (isArchBridge) {
          // MONUMENTAL RIVETED PARABOLIC STEEL ARCH BRIDGE (1:1 matches 桥.jpg!)
          const archPeakH = 12.2;
          const archHAt = (u) => {
            const s = Math.sin(u * Math.PI);
            return 0.45 + archPeakH * Math.pow(Math.max(0, s), 0.86);
          };
          for (let i = 0; i < N - 1; i++) {
            const p0 = pts[i], p1 = pts[i + 1];
            const u0 = i / (N - 1), u1 = (i + 1) / (N - 1);
            const h0 = archHAt(u0), h1 = archHAt(u1);
            const chordSep = 1.15;
            for (const side of [-1, 1]) {
              const lat = side * W;
              // Low steel side railing + timber curb + bottom I-beam stringer
              addBeam(ptAt(p0, lat - side * 0.26, 0.22), ptAt(p1, lat - side * 0.26, 0.22), 0.16, timberCurb, 2);
              addBeam(ptAt(p0, lat - side * 0.08, 1.12), ptAt(p1, lat - side * 0.08, 1.12), 0.11, steelGusset, 0);
              addBeam(ptAt(p0, lat - side * 0.08, 0.62), ptAt(p1, lat - side * 0.08, 0.62), 0.09, steelFlange, 0);
              addBeam(ptAt(p0, lat, -0.48), ptAt(p1, lat, -0.48), 0.46, steelFlange, 0);
              // Twin-chord laced parabolic steel arch rib (lower chord + upper chord + diagonal web lacing!)
              addBeam(ptAt(p0, lat, h0),             ptAt(p1, lat, h1),             0.42, steelMain, 0);
              addBeam(ptAt(p0, lat, h0 + chordSep),  ptAt(p1, lat, h1 + chordSep),  0.34, steelGusset, 0);
              addBeam(ptAt(p0, lat, h0 - 0.26),      ptAt(p1, lat, h1 - 0.26),      0.22, steelFlange, 0);
              // Diagonal web lacing struts between lower & upper arch chords (signature riveted arch silhouette!)
              addBeam(ptAt(p0, lat, h0), ptAt(p0, lat, h0 + chordSep), 0.14, steelFlange, 0);
              if (i % 2 === 0) {
                addBeam(ptAt(p0, lat, h0), ptAt(p1, lat, h1 + chordSep), 0.11, steelGusset, 0);
              } else {
                addBeam(ptAt(p0, lat, h0 + chordSep), ptAt(p1, lat, h1), 0.11, steelGusset, 0);
              }
              // Vertical steel hanger suspension rods + collar gusset brackets every bay
              if (i >= 2 && i <= N - 3) {
                addBeam(ptAt(p0, lat, 0.10), ptAt(p0, lat, h0 - 0.15), 0.095, steelGusset, 0);
                addBeam(ptAt(p0, lat, 1.05), ptAt(p0, lat, 1.62), 0.18, steelFlange, 0);
                addBeam(ptAt(p0, lat, h0 - 0.68), ptAt(p0, lat, h0 - 0.12), 0.20, steelFlange, 0);
              }
            }
            // Under-deck floor beam
            addBeam(ptAt(p0, -W, -0.55), ptAt(p0, W, -0.55), 0.24, steelFlange, 0);
            // Overhead transverse portal struts + diagonal X-bracing between twin arches where arch clears > 5.4m
            if (h0 > 5.4 && h1 > 5.4) {
              addBeam(ptAt(p0, -W, h0), ptAt(p0, W, h0), 0.24, steelMain, 0);
              addBeam(ptAt(p0, -W, h0 + chordSep), ptAt(p0, W, h0 + chordSep), 0.18, steelGusset, 0);
              // Corner portal knee-braces
              addBeam(ptAt(p0, -W, h0 - 1.1), ptAt(p0, -W + 1.4, h0), 0.11, steelFlange, 0);
              addBeam(ptAt(p0,  W, h0 - 1.1), ptAt(p0,  W - 1.4, h0), 0.11, steelFlange, 0);
              if (i < N - 2) {
                addBeam(ptAt(p0, -W, h0 + chordSep * 0.5), ptAt(p1,  W, h1 + chordSep * 0.5), 0.10, steelFlange, 0);
                addBeam(ptAt(p0,  W, h0 + chordSep * 0.5), ptAt(p1, -W, h1 + chordSep * 0.5), 0.10, steelFlange, 0);
              }
            }
            if (i % 10 === 5) {
              addBeam(ptAt(p0, -W*0.80, -22.0), ptAt(p0, -W*0.80, -0.5), 0.96, stoneAbut, 1);
              addBeam(ptAt(p0,  W*0.80, -22.0), ptAt(p0,  W*0.80, -0.5), 0.96, stoneAbut, 1);
              addBeam(ptAt(p0, -W*0.80, -4.5),  ptAt(p0,  W*0.80, -4.5), 0.58, stoneAbut, 1);
            }
          }
        } else {
          // RIVETED STEEL BOX-TRUSS BRIDGE (1:1 matches image_4db3ab.png!)
          for (let i = 0; i < N - 1; i++) {
            const p0 = pts[i], p1 = pts[i + 1];
            for (const side of [-1, 1]) {
              const lat = side * W;
              addBeam(ptAt(p0, lat - side * 0.26, 0.22), ptAt(p1, lat - side * 0.26, 0.22), 0.16, timberCurb, 2);
              addBeam(ptAt(p0, lat - side * 0.08, 1.02), ptAt(p1, lat - side * 0.08, 1.02), 0.11, steelGusset, 0);
              addBeam(ptAt(p0, lat - side * 0.08, 0.58), ptAt(p1, lat - side * 0.08, 0.58), 0.085, steelFlange, 0);
              addBeam(ptAt(p0, lat, -0.45), ptAt(p1, lat, -0.45), 0.42, steelFlange, 0);
              addBeam(ptAt(p0, lat, 5.10),  ptAt(p1, lat, 5.10),  0.26, steelMain, 0);
              addBeam(ptAt(p0, lat, 5.32),  ptAt(p1, lat, 5.32),  0.15, steelFlange, 0);
              addBeam(ptAt(p0, lat, -0.55), ptAt(p0, lat, 5.20),  0.19, steelMain, 0);
              if (i % 2 === 0) {
                addBeam(ptAt(p0, lat, 0.05), ptAt(p1, lat, 5.10), 0.14, steelMain, 0);
                addBeam(ptAt(p0, lat, 5.10), ptAt(p1, lat, 0.05), 0.085, steelFlange, 0);
              } else {
                addBeam(ptAt(p0, lat, 5.10), ptAt(p1, lat, 0.05), 0.14, steelMain, 0);
                addBeam(ptAt(p0, lat, 0.05), ptAt(p1, lat, 5.10), 0.085, steelFlange, 0);
              }
              addBeam(ptAt(p0, lat, 4.65), ptAt(p0, lat, 5.32), 0.30, steelGusset, 0);
              addBeam(ptAt(p0, lat, -0.18), ptAt(p0, lat, 0.42), 0.28, steelGusset, 0);
            }
            addBeam(ptAt(p0, -W, -0.55), ptAt(p0, W, -0.55), 0.22, steelFlange, 0);
            if (i % 2 === 0) {
              addBeam(ptAt(p0, -W, 5.10), ptAt(p0, W, 5.10), 0.22, steelMain, 0);
              addBeam(ptAt(p0, -W, 3.95), ptAt(p0, -W + 1.55, 5.10), 0.11, steelFlange, 0);
              addBeam(ptAt(p0,  W, 3.95), ptAt(p0,  W - 1.55, 5.10), 0.11, steelFlange, 0);
            }
            if (i % 2 === 0 && i < N - 2) {
              addBeam(ptAt(p0, -W, 5.10), ptAt(p1, W, 5.10), 0.085, steelFlange, 0);
              addBeam(ptAt(p0,  W, 5.10), ptAt(p1, -W, 5.10), 0.085, steelFlange, 0);
            }
            if (i % 8 === 4) {
              addBeam(ptAt(p0, -W*0.78, -22.0), ptAt(p0, -W*0.78, -0.5), 0.85, stoneAbut, 1);
              addBeam(ptAt(p0,  W*0.78, -22.0), ptAt(p0,  W*0.78, -0.5), 0.85, stoneAbut, 1);
              addBeam(ptAt(p0, -W*0.78, -4.5),  ptAt(p0,  W*0.78, -4.5), 0.52, stoneAbut, 1);
            }
          }
        }
      } else if (seg.surfMode === 2) {
        // === AAA SMOOTH-SHADED MOUNTAIN TUNNEL (44-SEG SMOOTH BARREL + CONTINUOUS CURVED I-BEAM RIBS + CYLINDRICAL JET FANS!) ===
        const archSegs = 44;
        const R = ROAD_HALF_W + 1.15;
        const H = 6.75;
        const wallC = [0.22, 0.23, 0.24];
        const ribC = [0.11, 0.12, 0.14];
        const pipeC = [0.15, 0.17, 0.19];
        const portalStone = [0.24, 0.25, 0.24];
        const voussoirStone = [0.29, 0.29, 0.27];
        const mtnRock = [0.10, 0.13, 0.11];
        const lampC = [3.8, 2.45, 0.85];
        const amberC = [3.0, 1.65, 0.40];
        const greenExit = [0.35, 2.2, 0.75];

        const tStart = 2, tEnd = N - 3;

        // 1. Smoothly Sculpted Mountain Overburden Massif recessed cleanly BEHIND the portal massif collars (tStart+2..tEnd-2, ZERO flat visor sticking over portal!)
        const mStart = tStart + 2, mEnd = tEnd - 2;
        const mLats = [-52.0, -34.0, -20.0, -11.5, -5.0, 0.0, 5.0, 11.5, 20.0, 34.0, 52.0];
        const mGrid = [];
        for (let i = mStart; i <= mEnd; i++) {
          const p0 = pts[i];
          const u0 = Math.max(0, Math.min(1, (i - mStart) / Math.max(1, mEnd - mStart)));
          const domeU = Math.sin(u0 * Math.PI);
          const topH = (H + 2.65) + 18.5 * Math.pow(Math.max(0.0, domeU), 0.68);
          const edgeTaper = 0.48 + 0.52 * domeU;
          const cragScale = Math.min(1.0, domeU * 3.0);
          const crag = (k) => (Math.sin(p0.s * 0.17 + k * 2.1) * 1.45 + Math.cos(p0.s * 0.31 - k * 1.4) * 0.85) * cragScale;
          const hs = [
            -12.0,
            Math.max(-2.0, topH * 0.38 * edgeTaper + crag(1)),
            Math.max(H + 0.6, topH * 0.74 * edgeTaper + crag(2)),
            Math.max(H + 1.8, topH * 0.92 + crag(3)),
            Math.max(H + 2.2, topH * 1.00 + crag(4)),
            Math.max(H + 2.4, topH * 1.05 + crag(5)),
            Math.max(H + 2.2, topH * 1.00 + crag(6)),
            Math.max(H + 1.8, topH * 0.92 + crag(7)),
            Math.max(H + 0.6, topH * 0.74 * edgeTaper + crag(8)),
            Math.max(-2.0, topH * 0.38 * edgeTaper + crag(9)),
            -12.0
          ];
          const row = [];
          for (let k = 0; k < mLats.length; k++) row.push(ptAt(p0, mLats[k], hs[k]));
          mGrid.push(row);
        }
        const mRows = mGrid.length - 1, mC = mLats.length - 1;
        const mGNrm = (r, c) => {
          const r0 = Math.max(0, r - 1), r1 = Math.min(mRows, r + 1);
          const c0 = Math.max(0, c - 1), c1 = Math.min(mC, c + 1);
          const v1 = [mGrid[r1][c][0]-mGrid[r0][c][0], mGrid[r1][c][1]-mGrid[r0][c][1], mGrid[r1][c][2]-mGrid[r0][c][2]];
          const v2 = [mGrid[r][c1][0]-mGrid[r][c0][0], mGrid[r][c1][1]-mGrid[r][c0][1], mGrid[r][c1][2]-mGrid[r][c0][2]];
          let nx = v1[1]*v2[2]-v1[2]*v2[1], ny = v1[2]*v2[0]-v1[0]*v2[2], nz = v1[0]*v2[1]-v1[1]*v2[0];
          if (ny < 0) { nx=-nx; ny=-ny; nz=-nz; }
          const nl = Math.hypot(nx, ny, nz) || 1;
          return [nx/nl, ny/nl, nz/nl];
        };
        for (let r = 0; r < mRows; r++) {
          for (let c = 0; c < mC; c++) {
            addSmoothQuad(
              mGrid[r][c], mGrid[r][c+1], mGrid[r+1][c+1], mGrid[r+1][c],
              mGNrm(r, c), mGNrm(r, c+1), mGNrm(r+1, c+1), mGNrm(r+1, c),
              0, 0, 0, 0, mtnRock, 5
            );
          }
        }

        // 2. High-Detail Curved Tunnel Barrel Vault + Periodic 3D Arch Ribs + Overhead Conduit Pipes + Tiled Dado + Lamps
        for (let i = tStart; i < tEnd; i++) {
          const p0 = pts[i], p1 = pts[i + 1];
          for (let a = 0; a < archSegs; a++) {
            const a0 = (a / archSegs) * Math.PI, a1 = ((a + 1) / archSegs) * Math.PI;
            const lat0 = -Math.cos(a0) * R, h0 = Math.sin(a0) * H;
            const lat1 = -Math.cos(a1) * R, h1 = Math.sin(a1) * H;
            const uH0 = Math.sin(a0), uH1 = Math.sin(a1);
            // Analytical inward-pointing cylindrical vault normals (100% smooth shading, ZERO faceted strips!)
            const n0a = [p0.right[0] * Math.cos(a0), -Math.sin(a0), p0.right[2] * Math.cos(a0)];
            const n0b = [p0.right[0] * Math.cos(a1), -Math.sin(a1), p0.right[2] * Math.cos(a1)];
            const n1a = [p1.right[0] * Math.cos(a0), -Math.sin(a0), p1.right[2] * Math.cos(a0)];
            const n1b = [p1.right[0] * Math.cos(a1), -Math.sin(a1), p1.right[2] * Math.cos(a1)];
            addSmoothQuad(
              ptAt(p0, lat0, h0), ptAt(p1, lat0, h0), ptAt(p1, lat1, h1), ptAt(p0, lat1, h1),
              n0a, n1a, n1b, n0b, uH0, uH0, uH1, uH1, wallC, 3,
              [[p0.s, wallC[0], wallC[1]], [p1.s, wallC[0], wallC[1]], [p1.s, wallC[0], wallC[1]], [p0.s, wallC[0], wallC[1]]]
            );
          }
          // Raised beveled concrete maintenance curbs, drainage lips, handrails & cable trays along both walls
          for (const side of [-1, 1]) {
            addBeam(ptAt(p0, side * (ROAD_HALF_W + 0.58), 0.28), ptAt(p1, side * (ROAD_HALF_W + 0.58), 0.28), 0.48, [0.16, 0.17, 0.18], 3);
            addBeam(ptAt(p0, side * (ROAD_HALF_W + 0.10), 0.10), ptAt(p1, side * (ROAD_HALF_W + 0.10), 0.10), 0.10, [0.12, 0.13, 0.14], 0);
            addCylinder(ptAt(p0, side * (ROAD_HALF_W + 0.26), 1.02), ptAt(p1, side * (ROAD_HALF_W + 0.26), 1.02), 0.032, 6, ribC, 0);
            if (i % 2 === 0) {
              addCylinder(ptAt(p0, side * (ROAD_HALF_W + 0.26), 0.48), ptAt(p0, side * (ROAD_HALF_W + 0.26), 1.04), 0.028, 6, ribC, 0);
            }
            addCylinder(ptAt(p0, side * (ROAD_HALF_W + 0.92), 2.52), ptAt(p1, side * (ROAD_HALF_W + 0.92), 2.52), 0.08, 8, ribC, 0);
            if (i % 2 === 0) {
              addBeam(ptAt(p0, side * (ROAD_HALF_W + 0.88), 2.40), ptAt(p0, side * (R - 0.05), 2.40), 0.06, ribC, 0);
            }
            // Smooth cylindrical overhead utility/ventilation conduits + hanger brackets along upper arch shoulders!
            addCylinder(ptAt(p0, side * 3.85, H - 1.35), ptAt(p1, side * 3.85, H - 1.35), 0.14, 10, pipeC, 0);
            addCylinder(ptAt(p0, side * 2.95, H - 0.85), ptAt(p1, side * 2.95, H - 0.85), 0.095, 8, ribC, 0);
            if (i % 4 === 0) {
              addBeam(ptAt(p0, side * 3.85, H - 1.25), ptAt(p0, side * 3.85, H - 0.55), 0.045, ribC, 0);
            }
          }
          // Recessed Emergency SOS / Fire-Hydrant Safety Alcoves + Amber Guide Beacons every 8 bays
          if (i % 8 === 3) {
            const sgn = (i % 16 === 3) ? -1 : 1;
            addBeam(ptAt(p0, sgn * (R - 0.34), 1.45), ptAt(p0, sgn * (R - 0.34), 2.28), 0.32, [0.12, 0.13, 0.14], 0);
            addBeam(ptAt(p0, sgn * (R - 0.22), 1.62), ptAt(p0, sgn * (R - 0.22), 2.12), 0.20, [0.76, 0.16, 0.10], 0);
            addBeam(ptAt(p0, sgn * (R - 0.24), 2.38), ptAt(p0, sgn * (R - 0.24), 2.54), 0.10, amberC, 4);
          }
          // Central overhead power conduit spine
          addCylinder(ptAt(p0, 0.0, H - 0.20), ptAt(p1, 0.0, H - 0.20), 0.11, 8, ribC, 0);

          // Continuous Extruded 44-Segment Curved Steel I-Beam Rib Arches EVERY 2 bays (ZERO miter gaps!)
          if (i % 2 === 0) {
            const rOut = R - 0.02, hOut = H - 0.02, rIn = R - 0.34, hIn = H - 0.34;
            const halfZ = 0.16;
            const ptZ = (p, lat, h, fz) => [p.pos[0] + p.right[0]*lat + p.fwd[0]*fz, p.pos[1] + h, p.pos[2] + p.right[2]*lat + p.fwd[2]*fz];
            for (let a = 0; a < archSegs; a++) {
              const a0 = (a / archSegs) * Math.PI, a1 = ((a + 1) / archSegs) * Math.PI;
              const c0 = -Math.cos(a0), s0 = Math.sin(a0), c1 = -Math.cos(a1), s1 = Math.sin(a1);
              // Inner curved flange (smooth normal pointing inward)
              const ni0 = [-c0 * p0.right[0], -s0, -c0 * p0.right[2]];
              const ni1 = [-c1 * p0.right[0], -s1, -c1 * p0.right[2]];
              addSmoothQuad(
                ptZ(p0, c0*rIn, s0*hIn, -halfZ), ptZ(p0, c0*rIn, s0*hIn,  halfZ),
                ptZ(p0, c1*rIn, s1*hIn,  halfZ), ptZ(p0, c1*rIn, s1*hIn, -halfZ),
                ni0, ni0, ni1, ni1, 0, 0, 0, 0, ribC, 0
              );
              // Front & back web faces of the continuous steel arch rib
              addQuad(ptZ(p0, c0*rOut, s0*hOut, -halfZ), ptZ(p0, c0*rIn, s0*hIn, -halfZ), ptZ(p0, c1*rIn, s1*hIn, -halfZ), ptZ(p0, c1*rOut, s1*hOut, -halfZ), ribC, 0);
              addQuad(ptZ(p0, c0*rIn, s0*hIn,   halfZ), ptZ(p0, c0*rOut, s0*hOut,  halfZ), ptZ(p0, c1*rOut, s1*hOut,  halfZ), ptZ(p0, c1*rIn, s1*hIn,   halfZ), ribC, 0);
            }
          }
          // Warm sodium ceiling lamp fixtures + industrial pendant bowl lamps (1:1 隧道内.jpg!) every 3 bays (~13m)
          if (i % 3 === 1) {
            addBeam(ptAt(p0, -0.95, H - 0.34), ptAt(p0, 0.95, H - 0.34), 0.20, ribC, 0);
            addBeam(ptAt(p0, -0.78, H - 0.45), ptAt(p0, 0.78, H - 0.45), 0.14, lampC, 4);
            // Hanging pendant bowl lamp on alternate bays
            if (i % 6 === 1) {
              addCylinder(ptAt(p0, 0.0, H - 0.20), ptAt(p0, 0.0, H - 0.82), 0.04, 6, ribC, 0);
              addCylinder(ptAt(p0, 0.0, H - 0.82), ptAt(p0, 0.0, H - 0.98), 0.36, 10, ribC, 0);
              addCylinder(ptAt(p0, 0.0, H - 0.98), ptAt(p0, 0.0, H - 1.12), 0.26, 10, lampC, 4);
            }
            addBeam(ptAt(p0, -(R - 0.18), 1.32), ptAt(p0, -(R - 0.18), 1.66), 0.10, amberC, 4);
            addBeam(ptAt(p0,  (R - 0.18), 1.32), ptAt(p0,  (R - 0.18), 1.66), 0.10, amberC, 4);
          }
          // Twin 16-segment cylindrical overhead tunnel jet fans every 6 bays + green exit markers (ZERO square boxes!)
          if (i % 6 === 4) {
            for (const fx of [-2.05, 2.05]) {
              addCylinder(ptAt(p0, fx, H - 1.05), ptAt(p1, fx, H - 1.05), 0.44, 16, pipeC, 0);
              // Dark intake & exhaust bezel rings + twin hanger rods anchored cleanly to tunnel crown
              const pRingEnd = [p0.pos[0] + p0.right[0]*fx + p0.fwd[0]*0.32, p0.pos[1] + H - 1.05, p0.pos[2] + p0.right[2]*fx + p0.fwd[2]*0.32];
              addCylinder(ptAt(p0, fx, H - 1.05), pRingEnd, 0.48, 16, ribC, 0);
              addBeam(ptAt(p0, fx - 0.28, H - 0.68), ptAt(p0, fx - 0.28, H - 0.06), 0.055, ribC, 0);
              addBeam(ptAt(p0, fx + 0.28, H - 0.68), ptAt(p0, fx + 0.28, H - 0.06), 0.055, ribC, 0);
            }
            addBeam(ptAt(p0, -(R - 0.16), 2.12), ptAt(p0, -(R - 0.16), 2.44), 0.13, greenExit, 4);
            // Overhead lane-status green/amber LED indicator sign mounted on tunnel crown rib
            addBeam(ptAt(p0, -0.55, H - 0.58), ptAt(p0, 0.55, H - 0.58), 0.14, ribC, 0);
            addBeam(ptAt(p0, -0.22, H - 0.64), ptAt(p0, 0.22, H - 0.64), 0.08, greenExit, 4);
          }
        }

        // 4. Sculpted Mountain-Embedded Ashlar Stone & Red-Brick Wing Tunnel Portal (1:1 aligned with err_06 goal & 隧道.jpg!)
        const buildPortal = (pPortal, dirSign) => {
          const wallTop = H + 2.65;
          const spanHalfW = R + 5.4; // Wide dressed-stone headwall
          const wingOuterW = spanHalfW + 6.8; // Flared aged-brick wing walls tucking deep into hillside!
          const ptOff = (p, lat, h, fwdOff) => [
            p.pos[0] + p.right[0] * lat + p.fwd[0] * fwdOff,
            p.pos[1] + h,
            p.pos[2] + p.right[2] * lat + p.fwd[2] * fwdOff,
          ];
          const brickPortal = [0.46, 0.21, 0.14];
          const capConcrete = [0.22, 0.23, 0.22];
          // Smooth continuous arched coping profile across the entire headwall + brick wings (matches err_06 gently arched cornice!)
          const copingH = (latAbs) => {
            const t = Math.min(1.0, latAbs / wingOuterW);
            return wallTop - 2.65 * t * t;
          };

          // A. Continuous stone arch ring + recessed dark-stone inner molding + spandrel headwall up to smooth arched coping
          for (let a = 0; a < archSegs; a++) {
            const a0 = (a / archSegs) * Math.PI, a1 = ((a + 1) / archSegs) * Math.PI;
            const lat0 = -Math.cos(a0) * R, h0 = Math.sin(a0) * H;
            const lat1 = -Math.cos(a1) * R, h1 = Math.sin(a1) * H;
            const isKey = Math.abs(a - archSegs * 0.5 + 0.5) < 1.3;
            const vRad = isKey ? 0.54 : 0.44;
            // Heavy sculpted stone voussoir arch ring + inner chamfered reveal ring
            addCylinder(ptOff(pPortal, lat0, h0, dirSign * 0.68), ptOff(pPortal, lat1, h1, dirSign * 0.68), vRad, 8, isKey ? voussoirStone : portalStone, 1);
            addCylinder(ptOff(pPortal, lat0 * 0.96, h0 * 0.96, dirSign * 0.12), ptOff(pPortal, lat1 * 0.96, h1 * 0.96, dirSign * 0.12), 0.36, 8, [0.18, 0.18, 0.17], 1);
            // Outer stone hood-molding framing the arch
            addCylinder(ptOff(pPortal, lat0 * 1.09, h0 * 1.08, dirSign * 0.84), ptOff(pPortal, lat1 * 1.09, h1 * 1.08, dirSign * 0.84), 0.22, 8, voussoirStone, 1);

            // Solid dressed-stone spandrel wall filling cleanly between arch ring and gently arched top coping
            const bl0 = -Math.cos(a0) * spanHalfW, bh0 = copingH(Math.abs(bl0));
            const bl1 = -Math.cos(a1) * spanHalfW, bh1 = copingH(Math.abs(bl1));
            addQuad(
              ptOff(pPortal, lat0, h0, dirSign * 0.54),
              ptOff(pPortal, lat1, h1, dirSign * 0.54),
              ptOff(pPortal, bl1, bh1, dirSign * 0.54),
              ptOff(pPortal, bl0, bh0, dirSign * 0.54),
              portalStone, 1
            );
            // Overhanging arched stone/concrete drip coping cap (projecting forward with crisp shadow lip!)
            addQuad(
              ptOff(pPortal, bl0, bh0 + 0.02, dirSign * 1.08),
              ptOff(pPortal, bl1, bh1 + 0.02, dirSign * 1.08),
              ptOff(pPortal, bl1, bh1 + 0.38, dirSign * 0.15),
              ptOff(pPortal, bl0, bh0 + 0.38, dirSign * 0.15),
              capConcrete, 1
            );
            addCylinder(ptOff(pPortal, bl0, bh0 + 0.06, dirSign * 1.05), ptOff(pPortal, bl1, bh1 + 0.06, dirSign * 1.05), 0.24, 8, capConcrete, 1);

          }

          // A2. Sculpted Multi-Ring High-Resolution Mountain Massif Collar (hugs arched coping & receding brick wing curve tightly, ZERO sticking-out dark-green visor!)
          const mRings = 8, mCols = 22;
          const massifGrid = [];
          for (let ri = 0; ri <= mRings; ri++) {
            const rv = ri / mRings;
            const row = [];
            for (let ci = 0; ci <= mCols; ci++) {
              const u = (ci / mCols) * 2.0 - 1.0;
              const absU = Math.abs(u);
              // At ri=0 stay strictly inside headwall/wing span; expand organically into mountain only as rv deepens!
              const lat = u * (spanHalfW + (wingOuterW - spanHalfW) * Math.min(1.0, 0.88 + rv * 0.35) + 9.0 * rv * rv);
              const archH = copingH(Math.min(wingOuterW, Math.abs(lat)));
              const wingRecede = Math.pow(Math.max(0.0, (absU - 0.48) / 0.52), 1.75) * 5.8;
              const crownRise = Math.pow(Math.max(0.0, 1.0 - absU * absU * 0.96), 0.85) * (14.5 * Math.pow(rv, 0.78));
              const flankDrop = Math.pow(Math.max(0.0, (absU - 0.38) / 0.62), 1.55) * (11.5 + rv * 7.5);
              // Round 6: Stronger multi-frequency crag relief on tunnel portal massif brow (eliminates smooth mound silhouette!)
              const crag = (Math.sin(lat * 0.48 + rv * 8.5 + pPortal.s * 0.15) * 1.45 + Math.cos(lat * 0.96 - rv * 13.4) * 0.82 + Math.sin(lat * 1.75 + rv * 6.0) * 0.42) * Math.min(1.0, rv * 2.8 + 0.18);
              const hVal = archH + 0.08 + crownRise - flankDrop + crag;
              const fwdVal = dirSign * (0.12 - wingRecede - rv * 16.5);
              row.push(ptOff(pPortal, lat, hVal, fwdVal));
            }
            massifGrid.push(row);
          }
          const mNorm = (ri, ci) => {
            const r0 = Math.max(0, ri - 1), r1 = Math.min(mRings, ri + 1);
            const c0 = Math.max(0, ci - 1), c1 = Math.min(mCols, ci + 1);
            const a = massifGrid[r1][ci], b = massifGrid[r0][ci];
            const d = massifGrid[ri][c1], e = massifGrid[ri][c0];
            const v1 = [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
            const v2 = [d[0]-e[0], d[1]-e[1], d[2]-e[2]];
            let nx = v1[1]*v2[2]-v1[2]*v2[1], ny = v1[2]*v2[0]-v1[0]*v2[2], nz = v1[0]*v2[1]-v1[1]*v2[0];
            if (ny < 0) { nx=-nx; ny=-ny; nz=-nz; }
            const nl = Math.hypot(nx, ny, nz) || 1;
            return [nx/nl, ny/nl, nz/nl];
          };
          for (let ri = 0; ri < mRings; ri++) {
            for (let ci = 0; ci < mCols; ci++) {
              addSmoothQuad(
                massifGrid[ri][ci], massifGrid[ri][ci+1], massifGrid[ri+1][ci+1], massifGrid[ri+1][ci],
                mNorm(ri, ci), mNorm(ri, ci+1), mNorm(ri+1, ci+1), mNorm(ri+1, ci),
                0, 0, 0, 0, mtnRock, 5
              );
            }
          }

          // B. Solid Stone Headwall Piers + Curved Aged-Brick Wing Walls tucked deeply into flanking rocky hillsides!
          for (const sgn of [-1, 1]) {
            const hSpanEdge = copingH(spanHalfW);
            // Solid stone masonry pier anchored -9m into bedrock (eliminates any under-pier void!)
            addQuad(
              ptOff(pPortal, sgn * R, -9.0, dirSign * 0.54),
              ptOff(pPortal, sgn * spanHalfW, -9.0, dirSign * 0.54),
              ptOff(pPortal, sgn * spanHalfW, hSpanEdge, dirSign * 0.54),
              ptOff(pPortal, sgn * R, copingH(R), dirSign * 0.54),
              portalStone, 1
            );
            // 6-segment curved aged-brick retaining wing wall sweeping smoothly BACK (-5.8m) and plunging into native mountain slope (ZERO floating gap!)
            const wSteps = 6;
            for (let wi = 0; wi < wSteps; wi++) {
              const t0 = wi / wSteps, t1 = (wi + 1) / wSteps;
              const latA = sgn * (spanHalfW + t0 * (wingOuterW - spanHalfW));
              const latB = sgn * (spanHalfW + t1 * (wingOuterW - spanHalfW));
              const fwdA = dirSign * (0.54 + Math.sin(t0 * Math.PI) * 0.65 - t0 * t0 * 5.8);
              const fwdB = dirSign * (0.54 + Math.sin(t1 * Math.PI) * 0.65 - t1 * t1 * 5.8);
              const hTopA = copingH(Math.abs(latA)) * (1.0 - t0 * 0.34);
              const hTopB = copingH(Math.abs(latB)) * (1.0 - t1 * 0.34);
              addQuad(
                ptOff(pPortal, latA, -10.5, fwdA),
                ptOff(pPortal, latB, -10.5, fwdB),
                ptOff(pPortal, latB, hTopB, fwdB),
                ptOff(pPortal, latA, hTopA, fwdA),
                brickPortal, 6
              );
              addCylinder(ptOff(pPortal, latA, hTopA + 0.08, fwdA + dirSign * 0.28), ptOff(pPortal, latB, hTopB + 0.08, fwdB + dirSign * 0.28), 0.26, 8, capConcrete, 1);
            }
          }
          // C. Sculpted stone keystone + warm recessed portal wall sconces flanking the stone arch (matches err_06!)
          addCylinder(ptOff(pPortal, 0.0, H - 0.05, dirSign * 0.85), ptOff(pPortal, 0.0, H + 1.05, dirSign * 0.85), 0.44, 8, voussoirStone, 1);
          for (const side of [-1, 1]) {
            const lx = side * (R + 1.85);
            const ly = H * 0.78;
            addBeam(ptOff(pPortal, lx, ly - 0.38, dirSign * 0.62), ptOff(pPortal, lx, ly + 0.38, dirSign * 0.62), 0.24, [0.10, 0.11, 0.12], 0);
            addBeam(ptOff(pPortal, lx, ly - 0.26, dirSign * 0.72), ptOff(pPortal, lx, ly + 0.26, dirSign * 0.72), 0.16, [4.2, 2.85, 0.95], 4);
          }
        };

        buildPortal(pts[tStart], -1);
        buildPortal(pts[tEnd], 1);
      }
      return PV.createMesh(this.gl, { positions: pos, normals: nrm, uvs: uv, colors: col, indices: idx });
    }

    sampleAtS(s) {
      if (!this.segments.length) return null;
      let seg = this.segments[0];
      for (let i = 0; i < this.segments.length; i++) {
        if (s <= this.segments[i].sEnd || i === this.segments.length - 1) { seg = this.segments[i]; break; }
      }
      const segLen = seg.len || SEG_LEN;
      const nSamp = seg.samples || (seg.pts.length - 1);
      const localS = Math.max(0, Math.min(segLen, s - seg.sStart));
      const f = (localS / segLen) * nSamp, i0 = Math.min(nSamp - 1, Math.floor(f)), t = f - i0;
      const a = seg.pts[i0], b = seg.pts[i0 + 1], lerp = (u, v) => u + (v - u) * t;
      let dyaw = b.yaw - a.yaw;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      const yaw = a.yaw + dyaw * t, pitch = lerp(a.pitch, b.pitch), bank = lerp(a.bank, b.bank);
      return {
        s, pos: [lerp(a.pos[0], b.pos[0]), lerp(a.pos[1], b.pos[1]), lerp(a.pos[2], b.pos[2])],
        yaw, pitch, bank,
        right: [-Math.cos(yaw), 0, Math.sin(yaw)],
        fwd: [Math.sin(yaw)*Math.cos(pitch), Math.sin(pitch), Math.cos(yaw)*Math.cos(pitch)],
        seg,
      };
    }

    // Smooth 0..1 tunnel enclosure factor for rain occlusion & lighting adaptation
    tunnelFactor(s) {
      const sp = this.sampleAtS(s);
      if (!sp || sp.seg.surfMode !== 2) return 0.0;
      const localS = s - sp.seg.sStart;
      const inF = Math.max(0, Math.min(1, (localS - 6.0) / 10.0));
      const segLen = sp.seg.len || SEG_LEN;
      const outF = Math.max(0, Math.min(1, (segLen - 8.0 - localS) / 10.0));
      return Math.min(inF, outF);
    }

    // Smooth 0..1 bridge span factor for spatial acoustics (hollow deck resonance + expansion joints + river gorge rush)
    bridgeFactor(s) {
      const sp = this.sampleAtS(s);
      if (!sp || sp.seg.surfMode !== 1) return 0.0;
      const localS = s - sp.seg.sStart;
      const inF = Math.max(0, Math.min(1, (localS - 3.0) / 8.0));
      const segLen = sp.seg.len || SEG_LEN;
      const outF = Math.max(0, Math.min(1, (segLen - 4.0 - localS) / 8.0));
      return Math.min(inF, outF);
    }

    // Unified real-time acoustic environment descriptor (zero-allocation reuse object)
    getAcousticEnv(s, out) {
      const env = out || {};
      const sp = this.sampleAtS(s);
      const seg = sp ? sp.seg : null;
      const surfMode = seg ? (seg.surfMode || 0) : 0;
      const themeId = seg ? (seg.themeId || 0) : 0;
      env.tunnel = this.tunnelFactor(s);
      env.bridge = this.bridgeFactor(s);
      env.surfMode = surfMode;
      env.themeId = themeId;
      env.bridgeStyle = (seg && surfMode === 1) ? (seg.bridgeStyle || 'truss') : 'none';
      // Water rush: bridges, lakeside loop (theme 2), creek/water crossings
      const isWaterSeg = seg && (surfMode === 1 || seg.hasLake || themeId === 2 || seg.type === 'creek_crossing' || seg.type === 'water_crossing');
      env.waterNearby = surfMode === 1 ? (0.45 + 0.55 * env.bridge) : (isWaterSeg ? 0.65 : 0.0);
      // Forest birdsong habitat: alpine, lakeside, birch, kyoto shrine (NOT snow peak, quarry, tunnel, or mid-bridge)
      env.forestFactor = (surfMode === 0 && (themeId === 0 || themeId === 2 || themeId === 4 || themeId === 6)) ? 1.0 : 0.0;
      // Wind exposure: high on snow peak (1), cliffside (3), cross-biome cliffs/ridges, bridge spans
      const isExposed = themeId === 1 || themeId === 3 || (seg && (seg.hasCloudSea || seg.landform === 'ridge_crest'));
      env.exposure = surfMode === 2 ? 0.0 : (surfMode === 1 ? 0.85 : (isExposed ? 0.95 : 0.45));
      return env;
    }

    sampleGroundY(s, lat) {
      const sp = this.sampleAtS(s);
      if (!sp) return 0;
      const latEff = this.mapLat ? this.mapLat(sp, lat) : lat;
      const bankY = Math.sin(sp.bank) * Math.max(-ROAD_HALF_W, Math.min(ROAD_HALF_W, latEff));
      const u = Math.max(0, Math.min(1, (s - sp.seg.sStart) / (sp.seg.len || SEG_LEN)));
      const sm = this._profBlend(sp.seg, u);
      const profL = sp.seg.leftStart + (sp.seg.leftEnd - sp.seg.leftStart) * sm;
      const profR = sp.seg.rightStart + (sp.seg.rightEnd - sp.seg.rightStart) * sm;
      const sideProf = latEff < 0 ? profL : profR;
      let h = this._evalContinuousHeight(sideProf, latEff, s, sp.seg.surfMode, u);
      if (sp.seg.surfMode === 1 && Math.abs(latEff) <= ROAD_HALF_W + 30.0) {
        const gDrop = Math.min(1.0, Math.min(Math.max(0, u - 0.02) / 0.07, Math.max(0, 0.98 - u) / 0.07));
        const gSm = gDrop * gDrop * (3.0 - 2.0 * gDrop);
        const latFade = Math.abs(latEff) <= ROAD_HALF_W + 14.0 ? 1.0 : Math.max(0.0, 1.0 - (Math.abs(latEff) - (ROAD_HALF_W + 14.0)) / 16.0);
        h = h + (-19.0 - h) * gSm * latFade;
      }
      let wy = sp.pos[1] + bankY + h;
      if (Math.abs(lat) > ROAD_HALF_W + 0.5) {
        const wx = sp.pos[0] + sp.right[0] * latEff;
        const wz = sp.pos[2] + sp.right[2] * latEff;
        const capY = this._clearanceCapY(wx, wz, sp.seg.id, false, s);
        if (wy > capY) wy = capY;
      }
      return wy;
    }

    maxSeamGap() {
      let maxGap = 0.0;
      for (let i = 0; i < this.segments.length - 1; i++) {
        const a = this.segments[i]._seamEndRow;
        const b = this.segments[i + 1]._seamStartRow;
        if (!a || !b || a.length !== b.length) continue;
        for (let j = 0; j < a.length; j++) {
          const g = Math.hypot(a[j][0] - b[j][0], a[j][1] - b[j][1], a[j][2] - b[j][2]);
          if (g > maxGap) maxGap = g;
        }
      }
      return maxGap;
    }

    updateStream(carS, carPos, onOriginShift, onSegmentsChanged) {
      let changed = false;
      // True compact sliding-window eviction: dispose passed segment immediately once 24m behind car!
      while (this.segments.length && carS > this.segments[0].sEnd + 24.0) {
        this._disposeSeg(this.segments.shift());
        this._appendNextRuleSegment();
        changed = true;
      }
      if (carPos[0]*carPos[0] + carPos[2]*carPos[2] > 2400 * 2400) {
        const dx = carPos[0], dy = 0, dz = carPos[2];
        this.originOffset[0] += dx; this.originOffset[2] += dz;
        this.originResets++;
        this.endPos[0] -= dx; this.endPos[2] -= dz;
        for (const seg of this.segments) {
          for (const p of seg.pts) { p.pos[0] -= dx; p.pos[2] -= dz; }
          this._disposeSeg(seg);
          this._buildSegmentMeshes(seg);
        }
        if (onOriginShift) onOriginShift(dx, dy, dz);
        changed = true;
      }
      if (changed && onSegmentsChanged) onSegmentsChanged();
    }


    _extractFrustum(m) {
      const f = this._frustum;
      // Left, Right, Bottom, Top, Near, Far planes from column-major VP matrix
      const setP = (o, a, b, c, d) => {
        const inv = 1.0 / (Math.hypot(a, b, c) || 1.0);
        f[o] = a * inv; f[o+1] = b * inv; f[o+2] = c * inv; f[o+3] = d * inv;
      };
      setP( 0, m[3]+m[0], m[7]+m[4], m[11]+m[8],  m[15]+m[12]);
      setP( 4, m[3]-m[0], m[7]-m[4], m[11]-m[8],  m[15]-m[12]);
      setP( 8, m[3]+m[1], m[7]+m[5], m[11]+m[9],  m[15]+m[13]);
      setP(12, m[3]-m[1], m[7]-m[5], m[11]-m[9],  m[15]-m[13]);
      setP(16, m[3]+m[2], m[7]+m[6], m[11]+m[10], m[15]+m[14]);
      setP(20, m[3]-m[2], m[7]-m[6], m[11]-m[10], m[15]-m[14]);
    }

    _segVisible(seg) {
      const mid = seg.pts[seg.pts.length >> 1].pos;
      const x = mid[0], y = mid[1], z = mid[2];
      const r = (seg.len || SEG_LEN) * 0.86; // Dynamic conservative frustum sphere for 120m..228m segments!
      const f = this._frustum;
      for (let i = 0; i < 24; i += 4) {
        if (f[i]*x + f[i+1]*y + f[i+2]*z + f[i+3] < -r) return false;
      }
      return true;
    }

    draw(renderer, time) {
      this._simTime = time || 0.0;
      const gl = this.gl;
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      this._extractFrustum(renderer.vpMat);
      for (const seg of this.segments) seg._vis = this._segVisible(seg);

      const up = this.unifiedProg;
      gl.useProgram(up.prog);
      gl.uniformMatrix4fv(up.u.uViewProj, false, renderer.vpMat);
      renderer.bindSharedPBRUniforms(up.u, time);
      if (up.u.uOriginOffset) gl.uniform2f(up.u.uOriginOffset, this.originOffset[0], this.originOffset[2]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.road.albedo);      gl.uniform1i(up.u.uRoadAlb, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex.road.normal);      gl.uniform1i(up.u.uRoadNrm, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.tex.grass.albedo);     gl.uniform1i(up.u.uGrassAlb, 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.tex.grass.normal);     gl.uniform1i(up.u.uGrassNrm, 3);
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.tex.rock.albedo);      gl.uniform1i(up.u.uRockAlb, 4);
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, this.tex.rock.normal);      gl.uniform1i(up.u.uRockNrm, 5);
      gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, this.tex.snowRock.albedo);  gl.uniform1i(up.u.uSnowRockAlb, 6);
      gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, this.tex.snowRock.normal);  gl.uniform1i(up.u.uSnowRockNrm, 7);
      gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, this.tex.flagstone.albedo); gl.uniform1i(up.u.uFlagstoneAlb, 8);
      gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, this.tex.flagstone.normal); gl.uniform1i(up.u.uFlagstoneNrm, 9);
      gl.activeTexture(gl.TEXTURE10); gl.bindTexture(gl.TEXTURE_2D, this.tex.redClay.albedo);  gl.uniform1i(up.u.uRedClayAlb, 10);
      gl.activeTexture(gl.TEXTURE11); gl.bindTexture(gl.TEXTURE_2D, this.tex.redClay.normal);  gl.uniform1i(up.u.uRedClayNrm, 11);

      for (const seg of this.segments) {
        if (!seg._vis) continue;
        gl.uniform1f(up.u.uThemeId, seg.themeId || 0);
        gl.uniform1f(up.u.uPrevThemeId, seg.prevThemeId !== undefined ? seg.prevThemeId : (seg.themeId || 0));
        gl.uniform1f(up.u.uSegSStart, seg.sStart || 0);
        if (up.u.uSegSpawnTime) gl.uniform1f(up.u.uSegSpawnTime, seg.spawnTime !== undefined ? seg.spawnTime : -10.0);
        gl.uniform1f(up.u.uSurfMode, seg.surfMode === 2 ? 2.0 : 0.0);
        gl.bindVertexArray(seg.groundMesh.vao);
        gl.drawElements(gl.TRIANGLES, seg.groundMesh.count, seg.groundMesh.indexType, 0);
        if (seg.roadMesh) {
          gl.uniform1f(up.u.uSurfMode, seg.surfMode);
          gl.bindVertexArray(seg.roadMesh.vao);
          gl.drawElements(gl.TRIANGLES, seg.roadMesh.count, seg.roadMesh.indexType, 0);
        }
      }

      const sp = this.structProg;
      gl.useProgram(sp.prog);
      gl.uniformMatrix4fv(sp.u.uViewProj, false, renderer.vpMat);
      renderer.bindSharedPBRUniforms(sp.u, time);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.stoneMasonry.albedo);  gl.uniform1i(sp.u.uStoneAlb, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex.stoneMasonry.normal);  gl.uniform1i(sp.u.uStoneNrm, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.tex.agedBrick.albedo);     gl.uniform1i(sp.u.uBrickAlb, 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.tex.agedBrick.normal);     gl.uniform1i(sp.u.uBrickNrm, 3);
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.tex.weatheredWood.albedo); gl.uniform1i(sp.u.uWoodAlb,  4);
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, this.tex.weatheredWood.normal); gl.uniform1i(sp.u.uWoodNrm,  5);
      gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, this.tex.rock.albedo);          gl.uniform1i(sp.u.uRockAlb,  6);
      gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, this.tex.rock.normal);          gl.uniform1i(sp.u.uRockNrm,  7);
      gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, this.tex.grass.albedo);         gl.uniform1i(sp.u.uGrassAlb, 8);
      gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, this.tex.grass.normal);         gl.uniform1i(sp.u.uGrassNrm, 9);
      gl.disable(gl.CULL_FACE);
      for (const seg of this.segments) {
        if (!seg._vis || !seg.structMesh) continue;
        gl.bindVertexArray(seg.structMesh.vao);
        gl.drawElements(gl.TRIANGLES, seg.structMesh.count, seg.structMesh.indexType, 0);
      }

      // Render Dedicated Animated 3D Lake Water / Cliffside Cloud-Sea / Hydro Dam Spillway Mist
      let hasWater = false;
      for (const seg of this.segments) if (seg.waterMesh) { hasWater = true; break; }
      if (hasWater && this.waterProg) {
        const wp = this.waterProg;
        gl.useProgram(wp.prog);
        gl.uniformMatrix4fv(wp.u.uViewProj, false, renderer.vpMat);
        renderer.bindSharedPBRUniforms(wp.u, time);
        if (wp.u.uOriginOffset) gl.uniform2f(wp.u.uOriginOffset, this.originOffset[0], this.originOffset[2]);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        gl.disable(gl.CULL_FACE);
        for (const seg of this.segments) {
          if (!seg._vis || !seg.waterMesh) continue;
          gl.uniform1f(wp.u.uWaterMode, seg.waterMode || 0);
          if (wp.u.uThemeId) gl.uniform1f(wp.u.uThemeId, seg.themeId || 0);
          gl.depthMask(seg.waterMode === 0);
          gl.bindVertexArray(seg.waterMesh.vao);
          gl.drawElements(gl.TRIANGLES, seg.waterMesh.count, seg.waterMesh.indexType, 0);
        }
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }
      gl.enable(gl.CULL_FACE);
      gl.bindVertexArray(null);
    }
  };
})(window);

