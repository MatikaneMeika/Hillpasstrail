// === hud_audio.js ===
// V7 Deep-Bass Spatial Rally Audio + English Co-Driver Pace Notes + Manga Editorial Pause/Settings UI + ZH/EN/JA i18n
(function (global) {
  'use strict';

  const PV = (global.PV = global.PV || {});

  // =========================================================================
  // 1. TRILINGUAL UI LOCALIZATION (ZH / EN / JA) — CO-DRIVER VOICE UNIFIED EN-US
  // =========================================================================
  const I18N = {
    zh: {
      langName: '简体中文',
      langShort: 'ZH',
      brandTitle: '山道拉力 · HILL PASS TRAIL',
      pauseSub: '已暂停 // 漫画山道拉力赛段',
      driftScore: '漂移得分',
      perfectDrift: '完美漂移',
      nextCp: '下一检查点',
      boost: '氮气加速',
      boostActive: 'MAX 加速中',
      boostReady: 'MAX 就绪',
      mapTitle: '山道拉力赛段',
      speed: '时速',
      hintDrift: '手刹漂移',
      hintBoost: '氮气',
      hintView: '视角',
      hintStage: '新赛道',
      hintPause: '设置',
      settingsBtn: '设置',
      cam: { chase: '车外视角', cockpit: '驾驶舱' },
      time: { morning: '清晨', noon: '正午', golden: '夕阳', dusk: '黄昏', bluehour: '夜幕', dawn: '黎明' },
      weather: { overcast: '雨天', drizzle: '细雨', storm_break: '云隙光', goldmist: '金雾', clear: '晴朗', mist: '山雾', downpour: '暴雨', dusk: '暮雨', dawn: '晨雾' },
      filter: { cinema: '电影', verdant: '森系', golden: '胶片金', cyber: '赛博', film: '胶片', noir: '黑白' },
      qual: {
        low:     { name: '流畅 LOW',    desc: '1.0x 渲染与轻量阴影' },
        med:     { name: '均衡 MED',    desc: '1.15x • 2x MSAA • 1.5K影' },
        high:    { name: '极致 ULTRA',  desc: '1.5x • 4x MSAA • 湿滑SSR' },
        xultra: { name: '次世代 XULTRA', desc: '1.75x • 4K阴影 • 全反射' },
      },
      ui: {
        resume: '继续驾驶', resumeSub: '立即解除暂停返回山道赛段',
        graphics: '画面渲染', graphicsSub: '画质预设、分辨率、阴影与后期',
        audio: '音效与路书', audioSub: '浑厚低频声浪、空间混响与英文领航',
        driving: '驾驶与界面', drivingSub: '视角、视野FOV、路书指示与天气',
        language: '界面语言', languageSub: '简体中文 / English / 日本語',
        newStage: '生成新赛道', newStageSub: '切换全新随机山道地形种子',
        gfxTitle: '画面渲染与后期管线', gfxDesc: '实时调节 WebGL2 画质预设与各项细节开关',
        audTitle: '空间声浪与英文领航路书', audDesc: '低频水平对置浑厚声浪 • 场景平滑过渡 • 纯英文路书',
        drvTitle: '驾驶视角、HUD 与赛段氛围', drvDesc: '自定义视野、惯性HUD、屏幕路书指向与天气时段',
        langTitle: '界面显示语言', langDesc: '实时切换全界面与赛段名称（领航语音统一为纯英文）',
        langVoiceNote: '领航语音规范：已移除冗余多语语音包，统一采用标准纯英文 (EN-US) STAGE 拉力路书播报',
        optDpr: '渲染倍率', optShadow: '阴影贴图精度', optSsr: '湿滑路面 SSR 反射', optKuw: '三渲二油画笔触',
        optLens: '镜头雨滴与光学', optBloom: 'HDR 电影泛光', optFilter: '画面色彩风格',
        masterVol: '主音量', engineVol: '引擎与低频排气', envVol: '环境风声与雨声', voiceVol: '英文领航音量',
        spatialToggle: '空间混响与车厢隔音', optPaceVoice: '英文路书语音播报', optCallTiming: '路书提前量',
        optCam: '驾驶视角', optFov: '视野范围 (FOV)', optPaceHud: '屏幕极简路书指向', optHudSway: 'HUD 惯性微晃', optShowFps: '帧率常驻显示',
        optGameMode: '游戏模式', modeStage: '赛段竞速', modeCruise: '自由巡航', optMobileCtrl: '手机触控模式', optMobileAutoGas: '触控自动油门',
        optWeather: '实时天气', optTime: '时段光照',
        timing: { early: '提前', normal: '标准', late: '紧凑' },
        on: '开启', off: '关闭',
        footResume: '继续驾驶', footTabs: '切换分页', footMute: '静音', footView: '视角',
        footStatus: 'WEBGL2 三渲二×写实拉力引擎 // V7',
        space: { outdoor: '户外山谷', bridge: '跨谷大桥', tunnel: '山体隧道' },
        mic: { chase: '车外麦克风', cockpit: '车内驾驶舱' },
        surf: { gravel: '湿滑碎石', snow: '高海拔雪坡', bridge: '桥面伸缩缝', tunnel: '隧道湿沥青', mud: '涉水泥浆' },
        spaceLbl: '声学空间', micLbl: '拾音位置', surfLbl: '路面反馈', bassLbl: '低频增益',
      },
      segments: {
        'ALPINE PASS': '阿尔卑斯垭口', 'SWITCHBACK CLIMB': '发卡弯爬坡', 'SWITCHBACK PLUNGE': '发卡弯急降',
        'RIDGE CREST JUMP': '山脊飞坡', 'PINE HAMLET': '松林村落', 'TIMBER VILLAGE': '木屋山村',
        'WILDFLOWER GLEN': '野花幽谷', 'BASALT GORGE': '玄武岩峡谷', 'VALLEY ROLLERS': '河谷起伏道',
        'ALPINE PEAK ASCENT': '雪峰攀升道', 'SUMMIT PASS CREST': '雪顶垭口', 'GLACIER SCREE DROP': '冰川碎石急降',
        'LAKESIDE LOOP': '环湖公路', 'ALPINE LAKESIDE BAY': '高山湖湾', 'LAKESIDE RIVER FORD': '湖畔涉水滩',
        'CLIFFSIDE CLOUD EDGE': '云崖绝壁', 'ABYSS CLIFF PLUNGE': '深渊悬崖急降', 'SKYLINE LEDGE CREST': '天际崖脊',
        'GOLDEN BIRCH VALLEY': '金色白桦谷', 'BIRCH CREST CHICANE': '白桦连续弯', 'BIRCH CREEK HOLLOW': '白桦溪谷',
        'BRICK KILN QUARRY': '红砖窑采石场', 'IRON MILL GORGE': '铁厂峡谷', 'QUARRY BENCH CREST': '矿阶高坡',
        'BAMBOO SHRINE PASS': '竹林神社山道', 'MISTY CEDAR SHRINE': '雾杉神社', 'TORII VALLEY DROP': '鸟居幽谷急降',
        'CREEK TRUSS BRIDGE': '溪谷桁架桥', 'IRON ARCH BRIDGE': '铁拱跨谷桥', 'QUARRY VIADUCT SPAN': '矿谷高架桥',
        'VALLEY ARCH BRIDGE': '山谷石拱桥', 'MOUNTAIN TUNNEL': '穿山岩石隧道', 'CEDAR PASS TUNNEL': '杉岭长隧道',
      },
    },
    en: {
      langName: 'English',
      langShort: 'EN',
      brandTitle: 'HILL PASS TRAIL',
      pauseSub: 'PAUSED // MOUNTAIN RALLY STAGE',
      driftScore: 'DRIFT SCORE',
      perfectDrift: 'PERFECT DRIFT',
      nextCp: 'NEXT CHECKPOINT',
      boost: 'BOOST',
      boostActive: 'MAX BOOST',
      boostReady: 'MAX READY',
      mapTitle: 'Hill Pass Trail',
      speed: 'SPEED',
      hintDrift: 'DRIFT',
      hintBoost: 'BOOST',
      hintView: 'VIEW',
      hintStage: 'NEW STAGE',
      hintPause: 'MENU',
      settingsBtn: 'SETTINGS',
      cam: { chase: 'CHASE', cockpit: 'COCKPIT' },
      time: { morning: 'MORNING', noon: 'NOON', golden: 'GOLDEN', dusk: 'DUSK', bluehour: 'NIGHT', dawn: 'DAWN' },
      weather: { overcast: 'RAIN', drizzle: 'DRIZZLE', storm_break: 'GODRAY', goldmist: 'GOLDMIST', clear: 'CLEAR', mist: 'MIST', downpour: 'STORM', dusk: 'DUSK', dawn: 'DAWN' },
      filter: { cinema: 'CINEMA', verdant: 'VERDANT', golden: 'GOLDEN', cyber: 'CYBER', film: 'FILM', noir: 'NOIR' },
      qual: {
        low:     { name: 'LOW',    desc: '1.0x scale & fast shadows' },
        med:     { name: 'MED',    desc: '1.15x • 2x MSAA • 1.5K' },
        high:    { name: 'ULTRA',  desc: '1.5x • 4x MSAA • Wet SSR' },
        xultra: { name: 'XULTRA', desc: '1.75x • 4K • Full SSR' },
      },
      ui: {
        resume: 'RESUME DRIVE', resumeSub: 'Return immediately to the rally stage',
        graphics: 'GRAPHICS', graphicsSub: 'Presets, render scale, shadows & post-FX',
        audio: 'AUDIO & NOTES', audioSub: 'Deep boxer bass, reverb & English co-driver',
        driving: 'DRIVING & HUD', drivingSub: 'Camera, FOV, pace banner, weather & time',
        language: 'LANGUAGE', languageSub: '简体中文 / English / 日本語',
        newStage: 'NEW STAGE', newStageSub: 'Generate a fresh mountain rally seed',
        gfxTitle: 'GRAPHICS & RENDER PIPELINE', gfxDesc: 'Live WebGL2 quality preset & fine controls',
        audTitle: 'SPATIAL AUDIO & CO-DRIVER', audDesc: 'Deep boxer bass, smooth space transitions & English pace notes',
        drvTitle: 'DRIVING, CAMERA & HUD', drvDesc: 'Camera FOV, inertial HUD, pace signpost & atmosphere',
        langTitle: 'INTERFACE LANGUAGE', langDesc: 'Instant HUD & stage localization (Co-Driver voice is unified English)',
        langVoiceNote: 'CO-DRIVER VOICE: UNIFIED ENGLISH (EN-US) STAGE RALLY PACE NOTES',
        optDpr: 'RENDER SCALE', optShadow: 'SHADOW MAP', optSsr: 'WET SSR REFLECTION', optKuw: 'PAINTERLY KUWAHARA',
        optLens: 'LENS OPTICS', optBloom: 'HDR BLOOM', optFilter: 'COLOR GRADE',
        masterVol: 'MASTER VOLUME', engineVol: 'ENGINE & BASS', envVol: 'ENVIRONMENT & NATURE', voiceVol: 'CO-DRIVER (EN)',
        spatialToggle: 'SPATIAL REVERB & CABIN', optPaceVoice: 'ENGLISH PACE NOTES', optCallTiming: 'PACE CALL TIMING',
        optCam: 'CAMERA VIEW', optFov: 'FIELD OF VIEW', optPaceHud: 'ON-SCREEN PACE BANNER', optHudSway: 'HUD INERTIAL SWAY', optShowFps: 'SHOW FPS COUNTER',
        optGameMode: 'GAME MODE', modeStage: 'RALLY STAGE', modeCruise: 'FREE CRUISE', optMobileCtrl: 'MOBILE TOUCH UI', optMobileAutoGas: 'TOUCH AUTO-GAS',
        optWeather: 'WEATHER', optTime: 'TIME OF DAY',
        timing: { early: 'EARLY', normal: 'NORMAL', late: 'LATE' },
        on: 'ON', off: 'OFF',
        footResume: 'RESUME', footTabs: 'TABS', footMute: 'MUTE', footView: 'CAMERA',
        footStatus: 'WEBGL2 CEL×REALISTIC RALLY ENGINE // V7',
        space: { outdoor: 'OUTDOOR VALLEY', bridge: 'GORGE BRIDGE', tunnel: 'MOUNTAIN TUNNEL' },
        mic: { chase: 'EXTERIOR CHASE', cockpit: 'INTERIOR CABIN' },
        surf: { gravel: 'WET GRAVEL', snow: 'ALPINE SNOW', bridge: 'BRIDGE JOINTS', tunnel: 'TUNNEL ASPHALT', mud: 'WATER SPLASH' },
        spaceLbl: 'SPACE', micLbl: 'MIC', surfLbl: 'SURFACE', bassLbl: 'LOW-END',
      },
      segments: {},
    },
    ja: {
      langName: '日本語',
      langShort: 'JA',
      brandTitle: 'ヒルパス・トレイル',
      pauseSub: '一時停止 // マウンテン・ラリーステージ',
      driftScore: 'ドリフトスコア',
      perfectDrift: 'パーフェクトドリフト',
      nextCp: '次のチェックポイント',
      boost: 'ブースト',
      boostActive: 'MAX ブースト中',
      boostReady: 'MAX 準備完了',
      mapTitle: 'ヒルパス峠',
      speed: '速度',
      hintDrift: 'ドリフト',
      hintBoost: 'ブースト',
      hintView: '視点',
      hintStage: '新ステージ',
      hintPause: '設定',
      settingsBtn: '設定',
      cam: { chase: '車外視点', cockpit: '運転席' },
      time: { morning: '朝', noon: '昼', golden: '夕暮れ', dusk: '黄昏', bluehour: '夜間', dawn: '夜明け' },
      weather: { overcast: '雨', drizzle: '小雨', storm_break: '薄明光線', goldmist: '金霧', clear: '快晴', mist: '霧', downpour: '豪雨', dusk: '夕雨', dawn: '朝霧' },
      filter: { cinema: 'シネマ', verdant: 'グリーン', golden: 'フィルム', cyber: 'サイバー', film: 'クラシック', noir: 'ノワール' },
      qual: {
        low:     { name: '軽量 LOW',    desc: '1.0x 解像度・軽量シャドウ' },
        med:     { name: '標準 MED',    desc: '1.15x • 2x MSAA • 1.5K' },
        high:    { name: '最高 ULTRA',  desc: '1.5x • 4x MSAA • 濡れSSR' },
        xultra: { name: '次世代 XULTRA', desc: '1.75x • 4K影 • フルSSR' },
      },
      ui: {
        resume: 'ドライブ再開', resumeSub: 'すぐにラリーステージへ戻る',
        graphics: 'グラフィック', graphicsSub: '品質プリセット・解像度・影・ポスト処理',
        audio: '音響＆ペースノート', audioSub: '重低音サウンド・空間残響・英語コドライバー',
        driving: '運転＆HUD', drivingSub: '視点・視野角FOV・ペース表示・天候',
        language: '表示言語', languageSub: '简体中文 / English / 日本語',
        newStage: '新ステージ生成', newStageSub: '新しい山岳ラリーコースを生成',
        gfxTitle: 'グラフィック＆レンダリング', gfxDesc: 'WebGL2 品質プリセットと詳細設定を即時反映',
        audTitle: '空間音響＆英語コドライバー', audDesc: '重低音ボクサー排気・滑らかな空間遷移・英語ペースノート',
        drvTitle: '視点・HUD・ステージ環境', drvDesc: 'カメラFOV、慣性HUD、画面ペース指示、天候・時間帯',
        langTitle: 'インターフェース言語', langDesc: 'HUD・ステージ名を即時切替（音声は英語統一）',
        langVoiceNote: 'コドライバー音声：標準英語 (EN-US) STAGE ラリーペースノートに統一',
        optDpr: '解像度倍率', optShadow: 'シャドウ解像度', optSsr: '濡れ路面 SSR 反射', optKuw: '絵画調クワハラ処理',
        optLens: 'レンズ光学・水滴', optBloom: 'HDR ブルーム', optFilter: 'カラーグレーディング',
        masterVol: 'マスター音量', engineVol: 'エンジン＆重低音', envVol: '環境・自然音', voiceVol: 'コドライバー(EN)',
        spatialToggle: '空間残響＆車内遮音', optPaceVoice: '英語ペースノート音声', optCallTiming: 'コールタイミング',
        optCam: 'カメラ視点', optFov: '視野角 (FOV)', optPaceHud: '画面ペースノート表示', optHudSway: 'HUD 慣性揺れ', optShowFps: 'FPS 常時表示',
        optGameMode: 'ゲームモード', modeStage: 'ラリー競技', modeCruise: 'フリー走行', optMobileCtrl: 'モバイル操作UI', optMobileAutoGas: 'オートアクセル',
        optWeather: '天候', optTime: '時間帯',
        timing: { early: '早め', normal: '標準', late: '直前' },
        on: 'オン', off: 'オフ',
        footResume: '再開', footTabs: 'タブ切替', footMute: 'ミュート', footView: '視点',
        footStatus: 'WEBGL2 トゥーン×リアル ラリーエンジン // V7',
        space: { outdoor: '屋外山岳', bridge: '渓谷橋梁', tunnel: '山岳トンネル' },
        mic: { chase: '車外マイク', cockpit: '車内コックピット' },
        surf: { gravel: '湿潤グラベル', snow: '雪道・氷雪', bridge: '橋梁ジョイント', tunnel: 'トンネル舗装', mud: '水たまり飛沫' },
        spaceLbl: '空間', micLbl: 'マイク', surfLbl: '路面', bassLbl: '低音ブースト',
      },
      segments: {
        'ALPINE PASS': 'アルプス峠', 'SWITCHBACK CLIMB': 'つづら折り登坂', 'SWITCHBACK PLUNGE': 'つづら折り急降下',
        'RIDGE CREST JUMP': '尾根ジャンプ', 'PINE HAMLET': '松林の集落', 'TIMBER VILLAGE': '木造山村',
        'WILDFLOWER GLEN': '野花の渓谷', 'BASALT GORGE': '玄武岩峡谷', 'VALLEY ROLLERS': '渓谷うねり道',
        'ALPINE PEAK ASCENT': '雪峰アセント', 'SUMMIT PASS CREST': '山頂峠', 'GLACIER SCREE DROP': '氷河ガレ場下り',
        'LAKESIDE LOOP': '湖畔周回路', 'ALPINE LAKESIDE BAY': '高山湖湾', 'LAKESIDE RIVER FORD': '湖畔の浅瀬',
        'CLIFFSIDE CLOUD EDGE': '雲海断崖ロード', 'ABYSS CLIFF PLUNGE': '断崖急降下', 'SKYLINE LEDGE CREST': 'スカイライン尾根',
        'GOLDEN BIRCH VALLEY': '黄金の白樺谷', 'BIRCH CREST CHICANE': '白樺シケイン', 'BIRCH CREEK HOLLOW': '白樺沢',
        'BRICK KILN QUARRY': '赤煉瓦採石場', 'IRON MILL GORGE': '製鉄峡谷', 'QUARRY BENCH CREST': '採石段丘',
        'BAMBOO SHRINE PASS': '竹林神社参道', 'MISTY CEDAR SHRINE': '霧杉の神社', 'TORII VALLEY DROP': '鳥居渓谷下り',
        'CREEK TRUSS BRIDGE': '渓流トラス橋', 'IRON ARCH BRIDGE': '鉄骨アーチ橋', 'QUARRY VIADUCT SPAN': '鉱山高架橋',
        'VALLEY ARCH BRIDGE': '渓谷石橋', 'MOUNTAIN TUNNEL': '山岳岩盤トンネル', 'CEDAR PASS TUNNEL': '杉峠トンネル',
      },
    },
  };

  // =========================================================================
  // 2. V7 DEEP-BASS SMOOTH-TRANSITION SPATIAL RALLY AUDIO ENGINE
  //    (Warm Boxer Sub-Bass, ZERO Harsh Sawtooth Buzz, Rich Multi-Layer Foley,
  //     Unmistakable Smooth Outdoor/Bridge/Tunnel/Cockpit Transitions, EN-US Voice)
  // =========================================================================
  class RallyAudio {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.ready = false;
      this.voiceOn = true;
      this.spatialEnabled = true;
      this.masterVol = 0.80;
      this.engineVol = 0.78;
      this.envVol = 0.84;
      this.voiceVol = 0.72;
      this.isPaused = false;
      this.speechLang = 'en-US'; // Unified pure English co-driver

      // Smooth acoustic state tracking
      this._lastGear = 1;
      this._rpmSmooth = 0.25;
      this._throttleSmooth = 0.35;
      this._lastPitch = 0;
      this._lastJointIdx = -1;
      this._birdTimer = 2.0;
      this._pebbleTimer = 0.14;
      this._rainTickTimer = 0.08;
      this._roofRainTimer = 0.14;
      this._wiperTimer = 1.25;
      this._bumpCooldown = 0;
      this._prevBoosting = false;
      this._state = {
        ready: false, muted: false, paused: false, camMode: 'chase',
        tunnel: 0, bridge: 0, rain: 0, wind: 0, birds: 0, water: 0,
        driftRoar: 0, bridgeHum: 0, bassBoostDb: 8.5,
        glassRainLevel: 0, wiperActive: false,
        rpm: 1800, gear: 1, reverbWet: 0, cabinLpfHz: 14000, surface: 'gravel',
        voiceLang: 'en-US',
      };
    }

    _makeSoftClipCurve() {
      const n = 512, curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        // Velvet tube/muffler soft saturation (warm even-harmonic warmth, zero harsh buzz)
        curve[i] = Math.tanh(x * 1.45) * 0.90;
      }
      return curve;
    }

    _makeNoiseBuffers(ctx) {
      const sr = ctx.sampleRate;
      const len = sr * 3;
      const white = ctx.createBuffer(2, len, sr);
      const pink = ctx.createBuffer(2, len, sr);
      const brown = ctx.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
        const wd = white.getChannelData(ch);
        const pd = pink.getChannelData(ch);
        const bd = brown.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, lastB = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          wd[i] = w;
          b0 = 0.99886 * b0 + w * 0.0555179;
          b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.96900 * b2 + w * 0.1538520;
          b3 = 0.86650 * b3 + w * 0.3104856;
          b4 = 0.55000 * b4 + w * 0.5329522;
          b5 = -0.7616 * b5 - w * 0.0168980;
          pd[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
          b6 = w * 0.115926;
          lastB = (lastB + 0.022 * w) / 1.022;
          bd[i] = lastB * 3.1;
        }
      }
      return { white, pink, brown };
    }

    _makeTunnelIR(ctx) {
      // Warm stone tunnel + canyon reflection impulse response (1.65s smooth decay, rich low-mid bloom)
      const sr = ctx.sampleRate;
      const len = Math.floor(sr * 1.65);
      const ir = ctx.createBuffer(2, len, sr);
      const taps = [0.012, 0.025, 0.041, 0.064, 0.092, 0.130];
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        let lp = 0;
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          const env = Math.pow(1 - i / len, 2.15) * Math.exp(-t * 1.85);
          const n = (Math.random() * 2 - 1) * env;
          lp = lp * 0.78 + n * 0.22;
          d[i] = lp * 0.48;
        }
        for (let k = 0; k < taps.length; k++) {
          const idx = Math.min(len - 1, Math.floor((taps[k] + ch * 0.005) * sr));
          d[idx] += (0.58 - k * 0.07) * (k % 2 === 0 ? 1 : -0.85);
        }
      }
      return ir;
    }

    _initCtx() {
      if (this.ready) return true;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        const ctx = new AC();
        this.ctx = ctx;
        this.bufs = this._makeNoiseBuffers(ctx);

        // === MASTER BUS (Warm Low-Shelf + Soft High-Roll-Off + Compressor + Pause Velvet LPF) ===
        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -13;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 3.8;
        this.compressor.attack.value = 0.008;
        this.compressor.release.value = 0.18;

        this.masterBass = ctx.createBiquadFilter();
        this.masterBass.type = 'lowshelf';
        this.masterBass.frequency.value = 95;
        this.masterBass.gain.value = 3.5;

        this.warmShelf = ctx.createBiquadFilter();
        this.warmShelf.type = 'highshelf';
        this.warmShelf.frequency.value = 4200;
        this.warmShelf.gain.value = -5.0;

        this.pauseFilter = ctx.createBiquadFilter();
        this.pauseFilter.type = 'lowpass';
        this.pauseFilter.frequency.value = 18000;
        this.pauseFilter.Q.value = 0.7;

        this.pauseGain = ctx.createGain();
        this.pauseGain.gain.value = 1.0;

        this.masterGain = ctx.createGain();
        this.masterGain.gain.value = this.masterVol;

        this.masterGain
          .connect(this.pauseFilter)
          .connect(this.pauseGain)
          .connect(this.masterBass)
          .connect(this.warmShelf)
          .connect(this.compressor)
          .connect(ctx.destination);

        // === EXTERIOR BUS (Smoothly muffled to ~1180Hz when inside 1st-Person Cockpit!) ===
        this.extLpf = ctx.createBiquadFilter();
        this.extLpf.type = 'lowpass';
        this.extLpf.frequency.value = 14000;
        this.extLpf.Q.value = 0.72;
        this.extGain = ctx.createGain();
        this.extGain.gain.value = 1.0;
        this.extLpf.connect(this.extGain).connect(this.masterGain);

        // === INTERIOR CABIN BUS (Cockpit chassis resonance, roof rain patter, sequential gear whine) ===
        this.intGain = ctx.createGain();
        this.intGain.gain.value = 0.0;
        this.intGain.connect(this.masterGain);

        // === SPATIAL CONVOLVER REVERB (Dramatic Tunnel / Bridge / Canyon Reflections) ===
        this.reverb = ctx.createConvolver();
        this.reverb.buffer = this._makeTunnelIR(ctx);
        this.reverbFilter = ctx.createBiquadFilter();
        this.reverbFilter.type = 'lowpass';
        this.reverbFilter.frequency.value = 900;
        this.reverbFilter.Q.value = 0.7;
        this.reverbWet = ctx.createGain();
        this.reverbWet.gain.value = 0.04;
        this.reverb.connect(this.reverbFilter).connect(this.reverbWet).connect(this.extLpf);

        // === ENGINE BUS: WARM DEEP-BASS BOXER / TURBO-4 (ZERO HARSH SAWTOOTH!) ===
        this.engBus = ctx.createGain();
        this.engBus.gain.value = this.engineVol;

        // +8.5 dB Low-Shelf + Dual Exhaust Muffler Formants (145Hz chest + 310Hz throat)
        this.engBassShelf = ctx.createBiquadFilter();
        this.engBassShelf.type = 'lowshelf';
        this.engBassShelf.frequency.value = 115;
        this.engBassShelf.gain.value = 8.5;

        this.exhFormant1 = ctx.createBiquadFilter();
        this.exhFormant1.type = 'peaking';
        this.exhFormant1.frequency.value = 145;
        this.exhFormant1.Q.value = 1.4;
        this.exhFormant1.gain.value = 5.5;

        this.exhFormant2 = ctx.createBiquadFilter();
        this.exhFormant2.type = 'peaking';
        this.exhFormant2.frequency.value = 310;
        this.exhFormant2.Q.value = 1.2;
        this.exhFormant2.gain.value = 3.0;

        this.engLpf = ctx.createBiquadFilter();
        this.engLpf.type = 'lowpass';
        this.engLpf.frequency.value = 460;
        this.engLpf.Q.value = 1.1;

        this.engShaper = ctx.createWaveShaper();
        this.engShaper.curve = this._makeSoftClipCurve();
        this.engShaper.oversample = '2x';

        this.engShaper
          .connect(this.engLpf)
          .connect(this.exhFormant1)
          .connect(this.exhFormant2)
          .connect(this.engBassShelf)
          .connect(this.engBus);

        this.engBus.connect(this.extLpf);
        this.engBus.connect(this.reverb);

        // 4 smooth non-harsh oscillators: Sub-bass sine + Fundamental triangle + Boxer 1.5x pulse + 2x warm sine
        this.oscSub   = ctx.createOscillator(); this.oscSub.type   = 'sine';     this.oscSub.frequency.value   = 32;
        this.oscFund  = ctx.createOscillator(); this.oscFund.type  = 'triangle'; this.oscFund.frequency.value  = 64;
        this.oscPulse = ctx.createOscillator(); this.oscPulse.type = 'triangle'; this.oscPulse.frequency.value = 96;
        this.oscHarm  = ctx.createOscillator(); this.oscHarm.type  = 'sine';     this.oscHarm.frequency.value  = 128;

        this.gSub   = ctx.createGain(); this.gSub.gain.value   = 0.24;
        this.gFund  = ctx.createGain(); this.gFund.gain.value  = 0.14;
        this.gPulse = ctx.createGain(); this.gPulse.gain.value = 0.068;
        this.gHarm  = ctx.createGain(); this.gHarm.gain.value  = 0.045;

        this.oscSub.connect(this.gSub).connect(this.engShaper);
        this.oscFund.connect(this.gFund).connect(this.engShaper);
        this.oscPulse.connect(this.gPulse).connect(this.engShaper);
        this.oscHarm.connect(this.gHarm).connect(this.engShaper);

        // Deep exhaust sub-rumble air body (brown noise < 105Hz)
        const exhAirSrc = ctx.createBufferSource(); exhAirSrc.buffer = this.bufs.brown; exhAirSrc.loop = true;
        this.exhAirF = ctx.createBiquadFilter(); this.exhAirF.type = 'lowpass'; this.exhAirF.frequency.value = 105; this.exhAirF.Q.value = 1.2;
        this.exhAirG = ctx.createGain(); this.exhAirG.gain.value = 0.09;
        exhAirSrc.connect(this.exhAirF).connect(this.exhAirG).connect(this.engBus);
        exhAirSrc.start();

        // Warm intake induction breath (pink noise through RPM-tracking resonant bandpass)
        const intakeSrc = ctx.createBufferSource(); intakeSrc.buffer = this.bufs.pink; intakeSrc.loop = true;
        this.intakeF = ctx.createBiquadFilter(); this.intakeF.type = 'bandpass'; this.intakeF.frequency.value = 280; this.intakeF.Q.value = 1.3;
        this.intakeG = ctx.createGain(); this.intakeG.gain.value = 0.04;
        intakeSrc.connect(this.intakeF).connect(this.intakeG).connect(this.engBus);
        intakeSrc.start();

        // Delicate Turbo Spool Whistle (soft sine, never piercing)
        this.turboOsc = ctx.createOscillator(); this.turboOsc.type = 'sine'; this.turboOsc.frequency.value = 1650;
        this.turboF = ctx.createBiquadFilter(); this.turboF.type = 'bandpass'; this.turboF.frequency.value = 1950; this.turboF.Q.value = 2.2;
        this.turboG = ctx.createGain(); this.turboG.gain.value = 0.0;
        this.turboOsc.connect(this.turboF).connect(this.turboG).connect(this.extLpf);

        // Cockpit Sequential Straight-Cut Gearbox Whine (interior only)
        this.gearOsc = ctx.createOscillator(); this.gearOsc.type = 'triangle'; this.gearOsc.frequency.value = 460;
        this.gearF = ctx.createBiquadFilter(); this.gearF.type = 'bandpass'; this.gearF.frequency.value = 760; this.gearF.Q.value = 2.6;
        this.gearG = ctx.createGain(); this.gearG.gain.value = 0.0;
        this.gearOsc.connect(this.gearF).connect(this.gearG).connect(this.intGain);

        this.oscSub.start(); this.oscFund.start(); this.oscPulse.start(); this.oscHarm.start();
        this.turboOsc.start(); this.gearOsc.start();

        // === ENVIRONMENT, SURFACE & SPATIAL AMBIENCE BUS ===
        this.envBus = ctx.createGain();
        this.envBus.gain.value = this.envVol;
        this.envBus.connect(this.extLpf);

        // 1. Tire roll on gravel / snow / wet asphalt
        const tireSrc = ctx.createBufferSource(); tireSrc.buffer = this.bufs.pink; tireSrc.loop = true;
        this.tireF = ctx.createBiquadFilter(); this.tireF.type = 'bandpass'; this.tireF.frequency.value = 540; this.tireF.Q.value = 0.75;
        this.tireG = ctx.createGain(); this.tireG.gain.value = 0.0;
        tireSrc.connect(this.tireF).connect(this.tireG).connect(this.envBus);
        this.tireG.connect(this.reverb);
        tireSrc.start();

        // 2. Loose Gravel Drift Slide Roar (tactile lateral skid shear)
        const driftSrc = ctx.createBufferSource(); driftSrc.buffer = this.bufs.pink; driftSrc.loop = true;
        this.driftF = ctx.createBiquadFilter(); this.driftF.type = 'bandpass'; this.driftF.frequency.value = 1150; this.driftF.Q.value = 0.9;
        this.driftG = ctx.createGain(); this.driftG.gain.value = 0.0;
        driftSrc.connect(this.driftF).connect(this.driftG).connect(this.envBus);
        this.driftG.connect(this.reverb);
        driftSrc.start();

        // 3. Wet puddle splash / hydroplane shear
        const splashSrc = ctx.createBufferSource(); splashSrc.buffer = this.bufs.pink; splashSrc.loop = true;
        this.splashF = ctx.createBiquadFilter(); this.splashF.type = 'highpass'; this.splashF.frequency.value = 980;
        this.splashG = ctx.createGain(); this.splashG.gain.value = 0.0;
        splashSrc.connect(this.splashF).connect(this.splashG).connect(this.envBus);
        splashSrc.start();

        // 4. Bridge Hollow Deck Dual-Mode Structural Resonance (132Hz + 210Hz)
        const bridgeSrc = ctx.createBufferSource(); bridgeSrc.buffer = this.bufs.brown; bridgeSrc.loop = true;
        this.bridgeF = ctx.createBiquadFilter(); this.bridgeF.type = 'bandpass'; this.bridgeF.frequency.value = 132; this.bridgeF.Q.value = 2.8;
        this.bridgeF2 = ctx.createBiquadFilter(); this.bridgeF2.type = 'peaking'; this.bridgeF2.frequency.value = 218; this.bridgeF2.Q.value = 3.2; this.bridgeF2.gain.value = 6.5;
        this.bridgeG = ctx.createGain(); this.bridgeG.gain.value = 0.0;
        bridgeSrc.connect(this.bridgeF).connect(this.bridgeF2).connect(this.bridgeG).connect(this.envBus);
        this.bridgeG.connect(this.reverb);
        bridgeSrc.start();

        // 5. Mountain Wind Rush
        const windSrc = ctx.createBufferSource(); windSrc.buffer = this.bufs.pink; windSrc.loop = true;
        this.windF = ctx.createBiquadFilter(); this.windF.type = 'bandpass'; this.windF.frequency.value = 360; this.windF.Q.value = 0.85;
        this.windG = ctx.createGain(); this.windG.gain.value = 0.0;
        windSrc.connect(this.windF).connect(this.windG).connect(this.envBus);
        windSrc.start();

        // 6. Outdoor Rain Wash
        const rainSrc = ctx.createBufferSource(); rainSrc.buffer = this.bufs.pink; rainSrc.loop = true;
        this.rainF = ctx.createBiquadFilter(); this.rainF.type = 'bandpass'; this.rainF.frequency.value = 1550; this.rainF.Q.value = 0.55;
        this.rainG = ctx.createGain(); this.rainG.gain.value = 0.0;
        rainSrc.connect(this.rainF).connect(this.rainG).connect(this.envBus);
        rainSrc.start();

        // 7. Interior Cabin Rain-on-Roof/Glass Patter + Deep 82Hz Chassis Rumble
        const cabRainSrc = ctx.createBufferSource(); cabRainSrc.buffer = this.bufs.white; cabRainSrc.loop = true;
        this.cabRainF = ctx.createBiquadFilter(); this.cabRainF.type = 'bandpass'; this.cabRainF.frequency.value = 2100; this.cabRainF.Q.value = 1.1;
        this.cabRainG = ctx.createGain(); this.cabRainG.gain.value = 0.0;
        cabRainSrc.connect(this.cabRainF).connect(this.cabRainG).connect(this.intGain);
        cabRainSrc.start();

        const cabBodySrc = ctx.createBufferSource(); cabBodySrc.buffer = this.bufs.brown; cabBodySrc.loop = true;
        this.cabBodyF = ctx.createBiquadFilter(); this.cabBodyF.type = 'lowpass'; this.cabBodyF.frequency.value = 92;
        this.cabBodyG = ctx.createGain(); this.cabBodyG.gain.value = 0.0;
        cabBodySrc.connect(this.cabBodyF).connect(this.cabBodyG).connect(this.intGain);
        cabBodySrc.start();

        // 8. Gorge River / Waterfall Rush (bridges & lakeside)
        const riverSrc = ctx.createBufferSource(); riverSrc.buffer = this.bufs.pink; riverSrc.loop = true;
        this.riverF = ctx.createBiquadFilter(); this.riverF.type = 'bandpass'; this.riverF.frequency.value = 680; this.riverF.Q.value = 0.65;
        this.riverG = ctx.createGain(); this.riverG.gain.value = 0.0;
        riverSrc.connect(this.riverF).connect(this.riverG).connect(this.envBus);
        riverSrc.start();

        this.ready = true;
        this._state.ready = true;
        if (this.isPaused) this.setPaused(true);
        return true;
      } catch (e) {
        this.muted = true;
        return false;
      }
    }

    setMuted(m) {
      this.muted = !!m;
      if (!this.muted && !this.ready) this._initCtx();
      if (this.ctx) {
        try { if (this.muted) this.ctx.suspend(); else this.ctx.resume(); } catch (_) {}
      }
      if (this.muted && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
      this._state.muted = this.muted;
      return this.muted;
    }

    toggle() { return this.setMuted(!this.muted); }

    ensureUnlocked() {
      if (this.muted) return false;
      if (!this.ready) this._initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        try { this.ctx.resume(); } catch (_) {}
      }
      return this.ready;
    }

    _pickEnglishVoice() {
      if (!window.speechSynthesis || !window.speechSynthesis.getVoices) return null;
      const voices = window.speechSynthesis.getVoices();
      if (!voices || !voices.length) return null;
      // Prefer local low-latency en-US / en-GB voice (avoid high-latency cloud voices)
      let v = voices.find((x) => x.localService && /^en[-_]US/i.test(x.lang));
      if (!v) v = voices.find((x) => x.localService && /^en/i.test(x.lang));
      if (!v) v = voices.find((x) => /^en[-_]US/i.test(x.lang));
      if (!v) v = voices.find((x) => /^en/i.test(x.lang));
      return v || null;
    }

    cancelPaceVoice() {
      this._pendingSpeech = null;
      if (this._speechFlushTimer) { clearTimeout(this._speechFlushTimer); this._speechFlushTimer = null; }
      if (this._speechWatchdog) { clearTimeout(this._speechWatchdog); this._speechWatchdog = null; }
      this._speechBusy = false;
      this._currentUtterance = null;
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
    }

    setVolumes(master, engine, env, voice) {
      if (typeof master === 'number') this.masterVol = Math.max(0, Math.min(1, master));
      if (typeof engine === 'number') this.engineVol = Math.max(0, Math.min(1, engine));
      if (typeof env === 'number') this.envVol = Math.max(0, Math.min(1, env));
      if (typeof voice === 'number') this.voiceVol = Math.max(0, Math.min(1, voice));
      if (this.ready && this.ctx) {
        const t = this.ctx.currentTime;
        this.masterGain.gain.setTargetAtTime(this.masterVol, t, 0.05);
        this.engBus.gain.setTargetAtTime(this.engineVol, t, 0.05);
        this.envBus.gain.setTargetAtTime(this.envVol, t, 0.05);
      }
    }

    setSpatialEnabled(on) { this.spatialEnabled = !!on; }
    setVoiceEnabled(on) {
      this.voiceOn = !!on;
      if (!this.voiceOn && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }
    }

    setPaused(isPaused) {
      this.isPaused = !!isPaused;
      this._state.paused = this.isPaused;
      if (!this.ready || !this.ctx) return;
      const t = this.ctx.currentTime;
      this.pauseFilter.frequency.setTargetAtTime(this.isPaused ? 420 : 18000, t, 0.14);
      this.pauseGain.gain.setTargetAtTime(this.isPaused ? 0.22 : 1.0, t, 0.14);
    }

    playUiSound(kind) {
      if (!this.ready || this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        if (kind === 'pause') {
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(260, now + 0.10);
          g.gain.setValueAtTime(0.05, now);
          g.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);
        } else if (kind === 'resume') {
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(540, now + 0.10);
          g.gain.setValueAtTime(0.05, now);
          g.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);
        } else {
          osc.frequency.setValueAtTime(kind === 'hover' ? 580 : 720, now);
          g.gain.setValueAtTime(kind === 'hover' ? 0.015 : 0.036, now);
          g.gain.exponentialRampToValueAtTime(0.0008, now + 0.055);
        }
        osc.connect(g).connect(this.compressor);
        osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        osc.start(now); osc.stop(now + 0.13);
      } catch (_) {}
    }

    triggerGearClunk(up) {
      if (!this.ready || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(up ? 115 : 92, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.048);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.085 * this.engineVol, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.055);
      osc.connect(g).connect(this.extLpf);
      osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
      osc.start(now); osc.stop(now + 0.06);
    }

    triggerSuspensionBump(intensity) {
      if (!this.ready || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(68 + intensity * 18, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.095);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.min(0.14, 0.055 + intensity * 0.08) * this.envVol, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.11);
      osc.connect(g).connect(this.masterGain);
      osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
      osc.start(now); osc.stop(now + 0.12);
    }

    triggerTurboFlutter(intensity = 0.65) {
      if (!this.ready || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t0 = now + i * 0.060;
        const src = this.ctx.createBufferSource(); src.buffer = this.bufs.pink;
        const f = this.ctx.createBiquadFilter(); f.type = 'bandpass';
        f.frequency.setValueAtTime(1850 - i * 280, t0);
        f.Q.value = 3.2;
        const g = this.ctx.createGain();
        const peak = 0.028 * intensity * Math.pow(0.64, i) * this.engineVol;
        g.gain.setValueAtTime(0.0005, t0);
        g.gain.linearRampToValueAtTime(peak, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.054);
        src.connect(f).connect(g).connect(this.extLpf);
        g.connect(this.reverb);
        src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
        src.start(t0); src.stop(t0 + 0.058);
      }
    }

    triggerBridgeJoint(speedNorm, style) {
      if (!this.ready || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const delayRear = Math.max(0.045, Math.min(0.13, 2.55 / Math.max(12, speedNorm * 38)));
      const baseHz = style === 'truss' ? 112 : 86;
      for (let a = 0; a < 2; a++) {
        const t0 = now + a * delayRear;
        const osc = this.ctx.createOscillator(); osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseHz, t0);
        osc.frequency.exponentialRampToValueAtTime(36, t0 + 0.072);
        const g = this.ctx.createGain();
        const amp = (0.068 + 0.055 * speedNorm) * this.envVol;
        g.gain.setValueAtTime(amp, t0);
        g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.082);
        osc.connect(g).connect(this.extLpf);
        g.connect(this.reverb);
        osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        osc.start(t0); osc.stop(t0 + 0.088);
      }
    }

    triggerBirdChirp(level) {
      if (!this.ready || this.muted || !this.ctx || level < 0.05) return;
      const now = this.ctx.currentTime;
      const notes = 2 + ((Math.random() * 2) | 0);
      const baseF = 2300 + Math.random() * 1400;
      const pan = (Math.random() * 2 - 1) * 0.82;
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) { panner.pan.value = pan; panner.connect(this.envBus); }
      const dest = panner || this.envBus;
      for (let i = 0; i < notes; i++) {
        const t0 = now + i * (0.09 + Math.random() * 0.04);
        const osc = this.ctx.createOscillator(); osc.type = 'sine';
        const fA = baseF * (0.94 + Math.random() * 0.14);
        const fB = fA * (1.12 + Math.random() * 0.15);
        osc.frequency.setValueAtTime(fA, t0);
        osc.frequency.exponentialRampToValueAtTime(fB, t0 + 0.038);
        osc.frequency.exponentialRampToValueAtTime(fA * 0.96, t0 + 0.078);
        const g = this.ctx.createGain();
        const peak = 0.017 * level;
        g.gain.setValueAtTime(0.0004, t0);
        g.gain.linearRampToValueAtTime(peak, t0 + 0.014);
        g.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.082);
        osc.connect(g).connect(dest);
        osc.onended = () => { try { osc.disconnect(); g.disconnect(); if (i === notes - 1 && panner) panner.disconnect(); } catch (_) {} };
        osc.start(t0); osc.stop(t0 + 0.088);
      }
    }

    triggerPebbleTick(intensity) {
      if (!this.ready || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource(); src.buffer = this.bufs.white;
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.value = 1650 + Math.random() * 1800; f.Q.value = 2.4;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.018 * intensity * this.envVol, now);
      g.gain.exponentialRampToValueAtTime(0.0005, now + 0.022);
      src.connect(f).connect(g).connect(this.extLpf);
      src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
      src.start(now); src.stop(now + 0.026);
    }

    triggerCabinRainDrop(intensity) {
      if (!this.ready || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      // Stereo spatialized raindrop impact on laminated windshield / side window glass
      // Combines crisp high-resonance glass ping (1.3-2.7kHz) + warm laminated-glass body thump (320-560Hz)
      const pan = (Math.random() * 2 - 1) * 0.82;
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) { panner.pan.value = pan; panner.connect(this.intGain); }
      const dest = panner || this.intGain;

      const ping = this.ctx.createOscillator(); ping.type = 'sine';
      const fHi = 1350 + Math.random() * 1350;
      ping.frequency.setValueAtTime(fHi, now);
      ping.frequency.exponentialRampToValueAtTime(fHi * 0.62, now + 0.024);
      const gHi = this.ctx.createGain();
      gHi.gain.setValueAtTime(0.022 * intensity * this.envVol, now);
      gHi.gain.exponentialRampToValueAtTime(0.0004, now + 0.028);
      ping.connect(gHi).connect(dest);
      ping.onended = () => { try { ping.disconnect(); gHi.disconnect(); } catch (_) {} };
      ping.start(now); ping.stop(now + 0.032);

      const body = this.ctx.createOscillator(); body.type = 'triangle';
      const fLo = 320 + Math.random() * 240;
      body.frequency.setValueAtTime(fLo, now);
      body.frequency.exponentialRampToValueAtTime(fLo * 0.45, now + 0.034);
      const gLo = this.ctx.createGain();
      gLo.gain.setValueAtTime(0.020 * intensity * this.envVol, now);
      gLo.gain.exponentialRampToValueAtTime(0.0004, now + 0.038);
      body.connect(gLo).connect(dest);
      body.onended = () => { try { body.disconnect(); gLo.disconnect(); if (panner) panner.disconnect(); } catch (_) {} };
      body.start(now); body.stop(now + 0.042);
    }

    triggerRoofRainTap(intensity) {
      if (!this.ready || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      // Soft damped metal-roof rain drumming for immersive enclosed cabin atmosphere
      const osc = this.ctx.createOscillator(); osc.type = 'sine';
      const f0 = 185 + Math.random() * 135;
      osc.frequency.setValueAtTime(f0, now);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.48, now + 0.042);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.018 * intensity * this.envVol, now);
      g.gain.exponentialRampToValueAtTime(0.0004, now + 0.048);
      osc.connect(g).connect(this.intGain);
      osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
      osc.start(now); osc.stop(now + 0.052);
    }

    triggerWiperSwish(intensity) {
      if (!this.ready || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      // Ultra-subtle wet-rubber windshield wiper sweep glide
      const src = this.ctx.createBufferSource(); src.buffer = this.bufs.pink;
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.setValueAtTime(560, now);
      f.frequency.exponentialRampToValueAtTime(980, now + 0.16);
      f.frequency.exponentialRampToValueAtTime(620, now + 0.34);
      f.Q.value = 1.8;
      const g = this.ctx.createGain();
      const peak = 0.014 * Math.min(1.0, intensity) * this.envVol;
      g.gain.setValueAtTime(0.0004, now);
      g.gain.linearRampToValueAtTime(peak, now + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0004, now + 0.36);
      src.connect(f).connect(g).connect(this.intGain);
      src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
      src.start(now); src.stop(now + 0.38);
    }

    triggerBackfire() {
      if (!this.ready || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      // Warm 2-pulse deep rally exhaust overrun burble (chest thump, never loud gunshot)
      for (let i = 0; i < 2; i++) {
        const t0 = now + i * 0.078;
        const src = this.ctx.createBufferSource(); src.buffer = this.bufs.brown;
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 185;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime((i === 0 ? 0.12 : 0.075) * this.engineVol, t0);
        g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.095);
        src.connect(f).connect(g).connect(this.extLpf);
        g.connect(this.reverb);
        src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
        src.start(t0); src.stop(t0 + 0.105);
      }
    }

    _dispatchUtterance(item) {
      if (!item || !this.voiceOn || this.muted || this.isPaused || !window.speechSynthesis) {
        this._speechBusy = false;
        return false;
      }
      try {
        const u = new SpeechSynthesisUtterance(item.phrase);
        u.lang = 'en-US';
        const voice = this._pickEnglishVoice();
        if (voice) u.voice = voice;
        const sp = typeof item.speedMs === 'number' ? item.speedMs : 28;
        u.rate = Math.max(1.12, Math.min(1.34, 1.12 + Math.max(0, sp - 24) * 0.007));
        u.pitch = 0.96;
        u.volume = Math.max(0, Math.min(1, 0.82 * this.voiceVol * this.masterVol));
        this._currentUtterance = u; // Keep strong ref so Chromium GC never kills onend
        this._speechBusy = true;
        if (this._speechWatchdog) clearTimeout(this._speechWatchdog);
        const finish = () => {
          if (this._currentUtterance !== u) return;
          if (this._speechWatchdog) { clearTimeout(this._speechWatchdog); this._speechWatchdog = null; }
          this._currentUtterance = null;
          this._speechBusy = false;
          const next = this._pendingSpeech;
          this._pendingSpeech = null;
          if (next && !this.isPaused && !this.muted && this.voiceOn) {
            if (!next.expiresAt || performance.now() < next.expiresAt) {
              this._dispatchUtterance(next);
            }
          }
        };
        u.onend = finish;
        u.onerror = finish;
        // Watchdog in case browser misses onend event
        this._speechWatchdog = setTimeout(finish, 3600);
        window.speechSynthesis.speak(u);
        return true;
      } catch (_) {
        this._speechBusy = false;
        return false;
      }
    }

    speakPaceNote(englishPhrase, priority, speedMs) {
      // Safe 1-slot Co-Driver dispatcher: never calls cancel()+speak() in the same tick!
      if (!this.voiceOn || this.muted || this.isPaused || !englishPhrase || !window.speechSynthesis) return false;
      const item = { phrase: englishPhrase, speedMs, expiresAt: performance.now() + 2600 };
      const busy = !!(this._speechBusy || window.speechSynthesis.speaking || window.speechSynthesis.pending);
      if (busy) {
        if (priority) {
          // Urgent danger/hairpin: cancel current speech, wait 65ms for Chrome/Edge flush, then speak
          this.cancelPaceVoice();
          this._speechBusy = true;
          this._speechFlushTimer = setTimeout(() => {
            this._speechFlushTimer = null;
            this._dispatchUtterance(item);
          }, 65);
          return true;
        }
        // Normal call while busy: replace single pending slot (zero queue pileup!)
        this._pendingSpeech = item;
        return true;
      }
      return this._dispatchUtterance(item);
    }

    triggerChime(englishPhrase) {
      if (this.ready && !this.muted && this.ctx) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.07);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.042, now);
        g.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);
        osc.connect(g).connect(this.compressor);
        osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
        osc.start(now); osc.stop(now + 0.23);
      }
      if (englishPhrase) this.speakPaceNote(englishPhrase, false);
    }

    update(car, env, camMode, dt) {
      if (!this._dtReuse) this._dtReuse = {};
      const dtInfo = PV.getDrivetrainTelemetry ? PV.getDrivetrainTelemetry(car, this._dtReuse) : null;
      const kmh = dtInfo ? dtInfo.kmh : (car.speed || 0) * 3.6;
      const spN = Math.min(1.0, (car.speed || 0) / 38.0);
      const gear = dtInfo ? Math.max(1, dtInfo.gear) : (kmh < 6 ? 1 : Math.min(6, 1 + Math.floor(kmh / 28)));
      const inGearFrac = dtInfo ? dtInfo.rpmNorm : Math.max(0.14, Math.min(0.98, ((kmh % 28) / 28) * 0.56 + (kmh / 175) * 0.44));
      const rpm = dtInfo ? dtInfo.rpm : (1450 + inGearFrac * 5850);
      const tunnel = env ? (env.tunnel || 0) : 0;
      const bridge = env ? (env.bridge || 0) : 0;
      const outdoor = Math.max(0, 1.0 - tunnel);
      const rainDens = (PV.LIGHT && typeof PV.LIGHT.rainDensity === 'number') ? PV.LIGHT.rainDensity : 0.6;
      const rainLevel = Math.min(1.0, rainDens / 1.6) * outdoor;
      const windLevel = Math.min(1.0, (0.14 + spN * 0.72) * (0.45 + (env ? env.exposure : 0.5) * 0.55)) * outdoor;
      const birdLevel = (env ? env.forestFactor : 0) * outdoor * Math.max(0, 1.0 - rainLevel * 1.45) * Math.max(0, 1.0 - spN * 0.62);
      const waterLevel = (env ? env.waterNearby : 0) * outdoor;
      const driftMag = Math.abs(car.driftAngle || 0);
      const driftRoar = Math.min(1.0, Math.max(0, (driftMag - 0.06) * 2.4)) * spN;
      const bridgeHum = bridge * spN;
      const isCockpit = camMode === 'cockpit';
      const reverbTarget = this.spatialEnabled ? Math.min(0.86, 0.04 + tunnel * 0.76 + bridge * 0.32) : 0.0;
      const cabinLpfTarget = (this.spatialEnabled && isCockpit) ? 1180 : 14000;

      // Update live telemetry state (always current for UI & QA)
      const st = this._state;
      st.camMode = camMode;
      st.tunnel = +tunnel.toFixed(3);
      st.bridge = +bridge.toFixed(3);
      st.rain = +rainLevel.toFixed(3);
      st.wind = +windLevel.toFixed(3);
      st.birds = +birdLevel.toFixed(3);
      st.water = +waterLevel.toFixed(3);
      st.driftRoar = +driftRoar.toFixed(3);
      st.bridgeHum = +bridgeHum.toFixed(3);
      st.glassRainLevel = +(isCockpit ? rainLevel : 0).toFixed(3);
      st.wiperActive = !!(isCockpit && rainLevel > 0.20);
      st.rpm = Math.round(rpm);
      st.gear = gear;
      st.reverbWet = +reverbTarget.toFixed(3);
      st.cabinLpfHz = cabinLpfTarget;
      st.surface = tunnel > 0.35 ? 'tunnel' : (bridge > 0.35 ? 'bridge' : (car.puddleIntensity > 0.35 ? 'mud' : ((env && env.themeId === 1) ? 'snow' : 'gravel')));

      if (!this.ready || this.muted || !this.ctx || this.isPaused) return;

      const t = this.ctx.currentTime;
      const h = Math.min(0.1, Math.max(0.008, dt || 0.016));
      this._rpmSmooth += (inGearFrac - this._rpmSmooth) * (1 - Math.exp(-8.5 * h));
      const loadTarget = (car.boosting ? 1.0 : (0.38 + spN * 0.48 + driftMag * 0.25));
      this._throttleSmooth += (loadTarget - this._throttleSmooth) * (1 - Math.exp(-6.5 * h));

      // Gear shift mechanical clunk + turbo BOV flutter
      if (gear !== this._lastGear && spN > 0.20) {
        const up = gear > this._lastGear;
        this.triggerGearClunk(up);
        if (up) this.triggerTurboFlutter(0.55 + (car.boosting ? 0.35 : 0.0));
        else this.triggerBackfire();
      } else if (this._prevBoosting && !car.boosting && spN > 0.32) {
        this.triggerTurboFlutter(0.82);
        this.triggerBackfire();
      }
      this._lastGear = gear;
      this._prevBoosting = !!car.boosting;

      // Suspension bump thud on rapid pitch/crest delta
      this._bumpCooldown -= h;
      const pitchNow = car.pitch || 0;
      const pitchRate = Math.abs(pitchNow - this._lastPitch) / h;
      this._lastPitch = pitchNow;
      if (pitchRate > 0.32 && spN > 0.30 && this._bumpCooldown <= 0) {
        this.triggerSuspensionBump(Math.min(1.0, (pitchRate - 0.32) * 1.4));
        this._bumpCooldown = 0.28;
      }

      // 1. Deep Warm Boxer / Turbo-4 Engine Core (Smooth, Chesty, ZERO Harsh Buzz!)
      const idleLope = spN < 0.08 ? (1.0 + 0.042 * Math.sin(t * 18.0)) : (1.0 + 0.008 * Math.sin(t * 36.0));
      const f0 = (42 + this._rpmSmooth * 86 + (car.boosting ? 12 : 0)) * idleLope;
      this.oscSub.frequency.setTargetAtTime(f0 * 0.5, t, 0.055);
      this.oscFund.frequency.setTargetAtTime(f0, t, 0.055);
      this.oscPulse.frequency.setTargetAtTime(f0 * 1.498, t, 0.055);
      this.oscHarm.frequency.setTargetAtTime(f0 * 2.0, t, 0.055);

      const engCut = 230 + this._rpmSmooth * 760 + this._throttleSmooth * 290 + tunnel * 180;
      this.engLpf.frequency.setTargetAtTime(Math.min(1280, engCut), t, 0.075);
      this.exhAirF.frequency.setTargetAtTime(82 + this._rpmSmooth * 65 + this._throttleSmooth * 35, t, 0.08);
      this.exhAirG.gain.setTargetAtTime(0.065 + this._throttleSmooth * 0.095, t, 0.09);
      this.intakeF.frequency.setTargetAtTime(210 + this._rpmSmooth * 520, t, 0.075);
      this.intakeG.gain.setTargetAtTime(0.022 + this._throttleSmooth * 0.048, t, 0.09);

      // Turbo spool (soft!) & Cockpit straight-cut gearbox whine
      this.turboOsc.frequency.setTargetAtTime(1550 + this._rpmSmooth * 1850 + (car.boosting ? 520 : 0), t, 0.09);
      this.turboF.frequency.setTargetAtTime(1800 + this._rpmSmooth * 1700, t, 0.09);
      this.turboG.gain.setTargetAtTime(Math.max(0, (this._rpmSmooth - 0.34)) * (car.boosting ? 0.013 : 0.005) * this.engineVol, t, 0.14);

      this.gearOsc.frequency.setTargetAtTime(320 + spN * 720 + gear * 40, t, 0.07);
      this.gearF.frequency.setTargetAtTime(440 + spN * 840, t, 0.07);
      this.gearG.gain.setTargetAtTime(spN * 0.015 * this.engineVol, t, 0.11);

      // 2. Unmistakable Smooth Perspective Switch (Cockpit Cabin vs Exterior Chase)
      this.extLpf.frequency.setTargetAtTime(cabinLpfTarget, t, 0.18);
      this.extGain.gain.setTargetAtTime((this.spatialEnabled && isCockpit) ? 0.62 : 1.0, t, 0.18);
      this.intGain.gain.setTargetAtTime((this.spatialEnabled && isCockpit) ? 1.0 : 0.0, t, 0.18);

      // 3. Dramatic Smooth Spatial Reverb (Outdoor -> Bridge -> Tunnel)
      this.reverbWet.gain.setTargetAtTime(reverbTarget, t, 0.22);
      this.reverbFilter.frequency.setTargetAtTime(tunnel > 0.25 ? 520 : (bridge > 0.25 ? 920 : 1200), t, 0.22);

      // 4. Surface, Gravel Drift Slide, Puddle Splash & Bridge Hollow Hum
      const surfFreq = tunnel > 0.35 ? 440 : (bridge > 0.35 ? 510 : ((env && env.themeId === 1) ? 330 : 660));
      this.tireF.frequency.setTargetAtTime(surfFreq + driftMag * 280, t, 0.14);
      this.tireG.gain.setTargetAtTime(spN * (0.048 + driftMag * 0.055), t, 0.11);
      this.driftF.frequency.setTargetAtTime(920 + spN * 540, t, 0.10);
      this.driftG.gain.setTargetAtTime(driftRoar * 0.095, t, 0.09);
      this.splashG.gain.setTargetAtTime(spN * (0.018 * rainLevel + (car.puddleIntensity || 0) * 0.13), t, 0.09);
      this.bridgeG.gain.setTargetAtTime(bridgeHum * 0.155, t, 0.15);

      if (bridge > 0.25 && spN > 0.15) {
        const jIdx = Math.floor((car.s || 0) / 18.0);
        if (jIdx !== this._lastJointIdx) {
          this._lastJointIdx = jIdx;
          this.triggerBridgeJoint(spN, env ? env.bridgeStyle : 'truss');
        }
      } else {
        this._lastJointIdx = -1;
      }

      // Gravel pebbles under fenders
      this._pebbleTimer -= h;
      if (this._pebbleTimer <= 0 && tunnel < 0.2 && bridge < 0.2 && spN > 0.25) {
        if (driftMag > 0.10 || Math.random() < 0.26) {
          this.triggerPebbleTick(Math.min(1, spN * 0.55 + driftMag * 1.3));
        }
        this._pebbleTimer = 0.075 + Math.random() * (driftMag > 0.14 ? 0.09 : 0.25);
      }

      // 5. Wind, Rain (Outdoor + Cockpit Roof), Gorge River & Forest Birdsong
      this.windF.frequency.setTargetAtTime(240 + windLevel * 420, t, 0.22);
      this.windG.gain.setTargetAtTime(windLevel * 0.072, t, 0.22);
      this.rainG.gain.setTargetAtTime(rainLevel * 0.068, t, 0.24);
      this.cabRainG.gain.setTargetAtTime(rainLevel * 0.044, t, 0.20);
      this.cabBodyG.gain.setTargetAtTime(0.036 + spN * 0.064, t, 0.14);
      this.riverG.gain.setTargetAtTime(waterLevel * 0.054, t, 0.26);

      this._rainTickTimer -= h;
      if (this._rainTickTimer <= 0 && isCockpit && rainLevel > 0.12) {
        this.triggerCabinRainDrop(rainLevel);
        this._rainTickTimer = (0.042 + Math.random() * 0.11) / Math.max(0.28, rainLevel);
      }
      this._roofRainTimer -= h;
      if (this._roofRainTimer <= 0 && isCockpit && rainLevel > 0.18) {
        this.triggerRoofRainTap(rainLevel);
        this._roofRainTimer = (0.09 + Math.random() * 0.18) / Math.max(0.30, rainLevel);
      }
      this._wiperTimer -= h;
      if (this._wiperTimer <= 0 && isCockpit && rainLevel > 0.22) {
        this.triggerWiperSwish(rainLevel);
        this._wiperTimer = 1.35;
      }

      this._birdTimer -= h;
      if (this._birdTimer <= 0) {
        if (birdLevel > 0.16) this.triggerBirdChirp(birdLevel);
        this._birdTimer = 2.4 + Math.random() * 3.8;
      }

      if (car.backfireEvent) this.triggerBackfire();
    }

    getState() { return Object.assign({}, this._state); }
  }

  // =========================================================================
  // 3. MINIMALIST STAGE RALLY PACE-NOTE ENGINE (PURE ENGLISH VOICE + MANGA SIGNPOST)
  // =========================================================================
  const PACE_SVG = {
    hairpin_L: '<path d="M24 30 V13 C24 8 13 8 13 13 V25 M8 20 L13 26 L18 20"/>',
    hairpin_R: '<path d="M12 30 V13 C12 8 23 8 23 13 V25 M18 20 L23 26 L28 20"/>',
    sharp_L:   '<path d="M25 30 V15 H10 M15 9 L9 15 L15 21"/>',
    sharp_R:   '<path d="M11 30 V15 H26 M21 9 L27 15 L21 21"/>',
    med_L:     '<path d="M24 30 V18 L12 10 M11 17 L11 9 L19 10"/>',
    med_R:     '<path d="M12 30 V18 L24 10 M17 10 L25 9 L25 17"/>',
    fast_L:    '<path d="M21 30 V17 L15 9 M11 15 L14 8 L21 11"/>',
    fast_R:    '<path d="M15 30 V17 L21 9 M15 11 L22 8 L25 15"/>',
    crest:     '<path d="M5 24 Q18 9 31 24 M14 14 L18 9 L22 14"/>',
    drop:      '<path d="M6 12 L18 26 L30 12 M13 21 L18 27 L23 21"/>',
    bridge:    '<path d="M5 25 H31 M8 25 V14 Q18 8 28 14 V25"/>',
    tunnel:    '<path d="M8 29 V17 A10 10 0 0 1 28 17 V29 M14 29 V20 A4 4 0 0 1 22 20 V29"/>',
    water:     '<path d="M5 22 Q11 16 18 22 T31 22 M5 28 Q11 22 18 28 T31 28"/>',
    straight:  '<path d="M18 30 V9 M11 15 L18 8 L25 15"/>',
  };

  class PaceNoteEngine {
    constructor(audio) {
      this.audio = audio;
      this.bannerEnabled = true;
      this.timing = 'normal'; // 'early' | 'normal' | 'late'
      this._calledIds = new Set();
      this._events = [];
      this._lastScanS = -999;
      this._lastSpokenTime = -99;
      this._stopTimer = 0;
      this._spokenCount = 0;
      this._lastSpokenPhrase = '';
      this._active = {
        key: 'straight', call: 'FLAT OUT', mod: '', dist: 100,
        sev: 'fast', icon: 'straight', spokenText: '', voiceLang: 'en-US', bannerVisible: false,
        lookaheadM: 0, eventCount: 0, spokenCount: 0,
      };
      this._elBanner = document.getElementById('paceBanner');
      this._elSvg    = document.getElementById('paceArrowSvg');
      this._elCall   = document.getElementById('paceCall');
      this._elMod    = document.getElementById('paceMod');
      this._elDist   = document.getElementById('paceDist');
      this._lastIcon = '';
      this._lastSev  = '';
    }

    setTiming(mode) {
      this.timing = (mode === 'early' || mode === 'late') ? mode : 'normal';
    }

    setBannerEnabled(on) {
      this.bannerEnabled = !!on;
      if (this._elBanner) this._elBanner.classList.toggle('hidden-opt', !this.bannerEnabled);
    }

    reset() {
      this._calledIds.clear();
      this._events = [];
      this._lastScanS = -999;
      this._lastSpokenTime = -99;
      this._stopTimer = 0;
      this._spokenCount = 0;
      this._lastSpokenPhrase = '';
      this.audio.cancelPaceVoice();
    }

    // Parse continuous upcoming spline into discrete Rally Corner & Hazard Events
    _scanTrackEvents(car, track, horizonM) {
      const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
      const step = 8;
      const startS = Math.floor(car.s / step) * step;
      const endS = startS + horizonM;
      const pts = [];
      for (let s = startS; s <= endS; s += step) {
        const sp = track.sampleAtS(s);
        if (!sp) break;
        const tf = track.tunnelFactor ? track.tunnelFactor(s) : 0;
        const bf = track.bridgeFactor ? track.bridgeFactor(s) : 0;
        const wet = (sp.seg && sp.seg.surfMode === 0) ? (sp.seg.wet || 0) : 0;
        pts.push({ s, yaw: sp.yaw || 0, pitch: sp.pitch || 0, tf, bf, wet });
      }
      if (pts.length < 5) return [];

      const events = [];

      // A. Detect discrete structural hazards (Tunnel, Bridge, Water Splash) on rising edge
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1], cur = pts[i];
        if (cur.tf > 0.35 && prev.tf <= 0.35) {
          events.push({
            id: `tun_${Math.round(cur.s / 24)}`,
            kind: 'hazard', sStart: cur.s, sApex: cur.s + 16, sEnd: cur.s + 40,
            call: 'TUNNEL', mod: 'KEEP CENTER', sev: 'hazard', icon: 'tunnel',
            phraseCore: 'tunnel, keep center', priority: 3,
          });
        } else if (cur.bf > 0.35 && prev.bf <= 0.35) {
          events.push({
            id: `brg_${Math.round(cur.s / 24)}`,
            kind: 'hazard', sStart: cur.s, sApex: cur.s + 16, sEnd: cur.s + 40,
            call: 'BRIDGE', mod: 'NARROW', sev: 'hazard', icon: 'bridge',
            phraseCore: 'narrow bridge', priority: 3,
          });
        } else if (cur.wet >= 0.80 && prev.wet < 0.78) {
          events.push({
            id: `wat_${Math.round(cur.s / 24)}`,
            kind: 'hazard', sStart: cur.s, sApex: cur.s + 12, sEnd: cur.s + 30,
            call: 'WATER SPLASH', mod: 'CAUTION', sev: 'hazard', icon: 'water',
            phraseCore: 'water splash', priority: 2,
          });
        }
      }

      // B. Compute signed yaw-rate (curvature) per 8m step and cluster contiguous bends into discrete Corner Events
      const curv = new Array(pts.length).fill(0);
      for (let i = 1; i < pts.length - 1; i++) {
        curv[i] = wrap(pts[i + 1].yaw - pts[i - 1].yaw) / (2 * step); // rad/m
      }

      const K_ENTER = 0.0028; // ~0.11 rad over 40m (catches fast 6-grade sweepers too!)
      let i = 1;
      while (i < pts.length - 2) {
        if (Math.abs(curv[i]) < K_ENTER) { i++; continue; }
        const sign = curv[i] >= 0 ? 1 : -1;
        let j = i;
        let sumYaw = 0, peakK = 0, peakIdx = i, firstHalfK = 0, secondHalfK = 0, crestFlag = false;
        while (j < pts.length - 1 && (curv[j] * sign > K_ENTER * 0.45)) {
          const ak = Math.abs(curv[j]);
          sumYaw += ak * step;
          if (ak > peakK) { peakK = ak; peakIdx = j; }
          if (j > 0 && pts[j - 1].pitch > 0.045 && pts[j].pitch < -0.015) crestFlag = true;
          j++;
        }
        const len = Math.max(step, (j - i) * step);
        const mid = Math.floor((i + j) * 0.5);
        for (let m = i; m < mid; m++) firstHalfK = Math.max(firstHalfK, Math.abs(curv[m]));
        for (let m = mid; m < j; m++) secondHalfK = Math.max(secondHalfK, Math.abs(curv[m]));

        // Classify corner by combined peak curvature & total turn angle (real rally 1-6 + Hairpin scale)
        const metric = Math.max(sumYaw, peakK * 36.0);
        if (metric > 0.095) {
          const dir = sign > 0 ? 'RIGHT' : 'LEFT';
          const dirWord = sign > 0 ? 'right' : 'left';
          const dirCode = sign > 0 ? 'R' : 'L';
          let grade = 6, sev = 'fast', icon = `fast_${dirCode}`, call = `6 ${dir}`, phraseCore = `six ${dirWord}`, prio = 1;
          if (metric > 1.05 || peakK > 0.032) {
            grade = 0; sev = 'danger'; icon = `hairpin_${dirCode}`; call = `HAIRPIN ${dir}`; phraseCore = `hairpin ${dirWord}, caution`; prio = 4;
          } else if (metric > 0.72 || peakK > 0.022) {
            grade = 1; sev = 'danger'; icon = `sharp_${dirCode}`; call = `1 ${dir}`; phraseCore = `one ${dirWord}, caution`; prio = 4;
          } else if (metric > 0.50 || peakK > 0.015) {
            grade = 2; sev = 'sharp'; icon = `sharp_${dirCode}`; call = `2 ${dir}`; phraseCore = `two ${dirWord}`; prio = 3;
          } else if (metric > 0.34 || peakK > 0.0105) {
            grade = 3; sev = 'sharp'; icon = `med_${dirCode}`; call = `3 ${dir}`; phraseCore = `three ${dirWord}`; prio = 2;
          } else if (metric > 0.21 || peakK > 0.0068) {
            grade = 4; sev = 'medium'; icon = `med_${dirCode}`; call = `4 ${dir}`; phraseCore = `four ${dirWord}`; prio = 2;
          } else if (metric > 0.14) {
            grade = 5; sev = 'fast'; icon = `fast_${dirCode}`; call = `5 ${dir}`; phraseCore = `five ${dirWord}`; prio = 1;
          }

          let mod = '';
          const tightens = secondHalfK > firstHalfK * 1.35 && secondHalfK > 0.006;
          const opens = firstHalfK > secondHalfK * 1.45 && firstHalfK > 0.008;
          if (tightens) { mod = 'TIGHTENS'; phraseCore += ', tightens'; }
          else if (crestFlag) { mod = 'OVER CREST'; phraseCore += ', over crest'; }
          else if (len >= 108) { mod = 'LONG'; phraseCore += ', long'; }
          else if (opens) { mod = 'OPENS'; phraseCore += ', opens'; }
          else if (grade <= 1) { mod = 'CAUTION'; }

          const sStart = pts[i].s;
          const sApex = pts[peakIdx].s;
          const sEnd = pts[Math.min(pts.length - 1, j)].s;
          events.push({
            id: `c_${grade}_${dirCode}_${Math.round(sApex / 28)}`,
            kind: 'corner', grade, dirCode, sStart, sApex, sEnd,
            call, mod, sev, icon, phraseCore, priority: prio,
          });
        }
        i = j + 1;
      }

      // C. Detect standalone sharp crests if no corner is within 30m
      for (let k = 2; k < pts.length - 2; k++) {
        const drop = pts[k - 1].pitch - pts[k + 1].pitch;
        if (drop > 0.11) {
          const sC = pts[k].s;
          const nearCorner = events.some((e) => Math.abs(e.sStart - sC) < 32);
          if (!nearCorner) {
            events.push({
              id: `crest_${Math.round(sC / 32)}`,
              kind: 'crest', sStart: sC, sApex: sC + 10, sEnd: sC + 24,
              call: 'CREST', mod: 'KEEP CENTER', sev: 'medium', icon: 'crest',
              phraseCore: 'over crest, keep center', priority: 2,
            });
          }
          k += 4;
        }
      }

      events.sort((a, b) => a.sStart - b.sStart);
      return events;
    }

    update(car, track, simTime) {
      const speedMs = Math.max(0, car.speed || 0);
      const dtSim = (this._lastSimTime !== undefined) ? Math.max(0.001, Math.min(0.1, simTime - this._lastSimTime)) : 0.016;
      this._lastSimTime = simTime;
      if (!this._calledHistory) this._calledHistory = [];

      // 0. Debounced Stop Cutoff: silence co-driver cleanly if stopped (< 12.6 km/h for > 0.35s)
      if (speedMs < 3.5) {
        this._stopTimer += dtSim;
        if (this._stopTimer > 0.35) {
          this.audio.cancelPaceVoice();
          this._active = {
            key: 'stopped', call: 'STAND BY', mod: '', dist: 0,
            sev: 'fast', icon: 'straight', spokenText: '', voiceLang: 'en-US', bannerVisible: false,
            lookaheadM: 0, eventCount: this._events.length, spokenCount: this._spokenCount,
          };
          if (this._elBanner) this._elBanner.classList.remove('visible');
          return this._active;
        }
      } else {
        this._stopTimer = 0;
      }

      // Lead time in seconds (authentic rally co-driver cadence)
      const leadSec = this.timing === 'early' ? 4.8 : (this.timing === 'late' ? 2.5 : 3.6);
      const lookaheadM = Math.max(130, Math.min(340, Math.round(speedMs * leadSec + 68)));

      // Refresh track event list every ~14m of travel (fast & stable IDs)
      if (Math.abs(car.s - this._lastScanS) >= 14 || this._events.length === 0) {
        this._lastScanS = car.s;
        this._events = this._scanTrackEvents(car, track, Math.max(260, lookaheadM + 90));
        // Prune ONLY passed events without ever wiping active upcoming IDs!
        if (this._calledIds.size > 90) {
          const liveIds = new Set(this._events.map((e) => e.id));
          for (const oldId of this._calledIds) { if (!liveIds.has(oldId)) this._calledIds.delete(oldId); }
        }
        if (this._calledHistory.length > 48) {
          this._calledHistory = this._calledHistory.filter((h) => h.sApex > car.s - 120);
        }
      }

      // Upcoming unpassed events (still before apex + 6m)
      const upcoming = this._events.filter((e) => e.sApex + 6 > car.s);
      const nextEv = upcoming[0] || null;

      // 1. Speech Trigger: find the earliest uncalled event inside TTA lead window (spatial dedup prevents boundary double-calls!)
      const wasCalled = (e) => this._calledIds.has(e.id) || this._calledHistory.some((h) => h.kind === e.kind && h.dirCode === e.dirCode && Math.abs(h.sApex - e.sApex) < 30);
      const markCalled = (e) => { this._calledIds.add(e.id); this._calledHistory.push({ kind: e.kind, dirCode: e.dirCode, sApex: e.sApex }); };
      const effSpeed = Math.max(14, speedMs);
      for (let idx = 0; idx < upcoming.length; idx++) {
        const ev = upcoming[idx];
        if (wasCalled(ev)) continue;
        const dist = ev.sStart - car.s;
        if (dist < 14) {
          // Already inside this corner — skip calling it late
          markCalled(ev);
          continue;
        }
        const tta = dist / effSpeed;
        const triggerWindow = leadSec + (ev.priority >= 3 ? 0.65 : 0.0);
        if (tta <= triggerWindow && dist <= lookaheadM) {
          const distRound = Math.max(20, Math.round(dist / 10) * 10);
          let phrase = `${distRound}, ${ev.phraseCore}`;

          // Real co-driver chaining: if next corner starts within 48m of this corner's exit, chain with "into ..."
          const chained = upcoming[idx + 1];
          if (chained && !wasCalled(chained) && (chained.sStart - ev.sEnd) <= 48 && (chained.sStart - ev.sStart) <= 135) {
            phrase += `, into ${chained.phraseCore}`;
            markCalled(chained);
          }

          markCalled(ev);
          this._lastSpokenTime = simTime;
          this._spokenCount++;
          this._lastSpokenPhrase = phrase;
          this.audio.speakPaceNote(phrase, ev.priority >= 4, speedMs);
          break;
        }
        // Events are sorted by sStart, so no need to check further out
        break;
      }

      // 2. On-Screen Manga Pace Signpost: always display the immediate next upcoming event with live ticking distance
      let note;
      if (nextEv && (nextEv.sStart - car.s) <= lookaheadM) {
        const liveDist = Math.max(10, Math.round(Math.max(0, nextEv.sStart - car.s) / 10) * 10);
        note = {
          key: nextEv.id, call: nextEv.call, mod: nextEv.mod,
          dist: liveDist, sev: nextEv.sev, icon: nextEv.icon,
          spokenText: this._lastSpokenPhrase,
        };
      } else {
        note = {
          key: 'flat_out', call: 'FLAT OUT', mod: '', dist: 100,
          sev: 'fast', icon: 'straight', spokenText: this._lastSpokenPhrase,
        };
      }

      const show = this.bannerEnabled && note.key !== 'flat_out';
      this._active = Object.assign({
        voiceLang: 'en-US', bannerVisible: show, lookaheadM,
        eventCount: upcoming.length, spokenCount: this._spokenCount,
      }, note);

      if (this._elBanner) {
        this._elBanner.classList.toggle('visible', show);
        if (this._lastSev !== note.sev) {
          this._lastSev = note.sev;
          this._elBanner.setAttribute('data-sev', note.sev);
        }
        if (this._elSvg && this._lastIcon !== note.icon) {
          this._lastIcon = note.icon;
          this._elSvg.innerHTML = PACE_SVG[note.icon] || PACE_SVG.straight;
        }
        if (this._elCall && this._elCall.textContent !== note.call) this._elCall.textContent = note.call;
        if (this._elMod && this._elMod.textContent !== note.mod) this._elMod.textContent = note.mod;
        const dStr = `${note.dist}m`;
        if (this._elDist && this._elDist.textContent !== dStr) this._elDist.textContent = dStr;
      }
      return this._active;
    }

    getState() { return Object.assign({}, this._active); }
  }

  // =========================================================================
  // 4. MAIN ENGINE BOOTSTRAP, MANGA PAUSE SETTINGS & ZERO-FLASH STREAMING
  // =========================================================================
  PV.boot = function boot() {
    try {
      const canvas = document.getElementById('glCanvas');
      const renderer = new PV.FramePostRenderer(canvas);
      const gl = renderer.gl;
      let contextLost = false;
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); contextLost = true; }, false);
      canvas.addEventListener('webglcontextrestored', () => { location.reload(); }, false);
      const textures = PV.createTextures(gl);
      const skyBackdrop = new PV.SkyBackdrop(gl);
      const track = new PV.TrackGround(gl, textures);
      const trees = new PV.TreesFoliage(gl, textures);
      const blades = new PV.BladesFlowers(gl);
      const car = new PV.RallyCar(gl, textures);
      const fx = new PV.RainFX(gl, textures);
      const audio = new RallyAudio();
      const paceNotes = new PaceNoteEngine(audio);
      const gameplay = new PV.GameplayController();
      gameplay.setMode(gameplay.mode, car);
      let mobileCtrl = null;

      trees.rebuildFromTrack(track);
      blades.rebuildFromTrack(track);

      // Default language: English (persisted if user explicitly switches)
      let currentLang = 'en';
      try {
        const saved = localStorage.getItem('hpt_lang');
        if (saved && I18N[saved]) currentLang = saved;
      } catch (_) {}
      const T = () => I18N[currentLang] || I18N.en;
      const segLabel = (rawName) => (T().segments && T().segments[rawName]) || rawName || 'HILL PASS';

      // Cached DOM handles
      const elDriftVal    = document.getElementById('driftVal');
      const elDriftSub    = document.getElementById('driftSub');
      const elCpDist      = document.getElementById('cpDist');
      const elBoostPct    = document.getElementById('boostPct');
      const elBoostSegs   = document.querySelectorAll('#boostSegs .bseg');
      const elSpeedNum    = document.getElementById('speedNum');
      const elRpmArc      = document.getElementById('rpmArc');
      const elRpmNeedle   = document.getElementById('rpmNeedle');
      const elMapCanvas   = document.getElementById('miniMap');
      const mapCtx        = elMapCanvas ? elMapCanvas.getContext('2d') : null;
      const elMuteBtn     = document.getElementById('muteBtn');
      const elSettingsBtn = document.getElementById('settingsBtn');
      const elWaveInfo    = document.getElementById('waveInfo');
      const elCamBtn      = document.getElementById('camBtn');
      const elWeatherBtn  = document.getElementById('weatherBtn');
      const elTimeBtn     = document.getElementById('timeBtn');
      const elFilterBtn   = document.getElementById('filterBtn');
      const elHud         = document.getElementById('hud');
      const elPauseOv     = document.getElementById('pauseOverlay');
      const elFpsBadge    = document.getElementById('fpsBadge');
      const elFpsVal      = document.getElementById('fpsVal');
      const elFpsMs       = document.getElementById('fpsMs');

      // DOM diff cache
      const _domCache = Object.create(null);
      function setTxt(idOrEl, val) {
        const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
        if (!el) return;
        const key = el.id || '';
        if (key && _domCache[key] === val) return;
        if (key) _domCache[key] = val;
        el.textContent = val;
      }

      // Pause, Settings & Driving Preferences State
      let settingsOpen = true;
      let hasStartedDrive = false;
      let activeSettingsTab = 'graphics';
      let pauseBlend = 0.0;
      let pauseNeedsRender = true;
      let fovOffsetDeg = 0;
      let showFpsEnabled = false;
      try { showFpsEnabled = localStorage.getItem('hpt_show_fps') === '1'; } catch (_) {}
      let eyeAdaptLum = 1.0, eyeExposure = 1.0, eyeGlare = 0.0;
      let avgFrameMs = 16.67;
      function applyShowFps(on) {
        showFpsEnabled = !!on;
        if (elFpsBadge) elFpsBadge.classList.toggle('hidden-opt', !showFpsEnabled);
        try { localStorage.setItem('hpt_show_fps', showFpsEnabled ? '1' : '0'); } catch (_) {}
      }
      function updateFpsBadge(fpsNum, msNum) {
        if (!showFpsEnabled || !elFpsBadge) return;
        setTxt(elFpsVal, String(fpsNum));
        setTxt(elFpsMs, `${msNum.toFixed(1)}ms`);
        const tier = fpsNum >= 50 ? 'high' : (fpsNum >= 30 ? 'mid' : 'low');
        if (elFpsBadge.getAttribute('data-tier') !== tier) elFpsBadge.setAttribute('data-tier', tier);
      }
      applyShowFps(showFpsEnabled);
      let hudSwayEnabled = true;
      let simTime = 0, paused = false, frameCount = 0, fps = 60, lastFpsTime = performance.now(), fpsFrames = 0, nanCount = 0;

      const weatherOrder = ['overcast', 'drizzle', 'storm_break', 'goldmist', 'clear', 'mist', 'downpour', 'dusk', 'dawn'];
      const timeOrder    = ['noon', 'morning', 'golden', 'dusk', 'bluehour', 'dawn'];
      const filterOrder  = ['cinema', 'verdant', 'golden', 'cyber', 'film', 'noir'];

      let camMode = 'chase';
      let camOrbit = null;

      function syncSettingsUI() {
        const d = T(), u = d.ui;
        const g = renderer.getEffectiveGraphics ? renderer.getEffectiveGraphics() : {
          dpr: renderer.quality.dpr, shadowSize: renderer.quality.shadowSize,
          ssr: renderer.quality.ssr, lensQuality: renderer.quality.lensQuality || 2,
          kuwahara: renderer.quality.kuwahara, bloom: renderer.quality.bloom,
        };

        setTxt('fhQualPill', renderer.quality.label);
        setTxt('fhTabGraphicsPill', renderer.quality.label);
        setTxt('fhLangPill', d.langName);
        setTxt('fhTabLanguagePill', d.langShort);
        setTxt('fhTabDrivingPill', camMode === 'cockpit' ? '1P' : '3P');
        setTxt('fhFpsPill', `${fps} FPS • ${renderer.width}×${renderer.height}`);
        const sp = track.sampleAtS(car.s);
        setTxt('fhStagePill', `S${String(track.sectorCount || 1).padStart(2, '0')} • ${segLabel(sp ? sp.seg.name : 'ALPINE PASS')}`);

        // Preset cards
        document.querySelectorAll('#fhQualGrid .mg-card').forEach((btn) => {
          btn.classList.toggle('selected', btn.dataset.qual === renderer.qualityKey);
        });
        document.querySelectorAll('#fhLangGrid .mg-card').forEach((btn) => {
          btn.classList.toggle('selected', btn.dataset.lang === currentLang);
        });

        // Graphics fine controls
        const elDpr = document.getElementById('optDpr');
        if (elDpr) elDpr.value = String(Math.round(g.dpr * 100));
        setTxt('optDprVal', `${g.dpr.toFixed(2)}x`);
        document.querySelectorAll('#optShadowSeg .mg-seg-btn').forEach((b) => {
          b.classList.toggle('on', Number(b.dataset.shadow) === g.shadowSize);
        });
        document.querySelectorAll('#optLensSeg .mg-seg-btn').forEach((b) => {
          b.classList.toggle('on', Number(b.dataset.lens) === Math.round(g.lensQuality));
        });
        document.querySelectorAll('#optFilterSeg .mg-seg-btn').forEach((b) => {
          b.classList.toggle('on', b.dataset.filter === PV.LIGHT.filterKey);
        });
        const setToggle = (id, on) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.classList.toggle('on', !!on);
          setTxt(el, on ? u.on : u.off);
        };
        setToggle('optSsr', g.ssr);
        setToggle('optKuw', g.kuwahara);
        setToggle('optBloom', g.bloom);
        setToggle('fhAudioToggle', !audio.muted);
        setToggle('fhSpatialToggle', audio.spatialEnabled);
        updateAudioBtn(audio.muted);
        setToggle('optPaceVoice', audio.voiceOn);
        setToggle('optPaceHud', paceNotes.bannerEnabled);
        setToggle('optHudSway', hudSwayEnabled);
        setToggle('optShowFps', showFpsEnabled);
        if (mobileCtrl) {
          setToggle('optMobileCtrl', mobileCtrl.enabled);
          setToggle('optMobileAutoGas', mobileCtrl.autoGas);
        }
        document.querySelectorAll('#optModeSeg .mg-seg-btn').forEach((b) => {
          b.classList.toggle('on', b.dataset.mode === gameplay.mode);
        });

        // Driving & Audio segmented controls
        document.querySelectorAll('#optTimingSeg .mg-seg-btn').forEach((b) => {
          b.classList.toggle('on', b.dataset.timing === paceNotes.timing);
          if (u.timing && u.timing[b.dataset.timing]) b.textContent = u.timing[b.dataset.timing];
        });
        document.querySelectorAll('#optCamSeg .mg-seg-btn').forEach((b) => {
          b.classList.toggle('on', b.dataset.cam === camMode);
        });
        document.querySelectorAll('#optWeatherSeg .mg-seg-btn').forEach((b) => {
          b.classList.toggle('on', b.dataset.weather === PV.LIGHT.weatherKey);
        });
        document.querySelectorAll('#optTimeSeg .mg-seg-btn').forEach((b) => {
          b.classList.toggle('on', b.dataset.time === PV.LIGHT.timeKey);
        });
        setTxt('optFovVal', fovOffsetDeg === 0 ? 'STD' : `${fovOffsetDeg > 0 ? '+' : ''}${fovOffsetDeg}°`);

        // Live acoustic readout tags
        const ast = audio.getState();
        const spKey = ast.tunnel > 0.35 ? 'tunnel' : (ast.bridge > 0.35 ? 'bridge' : 'outdoor');
        setTxt('fhAcSpace', `${u.spaceLbl}: ${u.space[spKey] || spKey}`);
        setTxt('fhAcView', `${u.micLbl}: ${u.mic[camMode] || camMode}`);
        setTxt('fhAcSurf', `${u.surfLbl}: ${u.surf[ast.surface] || ast.surface}`);
        setTxt('fhAcBass', `${u.bassLbl}: +${ast.bassBoostDb}dB`);
      }

      function applyLanguage(lang) {
        if (!I18N[lang]) return currentLang;
        currentLang = lang;
        try { localStorage.setItem('hpt_lang', lang); } catch (_) {}
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : (lang === 'ja' ? 'ja-JP' : 'en');
        const d = T(), u = d.ui;
        // Co-Driver speech ALWAYS stays unified English ('en-US')!
        audio.speechLang = 'en-US';

        // HUD labels
        setTxt('lblDriftScore', d.driftScore);
        setTxt('lblBoost', d.boost);
        setTxt('lblMapTitle', d.mapTitle);
        setTxt('lblSpeed', d.speed);
        setTxt('hintDrift', d.hintDrift);
        setTxt('hintBoost', d.hintBoost);
        setTxt('hintView', d.hintView);
        setTxt('hintStage', d.hintStage);
        setTxt('hintPause', d.hintPause);
        setTxt('settingsBtnTxt', d.settingsBtn);

        // Bottom-right retained buttons
        setTxt(elCamBtn, d.cam[camMode] || d.cam.chase);
        setTxt(elTimeBtn, d.time[PV.LIGHT.timeKey] || PV.LIGHT.timeKey);
        setTxt(elWeatherBtn, d.weather[PV.LIGHT.weatherKey] || PV.LIGHT.weatherKey);
        setTxt(elFilterBtn, d.filter[PV.LIGHT.filterKey] || PV.LIGHT.filterKey);

        // Manga Settings menu labels
        setTxt('fhBrandTitle', d.brandTitle);
        setTxt('fhPauseSub', d.pauseSub);
        setTxt('fhResumeTxt', u.resume);
        setTxt('fhResumeSub', u.resumeSub);
        setTxt('fhTabGraphicsTxt', u.graphics);
        setTxt('fhTabGraphicsSub', u.graphicsSub);
        setTxt('fhTabAudioTxt', u.audio);
        setTxt('fhTabAudioSub', u.audioSub);
        setTxt('fhTabDrivingTxt', u.driving);
        setTxt('fhTabDrivingSub', u.drivingSub);
        setTxt('fhTabLanguageTxt', u.language);
        setTxt('fhTabLanguageSub', u.languageSub);
        setTxt('fhNewStageTxt', u.newStage);
        setTxt('fhNewStageSub', u.newStageSub);

        setTxt('fhGfxTitle', u.gfxTitle); setTxt('fhGfxDesc', u.gfxDesc);
        setTxt('fhAudTitle', u.audTitle); setTxt('fhAudDesc', u.audDesc);
        setTxt('fhDrvTitle', u.drvTitle); setTxt('fhDrvDesc', u.drvDesc);
        setTxt('fhLangTitle', u.langTitle); setTxt('fhLangDesc', u.langDesc);
        setTxt('fhLangVoiceNote', u.langVoiceNote);

        setTxt('lblOptDpr', u.optDpr); setTxt('lblOptShadow', u.optShadow);
        setTxt('lblOptSsr', u.optSsr); setTxt('lblOptKuw', u.optKuw);
        setTxt('lblOptLens', u.optLens); setTxt('lblOptBloom', u.optBloom);
        setTxt('lblOptFilter', u.optFilter);
        setTxt('fhLblMasterVol', u.masterVol); setTxt('fhLblEngineVol', u.engineVol);
        setTxt('fhLblEnvVol', u.envVol); setTxt('fhLblVoiceVol', u.voiceVol);
        setTxt('fhLblSpatial', u.spatialToggle); setTxt('lblOptPaceVoice', u.optPaceVoice);
        setTxt('lblOptCallTiming', u.optCallTiming);
        setTxt('lblOptCam', u.optCam); setTxt('lblOptFov', u.optFov);
        setTxt('lblOptPaceHud', u.optPaceHud); setTxt('lblOptHudSway', u.optHudSway);
        setTxt('lblOptShowFps', u.optShowFps);
        setTxt('lblOptGameMode', u.optGameMode); setTxt('optModeStage', u.modeStage); setTxt('optModeCruise', u.modeCruise);
        setTxt('lblOptMobileCtrl', u.optMobileCtrl); setTxt('lblOptMobileAutoGas', u.optMobileAutoGas);
        if (mobileCtrl) mobileCtrl.applyLabels(lang);
        setTxt('lblOptWeather', u.optWeather); setTxt('lblOptTime', u.optTime);
        setTxt('optCamChase', d.cam.chase); setTxt('optCamCockpit', d.cam.cockpit);

        setTxt('fhFootResume', u.footResume);
        setTxt('fhFootTabs', u.footTabs);
        setTxt('fhFootMute', u.footMute);
        setTxt('fhFootView', u.footView);
        setTxt('fhFootStatus', u.footStatus);

        document.querySelectorAll('[data-qname]').forEach((el) => {
          const k = el.dataset.qname;
          if (d.qual[k]) el.textContent = d.qual[k].name;
        });
        document.querySelectorAll('[data-qdesc]').forEach((el) => {
          const k = el.dataset.qdesc;
          if (d.qual[k]) el.textContent = d.qual[k].desc;
        });
        document.querySelectorAll('#optFilterSeg .mg-seg-btn').forEach((b) => {
          if (d.filter[b.dataset.filter]) b.textContent = d.filter[b.dataset.filter];
        });
        document.querySelectorAll('#optWeatherSeg .mg-seg-btn').forEach((b) => {
          if (d.weather[b.dataset.weather]) b.textContent = d.weather[b.dataset.weather];
        });
        document.querySelectorAll('#optTimeSeg .mg-seg-btn').forEach((b) => {
          if (d.time[b.dataset.time]) b.textContent = d.time[b.dataset.time];
        });

        delete _domCache.waveInfo; delete _domCache.cpDist; delete _domCache.driftSub; delete _domCache.boostPct;
        updateLaunchCopy();
        syncSettingsUI();
        updateHUD();
        return currentLang;
      }

      const ALL_TABS = ['graphics', 'audio', 'driving', 'language'];
      function setSettingsTab(tab) {
        activeSettingsTab = ALL_TABS.indexOf(tab) >= 0 ? tab : 'graphics';
        document.querySelectorAll('.mg-nav[data-tab]').forEach((b) => {
          b.classList.toggle('active', b.dataset.tab === activeSettingsTab);
        });
        const map = { graphics: 'fhPanelGraphics', audio: 'fhPanelAudio', driving: 'fhPanelDriving', language: 'fhPanelLanguage' };
        ALL_TABS.forEach((k) => {
          const p = document.getElementById(map[k]);
          if (p) p.classList.toggle('active', k === activeSettingsTab);
        });
        syncSettingsUI();
      }

      function updateLaunchCopy() {
        const d = T(), u = d.ui;
        if (!hasStartedDrive) {
          setTxt('fhResumeTxt', currentLang === 'zh' ? '开始驾驶' : (currentLang === 'ja' ? 'ステージ開始' : 'START STAGE'));
          setTxt('fhResumeSub', currentLang === 'zh' ? '进入山道拉力实机赛段' : (currentLang === 'ja' ? '山道ラリーステージへ出発' : 'Launch into the mountain rally stage'));
          setTxt('fhPauseSub', currentLang === 'zh' ? '准备出发 // 山道拉力赛段' : (currentLang === 'ja' ? '出走準備 // 山道ラリーステージ' : 'READY // MOUNTAIN RALLY STAGE'));
        } else {
          setTxt('fhResumeTxt', u.resume);
          setTxt('fhResumeSub', u.resumeSub);
          setTxt('fhPauseSub', d.pauseSub);
        }
      }

      function openSettings(tab, instant, silent) {
        if (tab) setSettingsTab(tab);
        if (mobileCtrl) mobileCtrl.clearAll();
        settingsOpen = true;
        paused = true;
        if (instant) pauseBlend = 1.0;
        pauseNeedsRender = true;
        document.body.classList.add('pause-open');
        if (elPauseOv) elPauseOv.setAttribute('aria-hidden', 'false');
        const envNow = track.getAcousticEnv ? track.getAcousticEnv(car.s, _acousticEnv) : _acousticEnv;
        audio.update(car, envNow, camMode, 0.016);
        audio.setPaused(true);
        if (!silent) audio.playUiSound('pause');
        updateLaunchCopy();
        syncSettingsUI();
      }

      function closeSettings(instant) {
        hasStartedDrive = true;
        settingsOpen = false;
        paused = false;
        if (instant) pauseBlend = 0.0;
        document.body.classList.remove('pause-open');
        if (elPauseOv) elPauseOv.setAttribute('aria-hidden', 'true');
        audio.ensureUnlocked();
        audio.setPaused(false);
        audio.playUiSound('resume');
        updateLaunchCopy();
      }

      function applyQuality(q) {
        renderer.setQuality(q);
        pauseNeedsRender = true;
        syncSettingsUI();
      }

      function applyWeatherUI(w) {
        const k = PV.applyWeather(w);
        setTxt(elWeatherBtn, T().weather[k] || (PV.WEATHER_PRESETS[k] || PV.WEATHER_PRESETS.overcast).label);
        pauseNeedsRender = true;
        syncSettingsUI();
        return k;
      }
      function applyTimeUI(t) {
        const k = PV.applyTime(t);
        setTxt(elTimeBtn, T().time[k] || (PV.TIME_PRESETS[k] || PV.TIME_PRESETS.noon).label);
        pauseNeedsRender = true;
        syncSettingsUI();
        return k;
      }
      function applyFilterUI(f) {
        const k = PV.applyFilter(f);
        setTxt(elFilterBtn, T().filter[k] || (PV.FILTER_PRESETS[k] || PV.FILTER_PRESETS.cinema).label);
        pauseNeedsRender = true;
        syncSettingsUI();
        return k;
      }
      function applyCamModeUI(m) {
        camMode = (m === 'cockpit') ? 'cockpit' : 'chase';
        setTxt(elCamBtn, T().cam[camMode] || (camMode === 'cockpit' ? 'COCKPIT' : 'CHASE'));
        document.body.classList.toggle('cockpit-mode', camMode === 'cockpit');
        updateCamera(0.016, true);
        pauseNeedsRender = true;
        syncSettingsUI();
        return camMode;
      }
      function updateAudioBtn(muted) { if (!elMuteBtn) return; elMuteBtn.setAttribute('data-muted', muted ? '1' : '0'); elMuteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false'); }

      function resetRunWithNewSeed(customSeed) {
        const nextSeed = (typeof customSeed === 'number' && Number.isFinite(customSeed))
          ? (customSeed >>> 0)
          : ((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
        track.reset(nextSeed);
        trees.rebuildFromTrack(track);
        blades.rebuildFromTrack(track);
        paceNotes.reset();
        car.reset();
        gameplay.setMode(gameplay.mode, car);
        gameplay.reset();
        simTime = 0;
        car.step(0.016, { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false }, track);
        updateCamera(0.016, true);
        pauseNeedsRender = true;
        return nextSeed;
      }

      // === WIRE ALL MANGA SETTINGS MENU CONTROLS ===
      if (elSettingsBtn) elSettingsBtn.addEventListener('click', () => { openSettings(activeSettingsTab); elSettingsBtn.blur(); });
      const elResumeBtn = document.getElementById('fhResumeBtn');
      if (elResumeBtn) elResumeBtn.addEventListener('click', () => closeSettings());
      const elNewStageBtn = document.getElementById('fhNewStageBtn');
      if (elNewStageBtn) elNewStageBtn.addEventListener('click', () => { resetRunWithNewSeed(); closeSettings(); });

      document.querySelectorAll('.mg-nav[data-tab]').forEach((btn) => {
        btn.addEventListener('click', () => { audio.playUiSound('select'); setSettingsTab(btn.dataset.tab); });
      });
      document.querySelectorAll('#fhQualGrid .mg-card').forEach((btn) => {
        btn.addEventListener('click', () => { audio.playUiSound('select'); applyQuality(btn.dataset.qual); });
      });
      document.querySelectorAll('#fhLangGrid .mg-card').forEach((btn) => {
        btn.addEventListener('click', () => { audio.playUiSound('select'); applyLanguage(btn.dataset.lang); });
      });

      // Graphics Fine Controls
      const elOptDpr = document.getElementById('optDpr');
      if (elOptDpr) elOptDpr.addEventListener('input', () => {
        const dpr = (Number(elOptDpr.value) || 100) / 100;
        renderer.setCustomOption('dpr', dpr);
        pauseNeedsRender = true;
        syncSettingsUI();
      });
      document.querySelectorAll('#optShadowSeg .mg-seg-btn').forEach((b) => {
        b.addEventListener('click', () => {
          audio.playUiSound('select');
          renderer.setCustomOption('shadowSize', Number(b.dataset.shadow));
          pauseNeedsRender = true; syncSettingsUI();
        });
      });
      document.querySelectorAll('#optLensSeg .mg-seg-btn').forEach((b) => {
        b.addEventListener('click', () => {
          audio.playUiSound('select');
          renderer.setCustomOption('lensQuality', Number(b.dataset.lens));
          pauseNeedsRender = true; syncSettingsUI();
        });
      });
      document.querySelectorAll('#optFilterSeg .mg-seg-btn').forEach((b) => {
        b.addEventListener('click', () => { audio.playUiSound('select'); applyFilterUI(b.dataset.filter); });
      });
      const wireGfxToggle = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', () => {
          const g = renderer.getEffectiveGraphics();
          renderer.setCustomOption(key, !g[key]);
          audio.playUiSound('select');
          pauseNeedsRender = true; syncSettingsUI();
        });
      };
      wireGfxToggle('optSsr', 'ssr');
      wireGfxToggle('optKuw', 'kuwahara');
      wireGfxToggle('optBloom', 'bloom');

      // Audio & Co-Driver Controls
      const elMasterVol = document.getElementById('fhMasterVol');
      const elEngineVol = document.getElementById('fhEngineVol');
      const elEnvVol    = document.getElementById('fhEnvVol');
      const elVoiceVol  = document.getElementById('fhVoiceVol');
      if (elMasterVol) elMasterVol.addEventListener('input', () => {
        const v = Number(elMasterVol.value) || 0;
        setTxt('fhMasterVolVal', `${v}%`);
        audio.setVolumes(v / 100, undefined, undefined, undefined);
      });
      if (elEngineVol) elEngineVol.addEventListener('input', () => {
        const v = Number(elEngineVol.value) || 0;
        setTxt('fhEngineVolVal', `${v}%`);
        audio.setVolumes(undefined, v / 100, undefined, undefined);
      });
      if (elEnvVol) elEnvVol.addEventListener('input', () => {
        const v = Number(elEnvVol.value) || 0;
        setTxt('fhEnvVolVal', `${v}%`);
        audio.setVolumes(undefined, undefined, v / 100, undefined);
      });
      if (elVoiceVol) elVoiceVol.addEventListener('input', () => {
        const v = Number(elVoiceVol.value) || 0;
        setTxt('fhVoiceVolVal', `${v}%`);
        audio.setVolumes(undefined, undefined, undefined, v / 100);
      });
      const elAudioTg = document.getElementById('fhAudioToggle');
      if (elAudioTg) elAudioTg.addEventListener('click', () => {
        const m = audio.toggle();
        updateAudioBtn(m);
        if (!m) audio.playUiSound('select');
        syncSettingsUI();
      });
      const elResetBtn = document.getElementById('fhResetBtn');
      if (elResetBtn) elResetBtn.addEventListener('click', () => {
        applyQuality('xultra');
        applyFilterUI('cinema');
        applyWeatherUI('overcast');
        applyTimeUI('noon');
        applyCamModeUI('chase');
        fovOffsetDeg = 0; hudSwayEnabled = true;
        paceNotes.setTiming('normal'); paceNotes.setBannerEnabled(true);
        audio.setSpatialEnabled(true); audio.setVoiceEnabled(true); audio.setMuted(false);
        audio.playUiSound('select');
        syncSettingsUI();
      });
      const unlockOnce = () => {
        audio.ensureUnlocked();
        window.removeEventListener('pointerdown', unlockOnce, true);
        window.removeEventListener('keydown', unlockOnce, true);
      };
      window.addEventListener('pointerdown', unlockOnce, true);
      window.addEventListener('keydown', unlockOnce, true);
      const elSpatialTg = document.getElementById('fhSpatialToggle');
      if (elSpatialTg) elSpatialTg.addEventListener('click', () => {
        audio.setSpatialEnabled(!audio.spatialEnabled);
        audio.playUiSound('select'); syncSettingsUI();
      });
      const elPaceVoiceTg = document.getElementById('optPaceVoice');
      if (elPaceVoiceTg) elPaceVoiceTg.addEventListener('click', () => {
        audio.setVoiceEnabled(!audio.voiceOn);
        audio.playUiSound('select'); syncSettingsUI();
      });
      document.querySelectorAll('#optTimingSeg .mg-seg-btn').forEach((b) => {
        b.addEventListener('click', () => {
          paceNotes.setTiming(b.dataset.timing);
          audio.playUiSound('select'); syncSettingsUI();
        });
      });

      // Driving & HUD Controls
      document.querySelectorAll('#optCamSeg .mg-seg-btn').forEach((b) => {
        b.addEventListener('click', () => { audio.playUiSound('select'); applyCamModeUI(b.dataset.cam); });
      });
      const elOptFov = document.getElementById('optFov');
      if (elOptFov) elOptFov.addEventListener('input', () => {
        fovOffsetDeg = Number(elOptFov.value) || 0;
        updateCamera(0.016, true);
        pauseNeedsRender = true; syncSettingsUI();
      });
      const elPaceHudTg = document.getElementById('optPaceHud');
      if (elPaceHudTg) elPaceHudTg.addEventListener('click', () => {
        paceNotes.setBannerEnabled(!paceNotes.bannerEnabled);
        audio.playUiSound('select'); syncSettingsUI();
      });
      const elHudSwayTg = document.getElementById('optHudSway');
      if (elHudSwayTg) elHudSwayTg.addEventListener('click', () => {
        hudSwayEnabled = !hudSwayEnabled;
        if (!hudSwayEnabled && elHud) {
          elHud.style.setProperty('--hx', '0px'); elHud.style.setProperty('--hy', '0px');
          elHud.style.setProperty('--hrx', '0deg'); elHud.style.setProperty('--hry', '0deg');
          elHud.style.setProperty('--hrz', '0deg'); elHud.style.setProperty('--hscale', '1');
        }
        audio.playUiSound('select'); syncSettingsUI();
      });
      const elShowFpsTg = document.getElementById('optShowFps');
      if (elShowFpsTg) elShowFpsTg.addEventListener('click', () => {
        applyShowFps(!showFpsEnabled);
        updateFpsBadge(fps, avgFrameMs);
        audio.playUiSound('select'); syncSettingsUI();
      });
      document.querySelectorAll('#optModeSeg .mg-seg-btn').forEach((b) => {
        b.addEventListener('click', () => {
          gameplay.setMode(b.dataset.mode, car);
          audio.playUiSound('select'); syncSettingsUI(); updateHUD();
        });
      });
      mobileCtrl = new PV.MobileTouchController({
        onToggleCam: () => applyCamModeUI(camMode === 'chase' ? 'cockpit' : 'chase'),
        onOpenSettings: () => openSettings(activeSettingsTab),
      });
      const elMobileTg = document.getElementById('optMobileCtrl');
      if (elMobileTg) elMobileTg.addEventListener('click', () => {
        mobileCtrl.setEnabled(!mobileCtrl.enabled);
        audio.playUiSound('select'); syncSettingsUI();
      });
      const elMobileAgTg = document.getElementById('optMobileAutoGas');
      if (elMobileAgTg) elMobileAgTg.addEventListener('click', () => {
        mobileCtrl.setAutoGas(!mobileCtrl.autoGas);
        audio.playUiSound('select'); syncSettingsUI();
      });
      document.querySelectorAll('#optWeatherSeg .mg-seg-btn').forEach((b) => {
        b.addEventListener('click', () => { audio.playUiSound('select'); applyWeatherUI(b.dataset.weather); });
      });
      document.querySelectorAll('#optTimeSeg .mg-seg-btn').forEach((b) => {
        b.addEventListener('click', () => { audio.playUiSound('select'); applyTimeUI(b.dataset.time); });
      });

      // Wire Bottom-Right Retained Controls
      if (elMuteBtn) elMuteBtn.addEventListener('click', () => { updateAudioBtn(audio.toggle()); elMuteBtn.blur(); });
      if (elWeatherBtn) elWeatherBtn.addEventListener('click', () => {
        applyWeatherUI(weatherOrder[(weatherOrder.indexOf(PV.LIGHT.weatherKey) + 1) % weatherOrder.length]);
        elWeatherBtn.blur();
      });
      if (elTimeBtn) elTimeBtn.addEventListener('click', () => {
        applyTimeUI(timeOrder[(timeOrder.indexOf(PV.LIGHT.timeKey) + 1) % timeOrder.length]);
        elTimeBtn.blur();
      });
      if (elFilterBtn) elFilterBtn.addEventListener('click', () => {
        applyFilterUI(filterOrder[(filterOrder.indexOf(PV.LIGHT.filterKey) + 1) % filterOrder.length]);
        elFilterBtn.blur();
      });
      if (elCamBtn) elCamBtn.addEventListener('click', () => {
        applyCamModeUI(camMode === 'chase' ? 'cockpit' : 'chase');
        elCamBtn.blur();
      });

      const keys = {};
      window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Escape' && !e.repeat) {
          e.preventDefault();
          if (settingsOpen) closeSettings();
          else openSettings(activeSettingsTab);
          return;
        }
        if (e.code === 'KeyM' && !e.repeat) { updateAudioBtn(audio.toggle()); return; }
        if (settingsOpen) {
          if (!e.repeat && (e.code === 'Enter' || e.code === 'Space')) {
            e.preventDefault();
            closeSettings();
            return;
          }
          if (!e.repeat && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3' || e.code === 'Digit4')) {
            audio.playUiSound('select');
            setSettingsTab(ALL_TABS[Number(e.code.slice(5)) - 1]);
          } else if (!e.repeat && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
            e.preventDefault();
            const idx = ALL_TABS.indexOf(activeSettingsTab);
            const dir = e.code === 'ArrowDown' ? 1 : -1;
            audio.playUiSound('hover');
            setSettingsTab(ALL_TABS[(idx + dir + ALL_TABS.length) % ALL_TABS.length]);
          }
          return;
        }
        if (e.code === 'KeyR' && !e.repeat) resetRunWithNewSeed();
        if (e.code === 'KeyT' && !e.repeat) applyWeatherUI(weatherOrder[(weatherOrder.indexOf(PV.LIGHT.weatherKey) + 1) % weatherOrder.length]);
        if (e.code === 'KeyC' && !e.repeat) applyTimeUI(timeOrder[(timeOrder.indexOf(PV.LIGHT.timeKey) + 1) % timeOrder.length]);
        if (e.code === 'KeyF' && !e.repeat) applyFilterUI(filterOrder[(filterOrder.indexOf(PV.LIGHT.filterKey) + 1) % filterOrder.length]);
        if (e.code === 'KeyV' && !e.repeat) applyCamModeUI(camMode === 'chase' ? 'cockpit' : 'chase');
      });
      window.addEventListener('keyup', (e) => { keys[e.code] = false; });
      window.addEventListener('resize', () => { renderer.resize(window.innerWidth, window.innerHeight); pauseNeedsRender = true; });

      // Reusable input & acoustic env objects (zero GC per frame)
      const _inputReuse = { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false };
      const _acousticEnv = { tunnel: 0, bridge: 0, surfMode: 0, themeId: 0, bridgeStyle: 'none', waterNearby: 0, forestFactor: 0, exposure: 0.5 };
      const _upVecReuse = [0, 1, 0];
      const _dtHudReuse = { kmh: 0, gear: 1, gearLabel: '1', rpmNorm: 0.5 };

      function readInput() {
        let steer = 0, throttle = 0, brake = 0, handbrake = false, boost = false;
        if (keys.KeyA || keys.ArrowLeft) steer -= 1;
        if (keys.KeyD || keys.ArrowRight) steer += 1;
        if (keys.KeyW || keys.ArrowUp) throttle = 1;
        if (keys.KeyS || keys.ArrowDown) brake = 1;
        if (keys.Space) handbrake = true;
        if (keys.ShiftLeft || keys.ShiftRight) boost = true;
        const pads = navigator.getGamepads ? navigator.getGamepads() : null;
        const gp = pads && pads[0];
        if (gp) {
          if (Math.abs(gp.axes[0]) > 0.12) steer = gp.axes[0];
          if (gp.buttons[7] && gp.buttons[7].value > 0.1) throttle = gp.buttons[7].value;
          if (gp.buttons[6] && gp.buttons[6].value > 0.1) brake = gp.buttons[6].value;
          if (gp.buttons[4] && gp.buttons[4].pressed) handbrake = true;
          if (gp.buttons[5] && gp.buttons[5].pressed) boost = true;
        }
        _inputReuse.steer = steer; _inputReuse.throttle = throttle; _inputReuse.brake = brake;
        _inputReuse.handbrake = handbrake; _inputReuse.boost = boost;
        if (mobileCtrl) mobileCtrl.mergeInput(_inputReuse, settingsOpen);
        return _inputReuse;
      }

      const camPos = [0, 3, -8], camLook = [0, 1, 10];
      let springSwing = 0, springSwingVel = 0, camRoll = 0;
      let smoothCamYaw = 0, smoothCamPitch = 0, smoothDistBack = 5.5, smoothFov = 55.0, smoothHeight = 1.72, smoothShake = 0.0;
      let smoothDt = 0.0167;
      let hudX = 0, hudY = 0, hudRX = 0, hudRY = 0, hudRZ = 0, hudScale = 1.0;
      let prevCamYawForHud = 0, prevSpeedForHud = 0;

      function updateCamera(dt, snap) {
        const sp = track.sampleAtS(car.s);
        const spAhead = track.sampleAtS(car.s + 16.0);
        const roadYaw = sp ? sp.yaw : car.yaw;
        const targetYaw = roadYaw + car.driftAngle * 0.22;
        const targetPitch = sp ? (sp.pitch || 0) : (car.pitch || 0);
        if (snap) {
          smoothCamYaw = targetYaw;
          smoothCamPitch = targetPitch;
        } else {
          let dy = targetYaw - smoothCamYaw;
          while (dy > Math.PI) dy -= Math.PI * 2;
          while (dy < -Math.PI) dy += Math.PI * 2;
          smoothCamYaw += dy * (1.0 - Math.exp(-10.5 * dt));
          smoothCamPitch += (targetPitch - smoothCamPitch) * (1.0 - Math.exp(-7.5 * dt));
        }
        const sy = Math.sin(smoothCamYaw), cy = Math.cos(smoothCamYaw);
        const rx = -cy, rz = sy;

        const targetSwing = -car.driftAngle * 0.68 - 0.04;
        if (snap) {
          springSwing = targetSwing; springSwingVel = 0;
        } else {
          const omega = 6.8;
          const acc = omega * omega * (targetSwing - springSwing) - 2.0 * omega * springSwingVel;
          springSwingVel += acc * dt;
          springSwing += springSwingVel * dt;
        }

        const speedFrac = Math.min(1, car.speed / 38.0);
        const targetShake = speedFrac * (0.014 + (car.inPuddle ? 0.010 : 0.0) + Math.abs(car.driftAngle) * 0.018);
        smoothShake = snap ? targetShake : (smoothShake + (targetShake - smoothShake) * (1.0 - Math.exp(-8.0 * dt)));
        const shX = Math.sin(simTime * 34.0) * smoothShake;
        const shY = Math.cos(simTime * 47.0) * smoothShake * 0.80;

        const targetDistBack = 5.35 + speedFrac * 0.48 + Math.abs(car.driftAngle) * 0.40 + (car.boosting ? 0.58 : 0.0) - (car.weightShift || 0) * 0.16;
        const targetHeight = 1.72 + Math.abs(car.driftAngle) * 0.08 - (car.boosting ? 0.06 : 0.0);
        const targetFovDeg = 54.0 + fovOffsetDeg + speedFrac * 4.2 + (car.boosting ? 6.2 : 0.0);
        if (snap) {
          smoothDistBack = targetDistBack;
          smoothHeight = targetHeight;
          smoothFov = targetFovDeg;
        } else {
          const kCam = 1.0 - Math.exp(-6.5 * dt);
          smoothDistBack += (targetDistBack - smoothDistBack) * kCam;
          smoothHeight += (targetHeight - smoothHeight) * kCam;
          smoothFov += (targetFovDeg - smoothFov) * (1.0 - Math.exp(-5.8 * dt));
        }
        const pitchBackY = -Math.sin(smoothCamPitch) * smoothDistBack * 0.72;
        const tx = car.pos[0] - sy * smoothDistBack + rx * springSwing + shX;
        const ty = car.pos[1] + smoothHeight + pitchBackY + shY;
        const tz = car.pos[2] - cy * smoothDistBack + rz * springSwing;

        const aheadY = spAhead ? spAhead.pos[1] : (car.pos[1] + Math.sin(smoothCamPitch) * 16.0);
        const lx = car.pos[0] + sy * 13.5 + rx * (springSwing * 0.16);
        const ly = car.pos[1] * 0.35 + aheadY * 0.65 + 1.08 + Math.sin(smoothCamPitch) * 1.1;
        const lz = car.pos[2] + cy * 13.5 + rz * (springSwing * 0.16);

        const targetRoll = -car.driftAngle * 0.095 - (car.bank || 0) * 0.34;
        if (camMode === 'cockpit' && !(camOrbit && camOrbit.dist > 0.1)) {
          const m = car.modelMat;
          const al = PV.COCKPIT_V4_ALIGN || { yOff: 0.21, zOff: -0.14 };
          const headLat = Math.max(-0.022, Math.min(0.022, -car.driftAngle * 0.032));
          const headLon = Math.max(-0.018, Math.min(0.018, (car.boosting ? -0.012 : 0.0) + (car.weightShift || 0) * 0.014));
          const idleVibe = Math.sin(simTime * 52.0) * 0.0005 * (1.0 - speedFrac * 0.5);
          const ex = 0.338 + headLat, ey = 0.898 + al.yOff + idleVibe, ez = -0.260 + al.zOff + headLon;
          camPos[0] = m[0]*ex + m[4]*ey + m[8]*ez  + m[12];
          camPos[1] = m[1]*ex + m[5]*ey + m[9]*ez  + m[13];
          camPos[2] = m[2]*ex + m[6]*ey + m[10]*ez + m[14];
          const kx = 0.30 + (car.steerInput || 0) * 0.45 + (car.driftAngle || 0) * 1.15;
          const ky = 0.70 + al.yOff + Math.sin(smoothCamPitch) * 0.55, kz = 12.0;
          camLook[0] = m[0]*kx + m[4]*ky + m[8]*kz  + m[12];
          camLook[1] = m[1]*kx + m[5]*ky + m[9]*kz  + m[13];
          camLook[2] = m[2]*kx + m[6]*ky + m[10]*kz + m[14];
          const tgtCockpitRoll = (car.bank || 0) + (car.bodyRoll || 0) * 0.72;
          camRoll = snap ? tgtCockpitRoll : (camRoll + (tgtCockpitRoll - camRoll) * (1.0 - Math.exp(-10.0 * dt)));
        } else if (camOrbit && camOrbit.dist > 0.1) {
          const oy = car.yaw + camOrbit.yawOff;
          camPos[0] = car.pos[0] - Math.sin(oy) * camOrbit.dist;
          camPos[1] = car.pos[1] + camOrbit.height;
          camPos[2] = car.pos[2] - Math.cos(oy) * camOrbit.dist;
          camLook[0] = car.pos[0];
          camLook[1] = car.pos[1] + 0.72;
          camLook[2] = car.pos[2];
          camRoll = 0;
        } else {
          camPos[0] = tx; camPos[1] = ty; camPos[2] = tz;
          camLook[0] = lx; camLook[1] = ly; camLook[2] = lz;
          camRoll = snap ? targetRoll : (camRoll + (targetRoll - camRoll) * (1.0 - Math.exp(-8.5 * dt)));
        }

        renderer.camPos[0]=camPos[0]; renderer.camPos[1]=camPos[1]; renderer.camPos[2]=camPos[2];
        renderer.carPos[0]=car.pos[0]; renderer.carPos[1]=car.pos[1]; renderer.carPos[2]=car.pos[2];
        renderer.carFwd[0]=car.fwd[0]; renderer.carFwd[1]=car.fwd[1]; renderer.carFwd[2]=car.fwd[2];
        renderer.carRight[0]=car.right[0]; renderer.carRight[1]=car.right[1]; renderer.carRight[2]=car.right[2];

        const fov = (camMode === 'cockpit' ? (70.0 + fovOffsetDeg + speedFrac * 3.5 + (car.boosting ? 4.5 : 0.0)) : smoothFov) * Math.PI / 180;
        const cr = Math.cos(camRoll), sr = Math.sin(camRoll);
        _upVecReuse[0] = rx * sr; _upVecReuse[1] = cr; _upVecReuse[2] = rz * sr;
        renderer.nearPlane = (camMode === 'cockpit' && !(camOrbit && camOrbit.dist > 0.1)) ? 0.05 : 0.25;
        PV.M4.perspective(renderer.projMat, fov, renderer.width / renderer.height, renderer.nearPlane, renderer.farPlane);
        PV.M4.lookAt(renderer.viewMat, camPos, camLook, _upVecReuse);
        PV.M4.multiply(renderer.vpMat, renderer.projMat, renderer.viewMat);
        renderer.updateShadowMatrix(car.pos, car.fwd);

        if (elHud && !settingsOpen && hudSwayEnabled) {
          let dyawHud = smoothCamYaw - prevCamYawForHud;
          while (dyawHud > Math.PI) dyawHud -= Math.PI * 2;
          while (dyawHud < -Math.PI) dyawHud += Math.PI * 2;
          const yawRate = snap ? 0 : Math.max(-2.5, Math.min(2.5, dyawHud / Math.max(dt, 0.008)));
          const longAccel = snap ? 0 : Math.max(-14.0, Math.min(14.0, (car.speed - prevSpeedForHud) / Math.max(dt, 0.008)));
          prevCamYawForHud = smoothCamYaw;
          prevSpeedForHud = car.speed;

          const bumpX = Math.sin(simTime * 31.0) * smoothShake * 62.0;
          const bumpY = Math.cos(simTime * 43.0) * smoothShake * 38.0;
          const tgtX = Math.max(-17.5, Math.min(17.5, -car.driftAngle * 18.5 - yawRate * 6.5 + bumpX));
          const tgtY = Math.max(-3.6, Math.min(5.8, -longAccel * 0.24 + (car.boosting ? 2.4 : 0.0) - Math.sin(smoothCamPitch) * 4.8 + bumpY));
          const tgtRX = Math.max(-0.95, Math.min(0.95, longAccel * 0.055 + Math.sin(smoothCamPitch) * 1.8 + (car.boosting ? -0.40 : 0.0)));
          const tgtRY = Math.max(-2.6, Math.min(2.6, car.driftAngle * 3.1 + yawRate * 1.05));
          const tgtRZ = Math.max(-1.85, Math.min(1.85, camRoll * 17.5 + car.driftAngle * 0.95));
          const tgtSc = 1.0 + (car.boosting ? 0.011 : 0.0) + speedFrac * 0.004;
          const kHud = snap ? 1.0 : (1.0 - Math.exp(-9.5 * dt));
          hudX += (tgtX - hudX) * kHud;
          hudY += (tgtY - hudY) * kHud;
          hudRX += (tgtRX - hudRX) * kHud;
          hudRY += (tgtRY - hudRY) * kHud;
          hudRZ += (tgtRZ - hudRZ) * kHud;
          hudScale += (tgtSc - hudScale) * kHud;
          elHud.style.setProperty('--hx', `${hudX.toFixed(2)}px`);
          elHud.style.setProperty('--hy', `${hudY.toFixed(2)}px`);
          elHud.style.setProperty('--hrx', `${hudRX.toFixed(2)}deg`);
          elHud.style.setProperty('--hry', `${hudRY.toFixed(2)}deg`);
          elHud.style.setProperty('--hrz', `${hudRZ.toFixed(2)}deg`);
          elHud.style.setProperty('--hscale', hudScale.toFixed(4));
        }
      }

      function drawMinimap() {
        if (!mapCtx) return;
        const W = elMapCanvas.width, H = elMapCanvas.height, cx = W*0.5, cy = H*0.5;
        mapCtx.clearRect(0, 0, W, H);
        mapCtx.save();
        mapCtx.beginPath(); mapCtx.arc(cx, cy, cx - 2, 0, Math.PI * 2); mapCtx.clip();
        const scale = 0.42, spNow = track.sampleAtS(car.s), yaw = spNow ? spNow.yaw : 0;
        const curSeg = spNow ? spNow.seg : null;
        const vSide = (curSeg && curSeg.hillMode === 1) ? -1 : 1; // -1 = left valley/lake, +1 = right valley/lake
        mapCtx.fillStyle = (curSeg && curSeg.landform === 'plain_meadow') ? '#49633d' : '#3a5038';
        mapCtx.fillRect(0, 0, W, H);
        if (curSeg && curSeg.hasLake) {
          // Dynamic alpine lake rendered on ACTUAL left or right side of road!
          mapCtx.fillStyle = '#245d78';
          mapCtx.fillRect(vSide < 0 ? 0 : cx + 6, 0, cx - 6, H);
          mapCtx.fillStyle = '#2c422c';
          mapCtx.beginPath(); mapCtx.arc(cx - vSide * 30, cy - 10, 44, 0, Math.PI * 2); mapCtx.fill();
        } else if (curSeg && curSeg.hasCloudSea) {
          mapCtx.fillStyle = '#5a6e7c';
          mapCtx.fillRect(vSide < 0 ? 0 : cx + 8, 0, cx - 8, H);
          mapCtx.fillStyle = '#263628';
          mapCtx.beginPath(); mapCtx.arc(cx - vSide * 30, cy - 10, 44, 0, Math.PI * 2); mapCtx.fill();
        } else if (curSeg && curSeg.landform === 'ridge_crest') {
          mapCtx.fillStyle = '#2c3d32';
          mapCtx.fillRect(0, 0, cx - 12, H);
          mapCtx.fillRect(cx + 12, 0, cx - 12, H);
        } else {
          mapCtx.fillStyle = '#2c422c';
          mapCtx.beginPath(); mapCtx.arc(cx - vSide * 24, cy - 16, 46, 0, Math.PI * 2); mapCtx.fill();
        }
        const c = Math.cos(yaw), s = Math.sin(yaw);
        mapCtx.lineCap = 'round'; mapCtx.lineJoin = 'round';
        mapCtx.strokeStyle = '#261f18'; mapCtx.lineWidth = 11;
        mapCtx.beginPath();
        let st = false;
        for (let ds = -40; ds <= 220; ds += 8) {
          const p = track.sampleAtS(car.s + ds);
          if (!p) continue;
          const dx = p.pos[0] - car.pos[0], dz = p.pos[2] - car.pos[2];
          const mx = cx + (-dx * c + dz * s) * scale, my = cy - (dx * s + dz * c) * scale;
          if (!st) { mapCtx.moveTo(mx, my); st = true; } else mapCtx.lineTo(mx, my);
        }
        mapCtx.stroke();
        mapCtx.strokeStyle = '#ff6b18'; mapCtx.lineWidth = 6.0; mapCtx.stroke();
        mapCtx.strokeStyle = 'rgba(255,244,220,0.65)'; mapCtx.lineWidth = 1.6; mapCtx.stroke();

        mapCtx.fillStyle = '#3ee0f5'; mapCtx.strokeStyle = '#0e242c'; mapCtx.lineWidth = 1.6;
        mapCtx.beginPath(); mapCtx.moveTo(cx, cy - 9); mapCtx.lineTo(cx + 6.5, cy + 7); mapCtx.lineTo(cx, cy + 3); mapCtx.lineTo(cx - 6.5, cy + 7); mapCtx.closePath();
        mapCtx.fill(); mapCtx.stroke();
        mapCtx.restore();
      }

      function updateHUD() {
        const d = T();
        const kmh = Math.round(car.speed * 3.6);
        setTxt(elSpeedNum, String(kmh));
        setTxt(elDriftVal, car.driftScore.toLocaleString('en-US'));
        const bankNow = Math.round(car.driftBank || 0);
        if (bankNow >= 15) {
          setTxt(elDriftSub, `+${bankNow} ${d.perfectDrift} x${car.driftCombo.toFixed(1)}`);
        } else if (gameplay.mode === 'cruise') {
          setTxt(elDriftSub, `${d.ui.modeCruise} • x${car.driftCombo.toFixed(1)}`);
        } else {
          setTxt(elDriftSub, `BEST ${gameplay.bestScore.toLocaleString('en-US')} • x${car.driftCombo.toFixed(1)}`);
        }
        const cpLeft = Math.max(0, Math.round(car.nextCheckpointS - car.s));
        setTxt(elCpDist, `${d.nextCp} • ${cpLeft}m`);
        if (cpLeft <= 105 && !car.checkpointWarned) {
          car.checkpointWarned = true;
          audio.triggerChime('100, approaching checkpoint');
        }
        if (car.perfectDriftEvent) {
          audio.triggerChime('nice drift');
        }
        const bPct = Math.round(car.boost || 0);
        if (gameplay.mode === 'cruise') {
          setTxt(elBoostPct, car.boosting ? d.boostActive : d.boostReady);
          for (let i = 0; i < elBoostSegs.length; i++) elBoostSegs[i].classList.add('on');
        } else {
          const actLbl = String(d.boostActive || 'BOOST').replace(/^MAX\s*/, '');
          setTxt(elBoostPct, car.boosting ? `${actLbl} ${bPct}%` : `${bPct}%`);
          const litCount = Math.round((bPct / 100) * elBoostSegs.length);
          for (let i = 0; i < elBoostSegs.length; i++) elBoostSegs[i].classList.toggle('on', i < litCount);
        }
        const dtHud = PV.getDrivetrainTelemetry ? PV.getDrivetrainTelemetry(car, _dtHudReuse) : _dtHudReuse;
        const rpmNorm = dtHud.rpmNorm;
        if (elRpmArc) elRpmArc.style.strokeDashoffset = (110 * (1 - rpmNorm)).toFixed(1);
        if (elRpmNeedle) elRpmNeedle.style.transform = `rotate(${(-115 + rpmNorm * 230).toFixed(1)}deg)`;
        if (elWaveInfo) {
          const sp = track.sampleAtS(car.s);
          const mins = Math.floor(simTime / 60), secs = (simTime % 60).toFixed(2).padStart(5, '0');
          const gp = car.gradePct || 0;
          const gradeTag = gp >= 3 ? `↗+${gp}%` : (gp <= -3 ? `↘${gp}%` : '→0%');
          const kmStr = (car.s / 1000).toFixed(2);
          setTxt(elWaveInfo, `S${String(track.sectorCount || 1).padStart(2,'0')} • ${segLabel(sp ? sp.seg.name : 'ALPINE PASS')} • ${kmStr}km • ${gradeTag} • ${String(mins).padStart(2,'0')}:${secs}`);
        }
        paceNotes.update(car, track, simTime);
        drawMinimap();
      }

      function stepSim(dt) {
        const input = readInput();
        const subSteps = dt > 0.022 ? 2 : 1;
        const subDt = dt / subSteps;
        for (let si = 0; si < subSteps; si++) {
          simTime += subDt;
          car.step(subDt, input, track);
        }
        // ZERO-FLASH ORIGIN SHIFT & SEGMENT STREAMING:
        // Rebuild car matrices + trees + blades synchronously on origin/segment shift so
        // neither the car, cockpit camera, nor roadside grass EVER vanishes for 1 frame!
        track.updateStream(
          car.s, car.pos,
          (dx, dy, dz) => {
            car.pos[0] -= dx; car.pos[2] -= dz;
            car.rebuildMatrices();
            camPos[0] -= dx; camPos[2] -= dz;
            camLook[0] -= dx; camLook[2] -= dz;
            fx.shiftOrigin(dx, dy, dz);
          },
          () => {
            trees.rebuildFromTrack(track);
            blades.rebuildFromTrack(track);
          }
        );
        fx.update(dt, car, renderer.quality.rainScale);
        gameplay.update(dt, car, track, simTime, audio, currentLang);
        const env = track.getAcousticEnv ? track.getAcousticEnv(car.s, _acousticEnv) : _acousticEnv;
        audio.update(car, env, camMode, dt);
        // Calibrated Silky Filmic Eye-Adaptation (dual-stage low-pass filtered, ZERO sudden flashbang!)
        const tunNow = track.tunnelFactor ? track.tunnelFactor(car.s) : 0.0;
        const targetSceneLum = 1.0 - tunNow * 0.72;
        const isDarkening = targetSceneLum < eyeAdaptLum;
        const tauEye = isDarkening ? 1.85 : 1.15;
        eyeAdaptLum += (targetSceneLum - eyeAdaptLum) * (1.0 - Math.exp(-dt / tauEye));
        let tgtExp = 1.0, tgtGlare = 0.0;
        if (isDarkening) {
          const ratio = targetSceneLum / Math.max(0.22, eyeAdaptLum);
          tgtExp = Math.max(0.56, Math.min(1.04, 0.52 + 0.52 * Math.sqrt(Math.max(0.0, ratio))));
          tgtGlare = 0.0;
        } else {
          const deltaBright = Math.max(0.0, targetSceneLum - eyeAdaptLum);
          const tunnelComp = Math.max(0.0, (0.55 - eyeAdaptLum) * 0.08);
          tgtExp = Math.max(1.0, Math.min(1.28, 1.0 + tunnelComp + Math.pow(deltaBright, 1.25) * 0.42));
          tgtGlare = Math.max(0.0, Math.min(0.42, Math.pow(deltaBright, 1.35) * 0.58));
        }
        eyeExposure += (tgtExp - eyeExposure) * (1.0 - Math.exp(-dt / 0.28));
        eyeGlare += (tgtGlare - eyeGlare) * (1.0 - Math.exp(-dt / 0.24));
        updateCamera(dt, false);
        if (!Number.isFinite(car.pos[0]) || !Number.isFinite(car.pos[1]) || !Number.isFinite(car.pos[2])) nanCount++;
      }

      function renderFrame() {
        renderer.beginShadowPass();
        trees.drawShadows(renderer);
        car.drawShadow(renderer);
        renderer.endShadowPass();

        renderer.beginMainPass();
        const spActive = track.sampleAtS(car.s);
        skyBackdrop.draw(renderer, simTime, spActive ? (spActive.seg.themeId || 0) : 0);
        track.draw(renderer, simTime);
        blades.draw(renderer, simTime);
        trees.draw(renderer, simTime);
        const isCockpitNow = camMode === 'cockpit' && !(camOrbit && camOrbit.dist > 0.1);
        car.draw(renderer, simTime, isCockpitNow, track.sectorCount || 1);
        const tunFac = track.tunnelFactor ? track.tunnelFactor(car.s) : 0.0;
        const speedNorm = Math.min(1.35, Math.max(0.0, (car.speed - 14.0) / 22.0) + (car.boosting ? 0.38 : 0.0));
        fx.draw(renderer, simTime, tunFac > 0.45, speedNorm, spActive ? (spActive.seg.themeId || 0) : 0);

        renderer.finishPostPass(simTime, speedNorm, fx.splashDropEnergy, tunFac, pauseBlend, isCockpitNow ? 1.0 : 0.0, eyeExposure, eyeGlare);

        if (!settingsOpen && (frameCount % 3 === 0)) updateHUD();
        frameCount++;
      }

      // Initialize language (English default), Audio ON, and open Settings landing overlay
      applyLanguage(currentLang);
      updateAudioBtn(audio.muted);
      car.step(0.016, { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false }, track);
      updateCamera(0.016, true);
      openSettings('graphics', true, true);
      renderFrame();

      let lastTime = performance.now();
      function loop(now) {
        requestAnimationFrame(loop);
        if (contextLost) return;
        const rawDt = Math.min(0.045, Math.max(0.004, (now - lastTime) * 0.001));
        smoothDt += (rawDt - smoothDt) * 0.35;
        const dt = smoothDt;
        lastTime = now;
        fpsFrames++;
        if (now - lastFpsTime >= 250) {
          const elapsed = now - lastFpsTime;
          fps = Math.round((fpsFrames * 1000) / elapsed);
          avgFrameMs = elapsed / Math.max(1, fpsFrames);
          updateFpsBadge(fps, avgFrameMs);
          fpsFrames = 0; lastFpsTime = now;
        }
        const targetPause = settingsOpen ? 1.0 : 0.0;
        if (Math.abs(pauseBlend - targetPause) > 0.003) {
          pauseBlend += (targetPause - pauseBlend) * (1.0 - Math.exp(-13.5 * rawDt));
          if (Math.abs(pauseBlend - targetPause) <= 0.004) pauseBlend = targetPause;
          pauseNeedsRender = true;
        }
        if (!paused) {
          stepSim(dt);
          renderFrame();
        } else if (pauseNeedsRender) {
          renderFrame();
          pauseNeedsRender = false;
        }
      }
      requestAnimationFrame(loop);

      const __hptDebug = /(?:^|[?&])debug=1(?:&|$)/.test(location.search || '') || !!global.__HPT_DEBUG || !!navigator.webdriver;
      if (__hptDebug) {
      global.__G = {
        stats() {
          const sp = track.sampleAtS(car.s);
          return {
            s: Number(car.s.toFixed(1)),
            kmh: Math.round(car.speed * 3.6),
            segment: sp ? sp.seg.type : 'unknown',
            segmentName: sp ? sp.seg.name : 'unknown',
            themeId: sp ? (sp.seg.themeId || 0) : 0,
            themeName: sp ? (sp.seg.themeName || 'SWITCHBACK PASS') : 'SWITCHBACK PASS',
            seed: track.seed || 0,
            gradePct: car.gradePct || 0,
            altitude: Number((car.pos[1] || 0).toFixed(1)),
            pitchDeg: Number(((car.pitch || 0) * 180 / Math.PI).toFixed(2)),
            bankDeg: Number(((car.bank || 0) * 180 / Math.PI).toFixed(2)),
            quality: renderer.qualityKey,
            graphics: renderer.getEffectiveGraphics ? renderer.getEffectiveGraphics() : {},
            language: currentLang,
            settingsOpen,
            pauseBlend: +pauseBlend.toFixed(3),
            fovOffsetDeg,
            hudSwayEnabled,
            showFps: showFpsEnabled,
            tunnelFactor: Number((track.tunnelFactor ? track.tunnelFactor(car.s) : 0).toFixed(3)),
            eyeAdaptLum: Number(eyeAdaptLum.toFixed(3)),
            eyeExposure: Number(eyeExposure.toFixed(3)),
            eyeGlare: Number(eyeGlare.toFixed(3)),
            originResets: track.originResets,
            sectorCount: track.sectorCount || 1,
            checkpoints: car.checkpoints,
            driftScore: car.driftScore,
            gameMode: gameplay.mode,
            stageRank: gameplay.rank,
            mobileMode: mobileCtrl ? mobileCtrl.enabled : false,
            boost: Math.round(car.boost),
            boosting: !!car.boosting,
            lat: Number((car.lat || 0).toFixed(2)),
            inPuddle: car.inPuddle,
            slipDeg: Number((car.driftAngle * 180 / Math.PI).toFixed(1)),
            fps, frames: frameCount, nanCount,
            simTime: Number(simTime.toFixed(1)),
          };
        },
        openSettings(tab) { openSettings(tab || 'graphics', true); renderFrame(); return true; },
        closeSettings() { closeSettings(true); renderFrame(); return true; },
        isSettingsOpen() { return settingsOpen; },
        setShowFps(v) { applyShowFps(!!v); updateFpsBadge(fps, avgFrameMs); syncSettingsUI(); return showFpsEnabled; },
        setEyeAdapt(lum) {
          eyeAdaptLum = Math.max(0.22, Math.min(1.0, Number(lum) || 1.0));
          const tunNow = track.tunnelFactor ? track.tunnelFactor(car.s) : 0.0;
          const targetSceneLum = 1.0 - tunNow * 0.72;
          if (targetSceneLum < eyeAdaptLum) {
            eyeExposure = Math.max(0.56, Math.min(1.04, 0.52 + 0.52 * Math.sqrt(Math.max(0.0, targetSceneLum / Math.max(0.22, eyeAdaptLum)))));
            eyeGlare = 0.0;
          } else {
            const dB = Math.max(0.0, targetSceneLum - eyeAdaptLum);
            eyeExposure = Math.max(1.0, Math.min(1.28, 1.0 + Math.max(0.0, (0.55 - eyeAdaptLum) * 0.08) + Math.pow(dB, 1.25) * 0.42));
            eyeGlare = Math.max(0.0, Math.min(0.42, Math.pow(dB, 1.35) * 0.58));
          }
          renderFrame();
          return { eyeAdaptLum, eyeExposure, eyeGlare };
        },
        getGameplayState() { return gameplay.getState(); },
        setGameMode(m) { const res = gameplay.setMode(m, car); syncSettingsUI(); updateHUD(); return res; },
        setMobileMode(on) { const res = mobileCtrl ? mobileCtrl.setEnabled(!!on) : false; syncSettingsUI(); return res; },
        setMobileAutoGas(on) { const res = mobileCtrl ? mobileCtrl.setAutoGas(!!on) : false; syncSettingsUI(); return res; },
        getMobileState() { return mobileCtrl ? mobileCtrl.getState() : null; },
        setLanguage(lang) { const l = applyLanguage(lang); renderFrame(); return l; },
        getLanguage() { return currentLang; },
        getAudioState() { return audio.getState(); },
        getPaceNote() { return paceNotes.getState(); },
        setAudioMuted(m) { const res = audio.setMuted(m); updateAudioBtn(res); return res; },
        setCustomGraphics(key, val) { renderer.setCustomOption(key, val); syncSettingsUI(); renderFrame(); return renderer.getEffectiveGraphics(); },
        testOriginShift() {
          // Force an origin shift (simulating >2400m drive) and verify car.modelMat + blades sync on exact frame!
          const dx = 2600, dz = 1800;
          car.pos[0] += dx; car.pos[2] += dz;
          for (const seg of track.segments) {
            for (const p of seg.pts) { p.pos[0] += dx; p.pos[2] += dz; }
          }
          track.endPos[0] += dx; track.endPos[2] += dz;
          track.updateStream(
            car.s, car.pos,
            (ox, oy, oz) => {
              car.pos[0] -= ox; car.pos[2] -= oz;
              car.rebuildMatrices();
              camPos[0] -= ox; camPos[2] -= oz;
              camLook[0] -= ox; camLook[2] -= oz;
              fx.shiftOrigin(ox, oy, oz);
            },
            () => { trees.rebuildFromTrack(track); blades.rebuildFromTrack(track); }
          );
          updateCamera(0.016, true);
          renderFrame();
          const m = car.modelMat;
          const carModelDelta = Math.hypot(m[12] - car.pos[0], m[13] - car.pos[1], m[14] - car.pos[2]);
          return {
            originResets: track.originResets,
            carPos: [+car.pos[0].toFixed(3), +car.pos[1].toFixed(3), +car.pos[2].toFixed(3)],
            modelMatPos: [+m[12].toFixed(3), +m[13].toFixed(3), +m[14].toFixed(3)],
            carModelDelta: +carModelDelta.toFixed(5),
            nanCount,
          };
        },
        setSeed(seed) { const s = resetRunWithNewSeed(seed); renderFrame(); return s; },
        resetRandom() { const s = resetRunWithNewSeed(); renderFrame(); return s; },
        getThemes() { return (PV.THEMES || []).map((t, i) => ({ id: i, key: t.key, name: t.name, templates: t.pool })); },
        setTheme(themeIdOrKey, carS) {
          const list = PV.THEMES || [];
          const idx = typeof themeIdOrKey === 'number'
            ? Math.max(0, Math.min(list.length - 1, themeIdOrKey))
            : list.findIndex((t) => t.key === themeIdOrKey);
          if (idx < 0 || !list[idx]) return false;
          const tplType = list[idx].pool[0];
          const tplType2 = list[idx].pool[1 % list[idx].pool.length];
          track.reset(track.seed || 20261123, true);
          track.segments.forEach((s) => track._disposeSeg(s));
          track.segments = []; track.nextSegId = 0;
          track.endPos = [0, 0, 0]; track.endYaw = 0; track.endS = 0;
          track.macroStageIdx = idx; track.macroStageStep = 0;
          track._appendSegment(tplType, false, idx);
          track._appendSegment(tplType2, false, idx);
          for (let i = 2; i < PV.TRACK_CFG.ACTIVE_SEGS; i++) track._appendNextRuleSegment();
          trees.rebuildFromTrack(track);
          blades.rebuildFromTrack(track);
          if (fx.clear) fx.clear();
          paceNotes.reset();
          car.s = typeof carS === 'number' ? carS : 48.0;
          car.lat = 0.0; car.speed = 35.8; car.driftAngle = 0.0;
          car.step(0.016, { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false }, track);
          updateCamera(0.016, true);
          updateHUD();
          renderFrame();
          return true;
        },
        setSegment(type) {
          if (!PV.TEMPLATES[type]) return false;
          track.reset();
          track.segments.forEach((s) => track._disposeSeg(s));
          track.segments = []; track.nextSegId = 0;
          track.endPos = [0, 0, 0]; track.endYaw = 0; track.endS = 0;
          track._appendSegment(type);
          for (let i = 1; i < PV.TRACK_CFG.ACTIVE_SEGS; i++) track._appendNextRuleSegment();
          trees.rebuildFromTrack(track);
          blades.rebuildFromTrack(track);
          if (fx.clear) fx.clear();
          paceNotes.reset();
          car.s = 38.0; car.lat = 0.0; car.speed = 35.8;
          car.step(0.016, { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false }, track);
          updateCamera(0.016, true);
          updateHUD();
          renderFrame();
          return true;
        },
        setPair(seg0, seg1, carS) {
          if (!PV.TEMPLATES[seg0] || !PV.TEMPLATES[seg1]) return false;
          track.reset();
          track.segments.forEach((s) => track._disposeSeg(s));
          track.segments = []; track.nextSegId = 0;
          track.endPos = [0, 0, 0]; track.endYaw = 0; track.endS = 0;
          track._appendSegment(seg0);
          track._appendSegment(seg1);
          for (let i = 2; i < PV.TRACK_CFG.ACTIVE_SEGS; i++) track._appendNextRuleSegment();
          trees.rebuildFromTrack(track);
          blades.rebuildFromTrack(track);
          if (fx.clear) fx.clear();
          paceNotes.reset();
          car.s = typeof carS === 'number' ? carS : (track.segments[0].sEnd - 34.0);
          car.lat = 0.0; car.speed = 35.8;
          car.step(0.016, { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false }, track);
          updateCamera(0.016, true);
          updateHUD();
          renderFrame();
          return true;
        },
        setCamMode(m) { camOrbit = null; const k = applyCamModeUI(m); updateCamera(0.016, true); renderFrame(); return k; },
        setCamOrbit(yawOff, dist, height) {
          camOrbit = (dist && dist > 0.1) ? { yawOff: yawOff || 0, dist, height: height || 1.5 } : null;
          updateCamera(0.016, true);
          renderFrame();
          return !!camOrbit;
        },
        setQuality(q) { applyQuality(q); renderFrame(); return renderer.qualityKey; },
        setWeather(w) { const k = applyWeatherUI(w); renderFrame(); return k; },
        setTime(t) { const k = applyTimeUI(t); renderFrame(); return k; },
        setFilter(f) { const k = applyFilterUI(f); renderFrame(); return k; },
        setKuwahara(on) { renderer.setCustomOption('kuwahara', !!on); syncSettingsUI(); renderFrame(); return renderer.getEffectiveGraphics().kuwahara; },
        setRain(density, opacity) {
          if (typeof density === 'number') PV.LIGHT.rainDensity = Math.max(0, Math.min(2, density));
          if (typeof opacity === 'number') PV.LIGHT.rainOpacity = Math.max(0, Math.min(2, opacity));
          return { density: PV.LIGHT.rainDensity, opacity: PV.LIGHT.rainOpacity };
        },
        triggerDrift() {
          car.driftHoldTimer = 1.6;
          car.driftAngle = 0.44;
          car.steerInput = -0.82;
          car.speed = 36.1;
          const spNow = track.sampleAtS(car.s);
          if (spNow) {
            car.yaw = spNow.yaw + car.driftAngle;
            const cy = Math.cos(car.yaw), sy = Math.sin(car.yaw);
            car.fwd = [sy, Math.sin(car.pitch), cy];
            car.right = [-cy, 0, sy];
            car.rebuildMatrices();
          }
          fx.spawnBurst(car, 20, 14);
          fx.update(0.05, car, 1.0); fx.update(0.05, car, 1.0);
          updateCamera(0.016, true);
          updateHUD();
          renderFrame();
          return true;
        },
        triggerPuddle() {
          car.inPuddle = true; car.puddleIntensity = 1.0;
          fx.spawnBurst(car, 20, 10);
          fx.update(0.04, car, 1.0);
          renderFrame();
          return true;
        },
        step(seconds, dt) {
          const h = dt || 0.05;
          const n = Math.max(1, Math.round(seconds / h));
          for (let i = 0; i < n; i++) stepSim(h);
          updateHUD();
          renderFrame();
          return this.stats();
        },
        pause(v) { paused = !!v; return paused; },
        setPaused(v) { paused = !!v; return paused; },
        stepOnce(dt) { stepSim(dt || 0.016); return this.stats(); },
        renderOnce() { renderFrame(); return this.stats(); },
        benchPerf(numFrames) {
          const N = Math.max(5, Math.min(60, numFrames || 20));
          const wasPaused = paused;
          paused = true;
          renderFrame(); gl.finish();
          const t0 = performance.now();
          for (let i = 0; i < N; i++) { stepSim(0.016); renderFrame(); }
          gl.finish();
          const ms = (performance.now() - t0) / N;
          paused = wasPaused;
          return { frames: N, avgMsPerFrame: +ms.toFixed(2), estFps: Math.round(1000 / Math.max(0.1, ms)), quality: renderer.qualityKey, width: renderer.width, height: renderer.height };
        },
        getSegments() {
          return track.segments.map((s) => ({
            id: s.id, type: s.type, len: s.len, surfMode: s.surfMode, themeId: s.themeId,
            hillMode: s.hillMode, landform: s.landform, hasLake: !!s.hasLake, hasCloudSea: !!s.hasCloudSea,
            veg: s.vegPreset ? s.vegPreset.key : 'none', arch: s.archPreset ? s.archPreset.key : 'none',
            elev: s.elevProfile, vis: !!s._vis,
          }));
        },
        auditTopology(numSegs) {
          const N = numSegs || 60;
          track.reset(20261124, false);
          let specials = 0, backToBack = 0, damCount = 0, maxAbsYaw = 0, minNonAdjDist = 1e9, selfIntersections = 0;
          const allPts = [];
          let prevSpec = false;
          const seen = new Set();
          for (let step = 0; step < N; step++) {
            for (const s of track.segments) {
              if (seen.has(s.id)) continue;
              seen.add(s.id);
              const isSpec = s.surfMode !== 0;
              if (isSpec) { specials++; if (prevSpec) backToBack++; }
              prevSpec = isSpec;
              if (s.themeId === 7 || /dam/i.test(s.type)) damCount++;
              const ox = track.originOffset[0], oz = track.originOffset[2];
              for (let i = 0; i < s.pts.length; i += 4) {
                const p = s.pts[i];
                maxAbsYaw = Math.max(maxAbsYaw, Math.abs(p.yaw));
                allPts.push({ id: s.id, x: p.pos[0] + ox, z: p.pos[2] + oz });
              }
            }
            if (track.segments.length >= 6) {
              const targetS = track.segments[3].sEnd + 10.0;
              const spA = track.sampleAtS(targetS);
              track.updateStream(targetS, spA ? spA.pos : [0, 0, 0], null, null);
            }
          }
          for (let i = 0; i < allPts.length; i++) {
            const a = allPts[i];
            for (let j = i + 1; j < allPts.length; j++) {
              const b = allPts[j];
              if (Math.abs(a.id - b.id) <= 1) continue;
              const d = Math.hypot(a.x - b.x, a.z - b.z);
              if (d < minNonAdjDist) minNonAdjDist = d;
              if (d < 28.0) selfIntersections++;
            }
          }
          const total = seen.size;
          return {
            totalSegs: total, specials, backToBack,
            activeSegs: track.segments.length,
            disposedSegs: track.disposedSegs || 0,
            maxSeamGap: Number((track.maxSeamGap ? track.maxSeamGap() : -1).toFixed(5)),
            regularPct: total ? Math.round((total - specials) / total * 100) : 0,
            damCount, maxAbsYaw: +maxAbsYaw.toFixed(3),
            minNonAdjDist: +minNonAdjDist.toFixed(1),
            selfIntersections,
          };
        },
        runInvariants() {
          let maxWheelErr = 0;
          const savedS = car.s, savedLat = car.lat;
          for (let k = 0; k < 40; k++) {
            const sTest = track.segments[0].sStart + 20 + k * 14;
            const sp = track.sampleAtS(sTest);
            if (!sp) continue;
            const yRoad = track.sampleRoadSurfaceY(sTest, 0);
            const yCenter = sp.pos[1] + (sp.seg.surfMode !== 0 ? 0.03 : 0.04);
            maxWheelErr = Math.max(maxWheelErr, Math.abs(yRoad - yCenter));
          }
          car.s = savedS; car.lat = savedLat;
          return {
            nanCount,
            activeSegments: track.segments.length,
            maxRoadProfileDelta: Number(maxWheelErr.toFixed(4)),
            carAltitude: Number(car.pos[1].toFixed(3)),
            roadYAtCar: Number(track.sampleRoadSurfaceY(car.s, car.lat).toFixed(3)),
            carGroundDelta: Number((car.pos[1] - track.sampleRoadSurfaceY(car.s, car.lat)).toFixed(4)),
          };
        },
      };
      global.__READY = true;
      global.__FAIL = null;
      }
    } catch (err) {
      console.error('HILL PASS TRAIL boot error:', err);
      if (/(?:^|[?&])debug=1(?:&|$)/.test(location.search || '') || !!global.__HPT_DEBUG || !!navigator.webdriver) {
        global.__READY = false;
      global.__FAIL = String(err && err.stack ? err.stack : err);
      }
    }
  };

  window.addEventListener('DOMContentLoaded', () => PV.boot());
})(window);
