// === trees_foliage.js ===
// Item 1 & 6: Deep 3-Step Cel-Shaded Greens (#4a7a3a / #2f5a26 / #16331f, ZERO neon yellow-green!),
// 3 Variants per Species (Pine 6-tier x3, Broadleaf 4-lobe x3, White Birch x3), Anti-Repetition Placement,
// Tree-Base Shrubs, 3-Cut Volumetric Boulders (3 minerals, moss on top & back-lit only), Roadside Timber Posts & Chevrons
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});
  const GOLDEN_ANGLE = 2.399963229728653;
  const hash = PV.hash;
  const mergeParts = (parts) => PV.mergeParts(parts, 'colors');

  function makeCurvedTube(pts, r0, r1, segs, barkCol) {
    const pos = [], nrm = [], uv = [], col = [], idx = [];
    const bc = barkCol || [0.24, 0.18, 0.14];
    const nPts = pts.length;
    // True N-point Catmull-Rom / quadratic spline with Parallel Transport 3D circular cross-sections!
    // Eliminates truncated 4-5pt trunks (floating branches!) AND pinched horizontal limbs.
    const evalSpline = (t) => {
      if (nPts === 2) {
        return [
          pts[0][0] + (pts[1][0] - pts[0][0]) * t,
          pts[0][1] + (pts[1][1] - pts[0][1]) * t,
          pts[0][2] + (pts[1][2] - pts[0][2]) * t,
        ];
      }
      if (nPts === 3) {
        const it = 1 - t;
        return [
          it*it*pts[0][0] + 2*it*t*pts[1][0] + t*t*pts[2][0],
          it*it*pts[0][1] + 2*it*t*pts[1][1] + t*t*pts[2][1],
          it*it*pts[0][2] + 2*it*t*pts[1][2] + t*t*pts[2][2],
        ];
      }
      const segF = t * (nPts - 1);
      const idx0 = Math.min(nPts - 2, Math.floor(segF));
      const lt = segF - idx0;
      const p0 = pts[Math.max(0, idx0 - 1)];
      const p1 = pts[idx0];
      const p2 = pts[Math.min(nPts - 1, idx0 + 1)];
      const p3 = pts[Math.min(nPts - 1, idx0 + 2)];
      const t2 = lt * lt, t3 = t2 * lt;
      const cr = (a, b, c, d) => 0.5 * ((2*b) + (-a + c)*lt + (2*a - 5*b + 4*c - d)*t2 + (-a + 3*b - 3*c + d)*t3);
      return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
    };

    const steps = Math.max(6, (nPts - 1) * 4);
    const centers = [];
    for (let k = 0; k <= steps; k++) centers.push(evalSpline(k / steps));

    let prevN = null;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const c = centers[k];
      const cPrev = centers[Math.max(0, k - 1)];
      const cNext = centers[Math.min(steps, k + 1)];
      let tx = cNext[0] - cPrev[0], ty = cNext[1] - cPrev[1], tz = cNext[2] - cPrev[2];
      const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let nx, ny, nz;
      if (!prevN) {
        const rx = Math.abs(ty) > 0.92 ? 1 : 0, ry = Math.abs(ty) > 0.92 ? 0 : 1, rz = 0;
        nx = ty * rz - tz * ry; ny = tz * rx - tx * rz; nz = tx * ry - ty * rx;
      } else {
        // Parallel transport previous normal to stay twist-free
        const dot = prevN[0]*tx + prevN[1]*ty + prevN[2]*tz;
        nx = prevN[0] - tx * dot; ny = prevN[1] - ty * dot; nz = prevN[2] - tz * dot;
      }
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      prevN = [nx, ny, nz];
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      const flare = t < 0.18 ? (1.0 + (0.18 - t) * 1.8) : 1.0;
      const r = (r0 + (r1 - r0) * t) * flare;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const dx = nx * ca + bx * sa, dy = ny * ca + by * sa, dz = nz * ca + bz * sa;
        pos.push(c[0] + dx * r, c[1] + dy * r, c[2] + dz * r);
        nrm.push(dx, dy, dz);
        uv.push(i / segs, t * 3.5);
        col.push(bc[0], bc[1], bc[2]);
      }
    }
    const stride = segs + 1;
    for (let k = 0; k < steps; k++) for (let i = 0; i < segs; i++) {
      const a = k * stride + i, b = a + stride;
      idx.push(a, a+1, b, a+1, b+1, b);
    }
    return { positions: pos, normals: nrm, uvs: uv, colors: col, indices: idx };
  }

  function makePerturbedCore(cx, cy, cz, rx, ry, rz, seed, coreCol) {
    const segU = 8, segV = 6, cc = coreCol || [0.04, 0.10, 0.07];
    const pos = [], nrm = [], uv = [], col = [], idx = [];
    for (let v = 0; v <= segV; v++) {
      const phi = (v / segV) * Math.PI, sp = Math.sin(phi), cp = Math.cos(phi);
      for (let u = 0; u <= segU; u++) {
        const th = (u / segU) * Math.PI * 2;
        const dx = sp * Math.cos(th), dy = cp, dz = sp * Math.sin(th);
        const w = 1.0 + 0.14 * Math.sin(th * 3 + seed) * Math.cos(phi * 2 - seed);
        pos.push(cx + dx*rx*w, cy + dy*ry*w, cz + dz*rz*w);
        nrm.push(dx, dy, dz); uv.push(u/segU, v/segV); col.push(cc[0], cc[1], cc[2]);
      }
    }
    const stride = segU + 1;
    for (let v = 0; v < segV; v++) for (let u = 0; u < segU; u++) {
      const a = v * stride + u, b = a + stride;
      idx.push(a, a+1, b, a+1, b+1, b);
    }
    return { positions: pos, normals: nrm, uvs: uv, colors: col, indices: idx };
  }

  // Stores inner canopy occlusion factor in cardOff.z (0 = deep core dark, 1 = outer sunlit shell)
  function pushClusterCards(clusters, trunkParts, coreCol, seedOff, cardSizeBase) {
    const cardPos=[], cardBall=[], cardUv=[], cardOff=[], cardIdx=[];
    let vBase = 0;
    for (let ci = 0; ci < clusters.length; ci++) {
      const [cx,cy,cz,rx,ry,rz,nCards] = clusters[ci];
      if (coreCol) trunkParts.push(makePerturbedCore(cx, cy, cz, rx*0.64, ry*0.64, rz*0.64, ci*3.1+seedOff, coreCol));
      for (let i = 0; i < nCards; i++) {
        const f=(i+0.5)/nCards, y=1-2*f, rad=Math.sqrt(Math.max(0,1-y*y)), th=i*GOLDEN_ANGLE+ci*1.3+seedOff;
        const bx=Math.cos(th)*rad, by=y, bz=Math.sin(th)*rad;
        const shellDist = 0.72 + hash(ci*37+i+seedOff)*0.34;
        const px=cx+bx*rx*shellDist, py=cy+by*ry*shellDist, pz=cz+bz*rz*shellDist;
        const cs=(cardSizeBase + hash(ci*13+i+seedOff)*0.48)*(0.74+(1-ci*0.08)*0.36);
        const rot=hash(ci*53+i+seedOff)*Math.PI*2, cr=Math.cos(rot), sr=Math.sin(rot);
        const quadId = Math.floor(hash(ci*71+i*11+seedOff) * 4);
        const u0 = (quadId % 2) * 0.5, v0 = Math.floor(quadId / 2) * 0.5;
        const corners=[[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]];
        const uvs=[[u0,v0+0.5],[u0+0.5,v0+0.5],[u0+0.5,v0],[u0,v0]];
        const nl=Math.hypot(bx, by*0.85+0.15, bz)||1;
        const innerAO = Math.max(0.25, Math.min(1.0, (shellDist - 0.52) * 1.45 + (by * 0.5 + 0.5) * 0.35));
        for (let k=0;k<4;k++) {
          cardPos.push(px,py,pz); cardBall.push(bx/nl,(by*0.85+0.15)/nl,bz/nl); cardUv.push(uvs[k][0],uvs[k][1]);
          cardOff.push((corners[k][0]*cr-corners[k][1]*sr)*cs, (corners[k][0]*sr+corners[k][1]*cr)*cs, innerAO);
        }
        cardIdx.push(vBase,vBase+1,vBase+2, vBase,vBase+2,vBase+3); vBase+=4;
      }
    }
    return { trunkGeo: mergeParts(trunkParts), cardsGeo: { positions:cardPos, normals:cardBall, uvs:cardUv, colors:cardOff, indices:cardIdx } };
  }

  // Build crisp 3D Alpine Spruce/Pine with drooping bough whorls & feathery needle cards (ZERO solid snowman spheres!)
  function buildPineVariant(v) {
    const hScale = v === 0 ? 1.28 : (v === 1 ? 1.08 : 0.94);
    const wScale = v === 0 ? 0.88 : (v === 1 ? 1.06 : 1.24);
    const leanX  = v === 0 ? 0.12 : (v === 1 ? -0.16 : 0.18);
    const leanZ  = v === 0 ? 0.08 : (v === 1 ? -0.10 : 0.06);
    const seedBase = v * 29.7 + 3.1;
    const trunkParts = [
      makeCurvedTube([[0, -1.2, 0], [leanX * 0.6, 7.2 * hScale, leanZ * 0.5], [leanX * 0.25, 15.6 * hScale, -leanZ * 0.2]], 0.36 * wScale, 0.035, 7),
    ];

    const cardPos = [], cardBall = [], cardUv = [], cardOff = [], cardIdx = [];
    let vBase = 0;

    // 11 irregular drooping conifer whorls from lower skirt (y=2.3m) to sharp alpine spire (y=15.4m)
    const tiers = 11;
    for (let t = 0; t < tiers; t++) {
      const u = t / (tiers - 1); // 0 = bottom, 1 = spire tip
      const ty = (2.3 + u * 13.0) * hScale;
      // Concave-conical spruce profile with irregular tier lengths
      const tierJitter = 0.82 + hash(seedBase + t * 17.3) * 0.36;
      const tierRad = (Math.pow(1.0 - u, 1.08) * 3.45 + 0.24) * wScale * tierJitter;
      const nBoughs = Math.max(4, Math.round(9 - u * 5));
      const tx = leanX * (0.6 * (1 - Math.abs(u - 0.5) * 1.4));
      const tz = leanZ * (0.5 * (1 - u));

      for (let b = 0; b < nBoughs; b++) {
        const ang = (b / nBoughs) * Math.PI * 2 + t * GOLDEN_ANGLE + (hash(seedBase + t * 41 + b * 7) - 0.5) * 0.42;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        const bLen = tierRad * (0.78 + hash(seedBase + t * 53 + b * 11) * 0.42);
        const droop = (1.0 - u * 0.72) * (0.55 + hash(seedBase + t * 19 + b * 5) * 0.38);

        // Trim redundant inner 3D branch sub-tubes (baked into richer 2x2 twig+needle atlas -> faster GPU + fuller canopy!)
        if (t < 5 && b % 3 === 0) {
          trunkParts.push(makeCurvedTube(
            [[tx, ty, tz], [tx + ca * bLen * 0.52, ty - droop * 0.42, tz + sa * bLen * 0.52], [tx + ca * bLen * 0.92, ty - droop * 0.88, tz + sa * bLen * 0.92]],
            0.095 * (1 - u * 0.6), 0.025, 4
          ));
        }

        // Place 2-3 enlarged, richer feathery bough frond cards along each drooping bough
        const steps = u > 0.75 ? 1 : (u > 0.45 ? 2 : 3);
        for (let st = 0; st < steps; st++) {
          const sf = steps === 1 ? 0.65 : (0.36 + (st / (steps - 1)) * 0.66);
          const px = tx + ca * bLen * sf;
          const py = ty - droop * sf * sf + (hash(seedBase + t * 71 + b * 13 + st) - 0.45) * 0.28;
          const pz = tz + sa * bLen * sf;
          const cs = (1.38 + (1.0 - u) * 1.08) * (0.82 + hash(seedBase + t * 31 + b * 17 + st) * 0.38) * (st === steps - 1 ? 0.92 : 1.06);
          const rot = (hash(seedBase + t * 89 + b * 23 + st) - 0.5) * 1.15;
          const cr = Math.cos(rot), sr = Math.sin(rot);
          const quadId = Math.floor(hash(seedBase + t * 61 + b * 29 + st * 5) * 4);
          const u0 = (quadId % 2) * 0.5, v0 = Math.floor(quadId / 2) * 0.5;
          const corners = [[-0.55, -0.44], [0.55, -0.44], [0.55, 0.44], [-0.55, 0.44]];
          const uvs = [[u0, v0 + 0.5], [u0 + 0.5, v0 + 0.5], [u0 + 0.5, v0], [u0, v0]];
          // Normal points outward + upward for crisp alpine sunlit tips & deep shadowed undersides
          const nx = ca * 0.72, ny = 0.42 + u * 0.38 - (1 - sf) * 0.25, nz = sa * 0.72;
          const nl = Math.hypot(nx, ny, nz) || 1;
          const innerAO = Math.max(0.28, Math.min(1.0, 0.34 + sf * 0.48 + u * 0.28));
          for (let k = 0; k < 4; k++) {
            cardPos.push(px, py, pz);
            cardBall.push(nx / nl, ny / nl, nz / nl);
            cardUv.push(uvs[k][0], uvs[k][1]);
            cardOff.push((corners[k][0] * cr - corners[k][1] * sr) * cs, (corners[k][0] * sr + corners[k][1] * cr) * cs, innerAO);
          }
          cardIdx.push(vBase, vBase + 1, vBase + 2, vBase, vBase + 2, vBase + 3);
          vBase += 4;
        }
      }
    }
    // Sharp spire tip crown card
    const tipY = 15.6 * hScale;
    const tipCorners = [[-0.36, -0.5], [0.36, -0.5], [0.36, 0.5], [-0.36, 0.5]];
    const tipUvs = [[0, 0.5], [0.5, 0.5], [0.5, 0], [0, 0]];
    for (let k = 0; k < 4; k++) {
      cardPos.push(leanX * 0.25, tipY, -leanZ * 0.2);
      cardBall.push(0, 1, 0);
      cardUv.push(tipUvs[k][0], tipUvs[k][1]);
      cardOff.push(tipCorners[k][0] * 1.1, tipCorners[k][1] * 1.3, 1.0);
    }
    cardIdx.push(vBase, vBase + 1, vBase + 2, vBase, vBase + 2, vBase + 3);
    return { trunkGeo: mergeParts(trunkParts), cardsGeo: { positions: cardPos, normals: cardBall, uvs: cardUv, colors: cardOff, indices: cardIdx } };
  }

  // 3 Distinct Graceful Multi-Branching Broadleaf (Mountain Maple/Oak) & White Birch Variants (ZERO solid core spheres!)
  function buildBroadleafVariant(isBirch, v) {
    const barkC = isBirch ? [0.82, 0.80, 0.76] : [0.22, 0.16, 0.12];
    const hM = v === 0 ? 1.05 : (v === 1 ? 1.20 : 0.94);
    const spread = v === 0 ? 1.04 : (v === 1 ? 0.90 : 1.22);
    const lean = (v - 1) * 0.26;
    const trunkParts = [
      makeCurvedTube([[0, -1.0, 0], [lean * 0.7, 3.0 * hM, 0.12], [lean * 0.4, 6.2 * hM, 0.05]], isBirch ? 0.22 : 0.34, isBirch ? 0.075 : 0.13, 7, barkC),
      makeCurvedTube([[lean * 0.5, 2.8 * hM, 0.08], [0.95 * spread, 4.4 * hM, 0.48], [1.85 * spread, 5.8 * hM, 0.82]], 0.12, 0.04, 5, barkC),
      makeCurvedTube([[lean * 0.5, 3.2 * hM, 0.04], [-0.88 * spread, 4.7 * hM, -0.40], [-1.72 * spread, 6.1 * hM, -0.78]], 0.11, 0.04, 5, barkC),
      makeCurvedTube([[lean * 0.4, 3.8 * hM, 0.06], [0.24, 5.2 * hM, -0.82 * spread], [0.46, 6.5 * hM, -1.55 * spread]], 0.10, 0.035, 5, barkC),
      makeCurvedTube([[lean * 0.4, 4.1 * hM, 0.04], [-0.32, 5.5 * hM, 0.88 * spread], [-0.58, 6.8 * hM, 1.52 * spread]], 0.09, 0.035, 5, barkC),
    ];
    if (isBirch) {
      // Twin-stem graceful birch fork for natural Nordic/Alpine birch look
      trunkParts.push(makeCurvedTube([[0.12, -0.8, -0.08], [0.52, 2.6 * hM, -0.28], [0.92, 5.8 * hM, -0.42]], 0.16, 0.05, 6, barkC));
    }
    // 6 airy sculpted foliage canopy lobes (NO solid ball cores — airy painterly leaf clusters!)
    const clusters = [
      [lean * 0.3,       6.8 * hM,  0.00, 2.35 * spread, 1.58, 2.25 * spread, 40],
      [ 1.75 * spread,   5.8 * hM,  0.76, 1.84 * spread, 1.28, 1.76 * spread, 30],
      [-1.65 * spread,   6.0 * hM, -0.72, 1.86 * spread, 1.30, 1.76 * spread, 30],
      [ 0.42,            6.5 * hM, -1.42 * spread, 1.68 * spread, 1.20, 1.64 * spread, 26],
      [-0.52,            6.7 * hM,  1.40 * spread, 1.66 * spread, 1.18, 1.62 * spread, 26],
      [ 0.18 * (v - 1),  8.0 * hM, -0.25, 1.56 * spread, 1.12, 1.52 * spread, 22],
    ];
    return pushClusterCards(clusters, trunkParts, null, (isBirch ? 50.0 : 10.0) + v * 17.3, isBirch ? 1.44 : 1.58);
  }

  function buildShrubPrototype() {
    // Multi-stemmed woody alpine bush (ZERO solid core spheres — layered airy foliage mounds!)
    const bark = [0.20, 0.14, 0.10];
    const trunkParts = [
      makeCurvedTube([[0, -0.25, 0], [0.18, 0.32, 0.10], [0.42, 0.72, 0.24]], 0.055, 0.02, 5, bark),
      makeCurvedTube([[0, -0.25, 0], [-0.22, 0.28, -0.14], [-0.48, 0.66, -0.28]], 0.052, 0.02, 5, bark),
      makeCurvedTube([[0, -0.25, 0], [0.06, 0.38, -0.22], [0.16, 0.78, -0.45]], 0.048, 0.018, 5, bark),
      makeCurvedTube([[0, -0.25, 0], [-0.14, 0.30, 0.24], [-0.30, 0.62, 0.48]], 0.045, 0.018, 5, bark),
    ];
    const clusters = [
      [ 0.00, 0.76,  0.00, 1.24, 0.76, 1.20, 30],
      [ 0.68, 0.54,  0.34, 0.92, 0.58, 0.88, 22],
      [-0.58, 0.50, -0.32, 0.88, 0.56, 0.86, 20],
      [ 0.14, 0.48, -0.58, 0.80, 0.50, 0.78, 16],
    ];
    return pushClusterCards(clusters, trunkParts, null, 73.1, 0.86);
  }

  // Restored Demo-Style Faceted Sculpted Alpine Basalt Boulder with 3 Distinct Variants (ZERO duplicate rocks!)
  function buildThreeCutRockGeo(variant) {
    const v = variant || 0;
    const segU = 18, segV = 12, rawPos = [], idx = [];
    const cutsList = [
      [{ n:[0.72, 0.56, 0.40], d:0.76 }, { n:[-0.68, 0.52, -0.52], d:0.74 }, { n:[0.24, 0.36, -0.90], d:0.78 }, { n:[-0.30, 0.84, 0.45], d:0.66 }, { n:[0.82, -0.18, -0.54], d:0.96 }, { n:[-0.80, -0.10, 0.58], d:0.94 }],
      [{ n:[-0.75, 0.48, 0.44], d:0.70 }, { n:[0.62, 0.64, -0.45], d:0.72 }, { n:[-0.18, 0.42, 0.88], d:0.76 }, { n:[0.38, 0.78, -0.48], d:0.64 }, { n:[-0.84, -0.12, -0.52], d:0.92 }],
      [{ n:[0.58, 0.70, -0.42], d:0.68 }, { n:[-0.78, 0.38, 0.48], d:0.74 }, { n:[0.42, 0.32, 0.85], d:0.74 }, { n:[-0.22, 0.88, -0.42], d:0.62 }, { n:[0.76, -0.14, 0.62], d:0.90 }],
    ];
    const cuts = cutsList[v % 3];
    const sxM = v === 0 ? 1.48 : (v === 1 ? 1.18 : 1.32);
    const syM = v === 0 ? 0.84 : (v === 1 ? 1.06 : 0.76);
    const szM = v === 0 ? 1.24 : (v === 1 ? 1.38 : 1.08);
    const ph = v * 2.1;
    for (let vIdx = 0; vIdx <= segV; vIdx++) {
      const phi = (vIdx/segV)*Math.PI, sp = Math.sin(phi), cp = Math.cos(phi);
      for (let u = 0; u <= segU; u++) {
        const th = (u/segU)*Math.PI*2;
        let x = sp*Math.cos(th), y = cp, z = sp*Math.sin(th);
        const strata = Math.sin(y * 9.5 + x * 2.2 + ph) * 0.11;
        const crag = Math.abs(Math.sin(x * 3.8 + z * 2.9 + ph)) * 0.24 + Math.cos(x * 6.4 - z * 5.1 - ph) * 0.12;
        const r = 1.10 + crag + strata;
        x *= r * sxM; y *= r * syM; z *= r * szM;
        for (const c of cuts) {
          const proj = x*c.n[0]+y*c.n[1]+z*c.n[2];
          if (proj > c.d) { const df = proj-c.d; x-=c.n[0]*df*0.98; y-=c.n[1]*df*0.98; z-=c.n[2]*df*0.98; }
        }
        if (y < -0.68) y = -0.68;
        rawPos.push(x, y + 0.12, z);
      }
    }
    const stride = segU + 1;
    for (let v = 0; v < segV; v++) for (let u = 0; u < segU; u++) { const a = v*stride+u, b = a+stride; idx.push(a,a+1,b, a+1,b+1,b); }
    const nrm = new Float32Array(rawPos.length);
    for (let i = 0; i < idx.length; i += 3) {
      const a=idx[i]*3, b=idx[i+1]*3, c=idx[i+2]*3;
      const ux=rawPos[b]-rawPos[a], uy=rawPos[b+1]-rawPos[a+1], uz=rawPos[b+2]-rawPos[a+2];
      const vx=rawPos[c]-rawPos[a], vy=rawPos[c+1]-rawPos[a+1], vz=rawPos[c+2]-rawPos[a+2];
      const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      nrm[a]+=nx; nrm[a+1]+=ny; nrm[a+2]+=nz; nrm[b]+=nx; nrm[b+1]+=ny; nrm[b+2]+=nz; nrm[c]+=nx; nrm[c+1]+=ny; nrm[c+2]+=nz;
    }
    const uv=[], col=[];
    for (let i = 0; i < rawPos.length; i += 3) {
      const l = Math.hypot(nrm[i], nrm[i+1], nrm[i+2]) || 1;
      nrm[i]/=l; nrm[i+1]/=l; nrm[i+2]/=l;
      uv.push(rawPos[i]*0.4, rawPos[i+1]*0.4); col.push(0.55, 0.58, 0.56);
    }
    return { positions: rawPos, normals: Array.from(nrm), uvs: uv, colors: col, indices: idx };
  }

  function buildPebbleGeo() {
    const segU = 8, segV = 6, rawPos = [], idx = [];
    for (let v = 0; v <= segV; v++) {
      const phi = (v/segV)*Math.PI, sp = Math.sin(phi), cp = Math.cos(phi);
      for (let u = 0; u <= segU; u++) {
        const th = (u/segU)*Math.PI*2;
        rawPos.push(sp*Math.cos(th)*0.22, cp*0.10, sp*Math.sin(th)*0.17);
      }
    }
    const stride = segU + 1;
    for (let v = 0; v < segV; v++) for (let u = 0; u < segU; u++) { const a = v*stride+u, b = a+stride; idx.push(a,a+1,b, a+1,b+1,b); }
    const nrm = [], uv = [], col = [];
    for (let i = 0; i < rawPos.length; i += 3) {
      const l = Math.hypot(rawPos[i], rawPos[i+1], rawPos[i+2]) || 1;
      nrm.push(rawPos[i]/l, rawPos[i+1]/l, rawPos[i+2]/l);
      uv.push(rawPos[i]*2.0, rawPos[i+2]*2.0);
      col.push(0.32, 0.34, 0.32);
    }
    return { positions: rawPos, normals: nrm, uvs: uv, colors: col, indices: idx };
  }

  function buildCliffSlabGeo() {
    // AAA High-Poly (28x20) Natural Layered Alpine Cliff Massif (organic weathered strata, ZERO sharp origami cones!)
    const segU = 20, segV = 14, rawPos = [], idx = [];
    for (let v = 0; v <= segV; v++) {
      const phi = (v / segV) * Math.PI, sp = Math.sin(phi), cp = Math.cos(phi);
      for (let u = 0; u <= segU; u++) {
        const th = (u / segU) * Math.PI * 2;
        let x = sp * Math.cos(th), y = cp, z = sp * Math.sin(th);
        // Organic isotropic 3D boulder fracture (ZERO periodic horizontal sin(y*9) bands that stripe snow!)
        const strata = Math.cos(x * 3.7 + z * 3.1 - y * 1.4) * 0.13 + Math.sin(x * 6.3 - z * 5.2 + y * 2.8) * 0.07 + Math.cos(z * 4.9 + y * 2.3) * 0.05;
        const shelf = 1.0 + strata;
        const baseWiden = y < 0.1 ? (1.0 + (0.1 - y) * 0.35) : (1.0 - y * 0.18);
        x *= 2.35 * shelf * baseWiden;
        y = y * 1.42 * (1.0 + Math.sin(th * 3.0) * 0.08);
        z *= 1.65 * shelf * baseWiden;
        if (y < -1.15) y = -1.15;
        rawPos.push(x, y + 0.35, z);
      }
    }
    const stride = segU + 1;
    for (let v = 0; v < segV; v++) for (let u = 0; u < segU; u++) { const a = v * stride + u, b = a + stride; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const nrm = new Float32Array(rawPos.length);
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const ux = rawPos[b] - rawPos[a], uy = rawPos[b + 1] - rawPos[a + 1], uz = rawPos[b + 2] - rawPos[a + 2];
      const vx = rawPos[c] - rawPos[a], vy = rawPos[c + 1] - rawPos[a + 1], vz = rawPos[c + 2] - rawPos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz;
      nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz;
      nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
    }
    const uv = [], col = [];
    for (let i = 0; i < rawPos.length; i += 3) {
      const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1;
      nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l;
      uv.push(rawPos[i] * 0.3, rawPos[i + 1] * 0.3);
      col.push(0.46, 0.49, 0.50);
    }
    return { positions: rawPos, normals: Array.from(nrm), uvs: uv, colors: col, indices: idx };
  }

  // Detailed Roadside Timber Bollard with Concrete Plinth Footing, Steel Cap & Dual Reflective Bands
  function buildBollardGeo() {
    const footing = makeCylPart(0, -0.35, 0.14, 0, 0.14, 0.11, 8, [0.26, 0.27, 0.28]);
    const post = makeCurvedTube([[0,-0.25,0],[0,0.48,0],[0,1.02,0]], 0.088, 0.078, 8, [0.24, 0.18, 0.13]);
    const bandW = makeCurvedTube([[0,0.76,0],[0,0.84,0],[0,0.90,0]], 0.084, 0.084, 8, [0.90, 0.90, 0.88]);
    const bandR = makeCurvedTube([[0,0.62,0],[0,0.68,0],[0,0.73,0]], 0.085, 0.085, 8, [0.86, 0.18, 0.12]);
    const cap = makeCylPart(0, 1.00, 1.08, 0, 0.095, 0.05, 8, [0.14, 0.15, 0.17]);
    return mergeParts([footing, post, bandW, bandR, cap]);
  }

  function buildChevronGeo() {
    const parts = [
      makeCylPart(0, -0.55, 0.18, 0, 0.16, 0.12, 8, [0.26, 0.28, 0.29]),
      makeCurvedTube([[0,-0.4,0],[0,0.75,0],[0,1.98,0]], 0.068, 0.062, 8, [0.22, 0.24, 0.26]),
      makeBoxPart(0, 1.62, -0.055, 0.92, 0.08, 0.06, [0.16, 0.18, 0.20]),
      makeBoxPart(0, 1.32, -0.055, 0.92, 0.08, 0.06, [0.16, 0.18, 0.20]),
      makeCylPart(0, 1.98, 2.12, 0, 0.075, 0.075, 8, [2.2, 1.45, 0.35]),
    ];
    const w=0.56, h=0.50, d=0.04, yc=1.62;
    parts.push({
      positions: [-w,yc-h,d, w,yc-h,d, w,yc+h,d, -w,yc+h,d,  w,yc-h,-d, -w,yc-h,-d, -w,yc+h,-d, w,yc+h,-d],
      normals:   [0,0,1,0,0,1,0,0,1,0,0,1,  0,0,-1,0,0,-1,0,0,-1,0,0,-1],
      uvs:       [0,1,1,1,1,0,0,0,  0,1,1,1,1,0,0,0],
      colors:    [1,1,1,1,1,1,1,1,1,1,1,1,  0.32,0.34,0.36,0.32,0.34,0.36,0.32,0.34,0.36,0.32,0.34,0.36],
      indices:   [0,1,2,0,2,3, 4,5,6,4,6,7],
    });
    return mergeParts(parts);
  }

  function makeBoxPart(cx, cy, cz, sx, sy, sz, col) {
    const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
    const faces = [
      { n:[0,0,1],  v:[[-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz]] },
      { n:[0,0,-1], v:[[hx,-hy,-hz],[-hx,-hy,-hz],[-hx,hy,-hz],[hx,hy,-hz]] },
      { n:[1,0,0],  v:[[hx,-hy,hz],[hx,-hy,-hz],[hx,hy,-hz],[hx,hy,hz]] },
      { n:[-1,0,0], v:[[-hx,-hy,-hz],[-hx,-hy,hz],[-hx,hy,hz],[-hx,hy,-hz]] },
      { n:[0,1,0],  v:[[-hx,hy,hz],[hx,hy,hz],[hx,hy,-hz],[-hx,hy,-hz]] },
      { n:[0,-1,0], v:[[-hx,-hy,-hz],[hx,-hy,-hz],[hx,-hy,hz],[-hx,-hy,hz]] },
    ];
    const pos = [], nrm = [], uv = [], c = [], idx = [];
    let b = 0;
    for (const f of faces) {
      for (let i = 0; i < 4; i++) {
        pos.push(cx + f.v[i][0], cy + f.v[i][1], cz + f.v[i][2]);
        nrm.push(f.n[0], f.n[1], f.n[2]);
        uv.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0);
        c.push(col[0], col[1], col[2]);
      }
      idx.push(b, b+1, b+2, b, b+2, b+3);
      b += 4;
    }
    return { positions: pos, normals: nrm, uvs: uv, colors: c, indices: idx };
  }

  function makeGableRoofPart(w, d, yBase, ridgeH, col, ox = 0, oz = 0) {
    // Solid 3D Curved-Eave Alpine Gable Roof with verified outward CCW winding, soffit underside & beveled fascia (ZERO backface culling!)
    const hw = w * 0.5, hd = d * 0.5;
    const thick = 0.22;
    const soffitCol = [col[0] * 0.62, col[1] * 0.58, col[2] * 0.55];
    const fasciaCol = [0.11, 0.08, 0.055];
    const pos = [], nrm = [], uv = [], c = [], idx = [];
    const addQ = (p0, p1, p2, p3, colUse, uv0, uv1, uv2, uv3) => {
      const b = pos.length / 3;
      const ux = p1[0]-p0[0], uy = p1[1]-p0[1], uz = p1[2]-p0[2];
      const vx = p2[0]-p0[0], vy = p2[1]-p0[1], vz = p2[2]-p0[2];
      let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx/=l; ny/=l; nz/=l;
      const pts = [p0, p1, p2, p3];
      const uvs = [uv0 || [0,0], uv1 || [1,0], uv2 || [1,1], uv3 || [0,1]];
      for (let i = 0; i < 4; i++) {
        pos.push(pts[i][0] + ox, pts[i][1], pts[i][2] + oz);
        nrm.push(nx, ny, nz);
        uv.push(uvs[i][0], uvs[i][1]);
        c.push(colUse[0], colUse[1], colUse[2]);
      }
      idx.push(b, b+1, b+2, b, b+2, b+3);
    };
    const addT = (p0, p1, p2, colUse) => {
      const b = pos.length / 3;
      const ux = p1[0]-p0[0], uy = p1[1]-p0[1], uz = p1[2]-p0[2];
      const vx = p2[0]-p0[0], vy = p2[1]-p0[1], vz = p2[2]-p0[2];
      let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx/=l; ny/=l; nz/=l;
      for (const p of [p0, p1, p2]) { pos.push(p[0] + ox,p[1],p[2] + oz); nrm.push(nx,ny,nz); uv.push(0,0); c.push(colUse[0],colUse[1],colUse[2]); }
      idx.push(b, b+1, b+2);
    };
    const yR = yBase + ridgeH;
    // Concave alpine flared eave curve: t=0 at eave (x=+-hw, y=yBase) -> t=1 at ridge (x=0, y=yR)
    const segs = 5;
    const curveY = (t) => yBase + ridgeH * (t * 0.78 + t * t * 0.22);
    const curveX = (t, side) => side * hw * (1.0 - t);

    for (let i = 0; i < segs; i++) {
      const t0 = i / segs, t1 = (i + 1) / segs;
      const y0 = curveY(t0), y1 = curveY(t1);
      // Left slope (-x side): CCW outward normal points (-x, +y, 0)
      const lx0 = curveX(t0, -1), lx1 = curveX(t1, -1);
      addQ([lx0, y0, hd], [lx1, y1, hd], [lx1, y1, -hd], [lx0, y0, -hd], col, [t0, 0], [t1, 0], [t1, 1], [t0, 1]);
      // Left soffit underside: outward normal points (+x, -y, 0)
      addQ([lx0, y0 - thick, -hd], [lx1, y1 - thick, -hd], [lx1, y1 - thick, hd], [lx0, y0 - thick, hd], soffitCol);
      // Left front & back bargeboard fascia edges
      addQ([lx0, y0 - thick, hd], [lx1, y1 - thick, hd], [lx1, y1, hd], [lx0, y0, hd], fasciaCol);
      addQ([lx1, y1 - thick, -hd], [lx0, y0 - thick, -hd], [lx0, y0, -hd], [lx1, y1, -hd], fasciaCol);

      // Right slope (+x side): CCW outward normal points (+x, +y, 0)
      const rx0 = curveX(t0, 1), rx1 = curveX(t1, 1);
      addQ([rx1, y1, hd], [rx0, y0, hd], [rx0, y0, -hd], [rx1, y1, -hd], col, [t1, 0], [t0, 0], [t0, 1], [t1, 1]);
      // Right soffit underside: outward normal points (-x, -y, 0)
      addQ([rx1, y1 - thick, -hd], [rx0, y0 - thick, -hd], [rx0, y0 - thick, hd], [rx1, y1 - thick, hd], soffitCol);
      // Right front & back bargeboard fascia edges
      addQ([rx1, y1 - thick, hd], [rx0, y0 - thick, hd], [rx0, y0, hd], [rx1, y1, hd], fasciaCol);
      addQ([rx0, y0 - thick, -hd], [rx1, y1 - thick, -hd], [rx1, y1, -hd], [rx0, y0, -hd], fasciaCol);
    }
    // Left & right eave drip fascia boards
    addQ([-hw, yBase - thick, -hd], [-hw, yBase - thick, hd], [-hw, yBase, hd], [-hw, yBase, -hd], fasciaCol);
    addQ([ hw, yBase - thick,  hd], [ hw, yBase - thick,-hd], [ hw, yBase,-hd], [ hw, yBase,  hd], fasciaCol);

    // Front & back gable timber triangles (verified outward +Z and -Z normals)
    const gableC = [0.26, 0.17, 0.11];
    addT([-hw*0.86, yBase - 0.04, hd*0.86], [hw*0.86, yBase - 0.04, hd*0.86], [0, yR - 0.14, hd*0.86], gableC);
    addT([hw*0.86, yBase - 0.04, -hd*0.86], [-hw*0.86, yBase - 0.04, -hd*0.86], [0, yR - 0.14, -hd*0.86], gableC);
    return { positions: pos, normals: nrm, uvs: uv, colors: c, indices: idx };
  }

  // Detailed Multi-Part Alpine Timber-and-Stone Chalet / Mountain Rally Lodge (with rafters, balcony, knee-braces & flower boxes)
  function buildCabinGeo() {
    // 2-Story Half-Timbered & Stone-Base Alpine Chalet with Purple Flower Boxes & Warm Lanterns (1:1 matches image_4db044.png!)
    const stone = [0.22, 0.24, 0.25], stoneDark = [0.13, 0.15, 0.16];
    const wood = [0.30, 0.20, 0.11], woodWarm = [0.38, 0.26, 0.15], darkWood = [0.13, 0.085, 0.05];
    const roof = [0.13, 0.15, 0.18], roofTrim = [0.09, 0.10, 0.13];
    const winGlow = [1.85, 1.25, 0.48];
    const winShopGlow = [2.15, 1.48, 0.62];
    const shopStripGlow = [1.95, 1.38, 0.65];
    const flowerViolet = [0.66, 0.34, 0.96], flowerPink = [0.96, 0.36, 0.62], flowerGreen = [0.10, 0.38, 0.12];
    const flowerGold = [1.00, 0.78, 0.18], flowerRed = [0.96, 0.20, 0.24], flowerWhite = [0.98, 0.96, 0.92];
    const awningRed = [0.82, 0.16, 0.18], awningCream = [0.97, 0.93, 0.84], terracotta = [0.74, 0.34, 0.20];
    // Alternating burgundy & cream striped florist storefront awning (sloped canopy + scalloped front valance + iron brackets)
    const awningStripes = [];
    for (let si = 0; si < 11; si++) {
      const ax = -2.50 + si * 0.50;
      const acol = (si % 2 === 0) ? awningRed : awningCream;
      // 3-step sloped awning deck from z=2.52 (y=2.04) down to z=3.72 (y=1.68)
      awningStripes.push(makeBoxPart(ax, 1.98, 2.74, 0.50, 0.08, 0.44, acol));
      awningStripes.push(makeBoxPart(ax, 1.84, 3.14, 0.50, 0.08, 0.44, acol));
      awningStripes.push(makeBoxPart(ax, 1.70, 3.54, 0.50, 0.08, 0.44, acol));
      // Scalloped hanging valance apron
      awningStripes.push(makeBoxPart(ax, 1.54, 3.74, 0.46, 0.24, 0.06, acol));
    }
    // Tiered wooden roadside flower-stand display racks + terracotta pots + lush colorful blooms flanking entrance
    const flowerStands = [-1.85, 1.85].flatMap((sx, idx) => [
      // Lower & upper wooden display benches
      makeBoxPart(sx, 0.34, 3.38, 1.68, 0.10, 0.56, woodWarm),
      makeBoxPart(sx, 0.68, 2.94, 1.68, 0.10, 0.48, woodWarm),
      makeBoxPart(sx - 0.72, 0.18, 3.38, 0.10, 0.36, 0.50, darkWood),
      makeBoxPart(sx + 0.72, 0.18, 3.38, 0.10, 0.36, 0.50, darkWood),
      makeBoxPart(sx - 0.72, 0.34, 2.94, 0.10, 0.68, 0.42, darkWood),
      makeBoxPart(sx + 0.72, 0.34, 2.94, 0.10, 0.68, 0.42, darkWood),
      // Lower tier terracotta pots + overflowing foliage & blooms
      ...[-0.56, 0.0, 0.56].flatMap((ox, pi) => {
        const bCol = (pi + idx) % 3 === 0 ? flowerRed : ((pi + idx) % 3 === 1 ? flowerGold : flowerViolet);
        return [
          makeBoxPart(sx + ox, 0.50, 3.40, 0.28, 0.24, 0.28, terracotta),
          makeBoxPart(sx + ox, 0.68, 3.40, 0.44, 0.22, 0.40, flowerGreen),
          makeBoxPart(sx + ox - 0.08, 0.82, 3.44, 0.26, 0.18, 0.24, bCol),
          makeBoxPart(sx + ox + 0.10, 0.80, 3.36, 0.22, 0.16, 0.22, pi === 1 ? flowerWhite : flowerPink),
        ];
      }),
      // Upper tier flower crates + dense bouquet clusters
      ...[-0.52, 0.02, 0.54].flatMap((ox, pi) => {
        const bCol = (pi + idx) % 3 === 0 ? flowerPink : ((pi + idx) % 3 === 1 ? flowerViolet : flowerGold);
        return [
          makeBoxPart(sx + ox, 0.84, 2.94, 0.34, 0.22, 0.30, darkWood),
          makeBoxPart(sx + ox, 1.00, 2.96, 0.48, 0.22, 0.38, flowerGreen),
          makeBoxPart(sx + ox, 1.14, 2.98, 0.34, 0.20, 0.28, bCol),
        ];
      }),
    ]);
    // Curved stone doorway voussoir arch (9-segment semicircular arch framing the chalet entrance)
    const brickCol = [0.58, 0.28, 0.18];
    const doorArch = [];
    for (let ai = 0; ai < 9; ai++) {
      const a0 = (ai / 9) * Math.PI, a1 = ((ai + 1) / 9) * Math.PI;
      const am = 0.5 * (a0 + a1);
      const p0 = [-Math.cos(a0) * 0.68, 1.88 + Math.sin(a0) * 0.48, 2.55];
      const pm = [-Math.cos(am) * 0.68, 1.88 + Math.sin(am) * 0.48, 2.55];
      const p1 = [-Math.cos(a1) * 0.68, 1.88 + Math.sin(a1) * 0.48, 2.55];
      doorArch.push(makeCurvedTube([p0, pm, p1], 0.10, 0.10, 5, ai % 2 === 0 ? stone : stoneDark));
    }
    // Curved timber eave corbel brackets supporting the overhanging flared roof eaves
    const eaveCorbels = [-2.4, -0.8, 0.8, 2.4].flatMap((cz) => [
      makeCurvedTube([[-2.90, 3.45, cz], [-3.25, 3.85, cz], [-3.75, 4.18, cz]], 0.08, 0.07, 5, darkWood),
      makeCurvedTube([[ 2.90, 3.45, cz], [ 3.25, 3.85, cz], [ 3.75, 4.18, cz]], 0.08, 0.07, 5, darkWood),
    ]);
    // Curved-roof dormer window jutting out from right roof slope + aged red-brick wall accent courses
    const dormerParts = [
      makeBoxPart(2.05, 5.15, 1.45, 1.45, 1.15, 1.35, woodWarm),
      makeBoxPart(2.80, 5.15, 1.45, 0.08, 0.72, 0.78, winGlow),
      makeBoxPart(2.84, 5.15, 1.45, 0.06, 0.72, 0.06, darkWood),
      makeBoxPart(2.84, 5.15, 1.45, 0.06, 0.06, 0.78, darkWood),
      makeGableRoofPart(1.85, 1.65, 5.68, 0.62, roof, 2.05, 1.45),
      // Aged red-brick corner quoins & lower frieze band (triggers 512px agedBrick PBR normal+albedo!)
      makeBoxPart(-3.06, 1.10,  2.46, 0.28, 2.05, 0.28, brickCol),
      makeBoxPart( 3.06, 1.10,  2.46, 0.28, 2.05, 0.28, brickCol),
      makeBoxPart(-3.06, 1.10, -2.46, 0.28, 2.05, 0.28, brickCol),
      makeBoxPart( 3.06, 1.10, -2.46, 0.28, 2.05, 0.28, brickCol),
      makeBoxPart( 0.00, 1.92,  2.51, 6.12, 0.26, 0.14, brickCol),
      makeBoxPart( 0.00, 1.92, -2.51, 6.12, 0.26, 0.14, brickCol),
    ];
    const parts = [
      ...doorArch,
      ...eaveCorbels,
      ...dormerParts,
      // Cobblestone terrace apron grounding the flower shop entrance & stalls
      makeBoxPart(0, -0.04, 3.25, 6.6, 0.28, 1.75, stoneDark),
      ...awningStripes,
      ...flowerStands,
      // Wrought-iron awning support arms & hanging florist signboard + warm pendant shop lantern
      makeCurvedTube([[-2.55, 1.25, 2.50], [-2.55, 1.48, 3.12], [-2.55, 1.66, 3.68]], 0.035, 0.035, 4, roofTrim),
      makeCurvedTube([[ 2.55, 1.25, 2.50], [ 2.55, 1.48, 3.12], [ 2.55, 1.66, 3.68]], 0.035, 0.035, 4, roofTrim),
      makeBoxPart(2.96, 2.55, 3.05, 0.08, 0.08, 1.15, roofTrim),
      makeBoxPart(2.96, 2.22, 3.35, 0.10, 0.50, 0.72, awningCream),
      makeBoxPart(2.96, 2.22, 3.35, 0.14, 0.56, 0.78, darkWood),
      makeBoxPart(0.00, 1.56, 3.28, 0.22, 0.30, 0.22, winShopGlow),
      makeBoxPart(0.00, 1.74, 3.28, 0.34, 0.08, 0.34, roofTrim),
      // Warm recessed under-awning shopfront strip glow illuminating the flower displays at dusk/rain
      makeBoxPart(0.00, 1.88, 2.66, 4.6, 0.07, 0.10, shopStripGlow),
      // Ground story: deep stone-masonry plinth skirt (extends down to y = -3.4m so it NEVER floats on slopes!) + sill belt
      makeBoxPart(0, -1.15, 0, 6.5, 6.4, 5.3, stone),
      makeBoxPart(0, -2.10, 0, 7.1, 4.5, 5.9, stoneDark),
      makeBoxPart(0,  2.08, 0, 6.48, 0.20, 5.28, stoneDark),
      // Multi-volume L-shaped stepped side timber wing with cross-gable roof (breaks matchbox silhouette!)
      makeBoxPart(-4.25, -0.45, -0.55, 2.75, 4.9, 3.6, stone),
      makeBoxPart(-4.25,  2.55, -0.55, 2.55, 1.55, 3.35, woodWarm),
      makeGableRoofPart(3.45, 4.25, 3.28, 1.25, roof, -4.25, -0.55),
      makeBoxPart(-5.55,  2.55, -0.55, 0.08, 0.82, 0.96, winGlow),
      makeBoxPart(-5.59,  2.55, -0.55, 0.06, 0.82, 0.06, darkWood),
      makeBoxPart(-5.59,  2.55, -0.55, 0.06, 0.06, 0.96, darkWood),
      // Upper story: half-timbered alpine wood walls + bold dark-timber framing & diagonal braces
      makeBoxPart(0,  3.15, 0, 5.8, 2.1, 4.6, wood),
      makeBoxPart(0,  4.20, 0, 6.06, 0.18, 4.86, darkWood),
      // Front cantilevered 2nd-story alpine timber balcony + railing + diagonal knee-braces (1:1 房子.jpg!)
      makeBoxPart(0,  2.14, 2.88, 5.6, 0.16, 1.22, darkWood),
      makeBoxPart(0,  2.94, 3.44, 5.6, 0.10, 0.10, darkWood),
      makeBoxPart(0,  2.56, 3.44, 5.5, 0.14, 0.06, woodWarm),
      ...[-2.6, -1.3, 0.0, 1.3, 2.6].flatMap((bx) => [
        makeBoxPart(bx, 2.54, 3.44, 0.10, 0.82, 0.10, darkWood),
        makeCurvedTube([[bx, 1.45, 2.50], [bx, 1.80, 2.95], [bx, 2.12, 3.38]], 0.06, 0.06, 4, darkWood),
      ]),
      // Balcony lush purple/pink alpine flower boxes hanging on the railing
      ...[-1.65, 0.0, 1.65].flatMap((fx) => [
        makeBoxPart(fx, 2.96, 3.55, 1.02, 0.16, 0.20, darkWood),
        makeBoxPart(fx, 3.08, 3.58, 0.92, 0.16, 0.18, flowerGreen),
        makeBoxPart(fx - 0.22, 3.16, 3.62, 0.22, 0.12, 0.14, flowerViolet),
        makeBoxPart(fx + 0.18, 3.16, 3.62, 0.22, 0.12, 0.14, flowerPink),
      ]),
      makeBoxPart(-2.92, 3.15,  2.32, 0.22, 2.15, 0.22, darkWood),
      makeBoxPart( 2.92, 3.15,  2.32, 0.22, 2.15, 0.22, darkWood),
      makeBoxPart(-2.92, 3.15, -2.32, 0.22, 2.15, 0.22, darkWood),
      makeBoxPart( 2.92, 3.15, -2.32, 0.22, 2.15, 0.22, darkWood),
      // Half-timbered vertical & diagonal gable framing beams on front & sides
      makeBoxPart( 0.00, 3.15,  2.33, 0.18, 2.12, 0.10, darkWood),
      makeBoxPart(-1.45, 3.15,  2.33, 0.14, 2.12, 0.10, darkWood),
      makeBoxPart( 1.45, 3.15,  2.33, 0.14, 2.12, 0.10, darkWood),
      makeCurvedTube([[-2.85, 2.15, 2.34], [-2.15, 3.15, 2.34], [-1.45, 4.15, 2.34]], 0.075, 0.075, 4, darkWood),
      makeCurvedTube([[ 2.85, 2.15, 2.34], [ 2.15, 3.15, 2.34], [ 1.45, 4.15, 2.34]], 0.075, 0.075, 4, darkWood),
      // Steep overhanging shingled pitched roof + ridge beam + exposed eaves rafter tails
      makeGableRoofPart(7.8, 6.4, 4.24, 2.35, roof),
      makeBoxPart(0, 6.60, 0, 0.28, 0.24, 6.55, roofTrim),
      ...[-2.6, -1.3, 0.0, 1.3, 2.6].flatMap((rz) => [
        makeBoxPart(-3.55, 4.10, rz, 0.50, 0.15, 0.15, darkWood),
        makeBoxPart( 3.55, 4.10, rz, 0.50, 0.15, 0.15, darkWood),
      ]),
      // Tall aged red-brick chimney + stepped stone corbel cap + twin terracotta flues
      makeBoxPart(1.80, 5.55, -0.95, 0.90, 2.65, 0.90, brickCol),
      makeBoxPart(1.80, 6.86, -0.95, 1.12, 0.20, 1.12, stoneDark),
      makeBoxPart(1.80, 7.06, -0.95, 0.98, 0.14, 0.98, stone),
      makeCurvedTube([[1.62, 7.05, -0.95], [1.62, 7.26, -0.95], [1.62, 7.48, -0.95]], 0.14, 0.12, 6, brickCol),
      makeCurvedTube([[1.98, 7.05, -0.95], [1.98, 7.26, -0.95], [1.98, 7.48, -0.95]], 0.14, 0.12, 6, brickCol),
      // Covered entrance stoop + timber door + glowing iron wall lantern
      makeBoxPart( 0.00, 1.05,  2.52, 1.15, 1.98, 0.12, darkWood),
      makeBoxPart( 0.00, 1.02,  2.56, 0.90, 1.78, 0.08, woodWarm),
      makeBoxPart( 2.98, 2.45,  2.36, 0.24, 0.34, 0.24, winGlow),
      makeBoxPart( 2.98, 2.66,  2.36, 0.36, 0.08, 0.36, roofTrim),
      // Ground-floor stone-framed glowing windows + lush overhanging purple/green flower boxes
      ...[-1.78, 1.78].flatMap((wx) => [
        makeBoxPart(wx, 1.32, 2.52, 1.42, 1.12, 0.08, winShopGlow),
        makeBoxPart(wx, 1.32, 2.56, 0.07, 1.12, 0.06, darkWood),
        makeBoxPart(wx - 0.38, 1.32, 2.56, 0.05, 1.12, 0.05, darkWood),
        makeBoxPart(wx + 0.38, 1.32, 2.56, 0.05, 1.12, 0.05, darkWood),
        makeBoxPart(wx, 1.32, 2.56, 1.42, 0.07, 0.06, darkWood),
        makeBoxPart(wx, 0.72, 2.60, 1.26, 0.14, 0.24, darkWood),
        makeBoxPart(wx, 0.84, 2.64, 1.10, 0.18, 0.22, flowerGreen),
        makeBoxPart(wx - 0.26, 0.94, 2.68, 0.24, 0.14, 0.16, flowerViolet),
        makeBoxPart(wx + 0.02, 0.96, 2.68, 0.22, 0.14, 0.16, flowerPink),
        makeBoxPart(wx + 0.28, 0.93, 2.68, 0.24, 0.14, 0.16, flowerViolet),
      ]),
      // Second-story warm glowing multi-pane windows + overhanging flower boxes
      ...[-1.65, 1.65].flatMap((wx) => [
        makeBoxPart(wx, 3.16, 2.33, 0.96, 0.92, 0.08, winGlow),
        makeBoxPart(wx, 3.16, 2.37, 0.07, 0.92, 0.06, darkWood),
        makeBoxPart(wx, 3.16, 2.37, 0.96, 0.07, 0.06, darkWood),
        makeBoxPart(wx, 2.66, 2.41, 1.14, 0.12, 0.22, darkWood),
        makeBoxPart(wx, 2.77, 2.44, 0.98, 0.16, 0.20, flowerGreen),
        makeBoxPart(wx - 0.22, 2.86, 2.48, 0.22, 0.12, 0.14, flowerViolet),
        makeBoxPart(wx + 0.22, 2.86, 2.48, 0.22, 0.12, 0.14, flowerPink),
      ]),
      // Attic gable glowing window
      makeBoxPart( 0.00, 5.05,  2.42, 0.82, 0.88, 0.08, winGlow),
      makeBoxPart( 0.00, 5.05,  2.46, 0.06, 0.88, 0.06, darkWood),
      makeBoxPart( 0.00, 5.05,  2.46, 0.82, 0.06, 0.06, darkWood),
      // Side glowing mullioned windows (facing road!) + flower boxes
      ...[[-2.94, -1], [2.94, 1]].flatMap(([sx, sgn]) => [
        makeBoxPart(sx, 1.32, 0.0, 0.08, 1.12, 1.88, winShopGlow),
        makeBoxPart(sx + sgn*0.04, 1.32, 0.0, 0.06, 1.12, 0.08, darkWood),
        makeBoxPart(sx + sgn*0.04, 1.32, -0.52, 0.05, 1.12, 0.06, darkWood),
        makeBoxPart(sx + sgn*0.04, 1.32,  0.52, 0.05, 1.12, 0.06, darkWood),
        makeBoxPart(sx + sgn*0.04, 1.32, 0.0, 0.06, 0.08, 1.88, darkWood),
        // Side wrap-around burgundy-and-cream striped florist awning!
        ...[-0.90, -0.45, 0.0, 0.45, 0.90].flatMap((az, ai) => {
          const acol = (ai % 2 === 0) ? awningRed : awningCream;
          return [
            makeBoxPart(sx + sgn*0.42, 2.02, az, 0.86, 0.08, 0.45, acol),
            makeBoxPart(sx + sgn*0.86, 1.84, az, 0.08, 0.28, 0.43, acol),
          ];
        }),
        // Warm under-awning shop lantern bar on side facade too
        makeBoxPart(sx + sgn*0.18, 1.90, 0.0, 0.08, 0.08, 1.85, shopStripGlow),
        // Side roadside flower bench & overflowing colorful bloom pots
        makeBoxPart(sx + sgn*0.46, 0.46, 0.0, 0.72, 0.12, 2.15, woodWarm),
        makeBoxPart(sx + sgn*0.46, 0.24, -0.82, 0.62, 0.46, 0.10, darkWood),
        makeBoxPart(sx + sgn*0.46, 0.24,  0.82, 0.62, 0.46, 0.10, darkWood),
        makeBoxPart(sx + sgn*0.46, 0.66, 0.0, 0.56, 0.26, 1.98, flowerGreen),
        makeBoxPart(sx + sgn*0.50, 0.84, -0.68, 0.36, 0.22, 0.42, flowerRed),
        makeBoxPart(sx + sgn*0.50, 0.86, -0.18, 0.36, 0.24, 0.44, flowerGold),
        makeBoxPart(sx + sgn*0.50, 0.84,  0.32, 0.36, 0.22, 0.42, flowerViolet),
        makeBoxPart(sx + sgn*0.50, 0.86,  0.76, 0.34, 0.22, 0.38, flowerPink),
        makeBoxPart(sx, 3.16, 0.0, 0.08, 0.92, 1.38, winGlow),
        makeBoxPart(sx + sgn*0.04, 3.16, 0.0, 0.06, 0.92, 0.08, darkWood),
        makeBoxPart(sx + sgn*0.04, 3.16, 0.0, 0.06, 0.08, 1.38, darkWood),
      ]),
      // Upper-story painted timber shutters + wrought-iron corner porch lanterns + roof ridge beam (1:1 房子.jpg!)
      ...[-1.65, 1.65].flatMap((wx) => [
        makeBoxPart(wx - 0.62, 3.16, 2.36, 0.26, 0.94, 0.06, [0.16, 0.26, 0.20]),
        makeBoxPart(wx + 0.62, 3.16, 2.36, 0.26, 0.94, 0.06, [0.16, 0.26, 0.20]),
      ]),
      makeBoxPart(-2.75, 2.35, 2.65, 0.28, 0.06, 0.06, [0.12, 0.13, 0.15]),
      makeCylPart(-2.85, 2.02, 2.32, 2.65, 0.10, 0.12, 6, winGlow),
      makeCylPart(-2.85, 2.32, 2.42, 2.65, 0.16, 0.04, 6, [0.12, 0.13, 0.15]),
      makeBoxPart( 0.00, 6.62, 0.00, 0.18, 0.22, 5.45, darkWood),
      // Stacked firewood rack + rain barrel beside chalet
      makeBoxPart(-3.45, 0.65, 1.15, 0.72, 0.76, 1.55, woodWarm),
      makeBoxPart(-3.45, 1.12, 1.15, 0.86, 0.08, 1.68, roof),
      makeCurvedTube([[3.42, 0.10, 1.75], [3.42, 0.60, 1.75], [3.42, 1.08, 1.75]], 0.32, 0.28, 8, darkWood),
    ];
    return mergeParts(parts);
  }

  // Open-Lattice Steel Box-Truss Rally Checkpoint Gantry + Green-Cyan LED Start Pods (1:1 matches image_4db044.png!)
  function buildRallyArchGeo() {
    const concrete = [0.22, 0.24, 0.25], steel = [0.14, 0.17, 0.20], steelLight = [0.36, 0.40, 0.44];
    const yellow = [0.92, 0.68, 0.12], teal = [0.08, 0.56, 0.58], white = [0.92, 0.94, 0.96], crimson = [0.86, 0.18, 0.14], navy = [0.10, 0.14, 0.20];
    const startGreen = [0.28, 2.45, 1.85], amber = [2.9, 1.65, 0.28], timingGlow = [2.6, 2.25, 1.25];
    const span = 6.75, h = 5.75;
    const parts = [
      // Tapered concrete anchor footings
      makeBoxPart(-span, 0.15, 0, 1.10, 0.85, 1.30, concrete),
      makeBoxPart( span, 0.15, 0, 1.10, 0.85, 1.30, concrete),
    ];
    // Open-lattice steel truss columns (4 corner tubes + horizontal rungs + X-bracing)
    for (const sgn of [-1, 1]) {
      const cx = sgn * span;
      for (const ox of [-0.24, 0.24]) for (const oz of [-0.36, 0.36]) {
        parts.push(makeBoxPart(cx + ox, 3.25, oz, 0.095, 6.4, 0.095, steel));
      }
      for (let ry = 0.9; ry <= 5.5; ry += 1.1) {
        parts.push(makeBoxPart(cx, ry,  0.36, 0.54, 0.055, 0.055, steelLight));
        parts.push(makeBoxPart(cx, ry, -0.36, 0.54, 0.055, 0.055, steelLight));
        parts.push(makeBoxPart(cx - 0.24, ry, 0, 0.055, 0.055, 0.78, steelLight));
        parts.push(makeBoxPart(cx + 0.24, ry, 0, 0.055, 0.055, 0.78, steelLight));
        parts.push(makeCurvedTube([[cx - 0.24, ry, 0.36], [cx, ry + 0.55, 0.36], [cx + 0.24, ry + 1.1, 0.36]], 0.030, 0.030, 4, steelLight));
        parts.push(makeCurvedTube([[cx + 0.24, ry, -0.36], [cx, ry + 0.55, -0.36], [cx - 0.24, ry + 1.1, -0.36]], 0.030, 0.030, 4, steelLight));
      }
      // Tall vertical striped sponsor banners mounted outside both truss towers (matches image_4db044!)
      const bx = cx + sgn * 0.88;
      parts.push(makeBoxPart(cx + sgn * 0.54, 4.95, 0, 0.80, 0.055, 0.055, steelLight));
      parts.push(makeBoxPart(cx + sgn * 0.54, 1.85, 0, 0.80, 0.055, 0.055, steelLight));
      parts.push(makeBoxPart(bx, 3.40, 0, 0.78, 3.00, 0.04, navy));
      parts.push(makeBoxPart(bx, 4.45, 0, 0.80, 0.46, 0.05, white));
      parts.push(makeBoxPart(bx, 3.65, 0, 0.80, 0.42, 0.05, yellow));
      parts.push(makeBoxPart(bx, 2.85, 0, 0.80, 0.44, 0.05, navy));
      parts.push(makeBoxPart(bx, 2.20, 0, 0.80, 0.52, 0.05, teal));
    }
    // Overhead OPEN STEEL BOX-TRUSS BEAM (top/bottom rails + diagonal X-truss bars + inset yellow/teal panels!)
    parts.push(
      makeBoxPart(0, h + 0.96,  0.26, span * 2 + 1.0, 0.12, 0.12, steel),
      makeBoxPart(0, h + 0.96, -0.26, span * 2 + 1.0, 0.12, 0.12, steel),
      makeBoxPart(0, h - 0.02,  0.26, span * 2 + 1.0, 0.12, 0.12, steel),
      makeBoxPart(0, h - 0.02, -0.26, span * 2 + 1.0, 0.12, 0.12, steel),
      // Yellow outer panels & teal inner chevron accents inset behind the steel truss lattice
      makeBoxPart(-span + 1.45, h + 0.47, 0, 2.10, 0.84, 0.14, yellow),
      makeBoxPart( span - 1.45, h + 0.47, 0, 2.10, 0.84, 0.14, yellow),
      makeBoxPart(-3.55, h + 0.47, 0, 1.35, 0.82, 0.14, teal),
      makeBoxPart( 3.55, h + 0.47, 0, 1.35, 0.82, 0.14, teal),
      // Glowing horizontal central LED timing bar inside open truss
      makeBoxPart( 0.00, h + 0.50, 0, 3.80, 0.14, 0.22, timingGlow),
      makeBoxPart( 0.00, h + 0.30, 0, 2.20, 0.08, 0.20, white),
      // Corner amber strobe beacons on top of gantry
      makeBoxPart(-span, h + 1.18, 0, 0.32, 0.34, 0.32, amber),
      makeBoxPart( span, h + 1.18, 0, 0.32, 0.34, 0.32, amber)
    );
    // Visible diagonal X-bracing steel tubes along the entire overhead gantry span!
    for (let gx = -span + 0.5; gx < span - 0.5; gx += 1.45) {
      parts.push(makeBoxPart(gx, h + 0.47, 0.26, 0.06, 0.94, 0.06, steelLight));
      parts.push(makeCurvedTube([[gx, h, 0.26], [gx + 0.72, h + 0.47, 0.26], [gx + 1.45, h + 0.94, 0.26]], 0.036, 0.036, 4, steelLight));
      parts.push(makeCurvedTube([[gx, h + 0.94, 0.26], [gx + 0.72, h + 0.47, 0.26], [gx + 1.45, h, 0.26]], 0.036, 0.036, 4, steelLight));
    }
    // 4 Glowing Emerald-Cyan LED Start-Light Pods hanging underneath gantry (1:1 matches image_4db044.png!)
    for (const lx of [-3.6, -1.2, 1.2, 3.6]) {
      parts.push(makeBoxPart(lx, h - 0.16, 0, 0.76, 0.18, 0.26, steel));
      parts.push(makeBoxPart(lx, h - 0.24, 0, 0.62, 0.12, 0.30, startGreen));
    }
    // 4 Slender roof masts with tapered rally flags
    const pennantSpecs = [[-span + 0.4, yellow], [-2.5, teal], [2.2, white], [span - 0.6, crimson]];
    for (const [px, pcol] of pennantSpecs) {
      parts.push(makeCurvedTube([[px, h + 1.02, 0], [px, h + 1.95, 0], [px + 0.04, h + 2.85, 0]], 0.032, 0.018, 5, steelLight));
      parts.push(makeBoxPart(px + 0.26, h + 2.58, 0.00, 0.48, 0.44, 0.025, pcol));
      parts.push(makeBoxPart(px + 0.66, h + 2.59, 0.03, 0.38, 0.30, 0.025, pcol));
      parts.push(makeBoxPart(px + 0.96, h + 2.60, 0.06, 0.24, 0.16, 0.025, pcol));
    }
    return mergeParts(parts);
  }

  // Mossy Fallen Pine Log for rich roadside forest floor complexity

  // Sleek Curved-Silhouette Feather Motorsport Rally Flag (10-strip tapered cloth billow, ZERO blocky rectangles!)
  function buildRallyFlagGeo() {
    const pole = [0.12, 0.14, 0.16], base = [0.09, 0.10, 0.11];
    const navy = [0.08, 0.13, 0.22], white = [0.88, 0.90, 0.93], red = [0.80, 0.16, 0.12], orange = [0.92, 0.44, 0.08], teal = [0.08, 0.56, 0.62];
    const parts = [
      // Deep ground-anchored cylindrical plinth (-0.85m so it NEVER floats on slopes!) + curved fiberglass whip mast
      makeCylPart(0.0, -0.85, 0.16, 0.0, 0.24, 0.18, 8, base),
      makeCurvedTube([[0, 0.0, 0], [0.02, 2.5, 0], [0.44, 4.65, 0]], 0.038, 0.014, 8, pole),
    ];
    // 14-band curved teardrop feather sail with smooth taper & S-curve flutter
    const strips = 14;
    const yBot = 1.15, yTop = 4.55;
    for (let i = 0; i < strips; i++) {
      const t = (i + 0.5) / strips;
      const y = yBot + t * (yTop - yBot);
      const hStrip = (yTop - yBot) / strips + 0.015;
      const wSail = Math.sin(Math.pow(t, 0.72) * Math.PI) * 0.78 + 0.08;
      const xMast = t * t * 0.36;
      const zWave = Math.sin(t * Math.PI * 2.0) * 0.045;
      const c = (i >= 10) ? navy : (i === 9 ? orange : (i >= 4 ? white : (i === 3 ? teal : red)));
      parts.push(makeBoxPart(xMast + wSail * 0.5, y, zWave, wSail, hStrip, 0.018, c));
    }
    return mergeParts(parts);
  }

  // Realistic Cylindrical Stacked Red & White Motorsport Rally Tire Barrier (10-sided round tires!)
  function buildTireBarrierGeo() {
    const red = [0.76, 0.15, 0.12], white = [0.86, 0.88, 0.90], dark = [0.08, 0.09, 0.10];
    const parts = [];
    for (let xi = -1; xi <= 1; xi++) {
      const col = (xi === 0) ? white : red;
      for (let yi = 0; yi < 2; yi++) {
        const cy = 0.02 + yi * 0.38;
        parts.push(makeCurvedTube([[xi * 0.74, cy, 0], [xi * 0.74, cy + 0.18, 0], [xi * 0.74, cy + 0.36, 0]], 0.35, 0.35, 10, col));
        parts.push(makeCurvedTube([[xi * 0.74, cy + 0.34, 0], [xi * 0.74, cy + 0.36, 0], [xi * 0.74, cy + 0.38, 0]], 0.21, 0.21, 8, dark));
      }
    }
    return mergeParts(parts);
  }

  // Curved Gooseneck Wrought-Iron Alpine Streetlamp with Hexagonal Glass Lantern (ZERO square sticks!)
  function buildStreetLampGeo() {
    const iron = [0.11, 0.12, 0.14], ironLight = [0.18, 0.20, 0.22], glow = [2.6, 1.85, 0.72];
    return mergeParts([
      // Deep ground-anchored octagonal cast-iron plinth + fluted tapered post + ornamental ring collar
      makeCylPart(0.0, -1.2, 0.55, 0.0, 0.24, 0.17, 8, iron),
      makeCylPart(0.0, 0.55, 4.15, 0.0, 0.11, 0.068, 8, iron),
      makeCylPart(0.0, 1.15, 1.28, 0.0, 0.14, 0.14, 8, ironLight),
      // Graceful curved S-scroll gooseneck arm + decorative under-scroll brace
      makeCurvedTube([[0.0, 4.05, 0], [0.18, 4.62, 0], [0.62, 4.72, 0], [0.88, 4.42, 0]], 0.052, 0.036, 8, iron),
      makeCurvedTube([[0.0, 3.65, 0], [0.28, 3.92, 0], [0.46, 4.48, 0]], 0.026, 0.024, 6, ironLight),
      // Hexagonal glass lantern cage + glowing amber filament + flared conical iron cap & spire finial
      makeCylPart(0.88, 3.96, 4.04, 0.0, 0.14, 0.20, 6, iron),
      makeCylPart(0.88, 4.04, 4.36, 0.0, 0.16, 0.22, 6, glow),
      makeCylPart(0.88, 4.36, 4.52, 0.0, 0.32, 0.09, 6, iron),
      makeCylPart(0.88, 4.52, 4.68, 0.0, 0.04, 0.01, 6, ironLight),
    ]);
  }

  // Curved Tensioned Arched-Canopy Motorsport Rally Service Pavilion (ZERO boxy tent cubes!)
  function buildRallyTentGeo() {
    const steel = [0.16, 0.18, 0.20], teal = [0.08, 0.42, 0.46], orange = [0.88, 0.40, 0.08], white = [0.86, 0.88, 0.90], glow = [2.1, 1.55, 0.72];
    const parts = [
      // 4 cylindrical grounded aluminum truss legs + footplates
      makeCylPart(-1.88, -0.6, 2.65, -1.38, 0.06, 0.055, 10, steel),
      makeCylPart( 1.88, -0.6, 2.65, -1.38, 0.06, 0.055, 10, steel),
      makeCylPart(-1.88, -0.6, 2.65,  1.38, 0.06, 0.055, 10, steel),
      makeCylPart( 1.88, -0.6, 2.65,  1.38, 0.06, 0.055, 10, steel),
      // 3 curved tubular aluminum barrel-vault canopy ribs
      ...[-1.38, 0.0, 1.38].map((rz) => makeCurvedTube([[-1.92, 2.62, rz], [-1.10, 3.38, rz], [0.0, 3.62, rz], [1.10, 3.38, rz], [1.92, 2.62, rz]], 0.055, 0.055, 8, steel)),
      // Curved multi-panel tensioned arched awning vault (teal/white/orange rally livery stripes)
      ...[-1.32, -0.82, -0.32, 0.18, 0.68, 1.18].map((rx, ri) => {
        const a0 = ((rx + 1.85) / 3.70) * Math.PI;
        const yy = 2.66 + Math.sin(a0) * 0.92;
        const c = (ri === 0 || ri === 5) ? teal : ((ri === 1 || ri === 4) ? orange : white);
        return makeCurvedTube([[rx, yy, -1.46], [rx, yy + 0.05, 0.0], [rx, yy, 1.46]], 0.30, 0.30, 6, c);
      }),
      // Hanging cylindrical paddock work lamp + service workbench
      makeCylPart(0.0, 2.62, 2.95, 0.0, 0.04, 0.04, 6, steel),
      makeCylPart(0.0, 2.48, 2.64, 0.0, 0.24, 0.18, 10, glow),
      makeCylPart(-0.9, 0.0, 0.82, -0.45, 0.04, 0.04, 6, steel),
      makeCylPart( 0.9, 0.0, 0.82, -0.45, 0.04, 0.04, 6, steel),
      makeBoxPart(0.0, 0.84, -0.45, 2.20, 0.08, 0.76, steel),
    ];
    return mergeParts(parts);
  }

  // === 8 NEW MULTI-BIOME 3D ARCHITECTURE & VEGETATION GEOMETRY BUILDERS ===

  // 1. Towering Segmented Emerald Bamboo Grove (Theme 6: Bamboo Shrine Pass)
  function buildBambooClusterGeo() {
    const trunkParts = [];
    const cardPos = [], cardBall = [], cardUv = [], cardOff = [], cardIdx = [];
    let vBase = 0;
    const culms = [
      { ox: 0.0, oz: 0.0, h: 13.5, lx: 0.45, lz: 0.25, r: 0.11 },
      { ox: 0.62, oz: 0.35, h: 11.8, lx: 0.85, lz: -0.35, r: 0.095 },
      { ox: -0.55, oz: 0.48, h: 12.6, lx: -0.68, lz: 0.42, r: 0.10 },
      { ox: 0.24, oz: -0.64, h: 10.4, lx: -0.32, lz: -0.78, r: 0.088 },
    ];
    const bamCol = [0.16, 0.42, 0.14];
    for (let ci = 0; ci < culms.length; ci++) {
      const c = culms[ci];
      trunkParts.push(makeCurvedTube(
        [[c.ox, -0.8, c.oz], [c.ox + c.lx * 0.45, c.h * 0.52, c.oz + c.lz * 0.45], [c.ox + c.lx, c.h, c.oz + c.lz]],
        c.r, c.r * 0.38, 6, bamCol
      ));
      // Feathery lanceolate bamboo leaf sprays along upper 55% of each culm
      for (let k = 0; k < 7; k++) {
        const u = 0.44 + (k / 6) * 0.56;
        const it = 1 - u;
        const px = it*it*c.ox + 2*it*u*(c.ox + c.lx * 0.45) + u*u*(c.ox + c.lx);
        const py = u * c.h;
        const pz = it*it*c.oz + 2*it*u*(c.oz + c.lz * 0.45) + u*u*(c.oz + c.lz);
        for (let b = 0; b < 2; b++) {
          const ang = ci * 1.7 + k * GOLDEN_ANGLE + b * 2.4;
          const offR = 0.55 + (1 - u) * 0.45;
          const bx = px + Math.cos(ang) * offR, by = py + (b - 0.5) * 0.35, bz = pz + Math.sin(ang) * offR;
          const cs = 1.45 + hash(ci * 31 + k * 13 + b * 7) * 0.65;
          const rot = (hash(ci * 19 + k * 23 + b) - 0.5) * 0.9;
          const cr = Math.cos(rot), sr = Math.sin(rot);
          const qid = (ci + k + b) % 4;
          const u0 = (qid % 2) * 0.5, v0 = Math.floor(qid / 2) * 0.5;
          const corners = [[-0.55, -0.45], [0.55, -0.45], [0.55, 0.45], [-0.55, 0.45]];
          const uvs = [[u0, v0 + 0.5], [u0 + 0.5, v0 + 0.5], [u0 + 0.5, v0], [u0, v0]];
          const nx = Math.cos(ang) * 0.6, ny = 0.65, nz = Math.sin(ang) * 0.6;
          const nl = Math.hypot(nx, ny, nz) || 1;
          for (let j = 0; j < 4; j++) {
            cardPos.push(bx, by, bz);
            cardBall.push(nx / nl, ny / nl, nz / nl);
            cardUv.push(uvs[j][0], uvs[j][1]);
            cardOff.push((corners[j][0] * cr - corners[j][1] * sr) * cs, (corners[j][0] * sr + corners[j][1] * cr) * cs, 0.48 + u * 0.52);
          }
          cardIdx.push(vBase, vBase + 1, vBase + 2, vBase, vBase + 2, vBase + 3);
          vBase += 4;
        }
      }
    }
    return { trunkGeo: mergeParts(trunkParts), cardsGeo: { positions: cardPos, normals: cardBall, uvs: cardUv, colors: cardOff, indices: cardIdx } };
  }

  // 2. AAA Sculpted Traditional Kasuga Stone Shrine Lantern (Toro): carved lotus pedestal, fluted shaft, latticed firebox, 3-tier concave upturned pagoda kasa & hoju finial!
  function buildStoneLanternGeo() {
    const stone = [0.25, 0.26, 0.24], darkStone = [0.16, 0.17, 0.16], mossStone = [0.19, 0.22, 0.18], glow = [2.65, 1.75, 0.62];
    const parts = [
      // Stepped octagonal kiso plinth (anchored -1.2m) + carved lotus kaeribana base
      makeCylPart(0, -1.20, 0.16, 0, 0.72, 0.62, 8, darkStone),
      makeCylPart(0,  0.16, 0.32, 0, 0.56, 0.44, 8, mossStone),
      makeCylPart(0,  0.32, 0.46, 0, 0.42, 0.26, 12, stone),
      // Fluted 16-sided tapered sao shaft with decorative fushi center ring & top necking
      makeCylPart(0,  0.44, 1.50, 0, 0.22, 0.18, 16, stone),
      makeCylPart(0,  0.90, 1.02, 0, 0.26, 0.26, 16, darkStone),
      makeCylPart(0,  1.42, 1.52, 0, 0.24, 0.28, 12, darkStone),
      // Sculpted flared lotus-petal chudai middle platform with double-beveled rim
      makeCylPart(0,  1.50, 1.66, 0, 0.26, 0.48, 6, mossStone),
      makeCylPart(0,  1.66, 1.76, 0, 0.54, 0.50, 6, stone),
      // Warm recessed shoji paper lantern core (gentle warm candle glow, NOT flat neon cube!)
      makeCylPart(0,  1.78, 2.26, 0, 0.25, 0.25, 12, glow),
      // Lower & upper carved firebox frames
      makeCylPart(0,  1.75, 1.84, 0, 0.38, 0.36, 6, darkStone),
      makeCylPart(0,  2.20, 2.28, 0, 0.38, 0.42, 6, darkStone),
      // 3-tier concave curved hexagonal pagoda kasa eaves roof + sculpted lotus roban & teardrop hoju finial
      makeCylPart(0,  2.26, 2.36, 0, 0.88, 0.68, 6, mossStone),
      makeCylPart(0,  2.36, 2.52, 0, 0.68, 0.42, 6, stone),
      makeCylPart(0,  2.52, 2.68, 0, 0.42, 0.18, 6, darkStone),
      makeCylPart(0,  2.68, 2.78, 0, 0.20, 0.14, 12, stone),
      makeDomePart(0, 2.76, 0, 0.15, 0.14, 12, stone),
      makeCylPart(0,  2.86, 3.08, 0, 0.10, 0.015, 10, stone),
    ];
    // 6 sculpted corner firebox pillars + 6 upturned pagoda roof warabite scrolls
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      parts.push(makeCylPart(ca * 0.33, 1.76, 2.26, sa * 0.33, 0.044, 0.040, 8, darkStone));
      parts.push(makeCurvedTube([[ca * 0.64, 2.32, sa * 0.64], [ca * 0.84, 2.30, sa * 0.84], [ca * 0.94, 2.42, sa * 0.94]], 0.055, 0.035, 6, stone));
    }
    return mergeParts(parts);
  }

  // 3. High-Altitude Alpine Meteorological Station / Stone Refuge Hut (Theme 1: Alpine Peak)
  function makeCylPart(cx, y0, y1, cz, r0, r1, segs, col) {
    const pos = [], nrm = [], uv = [], c = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const slope = (r0 - r1) / Math.max(0.01, y1 - y0);
      const nl = Math.hypot(1, slope) || 1;
      const nx = ca / nl, ny = slope / nl, nz = sa / nl;
      pos.push(cx + ca * r0, y0, cz + sa * r0, cx + ca * r1, y1, cz + sa * r1);
      nrm.push(nx, ny, nz, nx, ny, nz);
      uv.push(i / segs, 0, i / segs, 1);
      c.push(col[0], col[1], col[2], col[0], col[1], col[2]);
    }
    for (let i = 0; i < segs; i++) {
      const b = i * 2;
      idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
    const topC = pos.length / 3;
    pos.push(cx, y1, cz); nrm.push(0, 1, 0); uv.push(0.5, 0.5); c.push(col[0], col[1], col[2]);
    for (let i = 0; i < segs; i++) {
      const b = i * 2 + 1, bn = (i + 1) * 2 + 1;
      idx.push(topC, bn, b);
    }
    return { positions: pos, normals: nrm, uvs: uv, colors: c, indices: idx };
  }

  function makeDomePart(cx, y0, cz, r, h, segs, col) {
    const rings = 5;
    const pos = [], nrm = [], uv = [], c = [], idx = [];
    for (let ri = 0; ri <= rings; ri++) {
      const phi = (ri / rings) * Math.PI * 0.5;
      const rr = Math.cos(phi) * r, yy = y0 + Math.sin(phi) * h;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        pos.push(cx + ca * rr, yy, cz + sa * rr);
        nrm.push(ca * Math.cos(phi), Math.sin(phi), sa * Math.cos(phi));
        uv.push(i / segs, ri / rings);
        c.push(col[0], col[1], col[2]);
      }
    }
    const stride = segs + 1;
    for (let ri = 0; ri < rings; ri++) {
      for (let i = 0; i < segs; i++) {
        const a = ri * stride + i, b = a + stride;
        idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    return { positions: pos, normals: nrm, uvs: uv, colors: c, indices: idx };
  }

  function buildWeatherStationGeo() {
    const stone = [0.28, 0.29, 0.31], timber = [0.42, 0.29, 0.18], darkWood = [0.18, 0.12, 0.07];
    const roof = [0.14, 0.18, 0.24], snowCap = [0.88, 0.92, 0.96], steel = [0.20, 0.22, 0.25];
    const brick = [0.56, 0.28, 0.19], glow = [3.2, 2.35, 0.95], redBeacon = [3.8, 0.45, 0.25];
    return mergeParts([
      // Deep stepped battered stone retaining foundation (-4.5m so ZERO floating on steep alpine snow slopes!)
      makeBoxPart(0, -2.1, 0, 6.8, 5.4, 6.0, stone),
      makeBoxPart(0, -0.3, 0, 6.2, 2.0, 5.4, stone),
      // Main alpine timber refuge + L-shaped attached mudroom/equipment porch wing
      makeBoxPart(0, 1.85, 0, 5.6, 2.7, 4.8, timber),
      makeBoxPart(-3.65, 1.45, 0.65, 2.35, 2.05, 3.10, timber),
      makeGableRoofPart(3.10, 3.85, 2.45, 1.05, roof, -3.65, 0.65),
      makeGableRoofPart(2.95, 3.65, 2.58, 1.02, snowCap, -3.65, 0.65),
      // Cantilevered wooden viewing deck with diagonal knee-braces & balustrade
      makeBoxPart(-2.82, 1.85, 2.42, 0.24, 2.75, 0.24, darkWood),
      makeBoxPart( 2.82, 1.85, 2.42, 0.24, 2.75, 0.24, darkWood),
      makeBoxPart(0, 0.55, 3.05, 5.8, 0.28, 1.35, darkWood),
      makeBoxPart(-2.55, 1.85, 3.55, 0.20, 2.55, 0.20, darkWood),
      makeBoxPart( 2.55, 1.85, 3.55, 0.20, 2.55, 0.20, darkWood),
      makeBoxPart(0, 1.25, 3.58, 5.2, 0.12, 0.12, darkWood),
      makeCurvedTube([[-2.4, -0.2, 2.4], [-2.4, 0.2, 3.0], [-2.4, 0.52, 3.5]], 0.08, 0.07, 5, darkWood),
      makeCurvedTube([[ 2.4, -0.2, 2.4], [ 2.4, 0.2, 3.0], [ 2.4, 0.52, 3.5]], 0.08, 0.07, 5, darkWood),
      makeGableRoofPart(6.6, 6.4, 3.12, 1.75, roof, 0, 0.35),
      makeGableRoofPart(6.4, 6.1, 3.26, 1.72, snowCap, 0, 0.35),
      // Aged red-brick & stone chimney with snow-capped flue
      makeBoxPart(-1.95, 4.45, -1.2, 0.92, 2.8, 0.92, brick),
      makeBoxPart(-1.95, 5.90, -1.2, 1.12, 0.22, 1.12, snowCap),
      makeBoxPart( 0.65, 1.95, 2.44, 1.85, 1.05, 0.10, glow),
      makeBoxPart( 0.65, 1.95, 2.48, 0.08, 1.08, 0.08, darkWood),
      makeBoxPart( 0.65, 1.95, 2.48, 1.88, 0.08, 0.08, darkWood),
      makeBoxPart(-1.55, 1.55, 2.44, 0.98, 1.82, 0.12, darkWood),
      // Cylindrical meteorological radar dome + anemometer mast
      makeDomePart(1.8, 3.85, -1.4, 0.62, 0.55, 10, snowCap),
      makeCylPart(2.4, 0.6, 9.2, -1.8, 0.14, 0.08, 10, steel),
      makeBoxPart(2.4, 7.6, -1.8, 2.0, 0.10, 0.10, steel),
      makeBoxPart(2.4, 7.6, -1.8, 0.10, 0.10, 2.0, steel),
      makeCylPart(2.4, 9.1, 9.5, -1.8, 0.18, 0.18, 10, redBeacon),
    ]);
  }

  // 5. Lakeside Shoreline Reeds & Slender Tapered Cattail Clump (ZERO boxy rectangles!)
  function buildShoreReedGeo() {
    const stalkC = [0.16, 0.34, 0.12], bladeC = [0.22, 0.42, 0.14], tipC = [0.28, 0.16, 0.08];
    const parts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.35;
      const r = 0.14 + (i % 3) * 0.12;
      const h = 1.15 + (i % 4) * 0.28;
      const ox = Math.cos(a) * r, oz = Math.sin(a) * r;
      const lean = 1.55 + (i % 3) * 0.35;
      parts.push(makeCurvedTube([[ox, -0.35, oz], [ox * lean, h * 0.52, oz * lean], [ox * (lean + 0.85), h, oz * (lean + 0.85)]], 0.024, 0.006, 5, i % 2 === 0 ? stalkC : bladeC));
      if (i % 3 === 0) {
        const tx = ox * (lean + 0.65), tz = oz * (lean + 0.65);
        parts.push(makeCylPart(tx, h - 0.34, h - 0.08, tz, 0.026, 0.022, 8, tipC));
        parts.push(makeCylPart(tx, h - 0.08, h + 0.08, tz, 0.016, 0.003, 6, stalkC));
      }
    }
    return mergeParts(parts);
  }

  // 6. AAA Detailed Weathered Red-Brick Industrial Kiln with Arched Furnaces, Steel Catwalk, Flanged Steam Manifold & Lanterns!
  function buildQuarryKilnGeo() {
    const stone = [0.24, 0.25, 0.25], brick = [0.56, 0.27, 0.18], brickDark = [0.40, 0.19, 0.13];
    const rust = [0.26, 0.15, 0.10], iron = [0.14, 0.16, 0.18], brass = [0.68, 0.50, 0.22], wood = [0.28, 0.20, 0.12], glow = [3.6, 1.95, 0.55];
    const parts = [
      makeBoxPart(0, -2.5, 0, 8.8, 5.8, 7.0, stone),
      makeBoxPart(0, 2.45, 0, 7.6, 4.3, 5.8, brick),
      ...[-3.65, -1.2, 1.2, 3.65].map((px) => makeBoxPart(px, 2.45, 2.95, 0.48, 4.38, 0.38, brickDark)),
      makeBoxPart(0, 4.55, 0, 8.1, 0.26, 6.3, stone),
      makeGableRoofPart(8.4, 6.6, 4.52, 1.75, rust, 0, 0),
      makeBoxPart(0, 6.35, 0, 2.2, 0.72, 4.6, iron),
      makeBoxPart(0, 6.35, 2.32, 1.8, 0.34, 0.08, glow),
      makeGableRoofPart(2.8, 5.2, 6.68, 0.62, rust, 0, 0),
      makeBoxPart(5.2, 1.75, -0.4, 3.2, 3.1, 4.4, brickDark),
      makeGableRoofPart(3.8, 5.0, 3.24, 0.95, rust, 5.2, -0.4),
      makeCylPart(-3.4, 0.4, 14.8, -2.2, 1.26, 0.74, 16, brick),
      makeCylPart(-3.4, 14.5, 15.15, -2.2, 0.94, 1.06, 16, stone),
      ...[5.8, 8.8, 11.8].map((hy) => makeCylPart(-3.4, hy, hy + 0.22, -2.2, 1.18 - hy * 0.024, 1.18 - hy * 0.024, 16, iron)),
      // Elevated steel inspection catwalk wrapping front facade + handrail posts & top rail
      makeBoxPart(0.4, 3.15, 3.55, 7.6, 0.14, 1.15, iron),
      makeBoxPart(0.4, 4.05, 4.08, 7.6, 0.07, 0.07, iron),
      makeBoxPart(0.4, 3.62, 4.08, 7.6, 0.06, 0.06, iron),
      ...[-3.2, -1.4, 0.4, 2.2, 4.0].map((rx) => makeCylPart(rx, 3.15, 4.08, 4.08, 0.045, 0.045, 6, iron)),
      makeBoxPart(0.8, 0.45, 3.55, 5.4, 0.36, 1.55, wood),
      makeBoxPart(-1.7, 0.0, 4.2, 0.22, 3.1, 0.22, iron),
      makeBoxPart( 3.3, 0.0, 4.2, 0.22, 3.1, 0.22, iron),
      makeCylPart(-1.7, 2.6, 2.95, 4.22, 0.18, 0.14, 8, glow),
      makeCylPart( 3.3, 2.6, 2.95, 4.22, 0.18, 0.14, 8, glow),
      makeBoxPart( 0.8, 1.65, 2.94, 2.2, 1.75, 0.14, glow),
      makeCurvedTube([[-0.35, 1.55, 3.02], [-0.25, 2.42, 3.02], [0.80, 2.88, 3.02], [1.85, 2.42, 3.02], [1.95, 1.55, 3.02]], 0.20, 0.20, 8, stone),
      // Bundled curved steam manifold pipes with brass fittings (rich industrial silhouette!)
      makeCurvedTube([[4.8, 3.4, 1.8], [3.6, 5.2, 1.2], [0.2, 5.6, -0.6], [-2.8, 5.0, -1.8]], 0.20, 0.18, 10, iron),
      makeCurvedTube([[4.5, 2.8, 2.2], [3.2, 4.5, 1.6], [-0.4, 4.8, -0.2], [-2.9, 4.2, -1.6]], 0.14, 0.13, 8, brass),
      makeCylPart(4.8, 0.4, 3.8, 1.8, 0.92, 0.92, 14, iron),
      makeDomePart(4.8, 3.8, 1.8, 0.94, 0.46, 14, rust),
      makeBoxPart(-1.8, 2.25, 2.94, 1.25, 1.35, 0.12, glow),
      makeBoxPart(-1.8, 2.25, 2.99, 0.08, 1.38, 0.08, iron),
      makeBoxPart(-1.8, 2.25, 2.99, 1.28, 0.08, 0.08, iron),
      makeBoxPart( 5.2, 1.85, 1.84, 1.2, 1.1, 0.12, glow),
    ];
    return mergeParts(parts);
  }

  function buildUtilityPoleGeo() {
    // Detailed wooden utility pole + dual crossarms + steel braces + transformer drum + junction box + climbing rungs + ceramic insulators!
    const wood = [0.20, 0.15, 0.10], iron = [0.14, 0.16, 0.18], ironL = [0.24, 0.26, 0.29], ceramic = [0.88, 0.90, 0.92], conc = [0.26, 0.28, 0.29];
    const parts = [
      makeCylPart(0, -1.8, 0.55, 0, 0.32, 0.26, 8, conc),
      makeCylPart(0, -1.6, 9.3, 0, 0.22, 0.14, 10, wood),
      makeBoxPart(0, 8.45, 0, 2.55, 0.15, 0.15, wood),
      makeBoxPart(0, 7.65, 0, 1.95, 0.13, 0.13, wood),
      makeCurvedTube([[-0.88, 8.42, 0], [-0.44, 8.05, 0], [0, 7.65, 0]], 0.028, 0.028, 4, iron),
      makeCurvedTube([[ 0.88, 8.42, 0], [ 0.44, 8.05, 0], [0, 7.65, 0]], 0.028, 0.028, 4, iron),
      makeCurvedTube([[-0.65, 7.62, 0], [-0.32, 7.28, 0], [0, 6.95, 0]], 0.024, 0.024, 4, iron),
      makeCurvedTube([[ 0.65, 7.62, 0], [ 0.32, 7.28, 0], [0, 6.95, 0]], 0.024, 0.024, 4, iron),
      // Pole-mounted cylindrical transformer with top bushings & mounting straps
      makeCylPart(0.36, 6.25, 7.22, 0, 0.28, 0.28, 10, iron),
      makeCylPart(0.36, 7.22, 7.36, 0, 0.30, 0.29, 10, ironL),
      makeCylPart(0.28, 7.36, 7.60, 0.08, 0.045, 0.035, 6, ceramic),
      makeCylPart(0.44, 7.36, 7.60, -0.08, 0.045, 0.035, 6, ceramic),
      makeBoxPart(-0.22, 2.65, 0.14, 0.24, 0.42, 0.18, ironL),
      ...[-1.08, -0.38, 0.38, 1.08].map((ix) => makeCylPart(ix, 8.52, 8.78, 0, 0.075, 0.055, 8, ceramic)),
      ...[-0.78, 0.78].map((ix) => makeCylPart(ix, 7.72, 7.94, 0, 0.065, 0.048, 8, ceramic)),
    ];
    for (let r = 0; r < 6; r++) {
      const ry = 3.2 + r * 0.58;
      const rs = (r % 2 === 0) ? 1 : -1;
      parts.push(makeBoxPart(rs * 0.24, ry, 0, 0.18, 0.035, 0.035, iron));
    }
    return mergeParts(parts);
  }

  // Real Botanical Alpha-Tested Hydrangea Shrub (woody stems + crisp 4-petal floret cards & serrated leaf cards — ZERO clay blobs!)
  function buildHydrangeaGeo() {
    const stem = [0.14, 0.16, 0.10];
    const trunkParts = [
      makeCurvedTube([[0, -0.35, 0], [-0.18, 0.22, 0.14], [-0.36, 0.68, 0.24]], 0.045, 0.018, 5, stem),
      makeCurvedTube([[0, -0.35, 0], [ 0.22, 0.24, 0.10], [ 0.42, 0.72, 0.18]], 0.045, 0.018, 5, stem),
      makeCurvedTube([[0, -0.35, 0], [ 0.02, 0.28,-0.16], [ 0.06, 0.84,-0.24]], 0.048, 0.018, 5, stem),
      makeCurvedTube([[0, -0.35, 0], [-0.28, 0.20,-0.20], [-0.50, 0.56,-0.28]], 0.040, 0.016, 5, stem),
      makeCurvedTube([[0, -0.35, 0], [ 0.26, 0.20,-0.22], [ 0.48, 0.58,-0.32]], 0.040, 0.016, 5, stem),
    ];
    const cardPos = [], cardBall = [], cardUv = [], cardOff = [], cardIdx = [];
    let vBase = 0;
    const pushCard = (bx, by, bz, cs, qid, shadeY, rot) => {
      const cr = Math.cos(rot), sr = Math.sin(rot);
      const u0 = (qid % 2) * 0.5, v0 = Math.floor(qid / 2) * 0.5;
      const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
      const uvs = [[u0, v0 + 0.5], [u0 + 0.5, v0 + 0.5], [u0 + 0.5, v0], [u0, v0]];
      const nl = Math.hypot(bx, by + 0.5, bz) || 1;
      for (let j = 0; j < 4; j++) {
        cardPos.push(bx, by, bz);
        cardBall.push(bx / nl, (by + 0.5) / nl, bz / nl);
        cardUv.push(uvs[j][0], uvs[j][1]);
        cardOff.push((corners[j][0] * cr - corners[j][1] * sr) * cs, (corners[j][0] * sr + corners[j][1] * cr) * cs, shadeY);
      }
      cardIdx.push(vBase, vBase + 1, vBase + 2, vBase, vBase + 2, vBase + 3);
      vBase += 4;
    };
    // Lower dark-green serrated leaf foliage collar (Quadrant 3)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      pushCard(Math.cos(a) * 0.52, 0.34 + (i % 2) * 0.14, Math.sin(a) * 0.52, 0.88, 3, 0.25, a);
    }
    // Upper 4-petal botanical hydrangea floret umbels (Quadrants 0, 1, 2)
    const blooms = [
      [-0.36, 0.78,  0.24, 0.66, 0],
      [ 0.38, 0.82,  0.18, 0.68, 1],
      [ 0.04, 0.94, -0.18, 0.72, 2],
      [-0.50, 0.60, -0.26, 0.60, 1],
      [ 0.48, 0.62, -0.30, 0.62, 0],
      [ 0.04, 0.68,  0.48, 0.64, 2],
      [-0.12, 0.86,  0.14, 0.62, 0],
    ];
    for (let bi = 0; bi < blooms.length; bi++) {
      const [bx, by, bz, cs, q] = blooms[bi];
      pushCard(bx, by, bz, cs, q, 0.88, bi * 1.1);
      pushCard(bx + 0.06, by + 0.04, bz - 0.05, cs * 0.92, (q + 1) % 3, 0.94, bi * 1.1 + 1.4);
    }
    return { trunkGeo: mergeParts(trunkParts), cardsGeo: { positions: cardPos, normals: cardBall, uvs: cardUv, colors: cardOff, indices: cardIdx } };
  }

  function buildSakuraTreeGeo() {
    // ZERO dark solid core spheres (coreCol = null) — eliminates muddy black/purple blobs inside pink sakura canopy!
    const bark = [0.18, 0.12, 0.11];
    const trunkParts = [
      makeCurvedTube([[0, -0.5, 0], [0.25, 1.4, 0.15], [0.45, 2.8, -0.10], [0.15, 4.1, -0.25]], 0.34, 0.14, 7, bark),
      makeCurvedTube([[0.35, 2.3, 0.0], [1.45, 3.3, 0.65], [2.45, 4.0, 1.05]], 0.16, 0.055, 6, bark),
      makeCurvedTube([[0.42, 2.50, -0.04], [-1.30, 3.5, 0.55], [-2.35, 4.3, 0.85]], 0.15, 0.05, 6, bark),
      makeCurvedTube([[0.42, 2.85, -0.11], [0.55, 4.0, -1.35], [0.75, 4.8, -2.35]], 0.14, 0.045, 6, bark),
      makeCurvedTube([[0.34, 3.25, -0.16], [-0.90, 4.3, -1.25], [-1.75, 5.0, -1.95]], 0.13, 0.045, 6, bark),
    ];
    const clusters = [
      [ 0.15, 5.1, -0.20, 2.40, 1.35, 2.40, 28],
      [ 2.25, 4.2,  0.95, 1.98, 1.18, 1.98, 22],
      [-2.15, 4.4,  0.75, 1.98, 1.18, 1.98, 22],
      [ 0.70, 4.9, -2.15, 1.88, 1.12, 1.88, 20],
      [-1.55, 5.0, -1.75, 1.82, 1.08, 1.82, 20],
    ];
    return pushClusterCards(clusters, trunkParts, null, 777, 1.52);
  }

  // Asset A: Golden-Yellow Alpine Larch / Autumn Leaf Tree (coreCol = null -> ZERO black/dark inner core sphere!)
  function buildYellowLarchTreeGeo() {
    const bark = [0.20, 0.15, 0.11];
    const trunkParts = [
      makeCurvedTube([[0, -0.5, 0], [-0.14, 1.8, 0.10], [0.12, 3.8, -0.12], [0.24, 5.8, 0.05]], 0.26, 0.055, 7, bark),
      makeCurvedTube([[-0.08, 2.1, 0.06], [-1.35, 2.9, 0.65], [-2.25, 3.4, 0.95]], 0.11, 0.025, 5, bark),
      makeCurvedTube([[0.05, 2.8, -0.05], [1.42, 3.7, -0.55], [2.30, 4.3, -0.85]], 0.11, 0.025, 5, bark),
      makeCurvedTube([[0.14, 3.8, -0.10], [-0.95, 4.6, -0.95], [-1.55, 5.2, -1.35]], 0.09, 0.022, 5, bark),
      makeCurvedTube([[0.20, 4.4, -0.04], [1.05, 5.2, 0.85], [1.55, 5.8, 1.25]], 0.08, 0.020, 5, bark),
    ];
    const clusters = [
      [ 0.18, 5.7,  0.05, 1.45, 0.95, 1.45, 16],
      [ 1.85, 4.1, -0.68, 1.35, 0.82, 1.35, 14],
      [-1.65, 3.2,  0.75, 1.30, 0.78, 1.30, 14],
      [-1.15, 5.0, -1.10, 1.25, 0.76, 1.25, 12],
      [ 1.10, 5.5,  0.95, 1.25, 0.75, 1.25, 12],
    ];
    return pushClusterCards(clusters, trunkParts, null, 913, 1.28);
  }

  // Asset B: 100% Bare Gnarled Weathered Silver-Grey Alpine Deadwood Snag (ZERO leaves!)
  function buildBareDeadwoodGeo() {
    const snag = [0.34, 0.32, 0.29], snagDark = [0.22, 0.20, 0.18];
    return mergeParts([
      makeCurvedTube([[0, -0.6, 0], [-0.22, 1.4, 0.18], [0.16, 3.3, -0.18], [0.42, 5.1, 0.12], [0.28, 6.2, 0.24]], 0.28, 0.04, 7, snag),
      makeCurvedTube([[-0.14, 1.9, 0.12], [-1.25, 2.7, 0.75], [-2.15, 3.5, 1.15], [-2.55, 4.1, 1.05]], 0.11, 0.018, 6, snagDark),
      makeCurvedTube([[ 0.08, 2.6,-0.08], [ 1.35, 3.4,-0.62], [ 2.25, 4.3,-0.95], [ 2.65, 4.8,-0.75]], 0.11, 0.018, 6, snagDark),
      makeCurvedTube([[ 0.24, 3.8,-0.10], [-0.85, 4.7,-0.95], [-1.52, 5.4,-1.45]], 0.085, 0.016, 5, snagDark),
      makeCurvedTube([[ 0.34, 4.4, 0.04], [ 0.98, 5.3, 0.85], [ 1.48, 5.9, 1.22]], 0.075, 0.015, 5, snag),
      makeCurvedTube([[-1.25, 2.7, 0.75], [-1.65, 3.4, 0.15], [-1.95, 3.9, -0.15]], 0.055, 0.014, 4, snag),
      makeCurvedTube([[ 1.35, 3.4,-0.62], [ 1.65, 4.1, 0.18], [ 1.85, 4.6, 0.45]], 0.055, 0.014, 4, snagDark),
    ]);
  }

  PV.TreesFoliage = class TreesFoliage {
    constructor(gl, textures) {
      this.gl = gl;
      this.tex = textures;

      // 3 distinct variants per species (9 total tree meshes + dense roadside shrubs for 14 active segments!)
      this.pines  = [0, 1, 2].map((v) => { const p = buildPineVariant(v);           return { t: PV.createInstancedMesh(gl, p.trunkGeo, 960), c: PV.createInstancedMesh(gl, p.cardsGeo, 960) }; });
      this.broads = [0, 1, 2].map((v) => { const p = buildBroadleafVariant(false, v); return { t: PV.createInstancedMesh(gl, p.trunkGeo, 540), c: PV.createInstancedMesh(gl, p.cardsGeo, 540) }; });
      this.birchs = [0, 1, 2].map((v) => { const p = buildBroadleafVariant(true,  v); return { t: PV.createInstancedMesh(gl, p.trunkGeo, 640), c: PV.createInstancedMesh(gl, p.cardsGeo, 640) }; });
      const bamP = buildBambooClusterGeo();
      this.bambooT = PV.createInstancedMesh(gl, bamP.trunkGeo, 760);
      this.bambooC = PV.createInstancedMesh(gl, bamP.cardsGeo, 760);

      const shrubP = buildShrubPrototype();
      this.shrubTrunks = PV.createInstancedMesh(gl, shrubP.trunkGeo, 7600);
      this.shrubCards  = PV.createInstancedMesh(gl, shrubP.cardsGeo, 7600);

      const fwQuad = {
        positions: [-0.5,0,0, 0.5,0,0, 0.5,1,0, -0.5,1,0],
        normals:   [0,0.3,1, 0,0.3,1, 0,0.3,1, 0,0.3,1],
        uvs:       [0,1, 1,1, 1,0, 0,0],
        colors:    [1,1,1, 1,1,1, 1,1,1, 1,1,1],
        indices:   [0,1,2, 0,2,3],
      };
      this.farwoods = PV.createInstancedMesh(gl, fwQuad, 5600);
      this.boulders = [0, 1, 2].map((v) => PV.createInstancedMesh(gl, buildThreeCutRockGeo(v), 920));
      this.cliffSlabs = PV.createInstancedMesh(gl, buildCliffSlabGeo(), 580);
      this.pebbles  = PV.createInstancedMesh(gl, buildPebbleGeo(), 3600);
      this.bollards = PV.createInstancedMesh(gl, buildBollardGeo(), 720);
      this.chevrons = PV.createInstancedMesh(gl, buildChevronGeo(), 280);
      this.cabins   = PV.createInstancedMesh(gl, buildCabinGeo(), 64);
      this.arches   = PV.createInstancedMesh(gl, buildRallyArchGeo(), 24);
      this.flags    = PV.createInstancedMesh(gl, buildRallyFlagGeo(), 360);
      this.tires    = PV.createInstancedMesh(gl, buildTireBarrierGeo(), 280);
      this.lamps    = PV.createInstancedMesh(gl, buildStreetLampGeo(), 128);
      this.tents    = PV.createInstancedMesh(gl, buildRallyTentGeo(), 48);
      // Multi-Biome Instanced Assets sized for 6x228m horizon (zero draw overhead when count===0!)
      this.stoneLanterns   = PV.createInstancedMesh(gl, buildStoneLanternGeo(), 180);
      this.weatherStations = PV.createInstancedMesh(gl, buildWeatherStationGeo(), 36);
      this.shoreReeds      = PV.createInstancedMesh(gl, buildShoreReedGeo(), 960);
      this.quarryKilns     = PV.createInstancedMesh(gl, buildQuarryKilnGeo(), 36);
      this.utilityPoles    = PV.createInstancedMesh(gl, buildUtilityPoleGeo(), 180);
      const hydP = buildHydrangeaGeo();
      this.hydrangeaT      = PV.createInstancedMesh(gl, hydP.trunkGeo, 640);
      this.hydrangeaC      = PV.createInstancedMesh(gl, hydP.cardsGeo, 640);
      const sakP = buildSakuraTreeGeo();
      this.sakuraT         = PV.createInstancedMesh(gl, sakP.trunkGeo, 280);
      this.sakuraC         = PV.createInstancedMesh(gl, sakP.cardsGeo, 280);
      const larchP = buildYellowLarchTreeGeo();
      this.yellowLarchT    = PV.createInstancedMesh(gl, larchP.trunkGeo, 360);
      this.yellowLarchC    = PV.createInstancedMesh(gl, larchP.cardsGeo, 360);
      this.bareDeadwood    = PV.createInstancedMesh(gl, buildBareDeadwoodGeo(), 320);

      const aoQuad = {
        positions: [-1,0.04,-1, 1,0.04,-1, 1,0.04,1, -1,0.04,1],
        normals:   [0,1,0, 0,1,0, 0,1,0, 0,1,0],
        uvs:       [0,0, 1,0, 1,1, 0,1],
        indices:   [0,2,1, 0,3,2],
      };
      this.contactAO = PV.createInstancedMesh(gl, aoQuad, 3600);
      this._camRight = new Float32Array(3);
      this._camUp = new Float32Array(3);
      this._lastTrackSig = '';

      this._initShaders();
    }

    _initShaders() {
      const gl = this.gl;

      this.aoInstProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=2) in vec2 aUv;
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;
        uniform mat4 uViewProj;
        out vec2 vUv;
        out float vStrength;
        void main() {
          vec4 clipC = uViewProj * vec4(aInstA.xyz, 1.0);
          if (clipC.w < -6.0 || clipC.w > 220.0 || abs(clipC.x) > clipC.w * 1.35 + 6.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          vUv = aUv; vStrength = aInstB.y;
          vec3 wp = aInstA.xyz + aPos * aInstA.w;
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec2 vUv;
        in float vStrength;
        out vec4 fragColor;
        void main() {
          vec2 d = (vUv - 0.5) * 2.0;
          float r = length(d);
          float alpha = smoothstep(1.0, 0.14, r) * vStrength;
          if (alpha < 0.01) discard;
          fragColor = vec4(0.02, 0.04, 0.03, alpha);
        }
      `);

      this.solidProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aNrm;
        layout(location=2) in vec2 aUv;
        layout(location=3) in vec3 aCol;
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;
        uniform mat4 uViewProj;
        uniform vec3 uCamPos;
        uniform float uTime;
        uniform highp int uMode;
        out vec3 vWorldPos;
        out vec3 vLocalPos;
        out vec3 vNrm;
        out vec2 vUv;
        out vec3 vCol;
        out float vTint;
        void main() {
          vec4 clipC = uViewProj * vec4(aInstA.xyz, 1.0);
          if (clipC.w < -16.0 || abs(clipC.x) > clipC.w * 1.48 + 18.0 || (uMode == 3 && clipC.w > 68.0)) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float instDist = length(aInstA.xyz - uCamPos);
          if (instDist > 285.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          // Chunk Animator Anti-Pop-In: Ease-Out Cubic ground-anchored scale + gentle underground rise (locked 1:1 with leafCardsProg!)
          float popLin = smoothstep(285.0, 218.0, instDist);
          float easePop = 1.0 - pow(1.0 - popLin, 3.0);
          float cy = cos(aInstB.x), sy = sin(aInstB.x);
          vec3 p = vec3(aPos.x * aInstB.y, aPos.y, aPos.z * aInstB.y) * (aInstA.w * mix(0.02, 1.0, easePop));
          // Real 3D wind-billow flutter for tall vertical rally feather flags (uMode == 5)
          if (uMode == 5 && aPos.x > 0.08) {
            float flutter = sin(uTime * 6.5 + aPos.y * 2.4 + aInstA.x * 0.5) * 0.14 * clamp(aPos.x * 1.4, 0.0, 1.0);
            p.z += flutter;
          }
          vec3 rp = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
          vec3 rn = normalize(vec3(aNrm.x * cy + aNrm.z * sy, aNrm.y, -aNrm.x * sy + aNrm.z * cy));
          vWorldPos = rp + aInstA.xyz - vec3(0.0, 3.2 * (1.0 - easePop), 0.0);
          vLocalPos = aPos;
          vNrm = rn; vUv = aUv; vCol = aCol; vTint = aInstB.w;
          gl_Position = uViewProj * vec4(vWorldPos, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vLocalPos;
        in vec3 vNrm;
        in vec2 vUv;
        in vec3 vCol;
        in float vTint;
        uniform highp int uMode;
        uniform sampler2D uRockAlb;
        uniform sampler2D uRockNrm;
        uniform sampler2D uSignTex;
        uniform sampler2D uStoneAlb;
        uniform sampler2D uStoneNrm;
        uniform sampler2D uBrickAlb;
        uniform sampler2D uBrickNrm;
        uniform sampler2D uWoodAlb;
        uniform sampler2D uWoodNrm;
        uniform sampler2D uBirchAlb;
        uniform sampler2D uBirchNrm;
        ${PV.PBR_GLSL}
        out vec4 fragColor;

        void main() {
          vec3 N = normalize(vNrm);
          vec3 V = normalize(uCamPos - vWorldPos);
          vec3 albedo = vCol;
          float rough = 0.72, clearcoat = 0.0, ao = 0.90;

          if (uMode == 0) {
            float tWet = clamp(uWetness, 0.0, 1.0);
            if (vCol.r > 0.70) {
              // 512px Peeling White Birch Bark PBR with crisp horizontal lenticels, papery crevices & matte rough finish!
              vec2 buv = vec2(vUv.x * 1.4, vUv.y * 0.75);
              vec3 bAlb = texture(uBirchAlb, buv).rgb;
              vec4 bNrmT = texture(uBirchNrm, buv);
              vec3 bNrm = bNrmT.xyz * 2.0 - 1.0;
              float microB = pvNoise2(vec2(vUv.x * 46.0, vLocalPos.y * 16.0));
              albedo = bAlb * (0.88 + 0.22 * microB);
              N = normalize(N + vec3(bNrm.x * 0.56, bNrm.y * 0.40, bNrm.x * 0.56));
              rough = mix(0.88, 0.66, tWet);
              ao *= mix(0.62, 1.0, bNrmT.a);
            } else if (vCol.g > vCol.r * 1.25 && vCol.g > 0.25) {
              // Segmented Emerald Bamboo Culms with raised pale internode rings & fibrous culm grain
              float nodeF = fract(vLocalPos.y * 1.25);
              float nodeRing = smoothstep(0.06, 0.01, abs(nodeF - 0.5));
              float nodeDark = smoothstep(0.11, 0.04, abs(nodeF - 0.52));
              float vertFib = 0.88 + 0.22 * pvNoise2(vec2(vUv.x * 24.0, vLocalPos.y * 0.8));
              albedo = mix(vec3(0.10, 0.28, 0.09), vec3(0.22, 0.44, 0.14), vertFib);
              albedo = mix(albedo, vec3(0.06, 0.16, 0.05), nodeDark * 0.55);
              albedo = mix(albedo, vec3(0.42, 0.52, 0.26), nodeRing * 0.68);
              rough = mix(0.42, 0.22, tWet);
              clearcoat = 0.28;
            } else if (vCol.r > 0.16 && vCol.r < 0.45) {
              // Director V3: Deeply Furrowed Rugged Conifer/Hardwood Bark (multi-octave vertical fissures + plate relief + crevice AO + moss/lichen, ZERO plastic cylinder!)
              vec2 barkUv = vec2(vUv.x * 16.0, vLocalPos.y * 1.45);
              float warpB = pvFbm2(vec2(vUv.x * 5.0, vLocalPos.y * 0.45)) * 1.65;
              float furrow1 = pvFbm2(vec2(barkUv.x + warpB, barkUv.y));
              float furrow2 = pvNoise2(vec2((barkUv.x + warpB) * 2.4, barkUv.y * 3.6));
              float microFib = pvNoise2(vec2(vUv.x * 54.0, vLocalPos.y * 14.0));
              float barkH = clamp(furrow1 * 0.62 + furrow2 * 0.26 + microFib * 0.12, 0.0, 1.0);
              float fDX = (pvFbm2(vec2(barkUv.x + warpB + 0.14, barkUv.y)) - pvFbm2(vec2(barkUv.x + warpB - 0.14, barkUv.y))) * 2.35;
              float fDY = (pvNoise2(vec2((barkUv.x + warpB) * 2.4, barkUv.y * 3.6 + 0.18)) - pvNoise2(vec2((barkUv.x + warpB) * 2.4, barkUv.y * 3.6 - 0.18))) * 1.15;
              vec3 darkCrevice = vec3(0.065, 0.048, 0.038);
              vec3 roughRidge = mix(vec3(0.18, 0.13, 0.095), vec3(0.28, 0.21, 0.155), furrow2);
              albedo = mix(darkCrevice, roughRidge, smoothstep(0.24, 0.78, barkH)) * (0.86 + 0.26 * microFib);
              float shadeMoss = smoothstep(0.28, -0.32, dot(N, uLightDir)) * smoothstep(0.28, 0.72, pvFbm2(vec2(vUv.x * 6.0, vLocalPos.y * 0.9 + 2.1)));
              float lichen = smoothstep(0.72, 0.88, pvNoise2(vec2(vUv.x * 18.0, vLocalPos.y * 4.5))) * smoothstep(0.45, 0.85, barkH);
              albedo = mix(albedo, vec3(0.075, 0.185, 0.078), shadeMoss * 0.62);
              albedo = mix(albedo, vec3(0.32, 0.36, 0.30), lichen * 0.35);
              vec3 barkTan = normalize(cross(vec3(0.0, 1.0, 0.0), N) + vec3(0.001, 0.0, 0.0));
              N = normalize(N + barkTan * fDX * 0.58 + vec3(0.0, fDY * 0.36, 0.0));
              ao *= mix(0.46, 1.0, smoothstep(0.18, 0.74, barkH));
              rough = mix(0.95, 0.78, tWet);
              clearcoat = 0.0;
            }
            float baseWet = smoothstep(1.15, -0.25, vLocalPos.y);
            albedo = mix(albedo, vec3(0.08, 0.065, 0.048), baseWet * 0.42);
            albedo *= mix(1.0, 0.52, baseWet * 0.78);
            ao *= mix(1.0, 0.46, baseWet);
          } else if (uMode == 1) {
            // Next-Gen Biome-Matched Fractured Rocks & Cliff Massifs (True Triplanar Projection — ZERO horizontal contour stripes!)
            vec3 triW = abs(N);
            triW = triW * triW; triW = triW * triW;
            triW /= max(triW.x + triW.y + triW.z, 1e-4);
            vec2 ruvX = vWorldPos.zy * 0.24;
            vec2 ruvY = vec2(vWorldPos.x * 0.21 + vWorldPos.z * 0.14, -vWorldPos.x * 0.14 + vWorldPos.z * 0.21);
            vec2 ruvZ = vWorldPos.xy * 0.24;
            vec3 rAlb = texture(uRockAlb, ruvX).rgb * triW.x
                      + texture(uRockAlb, ruvY).rgb * triW.y
                      + texture(uRockAlb, ruvZ).rgb * triW.z;
            vec3 rNrm = (texture(uRockNrm, ruvX).xyz * triW.x
                      +  texture(uRockNrm, ruvY).xyz * triW.y
                      +  texture(uRockNrm, ruvZ).xyz * triW.z) * 2.0 - 1.0;
            float bBand = floor(vTint);
            float tFrac = fract(vTint);
            vec3 mineral = tFrac < 0.33 ? vec3(0.68, 0.70, 0.74)
                         : (tFrac < 0.66 ? vec3(0.92, 0.94, 0.96) : vec3(1.10, 0.96, 0.78));
            if (bBand > 1.5 && bBand < 2.5) {
              // Quarry Terracotta / Iron-Ochre Sandstone
              mineral = mix(vec3(1.18, 0.72, 0.52), vec3(0.86, 0.54, 0.38), tFrac);
            } else if (bBand > 2.5) {
              // Kyoto Deep Wet Slate
              mineral = mix(vec3(0.56, 0.64, 0.62), vec3(0.72, 0.80, 0.76), tFrac);
            } else if (bBand > 0.5) {
              // Alpine Snow Peak Cool Granite
              mineral = mix(vec3(0.66, 0.72, 0.82), vec3(0.84, 0.88, 0.94), tFrac);
            }
            albedo = rAlb * mineral;

            float topFace  = smoothstep(0.50, 0.82, N.y);
            float backFace = smoothstep(0.15, -0.35, dot(N, uLightDir));
            float mossN = smoothstep(0.22, 0.65, pvNoise2(vWorldPos.xz * 0.8));
            float moss = clamp(topFace * 0.80 + backFace * 0.42, 0.0, 1.0) * mossN;
            float snowCapMask = 0.0;
            vec3 snowNrm = vec3(0.0);
            if (bBand > 0.5 && bBand < 1.5) {
              // Snow Peak: crisp wind-packed snow caps ONLY on upper ledges (N.y > 0.56), exposing craggy frost-cracked dark granite flanks!
              vec2 swp = vWorldPos.xz * 0.38 + vec2(pvFbm2(vWorldPos.xz * 0.22 + 3.1), pvFbm2(vWorldPos.xz * 0.22 - 4.7)) * 0.85;
              float snowDriftN = pvFbm2(swp) * 0.36;
              snowCapMask = smoothstep(0.56, 0.84, N.y + snowDriftN * 0.62 - 0.08);
              float sdX = (pvFbm2(swp * 1.4 + vec2(0.15, 0.0)) - pvFbm2(swp * 1.4 - vec2(0.15, 0.0))) * 0.55;
              float sdZ = (pvFbm2(swp * 1.4 + vec2(0.0, 0.15)) - pvFbm2(swp * 1.4 - vec2(0.0, 0.15))) * 0.55;
              snowNrm = vec3(sdX, 0.0, sdZ);
              float spkN = pvNoise2(vWorldPos.xz * 15.0 + V.xz * 2.8);
              float spk2 = spkN * spkN; float spk4 = spk2 * spk2;
              float snowSparkle = spk4 * spk4 * spk2 * snowCapMask * 0.42;
              vec3 snowTint = mix(vec3(0.72, 0.81, 0.93), vec3(0.96, 0.97, 0.99), clamp(dot(normalize(N + snowNrm), uLightDir) * 0.5 + 0.5, 0.0, 1.0));
              albedo = mix(albedo * vec3(0.52, 0.56, 0.65), snowTint + vec3(snowSparkle), snowCapMask * 0.96);
              moss = 0.0;
            } else if (bBand > 1.5 && bBand < 2.5) {
              // Quarry: sparse dry scrub lichen
              albedo = mix(albedo, vec3(0.26, 0.28, 0.14), moss * 0.38);
            } else {
              // Lush alpine / Kyoto jade-green moss caps
              vec3 mossCol = bBand > 2.5 ? vec3(0.08, 0.26, 0.10) : vec3(0.13, 0.27, 0.12);
              albedo = mix(albedo, mossCol, moss * (bBand > 2.5 ? 0.88 : 0.75));
            }

            float streak = smoothstep(0.42, 0.78, pvNoise2(vec2((vWorldPos.x + vWorldPos.z) * 2.8, vWorldPos.y * 0.45)));
            float runoff = smoothstep(0.68, 0.88, pvNoise2(vec2((vWorldPos.x - vWorldPos.z) * 5.2, vWorldPos.y * 0.28 + uTime * 0.65))) * (1.0 - topFace);
            float baseSkirt = smoothstep(0.45, -0.45, vLocalPos.y);
            float rWet = clamp(uWetness, 0.0, 1.0);
            float wetRock = clamp((streak * (1.0 - moss) * 0.72 + runoff * 0.82 * rWet + topFace * 0.42) * rWet + baseSkirt * mix(0.32, 0.78, rWet), 0.0, 1.0) * (1.0 - snowCapMask);
            albedo *= mix(1.0, 0.74, wetRock * 0.65);
            albedo += vec3(0.04, 0.055, 0.07) * runoff * rWet * (1.0 - snowCapMask);
            ao *= mix(1.0, 0.64, baseSkirt);

            N = normalize(N + vec3(rNrm.x, 0.0, rNrm.y) * (0.86 * (1.0 - snowCapMask * 0.85)) + snowNrm * snowCapMask);
            rough = mix(mix(mix(0.66, 0.86, moss), 0.42, wetRock), 0.88, snowCapMask);
            clearcoat = mix(mix((1.0 - moss) * 0.08, 0.24, wetRock), 0.03, snowCapMask);
          } else if (uMode == 2 && vCol.r > 0.9) {
            albedo = texture(uSignTex, vUv).rgb;
            rough = 0.26;
          } else if (uMode == 3) {
            // Natural wet earth-toned roadside gravel clods (eliminates dark black coal dots on puddles!)
            vec2 ruv = vWorldPos.xz * 0.72;
            albedo = texture(uRockAlb, ruv).rgb * mix(vec3(0.68, 0.62, 0.54), vec3(0.96, 0.88, 0.76), vTint);
            rough = 0.62;
            clearcoat = 0.14;
          } else if (uMode == 4 || uMode == 5) {
            // Alpine cabins & rally checkpoint arches (warm glowing emissive windows / floodlamps when vCol.r > 1.35)
            if (vCol.r > 1.35) {
              vec3 glow = vCol * 1.15;
              glow = applyFog(glow, vWorldPos);
              fragColor = vec4(glow, 1.0);
              return;
            }
            // Director V3: Seamless Face-Aware PBR Architectural Weathering, Matte Grit & Ground-Contact AO (ZERO toy-block plastic sheen!)
            float axA = abs(N.x), azA = abs(N.z);
            float hCoord = (vLocalPos.z * axA + vLocalPos.x * azA) / max(axA + azA, 0.001);
            vec2 archUv = vec2(hCoord * 0.40, vLocalPos.y * 0.44);
            float aWet = clamp(uWetness, 0.0, 1.0);
            float baseContact = smoothstep(0.95, -0.35, vLocalPos.y);
            float rainStreak = smoothstep(0.36, 0.80, pvFbm2(vec2(hCoord * 1.85 + vWorldPos.x * 0.12, vLocalPos.y * 0.42)));
            float microGrain = pvNoise2(vec2(hCoord * 24.0, vLocalPos.y * 22.0));
            vec3 microGritN = vec3((microGrain - 0.5) * 0.22, (pvNoise2(vec2(hCoord * 19.0 + 3.1, vLocalPos.y * 19.0)) - 0.5) * 0.18, (microGrain - 0.5) * 0.22);
            bool isStonePart = (uMode == 4 && vCol.r < 0.35 && abs(vCol.r - vCol.b) < 0.06 && vLocalPos.y < 3.45);
            bool isChimneyStone = (uMode == 4 && vLocalPos.y > 4.2 && abs(vCol.r - vCol.b) < 0.05 && vCol.r > 0.16);
            bool isBrickPart = (uMode == 4 && vCol.r > 0.40 && vCol.r < 0.78 && vCol.g > 0.16 && vCol.g < 0.42 && vCol.b < 0.28);
            if (isStonePart || isChimneyStone) {
              vec3 sAlb = texture(uStoneAlb, archUv).rgb;
              vec4 sNrmT = texture(uStoneNrm, archUv);
              vec3 sNrm = sNrmT.xyz * 2.0 - 1.0;
              float sH = sNrmT.a;
              float baseMoss = smoothstep(0.45, -0.45, vLocalPos.y) * smoothstep(0.30, 0.72, pvNoise2(vWorldPos.xz * 1.8));
              albedo = sAlb * mix(vec3(1.04), vCol * 3.6, 0.34) * mix(0.84, 1.08, microGrain);
              albedo = mix(albedo, vec3(0.075, 0.175, 0.062), baseMoss * 0.68);
              albedo *= mix(1.0, 0.72, rainStreak * 0.42 + aWet * 0.28);
              ao *= mix(0.54, 1.0, sH) * mix(1.0, 0.52, baseContact);
              N = normalize(N + vec3(sNrm.x * 0.62, sNrm.y * 0.50, sNrm.x * 0.62) + microGritN);
              rough = mix(mix(0.92, 0.72, sH), 0.56, aWet);
              clearcoat = mix(0.0, 0.12, aWet * sH);
            } else if (isBrickPart) {
              vec3 bAlb = texture(uBrickAlb, archUv * 1.35).rgb;
              vec4 bNrmT = texture(uBrickNrm, archUv * 1.35);
              vec3 bNrm = bNrmT.xyz * 2.0 - 1.0;
              float bH = bNrmT.a;
              float sootGrad = smoothstep(2.0, 6.8, vLocalPos.y) * 0.32;
              albedo = bAlb * mix(vec3(0.94), vCol * 2.0, 0.26) * mix(0.84, 1.08, microGrain);
              albedo = mix(albedo, vec3(0.11, 0.095, 0.085), clamp(sootGrad + baseContact * 0.38, 0.0, 0.62));
              albedo *= mix(1.0, 0.74, rainStreak * 0.36 + aWet * 0.26);
              ao *= mix(0.56, 1.0, bH) * mix(1.0, 0.54, baseContact);
              N = normalize(N + vec3(bNrm.x * 0.58, bNrm.y * 0.46, bNrm.x * 0.58) + microGritN);
              rough = mix(mix(0.90, 0.70, bH), 0.54, aWet);
              clearcoat = mix(0.0, 0.10, aWet * bH);
            } else if (uMode == 4 && vLocalPos.y > 2.82 && vCol.b > vCol.r) {
              // Weathered alpine slate roof shingles with crisp overlap normal & realistic damp sheen
              float shRow = fract(vLocalPos.y * 4.5);
              float shCol = fract(hCoord * 2.8 + floor(vLocalPos.y * 4.5) * 0.5);
              float shEdge = smoothstep(0.0, 0.14, shRow) * smoothstep(0.0, 0.10, shCol);
              float shVar = 0.76 + 0.40 * pvNoise2(vec2(hCoord * 2.8, vLocalPos.y * 4.5));
              albedo = vCol * shVar * (0.62 + 0.38 * shEdge) * mix(1.0, 0.76, aWet * 0.45);
              N = normalize(N + vec3((shCol - 0.5) * 0.24, (shRow - 0.5) * 0.34, (shCol - 0.5) * 0.24) + microGritN * 0.6);
              ao *= (0.76 + 0.24 * shEdge);
              rough = mix(0.72, 0.34, aWet);
              clearcoat = mix(0.04, 0.28, aWet);
            } else {
              // Preserve vibrant crisp colors on striped florist awnings & flower blooms (woven canvas grit, ZERO plastic shine!)
              float isBrightFlorist = step(0.55, max(vCol.r, max(vCol.g, vCol.b)));
              if (uMode == 4 && isBrightFlorist > 0.5) {
                float weave = 0.88 + 0.18 * pvNoise2(vec2(hCoord * 16.0, vLocalPos.y * 16.0));
                albedo = vCol * weave * mix(1.0, 0.82, rainStreak * 0.28);
                ao *= mix(1.0, 0.68, baseContact);
                rough = mix(0.86, 0.64, aWet);
                clearcoat = mix(0.0, 0.08, aWet);
              } else {
                // Weathered Rough-Sawn Alpine Timber Planks (matte grain + plank crevice AO + base splash dirt)
                vec3 wAlb = texture(uWoodAlb, archUv * 1.15).rgb;
                vec4 wNrmT = texture(uWoodNrm, archUv * 1.15);
                vec3 wNrm = wNrmT.xyz * 2.0 - 1.0;
                float wH = wNrmT.a;
                albedo = wAlb * mix(vec3(0.76), vCol * 2.55, 0.42) * mix(0.82, 1.06, microGrain);
                albedo = mix(albedo, vec3(0.08, 0.065, 0.048), baseContact * 0.48);
                albedo *= mix(1.0, 0.70, rainStreak * 0.44 + aWet * 0.28);
                ao *= mix(0.44, 1.0, wH) * mix(1.0, 0.48, baseContact);
                N = normalize(N + vec3(wNrm.x * 0.52, wNrm.y * 0.40, wNrm.x * 0.52) + microGritN);
                rough = mix(mix(0.88, 0.66, wH), 0.52, aWet);
                clearcoat = mix(0.0, 0.12, aWet * wH);
              }
            }
          } else if (uMode == 6) {
            // Dedicated Botanical Foliage & Hydrangea Blossom PBR (organic petal/leaf micro-noise + rain dew sheen, ZERO wood/brick seams!)
            float petalN = pvNoise2(vWorldPos.xz * 14.0 + vWorldPos.y * 9.0) * 0.6 + pvNoise2(vWorldPos.xz * 28.0) * 0.4;
            float isBlossom = step(0.30, vCol.b + vCol.r * 0.65);
            albedo = vCol * mix(0.76, 1.18, petalN);
            N = normalize(N + vec3((petalN - 0.5) * 0.32, (petalN - 0.5) * 0.22, (petalN - 0.5) * 0.32));
            float aWet = clamp(uWetness, 0.0, 1.0);
            rough = mix(mix(0.74, 0.52, isBlossom), 0.24, aWet * 0.7);
            clearcoat = mix(0.05, 0.38, aWet);
          }

          float shadowVal = sampleShadowPCF(vWorldPos, N);
          vec3 col = evalPBR(vWorldPos, N, V, albedo, rough, 0.0, ao, clearcoat, shadowVal);
          col += evalCarHeadlights(vWorldPos, N, V, albedo, rough);
          col = applyFog(col, vWorldPos);
          fragColor = vec4(col, 1.0);
        }
      `);

      // Item 1: Strict 3-Step Deep Green Canopy Shading (#4a7a3a lit / #2f5a26 mid / #16331f shadow) + Core Dark AO
      this.leafCardsProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aCenter;
        layout(location=1) in vec3 aBall;
        layout(location=2) in vec2 aUv;
        layout(location=3) in vec3 aOff; // xy = card offset, z = inner canopy AO
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;
        uniform mat4 uViewProj;
        uniform vec3 uCamRight;
        uniform vec3 uCamUp;
        uniform vec3 uCamPos;
        uniform float uTime;
        out vec3 vWorldPos;
        out vec3 vBall;
        out vec2 vUv;
        out float vTint;
        out float vInnerAO;
        out float vDist;
        void main() {
          float cy = cos(aInstB.x), sy = sin(aInstB.x);
          vec3 c = vec3(aCenter.x * aInstB.y, aCenter.y, aCenter.z * aInstB.y) * aInstA.w;
          // Organic multi-frequency wind gust canopy sway + fine leaf flutter
          float gust = sin(uTime * 1.65 + aInstA.x * 0.11 + aInstA.z * 0.09 + aInstB.z * 6.28);
          float flutter = sin(uTime * 3.8 + aInstB.z * 12.5 + c.y * 0.9) * 0.022;
          c.x += (gust * 0.058 + flutter) * min(c.y * 0.24, 1.35);
          c.z += (cos(uTime * 1.35 + aInstA.z * 0.12 + aInstB.z * 4.1) * 0.036) * min(c.y * 0.22, 1.2);
          vec3 rc = vec3(c.x * cy + c.z * sy, c.y, -c.x * sy + c.z * cy);
          vec3 rb = normalize(vec3(aBall.x * cy + aBall.z * sy, aBall.y, -aBall.x * sy + aBall.z * cy));
          vec4 clipCenter = uViewProj * vec4(aInstA.xyz, 1.0);
          if (clipCenter.w < -18.0 || abs(clipCenter.x) > clipCenter.w * 1.45 + 18.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          // Zero-loss 3D-to-Farwoods LOD cull beyond 285m (farwoods silhouettes seamlessly own 220m..480m!)
          float instDist = length(aInstA.xyz - uCamPos);
          if (instDist > 285.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          // Chunk Animator Anti-Pop-In: identical Ease-Out Cubic scale + rise locked to solidProg trunks!
          float popLin = smoothstep(285.0, 218.0, instDist);
          float easePop = 1.0 - pow(1.0 - popLin, 3.0);
          float popScale = mix(0.02, 1.0, easePop);
          vec3 wp = aInstA.xyz - vec3(0.0, 3.2 * (1.0 - easePop), 0.0) + rc * popScale + (uCamRight * aOff.x + uCamUp * aOff.y) * aInstA.w * (0.85 + 0.15 * aInstB.y) * easePop;
          vWorldPos = wp; vBall = rb; vUv = aUv; vTint = aInstB.w; vInnerAO = aOff.z;
          vDist = length(wp - uCamPos);
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec3 vBall;
        in vec2 vUv;
        in float vTint;
        in float vInnerAO;
        in float vDist;
        uniform sampler2D uLeafAtlas;
        uniform vec3 uLitColor;
        uniform vec3 uMidColor;
        uniform vec3 uShadColor;
        ${PV.PBR_GLSL}
        out vec4 fragColor;
        void main() {
          vec4 tex = texture(uLeafAtlas, vUv);
          float cut = mix(0.42, 0.20, smoothstep(28.0, 150.0, vDist));
          if (tex.g < cut) discard;

          vec3 N = normalize(vBall);
          vec3 V = normalize(uCamPos - vWorldPos);
          float ndl = clamp(dot(N, uLightDir) * 0.65 + 0.35, 0.0, 1.0);
          float shadowVal = sampleShadowPCF(vWorldPos, N);
          // Layered 4-Stop Cel Canopy + Botanical Subsurface Backlight (SSS) + Per-Card Vein & Instance Hue Variation!
          float leafMicro = 0.80 + 0.36 * tex.r;
          float shade = clamp((ndl * 0.68 + (N.y * 0.5 + 0.5) * 0.32) * mix(0.46, 1.0, shadowVal) * vInnerAO, 0.0, 1.0);
          float tMid = smoothstep(0.22, 0.36, shade);
          float tLit = smoothstep(0.54, 0.68, shade);
          float tRim = smoothstep(0.76, 0.92, shade) * smoothstep(0.45, 0.85, vInnerAO);
          // Biome-aware canopy palette (vTint: 0..1 standard, 1..2 Snow-Dusted Winter Evergreen, 2..3 Quarry Dry Olive Scrub!)
          float leafBiome = floor(max(0.0, vTint));
          float tintF = fract(max(0.0, vTint));
          vec3 hueShift = mix(vec3(0.90, 0.98, 1.10), vec3(1.10, 0.96, 0.92), tintF);
          vec3 celCol = mix(uShadColor * vec3(0.80, 0.94, 1.22), uMidColor * hueShift, tMid);
          celCol = mix(celCol, uLitColor * hueShift * vec3(1.06, 1.10, 0.98), tLit);
          float leafBacklit = pow(clamp(dot(V, -uLightDir) * 0.5 + 0.5, 0.0, 1.0), 2.8) * smoothstep(0.30, 0.95, vInnerAO);
          celCol = (celCol + uLitColor * (tRim * 0.24 + leafBacklit * 0.34) * uLightColor) * leafMicro;
          vec3 warmShift = mix(vec3(0.86, 1.08, 0.88), vec3(1.18, 1.04, 0.76), smoothstep(0.62, 0.96, tintF));
          celCol *= warmShift;
          if (leafBiome > 0.5 && leafBiome < 1.5) {
            // Snow Peak winter alpine: deep frosted Nordic evergreen/amber (zero spring neon-lime in winter snow!)
            float cL = dot(celCol, vec3(0.30, 0.58, 0.12));
            celCol = mix(vec3(cL) * vec3(0.38, 0.54, 0.52), celCol * vec3(0.46, 0.66, 0.60), 0.52);
            float snowBough = smoothstep(0.30, 0.76, N.y + (tex.r - 0.5) * 0.32) * smoothstep(0.42, 0.88, vInnerAO);
            celCol = mix(celCol, vec3(0.86, 0.91, 0.97) * (0.76 + 0.26 * uLightColor), snowBough * 0.60);
          } else if (leafBiome > 1.5) {
            // Quarry Gorge: dusty olive-ochre hillside scrub (ZERO neon-green clash against terracotta clay!)
            celCol = mix(celCol, celCol * vec3(1.10, 0.78, 0.44), 0.76);
          }

          // Backlit subsurface scattering + weather-differentiated wet-leaf Fresnel rain sheen
          float fWet = clamp(uWetness, 0.0, 1.0);
          float sss = pow(max(dot(V, -uLightDir), 0.0), 3.0) * mix(0.34, 0.22, fWet) * vInnerAO;
          float wetRim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * mix(0.04, 0.28, fWet) * (0.4 + 0.6 * N.y);
          float leafVar = mix(0.84, 1.14, tex.r);
          vec3 col = celCol * leafVar * mix(0.88, 1.14, tintF) * uLightColor * 0.92;
          col += uLitColor * sss + vec3(0.28, 0.34, 0.38) * wetRim;
          col = applyFog(col, vWorldPos);
          fragColor = vec4(col, 1.0);
        }
      `);

      this.farwoodsProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=2) in vec2 aUv;
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;
        uniform mat4 uViewProj;
        uniform vec3 uCamRight;
        uniform vec3 uCamPos;
        out vec3 vWorldPos;
        out vec2 vUv;
        out float vTint;
        void main() {
          vec4 clipF = uViewProj * vec4(aInstA.xyz, 1.0);
          if (clipF.w < -24.0 || abs(clipF.x) > clipF.w * 1.45 + 24.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float fDist = length(aInstA.xyz - uCamPos);
          if (fDist > 480.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float fPop = smoothstep(480.0, 385.0, fDist);
          float fEase = 1.0 - pow(1.0 - fPop, 3.0);
          float fScale = aInstA.w * mix(0.08, 1.0, fEase);
          vec3 horizR = normalize(vec3(uCamRight.x, 0.0, uCamRight.z));
          vec3 wp = aInstA.xyz - vec3(0.0, 5.5 * (1.0 - fEase), 0.0) + horizR * (aPos.x * fScale * aInstB.y) + vec3(0.0, aPos.y * fScale, 0.0);
          float slot = floor(aInstB.x);
          vUv = vec2((slot + aUv.x) / 8.0, aUv.y);
          vWorldPos = wp; vTint = aInstB.w;
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec2 vUv;
        in float vTint;
        uniform sampler2D uFarAtlas;
        ${PV.PBR_GLSL}
        out vec4 fragColor;
        void main() {
          vec4 tex = texture(uFarAtlas, vUv);
          if (tex.g < 0.36) discard;
          float leafLum = mix(0.72, 1.16, tex.r);
          // Biome-aware distant woodland silhouettes (eliminates 138m..380m bald grey distant hills!)
          float fb = floor(max(0.0, vTint));
          float ft = fract(max(0.0, vTint));
          vec3 darkCol = ft > 0.82 ? vec3(0.14, 0.10, 0.04) : vec3(0.020, 0.052, 0.036);
          vec3 litCol  = ft > 0.82 ? vec3(0.34, 0.24, 0.09) : vec3(0.072, 0.142, 0.076);
          if (fb > 0.5 && fb < 1.5) {
            // Glacial Peak: frosted deep alpine spruce silhouettes
            darkCol = vec3(0.045, 0.085, 0.095);
            litCol  = mix(vec3(0.16, 0.24, 0.26), vec3(0.68, 0.74, 0.82), smoothstep(0.50, 0.88, tex.r) * 0.62);
          } else if (fb > 1.5 && fb < 2.5) {
            // Golden Birch: warm autumn amber & gold distant woodland
            darkCol = vec3(0.14, 0.085, 0.028);
            litCol  = vec3(0.38, 0.25, 0.065);
          } else if (fb > 2.5 && fb < 3.5) {
            // Quarry Gorge: dusty olive-ochre hillside pines
            darkCol = vec3(0.065, 0.068, 0.035);
            litCol  = vec3(0.18, 0.15, 0.072);
          } else if (fb > 3.5) {
            // Bamboo Shrine: lush emerald-jade cedar & bamboo ridge silhouettes
            darkCol = vec3(0.018, 0.064, 0.042);
            litCol  = vec3(0.078, 0.185, 0.095);
          }
          vec3 col = mix(darkCol, litCol, smoothstep(0.32, 0.86, tex.r)) * leafLum;
          float camD = length(vWorldPos - uCamPos);
          // Smooth atmospheric mist dissolve out to 480m so every distant hillside stays richly forested!
          if (camD > 480.0) discard;
          col = applyFog(col, vWorldPos);
          vec3 farSky = sampleRainyIBL(normalize(vWorldPos - uCamPos), 0.35);
          col = mix(col, mix(uFogColor, farSky, 0.55), smoothstep(210.0, 465.0, camD) * 0.88);
          fragColor = vec4(col, 1.0);
        }
      `);
    }

    rebuildFromTrack(track, camPos) {
      this._lastTrack = track;
      const nearSet = new Set();
      let sig = `${track.originResets || 0}_${track.seed || 0}`;
      for (const s of track.segments) {
        let isNear = true;
        if (camPos && s.pts && s.pts.length) {
          const mid = s.pts[s.pts.length >> 1].pos;
          // Extended zero-loss 3D near-window (0..285m) + shadow gate <=95m so distant hills never look bare!
          const nearR = (s.len || 228) * 0.56 + 245.0;
          const dx = mid[0] - camPos[0], dz = mid[2] - camPos[2];
          isNear = (dx * dx + dz * dz) <= nearR * nearR;
        }
        if (isNear) nearSet.add(s.id);
        sig += `_${s.id}:${s._meshRev || 0}:${isNear ? 1 : 0}`;
      }
      if (sig === this._lastTrackSig) return;
      this._lastTrackSig = sig;
      const cP = [0, 0, 0], cB = [0, 0, 0], cBi = [0, 0, 0], cBould = [0, 0, 0];
      let cBam=0, cShrub=0, cFar=0, cSlab=0, cPeb=0, cBol=0, cChev=0, cAO=0, cCab=0, cArch=0, cFlag=0, cTire=0, cLamp=0, cTent=0;
      let cSLant=0, cWStat=0, cReed=0, cKiln=0;
      let curRockBiome = 0.0;
      let curLeafBiome = 0.0;
      const pushBould = (x, y, z, s, yaw, asp, h2, h1) => {
        const bv = Math.floor(Math.abs(h1 * 13.7 + h2 * 7.3) * 3) % 3;
        const tintEnc = curRockBiome + (Math.abs(h1) % 0.98);
        cBould[bv] = push(this.boulders[bv], cBould[bv], x, y, z, s, yaw, asp, h2, tintEnc);
      };
      let cPole=0, cHydra=0, cSak=0, cLarch=0, cBare=0;
      const push = (mesh, idx, x, y, z, s, b0, b1, b2, b3) => {
        if (idx >= mesh.maxInstances) return idx;
        const o = idx * 4;
        mesh.dataA[o]=x; mesh.dataA[o+1]=y; mesh.dataA[o+2]=z; mesh.dataA[o+3]=s;
        mesh.dataB[o]=b0; mesh.dataB[o+1]=b1; mesh.dataB[o+2]=b2; mesh.dataB[o+3]=b3;
        return idx + 1;
      };
      const RW = PV.TRACK_CFG.ROAD_HALF_W;
      let lastKey = -1;

      for (const seg of track.segments) {
        const isNear3D = nearSet.has(seg.id);
        const s0 = seg.sStart, s1 = seg.sEnd, segLen = Math.max(60.0, s1 - s0), seedBase = seg.id * 1000;
        const isBridge = seg.surfMode === 1;
        const isTunnel = seg.surfMode === 2;
        const hm = seg.hillMode;
        const tid = seg.themeId || 0;
        const vp = seg.vegPreset || { treeStep: 4.5, treeSkip: 0.0, shrubMul: 1.0, flowerMul: 1.0, rockMul: 1.0, birchBias: 0, broadBias: 0, larchBias: 0, sakuraBoost: false };
        const ap = seg.archPreset || { key: 'wild_untouched', cabinCount: 0, stationCount: 0, kilnCount: 0, lanternMul: 0, flagMul: 1.0, tireMul: 1.0 };
        curRockBiome = (tid === 1 ? 1.0 : (tid === 5 ? 2.0 : (tid === 6 ? 3.0 : 0.0)));
        curLeafBiome = (tid === 1 ? 1.0 : (tid === 5 ? 2.0 : 0.0));
        // Per-instance snow mix for Snow Peak (tid === 1): ~48% snow-dusted, ~52% deep evergreen (never 100% white!)
        const pickLeafBiome = (hVal) => (tid === 1 ? (hVal > 0.52 ? 1.0 : 0.0) : curLeafBiome);
        const valleySide = hm === 1 ? -1 : 1;
        const mtnSide = -valleySide;

        // 1. Volumetric 3-Cut Boulders + Restrained Roadside Pebbles + Timber Marker Posts (Zero-loss 3D distance window!)
        if (isNear3D) {
        if (isTunnel) {
          // Organic rocky overburden crown + lush shrubs + alpine conifers cleanly BEHIND stone portal brow (ZERO boulders poking through stone face!)
          // Round 6: Bring brow crown rocks/shrubs forward to s0+10.5 so they directly break up the portal dome silhouette!
          const portalSList = [s0 + 10.5, s0 + 18.5, s1 - 18.5, s1 - 10.5];
          for (let pi = 0; pi < portalSList.length; pi++) {
            const ps = portalSList[pi];
            const sp = track.sampleAtS(ps);
            if (!sp) continue;
            const isCrown = (pi === 0 || pi === 3);
            const baseH = isCrown ? 10.8 : 13.4;
            // Outer-flank boulders + sculpted cliffSlabs cradling the red-brick wing wall junction seamlessly!
            for (const blat of [-17.2, -13.6, 13.6, 17.2]) {
              const h1 = hash(seedBase + pi * 71 + blat * 13.3);
              const h2 = hash(seedBase + pi * 37 + blat * 7.9);
              const bx = sp.pos[0] + sp.right[0] * blat, bz = sp.pos[2] + sp.right[2] * blat;
              const by = sp.pos[1] + (1.8 + h1 * 3.0);
              pushBould(bx, by, bz, 1.15 + h2 * 0.85, h1 * 6.28, 1.05 + h2 * 0.3, h2, h1 * 0.45);
              if (isCrown) {
                cSlab = push(this.cliffSlabs, cSlab, bx, by - 0.6, bz, 1.25 + h2 * 0.65, sp.yaw + (h1 - 0.5) * 1.2, 0.95, h2, curRockBiome + (h1 % 0.98));
              }
            }
            // Lush ferns/shrubs crowning the top of the stone parapet wall cleanly
            // Round 2: 3D jagged craggy basalt cliffSlabs crowning the portal brow (eliminates smooth dome silhouette!)
            if (isCrown) {
              for (const clat of [-8.8, -4.6, 0.0, 4.6, 8.8]) {
                const hc1 = hash(seedBase + pi * 61 + clat * 9.3);
                const hc2 = hash(seedBase + pi * 31 + clat * 15.7);
                const cx = sp.pos[0] + sp.right[0] * clat, cz = sp.pos[2] + sp.right[2] * clat;
                const cy = sp.pos[1] + baseH - 1.15 + (1.0 - Math.abs(clat) / 11.0) * 1.4 + hc1 * 0.8;
                cSlab = push(this.cliffSlabs, cSlab, cx, cy, cz, 1.35 + hc2 * 0.72, sp.yaw + (hc1 - 0.5) * 1.8, 0.72 + hc1 * 0.32, hc2, curRockBiome + (hc1 % 0.98));
              }
            }
            for (const slat of [-10.0, -6.8, -3.6, 0.0, 3.6, 6.8, 10.0]) {
              const h1 = hash(seedBase + pi * 53 + slat * 11.7);
              const h2 = hash(seedBase + pi * 29 + slat * 19.1);
              const sx = sp.pos[0] + sp.right[0] * slat, sz = sp.pos[2] + sp.right[2] * slat;
              const sy = sp.pos[1] + (Math.abs(slat) > 8.6 ? (5.2 + h1 * 3.0) : (baseH - 0.85 + h1 * 0.7));
              const ssc = 0.82 + h2 * 0.62;
              cShrub = push(this.shrubTrunks, cShrub, sx, sy, sz, ssc, h1 * 6.28, 1.1, h2, 0.35 + h1 * 0.55);
              push(this.shrubCards, cShrub - 1, sx, sy, sz, ssc, h1 * 6.28, 1.1, h2, pickLeafBiome(h2) + 0.35 + h1 * 0.55);
            }
            // Tall alpine spruce trees crowning the mountain ridge right above the tunnel portal!
            for (const tlat of [-13.5, -7.8, -2.5, 3.2, 8.6, 14.0]) {
              const h1 = hash(seedBase + pi * 89 + tlat * 5.3);
              const h2 = hash(seedBase + pi * 43 + tlat * 17.7);
              const tx = sp.pos[0] + sp.right[0] * tlat, tz = sp.pos[2] + sp.right[2] * tlat;
              const ty = sp.pos[1] + baseH + 0.3 + (1.0 - Math.abs(tlat) / 18.0) * 2.2;
              const v = Math.floor(h1 * 3) % 3;
              const sc = 0.95 + h2 * 0.62;
              cP[v] = push(this.pines[v].t, cP[v], tx, ty, tz, sc, h2 * 6.28, 0.95, h1, 0.28 + h2 * 0.55);
              push(this.pines[v].c, cP[v] - 1, tx, ty, tz, sc, h2 * 6.28, 0.95, h1, pickLeafBiome(h1) + 0.28 + h2 * 0.55);
            }
          }
        }
        if (isBridge) {
          // Lush Forested Gorge Canyon Walls & Riverbank Boulders flanking EVERY bridge (zero empty sky-void through bridge trusses!)
          for (let s = s0 + 8; s < s1 - 8; s += 9.5) {
            const sp = track.sampleAtS(s);
            if (!sp) continue;
            for (const side of [-1, 1]) {
              const h1 = hash(seedBase + s * 17.3 + side * 41);
              const h2 = hash(seedBase + s * 29.7 + side * 67);
              // Riverbank mossy boulders along the gorge canyon floor (lat 20..36m)
              const blat = side * (20.0 + h1 * 16.0);
              const bx = sp.pos[0] + sp.right[0] * blat, bz = sp.pos[2] + sp.right[2] * blat;
              const by = track.sampleGroundY(s, blat) - 0.55;
              pushBould(bx, by, bz, 1.35 + h2 * 1.15, h1 * 6.28, 1.1 + h2 * 0.3, h2, h1 * 0.6);
              // Rising forested canyon wall conifers (lat 46..106m) framing the side vista beautifully!
              for (let ti = 0; ti < 2; ti++) {
                const ht1 = hash(seedBase + s * 11.1 + side * 83 + ti * 31);
                const ht2 = hash(seedBase + s * 23.9 + side * 59 + ti * 47);
                const tlat = side * (46.0 + ti * 26.0 + ht1 * 28.0);
                const tx = sp.pos[0] + sp.right[0] * tlat, tz = sp.pos[2] + sp.right[2] * tlat;
                const ty = track.sampleGroundY(s, tlat) - 0.45;
                if (ty < sp.pos[1] - 16.5) continue;
                const v = Math.floor(ht1 * 3) % 3;
                const sc = 1.05 + ht2 * 0.78;
                cP[v] = push(this.pines[v].t, cP[v], tx, ty, tz, sc, ht2 * 6.28, 0.92 + ht1 * 0.2, ht1, 0.25 + ht2 * 0.55);
                push(this.pines[v].c, cP[v] - 1, tx, ty, tz, sc, ht2 * 6.28, 0.92 + ht1 * 0.2, ht1, pickLeafBiome(ht1) + 0.25 + ht2 * 0.55);
              }
            }
          }
        }
        if (!isBridge && !isTunnel) {
          const ecoR = (seg.ecoRecipe && seg.ecoRecipe.rockDensity) ? seg.ecoRecipe.rockDensity : 1.0;
          const bouldStep = Math.max(5.5, 8.2 / ecoR);
          for (let s = s0 + 4; s < s1 - 2; s += bouldStep) {
            const sp = track.sampleAtS(s);
            if (!sp) continue;
            const h1 = hash(seedBase + s * 13.7), h2 = hash(seedBase + s * 23.1), h3 = hash(seedBase + s * 41.9);
            const sides = (hm === 2 || hm === 0) ? [-1, 1] : [hm];
            for (const side of sides) {
              if (side === valleySide && (seg.hasLake || seg.hasCloudSea)) continue;
              const lat = side * (RW + 2.4 + h1 * 14.0);
              const effB = track.mapLat ? track.mapLat(sp, lat) : lat;
              const yHereB = track.sampleGroundY(s, lat);
              const yPrevB = track.sampleGroundY(Math.max(0, s - 5.5), lat);
              const yNextB = track.sampleGroundY(s + 5.5, lat);
              if (Math.abs(yHereB - yPrevB) > 2.6 || Math.abs(yHereB - yNextB) > 2.6) continue;
              const bx = sp.pos[0]+sp.right[0]*effB, bz = sp.pos[2]+sp.right[2]*effB;
              if (track.isNearAnyRoad && track.isNearAnyRoad(bx, bz, seg.id, RW + 1.8)) continue;
              const yMinB = Math.min(yHereB, yPrevB, yNextB, track.sampleGroundY(s, lat - side * 2.2));
              const by = yMinB - 1.05;
              const bs = 0.72 + h2 * 1.15;
              pushBould(bx, by, bz, bs, h1*6.28, 0.80+h1*0.42, h2, h1);
              cAO = push(this.contactAO, cAO, bx, by + 0.45, bz, bs * 1.55, 0, 0.48, 0, 0);
              // Companion nested shrub hugging boulder base (matches demo_ref_atlas.jpg organic rock+foliage pairing!)
              if (tid !== 1 && h3 > 0.36) {
                const shx = bx - sp.right[0] * side * (bs * 0.65), shz = bz - sp.right[2] * side * (bs * 0.65);
                const shsc = 0.56 + h3 * 0.48;
                cShrub = push(this.shrubTrunks, cShrub, shx, yMinB - 0.16, shz, shsc, h2 * 6.28, 1.05, h3, 0.35 + h1 * 0.55);
                push(this.shrubCards, cShrub - 1, shx, yMinB - 0.16, shz, shsc, h2 * 6.28, 1.05, h3, pickLeafBiome(h3) + 0.35 + h1 * 0.55);
              }
            }
          }

          // ACTIVATE Sculpted Layered Cliff Massif Slabs & Large Slope-Crest Cover Rocks (masks bald slope tops & roadside banks across ALL biomes!)
          const biomeSlabMul = (tid === 3 || tid === 5 || tid === 1) ? 1.75 : 1.25;
          const slabStep = Math.max(4.8, 10.5 / (ecoR * biomeSlabMul));
          for (let s = s0 + 4; s < s1 - 4; s += slabStep) {
            const sp = track.sampleAtS(s);
            if (!sp) continue;
            const hs1 = hash(seedBase + s * 29.3), hs2 = hash(seedBase + s * 53.7), hs3 = hash(seedBase + s * 71.1);
            if (seg.landform === 'plain_meadow') continue;
            const sides = (hm === 2 || hm === 0 || tid === 1) ? [-1, 1] : [hm];
            for (const side of sides) {
              if (side === valleySide && (seg.hasLake || seg.hasCloudSea)) continue;
              // Tier A: Roadside cut-bank large boulder/cliff slab
              const lat = side * (RW + (tid === 1 || tid === 3 || tid === 5 ? 2.4 : 3.8) + hs1 * 9.5);
              const effS = track.mapLat ? track.mapLat(sp, lat) : lat;
              const yHere = track.sampleGroundY(s, lat);
              const yPrev = track.sampleGroundY(Math.max(0, s - 6.0), lat);
              const yNext = track.sampleGroundY(s + 6.0, lat);
              if (Math.abs(yHere - yPrev) <= 2.6 && Math.abs(yHere - yNext) <= 2.6) {
                const sx = sp.pos[0] + sp.right[0] * effS, sz = sp.pos[2] + sp.right[2] * effS;
                if (!(track.isNearAnyRoad && track.isNearAnyRoad(sx, sz, seg.id, RW + 2.2))) {
                  const sy = Math.min(yHere, yPrev, yNext) - 1.85;
                  const sc = (tid === 1 ? 1.05 : 0.92) + hs2 * 0.98;
                  cSlab = push(this.cliffSlabs, cSlab, sx, sy, sz, sc, sp.yaw + (hs1 - 0.5) * 2.2, 0.80 + hs2 * 0.45, hs2, curRockBiome + (hs1 % 0.98));
                }
              }
              // Tier B: Upper slope-crest large rock outcrops masking bare/bald hilltops (光秃秃的坡顶掩盖!)
              if (hs3 > 0.36) {
                const crestLat = side * (RW + 11.5 + hs3 * 16.5);
                const effC = track.mapLat ? track.mapLat(sp, crestLat) : crestLat;
                const cx = sp.pos[0] + sp.right[0] * effC, cz = sp.pos[2] + sp.right[2] * effC;
                if (!(track.isNearAnyRoad && track.isNearAnyRoad(cx, cz, seg.id, RW + 3.5))) {
                  const cy = track.sampleGroundY(s, crestLat) - 1.95;
                  const csc = 1.25 + hs2 * 1.15;
                  cSlab = push(this.cliffSlabs, cSlab, cx, cy, cz, csc, sp.yaw + hs3 * 6.28, 0.72 + hs1 * 0.52, hs1, curRockBiome + (hs2 % 0.98));
                }
              }
            }
          }
          // Snow Peak & Kyoto roadside hero boulder clusters (respects cross-biome lakes & cliff drops!)
          if (tid === 1 || tid === 6) {
            const heroStep = tid === 1 ? 4.2 : 5.6;
            for (let s = s0 + 3; s < s1 - 3; s += heroStep) {
              const sp = track.sampleAtS(s);
              if (!sp) continue;
              for (const side of [-1, 1]) {
                if (side === valleySide && (seg.hasLake || seg.hasCloudSea)) continue;
                const hA = hash(seedBase + s * 43.1 + side * 19.7);
                const hB = hash(seedBase + s * 61.3 + side * 31.1);
                if (hA < 0.28) continue;
                const rLat = side * (RW + 1.15 + hA * (tid === 1 ? 7.8 : 3.2));
                const effR = track.mapLat ? track.mapLat(sp, rLat) : rLat;
                const rx = sp.pos[0] + sp.right[0] * effR, rz = sp.pos[2] + sp.right[2] * effR;
                if (track.isNearAnyRoad && track.isNearAnyRoad(rx, rz, seg.id, RW + 0.9)) continue;
                const ry = track.sampleGroundY(s, rLat) - (tid === 1 ? 0.42 : 0.26);
                const rsc = tid === 1 ? (0.85 + hB * 1.35) : (0.58 + hB * 0.72);
                pushBould(rx, ry, rz, rsc, hB * 6.28, 0.85 + hA * 0.55, hA, curRockBiome + (hB % 0.96));
              }
            }
          }

          // Natural shoulder gravel stones strictly hugging muddy verges (ZERO black dots in puddle tracks, ZERO floating abyss pebbles!)
          for (let s = s0 + 1.0; s < s1; s += 2.2) {
            const sp = track.sampleAtS(s);
            if (!sp) continue;
            for (const side of [-1, 1]) {
              if (side === valleySide && (seg.hasCloudSea || seg.hasLake)) continue;
              const h1 = hash(seedBase + s * 19.3 + side * 41);
              const h2 = hash(seedBase + s * 31.7 + side * 13);
              const lat = side * (RW - 0.48 + h1 * 1.65);
              const gyP = track.sampleGroundY(s, lat);
              if (gyP < sp.pos[1] - 1.2) continue;
              const pScale = 0.42 + h2 * 0.62;
              cPeb = push(this.pebbles, cPeb, sp.pos[0]+sp.right[0]*lat, gyP - 0.04, sp.pos[2]+sp.right[2]*lat, pScale, h1 * 6.28, 1.15 + h2 * 0.45, h2, h1);
            }
          }

          // Continuous roadside timber marker bollards (with contact AO shadows!)
          for (let s = s0 + 8; s < s1; s += 16.0) {
            if (seg.hasCloudSea || seg.hasLake) continue;
            const sp = track.sampleAtS(s);
            if (!sp) continue;
            const valleySide = hm === 1 ? -1 : 1;
            const lat = valleySide * (RW + 0.55);
            const px = sp.pos[0]+sp.right[0]*lat, pz = sp.pos[2]+sp.right[2]*lat;
            const py = track.sampleGroundY(s, lat) - 0.05;
            if (py < sp.pos[1] - 1.2) continue;
            cBol = push(this.bollards, cBol, px, py, pz, 1.0, sp.yaw, 1.0, 0, 1.0);
            cAO = push(this.contactAO, cAO, px, py + 0.08, pz, 0.52, 0, 0.42, 0, 0);
          }

          // Combinatorial Alpine Chalets / Cottages driven by archPreset (scaled across 228m!)
          const isVillage = (ap.key === 'hamlet_cluster') || (tid === 0 && (seg.type === 'village_pass' || seg.type === 'alpine_hamlet'));
          const cabCount = (tid === 1 || tid === 5 || tid === 6 || seg.hasCloudSea) ? 0 : Math.max(ap.cabinCount || 0, isVillage ? 2 : 0);
          for (let ci = 0; ci < cabCount; ci++) {
            const fracC = (0.14 + (ci + 0.5) * (0.72 / Math.max(1, cabCount)));
            const cs = s0 + segLen * fracC + (hash(seedBase + 7.7 + ci * 19.3) - 0.5) * 18.0;
            const sp = track.sampleAtS(cs);
            if (sp) {
              const cabSide = (hm === 1 ? 1 : -1);
              const clat = cabSide * (RW + (isVillage ? 4.85 : 5.6) + hash(seedBase + 13.1 + ci * 11.7) * 1.35);
              const cx = sp.pos[0] + sp.right[0] * clat, cz = sp.pos[2] + sp.right[2] * clat;
              const cy = Math.min(track.sampleGroundY(cs, clat), track.sampleGroundY(cs + 4.0, clat), track.sampleGroundY(Math.max(0, cs - 4.0), clat)) + 0.15;
              const cabYaw = sp.yaw + (cabSide > 0 ? -Math.PI * 0.68 : Math.PI * 0.68) + (hash(seedBase + 3.3 + ci * 7.1) - 0.5) * 0.12;
              cCab = push(this.cabins, cCab, cx, cy, cz, 0.98 + hash(seedBase + 9.9 + ci * 5.3) * 0.22, cabYaw, 1.0, 0, 1.0);
              cAO = push(this.contactAO, cAO, cx, cy + 0.35, cz, 4.6, 0, 0.55, 0, 0);
              if (ci % 2 === 1) {
                const ts2 = Math.min(s1 - 6, cs + 10.5);
                const tsp2 = track.sampleAtS(ts2);
                if (tsp2) {
                  const tlat2 = -cabSide * (RW + 1.45);
                  const tx2 = tsp2.pos[0] + tsp2.right[0] * tlat2, tz2 = tsp2.pos[2] + tsp2.right[2] * tlat2;
                  const ty2 = track.sampleGroundY(ts2, tlat2) - 0.04;
                  cTire = push(this.tires, cTire, tx2, ty2, tz2, 0.92, tsp2.yaw, 1.0, 0, 1.0);
                  cAO = push(this.contactAO, cAO, tx2, ty2 + 0.10, tz2, 1.15, 0, 0.42, 0, 0);
                }
              }
              for (const boff of [-2.8, -1.2, 0.8, 2.6]) {
                const bsp = track.sampleAtS(Math.max(0, cs + boff));
                if (!bsp) continue;
                const blat = clat - cabSide * 2.55;
                const bx = bsp.pos[0] + bsp.right[0] * blat, bz = bsp.pos[2] + bsp.right[2] * blat;
                const by = track.sampleGroundY(Math.max(0, cs + boff), blat) - 0.35;
                pushBould(bx, by, bz, 0.72 + Math.abs(boff) * 0.12, boff * 1.7, 1.15, 0.5, 0.42);
                cShrub = push(this.shrubTrunks, cShrub, bx, by + 0.35, bz, 0.78, boff * 2.3, 1.1, 0.6, 0.45);
                push(this.shrubCards, cShrub - 1, bx, by + 0.35, bz, 0.78, boff * 2.3, 1.1, 0.6, pickLeafBiome(0.5) + 0.45);
              }
              if (isVillage) {
                const llat = cabSide * (RW + 1.55);
                const lx = sp.pos[0] + sp.right[0] * llat, lz = sp.pos[2] + sp.right[2] * llat;
                const ly = track.sampleGroundY(cs, llat) - 0.08;
                cLamp = push(this.lamps, cLamp, lx, ly, lz, 1.0, sp.yaw + (cabSide > 0 ? Math.PI : 0), 1.0, 0, 1.0);
                if (ci === 0) {
                  const ts = Math.min(s1 - 8, cs + 14);
                  const tsp = track.sampleAtS(ts);
                  if (tsp) {
                    const tlat = cabSide * (RW + 4.4);
                    const tx = tsp.pos[0] + tsp.right[0] * tlat, tz = tsp.pos[2] + tsp.right[2] * tlat;
                    const ty = track.sampleGroundY(ts, tlat) - 0.18;
                    cTent = push(this.tents, cTent, tx, ty, tz, 1.0, tsp.yaw + (cabSide > 0 ? -Math.PI * 0.5 : Math.PI * 0.5), 1.0, 0, 1.0);
                    cAO = push(this.contactAO, cAO, tx, ty + 0.15, tz, 2.8, 0, 0.48, 0, 0);
                  }
                }
              }
            }
          }

          // === THEME + ARCH_PRESET SIGNATURE ARCHITECTURE & PROPS ===
          const statCount = (tid === 1) ? Math.max(2, ap.stationCount || 2) : (ap.stationCount || 0);
          if (statCount > 0 && !seg.hasLake) {
            for (let si2 = 0; si2 < statCount; si2++) {
              const ws = s0 + segLen * (0.24 + (si2 + 0.5) * (0.56 / Math.max(1, statCount)));
              const sp = track.sampleAtS(ws);
              if (!sp) continue;
              const wlat = mtnSide * (RW + 6.8);
              const wx = sp.pos[0] + sp.right[0] * wlat, wz = sp.pos[2] + sp.right[2] * wlat;
              const wy = Math.min(track.sampleGroundY(ws, wlat), track.sampleGroundY(ws + 4, wlat)) + 0.10;
              cWStat = push(this.weatherStations, cWStat, wx, wy, wz, 1.05, sp.yaw + (mtnSide > 0 ? -Math.PI * 0.5 : Math.PI * 0.5), 1.0, 0, 1.0);
            }
          }
          if (tid === 1) {
            for (let ds = s0 + 6; ds < s1 - 6; ds += 7.5) {
              const sp = track.sampleAtS(ds);
              if (!sp) continue;
              const hd = hash(seedBase + ds * 19.1);
              const hd2 = hash(seedBase + ds * 37.3);
              const dSide = (seg.hasLake || seg.hasCloudSea || hd > 0.38) ? mtnSide : valleySide;
              const dlat = dSide * (RW + 3.2 + hd * 22.0);
              const effL = track.mapLat ? track.mapLat(sp, dlat) : dlat;
              const dx = sp.pos[0] + sp.right[0] * effL, dz = sp.pos[2] + sp.right[2] * effL;
              if (track.isNearAnyRoad && track.isNearAnyRoad(dx, dz, seg.id, RW + 3.5)) continue;
              const dy = track.sampleGroundY(ds, dlat) - 0.55;
              const dsc = 0.72 + hd2 * 0.68;
              // Organic multi-species alpine slope mix: Golden Larch + Wind-Bent Deadwood + Alpine Talus Granite Boulders!
              if (hd2 > 0.52) {
                cLarch = push(this.yellowLarchT, cLarch, dx, dy, dz, dsc, hd * 6.28, 0.95, hd, 0.5 + hd * 0.5);
                push(this.yellowLarchC, cLarch - 1, dx, dy, dz, dsc, hd * 6.28, 0.95, hd, 1.0 + Math.min(0.95, 0.45 + hd * 0.45));
              } else if (hd2 > 0.24) {
                cBare = push(this.bareDeadwood, cBare, dx, dy, dz, dsc * 1.02, hd * 6.28, 0.95, hd, 0.5 + hd * 0.5);
              } else {
                pushBould(dx, dy - 0.25, dz, 1.15 + hd * 1.45, hd2 * 6.28, 1.1, 0.2, 0.4);
              }
            }
          } else if (seg.hasLake || tid === 2) {
            // Theme 2 (Lakeside Loop): Boardwalk removed! Irregular natural lakeside reed clumps & mossy shoreline rocks with wide open vistas onto the sparkling lake!
            for (let s = s0 + 2; s < s1 - 2; s += 3.6) {
              const sp = track.sampleAtS(s);
              if (!sp) continue;
              const h1 = hash(seedBase + s * 17.3);
              const h2 = hash(seedBase + s * 31.9);
              if (h1 < 0.44) continue; // 44% wide open sightlines directly onto the sparkling lake!
              const clusterN = h1 > 0.78 ? 3 : 2;
              for (let rc = 0; rc < clusterN; rc++) {
                const hrc = hash(seedBase + s * 7.1 + rc * 19.3);
                const rlat = valleySide * (RW + 1.05 + hrc * 3.8);
                const effR = track.mapLat ? track.mapLat(sp, rlat) : rlat;
                const rx = sp.pos[0] + sp.right[0] * effR + sp.fwd[0] * (hrc - 0.5) * 2.4;
                const rz = sp.pos[2] + sp.right[2] * effR + sp.fwd[2] * (hrc - 0.5) * 2.4;
                const lakeY = seg.lakeY !== undefined ? seg.lakeY : (sp.pos[1] - 2.35);
                const gyR = track.sampleGroundY(s, rlat);
                const ry = Math.max(lakeY - 0.05, Math.min(sp.pos[1] - 0.15, gyR - 0.12));
                cReed = push(this.shoreReeds, cReed, rx, ry, rz, 0.72 + hrc * 0.72, hrc * 6.28, 1.0, 0, hrc);
              }
              if (h2 > 0.74) {
                const blat = valleySide * (RW + 1.6 + h2 * 4.2);
                const effB = track.mapLat ? track.mapLat(sp, blat) : blat;
                const bx = sp.pos[0] + sp.right[0] * effB, bz = sp.pos[2] + sp.right[2] * effB;
                const by = Math.min(track.sampleGroundY(s, blat), (seg.lakeY !== undefined ? seg.lakeY : (sp.pos[1] - 2.35)) + 0.15) - 0.55;
                pushBould(bx, by, bz, 0.68 + h1 * 0.82, h2 * 6.28, 1.15, 0.35, 0.45);
              }
            }
          }
          const kilnN = (tid === 5) ? Math.max(2, ap.kilnCount || 2) : (ap.kilnCount || 0);
          if (kilnN > 0 && !seg.hasLake && !seg.hasCloudSea) {
            // Red-Brick Industrial Kilns scaled proportionally across 228m segments
            for (let ki = 0; ki < kilnN; ki++) {
              const ks = s0 + segLen * (0.20 + (ki + 0.5) * (0.62 / Math.max(1, kilnN)));
              const sp = track.sampleAtS(ks);
              if (!sp) continue;
              const kSide = (ki % 2 === 0 ? -1 : 1);
              const klat = kSide * (RW + 7.2);
              const kx = sp.pos[0] + sp.right[0] * klat, kz = sp.pos[2] + sp.right[2] * klat;
              const ky = Math.min(track.sampleGroundY(ks, klat), track.sampleGroundY(ks + 4, klat)) + 0.10;
              cKiln = push(this.quarryKilns, cKiln, kx, ky, kz, 1.08, sp.yaw + (kSide > 0 ? -Math.PI * 0.5 : Math.PI * 0.5), 1.0, 0, 1.0);
            }
          }
          // STRICT ECOLOGICAL ISOLATION: Japanese stone lanterns appear ONLY in Bamboo Shrine Pass (tid === 6)!
          const lantMul = (tid === 6) ? Math.max(1.0, ap.lanternMul || 1.0) : 0;
          if (tid === 6 && lantMul > 0) {
            const maxLant = Math.max(2, Math.round((segLen / 60.0) * lantMul));
            let lantCount = 0;
            for (let s = s0 + 22 + hash(seedBase + 19.3) * 24; s < s1 - 18 && lantCount < maxLant; s += (segLen / (maxLant + 0.6)) * (0.82 + hash(seedBase + s * 11.7) * 0.36)) {
              const hl = hash(seedBase + s * 23.7);
              const sJit = s + (hl - 0.5) * 10.0;
              const sp = track.sampleAtS(sJit);
              if (!sp) continue;
              const side = (seg.hasLake || seg.hasCloudSea) ? mtnSide : (hl > 0.5 ? 1 : -1);
              const llat = side * (RW + 1.85 + hash(seedBase + sJit * 5.1 + side) * 2.15);
              const effL = track.mapLat ? track.mapLat(sp, llat) : llat;
              const lx = sp.pos[0] + sp.right[0] * effL, lz = sp.pos[2] + sp.right[2] * effL;
              const ly = track.sampleGroundY(sJit, llat) - 0.08;
              cSLant = push(this.stoneLanterns, cSLant, lx, ly, lz, 0.92 + hl * 0.18, sp.yaw + (hl - 0.5) * 0.55, 1.0, 0, 1.0);
              cAO = push(this.contactAO, cAO, lx, ly + 0.08, lz, 1.1, 0, 0.44, 0, 0);
              lantCount++;
            }
          }
          if (tid === 6) {
            // Organic multi-depth Hydrangea Drifts: clusters of 2-4 varied bushes climbing from verge up mossy hillsides (RW+1.3m .. RW+18m)!
            for (let s = s0 + 4; s < s1 - 4; s += 7.0) {
              const sp = track.sampleAtS(s);
              if (!sp) continue;
              for (const side of [-1, 1]) {
                if (side === valleySide && (seg.hasLake || seg.hasCloudSea)) continue;
                const hh = hash(seedBase + s * 13.3 + side * 41);
                if (hh < 0.26) continue; // Natural clearings so hydrangeas never form a uniform fence
                const baseDepth = hh > 0.65 ? (RW + 5.5 + hh * 12.5) : (RW + 1.35 + hh * 4.8);
                const clumpN = hh > 0.70 ? 3 : 2;
                for (let ci = 0; ci < clumpN; ci++) {
                  const hc = hash(seedBase + s * 7.7 + side * 19 + ci * 31.3);
                  const hlat = side * (baseDepth + (hc - 0.5) * 3.8);
                  const sOff = s + (hash(seedBase + s * 3.1 + ci * 17) - 0.5) * 4.2;
                  const csp = track.sampleAtS(sOff);
                  if (!csp) continue;
                  const effH = track.mapLat ? track.mapLat(csp, hlat) : hlat;
                  const hx = csp.pos[0] + csp.right[0] * effH, hz = csp.pos[2] + csp.right[2] * effH;
                  if (track.isNearAnyRoad && track.isNearAnyRoad(hx, hz, seg.id, RW + 1.0)) continue;
                  const hy = track.sampleGroundY(sOff, hlat) - 0.14;
                  const hsc = 0.68 + hc * 0.88;
                  cHydra = push(this.hydrangeaT, cHydra, hx, hy, hz, hsc, hc * 6.28, 0.90 + hc * 0.28, hc, hc);
                  push(this.hydrangeaC, cHydra - 1, hx, hy, hz, hsc, hc * 6.28, 0.90 + hc * 0.28, hc, hc);
                }
                if (hh > 0.52) {
                  const rlat = side * (baseDepth + 1.6 + hh * 3.2);
                  const effR = track.mapLat ? track.mapLat(sp, rlat) : rlat;
                  const yR0 = track.sampleGroundY(s, rlat), yR1 = track.sampleGroundY(s + 5.0, rlat);
                  if (Math.abs(yR0 - yR1) > 2.2) continue;
                  const rx = sp.pos[0] + sp.right[0] * effR, rz = sp.pos[2] + sp.right[2] * effR;
                  const ry = Math.min(yR0, yR1) - 0.85;
                  pushBould(rx, ry, rz, 0.85 + hh * 1.15, hh * 6.28, 0.95, 0.45, 0.65);
                }
              }
            }
          }
          // STRICT ECOLOGICAL ISOLATION: Cherry blossom (Sakura) trees appear ONLY in Bamboo Shrine Pass (tid === 6)!
          if (tid === 6) {
            const sakStep = 24.0;
            for (let s = s0 + 18; s < s1 - 14; s += sakStep) {
              const sp = track.sampleAtS(s);
              if (!sp) continue;
              const hs = hash(seedBase + s * 23.7);
              const sSide = (seg.hasLake || seg.hasCloudSea) ? mtnSide : ((Math.floor(s / sakStep) % 2 === 0) ? -1 : 1);
              // Graceful mid-slope setback (RW+7.4..13.8m) so sakura canopies frame the pass instead of blocking the road!
              const slat = sSide * (RW + 7.4 + hs * 6.4);
              const effS = track.mapLat ? track.mapLat(sp, slat) : slat;
              const sx = sp.pos[0] + sp.right[0] * effS, sz = sp.pos[2] + sp.right[2] * effS;
              if (track.isNearAnyRoad && track.isNearAnyRoad(sx, sz, seg.id, RW + 4.5)) continue;
              const sy = track.sampleGroundY(s, slat) - 0.50;
              const ssc = 0.84 + hs * 0.36;
              cSak = push(this.sakuraT, cSak, sx, sy, sz, ssc, hs * 6.28, 1.0, hs, 0.42 + hs * 0.45);
              push(this.sakuraC, cSak - 1, sx, sy, sz, ssc, hs * 6.28, 1.0, hs, 0.42 + hs * 0.45);
              cAO = push(this.contactAO, cAO, sx, sy + 0.35, sz, ssc * 2.4, 0, 0.46, 0, 0);
            }
          }
          // Place utility poles at EXACT world coordinates matching seg.utilityPoles catenary cables in track_ground.js!
          if (seg.utilityPoles && seg.utilityPoles.length) {
            for (const up of seg.utilityPoles) {
              cPole = push(this.utilityPoles, cPole, up.x, up.y - 0.10, up.z, 1.0, up.yaw, 1.0, 0, 1.0);
            }
          }

          // Spanning timber-and-steel rally checkpoint arch scaled proportionally to segment length
          if (seg.id > 0 && seg.id % 2 === 1) {
            const as = s0 + Math.min(36, segLen * 0.16);
            const sp = track.sampleAtS(as);
            if (sp) {
              cArch = push(this.arches, cArch, sp.pos[0], sp.pos[1] - 0.08, sp.pos[2], 1.0, sp.yaw, 1.0, 0, 1.0);
              // Pair of tall fluttering rally feather flags flanking every checkpoint approach (matches ref_03 & ref_09!)
              for (const fs of [-1, 1]) {
                const fsp = track.sampleAtS(Math.max(s0 + 4, as - 14));
                if (fsp) {
                  const flat = fs * (RW + 1.35);
                  const fx = fsp.pos[0] + fsp.right[0] * flat, fz = fsp.pos[2] + fsp.right[2] * flat;
                  const fy = track.sampleGroundY(Math.max(s0 + 4, as - 14), flat) - 0.06;
                  cFlag = push(this.flags, cFlag, fx, fy, fz, 0.96, fsp.yaw + (fs > 0 ? Math.PI : 0), 1.0, 0, 1.0);
                }
              }
            }
          }

          // Roadside vertical rally feather flags modulated by archPreset.flagMul
          const flagStep = 38.0 / Math.max(0.45, ap.flagMul || 1.0);
          for (let s = s0 + 18; s < s1 - 12; s += flagStep) {
            const sp = track.sampleAtS(s);
            if (!sp) continue;
            const hf = hash(seedBase + s * 13.7);
            if (hf < (ap.flagMul > 1.2 ? 0.15 : 0.38) && seg.type !== 'village_pass' && seg.type !== 'alpine_hamlet') continue;
            const fSide = (seg.hasLake || seg.hasCloudSea) ? mtnSide : ((hf > 0.65) ? 1 : -1);
            // Round 14 (Prop De-Collision): offset flags cleanly between ranch fence (RW+1.24) and utility poles (RW+4.4)!
            const flat = fSide * (RW + 2.15);
            const fx = sp.pos[0] + sp.right[0] * flat, fz = sp.pos[2] + sp.right[2] * flat;
            let nearPole = false;
            if (seg.utilityPoles) {
              for (let upi = 0; upi < seg.utilityPoles.length; upi++) {
                const up = seg.utilityPoles[upi];
                const pdx = fx - up.x, pdz = fz - up.z;
                if (pdx * pdx + pdz * pdz < 28.0) { nearPole = true; break; }
              }
            }
            if (nearPole) continue;
            const fy = track.sampleGroundY(s, flat) - 0.06;
            cFlag = push(this.flags, cFlag, fx, fy, fz, 0.88 + hf * 0.24, sp.yaw + (fSide > 0 ? Math.PI : 0) + (hf - 0.5) * 0.3, 1.0, 0, hf);
          }

          // Stacked red/white rally tire barriers aligned to ACTUAL peak curvature apex on 228m segments!
          const tireMul = ap.tireMul !== undefined ? ap.tireMul : 1.0;
          if (tireMul > 0.1 && (seg.sharp || seg.type === 'canyon_right' || seg.type === 'forest_chicanes' || seg.type === 'autumn_birch' || tireMul >= 1.5)) {
            let apexS = s0 + segLen * 0.50, maxAbsK = 0, apexSign = seg.sign || 1;
            for (let pi = 2; pi < seg.pts.length - 2; pi++) {
              const ak = Math.abs(seg.pts[pi].curv || 0);
              if (ak > maxAbsK) { maxAbsK = ak; apexS = seg.pts[pi].s; apexSign = seg.pts[pi].curv >= 0 ? 1 : -1; }
            }
            const outerSide = (seg.hasLake && -apexSign === valleySide) ? mtnSide : -apexSign;
            const tireN = Math.max(2, Math.round(3 * tireMul));
            for (let t = 0; t < tireN; t++) {
              const ts = Math.max(s0 + 18, Math.min(s1 - 18, apexS + (t - (tireN - 1) * 0.5) * 18.0));
              const sp = track.sampleAtS(ts);
              if (!sp) continue;
              const tlat = outerSide * (RW + 1.15);
              const tx = sp.pos[0] + sp.right[0] * tlat, tz = sp.pos[2] + sp.right[2] * tlat;
              const ty = track.sampleGroundY(ts, tlat) - 0.04;
              cTire = push(this.tires, cTire, tx, ty, tz, 0.92, sp.yaw + Math.PI * 0.5, 1.0, 0, 1.0);
              cAO = push(this.contactAO, cAO, tx, ty + 0.06, tz, 1.55, 0, 0.45, 0, 0);
            }
          }

          // Fallen horizontal logs permanently removed per aesthetic directive (zero floating cylinders on slopes!)
        }
        // Round 2: Dedicated Tunnel Approach Cut-Bank Dressing (densely covers steep entry/exit embankments with mossy rocks & shrubs!)
        if (!isBridge && !isTunnel && (seg.nextIsTunnel || seg.prevSurfMode === 2)) {
          const ranges = [];
          if (seg.nextIsTunnel) ranges.push([Math.max(s0 + 4, s1 - 38), s1 - 4]);
          if (seg.prevSurfMode === 2) ranges.push([s0 + 4, Math.min(s1 - 4, s0 + 38)]);
          for (const [rs0, rs1] of ranges) {
            for (let s = rs0; s <= rs1; s += 4.2) {
              const sp = track.sampleAtS(s);
              if (!sp) continue;
              for (const side of [-1, 1]) {
                const h1 = hash(seedBase + s * 17.7 + side * 43);
                const h2 = hash(seedBase + s * 31.3 + side * 71);
                const rLat = side * (RW + 4.4 + h1 * 9.6);
                const effR = track.mapLat ? track.mapLat(sp, rLat) : rLat;
                const rx = sp.pos[0] + sp.right[0] * effR, rz = sp.pos[2] + sp.right[2] * effR;
                if (track.isNearAnyRoad && track.isNearAnyRoad(rx, rz, seg.id, RW + 2.6)) continue;
                const ry = track.sampleGroundY(s, rLat) - 1.35;
                cSlab = push(this.cliffSlabs, cSlab, rx, ry, rz, 1.05 + h2 * 0.85, sp.yaw + (h1 - 0.5) * 2.0, 0.80 + h1 * 0.35, h2, curRockBiome + (h1 % 0.98));
                const shLat = side * (RW + 2.8 + h2 * 6.5);
                const shx = sp.pos[0] + sp.right[0] * shLat, shz = sp.pos[2] + sp.right[2] * shLat;
                const shy = track.sampleGroundY(s, shLat) - 0.16;
                const shsc = 0.72 + h1 * 0.52;
                cShrub = push(this.shrubTrunks, cShrub, shx, shy, shz, shsc, h2 * 6.28, 1.05, h1, 0.35 + h2 * 0.55);
                push(this.shrubCards, cShrub - 1, shx, shy, shz, shsc, h2 * 6.28, 1.05, h1, pickLeafBiome(h1) + 0.35 + h2 * 0.55);
                // Round 13: Upper cut-bank rock + conifer crown (RW+13..22m) sealing steep tunnel flank walls!
                if (h2 > 0.32) {
                  const uLat = side * (RW + 13.5 + h2 * 8.5);
                  const effU = track.mapLat ? track.mapLat(sp, uLat) : uLat;
                  const ux = sp.pos[0] + sp.right[0] * effU, uz = sp.pos[2] + sp.right[2] * effU;
                  if (!(track.isNearAnyRoad && track.isNearAnyRoad(ux, uz, seg.id, RW + 4.5))) {
                    const uy = track.sampleGroundY(s, uLat) - 1.1;
                    cSlab = push(this.cliffSlabs, cSlab, ux, uy, uz, 1.35 + h1 * 0.85, sp.yaw + h2 * 3.14, 0.78, h1, curRockBiome + (h2 % 0.98));
                    const pv = Math.floor(h1 * 3) % 3;
                    const psc = 1.05 + h2 * 0.65;
                    cP[pv] = push(this.pines[pv].t, cP[pv], ux, uy + 0.35, uz, psc, h1 * 6.28, 0.95, h2, 0.30 + h1 * 0.60);
                    push(this.pines[pv].c, cP[pv] - 1, ux, uy + 0.35, uz, psc, h1 * 6.28, 0.95, h2, pickLeafBiome(h2) + 0.30 + h1 * 0.60);
                  }
                }
              }
            }
          }
        }

        // 2. Combinatorial VegPreset Forest + Mandatory Tree-Base Shrubs + Dense Roadside Bushes
        const treeStepS = (seg.vegPreset && seg.vegPreset.treeStep) ? seg.vegPreset.treeStep : 4.8;
        const treeSkipP = (seg.vegPreset && seg.vegPreset.treeSkip) ? seg.vegPreset.treeSkip : 0.0;
        for (let s = s0 + 2; s < s1; s += treeStepS) {
          const sp = track.sampleAtS(s);
          if (!sp) continue;

          const placeTree = (lat, scaleMult, hA, hB, hC) => {
            if (treeSkipP > 0 && hA < treeSkipP) return;
            if (isBridge && Math.abs(lat) < RW + 22.0) return;
            const effLat = track.mapLat ? track.mapLat(sp, lat) : lat;
            const yHere = track.sampleGroundY(s, lat);
            const yPrev = track.sampleGroundY(Math.max(0, s - 8.5), lat);
            const yNext = track.sampleGroundY(s + 8.5, lat);
            // Guard against extreme sheer cliff discontinuities while allowing lush forests on rising lake headlands!
            if (Math.abs(yHere - yPrev) > 5.4 || Math.abs(yHere - yNext) > 5.4) return;
            const nearBridgeEdge = (seg.nextIsBridge && s > s1 - 22.0) || (seg.prevSurfMode === 1 && s < s0 + 22.0);
            if (nearBridgeEdge && (yHere < sp.pos[1] - 3.0 || Math.abs(yHere - yPrev) > 2.0 || Math.abs(yHere - yNext) > 2.0)) return;
            const tx = sp.pos[0] + sp.right[0] * effLat, tz = sp.pos[2] + sp.right[2] * effLat;
            if (track.isNearAnyRoad && track.isNearAnyRoad(tx, tz, seg.id, RW + 4.2)) return;
            if (isBridge && yHere > sp.pos[1] - 4.0) return;
            const ty = Math.min(yHere, yPrev, yNext) - 0.85;
            const xzRatio = 0.84 + hC * 0.34;

            // Theme-specific forest biome species composition!
            if (tid === 6 && hB < 0.72) {
              // Theme 6 (Bamboo Shrine Pass): Dense towering emerald bamboo groves!
              const sc = (0.95 + hA * 0.55) * scaleMult;
              cBam = push(this.bambooT, cBam, tx, ty, tz, sc, hB * 6.28, xzRatio, hA, 0.35 + hC * 0.65);
              push(this.bambooC, cBam - 1, tx, ty, tz, sc, hB * 6.28, xzRatio, hA, 0.35 + hC * 0.65);
              cAO = push(this.contactAO, cAO, tx, ty + 0.36, tz, sc * 2.1, 0, 0.45, 0, 0);
              return;
            }
            let species;
            if (tid === 4) {
              // Theme 4 (Golden Birch Valley): 78% White Birch with 512px peeling bark + golden/lime canopy!
              species = hB < 0.14 ? 0 : (hB < 0.22 ? 1 : 2);
            } else if (tid === 1) {
              // Theme 1 (Snow Peak): Airy, well-spaced alpine pines with larger fuller boughs & green/snow mix!
              if (hA < 0.68) return;
              species = 0;
              scaleMult *= 0.92;
            } else if (tid === 5) {
              // Theme 5 (Red-Brick Quarry Gorge): Full rich alpine-quarry woodland (hardy Scots pines + russet broadleaf + birch, ZERO bald slopes!)
              species = hB < 0.54 ? 0 : (hB < 0.84 ? 1 : 2);
              scaleMult *= 0.96;
            } else {
              const vpLocal = seg.vegPreset || { birchBias: 0, broadBias: 0, larchBias: 0 };
              if ((vpLocal.larchBias || 0) > 0.15 && hC < vpLocal.larchBias * 0.55) {
                const lsc = (0.92 + hA * 0.62) * scaleMult;
                cLarch = push(this.yellowLarchT, cLarch, tx, ty, tz, lsc, hB * 6.28, xzRatio, hA, 0.45 + hC * 0.5);
                // CRITICAL ZERO-LEAK FIX: pass curLeafBiome (0.0 in pine/birch, 2.0 in quarry — NEVER 1.0 snow outside tid===1!)
                push(this.yellowLarchC, cLarch - 1, tx, ty, tz, lsc, hB * 6.28, xzRatio, hA, curLeafBiome + Math.min(0.95, 0.42 + hC * 0.48));
                cAO = push(this.contactAO, cAO, tx, ty + 0.36, tz, lsc * 2.1, 0, 0.46, 0, 0);
                return;
              }
              const pPine = Math.max(0.18, Math.min(0.75, 0.52 - (vpLocal.birchBias || 0) * 0.6 - (vpLocal.broadBias || 0) * 0.5));
              const pBroad = Math.max(0.10, Math.min(0.55, 0.26 + (vpLocal.broadBias || 0) * 0.6));
              species = hB < pPine ? 0 : (hB < pPine + pBroad ? 1 : 2);
            }
            let variant = Math.floor(hC * 3) % 3;
            let key = species * 3 + variant;
            if (key === lastKey) { variant = (variant + 1) % 3; key = species * 3 + variant; }
            lastKey = key;

            let sc = 1.0;
            if (species === 0) {
              sc = (1.02 + hA * 0.78) * scaleMult;
              cP[variant] = push(this.pines[variant].t, cP[variant], tx, ty, tz, sc, hB*6.28, xzRatio, hA, 0.30+hC*0.70);
              push(this.pines[variant].c, cP[variant] - 1, tx, ty, tz, sc, hB*6.28, xzRatio, hA, pickLeafBiome(hC) + Math.min(0.95, 0.30+hC*0.62));
            } else if (species === 1) {
              sc = (0.86 + hA * 0.66) * scaleMult;
              cB[variant] = push(this.broads[variant].t, cB[variant], tx, ty, tz, sc, hB*6.28, xzRatio, hA, 0.35+hC*0.65);
              push(this.broads[variant].c, cB[variant] - 1, tx, ty, tz, sc, hB*6.28, xzRatio, hA, 0.35+hC*0.65);
            } else {
              sc = (0.94 + hA * 0.74) * scaleMult;
              cBi[variant] = push(this.birchs[variant].t, cBi[variant], tx, ty, tz, sc, hB*6.28, xzRatio, hA, 0.35+hC*0.65);
              push(this.birchs[variant].c, cBi[variant] - 1, tx, ty, tz, sc, hB*6.28, xzRatio, hA, 0.35+hC*0.65);
            }
            cAO = push(this.contactAO, cAO, tx, ty + 0.36, tz, sc * 2.20, 0, 0.48, 0, 0);

            if (!isBridge && !isTunnel) {
              const bsc = (tid === 1 ? 0.92 : 0.78) + hA * 0.54;
              cShrub = push(this.shrubTrunks, cShrub, tx + sp.right[0]*0.6, ty + 0.25, tz + sp.right[2]*0.6, bsc, hC*6.28, 1.05, hA, 0.35+hB*0.65);
              push(this.shrubCards, cShrub - 1, tx + sp.right[0]*0.6, ty + 0.25, tz + sp.right[2]*0.6, bsc, hC*6.28, 1.05, hA, pickLeafBiome(hB) + Math.min(0.95, 0.35+hB*0.58));
            }
          };

          const minDist = isBridge ? 14.0 : (isTunnel ? 16.5 : 4.8);
          for (const side of [-1, 1]) {
            const h1 = hash(seedBase + s * 4.3 + side * 53);
            const h2 = hash(seedBase + s * 9.7 + side * 29);
            const h3 = hash(seedBase + s * 17.1 + side * 11);
            const isCliffSide = (side < 0 && (hm === -1 || hm === 2)) || (side > 0 && (hm === 1 || hm === 2));
            // Keep ONLY actual submerged Lake basin (y < lakeY + 0.65) or sheer Cliffside Abyss (y < roadY - 4.5) open — NEVER leave a bald green hill!
            const sampleSideY = track.sampleGroundY(s, side * (RW + 14.0));
            const lakeLevel = seg.lakeY !== undefined ? seg.lakeY : (sp.pos[1] - 1.6);
            const isSubmergedLake = (seg.hasLake && side === valleySide && sampleSideY < lakeLevel + 0.75);
            const isTrueAbyss = (seg.hasCloudSea && side === valleySide);
            const keepOpenVista = isSubmergedLake || isTrueAbyss;
            // Ecological Grove Clumping: natural copses + intentional scenic vista clearings on plain_meadow!
            const groveWave = 0.5 + 0.5 * Math.sin(s * 0.052 + side * 2.3 + seedBase * 0.13);
            const meadowClearing = (seg.landform === 'plain_meadow' && groveWave < 0.38);

            if (isTrueAbyss && !isBridge && !isTunnel) {
              // Sculpted basalt rock lip hugging the near cliff rim (RW+2.4..5.2m) + rare wind-sculpted cliff pine framing the negative-space abyss!
              if (h2 > 0.54) {
                const lipLat = side * (RW + 2.6 + h1 * 2.6);
                const effLip = track.mapLat ? track.mapLat(sp, lipLat) : lipLat;
                const lx = sp.pos[0] + sp.right[0] * effLip, lz = sp.pos[2] + sp.right[2] * effLip;
                const ly = track.sampleGroundY(s, lipLat) - 1.55;
                cSlab = push(this.cliffSlabs, cSlab, lx, ly, lz, 0.78 + h3 * 0.65, sp.yaw + (h1 - 0.5) * 1.4, 0.72 + h2 * 0.35, h2, curRockBiome + (h1 % 0.98));
              }
              if (h1 > 0.84) {
                placeTree(side * (RW + 4.4 + h3 * 3.8), 0.76, h1, h2, h3);
              }
            } else if (isCliffSide) {
              const nearOff = (tid === 4 || tid === 6) ? (0.4 + h1 * 11.5) : (2.2 + h1 * 15.0);
              if (h1 > 0.11) placeTree(side * (RW + minDist + nearOff), 1.06, h1, h2, h3);
            } else if (!keepOpenVista && !meadowClearing && h1 > (groveWave > 0.62 ? 0.12 : 0.24)) {
              const nearOffV = (tid === 4 || tid === 6) ? (2.0 + h1 * 14.0) : (3.6 + h1 * 16.5);
              placeTree(side * (RW + minDist + nearOffV), 0.98, h1, h2, h3);
            }
            if (isCliffSide && !isBridge) {
              const h4 = hash(seedBase + s * 7.1 + side * 81);
              if (tid !== 1 || h4 > 0.36) placeTree(side * (RW + 17.5 + h4 * 22.0), 1.18, h4, hash(seedBase + s * 3.1 + side), h1);
              // Dense 3D mid-distance woodland band (RW+30..50m) eliminating bald mountain slopes!
              if (h2 > (tid === 1 ? 0.56 : 0.24)) placeTree(side * (RW + 30.0 + h3 * 20.0), 1.24, h3, h1, h4);
            }
            if (!isCliffSide && !isBridge && !keepOpenVista && !meadowClearing) {
              // Two-tier valley foresting (RW+16..34m & RW+32..50m) so rolling hills NEVER look bald!
              if (h3 > (tid === 1 ? 0.52 : 0.24)) {
                const h5 = hash(seedBase + s * 5.7 + side * 43);
                placeTree(side * (RW + 16.5 + h5 * 19.0), 1.08, h5, h2, h1);
              }
              if (h2 > (tid === 1 ? 0.68 : 0.42)) {
                const h6 = hash(seedBase + s * 8.3 + side * 71);
                placeTree(side * (RW + 33.0 + h6 * 18.0), 1.18, h6, h1, h3);
              }
            }
            // Round 19: More organic spacing on Snow Peak (tid===1) so craggy granite boulders & frost twigs breathe between snow shrubs!
            const shrubCutCliff = Math.max(0.05, Math.min(0.78, (tid === 1 ? 0.38 : 0.22) / Math.max(0.45, vp.shrubMul || 1.0)));
            const shrubCutVal   = Math.max(0.18, Math.min(0.85, 0.52 / Math.max(0.45, vp.shrubMul || 1.0)));
            if (!isBridge && !isTunnel && !keepOpenVista && ((isCliffSide && h2 > shrubCutCliff) || (!isCliffSide && h2 > shrubCutVal))) {
              // Setback >= RW + 1.95m so shrubs frame road shoulders cleanly without poking into driving lanes!
              const slat = side * (RW + 1.95 + h1 * 7.2);
              const effSlat = track.mapLat ? track.mapLat(sp, slat) : slat;
              const sx = sp.pos[0] + sp.right[0] * effSlat, sz = sp.pos[2] + sp.right[2] * effSlat;
              if (track.isNearAnyRoad && track.isNearAnyRoad(sx, sz, seg.id, RW + 1.6)) continue;
              const syRaw = track.sampleGroundY(s, slat);
              if (syRaw < sp.pos[1] - 2.4) continue;
              const nearBridgeShrub = (seg.nextIsBridge && s > s1 - 22.0) || (seg.prevSurfMode === 1 && s < s0 + 22.0);
              if (nearBridgeShrub && syRaw < sp.pos[1] - 3.0) continue;
              const sy = syRaw - 0.18;
              const ssc = (tid === 1 ? 0.64 : 0.52) + h3 * 0.56;
              cShrub = push(this.shrubTrunks, cShrub, sx, sy, sz, ssc, h1*6.28, 0.90+h2*0.38, h2, 0.35+h3*0.65);
              push(this.shrubCards, cShrub - 1, sx, sy, sz, ssc, h1*6.28, 0.90+h2*0.38, h2, pickLeafBiome(h3) + Math.min(0.95, 0.35+h3*0.58));
            }
          }
        }
        } // end isNear3D

        // 3. Extended Mid-Far Ridge Farwoods (RW + 34m..128m; dense forest horizon out to 480m!)
        {
          const farBiomeCode = (tid === 1 ? 1.0 : (tid === 4 ? 2.0 : (tid === 5 ? 3.0 : (tid === 6 ? 4.0 : 0.0))));
          for (let s = s0 + 2; s < s1; s += 3.6) {
            const sp = track.sampleAtS(s);
            if (!sp) continue;
            const farSides = [-1, 1];
            for (const vSide of farSides) {
              const kMax = isNear3D ? 3 : 4;
              for (let k = 0; k < kMax; k++) {
                const h1 = hash(seedBase + s * 7.1 + k * 67 + vSide * 19), h2 = hash(seedBase + s * 15.3 + k * 23 + vSide * 31);
                const lat = vSide * (RW + (k === 0 ? (38 + h1 * 28) : (k === 1 ? (68 + h1 * 32) : (k === 2 ? (98 + h1 * 34) : (16 + h1 * 24)))));
                const effLat = track.mapLat ? track.mapLat(sp, lat) : lat;
                const fx = sp.pos[0] + sp.right[0] * effLat, fz = sp.pos[2] + sp.right[2] * effLat;
                if (track.isNearAnyRoad && track.isNearAnyRoad(fx, fz, seg.id, RW + 8.0)) continue;
                const fy = track.sampleGroundY(s, lat) - 1.4;
                if (seg.hasLake && vSide === valleySide) continue;
                // On Cliffside Abyss, keep the open abyss pure negative space so distant raymarched mountain vistas breathe cleanly!
                if (seg.hasCloudSea && vSide === valleySide) continue;
                if (isBridge && fy > sp.pos[1] - 6.0) continue;
                const slot = Math.floor(h2 * 8);
                const hScale = (14.0 + h1 * 12.0) * (k === 1 ? 1.22 : (k === 2 ? 0.88 : 1.0));
                cFar = push(this.farwoods, cFar, fx, fy, fz, hScale, slot, slot < 5 ? 0.64 : 0.96, h1, farBiomeCode + Math.min(0.95, h2 * 0.95));
              }
            }
          }
        }

        if (isNear3D && !isBridge && !isTunnel && (seg.sharp || seg.type === 'canyon_right' || seg.hasCloudSea || tid === 3 || tid === 1)) {
          let cApexS = s0 + segLen * 0.50, cMaxK = 0, cApexSign = seg.sign || 1;
          for (let pi = 2; pi < seg.pts.length - 2; pi++) {
            const ak = Math.abs(seg.pts[pi].curv || 0);
            if (ak > cMaxK) { cMaxK = ak; cApexS = seg.pts[pi].s; cApexSign = seg.pts[pi].curv >= 0 ? 1 : -1; }
          }
          const outerSide = seg.hasCloudSea ? valleySide : -cApexSign;
          const chevCount = segLen > 170 ? 5 : 4;
          for (let c = 0; c < chevCount; c++) {
            const cs = seg.hasCloudSea
              ? (s0 + segLen * (0.18 + (c / Math.max(1, chevCount - 1)) * 0.64))
              : Math.max(s0 + 18, Math.min(s1 - 18, cApexS + (c - (chevCount - 1) * 0.5) * 20.0));
            const sp = track.sampleAtS(cs);
            if (!sp) continue;
            const lat = outerSide * (RW + 1.05);
            cChev = push(this.chevrons, cChev, sp.pos[0]+sp.right[0]*lat, track.sampleGroundY(cs, lat), sp.pos[2]+sp.right[2]*lat, 1.0, sp.yaw + Math.PI, 1.0, 0, 1.0);
          }
        }
      }

      for (let v = 0; v < 3; v++) {
        this.pines[v].t.upload(cP[v]);   this.pines[v].c.upload(cP[v]);
        this.broads[v].t.upload(cB[v]);  this.broads[v].c.upload(cB[v]);
        this.birchs[v].t.upload(cBi[v]); this.birchs[v].c.upload(cBi[v]);
      }
      this.bambooT.upload(cBam); this.bambooC.upload(cBam);
      this.shrubTrunks.upload(cShrub); this.shrubCards.upload(cShrub);
      this.farwoods.upload(cFar);
      for (let v = 0; v < 3; v++) this.boulders[v].upload(cBould[v]);
      this.cliffSlabs.upload(cSlab);
      this.pebbles.upload(cPeb);
      this.bollards.upload(cBol);
      this.chevrons.upload(cChev);
      this.cabins.upload(cCab);
      this.arches.upload(cArch);
      this.flags.upload(cFlag);
      this.tires.upload(cTire);
      this.lamps.upload(cLamp);
      this.tents.upload(cTent);
      this.stoneLanterns.upload(cSLant);
      this.weatherStations.upload(cWStat);
      this.shoreReeds.upload(cReed);
      this.quarryKilns.upload(cKiln);
      this.utilityPoles.upload(cPole);
      this.hydrangeaT.upload(cHydra); this.hydrangeaC.upload(cHydra);
      this.sakuraT.upload(cSak);   this.sakuraC.upload(cSak);
      this.yellowLarchT.upload(cLarch); this.yellowLarchC.upload(cLarch);
      this.bareDeadwood.upload(cBare);
      this.contactAO.upload(cAO);
    }

    drawShadows(renderer) {
      if (this._lastTrack && renderer && renderer.camPos) {
        this.rebuildFromTrack(this._lastTrack, renderer.camPos);
        this._rebuiltInShadows = true;
      }
      const gl = this.gl, sp = renderer.shadowInstProg;
      gl.useProgram(sp.prog);
      gl.uniformMatrix4fv(sp.u.uLightVP, false, renderer.lightVP);
      if (sp.u.uCamPos) gl.uniform3fv(sp.u.uCamPos, renderer.camPos);
      if (!this._shadowSolidList) {
        this._shadowSolidList = [
          ...this.pines.map(x=>x.t), ...this.broads.map(x=>x.t), ...this.birchs.map(x=>x.t), this.bambooT,
          ...this.boulders, this.cliffSlabs, this.cabins, this.arches, this.tents,
          this.weatherStations, this.quarryKilns,
          this.hydrangeaT, this.sakuraT, this.yellowLarchT, this.bareDeadwood
        ];
      }
      const list = this._shadowSolidList;
      for (const m of list) {
        if (m.instanceCount <= 0) continue;
        gl.bindVertexArray(m.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, m.count, m.indexType, 0, m.instanceCount);
      }
      if (renderer.shadowLeafProg) {
        const slp = renderer.shadowLeafProg;
        const ld = PV.LIGHT.dir;
        let rx = -ld[2], ry = 0, rz = ld[0];
        const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; rz /= rl;
        const ux = ld[1] * rz - ld[2] * ry, uy = ld[2] * rx - ld[0] * rz, uz = ld[0] * ry - ld[1] * rx;
        gl.disable(gl.CULL_FACE);
        gl.useProgram(slp.prog);
        gl.uniformMatrix4fv(slp.u.uLightVP, false, renderer.lightVP);
        if (slp.u.uCamPos) gl.uniform3fv(slp.u.uCamPos, renderer.camPos);
        gl.uniform3f(slp.u.uLightRight, rx, ry, rz);
        gl.uniform3f(slp.u.uLightUp, ux, uy, uz);
        const drawLeafShad = (mesh, tex) => {
          if (mesh.instanceCount <= 0) return;
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(slp.u.uLeafAtlas, 0);
          gl.bindVertexArray(mesh.vao);
          gl.drawElementsInstanced(gl.TRIANGLES, mesh.count, mesh.indexType, 0, mesh.instanceCount);
        };
        for (let i = 0; i < 3; i++) {
          drawLeafShad(this.pines[i].c,  this.tex.pineAtlas);
          drawLeafShad(this.broads[i].c, this.tex.broadAtlas);
          drawLeafShad(this.birchs[i].c, this.tex.broadAtlas);
        }
        drawLeafShad(this.bambooC, this.tex.bambooAtlas);
        // Round 9 (Zero-Loss Perf): low ground shrubs already use contactAO decals; skipping alpha-tested 4K shrub leaf shadows saves ~280K tris & heavy overdraw!
        gl.enable(gl.CULL_FACE);
      }
      gl.bindVertexArray(null);
    }

    draw(renderer, time) {
      if (!this._rebuiltInShadows && this._lastTrack && renderer && renderer.camPos) {
        this.rebuildFromTrack(this._lastTrack, renderer.camPos);
      }
      this._rebuiltInShadows = false;
      const gl = this.gl, v = renderer.viewMat;
      const camRight = this._camRight, camUp = this._camUp;
      camRight[0] = v[0]; camRight[1] = v[4]; camRight[2] = v[8];
      camUp[0] = v[1]; camUp[1] = v[5]; camUp[2] = v[9];

      if (this.contactAO.instanceCount > 0) {
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        gl.depthMask(false); gl.disable(gl.CULL_FACE);
        gl.useProgram(this.aoInstProg.prog);
        gl.uniformMatrix4fv(this.aoInstProg.u.uViewProj, false, renderer.vpMat);
        gl.bindVertexArray(this.contactAO.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, this.contactAO.count, this.contactAO.indexType, 0, this.contactAO.instanceCount);
        gl.depthMask(true); gl.disable(gl.BLEND); gl.enable(gl.CULL_FACE);
      }

      const sp = this.solidProg;
      gl.useProgram(sp.prog);
      gl.uniformMatrix4fv(sp.u.uViewProj, false, renderer.vpMat);
      renderer.bindSharedPBRUniforms(sp.u, time);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.rock.albedo); gl.uniform1i(sp.u.uRockAlb, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex.rock.normal); gl.uniform1i(sp.u.uRockNrm, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.tex.chevron);     gl.uniform1i(sp.u.uSignTex, 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.tex.stoneMasonry.albedo);  gl.uniform1i(sp.u.uStoneAlb, 3);
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.tex.stoneMasonry.normal);  gl.uniform1i(sp.u.uStoneNrm, 4);
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, this.tex.agedBrick.albedo);     gl.uniform1i(sp.u.uBrickAlb, 5);
      gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, this.tex.agedBrick.normal);     gl.uniform1i(sp.u.uBrickNrm, 6);
      gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, this.tex.weatheredWood.albedo); gl.uniform1i(sp.u.uWoodAlb,  8);
      gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, this.tex.weatheredWood.normal); gl.uniform1i(sp.u.uWoodNrm,  9);
      gl.activeTexture(gl.TEXTURE10); gl.bindTexture(gl.TEXTURE_2D, this.tex.birchBark.albedo);    gl.uniform1i(sp.u.uBirchAlb, 10);
      gl.activeTexture(gl.TEXTURE11); gl.bindTexture(gl.TEXTURE_2D, this.tex.birchBark.normal);    gl.uniform1i(sp.u.uBirchNrm, 11);

      const drawSolid = (mesh, mode, cull) => {
        if (mesh.instanceCount <= 0) return;
        if (cull) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); } else { gl.disable(gl.CULL_FACE); }
        gl.uniform1i(sp.u.uMode, mode);
        gl.bindVertexArray(mesh.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, mesh.count, mesh.indexType, 0, mesh.instanceCount);
      };
      for (let i = 0; i < 3; i++) {
        drawSolid(this.pines[i].t,  0, true);
        drawSolid(this.broads[i].t, 0, true);
        drawSolid(this.birchs[i].t, 0, true);
      }
      drawSolid(this.bambooT,         0, true);
      drawSolid(this.shoreReeds,      0, true);
      drawSolid(this.shrubTrunks,     0, true);
      drawSolid(this.bollards,        0, true);
      drawSolid(this.cabins,          4, false);
      drawSolid(this.arches,          4, true);
      drawSolid(this.flags,           5, false);
      drawSolid(this.tires,           4, true);
      drawSolid(this.lamps,           4, true);
      drawSolid(this.tents,           4, false);
      drawSolid(this.stoneLanterns,   4, true);
      drawSolid(this.weatherStations, 4, false);
      drawSolid(this.quarryKilns,     4, false);
      drawSolid(this.utilityPoles,    4, true);
      drawSolid(this.hydrangeaT,      0, true);
      drawSolid(this.sakuraT,         0, true);
      drawSolid(this.yellowLarchT,    0, true);
      drawSolid(this.bareDeadwood,    0, true);
      for (let v = 0; v < 3; v++) drawSolid(this.boulders[v], 1, true);
      drawSolid(this.cliffSlabs,      1, true);
      drawSolid(this.pebbles,         3, true);
      drawSolid(this.chevrons,        2, false);

      gl.disable(gl.CULL_FACE);
      const lp = this.leafCardsProg;
      gl.useProgram(lp.prog);
      gl.uniformMatrix4fv(lp.u.uViewProj, false, renderer.vpMat);
      gl.uniform3fv(lp.u.uCamRight, camRight); gl.uniform3fv(lp.u.uCamUp, camUp);
      renderer.bindSharedPBRUniforms(lp.u, time);

      const drawLeaf = (mesh, tex, lit, mid, shad) => {
        if (mesh.instanceCount <= 0) return;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(lp.u.uLeafAtlas, 0);
        gl.uniform3f(lp.u.uLitColor,  lit[0],  lit[1],  lit[2]);
        gl.uniform3f(lp.u.uMidColor,  mid[0],  mid[1],  mid[2]);
        gl.uniform3f(lp.u.uShadColor, shad[0], shad[1], shad[2]);
        gl.bindVertexArray(mesh.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, mesh.count, mesh.indexType, 0, mesh.instanceCount);
      };
      const pinePal  = [
        [[0.044, 0.105, 0.048], [0.016, 0.050, 0.026], [0.005, 0.018, 0.012]],
        [[0.056, 0.122, 0.044], [0.021, 0.058, 0.024], [0.006, 0.020, 0.011]],
        [[0.038, 0.096, 0.054], [0.014, 0.046, 0.029], [0.004, 0.016, 0.013]],
      ];
      const broadPal = [
        [[0.088, 0.182, 0.052], [0.036, 0.088, 0.028], [0.010, 0.030, 0.014]],
        [[0.128, 0.175, 0.046], [0.058, 0.090, 0.024], [0.016, 0.032, 0.012]],
        [[0.195, 0.105, 0.038], [0.098, 0.048, 0.018], [0.030, 0.016, 0.009]],
      ];
      const birchPal = [
        [[0.295, 0.228, 0.042], [0.155, 0.112, 0.022], [0.044, 0.032, 0.009]], // Vibrant golden-yellow alpine birch
        [[0.185, 0.245, 0.052], [0.092, 0.125, 0.026], [0.026, 0.040, 0.012]], // Fresh spring-lime birch
        [[0.315, 0.178, 0.038], [0.162, 0.084, 0.018], [0.046, 0.024, 0.009]], // Warm autumn amber birch
      ];
      for (let i = 0; i < 3; i++) {
        drawLeaf(this.pines[i].c,  this.tex.pineAtlas,  pinePal[i][0],  pinePal[i][1],  pinePal[i][2]);
        drawLeaf(this.broads[i].c, this.tex.broadAtlas, broadPal[i][0], broadPal[i][1], broadPal[i][2]);
        drawLeaf(this.birchs[i].c, this.tex.broadAtlas, birchPal[i][0], birchPal[i][1], birchPal[i][2]);
      }
      drawLeaf(this.bambooC, this.tex.bambooAtlas, [0.105, 0.265, 0.072], [0.042, 0.135, 0.038], [0.012, 0.046, 0.018]);
      drawLeaf(this.hydrangeaC, this.tex.hydrangeaAtlas, [0.18, 0.26, 0.82], [0.09, 0.14, 0.56], [0.03, 0.08, 0.20]);
      drawLeaf(this.sakuraC,   this.tex.broadAtlas, [1.00, 0.80, 0.88], [0.92, 0.60, 0.74], [0.64, 0.36, 0.52]);
      drawLeaf(this.yellowLarchC, this.tex.broadAtlas, [0.76, 0.54, 0.11], [0.48, 0.30, 0.05], [0.18, 0.10, 0.02]);
      drawLeaf(this.shrubCards, this.tex.broadAtlas, [0.098, 0.195, 0.054], [0.038, 0.092, 0.030], [0.010, 0.032, 0.014]);

      if (this.farwoods.instanceCount > 0) {
        const fp = this.farwoodsProg;
        gl.useProgram(fp.prog);
        gl.uniformMatrix4fv(fp.u.uViewProj, false, renderer.vpMat);
        gl.uniform3fv(fp.u.uCamRight, camRight);
        renderer.bindSharedPBRUniforms(fp.u, time);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.farwoods); gl.uniform1i(fp.u.uFarAtlas, 0);
        gl.bindVertexArray(this.farwoods.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, this.farwoods.count, this.farwoods.indexType, 0, this.farwoods.instanceCount);
      }

      gl.enable(gl.CULL_FACE);
      gl.bindVertexArray(null);
    }
  };
})(window);

