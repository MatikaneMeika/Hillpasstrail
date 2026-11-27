// === glsl_common.js ===
// Anime Form & Clean Color Economy + Realistic Rainy Lighting, Materials, Space & Density
// Key Light: [-0.46, 0.62, 0.63] (cool overcast blue-grey), Separated Sky/Ground Bounce,
// 50m Clear-Zone Distance/Valley Fog, Short Subtle Red Tail-Light Reflection (No Fire-Streak!)
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});

  PV.LIGHT = {
    dir: [-0.38, 0.56, 0.73],
    // Crisp alpine cel-anime directional light (clean bright cloud-break daylight, no overexposure)
    color: [1.14, 1.20, 1.28],
    // Separated clear cerulean sky ambient (B > G > R) vs rich damp earth bounce
    hemiSky: [0.30, 0.46, 0.66],
    hemiGround: [0.11, 0.12, 0.10],
    fogColor: [0.42, 0.58, 0.75],
    skyZenith: [0.10, 0.28, 0.58],
    skyHorizon: [0.50, 0.68, 0.86],
    cloudBright: [0.94, 0.97, 1.00],
    cloudDark: [0.18, 0.28, 0.42],
    exposure: 0.78,
    rainDensity: 1.48,
    rainOpacity: 1.38,
  };
  {
    const d = PV.LIGHT.dir, l = Math.hypot(d[0], d[1], d[2]);
    d[0]/=l; d[1]/=l; d[2]/=l;
  }
  PV.WEATHER_PRESETS = {
    drizzle: {
      label: 'DRIZZLE',
      dir: [-0.40, 0.48, 0.78],
      color: [1.14, 1.13, 1.10],
      hemiSky: [0.25, 0.34, 0.44],
      hemiGround: [0.068, 0.078, 0.056],
      fogColor: [0.52, 0.60, 0.66],
      skyZenith: [0.15, 0.25, 0.39],
      skyMid: [0.38, 0.48, 0.58],
      skyHorizon: [0.66, 0.73, 0.78],
      cloudBright: [0.92, 0.94, 0.96],
      cloudDark: [0.20, 0.26, 0.34],
      tyndallColor: [0.94, 0.95, 0.88],
      tyndallStrength: 0.72,
      exposure: 0.90,
      rainDensity: 0.58,
      rainOpacity: 0.62,
      wetness: 0.74,
    },
    overcast: {
      label: 'RAIN',
      dir: [-0.36, 0.54, 0.76],
      color: [1.04, 1.07, 1.12],
      hemiSky: [0.22, 0.31, 0.40],
      hemiGround: [0.055, 0.068, 0.048],
      fogColor: [0.46, 0.55, 0.63],
      skyZenith: [0.13, 0.22, 0.34],
      skyMid: [0.33, 0.43, 0.53],
      skyHorizon: [0.58, 0.66, 0.73],
      cloudBright: [0.86, 0.90, 0.94],
      cloudDark: [0.16, 0.22, 0.30],
      tyndallColor: [0.80, 0.89, 0.96],
      tyndallStrength: 0.56,
      exposure: 0.90,
      rainDensity: 1.45,
      rainOpacity: 1.18,
    },
    storm_break: {
      label: 'GODRAY',
      dir: [-0.44, 0.42, 0.79],
      color: [1.18, 1.12, 1.02],
      hemiSky: [0.24, 0.31, 0.40],
      hemiGround: [0.075, 0.080, 0.062],
      fogColor: [0.50, 0.55, 0.60],
      skyZenith: [0.13, 0.21, 0.32],
      skyMid: [0.33, 0.42, 0.52],
      skyHorizon: [0.64, 0.66, 0.67],
      cloudBright: [0.95, 0.93, 0.88],
      cloudDark: [0.16, 0.22, 0.30],
      tyndallColor: [0.98, 0.92, 0.80],
      tyndallStrength: 0.72,
      exposure: 0.90,
      rainDensity: 1.15,
      rainOpacity: 1.05,
    },
    downpour: {
      label: 'STORM',
      dir: [-0.30, 0.60, 0.74],
      color: [0.78, 0.84, 0.90],
      hemiSky: [0.20, 0.25, 0.31],
      hemiGround: [0.052, 0.060, 0.050],
      fogColor: [0.38, 0.43, 0.48],
      skyZenith: [0.12, 0.16, 0.21],
      skyMid: [0.25, 0.30, 0.36],
      skyHorizon: [0.46, 0.51, 0.55],
      cloudBright: [0.62, 0.67, 0.72],
      cloudDark: [0.13, 0.16, 0.21],
      tyndallColor: [0.64, 0.72, 0.80],
      tyndallStrength: 0.28,
      exposure: 0.92,
      rainDensity: 1.95,
      rainOpacity: 1.50,
    },
    dusk: {
      label: 'DUSK',
      dir: [-0.52, 0.26, 0.81],
      color: [1.26, 0.92, 0.68],
      hemiSky: [0.22, 0.26, 0.38],
      hemiGround: [0.070, 0.062, 0.058],
      fogColor: [0.46, 0.44, 0.48],
      skyZenith: [0.12, 0.15, 0.27],
      skyMid: [0.34, 0.32, 0.42],
      skyHorizon: [0.74, 0.56, 0.46],
      cloudBright: [0.96, 0.76, 0.62],
      cloudDark: [0.16, 0.17, 0.26],
      tyndallColor: [1.05, 0.76, 0.52],
      tyndallStrength: 0.78,
      exposure: 0.92,
      rainDensity: 1.05,
      rainOpacity: 0.96,
    },
    dawn: {
      label: 'DAWN',
      dir: [0.48, 0.24, 0.84],
      color: [1.32, 1.08, 0.78],
      hemiSky: [0.28, 0.34, 0.44],
      hemiGround: [0.085, 0.078, 0.062],
      fogColor: [0.64, 0.58, 0.52],
      skyZenith: [0.16, 0.24, 0.38],
      skyMid: [0.46, 0.46, 0.50],
      skyHorizon: [0.88, 0.74, 0.56],
      cloudBright: [1.00, 0.90, 0.72],
      cloudDark: [0.22, 0.25, 0.33],
      tyndallColor: [1.14, 0.92, 0.62],
      tyndallStrength: 0.88,
      exposure: 0.90,
      rainDensity: 0.62,
      rainOpacity: 0.72,
    },
    goldmist: {
      label: 'GOLDMIST',
      dir: [-0.46, 0.28, 0.84],
      color: [1.38, 1.08, 0.66],
      hemiSky: [0.30, 0.32, 0.38],
      hemiGround: [0.095, 0.080, 0.055],
      fogColor: [0.68, 0.56, 0.40],
      skyZenith: [0.14, 0.20, 0.30],
      skyMid: [0.46, 0.40, 0.34],
      skyHorizon: [0.94, 0.74, 0.44],
      cloudBright: [1.05, 0.88, 0.58],
      cloudDark: [0.20, 0.19, 0.22],
      tyndallColor: [1.22, 0.90, 0.46],
      tyndallStrength: 0.98,
      exposure: 0.90,
      rainDensity: 0.78,
      rainOpacity: 0.84,
      wetness: 0.76,
    },
    clear: {
      label: 'CLEAR',
      dir: [-0.42, 0.58, 0.70],
      color: [1.28, 1.22, 1.12],
      hemiSky: [0.28, 0.44, 0.66],
      hemiGround: [0.10, 0.105, 0.075],
      fogColor: [0.54, 0.66, 0.78],
      skyZenith: [0.10, 0.28, 0.58],
      skyMid: [0.34, 0.54, 0.76],
      skyHorizon: [0.76, 0.84, 0.90],
      cloudBright: [1.00, 0.99, 0.96],
      cloudDark: [0.34, 0.44, 0.56],
      tyndallColor: [1.02, 0.96, 0.84],
      tyndallStrength: 0.62,
      exposure: 0.88,
      rainDensity: 0.0,
      rainOpacity: 0.0,
      wetness: 0.22,
    },
    mist: {
      label: 'MIST',
      dir: [-0.38, 0.46, 0.80],
      color: [1.10, 1.08, 1.04],
      hemiSky: [0.26, 0.34, 0.42],
      hemiGround: [0.075, 0.085, 0.068],
      fogColor: [0.58, 0.64, 0.68],
      skyZenith: [0.20, 0.28, 0.36],
      skyMid: [0.46, 0.52, 0.58],
      skyHorizon: [0.74, 0.78, 0.80],
      cloudBright: [0.92, 0.94, 0.95],
      cloudDark: [0.26, 0.32, 0.38],
      tyndallColor: [0.96, 0.95, 0.90],
      tyndallStrength: 0.76,
      exposure: 0.90,
      rainDensity: 0.35,
      rainOpacity: 0.45,
      wetness: 0.62,
    },
  };

  // Decoupled Time-of-Day Presets (CK42BB/procedural-weather-threejs inspired!)
  PV.TIME_PRESETS = {
    morning:  { label: 'MORNING',  dir: [ 0.46, 0.38, 0.80], tint: [1.12, 1.04, 0.92], skyTint: [1.06, 1.04, 0.98], exp: 0.92, tyndall: 1.15 },
    noon:     { label: 'NOON',     dir: [-0.36, 0.64, 0.68], tint: [1.04, 1.04, 1.04], skyTint: [1.00, 1.04, 1.08], exp: 0.90, tyndall: 1.00 },
    golden:   { label: 'GOLDEN',   dir: [-0.52, 0.24, 0.82], tint: [1.32, 0.96, 0.62], skyTint: [1.22, 0.92, 0.68], exp: 0.92, tyndall: 1.48 },
    dusk:     { label: 'DUSK',     dir: [-0.56, 0.18, 0.81], tint: [1.24, 0.78, 0.60], skyTint: [1.05, 0.74, 0.84], exp: 0.94, tyndall: 1.32 },
    bluehour: { label: 'NIGHT',    dir: [-0.30, 0.26, 0.92], tint: [0.58, 0.72, 1.18], skyTint: [0.42, 0.56, 0.96], exp: 1.04, tyndall: 0.72 },
    dawn:     { label: 'DAWN',     dir: [ 0.50, 0.22, 0.84], tint: [1.28, 0.98, 0.76], skyTint: [1.18, 0.96, 0.88], exp: 0.92, tyndall: 1.42 },
  };

  // 6 Artist-Tuned Filmic Color-Grade Filter Presets (breaks cold-gray monotony!)
  PV.FILTER_PRESETS = {
    cinema: { id: 0, label: 'CINEMA' },
    verdant: { id: 1, label: 'VERDANT' },
    golden: { id: 2, label: 'GOLDEN' },
    cyber:  { id: 3, label: 'CYBER'  },
    film:    { id: 4, label: 'FILM'    },
    noir:   { id: 5, label: 'NOIR'   },
  };

  PV.LIGHT.timeKey = 'noon';
  PV.LIGHT.filterKey = 'cinema';
  PV.LIGHT.filterId = 0;
  PV.LIGHT.wetness = 0.88;

  PV.composeAtmosphere = function () {
    const p = PV.WEATHER_PRESETS[PV.LIGHT.weatherKey] || PV.WEATHER_PRESETS.overcast;
    const t = PV.TIME_PRESETS[PV.LIGHT.timeKey] || PV.TIME_PRESETS.noon;
    // If weather preset itself is a legacy combined mood (dusk/dawn/goldmist) and time is default noon, keep preset's authored palette;
    // otherwise modulate cleanly by decoupled Time-of-Day tint & sun angle!
    const useTimeMod = (PV.LIGHT.timeKey !== 'noon') || (PV.LIGHT.weatherKey !== 'dusk' && PV.LIGHT.weatherKey !== 'dawn' && PV.LIGHT.weatherKey !== 'goldmist');
    const dirSrc = useTimeMod ? t.dir : p.dir;
    const l = Math.hypot(dirSrc[0], dirSrc[1], dirSrc[2]) || 1;
    PV.LIGHT.dir = [dirSrc[0]/l, dirSrc[1]/l, dirSrc[2]/l];
    const mul3 = (a, b) => [a[0]*b[0], a[1]*b[1], a[2]*b[2]];
    const lt = useTimeMod ? t.tint : [1,1,1];
    const st = useTimeMod ? t.skyTint : [1,1,1];
    PV.LIGHT.color       = mul3(p.color, lt);
    PV.LIGHT.hemiSky     = mul3(p.hemiSky, st);
    PV.LIGHT.hemiGround  = mul3(p.hemiGround, lt);
    PV.LIGHT.fogColor    = mul3(p.fogColor, st);
    PV.LIGHT.skyZenith   = mul3(p.skyZenith, st);
    PV.LIGHT.skyMid      = mul3(p.skyMid || [0.34, 0.41, 0.48], st);
    PV.LIGHT.skyHorizon  = mul3(p.skyHorizon, st);
    PV.LIGHT.cloudBright = mul3(p.cloudBright, lt);
    PV.LIGHT.cloudDark   = mul3(p.cloudDark, st);
    PV.LIGHT.tyndallColor = mul3(p.tyndallColor, lt);
    PV.LIGHT.tyndallStrength = Math.min(1.35, (p.tyndallStrength ?? 0.5) * (useTimeMod ? t.tyndall : 1.0));
    PV.LIGHT.exposure    = (p.exposure || 0.90) * (useTimeMod ? (t.exp / 0.90) : 1.0);
    PV.LIGHT.rainDensity = p.rainDensity;
    PV.LIGHT.rainOpacity = p.rainOpacity;
    PV.LIGHT.wetness     = p.wetness !== undefined ? p.wetness : (p.rainDensity > 1.3 ? 0.96 : (p.rainDensity > 0.6 ? 0.78 : 0.55));
  };

  PV.applyWeather = function (key) {
    PV.LIGHT.weatherKey = PV.WEATHER_PRESETS[key] ? key : 'overcast';
    PV.composeAtmosphere();
    return PV.LIGHT.weatherKey;
  };
  PV.applyTime = function (key) {
    PV.LIGHT.timeKey = PV.TIME_PRESETS[key] ? key : 'noon';
    PV.composeAtmosphere();
    return PV.LIGHT.timeKey;
  };
  PV.applyFilter = function (key) {
    const f = PV.FILTER_PRESETS[key] || PV.FILTER_PRESETS.cinema;
    PV.LIGHT.filterKey = PV.FILTER_PRESETS[key] ? key : 'cinema';
    PV.LIGHT.filterId = f.id;
    return PV.LIGHT.filterKey;
  };
  PV.applyWeather('overcast');
  PV.applyFilter('cinema');

  // High-Fidelity Quality Presets (4096 soft shadows, high DPR, dense multi-species foliage, long vista)
  PV.QUALITY_PRESETS = {
    low:     { label: 'LOW',      dpr: 1.00, shadowSize: 1024, msaa: 0, bloom: true,  kuwahara: false, ssr: false, lensQuality: 1, grassDensity: 0.55, rainScale: 0.55, fogNear: 42, fogFar: 580 },
    med:     { label: 'MED',      dpr: 1.15, shadowSize: 1536, msaa: 2, bloom: true,  kuwahara: false, ssr: false, lensQuality: 1, grassDensity: 0.80, rainScale: 0.85, fogNear: 42, fogFar: 680 },
    high:    { label: 'ULTRA',    dpr: 1.50, shadowSize: 2048, msaa: 4, bloom: true,  kuwahara: false, ssr: true, lensQuality: 2, grassDensity: 1.00, rainScale: 1.15, fogNear: 46, fogFar: 920 },
    xultra: { label: 'XULTRA',   dpr: 1.75, shadowSize: 4096, msaa: 4, bloom: true,  kuwahara: false, ssr: true, lensQuality: 3, grassDensity: 1.00, rainScale: 1.25, fogNear: 48, fogFar: 980 },
  };

  // Unified 6-Speed Sequential Rally Gearbox Telemetry (keeps Cockpit LCD, Wheel OLED, HUD & Spatial Audio 100% phase-locked!)
  const GEAR_TOPS = [0, 38, 68, 98, 128, 158, 215];
  PV.getDrivetrainTelemetry = function (car, out) {
    const t = out || {};
    const kmh = Math.max(0, (car && car.speed ? car.speed : 0) * 3.6);
    let gear = 1;
    if (kmh < 4) gear = 0;
    else {
      for (let g = 1; g <= 6; g++) {
        if (kmh <= GEAR_TOPS[g] || g === 6) { gear = g; break; }
      }
    }
    const lowK = gear > 0 ? GEAR_TOPS[gear - 1] * 0.72 : 0;
    const hiK = gear > 0 ? GEAR_TOPS[gear] : 38;
    const baseNorm = gear === 0 ? 0.14 : Math.max(0.24, Math.min(0.96, (kmh - lowK) / Math.max(12, hiK - lowK)));
    const boostAdd = (car && car.boosting) ? 0.08 : 0.0;
    const driftSlip = Math.min(0.10, Math.abs(car && car.driftAngle ? car.driftAngle : 0) * 0.18);
    const rpmNorm = Math.max(0.14, Math.min(0.99, baseNorm + boostAdd + driftSlip));
    t.kmh = kmh;
    t.gear = gear;
    t.gearLabel = gear === 0 ? 'N' : String(gear);
    t.rpmNorm = rpmNorm;
    t.rpm = Math.round(1350 + rpmNorm * 6150);
    return t;
  };


  const M4 = (PV.M4 = {
    create: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
    identity(out) { out.fill(0); out[0]=out[5]=out[10]=out[15]=1; return out; },
    multiply(out, a, b) {
      const a00=a[0],a01=a[1],a02=a[2],a03=a[3], a10=a[4],a11=a[5],a12=a[6],a13=a[7],
            a20=a[8],a21=a[9],a22=a[10],a23=a[11], a30=a[12],a31=a[13],a32=a[14],a33=a[15];
      let b0,b1,b2,b3;
      b0=b[0];b1=b[1];b2=b[2];b3=b[3];
      out[0]=b0*a00+b1*a10+b2*a20+b3*a30; out[1]=b0*a01+b1*a11+b2*a21+b3*a31;
      out[2]=b0*a02+b1*a12+b2*a22+b3*a32; out[3]=b0*a03+b1*a13+b2*a23+b3*a33;
      b0=b[4];b1=b[5];b2=b[6];b3=b[7];
      out[4]=b0*a00+b1*a10+b2*a20+b3*a30; out[5]=b0*a01+b1*a11+b2*a21+b3*a31;
      out[6]=b0*a02+b1*a12+b2*a22+b3*a32; out[7]=b0*a03+b1*a13+b2*a23+b3*a33;
      b0=b[8];b1=b[9];b2=b[10];b3=b[11];
      out[8]=b0*a00+b1*a10+b2*a20+b3*a30; out[9]=b0*a01+b1*a11+b2*a21+b3*a31;
      out[10]=b0*a02+b1*a12+b2*a22+b3*a32; out[11]=b0*a03+b1*a13+b2*a23+b3*a33;
      b0=b[12];b1=b[13];b2=b[14];b3=b[15];
      out[12]=b0*a00+b1*a10+b2*a20+b3*a30; out[13]=b0*a01+b1*a11+b2*a21+b3*a31;
      out[14]=b0*a02+b1*a12+b2*a22+b3*a32; out[15]=b0*a03+b1*a13+b2*a23+b3*a33;
      return out;
    },
    perspective(out, fovy, aspect, near, far) {
      const f = 1.0 / Math.tan(fovy * 0.5), nf = 1 / (near - far);
      out.fill(0);
      out[0] = f / aspect; out[5] = f;
      out[10] = (far + near) * nf; out[11] = -1;
      out[14] = (2 * far * near) * nf;
      return out;
    },
    ortho(out, left, right, bottom, top, near, far) {
      const lr = 1 / (left - right), bt = 1 / (bottom - top), nf = 1 / (near - far);
      out.fill(0);
      out[0] = -2 * lr; out[5] = -2 * bt; out[10] = 2 * nf;
      out[12] = (left + right) * lr; out[13] = (top + bottom) * bt; out[14] = (far + near) * nf;
      out[15] = 1;
      return out;
    },
    lookAt(out, eye, center, up) {
      let zx = eye[0]-center[0], zy = eye[1]-center[1], zz = eye[2]-center[2];
      let len = Math.hypot(zx, zy, zz) || 1;
      zx /= len; zy /= len; zz /= len;
      let xx = up[1]*zz - up[2]*zy, xy = up[2]*zx - up[0]*zz, xz = up[0]*zy - up[1]*zx;
      len = Math.hypot(xx, xy, xz) || 1;
      xx /= len; xy /= len; xz /= len;
      const yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
      out[0]=xx; out[1]=yx; out[2]=zx; out[3]=0;
      out[4]=xy; out[5]=yy; out[6]=zy; out[7]=0;
      out[8]=xz; out[9]=yz; out[10]=zz; out[11]=0;
      out[12]=-(xx*eye[0]+xy*eye[1]+xz*eye[2]);
      out[13]=-(yx*eye[0]+yy*eye[1]+yz*eye[2]);
      out[14]=-(zx*eye[0]+zy*eye[1]+zz*eye[2]);
      out[15]=1;
      return out;
    },
    fromTRS(out, pos, yaw, pitch, roll, sx, sy, sz) {
      const cy = Math.cos(yaw), sy_ = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const cr = Math.cos(roll), sr = Math.sin(roll);
      const r00 = cy*cr + sy_*sp*sr, r01 = -cy*sr + sy_*sp*cr, r02 = sy_*cp;
      const r10 = cp*sr,             r11 = cp*cr,              r12 = -sp;
      const r20 = -sy_*cr + cy*sp*sr, r21 = sy_*sr + cy*sp*cr, r22 = cy*cp;
      out[0]=r00*sx; out[1]=r10*sx; out[2]=r20*sx; out[3]=0;
      out[4]=r01*sy; out[5]=r11*sy; out[6]=r21*sy; out[7]=0;
      out[8]=r02*sz; out[9]=r12*sz; out[10]=r22*sz; out[11]=0;
      out[12]=pos[0]; out[13]=pos[1]; out[14]=pos[2]; out[15]=1;
      return out;
    },
  });

  PV.PBR_GLSL = /* glsl */ `
const float PI = 3.14159265359;

uniform vec3 uCamPos;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uHemiSky;
uniform vec3 uHemiGround;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uTime;
uniform mat4 uLightVP;
uniform sampler2D uShadowMap;
uniform vec2 uShadowTexel;
uniform vec3 uCarPos;
uniform vec3 uCarFwd;
uniform vec3 uCarRight;
uniform float uWetness;

float pvHash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.5);
  return fract(p.x * p.y);
}
float pvNoise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(pvHash21(i), pvHash21(i + vec2(1.0, 0.0)), f.x),
             mix(pvHash21(i + vec2(0.0, 1.0)), pvHash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float pvFbm2(vec2 p) {
  return pvNoise2(p) * 0.58 + pvNoise2(p * 2.17 + vec2(4.2, -1.7)) * 0.28 + pvNoise2(p * 4.63 - vec2(2.1, 5.3)) * 0.14;
}

vec3 sampleRainyIBL(vec3 R, float rough) {
  vec3 d = normalize(R);
  float y = clamp(d.y, -1.0, 1.0);

  // Dynamic Weather-Driven Rainy Alpine IBL (tracks OVERCAST / GODRAY / STORM / DUSK in real time!)
  vec3 zenith  = uHemiSky * vec3(0.66, 0.72, 0.80);
  vec3 midSky  = mix(uHemiSky * 1.15, uFogColor * 0.92, 0.55);
  vec3 horizon = uFogColor * vec3(1.22, 1.18, 1.15) + uLightColor * 0.08;
  vec3 ground  = uHemiGround * 0.72;
  vec3 skyCol = mix(horizon, midSky, smoothstep(0.0, 0.24, y));
  skyCol = mix(skyCol, zenith, pow(max(y, 0.0), 0.72));

  vec2 cuv = d.xz / (max(y, 0.06) + 0.22) * 1.35;
  float c1 = pvNoise2(cuv * 1.15);
  float c2 = pvNoise2(cuv * 2.65 + vec2(c1 * 0.9, -c1 * 0.7));
  float cMask = smoothstep(0.28, 0.68, c1 * 0.56 + c2 * 0.48);
  vec3 cDark   = uHemiSky * 0.78;
  vec3 cBright = mix(uFogColor * 1.35, uLightColor * 0.92, 0.52);
  vec3 cloudCol = mix(cDark, cBright, smoothstep(0.26, 0.76, c2));
  skyCol = mix(skyCol, cloudCol, cMask * (1.0 - rough * 0.62) * smoothstep(0.02, 0.24, y) * 0.84);

  // Dark reflected spruce pine & rocky cliff silhouette in puddles (creates crisp ref-style dark-edge / bright-center puddles)
  float azim = atan(d.z, d.x);
  float ridgeH = 0.17 + 0.11 * pvNoise2(vec2(azim * 4.2, 1.7)) + 0.06 * pvNoise2(vec2(azim * 14.0, 4.3));
  float treeBand = smoothstep(ridgeH + 0.032, ridgeH - 0.024, y) * smoothstep(-0.02, 0.025, y);
  vec3 darkForestRefl = mix(vec3(0.025, 0.055, 0.036), vec3(0.065, 0.115, 0.072), pvNoise2(vec2(azim * 18.0, y * 14.0)));
  skyCol = mix(skyCol, darkForestRefl, treeBand * (1.0 - rough * 0.72) * 0.90);

  // Subtle overcast cloud-break sheen aligned with light direction
  float sunAlign = max(dot(d, uLightDir), 0.0);
  skyCol += uLightColor * pow(sunAlign, mix(24.0, 3.5, rough)) * mix(0.45, 0.14, rough);

  return mix(ground, skyCol, smoothstep(-0.14, 0.04, y));
}

float sampleShadowPCF(vec3 worldPos, vec3 N) {
  float ndl = max(dot(N, uLightDir), 0.0);
  float bias = max(0.0015 * (1.0 - ndl), 0.00045);
  vec4 lp = uLightVP * vec4(worldPos + N * 0.06, 1.0);
  vec3 proj = lp.xyz / lp.w * 0.5 + 0.5;
  if (proj.x < 0.01 || proj.x > 0.99 || proj.y < 0.01 || proj.y > 0.99 || proj.z > 0.995) return 1.0;
  // AAA 12-Tap Interleaved-Rotated Poisson Disk PCF (52% fewer shadow fetches than 5x5 AND smoother zero-grid penumbra!)
  const vec2 POISSON[12] = vec2[12](
    vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696,  0.457), vec2(-0.203,  0.621),
    vec2( 0.962, -0.195), vec2( 0.473, -0.480), vec2( 0.519,  0.767), vec2( 0.185, -0.893),
    vec2( 0.507,  0.064), vec2( 0.896,  0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
  );
  float ang = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;
  float ca = cos(ang), sa = sin(ang);
  mat2 rot = mat2(ca, -sa, sa, ca);
  vec2 rad = uShadowTexel * 2.35;
  float shadow = 0.0;
  for (int i = 0; i < 12; i++) {
    float d = texture(uShadowMap, proj.xy + (rot * POISSON[i]) * rad).r;
    shadow += (proj.z - bias > d) ? 0.0 : 1.0;
  }
  shadow *= (1.0 / 12.0);
  vec2 edge = smoothstep(vec2(0.01), vec2(0.09), proj.xy) * smoothstep(vec2(0.01), vec2(0.09), 1.0 - proj.xy);
  return mix(1.0, shadow, edge.x * edge.y);
}

// Anime clean tonal separation + realistic PBR specular, clearcoat & sky/ground bounce separation
vec3 evalPBR(
  vec3 worldPos, vec3 N, vec3 V,
  vec3 albedo, float roughness, float metalness, float ao,
  float clearcoat, float shadowVal
) {
  float r = clamp(roughness, 0.03, 0.98);
  float a = r * r, a2 = a * a;
  vec3 L = uLightDir, H = normalize(L + V);
  float NdotL = max(dot(N, L), 0.0);
  float NdotV = max(dot(N, V), 0.001);
  float NdotH = max(dot(N, H), 0.0);
  float HdotV = max(dot(H, V), 0.0);

  vec3 F0 = mix(vec3(0.04), albedo, metalness);
  float denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * denom * denom + 1e-5);
  float k = (r + 1.0) * (r + 1.0) * 0.125;
  float G = (NdotV / (NdotV * (1.0 - k) + k)) * (NdotL / (NdotL * (1.0 - k) + k));
  float omH = 1.0 - HdotV; float omH2 = omH * omH; float omH5 = omH2 * omH2 * omH;
  vec3 F = F0 + (1.0 - F0) * omH5;
  vec3 spec = (D * G * F) / (4.0 * NdotV * NdotL + 0.001);
  // Soft cel-realistic specular shoulder (prevents harsh circular white glare hotspots on car body & foliage)
  spec = spec / (1.0 + spec * 0.48);
  vec3 kD = (1.0 - F) * (1.0 - metalness);

  // Clean 3-band anime-readable cel diffuse ramp blended with physical NdotL
  float b1 = smoothstep(0.08, 0.18, NdotL) * 0.45;
  float b2 = smoothstep(0.46, 0.58, NdotL) * 0.55;
  float celStep = b1 + b2;
  float diffTerm = mix(NdotL, celStep, 0.48);
  // Warm-grey sunlit slope vs cool shadow tint
  vec3 directTint = mix(vec3(0.84, 0.90, 0.98), vec3(1.04, 1.01, 0.97), smoothstep(0.15, 0.75, NdotL * shadowVal));
  vec3 direct = (kD * albedo / PI * diffTerm + spec * NdotL) * uLightColor * directTint * shadowVal;

  // Separated Sky Ambient (cool rainy blue-grey) & Ground Bounce (damp dark earth)
  float skyFactor = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 hemi = mix(uHemiGround, uHemiSky, skyFactor);
  // Subtle cool shadow fill on back-lit faces
  hemi *= mix(vec3(0.76, 0.90, 1.12), vec3(1.0), smoothstep(0.0, 0.6, NdotL * shadowVal));

  vec3 R = reflect(-V, N);
  vec3 envSpec = sampleRainyIBL(R, r);
  float omV = 1.0 - NdotV; float omV2 = omV * omV; float omV5 = omV2 * omV2 * omV;
  vec3 F_env = F0 + (max(vec3(1.0 - r), F0) - F0) * omV5;
  vec3 ambient = (kD * albedo * hemi * 0.88 + envSpec * F_env * mix(0.95, 0.22, r)) * ao;

  if (clearcoat > 0.01) {
    // Softly shaped cel-realistic wet clearcoat (prevents giant blown-out white glare blobs on car deck!)
    float ccR = 0.105, ccA2 = ccR * ccR * ccR * ccR;
    float ccDen = NdotH * NdotH * (ccA2 - 1.0) + 1.0;
    float ccD = ccA2 / (PI * ccDen * ccDen + 1e-5);
    ccD = min(ccD, 3.2);
    float ccF = 0.04 + 0.96 * omV5;
    // Reuse already-evaluated envSpec with crisp wet contrast boost (eliminates duplicate IBL call per pixel!)
    vec3 ccIbl = envSpec * mix(1.0, 1.12, r);
    ambient += (vec3(ccD * 0.22 * NdotL) * uLightColor * shadowVal + ccIbl * ccF * 0.92) * clearcoat * ao;
  }
  return direct + ambient;
}

vec3 evalCarHeadlights(vec3 worldPos, vec3 N, vec3 V, vec3 albedo, float roughness) {
  vec3 col = vec3(0.0);
  vec3 fwd = normalize(vec3(uCarFwd.x, uCarFwd.y - 0.08, uCarFwd.z));
  for (int i = 0; i < 2; i++) {
    float side = (i == 0) ? -0.66 : 0.66;
    vec3 lPos = uCarPos + uCarFwd * 2.0 + uCarRight * side + vec3(0.0, 0.64, 0.0);
    vec3 toP = worldPos - lPos;
    float dist = length(toP);
    if (dist > 36.0) continue;
    vec3 Ldir = toP / (dist + 1e-4);
    float cone = smoothstep(0.78, 0.96, dot(Ldir, fwd));
    float atten = 1.0 / (1.0 + 0.055 * dist + 0.008 * dist * dist);
    float ndl = max(dot(N, -Ldir), 0.0);
    vec3 H = normalize(-Ldir + V);
    float specPow = mix(105.0, 12.0, clamp(roughness, 0.04, 0.95));
    float spec = pow(max(dot(N, H), 0.0), specPow) * mix(2.4, 0.10, roughness);
    col += vec3(1.75, 1.56, 1.22) * cone * atten * (albedo * ndl * 1.10 + vec3(spec));
  }
  return col;
}

// Grounded Wet Puddle Car Silhouette Reflection + Short Restrained Tail-Light Glint (NO orange fire-road!)
vec3 evalWetCarReflection(vec3 worldPos, vec3 ripN, float puddleMask, float dampRing, float rough) {
  vec3 d = worldPos - uCarPos;
  float backDist = -dot(d, uCarFwd);
  if (backDist < 0.75 || backDist > 3.8) return vec3(0.0);
  float lat = dot(d, uCarRight);
  if (abs(lat) > 1.75) return vec3(0.0);

  float microBreak = pvNoise2(worldPos.xz * 7.5 + vec2(0.0, uTime * 0.35));
  float microBreak2 = pvNoise2(worldPos.xz * 16.0 - vec2(uTime * 0.22, 0.0));
  float shimmer = smoothstep(0.32, 0.86, microBreak * 0.60 + microBreak2 * 0.40);

  float rLat = lat + ripN.x * 0.36 + (microBreak - 0.5) * 0.14;
  float rBack = backDist + ripN.z * 0.24;

  // Deep grounded car silhouette & tire reflection in puddles immediately behind rear bumper (1:1 ref_01!)
  float bodyMask = smoothstep(1.22, 0.72, abs(rLat)) * smoothstep(0.68, 1.32, rBack) * smoothstep(3.8, 1.65, rBack);
  float sil = bodyMask * 0.88 * clamp(puddleMask * 0.98 + dampRing * 0.48, 0.0, 1.0);

  // Crisp localized crimson LED taillight ripple reflection directly behind lamps (fades cleanly by 3.0m!)
  float spread = mix(0.12, 0.22, clamp((rBack - 0.95) / 2.2, 0.0, 1.0)) + rough * 0.07;
  float tailL = exp(-pow((rLat + 0.64) / spread, 2.0));
  float tailR = exp(-pow((rLat - 0.64) / spread, 2.0));
  float distFade = smoothstep(0.85, 1.35, rBack) * exp(-(rBack - 0.95) * 1.32);
  float wetBoost = clamp(puddleMask * 1.0 + dampRing * 0.22, 0.0, 1.0);

  vec3 softTail = mix(vec3(0.88, 0.12, 0.04), vec3(1.25, 0.24, 0.08), smoothstep(0.42, 0.90, shimmer));
  vec3 redGlow = softTail * (tailL + tailR) * distFade * wetBoost * (0.50 + 0.50 * shimmer);
  return redGlow - vec3(0.30, 0.32, 0.34) * sil;
}

// Distance-Stratified Atmospheric Scattering & Drifting Valley Mist (Rayleigh/Mie refraction + soft transition)
vec3 applyFog(vec3 color, vec3 worldPos) {
  float dist = length(worldPos - uCamPos);
  if (dist <= 30.0) return color;

  vec3 viewDir = normalize(worldPos - uCamPos);
  float dPast = dist - 30.0;

  // Layer 1: Low-lying drifting valley mist ribbon hugging lower terrain & tree bases
  float mistDrift = 0.72 + 0.28 * pvNoise2(worldPos.xz * 0.014 + vec2(uTime * 0.05, -uTime * 0.03));
  float valleyBand = exp(-max(worldPos.y + 3.0, 0.0) * 0.052) * mistDrift;
  float fValley = (1.0 - exp(-dPast * 0.0085)) * valleyBand * 0.62;

  // Layer 2: Midground cool rainy moisture haze separating foreground conifers from mid ridges
  float fMid = (1.0 - exp(-pow(dPast / 155.0, 1.22))) * 0.56;

  // Layer 3: Far mountain silver-slate aerial perspective
  float fFar = 1.0 - exp(-pow(dPast / max(uFogFar - 30.0, 1.0), 1.28) * 1.85);

  float f = clamp(max(fFar, fValley * 0.82 + fMid * 0.72), 0.0, 0.94);
  // Mie forward scattering + subtle Rayleigh altitude shift
  float mu = max(dot(viewDir, uLightDir), 0.0);
  float mie = pow(mu, 4.0) * 0.20 + pow(mu, 14.0) * 0.14;
  vec3 nearMistCol = uFogColor * vec3(1.04, 1.06, 1.08);
  vec3 farHazeCol  = uFogColor * vec3(0.95, 1.00, 1.06) + uLightColor * mie * 0.22;
  vec3 fogCol = mix(nearMistCol, farHazeCol, smoothstep(55.0, 260.0, dist));
  return mix(color, fogCol, f);
}
`;

  PV.compileShader = function (gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      console.error('Shader compile error:\n', log);
      throw new Error('Shader compile failed: ' + log);
    }
    return sh;
  };

  PV.createProgram = function (gl, vsSrc, fsSrc) {
    const vs = PV.compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = PV.compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('Program link failed: ' + gl.getProgramInfoLog(prog));
    gl.deleteShader(vs); gl.deleteShader(fs);
    const u = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(prog, i); if (info) u[info.name] = gl.getUniformLocation(prog, info.name); }
    return { prog, u };
  };

  PV.createMesh = function (gl, data) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const bufs = [];
    function bindAttr(loc, arr, size) {
      if (!arr) return;
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, arr instanceof Float32Array ? arr : new Float32Array(arr), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      bufs.push(b);
    }
    bindAttr(0, data.positions, 3); bindAttr(1, data.normals, 3); bindAttr(2, data.uvs, 2); bindAttr(3, data.colors, 3);
    let count = 0, indexType = gl.UNSIGNED_SHORT;
    if (data.indices) {
      const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      const use32 = (data.positions.length / 3) > 65535 || data.indices instanceof Uint32Array;
      const idxArr = use32 ? (data.indices instanceof Uint32Array ? data.indices : new Uint32Array(data.indices))
                           : (data.indices instanceof Uint16Array ? data.indices : new Uint16Array(data.indices));
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxArr, gl.STATIC_DRAW);
      count = idxArr.length; indexType = use32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      bufs.push(ibo);
    } else count = data.positions.length / 3;
    gl.bindVertexArray(null);
    return { vao, count, indexed: !!data.indices, indexType, bufs };
  };

  PV.createInstancedMesh = function (gl, data, maxInstances) {
    const mesh = PV.createMesh(gl, data);
    gl.bindVertexArray(mesh.vao);
    const makeBuf = (loc) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, maxInstances * 4 * 4, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(loc, 1);
      return b;
    };
    mesh.instBufA = makeBuf(4); mesh.instBufB = makeBuf(5);
    mesh.dataA = new Float32Array(maxInstances * 4); mesh.dataB = new Float32Array(maxInstances * 4);
    gl.bindVertexArray(null);
    mesh.maxInstances = maxInstances; mesh.instanceCount = 0;
    mesh.upload = function (count) {
      mesh.instanceCount = Math.min(count, maxInstances);
      if (mesh.instanceCount <= 0) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instBufA); gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.dataA.subarray(0, mesh.instanceCount * 4));
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instBufB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.dataB.subarray(0, mesh.instanceCount * 4));
    };
    return mesh;
  };

  PV.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  PV.hash = function (n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  PV.mergeParts = function (parts, colKey) {
    const ck = colKey || 'colors';
    const pos = [], nrm = [], uv = [], col = [], idx = [];
    let base = 0;
    for (const p of parts) {
      const cArr = p[ck];
      for (let i = 0; i < p.positions.length; i++) pos.push(p.positions[i]);
      for (let i = 0; i < p.normals.length; i++) nrm.push(p.normals[i]);
      for (let i = 0; i < p.uvs.length; i++) uv.push(p.uvs[i]);
      for (let i = 0; i < cArr.length; i++) col.push(cArr[i]);
      for (let i = 0; i < p.indices.length; i++) idx.push(p.indices[i] + base);
      base += p.positions.length / 3;
    }
    return { positions: pos, normals: nrm, uvs: uv, colors: col, indices: idx };
  };
})(window);

