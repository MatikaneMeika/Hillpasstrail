// === cockpit_v4.js ===
// Zero-dependency Native WebGL2 Port of High-Detail 1st-Person RALLY Rally Cockpit
// Exact 1:1 metric geometry (sculpted flocked dashboard, arched binnacle, live 1024x512 digital telemetry LCD,
// APEX-R carbon-fiber steering wheel with 8 backlit rally buttons & 3 rotary encoders + mini OLED,
// carbon center switch panel with toggle switches/LEDs/52mm boost gauge/guarded START switch,
// co-driver STAGE-NAV R22 rally tablet, sequential shifter, hydraulic handbrake, STAGE blue roll cage with foam/decals,
// carbon doors with red pull straps & polycarbonate slider window, wide-angle carbon mirror, drilled pedals & STAGE fire bottle).
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});

  // Exact V4 COCKPIT coordinate constants (V4 space: -Z forward, -X left/driver, +Y up)
  const C = {
    widthHalf: 0.68,
    beltY: 0.66,
    roofY: 1.16,
    roofHalfW: 0.51,
    firewallZ: -0.95,
    driverX: -0.34,
    coDriverX: 0.34,
    wheelCenter: [-0.34, 0.665, -0.15],
    wheelTiltX: -0.25,
    wheelRadius: 0.160,
    dashDisplay: [-0.34, 0.728, -0.425],
    tunnelTopY: 0.245,
    shifterPos: [0.015, 0.245, -0.17],
    handbrakePos: [0.105, 0.245, -0.06],
    tabletPos: [0.285, 0.585, -0.355],
    cageMainR: 0.023,
    cageSubR: 0.019,
  };

  // Rigid 180-deg Y-rotation alignment from V4 (-Z fwd, -X left) into N2 (+Z fwd, +X left)
  PV.COCKPIT_V4_ALIGN = { yOff: 0.21, zOff: -0.14 };

  // Lightweight zero-dependency Mesh Builder (Euler XYZ transform stack + primitives)
  class GeoBuilder {
    constructor() {
      this.pos = []; this.nrm = []; this.uv = []; this.col = []; this.idx = [];
    }
    _xformPt(p, t, r) {
      let x = p[0], y = p[1], z = p[2];
      if (r) {
        if (r[0]) { const c = Math.cos(r[0]), s = Math.sin(r[0]); const ny = y * c - z * s, nz = y * s + z * c; y = ny; z = nz; }
        if (r[1]) { const c = Math.cos(r[1]), s = Math.sin(r[1]); const nx = x * c + z * s, nz = -x * s + z * c; x = nx; z = nz; }
        if (r[2]) { const c = Math.cos(r[2]), s = Math.sin(r[2]); const nx = x * c - y * s, ny = x * s + y * c; x = nx; y = ny; }
      }
      return t ? [x + t[0], y + t[1], z + t[2]] : [x, y, z];
    }
    _xformNrm(n, r) {
      let x = n[0], y = n[1], z = n[2];
      if (r) {
        if (r[0]) { const c = Math.cos(r[0]), s = Math.sin(r[0]); const ny = y * c - z * s, nz = y * s + z * c; y = ny; z = nz; }
        if (r[1]) { const c = Math.cos(r[1]), s = Math.sin(r[1]); const nx = x * c + z * s, nz = -x * s + z * c; x = nx; z = nz; }
        if (r[2]) { const c = Math.cos(r[2]), s = Math.sin(r[2]); const nx = x * c - y * s, ny = x * s + y * c; x = nx; y = ny; }
      }
      const l = Math.hypot(x, y, z) || 1;
      return [x / l, y / l, z / l];
    }
    addBox(sx, sy, sz, pos, rot, matId, extra = 0) {
      const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
      const faces = [
        { n: [0, 0, 1],  v: [[-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz]],   u: [[0,0],[sx,0],[sx,sy],[0,sy]] },
        { n: [0, 0, -1], v: [[hx,-hy,-hz],[-hx,-hy,-hz],[-hx,hy,-hz],[hx,hy,-hz]], u: [[0,0],[sx,0],[sx,sy],[0,sy]] },
        { n: [1, 0, 0],  v: [[hx,-hy,hz],[hx,-hy,-hz],[hx,hy,-hz],[hx,hy,hz]],   u: [[0,0],[sz,0],[sz,sy],[0,sy]] },
        { n: [-1, 0, 0], v: [[-hx,-hy,-hz],[-hx,-hy,hz],[-hx,hy,hz],[-hx,hy,-hz]], u: [[0,0],[sz,0],[sz,sy],[0,sy]] },
        { n: [0, 1, 0],  v: [[-hx,hy,hz],[hx,hy,hz],[hx,hy,-hz],[-hx,hy,-hz]],   u: [[0,0],[sx,0],[sx,sz],[0,sz]] },
        { n: [0, -1, 0], v: [[-hx,-hy,-hz],[hx,-hy,-hz],[hx,-hy,hz],[-hx,-hy,hz]], u: [[0,0],[sx,0],[sx,sz],[0,sz]] },
      ];
      for (const f of faces) {
        const b = this.pos.length / 3;
        const fn = this._xformNrm(f.n, rot);
        for (let i = 0; i < 4; i++) {
          const p = this._xformPt(f.v[i], pos, rot);
          this.pos.push(p[0], p[1], p[2]);
          this.nrm.push(fn[0], fn[1], fn[2]);
          this.uv.push(f.u[i][0], f.u[i][1]);
          this.col.push(matId, extra, 1.0);
        }
        this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
    }
    addCylinder(rTop, rBot, h, segs, pos, rot, matId, capped = true, extra = 0) {
      const hy = h * 0.5;
      const base = this.pos.length / 3;
      const slope = (rBot - rTop) / Math.max(1e-4, h);
      for (let ring = 0; ring <= 1; ring++) {
        const y = ring === 0 ? -hy : hy;
        const r = ring === 0 ? rBot : rTop;
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          const ca = Math.cos(a), sa = Math.sin(a);
          const p = this._xformPt([ca * r, y, sa * r], pos, rot);
          const n = this._xformNrm([ca, slope, sa], rot);
          this.pos.push(p[0], p[1], p[2]);
          this.nrm.push(n[0], n[1], n[2]);
          this.uv.push(i / segs, ring);
          this.col.push(matId, extra, 1.0);
        }
      }
      const stride = segs + 1;
      for (let i = 0; i < segs; i++) {
        const a = base + i, b = base + i + stride;
        this.idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
      if (capped) {
        for (const isTop of [false, true]) {
          const r = isTop ? rTop : rBot;
          if (r <= 1e-5) continue;
          const y = isTop ? hy : -hy;
          const ny = isTop ? 1 : -1;
          const cIdx = this.pos.length / 3;
          const cp = this._xformPt([0, y, 0], pos, rot);
          const cn = this._xformNrm([0, ny, 0], rot);
          this.pos.push(cp[0], cp[1], cp[2]);
          this.nrm.push(cn[0], cn[1], cn[2]);
          this.uv.push(0.5, 0.5);
          this.col.push(matId, extra, 1.0);
          for (let i = 0; i <= segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            const p = this._xformPt([Math.cos(a) * r, y, Math.sin(a) * r], pos, rot);
            this.pos.push(p[0], p[1], p[2]);
            this.nrm.push(cn[0], cn[1], cn[2]);
            this.uv.push(0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a));
            this.col.push(matId, extra, 1.0);
          }
          for (let i = 0; i < segs; i++) {
            if (isTop) this.idx.push(cIdx, cIdx + 2 + i, cIdx + 1 + i);
            else       this.idx.push(cIdx, cIdx + 1 + i, cIdx + 2 + i);
          }
        }
      }
    }
    addBeveledTrapezoid(fWTop, fWBot, fH, bWTop, bWBot, bH, depth, chamfer, pos, rot, matId, extra = 0) {
      // Automotive industrial-design chamfered trapezoidal frustum (slanted sides, beveled corners, tapered aero shell)
      const mkOct = (wt, wb, h, ch) => {
        const ht = wt * 0.5, hb = wb * 0.5, hh = h * 0.5;
        const c = Math.min(ch, ht * 0.35, hb * 0.35, hh * 0.42);
        return [
          [-hb + c, -hh], [hb - c, -hh],
          [hb, -hh + c], [ht, hh - c],
          [ht - c, hh], [-ht + c, hh],
          [-ht, hh - c], [-hb, -hh + c],
        ];
      };
      const hz = depth * 0.5;
      const pF = mkOct(fWTop, fWBot, fH, chamfer);
      const pB = mkOct(bWTop, bWBot, bH, chamfer * 0.85);
      const n = pF.length;
      const pushFace = (pts, z, nLocal, reverse) => {
        const cIdx = this.pos.length / 3;
        const cp = this._xformPt([0, 0, z], pos, rot);
        const cn = this._xformNrm(nLocal, rot);
        this.pos.push(cp[0], cp[1], cp[2]); this.nrm.push(cn[0], cn[1], cn[2]);
        this.uv.push(0.5, 0.5); this.col.push(matId, extra, 1.0);
        for (let i = 0; i < n; i++) {
          const q = this._xformPt([pts[i][0], pts[i][1], z], pos, rot);
          this.pos.push(q[0], q[1], q[2]); this.nrm.push(cn[0], cn[1], cn[2]);
          this.uv.push(0.5 + pts[i][0] * 3.0, 0.5 + pts[i][1] * 3.0); this.col.push(matId, extra, 1.0);
        }
        for (let i = 0; i < n; i++) {
          const nxt = (i + 1) % n;
          if (!reverse) this.idx.push(cIdx, cIdx + 1 + i, cIdx + 1 + nxt);
          else          this.idx.push(cIdx, cIdx + 1 + nxt, cIdx + 1 + i);
        }
      };
      pushFace(pF, hz, [0, 0, 1], false);
      pushFace(pB, -hz, [0, 0, -1], true);
      // Slanted bevel side quads with crisp flat normals per chamfer plane
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const a = [pF[i][0], pF[i][1], hz], b = [pF[j][0], pF[j][1], hz];
        const c = [pB[j][0], pB[j][1], -hz], d = [pB[i][0], pB[i][1], -hz];
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
        const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        const wn = this._xformNrm([nx, ny, nz], rot);
        const base = this.pos.length / 3;
        const quad = [a, b, c, d];
        const uvs = [[0, 1], [1, 1], [1, 0], [0, 0]];
        for (let k = 0; k < 4; k++) {
          const wp = this._xformPt(quad[k], pos, rot);
          this.pos.push(wp[0], wp[1], wp[2]); this.nrm.push(wn[0], wn[1], wn[2]);
          this.uv.push(uvs[k][0], uvs[k][1]); this.col.push(matId, extra, 1.0);
        }
        this.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
      }
    }
    addTrapezoidQuad(wTop, wBot, h, pos, rot, u0, v0, u1, v1, extra = 0) {
      const ht = wTop * 0.5, hb = wBot * 0.5, hh = h * 0.5;
      const base = this.pos.length / 3;
      const pts = [[-hb, -hh, 0], [hb, -hh, 0], [ht, hh, 0], [-ht, hh, 0]];
      const uvs = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
      const n = this._xformNrm([0, 0, 1], rot);
      for (let i = 0; i < 4; i++) {
        const p = this._xformPt(pts[i], pos, rot);
        this.pos.push(p[0], p[1], p[2]); this.nrm.push(n[0], n[1], n[2]);
        this.uv.push(uvs[i][0], uvs[i][1]); this.col.push(0, extra, 1.0);
      }
      this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    addTorus(R, r, radSegs, tubSegs, arc, pos, rot, matId, extra = 0) {
      const base = this.pos.length / 3;
      const aSpan = arc || Math.PI * 2;
      for (let j = 0; j <= tubSegs; j++) {
        const u = (j / tubSegs) * aSpan;
        const cu = Math.cos(u), su = Math.sin(u);
        for (let i = 0; i <= radSegs; i++) {
          const v = (i / radSegs) * Math.PI * 2;
          const cv = Math.cos(v), sv = Math.sin(v);
          const px = (R + r * cv) * cu, py = (R + r * cv) * su, pz = r * sv;
          const nx = cv * cu, ny = cv * su, nz = sv;
          const p = this._xformPt([px, py, pz], pos, rot);
          const n = this._xformNrm([nx, ny, nz], rot);
          this.pos.push(p[0], p[1], p[2]);
          this.nrm.push(n[0], n[1], n[2]);
          this.uv.push(j / tubSegs, i / radSegs);
          this.col.push(matId, extra, 1.0);
        }
      }
      const stride = radSegs + 1;
      for (let j = 0; j < tubSegs; j++) {
        for (let i = 0; i < radSegs; i++) {
          const a = base + j * stride + i, b = a + stride;
          this.idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    addLathe(pts2d, segs, pos, rot, matId) {
      const base = this.pos.length / 3;
      const rings = pts2d.length;
      for (let r = 0; r < rings; r++) {
        const rad = pts2d[r][0], y = pts2d[r][1];
        const prev = pts2d[Math.max(0, r - 1)], next = pts2d[Math.min(rings - 1, r + 1)];
        const dy = next[1] - prev[1], dr = next[0] - prev[0];
        const nl = Math.hypot(dy, -dr) || 1;
        const nr = dy / nl, ny = -dr / nl;
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          const ca = Math.cos(a), sa = Math.sin(a);
          const p = this._xformPt([ca * rad, y, sa * rad], pos, rot);
          const n = this._xformNrm([ca * nr, ny, sa * nr], rot);
          this.pos.push(p[0], p[1], p[2]);
          this.nrm.push(n[0], n[1], n[2]);
          this.uv.push(i / segs, r / (rings - 1));
          this.col.push(matId, 0, 1.0);
        }
      }
      const stride = segs + 1;
      for (let r = 0; r < rings - 1; r++) {
        for (let i = 0; i < segs; i++) {
          const a = base + r * stride + i, b = a + stride;
          this.idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    // Smooth Catmull-Rom tube (roll cage bars, cables, red pull straps)
    addTubePath(ctrlPts, radius, steps, radSegs, matId, extra = 0) {
      const sampleCR = (pts, t) => {
        const n = pts.length - 1;
        const s = Math.max(0, Math.min(n - 1e-6, t * n));
        const i = Math.floor(s), f = s - i;
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[Math.min(n, i + 1)], p3 = pts[Math.min(n, i + 2)];
        const f2 = f * f, f3 = f2 * f;
        return [0, 1, 2].map((k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f3));
      };
      const path = [];
      for (let s = 0; s <= steps; s++) path.push(sampleCR(ctrlPts, s / steps));
      const base = this.pos.length / 3;
      let prevN = null;
      for (let s = 0; s <= steps; s++) {
        const p = path[s];
        const pA = path[Math.max(0, s - 1)], pB = path[Math.min(steps, s + 1)];
        let tx = pB[0] - pA[0], ty = pB[1] - pA[1], tz = pB[2] - pA[2];
        const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        let nx, ny, nz;
        if (!prevN) {
          const up = Math.abs(ty) > 0.92 ? [1, 0, 0] : [0, 1, 0];
          nx = ty * up[2] - tz * up[1]; ny = tz * up[0] - tx * up[2]; nz = tx * up[1] - ty * up[0];
        } else {
          const dot = prevN[0] * tx + prevN[1] * ty + prevN[2] * tz;
          nx = prevN[0] - tx * dot; ny = prevN[1] - ty * dot; nz = prevN[2] - tz * dot;
        }
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        prevN = [nx, ny, nz];
        const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
        for (let i = 0; i <= radSegs; i++) {
          const a = (i / radSegs) * Math.PI * 2;
          const ca = Math.cos(a), sa = Math.sin(a);
          const rx = nx * ca + bx * sa, ry = ny * ca + by * sa, rz = nz * ca + bz * sa;
          this.pos.push(p[0] + rx * radius, p[1] + ry * radius, p[2] + rz * radius);
          this.nrm.push(rx, ry, rz);
          this.uv.push(i / radSegs, s / steps);
          this.col.push(matId, extra, 1.0);
        }
      }
      const stride = radSegs + 1;
      for (let s = 0; s < steps; s++) {
        for (let i = 0; i < radSegs; i++) {
          const a = base + s * stride + i, b = a + stride;
          this.idx.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
      return path;
    }
    // Extrude a closed 2D polygon along +Z (0..depth) with flat front/back caps + perimeter bevel strips
    addExtrude2D(poly, depth, pos, rot, matId, uvScale = 1.0) {
      const n = poly.length;
      if (n < 3) return;
      // Front (+Z) & Back (0) fan caps (works cleanly for convex & star-convex shapes like dash profile & binnacle)
      let cx = 0, cy = 0;
      for (const pt of poly) { cx += pt[0]; cy += pt[1]; }
      cx /= n; cy /= n;
      // Compute signed area to ensure CCW
      let area = 0;
      for (let i = 0; i < n; i++) {
        const a = poly[i], b = poly[(i + 1) % n];
        area += a[0] * b[1] - b[0] * a[1];
      }
      const pts = area >= 0 ? poly : poly.slice().reverse();
      // Front face (z = depth, n = +Z)
      const fC = this.pos.length / 3;
      const fp0 = this._xformPt([cx, cy, depth], pos, rot);
      const fnF = this._xformNrm([0, 0, 1], rot);
      this.pos.push(fp0[0], fp0[1], fp0[2]); this.nrm.push(fnF[0], fnF[1], fnF[2]);
      this.uv.push(cx * uvScale, cy * uvScale); this.col.push(matId, 0, 1.0);
      for (let i = 0; i < n; i++) {
        const p = this._xformPt([pts[i][0], pts[i][1], depth], pos, rot);
        this.pos.push(p[0], p[1], p[2]); this.nrm.push(fnF[0], fnF[1], fnF[2]);
        this.uv.push(pts[i][0] * uvScale, pts[i][1] * uvScale); this.col.push(matId, 0, 1.0);
      }
      for (let i = 0; i < n; i++) this.idx.push(fC, fC + 1 + i, fC + 1 + ((i + 1) % n));
      // Back face (z = 0, n = -Z)
      const bC = this.pos.length / 3;
      const bp0 = this._xformPt([cx, cy, 0], pos, rot);
      const fnB = this._xformNrm([0, 0, -1], rot);
      this.pos.push(bp0[0], bp0[1], bp0[2]); this.nrm.push(fnB[0], fnB[1], fnB[2]);
      this.uv.push(cx * uvScale, cy * uvScale); this.col.push(matId, 0, 1.0);
      for (let i = 0; i < n; i++) {
        const p = this._xformPt([pts[i][0], pts[i][1], 0], pos, rot);
        this.pos.push(p[0], p[1], p[2]); this.nrm.push(fnB[0], fnB[1], fnB[2]);
        this.uv.push(pts[i][0] * uvScale, pts[i][1] * uvScale); this.col.push(matId, 0, 1.0);
      }
      for (let i = 0; i < n; i++) this.idx.push(bC, bC + 1 + ((i + 1) % n), bC + 1 + i);
      // Side walls
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const sn = this._xformNrm([dy, -dx, 0], rot);
        const sB = this.pos.length / 3;
        const q = [
          this._xformPt([a[0], a[1], depth], pos, rot),
          this._xformPt([a[0], a[1], 0], pos, rot),
          this._xformPt([b[0], b[1], 0], pos, rot),
          this._xformPt([b[0], b[1], depth], pos, rot),
        ];
        const qu = [[0, 0], [depth * uvScale, 0], [depth * uvScale, Math.hypot(dx, dy) * uvScale], [0, Math.hypot(dx, dy) * uvScale]];
        for (let k = 0; k < 4; k++) {
          this.pos.push(q[k][0], q[k][1], q[k][2]);
          this.nrm.push(sn[0], sn[1], sn[2]);
          this.uv.push(qu[k][0], qu[k][1]);
          this.col.push(matId, 0, 1.0);
        }
        this.idx.push(sB, sB + 1, sB + 2, sB, sB + 2, sB + 3);
      }
    }
    // Continuous smooth-shaded arched instrument binnacle cowl (zero sawtooth boxes!)
    addSmoothArchCowl(cx, baseY, zBack, zFront, rx, ry, thick, segs, matId) {
      const base = this.pos.length / 3;
      // 4 rings along Z: [zBack outer, zFront outer, zFront inner, zBack inner]
      // Smooth shared vertex normals along the curve!
      const ringCount = segs + 1;
      const addStrip = (pA, pB, nA, nB, uvV0, uvV1) => {
        const b = this.pos.length / 3;
        for (let i = 0; i < ringCount; i++) {
          const u = i / segs;
          this.pos.push(pA[i][0], pA[i][1], pA[i][2]);
          this.nrm.push(nA[i][0], nA[i][1], nA[i][2]);
          this.uv.push(u * 2.0, uvV0);
          this.col.push(matId, 0, 1.0);
        }
        for (let i = 0; i < ringCount; i++) {
          const u = i / segs;
          this.pos.push(pB[i][0], pB[i][1], pB[i][2]);
          this.nrm.push(nB[i][0], nB[i][1], nB[i][2]);
          this.uv.push(u * 2.0, uvV1);
          this.col.push(matId, 0, 1.0);
        }
        for (let i = 0; i < segs; i++) {
          const a = b + i, c = b + ringCount + i;
          this.idx.push(a, a + 1, c, a + 1, c + 1, c);
        }
      };
      const outB = [], outF = [], inF = [], inB = [];
      const nOut = [], nIn = [], nFront = [], nBack = [];
      for (let i = 0; i <= segs; i++) {
        const ang = (i / segs) * Math.PI;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        // Outward normal of ellipse (x = -rx*cos, y = ry*sin)
        let nx = -ca / Math.max(rx, 1e-4), ny = sa / Math.max(ry, 1e-4);
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl; ny /= nl;
        // Outer & inner arch positions (slight visor overhang at top center of zFront)
        const overhang = sa * 0.028;
        const ox = cx - ca * rx, oy = baseY + sa * ry;
        const ix = ox - nx * thick, iy = oy - ny * thick;
        outB.push([ox, oy, zBack]);
        outF.push([ox, oy, zFront + overhang]);
        inF.push([ix, iy, zFront + overhang - 0.004]);
        inB.push([ix, iy, zBack]);
        nOut.push([nx, ny, 0]);
        nIn.push([-nx, -ny, 0]);
        // Rounded beveled front lip normal (angled slightly outward + forward)
        const fnL = Math.hypot(nx * 0.35, ny * 0.35, 0.93) || 1;
        nFront.push([nx * 0.35 / fnL, ny * 0.35 / fnL, 0.93 / fnL]);
        nBack.push([0, 0, -1]);
      }
      // Outer smooth curved roof of cowl
      addStrip(outB, outF, nOut, nOut, 0, 1);
      // Smooth beveled front lip facing driver
      addStrip(outF, inF, nFront, nFront, 0, 0.25);
      // Inner recessed hood facing cluster
      addStrip(inF, inB, nIn, nIn, 0, 1);
      // Back wall closing toward windshield
      addStrip(inB, outB, nBack, nBack, 0, 0.25);
      return base;
    }
    // Smooth lofted 3D quad strip between two point arrays (for curved roof headliner, windshield, side windows)
    addLoftStrip(ptsA, ptsB, matId, flip = false, extra = 0) {
      const n = ptsA.length;
      if (n < 2) return;
      const b = this.pos.length / 3;
      const norms = [];
      for (let i = 0; i < n; i++) {
        const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
        const tx = ptsA[i1][0] - ptsA[i0][0], ty = ptsA[i1][1] - ptsA[i0][1], tz = ptsA[i1][2] - ptsA[i0][2];
        const ux = ptsB[i][0] - ptsA[i][0], uy = ptsB[i][1] - ptsA[i][1], uz = ptsB[i][2] - ptsA[i][2];
        let nx = ty * uz - tz * uy, ny = tz * ux - tx * uz, nz = tx * uy - ty * ux;
        if (flip) { nx = -nx; ny = -ny; nz = -nz; }
        const l = Math.hypot(nx, ny, nz) || 1;
        norms.push([nx / l, ny / l, nz / l]);
      }
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        this.pos.push(ptsA[i][0], ptsA[i][1], ptsA[i][2]);
        this.nrm.push(norms[i][0], norms[i][1], norms[i][2]);
        this.uv.push(u, 0);
        this.col.push(matId, extra, 1.0);
      }
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        this.pos.push(ptsB[i][0], ptsB[i][1], ptsB[i][2]);
        this.nrm.push(norms[i][0], norms[i][1], norms[i][2]);
        this.uv.push(u, 1);
        this.col.push(matId, extra, 1.0);
      }
      for (let i = 0; i < n - 1; i++) {
        const a = b + i, c = b + n + i;
        if (flip) this.idx.push(a, c, a + 1, a + 1, c, c + 1);
        else      this.idx.push(a, a + 1, c, a + 1, c + 1, c);
      }
    }
    addQuad(w, h, pos, rot, u0, v0, u1, v1, emissive = 0.0, alphaMode = 0.0) {
      const hw = w * 0.5, hh = h * 0.5;
      const b = this.pos.length / 3;
      const n = this._xformNrm([0, 0, 1], rot);
      const pts = [[-hw, -hh, 0], [hw, -hh, 0], [hw, hh, 0], [-hw, hh, 0]];
      const uvs = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
      for (let i = 0; i < 4; i++) {
        const p = this._xformPt(pts[i], pos, rot);
        this.pos.push(p[0], p[1], p[2]);
        this.nrm.push(n[0], n[1], n[2]);
        this.uv.push(uvs[i][0], uvs[i][1]);
        this.col.push(emissive, alphaMode, 1.0);
      }
      this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    addDiscQuad(r, pos, rot, u0, v0, u1, v1, emissive = 0.85) {
      const segs = 20;
      const cIdx = this.pos.length / 3;
      const n = this._xformNrm([0, 0, 1], rot);
      const cp = this._xformPt([0, 0, 0], pos, rot);
      const um = (u0 + u1) * 0.5, vm = (v0 + v1) * 0.5;
      const ur = (u1 - u0) * 0.5, vr = (v1 - v0) * 0.5;
      this.pos.push(cp[0], cp[1], cp[2]); this.nrm.push(n[0], n[1], n[2]);
      this.uv.push(um, vm); this.col.push(emissive, 0, 1.0);
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const p = this._xformPt([ca * r, sa * r, 0], pos, rot);
        this.pos.push(p[0], p[1], p[2]); this.nrm.push(n[0], n[1], n[2]);
        this.uv.push(um + ca * ur, vm - sa * vr);
        this.col.push(emissive, 0, 1.0);
      }
      for (let i = 0; i < segs; i++) this.idx.push(cIdx, cIdx + 1 + i, cIdx + 2 + i);
    }
    toData() {
      return { positions: this.pos, normals: this.nrm, uvs: this.uv, colors: this.col, indices: this.idx };
    }
  }

  function makeTexFromCanvas(gl, canvas, linearMip = true) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (linearMip) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }

  // Packed Static Wheel Atlas (1024x512): Top-half = APEX-R + Chevron decal (transparent); Bottom-half = 8 backlit rally buttons
  function buildWheelAtlasCanvas() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 1024, 512);
    // [0..512, 0..256]: APEX-R wordmark + chevron emblem
    g.fillStyle = '#f1f5f9';
    g.font = 'italic 900 34px Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('APEX-R', 256, 52);
    g.fillStyle = '#e2e8f0';
    g.beginPath();
    g.moveTo(256, 122); g.lineTo(298, 198); g.lineTo(276, 198);
    g.lineTo(256, 158); g.lineTo(236, 198); g.lineTo(214, 198);
    g.closePath(); g.fill();
    g.fillStyle = '#f29330';
    g.fillRect(238, 178, 36, 10);

    // 8 circular backlit buttons at bottom half (each 128x128 tile in 8 columns: x = i*128, y = 256..384)
    const specs = [
      { label: 'DR',  bg: '#0c3b36', ring: '#14f1d9' },
      { label: 'EX2', bg: '#4a0d16', ring: '#ff2e4c' },
      { label: 'LNC', bg: '#38124a', ring: '#c04dff' },
      { label: 'BIP', bg: '#0f3d1e', ring: '#32ff6a' },
      { label: 'MD',  bg: '#3f3d0b', ring: '#d8ff29' },
      { label: 'END', bg: '#0b3847', ring: '#26d9ff' },
      { label: 'PIT', bg: '#0f3d1e', ring: '#32ff6a' },
      { label: 'RAD', bg: '#4a1b0a', ring: '#ff5e1a' },
    ];
    specs.forEach((b, idx) => {
      const ox = idx * 128, oy = 256;
      g.fillStyle = '#0d1015'; g.fillRect(ox, oy, 128, 128);
      g.strokeStyle = b.ring; g.lineWidth = 14;
      g.beginPath(); g.arc(ox + 64, oy + 64, 52, 0, Math.PI * 2); g.stroke();
      g.fillStyle = b.bg;
      g.beginPath(); g.arc(ox + 64, oy + 64, 42, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff';
      g.font = b.label.length > 2 ? '800 28px Arial, sans-serif' : '900 34px Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(b.label, ox + 64, oy + 66);
    });
    return c;
  }

  // Packed Static Console / Tablet / Gauge / Mirror / Roll-Cage Decal Atlas (1024x512)
  function buildConsoleAtlasCanvas() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#111418';
    g.fillRect(0, 0, 1024, 512);

    // Region 1 [0..512, 0..320]: Co-Driver Rally Tablet UI (STAGE-NAV R22 | SS04 GRAVEL)
    g.save();
    g.fillStyle = '#c4cdd8'; g.fillRect(0, 0, 512, 320);
    g.fillStyle = '#141e2b'; g.fillRect(0, 0, 512, 36);
    g.fillStyle = '#f8fafc'; g.font = '700 16px Consolas, monospace'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillText('STAGE-NAV R22  |  SS04 GRAVEL', 14, 24);
    g.fillStyle = '#38bdf8'; g.fillText('GPS 12', 435, 24);
    // Left diff card
    g.fillStyle = '#dde4ec'; g.fillRect(14, 48, 152, 256);
    g.strokeStyle = '#94a3b8'; g.lineWidth = 2; g.strokeRect(14, 48, 152, 256);
    g.strokeStyle = '#1e293b'; g.lineWidth = 3; g.strokeRect(66, 84, 48, 118);
    g.fillStyle = '#0284c7'; g.fillRect(50, 92, 12, 30); g.fillRect(118, 92, 12, 30);
    g.fillStyle = '#16a34a'; g.fillRect(50, 162, 12, 30); g.fillRect(118, 162, 12, 30);
    g.fillStyle = '#0f172a'; g.font = '700 14px Consolas, monospace';
    g.fillText('DIFF 55:45', 42, 232); g.fillText('BRK  62% F', 42, 256);
    g.fillStyle = '#15803d'; g.fillText('TYRE OK', 54, 282);
    // Center distance card
    g.fillStyle = '#dde4ec'; g.fillRect(178, 48, 182, 156); g.strokeStyle = '#94a3b8'; g.strokeRect(178, 48, 182, 156);
    g.fillStyle = '#475569'; g.font = '700 14px Arial, sans-serif'; g.fillText('TOTAL DIST (km)', 192, 72);
    g.fillStyle = '#0f172a'; g.font = '900 42px Consolas, monospace'; g.fillText('14.82', 192, 118);
    g.fillStyle = '#475569'; g.font = '700 14px Arial, sans-serif'; g.fillText('PARTIAL SPLIT', 192, 148);
    g.fillStyle = '#1d4ed8'; g.font = '800 32px Consolas, monospace'; g.fillText('0.45', 192, 186);
    g.fillStyle = '#dde4ec'; g.fillRect(178, 214, 182, 90); g.strokeStyle = '#94a3b8'; g.strokeRect(178, 214, 182, 90);
    g.fillStyle = '#15803d'; g.font = '800 28px Consolas, monospace'; g.fillText('-01.4s', 196, 256);
    g.fillStyle = '#475569'; g.font = '700 13px Arial, sans-serif'; g.fillText('VS TARGET PACE', 196, 284);
    // Right tiles + STAGE OK
    g.fillStyle = '#dde4ec'; g.fillRect(372, 48, 126, 76); g.strokeRect(372, 48, 126, 76);
    g.fillStyle = '#0f172a'; g.font = '700 15px Consolas, monospace'; g.fillText('MAP: GRV2', 384, 78); g.fillText('ALS: HIGH', 384, 104);
    g.fillStyle = '#dde4ec'; g.fillRect(372, 134, 126, 76); g.strokeRect(372, 134, 126, 76);
    g.fillStyle = '#0f172a'; g.fillText('BAT: 14.1V', 384, 164); g.fillText('ECP: 4.8B', 384, 190);
    g.fillStyle = '#d9480f'; g.fillRect(372, 222, 126, 82);
    g.fillStyle = '#ffffff'; g.font = '900 19px Arial, sans-serif'; g.textAlign = 'center'; g.fillText('STAGE OK', 435, 268);
    g.restore();

    // Region 2 [512..768, 0..256]: 52mm OIL/BST Analog Gauge
    g.save();
    g.translate(512, 0);
    g.fillStyle = '#0a0d12'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#334155'; g.lineWidth = 6;
    g.beginPath(); g.arc(128, 128, 114, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * 0.75 + (i / 24) * Math.PI * 1.5;
      const major = i % 4 === 0;
      g.strokeStyle = i >= 20 ? '#ef4444' : '#e2e8f0'; g.lineWidth = major ? 4 : 2;
      g.beginPath();
      g.moveTo(128 + Math.cos(a) * (major ? 82 : 94), 128 + Math.sin(a) * (major ? 82 : 94));
      g.lineTo(128 + Math.cos(a) * 108, 128 + Math.sin(a) * 108);
      g.stroke();
    }
    g.fillStyle = '#94a3b8'; g.font = '700 20px Arial, sans-serif'; g.textAlign = 'center'; g.fillText('BAR', 128, 178);
    g.fillStyle = '#e2e8f0'; g.font = '700 16px Consolas, monospace'; g.fillText('OIL / BST', 128, 88);
    const na = Math.PI * 1.68;
    g.strokeStyle = '#f97316'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(na) * 84, 128 + Math.sin(na) * 84); g.stroke();
    g.fillStyle = '#cbd5e1'; g.beginPath(); g.arc(128, 128, 12, 0, Math.PI * 2); g.fill();
    g.restore();

    // Region 3 [768..1024, 0..128]: Rearview Mirror reflection (anti-glare blue-slate with rear X-cage silhouette)
    g.save();
    g.translate(768, 0);
    const mg = g.createLinearGradient(0, 0, 0, 128);
    mg.addColorStop(0, '#3a4e60'); mg.addColorStop(0.42, '#62788a'); mg.addColorStop(0.56, '#2e3c38'); mg.addColorStop(1, '#1a2127');
    g.fillStyle = mg; g.fillRect(0, 0, 256, 128);
    // Soft atmospheric mountain mist band + receding wet tarmac sheen
    const hGrad = g.createLinearGradient(0, 48, 0, 82);
    hGrad.addColorStop(0, 'rgba(180,204,220,0.32)'); hGrad.addColorStop(1, 'rgba(40,52,58,0)');
    g.fillStyle = hGrad; g.fillRect(0, 48, 256, 34);
    const rGrad = g.createLinearGradient(0, 68, 0, 128);
    rGrad.addColorStop(0, 'rgba(110,126,138,0.45)'); rGrad.addColorStop(1, 'rgba(30,36,42,0.85)');
    g.fillStyle = rGrad;
    g.beginPath(); g.moveTo(114, 68); g.lineTo(142, 68); g.lineTo(186, 128); g.lineTo(70, 128); g.closePath(); g.fill();
    // Subtle rear STAGE roll-cage X-brace + anti-glare glass specular sheen
    g.strokeStyle = 'rgba(16, 30, 46, 0.72)'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(36, 0); g.lineTo(128, 128); g.lineTo(220, 0); g.stroke();
    const sheen = g.createLinearGradient(0, 0, 256, 44);
    sheen.addColorStop(0, 'rgba(255,255,255,0.12)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0.02)'); sheen.addColorStop(1, 'rgba(255,255,255,0.08)');
    g.fillStyle = sheen; g.fillRect(0, 0, 256, 128);
    g.strokeStyle = 'rgba(160, 190, 215, 0.28)'; g.lineWidth = 3; g.strokeRect(2, 2, 252, 124);
    g.restore();

    // Region 4 [768..1024, 128..256]: 4 Switch Plaques (IGN, FUEL, FAN, START) — each 128x64
    const plaques = [
      { x: 768, y: 128, t: 'IGN' }, { x: 896, y: 128, t: 'FUEL' },
      { x: 768, y: 192, t: 'FAN' }, { x: 896, y: 192, t: 'START' },
    ];
    for (const pl of plaques) {
      g.fillStyle = '#111418'; g.fillRect(pl.x, pl.y, 128, 64);
      g.strokeStyle = '#94a3b8'; g.lineWidth = 4; g.strokeRect(pl.x + 3, pl.y + 3, 122, 58);
      g.fillStyle = '#f8fafc'; g.font = '800 26px Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(pl.t, pl.x + 64, pl.y + 33);
    }

    // Region 5 [0..512, 320..512]: A-Pillar RALLY STAGE 22 / APEX-R Wrap Decals (Left beige/black, Right orange/black)
    // Left A-pillar wrap [0..256, 320..512]
    g.fillStyle = '#d4b483'; g.fillRect(0, 320, 256, 86);
    g.fillStyle = '#121820'; g.fillRect(0, 406, 256, 106);
    g.fillStyle = '#11151c'; g.font = '900 32px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('RALLY', 128, 350);
    g.font = '800 18px Consolas, monospace'; g.fillText('STAGE 22', 128, 384);
    g.fillStyle = '#f1f5f9'; g.font = 'italic 900 28px Arial, sans-serif';
    g.fillText('APEX-R', 128, 460);
    // Right A-pillar wrap [256..512, 320..512]
    g.fillStyle = '#d95d1e'; g.fillRect(256, 320, 256, 86);
    g.fillStyle = '#121820'; g.fillRect(256, 406, 256, 106);
    g.fillStyle = '#ffffff'; g.font = '900 28px Arial, sans-serif';
    g.fillText('RALLY 22', 384, 362);
    g.fillStyle = '#f1f5f9'; g.font = 'italic 900 26px Arial, sans-serif';
    g.fillText('APEX-R', 384, 460);

    // Region 6 [512..768, 256..512]: STAGE Fire Extinguisher SPEC 8865-R Label
    g.fillStyle = '#e6ecf2'; g.fillRect(512, 256, 256, 128);
    g.fillStyle = '#c81e1e'; g.fillRect(512, 256, 256, 22); g.fillRect(512, 362, 256, 22);
    g.fillStyle = '#0f172a'; g.font = '900 22px Arial, sans-serif'; g.textAlign = 'center';
    g.fillText('SPEC 8865-R', 640, 312);
    g.font = '700 16px Consolas, monospace'; g.fillText('AFFF 4.0L STAGE', 640, 342);

    return c;
  }

  function buildStaticCockpitData() {
    const g = new GeoBuilder();
    const d = new GeoBuilder(); // Console/tablet/gauge/mirror/decal textured quads
    const glass = new GeoBuilder(); // Polycarbonate side slider glass

    // =====================================================================
    // 1. SCULPTED FLOCKED DASHBOARD + ARCHED BINNACLE + AIR VENTS + STALKS
    // =====================================================================
    // Main sculpted dashboard profile (extruded across X = -0.56..+0.56)
    const dashProf = [
      [-0.81, 0.715], [-0.58, 0.736], [-0.47, 0.734], [-0.452, 0.702],
      [-0.462, 0.560], [-0.505, 0.435], [-0.79, 0.435],
    ];
    g.addExtrude2D(dashProf, 1.12, [0.56, 0, 0], [0, -Math.PI / 2, 0], 0, 2.0);
    // Dashboard end-caps & passenger airbag-delete recess
    for (const side of [-1, 1]) {
      g.addBox(0.14, 0.30, 0.36, [side * 0.615, 0.575, -0.62], null, 2);
      // Lower A-pillar footwell kick-panel bulkhead (seals outer dash-to-door corner — zero see-through!)
      g.addBox(0.05, 0.52, 0.44, [side * 0.662, 0.34, -0.74], null, 3);
    }
    // Matte-black windshield base wiper cowl / scuttle tray seamlessly bridging dashboard to exterior hood
    g.addBox(1.34, 0.036, 0.22, [0, 0.712, -0.84], [-0.08, 0, 0], 3);
    // Sculpted dashboard brow bevel & subtle rally-orange top-stitching accent strip
    g.addBox(1.12, 0.014, 0.024, [0, 0.736, -0.464], [-0.18, 0, 0], 2);
    g.addBox(1.10, 0.003, 0.004, [0, 0.742, -0.470], null, 11);
    // A-pillar base tweeter / defroster louver pods
    for (const side of [-1, 1]) {
      g.addCylinder(0.024, 0.028, 0.018, 14, [side * 0.56, 0.744, -0.68], [0.12, 0, side * 0.22], 3);
    }
    g.addBox(0.29, 0.004, 0.13, [0.32, 0.741, -0.58], null, 2);
    g.addBox(0.278, 0.005, 0.118, [0.32, 0.7425, -0.58], null, 0);
    for (const dx of [-0.34, 0.0, 0.34]) {
      g.addBox(0.24, 0.005, 0.026, [dx, 0.732, -0.73], null, 2);
    }

    // Smooth Continuous Arched Instrument Binnacle Cowl (36-segment lofted arch with shared normals — ZERO sawtooth!)
    g.addSmoothArchCowl(C.driverX, 0.678, -0.595, -0.372, 0.196, 0.154, 0.022, 36, 0);
    // Subtle dark satin inner binnacle surround & carbon accent brow trim
    g.addSmoothArchCowl(C.driverX, 0.682, -0.465, -0.388, 0.174, 0.132, 0.008, 32, 2);
    g.addBox(0.32, 0.125, 0.016, [C.driverX, 0.728, -0.446], null, 3);
    // Digital Telemetry LCD Bezel (actual live LCD screen drawn separately with live dashTex)
    g.addBox(0.248, 0.116, 0.020, C.dashDisplay, [-0.08, 0, 0], 2);

    // Helper: Louvered Air Vent
    const addVent = (w, h, depth, louvers, pos, rot) => {
      g.addBox(w, h, depth, pos, rot, 2);
      const off = g._xformPt([0, 0, depth * 0.5 - 0.003], pos, rot);
      g.addBox(w - 0.012, h - 0.012, 0.008, off, rot, 3);
      for (let i = 0; i < louvers; i++) {
        const t = (i + 0.5) / louvers - 0.5;
        const lp = g._xformPt([0, t * (h - 0.018), depth * 0.5 + 0.001], pos, rot);
        g.addBox(w - 0.016, 0.0048, 0.014, lp, rot ? [rot[0] + 0.16, rot[1], rot[2]] : [0.16, 0, 0], 6);
      }
      const tp = g._xformPt([0, 0, depth * 0.5 + 0.006], pos, rot);
      g.addBox(0.012, 0.016, 0.012, tp, rot, 6);
    };
    addVent(0.068, 0.108, 0.026, 7, [-0.512, 0.655, -0.442], [0, 0.16, 0]);
    addVent(0.068, 0.108, 0.026, 7, [ 0.512, 0.655, -0.442], [0, -0.16, 0]);
    g.addBox(0.235, 0.082, 0.024, [0.055, 0.688, -0.438], [-0.08, 0, 0], 2);
    addVent(0.102, 0.064, 0.018, 4, [0.055 - 0.056, 0.690, -0.433], [-0.08, 0, 0]);
    addVent(0.102, 0.064, 0.018, 4, [0.055 + 0.056, 0.690, -0.433], [-0.08, 0, 0]);

    // Steering Column Shroud & Twin Wiper / Turn Stalks
    const colPos = [C.driverX, 0.625, -0.42], colRot = [C.wheelTiltX, 0, 0];
    g.addCylinder(0.048, 0.056, 0.18, 18, g._xformPt([0, 0, 0.05], colPos, colRot), [Math.PI / 2 + C.wheelTiltX, 0, 0], 2);
    // Rubber steering-column bellows boot sealing dash opening
    g.addCylinder(0.058, 0.068, 0.055, 18, g._xformPt([0, 0, -0.04], colPos, colRot), [Math.PI / 2 + C.wheelTiltX, 0, 0], 3);
    g.addCylinder(0.007, 0.009, 0.13, 10, [C.driverX + 0.095, 0.652, -0.34], [0, 0, -Math.PI / 2 + 0.14], 2);
    g.addCylinder(0.011, 0.008, 0.036, 10, [C.driverX + 0.152, 0.660, -0.34], [0, 0, -Math.PI / 2 + 0.14], 3);
    g.addCylinder(0.006, 0.008, 0.10, 10, [C.driverX - 0.082, 0.650, -0.34], [0, 0, Math.PI / 2 - 0.14], 2);

    // =====================================================================
    // 2. CENTER CARBON SWITCH PANEL (TOGGLES, LEDS, KNOBS, 52MM GAUGE, START)
    // =====================================================================
    const pPos = [0.055, 0.515, -0.422], pRot = [-0.12, 0, 0];
    const pPt = (lx, ly, lz) => g._xformPt([lx, ly, lz], pPos, pRot);
    g.addBox(0.228, 0.275, 0.024, pPos, pRot, 2);
    g.addBox(0.208, 0.255, 0.008, pPt(0, 0, 0.011), pRot, 1); // 2x2 Twill Carbon Plate
    for (const bx of [-0.094, 0.094]) {
      for (const by of [-0.116, 0, 0.116]) {
        g.addCylinder(0.0038, 0.0038, 0.005, 10, pPt(bx, by, 0.0165), [Math.PI / 2 + pRot[0], 0, 0], 7);
      }
    }
    // Top Row: IGN / FUEL / FAN Toggle Switches + LEDs + Plaques
    const toggles = [
      { x: -0.064, u0: 0.75, v0: 0.25, u1: 0.875, v1: 0.375, ledMat: 15, on: true },
      { x: -0.028, u0: 0.875, v0: 0.25, u1: 1.0,  v1: 0.375, ledMat: 16, on: true },
      { x:  0.008, u0: 0.75, v0: 0.375, u1: 0.875, v1: 0.50, ledMat: 17, on: false },
    ];
    for (const tg of toggles) {
      d.addQuad(0.032, 0.012, pPt(tg.x, 0.104, 0.0160), pRot, tg.u0, tg.v0, tg.u1, tg.v1, 0.18);
      g.addCylinder(0.0072, 0.0072, 0.005, 6, pPt(tg.x, 0.080, 0.0175), [Math.PI / 2 + pRot[0], 0, 0], 8);
      g.addCylinder(0.0028, 0.0020, 0.024, 8, pPt(tg.x, 0.080 + (tg.on ? 0.005 : -0.005), 0.026), [Math.PI / 2 + pRot[0] + (tg.on ? -0.35 : 0.35), 0, 0], 8);
      g.addCylinder(0.0046, 0.0046, 0.003, 10, pPt(tg.x, 0.056, 0.0155), [Math.PI / 2 + pRot[0], 0, 0], 8);
      g.addCylinder(0.0032, 0.0032, 0.004, 10, pPt(tg.x, 0.056, 0.0168), [Math.PI / 2 + pRot[0], 0, 0], tg.ledMat);
    }
    // Top-Right Red Master Rocker Switch
    g.addBox(0.030, 0.044, 0.012, pPt(0.064, 0.080, 0.018), pRot, 2);
    g.addBox(0.020, 0.032, 0.012, pPt(0.064, 0.080, 0.023), [pRot[0] - 0.18, 0, 0], 10);
    // Middle Row: 2 Knurled Black Rotary Knobs
    for (const k of [{ x: -0.024, y: -0.006, r: 0.018 }, { x: 0.046, y: -0.006, r: 0.022 }]) {
      g.addCylinder(k.r + 0.004, k.r + 0.005, 0.005, 18, pPt(k.x, k.y, 0.017), [Math.PI / 2 + pRot[0], 0, 0], 6);
      g.addCylinder(k.r * 0.88, k.r, 0.018, 18, pPt(k.x, k.y, 0.025), [Math.PI / 2 + pRot[0], 0, 0], 3);
      g.addBox(0.003, k.r * 0.85, 0.004, pPt(k.x, k.y + k.r * 0.25, 0.035), pRot, 8);
    }
    // Bottom-Left: 52mm OIL/BST Circular Analog Gauge
    g.addCylinder(0.027, 0.028, 0.012, 22, pPt(-0.044, -0.082, 0.018), [Math.PI / 2 + pRot[0], 0, 0], 6);
    d.addDiscQuad(0.0235, pPt(-0.044, -0.082, 0.0248), pRot, 0.50, 0.0, 0.75, 0.50, 0.45);
    // Bottom-Right: Red Hinged Safety Flip-Cover START Switch
    d.addQuad(0.042, 0.013, pPt(0.048, -0.050, 0.0160), pRot, 0.875, 0.375, 1.0, 0.50, 0.18);
    g.addBox(0.026, 0.044, 0.008, pPt(0.048, -0.084, 0.017), pRot, 6);
    g.addBox(0.022, 0.038, 0.004, pPt(0.048, -0.083, 0.035), [pRot[0] - 0.22, 0, 0], 10);
    for (const fx of [-0.010, 0.010]) {
      g.addBox(0.003, 0.038, 0.016, pPt(0.048 + fx, -0.083, 0.027), [pRot[0] - 0.22, 0, 0], 10);
    }

    // =====================================================================
    // 3. CO-DRIVER RALLY TRIPMASTER TABLET + RAM MOUNT + COILED CABLE
    // =====================================================================
    const tPos = C.tabletPos, tRot = [-0.08, -0.24, 0];
    const tPt = (lx, ly, lz) => g._xformPt([lx, ly, lz], tPos, tRot);
    g.addBox(0.178, 0.116, 0.020, tPos, tRot, 2);
    for (const cx of [-0.086, 0.086]) {
      for (const cy of [-0.056, 0.056]) g.addBox(0.014, 0.014, 0.023, tPt(cx, cy, 0), tRot, 3);
    }
    d.addQuad(0.144, 0.092, tPt(-0.008, 0.002, 0.0112), tRot, 0.0, 0.0, 0.50, 0.625, 0.35);
    g.addBox(0.024, 0.022, 0.085, tPt(-0.015, -0.005, -0.055), [tRot[0], tRot[1] + 0.25, 0], 6);
    g.addTubePath([
      [tPos[0] - 0.02, tPos[1] - 0.062, tPos[2] - 0.005],
      [tPos[0] - 0.05, tPos[1] - 0.095, tPos[2] - 0.015],
      [0.18, 0.49, -0.43], [0.14, 0.48, -0.45],
    ], 0.0065, 14, 8, 3);

    // =====================================================================
    // 4. CARBON CENTER TUNNEL + SHIFTER BASE + HANDBRAKE BASE + CONTROLS
    // =====================================================================
    // Cabin floorpan + firewall bulkhead + transmission tunnel
    g.addBox(1.36, 0.024, 1.80, [0, -0.012, -0.06], null, 3);
    g.addBox(1.36, 0.72, 0.03, [0, 0.36, C.firewallZ], null, 2);
    g.addBox(0.228, 0.245, 0.84, [0.03, 0.122, -0.10], null, 1);
    g.addBox(0.222, 0.165, 0.032, [0.048, 0.322, -0.436], [-0.18, 0, 0], 1);
    // Shifter gated CNC baseplate
    const sp = [C.shifterPos[0], C.tunnelTopY + 0.022, C.shifterPos[2]];
    g.addBox(0.092, 0.014, 0.148, sp, null, 6);
    g.addBox(0.048, 0.008, 0.106, [sp[0], sp[1] + 0.005, sp[2]], null, 3);
    for (const gx of [-0.018, 0.018]) g.addBox(0.005, 0.007, 0.098, [sp[0] + gx, sp[1] + 0.0075, sp[2]], null, 7);
    // Handbrake CNC baseplate + master cylinder + AN fittings
    const hp = [C.handbrakePos[0], C.tunnelTopY + 0.022, C.handbrakePos[2]];
    g.addBox(0.056, 0.008, 0.125, [hp[0], hp[1] + 0.004, hp[2] - 0.022], null, 6);
    for (const px of [-0.017, 0.017]) g.addBox(0.006, 0.044, 0.072, [hp[0] + px, hp[1] + 0.028, hp[2] - 0.005], null, 6);
    g.addCylinder(0.013, 0.013, 0.078, 12, [hp[0], hp[1] + 0.028, hp[2] - 0.076], [Math.PI / 2, 0, 0], 7);
    g.addCylinder(0.006, 0.006, 0.016, 6, [hp[0], hp[1] + 0.044, hp[2] - 0.095], null, 12);
    g.addCylinder(0.0055, 0.0055, 0.014, 6, [hp[0], hp[1] + 0.044, hp[2] - 0.062], null, 10);
    // Brake bias dial + STAGE red T-handle master kill switch + Intercom box
    g.addCylinder(0.012, 0.0125, 0.018, 14, [-0.022, C.tunnelTopY + 0.036, 0.01], null, 10);
    g.addCylinder(0.006, 0.006, 0.016, 10, [0.026, C.tunnelTopY + 0.040, 0.01], null, 10);
    g.addBox(0.034, 0.008, 0.009, [0.026, C.tunnelTopY + 0.048, 0.01], [0, 0.4, 0], 10);
    g.addBox(0.115, 0.028, 0.068, [0.015, C.tunnelTopY + 0.036, 0.115], null, 6);

    // =====================================================================
    // 5. STAGE BLUE TUBULAR ROLL CAGE + FOAM PADDING + DECAL SLEEVES + MIRROR
    // =====================================================================
    const R = C.cageMainR, rSub = C.cageSubR;
    for (const side of [-1, 1]) {
      g.addBox(0.10, 0.010, 0.13, [side * 0.59, 0.005, -0.68], null, 9);
      // A-pillar + roof rail continuous tube
      g.addTubePath([
        [side * 0.59, 0.01, -0.68], [side * 0.59, 0.48, -0.66],
        [side * 0.565, 0.72, -0.60], [side * 0.49, 1.04, -0.27],
        [side * 0.475, 1.095, -0.17], [side * 0.485, 1.11, 0.40],
      ], R, 26, 12, 9);
      // Upper A-pillar STAGE black foam sleeve
      g.addTubePath([
        [side * 0.505, 0.98, -0.33], [side * 0.49, 1.04, -0.27], [side * 0.475, 1.095, -0.17],
      ], R + 0.010, 10, 10, 3);
      // A-pillar RALLY STAGE 22 / APEX-R decal patch hugging inner A-pillar tube cleanly
      const decPos = [side * 0.514, 0.855, -0.442];
      const decRot = [-0.66, side === -1 ? 0.42 : -0.42, side * 0.14];
      d.addQuad(0.038, 0.165, decPos, decRot, side === -1 ? 0.0 : 0.25, 0.625, side === -1 ? 0.25 : 0.50, 1.0, 0.10);
      // Diagonal Door X-Bars
      g.addTubePath([[side * 0.59, 0.48, -0.66], [side * 0.595, 0.28, -0.06], [side * 0.59, 0.14, 0.42]], rSub, 12, 10, 9);
      g.addTubePath([[side * 0.59, 0.12, -0.67], [side * 0.595, 0.34, -0.10], [side * 0.585, 0.54, 0.42]], rSub, 12, 10, 9);
      g.addTubePath([[side * 0.595, 0.11, -0.66], [side * 0.595, 0.11, 0.42]], rSub * 0.85, 6, 8, 9);
      // Welded STAGE Gusset Plate tucked flush in A-pillar/roof-header corner
      g.addBox(0.068, 0.048, 0.008, [side * 0.456, 1.062, -0.232], [0, 0, side * 0.72], 9);
    }
    // Windshield Header Crossbar + Black Foam Pad + Wide-Angle Carbon Rearview Mirror
    g.addTubePath([
      [-0.485, 1.075, -0.22], [-0.22, 1.095, -0.235], [0.0, 1.102, -0.24], [0.22, 1.095, -0.235], [0.485, 1.075, -0.22],
    ], R * 0.94, 18, 12, 9);
    g.addTubePath([[-0.44, 1.079, -0.223], [-0.22, 1.095, -0.235]], R + 0.009, 8, 10, 3);
    // STAGE roll-cage foam zip-tie cinch rings (authentic rally safety detail)
    for (const zx of [-0.40, -0.32, -0.24]) {
      g.addCylinder(R + 0.0115, R + 0.0115, 0.007, 12, [zx, 1.084 + (zx + 0.40) * 0.05, -0.226 - (zx + 0.40) * 0.04], [0, 0, Math.PI / 2], 2);
    }
    // Sculpted Slanted / Beveled Trapezoidal Automotive Rearview Mirror (NOT a plain box!)
    // Tapered front-to-back aero housing, chamfered 45° corners, driver-angled tilt, day/night tab & ball-joint stalk
    const rvmPos = [-0.035, 1.028, -0.224];
    const rvmRot = [-0.055, -0.095, 0.0];
    const rvmPt = (lx, ly, lz) => g._xformPt([lx, ly, lz], rvmPos, rvmRot);
    // Outer slanted trapezoidal carbon housing (narrower top, wider bottom, tapered rear shell)
    g.addBeveledTrapezoid(0.228, 0.252, 0.054, 0.158, 0.180, 0.034, 0.028, 0.011, rvmPos, rvmRot, 1);
    // Recessed dark matte rubber inner bezel lip framing the mirror glass
    g.addBeveledTrapezoid(0.214, 0.236, 0.044, 0.222, 0.244, 0.048, 0.005, 0.008, rvmPt(0, 0, 0.014), rvmRot, 3);
    // Anti-glare Day/Night flip tab underneath bottom chamfer
    g.addBeveledTrapezoid(0.026, 0.018, 0.007, 0.020, 0.014, 0.005, 0.014, 0.002, rvmPt(0, -0.030, 0.004), [rvmRot[0] + 0.35, rvmRot[1], 0], 2);
    // Center ball-and-socket swivel joint + sculpted gooseneck stalk to roof header button
    g.addCylinder(0.013, 0.013, 0.016, 12, rvmPt(0, 0.004, -0.019), [Math.PI / 2 + rvmRot[0], rvmRot[1], 0], 6);
    g.addTubePath([
      rvmPt(0, 0.004, -0.020),
      [rvmPos[0] + 0.004, rvmPos[1] + 0.026, rvmPos[2] - 0.042],
      [rvmPos[0] + 0.002, rvmPos[1] + 0.068, rvmPos[2] - 0.038],
      [rvmPos[0], rvmPos[1] + 0.084, rvmPos[2] - 0.022],
    ], 0.0072, 12, 10, 6);
    g.addCylinder(0.019, 0.023, 0.014, 12, [rvmPos[0], rvmPos[1] + 0.088, rvmPos[2] - 0.020], [0.22, 0, 0], 2);
    // Angled anti-glare mirror glass seated cleanly inside the beveled trapezoidal rim
    d.addTrapezoidQuad(0.198, 0.222, 0.038, rvmPt(0, 0, 0.0168), rvmRot, 0.75, 0.0, 1.0, 0.25, 0.14);
    // Dashboard top windshield defroster louver strip (recessed matte slats near cowl)
    for (let di = -2; di <= 2; di++) {
      g.addBox(0.115, 0.006, 0.026, [di * 0.145, 0.736, -0.66], [0.06, 0, 0], 3);
    }

    // =====================================================================
    // 6. ENCLOSED RALLY CABIN ROOF, A/B PILLARS, FULL DOOR WINDOWS & WINDSHIELD
    // =====================================================================
    const W = C.widthHalf, beltY = C.beltY;
    // 6A. Full Curved Enclosed Roof Headliner (interior matte Alcantara) + Exterior Teal Roof Cap
    // Airtight welded ceiling extending past A-pillars & cant-rails (ZERO roof separation or sky leak!)
    const roofSegs = 16;
    const roofZRows = [-0.36, -0.22, -0.02, 0.28, 0.68];
    const roofGrid = roofZRows.map((z) => {
      const row = [];
      const halfW = z < -0.16 ? 0.595 : 0.625;
      const crownZ = z < -0.20 ? -0.024 : (z > 0.45 ? -0.020 : 0.014);
      for (let i = 0; i <= roofSegs; i++) {
        const u = (i / roofSegs) * 2 - 1; // -1..+1
        const x = u * halfW;
        const arch = (1 - u * u) * 0.064;
        const y = C.roofY - 0.020 + arch + crownZ;
        row.push([x, y, z]);
      }
      return row;
    });
    for (let r = 0; r < roofGrid.length - 1; r++) {
      g.addLoftStrip(roofGrid[r], roofGrid[r + 1], 0, false);
      const upA = roofGrid[r].map((p) => [p[0], p[1] + 0.026, p[2]]);
      const upB = roofGrid[r + 1].map((p) => [p[0], p[1] + 0.026, p[2]]);
      g.addLoftStrip(upA, upB, 14, true);
    }
    // Solid interior roof header bulkhead sealing the entire upper windshield brow tightly onto the A-pillars
    g.addBox(1.18, 0.068, 0.14, [0, C.roofY - 0.028, -0.285], [0.22, 0, 0], 3);
    const hdrTop = [], hdrBot = [], sunBot = [];
    for (let i = 0; i <= roofSegs; i++) {
      const u = (i / roofSegs) * 2 - 1;
      const x = u * 0.615;
      const arch = (1 - u * u) * 0.056;
      hdrTop.push([x, C.roofY - 0.008 + arch, -0.265]);
      hdrBot.push([x, C.roofY - 0.072 + arch, -0.315]);
      sunBot.push([x, C.roofY - 0.132 + arch * 0.85, -0.372]);
    }
    g.addLoftStrip(hdrTop, hdrBot, 3, false);     // Black matte header trim & weatherstrip seal facing driver
    g.addLoftStrip(hdrBot, sunBot, 2, false);     // Matte dark charcoal RALLY sun-strip banner facing driver
    // Overhead roll-cage billet clamp collars on header crossbar
    for (const cx of [-0.36, 0.36]) g.addCylinder(0.028, 0.028, 0.032, 12, [cx, 1.090, -0.232], [0, 0, Math.PI / 2], 6);
    // Overhead Rally Roof Vent Console & Interior Dome Switch Pod
    g.addBox(0.18, 0.028, 0.22, [0, C.roofY + 0.030, -0.02], [-0.06, 0, 0], 2);
    g.addBox(0.12, 0.012, 0.05, [0, C.roofY + 0.015, -0.08], null, 6);

    // 6B. Sculpted A-Pillar Body Shell + Interior Trim + B-Pillar Frame + Rear Bulkhead Arch
    for (const side of [-1, 1]) {
      // Wide structural A-pillar & cant-rail seamlessly welded into roof headliner & door window frame
      g.addTubePath([
        [side * 0.665, 0.65, -0.74],
        [side * 0.640, 0.78, -0.64],
        [side * 0.585, 0.96, -0.46],
        [side * 0.535, 1.115, -0.28],
        [side * 0.530, 1.145, -0.14],
        [side * 0.545, 1.155, 0.34],
        [side * 0.545, 1.140, 0.66],
      ], 0.042, 24, 12, 3);
      // Outer teal painted A-pillar & cant-rail body trim just outside the black weatherstrip
      g.addTubePath([
        [side * 0.695, 0.66, -0.74],
        [side * 0.668, 0.79, -0.64],
        [side * 0.612, 0.97, -0.46],
        [side * 0.562, 1.13, -0.28],
        [side * 0.565, 1.16, 0.34],
      ], 0.028, 20, 10, 14);
      // Upper roof-side cant-rail headliner bolster sealing the side window top edge to the roof ceiling
      g.addBox(0.068, 0.048, 0.94, [side * 0.555, C.roofY - 0.026, 0.08], [0, 0, side * 0.16], 0);
      // B-pillar vertical structural post closing the rear of the side door window opening
      g.addBox(0.055, 0.54, 0.11, [side * 0.615, 0.90, 0.36], [0, 0, side * 0.24], 3);
      // Lower A-pillar triangular black sail panel gusset (solidly anchors the exterior side mirror — zero floating!)
      g.addBox(0.036, 0.145, 0.18, [side * 0.672, beltY + 0.068, -0.56], [0, side * -0.12, side * 0.16], 3);
    }

    // 6C. Carbon Doors, Red Pull Straps, Full-Size Enclosed Polycarbonate Side Windows & Solidly Mounted Side Mirrors
    for (const side of [-1, 1]) {
      g.addBox(0.024, 0.54, 1.10, [side * (W - 0.018), 0.375, -0.11], [0, 0, side * 0.06], 1);
      g.addBox(0.048, 0.040, 1.16, [side * (W - 0.030), beltY - 0.004, -0.11], null, 3);
      const hx = side * (W - 0.036);
      // Door handle cup & pull lever + window crank
      g.addBox(0.016, 0.068, 0.116, [hx, 0.52, -0.22], null, 2);
      g.addBox(0.012, 0.018, 0.064, [hx - side * 0.010, 0.52, -0.22], [0, side * 0.14, 0], 6);
      g.addCylinder(0.014, 0.016, 0.018, 10, [hx - side * 0.010, 0.455, -0.34], [0, 0, Math.PI / 2], 2);
      g.addBox(0.010, 0.016, 0.058, [hx - side * 0.018, 0.455, -0.365], null, 2);
      // Red braided nylon door pull strap
      g.addTubePath([
        [hx - side * 0.005, 0.375, -0.12], [hx - side * 0.038, 0.382, -0.19],
        [hx - side * 0.038, 0.395, -0.27], [hx - side * 0.005, 0.405, -0.33],
      ], 0.011, 14, 8, 13);

      // FULL-SIZE Flush-Seated Automotive Side Door Window Glass (NO floating ghost vent box!)
      const winBot = [
        [side * 0.658, beltY + 0.012, -0.62],
        [side * 0.660, beltY + 0.012, -0.34],
        [side * 0.660, beltY + 0.012,  0.00],
        [side * 0.658, beltY + 0.012,  0.34],
      ];
      const winTop = [
        [side * 0.630, 0.785, -0.61],
        [side * 0.555, 1.075, -0.31],
        [side * 0.538, C.roofY - 0.025, 0.02],
        [side * 0.545, C.roofY - 0.025, 0.34],
      ];
      glass.addLoftStrip(winBot, winTop, 19, side === -1);

      // Aerodynamic Slanted / Beveled Rally Exterior Wing Mirror (tapered aero shell + twin swept pedestal)
      const mPos = [side * (W + 0.092), beltY + 0.084, -0.515], mRot = [-0.04, side * -0.22, side * -0.05];
      const mPt = (lx, ly, lz) => g._xformPt([lx, ly, lz], mPos, mRot);
      // Twin aerodynamic swept mounting arms anchoring into the A-pillar sail panel
      g.addTubePath([
        [side * 0.668, beltY + 0.052, -0.538],
        mPt(-side * 0.042, -0.018, -0.010),
        mPt(-side * 0.012, -0.008, -0.006),
      ], 0.0105, 8, 8, 3);
      g.addTubePath([
        [side * 0.666, beltY + 0.082, -0.548],
        mPt(-side * 0.040, 0.010, -0.014),
        mPt(-side * 0.010, 0.008, -0.008),
      ], 0.0085, 8, 8, 3);
      // Slanted trapezoidal aero mirror cap (tapers smoothly forward into the airflow, chamfered outer corners)
      g.addBeveledTrapezoid(0.132, 0.152, 0.092, 0.094, 0.112, 0.062, 0.056, 0.018, mPos, mRot, 14);
      // Subtle outer-edge amber LED turn-signal slit along the mirror aero bevel
      g.addBox(0.036, 0.006, 0.008, mPt(side * 0.048, -0.004, -0.018), mRot, 16);
      // Recessed dark rubber bezel + reflective mirror glass face
      g.addBeveledTrapezoid(0.116, 0.134, 0.074, 0.122, 0.140, 0.078, 0.006, 0.014, mPt(0, 0, 0.028), mRot, 3);
      g.addBeveledTrapezoid(0.106, 0.122, 0.064, 0.108, 0.124, 0.066, 0.003, 0.011, mPt(0, 0, 0.0305), mRot, 7);
    }

    // 6D. Full Laminated Curved Front Windshield Glass spanning A-pillar to A-pillar & cowl to roof header
    const wsBot = [], wsTop = [];
    for (let i = 0; i <= 12; i++) {
      const u = (i / 12) * 2 - 1;
      const curve = (1 - u * u) * 0.042;
      wsBot.push([u * 0.655, 0.720 + curve * 0.35, -0.785 - curve]);
      wsTop.push([u * 0.525, C.roofY - 0.065 + curve * 1.05, -0.315 - curve * 0.55]);
    }
    glass.addLoftStrip(wsBot, wsTop, 20, true);

    // =====================================================================
    // 7. FLOOR-MOUNTED DRILLED ALUMINUM PEDALS & RED STAGE FIRE EXTINGUISHER
    // =====================================================================
    for (const px of [-0.46, -0.34, -0.23]) {
      g.addBox(0.012, 0.14, 0.010, [px, 0.11, -0.78], [0.22, 0, 0], 6);
      g.addBox(0.054, 0.092, 0.008, [px, 0.155, -0.76], [0.22, 0, 0], 7);
    }
    // Red STAGE Plumbed-In Fire Extinguisher on Co-Driver Floor
    const ep = [0.40, 0.068, -0.36], er = [0, 0, Math.PI / 2];
    g.addCylinder(0.052, 0.052, 0.22, 18, ep, er, 10);
    g.addCylinder(0.014, 0.018, 0.044, 10, [ep[0] - 0.135, ep[1], ep[2]], er, 8);
    for (const sy of [-0.058, 0.058]) {
      g.addTorus(0.054, 0.0045, 6, 18, Math.PI * 2, [ep[0] - sy, ep[1], ep[2]], [0, Math.PI / 2, 0], 7);
    }
    d.addQuad(0.088, 0.044, [ep[0], ep[1] + 0.036, ep[2] + 0.040], [-0.72, 0, 0], 0.50, 0.50, 0.75, 0.75, 0.08);

    // Live LCD screen quad (separate single-quad mesh bound to live dashTex)
    const lcd = new GeoBuilder();
    lcd.addQuad(0.228, 0.100, g._xformPt([0, 0, 0.0115], C.dashDisplay, [-0.08, 0, 0]), [-0.08, 0, 0], 0, 0, 1, 1, 0.92);

    return {
      staticGeo: g.toData(),
      consoleDecalsGeo: d.toData(),
      dashLcdGeo: lcd.toData(),
      glassGeo: glass.toData(),
    };
  }

  function buildSteeringWheelData() {
    const g = new GeoBuilder();
    const d = new GeoBuilder();    // Wheel atlas decals (APEX-R + 8 glowing backlit buttons)
    const oled = new GeoBuilder(); // Live mini OLED readout ("G5 6.8K")

    const R = C.wheelRadius, tubeR = 0.0175;
    // 1. 320mm Deep-Dish Alcantara Suede Rim + Thumb Grips + Royal Blue 12-o'clock Stripe
    g.addTorus(R, tubeR, 18, 56, Math.PI * 2, null, null, 4);
    g.addTorus(R, tubeR * 1.07, 12, 12, 0.38, null, [0, 0, Math.PI - 0.19], 4);
    g.addTorus(R, tubeR * 1.07, 12, 12, 0.38, null, [0, 0, -0.19], 4);
    g.addTorus(R, tubeR + 0.0008, 14, 10, 0.092, null, [0, 0, Math.PI / 2 - 0.046], 5);

    // 2. 3-Spoke Deep-Dish Anodized Aluminum Core
    for (const side of [-1, 1]) {
      g.addBox(0.115, 0.030, 0.007, [side * 0.095, -0.006, -0.025], [0, side * -0.34, 0], 6);
    }
    g.addBox(0.036, 0.095, 0.007, [0, -0.112, -0.028], [0.24, 0, 0], 6);

    // 3. Sculpted Butterfly 2x2 Carbon Fiber Faceplate (exact V4 silhouette!)
    const facePoly = [
      [-0.072, 0.056], [0.0, 0.048], [0.072, 0.056], [0.094, 0.044], [0.098, 0.022],
      [0.088, -0.048], [0.076, -0.074], [0.048, -0.082], [-0.048, -0.082],
      [-0.076, -0.074], [-0.088, -0.048], [-0.098, 0.022], [-0.094, 0.044],
    ];
    g.addExtrude2D(facePoly, 0.018, [0, -0.006, -0.028], null, 1, 5.0);
    g.addBox(0.165, 0.115, 0.024, [0, -0.012, -0.042], null, 2);

    // APEX-R wordmark + chevron emblem decal
    d.addQuad(0.120, 0.060, [0, 0.012, -0.0086], null, 0.0, 0.0, 0.50, 0.50, 0.35, 1.0);
    // Mini OLED frame + live OLED screen
    g.addBox(0.038, 0.015, 0.004, [0, 0.018, -0.010], null, 3);
    oled.addQuad(0.032, 0.011, [0, 0.018, -0.0075], null, 0, 0, 1, 1, 0.95);

    // 6 Countersunk Silver Torx Bolts
    for (const [bx, by] of [[-0.082, 0.042], [0.082, 0.042], [-0.078, -0.012], [0.078, -0.012], [-0.044, -0.072], [0.044, -0.072]]) {
      g.addCylinder(0.0038, 0.0038, 0.004, 10, [bx, by, -0.0085], [Math.PI / 2, 0, 0], 7);
      g.addCylinder(0.0018, 0.0018, 0.0045, 6, [bx, by, -0.0081], [Math.PI / 2, 0, 0], 3);
    }

    // 4. 8 Backlit Circular Rally Pushbuttons (exact V4 positions & color coding!)
    const btnPos = [
      [-0.068, 0.022], [-0.043, 0.016], [-0.062, -0.008], [-0.038, -0.014],
      [ 0.043, 0.016], [ 0.068, 0.022], [ 0.038, -0.014], [ 0.062, -0.008],
    ];
    btnPos.forEach(([bx, by], idx) => {
      g.addCylinder(0.0112, 0.0122, 0.007, 16, [bx, by, -0.009], [Math.PI / 2, 0, 0], 6);
      g.addCylinder(0.0094, 0.0096, 0.006, 16, [bx, by, -0.0065], [Math.PI / 2, 0, 0], 6);
      const u0 = idx / 8, u1 = (idx + 1) / 8;
      d.addDiscQuad(0.0094, [bx, by, -0.0032], null, u0, 0.50, u1, 0.75, 0.92);
    });

    // 5. 3 Bottom Knurled Anodized Rotary Encoders (Red / Yellow / Blue) + Glowing LED Pills
    const dials = [
      { x: -0.056, y: -0.054, mat: 10, led: 15 },
      { x:  0.000, y: -0.058, mat: 11, led: 16 },
      { x:  0.056, y: -0.054, mat: 12, led: 18 },
    ];
    for (const dl of dials) {
      g.addCylinder(0.0155, 0.0165, 0.006, 18, [dl.x, dl.y, -0.007], [Math.PI / 2, 0, 0], 6);
      g.addTorus(0.0156, 0.0009, 6, 20, Math.PI * 2, [dl.x, dl.y, -0.0038], null, 7);
      g.addCylinder(0.0125, 0.0132, 0.014, 18, [dl.x, dl.y, 0.000], [Math.PI / 2, 0, 0], dl.mat);
      g.addBox(0.0022, 0.009, 0.002, [dl.x, dl.y + 0.003, 0.0072], null, 8);
      g.addBox(0.012, 0.0045, 0.003, [dl.x, dl.y + 0.020, -0.0045], null, dl.led);
    }

    // 6. Rear Shift Paddles + Quick-Release Hub & Gold Collar
    for (const side of [-1, 1]) {
      g.addBox(0.042, 0.012, 0.004, [side * 0.086, 0.010, -0.062], null, 6);
      g.addBox(0.022, 0.062, 0.004, [side * 0.108, 0.006, -0.056], [0, side * -0.22, 0], 6);
    }
    g.addCylinder(0.036, 0.038, 0.055, 18, [0, 0, -0.082], [Math.PI / 2, 0, 0], 6);
    g.addCylinder(0.040, 0.040, 0.016, 18, [0, 0, -0.095], [Math.PI / 2, 0, 0], 11);

    return { solidGeo: g.toData(), decalGeo: d.toData(), oledGeo: oled.toData() };
  }

  function buildShifterAndHandbrakeData() {
    const sh = new GeoBuilder();
    sh.addCylinder(0.0065, 0.008, 0.21, 12, [0, 0.105, 0], null, 6);
    sh.addLathe([
      [0.008, 0.000], [0.012, 0.010], [0.015, 0.040], [0.019, 0.082],
      [0.0195, 0.102], [0.016, 0.114], [0.009, 0.118], [0.000, 0.119],
    ], 18, [0, 0.195, 0], null, 7);
    sh.addCylinder(0.0085, 0.009, 0.004, 14, [0, 0.314, 0], null, 6);
    sh.addCylinder(0.0062, 0.0062, 0.005, 14, [0, 0.317, 0], null, 10);

    const hb = new GeoBuilder();
    hb.addBox(0.012, 0.145, 0.018, [0, 0.072, 0], null, 6);
    hb.addCylinder(0.0155, 0.0145, 0.125, 16, [0, 0.185, 0], null, 3);
    hb.addCylinder(0.014, 0.0155, 0.014, 14, [0, 0.252, 0], null, 6);

    return { shifterGeo: sh.toData(), handbrakeGeo: hb.toData() };
  }

  PV.CockpitV4 = class CockpitV4 {
    constructor(gl) {
      this.gl = gl;
      const st = buildStaticCockpitData();
      const sw = buildSteeringWheelData();
      const ctrl = buildShifterAndHandbrakeData();

      this.staticMesh = PV.createMesh(gl, st.staticGeo);
      this.consoleDecalsMesh = PV.createMesh(gl, st.consoleDecalsGeo);
      this.dashLcdMesh = PV.createMesh(gl, st.dashLcdGeo);
      this.glassMesh = PV.createMesh(gl, st.glassGeo);

      this.wheelSolidMesh = PV.createMesh(gl, sw.solidGeo);
      this.wheelDecalMesh = PV.createMesh(gl, sw.decalGeo);
      this.wheelOledMesh = PV.createMesh(gl, sw.oledGeo);

      this.shifterMesh = PV.createMesh(gl, ctrl.shifterGeo);
      this.handbrakeMesh = PV.createMesh(gl, ctrl.handbrakeGeo);

      // Static high-res atlases
      this.wheelAtlasTex = makeTexFromCanvas(gl, buildWheelAtlasCanvas(), true);
      this.consoleAtlasTex = makeTexFromCanvas(gl, buildConsoleAtlasCanvas(), true);

      // Live 1024x512 Digital Instrument Cluster Canvas
      this.dashCanvas = document.createElement('canvas');
      this.dashCanvas.width = 1024; this.dashCanvas.height = 512;
      this.dashCtx = this.dashCanvas.getContext('2d');
      this.dashTex = makeTexFromCanvas(gl, this.dashCanvas, false);

      // Live 128x48 Steering Wheel Mini OLED Canvas
      this.oledCanvas = document.createElement('canvas');
      this.oledCanvas.width = 128; this.oledCanvas.height = 48;
      this.oledCtx = this.oledCanvas.getContext('2d');
      this.oledTex = makeTexFromCanvas(gl, this.oledCanvas, false);

      this._v4AlignMat = PV.M4.create();
      PV.M4.fromTRS(this._v4AlignMat, [0, PV.COCKPIT_V4_ALIGN.yOff, PV.COCKPIT_V4_ALIGN.zOff], Math.PI, 0, 0, 1, 1, 1);
      this._rootMat = PV.M4.create();
      this._tmpA = PV.M4.create();
      this._tmpB = PV.M4.create();
      this._subMat = PV.M4.create();
      this._dashFrame = 0;
      this._lastGear = '4';
      this._shiftPulse = 0.0;
      this._hbPull = 0.0;

      this._initShaders();
      this.updateTelemetry(0.68, '4', 120, false);
    }

    _initShaders() {
      const gl = this.gl;
      this.solidProg = PV.createProgram(gl, `#version 300 es
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
          vWorldPos = wp.xyz;
          vLocalPos = aPos;
          vNrm = normalize(mat3(uModel) * aNrm);
          vUv = aUv;
          vMatId = aAttr.x;
          gl_Position = uViewProj * wp;
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vLocalPos;
        in vec3 vNrm;
        in vec2 vUv;
        in float vMatId;
        ${PV.PBR_GLSL}
        out vec4 fragColor;
        void main() {
          int mid = int(vMatId + 0.5);
          vec3 N = normalize(vNrm);
          vec3 V = normalize(uCamPos - vWorldPos);
          vec3 albedo = vec3(0.14, 0.16, 0.19);
          vec3 emissive = vec3(0.0);
          float rough = 0.55, metal = 0.10, clearcoat = 0.08, outAlpha = 1.0;

          if (mid == 0) {
            // Flocked anti-glare rally dashboard charcoal micro-grain
            float grain = pvNoise2(vUv * 42.0 + vLocalPos.xz * 35.0) * 0.04;
            albedo = vec3(0.16, 0.18, 0.21) + grain;
            rough = 0.90; metal = 0.0; clearcoat = 0.0;
          } else if (mid == 1) {
            // Fine 2x2 Twill Motorsport Carbon Fiber weave
            vec2 cUv = (vUv * 88.0) + vec2(vLocalPos.x + vLocalPos.z, vLocalPos.y) * 62.0;
            float cx = floor(cUv.x), cy = floor(cUv.y);
            float diag = mod(cx + cy, 4.0);
            float weave = step(diag, 1.5);
            albedo = mix(vec3(0.052, 0.058, 0.068), vec3(0.118, 0.130, 0.148), weave * 0.65);
            rough = mix(0.26, 0.42, weave); metal = 0.18; clearcoat = 0.52;
          } else if (mid == 2) {
            albedo = vec3(0.085, 0.095, 0.112); rough = 0.58; metal = 0.10;
          } else if (mid == 3) {
            albedo = vec3(0.045, 0.052, 0.062); rough = 0.86; metal = 0.02;
          } else if (mid == 4) {
            // Alcantara matte suede steering rim
            float nap = pvNoise2(vLocalPos.xy * 120.0 + vLocalPos.z * 90.0) * 0.03;
            albedo = vec3(0.092, 0.100, 0.115) + nap;
            rough = 0.92; metal = 0.0; clearcoat = 0.0;
          } else if (mid == 5) {
            albedo = vec3(0.11, 0.31, 0.85); rough = 0.72; metal = 0.0;
          } else if (mid == 6) {
            albedo = vec3(0.15, 0.17, 0.21); rough = 0.34; metal = 0.72; clearcoat = 0.20;
          } else if (mid == 7) {
            albedo = vec3(0.68, 0.73, 0.79); rough = 0.26; metal = 0.88; clearcoat = 0.32;
          } else if (mid == 8) {
            albedo = vec3(0.84, 0.88, 0.92); rough = 0.14; metal = 0.95; clearcoat = 0.45;
          } else if (mid == 9) {
            // STAGE metallic blue-slate steel roll cage
            albedo = vec3(0.11, 0.22, 0.34); rough = 0.30; metal = 0.45; clearcoat = 0.58;
          } else if (mid == 10) {
            // Safety red (flip cover, red dial, fire bottle, kill switch)
            albedo = vec3(0.76, 0.10, 0.09); rough = 0.28; metal = 0.18; clearcoat = 0.52;
          } else if (mid == 11) {
            albedo = vec3(0.82, 0.60, 0.10); rough = 0.30; metal = 0.58; clearcoat = 0.35;
          } else if (mid == 12) {
            albedo = vec3(0.10, 0.36, 0.82); rough = 0.30; metal = 0.58; clearcoat = 0.35;
          } else if (mid == 13) {
            float rib = 0.82 + 0.18 * sin(vUv.y * 85.0);
            albedo = vec3(0.74, 0.12, 0.11) * rib; rough = 0.78; metal = 0.0;
          } else if (mid == 14) {
            albedo = vec3(0.22, 0.66, 0.76); rough = 0.24; metal = 0.20; clearcoat = 0.72;
          } else if (mid == 15) {
            albedo = vec3(0.85, 0.12, 0.10); emissive = vec3(1.9, 0.22, 0.16); rough = 0.15;
          } else if (mid == 16) {
            albedo = vec3(0.92, 0.62, 0.08); emissive = vec3(1.8, 1.15, 0.12); rough = 0.15;
          } else if (mid == 17) {
            albedo = vec3(0.14, 0.85, 0.35); emissive = vec3(0.22, 1.75, 0.55); rough = 0.15;
          } else if (mid == 18) {
            albedo = vec3(0.18, 0.72, 0.96); emissive = vec3(0.30, 1.35, 1.95); rough = 0.15;
          } else if (mid == 19) {
            // Clean automotive side door glass (ceramic frit border + crisp Fresnel; real refractive raindrops & sun-glint dust handled in frame_post.js!)
            float fresS = pow(1.0 - abs(dot(N, V)), 2.6);
            float edgeFrit = smoothstep(0.45, 0.495, abs(vUv.x - 0.5)) + smoothstep(0.46, 0.495, abs(vUv.y - 0.5));
            albedo = mix(vec3(0.62, 0.74, 0.82), vec3(0.03, 0.035, 0.042), clamp(edgeFrit, 0.0, 1.0));
            rough = 0.06; metal = 0.06; clearcoat = 0.95;
            outAlpha = clamp(0.07 + fresS * 0.20 + edgeFrit * 0.84, 0.06, 0.92);
          } else if (mid == 20) {
            // Crystal-clear laminated front windshield + dark ceramic frit sunband (real refractive raindrops & sun-glint dust handled in frame_post.js!)
            float fresW = pow(1.0 - abs(dot(N, V)), 3.2);
            float fritX = smoothstep(0.455, 0.492, abs(vUv.x - 0.5));
            float fritY = smoothstep(0.470, 0.496, abs(vUv.y - 0.5));
            float dotMatrix = 0.75 + 0.25 * step(0.45, fract(vUv.x * 160.0) * fract(vUv.y * 90.0));
            float topShade = smoothstep(0.76, 0.98, vUv.y) * 0.32 * dotMatrix;
            float frit = clamp(fritX + fritY, 0.0, 1.0);
            albedo = mix(vec3(0.72, 0.82, 0.88), vec3(0.025, 0.03, 0.036), clamp(frit + topShade * 0.7, 0.0, 1.0));
            rough = 0.04; metal = 0.04; clearcoat = 0.98;
            outAlpha = clamp(0.035 + fresW * 0.13 + topShade * 0.36 + frit * 0.86, 0.03, 0.92);
          }

          // Ambient-adaptive cabin interior fill (reacts naturally to daylight vs dark tunnels & night stages!)
          vec3 col = evalPBR(vWorldPos, N, V, albedo, rough, metal, 0.95, clearcoat, 0.86);
          float ambLum = clamp(dot(uLightColor, vec3(0.30, 0.55, 0.15)), 0.35, 1.35);
          float cabinFill = 0.24 + 0.28 * max(N.y * 0.5 + 0.5, 0.0) + 0.18 * max(dot(N, V), 0.0);
          col += albedo * vec3(0.38, 0.44, 0.52) * cabinFill * mix(0.42, 1.05, clamp(ambLum, 0.0, 1.0));
          col += emissive;
          fragColor = vec4(col, outAlpha);
        }
      `);

      this.decalProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aNrm;
        layout(location=2) in vec2 aUv;
        layout(location=3) in vec3 aAttr;
        uniform mat4 uViewProj;
        uniform mat4 uModel;
        out vec3 vWorldPos;
        out vec3 vNrm;
        out vec2 vUv;
        out float vEmissive;
        out float vAlphaCut;
        void main() {
          vec4 wp = uModel * vec4(aPos, 1.0);
          vWorldPos = wp.xyz;
          vNrm = normalize(mat3(uModel) * aNrm);
          vUv = aUv;
          vEmissive = aAttr.x;
          vAlphaCut = aAttr.y;
          gl_Position = uViewProj * wp;
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vNrm;
        in vec2 vUv;
        in float vEmissive;
        in float vAlphaCut;
        uniform sampler2D uTex;
        ${PV.PBR_GLSL}
        out vec4 fragColor;
        void main() {
          vec4 tx = texture(uTex, vUv);
          if (vAlphaCut > 0.5 && tx.a < 0.15) discard;
          vec3 N = normalize(vNrm);
          vec3 V = normalize(uCamPos - vWorldPos);
          vec3 lit = evalPBR(vWorldPos, N, V, tx.rgb, 0.28, 0.04, 0.98, 0.12, 0.92);
          lit += tx.rgb * 0.28;
          vec3 col = mix(lit, tx.rgb * 1.18, clamp(vEmissive, 0.0, 1.0));
          fragColor = vec4(col, vAlphaCut > 0.5 ? tx.a : 1.0);
        }
      `);
    }

    updateTelemetry(rpmNorm, gear, speedKmh, boosting, simTime, sectorCount) {
      const ctx = this.dashCtx;
      if (ctx) {
        // Top Redline Shift-Light LED Strip (flashes vivid cyan/amber/crimson above 84% RPM!)
        const shiftActive = rpmNorm > 0.84;
        ctx.fillStyle = '#07090d'; ctx.fillRect(0, 0, 1024, 512);
        const grad = ctx.createRadialGradient(460, 260, 60, 460, 260, 520);
        grad.addColorStop(0, 'rgba(30, 46, 62, 0.20)'); grad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 512);
        ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 4; ctx.strokeRect(18, 18, 988, 476);
        for (let si = 0; si < 10; si++) {
          const lit = rpmNorm >= (0.58 + si * 0.04);
          const sc = si < 4 ? '#22c55e' : (si < 7 ? '#f59e0b' : '#ef4444');
          ctx.beginPath(); ctx.arc(212 + si * 66, 54, 11, 0, Math.PI * 2);
          ctx.fillStyle = lit ? sc : '#1a2230';
          if (shiftActive && si >= 7) ctx.fillStyle = '#ff2a2a';
          ctx.fill();
        }

        const cx = 415, cy = 355, rOuter = 265, rInner = 218;
        const startAng = Math.PI * 1.04, endAng = Math.PI * 1.88, totalSegs = 36;
        const activeSegs = Math.round(Math.max(0.08, Math.min(1.0, rpmNorm)) * totalSegs);
        for (let i = 0; i < totalSegs; i++) {
          const f0 = i / totalSegs, f1 = (i + 0.74) / totalSegs;
          const a0 = startAng + (endAng - startAng) * f0, a1 = startAng + (endAng - startAng) * f1;
          let segCol = '#1c2430';
          if (i < activeSegs) segCol = f0 < 0.52 ? '#34d399' : (f0 < 0.78 ? '#fbbf24' : '#ef4444');
          ctx.beginPath(); ctx.arc(cx, cy, rOuter, a0, a1); ctx.arc(cx, cy, rInner, a1, a0, true); ctx.closePath();
          ctx.fillStyle = segCol; ctx.fill();
        }
        ctx.font = '700 28px Consolas, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let n = 1; n <= 8; n++) {
          const a = startAng + 0.05 + ((n - 1) / 7) * (endAng - startAng - 0.08);
          ctx.fillStyle = n >= 7 ? '#f87171' : '#cbd5e1';
          ctx.fillText(String(n), cx + Math.cos(a) * (rInner - 28), cy + Math.sin(a) * (rInner - 28));
        }
        ctx.fillStyle = '#ffffff'; ctx.font = '900 185px Arial, sans-serif'; ctx.fillText(String(gear), 430, 290);
        ctx.fillStyle = '#94a3b8'; ctx.font = '700 22px Consolas, monospace'; ctx.fillText('SEQ GEAR', 430, 398);

        ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)'; ctx.lineWidth = 3; ctx.strokeRect(595, 290, 225, 130);
        ctx.fillStyle = '#f8fafc'; ctx.font = '800 84px Consolas, monospace'; ctx.textAlign = 'right';
        ctx.fillText(String(Math.round(speedKmh)), 802, 355);
        ctx.fillStyle = '#94a3b8'; ctx.font = '700 26px Arial, sans-serif'; ctx.fillText('km/h', 802, 404);

        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.strokeRect(720, 145, 36, 120);
        const barH = Math.round(112 * Math.min(1, rpmNorm * 1.1));
        ctx.fillStyle = boosting ? '#f97316' : '#22c55e';
        ctx.fillRect(724, 145 + (116 - barH), 28, barH);
        ctx.fillStyle = '#94a3b8'; ctx.font = '700 18px Consolas, monospace'; ctx.textAlign = 'center'; ctx.fillText('THR', 738, 128);

        const barVal = (0.45 + rpmNorm * (boosting ? 1.85 : 1.40)).toFixed(2);
        ctx.fillStyle = boosting ? '#fb923c' : '#38bdf8'; ctx.font = '700 28px Consolas, monospace'; ctx.textAlign = 'left';
        ctx.fillText(barVal, 605, 198);
        ctx.fillStyle = '#64748b'; ctx.font = '700 18px Consolas, monospace'; ctx.fillText('BAR', 605, 226);

        const leds = [
          { y: 155, col: '#f59e0b', txt: 'ALS' }, { y: 215, col: '#ef4444', txt: 'OIL' },
          { y: 275, col: '#f97316', txt: 'BAT' }, { y: 335, col: '#22c55e', txt: 'DIF' }, { y: 395, col: '#38bdf8', txt: 'TC' },
        ];
        for (const led of leds) {
          ctx.beginPath(); ctx.arc(890, led.y, 13, 0, Math.PI * 2); ctx.fillStyle = led.col; ctx.fill();
          ctx.fillStyle = '#94a3b8'; ctx.font = '700 18px Consolas, monospace'; ctx.fillText(led.txt, 914, led.y + 1);
        }
        ctx.fillStyle = '#0f172a'; ctx.fillRect(36, 438, 952, 42);
        const tSec = Math.max(0, simTime || 0);
        const mm = String(Math.floor(tSec / 60)).padStart(2, '0');
        const ss = (tSec % 60).toFixed(1).padStart(4, '0');
        const secTag = `SS${String(sectorCount || 1).padStart(2, '0')}`;
        const waterC = Math.round(86 + rpmNorm * 7 + (boosting ? 4 : 0));
        const oilC = Math.round(98 + rpmNorm * 11 + (boosting ? 5 : 0));
        const fuelL = Math.max(8.5, 42.0 - tSec * 0.045).toFixed(1);
        ctx.fillStyle = '#38bdf8'; ctx.font = '700 22px Consolas, monospace'; ctx.fillText(`${secTag}  ${mm}:${ss}`, 54, 460);
        ctx.fillStyle = '#94a3b8'; ctx.fillText(`WATER ${waterC}°C   OIL ${oilC}°C   FUEL ${fuelL}L`, 340, 460);

        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.dashTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.dashCanvas);
      }
      const og = this.oledCtx;
      if (og) {
        og.fillStyle = '#06121c'; og.fillRect(0, 0, 128, 48);
        og.fillStyle = boosting ? '#fb923c' : '#38bdf8';
        og.font = '900 26px Consolas, monospace'; og.textAlign = 'center'; og.textBaseline = 'middle';
        const rpmK = (1.6 + rpmNorm * 6.4).toFixed(1);
        og.fillText(`G${gear} ${rpmK}K`, 64, 25);
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.oledTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.oledCanvas);
      }
    }

    draw(renderer, car, time, sectorCount) {
      const gl = this.gl;
      if (!this._dtReuse) this._dtReuse = {};
      const dtInfo = PV.getDrivetrainTelemetry ? PV.getDrivetrainTelemetry(car, this._dtReuse) : { kmh: (car.speed || 0) * 3.6, gearLabel: '4', rpmNorm: 0.55 };
      const kmh = Math.round(dtInfo.kmh);
      const gear = dtInfo.gearLabel;
      const rpmNorm = dtInfo.rpmNorm;
      if (gear !== this._lastGear) { this._lastGear = gear; this._shiftPulse = 1.0; }
      this._shiftPulse *= 0.86;
      const hbTarget = (car.isBraking || Math.abs(car.driftAngle || 0) > 0.24) ? 0.28 : 0.0;
      this._hbPull += (hbTarget - this._hbPull) * 0.22;

      // Dirty-checked telemetry upload (zero redundant 1024x512 canvas redraws when unchanged!)
      const dirty = (this._lastKmh !== kmh) || (this._lastGearTex !== gear) || (Math.abs((this._lastRpmTex || 0) - rpmNorm) > 0.02) || (Math.floor((time || 0) * 5) !== this._lastTimeTick);
      if (dirty && (this._dashFrame++ % 3) === 0) {
        this._lastKmh = kmh; this._lastGearTex = gear; this._lastRpmTex = rpmNorm; this._lastTimeTick = Math.floor((time || 0) * 5);
        this.updateTelemetry(rpmNorm, gear, kmh, !!car.boosting, time, sectorCount);
      }

      // Compute root matrix = car.modelMat * T(0, yOff, zOff) * Ry(PI)
      PV.M4.multiply(this._rootMat, car.modelMat, this._v4AlignMat);

      // 1. Solid PBR Pass
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      const sp = this.solidProg;
      gl.useProgram(sp.prog);
      gl.uniformMatrix4fv(sp.u.uViewProj, false, renderer.vpMat);
      renderer.bindSharedPBRUniforms(sp.u, time);

      // Static cockpit shell/dash/console/rollcage/doors/pedals/extinguisher
      gl.uniformMatrix4fv(sp.u.uModel, false, this._rootMat);
      gl.bindVertexArray(this.staticMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.staticMesh.count, this.staticMesh.indexType, 0);

      // Animated APEX-R Steering Wheel (pivot at wheelCenter, tilted by wheelTiltX, rotated around Z by steerInput)
      const steerRad = -(car.steerInput || 0) * 1.65;
      PV.M4.fromTRS(this._tmpA, C.wheelCenter, 0, C.wheelTiltX, 0, 1, 1, 1);
      PV.M4.fromTRS(this._tmpB, [0, 0, 0], 0, 0, steerRad, 1, 1, 1);
      PV.M4.multiply(this._subMat, this._tmpA, this._tmpB);
      PV.M4.multiply(this._tmpA, this._rootMat, this._subMat);
      gl.uniformMatrix4fv(sp.u.uModel, false, this._tmpA);
      gl.bindVertexArray(this.wheelSolidMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.wheelSolidMesh.count, this.wheelSolidMesh.indexType, 0);

      // Animated Sequential Shifter Lever
      PV.M4.fromTRS(this._subMat, [C.shifterPos[0], C.tunnelTopY + 0.032, C.shifterPos[2]], 0, 0.08 + this._shiftPulse * 0.14, -0.05, 1, 1, 1);
      PV.M4.multiply(this._tmpB, this._rootMat, this._subMat);
      gl.uniformMatrix4fv(sp.u.uModel, false, this._tmpB);
      gl.bindVertexArray(this.shifterMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.shifterMesh.count, this.shifterMesh.indexType, 0);

      // Animated Hydraulic Handbrake Lever
      PV.M4.fromTRS(this._subMat, [C.handbrakePos[0], C.tunnelTopY + 0.054, C.handbrakePos[2] + 0.005], 0, 0.14 + this._hbPull, 0, 1, 1, 1);
      PV.M4.multiply(this._tmpB, this._rootMat, this._subMat);
      gl.uniformMatrix4fv(sp.u.uModel, false, this._tmpB);
      gl.bindVertexArray(this.handbrakeMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.handbrakeMesh.count, this.handbrakeMesh.indexType, 0);

      // 2. Textured Screens & Motorsport Decals Pass (LCD, Tablet, Gauge, Plaques, Wheel Buttons & OLED)
      const dp = this.decalProg;
      gl.useProgram(dp.prog);
      gl.uniformMatrix4fv(dp.u.uViewProj, false, renderer.vpMat);
      renderer.bindSharedPBRUniforms(dp.u, time);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);

      // Static console/tablet/gauge/mirror/cage decals
      gl.uniformMatrix4fv(dp.u.uModel, false, this._rootMat);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.consoleAtlasTex); gl.uniform1i(dp.u.uTex, 0);
      gl.bindVertexArray(this.consoleDecalsMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.consoleDecalsMesh.count, this.consoleDecalsMesh.indexType, 0);

      // Live Digital Instrument Cluster LCD
      gl.bindTexture(gl.TEXTURE_2D, this.dashTex);
      gl.bindVertexArray(this.dashLcdMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.dashLcdMesh.count, this.dashLcdMesh.indexType, 0);

      // Steering Wheel APEX-R logo + 8 glowing backlit buttons + Live OLED (using wheel world matrix _tmpA!)
      gl.uniformMatrix4fv(dp.u.uModel, false, this._tmpA);
      gl.bindTexture(gl.TEXTURE_2D, this.wheelAtlasTex);
      gl.bindVertexArray(this.wheelDecalMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.wheelDecalMesh.count, this.wheelDecalMesh.indexType, 0);

      gl.bindTexture(gl.TEXTURE_2D, this.oledTex);
      gl.bindVertexArray(this.wheelOledMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.wheelOledMesh.count, this.wheelOledMesh.indexType, 0);

      // 3. Translucent Polycarbonate Left Sliding Window Pane
      gl.useProgram(sp.prog);
      gl.uniformMatrix4fv(sp.u.uModel, false, this._rootMat);
      gl.depthMask(false); gl.disable(gl.CULL_FACE);
      gl.bindVertexArray(this.glassMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.glassMesh.count, this.glassMesh.indexType, 0);
      gl.depthMask(true); gl.enable(gl.CULL_FACE); gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    }
  };
})(window);
