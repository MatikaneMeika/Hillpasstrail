(function (global) {
  'use strict';
  const PV = global.PV = global.PV || {};

  // =========================================================================
  // GAMEPLAY SCORING, STAGE RANK & MANGA MOBILE MULTI-TOUCH CONTROLLER
  // (Modularized for Standard + NextGen 3A parity, zero bloat in hud_audio.js)
  // =========================================================================
  const GM_COPY = {
    en: {
      modeStage: 'RALLY STAGE', modeCruise: 'FREE CRUISE',
      driftBank: 'DRIFT BANK', apexClip: 'APEX CLIP', crestAir: 'CREST AIR',
      splash: 'SPLASH THROUGH', cleanSec: 'CLEAN SECTOR', cpClear: 'SPLIT CLEAR',
      wallBreak: 'WALL HIT • CHAIN LOST',
      steerL: 'L', steerR: 'R', gas: 'GAS', brake: 'BRAKE', drift: 'DRIFT', boost: 'NOS',
      autoGasTag: 'AUTO',
    },
    zh: {
      modeStage: '赛段竞速', modeCruise: '自由巡航',
      driftBank: '漂移结算', apexClip: '精准切弯', crestAir: '飞坡腾空',
      splash: '破浪涉水', cleanSec: '无撞赛段', cpClear: '分段通过',
      wallBreak: '擦墙中断连击',
      steerL: 'L', steerR: 'R', gas: '油门', brake: '刹车', drift: '漂移', boost: '氮气',
      autoGasTag: '自动',
    },
    ja: {
      modeStage: 'ラリー競技', modeCruise: 'フリー走行',
      driftBank: 'ドリフト確定', apexClip: 'エイペックス', crestAir: 'クレストジャンプ',
      splash: 'スプラッシュ', cleanSec: 'クリーン区間', cpClear: 'スプリット通過',
      wallBreak: '壁接触・チェイン途切れ',
      steerL: 'L', steerR: 'R', gas: 'アクセル', brake: 'ブレーキ', drift: 'ドリフト', boost: 'ブースト',
      autoGasTag: 'AUTO',
    },
  };

  class GameplayController {
    constructor() {
      this.mode = 'stage';
      try {
        const saved = localStorage.getItem('hpt_game_mode');
        if (saved === 'stage' || saved === 'cruise') this.mode = saved;
      } catch (_) {}
      this.bestScore = 0;
      try { this.bestScore = Math.max(0, Number(localStorage.getItem('hpt_best_score')) || 0); } catch (_) {}
      this._elRank = document.getElementById('rankBadge');
      this._elToast = document.getElementById('eventToast');
      this._elToastTag = document.getElementById('eventToastTag');
      this._elToastPts = document.getElementById('eventToastPts');
      this._elSplit = document.getElementById('splitBadge');
      this._lastRank = '';
      this._lastSplitTxt = '';
      this.reset();
    }

    setMode(m, car) {
      this.mode = (m === 'cruise') ? 'cruise' : 'stage';
      try { localStorage.setItem('hpt_game_mode', this.mode); } catch (_) {}
      if (car) {
        car.gameMode = this.mode;
        if (this.mode === 'cruise') car.boost = 100.0;
      }
      document.body.classList.toggle('mode-cruise', this.mode === 'cruise');
      return this.mode;
    }

    reset() {
      this.rank = 'D';
      this.cleanSector = true;
      this.lastCpTime = 0;
      this.lastSplitDelta = null;
      this.apexCd = 0;
      this.crestCd = 0;
      this.splashCd = 0;
      this.toastTimer = 0;
      this.eventsTriggered = 0;
      this.lastEventName = '';
      if (this._elToast) this._elToast.classList.remove('show');
      if (this._elSplit) { this._elSplit.textContent = ''; this._elSplit.classList.remove('show', 'fast', 'slow'); }
      this._lastSplitTxt = '';
    }

    _copy(lang) { return GM_COPY[lang] || GM_COPY.en; }

    _pushToast(tag, ptsText, tone) {
      this.toastTimer = 1.65;
      this.lastEventName = tag;
      this.eventsTriggered++;
      if (!this._elToast) return;
      if (this._elToastTag) this._elToastTag.textContent = tag;
      if (this._elToastPts) this._elToastPts.textContent = ptsText || '';
      this._elToast.setAttribute('data-tone', tone || 'orange');
      this._elToast.classList.remove('show');
      // Force reflow only when re-triggering an active toast for crisp manga punch
      void this._elToast.offsetWidth;
      this._elToast.classList.add('show');
    }

    _award(car, basePts, boostAdd, tag, tone) {
      const mul = Math.max(1.0, car.driftCombo || 1.0);
      const total = Math.round(basePts * (0.75 + 0.25 * mul));
      car.driftScore += total;
      if (this.mode === 'stage') {
        car.boost = Math.min(100.0, (car.boost || 0) + boostAdd);
      }
      this._pushToast(tag, `+${total}`, tone || 'orange');
    }

    update(dt, car, track, simTime, audio, lang) {
      const c = this._copy(lang);
      car.gameMode = this.mode;
      this.apexCd = Math.max(0, this.apexCd - dt);
      this.crestCd = Math.max(0, this.crestCd - dt);
      this.splashCd = Math.max(0, this.splashCd - dt);

      if (this.toastTimer > 0) {
        this.toastTimer = Math.max(0, this.toastTimer - dt);
        if (this.toastTimer <= 0 && this._elToast) this._elToast.classList.remove('show');
      }

      // 1. Drift Chain Banked
      if (car.lastBankedPts > 0) {
        const bPts = car.lastBankedPts;
        car.lastBankedPts = 0;
        if (bPts >= 120) this._pushToast(c.driftBank, `+${bPts}`, 'orange');
      }

      // 2. Wall Impact (breaks clean sector; warns if active chain lost)
      if (car.wallHitEvent) {
        this.cleanSector = false;
        if (car.lostBankPts >= 120) {
          this._pushToast(c.wallBreak, `-${car.lostBankPts}`, 'danger');
        }
        car.wallHitEvent = false;
        car.lostBankPts = 0;
      }

      // 3. Organic Rally Skill Events (only while actively driving at speed)
      if (!car.autoDemo && car.speed > 18.0) {
        const curv = car.roadCurv || 0;
        const maxLat = car.maxLatAllowed || 4.0;
        // Apex Clip: hugging the inside of a real curve at speed without scraping wall
        if (this.apexCd <= 0 && Math.abs(curv) > 0.0085 && car.speed > 21.0) {
          const insideSide = curv > 0 ? -1 : 1;
          const insideDepth = car.lat * insideSide;
          if (insideDepth > 1.15 && Math.abs(car.lat) < maxLat - 0.32) {
            this.apexCd = 3.2;
            this._award(car, 350, 10.0, c.apexClip, 'cyan');
            if (audio && audio.playUiSound) audio.playUiSound('select');
          }
        }
        // Crest Airtime: unloading suspension over a mountain crest at high speed
        if (this.crestCd <= 0 && (car.crestG || 0) < -0.50 && car.speed > 25.0) {
          this.crestCd = 3.6;
          this._award(car, 300, 9.0, c.crestAir, 'orange');
        }
        // Splash Mastery: charging cleanly through puddles / lake ford
        if (this.splashCd <= 0 && car.inPuddle && car.speed > 24.0 && Math.abs(car.driftAngle) < 0.48) {
          this.splashCd = 4.2;
          this._award(car, 250, 7.0, c.splash, 'cyan');
        }
      }

      // 4. Checkpoint Split & Clean Sector Bonus
      if (car.checkpointEvent) {
        car.checkpointEvent = false;
        const secDur = Math.max(1.0, simTime - this.lastCpTime);
        this.lastCpTime = simTime;
        const parSec = 11.8; // 400m @ ~122 km/h target rally pace
        const delta = secDur - parSec;
        this.lastSplitDelta = Number(delta.toFixed(2));
        const speedBonus = Math.max(150, Math.round(car.speed * 12));
        const cleanBonus = this.cleanSector ? 500 : 0;
        car.driftScore += speedBonus + cleanBonus;
        if (this.mode === 'stage') car.boost = Math.min(100.0, car.boost + (this.cleanSector ? 24.0 : 14.0));
        this._pushToast(this.cleanSector ? c.cleanSec : c.cpClear, `+${speedBonus + cleanBonus}`, this.cleanSector ? 'gold' : 'orange');
        this.cleanSector = true;
        if (this._elSplit) {
          const sign = delta <= 0 ? '' : '+';
          const txt = `Δ ${sign}${delta.toFixed(1)}s`;
          if (this._lastSplitTxt !== txt) {
            this._lastSplitTxt = txt;
            this._elSplit.textContent = txt;
          }
          this._elSplit.classList.add('show');
          this._elSplit.classList.toggle('fast', delta <= 0);
          this._elSplit.classList.toggle('slow', delta > 0);
        }
      }

      // 5. Live Stage Rank & Best Score Persistence
      const sc = car.driftScore || 0;
      const nextRank = sc >= 18000 ? 'S+' : (sc >= 10000 ? 'S' : (sc >= 5500 ? 'A' : (sc >= 2500 ? 'B' : (sc >= 800 ? 'C' : 'D'))));
      this.rank = nextRank;
      if (this._elRank && this._lastRank !== nextRank) {
        this._lastRank = nextRank;
        this._elRank.textContent = nextRank;
        this._elRank.setAttribute('data-rank', nextRank);
      }
      if (sc > this.bestScore) {
        this.bestScore = sc;
        try { localStorage.setItem('hpt_best_score', String(sc)); } catch (_) {}
      }
    }

    getState() {
      return {
        mode: this.mode,
        rank: this.rank,
        bestScore: this.bestScore,
        cleanSector: this.cleanSector,
        lastSplitDelta: this.lastSplitDelta,
        eventsTriggered: this.eventsTriggered,
        lastEventName: this.lastEventName,
      };
    }
  }

  class MobileTouchController {
    constructor(callbacks) {
      this._cb = callbacks || {};
      this.enabled = false;
      this.autoGas = true;
      try {
        const saved = localStorage.getItem('hpt_mobile_ctrl');
        if (saved === '1' || saved === '0') {
          this.enabled = saved === '1';
        } else if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
          this.enabled = true;
        }
        const savedAg = localStorage.getItem('hpt_mobile_autogas');
        if (savedAg === '0' || savedAg === '1') this.autoGas = savedAg === '1';
      } catch (_) {}

      this.steer = 0;
      this.throttle = 0;
      this.brake = 0;
      this.handbrake = false;
      this.boost = false;

      this._steerPtr = null;
      this._btnPtrs = new Map(); // pointerId -> action string
      this._root = document.getElementById('mobileControls');
      this._steerPad = document.getElementById('mSteerPad');
      this._steerL = document.getElementById('mSteerL');
      this._steerR = document.getElementById('mSteerR');
      this._btnGas = document.getElementById('mBtnGas');
      this._btnBrake = document.getElementById('mBtnBrake');
      this._btnDrift = document.getElementById('mBtnDrift');
      this._btnBoost = document.getElementById('mBtnBoost');
      this._btnCam = document.getElementById('mBtnCam');
      this._btnPause = document.getElementById('mBtnPause');

      this._wireEvents();
      this.setEnabled(this.enabled, true);
      this.setAutoGas(this.autoGas, true);
    }

    setEnabled(on, silent) {
      this.enabled = !!on;
      document.body.classList.toggle('mobile-mode', this.enabled);
      if (this._root) this._root.setAttribute('aria-hidden', this.enabled ? 'false' : 'true');
      if (!this.enabled) this.clearAll();
      if (!silent) {
        try { localStorage.setItem('hpt_mobile_ctrl', this.enabled ? '1' : '0'); } catch (_) {}
      }
      return this.enabled;
    }

    setAutoGas(on, silent) {
      this.autoGas = !!on;
      if (this._btnGas) this._btnGas.classList.toggle('auto-on', this.autoGas);
      if (!silent) {
        try { localStorage.setItem('hpt_mobile_autogas', this.autoGas ? '1' : '0'); } catch (_) {}
      }
      return this.autoGas;
    }

    applyLabels(lang) {
      const c = GM_COPY[lang] || GM_COPY.en;
      const setT = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
      setT('mLblGas', c.gas);
      setT('mLblBrake', c.brake);
      setT('mLblDrift', c.drift);
      setT('mLblBoost', c.boost);
      setT('mAutoTag', c.autoGasTag);
    }

    clearAll() {
      this._steerPtr = null;
      this._btnPtrs.clear();
      this.steer = 0; this.throttle = 0; this.brake = 0; this.handbrake = false; this.boost = false;
      [this._steerL, this._steerR, this._btnGas, this._btnBrake, this._btnDrift, this._btnBoost].forEach((el) => {
        if (el) el.classList.remove('pressed');
      });
    }

    _updateSteerFromClientX(clientX) {
      if (!this._steerPad) return;
      const rect = this._steerPad.getBoundingClientRect();
      if (rect.width <= 1) return;
      const norm = ((clientX - rect.left) / rect.width) * 2.0 - 1.0; // -1..+1
      // Crisp deadzone in middle 10%, saturates cleanly to full lock past 68%
      let val = 0;
      if (Math.abs(norm) > 0.10) {
        val = Math.sign(norm) * Math.min(1.0, (Math.abs(norm) - 0.10) / 0.58);
      }
      this.steer = val;
      if (this._steerL) this._steerL.classList.toggle('pressed', val < -0.12);
      if (this._steerR) this._steerR.classList.toggle('pressed', val > 0.12);
    }

    _recomputeButtons() {
      let gas = false, brk = false, drf = false, bst = false;
      for (const act of this._btnPtrs.values()) {
        if (act === 'gas') gas = true;
        else if (act === 'brake') brk = true;
        else if (act === 'drift') drf = true;
        else if (act === 'boost') bst = true;
      }
      this.throttle = gas ? 1.0 : 0.0;
      this.brake = brk ? 1.0 : 0.0;
      this.handbrake = drf;
      this.boost = bst;
      if (this._btnGas) this._btnGas.classList.toggle('pressed', gas);
      if (this._btnBrake) this._btnBrake.classList.toggle('pressed', brk);
      if (this._btnDrift) this._btnDrift.classList.toggle('pressed', drf);
      if (this._btnBoost) this._btnBoost.classList.toggle('pressed', bst);
    }

    _wireEvents() {
      if (this._steerPad) {
        this._steerPad.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (this._steerPtr !== null) return;
          this._steerPtr = e.pointerId;
          try { this._steerPad.setPointerCapture(e.pointerId); } catch (_) {}
          this._updateSteerFromClientX(e.clientX);
        });
        this._steerPad.addEventListener('pointermove', (e) => {
          if (e.pointerId !== this._steerPtr) return;
          e.preventDefault();
          this._updateSteerFromClientX(e.clientX);
        });
        const releaseSteer = (e) => {
          if (e.pointerId !== this._steerPtr) return;
          this._steerPtr = null;
          this.steer = 0;
          if (this._steerL) this._steerL.classList.remove('pressed');
          if (this._steerR) this._steerR.classList.remove('pressed');
        };
        this._steerPad.addEventListener('pointerup', releaseSteer);
        this._steerPad.addEventListener('pointercancel', releaseSteer);
        this._steerPad.addEventListener('lostpointercapture', releaseSteer);
      }

      const bindBtn = (el, act) => {
        if (!el) return;
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this._btnPtrs.set(e.pointerId, act);
          try { el.setPointerCapture(e.pointerId); } catch (_) {}
          this._recomputeButtons();
        });
        const rel = (e) => {
          if (!this._btnPtrs.has(e.pointerId)) return;
          this._btnPtrs.delete(e.pointerId);
          this._recomputeButtons();
        };
        el.addEventListener('pointerup', rel);
        el.addEventListener('pointercancel', rel);
        el.addEventListener('lostpointercapture', rel);
      };
      bindBtn(this._btnGas, 'gas');
      bindBtn(this._btnBrake, 'brake');
      bindBtn(this._btnDrift, 'drift');
      bindBtn(this._btnBoost, 'boost');

      if (this._btnCam) {
        this._btnCam.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (this._cb.onToggleCam) this._cb.onToggleCam();
        });
      }
      if (this._btnPause) {
        this._btnPause.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (this._cb.onOpenSettings) this._cb.onOpenSettings();
        });
      }

      window.addEventListener('blur', () => this.clearAll());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearAll(); });
    }

    mergeInput(out, settingsOpen) {
      if (!this.enabled || settingsOpen) return;
      if (Math.abs(this.steer) > 0.01) out.steer = this.steer;
      if (this.throttle > 0) out.throttle = Math.max(out.throttle, this.throttle);
      else if (this.autoGas && this.brake < 0.05 && out.brake < 0.05) out.throttle = Math.max(out.throttle, 0.92);
      if (this.brake > 0) out.brake = Math.max(out.brake, this.brake);
      if (this.handbrake) out.handbrake = true;
      if (this.boost) out.boost = true;
    }

    getState() {
      return {
        enabled: this.enabled,
        autoGas: this.autoGas,
        steer: Number(this.steer.toFixed(2)),
        throttle: this.throttle,
        brake: this.brake,
        handbrake: this.handbrake,
        boost: this.boost,
      };
    }
  }

  PV.GameplayController = GameplayController;
  PV.MobileTouchController = MobileTouchController;
})(window);
