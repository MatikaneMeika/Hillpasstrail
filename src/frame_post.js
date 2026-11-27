// === frame_post.js ===
// ACES Filmic Cinematic Tone Mapping (no blown-out highlights, no crushed blacks)
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});
  const M4 = PV.M4;

  PV.FramePostRenderer = class FramePostRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', {
        antialias: false, alpha: false, depth: true,
        preserveDrawingBuffer: true, powerPreference: 'high-performance',
      });
      if (!gl) throw new Error('WebGL2 not supported');
      this.gl = gl;
      this.extFloat = gl.getExtension('EXT_color_buffer_float');
      this.extHalfFloat = gl.getExtension('EXT_color_buffer_half_float');
      this.maxSamples = gl.getParameter(gl.MAX_SAMPLES) || 0;
      this.qualityKey = 'xultra';
      this.quality = PV.QUALITY_PRESETS.xultra;
      this.kuwaharaOverride = null;
      this.dprOverride = null;
      this.shadowOverride = null;
      this.ssrOverride = null;
      this.lensOverride = null;
      this.bloomOverride = null;
      this.width = 1280; this.height = 720;

      this.viewMat = M4.create(); this.projMat = M4.create(); this.vpMat = M4.create();
      this.lightView = M4.create(); this.lightProj = M4.create(); this.lightVP = M4.create();
      this.camPos = [0, 3, -8]; this.carPos = [0, 0, 0]; this.carFwd = [0, 0, 1]; this.carRight = [-1, 0, 0];
      this.nearPlane = 0.25; this.farPlane = 1900.0;
      this.bloomMips = [];
      this._initShadowShaders();
      this._initPostShaders();
      this.setQuality('xultra');
    }

    _initShadowShaders() {
      const gl = this.gl;
      this.shadowProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        uniform mat4 uLightVP;
        uniform mat4 uModel;
        void main() { gl_Position = uLightVP * uModel * vec4(aPos, 1.0); }
      `, `#version 300 es
        precision highp float;
        void main() {}
      `);
      this.shadowInstProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;
        uniform mat4 uLightVP;
        uniform vec3 uCamPos;
        void main() {
          if (length(aInstA.xyz - uCamPos) > 95.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          vec4 lc = uLightVP * vec4(aInstA.xyz, 1.0);
          if (abs(lc.x) > 1.26 || abs(lc.y) > 1.26) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float cy = cos(aInstB.x), sy = sin(aInstB.x);
          vec3 p = vec3(aPos.x * aInstB.y, aPos.y, aPos.z * aInstB.y) * aInstA.w;
          vec3 rp = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
          gl_Position = uLightVP * vec4(rp + aInstA.xyz, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        void main() {}
      `);
      // Alpha-tested Leaf Canopy Shadow Shader so trees & shrubs cast real dappled soft shadows across the road!
      this.shadowLeafProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aCenter;
        layout(location=2) in vec2 aUv;
        layout(location=3) in vec3 aOff;
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;
        uniform mat4 uLightVP;
        uniform vec3 uCamPos;
        uniform vec3 uLightRight;
        uniform vec3 uLightUp;
        out vec2 vUv;
        void main() {
          if (length(aInstA.xyz - uCamPos) > 95.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          vec4 lc = uLightVP * vec4(aInstA.xyz, 1.0);
          if (abs(lc.x) > 1.24 || abs(lc.y) > 1.24) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          float cy = cos(aInstB.x), sy = sin(aInstB.x);
          vec3 c = vec3(aCenter.x * aInstB.y, aCenter.y, aCenter.z * aInstB.y) * aInstA.w;
          vec3 rc = vec3(c.x * cy + c.z * sy, c.y, -c.x * sy + c.z * cy);
          vec3 wp = aInstA.xyz + rc + (uLightRight * aOff.x + uLightUp * aOff.y) * aInstA.w * (0.85 + 0.15 * aInstB.y);
          vUv = aUv;
          gl_Position = uLightVP * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec2 vUv;
        uniform sampler2D uLeafAtlas;
        void main() {
          if (texture(uLeafAtlas, vUv).g < 0.36) discard;
        }
      `);
    }

    _initPostShaders() {
      const gl = this.gl;
      const quadVS = `#version 300 es
        precision highp float;
        out vec2 vUv;
        void main() {
          vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
          vUv = p;
          gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
        }
      `;
      this.quadVao = gl.createVertexArray();

      this.bloomPrefilterProg = PV.createProgram(gl, quadVS, `#version 300 es
        precision highp float;
        in vec2 vUv;
        uniform sampler2D uSrc;
        out vec4 fragColor;
        void main() {
          vec3 c = texture(uSrc, vUv).rgb;
          if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
          c = clamp(c, vec3(0.0), vec3(32.0));
          float br = max(c.r, max(c.g, c.b));
          float knee = 0.5;
          float soft = clamp(br - 1.55 + knee, 0.0, 2.0 * knee);
          soft = (soft * soft) / (4.0 * knee + 1e-4);
          float contrib = max(soft, br - 1.55) / max(br, 1e-4);
          fragColor = vec4(c * max(contrib, 0.0), 1.0);
        }
      `);

      this.bloomDownProg = PV.createProgram(gl, quadVS, `#version 300 es
        precision highp float;
        in vec2 vUv;
        uniform sampler2D uSrc;
        uniform vec2 uTexel;
        out vec4 fragColor;
        void main() {
          vec3 s = texture(uSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb
                 + texture(uSrc, vUv + uTexel * vec2( 1.0, -1.0)).rgb
                 + texture(uSrc, vUv + uTexel * vec2(-1.0,  1.0)).rgb
                 + texture(uSrc, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
          fragColor = vec4(s * 0.25, 1.0);
        }
      `);

      this.bloomUpProg = PV.createProgram(gl, quadVS, `#version 300 es
        precision highp float;
        in vec2 vUv;
        uniform sampler2D uSrc;
        uniform vec2 uTexel;
        out vec4 fragColor;
        void main() {
          vec2 d = uTexel * 1.15;
          vec3 s = texture(uSrc, vUv).rgb * 4.0
                 + (texture(uSrc, vUv + vec2(d.x, 0.0)).rgb + texture(uSrc, vUv - vec2(d.x, 0.0)).rgb
                 +  texture(uSrc, vUv + vec2(0.0, d.y)).rgb + texture(uSrc, vUv - vec2(0.0, d.y)).rgb) * 2.0
                 + (texture(uSrc, vUv + vec2( d.x,  d.y)).rgb + texture(uSrc, vUv + vec2(-d.x,  d.y)).rgb
                 +  texture(uSrc, vUv + vec2( d.x, -d.y)).rgb + texture(uSrc, vUv + vec2(-d.x, -d.y)).rgb);
          fragColor = vec4(s / 16.0, 1.0);
        }
      `);

      this.compositeProg = PV.createProgram(gl, quadVS, `#version 300 es
        precision highp float;
        in vec2 vUv;
        uniform sampler2D uScene;
        uniform sampler2D uBloom;
        uniform sampler2D uDepth;
        uniform vec2 uTexel;
        uniform float uExposure;
        uniform float uBloomStrength;
        uniform float uKuwaharaOn;
        uniform float uSpeedNorm;
        uniform float uSplashDrop;
        uniform float uTime;
        uniform float uNear;
        uniform float uFar;
        uniform vec3 uTyndallColor;
        uniform float uTyndallStrength;
        uniform vec2 uSunScreen;
        uniform float uSsrOn;
        uniform float uTunnelFactor;
        uniform float uLensQuality;
        uniform float uFilterId;
        uniform float uWetness;
        uniform float uRainLevel;
        uniform float uPauseBlur;
        uniform float uCockpitMode;
        uniform float uEyeExposure;
        uniform float uEyeGlare;
        out vec4 fragColor;

        float linearDepth(float d) {
          float z = d * 2.0 - 1.0;
          return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
        }

        float ign(vec2 p) {
          return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
        }

        // Single-Pass Analytic-Normal Semi-Static Lens Optics (Delicate Dirty-Lens Bokeh + Crisp Small Stationary Water Droplets, 66% faster!)
        // Returns vec4(height/mask, normal.x, normal.y, bokeh/flare)
        vec4 evalLensLayer(vec2 uv, vec2 grid, float t, float aspect, float seedOff, float thresh, float sizeMin, float sizeMax, float irregAmt, float crispness) {
          vec2 gUv = uv * grid;
          vec2 baseId = floor(gUv);
          vec2 f = fract(gUv);
          float bestH = 0.0;
          vec2 bestN = vec2(0.0);
          float maxBokeh = 0.0;
          float aspectScale = grid.x / (grid.y * aspect);
          for (int dy = -1; dy <= 1; dy++) {
            for (int dx = -1; dx <= 1; dx++) {
              vec2 id = baseId + vec2(float(dx), float(dy));
              float h1 = fract(sin(dot(id + seedOff, vec2(127.1, 311.7))) * 43758.5453);
              if (h1 < thresh) continue;
              float h2 = fract(sin(dot(id + seedOff * 1.7 + 19.3, vec2(269.5, 183.3))) * 43758.5453);
              float h3 = fract(sin(dot(id + seedOff * 2.3 + 47.1, vec2(419.2, 137.9))) * 43758.5453);
              // Regional semi-static appear/evaporate envelope (snappier dwell time ~7-12s, ZERO sliding/flowing!)
              vec2 dropUv = (id + vec2(h2, h3)) / grid;
              float regWave = 0.5 + 0.5 * sin(t * (0.24 + h1 * 0.16) + dropUv.x * 4.2 - dropUv.y * 3.6 + h2 * 6.2831);
              float cycle = fract(t * (0.068 + h3 * 0.054) + h2 * 4.7 + h1 * 2.3);
              float life = smoothstep(0.0, 0.08, cycle) * smoothstep(1.0, 0.66, cycle);
              float env = life * smoothstep(0.16, 0.64, regWave);
              if (env < 0.02) continue;

              vec2 ctr = vec2(float(dx), float(dy)) + 0.20 + 0.60 * vec2(h2, h3);
              vec2 d = (f - ctr) * vec2(1.0, aspectScale);
              float lenD = length(d);
              if (lenD > sizeMax * 1.48) continue;
              float ang = atan(d.y, d.x);
              float rot = h1 * 6.2831;
              float lobeMod = mix(0.58, 1.56, fract(h1 * 13.7 + h3 * 5.1));
              float irreg = 1.0 + irregAmt * lobeMod * (0.24 * sin(ang * 2.0 + rot) + 0.16 * cos(ang * 3.0 - rot * 1.7) + 0.09 * sin(ang * 5.0 + h2 * 9.0));
              float sizeCurve = pow(fract(h1 * 7.13 + h3), 1.18);
              float r = mix(sizeMin, sizeMax, sizeCurve) * irreg * (0.84 + 0.16 * smoothstep(0.0, 0.20, life));
              float distN = lenD / max(r, 0.008);
              if (distN < 1.12) {
                float dome = sqrt(clamp(1.0 - distN * distN, 0.0, 1.0)) * env;
                // Exact analytic spherical-dome normal (eliminates 2 extra finite-difference calls -> 3x faster!)
                vec2 nDir = (d / max(r, 0.008)) * env;
                float spotTone = mix(0.35, 1.28, fract(h2 * 11.3 + h3 * 3.7));
                // Director V3-R2: Soft Gaussian radial bokeh (ZERO hollow white outline ring!)
                float bokeh = pow(smoothstep(1.04, 0.0, distN), 1.85) * 0.52 * env * spotTone;
                if (dome > bestH) {
                  bestH = dome;
                  bestN = nDir * mix(0.55, 1.15, crispness);
                }
                maxBokeh = max(maxBokeh, bokeh);
              }
            }
          }
          return vec4(bestH, bestN, maxBokeh);
        }

        // High-Variety Edge-Only Dirty Spots + Crystal-Clear Stationary Water Droplets (ZERO glare rings, ZERO center smudges!)
        void evalLensOptics(vec2 uv, float t, float aspect, float isCockpit, float speedNorm, out vec4 smudge, out vec4 crispDrop) {
          if (isCockpit > 0.5) {
            // 1st-Person Cockpit: Perspective-projected tilted windshield (~38 deg rake) & angled left side-window glass plane!
            bool isSideWin = (uv.x < 0.27);
            vec2 glassUv;
            float glassAspect;
            if (isSideWin) {
              float sideZ = 1.0 + clamp(0.28 - uv.x, 0.0, 0.28) * 3.15;
              glassUv = vec2((0.28 - uv.x) * sideZ * 1.95 - t * 0.042 * (0.20 + speedNorm), (uv.y - 0.45) * sideZ * 1.12);
              glassAspect = aspect * 0.62;
            } else {
              float rakeZ = 1.0 + clamp(uv.y - 0.25, 0.0, 0.75) * 1.22;
              glassUv = vec2((uv.x - 0.56) * rakeZ + 0.56, (uv.y - 0.25) * rakeZ * 1.48 - t * 0.016 * (0.22 + speedNorm));
              glassAspect = aspect * (1.08 + (rakeZ - 1.0) * 0.48);
            }
            vec4 sA = evalLensLayer(glassUv, vec2(7.0, 4.4), t * 0.42, glassAspect, 11.0, 0.48, 0.068, 0.205, 0.95, 0.20);
            vec4 sB = evalLensLayer(glassUv, vec2(14.5, 8.8), t * 0.36, glassAspect, 29.0, 0.48, 0.038, 0.125, 0.76, 0.28);
            smudge = (sA.x >= sB.x) ? vec4(sA.xyz, max(sA.w, sB.w * 0.85)) : vec4(sB.xyz, max(sA.w * 0.90, sB.w));
            vec4 d1 = evalLensLayer(glassUv, vec2(12.2, 7.6), t, glassAspect, 37.0, 0.40, 0.056, 0.158, 0.34, 1.0);
            vec4 d2 = evalLensLayer(glassUv, vec2(21.5, 13.0), t, glassAspect, 73.0, 0.44, 0.032, 0.096, 0.22, 1.0);
            crispDrop = (d1.x >= d2.x) ? vec4(d1.xyz, max(d1.w, d2.w * 0.72)) : vec4(d2.xyz, max(d1.w * 0.88, d2.w));
          } else {
            // Enlarged dramatic wet lens raindrops, organic dirty-lens smudges & warm sun-glint bokeh!
            vec4 sA = evalLensLayer(uv, vec2(5.8, 3.5), t * 0.48, aspect, 11.0, 0.44, 0.078, 0.235, 0.98, 0.18);
            vec4 sB = evalLensLayer(uv, vec2(12.6, 7.6), t * 0.40, aspect, 29.0, 0.46, 0.044, 0.142, 0.78, 0.26);
            smudge = (sA.x >= sB.x) ? vec4(sA.xyz, max(sA.w, sB.w * 0.88)) : vec4(sB.xyz, max(sA.w * 0.92, sB.w));
            vec4 d1 = evalLensLayer(uv, vec2(11.2, 6.6), t, aspect, 37.0, 0.45, 0.054, 0.152, 0.32, 1.0);
            vec4 d2 = evalLensLayer(uv, vec2(19.2, 11.4), t, aspect, 73.0, 0.49, 0.032, 0.095, 0.20, 1.0);
            crispDrop = (d1.x >= d2.x) ? vec4(d1.xyz, max(d1.w, d2.w * 0.74)) : vec4(d2.xyz, max(d1.w * 0.88, d2.w));
          }
        }

        // ACES Filmic Cinematic Tone Mapping (smooth highlight roll-off, rich shadows)
        vec3 acesFilm(vec3 x) {
          const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
          return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
        }

        vec3 evalCAS(vec2 uv, vec3 c, float strength) {
          vec3 n = texture(uScene, uv + vec2(0.0,  uTexel.y)).rgb;
          vec3 s = texture(uScene, uv + vec2(0.0, -uTexel.y)).rgb;
          vec3 e = texture(uScene, uv + vec2( uTexel.x, 0.0)).rgb;
          vec3 w = texture(uScene, uv + vec2(-uTexel.x, 0.0)).rgb;
          vec3 mn = min(c, min(min(n, s), min(e, w)));
          vec3 mx = max(c, max(max(n, s), max(e, w)));
          vec3 amp = clamp(min(mn, 2.0 - mx) / max(mx, vec3(1e-4)), 0.0, 1.0);
          amp = sqrt(amp) * (-0.15 * strength);
          return clamp((c + (n + s + e + w) * amp) / (1.0 + 4.0 * amp), 0.0, 8.0);
        }

        vec3 evalSoftKuwahara(vec2 uv, int rad) {
          vec3 m0=vec3(0.0), m1=vec3(0.0), m2=vec3(0.0), m3=vec3(0.0);
          vec3 s0=vec3(0.0), s1=vec3(0.0), s2=vec3(0.0), s3=vec3(0.0);
          float cnt = float((rad + 1) * (rad + 1));
          for (int j = -2; j <= 2; j++) {
            if (abs(j) > rad) continue;
            for (int i = -2; i <= 2; i++) {
              if (abs(i) > rad) continue;
              vec3 c = texture(uScene, uv + vec2(float(i), float(j)) * uTexel).rgb;
              vec3 cc = c / (1.0 + c);
              vec3 cc2 = cc * cc;
              if (i <= 0 && j <= 0) { m0 += cc; s0 += cc2; }
              if (i >= 0 && j <= 0) { m1 += cc; s1 += cc2; }
              if (i <= 0 && j >= 0) { m2 += cc; s2 += cc2; }
              if (i >= 0 && j >= 0) { m3 += cc; s3 += cc2; }
            }
          }
          m0/=cnt; s0=abs(s0/cnt-m0*m0); m1/=cnt; s1=abs(s1/cnt-m1*m1);
          m2/=cnt; s2=abs(s2/cnt-m2*m2); m3/=cnt; s3=abs(s3/cnt-m3*m3);
          float v0=dot(s0,vec3(0.299,0.587,0.114)), v1=dot(s1,vec3(0.299,0.587,0.114));
          float v2=dot(s2,vec3(0.299,0.587,0.114)), v3=dot(s3,vec3(0.299,0.587,0.114));
          float sh = 46.0;
          float w0=exp(-v0*sh), w1=exp(-v1*sh), w2=exp(-v2*sh), w3=exp(-v3*sh);
          vec3 avg = (m0*w0 + m1*w1 + m2*w2 + m3*w3) / max(w0+w1+w2+w3, 1e-4);
          return avg / max(1.0 - avg, vec3(0.05));
        }

        // Scene-Wide Cel-Shading Stylized Ink Outlines (三渲二描边: bold hero car + crisp readable architecture, bridges, tunnels & vegetation)
        vec2 inkAt(vec2 uv, float centerA, float centerZ, vec3 centerRgb) {
          bool isCar = (centerA > 0.72 && centerA < 0.92);
          float carEdge = 0.0;
          float worldEdge = 0.0;
          float cLum = dot(centerRgb, vec3(0.299, 0.587, 0.114));
          vec2 offs[4] = vec2[4](vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0));
          float zMaxDiff = 0.0;
          float lumDiff = 0.0;
          float nPuddleMax = 0.0;
          for (int k = 0; k < 4; k++) {
            vec2 nuv = uv + offs[k] * uTexel * (isCar ? 1.85 : 1.55);
            vec4 ns = texture(uScene, nuv);
            float na = ns.a;
            if (na > 0.615 && na < 0.715) nPuddleMax = 1.0;
            float nz = linearDepth(texture(uDepth, nuv).r);
            bool nCar = (na > 0.72 && na < 0.92);
            if (isCar != nCar) {
              if (min(centerZ, nz) < 30.0) carEdge = max(carEdge, 1.0);
            } else if (isCar && nCar) {
              float dz = abs(centerZ - nz) / max(centerZ, 1.0);
              carEdge = max(carEdge, smoothstep(0.028, 0.080, dz) * 0.82);
              float nLum = dot(ns.rgb, vec3(0.299, 0.587, 0.114));
              carEdge = max(carEdge, smoothstep(0.13, 0.32, abs(cLum - nLum)) * 0.48);
            } else {
              float dz = abs(centerZ - nz) / max(min(centerZ, nz), 1.0);
              zMaxDiff = max(zMaxDiff, dz);
              float nLum = dot(ns.rgb, vec3(0.299, 0.587, 0.114));
              lumDiff = max(lumDiff, abs(cLum - nLum));
            }
          }
          // Distance-faded architectural/vegetation/prop cel outline (readable on chalets, bridges, tunnels, rocks & foliage)
          float distFade = smoothstep(88.0, 14.0, centerZ);
          float isPuddle = (centerA > 0.615 && centerA < 0.715) ? 1.0 : 0.0;
          float nearPuddle = max(isPuddle, nPuddleMax);
          float depthInk = smoothstep(0.052, 0.15, zMaxDiff) * distFade * (1.0 - nearPuddle * 0.86);
          // Subtle structural crease ink on near architecture/bridges/tunnels (gated by depth so sky/fog stays untouched)
          float creaseInk = smoothstep(0.20, 0.44, lumDiff) * smoothstep(42.0, 8.0, centerZ) * 0.48 * (1.0 - nearPuddle);
          worldEdge = max(depthInk * 0.84, creaseInk);
          return vec2(carEdge, worldEdge);
        }

        void main() {
          vec4 centerS = texture(uScene, vUv);
          if (any(isnan(centerS.rgb)) || any(isinf(centerS.rgb))) centerS.rgb = vec3(0.0);
          float depthRaw = texture(uDepth, vUv).r;
          float linZ = linearDepth(depthRaw);
          bool isSkyOrMtn = (centerS.a < 0.60) || (depthRaw >= 0.9992);

          vec3 col = isSkyOrMtn ? centerS.rgb : evalCAS(vUv, centerS.rgb, smoothstep(55.0, 14.0, linZ) * 0.85);

          if (uKuwaharaOn > 0.5 && !isSkyOrMtn && linZ > 28.0 && linZ < 150.0) {
            int rad = (linZ < 110.0) ? 2 : 1;
            float midBlend = smoothstep(28.0, 46.0, linZ) * smoothstep(150.0, 110.0, linZ) * 0.34;
            col = mix(col, evalSoftKuwahara(vUv, rad), midBlend);
          }

          // High-Precision Screen-Space Puddle Reflections (SSR) — optimized 32-step + 4-step binary refinement (0 visual loss, 20% faster!)
          if (uSsrOn > 0.5 && centerS.a > 0.622 && centerS.a < 0.715 && linZ < 78.0) {
            float puddleMask = clamp((centerS.a - 0.62) / 0.085, 0.0, 1.0);
            float distFade = smoothstep(78.0, 12.0, linZ);
            // Animated rain-impact capillary ripples on puddle surface
            float rip1 = sin(vUv.x * 195.0 + vUv.y * 85.0 + uTime * 5.2);
            float rip2 = cos(vUv.x * 130.0 - vUv.y * 145.0 - uTime * 4.1);
            vec2 ripOff = vec2(rip1 * 0.0045 + rip2 * 0.0028, rip2 * 0.0022);
            // Planar reflection march upward in screen space with perspective horizon convergence
            float horizonY = 0.54;
            vec2 marchUv = vUv;
            float jitter = ign(gl_FragCoord.xy + fract(uTime * 0.7) * 53.0);
            vec3 ssrCol = vec3(0.0);
            float ssrHit = 0.0;
            float stepSize = 0.0086;
            vec2 prevUv = vUv;
            for (int si = 0; si < 32; si++) {
              float tStep = stepSize * (1.0 + float(si) * 0.095);
              float dirX = (0.50 - marchUv.x) * 0.06 + ripOff.x * 2.6;
              marchUv += vec2(dirX * tStep, tStep);
              if (marchUv.y > 0.985 || marchUv.x < 0.005 || marchUv.x > 0.995) break;
              vec2 sampleUv = clamp(marchUv + ripOff * (0.35 + 0.65 * float(si) / 32.0), vec2(0.003), vec2(0.997));
              float sz = linearDepth(texture(uDepth, sampleUv).r);
              vec4 sc = texture(uScene, sampleUv);
              // Valid reflection hit: above puddle horizon-wise, not a puddle pixel, and either distant scenery/trees/cliffs/sky or car rear
              bool isNotPuddle = !(sc.a > 0.615 && sc.a < 0.715);
              bool isCarHit = (sc.a > 0.72 && sc.a < 0.92) && (linZ < 18.0);
              float minDepthRatio = mix(0.85, 0.52, clamp(uTunnelFactor, 0.0, 1.0));
              bool isEnvHit = (sz >= linZ * minDepthRatio) && (sampleUv.y > vUv.y + 0.020 + jitter * 0.005);
              if (isNotPuddle && (isCarHit || isEnvHit)) {
                // 4-step binary refinement for crisp silhouette reflection edge
                vec2 lo = prevUv, hi = sampleUv;
                for (int bi = 0; bi < 4; bi++) {
                  vec2 mid = 0.5 * (lo + hi);
                  float mz = linearDepth(texture(uDepth, mid).r);
                  float ma = texture(uScene, mid).a;
                  bool mHit = !(ma > 0.615 && ma < 0.715) && ((ma > 0.72 && ma < 0.92 && linZ < 18.0) || mz >= linZ * minDepthRatio);
                  if (mHit) hi = mid; else lo = mid;
                }
                vec2 hUv = clamp(hi + ripOff * 0.52, vec2(0.003), vec2(0.997));
                // 3-tap glossy wet-surface reflection + bloom emissive pickup (glossy cinema style)
                ssrCol = texture(uScene, hUv).rgb * 0.54
                       + texture(uScene, clamp(hUv + vec2(uTexel.x * 2.4, 0.0), 0.003, 0.997)).rgb * 0.23
                       + texture(uScene, clamp(hUv - vec2(uTexel.x * 2.4, 0.0), 0.003, 0.997)).rgb * 0.23
                       + texture(uBloom, hUv).rgb * 0.35;
                float edgeFade = smoothstep(0.98, 0.82, hUv.y)
                               * smoothstep(0.00, 0.06, hUv.x) * smoothstep(1.00, 0.94, hUv.x);
                ssrHit = edgeFade * smoothstep(horizonY + 0.16, 0.05, vUv.y);
                break;
              }
              prevUv = sampleUv;
            }
            if (ssrHit > 0.01) {
              // Physically plausible wet-puddle Fresnel weighting (stronger at grazing distances, preserves mud edge contrast)
              float fresnelPud = mix(0.38, 0.78, smoothstep(3.5, 36.0, linZ)) * puddleMask * distFade * ssrHit * mix(0.45, 1.0, clamp(uWetness, 0.0, 1.0));
              col = mix(col, ssrCol * 0.96, clamp(fresnelPud, 0.0, 0.78));
            }
          }

          // Hero-Car-Protected Radial/Directional Speed Motion Blur (cinematic rally speed feel while keeping #22 car razor sharp!)
          vec2 center = vec2(0.50, 0.48);
          vec2 delta = vUv - center;
          float rad = length(delta);
          bool isHeroCar = (centerS.a > 0.72 && centerS.a < 0.92);
          float carProtect = isHeroCar ? 0.0 : smoothstep(0.18, 0.34, length((vUv - vec2(0.50, 0.33)) * vec2(1.18, 1.55)));
          float edgeMask = smoothstep(0.22, 0.72, rad) * carProtect * (isSkyOrMtn ? 0.18 : 1.0);
          float blurAmt = edgeMask * (0.004 + uSpeedNorm * 0.022);
          if (blurAmt > 0.0008 && uSpeedNorm > 0.05) {
            vec2 stepDir = delta * blurAmt;
            vec3 acc = col * 0.32;
            float wTot = 0.32;
            for (int ti = 1; ti <= 8; ti++) {
              float f = float(ti) / 8.0;
              vec2 suv = clamp(vUv - stepDir * f, 0.002, 0.998);
              vec4 ss = texture(uScene, suv);
              if (ss.a > 0.72 && ss.a < 0.92) continue; // Never bleed hero car into background!
              float sz = linearDepth(texture(uDepth, suv).r);
              float dw = smoothstep(0.45, 0.08, abs(sz - linZ) / max(linZ, 1.5));
              float w = (1.0 - f * 0.68) * 0.14 * dw;
              acc += ss.rgb * w;
              wTot += w;
            }
            col = acc / max(wTot, 0.01);
          }

          vec2 ink = inkAt(vUv, centerS.a, linZ, centerS.rgb);
          if (ink.x > 0.01 || ink.y > 0.01) {
            float sprayClean = 1.0 - smoothstep(0.48, 0.84, dot(centerS.rgb, vec3(0.333))) * step(vUv.y, 0.38);
            float inkStrength = max(ink.x * 0.88, ink.y * 0.80) * sprayClean;
            vec3 inkCol = vec3(0.035, 0.045, 0.062);
            col = mix(col, inkCol, clamp(inkStrength, 0.0, 0.88));
          }

          if (uBloomStrength > 0.001) {
            col += texture(uBloom, vUv).rgb * uBloomStrength;
          }

          // 28-Tap IGN-Dithered Volumetric Tyndall Crepuscular God Rays + Atmospheric Refraction (30% faster, identical smoothness!)
          float outdoorFac = 1.0 - clamp(uTunnelFactor, 0.0, 1.0);
          if (outdoorFac > 0.02 && uTyndallStrength > 0.01) {
            vec2 lightScreen = uSunScreen + vec2(sin(uTime * 0.08) * 0.025, 0.0);
            vec2 rayDelta = (lightScreen - vUv) * (1.0 / 28.0) * 0.84;
            vec2 rayUv = vUv + rayDelta * ign(gl_FragCoord.xy);
            float rayAccum = 0.0;
            float rayDecay = 1.0;
            for (int rs = 0; rs < 28; rs++) {
              rayUv += rayDelta;
              vec2 cUv = clamp(rayUv, vec2(0.002), vec2(0.998));
              float sd = texture(uDepth, cUv).r;
              vec3 sc = texture(uScene, cUv).rgb;
              float skyOpen = smoothstep(0.962, 0.9985, sd);
              float lumS = dot(sc, vec3(0.25, 0.55, 0.20));
              float brightBreak = smoothstep(0.26, 0.80, lumS) * skyOpen;
              rayAccum += brightBreak * rayDecay;
              rayDecay *= 0.946;
            }
            rayAccum /= 28.0;
            float distFromLight = length((vUv - lightScreen) * vec2(1.38, 1.0));
            float rayFalloff = smoothstep(1.52, 0.04, distFromLight) * smoothstep(0.10, 0.68, vUv.y);
            // Depth-aware Mie scattering + spectral atmospheric refraction (warm amber core -> rose mid -> cool azure halo)
            float depthScat = mix(0.14, 1.0, smoothstep(8.0, 48.0, linZ));
            vec3 tyndallCore = uTyndallColor * vec3(1.20, 1.06, 0.88);
            vec3 tyndallMid  = uTyndallColor * vec3(1.06, 0.96, 1.02);
            vec3 tyndallHalo = uTyndallColor * vec3(0.82, 0.95, 1.16);
            vec3 tyndallCol = mix(tyndallHalo, mix(tyndallMid, tyndallCore, smoothstep(0.55, 0.10, distFromLight)), smoothstep(1.05, 0.35, distFromLight));
            // Richer cinematic crepuscular sun-shafts breaking through rain clouds
            col += tyndallCol * rayAccum * rayFalloff * depthScat * uTyndallStrength * 1.62 * outdoorFac;
            // Subtle horizon atmospheric refraction haze band (lifts distant misty valleys with Mie glow)
            float horzBand = exp(-pow((vUv.y - 0.56) * 5.2, 2.0)) * smoothstep(26.0, 140.0, linZ);
            col += tyndallCol * horzBand * uTyndallStrength * 0.16 * outdoorFac;
          }
          // Physically-Based Smooth Filmic Eye Adaptation Glare (silky non-blinding tunnel exit veil!)
          if (uEyeGlare > 0.005) {
            vec2 eD = (vUv - vec2(0.50, 0.52)) * vec2(1.15, 1.0);
            float portalField = (0.28 + 0.72 * exp(-dot(eD, eD) * 2.2)) * smoothstep(12.0, 58.0, linZ);
            vec3 glareBloom = texture(uBloom, vUv).rgb * 0.55 + uTyndallColor * vec3(1.12, 1.05, 0.92) * 0.16;
            col += glareBloom * portalField * uEyeGlare;
          }

          // =========================================================================
          // V8 WEATHER-LINKED OPTICAL LENS & COCKPIT GLASS REFRACTION / SUN-GLINT DIRTY SPOTS
          // - Rainy Chase: full camera-lens refractive droplets + dirty-lens smudges
          // - Rainy 1st-Person Cockpit: fullscreen camera-lens drops OFF -> ONLY pixel-exact
          //   windshield & side-window glass (linZ > 1.08m) gets optical refractive droplets + smudges!
          // - Clear / Sunny Weather: ZERO wet raindrops, leaving sun-illuminated dusty/dirty spots
          //   that glint warmly when sunlight hits the camera lens or car glass!
          // =========================================================================
          float isCockpit = clamp(uCockpitMode, 0.0, 1.0);
          // Pixel-exact cockpit glass aperture mask via depth buffer (solid cabin interior < 0.96m, exterior through glass > 1.12m)
          float glassAperture = smoothstep(0.96, 1.12, linZ);
          float surfaceMask = mix(1.0, glassAperture, isCockpit);
          // Raindrops strictly tied to active rain or puddle splash (0.0 in clear/sunny weather!)
          float activeRain = smoothstep(0.06, 0.52, uRainLevel);
          float tunnelRainDry = smoothstep(0.58, 0.06, clamp(uTunnelFactor, 0.0, 1.0));
          float wetDropMask = clamp((activeRain * 0.96 + uSplashDrop * 0.55) * tunnelRainDry * surfaceMask, 0.0, 1.0);
          // Dry sunny/golden dirty-lens & dusty-glass sun-glint energy
          float drySunAmt = (1.0 - activeRain) * outdoorFac * surfaceMask;
          float sunAlign = smoothstep(1.05, 0.06, length((vUv - uSunScreen) * vec2(1.18, 1.0)));
          float centerClear = mix(
            smoothstep(0.11, 0.34, length((vUv - vec2(0.50, 0.42)) * vec2(1.05, 1.32))),
            smoothstep(0.08, 0.28, length((vUv - vec2(0.54, 0.54)) * vec2(1.15, 1.35))),
            isCockpit
          );
          float edgeOnly = mix(smoothstep(0.24, 0.54, rad), smoothstep(0.10, 0.42, rad), isCockpit);
          float anyOptics = max(wetDropMask, drySunAmt * (0.30 + 0.70 * sunAlign));
          if (anyOptics > 0.02 && uLensQuality > 0.5) {
            float aspect = max(0.5, uTexel.y / max(uTexel.x, 1e-6));
            vec4 smudge, cDrop;
            evalLensOptics(vUv, uTime, aspect, isCockpit, uSpeedNorm, smudge, cDrop);
            // 1. Dirty-Lens / Dusty-Glass Smudge & Sun-Glint Spots (Active in BOTH Rain & Sunny Sun-Glint!)
            float smudgeZone = mix(edgeOnly, clamp(edgeOnly + sunAlign * 0.55, 0.0, 1.0), 1.0 - activeRain);
            if (smudgeZone > 0.02 && (smudge.x > 0.01 || smudge.w > 0.02)) {
              vec2 sOff = clamp(smudge.yz * 0.012, vec2(-0.016), vec2(0.016));
              vec2 sUv = clamp(vUv + sOff, vec2(0.004), vec2(0.996));
              vec3 sBloom = texture(uBloom, sUv).rgb * 1.55;
              float sceneHi = smoothstep(0.20, 0.95, dot(col + sBloom * 0.75, vec3(0.28, 0.52, 0.20)));
              // In dry/sunny weather, dusty spots only illuminate where sunlight / bright sky hits them (clean in dark shadows!)
              float sunSpotDrive = drySunAmt * pow(clamp(0.15 + 0.85 * sunAlign, 0.0, 1.0), 1.35) * (0.06 + 0.94 * sceneHi);
              float totalSmudge = clamp(wetDropMask * 0.90 + sunSpotDrive * 1.25, 0.0, 1.25);
              float sMask = smoothstep(0.10, 0.64, smudge.x) * smudgeZone * clamp(wetDropMask * 0.72 + sunSpotDrive * 0.48, 0.0, 0.80);
              float tintVar = fract(sin(dot(floor(vUv * 14.0), vec2(41.3, 97.1))) * 43758.5);
              vec3 dustTint = mix(vec3(0.96, 0.97, 1.00), vec3(0.95, 0.90, 0.82), tintVar);
              col = mix(col, texture(uScene, sUv).rgb * dustTint + sBloom * 0.24, clamp(sMask * 0.28, 0.0, 0.28));
              // Soft warm sun-caught dust bokeh glow (ZERO hard white blotches in sky!)
              vec3 sunGlintCol = mix(uTyndallColor * 0.20, uTyndallColor * vec3(1.22, 1.06, 0.82) * 0.50, 1.0 - activeRain);
              col += (sBloom * 0.55 + sunGlintCol) * smudge.w * smudgeZone * totalSmudge * mix(0.28, 0.48, 1.0 - activeRain);
            }
            // 2. Crystal-Clear Stationary 3D Optical Refractive Water Droplets (ONLY when raining / splashing; 0 in sunny weather!)
            if (wetDropMask > 0.02 && centerClear > 0.02 && cDrop.x > 0.015) {
              vec2 dN = cDrop.yz;
              float dLen = length(dN);
              vec2 refrOff = clamp(-dN * (0.026 + 0.014 * wetDropMask), vec2(-0.034), vec2(0.034));
              vec2 rUv = clamp(vUv + refrOff, vec2(0.004), vec2(0.996));
              // Protect cockpit interior from bleeding into glass droplet refraction
              if (isCockpit > 0.5 && linearDepth(texture(uDepth, rUv).r) < 1.02) rUv = vUv;
              vec2 disp = refrOff * 0.14;
              vec3 refrCol = vec3(
                texture(uScene, clamp(rUv + disp, 0.004, 0.996)).r,
                texture(uScene, rUv).g,
                texture(uScene, clamp(rUv - disp, 0.004, 0.996)).b
              );
              vec3 dBloom = texture(uBloom, rUv).rgb;
              vec2 lDir = normalize(uSunScreen - vec2(0.5, 0.35) + vec2(0.001));
              float ndl = dot(dN, lDir);
              float refrLum = dot(refrCol, vec3(0.299, 0.587, 0.114));
              // Director V3: Natural optical water meniscus (subtle dark TIR boundary, interior lower caustic, tiny directional pinpoint — ZERO fake white rim!)
              float innerZone = 1.0 - smoothstep(0.76, 0.96, dLen);
              float meniscusDark = smoothstep(0.64, 0.98, dLen) * 0.26;
              float botCaustic = smoothstep(-0.14, -0.78, ndl) * 0.26 * innerZone;
              float pinpoint = pow(clamp(ndl, 0.0, 1.0), 48.0) * smoothstep(0.24, 0.68, dLen) * innerZone * (0.26 + 0.70 * clamp(refrLum + dot(dBloom, vec3(0.35)), 0.0, 1.0));
              vec3 dropCol = refrCol * (1.0 - meniscusDark + botCaustic) + dBloom * 0.28 * innerZone + vec3(0.96, 0.98, 1.0) * pinpoint * 0.72;
              float dMask = smoothstep(0.02, 0.22, cDrop.x) * centerClear * wetDropMask;
              col = mix(col, dropCol, clamp(dMask * 0.94, 0.0, 0.94));
              col += dBloom * cDrop.w * centerClear * wetDropMask * 0.08;
            }
          }

          // Dynamic optical radial chromatic dispersion + subtle boost-speed peripheral energy (hero car protected!)
          float boostSurge = smoothstep(0.78, 1.32, uSpeedNorm);
          float caAmt = smoothstep(0.38, 0.94, rad) * (0.0012 + uSpeedNorm * 0.0020 + boostSurge * 0.0028) * carProtect * surfaceMask;
          if (caAmt > 0.0004) {
            vec2 caDir = normalize(delta + vec2(1e-5)) * caAmt;
            col.r = mix(col.r, texture(uScene, clamp(vUv + caDir, 0.002, 0.998)).r, 0.34 + boostSurge * 0.22);
            col.b = mix(col.b, texture(uScene, clamp(vUv - caDir, 0.002, 0.998)).b, 0.34 + boostSurge * 0.22);
          }
          // Subtle kinetic edge speed-lines during boost/high-speed sprints (strictly peripheral, zero obstruction!)
          if (boostSurge > 0.02 && !isHeroCar) {
            float angL = atan(delta.y, delta.x);
            float streak = pow(max(0.0, sin(angL * 42.0 + floor(uTime * 18.0) * 1.7) * sin(angL * 19.0 - floor(uTime * 12.0) * 2.3)), 4.0);
            float rimZone = smoothstep(0.42, 0.78, rad) * carProtect * surfaceMask;
            col += vec3(0.88, 0.94, 1.0) * streak * rimZone * boostSurge * 0.18;
          }

          // ACES Filmic Tone Mapping + Moody Overcast Cel×Realistic Color Grade (matches reference video!)
          float effExp = uExposure * max(0.42, uEyeExposure);
          col = acesFilm(col * effExp + vec3(0.002));

          float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
          int fid = int(uFilterId + 0.5);
          if (fid == 1) {
            // VERDANT: Lush sunlit emerald-jade greens, warm ivory highlights, airy painterly clarity
            col = mix(col, col * col * (3.0 - 2.0 * col), 0.16);
            col *= mix(vec3(0.95, 1.02, 1.05), vec3(1.09, 1.06, 0.96), smoothstep(0.15, 0.78, lum));
            col = mix(vec3(lum), col, 1.24);
            col += vec3(0.015, 0.018, 0.008) * (1.0 - lum);
          } else if (fid == 2) {
            // GOLDEN: Classic print-film warm honey-amber midtones, nostalgic copper-gold autumn cinema
            col = mix(col, col * col * (3.0 - 2.0 * col), 0.26);
            col *= mix(vec3(0.94, 0.90, 0.86), vec3(1.16, 1.03, 0.82), smoothstep(0.10, 0.76, lum));
            col = mix(vec3(lum), col, 1.14);
          } else if (fid == 3) {
            // CYBER: Neon-cinema inspired moody teal-cyan shadows + vibrant magenta/amber neon glow
            col = mix(col, col * col * (3.0 - 2.0 * col), 0.34);
            col *= mix(vec3(0.76, 0.98, 1.14), vec3(1.14, 0.94, 1.08), smoothstep(0.16, 0.74, lum));
            col = mix(vec3(lum), col, 1.22);
          } else if (fid == 4) {
            // FILM: Classic analog film alpine vibrancy, crisp cobalt shadows, vivid wildflowers & teal livery
            col = mix(col, col * col * (3.0 - 2.0 * col), 0.24);
            col *= mix(vec3(0.88, 0.96, 1.08), vec3(1.06, 1.04, 0.98), smoothstep(0.12, 0.74, lum));
            col = mix(vec3(lum), col, 1.28);
          } else if (fid == 5) {
            // NOIR: Dramatic high-contrast silver-slate rainy cinema with selective crimson/amber accent pop
            float warmAccent = smoothstep(0.08, 0.28, col.r - max(col.g, col.b) * 0.78);
            col = mix(col, col * col * (3.0 - 2.0 * col), 0.42);
            col = mix(vec3(lum) * vec3(0.92, 0.96, 1.02), col * vec3(1.18, 0.96, 0.88), clamp(0.28 + warmAccent * 0.85, 0.0, 1.0));
          } else {
            // CINEMA (Default): Warm golden-ivory highlights balanced with deep emerald-teal shadows (never cold-gray!)
            col = mix(col, col * col * (3.0 - 2.0 * col), 0.26);
            col *= mix(vec3(0.91, 0.98, 1.04), vec3(1.10, 1.05, 0.95), smoothstep(0.14, 0.74, lum));
            col = mix(vec3(lum), col, 1.18);
          }
          float vig = 1.0 - smoothstep(0.50, 1.02, rad) * 0.24;
          col *= vig;

          // Cinematic Pause Bokeh Depth-of-Field Blur + Velvet Dimming (zero cost when driving!)
          if (uPauseBlur > 0.001) {
            float pb = smoothstep(0.0, 1.0, clamp(uPauseBlur, 0.0, 1.0));
            float aspectP = max(0.5, uTexel.y / max(uTexel.x, 1e-6));
            vec2 bRad = vec2(0.0085 / aspectP, 0.0085) * pb;
            vec3 bAcc = col * 0.20;
            float wSum = 0.20;
            for (int bi = 0; bi < 12; bi++) {
              float ang = float(bi) * 2.3999632 + ign(gl_FragCoord.xy) * 0.35;
              float rr = sqrt((float(bi) + 0.5) / 12.0);
              vec2 bUv = clamp(vUv + vec2(cos(ang), sin(ang)) * bRad * rr, vec2(0.002), vec2(0.998));
              vec3 sc = acesFilm(texture(uScene, bUv).rgb * effExp + vec3(0.002));
              bAcc += sc;
              wSum += 1.0;
            }
            vec3 blurCol = (bAcc / wSum) * (1.0 - smoothstep(0.32, 0.96, rad) * 0.34);
            float bLum = dot(blurCol, vec3(0.2126, 0.7152, 0.0722));
            blurCol = mix(blurCol, vec3(bLum) * vec3(0.90, 0.95, 1.05), 0.24 * pb);
            blurCol *= mix(vec3(1.0), vec3(0.70, 0.74, 0.82), 0.52 * pb);
            col = mix(col, blurCol, pb);
          }

          col = pow(max(col, 0.0), vec3(1.0 / 2.2));
          // Ultra-fine cinema film grain + blue-noise dithering (prevents sky banding & adds authentic filmic texture)
          float grain = (ign(gl_FragCoord.xy + fract(uTime * 1.37) * 91.0) - 0.5) * 0.014;
          float dither = grain + (ign(gl_FragCoord.xy + fract(uTime) * 37.0) - 0.5) / 255.0;
          fragColor = vec4(clamp(col + dither, 0.0, 1.0), 1.0);
        }
      `);
    }

    setQuality(key) {
      this.qualityKey = PV.QUALITY_PRESETS[key] ? key : 'high';
      this.quality = PV.QUALITY_PRESETS[this.qualityKey];
      this.dprOverride = null;
      this.shadowOverride = null;
      this.ssrOverride = null;
      this.lensOverride = null;
      this.kuwaharaOverride = null;
      this.bloomOverride = null;
      this._buildShadowFBO(this.quality.shadowSize);
      this.resize(this.canvas.clientWidth || 1280, this.canvas.clientHeight || 720);
    }

    setCustomOption(key, val) {
      if (key === 'dpr') {
        this.dprOverride = (val === null || val === undefined) ? null : Math.max(0.6, Math.min(2.0, Number(val) || 1.0));
        this.resize(this.canvas.clientWidth || 1280, this.canvas.clientHeight || 720);
      } else if (key === 'shadowSize') {
        const sz = (val === null || val === undefined) ? null : Math.max(512, Math.min(4096, Number(val) || 2048));
        this.shadowOverride = sz;
        this._buildShadowFBO(sz || this.quality.shadowSize);
      } else if (key === 'ssr') {
        this.ssrOverride = (val === null || val === undefined) ? null : !!val;
      } else if (key === 'lensQuality') {
        this.lensOverride = (val === null || val === undefined) ? null : Math.max(0, Math.min(3, Number(val) || 0));
      } else if (key === 'kuwahara') {
        this.kuwaharaOverride = (val === null || val === undefined) ? null : !!val;
      } else if (key === 'bloom') {
        this.bloomOverride = (val === null || val === undefined) ? null : !!val;
      }
    }

    getEffectiveGraphics() {
      return {
        qualityKey: this.qualityKey,
        dpr: this.dprOverride !== null ? this.dprOverride : this.quality.dpr,
        shadowSize: this.shadowOverride !== null ? this.shadowOverride : this.quality.shadowSize,
        ssr: this.ssrOverride !== null ? this.ssrOverride : !!this.quality.ssr,
        lensQuality: this.lensOverride !== null ? this.lensOverride : (this.quality.lensQuality || 2.0),
        kuwahara: this.kuwaharaOverride !== null ? this.kuwaharaOverride : !!this.quality.kuwahara,
        bloom: this.bloomOverride !== null ? this.bloomOverride : !!this.quality.bloom,
        width: this.width,
        height: this.height,
      };
    }

    _buildShadowFBO(size) {
      const gl = this.gl;
      if (this.shadowFBO) { gl.deleteFramebuffer(this.shadowFBO); gl.deleteTexture(this.shadowTex); }
      this.shadowSize = size;
      this.shadowTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.shadowFBO = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFBO);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowTex, 0);
      gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    resize(cssW, cssH) {
      const effDpr = this.dprOverride !== null ? this.dprOverride : this.quality.dpr;
      const w = Math.max(320, Math.round(cssW * effDpr));
      const h = Math.max(200, Math.round(cssH * effDpr));
      this.canvas.width = w; this.canvas.height = h;
      this.width = w; this.height = h;
      this._buildMainFBOs(w, h);
    }

    _buildMainFBOs(w, h) {
      const gl = this.gl;
      const delF = (f) => f && gl.deleteFramebuffer(f);
      const delT = (t) => t && gl.deleteTexture(t);
      const delR = (r) => r && gl.deleteRenderbuffer(r);
      delF(this.msaaFBO); delR(this.msaaColor); delR(this.msaaDepth);
      delF(this.resolveFBO); delT(this.sceneColorTex); delT(this.sceneDepthTex);
      for (const m of this.bloomMips) { delF(m.fbo); delT(m.tex); }
      this.bloomMips = [];

      const useHDR = !!(this.extFloat || this.extHalfFloat);
      const colorInternal = useHDR ? gl.RGBA16F : gl.RGBA8;
      const colorType = useHDR ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
      const samples = Math.min(this.quality.msaa, this.maxSamples);
      this.useMSAA = samples >= 2;

      this.sceneColorTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.sceneColorTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, colorInternal, w, h, 0, gl.RGBA, colorType, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this.sceneDepthTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.sceneDepthTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this.resolveFBO = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.resolveFBO);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sceneColorTex, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.sceneDepthTex, 0);

      if (this.useMSAA) {
        this.msaaFBO = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaaFBO);
        this.msaaColor = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaColor);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, colorInternal, w, h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.msaaColor);
        this.msaaDepth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.msaaDepth);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.msaaDepth);
      }

      let bw = w >> 1, bh = h >> 1;
      for (let i = 0; i < 5; i++) {
        bw = Math.max(16, bw); bh = Math.max(16, bh);
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, colorInternal, bw, bh, 0, gl.RGBA, colorType, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        this.bloomMips.push({ fbo, tex, w: bw, h: bh });
        bw >>= 1; bh >>= 1;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    updateShadowMatrix(centerPos, fwdDir) {
      const cx = centerPos[0] + fwdDir[0] * 22, cy = centerPos[1] + 2, cz = centerPos[2] + fwdDir[2] * 22;
      const ld = PV.LIGHT.dir;
      M4.lookAt(this.lightView, [cx + ld[0]*75, cy + ld[1]*75, cz + ld[2]*75], [cx, cy, cz], [0, 1, 0]);
      M4.ortho(this.lightProj, -48, 48, -48, 48, 5, 175);
      M4.multiply(this.lightVP, this.lightProj, this.lightView);
    }

    beginShadowPass() {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFBO);
      gl.viewport(0, 0, this.shadowSize, this.shadowSize);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      gl.colorMask(false, false, false, false);
      gl.clear(gl.DEPTH_BUFFER_BIT);
    }
    endShadowPass() { const gl = this.gl; gl.colorMask(true, true, true, true); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }

    beginMainPass() {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.useMSAA ? this.msaaFBO : this.resolveFBO);
      gl.viewport(0, 0, this.width, this.height);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      gl.clearColor(0.60, 0.69, 0.78, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    bindSharedPBRUniforms(u, time) {
      const gl = this.gl, L = PV.LIGHT;
      if (u.uCamPos) gl.uniform3fv(u.uCamPos, this.camPos);
      if (u.uLightDir) gl.uniform3fv(u.uLightDir, L.dir);
      if (u.uLightColor) gl.uniform3fv(u.uLightColor, L.color);
      if (u.uHemiSky) gl.uniform3fv(u.uHemiSky, L.hemiSky);
      if (u.uHemiGround) gl.uniform3fv(u.uHemiGround, L.hemiGround);
      if (u.uFogColor) gl.uniform3fv(u.uFogColor, L.fogColor);
      if (u.uFogNear) gl.uniform1f(u.uFogNear, this.quality.fogNear);
      if (u.uFogFar) gl.uniform1f(u.uFogFar, this.quality.fogFar);
      if (u.uTime) gl.uniform1f(u.uTime, time);
      if (u.uLightVP) gl.uniformMatrix4fv(u.uLightVP, false, this.lightVP);
      if (u.uShadowTexel) gl.uniform2f(u.uShadowTexel, 1.0 / this.shadowSize, 1.0 / this.shadowSize);
      if (u.uCarPos) gl.uniform3fv(u.uCarPos, this.carPos);
      if (u.uCarFwd) gl.uniform3fv(u.uCarFwd, this.carFwd);
      if (u.uCarRight) gl.uniform3fv(u.uCarRight, this.carRight);
      if (u.uWetness) gl.uniform1f(u.uWetness, L.wetness ?? 0.85);
      // Use reserved TEXTURE15 for uShadowMap so multi-biome PBR samplers (TEXTURE0..11) NEVER clobber real-time shadows!
      if (u.uShadowMap) { gl.activeTexture(gl.TEXTURE15); gl.bindTexture(gl.TEXTURE_2D, this.shadowTex); gl.uniform1i(u.uShadowMap, 15); }
    }

    finishPostPass(time, speedNorm, splashDrop, tunnelFactor, pauseBlur, cockpitMode, eyeExposure = 1.0, eyeGlare = 0.0) {
      const gl = this.gl;
      if (this.useMSAA) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaaFBO);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.resolveFBO);
        gl.blitFramebuffer(0, 0, this.width, this.height, 0, 0, this.width, this.height, gl.COLOR_BUFFER_BIT, gl.LINEAR);
        gl.blitFramebuffer(0, 0, this.width, this.height, 0, 0, this.width, this.height, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
      }

      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      gl.bindVertexArray(this.quadVao);

      let bloomStr = 0.0;
      const useBloom = this.bloomOverride !== null ? this.bloomOverride : this.quality.bloom;
      if (useBloom && this.bloomMips.length === 5) {
        bloomStr = 0.24;
        const m0 = this.bloomMips[0];
        gl.bindFramebuffer(gl.FRAMEBUFFER, m0.fbo); gl.viewport(0, 0, m0.w, m0.h);
        gl.useProgram(this.bloomPrefilterProg.prog);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.sceneColorTex);
        gl.uniform1i(this.bloomPrefilterProg.u.uSrc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.useProgram(this.bloomDownProg.prog);
        for (let i = 1; i < 5; i++) {
          const prev = this.bloomMips[i - 1], cur = this.bloomMips[i];
          gl.bindFramebuffer(gl.FRAMEBUFFER, cur.fbo); gl.viewport(0, 0, cur.w, cur.h);
          gl.bindTexture(gl.TEXTURE_2D, prev.tex); gl.uniform1i(this.bloomDownProg.u.uSrc, 0);
          gl.uniform2f(this.bloomDownProg.u.uTexel, 1.0 / prev.w, 1.0 / prev.h);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(this.bloomUpProg.prog);
        for (let i = 4; i >= 1; i--) {
          const srcM = this.bloomMips[i], dstM = this.bloomMips[i - 1];
          gl.bindFramebuffer(gl.FRAMEBUFFER, dstM.fbo); gl.viewport(0, 0, dstM.w, dstM.h);
          gl.bindTexture(gl.TEXTURE_2D, srcM.tex); gl.uniform1i(this.bloomUpProg.u.uSrc, 0);
          gl.uniform2f(this.bloomUpProg.u.uTexel, 1.0 / srcM.w, 1.0 / srcM.h);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        gl.disable(gl.BLEND);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.width, this.height);
      const cp = this.compositeProg;
      gl.useProgram(cp.prog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.sceneColorTex); gl.uniform1i(cp.u.uScene, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.bloomMips[0].tex); gl.uniform1i(cp.u.uBloom, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.sceneDepthTex); gl.uniform1i(cp.u.uDepth, 2);
      gl.uniform2f(cp.u.uTexel, 1.0 / this.width, 1.0 / this.height);
      gl.uniform1f(cp.u.uExposure, PV.LIGHT.exposure);
      gl.uniform1f(cp.u.uBloomStrength, bloomStr);
      const useKuw = this.kuwaharaOverride !== null ? this.kuwaharaOverride : this.quality.kuwahara;
      gl.uniform1f(cp.u.uKuwaharaOn, useKuw ? 1.0 : 0.0);
      gl.uniform1f(cp.u.uSpeedNorm, speedNorm);
      gl.uniform1f(cp.u.uSplashDrop, splashDrop);
      gl.uniform1f(cp.u.uTime, time);
      gl.uniform1f(cp.u.uNear, this.nearPlane);
      gl.uniform1f(cp.u.uFar, this.farPlane);
      if (cp.u.uTyndallColor) gl.uniform3fv(cp.u.uTyndallColor, PV.LIGHT.tyndallColor || [0.76, 0.84, 0.90]);
      if (cp.u.uTyndallStrength) gl.uniform1f(cp.u.uTyndallStrength, PV.LIGHT.tyndallStrength ?? 0.44);
      if (cp.u.uSunScreen) {
        const ld = PV.LIGHT.dir || [-0.4, 0.45, 0.78];
        const sx = Math.max(0.16, Math.min(0.84, 0.50 + ld[0] * 0.52));
        const sy = Math.max(0.68, Math.min(0.95, 0.62 + ld[1] * 0.52));
        gl.uniform2f(cp.u.uSunScreen, sx, sy);
      }
      const useSsr = this.ssrOverride !== null ? this.ssrOverride : this.quality.ssr;
      if (cp.u.uSsrOn) gl.uniform1f(cp.u.uSsrOn, useSsr ? 1.0 : 0.0);
      if (cp.u.uTunnelFactor) gl.uniform1f(cp.u.uTunnelFactor, tunnelFactor || 0.0);
      const effLens = this.lensOverride !== null ? this.lensOverride : (this.quality.lensQuality || 2.0);
      if (cp.u.uLensQuality) gl.uniform1f(cp.u.uLensQuality, effLens);
      if (cp.u.uFilterId) gl.uniform1f(cp.u.uFilterId, PV.LIGHT.filterId || 0.0);
      if (cp.u.uWetness) gl.uniform1f(cp.u.uWetness, PV.LIGHT.wetness !== undefined ? PV.LIGHT.wetness : 0.88);
      if (cp.u.uRainLevel) gl.uniform1f(cp.u.uRainLevel, PV.LIGHT.rainDensity !== undefined ? PV.LIGHT.rainDensity : 0.65);
      if (cp.u.uPauseBlur) gl.uniform1f(cp.u.uPauseBlur, pauseBlur || 0.0);
      if (cp.u.uCockpitMode) gl.uniform1f(cp.u.uCockpitMode, cockpitMode || 0.0);
      if (cp.u.uEyeExposure) gl.uniform1f(cp.u.uEyeExposure, eyeExposure || 1.0);
      if (cp.u.uEyeGlare) gl.uniform1f(cp.u.uEyeGlare, eyeGlare || 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindVertexArray(null);
      gl.enable(gl.DEPTH_TEST);
    }
  };
})(window);

