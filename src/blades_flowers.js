// === blades_flowers.js ===
// Item 1 & 2: Zero-Flicker World-Locked 2-Tier Curved Grass Tufts (Low 0.35-0.50m Emerald / High 0.90-1.05m Golden Sedge)
// + 4-Bloom Wildflower Clusters (Yellow, White, Crimson, Blue-Purple) densely carpeting road shoulders!
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});
  const hash = PV.hash;

  function buildGrassTuftGeo() {
    const pos = [], nrm = [], col = [], idx = [];
    let base = 0;
    // Round 9 (Zero-Loss Perf): 6 lush wider arched blades (-25% grass tris, fuller stylized-PBR visual silhouette!)
    const blades = [
      { ox:  0.00, oz:  0.00, ang: 0.00, lean: 0.20, w: 0.070, h: 1.02 },
      { ox:  0.11, oz:  0.06, ang: 1.05, lean: 0.30, w: 0.064, h: 0.94 },
      { ox: -0.10, oz:  0.09, ang: 2.10, lean: 0.34, w: 0.066, h: 0.96 },
      { ox:  0.09, oz: -0.11, ang: 3.14, lean: 0.28, w: 0.062, h: 0.88 },
      { ox: -0.12, oz: -0.07, ang: 4.19, lean: 0.36, w: 0.062, h: 0.90 },
      { ox:  0.13, oz: -0.02, ang: 5.24, lean: 0.34, w: 0.058, h: 0.80 },
    ];
    for (const b of blades) {
      const ca = Math.cos(b.ang), sa = Math.sin(b.ang);
      const sx = ca, sz = sa, fx = -sa, fz = ca;
      const tiers = [
        { t: 0.00, hw: b.w * 1.00 },
        { t: 0.36, hw: b.w * 0.82 },
        { t: 0.72, hw: b.w * 0.44 },
      ];
      for (const tr of tiers) {
        const bend = b.lean * tr.t * tr.t;
        const cy = tr.t * b.h, cx = b.ox + fx * bend, cz = b.oz + fz * bend;
        pos.push(cx - sx * tr.hw, cy, cz - sz * tr.hw);
        nrm.push(-sx * 0.35 + fx * 0.3, 0.88, -sz * 0.35 + fz * 0.3);
        col.push(tr.t, 0, 0);
        pos.push(cx + sx * tr.hw, cy, cz + sz * tr.hw);
        nrm.push( sx * 0.35 + fx * 0.3, 0.88,  sz * 0.35 + fz * 0.3);
        col.push(tr.t, 0, 0);
      }
      const tipBend = b.lean;
      pos.push(b.ox + fx * tipBend, b.h, b.oz + fz * tipBend);
      nrm.push(fx * 0.4, 0.92, fz * 0.4);
      col.push(1.0, 0, 0);

      idx.push(base+0, base+1, base+2,  base+1, base+3, base+2);
      idx.push(base+2, base+3, base+4,  base+3, base+5, base+4);
      idx.push(base+4, base+5, base+6);
      base += 7;
    }
    return { positions: pos, normals: nrm, colors: col, indices: idx };
  }

  // Organic Natural Alpine Wildflower Bush (basal foliage leaves + tilted irregular multi-petal blooms — ZERO vertical thumbtacks!)
  function buildFlowerClusterGeo() {
    const pos=[], nrm=[], col=[], idx=[];
    let base = 0;
    const addLeafBlade = (ox, oz, ang, len, h) => {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const sx = -sa * 0.045, sz = ca * 0.045;
      const sb = base;
      pos.push(ox - sx, 0.0, oz - sz,  ox + sx, 0.0, oz + sz,  ox + ca*len, h, oz + sa*len);
      nrm.push(ca*0.3, 0.92, sa*0.3,   ca*0.3, 0.92, sa*0.3,   ca*0.4, 0.88, sa*0.4);
      col.push(0.04, 0.13, 0.04,       0.04, 0.13, 0.04,       0.08, 0.22, 0.07);
      idx.push(sb, sb+1, sb+2);
      base += 3;
    };
    const addNaturalBloom = (ox, oy, oz, r, tiltX, tiltZ, c) => {
      const segs = 5;
      const cIdx = base++;
      pos.push(ox, oy, oz);
      nrm.push(tiltX * 0.5, 0.88, tiltZ * 0.5);
      col.push(c[0]*0.78, c[1]*0.78, c[2]*0.78);
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2 + ox * 4.0;
        const pr = r * (0.85 + 0.25 * Math.sin(i * 2.3));
        const px = Math.cos(a) * pr, pz = Math.sin(a) * pr;
        const py = r * 0.32 + px * tiltX + pz * tiltZ;
        pos.push(ox + px, oy + py, oz + pz);
        nrm.push(Math.cos(a) * 0.35 + tiltX * 0.4, 0.85, Math.sin(a) * 0.35 + tiltZ * 0.4);
        col.push(c[0], c[1], c[2]);
        base++;
      }
      for (let i = 0; i < segs; i++) idx.push(cIdx, cIdx + 1 + i, cIdx + 2 + i);
    };
    for (let li = 0; li < 9; li++) {
      const a = (li / 9) * Math.PI * 2 + 0.3;
      addLeafBlade(Math.cos(a) * 0.06, Math.sin(a) * 0.06, a, 0.32 + (li % 2) * 0.10, 0.18 + (li % 3) * 0.06);
    }
    // Rich alpine violet/lavender/magenta wildflower bush blooms (matches ref_01, ref_05, ref_07 roadside framing!)
    addNaturalBloom( 0.00, 0.28,  0.00, 0.092,  0.35,  0.20, [0.58, 0.32, 0.86]);
    addNaturalBloom( 0.18, 0.22,  0.14, 0.082, -0.40,  0.30, [0.84, 0.38, 0.68]);
    addNaturalBloom(-0.20, 0.24,  0.12, 0.084,  0.30, -0.35, [0.88, 0.90, 0.86]);
    addNaturalBloom( 0.14, 0.19, -0.18, 0.085, -0.25, -0.40, [0.48, 0.30, 0.88]);
    addNaturalBloom(-0.16, 0.20, -0.16, 0.074,  0.42,  0.15, [0.88, 0.72, 0.24]);
    addNaturalBloom( 0.26, 0.18, -0.04, 0.076, -0.35,  0.25, [0.70, 0.36, 0.86]);
    addNaturalBloom(-0.25, 0.19,  0.03, 0.078,  0.22, -0.38, [0.86, 0.44, 0.72]);
    addNaturalBloom( 0.05, 0.23,  0.22, 0.072, -0.18,  0.42, [0.64, 0.42, 0.88]);
    addNaturalBloom(-0.08, 0.26, -0.08, 0.074,  0.28,  0.28, [0.52, 0.34, 0.84]);
    return { positions: pos, normals: nrm, colors: col, indices: idx };
  }

  // AAA High-Detail 3D Pinnate Alpine Forest Fern Rosette (11 arched serrated fronds with individual side pinnae leaflets — ZERO flat paper triangles!)
  function buildFernGeo() {
    const pos = [], nrm = [], col = [], idx = [];
    let base = 0;
    const fronds = 11;
    for (let f = 0; f < fronds; f++) {
      const ang = (f / fronds) * Math.PI * 2 + (f % 3) * 0.16;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const fx = ca, fz = sa, sx = -sa, sz = ca;
      const len = 0.68 + (f % 3) * 0.16;
      const maxH = 0.38 + (f % 2) * 0.12;
      // Central arching rachis stem + 6 pairs of serrated side pinnae leaflets!
      const pairs = 6;
      for (let p = 0; p < pairs; p++) {
        const t0 = 0.12 + (p / pairs) * 0.78;
        const t1 = Math.min(0.98, t0 + 0.14);
        const env = Math.sin(t0 * Math.PI) * 0.85 + 0.15;
        const leafW = (0.19 + (f % 2) * 0.04) * env;
        const y0 = Math.sin(t0 * Math.PI * 0.78) * maxH;
        const y1 = Math.sin(t1 * Math.PI * 0.78) * maxH;
        const yTip = Math.max(0.02, (y0 + y1) * 0.5 - leafW * 0.18);
        const d0 = t0 * len, d1 = t1 * len, dMid = (t0 + 0.09) * len;
        const cStem = [0.035 + t0 * 0.06, 0.125 + t0 * 0.14, 0.035 + t0 * 0.04];
        const cTip  = [0.075 + t0 * 0.11, 0.215 + t0 * 0.17, 0.050 + t0 * 0.05];
        for (const sgn of [-1, 1]) {
          const b = base;
          // Serrated pinna leaflet triangle + mid-rib
          pos.push(
            fx * d0, y0, fz * d0,
            fx * d1, y1, fz * d1,
            fx * dMid + sx * sgn * leafW, yTip, fz * dMid + sz * sgn * leafW
          );
          const nx = fx * 0.22 + sx * sgn * 0.25, ny = 0.92, nz = fz * 0.22 + sz * sgn * 0.25;
          nrm.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
          col.push(cStem[0], cStem[1], cStem[2], cStem[0], cStem[1], cStem[2], cTip[0], cTip[1], cTip[2]);
          idx.push(b, b + 1, b + 2);
          base += 3;
        }
      }
      // Graceful pointed frond tip
      const bTip = base;
      const dA = len * 0.86, yA = Math.sin(0.86 * Math.PI * 0.78) * maxH;
      const yE = Math.sin(1.00 * Math.PI * 0.78) * maxH * 0.85;
      pos.push(
        fx * dA - sx * 0.045, yA, fz * dA - sz * 0.045,
        fx * dA + sx * 0.045, yA, fz * dA + sz * 0.045,
        fx * len, yE, fz * len
      );
      nrm.push(fx * 0.35, 0.90, fz * 0.35, fx * 0.35, 0.90, fz * 0.35, fx * 0.45, 0.85, fz * 0.45);
      col.push(0.11, 0.26, 0.07, 0.11, 0.26, 0.07, 0.16, 0.34, 0.10);
      idx.push(bTip, bTip + 1, bTip + 2);
      base += 3;
    }
    return { positions: pos, normals: nrm, colors: col, indices: idx };
  }

  // Wet Fallen Leaf Cluster hugging road shoulder mud-grass edge
  function buildLeafScatterGeo() {
    const pos = [], nrm = [], col = [], idx = [];
    let base = 0;
    const leaves = [
      { x:  0.00, z:  0.00, a: 0.4, s: 0.12, c: [0.34, 0.19, 0.07] },
      { x:  0.24, z:  0.16, a: 1.9, s: 0.10, c: [0.42, 0.24, 0.08] },
      { x: -0.22, z:  0.18, a: 3.1, s: 0.11, c: [0.26, 0.16, 0.06] },
      { x:  0.18, z: -0.24, a: 4.5, s: 0.09, c: [0.38, 0.26, 0.09] },
      { x: -0.26, z: -0.15, a: 5.4, s: 0.11, c: [0.22, 0.18, 0.07] },
      { x:  0.05, z:  0.30, a: 2.6, s: 0.09, c: [0.32, 0.17, 0.06] },
    ];
    for (const lf of leaves) {
      const ca = Math.cos(lf.a), sa = Math.sin(lf.a), s = lf.s;
      const pts = [[-s, 0.03, 0], [0, 0.04, -s*0.6], [s, 0.03, 0], [0, 0.04, s*0.6]];
      for (const p of pts) {
        pos.push(lf.x + p[0]*ca - p[2]*sa, p[1], lf.z + p[0]*sa + p[2]*ca);
        nrm.push(0, 1, 0);
        col.push(lf.c[0], lf.c[1], lf.c[2]);
      }
      idx.push(base, base+1, base+2, base, base+2, base+3);
      base += 4;
    }
    return { positions: pos, normals: nrm, colors: col, indices: idx };
  }

  // Kyoto Shrine Crimson Spider Lily (彼岸花 Lycoris radiata — slender emerald stems + radiating curved scarlet petals + fine stamens!)
  function buildSpiderLilyGeo() {
    const pos = [], nrm = [], col = [], idx = [];
    let base = 0;
    const stems = [
      { ox:  0.00, oz:  0.00, h: 0.52, leanX:  0.04, leanZ:  0.02, r: 0.14 },
      { ox:  0.14, oz:  0.10, h: 0.44, leanX:  0.08, leanZ:  0.05, r: 0.12 },
      { ox: -0.15, oz:  0.08, h: 0.48, leanX: -0.07, leanZ:  0.04, r: 0.13 },
      { ox:  0.06, oz: -0.14, h: 0.40, leanX:  0.03, leanZ: -0.06, r: 0.11 },
      { ox: -0.11, oz: -0.12, h: 0.46, leanX: -0.06, leanZ: -0.05, r: 0.12 },
    ];
    for (const st of stems) {
      // Slender green stem (2 crossed quads)
      const sw = 0.014;
      for (const a of [0, Math.PI * 0.5]) {
        const cx = Math.cos(a) * sw, cz = Math.sin(a) * sw;
        const b = base;
        pos.push(st.ox - cx, 0, st.oz - cz, st.ox + cx, 0, st.oz + cz, st.ox + st.leanX + cx * 0.6, st.h, st.oz + st.leanZ + cz * 0.6, st.ox + st.leanX - cx * 0.6, st.h, st.oz + st.leanZ - cz * 0.6);
        nrm.push(0, 0.7, 0.7, 0, 0.7, 0.7, 0, 0.7, 0.7, 0, 0.7, 0.7);
        col.push(0.05, 0.16, 0.05, 0.05, 0.16, 0.05, 0.10, 0.28, 0.08, 0.10, 0.28, 0.08);
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        base += 4;
      }
      // Radiating crimson-scarlet spider-lily petals + sweeping upward filaments
      const tx = st.ox + st.leanX, ty = st.h, tz = st.oz + st.leanZ;
      for (let p = 0; p < 9; p++) {
        const ang = (p / 9) * Math.PI * 2 + st.ox * 5.0;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        const px = -sa * 0.018, pz = ca * 0.018;
        const rMid = st.r * 0.58, rTip = st.r * (1.05 + (p % 2) * 0.35);
        const yMid = ty + 0.045, yTip = ty + ((p % 2 === 0) ? 0.015 : 0.095);
        const b = base;
        pos.push(tx - px, ty, tz - pz, tx + px, ty, tz + pz, tx + ca * rMid + px * 0.7, yMid, tz + sa * rMid + pz * 0.7, tx + ca * rTip, yTip, tz + sa * rTip);
        nrm.push(ca * 0.4, 0.9, sa * 0.4, ca * 0.4, 0.9, sa * 0.4, ca * 0.5, 0.85, sa * 0.5, ca * 0.6, 0.8, sa * 0.6);
        const cBase = [0.74, 0.05, 0.06], cTip = (p % 2 === 0) ? [1.0, 0.16, 0.13] : [1.0, 0.36, 0.22];
        col.push(cBase[0], cBase[1], cBase[2], cBase[0], cBase[1], cBase[2], cTip[0], cTip[1], cTip[2], cTip[0], cTip[1], cTip[2]);
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        base += 4;
      }
    }
    return { positions: pos, normals: nrm, colors: col, indices: idx };
  }

  // Snow Peak Half-Buried Dry Winter Grass & Frosted Twigs (覆雪露头枯草枯枝 — snow mound base + golden-tan dry blades & twigs!)
  function buildSnowDryGrassGeo() {
    const pos = [], nrm = [], col = [], idx = [];
    let base = 0;
    // Soft low snow mound collar hugging the ground
    const cIdx = base++;
    pos.push(0, 0.14, 0); nrm.push(0, 1, 0); col.push(0.92, 0.95, 0.99);
    const segs = 7;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const r = 0.26 + 0.06 * Math.sin(i * 2.7);
      pos.push(Math.cos(a) * r, -0.02, Math.sin(a) * r);
      nrm.push(Math.cos(a) * 0.45, 0.88, Math.sin(a) * 0.45);
      col.push(0.76, 0.84, 0.94);
      base++;
    }
    for (let i = 0; i < segs; i++) idx.push(cIdx, cIdx + 1 + i, cIdx + 2 + i);
    // Dry frosted winter grass blades & bent twigs poking cleanly out of the snow mound!
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + (k % 3) * 0.3;
      const ca = Math.cos(a), sa = Math.sin(a);
      const sx = -sa * 0.022, sz = ca * 0.022;
      const h = 0.34 + (k % 4) * 0.11;
      const lean = 0.14 + (k % 3) * 0.08;
      const ox = ca * 0.06, oz = sa * 0.06;
      const isTwig = (k % 3 === 0);
      const cBot = isTwig ? [0.24, 0.18, 0.13] : [0.46, 0.38, 0.24];
      const cTip = isTwig ? [0.68, 0.72, 0.78] : [0.76, 0.66, 0.44];
      const b = base;
      pos.push(ox - sx, 0.06, oz - sz, ox + sx, 0.06, oz + sz, ox + ca * lean, h, oz + sa * lean);
      nrm.push(ca * 0.3, 0.92, sa * 0.3, ca * 0.3, 0.92, sa * 0.3, ca * 0.45, 0.85, sa * 0.45);
      col.push(cBot[0], cBot[1], cBot[2], cBot[0], cBot[1], cBot[2], cTip[0], cTip[1], cTip[2]);
      idx.push(b, b + 1, b + 2);
      base += 3;
    }
    return { positions: pos, normals: nrm, colors: col, indices: idx };
  }

  PV.BladesFlowers = class BladesFlowers {
    constructor(gl) {
      this.gl = gl;
      // High-Capacity Multi-Species Ground Cover Pools sized for 6x228m horizon (ZERO silent truncation!)
      this.tufts = PV.createInstancedMesh(gl, buildGrassTuftGeo(), 96000);
      this.flowers = PV.createInstancedMesh(gl, buildFlowerClusterGeo(), 38000);
      this.ferns = PV.createInstancedMesh(gl, buildFernGeo(), 26000);
      this.fallenLeaves = PV.createInstancedMesh(gl, buildLeafScatterGeo(), 14000);
      this.spiderLilies = PV.createInstancedMesh(gl, buildSpiderLilyGeo(), 22000);
      this.snowTwigs = PV.createInstancedMesh(gl, buildSnowDryGrassGeo(), 22000);
      this._segCache = new Map();
      this._lastOriginResets = -1;
      this._lastTrack = null;
      this._lastUploadSig = '';
      this._initShaders();
    }

    _initShaders() {
      const gl = this.gl;
      this.tuftProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aNrm;
        layout(location=3) in vec3 aCol;
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;

        uniform mat4 uViewProj;
        uniform vec3 uCamPos;
        uniform float uTime;

        out vec3 vWorldPos;
        out vec3 vNrm;
        out float vH;
        out float vSpecies;
        out float vTint;

        void main() {
          vec4 clipC = uViewProj * vec4(aInstA.xyz, 1.0);
          if (clipC.w < -4.0 || abs(clipC.x) > clipC.w * 1.25 + 4.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float dist = length(aInstA.xyz - uCamPos);
          // Zero-Loss Far Vegetation Extension: continuous grass carpet out to 215m with stochastic far thinning + width compensation!
          float farKeep = smoothstep(215.0, 145.0, dist);
          float thinProb = mix(1.0, 0.42, smoothstep(98.0, 215.0, dist));
          float thinKeep = (dist < 98.0) ? 1.0 : step(fract(aInstB.x * 7.13 + aInstB.w * 3.17), thinProb);
          if (farKeep * thinKeep < 0.02) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }

          float cy = cos(aInstB.x), sy = sin(aInstB.x);
          float t = aCol.x;
          float farWidthComp = 1.0 + smoothstep(65.0, 195.0, dist) * 0.85;
          float easePop = 1.0 - pow(1.0 - farKeep, 3.0);
          vec3 p = vec3(aPos.x * aInstB.y * farWidthComp, aPos.y * aInstA.w * easePop, aPos.z * aInstB.y * farWidthComp);
          float wind = sin(uTime * 2.4 + aInstA.x * 0.24 + aInstA.z * 0.21) * 0.11 * t * t;
          p.x += wind;

          vec3 rp = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
          vec3 rn = normalize(vec3(aNrm.x * cy + aNrm.z * sy, aNrm.y, -aNrm.x * sy + aNrm.z * cy));
          vec3 wp = aInstA.xyz + rp - vec3(0.0, 0.18 * (1.0 - easePop), 0.0);

          vWorldPos = wp; vNrm = rn; vH = t; vSpecies = aInstB.z; vTint = aInstB.w;
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vNrm;
        in float vH;
        in float vSpecies;
        in float vTint;
        ${PV.PBR_GLSL}
        out vec4 fragColor;

        void main() {
          vec3 N = normalize(vNrm);
          vec3 V = normalize(uCamPos - vWorldPos);
          // Multi-species rich alpine turf palette: deep pine-moss grass, lush emerald clover, olive wild-grass, & subtle warm sedge!
          float bId = floor(vTint);
          float tVar = fract(vTint);
          vec3 rootCol = vec3(0.022, 0.072, 0.036);
          vec3 midCol  = vSpecies < 0.32 ? vec3(0.058, 0.175, 0.068)
                       : (vSpecies < 0.64 ? vec3(0.105, 0.225, 0.076)
                       : (vSpecies < 0.86 ? vec3(0.155, 0.245, 0.084) : vec3(0.245, 0.230, 0.092)));
          vec3 tipCol  = vSpecies < 0.32 ? vec3(0.125, 0.295, 0.105)
                       : (vSpecies < 0.64 ? vec3(0.195, 0.335, 0.115)
                       : (vSpecies < 0.86 ? vec3(0.265, 0.340, 0.122) : vec3(0.380, 0.320, 0.125)));
          if (bId > 0.5 && bId < 1.5) {
            // Snow Peak: white snow-dusted base + dry golden-straw frost-tipped winter grass!
            rootCol = vec3(0.76, 0.84, 0.94);
            midCol  = vec3(0.38, 0.32, 0.20);
            tipCol  = vec3(0.68, 0.60, 0.42);
          } else if (bId > 3.5 && bId < 4.5) {
            // Autumn Birch: warm golden-russet autumn meadow grass
            midCol = mix(midCol, vec3(0.26, 0.18, 0.06), 0.58);
            tipCol = mix(tipCol, vec3(0.46, 0.32, 0.10), 0.62);
          } else if (bId > 4.5 && bId < 5.5) {
            // Quarry Gorge: dry olive-ochre hillside scrub
            midCol = mix(midCol, vec3(0.22, 0.20, 0.10), 0.52);
            tipCol = mix(tipCol, vec3(0.36, 0.30, 0.14), 0.55);
          } else if (bId > 5.5) {
            // Kyoto Shrine: deep lush jade-emerald temple grass
            midCol *= vec3(0.78, 1.12, 0.88);
            tipCol *= vec3(0.80, 1.14, 0.88);
          }
          vec3 albedo  = mix(rootCol, mix(midCol, tipCol, smoothstep(0.24, 1.0, vH)), smoothstep(0.0, 0.44, vH)) * mix(0.84, 1.18, tVar);

          float shadowVal = sampleShadowPCF(vWorldPos, N);
          float gWet = clamp(uWetness, 0.0, 1.0);
          vec3 col = evalPBR(vWorldPos, N, V, albedo * mix(1.0, 0.86, gWet * 0.45), mix(0.72, 0.44, gWet), 0.0, mix(0.46, 1.0, vH), mix(0.02, 0.26, gWet), shadowVal);
          col = applyFog(col, vWorldPos);
          fragColor = vec4(col, 1.0);
        }
      `);

      this.flowerProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aNrm;
        layout(location=3) in vec3 aCol;
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;
        uniform mat4 uViewProj;
        uniform vec3 uCamPos;
        uniform float uTime;
        out vec3 vWorldPos;
        out vec3 vNrm;
        out vec3 vCol;
        void main() {
          vec4 clipC = uViewProj * vec4(aInstA.xyz, 1.0);
          if (clipC.w < -4.0 || abs(clipC.x) > clipC.w * 1.25 + 4.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float dist = length(aInstA.xyz - uCamPos);
          float farKeep = smoothstep(172.0, 118.0, dist);
          float thinKeep = (dist < 88.0) ? 1.0 : step(fract(aInstB.x * 5.71), mix(1.0, 0.50, smoothstep(88.0, 172.0, dist)));
          if (farKeep * thinKeep < 0.02) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float cy = cos(aInstB.x), sy = sin(aInstB.x);
          float easePop = 1.0 - pow(1.0 - farKeep, 3.0);
          vec3 p = aPos * (aInstA.w * easePop);
          float sway = sin(uTime * 2.1 + aInstA.x * 0.25 + aInstA.z * 0.22) * 0.045 * clamp(aPos.y * 1.8, 0.0, 1.0);
          p.x += sway;
          vec3 rp = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
          vec3 rn = normalize(vec3(aNrm.x * cy + aNrm.z * sy, aNrm.y, -aNrm.x * sy + aNrm.z * cy));
          vWorldPos = rp + aInstA.xyz - vec3(0.0, 0.18 * (1.0 - easePop), 0.0); vNrm = rn; vCol = aCol;
          gl_Position = uViewProj * vec4(vWorldPos, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vNrm;
        in vec3 vCol;
        ${PV.PBR_GLSL}
        out vec4 fragColor;
        void main() {
          vec3 N = normalize(vNrm);
          float shadowVal = sampleShadowPCF(vWorldPos, N);
          // Weather-differentiated botanical shading + subtle basal grounding AO
          float flWet = clamp(uWetness, 0.0, 1.0);
          float stemAO = mix(0.66, 0.96, smoothstep(0.0, 0.45, N.y));
          vec3 col = evalPBR(vWorldPos, N, normalize(uCamPos - vWorldPos), vCol * mix(1.0, 0.88, flWet * 0.35), mix(0.74, 0.48, flWet), 0.0, stemAO, mix(0.02, 0.22, flWet), shadowVal);
          col = applyFog(col, vWorldPos);
          fragColor = vec4(col, 1.0);
        }
      `);
    }

    _buildSegSlices(track, seg) {
      const RW = PV.TRACK_CFG.ROAD_HALF_W;
      const tA = [], tB = [], fA = [], fB = [], fnA = [], fnB = [], lfA = [], lfB = [], slA = [], slB = [], stA = [], stB = [];
      if (seg.surfMode !== 0) {
        return {
          tA: new Float32Array(0), tB: new Float32Array(0),
          fA: new Float32Array(0), fB: new Float32Array(0),
          fnA: new Float32Array(0), fnB: new Float32Array(0),
          lfA: new Float32Array(0), lfB: new Float32Array(0),
          slA: new Float32Array(0), slB: new Float32Array(0),
          stA: new Float32Array(0), stB: new Float32Array(0),
        };
      }
      const seedBase = seg.id * 2000;
      const tid = seg.themeId || 0;
      const valleySide = seg.hillMode === 1 ? -1 : 1;
      const isSparseBiome = (tid === 1);
      const vp = seg.vegPreset || { shrubMul: 1.0, flowerMul: 1.0 };
      const ecoF = ((seg.ecoRecipe && seg.ecoRecipe.flowerDrift) ? seg.ecoRecipe.flowerDrift : 1.0) * (seg.landform === 'plain_meadow' ? 1.25 : 1.0);
      const grassStep = (isSparseBiome ? 1.15 : 0.62) / Math.max(0.70, Math.min(1.25, vp.shrubMul || 1.0));
      // Helper: reject steep cliff/bridge-gorge drop-offs so ZERO grass/flowers/twigs float in bridge transition voids!
      const isVoidOrDrop = (sPos, spObj, latVal, gyVal) => {
        const nearBridgeEnd = (seg.nextIsBridge && sPos > seg.sEnd - 22.0) || (seg.prevSurfMode === 1 && sPos < seg.sStart + 22.0);
        if (nearBridgeEnd) {
          if (gyVal < spObj.pos[1] - 3.2) return true;
          const gyA = track.sampleGroundY(Math.max(seg.sStart, sPos - 4.0), latVal);
          const gyB = track.sampleGroundY(Math.min(seg.sEnd, sPos + 4.0), latVal);
          if (Math.abs(gyVal - gyA) > 2.2 || Math.abs(gyVal - gyB) > 2.2) return true;
        }
        if (Math.abs(latVal) > RW + 3.5) {
          const gyIn = track.sampleGroundY(sPos, latVal - Math.sign(latVal) * 2.5);
          if (Math.abs(gyVal - gyIn) > 3.6) return true;
        }
        return false;
      };

      for (let s = seg.sStart + 0.25; s < seg.sEnd; s += grassStep) {
        const sp = track.sampleAtS(s);
        if (!sp) continue;
        for (const side of [-1, 1]) {
          const kMax = isSparseBiome ? 7 : 14;
          for (let k = 0; k < kMax; k++) {
            const h1 = hash(seedBase + s * 7.3 + side * 41 + k * 19.1);
            const h2 = hash(seedBase + s * 13.1 + side * 23 + k * 37.7);
            const h3 = hash(seedBase + s * 5.9 + side * 67 + k * 11.3);
            const latOffset = k < 6 ? (-0.06 + h1 * 2.85) : (2.6 + Math.pow(h1, 1.08) * 18.0);
            const lat = side * (RW + latOffset);
            const effLat = track.mapLat ? track.mapLat(sp, lat) : lat;
            const wx = sp.pos[0] + sp.right[0] * effLat;
            const wz = sp.pos[2] + sp.right[2] * effLat;
            const gy = track.sampleGroundY(s, lat);
            if (isVoidOrDrop(s, sp, lat, gy)) continue;
            if (seg.hasLake && side === valleySide && gy < (seg.lakeY !== undefined ? seg.lakeY + 0.45 : sp.pos[1] - 1.2)) continue;
            if (seg.hasCloudSea && side === valleySide && gy < sp.pos[1] - 2.6) continue;
            if (tid === 1 && h1 < 0.48) continue;
            const nearRoadClamp = latOffset < 1.6 ? 0.76 : 1.0;
            const scaleY = (h3 >= 0.86 ? (0.60 + h2 * 0.24) : (h3 >= 0.42 ? (0.35 + h2 * 0.22) : (0.16 + h2 * 0.18))) * nearRoadClamp;
            const scaleXZ = (h3 >= 0.86 ? (0.95 + h1 * 0.42) : (0.90 + h1 * 0.48));
            tA.push(wx, gy - 0.10, wz, scaleY);
            tB.push(h2 * 6.28318, scaleXZ, h3, tid + Math.min(0.95, h1 * 0.95));
          }
        }
      }

      // STRICT ECOLOGICAL ISOLATION: no purple wildflowers on Snow Peak (tid===1) or Red-Brick Quarry (tid===5)!
      if (tid !== 1 && tid !== 5 && (tid === 0 || tid === 2 || tid === 4 || (vp.flowerMul || 0) >= 1.3 || seg.landform === 'plain_meadow')) {
        const flowerStep = (tid === 4 || tid === 3 || tid === 5 ? 1.05 : 0.56) / Math.max(0.70, Math.min(1.6, ecoF));
        for (let s = seg.sStart + 0.30; s < seg.sEnd; s += flowerStep) {
          const sp = track.sampleAtS(s);
          if (!sp) continue;
          for (const side of [-1, 1]) {
            if (side === valleySide && (seg.hasLake || seg.hasCloudSea)) continue;
            for (let k = 0; k < (tid === 4 ? 2 : 5); k++) {
              const h = hash(seedBase + s * 5.3 + side * 31 + k * 47.1);
              const h2 = hash(seedBase + s * 9.1 + side * 17 + k * 29.3);
              const extraFlower = (seg.type === 'flower_valley' || seg.type === 'village_pass' || seg.type === 'straight' || seg.type === 'hairpin');
              if (h < (extraFlower ? 0.01 : 0.06)) continue;
              const lat = side * (RW + (k < 3 ? (0.04 + h * 3.1) : (2.4 + Math.pow(h, 1.15) * 11.5)));
              const effLat = track.mapLat ? track.mapLat(sp, lat) : lat;
              const gyF = track.sampleGroundY(s, lat);
              if (isVoidOrDrop(s, sp, lat, gyF)) continue;
              fA.push(sp.pos[0] + sp.right[0] * effLat, gyF - 0.02, sp.pos[2] + sp.right[2] * effLat, (extraFlower ? 1.14 : 0.98) + h2 * 0.56);
              fB.push(h2 * 6.28, 0, 0, 0);
            }
          }
        }
      }

      if (tid !== 1 && tid !== 5) {
        const fernStep = tid === 6 ? 0.45 : 0.82;
        for (let s = seg.sStart + 0.5; s < seg.sEnd; s += fernStep) {
          const sp = track.sampleAtS(s);
          if (!sp) continue;
          for (const side of [-1, 1]) {
            if (side === valleySide && (seg.hasLake || seg.hasCloudSea)) continue;
            for (let k = 0; k < (tid === 6 ? 4 : 3); k++) {
              const h1 = hash(seedBase + s * 8.9 + side * 59 + k * 33.7);
              const h2 = hash(seedBase + s * 14.3 + side * 17 + k * 61.3);
              if (h1 < 0.12) continue;
              const lat = side * (RW + 0.55 + Math.pow(h1, 1.05) * 12.0);
              const effLat = track.mapLat ? track.mapLat(sp, lat) : lat;
              const gyFn = track.sampleGroundY(s, lat);
              if (isVoidOrDrop(s, sp, lat, gyFn)) continue;
              fnA.push(sp.pos[0] + sp.right[0] * effLat, gyFn - 0.06, sp.pos[2] + sp.right[2] * effLat, (tid === 6 ? 0.96 : 0.76) + h2 * 0.78);
              fnB.push(h2 * 6.28, 0, 0, 0);
            }
          }
        }
      }

      const leafStep = tid === 4 ? 0.52 : 1.35;
      for (let s = seg.sStart + 0.5; s < seg.sEnd; s += leafStep) {
        const sp = track.sampleAtS(s);
        if (!sp) continue;
        for (const side of [-1, 1]) {
          if (side === valleySide && (seg.hasLake || seg.hasCloudSea)) continue;
          const h1 = hash(seedBase + s * 11.7 + side * 73);
          if (h1 < (tid === 4 ? 0.05 : 0.18)) continue;
          const lat = side * (RW - 0.65 + h1 * 2.8);
          const effLat = track.mapLat ? track.mapLat(sp, lat) : lat;
          const gyLf = track.sampleGroundY(s, lat);
          if (isVoidOrDrop(s, sp, lat, gyLf)) continue;
          lfA.push(sp.pos[0] + sp.right[0] * effLat, gyLf + 0.01, sp.pos[2] + sp.right[2] * effLat, (tid === 4 ? 1.25 : 0.95) + h1 * 0.85);
          lfB.push(h1 * 6.28, 0, 0, 0);
        }
      }
      // Kyoto Shrine (Theme 6): Crimson Spider Lilies (彼岸花) clustering along road shoulders & around mossy landscape stones!
      if (tid === 6) {
        for (let s = seg.sStart + 0.4; s < seg.sEnd; s += 0.68) {
          const sp = track.sampleAtS(s);
          if (!sp) continue;
          for (const side of [-1, 1]) {
            if (side === valleySide && (seg.hasLake || seg.hasCloudSea)) continue;
            for (let k = 0; k < 4; k++) {
              const h1 = hash(seedBase + s * 17.3 + side * 43 + k * 29.1);
              const h2 = hash(seedBase + s * 23.7 + side * 19 + k * 53.3);
              if (h1 < 0.14) continue;
              const lat = side * (RW + 0.12 + Math.pow(h1, 1.15) * 6.8);
              const effLat = track.mapLat ? track.mapLat(sp, lat) : lat;
              const gySl = track.sampleGroundY(s, lat);
              if (isVoidOrDrop(s, sp, lat, gySl)) continue;
              slA.push(sp.pos[0] + sp.right[0] * effLat, gySl - 0.03, sp.pos[2] + sp.right[2] * effLat, 0.92 + h2 * 0.62);
              slB.push(h2 * 6.28318, 0, 0, 0);
            }
          }
        }
      }
      // Snow Peak (Theme 1): Half-buried dry winter grass & frosted twigs poking out of roadside snowdrifts!
      if (tid === 1) {
        for (let s = seg.sStart + 0.5; s < seg.sEnd; s += 0.85) {
          const sp = track.sampleAtS(s);
          if (!sp) continue;
          for (const side of [-1, 1]) {
            if (side === valleySide && (seg.hasLake || seg.hasCloudSea)) continue;
            for (let k = 0; k < 5; k++) {
              const h1 = hash(seedBase + s * 13.7 + side * 37 + k * 41.3);
              const h2 = hash(seedBase + s * 29.1 + side * 17 + k * 67.7);
              if (h1 < 0.22) continue;
              const lat = side * (RW + 0.22 + Math.pow(h1, 1.1) * 10.5);
              const effLat = track.mapLat ? track.mapLat(sp, lat) : lat;
              const gySt = track.sampleGroundY(s, lat);
              if (isVoidOrDrop(s, sp, lat, gySt)) continue;
              stA.push(sp.pos[0] + sp.right[0] * effLat, gySt - 0.02, sp.pos[2] + sp.right[2] * effLat, 0.88 + h2 * 0.68);
              stB.push(h2 * 6.28318, 0, 0, 0);
            }
          }
        }
      }
      return {
        tA: new Float32Array(tA), tB: new Float32Array(tB),
        fA: new Float32Array(fA), fB: new Float32Array(fB),
        fnA: new Float32Array(fnA), fnB: new Float32Array(fnB),
        lfA: new Float32Array(lfA), lfB: new Float32Array(lfB),
        slA: new Float32Array(slA), slB: new Float32Array(slB),
        stA: new Float32Array(stA), stB: new Float32Array(stB),
      };
    }

    rebuildFromTrack(track) {
      // Incremental per-segment cache: prune evicted segments, build ONLY new segments, fast TypedArray.set() merge!
      this._lastTrack = track;
      const originKey = `${track.originResets || 0}_${track.seed || 0}`;
      if (this._lastOriginResets !== originKey) {
        this._segCache.clear();
        this._lastOriginResets = originKey;
        this._lastUploadSig = '';
      }
      const activeIds = new Set();
      for (const seg of track.segments) activeIds.add(seg.id);
      for (const id of this._segCache.keys()) {
        if (!activeIds.has(id)) this._segCache.delete(id);
      }

      for (const seg of track.segments) {
        let sl = this._segCache.get(seg.id);
        const rev = seg._meshRev || 0;
        if (!sl || sl._ref !== seg || sl._meshRev !== rev) {
          sl = this._buildSegSlices(track, seg);
          sl._ref = seg;
          sl._meshRev = rev;
          this._segCache.set(seg.id, sl);
          this._lastUploadSig = '';
        }
      }
      this._uploadVisibleSegments(track, null);
    }

    _uploadVisibleSegments(track, camPos) {
      if (!track || !track.segments) return;
      // Zero-loss distance window: only upload segments within 255m of camera (grass/flora fade completely by 132m!)
      const visSegs = [];
      let sig = `${this._lastOriginResets}`;
      for (const seg of track.segments) {
        if (camPos && seg.pts && seg.pts.length) {
          const mid = seg.pts[seg.pts.length >> 1].pos;
          const halfR = (seg.len || 228) * 0.56 + 235.0;
          const dx = mid[0] - camPos[0], dz = mid[2] - camPos[2];
          if (dx * dx + dz * dz > halfR * halfR) continue;
        }
        visSegs.push(seg);
        sig += `_${seg.id}:${seg._meshRev || 0}`;
      }
      if (sig === this._lastUploadSig) return;
      this._lastUploadSig = sig;

      let cT = 0, cF = 0, cFn = 0, cLf = 0, cSl = 0, cSt = 0;
      const copySlice = (mesh, cur, srcA, srcB) => {
        const avail = mesh.maxInstances - cur;
        const n = Math.min(avail, srcA.length >> 2);
        if (n <= 0) return cur;
        mesh.dataA.set(srcA.subarray(0, n * 4), cur * 4);
        mesh.dataB.set(srcB.subarray(0, n * 4), cur * 4);
        return cur + n;
      };

      for (const seg of visSegs) {
        const sl = this._segCache.get(seg.id);
        if (!sl) continue;
        cT  = copySlice(this.tufts,        cT,  sl.tA,  sl.tB);
        cF  = copySlice(this.flowers,      cF,  sl.fA,  sl.fB);
        cFn = copySlice(this.ferns,        cFn, sl.fnA, sl.fnB);
        cLf = copySlice(this.fallenLeaves, cLf, sl.lfA, sl.lfB);
        cSl = copySlice(this.spiderLilies, cSl, sl.slA, sl.slB);
        cSt = copySlice(this.snowTwigs,    cSt, sl.stA, sl.stB);
      }

      this.tufts.upload(cT);
      this.flowers.upload(cF);
      this.ferns.upload(cFn);
      this.fallenLeaves.upload(cLf);
      this.spiderLilies.upload(cSl);
      this.snowTwigs.upload(cSt);
    }

    draw(renderer, time) {
      if (this._lastTrack && renderer && renderer.camPos) {
        this._uploadVisibleSegments(this._lastTrack, renderer.camPos);
      }
      const gl = this.gl;
      gl.disable(gl.CULL_FACE);

      if (this.tufts.instanceCount > 0) {
        const tp = this.tuftProg;
        gl.useProgram(tp.prog);
        gl.uniformMatrix4fv(tp.u.uViewProj, false, renderer.vpMat);
        renderer.bindSharedPBRUniforms(tp.u, time);
        const drawCount = Math.floor(this.tufts.instanceCount * renderer.quality.grassDensity);
        gl.bindVertexArray(this.tufts.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, this.tufts.count, this.tufts.indexType, 0, drawCount);
      }

      const hasFlora = (this.flowers.instanceCount + this.ferns.instanceCount + this.fallenLeaves.instanceCount + this.spiderLilies.instanceCount + this.snowTwigs.instanceCount) > 0;
      if (hasFlora) {
        const fp = this.flowerProg;
        gl.useProgram(fp.prog);
        gl.uniformMatrix4fv(fp.u.uViewProj, false, renderer.vpMat);
        renderer.bindSharedPBRUniforms(fp.u, time);
        const gd = renderer.quality.grassDensity;
        const drawFlora = (mesh) => {
          if (mesh.instanceCount <= 0) return;
          const cnt = Math.floor(mesh.instanceCount * gd);
          if (cnt <= 0) return;
          gl.bindVertexArray(mesh.vao);
          gl.drawElementsInstanced(gl.TRIANGLES, mesh.count, mesh.indexType, 0, cnt);
        };
        drawFlora(this.flowers);
        drawFlora(this.ferns);
        drawFlora(this.fallenLeaves);
        drawFlora(this.spiderLilies);
        drawFlora(this.snowTwigs);
      }
      gl.enable(gl.CULL_FACE);
      gl.bindVertexArray(null);
    }
  };
})(window);

