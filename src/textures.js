// === textures.js ===
// Painterly Directional Wet-Mud (restrained clods & pebbles, ZERO high-freq shimmer!),
// Painterly Multi-Tone Brushstroke Grass, Layered Rock, 2x2 Foliage Atlases, #22 Livery
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});
  const mulberry32 = PV.mulberry32;

  function uploadTex(gl, srcCanvas, isSRGB, clamp, noMip) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, isSRGB ? gl.SRGB8_ALPHA8 : gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
    if (!noMip) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const wrap = clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso && !noMip) {
      gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    }
    return tex;
  }

  function buildSobelNormalWithHeight(heightCanvas, strength) {
    const w = heightCanvas.width, h = heightCanvas.height;
    const src = heightCanvas.getContext('2d').getImageData(0, 0, w, h).data;
    const outC = document.createElement('canvas'); outC.width = w; outC.height = h;
    const octx = outC.getContext('2d');
    const dst = octx.createImageData(w, h);
    const d = dst.data;
    const S = (x, y) => src[((((y % h) + h) % h) * w + (((x % w) + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tl=S(x-1,y-1), t=S(x,y-1), tr=S(x+1,y-1), l=S(x-1,y), r=S(x+1,y), bl=S(x-1,y+1), b=S(x,y+1), br=S(x+1,y+1);
        const dx = (tr + 2*r + br - (tl + 2*l + bl)) * strength;
        const dy = (bl + 2*b + br - (tl + 2*t + tr)) * strength;
        let nx = -dx, ny = -dy, nz = 1.0;
        const inv = 1.0 / Math.hypot(nx, ny, nz);
        const i = (y * w + x) * 4;
        d[i]   = Math.round((nx * inv * 0.5 + 0.5) * 255);
        d[i+1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
        d[i+2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
        d[i+3] = src[i];
      }
    }
    octx.putImageData(dst, 0, 0);
    return outC;
  }

  // Rough Rally Mud with deep clods, organic hollows, carved tread ruts & high-relief normal map
  function createRoadAggregatePBR(gl) {
    const S = 1024;
    const rng = mulberry32(3104);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');

    // Rich warm-earthy dark rally mud base (never grey asphalt!)
    actx.fillStyle = '#473424';
    actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#828282';
    hctx.fillRect(0, 0, S, S);

    // Multi-scale lumpy mud mounds, wet soil clods & deeply sunken organic puddle hollows
    const muds = [[88,65,45], [56,41,28], [76,56,38], [44,32,22], [102,77,54], [64,48,33], [92,69,48]];
    for (let i = 0; i < 640; i++) {
      const x = rng() * S, y = rng() * S;
      const isHollow = rng() < 0.46;
      const rx = 18 + rng() * 62;
      const ry = rx * (0.55 + rng() * 0.95);
      const ang = (rng() - 0.5) * 0.7;
      const mc = muds[(rng() * muds.length) | 0];
      const aA = 0.28 + rng() * 0.28;
      const hv = isHollow ? (20 + ((rng() * 42) | 0)) : (168 + ((rng() * 76) | 0));
      const hA = isHollow ? 0.44 : 0.36;
      for (let ox = -S; ox <= S; ox += S) {
        for (let oy = -S; oy <= S; oy += S) {
          const cx = x + ox, cy = y + oy;
          const mr = Math.max(rx, ry);
          if (cx < -mr || cx > S + mr || cy < -mr || cy > S + mr) continue;
          actx.save(); actx.translate(cx, cy); actx.rotate(ang);
          const ga = actx.createRadialGradient(0, 0, mr * 0.08, 0, 0, mr);
          ga.addColorStop(0, `rgba(${mc[0]},${mc[1]},${mc[2]},${aA.toFixed(2)})`);
          ga.addColorStop(1, `rgba(${mc[0]},${mc[1]},${mc[2]},0)`);
          actx.fillStyle = ga;
          actx.beginPath(); actx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); actx.fill();
          actx.restore();

          hctx.save(); hctx.translate(cx, cy); hctx.rotate(ang);
          const gh = hctx.createRadialGradient(0, 0, mr * 0.08, 0, 0, mr);
          gh.addColorStop(0, `rgba(${hv},${hv},${hv},${hA.toFixed(2)})`);
          gh.addColorStop(1, `rgba(${hv},${hv},${hv},0)`);
          hctx.fillStyle = gh;
          hctx.beginPath(); hctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); hctx.fill();
          hctx.restore();
        }
      }
    }

    // Coarse longitudinal mud gouges, churned tire-lug chevrons & displaced mud ridges
    for (let i = 0; i < 420; i++) {
      const tx = (rng() < 0.5 ? 0.28 : 0.72) * S + (rng() - 0.5) * 165;
      const ty = rng() * S;
      const w = 10 + rng() * 22;
      hctx.strokeStyle = 'rgba(18,18,18,0.46)';
      hctx.lineWidth = 4.2;
      hctx.beginPath(); hctx.moveTo(tx - w, ty - 7); hctx.lineTo(tx, ty + 6); hctx.lineTo(tx + w, ty - 7); hctx.stroke();
      hctx.strokeStyle = 'rgba(218,218,218,0.28)';
      hctx.lineWidth = 2.6;
      hctx.beginPath(); hctx.moveTo(tx - w, ty - 11); hctx.lineTo(tx, ty + 2); hctx.lineTo(tx + w, ty - 11); hctx.stroke();
      actx.strokeStyle = 'rgba(28,19,12,0.34)';
      actx.lineWidth = 3.2;
      actx.beginPath(); actx.moveTo(tx - w, ty - 7); actx.lineTo(tx, ty + 6); actx.lineTo(tx + w, ty - 7); actx.stroke();
    }

    // Coarse mud clods, wet stones & embedded alpine gravel (tactile rough rally surface)
    for (let i = 0; i < 2400; i++) {
      const x = rng() * S, y = rng() * S;
      const isClod = rng() < 0.22;
      const r = isClod ? (4.0 + rng() * 8.5) : (1.5 + rng() * 3.6);
      const tone = isClod ? (48 + ((rng() * 36) | 0)) : (66 + ((rng() * 58) | 0));
      actx.fillStyle = isClod
        ? `rgb(${tone + 18},${tone + 6},${tone - 6})`
        : `rgb(${tone + 10},${tone + 5},${tone})`;
      actx.globalAlpha = 0.34 + rng() * 0.34;
      const ang = rng() * Math.PI;
      const asp = 0.55 + rng() * 0.42;
      actx.beginPath(); actx.ellipse(x, y, r, r * asp, ang, 0, Math.PI * 2); actx.fill();

      const hv = isClod ? (185 + ((rng() * 65) | 0)) : (152 + ((rng() * 58) | 0));
      const gh = hctx.createRadialGradient(x, y, r * 0.08, x, y, r * 1.15);
      gh.addColorStop(0, `rgba(${hv},${hv},${hv},${isClod ? 0.52 : 0.36})`);
      gh.addColorStop(1, `rgba(${hv},${hv},${hv},0)`);
      hctx.fillStyle = gh;
      hctx.beginPath(); hctx.arc(x, y, r * 1.15, 0, Math.PI * 2); hctx.fill();
    }
    actx.globalAlpha = 1; hctx.globalAlpha = 1;

    return {
      albedo: uploadTex(gl, albC, true, false),
      normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 5.4), false, false),
    };
  }

  function createFoliageAtlas2x2(gl, kind) {
    const S = 1024, Q = 512;
    const rng = mulberry32(kind === 'pine' ? 8811 : 9922);
    const c = document.createElement('canvas'); c.width = c.height = S;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, S, S);

    for (let qy = 0; qy < 2; qy++) {
      for (let qx = 0; qx < 2; qx++) {
        const variant = qy * 2 + qx;
        const cx = qx * Q + Q * 0.5, cy = qy * Q + Q * 0.5;

        if (kind === 'pine') {
          // Next-Gen High-Detail Alpine Spruce/Conifer Bough Pad with Internal Forked Woody Twigs + Layered Needle Fans!
          for (let tw = 0; tw < 7; tw++) {
            const ta = (tw / 7) * Math.PI * 2 + (rng() - 0.5) * 0.4 + variant * 0.4;
            const tLen = 115 + rng() * 65;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(ta);
            ctx.strokeStyle = 'rgb(44, 245, 0)';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(tLen * 0.45, (rng() - 0.5) * 26, tLen, (rng() - 0.5) * 22);
            ctx.stroke();
            ctx.lineWidth = 3.5;
            for (const sb of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(tLen * 0.42, 0);
              ctx.lineTo(tLen * 0.82, sb * (26 + rng() * 18));
              ctx.stroke();
            }
            ctx.restore();
          }
          for (let cl = 0; cl < 26; cl++) {
            const ox = (rng() - 0.5) * 230;
            const oy = (rng() - 0.42) * 165;
            const distNorm = Math.hypot(ox / 145, oy / 110);
            if (distNorm > 1.12) continue;
            const sprays = 15 + ((rng() * 10) | 0);
            for (let sp = 0; sp < sprays; sp++) {
              const dirA = Math.atan2(oy + 55, ox) + (rng() - 0.5) * 1.55;
              const nLen = (32 + rng() * 54) * (1.15 - distNorm * 0.38);
              const nWid = 7 + rng() * 8;
              const lum = Math.round(68 + (1.0 - (oy + 110) / 240) * 125 + (rng() - 0.5) * 44);
              ctx.save();
              ctx.translate(cx + ox, cy + oy);
              ctx.rotate(dirA);
              ctx.fillStyle = `rgb(${Math.max(52, Math.min(245, lum))}, 255, 0)`;
              ctx.beginPath();
              ctx.moveTo(-6, 0);
              ctx.quadraticCurveTo(nLen * 0.45, -nWid, nLen, 0);
              ctx.quadraticCurveTo(nLen * 0.45,  nWid, -6, 0);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
          }
          for (let sh = 0; sh < 36; sh++) {
            const ang = (rng() - 0.5) * Math.PI * 1.85 + Math.PI * 0.5;
            const r0 = 55 + rng() * 105;
            const sx = cx + Math.cos(ang) * r0 * 1.12;
            const sy = cy + Math.sin(ang) * r0 * 0.78;
            const sLen = 42 + rng() * 58;
            const droopA = ang + (Math.cos(ang) > 0 ? 0.25 : -0.25) + (rng() - 0.5) * 0.35;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(droopA);
            for (let k = 0; k < 9; k++) {
              const t = k / 8;
              const nl = (1.0 - t * 0.55) * (20 + rng() * 14);
              const lum = Math.round(90 + t * 120 + (rng() - 0.5) * 35);
              ctx.fillStyle = `rgb(${Math.max(60, Math.min(250, lum))}, 255, 0)`;
              for (const sd of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(t * sLen, 0);
                ctx.lineTo(t * sLen + nl * 0.65, sd * nl * 0.58);
                ctx.lineTo(t * sLen + nl * 0.28, 0);
                ctx.closePath();
                ctx.fill();
              }
            }
            ctx.restore();
          }
        } else {
          // Restored Demo Painterly Broadleaf / Birch / Maple multi-leaf branchlet cluster (rich organic canopy + inner fullness!)
          const twigs = 5 + (variant % 2);
          for (let tw = 0; tw < twigs; tw++) {
            const ang = (tw / twigs) * Math.PI * 2 + (rng() - 0.5) * 0.45 + variant * 0.5;
            const len = 135 + rng() * 60;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(ang);
            // Darker forked woody sub-twigs baked into leaf card (adds crisp branchlet intricacy at ZERO extra triangles!)
            ctx.strokeStyle = 'rgb(48, 245, 0)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(len * 0.5, (rng() - 0.5) * 36, len * 0.92, (rng() - 0.5) * 32);
            ctx.stroke();
            ctx.lineWidth = 3;
            for (let fb = 0; fb < 2; fb++) {
              const ft = 0.35 + fb * 0.30;
              const fsd = fb % 2 === 0 ? 1 : -1;
              ctx.beginPath();
              ctx.moveTo(len * ft, 0);
              ctx.lineTo(len * (ft + 0.30), fsd * (34 + rng() * 18));
              ctx.stroke();
            }

            const nLeaves = 16 + (variant % 3) * 2;
            for (let li = 0; li < nLeaves; li++) {
              const t = 0.14 + (li / nLeaves) * 0.86;
              const side = (li % 2 === 0) ? 1 : -1;
              const lx = t * len + (rng() - 0.5) * 18;
              const ly = side * (12 + rng() * 44) * (1.1 - t * 0.35);
              const lLen = (34 + rng() * 28) * (1.05 - t * 0.25);
              const lWid = lLen * (0.42 + rng() * 0.16);
              const lum = Math.round(108 + t * 110 + (rng() - 0.5) * 44);
              ctx.save();
              ctx.translate(lx, ly);
              ctx.rotate(side * (0.4 + rng() * 0.75) + (rng() - 0.5) * 0.4);
              ctx.fillStyle = `rgb(${Math.max(80, Math.min(255, lum))}, 255, 0)`;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.bezierCurveTo(lLen * 0.25, -lWid, lLen * 0.72, -lWid * 0.78, lLen, 0);
              ctx.bezierCurveTo(lLen * 0.72,  lWid * 0.78, lLen * 0.25,  lWid, 0, 0);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
            ctx.restore();
          }
          for (let k = 0; k < 16; k++) {
            const a = rng() * Math.PI * 2, d = rng() * 58;
            const lLen = 28 + rng() * 22, lWid = lLen * 0.48;
            const lum = Math.round(92 + rng() * 88);
            ctx.save();
            ctx.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
            ctx.rotate(a + (rng() - 0.5) * 0.8);
            ctx.fillStyle = `rgb(${lum}, 255, 0)`;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(lLen * 0.5, -lWid, lLen, 0);
            ctx.quadraticCurveTo(lLen * 0.5,  lWid, 0, 0);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }
    return uploadTex(gl, c, false, true);
  }

  function createFarwoodsAtlas(gl) {
    const W = 2048, H = 256;
    const rng = mulberry32(5512);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    for (let slot = 0; slot < 8; slot++) {
      const ox = slot * 256;
      const isPine = slot < 5;
      const cx = ox + 128;

      if (isPine) {
        ctx.fillStyle = 'rgb(75, 255, 0)';
        ctx.fillRect(cx - 5, 195, 10, 56);
        const tiers = 9;
        for (let t = 0; t < tiers; t++) {
          const u = t / (tiers - 1);
          const ty = 22 + u * 185;
          const halfW = 14 + Math.pow(u, 0.88) * (88 + (slot % 3) * 10);
          const sprays = 14 + t * 4;
          for (let k = 0; k < sprays; k++) {
            const side = (k / (sprays - 1)) * 2 - 1;
            const px = cx + side * halfW * (0.4 + rng() * 0.65);
            const py = ty + Math.abs(side) * 14 + (rng() - 0.5) * 14;
            const lum = Math.round(135 + (1 - u) * 55 + (1 - Math.abs(side)) * 35 + (rng() - 0.5) * 40);
            ctx.fillStyle = `rgb(${Math.max(100, Math.min(255, lum))}, 255, 0)`;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(side * 0.45 + (rng() - 0.5) * 0.35);
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.quadraticCurveTo(0, -10, 18, 2);
            ctx.quadraticCurveTo(0, 8, -14, 0);
            ctx.fill();
            ctx.restore();
          }
        }
      } else {
        ctx.fillStyle = 'rgb(80, 255, 0)';
        ctx.fillRect(cx - 6, 175, 12, 76);
        const blobs = [[0, 115, 72], [-44, 138, 52], [44, 134, 54], [0, 76, 50]];
        for (const [bx, by, br] of blobs) {
          for (let k = 0; k < 55; k++) {
            const a = rng() * Math.PI * 2;
            const d = Math.sqrt(rng()) * br;
            const px = cx + bx + Math.cos(a) * d;
            const py = by + Math.sin(a) * d * 0.85;
            const lum = Math.round(140 + (1 - (py / 200)) * 90 + (rng() - 0.5) * 35);
            ctx.fillStyle = `rgb(${Math.max(110, Math.min(255, lum))}, 255, 0)`;
            ctx.beginPath();
            ctx.ellipse(px, py, 8 + rng() * 9, 5 + rng() * 6, rng() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    return uploadTex(gl, c, false, true);
  }

  // Item 2: Painterly multi-tone brushstroke grass slope texture (clean anime color blocks, NO photo noise!)
  function createGrassPBR(gl) {
    const S = 1024, rng = mulberry32(4409);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');
    actx.fillStyle = '#2f5a26'; actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#7c7c7c'; hctx.fillRect(0, 0, S, S);

    // 1. Tileable organic alpine turf, wet humus, moss cushion & sunlit meadow patches
    const patches = ['#3f7032', '#2b5424', '#183a1e', '#4c7c38', '#3c3824', '#214722', '#2e4a2b', '#4d662d'];
    for (let i = 0; i < 340; i++) {
      const x = rng()*S, y = rng()*S, rx = 18+rng()*58, ry = 12+rng()*42;
      actx.fillStyle = patches[(rng()*patches.length)|0]; actx.globalAlpha = 0.28 + rng()*0.18;
      const hv = 62 + ((rng()*128)|0);
      hctx.fillStyle = `rgb(${hv},${hv},${hv})`; hctx.globalAlpha = 0.24;
      const ang = (rng() - 0.5) * 1.4;
      for (let ox=-S; ox<=S; ox+=S) for (let oy=-S; oy<=S; oy+=S) {
        if (x+ox+rx < 0 || x+ox-rx > S || y+oy+ry < 0 || y+oy-ry > S) continue;
        actx.beginPath(); actx.ellipse(x+ox, y+oy, rx, ry, ang, 0, Math.PI*2); actx.fill();
        hctx.beginPath(); hctx.ellipse(x+ox, y+oy, rx*0.85, ry*0.85, ang, 0, Math.PI*2); hctx.fill();
      }
    }
    // 2. Embedded micro-pebbles, humus clods & lichen flecks for close-up parallax crispness
    for (let i = 0; i < 650; i++) {
      const x = rng()*S, y = rng()*S, r = 1.6 + rng()*5.2;
      actx.fillStyle = i%4===0 ? '#5a605c' : (i%4===1 ? '#2c251c' : (i%4===2 ? '#59823c' : '#1b361f'));
      actx.globalAlpha = 0.45 + rng()*0.30;
      const hv = i%4===0 ? (150 + ((rng()*70)|0)) : (45 + ((rng()*90)|0));
      hctx.fillStyle = `rgb(${hv},${hv},${hv})`; hctx.globalAlpha = 0.55;
      actx.beginPath(); actx.arc(x, y, r, 0, Math.PI*2); actx.fill();
      hctx.beginPath(); hctx.arc(x, y, r*0.9, 0, Math.PI*2); hctx.fill();
    }
    // 3. Dense crisp multi-scale painterly grass & moss tufts (tileable)
    for (let i = 0; i < 2800; i++) {
      const x = rng()*S, y = rng()*S, len = 7+rng()*19, ang = -Math.PI*0.5 + (rng()-0.5)*1.15;
      const ex = x + Math.cos(ang)*len, ey = y + Math.sin(ang)*len;
      actx.strokeStyle = i%5===0 ? '#609142' : (i%5===1 ? '#467334' : (i%5===2 ? '#295023' : (i%5===3 ? '#142e19' : '#536b32')));
      actx.lineWidth = 1.2 + rng()*2.2; actx.globalAlpha = 0.48 + rng()*0.26;
      const hv = 105 + ((rng()*138)|0);
      hctx.strokeStyle = `rgb(${hv},${hv},${hv})`; hctx.lineWidth = 1.5 + rng()*1.8; hctx.globalAlpha = 0.52;
      for (let ox=-S; ox<=S; ox+=S) for (let oy=-S; oy<=S; oy+=S) {
        if (Math.max(x+ox, ex+ox) < 0 || Math.min(x+ox, ex+ox) > S || Math.max(y+oy, ey+oy) < 0 || Math.min(y+oy, ey+oy) > S) continue;
        actx.beginPath(); actx.moveTo(x+ox, y+oy); actx.lineTo(ex+ox, ey+oy); actx.stroke();
        hctx.beginPath(); hctx.moveTo(x+ox, y+oy); hctx.lineTo(ex+ox, ey+oy); hctx.stroke();
      }
    }
    actx.globalAlpha = 1; hctx.globalAlpha = 1;
    return { albedo: uploadTex(gl, albC, true, false), normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 2.9), false, false) };
  }

  function createRockPBR(gl) {
    const S = 1024, rng = mulberry32(7712);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');
    actx.fillStyle = '#4e565a'; actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#808080'; hctx.fillRect(0, 0, S, S);
    // 1. Stratified fractured basalt/granite rock ledges & angular cleaved faces
    const strata = ['#656e72', '#4c5459', '#363e43', '#747b7a', '#424b47', '#2b3237', '#5a605e'];
    for (let i = 0; i < 240; i++) {
      const x = rng()*S, y = rng()*S, w = 48+rng()*190, h = 10+rng()*38;
      const ang = (rng()-0.5)*0.34;
      actx.fillStyle = strata[(rng()*strata.length)|0]; actx.globalAlpha = 0.44 + rng()*0.26;
      const hv = 48 + ((rng()*175)|0);
      hctx.fillStyle = `rgb(${hv},${hv},${hv})`; hctx.globalAlpha = 0.56;
      for (let ox=-S; ox<=S; ox+=S) for (let oy=-S; oy<=S; oy+=S) {
        if (x+ox+w < 0 || x+ox-w > S || y+oy+h < 0 || y+oy-h > S) continue;
        actx.save(); actx.translate(x+ox, y+oy); actx.rotate(ang); actx.fillRect(-w*0.5, -h*0.5, w, h); actx.restore();
        hctx.save(); hctx.translate(x+ox, y+oy); hctx.rotate(ang); hctx.fillRect(-w*0.5, -h*0.5, w, h); hctx.restore();
      }
    }
    // 2. Sharp geological cleavage cracks & dark tectonic joint fissures (deep height crevices for POM!)
    for (let i = 0; i < 190; i++) {
      let x = rng()*S, y = rng()*S;
      const pts = [[x, y]];
      const horiz = rng() < 0.65;
      for (let s = 0; s < 6; s++) {
        x += horiz ? (18 + rng()*52) : ((rng()-0.5)*46);
        y += horiz ? ((rng()-0.5)*22) : (14 + rng()*40);
        pts.push([x, y]);
      }
      const lw = 1.3 + rng()*2.8;
      actx.strokeStyle = i%3===0 ? '#14191d' : '#1f262b'; actx.lineWidth = lw; actx.globalAlpha = 0.78;
      hctx.strokeStyle = '#0c0c0c'; hctx.lineWidth = lw + 1.4; hctx.globalAlpha = 0.88;
      actx.beginPath(); hctx.beginPath();
      actx.moveTo(pts[0][0], pts[0][1]); hctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) { actx.lineTo(pts[k][0], pts[k][1]); hctx.lineTo(pts[k][0], pts[k][1]); }
      actx.stroke(); hctx.stroke();
      actx.strokeStyle = '#8b9396'; actx.lineWidth = 1.0; actx.globalAlpha = 0.28;
      hctx.strokeStyle = '#e4e4e4'; hctx.lineWidth = 1.4; hctx.globalAlpha = 0.42;
      actx.beginPath(); hctx.beginPath();
      actx.moveTo(pts[0][0], pts[0][1]-1.5); hctx.moveTo(pts[0][0], pts[0][1]-1.5);
      for (let k = 1; k < pts.length; k++) { actx.lineTo(pts[k][0], pts[k][1]-1.5); hctx.lineTo(pts[k][0], pts[k][1]-1.5); }
      actx.stroke(); hctx.stroke();
    }
    // 3. Mineral grit & subtle weathered moss/lichen crusts nestled in rock seams
    for (let i = 0; i < 1200; i++) {
      const x = rng()*S, y = rng()*S, r = 0.9 + rng()*3.4;
      const isLichen = rng() < 0.14;
      actx.fillStyle = isLichen ? '#385230' : (rng() < 0.5 ? '#7e8689' : '#262c30');
      actx.globalAlpha = isLichen ? 0.36 : 0.34;
      actx.beginPath(); actx.arc(x, y, r, 0, Math.PI*2); actx.fill();
      const hv = isLichen ? 165 : (rng() < 0.5 ? 195 : 55);
      hctx.fillStyle = `rgb(${hv},${hv},${hv})`; hctx.globalAlpha = 0.35;
      hctx.beginPath(); hctx.arc(x, y, r, 0, Math.PI*2); hctx.fill();
    }
    actx.globalAlpha = 1; hctx.globalAlpha = 1;
    return { albedo: uploadTex(gl, albC, true, false), normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 4.6), false, false) };
  }

  // Item 5: #22 Rally Coupe Livery — Crisp panel seams, mud concentrated behind wheels & lower rockers
  function createCarLiveryPBR(gl) {
    const W = 1024, H = 512, rng = mulberry32(2299);
    const albC = document.createElement('canvas'); albC.width = W; albC.height = H;
    const ctx = albC.getContext('2d');
    const rghC = document.createElement('canvas'); rghC.width = W; rghC.height = H;
    const rctx = rghC.getContext('2d');

    // Vibrant reference rally teal-cyan paint (#1a96a4 -> #28bcc8) so it stays rich & readable in rain!
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#188e9c');
    grad.addColorStop(0.52, '#22aab8');
    grad.addColorStop(1, '#29becb');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    rctx.fillStyle = 'rgb(38, 245, 255)'; rctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#f26e1c';
    const band = (x0, x1, y0, y1, w) => {
      ctx.beginPath();
      ctx.moveTo(W*x0, H*y0); ctx.lineTo(W*(x0+w), H*y0);
      ctx.lineTo(W*(x1+w), H*y1); ctx.lineTo(W*x1, H*y1);
      ctx.closePath(); ctx.fill();
    };
    band(0.14, 0.28, 0.24, 0.56, 0.085);
    band(0.54, 0.72, 0.72, 0.12, 0.065);
    band(0.63, 0.80, 0.72, 0.16, 0.038);
    band(0.75, 0.90, 0.65, 0.22, 0.048);
    ctx.fillStyle = '#ffbe48';
    band(0.60, 0.77, 0.72, 0.14, 0.016);

    // Door #22 plate
    const px = W * 0.39, py = H * 0.38, pw = W * 0.155, ph = H * 0.34;
    ctx.fillStyle = '#eef0ec'; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = '#f07c18'; ctx.fillRect(px, py, pw, ph * 0.22);
    ctx.strokeStyle = '#182022'; ctx.lineWidth = 4; ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = '#141a1d'; ctx.font = '900 108px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('22', px + pw * 0.5, py + ph * 0.64);
    rctx.fillStyle = 'rgb(115, 90, 255)'; rctx.fillRect(px, py, pw, ph);

    // Crisp body panel shut-lines
    ctx.strokeStyle = 'rgba(12, 20, 22, 0.82)'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(W*0.33, H*0.26); ctx.lineTo(W*0.33, H*0.88); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.60, H*0.26); ctx.lineTo(W*0.61, H*0.88); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.10, H*0.44); ctx.lineTo(W*0.33, H*0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.24, H*0.78); ctx.lineTo(W*0.76, H*0.78); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.78, H*0.28); ctx.lineTo(W*0.95, H*0.34); ctx.stroke();
    ctx.fillStyle = '#11181a';
    for (let g = 0; g < 3; g++) ctx.fillRect(W * (0.715 + g * 0.015), H * 0.39, 6, 34);

    // Selective organic wet brown mud splatter concentrated on lower bumper, arches & rockers (keeps upper teal & orange crisp!)
    for (let i = 0; i < 620; i++) {
      const rearZone = rng() < 0.46;
      const wheelZone = !rearZone && rng() < 0.65;
      const x = rearZone ? (0.78 + rng() * 0.22) * W : (wheelZone ? (rng() < 0.5 ? (0.16 + rng() * 0.22) : (0.62 + rng() * 0.24)) * W : rng() * W);
      const y = rearZone ? H * (0.60 + rng() * 0.40) : (wheelZone ? H * (0.60 + rng() * 0.40) : H * (0.76 + rng() * 0.24));
      const r = 3.0 + rng() * (rearZone ? 16 : (wheelZone ? 14 : 9));
      ctx.fillStyle = rng() < 0.48 ? '#583d24' : (rng() < 0.5 ? '#3e2918' : '#6c4d30');
      ctx.globalAlpha = (0.38 + rng() * 0.42) * Math.min(1, (y - H * 0.56) / (H * 0.20));
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.5, r * 0.80, (rng() - 0.5) * 0.8, 0, Math.PI * 2); ctx.fill();
      rctx.fillStyle = 'rgb(215, 22, 215)'; rctx.globalAlpha = ctx.globalAlpha;
      rctx.beginPath(); rctx.ellipse(x, y, r * 1.5, r * 0.80, 0, 0, Math.PI * 2); rctx.fill();
    }
    ctx.globalAlpha = 1; rctx.globalAlpha = 1;

    const trkC = document.createElement('canvas'); trkC.width = 256; trkC.height = 192;
    const tctx = trkC.getContext('2d');
    tctx.fillStyle = '#e6e8e2'; tctx.fillRect(0, 0, 256, 192);
    tctx.fillStyle = '#e4801a'; tctx.fillRect(0, 0, 256, 38);
    tctx.strokeStyle = '#182022'; tctx.lineWidth = 10; tctx.strokeRect(5, 5, 246, 182);
    tctx.fillStyle = '#141a1d'; tctx.font = '900 116px "Arial Black", Impact, sans-serif';
    tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
    tctx.fillText('22', 128, 118);
    for (let i = 0; i < 24; i++) {
      tctx.fillStyle = 'rgba(66, 48, 32, 0.52)';
      tctx.beginPath(); tctx.arc(rng()*256, 134 + rng()*58, 2 + rng()*5, 0, Math.PI*2); tctx.fill();
    }

    return {
      albedo: uploadTex(gl, albC, true, true),
      rma: uploadTex(gl, rghC, false, true),
      rearPlate: uploadTex(gl, trkC, true, true),
    };
  }

  function createSpraySprites(gl) {
    const S = 256, rng = mulberry32(9044);

    // Delicate directional fine water-droplet spray fan (ZERO solid white snowball/polka-dot core!)
    const wc = document.createElement('canvas'); wc.width = wc.height = S;
    const wctx = wc.getContext('2d');
    wctx.clearRect(0, 0, S, S);
    // Ultra-subtle translucent mist base (max ~0.12 alpha, never solid white!)
    for (let i = 0; i < 6; i++) {
      const a = (rng() - 0.5) * Math.PI * 1.2;
      const dist = (0.04 + rng() * 0.24) * S;
      const cx = S * 0.5 + Math.cos(a) * dist, cy = S * 0.5 + Math.sin(a) * dist * 0.72;
      const rx = S * (0.16 + rng() * 0.14), ry = S * (0.08 + rng() * 0.08);
      const g = wctx.createRadialGradient(cx, cy, 1, cx, cy, rx);
      g.addColorStop(0, 'rgba(215, 228, 240, 0.09)');
      g.addColorStop(0.55, 'rgba(185, 204, 220, 0.04)');
      g.addColorStop(1, 'rgba(165, 186, 204, 0)');
      wctx.fillStyle = g;
      wctx.beginPath(); wctx.ellipse(cx, cy, rx, ry, a * 0.3, 0, Math.PI * 2); wctx.fill();
    }
    // Crisp swept fine water droplets & feathery spray filaments (1:1 demo rally tire spray!)
    for (let i = 0; i < 68; i++) {
      const a = -0.85 + rng() * 1.7;
      const d = (0.05 + Math.pow(rng(), 0.7) * 0.39) * S;
      const x = S * 0.5 + Math.cos(a) * d, y = S * 0.5 + Math.sin(a) * d * 0.80;
      const len = 10 + rng() * 28, wid = 1.1 + rng() * 2.4;
      wctx.save();
      wctx.translate(x, y);
      wctx.rotate(a);
      const g = wctx.createLinearGradient(-len * 0.5, 0, len * 0.5, 0);
      g.addColorStop(0, 'rgba(205, 222, 238, 0)');
      g.addColorStop(0.5, 'rgba(235, 245, 255, 0.34)');
      g.addColorStop(1, 'rgba(205, 222, 238, 0)');
      wctx.fillStyle = g;
      wctx.beginPath(); wctx.ellipse(0, 0, len * 0.5, wid, 0, 0, Math.PI * 2); wctx.fill();
      wctx.restore();
    }
    for (let i = 0; i < 42; i++) {
      const a = rng() * Math.PI * 2, d = (0.06 + Math.pow(rng(), 0.6) * 0.40) * S;
      const r = 1.2 + rng() * 2.6;
      wctx.fillStyle = `rgba(236, 246, 255, ${(0.22 + rng() * 0.28).toFixed(2)})`;
      wctx.beginPath(); wctx.arc(S * 0.5 + Math.cos(a) * d, S * 0.5 + Math.sin(a) * d * 0.82, r, 0, Math.PI * 2); wctx.fill();
    }

    // Ultra-delicate translucent trailing aerosol mist
    const mistC = document.createElement('canvas'); mistC.width = mistC.height = S;
    const mistCtx = mistC.getContext('2d');
    mistCtx.clearRect(0, 0, S, S);
    for (let i = 0; i < 12; i++) {
      const cx = S * (0.28 + rng() * 0.44), cy = S * (0.30 + rng() * 0.40);
      const rx = S * (0.16 + rng() * 0.20), ry = S * (0.09 + rng() * 0.12);
      const g = mistCtx.createRadialGradient(cx, cy, 4, cx, cy, rx);
      g.addColorStop(0, 'rgba(222, 234, 244, 0.17)');
      g.addColorStop(0.55, 'rgba(182, 200, 214, 0.07)');
      g.addColorStop(1, 'rgba(150, 174, 192, 0)');
      mistCtx.fillStyle = g;
      mistCtx.beginPath(); mistCtx.ellipse(cx, cy, rx, ry, (rng() - 0.5) * 0.5, 0, Math.PI * 2); mistCtx.fill();
    }

    // Ground ripple arc (subtle expanding puddle wake, no hard floating circles!)
    const ripC = document.createElement('canvas'); ripC.width = ripC.height = S;
    const rctx = ripC.getContext('2d');
    rctx.clearRect(0, 0, S, S);
    for (const [rad, lw, alpha] of [[0.43, 2.2, 0.26], [0.30, 1.5, 0.16]]) {
      rctx.strokeStyle = `rgba(208, 226, 240, ${alpha})`;
      rctx.lineWidth = lw;
      rctx.beginPath();
      rctx.arc(S * 0.5, S * 0.5, S * rad, 0.15, Math.PI * 1.85);
      rctx.stroke();
    }

    // Organic dark wet mud clods & streaked splatter (varied sizes, no uniform pepper dots!)
    const mc = document.createElement('canvas'); mc.width = mc.height = S;
    const mctx = mc.getContext('2d');
    mctx.clearRect(0, 0, S, S);
    for (let i = 0; i < 14; i++) {
      const a = rng() * Math.PI * 2;
      const d = Math.pow(rng(), 0.78) * S * 0.32;
      const x = S * 0.5 + Math.cos(a) * d, y = S * 0.5 + Math.sin(a) * d;
      const rx = 5 + rng() * 14, ry = 3 + rng() * 7;
      mctx.fillStyle = i % 3 === 0 ? 'rgba(46, 29, 15, 0.86)' : (i % 3 === 1 ? 'rgba(68, 44, 24, 0.80)' : 'rgba(86, 58, 34, 0.72)');
      mctx.beginPath(); mctx.ellipse(x, y, rx, ry, a + (rng() - 0.5) * 0.6, 0, Math.PI * 2); mctx.fill();
    }

    const ch = document.createElement('canvas'); ch.width = ch.height = 256;
    const cctx = ch.getContext('2d');
    cctx.fillStyle = '#deb22a'; cctx.fillRect(0, 0, 256, 256);
    cctx.strokeStyle = '#1b1d1e'; cctx.lineWidth = 14; cctx.strokeRect(7, 7, 242, 242);
    cctx.fillStyle = '#1b1d1e';
    cctx.beginPath(); cctx.moveTo(64,34); cctx.lineTo(132,34); cctx.lineTo(208,128); cctx.lineTo(132,222); cctx.lineTo(64,222); cctx.lineTo(140,128); cctx.closePath(); cctx.fill();

    return {
      waterSplash: uploadTex(gl, wc, true, true),
      waterMist: uploadTex(gl, mistC, true, true),
      waterRipple: uploadTex(gl, ripC, true, true),
      mudClump: uploadTex(gl, mc, true, true),
      chevron: uploadTex(gl, ch, true, true),
    };
  }

  // === ARCHITECTURAL PBR DIFFERENTIAL TEXTURES (1024px Irregular Weathered Alpine Granite Ashlar, Aged Brick, Weathered Timber) ===
  function createStoneMasonryPBR(gl) {
    const S = 1024;
    const rng = mulberry32(4117);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');

    // Deep damp weathered mortar bed
    actx.fillStyle = '#242624';
    actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#1a1a1a';
    hctx.fillRect(0, 0, S, S);

    // Variable course heights (monumental alpine granite ashlar — organic, NEVER tiny shiny checkerboard tiles!)
    const courseHs = [136, 118, 148, 112, 134, 122, 138, 116];
    let curY = 0;
    for (let r = 0; r < courseHs.length; r++) {
      const rowH = courseHs[r];
      // Irregular block widths summing cleanly to S for seamless horizontal tiling
      const numBlocks = 3 + ((r * 3 + 1) % 2);
      const weights = [];
      let wSum = 0;
      for (let c = 0; c < numBlocks; c++) { const w = 0.72 + rng() * 0.65; weights.push(w); wSum += w; }
      let curX = (r % 2 === 1) ? -Math.round(S * (0.18 + rng() * 0.14)) : 0;
      const drawBlock = (bx, by, bw, bh) => {
        const padX = 5 + rng() * 3.5;
        const padY = 4.5 + rng() * 3.0;
        const x0 = bx + padX, y0 = by + padY, w = Math.max(24, bw - padX * 2), h = Math.max(24, bh - padY * 2);
        // Natural alpine granite & warm grey-ochre stone variation
        const base = 78 + ((rng() * 44) | 0);
        const warm = (rng() - 0.42) * 20;
        const mossTint = rng() < 0.28 ? 10 : 0;
        const cr = Math.max(46, Math.min(168, Math.round(base + warm - mossTint * 0.4)));
        const cg = Math.max(48, Math.min(170, Math.round(base + warm * 0.55 + mossTint * 0.5)));
        const cb = Math.max(46, Math.min(166, Math.round(base - warm * 0.45 - mossTint * 0.2)));

        // Organic slightly chipped polygon outline for each stone block
        const pts = [];
        const stepsX = 6, stepsY = 4;
        for (let i = 0; i <= stepsX; i++) pts.push([x0 + (w * i) / stepsX, y0 + (rng() - 0.5) * 4.0]);
        for (let i = 1; i <= stepsY; i++) pts.push([x0 + w + (rng() - 0.5) * 4.0, y0 + (h * i) / stepsY]);
        for (let i = stepsX - 1; i >= 0; i--) pts.push([x0 + (w * i) / stepsX, y0 + h + (rng() - 0.5) * 4.0]);
        for (let i = stepsY - 1; i >= 1; i--) pts.push([x0 + (rng() - 0.5) * 4.0, y0 + (h * i) / stepsY]);

        const trace = (ctx) => {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
          ctx.closePath();
        };

        const g = actx.createLinearGradient(x0, y0, x0 + w * 0.25, y0 + h);
        g.addColorStop(0, `rgb(${Math.min(188, cr + 14)},${Math.min(188, cg + 14)},${Math.min(186, cb + 12)})`);
        g.addColorStop(0.55, `rgb(${cr},${cg},${cb})`);
        g.addColorStop(1, `rgb(${Math.max(30, cr - 18)},${Math.max(32, cg - 18)},${Math.max(30, cb - 16)})`);
        trace(actx); actx.fillStyle = g; actx.fill();

        const hv = 152 + ((rng() * 68) | 0);
        trace(hctx); hctx.fillStyle = `rgb(${hv},${hv},${hv})`; hctx.fill();
        hctx.strokeStyle = `rgb(${hv - 62},${hv - 62},${hv - 62})`;
        hctx.lineWidth = 6;
        hctx.stroke();

        // Chiseled granite fracture veins, mineral speckles & lichen inside block
        actx.save(); trace(actx); actx.clip();
        hctx.save(); trace(hctx); hctx.clip();
        for (let k = 0; k < 44; k++) {
          const px = x0 + rng() * w, py = y0 + rng() * h, pr = 2.0 + rng() * 11.0;
          const dark = rng() < 0.45;
          actx.fillStyle = dark ? 'rgba(28,31,30,0.22)' : 'rgba(176,178,172,0.14)';
          actx.beginPath(); actx.ellipse(px, py, pr * 1.4, pr * 0.75, rng() * Math.PI, 0, Math.PI * 2); actx.fill();
          const ph = dark ? 105 : 222;
          hctx.fillStyle = `rgba(${ph},${ph},${ph},0.18)`;
          hctx.beginPath(); hctx.ellipse(px, py, pr * 1.3, pr * 0.75, rng() * Math.PI, 0, Math.PI * 2); hctx.fill();
        }
        // Subtle fine chiseled fracture line
        if (rng() < 0.55) {
          const fx = x0 + rng() * w * 0.7, fy = y0 + rng() * h;
          actx.strokeStyle = 'rgba(22,25,24,0.34)'; actx.lineWidth = 1.6;
          actx.beginPath(); actx.moveTo(fx, fy); actx.lineTo(fx + (rng() - 0.3) * 48, fy + (rng() - 0.5) * 26); actx.stroke();
        }
        actx.restore(); hctx.restore();
      };

      for (let c = 0; c < numBlocks; c++) {
        const bw = (weights[c] / wSum) * S;
        drawBlock(curX, curY, bw, rowH);
        if (curX < 0) drawBlock(curX + S, curY, bw, rowH);
        if (curX + bw > S) drawBlock(curX - S, curY, bw, rowH);
        curX += bw;
      }
      curY += rowH;
    }
    // Organic rain-wash weathering streaks & mortar-joint moss patches
    for (let i = 0; i < 65; i++) {
      const sx = rng() * S, sy = rng() * S, sh = 70 + rng() * 240;
      const isMoss = rng() < 0.34;
      const g = actx.createLinearGradient(sx, sy, sx, sy + sh);
      g.addColorStop(0, isMoss ? 'rgba(34,58,28,0.34)' : 'rgba(18,21,20,0.28)');
      g.addColorStop(1, 'rgba(18,21,20,0)');
      actx.fillStyle = g;
      actx.fillRect(sx, sy, 5 + rng() * 16, sh);
    }
    return {
      albedo: uploadTex(gl, albC, true, false),
      normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 4.4), false, false),
    };
  }

  function createAgedBrickPBR(gl) {
    const S = 512;
    const rng = mulberry32(5229);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');

    // Aged weathered lime mortar
    actx.fillStyle = '#5b564d';
    actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#242424';
    hctx.fillRect(0, 0, S, S);

    const rows = 16, cols = 8;
    const rowH = S / rows, colW = S / cols;
    const brickPalette = [[138,66,46], [122,56,40], [154,78,52], [108,52,38], [146,84,56], [96,48,38]];
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * colW * 0.5;
      for (let c = -1; c <= cols; c++) {
        const bx = c * colW + off, by = r * rowH;
        const padX = 2.6, padY = 2.4;
        const w = colW - padX * 2, h = rowH - padY * 2;
        const bc = brickPalette[(rng() * brickPalette.length) | 0];
        const tone = 0.80 + rng() * 0.36;
        const cr = Math.min(205, Math.round(bc[0] * tone));
        const cg = Math.min(165, Math.round(bc[1] * tone));
        const cb = Math.min(140, Math.round(bc[2] * tone));
        actx.fillStyle = `rgb(${cr},${cg},${cb})`;
        actx.fillRect(bx + padX, by + padY, w, h);

        // Chipped brick edges & weathered soot
        const hv = 172 + ((rng() * 56) | 0);
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(bx + padX + 1.5, by + padY + 1.5, w - 3, h - 3);
        for (let k = 0; k < 8; k++) {
          const px = bx + padX + rng() * w, py = by + padY + rng() * h;
          actx.fillStyle = rng() < 0.45 ? 'rgba(32,20,16,0.28)' : 'rgba(195,180,158,0.18)';
          actx.fillRect(px, py, 2 + rng() * 6, 1.5 + rng() * 3.5);
          hctx.fillStyle = 'rgba(70,70,70,0.32)';
          hctx.fillRect(px, py, 2 + rng() * 5, 1.5 + rng() * 3.0);
        }
      }
    }
    // Aged damp grime & peeling plaster weathering patches
    for (let i = 0; i < 28; i++) {
      const x = rng() * S, y = rng() * S, rad = 12 + rng() * 34;
      const g = actx.createRadialGradient(x, y, 2, x, y, rad);
      if (rng() < 0.55) {
        g.addColorStop(0, 'rgba(28,26,22,0.34)');
        g.addColorStop(1, 'rgba(28,26,22,0)');
      } else {
        g.addColorStop(0, 'rgba(54,74,40,0.24)');
        g.addColorStop(1, 'rgba(54,74,40,0)');
      }
      actx.fillStyle = g;
      actx.beginPath(); actx.arc(x, y, rad, 0, Math.PI * 2); actx.fill();
    }
    return {
      albedo: uploadTex(gl, albC, true, false),
      normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 4.2), false, false),
    };
  }

  function createWeatheredWoodPBR(gl) {
    const S = 512;
    const rng = mulberry32(6331);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');

    actx.fillStyle = '#3a291b';
    actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#808080';
    hctx.fillRect(0, 0, S, S);

    const planks = 8;
    const plankH = S / planks;
    for (let p = 0; p < planks; p++) {
      const y0 = p * plankH;
      const baseR = 88 + ((rng() * 34) | 0);
      const baseG = 62 + ((rng() * 26) | 0);
      const baseB = 40 + ((rng() * 18) | 0);
      actx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
      actx.fillRect(0, y0 + 2, S, plankH - 4);
      const pv = 158 + ((rng() * 44) | 0);
      hctx.fillStyle = `rgb(${pv},${pv},${pv})`;
      hctx.fillRect(0, y0 + 3, S, plankH - 6);

      // Longitudinal fibrous wood grain lines
      for (let f = 0; f < 34; f++) {
        const fy = y0 + 3 + rng() * (plankH - 6);
        const dark = rng() < 0.6;
        actx.strokeStyle = dark ? 'rgba(28,18,10,0.34)' : 'rgba(155,118,78,0.22)';
        actx.lineWidth = 1.0 + rng() * 2.2;
        actx.beginPath();
        actx.moveTo(0, fy);
        actx.bezierCurveTo(S * 0.33, fy + (rng() - 0.5) * 6, S * 0.66, fy + (rng() - 0.5) * 6, S, fy);
        actx.stroke();

        hctx.strokeStyle = dark ? 'rgba(72,72,72,0.38)' : 'rgba(215,215,215,0.24)';
        hctx.lineWidth = 1.2;
        hctx.beginPath();
        hctx.moveTo(0, fy);
        hctx.bezierCurveTo(S * 0.33, fy + (rng() - 0.5) * 5, S * 0.66, fy + (rng() - 0.5) * 5, S, fy);
        hctx.stroke();
      }
      // Plank seam groove + weathered iron nail heads
      actx.fillStyle = 'rgba(14,10,7,0.88)';
      actx.fillRect(0, y0, S, 3);
      hctx.fillStyle = 'rgb(20,20,20)';
      hctx.fillRect(0, y0, S, 3.5);
      // Wood knot
      if (rng() < 0.65) {
        const kx = 40 + rng() * (S - 80), ky = y0 + plankH * (0.3 + rng() * 0.4);
        actx.fillStyle = 'rgba(26,16,9,0.58)';
        actx.beginPath(); actx.ellipse(kx, ky, 9 + rng() * 9, 4 + rng() * 4, 0, 0, Math.PI * 2); actx.fill();
        hctx.fillStyle = 'rgba(55,55,55,0.55)';
        hctx.beginPath(); hctx.ellipse(kx, ky, 9, 4, 0, 0, Math.PI * 2); hctx.fill();
      }
    }
    return {
      albedo: uploadTex(gl, albC, true, false),
      normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 4.4), false, false),
    };
  }

  // === 5 NEW 512px PROCEDURAL PBR TEXTURES FOR MULTI-BIOME DIVERSITY ===
  function createBirchBarkPBR(gl) {
    const S = 512, rng = mulberry32(7103);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');
    actx.fillStyle = '#ddd9ce'; actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#929292'; hctx.fillRect(0, 0, S, S);
    // Subtle papery horizontal bark sheets & warm amber under-bark peel bands
    for (let i = 0; i < 65; i++) {
      const y = rng() * S, h = 6 + rng() * 24;
      const isPeel = rng() < 0.22;
      actx.fillStyle = isPeel ? `rgba(${176 + ((rng()*34)|0)},${132 + ((rng()*24)|0)},${84 + ((rng()*18)|0)},0.52)`
                              : `rgba(${210 + ((rng()*28)|0)},${206 + ((rng()*26)|0)},${194 + ((rng()*24)|0)},0.48)`;
      actx.fillRect(0, y, S, h);
      const hv = isPeel ? 105 : (152 + ((rng()*46)|0));
      hctx.fillStyle = `rgba(${hv},${hv},${hv},0.48)`;
      hctx.fillRect(0, y, S, h);
    }
    // Signature dark horizontal birch lenticels & diamond bark knots
    for (let i = 0; i < 380; i++) {
      const x = rng() * S, y = rng() * S;
      const w = 12 + rng() * 58, h = 1.6 + rng() * 3.8;
      const dark = 22 + ((rng() * 36) | 0);
      actx.fillStyle = `rgba(${dark},${dark - 2},${dark - 4},${(0.48 + rng() * 0.44).toFixed(2)})`;
      actx.beginPath(); actx.ellipse(x, y, w * 0.5, h * 0.5, (rng() - 0.5) * 0.08, 0, Math.PI * 2); actx.fill();
      hctx.fillStyle = 'rgba(26,26,26,0.68)';
      hctx.beginPath(); hctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2); hctx.fill();
    }
    for (let i = 0; i < 18; i++) {
      const x = rng() * S, y = rng() * S, rx = 14 + rng() * 26, ry = 8 + rng() * 14;
      actx.fillStyle = 'rgba(28,24,20,0.82)';
      actx.beginPath(); actx.moveTo(x - rx, y); actx.lineTo(x, y - ry); actx.lineTo(x + rx, y); actx.lineTo(x, y + ry); actx.closePath(); actx.fill();
      hctx.fillStyle = 'rgba(18,18,18,0.85)';
      hctx.beginPath(); hctx.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2); hctx.fill();
    }
    return {
      albedo: uploadTex(gl, albC, true, false),
      normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 4.2), false, false),
    };
  }

  function createSnowRockPBR(gl) {
    const S = 512, rng = mulberry32(8217);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');
    actx.fillStyle = '#6c737c'; actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#7c7c7c'; hctx.fillRect(0, 0, S, S);
    // Organic multi-angle fractured alpine granite patches (wrapped seamlessly, ZERO full-width horizontal bars!)
    const tones = ['#5a626b', '#7c848d', '#495058', '#8d969f', '#636c74'];
    for (let i = 0; i < 220; i++) {
      const cx = rng() * S, cy = rng() * S;
      const rx = 20 + rng() * 64, ry = 10 + rng() * 34;
      const ang = (rng() - 0.5) * 2.2;
      const col = tones[(rng() * tones.length) | 0];
      const hv = 55 + ((rng() * 145) | 0);
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        const xx = cx + ox, yy = cy + oy;
        if (xx + rx < 0 || xx - rx > S || yy + rx < 0 || yy - rx > S) continue;
        actx.fillStyle = col; actx.globalAlpha = 0.36;
        actx.beginPath(); actx.ellipse(xx, yy, rx, ry, ang, 0, Math.PI * 2); actx.fill();
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`; hctx.globalAlpha = 0.42;
        hctx.beginPath(); hctx.ellipse(xx, yy, rx * 0.9, ry * 0.9, ang, 0, Math.PI * 2); hctx.fill();
      }
    }
    // Wind-packed alpine snowdrifts nestled on horizontal ledges
    for (let i = 0; i < 120; i++) {
      const x = rng() * S, y = rng() * S, rx = 18 + rng() * 54, ry = 12 + rng() * 34;
      const rot = rng() * Math.PI;
      // Wrap seamlessly across tile edges so snow slopes NEVER show tile border seams!
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        const xx = x + ox, yy = y + oy;
        if (xx + rx < 0 || xx - rx > S || yy + ry < 0 || yy - ry > S) continue;
        const g = actx.createRadialGradient(xx, yy, 2, xx, yy, rx);
        g.addColorStop(0, 'rgba(226,236,246,0.88)');
        g.addColorStop(0.65, 'rgba(196,212,228,0.58)');
        g.addColorStop(1, 'rgba(180,198,216,0)');
        actx.globalAlpha = 1; actx.fillStyle = g;
        actx.beginPath(); actx.ellipse(xx, yy, rx, ry, rot, 0, Math.PI * 2); actx.fill();
        hctx.globalAlpha = 0.65; hctx.fillStyle = '#eaeaea';
        hctx.beginPath(); hctx.ellipse(xx, yy, rx * 0.85, ry * 0.85, rot, 0, Math.PI * 2); hctx.fill();
      }
    }
    actx.globalAlpha = 1; hctx.globalAlpha = 1;
    return {
      albedo: uploadTex(gl, albC, true, false),
      normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 4.4), false, false),
    };
  }

  function createFlagstonePBR(gl) {
    const S = 512, rng = mulberry32(9341);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');
    // Crisp 10x8 hand-laid mossy beveled shrine flagstones with deep mortar joints & surface chisel grain
    actx.fillStyle = '#1e301a'; actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#121212'; hctx.fillRect(0, 0, S, S);
    const rows = 10, cols = 8;
    const rh = S / rows, cw = S / cols;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * cw * 0.5 + (rng() - 0.5) * 4;
      for (let c = -1; c <= cols; c++) {
        const bx = c * cw + off + (rng() - 0.5) * 3.5;
        const by = r * rh + (rng() - 0.5) * 2.5;
        const pad = 2.6 + rng() * 1.8;
        const w = cw - pad * 2, h = rh - pad * 2;
        const base = 68 + ((rng() * 52) | 0);
        const warm = rng() < 0.25 ? 10 : 0;
        const mossTint = rng() < 0.36 ? 14 : 0;
        // Outer beveled stone rim
        actx.fillStyle = `rgb(${base - 14 + warm},${base - 6 + mossTint},${base - 4})`;
        actx.beginPath();
        actx.roundRect ? actx.roundRect(bx + pad, by + pad, w, h, 4) : actx.fillRect(bx + pad, by + pad, w, h);
        actx.fill();
        // Inner raised chiseled stone face
        actx.fillStyle = `rgb(${base + warm},${base + 6 + mossTint},${base + 8})`;
        actx.beginPath();
        actx.roundRect ? actx.roundRect(bx + pad + 2, by + pad + 2, Math.max(4, w - 4), Math.max(4, h - 4), 3) : actx.fillRect(bx + pad + 2, by + pad + 2, Math.max(4, w - 4), Math.max(4, h - 4));
        actx.fill();
        const hv = 180 + ((rng() * 62) | 0);
        hctx.fillStyle = `rgb(${(hv * 0.65) | 0},${(hv * 0.65) | 0},${(hv * 0.65) | 0})`;
        hctx.fillRect(bx + pad, by + pad, Math.max(4, w), Math.max(4, h));
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(bx + pad + 2.5, by + pad + 2.5, Math.max(4, w - 5), Math.max(4, h - 5));
        for (let k = 0; k < 12; k++) {
          const px = bx + pad + rng() * w, py = by + pad + rng() * h, pr = 1.0 + rng() * 3.2;
          actx.fillStyle = rng() < 0.48 ? 'rgba(30,56,24,0.38)' : 'rgba(170,182,178,0.22)';
          actx.beginPath(); actx.arc(px, py, pr, 0, Math.PI * 2); actx.fill();
        }
      }
    }
    return {
      albedo: uploadTex(gl, albC, true, false),
      normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 6.2), false, false),
    };
  }

  function createRedClayPBR(gl) {
    const S = 512, rng = mulberry32(6147);
    const albC = document.createElement('canvas'); albC.width = albC.height = S;
    const actx = albC.getContext('2d');
    const hgtC = document.createElement('canvas'); hgtC.width = hgtC.height = S;
    const hctx = hgtC.getContext('2d');
    actx.fillStyle = '#683622'; actx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#808080'; hctx.fillRect(0, 0, S, S);
    const clays = [[124,62,38], [94,46,28], [142,78,44], [76,38,24], [116,58,34]];
    for (let i = 0; i < 320; i++) {
      const x = rng() * S, y = rng() * S, rx = 14 + rng() * 44, ry = rx * (0.55 + rng() * 0.85);
      const cc = clays[(rng() * clays.length) | 0];
      const isHollow = rng() < 0.45;
      const g = actx.createRadialGradient(x, y, 2, x, y, rx);
      g.addColorStop(0, `rgba(${cc[0]},${cc[1]},${cc[2]},0.42)`);
      g.addColorStop(1, `rgba(${cc[0]},${cc[1]},${cc[2]},0)`);
      actx.fillStyle = g;
      actx.beginPath(); actx.ellipse(x, y, rx, ry, rng() * Math.PI, 0, Math.PI * 2); actx.fill();
      const hv = isHollow ? (28 + ((rng() * 38) | 0)) : (170 + ((rng() * 68) | 0));
      hctx.fillStyle = `rgba(${hv},${hv},${hv},0.40)`;
      hctx.beginPath(); hctx.ellipse(x, y, rx * 0.9, ry * 0.9, 0, 0, Math.PI * 2); hctx.fill();
    }
    // Crushed red-brick rubble & ironstone pebbles
    for (let i = 0; i < 950; i++) {
      const x = rng() * S, y = rng() * S, r = 1.6 + rng() * 4.8;
      actx.fillStyle = rng() < 0.55 ? 'rgba(154,68,42,0.58)' : 'rgba(54,32,24,0.52)';
      actx.beginPath(); actx.ellipse(x, y, r, r * 0.7, rng() * Math.PI, 0, Math.PI * 2); actx.fill();
      hctx.fillStyle = 'rgba(218,218,218,0.44)';
      hctx.beginPath(); hctx.arc(x, y, r, 0, Math.PI * 2); hctx.fill();
    }
    return {
      albedo: uploadTex(gl, albC, true, false),
      normal: uploadTex(gl, buildSobelNormalWithHeight(hgtC, 4.8), false, false),
    };
  }

  function createBambooAtlas2x2(gl) {
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
    const ctx = c.getContext('2d'), rng = mulberry32(4789);
    ctx.clearRect(0, 0, S, S);
    for (let q = 0; q < 4; q++) {
      const qx = (q % 2) * 256, qy = Math.floor(q / 2) * 256;
      const cx = qx + 128, cy = qy + 132;
      // Draw 32 slender drooping lanceolate bamboo leaf blades radiating from central twig
      for (let i = 0; i < 36; i++) {
        const ang = (i / 36) * Math.PI * 2 + (rng() - 0.5) * 0.28;
        const dist = 10 + rng() * 58;
        const lx = cx + Math.cos(ang) * dist * 0.85;
        const ly = cy + Math.sin(ang) * dist * 0.72;
        const len = 36 + rng() * 44;
        const wid = 5.5 + rng() * 4.5;
        const droop = ang + (Math.cos(ang) >= 0 ? 0.32 : -0.32);
        const lum = Math.round(135 + rng() * 115);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(droop);
        ctx.fillStyle = `rgb(${lum}, 255, 0)`;
        ctx.beginPath();
        ctx.moveTo(-len * 0.35, 0);
        ctx.quadraticCurveTo(0, -wid, len * 0.65, 0);
        ctx.quadraticCurveTo(0, wid, -len * 0.35, 0);
        ctx.fill();
        ctx.restore();
      }
    }
    return uploadTex(gl, c, false, true);
  }

  // Dedicated 2x2 Botanical Hydrangea Atlas (Q0-Q2: dense 4-petal floret umbels; Q3: serrated dark-green hydrangea leaves)
  function createHydrangeaAtlas2x2(gl) {
    const S = 512, rng = mulberry32(4782);
    const c = document.createElement('canvas'); c.width = c.height = S;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    for (let q = 0; q < 4; q++) {
      const qx = (q % 2) * 256, qy = Math.floor(q / 2) * 256;
      const cx = qx + 128, cy = qy + 128;
      if (q < 3) {
        // Draw 28 crisp overlapping 4-petal hydrangea florets arranged in a lush botanical dome
        for (let f = 0; f < 30; f++) {
          const rad = Math.sqrt(rng()) * 84;
          const ang = rng() * Math.PI * 2;
          const fx = cx + Math.cos(ang) * rad, fy = cy + Math.sin(ang) * rad;
          const pSize = 11 + rng() * 9;
          const baseRot = rng() * Math.PI;
          const lum = Math.round(145 + (1.0 - rad / 95) * 95 + (rng() - 0.5) * 32);
          const lumC = Math.max(105, Math.min(255, lum));
          ctx.save();
          ctx.translate(fx, fy);
          ctx.rotate(baseRot);
          // 4 distinct rounded diamond petals per floret (R = luminance, G = 255 alpha mask)
          for (let p = 0; p < 4; p++) {
            ctx.rotate(Math.PI * 0.5);
            const pLum = Math.max(95, Math.min(255, lumC + ((p % 2 === 0) ? 14 : -12)));
            ctx.fillStyle = `rgb(${pLum}, 255, 0)`;
            ctx.beginPath();
            ctx.ellipse(pSize * 0.62, 0, pSize * 0.58, pSize * 0.44, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          // Tiny bright stamen eye in the center of each floret
          ctx.fillStyle = 'rgb(252, 255, 0)';
          ctx.beginPath(); ctx.arc(0, 0, pSize * 0.16, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      } else {
        // Quadrant 3: Lush broad ovate serrated hydrangea leaves framing the bloom cluster
        for (let l = 0; l < 10; l++) {
          const ang = (l / 10) * Math.PI * 2 + (rng() - 0.5) * 0.3;
          const dist = 18 + rng() * 48;
          const lx = cx + Math.cos(ang) * dist, ly = cy + Math.sin(ang) * dist;
          const len = 42 + rng() * 26, wid = 20 + rng() * 14;
          const lum = Math.round(115 + rng() * 95);
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(ang);
          ctx.fillStyle = `rgb(${lum}, 255, 0)`;
          ctx.beginPath();
          ctx.moveTo(-len * 0.4, 0);
          ctx.quadraticCurveTo(0, -wid, len * 0.6, 0);
          ctx.quadraticCurveTo(0, wid, -len * 0.4, 0);
          ctx.fill();
          ctx.restore();
        }
      }
    }
    return uploadTex(gl, c, false, true);
  }

  PV.createTextures = function (gl) {
    const sprites = createSpraySprites(gl);
    return {
      road: createRoadAggregatePBR(gl),
      grass: createGrassPBR(gl),
      rock: createRockPBR(gl),
      stoneMasonry: createStoneMasonryPBR(gl),
      agedBrick: createAgedBrickPBR(gl),
      weatheredWood: createWeatheredWoodPBR(gl),
      birchBark: createBirchBarkPBR(gl),
      snowRock: createSnowRockPBR(gl),
      flagstone: createFlagstonePBR(gl),
      redClay: createRedClayPBR(gl),
      bambooAtlas: createBambooAtlas2x2(gl),
      hydrangeaAtlas: createHydrangeaAtlas2x2(gl),
      pineAtlas: createFoliageAtlas2x2(gl, 'pine'),
      broadAtlas: createFoliageAtlas2x2(gl, 'broadleaf'),
      farwoods: createFarwoodsAtlas(gl),
      car: createCarLiveryPBR(gl),
      waterSplash: sprites.waterSplash,
      waterMist: sprites.waterMist,
      waterRipple: sprites.waterRipple,
      mudClump: sprites.mudClump,
      chevron: sprites.chevron,
    };
  };
})(window);

