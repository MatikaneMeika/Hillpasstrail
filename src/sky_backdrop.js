// === sky_backdrop.js ===
// Lower, Thicker Overcast Rain Clouds with Underside Shadows + Layered Blue-Fading Distant Mountains
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});

  function buildSkyDome(gl) {
    const segU = 36, segV = 18;
    const pos = [], idx = [];
    for (let v = 0; v <= segV; v++) {
      const phi = (v / segV) * Math.PI;
      for (let u = 0; u <= segU; u++) {
        const theta = (u / segU) * Math.PI * 2;
        pos.push(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      }
    }
    for (let v = 0; v < segV; v++) {
      for (let u = 0; u < segU; u++) {
        const a = v * (segU + 1) + u, b = a + segU + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    return PV.createMesh(gl, { positions: pos, indices: idx });
  }

  function buildBackdropRing(gl) {
    const segU = 96;
    const R = 1150.0;
    const yBot = -100.0, yTop = 440.0;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= segU; i++) {
      const u = i / segU;
      const a = u * Math.PI * 2;
      const cx = Math.cos(a) * R, cz = Math.sin(a) * R;
      pos.push(cx, yBot, cz); uv.push(u, 0.0);
      pos.push(cx, yTop, cz); uv.push(u, 1.0);
    }
    for (let i = 0; i < segU; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
    return PV.createMesh(gl, { positions: pos, uvs: uv, indices: idx });
  }

  function buildValleyFloor(gl) {
    const segA = 96, segR = 22;
    const rMin = 24, rMax = 560;
    const pos = [], nrm = [], uv = [], idx = [];
    const h2 = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
    const n2 = (x, z) => {
      const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
      const ux = fx*fx*(3-2*fx), uz = fz*fz*(3-2*fz);
      const a = h2(ix,iz), b = h2(ix+1,iz), c = h2(ix,iz+1), d = h2(ix+1,iz+1);
      return a + (b-a)*ux + (c-a)*uz + (a-b-c+d)*ux*uz;
    };
    for (let ir = 0; ir <= segR; ir++) {
      const t = ir / segR;
      const r = rMin + Math.pow(t, 1.35) * (rMax - rMin);
      for (let ia = 0; ia <= segA; ia++) {
        const ang = (ia / segA) * Math.PI * 2;
        const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
        const hills = n2(x * 0.010, z * 0.010) * 20.0 + n2(x * 0.026 + 5.2, z * 0.026) * 8.0;
        // Round 7: Keep valley floor subtly beneath lake/horizon levels so raymarched 360 peaks own the skyline cleanly!
        const oppRise = Math.pow(Math.max(0, t - 0.58) / 0.42, 1.8) * 18.0 * (0.45 + 0.55 * n2(x * 0.006, z * 0.006));
        const y = -34.0 + hills * (0.36 + 0.48 * t) + oppRise;
        pos.push(x, y, z); nrm.push(0, 1, 0); uv.push(x * 0.02, z * 0.02);
      }
    }
    const stride = segA + 1;
    for (let ir = 0; ir < segR; ir++) {
      for (let ia = 0; ia < segA; ia++) {
        const a = ir * stride + ia, b = a + stride;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    return PV.createMesh(gl, { positions: pos, normals: nrm, uvs: uv, indices: idx });
  }

  PV.SkyBackdrop = class SkyBackdrop {
    constructor(gl) {
      this.gl = gl;
      this.skyMesh = buildSkyDome(gl);
      this.ringMesh = buildBackdropRing(gl);
      this.valleyMesh = buildValleyFloor(gl);
      this._themeTint = [1.0, 1.0, 1.0];
      this._themeSnow = 0.0;
      this._themeHaze = [1.0, 1.0, 1.0];

      this._bakeBackdrop360();
      this._initShaders();
    }

    _bakeBackdrop360() {
      const gl = this.gl;
      const W = 2048, H = 512;
      const makeTex = () => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
      };
      this.texLit = makeTex();
      this.texShad = makeTex();

      const quadVS = `#version 300 es
        precision highp float;
        out vec2 vUv;
        void main() {
          vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
          vUv = p;
          gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
        }
      `;

      const bakeFS = `#version 300 es
        precision highp float;
        in vec2 vUv;
        uniform int uPass;
        uniform vec3 uLightDir;
        out vec4 fragColor;

        float hash21(vec2 p) {
          p = fract(p * vec2(127.1, 311.7));
          p += dot(p, p + 34.5);
          return fract(p.x * p.y);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x),
                     mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
        }
        float ridgedFbm(vec2 p) {
          float s = 0.0, a = 0.55;
          mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
          for (int i = 0; i < 5; i++) {
            float n = 1.0 - abs(noise(p) * 2.0 - 1.0);
            s += n * n * a;
            p = m * p * 2.08;
            a *= 0.48;
          }
          return s;
        }
        float mtnHeight(vec2 p) {
          float dist = length(p);
          // 3-Layer Atmospheric Vista: forested near-foothills -> mid misty alpine ridges -> distant grand peaks
          float nearFoothill = smoothstep(145.0, 340.0, dist);
          float midRidgeEnv  = smoothstep(320.0, 720.0, dist);
          float farPeakEnv   = smoothstep(560.0, 1180.0, dist);
          float r1 = ridgedFbm(p * 0.0026 + vec2(2.1, -1.3));
          float r2 = ridgedFbm(p * 0.0074 - vec2(4.7, 3.2));
          float r3 = ridgedFbm(p * 0.0013 + vec2(-3.4, 5.1));
          // Multi-frequency conifer treeline serration so distant forested ridges read as lush misty forests!
          float crownTex = (noise(p * 0.042) * 7.5 + noise(p * 0.095) * 3.8) * nearFoothill * (1.0 - farPeakEnv * 0.65);
          return -18.0 + nearFoothill * (r1 * 115.0 + r2 * 42.0) + midRidgeEnv * (r1 * 68.0) + farPeakEnv * (r3 * 205.0) + crownTex;
        }
        vec3 mtnNormal(vec2 p) {
          float e = 6.0;
          float hL = mtnHeight(p - vec2(e, 0.0));
          float hR = mtnHeight(p + vec2(e, 0.0));
          float hD = mtnHeight(p - vec2(0.0, e));
          float hU = mtnHeight(p + vec2(0.0, e));
          return normalize(vec3(hL - hR, 2.0 * e, hD - hU));
        }

        void main() {
          float azim = vUv.x * 6.2831853;
          float elev = mix(-0.08, 0.36, vUv.y);
          vec3 rd = normalize(vec3(cos(azim) * cos(elev), sin(elev), sin(azim) * cos(elev)));
          vec3 ro = vec3(0.0, 12.0, 0.0);

          float t = 210.0;
          bool hit = false;
          vec3 hitPos = vec3(0.0);
          for (int i = 0; i < 76; i++) {
            vec3 p = ro + rd * t;
            float h = mtnHeight(p.xz);
            if (p.y < h) {
              float tLo = t - 22.0, tHi = t;
              for (int b = 0; b < 5; b++) {
                float tm = 0.5 * (tLo + tHi);
                vec3 pm = ro + rd * tm;
                if (pm.y < mtnHeight(pm.xz)) tHi = tm; else tLo = tm;
              }
              hitPos = ro + rd * tHi;
              t = tHi;
              hit = true;
              break;
            }
            t += 21.0 + t * 0.015;
            if (t > 1850.0) break;
          }

          if (!hit) {
            fragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
          }

          vec3 N = mtnNormal(hitPos.xz);
          float ndl = clamp(dot(N, uLightDir), 0.0, 1.0);
          float crag = noise(hitPos.xz * 0.024);
          float treeline = smoothstep(42.0, 128.0, hitPos.y + (crag - 0.5) * 32.0);
          float snow = smoothstep(185.0, 260.0, hitPos.y) * smoothstep(0.45, 0.85, N.y);

          vec3 litForest = vec3(0.18, 0.34, 0.20) * (0.85 + 0.30 * crag);
          vec3 litRock   = vec3(0.42, 0.49, 0.56) * (0.80 + 0.38 * crag);
          vec3 litCol    = mix(litForest, litRock, treeline);
          litCol = mix(litCol, vec3(0.76, 0.82, 0.88), snow * 0.52);

          vec3 shadForest = vec3(0.08, 0.17, 0.15);
          vec3 shadRock   = vec3(0.20, 0.27, 0.36);
          vec3 shadCol    = mix(shadForest, shadRock, treeline);

          float layerDist = smoothstep(220.0, 620.0, t) * 0.38 + smoothstep(620.0, 1650.0, t) * 0.46;
          float valleyMist = exp(-max(hitPos.y + 16.0, 0.0) * 0.018) * 0.34;
          float aerial = clamp(layerDist + valleyMist, 0.14, 0.97);

          if (uPass == 0) {
            fragColor = vec4(litCol, smoothstep(0.04, 0.78, ndl));
          } else {
            fragColor = vec4(shadCol, aerial);
          }
        }
      `;

      const prog = PV.createProgram(gl, quadVS, bakeFS);
      const fbo = gl.createFramebuffer();
      const vao = gl.createVertexArray();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, W, H);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      gl.useProgram(prog.prog);
      gl.uniform3fv(prog.u.uLightDir, PV.LIGHT.dir);
      gl.bindVertexArray(vao);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texLit, 0);
      gl.uniform1i(prog.u.uPass, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texShad, 0);
      gl.uniform1i(prog.u.uPass, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(fbo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog.prog);
    }

    _initShaders() {
      const gl = this.gl;

      // Item 3: Lower, thicker rain cloud deck with dark undersides & internal layering (lower brightness than sunny sky)
      this.skyProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        uniform mat4 uViewProj;
        uniform vec3 uCamPos;
        out vec3 vDir;
        void main() {
          vDir = aPos;
          vec4 p = uViewProj * vec4(aPos * 1450.0 + uCamPos, 1.0);
          gl_Position = p.xyww;
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vDir;
        uniform vec3 uLightDir;
        uniform vec3 uSkyZenith;
        uniform vec3 uSkyMid;
        uniform vec3 uSkyHorizon;
        uniform vec3 uCloudBright;
        uniform vec3 uCloudDark;
        uniform float uTime;
        uniform float uStorm;
        uniform float uClear;
        out vec4 fragColor;

        float hash21(vec2 p) {
          p = fract(p * vec2(234.34, 435.345));
          p += dot(p, p + 34.23);
          return fract(p.x * p.y);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x),
                     mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = m * p * 2.03;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 d = normalize(vDir);
          float y = max(d.y, 0.001);

          // Overcast Rainy Alpine Sky with Rayleigh/Mie Atmospheric Refraction (matches reference video!)
          vec3 zenith  = uSkyZenith;
          vec3 midSky  = uSkyMid;
          vec3 horizon = uSkyHorizon;
          vec3 col = mix(horizon, midSky, smoothstep(0.0, 0.18, y));
          col = mix(col, zenith, smoothstep(0.14, 0.58, y));

          float sunDot = max(dot(d, uLightDir), 0.0);
          // Physical Rayleigh + Mie forward atmospheric refraction halo through rain cloud veil
          vec3 mieTint = mix(uCloudBright, uSkyHorizon * 1.15, 0.35);
          col += mieTint * (0.18 * pow(sunDot, 2.6) + 0.26 * pow(sunDot, 12.0));

          // Dense Layered Overcast Rain Clouds with Dramatic Silver-Lined Cloud-Breaks
          vec2 uv = d.xz / (y + 0.18) * 1.18 + vec2(uTime * 0.005, -uTime * 0.003);
          float c1 = fbm(uv * 1.15);
          float c2 = fbm(uv * 2.65 + vec2(c1 * 1.25, -c1 * 0.90));
          float c3 = fbm(uv * 5.20 - vec2(c2 * 0.68, c1 * 0.54));
          float cloudShape = c1 * 0.52 + c2 * 0.34 + c3 * 0.18;
          float dens = smoothstep(mix(0.36, 0.50, uClear), mix(0.64, 0.78, uClear), cloudShape) * mix(1.0, 0.72, uClear);

          // Lower ridge-hugging cumulus bank (sculpted, never a flat grey sheet)
          float az = atan(d.z, d.x);
          float ridgeCloud = fbm(vec2(az * 3.0 + uTime * 0.004, y * 7.8)) * 0.65 + fbm(vec2(az * 6.8, y * 14.5)) * 0.35;
          float lowBank = smoothstep(mix(0.40, 0.54, uClear), mix(0.68, 0.80, uClear), ridgeCloud) * smoothstep(0.015, 0.08, y) * smoothstep(0.38, 0.14, y) * mix(1.0, 0.55, uClear);
          float totalCloud = clamp(max(dens * smoothstep(0.015, 0.06, y), lowBank * 0.92), 0.0, 0.96);

          float litEdge = fbm((uv + uLightDir.xz * 0.28) * 1.15);
          float silverRim = smoothstep(0.18, 0.68, c1 - litEdge) * smoothstep(0.92, 0.36, totalCloud) * (0.45 + 0.55 * pow(sunDot, 2.0));
          float cLight = clamp((c1 - litEdge) * 5.4 + 0.36 + pow(sunDot, 2.2) * 0.28 + (c3 - 0.5) * 0.38 + lowBank * 0.12, 0.0, 1.0);
          vec3 cBelly  = uCloudDark;
          vec3 cMid    = mix(uCloudDark, uCloudBright, 0.52);
          vec3 cBright = uCloudBright;
          // Clean 3-tier anime cel cloud shading + luminous Mie silver-lining rim
          vec3 cloudCol = mix(cBelly, cMid, smoothstep(0.16, 0.42, cLight));
          cloudCol = mix(cloudCol, cBright, smoothstep(0.48, 0.76, cLight));
          cloudCol += uCloudBright * silverRim * 0.32;
          // Procedural Storm Sheet-Lightning Cloud Illumination (CK42BB/procedural-weather-threejs inspired!)
          if (uStorm > 0.1) {
            float boltCell = floor(uTime * 0.42);
            float boltAz = (hash21(vec2(boltCell, 3.7)) - 0.5) * 2.4;
            float boltDist = length(vec2(az - boltAz, (y - 0.24) * 3.2));
            float flashPulse = pow(max(0.0, sin(uTime * 1.85) * sin(uTime * 4.3 + 0.9)), 8.0);
            float sheetGlow = exp(-boltDist * boltDist * 4.2) * (0.28 + 1.45 * flashPulse) * uStorm;
            cloudCol += vec3(0.68, 0.84, 1.35) * sheetGlow * totalCloud;
          }

          col = mix(col, cloudCol, totalCloud);

          // Subtle Slanting Tyndall Sky Shafts through cloud gaps
          float rayTilt = az * 5.2 - y * 11.5;
          float rayBands = pow(0.5 + 0.5 * sin(rayTilt + uTime * 0.03), 3.2) * 0.65
                         + pow(0.5 + 0.5 * sin(rayTilt * 2.1 - 0.8), 4.0) * 0.35;
          float rayElevMask = smoothstep(0.01, 0.09, y) * smoothstep(0.42, 0.14, y);
          float raySunMask = 0.35 + 0.65 * pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uLightDir.x, 0.0, uLightDir.z))), 0.0), 2.0);
          float godRays = rayBands * rayElevMask * raySunMask * (1.0 - totalCloud * 0.52);
          col += uCloudBright * godRays * 0.28;

          col = mix(col, uSkyHorizon * 0.85, smoothstep(0.04, -0.02, d.y) * 0.55);

          fragColor = vec4(col, 0.0);
        }
      `);

      this.ringProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=2) in vec2 aUv;
        uniform mat4 uViewProj;
        uniform vec3 uAnchor;
        out vec2 vUv;
        void main() {
          vUv = aUv;
          gl_Position = uViewProj * vec4(aPos + uAnchor, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec2 vUv;
        uniform sampler2D uTexLit;
        uniform sampler2D uTexShad;
        uniform vec3 uLightColor;
        uniform vec3 uFogColor;
        uniform vec3 uThemeTint;
        uniform vec3 uThemeHaze;
        uniform float uThemeSnow;
        out vec4 fragColor;
        void main() {
          vec4 litS = texture(uTexLit, vUv);
          vec4 shdS = texture(uTexShad, vUv);
          float edgeA = smoothstep(0.02, 0.24, shdS.a);
          if (edgeA < 0.005) discard;
          // Weather-Synced & Biome-Responsive Distant Mountain Silhouettes + Snowline + Valley Mist Ribbons
          vec3 litBiome = litS.rgb * uThemeTint;
          vec3 shdBiome = shdS.rgb * mix(vec3(1.0), uThemeTint, 0.65);
          float dynSnow = smoothstep(0.32 - uThemeSnow * 0.22, 0.62 - uThemeSnow * 0.22, vUv.y) * uThemeSnow;
          litBiome = mix(litBiome, vec3(0.84, 0.90, 0.96), dynSnow * 0.72);
          shdBiome = mix(shdBiome, vec3(0.42, 0.50, 0.62), dynSnow * 0.55);
          vec3 relit = mix(shdBiome * vec3(0.72, 0.80, 0.88), litBiome * uLightColor * 0.82, litS.a);
          float mistRibbon = smoothstep(0.42, 0.04, vUv.y) * 0.44;
          vec3 nearRidgeMist = uFogColor * uThemeHaze * vec3(1.04, 1.06, 1.09);
          vec3 farPeakHaze = uFogColor * uThemeHaze * vec3(0.92, 0.97, 1.04) + uLightColor * 0.06;
          vec3 fogCol = mix(nearRidgeMist, farPeakHaze, smoothstep(0.12, 0.82, vUv.y));
          float fadeAmt = clamp(pow(shdS.a, 0.96) * 0.58 + mistRibbon, 0.0, 0.80);
          vec3 col = mix(relit, fogCol, fadeAmt);
          fragColor = vec4(col, edgeA);
        }
      `);

      this.valleyProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=1) in vec3 aNrm;
        layout(location=2) in vec2 aUv;
        uniform mat4 uViewProj;
        uniform vec3 uAnchor;
        out vec3 vWorldPos;
        out vec2 vUv;
        void main() {
          vec3 wp = aPos + uAnchor;
          vWorldPos = wp;
          vUv = wp.xz * 0.018;
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec3 vWorldPos;
        in vec2 vUv;
        ${PV.PBR_GLSL}
        out vec4 fragColor;
        void main() {
          vec3 V = normalize(uCamPos - vWorldPos);
          float m1 = pvFbm2(vUv * 0.72);
          float m2 = pvNoise2(vUv * 2.6 + vec2(3.1, -2.4));
          float m3 = pvNoise2(vUv * 7.8);
          float canopyDapple = pvNoise2(vUv * 18.5) * 0.65 + pvNoise2(vUv * 38.0) * 0.35;
          // Deep moody rain-soaked alpine conifer canopy & mossy rocky slopes (ZERO bare pale-green plastic hills!)
          vec3 deepPine  = vec3(0.022, 0.058, 0.036) * (0.72 + 0.56 * canopyDapple);
          vec3 midSpruce = vec3(0.045, 0.098, 0.048) * (0.76 + 0.48 * m3);
          vec3 mossGlade = vec3(0.068, 0.125, 0.056) * (0.80 + 0.38 * m2);
          vec3 oppRock   = vec3(0.145, 0.170, 0.185) * (0.78 + 0.42 * m2);
          vec3 albedo = mix(deepPine, midSpruce, smoothstep(0.28, 0.72, m1 * 0.65 + canopyDapple * 0.35));
          albedo = mix(albedo, mossGlade, smoothstep(0.58, 0.86, m1 * 0.7 + m2 * 0.3) * 0.55);
          // Stratified wet slate cliff outcrops on higher opposite ridges
          float rockBand = smoothstep(-4.0, 12.0, vWorldPos.y) * smoothstep(0.32, 0.68, m2);
          albedo = mix(albedo, oppRock, rockBand * 0.78);

          float waterMask = smoothstep(-20.8, -24.2, vWorldPos.y);
          vec3 N = normalize(vec3((m2 - 0.5) * 0.42 + (canopyDapple - 0.5) * 0.24, 1.0, (m1 - 0.5) * 0.42));
          if (waterMask > 0.01) {
            vec3 wN = normalize(vec3(sin(vWorldPos.x * 0.8 + uTime * 2.0) * 0.035, 1.0, cos(vWorldPos.z * 0.7 - uTime * 1.7) * 0.035));
            N = normalize(mix(N, wN, waterMask));
            albedo = mix(albedo, vec3(0.09, 0.15, 0.20), waterMask);
          }
          float rough = mix(0.86, 0.06, waterMask);
          float cc = mix(0.08, 0.72, waterMask);
          vec3 col = evalPBR(vWorldPos, N, V, albedo, rough, 0.0, 0.88, cc, 1.0);
          col = applyFog(col, vWorldPos);
          fragColor = vec4(col, 1.0);
        }
      `);
    }

    draw(renderer, time, themeId) {
      const gl = this.gl;
      const anchor = [renderer.camPos[0], 0, renderer.camPos[2]];
      // Biome-responsive subtle distant vista palette (smoothly lerps across all 7 themes!)
      const pal = [
        { t: [0.95, 1.02, 0.96], h: [0.98, 1.01, 1.03], s: 0.08 }, // 0: Switchback Pine
        { t: [0.92, 0.98, 1.12], h: [0.96, 1.02, 1.10], s: 0.92 }, // 1: Alpine Snow Peak
        { t: [0.88, 1.00, 1.10], h: [0.92, 1.02, 1.12], s: 0.22 }, // 2: Lakeside Loop
        { t: [0.86, 0.92, 1.04], h: [0.96, 0.98, 1.06], s: 0.35 }, // 3: Cliffside Abyss
        { t: [1.14, 1.02, 0.80], h: [1.08, 1.01, 0.92], s: 0.05 }, // 4: Golden Birch Valley
        { t: [1.18, 0.90, 0.76], h: [1.08, 0.96, 0.90], s: 0.00 }, // 5: Red-Brick Quarry
        { t: [0.88, 1.08, 0.94], h: [0.96, 1.05, 1.00], s: 0.04 }, // 6: Misty Cedar Shrine
      ][themeId || 0] || { t: [1,1,1], h: [1,1,1], s: 0.08 };
      const kLerp = 0.04;
      for (let i = 0; i < 3; i++) {
        this._themeTint[i] += (pal.t[i] - this._themeTint[i]) * kLerp;
        this._themeHaze[i] += (pal.h[i] - this._themeHaze[i]) * kLerp;
      }
      this._themeSnow += (pal.s - this._themeSnow) * kLerp;

      gl.depthMask(false);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(this.skyProg.prog);
      gl.uniformMatrix4fv(this.skyProg.u.uViewProj, false, renderer.vpMat);
      gl.uniform3fv(this.skyProg.u.uCamPos, renderer.camPos);
      gl.uniform3fv(this.skyProg.u.uLightDir, PV.LIGHT.dir);
      if (this.skyProg.u.uSkyZenith) gl.uniform3fv(this.skyProg.u.uSkyZenith, PV.LIGHT.skyZenith);
      if (this.skyProg.u.uSkyMid) gl.uniform3fv(this.skyProg.u.uSkyMid, PV.LIGHT.skyMid || [0.34, 0.41, 0.48]);
      if (this.skyProg.u.uSkyHorizon) gl.uniform3fv(this.skyProg.u.uSkyHorizon, PV.LIGHT.skyHorizon);
      if (this.skyProg.u.uCloudBright) gl.uniform3fv(this.skyProg.u.uCloudBright, PV.LIGHT.cloudBright);
      if (this.skyProg.u.uCloudDark) gl.uniform3fv(this.skyProg.u.uCloudDark, PV.LIGHT.cloudDark);
      if (this.skyProg.u.uStorm) gl.uniform1f(this.skyProg.u.uStorm, PV.LIGHT.weatherKey === 'downpour' ? 1.0 : 0.0);
      if (this.skyProg.u.uClear) gl.uniform1f(this.skyProg.u.uClear, PV.LIGHT.weatherKey === 'clear' ? 1.0 : 0.0);
      gl.uniform1f(this.skyProg.u.uTime, time);
      gl.bindVertexArray(this.skyMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.skyMesh.count, this.skyMesh.indexType, 0);
      gl.depthFunc(gl.LESS);

      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.useProgram(this.ringProg.prog);
      gl.uniformMatrix4fv(this.ringProg.u.uViewProj, false, renderer.vpMat);
      gl.uniform3fv(this.ringProg.u.uAnchor, anchor);
      gl.uniform3fv(this.ringProg.u.uLightColor, PV.LIGHT.color);
      gl.uniform3fv(this.ringProg.u.uFogColor, PV.LIGHT.fogColor);
      if (this.ringProg.u.uThemeTint) gl.uniform3fv(this.ringProg.u.uThemeTint, this._themeTint);
      if (this.ringProg.u.uThemeHaze) gl.uniform3fv(this.ringProg.u.uThemeHaze, this._themeHaze);
      if (this.ringProg.u.uThemeSnow) gl.uniform1f(this.ringProg.u.uThemeSnow, this._themeSnow);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texLit); gl.uniform1i(this.ringProg.u.uTexLit, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texShad); gl.uniform1i(this.ringProg.u.uTexShad, 1);
      gl.bindVertexArray(this.ringMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.ringMesh.count, this.ringMesh.indexType, 0);
      gl.disable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      gl.useProgram(this.valleyProg.prog);
      gl.uniformMatrix4fv(this.valleyProg.u.uViewProj, false, renderer.vpMat);
      // Lock valley floor strictly below active road & lakes + quantized XZ grid (ZERO hard-morphing or lake poke-through!)
      const valleyAnchor = [
        Math.floor(renderer.camPos[0] / 64.0) * 64.0,
        Math.min(-34.0, renderer.camPos[1] - 38.0),
        Math.floor(renderer.camPos[2] / 64.0) * 64.0,
      ];
      gl.uniform3fv(this.valleyProg.u.uAnchor, valleyAnchor);
      renderer.bindSharedPBRUniforms(this.valleyProg.u, time);
      gl.bindVertexArray(this.valleyMesh.vao);
      gl.drawElements(gl.TRIANGLES, this.valleyMesh.count, this.valleyMesh.indexType, 0);
      gl.bindVertexArray(null);
    }
  };
})(window);

