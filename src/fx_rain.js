// === fx_rain.js ===
// Item 4: Strictly Sub-Wheel 3-Layer Spray (Fine Droplets -> Grey-Blue Mist -> Ground Ripple Wake)
// + Near/Mid Stratified Rain (short fast streaks near lens, fine faint rain in midground, ZERO far streaks!)
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});

  const MAX_SPLASH = 960;
  const MAX_MIST   = 520;
  const MAX_RIPPLE = 220;
  const MAX_MUD    = 360;
  const MAX_RAIN_NEAR = 780;
  const MAX_RAIN_MID  = 1500;
  const MAX_RAIN_FAR  = 1200;
  const LEAF_PALS = [
    [new Float32Array([0.16, 0.38, 0.12]), new Float32Array([0.62, 0.36, 0.10])],
    [new Float32Array([0.84, 0.70, 0.24]), new Float32Array([0.92, 0.95, 0.98])],
    [new Float32Array([0.22, 0.44, 0.16]), new Float32Array([0.72, 0.58, 0.18])],
    [new Float32Array([0.18, 0.34, 0.14]), new Float32Array([0.56, 0.42, 0.14])],
    [new Float32Array([0.94, 0.74, 0.14]), new Float32Array([0.88, 0.44, 0.10])],
    [new Float32Array([0.66, 0.32, 0.12]), new Float32Array([0.82, 0.52, 0.16])],
    [new Float32Array([0.98, 0.72, 0.82]), new Float32Array([0.94, 0.56, 0.70])],
  ];
  const FALLBACK_FWD = new Float32Array([0, 0, 1]);

  PV.RainFX = class RainFX {
    constructor(gl, textures) {
      this.gl = gl;
      this.tex = textures;
      const makePool = (n, life, size) => Array.from({ length: n }, () => ({
        alive: false, x:0, y:0, z:0, vx:0, vy:0, vz:0, age:0, life, size, rot:0,
      }));
      this.splashParts = makePool(MAX_SPLASH, 0.22, 0.18);
      this.mistParts   = makePool(MAX_MIST,   0.36, 0.38);
      this.rippleParts = makePool(MAX_RIPPLE, 0.52, 0.36);
      this.mudParts    = makePool(MAX_MUD,    0.30, 0.15);
      this.sCur = 0; this.mCur = 0; this.rCur = 0; this.dCur = 0;
      this.splashDropEnergy = 0.0;

      const quad = {
        positions: [-0.5,-0.5,0, 0.5,-0.5,0, 0.5,0.5,0, -0.5,0.5,0],
        normals:   [0,0,1, 0,0,1, 0,0,1, 0,0,1],
        uvs:       [0,1, 1,1, 1,0, 0,0],
        indices:   [0,1,2, 0,2,3],
      };
      const groundQuad = {
        positions: [-0.5,0,-0.5, 0.5,0,-0.5, 0.5,0,0.5, -0.5,0,0.5],
        normals:   [0,1,0, 0,1,0, 0,1,0, 0,1,0],
        uvs:       [0,1, 1,1, 1,0, 0,0],
        indices:   [0,2,1, 0,3,2],
      };
      this.splashMesh = PV.createInstancedMesh(gl, quad, MAX_SPLASH);
      this.mistMesh   = PV.createInstancedMesh(gl, quad, MAX_MIST);
      this.rippleMesh = PV.createInstancedMesh(gl, groundQuad, MAX_RIPPLE);
      this.mudMesh    = PV.createInstancedMesh(gl, quad, MAX_MUD);

      this.nearRainVao = this._buildRainLayer(MAX_RAIN_NEAR, 10.0, 9.0);
      this.midRainVao  = this._buildRainLayer(MAX_RAIN_MID,  30.0, 14.0);
      this.farRainVao  = this._buildRainLayer(MAX_RAIN_FAR,  62.0, 24.0);
      this.leafVao     = this._buildRainLayer(180, 34.0, 13.0);
      this._initShaders();
      this._initLeafShader();
    }

    _initLeafShader() {
      const gl = this.gl;
      this.leafProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aSeed;
        layout(location=1) in vec2 aCorner;
        uniform mat4 uViewProj;
        uniform vec3 uCamPos;
        uniform vec3 uCamRight;
        uniform vec3 uCamUp;
        uniform float uTime;
        out vec2 vUv;
        out float vKind;
        out float vFade;
        void main() {
          float boxW = 34.0, boxH = 13.0;
          float seedW = fract(sin(dot(aSeed.xz, vec2(12.9898, 78.233))) * 43758.5453);
          float fallSpd = 0.72 + seedW * 0.65;
          float driftX = sin(uTime * (0.85 + seedW * 0.7) + aSeed.x * 1.7) * 2.1 + uTime * 0.65;
          float driftZ = cos(uTime * (0.70 + seedW * 0.6) + aSeed.z * 1.5) * 1.8;
          vec3 rel = vec3(
            mod(aSeed.x + driftX - uCamPos.x, boxW) - boxW * 0.5,
            mod(aSeed.y - uTime * fallSpd - uCamPos.y, boxH) - boxH * 0.35,
            mod(aSeed.z + driftZ - uCamPos.z, boxW) - boxW * 0.5
          );
          vec3 wp = uCamPos + rel;
          float ang = uTime * (1.8 + seedW * 2.4) + aSeed.x * 3.1;
          float ca = cos(ang), sa = sin(ang);
          float flutter = 0.42 + 0.58 * abs(sin(uTime * (2.6 + seedW * 2.1) + aSeed.y * 2.3));
          float sz = (0.075 + seedW * 0.068);
          vec2 c2 = vec2(aCorner.x, aCorner.y * 2.0 - 1.0);
          vec2 rC = vec2(c2.x * ca - c2.y * sa, (c2.x * sa + c2.y * ca) * flutter);
          wp += (uCamRight * rC.x + uCamUp * rC.y) * sz;
          vUv = c2 * 0.5 + 0.5;
          vKind = seedW;
          float d = length(rel);
          vFade = smoothstep(2.6, 5.2, d) * smoothstep(18.5, 9.5, d);
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec2 vUv;
        in float vKind;
        in float vFade;
        uniform vec3 uLeafColA;
        uniform vec3 uLeafColB;
        uniform vec3 uLightColor;
        out vec4 fragColor;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float leafMask = smoothstep(0.95, 0.42, abs(p.x) * 1.25 + p.y * p.y * 0.95);
          if (leafMask < 0.08) discard;
          float vein = smoothstep(0.14, 0.0, abs(p.x)) * 0.20;
          vec3 col = mix(uLeafColA, uLeafColB, vKind) * (0.78 + 0.35 * uLightColor) * (1.0 - vein);
          fragColor = vec4(col, leafMask * vFade * 0.88);
        }
      `);
    }

    _buildRainLayer(count, boxW, boxH) {
      const gl = this.gl;
      // Ribbon-quad rain streaks (2 triangles = 6 verts per drop) so rain has crisp readable anime thickness at 1440p+!
      const pos = new Float32Array(count * 6 * 3);
      const uv  = new Float32Array(count * 6 * 2); // x = side (-1..1), y = end (0=top, 1=bottom)
      const qUvs = [[-1,0], [1,0], [1,1], [-1,0], [1,1], [-1,1]];
      for (let i = 0; i < count; i++) {
        const sx = (Math.random() - 0.5) * boxW, sy = Math.random() * boxH, sz = (Math.random() - 0.5) * boxW;
        for (let k = 0; k < 6; k++) {
          const pIdx = (i * 6 + k) * 3;
          const uIdx = (i * 6 + k) * 2;
          pos[pIdx] = sx; pos[pIdx+1] = sy; pos[pIdx+2] = sz;
          uv[uIdx] = qUvs[k][0]; uv[uIdx+1] = qUvs[k][1];
        }
      }
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const b0 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b0); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      const b1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      return vao;
    }

    _initShaders() {
      const gl = this.gl;
      this.spriteProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=2) in vec2 aUv;
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;
        uniform mat4 uViewProj;
        uniform vec3 uCamRight;
        uniform vec3 uCamUp;
        out vec2 vUv;
        out float vAlpha;
        void main() {
          float c = cos(aInstB.x), s = sin(aInstB.x);
          vec2 p = vec2(aPos.x * aInstB.z, aPos.y) * aInstA.w;
          vec2 rp = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
          vec3 wp = aInstA.xyz + uCamRight * rp.x + uCamUp * rp.y;
          vUv = aUv; vAlpha = aInstB.y;
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec2 vUv;
        in float vAlpha;
        uniform sampler2D uTex;
        uniform vec3 uTint;
        out vec4 fragColor;
        void main() {
          vec4 t = texture(uTex, vUv);
          float a = t.a * vAlpha;
          if (a < 0.02) discard;
          fragColor = vec4(t.rgb * uTint, a);
        }
      `);

      this.groundRippleProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aPos;
        layout(location=2) in vec2 aUv;
        layout(location=4) in vec4 aInstA;
        layout(location=5) in vec4 aInstB;
        uniform mat4 uViewProj;
        out vec2 vUv;
        out float vAlpha;
        void main() {
          vec3 wp = aInstA.xyz + aPos * aInstA.w;
          vUv = aUv; vAlpha = aInstB.y;
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec2 vUv;
        in float vAlpha;
        uniform sampler2D uTex;
        out vec4 fragColor;
        void main() {
          vec4 t = texture(uTex, vUv);
          float a = t.a * vAlpha;
          if (a < 0.02) discard;
          fragColor = vec4(t.rgb, a);
        }
      `);

      this.rainProg = PV.createProgram(gl, `#version 300 es
        precision highp float;
        layout(location=0) in vec3 aSeed;
        layout(location=1) in vec2 aCorner;
        uniform mat4 uViewProj;
        uniform vec3 uCamPos;
        uniform vec3 uCamRight;
        uniform vec3 uCarFwd;
        uniform float uSpeedNorm;
        uniform float uTime;
        uniform float uBoxW;
        uniform float uBoxH;
        uniform float uSpeed;
        uniform float uStreakLen;
        uniform float uStreakW;
        out vec2 vCorner;
        out float vNearFade;
        void main() {
          vec3 p = aSeed;
          float hw = uBoxW * 0.5;
          float spd = clamp(uSpeedNorm, 0.0, 1.5);
          // Cyberpunk high-speed back-swept advection: rain whips backward along -uCarFwd as car accelerates!
          vec3 advect = vec3(-2.6, -uSpeed, 0.0) - uCarFwd * (4.5 + spd * 32.0);
          p.x = mod(p.x + advect.x * uTime + hw, uBoxW) - hw;
          p.y = mod(p.y + advect.y * uTime, uBoxH) - 1.5;
          p.z = mod(p.z + advect.z * uTime + hw, uBoxW) - hw;
          float camDist = length(p);
          vNearFade = smoothstep(1.35, 3.8, camDist);
          // Dynamic velocity-aligned streak vector (steep vertical at rest -> dramatic cyber back-swept perspective ribbons at speed!)
          vec3 velDir = normalize(vec3(-0.14, -1.0, 0.02) - uCarFwd * (0.45 + spd * 2.15));
          float dynLen = uStreakLen * (1.0 + spd * 1.45);
          vec3 viewDir = normalize(p + vec3(1e-4));
          vec3 sideAxis = cross(velDir, viewDir);
          float sLen = length(sideAxis);
          sideAxis = (sLen > 1e-4) ? (sideAxis / sLen) : uCamRight;
          vec3 wp = uCamPos + p + velDir * (dynLen * aCorner.y) + sideAxis * (aCorner.x * uStreakW * (1.0 + spd * 0.35));
          vCorner = aCorner;
          gl_Position = uViewProj * vec4(wp, 1.0);
        }
      `, `#version 300 es
        precision highp float;
        in vec2 vCorner;
        in float vNearFade;
        uniform float uAlpha;
        out vec4 fragColor;
        void main() {
          float edge = pow(max(1.0 - abs(vCorner.x), 0.0), 1.5);
          float tip = smoothstep(0.0, 0.22, vCorner.y) * smoothstep(1.0, 0.68, vCorner.y);
          float a = edge * tip * uAlpha * vNearFade;
          if (a < 0.015) discard;
          // Crisp luminous silver-cyan backlit cyber-rain core tapering to soft cool-mist edges
          vec3 rCol = mix(vec3(0.72, 0.84, 0.94), vec3(0.96, 0.98, 1.00), edge * tip);
          fragColor = vec4(rCol, a);
        }
      `);
    }

    clear() {
      for (const pool of [this.splashParts, this.mistParts, this.rippleParts, this.mudParts]) {
        for (const p of pool) p.alive = false;
      }
      this.splashMesh.upload(0);
      this.mistMesh.upload(0);
      this.rippleMesh.upload(0);
      this.mudMesh.upload(0);
    }

    shiftOrigin(dx, dy, dz) {
      for (const pool of [this.splashParts, this.mistParts, this.rippleParts, this.mudParts]) {
        for (const p of pool) if (p.alive) { p.x -= dx; p.y -= dy; p.z -= dz; }
      }
    }

    spawnBurst(car, waterCount, mudCount) {
      for (let i = 0; i < Math.min(waterCount, 34); i++) {
        this._spawnSplash(car, i % 4, true);
        this._spawnMist(car, 2 + (i % 2), true);
        if (i % 3 === 0) this._spawnRipple(car, i % 4);
      }
      for (let i = 0; i < Math.min(mudCount || 0, 20); i++) this._spawnMud(car, 2 + (i % 2));
      this.splashDropEnergy = Math.min(0.85, this.splashDropEnergy + 0.56);
    }

    _spawnSplash(car, wheelIdx, puddleBoost) {
      const p = this.splashParts[this.sCur];
      this.sCur = (this.sCur + 1) % MAX_SPLASH;
      const wp = car.getWheelWorldPos(wheelIdx);
      const side = (wheelIdx % 2 === 0) ? 1 : -1;
      const isRear = wheelIdx >= 2;
      const spdFac = Math.min(1.20, car.speed / 34.0);
      const depthFac = Math.max(0.32, car.puddleIntensity || 0.45);
      const driftFac = Math.min(1.0, Math.abs(car.driftAngle) * 2.0);
      p.alive = true; p.age = 0;
      // Tight wheel-hugging lifetime (0.08..0.14s) so spray hugs tires instead of trailing down the road!
      p.life = 0.085 + Math.random() * 0.055;
      p.size = (puddleBoost ? 0.20 : 0.14) * (isRear ? 1.15 : 0.80) * (0.72 + 0.42 * depthFac) + Math.random() * 0.06 + driftFac * 0.05;
      p.rot = (Math.random() - 0.5) * 2.6;
      p.x = wp[0] - car.fwd[0] * 0.14 + car.right[0] * side * 0.14 + (Math.random() - 0.5) * 0.10;
      p.y = wp[1] + 0.02 + Math.random() * 0.05;
      p.z = wp[2] - car.fwd[2] * 0.14 + car.right[2] * side * 0.14 + (Math.random() - 0.5) * 0.10;

      // Inherit 78% car forward momentum so fine rooster-tail spray clings cleanly behind spinning tires (matches demo!)
      const carryFwd = car.speed * 0.78 - (isRear ? 3.8 : 2.6) - Math.random() * 1.4;
      const outSpd = side * ((isRear ? 1.85 : 1.25) * (0.65 + 0.45 * spdFac) + driftFac * 1.85 + (puddleBoost ? 0.75 : 0.15) + Math.random() * 0.75);
      const upSpd = ((puddleBoost ? 1.35 : 0.88) * (isRear ? 1.08 : 0.75) + driftFac * 0.35 + Math.random() * 0.42) * (0.55 + 0.45 * depthFac);
      p.vx = car.fwd[0] * carryFwd + car.right[0] * outSpd;
      p.vy = upSpd;
      p.vz = car.fwd[2] * carryFwd + car.right[2] * outSpd;
    }

    _spawnMist(car, wheelIdx, puddleBoost) {
      const p = this.mistParts[this.mCur];
      this.mCur = (this.mCur + 1) % MAX_MIST;
      const wp = car.getWheelWorldPos(wheelIdx);
      const side = (wheelIdx % 2 === 0) ? 1 : -1;
      const depthFac = Math.max(0.30, car.puddleIntensity || 0.45);
      const driftFac = Math.min(1.0, Math.abs(car.driftAngle) * 1.9);
      p.alive = true; p.age = 0;
      // Short wheel-hugging translucent mist (ZERO giant trailing white cotton-balls!)
      p.life = 0.11 + Math.random() * 0.07;
      p.size = ((puddleBoost ? 0.28 : 0.20) + driftFac * 0.10 + Math.random() * 0.08) * (0.72 + 0.38 * depthFac);
      p.rot = (Math.random() - 0.5) * 1.4;
      p.x = wp[0] - car.fwd[0] * 0.22 + car.right[0] * side * 0.18 + (Math.random() - 0.5) * 0.10;
      p.y = wp[1] + 0.06 + Math.random() * 0.06;
      p.z = wp[2] - car.fwd[2] * 0.22 + car.right[2] * side * 0.18 + (Math.random() - 0.5) * 0.10;

      const carryFwd = car.speed * 0.72 - 3.2 - Math.random() * 1.2;
      const outSpd = side * (1.45 + driftFac * 1.55 + Math.random() * 0.65);
      p.vx = car.fwd[0] * carryFwd + car.right[0] * outSpd;
      p.vy = 0.42 + driftFac * 0.22 + Math.random() * 0.24;
      p.vz = car.fwd[2] * carryFwd + car.right[2] * outSpd;
    }

    _spawnRipple(car, wheelIdx) {
      const p = this.rippleParts[this.rCur];
      this.rCur = (this.rCur + 1) % MAX_RIPPLE;
      const wp = car.getWheelWorldPos(wheelIdx);
      p.alive = true; p.age = 0;
      p.life = 0.42 + Math.random() * 0.16;
      p.size = 0.32 + Math.random() * 0.18;
      p.rot = 0;
      p.x = wp[0]; p.y = car.pos[1] + 0.03; p.z = wp[2];
      p.vx = 0; p.vy = 0; p.vz = 0;
    }

    _spawnMud(car, wheelIdx) {
      const p = this.mudParts[this.dCur];
      this.dCur = (this.dCur + 1) % MAX_MUD;
      const wp = car.getWheelWorldPos(wheelIdx);
      const side = (wheelIdx % 2 === 0) ? 1 : -1;
      p.alive = true; p.age = 0;
      p.life = 0.32 + Math.random() * 0.18;
      p.size = 0.18 + Math.random() * 0.18;
      p.rot = Math.random() * Math.PI * 2;
      p.x = wp[0] + car.right[0] * side * 0.14 + (Math.random() - 0.5) * 0.18;
      p.y = wp[1] + 0.07;
      p.z = wp[2] + car.right[2] * side * 0.14 + (Math.random() - 0.5) * 0.18;

      const backSpd = 3.8 + car.speed * 0.20 + Math.random() * 2.0;
      const outSpd = side * (1.45 + Math.abs(car.driftAngle) * 3.2 + Math.random() * 1.1);
      p.vx = -car.fwd[0] * backSpd + car.right[0] * outSpd;
      p.vy = 2.45 + Math.random() * 1.35;
      p.vz = -car.fwd[2] * backSpd + car.right[2] * outSpd;
    }

    update(dt, car, qualityScale) {
      const cDt = Math.min(0.05, Math.max(0.001, dt));
      const drifting = Math.abs(car.driftAngle) > 0.12;
      const qS = qualityScale || 1.0;

      if (car.speed > 5.0) {
        const depthMul = 0.45 + 0.75 * Math.min(1.0, car.puddleIntensity || 0.4);
        const sRate = Math.max(2, Math.round((((car.inPuddle ? 8 : 3) + (drifting ? 5 : 0)) * depthMul) * qS));
        for (let i = 0; i < sRate; i++) this._spawnSplash(car, (i % 4 === 0) ? (i % 2) : (2 + (i % 2)), car.inPuddle || drifting);
        // Only emit translucent mist plumes when actually plowing through puddles or drifting (ZERO stray round white dots on normal damp road!)
        if (car.inPuddle || drifting) {
          const mCnt = Math.max(1, Math.round(((car.inPuddle ? 3 : 1) + (drifting ? 2 : 0)) * qS));
          for (let i = 0; i < mCnt; i++) this._spawnMist(car, 2 + (i % 2), car.inPuddle || drifting);
          this._spawnRipple(car, 2 + (this.rCur % 2));
        }
        // Kick up dark wet mud chunks on mud ruts & drifts
        const mudRate = drifting ? 6 : ((!car.inPuddle && car.speed > 12.0) ? 3 : 2);
        for (let i = 0; i < mudRate; i++) this._spawnMud(car, 2 + (i % 2));
        if (car.inPuddle && car.speed > 24.0) {
          this.splashDropEnergy = Math.min(0.68, this.splashDropEnergy + cDt * 0.42);
        }
      }
      this.splashDropEnergy = Math.max(0, this.splashDropEnergy - cDt * 1.32);

      const stepPool = (parts, mesh, grav, alphaMax, stretchX, maxH) => {
        let active = 0;
        for (const p of parts) {
          if (!p.alive) continue;
          p.age += cDt;
          if (p.age >= p.life) { p.alive = false; continue; }
          p.vy -= grav * cDt;
          p.x += p.vx * cDt; p.y += p.vy * cDt; p.z += p.vz * cDt;
          if (maxH !== null && p.y > maxH) p.y = maxH;
          if (p.y < car.pos[1] + 0.02) p.y = car.pos[1] + 0.02;
          p.rot += 2.6 * cDt;
          const t = p.age / p.life;
          const o = active * 4;
          mesh.dataA[o] = p.x; mesh.dataA[o+1] = p.y; mesh.dataA[o+2] = p.z;
          mesh.dataA[o+3] = p.size * (0.72 + t * 0.58);
          mesh.dataB[o] = p.rot;
          mesh.dataB[o+1] = Math.sin(Math.pow(t, 0.65) * Math.PI) * alphaMax;
          mesh.dataB[o+2] = stretchX;
          mesh.dataB[o+3] = 0;
          active++;
        }
        mesh.upload(active);
      };

      const maxSprayY = car.pos[1] + 0.46;
      stepPool(this.splashParts, this.splashMesh, 13.5, 0.44, 1.22, maxSprayY + 0.14);
      stepPool(this.mistParts,   this.mistMesh,   3.0,  0.13, 1.25, maxSprayY + 0.20);
      stepPool(this.rippleParts, this.rippleMesh, 0.0,  0.14, 1.00, null);
      stepPool(this.mudParts,    this.mudMesh,    15.5, 0.90, 1.12, maxSprayY + 0.18);
    }

    draw(renderer, time, inTunnel, speedNorm, themeId) {
      const gl = this.gl;
      const v = renderer.viewMat;
      if (!this._camRight) { this._camRight = new Float32Array(3); this._camUp = new Float32Array(3); }
      const camRight = this._camRight, camUp = this._camUp;
      camRight[0] = v[0]; camRight[1] = v[4]; camRight[2] = v[8];
      camUp[0]    = v[1]; camUp[1]    = v[5]; camUp[2]    = v[9];
      const spdN     = typeof speedNorm === 'number' ? speedNorm : 0.75;

      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);

      if (this.rippleMesh.instanceCount > 0) {
        const gp = this.groundRippleProg;
        gl.useProgram(gp.prog);
        gl.uniformMatrix4fv(gp.u.uViewProj, false, renderer.vpMat);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.waterRipple); gl.uniform1i(gp.u.uTex, 0);
        gl.bindVertexArray(this.rippleMesh.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, this.rippleMesh.count, this.rippleMesh.indexType, 0, this.rippleMesh.instanceCount);
      }

      const sp = this.spriteProg;
      gl.useProgram(sp.prog);
      gl.uniformMatrix4fv(sp.u.uViewProj, false, renderer.vpMat);
      gl.uniform3fv(sp.u.uCamRight, camRight);
      gl.uniform3fv(sp.u.uCamUp, camUp);

      if (this.mistMesh.instanceCount > 0) {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.waterMist); gl.uniform1i(sp.u.uTex, 0);
        gl.uniform3f(sp.u.uTint, 0.76, 0.81, 0.85); // Translucent overcast silver-grey tire spray plume
        gl.bindVertexArray(this.mistMesh.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, this.mistMesh.count, this.mistMesh.indexType, 0, this.mistMesh.instanceCount);
      }

      if (this.splashMesh.instanceCount > 0) {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.waterSplash); gl.uniform1i(sp.u.uTex, 0);
        gl.uniform3f(sp.u.uTint, 0.82, 0.87, 0.91); // Crisp overcast silver-white water splash droplets
        gl.bindVertexArray(this.splashMesh.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, this.splashMesh.count, this.splashMesh.indexType, 0, this.splashMesh.instanceCount);
      }

      if (this.mudMesh.instanceCount > 0) {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.mudClump); gl.uniform1i(sp.u.uTex, 0);
        gl.uniform3f(sp.u.uTint, 1.0, 0.95, 0.90);
        gl.bindVertexArray(this.mudMesh.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, this.mudMesh.count, this.mudMesh.indexType, 0, this.mudMesh.instanceCount);
      }

      // Item 4: Stratified Rain (Near fast short lens streaks + Mid faint slope rain, ZERO far streaks!)
      if (!inTunnel) {
        const rp = this.rainProg;
        const dens = renderer.quality.rainScale * PV.LIGHT.rainDensity;
        const opac = PV.LIGHT.rainOpacity;
        if (dens > 0.005 && opac > 0.005) {
          gl.useProgram(rp.prog);
          gl.uniformMatrix4fv(rp.u.uViewProj, false, renderer.vpMat);
          gl.uniform3fv(rp.u.uCamPos, renderer.camPos);
          gl.uniform3fv(rp.u.uCamRight, camRight);
          if (rp.u.uCarFwd) gl.uniform3fv(rp.u.uCarFwd, renderer.carFwd || FALLBACK_FWD);
          if (rp.u.uSpeedNorm) gl.uniform1f(rp.u.uSpeedNorm, spdN);
          gl.uniform1f(rp.u.uTime, time);

          // Tier 1: Fine silky near-lens cyber back-swept rain streaks
          gl.uniform1f(rp.u.uBoxW, 14.0);
          gl.uniform1f(rp.u.uBoxH, 11.5);
          gl.uniform1f(rp.u.uSpeed, 30.0);
          gl.uniform1f(rp.u.uStreakLen, 0.86);
          gl.uniform1f(rp.u.uStreakW, 0.0028);
          gl.uniform1f(rp.u.uAlpha, 0.30 * opac);
          gl.bindVertexArray(this.nearRainVao);
          gl.drawArrays(gl.TRIANGLES, 0, Math.min(MAX_RAIN_NEAR, Math.floor(MAX_RAIN_NEAR * dens)) * 6);

          // Tier 2: Midground fine angled alpine rain curtain
          gl.uniform1f(rp.u.uBoxW, 34.0);
          gl.uniform1f(rp.u.uBoxH, 17.0);
          gl.uniform1f(rp.u.uSpeed, 26.0);
          gl.uniform1f(rp.u.uStreakLen, 1.05);
          gl.uniform1f(rp.u.uStreakW, 0.0046);
          gl.uniform1f(rp.u.uAlpha, 0.17 * opac);
          gl.bindVertexArray(this.midRainVao);
          gl.drawArrays(gl.TRIANGLES, 0, Math.min(MAX_RAIN_MID, Math.floor(MAX_RAIN_MID * dens)) * 6);

          // Tier 3: Far atmospheric rain veil drifting across pine canopy
          gl.uniform1f(rp.u.uBoxW, 62.0);
          gl.uniform1f(rp.u.uBoxH, 24.0);
          gl.uniform1f(rp.u.uSpeed, 19.0);
          gl.uniform1f(rp.u.uStreakLen, 1.48);
          gl.uniform1f(rp.u.uStreakW, 0.0095);
          gl.uniform1f(rp.u.uAlpha, 0.085 * opac);
          gl.bindVertexArray(this.farRainVao);
          gl.drawArrays(gl.TRIANGLES, 0, Math.min(MAX_RAIN_FAR, Math.floor(MAX_RAIN_FAR * dens)) * 6);
        }

        // Ambient Biome-Matched Drifting Falling Leaves / Sakura Petals
        if (this.leafProg && this.leafVao) {
          const lp = this.leafProg;
          const pal = LEAF_PALS[themeId || 0] || LEAF_PALS[0];
          gl.useProgram(lp.prog);
          gl.uniformMatrix4fv(lp.u.uViewProj, false, renderer.vpMat);
          gl.uniform3fv(lp.u.uCamPos, renderer.camPos);
          gl.uniform3fv(lp.u.uCamRight, camRight);
          gl.uniform3fv(lp.u.uCamUp, camUp);
          gl.uniform1f(lp.u.uTime, time);
          gl.uniform3fv(lp.u.uLeafColA, pal[0]);
          gl.uniform3fv(lp.u.uLeafColB, pal[1]);
          gl.uniform3fv(lp.u.uLightColor, PV.LIGHT.color);
          gl.bindVertexArray(this.leafVao);
          gl.drawArrays(gl.TRIANGLES, 0, 180 * 6);
        }
      }

      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    }
  };
})(window);

