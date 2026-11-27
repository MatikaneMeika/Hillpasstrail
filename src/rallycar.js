// === rallycar.js ===
// Item 5: Refined Rally Coupe Proportions (wider haunches, grounded stance, sculpted wing),
// Rain-Streaked Reflective Glass, Shaped Specular Paint Highlight Band, Controlled Non-Blowout Roof Scoops
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});
  const mergeParts = (parts) => PV.mergeParts(parts, 'attrs');

  function computeSmoothNormals(pos, idx) {
    const nrm = new Float32Array(pos.length);
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i]*3, b = idx[i+1]*3, c = idx[i+2]*3;
      const ux=pos[b]-pos[a], uy=pos[b+1]-pos[a+1], uz=pos[b+2]-pos[a+2];
      const vx=pos[c]-pos[a], vy=pos[c+1]-pos[a+1], vz=pos[c+2]-pos[a+2];
      const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      nrm[a]+=nx; nrm[a+1]+=ny; nrm[a+2]+=nz;
      nrm[b]+=nx; nrm[b+1]+=ny; nrm[b+2]+=nz;
      nrm[c]+=nx; nrm[c+1]+=ny; nrm[c+2]+=nz;
    }
    for (let i = 0; i < nrm.length; i += 3) {
      const l = Math.hypot(nrm[i], nrm[i+1], nrm[i+2]) || 1;
      nrm[i]/=l; nrm[i+1]/=l; nrm[i+2]/=l;
    }
    return Array.from(nrm);
  }

  function makeBox(cx, cy, cz, sx, sy, sz, matId, tiltX) {
    const hx = sx*0.5, hy = sy*0.5, hz = sz*0.5;
    const ct = Math.cos(tiltX || 0), st = Math.sin(tiltX || 0);
    const xf = (x, y, z) => [cx + x, cy + y*ct - z*st, cz + y*st + z*ct];
    const faces = [
      { n:[0,0,1],  v:[[-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz]] },
      { n:[0,0,-1], v:[[hx,-hy,-hz],[-hx,-hy,-hz],[-hx,hy,-hz],[hx,hy,-hz]] },
      { n:[1,0,0],  v:[[hx,-hy,hz],[hx,-hy,-hz],[hx,hy,-hz],[hx,hy,hz]] },
      { n:[-1,0,0], v:[[-hx,-hy,-hz],[-hx,-hy,hz],[-hx,hy,hz],[-hx,hy,-hz]] },
      { n:[0,1,0],  v:[[-hx,hy,hz],[hx,hy,hz],[hx,hy,-hz],[-hx,hy,-hz]] },
      { n:[0,-1,0], v:[[-hx,-hy,-hz],[hx,-hy,-hz],[hx,-hy,hz],[-hx,-hy,hz]] },
    ];
    const pos = [], nrm = [], uv = [], attrs = [], idx = [];
    let b = 0;
    for (const f of faces) {
      const fn = [f.n[0], f.n[1]*ct - f.n[2]*st, f.n[1]*st + f.n[2]*ct];
      for (let i = 0; i < 4; i++) {
        const p = xf(f.v[i][0], f.v[i][1], f.v[i][2]);
        pos.push(p[0], p[1], p[2]); nrm.push(fn[0], fn[1], fn[2]);
        uv.push((2.24 - p[2]) / 4.48, 1.0 - (p[1] - 0.16) / 1.18);
        attrs.push(matId, 0, 0);
      }
      idx.push(b, b+1, b+2, b, b+2, b+3);
      b += 4;
    }
    return { positions: pos, normals: nrm, uvs: uv, attrs, indices: idx };
  }

  function makeRearNumberPlate() {
    // Dead-center #22 rear rally plate proudly mounted in front of trunk cove
    const x0 = 0.25, x1 = -0.25, y0 = 0.53, y1 = 0.77, z = -2.132;
    return {
      positions: [x0,y0,z,  x1,y0,z,  x1,y1,z,  x0,y1,z],
      normals:   [0,0,-1,   0,0,-1,   0,0,-1,   0,0,-1],
      uvs:       [0,1,      1,1,      1,0,      0,0],
      attrs:     [8,0,0,    8,0,0,    8,0,0,    8,0,0],
      indices:   [0,1,2, 0,2,3],
    };
  }

  function makeCylZ(cx, cy, cz, r, len, segs, matId) {
    const pos = [], nrm = [], uv = [], attrs = [], idx = [];
    for (let ring = 0; ring <= 1; ring++) {
      const z = cz + (ring - 0.5) * len;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        pos.push(cx + ca*r, cy + sa*r, z); nrm.push(ca, sa, 0);
        uv.push(i / segs, ring); attrs.push(matId, 0, 0);
      }
    }
    const stride = segs + 1;
    for (let i = 0; i < segs; i++) { const a = i, b = i + stride; idx.push(a, a+1, b, a+1, b+1, b); }
    return { positions: pos, normals: nrm, uvs: uv, attrs, indices: idx };
  }

  function makeTube3D(a, b, r, segs, matId) {
    const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2];
    const up = Math.abs(dy) > Math.hypot(dx, dz) * 0.9 ? [1,0,0] : [0,1,0];
    let sx = dy*up[2]-dz*up[1], sy = dz*up[0]-dx*up[2], sz = dx*up[1]-dy*up[0];
    const sl = Math.hypot(sx, sy, sz) || 1; sx/=sl; sy/=sl; sz/=sl;
    let tx = dy*sz-dz*sy, ty = dz*sx-dx*sz, tz = dx*sy-dy*sx;
    const tl = Math.hypot(tx, ty, tz) || 1; tx/=tl; ty/=tl; tz/=tl;
    const pos = [], nrm = [], uv = [], attrs = [], idx = [];
    for (let ring = 0; ring <= 1; ring++) {
      const p = ring === 0 ? a : b;
      for (let i = 0; i <= segs; i++) {
        const ang = (i / segs) * Math.PI * 2, ca = Math.cos(ang), sa = Math.sin(ang);
        const nx = sx*ca + tx*sa, ny = sy*ca + ty*sa, nz = sz*ca + tz*sa;
        pos.push(p[0] + nx*r, p[1] + ny*r, p[2] + nz*r);
        nrm.push(nx, ny, nz); uv.push(i/segs, ring); attrs.push(matId, 0, 0);
      }
    }
    const stride = segs + 1;
    for (let i = 0; i < segs; i++) { const k = i, m = i + stride; idx.push(k, k+1, m, k+1, m+1, m); }
    return { positions: pos, normals: nrm, uvs: uv, attrs, indices: idx };
  }

  // Sculpted Cambered Airfoil GT Rear Wing Blade (smooth 12-point airfoil x 12 span stations)
  function makeAirfoilWing(yC, zC, spanW, chord, thick, matId) {
    const spanSegs = 12, profPts = 12;
    const pos = [], uv = [], attrs = [], idx = [];
    for (let si = 0; si <= spanSegs; si++) {
      const u = (si / spanSegs) * 2 - 1; // -1..1
      const x = u * spanW * 0.5;
      const droop = -0.025 * u * u;
      const sweepZ = -0.035 * u * u;
      for (let pi = 0; pi < profPts; pi++) {
        const ang = (pi / profPts) * Math.PI * 2;
        const cU = 0.5 * (1.0 - Math.cos(ang)); // 0 = leading edge, 1 = trailing edge
        const side = Math.sin(ang);
        const camber = Math.sin(cU * Math.PI) * thick * 0.65;
        const halfT = Math.sin(Math.pow(cU, 0.68) * Math.PI) * thick * 0.55;
        const ly = camber + side * halfT + (cU - 0.5) * 0.055; // pitched nose-down for downforce
        const lz = (0.5 - cU) * chord;
        pos.push(x, yC + ly + droop, zC + lz + sweepZ);
        uv.push(u * 0.5 + 0.5, pi / profPts);
        attrs.push(matId, 0, 0);
      }
    }
    for (let si = 0; si < spanSegs; si++) {
      for (let pi = 0; pi < profPts; pi++) {
        const np = (pi + 1) % profPts;
        const a = si*profPts + pi, b = si*profPts + np, c = (si+1)*profPts + pi, d = (si+1)*profPts + np;
        idx.push(a, c, b, b, c, d);
      }
    }
    return { positions: pos, normals: computeSmoothNormals(pos, idx), uvs: uv, attrs, indices: idx };
  }

  // Chiseled RALLY widebody polygonal wheel-arch flare (1:1 matches 车.png & 车2.jpg — crisp mechanical bevels, zero LEGO blocks!)
  function makeFenderFlare(side, zCenter, yCenter, archR, flareW, matBody, matDark) {
    const segs = 18;
    const pos = [], nrm = [], uv = [], attrs = [], idx = [];
    const innerX = side * 0.90;
    const outerX = side * (0.90 + flareW);
    const lipX = side * (0.90 + flareW * 0.78);
    const pushQuad = (a, b, c, d, mat) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const base = pos.length / 3;
      const verts = side > 0 ? [a, b, c, d] : [a, d, c, b];
      if (side < 0) { nx = -nx; ny = -ny; nz = -nz; }
      for (const p of verts) {
        pos.push(p[0], p[1], p[2]);
        nrm.push(nx, ny, nz);
        uv.push(Math.max(0, Math.min(1, (2.14 - p[2]) / 4.24)), Math.max(0, Math.min(1, 1.0 - (p[1] - 0.24) / 1.14)));
        attrs.push(mat, 0, 0);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const rIn = archR;
    const rMid = archR + 0.13;
    const rTop = archR + 0.22;
    const ring = (t) => {
      const ang = (-0.08 + t * 1.16) * Math.PI;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const box = 1.0 + 0.08 * Math.pow(Math.abs(Math.sin(ang * 2.0)), 1.5);
      const dzIn = ca * rIn * 1.04, dyIn = Math.max(-0.14, sa * rIn);
      const dzMid = ca * rMid * 1.08 * box, dyMid = Math.max(-0.14, sa * rMid * box);
      const dzTop = ca * rTop * 1.14 * box, dyTop = Math.max(-0.12, sa * rTop * 0.94);
      const tipFade = Math.sin(Math.max(0.05, Math.min(0.95, t)) * Math.PI);
      const ox = innerX + (outerX - innerX) * (0.45 + 0.55 * tipFade);
      const lx = innerX + (lipX - innerX) * (0.45 + 0.55 * tipFade);
      return {
        well: [innerX - side * 0.16, yCenter + dyIn, zCenter + dzIn],
        lip:  [lx,                   yCenter + dyIn, zCenter + dzIn],
        outer:[ox,                   yCenter + dyMid, zCenter + dzMid],
        root: [innerX,               yCenter + dyTop, zCenter + dzTop],
      };
    };
    let prev = ring(0);
    for (let i = 1; i <= segs; i++) {
      const cur = ring(i / segs);
      pushQuad(prev.root, cur.root, cur.outer, prev.outer, matBody);
      pushQuad(prev.outer, cur.outer, cur.lip, prev.lip, matBody);
      pushQuad(prev.lip, cur.lip, cur.well, prev.well, matDark);
      prev = cur;
    }
    return { positions: pos, normals: nrm, uvs: uv, attrs, indices: idx };
  }

  // 1:1 Mechanical RALLY Rally Coupe N°22 (Crisp chiseled fastback, sculpted widebody arches, transparent rear/side glass
  // revealing full tubular roll-cage & bucket seats — matches 车.png & 车2.jpg!)
  function buildRallyBodyGeo() {
    const sections = [
      // 13-station sculpted RALLY fastback profile (smoother aero nose, arched roofline, muscular rear haunches — 1:1 车.png & 车2.jpg!)
      { z:  2.16, yB: 0.27, yM: 0.54, yT: 0.60, wB: 0.85, wM: 0.89, wT: 0.77, g: 0, tg: 0 },
      { z:  2.00, yB: 0.25, yM: 0.75, yT: 0.80, wB: 0.90, wM: 0.93, wT: 0.82, g: 0, tg: 0 },
      { z:  1.42, yB: 0.25, yM: 0.83, yT: 0.87, wB: 0.91, wM: 0.94, wT: 0.84, g: 0, tg: 0 },
      { z:  0.72, yB: 0.25, yM: 0.87, yT: 0.90, wB: 0.90, wM: 0.93, wT: 0.82, g: 0, tg: 0 },
      { z:  0.54, yB: 0.25, yM: 0.88, yT: 0.93, wB: 0.90, wM: 0.93, wT: 0.80, g: 1, tg: 1 },
      { z:  0.10, yB: 0.25, yM: 0.89, yT: 1.34, wB: 0.90, wM: 0.93, wT: 0.65, g: 1, tg: 1 },
      { z: -0.28, yB: 0.25, yM: 0.90, yT: 1.37, wB: 0.90, wM: 0.94, wT: 0.64, g: 1, tg: 0 },
      { z: -0.68, yB: 0.25, yM: 0.91, yT: 1.34, wB: 0.91, wM: 0.95, wT: 0.64, g: 1, tg: 2 },
      { z: -1.16, yB: 0.255,yM: 0.925,yT: 1.15, wB: 0.93, wM: 0.97, wT: 0.72, g: 1, tg: 2 },
      { z: -1.56, yB: 0.26, yM: 0.93, yT: 0.96, wB: 0.94, wM: 0.98, wT: 0.80, g: 1, tg: 2 },
      { z: -1.96, yB: 0.27, yM: 0.91, yT: 0.94, wB: 0.93, wM: 0.96, wT: 0.83, g: 0, tg: 0 },
      { z: -2.09, yB: 0.29, yM: 0.88, yT: 0.91, wB: 0.91, wM: 0.93, wT: 0.81, g: 0, tg: 0 },
      { z: -2.12, yB: 0.31, yM: 0.74, yT: 0.80, wB: 0.88, wM: 0.90, wT: 0.78, g: 0, tg: 0 },
    ];

    const pos = [], nrm = [], uv = [], attrs = [], idx = [];
    const gPos = [], gNrm = [], gUv = [], gAttrs = [], gIdx = [];
    const ringPts = 12;
    const makeRing = (s) => {
      const y1 = s.yB + (s.yM - s.yB) * 0.48;
      return [
        [ 0.0,       s.yB,        s.z, 2],
        [ s.wB,      s.yB + 0.02, s.z, 0],
        [ s.wM*1.01, y1,          s.z, 0],
        [ s.wM,      s.yM,        s.z, 0],
        [ s.wT,      s.yT,        s.z, 0],
        [ s.wT*0.46, s.yT + 0.022,s.z, 0],
        [-s.wT*0.46, s.yT + 0.022,s.z, 0],
        [-s.wT,      s.yT,        s.z, 0],
        [-s.wM,      s.yM,        s.z, 0],
        [-s.wM*1.01, y1,          s.z, 0],
        [-s.wB,      s.yB + 0.02, s.z, 0],
        [-s.wB*0.5,  s.yB,        s.z, 2],
      ];
    };
    const pushQuadTo = (tPos, tNrm, tUv, tAttrs, tIdx, a, b, c, d, matOverride) => {
      const ux = c[0]-a[0], uy = c[1]-a[1], uz = c[2]-a[2];
      const vx = b[0]-a[0], vy = b[1]-a[1], vz = b[2]-a[2];
      let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx/=l; ny/=l; nz/=l;
      const base = tPos.length / 3;
      const verts = [a, c, d, b];
      for (const p of verts) {
        tPos.push(p[0], p[1], p[2]);
        tNrm.push(nx, ny, nz);
        tUv.push(Math.max(0, Math.min(1, (2.14 - p[2]) / 4.24)), Math.max(0, Math.min(1, 1.0 - (p[1] - 0.24) / 1.14)));
        tAttrs.push(matOverride !== undefined ? matOverride : p[3], 0, 0);
      }
      tIdx.push(base, base+1, base+2, base, base+2, base+3);
    };

    const rings = sections.map(makeRing);
    for (let si = 0; si < rings.length - 1; si++) {
      const r0 = rings[si], r1 = rings[si + 1];
      const s0 = sections[si], s1 = sections[si + 1];
      for (let pi = 0; pi < ringPts; pi++) {
        const np = (pi + 1) % ringPts;
        const isWinFace = (pi === 3 || pi === 7) && s0.g && s1.g;
        const isTopGlassFace = (pi === 4 || pi === 5 || pi === 6) && ((s0.tg === 1 && s1.tg === 1) || (s0.tg === 2 && s1.tg === 2));
        if (isWinFace || isTopGlassFace) {
          pushQuadTo(gPos, gNrm, gUv, gAttrs, gIdx, r0[pi], r0[np], r1[pi], r1[np], 1);
        } else {
          const matOvr = (pi === 0 || pi === 10 || pi === 11) ? 2 : 0;
          pushQuadTo(pos, nrm, uv, attrs, idx, r0[pi], r0[np], r1[pi], r1[np], matOvr);
        }
      }
    }
    const pushCap = (ring, zOff, nyDir) => {
      const cx = 0, cy = 0.56, cz = ring[0][2] + zOff;
      for (let pi = 0; pi < ringPts; pi++) {
        const np = (pi + 1) % ringPts;
        const a = ring[pi], b = ring[np];
        const base = pos.length / 3;
        pos.push(cx, cy, cz, a[0], a[1], a[2], b[0], b[1], b[2]);
        for (let k = 0; k < 3; k++) { nrm.push(0, 0, nyDir); attrs.push(0, 0, 0); }
        uv.push(nyDir > 0 ? 0 : 1, 0.72, nyDir > 0 ? 0 : 1, 0.72, nyDir > 0 ? 0 : 1, 0.72);
        if (nyDir > 0) idx.push(base, base+1, base+2); else idx.push(base, base+2, base+1);
      }
    };
    pushCap(rings[0], 0.01, 1);
    pushCap(rings[rings.length - 1], -0.01, -1);

    const parts = [
      { positions: pos, normals: nrm, uvs: uv, attrs, indices: idx },
    ];
    const chaseInteriorParts = [

      // === DARK CABIN INTERIOR FLOOR, REAR PARCEL SHELF, DASHBOARD & HEADLINER ===
      makeBox(0.00, 0.56, -0.45, 1.56, 0.08, 1.90, 2, 0),
      makeBox(0.00, 0.85, -1.24, 1.48, 0.10, 0.62, 2, 0),
      // Full-width carbon dashboard & front firewall bulkhead (meets inner door panels seamlessly — ZERO gap!)
      makeBox(0.00, 0.86,  0.42, 1.74, 0.16, 0.26, 2, -0.12),
      makeBox(0.00, 0.66,  0.54, 1.74, 0.44, 0.08, 2, 0),
      // Complete Left & Right Interior Door Cards, Painted Door Beltlines, Armrests, Pull Straps, Mirror Gussets & Side Roll-Cage Bars
      ...[-1, 1].flatMap((s) => [
        makeBox(s * 0.87, 0.68, -0.02, 0.10, 0.54, 1.42, 2, 0),       // Carbon interior door card (eliminates missing door in cockpit!)
        makeBox(s * 0.86, 0.915, -0.02, 0.13, 0.065, 1.42, 0, 0),     // Painted upper door beltline sill (connects cleanly to mirror stalk)
        makeBox(s * 0.81, 0.77, -0.04, 0.055, 0.055, 0.78, 2, 0),     // Sculpted interior door armrest rail
        makeBox(s * 0.80, 0.79,  0.16, 0.026, 0.032, 0.14, 9, 0),     // Motorsport red nylon door pull strap
        makeBox(s * 0.86, 0.96,  0.44, 0.08, 0.11, 0.18, 2, 0),       // A-pillar mirror base gusset triangle (no floating mirror!)
        makeTube3D([s * 0.77, 0.62, 0.46], [s * 0.75, 0.88, -0.44], 0.024, 8, 11), // RALLY side-impact door roll-cage bar
      ]),
      // Compact Carbon Dashboard Glare Lip, Center Switch Console & Rally Shifter / Handbrake
      // Sculpted Multi-Segment Curved Arched Carbon Instrument Binnacle Cowl (ZERO flat boxy dash hood!)
      ...[0, 1, 2, 3, 4, 5].map((bi) => {
        const a = (bi / 5) * Math.PI;
        const bx = -0.34 - Math.cos(a) * 0.175;
        const by = 0.975 + Math.sin(a) * 0.078;
        return makeBox(bx, by, 0.34, 0.075, 0.020, 0.16, 2, 0.06);
      }),
      // Co-Driver Digital Rally Tripmeter / Pace-Note Pod on Passenger Dash
      makeBox( 0.36, 0.995, 0.36, 0.24, 0.075, 0.09, 2, -0.18),
      makeBox( 0.36, 0.998, 0.312, 0.19, 0.048, 0.010, 5, 0),
      makeBox( 0.30, 0.978, 0.310, 0.022, 0.012, 0.012, 4, 0),
      makeBox( 0.36, 0.978, 0.310, 0.022, 0.012, 0.012, 9, 0),
      // Twin Angled Auxiliary Turbo-Boost & Oil-Temp Gauges on Center Dash Pod (vivid in 1st-person cockpit!)
      makeCylZ(-0.10, 1.005, 0.34, 0.036, 0.055, 16, 2),
      makeCylZ(-0.10, 1.005, 0.311, 0.029, 0.008, 16, 5),
      makeCylZ(-0.02, 1.005, 0.34, 0.036, 0.055, 16, 2),
      makeCylZ(-0.02, 1.005, 0.311, 0.029, 0.008, 16, 4),
      // Welded Motorsport Roll-Cage A-Pillar Gusset Plates + STAGE Black Roll-Bar Foam Padding
      ...[-1, 1].flatMap((s) => [
        makeTube3D([s * 0.72, 1.06, 0.32], [s * 0.64, 1.24, 0.16], 0.036, 10, 2), // STAGE black protective foam sleeve on A-pillar bar
        makeBox(s * 0.78, 0.97, 0.38, 0.018, 0.09, 0.11, 9, 0.35),               // Red welded gusset reinforcement bracket
        makeBox(s * 0.78, 0.66, 0.12, 0.025, 0.14, 0.14, 7, 0),                  // Brushed aluminum door speaker / intercom grille
      ]),
      makeBox( 0.00, 0.952, 0.44, 1.66, 0.024, 0.16, 2, -0.06), // Upper matte Alcantara dash pad
      makeBox(-0.68, 0.92,  0.34, 0.12, 0.055, 0.04, 7, 0),     // Driver side air vent bezel
      makeBox( 0.68, 0.92,  0.34, 0.12, 0.055, 0.04, 7, 0),     // Co-driver air vent bezel
      // Motorsport Sun-Strip Windshield Header Visor + Tubular A-Pillar Gusset Struts
      makeBox( 0.00, 1.305, 0.14, 1.32, 0.075, 0.025, 2, -0.42),
      makeTube3D([-0.34, 0.90, 0.34], [-0.34, 0.955, 0.185], 0.024, 10, 2), // Steering column
      // Center Console Switch Stack (Carbon Bezel + Illuminated Toggle Switches + Red Engine Start Button — no duplicate dash!)
      makeBox( 0.00, 0.74,  0.14, 0.18, 0.24, 0.54, 2, 0),
      makeBox( 0.04, 0.935, 0.31, 0.22, 0.105, 0.04, 2, -0.24),
      makeBox(-0.02, 0.955, 0.292, 0.022, 0.022, 0.018, 9, 0),  // Red Engine Start button
      makeBox( 0.02, 0.955, 0.292, 0.016, 0.024, 0.016, 4, 0),  // Amber ALS toggle
      makeBox( 0.06, 0.955, 0.292, 0.016, 0.024, 0.016, 5, 0),  // White Fan/Wiper toggle
      makeBox( 0.10, 0.955, 0.292, 0.016, 0.024, 0.016, 7, 0),  // Brushed aluminum breaker
      makeBox( 0.04, 0.915, 0.292, 0.16, 0.012, 0.012, 7, 0),   // Switch guard bar
      // Sequential Rally Shifter + Hydraulic Handbrake Lever
      makeTube3D([-0.04, 0.76, 0.18], [-0.04, 0.96, 0.14], 0.012, 6, 7),
      makeCylZ(-0.04, 0.97, 0.14, 0.022, 0.05, 8, 9),
      makeTube3D([ 0.05, 0.76, 0.04], [ 0.05, 0.95, -0.02], 0.011, 6, 7),
      makeCylZ( 0.05, 0.96, -0.02, 0.018, 0.045, 8, 2),
      // Interior Rearview Mirror + Windshield Header Trim + Tubular Interior A-Pillar Roll-Cage Gussets
      makeBox( 0.00, 1.325, 0.10, 1.24, 0.045, 0.08, 2, 0),
      makeTube3D([0.00, 1.32, 0.24], [0.00, 1.275, 0.27], 0.008, 6, 2),
      makeBox( 0.00, 1.270, 0.27, 0.175, 0.042, 0.020, 2, 0),
      makeBox( 0.00, 1.270, 0.258, 0.162, 0.034, 0.005, 7, 0),    // Sleek panoramic rearview mirror
      ...[-1, 1].flatMap((s) => [
        makeTube3D([s * 0.80, 0.90, 0.46], [s * 0.60, 1.32, 0.08], 0.024, 8, 9), // Red RALLY A-pillar roll-cage tube
        makeTube3D([s * 0.85, 0.89, 0.51], [s * 0.63, 1.34, 0.09], 0.036, 8, 2), // Matte dark Alcantara interior A-pillar liner
      ]),
      // Digital RALLY Driver Instrument Cluster Screen (facing -Z toward driver, U flipped so left->right reads unmirrored!)
      {
        positions: [-0.46,0.925,0.31, -0.22,0.925,0.31, -0.22,1.020,0.33, -0.46,1.020,0.33],
        normals:   [0,0.25,-0.97, 0,0.25,-0.97, 0,0.25,-0.97, 0,0.25,-0.97],
        uvs:       [1,1, 0,1, 0,0, 1,0],
        attrs:     [12,0,0, 12,0,0, 12,0,0, 12,0,0],
        indices:   [0,2,1, 0,3,2],
      },
      makeBox(0.00, 1.32, -0.29, 1.24, 0.03, 0.76, 2, 0),
      makeBox(0.00, 0.92, -1.18, 0.54, 0.16, 0.34, 11, 0),
      // === SQUARE RALLY SIDE MIRRORS (chase-only; CockpitV4 renders high-detail mirrors in 1st-person) ===
      makeTube3D([-0.86, 0.92, 0.42], [-1.00, 0.96, 0.40], 0.022, 6, 2),
      makeTube3D([ 0.86, 0.92, 0.42], [ 1.00, 0.96, 0.40], 0.022, 6, 2),
      makeBox(-1.04, 0.97, 0.40, 0.17, 0.10, 0.12, 0, 0),
      makeBox( 1.04, 0.97, 0.40, 0.17, 0.10, 0.12, 0, 0),
      // === CHASE-ONLY INTERIOR ROLL-CAGE & BUCKET SEATS (prevents blocking 1st-person CockpitV4 camera!) ===
      makeTube3D([-0.50, 0.62, -0.42], [-0.48, 1.28, -0.44], 0.032, 8, 11),
      makeTube3D([ 0.50, 0.62, -0.42], [ 0.48, 1.28, -0.44], 0.032, 8, 11),
      makeTube3D([-0.48, 1.28, -0.44], [ 0.48, 1.28, -0.44], 0.032, 8, 11),
      makeTube3D([-0.48, 1.26, -0.44], [ 0.48, 0.90, -1.32], 0.028, 8, 9),
      makeTube3D([ 0.48, 1.26, -0.44], [-0.48, 0.90, -1.32], 0.028, 8, 9),
      makeTube3D([-0.48, 1.26, -0.44], [-0.52, 0.90, -1.32], 0.026, 8, 11),
      makeTube3D([ 0.48, 1.26, -0.44], [ 0.52, 0.90, -1.32], 0.026, 8, 11),
      makeTube3D([-0.50, 0.92, -0.44], [ 0.50, 0.92, -0.44], 0.026, 8, 9),
      makeBox(-0.34, 0.96, -0.14, 0.36, 0.48, 0.14, 2, 0.16),
      makeBox( 0.34, 0.96, -0.14, 0.36, 0.48, 0.14, 2, 0.16),
      makeBox(-0.34, 1.18, -0.18, 0.24, 0.12, 0.12, 9, 0.10),
      makeBox( 0.34, 1.18, -0.18, 0.24, 0.12, 0.12, 9, 0.10),
      // Exterior cabin A-pillars & roof scoops (chase-only so 1st-person CockpitV4 A-pillars & header sky stay 100% clean)
      ...[-1, 1].flatMap((s) => [
        makeTube3D([s * 0.89, 0.89,  0.54], [s * 0.66, 1.35,  0.10], 0.048, 8, 0),
        makeTube3D([s * 0.66, 1.35,  0.10], [s * 0.65, 1.35, -0.68], 0.052, 8, 0),
      ]),
      makeBox( 0.00, 1.405, -0.02, 0.44, 0.080, 0.42, 11, -0.06),
      makeBox( 0.00, 1.395,  0.19, 0.38, 0.058, 0.04, 2,   0.00),
      makeBox( 0.00, 1.395, -0.52, 0.38, 0.066, 0.30, 11, -0.05),
      makeBox( 0.00, 1.388, -0.37, 0.32, 0.048, 0.04, 2,   0.00),
    ];
    parts.push(

      // === SCULPTED CHISELED RALLY WIDEBODY FENDER ARCHES + CRISP A/B/C PILLAR CABIN FRAMING ===
      ...[-1, 1].flatMap((s) => [
        makeFenderFlare(s,  1.42, 0.39, 0.41, 0.115, 0, 2),
        makeFenderFlare(s, -1.26, 0.40, 0.43, 0.145, 0, 2),
        makeBox(s * 0.98, 0.52,  0.88, 0.04, 0.34, 0.12, 2, 0),
        makeBox(s * 1.02, 0.58, -1.78, 0.04, 0.28, 0.10, 2, 0),
        makeBox(s * 1.01, 0.74, -1.94, 0.04, 0.14, 0.028, 2, 0),
        makeBox(s * 1.01, 0.74, -1.88, 0.04, 0.14, 0.028, 2, 0),
        makeBox(s * 1.01, 0.74, -1.82, 0.04, 0.14, 0.028, 2, 0),
        makeBox(s * 0.95, 0.27,  0.08, 0.14, 0.10, 1.72, 2, 0),
        makeTube3D([s * 0.65, 1.35, -0.68], [s * 0.83, 0.96, -1.52], 0.072, 8, 0),
        makeTube3D([s * 0.82, 0.90, -0.44], [s * 0.70, 1.34, -0.46], 0.032, 6, 2),
        makeTube3D([s * 0.60, 1.33, -0.70], [s * 0.76, 0.96, -1.50], 0.024, 6, 2),
        makeBox(s * 0.76, 1.13, -0.84, 0.05, 0.14, 0.032, 2, 0),
        makeBox(s * 0.76, 1.13, -0.91, 0.05, 0.14, 0.032, 2, 0),
        makeBox(s * 0.76, 1.13, -0.98, 0.05, 0.14, 0.032, 2, 0),
      ]),
      makeBox(0.00, 1.34, -0.70, 1.24, 0.035, 0.045, 2, 0),
      makeBox(0.00, 0.96, -1.52, 1.56, 0.035, 0.050, 2, 0),

      // === HANGING BLACK RUBBER RALLY MUDFLAPS BEHIND ALL 4 WHEELS ===
      makeBox(-0.86, 0.22, -1.78, 0.32, 0.27, 0.034, 2, 0.08),
      makeBox( 0.86, 0.22, -1.78, 0.32, 0.27, 0.034, 2, 0.08),
      makeBox(-0.84, 0.21,  0.94, 0.29, 0.23, 0.030, 2, 0.08),
      makeBox( 0.84, 0.21,  0.94, 0.29, 0.23, 0.030, 2, 0.08),

      // (Roof air-scoops & A-pillars moved to chaseInteriorParts for clean CockpitV4 framing)

      // (Old interior roll-cage & bucket seats moved to chaseInteriorParts above)

      // === SWEPT-BACK RALLY RALLY REAR WING + TALL TEAL SIDE ENDPLATES ===
      makeAirfoilWing(1.24, -1.86, 1.66, 0.28, 0.044, 2),
      // Curved aerodynamic carbon ducktail Gurney lip along rear trunk deck edge
      makeAirfoilWing(0.955, -2.01, 1.44, 0.11, 0.026, 2),
      makeBox( 0.00, 1.285, -1.98, 1.64, 0.022, 0.06, 2, -0.28),
      // Sculpted swan-neck aero wing pylons (sloped curved uprights + upper mounting brackets)
      makeTube3D([-0.46, 0.92, -1.78], [-0.46, 1.26, -1.88], 0.028, 8, 2),
      makeTube3D([ 0.46, 0.92, -1.78], [ 0.46, 1.26, -1.88], 0.028, 8, 2),
      makeTube3D([-0.46, 1.26, -1.88], [-0.46, 1.23, -1.76], 0.022, 6, 7),
      makeTube3D([ 0.46, 1.26, -1.88], [ 0.46, 1.23, -1.76], 0.022, 6, 7),
      makeBox(-0.85, 1.19, -1.84, 0.042, 0.32, 0.40, 0, -0.24),
      makeBox( 0.85, 1.19, -1.84, 0.042, 0.32, 0.40, 0, -0.24),

      // === FRONT RALLY BULL-BAR + SKID PLATE + QUAD ROUND HEADLIGHTS + HOOD EXTRACTOR VENTS ===
      makeTube3D([-0.68, 0.30, 2.22], [-0.52, 0.56, 2.22], 0.030, 8, 2),
      makeTube3D([ 0.68, 0.30, 2.22], [ 0.52, 0.56, 2.22], 0.030, 8, 2),
      makeTube3D([-0.52, 0.56, 2.22], [ 0.52, 0.56, 2.22], 0.030, 8, 2),
      makeTube3D([-0.68, 0.30, 2.22], [ 0.68, 0.30, 2.22], 0.030, 8, 2),
      makeBox(0.00, 0.27, 2.18, 1.18, 0.14, 0.12, 2, 0.28),
      makeBox( 0.00, 0.56, 2.13, 0.86, 0.19, 0.07, 2, 0),
      makeBox(-0.68, 0.40, 2.14, 0.28, 0.14, 0.07, 2, 0),
      makeBox( 0.68, 0.40, 2.14, 0.28, 0.14, 0.07, 2, 0),
      makeBox(-0.52, 0.40, 2.16, 0.06, 0.11, 0.06, 4, 0),
      makeBox( 0.52, 0.40, 2.16, 0.06, 0.11, 0.06, 4, 0),
      makeBox(-0.66, 0.65, 2.12, 0.42, 0.18, 0.07, 2, 0),
      makeBox( 0.66, 0.65, 2.12, 0.42, 0.18, 0.07, 2, 0),
      makeCylZ(-0.74, 0.65, 2.14, 0.074, 0.06, 16, 6),
      makeCylZ(-0.56, 0.65, 2.14, 0.062, 0.06, 16, 6),
      makeCylZ( 0.74, 0.65, 2.14, 0.074, 0.06, 16, 6),
      makeCylZ( 0.56, 0.65, 2.14, 0.062, 0.06, 16, 6),
      makeBox(-0.46, 0.865, 1.24, 0.28, 0.04, 0.42, 2, 0.06),
      makeBox( 0.46, 0.865, 1.24, 0.28, 0.04, 0.42, 2, 0.06),
      // Triple sculpted hood heat-extractor louver slats + front carbon splitter tie-rods + red motorsport tow hook (1:1 车.png!)
      ...[-1, 1].flatMap((s) => [
        makeBox(s * 0.46, 0.885, 1.12, 0.24, 0.016, 0.045, 0, -0.22),
        makeBox(s * 0.46, 0.880, 1.24, 0.24, 0.016, 0.045, 0, -0.22),
        makeBox(s * 0.46, 0.875, 1.36, 0.24, 0.016, 0.045, 0, -0.22),
        makeTube3D([s * 0.42, 0.28, 2.22], [s * 0.38, 0.46, 2.15], 0.012, 6, 7),
      ]),
      makeBox(0.36, 0.34, 2.24, 0.075, 0.045, 0.055, 9, 0),
      // === ICONIC RALLY QUAD HOOD AUXILIARY RALLY LIGHT POD + BONNET PINS ===
      makeBox(0.00, 0.84, 1.88, 0.88, 0.14, 0.26, 2, 0.08),
      ...[-0.31, -0.105, 0.105, 0.31].flatMap((lx) => [
        makeCylZ(lx, 0.85, 1.98, 0.088, 0.10, 16, 2),
        makeCylZ(lx, 0.85, 2.02, 0.070, 0.04, 16, 6),
      ]),
      // Quick-release aluminum rally hood pins
      makeBox(-0.62, 0.845, 1.78, 0.05, 0.018, 0.06, 7, 0),
      makeBox( 0.62, 0.845, 1.78, 0.05, 0.018, 0.06, 7, 0),

      // === HERO REAR FASCIA (1:1 车.png REAR & 车2.jpg!) ===
      // Recessed dark carbon taillight clusters + multi-layer 3D glowing red LED blades + crystalline reverse prisms + brushed aluminum trim!
      makeBox(-0.64, 0.79, -2.095, 0.52, 0.17, 0.07, 2, 0),
      makeBox( 0.64, 0.79, -2.095, 0.52, 0.17, 0.07, 2, 0),
      makeBox(-0.64, 0.842, -2.132, 0.46, 0.024, 0.032, 4, 0),
      makeBox(-0.64, 0.738, -2.132, 0.46, 0.024, 0.032, 4, 0),
      makeBox(-0.855, 0.79, -2.132, 0.032, 0.128, 0.032, 4, 0),
      makeBox(-0.425, 0.79, -2.132, 0.032, 0.128, 0.032, 4, 0),
      makeBox(-0.71, 0.79, -2.136, 0.18, 0.030, 0.028, 9, 0), // Inner red brake bar
      makeBox(-0.50, 0.79, -2.136, 0.11, 0.030, 0.028, 5, 0), // Crystalline reverse LED
      makeBox( 0.64, 0.842, -2.132, 0.46, 0.024, 0.032, 4, 0),
      makeBox( 0.64, 0.738, -2.132, 0.46, 0.024, 0.032, 4, 0),
      makeBox( 0.855, 0.79, -2.132, 0.032, 0.128, 0.032, 4, 0),
      makeBox( 0.425, 0.79, -2.132, 0.032, 0.128, 0.032, 4, 0),
      makeBox( 0.71, 0.79, -2.136, 0.18, 0.030, 0.028, 9, 0),
      makeBox( 0.50, 0.79, -2.136, 0.11, 0.030, 0.028, 5, 0),
      // Center motorsport STAGE rain-light pulsing brake lamp in diffuser center!
      makeBox( 0.00, 0.36, -2.19, 0.085, 0.068, 0.025, 2, 0),
      makeBox( 0.00, 0.36, -2.205, 0.056, 0.044, 0.014, 4, 0),
      makeBox(-0.74, 0.50, -2.11, 0.16, 0.035, 0.04, 9, 0),
      makeBox( 0.74, 0.50, -2.11, 0.16, 0.035, 0.04, 9, 0),
      makeBox( 0.00, 0.65, -2.095, 0.54, 0.26, 0.06, 2, 0),
      makeRearNumberPlate(),
      // Aggressive 7-fin sculpted carbon rear aero diffuser + brushed aluminum lower splitter trim
      makeBox( 0.00, 0.30, -2.10, 1.78, 0.24, 0.20, 2, 0),
      makeBox( 0.00, 0.20, -2.18, 1.66, 0.018, 0.06, 7, 0),
      ...[-0.72, -0.48, -0.24, 0.0, 0.24, 0.48, 0.72].map((vx) => makeBox(vx, 0.27, -2.16, 0.028, 0.21, 0.20, 2, -0.14)),
      // Quad-tip motorsport titanium exhausts with dual-wall beveled tips + red rear recovery tow loop (1:1 车2.jpg!)
      ...[0.54, 0.40, -0.40, -0.54].flatMap((ex) => [
        makeCylZ(ex, 0.29, -2.16, 0.058, 0.26, 18, 7),
        makeCylZ(ex, 0.29, -2.26, 0.044, 0.09, 14, 2),
      ]),
      makeBox(0.00, 0.24, -2.20, 0.065, 0.055, 0.05, 9, 0),
      makeCylZ(0.00, 1.375, -0.58, 0.032, 0.04, 8, 2),
      makeTube3D([0.00, 1.38, -0.58], [0.00, 1.84, -0.72], 0.009, 6, 2),
      makeTube3D([0.18, 1.38, -0.54], [0.22, 1.72, -0.66], 0.007, 6, 2),
    );
    return {
      body: mergeParts(parts),
      chaseInterior: mergeParts(chaseInteriorParts),
      glass: { positions: gPos, normals: gNrm, uvs: gUv, colors: gAttrs, indices: gIdx },
    };
  }

  function buildWiperGeo() {
    // Articulated RALLY aero wiper arm + curved blade + central pressure bridge (vivid in 1st-person rainy cockpit!)
    return mergeParts([
      makeBox(0.16, 0.0, 0.008, 0.34, 0.015, 0.014, 2, 0),      // Primary forged steel wiper arm
      makeBox(0.32, 0.012, 0.002, 0.42, 0.018, 0.016, 2, 0),    // Rubber aero squeegee blade
      makeBox(0.32, 0.006, 0.014, 0.16, 0.010, 0.008, 7, 0),    // Metallic tension spoiler clip
      makeCylZ(0.0, 0.0, 0.0, 0.026, 0.032, 10, 2),             // Pivot spindle cap
    ]);
  }

  // Deep-Dish RALLY Suede Steering Wheel with 3 Anodized Spokes & Top Center Marker (rotates around local Z!)
  function buildSteerWheelGeo() {
    const parts = [];
    // Seamless closed 3D torus rim (zero gaps, zero clipping spikes)
    const uSegs = 32, vSegs = 10, R = 0.150, rTube = 0.0165, zOff = 0.032;
    const tPos = [], tNrm = [], tUv = [], tAttr = [], tIdx = [];
    for (let i = 0; i <= uSegs; i++) {
      const u = (i % uSegs) / uSegs * Math.PI * 2;
      const cu = Math.cos(u), su = Math.sin(u);
      const isTopStripe = (i >= 7 && i <= 9); // 12 o'clock red rally centering stripe
      const matId = isTopStripe ? 9 : 2;
      for (let j = 0; j <= vSegs; j++) {
        const v = (j % vSegs) / vSegs * Math.PI * 2;
        const cv = Math.cos(v), sv = Math.sin(v);
        const rad = R + rTube * cv;
        tPos.push(cu * rad, su * rad, zOff + rTube * sv);
        tNrm.push(cu * cv, su * cv, sv);
        tUv.push(i / uSegs, j / vSegs);
        tAttr.push(matId, 0, 0);
      }
    }
    const stride = vSegs + 1;
    for (let i = 0; i < uSegs; i++) {
      for (let j = 0; j < vSegs; j++) {
        const a = i * stride + j, b = (i + 1) * stride + j;
        tIdx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    parts.push({ positions: tPos, normals: tNrm, uvs: tUv, attrs: tAttr, indices: tIdx });
    // 3 sculpted brushed-aluminum spokes + cylindrical central hub + rally horn cap + metallic shift paddles + rotary thumb dials!
    parts.push(makeTube3D([0, 0, 0.016], [-R * 0.92, -0.018, 0.032], 0.013, 8, 7));
    parts.push(makeTube3D([0, 0, 0.016], [ R * 0.92, -0.018, 0.032], 0.013, 8, 7));
    parts.push(makeTube3D([0, 0, 0.016], [0, -R * 0.92, 0.032], 0.013, 8, 7));
    parts.push(makeCylZ(0, 0, 0.016, 0.044, 0.032, 16, 2));   // Cylindrical suede/carbon center hub
    parts.push(makeCylZ(0, 0, 0.000, 0.024, 0.010, 16, 9));   // Circular red RALLY horn emblem
    parts.push(makeCylZ(-0.078, -0.012, 0.022, 0.010, 0.012, 10, 4)); // Left amber rotary map dial
    parts.push(makeCylZ( 0.078, -0.012, 0.022, 0.010, 0.012, 10, 5)); // Right white diff-bias dial
    // Brushed aluminum sequential shift paddles behind spokes
    parts.push(makeBox(-0.095, 0.022, 0.046, 0.032, 0.075, 0.006, 7, 0));
    parts.push(makeBox( 0.095, 0.022, 0.046, 0.032, 0.075, 0.006, 7, 0));
    return mergeParts(parts);
  }

  // 3x Precision RALLY Gravel Rally Wheel (32-segment beveled tire, 12-spoke twin-alloy rim, slotted brake rotor & red caliper)
  function buildWheelGeo() {
    const pos = [], nrm = [], uv = [], attrs = [], idx = [];
    const segs = 32, rOut = 0.38, rShoulder = 0.362, rRim = 0.235, w = 0.31;
    const addRing = (x, r, mat, nx, nyScale) => {
      const st = pos.length / 3;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const tr = r === rOut ? (1.0 + 0.026 * Math.sin(i * 8.0)) : 1.0;
        pos.push(x, sa * r * tr, ca * r * tr); nrm.push(nx, sa * nyScale, ca * nyScale);
        uv.push(i / segs, 0.5); attrs.push(mat, 0, 0);
      }
      return st;
    };
    const r0L = addRing(-w*0.50, rShoulder, 2, -0.5, 0.85),
          r0  = addRing(-w*0.42, rOut,      2, -0.1, 1.0),
          r1  = addRing( w*0.42, rOut,      2,  0.1, 1.0),
          r1R = addRing( w*0.50, rShoulder, 2,  0.5, 0.85),
          r2  = addRing( w*0.50, rRim,      2,  1.0, 0.0),
          r3  = addRing(-w*0.50, rRim,      2, -1.0, 0.0),
          rLipR = addRing( w*0.48, rRim*0.95, 10,  1, 0),
          rLipL = addRing(-w*0.48, rRim*0.95, 10, -1, 0),
          r4  = addRing( w*0.30, rRim*0.84, 7,  1, 0),
          r5  = addRing(-w*0.30, rRim*0.84, 7, -1, 0);
    const bridge = (a0, b0) => { for (let i=0;i<segs;i++) idx.push(a0+i,b0+i,a0+i+1, a0+i+1,b0+i,b0+i+1); };
    bridge(r0L,r0); bridge(r0,r1); bridge(r1,r1R); bridge(r1R,r2); bridge(r3,r0L);
    bridge(r2,rLipR); bridge(rLipR,r4); bridge(r5,rLipL); bridge(rLipL,r3);
    // 6-twin-spoke (12-spoke) sculpted RALLY rally alloy spokes
    for (let sp = 0; sp < 12; sp++) {
      const pairAng = Math.floor(sp / 2) * (Math.PI * 2 / 6) + (sp % 2 === 0 ? -0.14 : 0.14);
      const ca = Math.cos(pairAng), sa = Math.sin(pairAng);
      const ty = -ca * 0.019, tz = sa * 0.019;
      for (const sgn of [1, -1]) {
        const sx = sgn * w * 0.46;
        const bIdx = pos.length / 3;
        pos.push(
          sx, sa*0.042 - ty, ca*0.042 - tz,
          sx, sa*0.042 + ty, ca*0.042 + tz,
          sx, sa*rRim*0.92 + ty*0.78, ca*rRim*0.92 + tz*0.78,
          sx, sa*rRim*0.92 - ty*0.78, ca*rRim*0.92 - tz*0.78
        );
        for (let k = 0; k < 4; k++) { nrm.push(sgn,0,0); uv.push(0.5,0.5); attrs.push(10,0,0); }
        if (sgn > 0) idx.push(bIdx, bIdx+2, bIdx+1, bIdx, bIdx+3, bIdx+2);
        else idx.push(bIdx, bIdx+1, bIdx+2, bIdx, bIdx+2, bIdx+3);
      }
    }
    // Racing-red 6-piston brake caliper visible behind spokes (matId = 9)
    for (const sgn of [1, -1]) {
      const cal = pos.length / 3;
      const cx = sgn * w * 0.34;
      pos.push(cx, 0.03, -0.16,  cx, 0.16, -0.16,  cx, 0.16, -0.04,  cx, 0.03, -0.04);
      for (let k = 0; k < 4; k++) { nrm.push(sgn,0,0); uv.push(0,0); attrs.push(9,0,0); }
      if (sgn > 0) idx.push(cal, cal+1, cal+2, cal, cal+2, cal+3);
      else idx.push(cal, cal+2, cal+1, cal, cal+3, cal+2);
    }
    const cR = pos.length/3; pos.push(w*0.30,0,0); nrm.push(1,0,0); uv.push(0.5,0.5); attrs.push(7,0,0);
    const cL = pos.length/3; pos.push(-w*0.30,0,0); nrm.push(-1,0,0); uv.push(0.5,0.5); attrs.push(7,0,0);
    for (let i=0;i<segs;i++) { idx.push(cR, r4+i+1, r4+i); idx.push(cL, r5+i, r5+i+1); }
    return { positions: pos, normals: nrm, uvs: uv, colors: attrs, indices: idx };
  }

  function buildContactShadowGeo() {
    const w = 2.05, l = 3.45;
    return { positions: [-w,0.035,-l, w,0.035,-l, w,0.035,l, -w,0.035,l], normals: [0,1,0,0,1,0,0,1,0,0,1,0], uvs: [0,0,1,0,1,1,0,1], indices: [0,2,1,0,3,2] };
  }

  PV.RallyCar = class RallyCar {
    constructor(gl, textures) {
      this.gl = gl;
      this.tex = textures;
      const bodyData = buildRallyBodyGeo();
      this.bodyMesh = PV.createMesh(gl, bodyData.body);
      this.chaseInteriorMesh = PV.createMesh(gl, bodyData.chaseInterior);
      this.glassMesh = PV.createMesh(gl, bodyData.glass);
      this.wheelMesh = PV.createMesh(gl, buildWheelGeo());
      this.wiperMesh = PV.createMesh(gl, buildWiperGeo());
      this.steerWheelMesh = PV.createMesh(gl, buildSteerWheelGeo());
      this.cockpitV4 = PV.CockpitV4 ? new PV.CockpitV4(gl) : null;
      this.aoMesh = PV.createMesh(gl, buildContactShadowGeo());
      this.modelMat = PV.M4.create();
      this.wheelMat = PV.M4.create();
      this.wiperMat = PV.M4.create();
      this.steerWheelMat = PV.M4.create();
      this._tmpMat = PV.M4.create(); // Pre-allocated scratch matrix (zero per-frame GC churn!)
      this.aoMat = PV.M4.create();
      this.dashCanvas = document.createElement('canvas');
      this.dashCanvas.width = 512; this.dashCanvas.height = 256;
      this.dashCtx = this.dashCanvas.getContext('2d');
      this.dashTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.dashTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this._dashFrame = 0;
      this.wheelOffsets = [
        [-0.98, 0.375,  1.42, true],
        [ 0.98, 0.375,  1.42, true],
        [-1.02, 0.375, -1.26, false],
        [ 1.02, 0.375, -1.26, false],
      ];
      this._initShaders();
      this.reset();
    }

    _initShaders() {
      const gl = this.gl;
      this.carProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aNrm;
        layout(location=2) in vec2 aUv;
        layout(location=3) in vec3 aAttr;
        uniform mat4 uViewProj;
        uniform mat4 uModel;
        out vec3 vWorldPos;
        out vec3 vLocalPos;
        out vec3 vNrm;
        out vec2 vUv;
        out float vMatId;
        void main() {
          vec4 wp = uModel * vec4(aPos, 1.0);
          vWorldPos = wp.xyz; vLocalPos = aPos;
          vNrm = normalize(mat3(uModel) * aNrm);
          vUv = aUv; vMatId = aAttr.x;
          gl_Position = uViewProj * wp;
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vLocalPos;
        in vec3 vNrm;
        in vec2 vUv;
        in float vMatId;
        uniform sampler2D uCarAlb;
        uniform sampler2D uCarRma;
        uniform sampler2D uRearPlate;
        uniform sampler2D uDashTex;
        uniform float uBrakeGlow;
        uniform float uBackfire;
        uniform float uCarSpeed;
        uniform float uCockpit;
        ${PV.PBR_GLSL}
        out vec4 fragColor;

        // Airflow-driven sliding raindrop beads & wet rivulet streaks on car body/glass (strictly backward -z / downward -y, ZERO reverse flow!)
        vec3 evalCarFlowingRain(vec3 lp, vec3 nrm, float t, float spd) {
          float cWet = smoothstep(0.28, 0.78, uWetness);
          if (cWet < 0.02) return vec3(0.0);
          float flowSpd = 0.55 + spd * 0.13;
          float gravSpd = 0.48 + spd * 0.035;
          float isTop = smoothstep(0.32, 0.76, nrm.y);
          float isRear = smoothstep(0.45, 0.85, -nrm.z);
          // Positive +t with +lp.z / +lp.y means constant phase moves strictly toward -z (rearward) and -y (downward)
          vec2 uvFlow = mix(
            vec2(lp.x * 13.0 + lp.z * 5.0, lp.y * 8.5 + t * gravSpd),
            vec2(lp.x * 16.0, lp.z * 5.2 + t * flowSpd),
            isTop
          );
          uvFlow = mix(uvFlow, vec2(lp.x * 15.0, lp.y * 9.0 + t * 0.68), isRear * 0.85);
          vec2 cell = floor(uvFlow);
          vec2 f = fract(uvFlow) - 0.5;
          float h = pvHash21(cell);
          float h2 = pvHash21(cell + 17.3);
          float dropMask = 0.0;
          vec2 grad = vec2(0.0);
          if (h > 0.44) {
            // Static per-cell position so beads glide monotonically with uvFlow (NEVER opposing cell velocity!)
            float ox = (h2 - 0.5) * 0.52 + sin(uvFlow.y * 2.4 + h * 12.0) * 0.035;
            float oy = (fract(h * 7.3) - 0.5) * 0.36;
            vec2 d = f - vec2(ox, oy);
            float r = 0.10 + (h - 0.44) * 0.14;
            float bead = smoothstep(r, r * 0.25, length(vec2(d.x * 1.45, d.y * 0.85)));
            // Wet trail strictly upstream (+d.y = ahead of moving drop in -z/-y direction)
            float tail = smoothstep(r * 0.40, 0.0, abs(d.x)) * smoothstep(0.0, 0.05, d.y) * smoothstep(0.44, 0.05, d.y) * 0.62;
            dropMask = max(bead, tail);
            grad = d * bead * 3.6 + vec2(d.x, 0.0) * tail * 1.9;
          }
          // Secondary finer high-speed micro-rivulets scrolling strictly rearward/downward
          vec2 uvFine = uvFlow * vec2(2.1, 1.45) + vec2(3.7, 0.0);
          float fineStreak = smoothstep(0.72, 0.94, pvNoise2(uvFine)) * 0.48;
          // Clinging static spherical raindrop beads on horizontal wet hood, roof & trunk clearcoat!
          vec2 bUv = lp.xz * 26.0;
          vec2 bId = floor(bUv), bF = fract(bUv) - 0.5;
          float bh = pvHash21(bId + 9.2);
          float staticBead = 0.0;
          if (bh > 0.46 && isTop > 0.25) {
            vec2 bd = bF - vec2(pvHash21(bId + 3.1) - 0.5, pvHash21(bId + 5.7) - 0.5) * 0.45;
            float br = 0.12 + (bh - 0.46) * 0.16;
            staticBead = smoothstep(br, br * 0.20, length(bd)) * isTop;
            grad += bd * staticBead * 4.2;
          }
          return vec3(grad * cWet, clamp((max(dropMask, staticBead) + fineStreak) * cWet, 0.0, 1.0));
        }

        void main() {
          vec3 N = normalize(vNrm);
          vec3 V = normalize(uCamPos - vWorldPos);
          int mid = int(vMatId + 0.5);

          vec2 uv = vUv;
          if (vLocalPos.x < -0.05 && uv.x >= 0.388 && uv.x <= 0.548 && uv.y >= 0.375 && uv.y <= 0.725) {
            uv.x = 0.388 + 0.548 - uv.x;
          }

          vec3 albedo = vec3(0.15);
          float rough = 0.45, metal = 0.0, clearcoat = 0.0;
          vec3 emissive = vec3(0.0);

          if (mid == 0) {
            // Clean vibrant anime teal-blue car paint + crisp white pinstripes flanking twin orange center stripes (1:1 车.png & 车2.jpg!)
            albedo = texture(uCarAlb, uv).rgb * vec3(0.84, 1.06, 1.12);
            vec3 rma = texture(uCarRma, uv).rgb;
            if (abs(vLocalPos.x) < 0.34 && vLocalPos.y > 0.66) {
              float ax = abs(vLocalPos.x);
              float twinStripe = step(0.036, ax) * step(ax, 0.22);
              float pinWhite = (step(0.22, ax) * step(ax, 0.255)) + (step(0.012, ax) * step(ax, 0.036));
              albedo = mix(albedo, vec3(0.95, 0.96, 0.94), pinWhite * 0.90);
              albedo = mix(albedo, vec3(0.98, 0.44, 0.06), twinStripe * 0.95);
            }
            // Diagonal orange speed-stripes over muscular rear widebody haunches (1:1 车2.jpg!)
            if (abs(vLocalPos.x) > 0.84 && vLocalPos.z < -0.45 && vLocalPos.z > -1.78 && vLocalPos.y > 0.42 && vLocalPos.y < 0.96) {
              float diag = vLocalPos.z * 0.92 + vLocalPos.y * 0.85;
              float band1 = smoothstep(0.09, 0.06, abs(diag + 0.34));
              float band2 = smoothstep(0.05, 0.03, abs(diag + 0.16));
              albedo = mix(albedo, vec3(0.98, 0.44, 0.06), clamp(band1 + band2, 0.0, 1.0) * 0.92);
            }
            // Signature horizontal bright-orange rally accent + white pinstripe across rear trunk deck
            if (vLocalPos.z < -1.55 && vLocalPos.y > 0.82 && vLocalPos.y < 0.94 && abs(vLocalPos.x) < 0.88) {
              float deckBar = smoothstep(0.82, 0.84, vLocalPos.y) * smoothstep(0.94, 0.915, vLocalPos.y);
              albedo = mix(albedo, vec3(0.98, 0.44, 0.06), deckBar * 0.92);
            }
            // Crisp cel-shaded mechanical panel seam lines (door, hood shut-lines, trunk crease & widebody flare rivets)
            float seamDoor = smoothstep(0.018, 0.004, abs(vLocalPos.z - 0.62)) + smoothstep(0.018, 0.004, abs(vLocalPos.z + 0.62));
            float seamHood = smoothstep(0.018, 0.004, abs(abs(vLocalPos.x) - 0.64)) * step(0.70, vLocalPos.z) * step(0.72, vLocalPos.y);
            float seamRear = smoothstep(0.020, 0.005, abs(vLocalPos.y - 0.88)) * step(vLocalPos.z, -1.65);
            float flareRivet = smoothstep(0.032, 0.014, length(vec2(fract(vLocalPos.z * 7.0) - 0.5, fract(vLocalPos.y * 7.0) - 0.5)))
                             * step(0.95, abs(vLocalPos.x)) * step(0.45, vLocalPos.y) * step(vLocalPos.y, 0.78);
            albedo *= (1.0 - clamp(seamDoor * step(0.82, abs(vLocalPos.x)) + seamHood + seamRear, 0.0, 1.0) * 0.54);
            albedo = mix(albedo, vec3(0.08, 0.10, 0.12), flareRivet * 0.65);
            // Authentic RALLY rally mud spatter on lower sills, wheel arches & rear bumper lip
            float mudNoise = pvFbm2(vec2(vLocalPos.x * 5.2 + vLocalPos.z * 4.4, vLocalPos.y * 6.5));
            float rearSplash = smoothstep(-1.40, -2.14, vLocalPos.z) * smoothstep(0.50, 0.24, vLocalPos.y);
            float lowerMud = smoothstep(0.40, 0.18, vLocalPos.y) * 0.68 + rearSplash * 0.62;
            float mudCoat = smoothstep(0.44, 0.76, mudNoise) * clamp(lowerMud, 0.0, 0.82);
            albedo = mix(albedo, vec3(0.16, 0.11, 0.065), mudCoat * 0.78);
            // High-definition wet clearcoat + glistening raindrop beads & rivulets on teal/orange paint
            vec3 flowR = evalCarFlowingRain(vLocalPos, N, uTime, uCarSpeed);
            float paintWet = clamp(uWetness, 0.0, 1.0);
            float wetDropSheen = flowR.z * (1.0 - mudCoat);
            albedo *= mix(1.0, 0.85, (1.0 - mudCoat) * paintWet * (0.45 + 0.55 * wetDropSheen));
            N = normalize(N + vec3(flowR.x * 0.52, flowR.y * 0.22, flowR.y * 0.44) * (1.0 - mudCoat));
            rough = mix(mix(0.20, 0.48, rma.r), 0.64, mudCoat);
            rough = mix(rough, 0.04, wetDropSheen * 0.92);
            metal = mix(0.28, 0.0, mudCoat);
            clearcoat = mix(max(rma.g * mix(0.68, 0.92, paintWet), wetDropSheen * 1.0), 0.14, mudCoat);
          } else if (mid == 1) {
            // Transparent dark-smoked wet glass with bold raindrop beads & wiper-cleared arc revealing roll-cage inside!
            vec3 flowG = evalCarFlowingRain(vLocalPos, N, uTime, uCarSpeed);
            float streak = clamp(flowG.z * 1.15 + smoothstep(0.54, 0.86, pvNoise2(vec2(vLocalPos.x * 26.0, vLocalPos.z * 6.0 + uTime * (1.2 + uCarSpeed * 0.10)))) * 0.52, 0.0, 1.0);
            float wipeAng = sin(uTime * 3.8) * 0.65;
            float wx = vLocalPos.x - 0.04, wz = vLocalPos.z + 1.42;
            float rW = length(vec2(wx, wz));
            float angW = atan(wx, max(wz, 0.01));
            float wiped = smoothstep(0.42, 0.34, rW) * smoothstep(0.28, 0.06, abs(angW - wipeAng));
            streak *= (1.0 - wiped * 0.85);
            N = normalize(N + vec3(flowG.x * 0.40 + streak * 0.08, 0.0, flowG.y * 0.36) * (1.0 - wiped * 0.85));
            albedo = vec3(0.025, 0.048, 0.065);
            rough = mix(0.03, 0.12, streak); metal = 0.08; clearcoat = 0.98;
          } else if (mid == 2) {
            // Woven motorsport carbon-fiber twill micro-pattern on wing, diffuser, splitter & trim
            float cx = floor(vLocalPos.x * 85.0 + vLocalPos.z * 85.0);
            float cy = floor(vLocalPos.y * 85.0 - vLocalPos.z * 85.0);
            float weave = mod(cx + cy, 2.0);
            albedo = mix(vec3(0.036, 0.040, 0.046), vec3(0.072, 0.078, 0.086), weave * 0.65);
            rough = mix(0.28, 0.42, weave); metal = 0.14; clearcoat = 0.48;
          } else if (mid == 3) {
            // Dark carbon-teal roof scoops with subtle rally orange center stripe (NO bright white blowout!)
            float stripe = step(abs(vLocalPos.x), 0.11);
            albedo = mix(vec3(0.08, 0.14, 0.16), vec3(0.76, 0.32, 0.07), stripe * 0.65);
            rough = 0.20; clearcoat = 0.88;
          } else if (mid == 4) {
            // Crisp vivid crimson-red LED rally taillights (1:1 车2.jpg & ref_05..08!)
            albedo = vec3(0.55, 0.04, 0.02);
            float bMul = 1.0 + uBrakeGlow * 0.85;
            emissive = vec3(2.35, 0.16, 0.06) * bMul;
            rough = 0.06;
          } else if (mid == 5) {
            // Iconic reference-video rally lime-cyan lower bumper LED accent & inner marker strip
            albedo = vec3(0.24, 0.62, 0.36);
            emissive = vec3(0.42, 1.15, 0.58);
            rough = 0.10;
          } else if (mid == 6) {
            albedo = vec3(0.82, 0.80, 0.72);
            emissive = vec3(3.0, 2.8, 2.3);
            rough = 0.10;
          } else if (mid == 7) {
            // Heat-blued titanium motorsport exhaust tips (subtle violet-amber thermal gradient at tip!)
            float tipHeat = smoothstep(-1.92, -2.14, vLocalPos.z);
            albedo = mix(vec3(0.26, 0.26, 0.25), vec3(0.22, 0.26, 0.52), tipHeat * 0.75);
            rough = mix(0.32, 0.18, tipHeat); metal = 0.88; clearcoat = 0.45;
            if (uBackfire > 0.02 && vLocalPos.z < -2.05) {
              emissive = vec3(3.4, 1.45, 0.35) * uBackfire;
            }
          } else if (mid == 8) {
            albedo = texture(uRearPlate, vUv).rgb;
            rough = 0.40; clearcoat = 0.34;
          } else if (mid == 9) {
            // Racing-red brake calipers, glowing hot rotors under braking & interior roll-cage cross-brace
            albedo = vec3(0.76, 0.09, 0.05);
            if (vLocalPos.y < 0.55) emissive = vec3(1.4, 0.28, 0.04) * clamp(uBrakeGlow, 0.0, 1.0);
            rough = 0.28; metal = 0.22; clearcoat = 0.65;
          } else if (mid == 10) {
            // Rugged dark gunmetal/bronze gravel rally wheel rim (matches image_4db787.png!)
            albedo = vec3(0.24, 0.22, 0.19);
            rough = 0.42; metal = 0.58; clearcoat = 0.35;
          } else if (mid == 11) {
            // Matte white-silver twin RALLY roof air-scoops (matches image_4db787.png TOP/SIDE view!)
            albedo = vec3(0.82, 0.84, 0.85);
            rough = 0.36; metal = 0.08; clearcoat = 0.45;
          } else if (mid == 12) {
            // Live Digital RALLY Rally Dashboard Cluster (RPM bar, KM/H, Gear, Boost)
            vec3 dCol = texture(uDashTex, vUv).rgb;
            albedo = dCol * 0.25;
            emissive = dCol * 1.45;
            rough = 0.14;
          }

          float shadowVal = mix(0.68, 1.0, sampleShadowPCF(vWorldPos, N));
          vec3 col = evalPBR(vWorldPos, N, V, albedo, rough, metal, 0.98, clearcoat, shadowVal);

          // Controlled cool sky-bounce & Fresnel reflection (preserves deep saturated teal/orange paint without white blowout!)
          if (mid == 0 || mid == 3 || mid == 8) {
            float skyLift = 0.25 + 0.35 * max(N.y, 0.0);
            col += albedo * vec3(0.12, 0.17, 0.21) * skyLift;
            float fresPaint = 0.04 + 0.42 * pow(1.0 - max(dot(N, V), 0.0), 3.2);
            col += sampleRainyIBL(reflect(-V, N), rough * 0.45) * fresPaint * clearcoat * 0.30;
          }
          // Crisp wet clearcoat highlight band + glistening raindrop bead glints on sculpted fenders, hood & roof
          if (mid == 0 || mid == 3) {
            vec3 H = normalize(uLightDir + V);
            float ndh = max(dot(N, H), 0.0);
            float specBand = smoothstep(0.91, 0.985, ndh) * (1.0 - rough) * 0.52;
            float beadGlint = pow(ndh, 84.0) * clearcoat * 0.72 + pow(ndh, 18.0) * clearcoat * 0.10;
            col += vec3(0.90, 0.96, 1.0) * (specBand + beadGlint) * shadowVal;
          }
          float outAlpha = 1.0;
          if (mid == 1) {
            float fres = 0.18 + 0.68 * pow(1.0 - max(dot(N, V), 0.0), 2.6);
            vec3 H = normalize(uLightDir + V);
            float dropGlint = pow(max(dot(N, H), 0.0), 64.0) * 0.85;
            col = mix(col, sampleRainyIBL(reflect(-V, N), 0.04) * 0.82, fres) + vec3(0.90, 0.96, 1.0) * dropGlint;
            outAlpha = mix(clamp(0.36 + fres * 0.46 + dropGlint * 0.25, 0.34, 0.86), 0.11, clamp(uCockpit, 0.0, 1.0));
          }
          col += emissive;
          col = applyFog(col, vWorldPos);
          fragColor = vec4(col, outAlpha);
        }
      `);

      this.aoProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=2) in vec2 aUv;
        uniform mat4 uViewProj;
        uniform mat4 uModel;
        out vec2 vUv;
        void main() { vUv = aUv; gl_Position = uViewProj * uModel * vec4(aPos, 1.0); }
      `, `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        void main() {
          vec2 d = (vUv - 0.5) * 2.0;
          // Deep grounded chassis contact shadow + 4-wheel anchor shadow cores (eliminates floating 100%!)
          float rCore = length(vec2(d.x * 1.18, d.y * 0.98));
          float rSoft = length(vec2((d.x - 0.06) * 0.92, (d.y + 0.06) * 0.82));
          float core = smoothstep(0.88, 0.34, rCore) * 0.88;
          float penumbra = smoothstep(1.00, 0.18, rSoft) * 0.56;
          // 4 tight wheel-to-ground contact shadow spots
          float wFL = smoothstep(0.32, 0.08, length((d - vec2(-0.50,  0.42)) * vec2(1.4, 1.1)));
          float wFR = smoothstep(0.32, 0.08, length((d - vec2( 0.50,  0.42)) * vec2(1.4, 1.1)));
          float wRL = smoothstep(0.34, 0.08, length((d - vec2(-0.52, -0.38)) * vec2(1.4, 1.1)));
          float wRR = smoothstep(0.34, 0.08, length((d - vec2( 0.52, -0.38)) * vec2(1.4, 1.1)));
          float wheels = clamp(wFL + wFR + wRL + wRR, 0.0, 1.0) * 0.92;
          float alpha = clamp(max(max(core, penumbra), wheels), 0.0, 0.94);
          fragColor = vec4(0.015, 0.022, 0.035, alpha);
        }
      `);
    }

    reset() {
      this.s = 38.0; this.lat = 0.0; this.speed = 35.2;
      this.latVel = 0.0; this.yawRate = 0.0; this.slipAngle = 0.0;
      this.driftAngle = 0.0; this.steerInput = 0.0; this.wheelSpin = 0.0;
      this.bodyRoll = 0.0; this.bodyRollVel = 0.0;
      this.bodyPitch = 0.0; this.bodyPitchVel = 0.0;
      this.suspBounce = 0.0; this.suspVel = 0.0;
      this.wheelJounce = [0, 0, 0, 0]; this.wheelJounceVel = [0, 0, 0, 0];
      this.weightShift = 0.0; this.gripFactor = 0.85; this.isBraking = false;
      this.brakeGlow = 0.0; this.backfireTimer = 0.0;
      this.pos = [0, 0, 0]; this.yaw = 0; this.pitch = 0; this.bank = 0;
      this.fwd = [0, 0, 1]; this.right = [-1, 0, 0];
      this.boost = 100.0; this.boosting = false;
      this.gameMode = this.gameMode || 'stage';
      this.boost = this.gameMode === 'cruise' ? 100.0 : 45.0;
      this.driftScore = 0; this.driftCombo = 1.0; this.driftBank = 0;
      this.lastBankedPts = 0; this.wallHitEvent = false; this.lostBankPts = 0;
      this.checkpointEvent = false; this.roadCurv = 0; this._driftGrace = 0;
      this.checkpoints = 0; this.nextCheckpointS = 400.0;
      this.inPuddle = false; this.puddleIntensity = 0.0;
      this.driftHoldTimer = 0.0; this.autoDemo = true;
      this.prevThrottle = 0.0; this.backfireEvent = false;
      this.perfectDriftEvent = false; this.checkpointWarned = false;
    }

    step(dt, input, track) {
      const clampedDt = Math.min(0.05, Math.max(0.001, dt));
      const sp = track.sampleAtS(this.s);
      if (!sp) return;
      this.backfireEvent = false;
      this.perfectDriftEvent = false;

      const userActive = Math.abs(input.steer) > 0.05 || input.throttle > 0.05 || input.brake > 0.05 || input.handbrake || input.boost;
      if (userActive) this.autoDemo = false;

      let throttle = input.throttle, brake = input.brake, steer = input.steer, handbrake = input.handbrake, wantBoost = input.boost;

      if (this.autoDemo) {
        const spAhead = track.sampleAtS(this.s + 18.0);
        let dyaw = spAhead ? (spAhead.yaw - sp.yaw) : 0;
        while (dyaw > Math.PI) dyaw -= Math.PI * 2;
        while (dyaw < -Math.PI) dyaw += Math.PI * 2;
        steer = Math.max(-0.85, Math.min(0.85, -dyaw * 2.5 - this.lat * 0.25));
        throttle = this.speed < 36.2 ? 0.90 : 0.55;
        handbrake = Math.abs(dyaw) > 0.16;
      }

      if (this.driftHoldTimer > 0) {
        this.driftHoldTimer = Math.max(0, this.driftHoldTimer - clampedDt);
        handbrake = true; steer = -0.85; throttle = 0.92;
      }

      if (this.prevThrottle > 0.6 && throttle < 0.2 && this.speed > 22) this.backfireEvent = true;
      this.prevThrottle = throttle;
      this.isBraking = brake > 0.12 || handbrake;
      this.brakeGlow += ((this.isBraking ? 1.0 : 0.0) - this.brakeGlow) * Math.min(1, clampedDt * 12.0);
      if (this.backfireEvent) this.backfireTimer = 0.16;
      else this.backfireTimer = Math.max(0, this.backfireTimer - clampedDt);

      // 1. Realistic Steering Actuator Latency + Speed-Sensitive Lock
      const steerResp = Math.abs(steer) > Math.abs(this.steerInput) ? 6.8 : 9.8;
      this.steerInput += (steer - this.steerInput) * Math.min(1, clampedDt * steerResp);
      const speedSteerScale = 1.0 / (1.0 + this.speed * 0.016);

      // Boost Economy: Stage mode rewards skill driving with boost; Free Cruise stays unlimited
      if (this.gameMode === 'cruise') {
        this.boost = 100.0;
        this.boosting = !!wantBoost;
      } else {
        if (wantBoost && this.boost > 2.0) {
          this.boosting = true;
          this.boost = Math.max(0.0, this.boost - 28.0 * clampedDt);
        } else {
          this.boosting = false;
          if (!this.isBraking && this.speed > 18.0) {
            this.boost = Math.min(100.0, this.boost + 1.8 * clampedDt);
          }
        }
      }

      // 2. Biome-Specific Surface Grip & Hydroplaning / Mud Shoulder Detection
      const segWet = sp.seg ? sp.seg.wet : 0.44;
      const tId = sp.seg ? (sp.seg.themeId || 0) : 0;
      const biomeGrip = (tId === 1) ? 0.78 : (tId === 4 ? 0.87 : (tId === 5 ? 0.95 : 0.90));
      const onShoulder = Math.abs(this.lat) > (PV.TRACK_CFG.ROAD_HALF_W - 1.45);
      const puddleDrag = this.inPuddle ? (2.8 * this.puddleIntensity * (this.speed / 30.0)) : 0.0;
      const shoulderDrag = onShoulder ? (4.2 * (this.speed / 28.0)) : 0.0;
      const surfaceGrip = biomeGrip * (1.0 - segWet * 0.24) * (this.inPuddle ? 0.74 : 1.0) * (onShoulder ? 0.64 : 1.0);
      this.gripFactor = surfaceGrip;

      // 3. Longitudinal Dynamics + Real Rally Grade Gravity + Weight Transfer (Braking -> Nose Dive; Throttle -> Rear Squat)
      const maxSpeed = this.boosting ? 56.0 : 40.5;
      const driftScrub = Math.abs(this.driftAngle) * 5.2 * (this.speed / 30.0);
      const gradeGravity = -9.81 * Math.sin(sp.pitch || 0) * 0.62;
      const accel = (throttle * (this.boosting ? 24.5 : 16.8) * (0.72 + 0.28 * surfaceGrip))
                  - brake * (21.5 * (0.65 + 0.35 * surfaceGrip))
                  - (handbrake ? 3.8 : 0.0)
                  - puddleDrag - shoulderDrag - driftScrub + gradeGravity;
      const aeroDrag = 0.0072 * this.speed * this.speed + 1.05;
      const longAccel = accel - aeroDrag * 0.25;
      this.speed += longAccel * clampedDt;
      if (this.autoDemo) {
        const demoTarget = Math.max(29.0, Math.min(41.5, 35.5 - Math.sin(sp.pitch || 0) * 24.0));
        this.speed += (demoTarget - this.speed) * clampedDt * 2.2;
      } else {
        this.speed = Math.max(0, Math.min(maxSpeed, this.speed));
      }

      // Longitudinal weight shift: +1 = heavy front load (braking), -1 = heavy rear squat (hard accel)
      const targetShift = Math.max(-1.0, Math.min(1.0, (brake * 1.15 + (handbrake ? 0.35 : 0.0) - throttle * 0.85 - Math.sin(sp.pitch || 0) * 0.85)));
      this.weightShift += (targetShift - this.weightShift) * Math.min(1, clampedDt * 7.2);

      const lookStep = Math.max(4.0, this.speed * 0.25);
      const spNext = track.sampleAtS(this.s + lookStep);
      let roadCurv = 0, dPitchDs = 0;
      if (spNext) {
        let dy = spNext.yaw - sp.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        roadCurv = dy / lookStep;
        dPitchDs = ((spNext.pitch || 0) - (sp.pitch || 0)) / lookStep;
      }
      // Vertical crest / dip G-load (negative on camelback crest -> suspension unloads; positive in valley dip -> compresses!)
      const crestG = Math.max(-1.4, Math.min(1.4, dPitchDs * this.speed * this.speed * 0.022));
      this.crestG = crestG;
      this.roadCurv = roadCurv;

      // 4. Slip-Angle, Trail-Brake Weight Transfer & Counter-Steer Stabilized Rally Drift Physics
      const spdNorm = Math.min(1.0, this.speed / 15.0);
      const frontBite = 1.0 + Math.max(0, this.weightShift) * 0.38;
      const isCounterSteer = Math.abs(this.driftAngle) > 0.14 && (this.steerInput * this.driftAngle < -0.02);
      const rearGrip = surfaceGrip * (handbrake ? 0.38 : (isCounterSteer ? 0.96 : (1.0 - throttle * 0.18)));
      const hydroTug = this.inPuddle ? Math.sin(this.s * 0.75) * 0.09 * this.puddleIntensity * spdNorm : 0.0;
      const yawGain = handbrake ? 2.55 : (isCounterSteer ? 1.12 : 1.56);
      const desiredYawRate = (-this.steerInput * speedSteerScale * yawGain * frontBite + hydroTug) * spdNorm;
      const yawStiff = handbrake ? 4.2 : (isCounterSteer ? 7.6 : (6.0 * (0.65 + 0.35 * rearGrip)));
      this.yawRate += (desiredYawRate - this.yawRate) * Math.min(1, clampedDt * yawStiff);
      const snowSlide = (tId === 1) ? 1.15 : 1.0;
      const targetDrift = Math.max(-0.64, Math.min(0.64, this.yawRate * (handbrake ? 0.34 : 0.23) * snowSlide / Math.max(0.42, rearGrip)));
      const driftRate = handbrake ? 4.6 : (isCounterSteer ? 3.2 : 5.4);
      this.driftAngle += (targetDrift - this.driftAngle) * Math.min(1, clampedDt * driftRate);
      this.slipAngle = this.driftAngle;

      // 5. Lateral Velocity & Centrifugal Cornering Inertia
      if (this.autoDemo) {
        const targetLat = Math.max(-1.6, Math.min(1.6, -roadCurv * 65.0));
        this.lat += (targetLat - this.lat) * Math.min(1, clampedDt * 3.2);
        this.latVel = (targetLat - this.lat) * 2.4;
      } else {
        const centrifugal = roadCurv * this.speed * this.speed * 0.024;
        const steerLatForce = this.steerInput * speedSteerScale * 13.8 * frontBite * spdNorm;
        const latGripDamp = (3.4 + 3.2 * surfaceGrip) * (handbrake ? 0.58 : 1.0);
        const latAcc = (steerLatForce + centrifugal) * (0.55 + 0.45 * surfaceGrip) - this.latVel * latGripDamp;
        this.latVel += latAcc * clampedDt;
        this.latVel = Math.max(-12.5, Math.min(12.5, this.latVel));
        this.lat += this.latVel * clampedDt;
      }

      // Strict Yaw-Rotated OBB Collision Clamp (AC-2: guarantees ZERO clipping into bridge trusses, guardrails, or hillsides at any drift angle!)
      const absDriftObb = Math.abs(this.driftAngle);
      const obbHalfLat = 1.14 * Math.cos(absDriftObb) + 2.24 * Math.sin(absDriftObb);
      const isBridgeSeg = sp.seg && sp.seg.surfMode === 1;
      const isTunnelSeg = sp.seg && sp.seg.surfMode === 2;
      const wallClearance = isBridgeSeg ? (PV.TRACK_CFG.ROAD_HALF_W + 0.50)
                          : isTunnelSeg ? (PV.TRACK_CFG.ROAD_HALF_W + 0.56)
                          : (PV.TRACK_CFG.ROAD_HALF_W + 0.42);
      const maxLat = Math.max(2.0, wallClearance - obbHalfLat - 0.14);
      this.maxLatAllowed = maxLat;
      this.obbHalfLat = obbHalfLat;
      if (Math.abs(this.lat) > maxLat) {
        const pen = Math.abs(this.lat) - maxLat;
        this.lat = Math.sign(this.lat) * maxLat;
        this.latVel = -Math.sign(this.lat) * Math.min(3.0, Math.abs(this.latVel) * 0.35 + pen * 4.0);
        this.suspVel += 1.2; // Chassis embankment impact jolt
        this.speed = Math.max(14.0, this.speed * (1.0 - 0.55 * clampedDt));
        if (pen > 0.04 || Math.abs(this.latVel) > 1.8) {
          this.wallHitEvent = true;
          this.lostBankPts = Math.round(this.driftBank * this.driftCombo);
        }
        this.driftCombo = 1.0; this.driftBank = 0; this._driftGrace = 0;
      }

      this.s += this.speed * Math.cos(this.driftAngle * 0.65) * clampedDt;

      if (this.s >= this.nextCheckpointS) {
        this.checkpoints++; this.nextCheckpointS += 400.0;
        this.checkpointEvent = true;
        this.checkpointWarned = false;
      }

      const absDrift = Math.abs(this.driftAngle);
      if (absDrift > 0.14 && this.speed > 14.0) {
        const pts = absDrift * this.speed * 5.2 * clampedDt;
        const prevBank = this.driftBank;
        this.driftBank += pts;
        this._driftGrace = 0.45;
        if (prevBank < 450 && this.driftBank >= 450) this.perfectDriftEvent = true;
        this.driftCombo = Math.min(5.0, this.driftCombo + clampedDt * 0.42);
        this.boost = Math.min(100.0, this.boost + absDrift * clampedDt * 18.0);
      } else {
        if (this._driftGrace > 0) {
          this._driftGrace -= clampedDt;
        } else if (this.driftBank >= 35) {
          const banked = Math.round(this.driftBank * this.driftCombo);
          this.driftScore += banked;
          this.lastBankedPts = banked;
          this.driftBank = 0;
        } else {
          this.driftBank = 0;
          this.driftCombo = Math.max(1.0, this.driftCombo - clampedDt * 0.55);
        }
      }

      const spNow = track.sampleAtS(this.s);
      if (!spNow) return;
      const bankY = Math.sin(spNow.bank) * this.lat;
      // True 4-Wheel Exact Road Surface Grounding (ZERO tire sinking into mud/puddles or unintended launching!)
      const halfWB = 1.32, halfTW = 0.88;
      const cDrift = Math.cos(this.driftAngle), sDrift = Math.sin(this.driftAngle);
      const sampleW = (lx, lz) => {
        const ds = lz * cDrift - lx * sDrift;
        const dLat = lx * cDrift + lz * sDrift;
        return track.sampleRoadSurfaceY ? track.sampleRoadSurfaceY(this.s + ds, this.lat + dLat) : (spNow.pos[1] + bankY);
      };
      const yFL = sampleW(-halfTW,  halfWB), yFR = sampleW(halfTW,  halfWB);
      const yRL = sampleW(-halfTW, -halfWB), yRR = sampleW(halfTW, -halfWB);
      const yWheelAvg = 0.25 * (yFL + yFR + yRL + yRR);
      const yCenterRoad = track.sampleRoadSurfaceY ? track.sampleRoadSurfaceY(this.s, this.lat) : (spNow.pos[1] + bankY);
      const groundedY = Math.max(yWheelAvg, yCenterRoad) + 0.022;
      const roadPitch = Math.atan2(((yFL + yFR) - (yRL + yRR)) * 0.5, halfWB * 2.0);
      const roadRoll  = Math.atan2(((yFR + yRR) - (yFL + yRL)) * 0.5, halfTW * 2.0);

      this.pos[0] = spNow.pos[0] + spNow.right[0] * this.lat;
      this.pos[1] = groundedY;
      this.pos[2] = spNow.pos[2] + spNow.right[2] * this.lat;
      this.yaw = spNow.yaw + this.driftAngle;
      this.pitch = spNow.pitch * 0.55 + roadPitch * 0.45;
      this.bank  = spNow.bank  * 0.55 + roadRoll  * 0.45;

      // 6. Spring-Damper Body Roll, Weight-Transfer Pitch & 4-Wheel Independent Suspension Jounce
      const targetRoll = Math.max(-0.072, Math.min(0.072, (this.driftAngle * 0.14 + this.latVel * 0.009) * Math.min(1.0, this.speed / 14.0)));
      const rollAcc = 78.0 * (targetRoll - this.bodyRoll) - 11.5 * this.bodyRollVel;
      this.bodyRollVel += rollAcc * clampedDt;
      this.bodyRoll += this.bodyRollVel * clampedDt;
      this.bodyRoll = Math.max(-0.085, Math.min(0.085, this.bodyRoll));

      const targetPitch = Math.max(-0.045, Math.min(0.045, this.weightShift * 0.036 - (this.crestG || 0) * 0.022));
      const pitchAcc = 68.0 * (targetPitch - this.bodyPitch) - 10.5 * this.bodyPitchVel;
      this.bodyPitchVel += pitchAcc * clampedDt;
      this.bodyPitch += this.bodyPitchVel * clampedDt;
      this.bodyPitch = Math.max(-0.055, Math.min(0.055, this.bodyPitch));

      const crestLift = Math.max(-0.025, Math.min(0.055, -(this.crestG || 0) * 0.045));
      const roadBump = crestLift + (Math.sin(this.s * 1.85) * 0.012 + Math.sin(this.s * 4.7 + this.lat * 2.1) * 0.007) * Math.min(1.0, this.speed / 18.0) * (onShoulder ? 1.5 : 1.0);
      const suspAcc = 86.0 * (roadBump - this.suspBounce) - 12.2 * this.suspVel;
      this.suspVel += suspAcc * clampedDt;
      this.suspBounce += this.suspVel * clampedDt;
      this.suspBounce = Math.max(-0.025, Math.min(0.065, this.suspBounce));

      for (let wi = 0; wi < 4; wi++) {
        const phase = wi * 1.65 + (wi >= 2 ? 0.9 : 0.0);
        const wTarget = -crestLift * 0.45 + (Math.sin(this.s * 2.3 + phase) * 0.024 + Math.cos(this.s * 5.8 + phase) * 0.012) * Math.min(1.0, this.speed / 18.0) * (onShoulder ? 1.9 : 1.0);
        const wa = 110.0 * (wTarget - this.wheelJounce[wi]) - 15.0 * this.wheelJounceVel[wi];
        this.wheelJounceVel[wi] += wa * clampedDt;
        this.wheelJounce[wi] += this.wheelJounceVel[wi] * clampedDt;
      }
      this.gradePct = Math.round(Math.tan(this.pitch || 0) * 100);
      this.altitude = this.pos[1];
      this.wheelSpin += (this.speed / 0.375) * clampedDt;

      const rutWave = Math.sin(this.s * 0.22) * 0.5 + 0.5;
      this.inPuddle = (spNow.seg.type === 'water_crossing') || (rutWave > 0.44 && Math.abs(this.lat) < 3.8);
      this.puddleIntensity += ((this.inPuddle ? (spNow.seg.type === 'water_crossing' ? 1.0 : 0.72) : 0.22) - this.puddleIntensity) * Math.min(1, clampedDt * 6.0);

      const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
      this.fwd = [sy, Math.sin(this.pitch), cy];
      this.right = [-cy, 0, sy];
      this.rebuildMatrices();
    }

    rebuildMatrices() {
      PV.M4.fromTRS(this.modelMat, [this.pos[0], this.pos[1] + this.suspBounce, this.pos[2]], this.yaw, -this.pitch + this.bodyPitch, this.bank + this.bodyRoll, 1, 1, 1);
      PV.M4.fromTRS(this.aoMat, [this.pos[0], this.pos[1] + 0.01, this.pos[2]], this.yaw, -this.pitch, this.bank, 1, 1, 1);
    }

    getWheelWorldPos(idx) {
      const o = this.wheelOffsets[idx];
      const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
      return [
        this.pos[0] + o[0] * cy + o[2] * sy,
        this.pos[1] + 0.08,
        this.pos[2] - o[0] * sy + o[2] * cy,
      ];
    }

    drawShadow(renderer) {
      const gl = this.gl, sp = renderer.shadowProg;
      gl.useProgram(sp.prog);
      gl.uniformMatrix4fv(sp.u.uLightVP, false, renderer.lightVP);
      gl.uniformMatrix4fv(sp.u.uModel, false, this.modelMat);
      gl.bindVertexArray(this.bodyMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.bodyMesh.count, this.bodyMesh.indexType, 0);
      gl.bindVertexArray(null);
    }

    updateDashTex() {
      const ctx = this.dashCtx;
      if (!ctx) return;
      const W = 512, H = 256;
      ctx.fillStyle = '#070b10';
      ctx.fillRect(0, 0, W, H);
      const kmh = Math.round((this.speed || 0) * 3.6);
      const rpmNorm = Math.max(0.15, Math.min(1.0, (kmh % 55) / 55 * 0.55 + kmh / 160 * 0.45));
      const gear = kmh < 5 ? 'N' : String(Math.min(6, 1 + Math.floor(kmh / 32)));
      // Top LED shift bar
      for (let i = 0; i < 16; i++) {
        const on = (i / 15) <= rpmNorm;
        ctx.fillStyle = !on ? '#141d26' : (i < 10 ? '#22e67b' : (i < 13 ? '#ffaa22' : '#ff3322'));
        ctx.fillRect(28 + i * 29, 18, 22, 16);
      }
      // RPM Gauge Arc
      ctx.strokeStyle = '#1b2836'; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(130, 152, 74, Math.PI * 0.78, Math.PI * 2.22); ctx.stroke();
      ctx.strokeStyle = rpmNorm > 0.82 ? '#ff4422' : '#2ee6ff';
      ctx.beginPath(); ctx.arc(130, 152, 74, Math.PI * 0.78, Math.PI * (0.78 + 1.44 * rpmNorm)); ctx.stroke();
      // Gear Box
      ctx.fillStyle = '#f29b38'; ctx.font = 'bold 74px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(gear, 130, 178);
      // Digital Speed
      ctx.fillStyle = '#eef8ff'; ctx.font = 'bold 84px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(String(kmh), 462, 162);
      ctx.fillStyle = '#6ec8e8'; ctx.font = 'bold 24px sans-serif';
      ctx.fillText('KM/H', 462, 198);
      ctx.fillStyle = this.boosting ? '#ff5522' : '#22e67b'; ctx.textAlign = 'left';
      ctx.fillText(this.boosting ? 'BOOST ACTIVE' : 'WET • AWD', 240, 224);
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.dashTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.dashCanvas);
    }

    draw(renderer, time, inCockpit, sectorCount) {
      const gl = this.gl;
      if (!inCockpit && !this._dashInit) {
        this.updateDashTex();
        this._dashInit = true;
      }
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.depthMask(false); gl.disable(gl.CULL_FACE);
      gl.useProgram(this.aoProg.prog);
      gl.uniformMatrix4fv(this.aoProg.u.uViewProj, false, renderer.vpMat);
      gl.uniformMatrix4fv(this.aoProg.u.uModel, false, this.aoMat);
      gl.bindVertexArray(this.aoMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.aoMesh.count, this.aoMesh.indexType, 0);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(true); gl.disable(gl.BLEND);

      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      const cp = this.carProg;
      gl.useProgram(cp.prog);
      gl.uniformMatrix4fv(cp.u.uViewProj, false, renderer.vpMat);
      gl.uniformMatrix4fv(cp.u.uModel, false, this.modelMat);
      renderer.bindSharedPBRUniforms(cp.u, time);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.car.albedo);    gl.uniform1i(cp.u.uCarAlb, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex.car.rma);       gl.uniform1i(cp.u.uCarRma, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.tex.car.rearPlate); gl.uniform1i(cp.u.uRearPlate, 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.dashTex);           gl.uniform1i(cp.u.uDashTex, 3);
      if (cp.u.uBrakeGlow) gl.uniform1f(cp.u.uBrakeGlow, this.brakeGlow || 0.0);
      if (cp.u.uBackfire)  gl.uniform1f(cp.u.uBackfire, Math.min(1.0, (this.backfireTimer || 0.0) * 6.5));
      if (cp.u.uCarSpeed)  gl.uniform1f(cp.u.uCarSpeed, this.speed || 0.0);
      if (cp.u.uCockpit)   gl.uniform1f(cp.u.uCockpit, inCockpit ? 1.0 : 0.0);
      gl.bindVertexArray(this.bodyMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.bodyMesh.count, this.bodyMesh.indexType, 0);

      if (!inCockpit) {
        // Chase camera: render lightweight cabin interior & steering wheel visible through rear/side glass
        if (this.chaseInteriorMesh) {
          gl.bindVertexArray(this.chaseInteriorMesh.vao);
          gl.drawElements(gl.TRIANGLES, this.chaseInteriorMesh.count, this.chaseInteriorMesh.indexType, 0);
        }
        if (this.steerWheelMesh) {
          const localSW = this._tmpMat;
          const wheelAngle = (this.steerInput || 0) * 1.55;
          PV.M4.fromTRS(localSW, [-0.34, 0.96, 0.14], 0, -0.22, wheelAngle, 0.92, 0.92, 0.92);
          PV.M4.multiply(this.steerWheelMat, this.modelMat, localSW);
          gl.uniformMatrix4fv(cp.u.uModel, false, this.steerWheelMat);
          gl.bindVertexArray(this.steerWheelMesh.vao);
          gl.drawElements(gl.TRIANGLES, this.steerWheelMesh.count, this.steerWheelMesh.indexType, 0);
        }
      }

      // Transparent wet-reflective windshield, side & rear fastback glass pass (chase-only; CockpitV4 renders precision cabin glass in 1st-person!)
      if (!inCockpit && this.glassMesh && this.glassMesh.count > 0) {
        gl.uniformMatrix4fv(cp.u.uModel, false, this.modelMat);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        gl.depthMask(false);
        gl.disable(gl.CULL_FACE);
        gl.bindVertexArray(this.glassMesh.vao);
        gl.drawElements(gl.TRIANGLES, this.glassMesh.count, this.glassMesh.indexType, 0);
        gl.enable(gl.CULL_FACE);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }

      // Weather-adaptive rear & twin front windshield wipers (fast in downpour, gentle in drizzle, cleanly parked in clear sun!)
      if (this.wiperMesh) {
        const localWip = this._tmpMat;
        const rainDens = (PV.LIGHT && PV.LIGHT.rainDensity) ? PV.LIGHT.rainDensity : 0.0;
        const wipeFreq = rainDens > 0.55 ? 5.8 : 3.6;
        const wipeRoll = rainDens > 0.15 ? (0.25 + Math.sin(time * wipeFreq) * 0.65) : 0.12;
        PV.M4.fromTRS(localWip, [-0.14, 0.99, -1.43], 0, -0.44, wipeRoll, 1, 1, 1);
        PV.M4.multiply(this.wiperMat, this.modelMat, localWip);
        gl.uniformMatrix4fv(cp.u.uModel, false, this.wiperMat);
        gl.bindVertexArray(this.wiperMesh.vao);
        gl.drawElements(gl.TRIANGLES, this.wiperMesh.count, this.wiperMesh.indexType, 0);
        const frontSweep = rainDens > 0.15 ? (0.12 + (0.5 + 0.5 * Math.sin(time * (wipeFreq + 0.4))) * 1.12) : 0.015;
        for (const wx of [-0.52, 0.06]) {
          PV.M4.fromTRS(localWip, [wx, 0.935, 0.54], 0, 0.58, frontSweep, 1.12, 1.0, 1.0);
          PV.M4.multiply(this.wiperMat, this.modelMat, localWip);
          gl.uniformMatrix4fv(cp.u.uModel, false, this.wiperMat);
          gl.drawElements(gl.TRIANGLES, this.wiperMesh.count, this.wiperMesh.indexType, 0);
        }
      }

      gl.bindVertexArray(this.wheelMesh.vao);
      const localW = this._tmpMat;
      const frontSteer = this.steerInput * 0.36 - this.driftAngle * 0.72;
      for (let i = 0; i < 4; i++) {
        const o = this.wheelOffsets[i];
        const wYaw = o[3] ? frontSteer : 0.0;
        const jounce = this.wheelJounce ? this.wheelJounce[i] : 0.0;
        PV.M4.fromTRS(localW, [o[0], o[1] + jounce, o[2]], wYaw, this.wheelSpin, 0, 1, 1, 1);
        PV.M4.multiply(this.wheelMat, this.modelMat, localW);
        gl.uniformMatrix4fv(cp.u.uModel, false, this.wheelMat);
        gl.drawElements(gl.TRIANGLES, this.wheelMesh.count, this.wheelMesh.indexType, 0);
      }
      gl.bindVertexArray(null);

      // First-Person Cockpit View: render full high-detail V4 RALLY Rally Cockpit (zero clipping, live telemetry!)
      if (inCockpit && this.cockpitV4) {
        this.cockpitV4.draw(renderer, this, time, sectorCount);
      }
    }
  };
})(window);

