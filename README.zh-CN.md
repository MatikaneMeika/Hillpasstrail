# Hill Pass Trail（山道晴雨拉力赛）

[English](./README.md)

一款**零外部依赖、单文件（~764 KB）原生 WebGL2** 无尽晴雨山道拉力赛车游戏——不依赖 Three.js、Unity 或任何外部资源与 CDN，浏览器双击 `index.html` 即可离线秒开。

## 核心特性
- **纯原生 WebGL2 引擎（12 个 IIFE 模块 → 1 个离线 `index.html`）**：18,327 行模块化源码，通过零依赖 Python 打包脚本确定性合并为 LF 单文件（实测 `0` 外部网络请求）。
- **三渲二 × 写实 PBR 混合管线**：4K 软阴影、`RGBA16F` HDR 主缓冲 Alpha 语义分流（英雄车 1.75px 锐利描边与动态模糊完全保护、32+5 步湿路水洼 SSR、天空豁免）、深度自适应 Kuwahara 油画滤波、丁达尔光束、隧道非对称人眼适应、镜头折射雨滴与 6 套 ACES 电影调色。
- **无尽程序化山地赛道**：33 种赛道模板覆盖 7 大地貌（盘山弯道、高山雪峰、湖畔环道、悬崖云海、金秋白桦、矿场红砖、竹林神社），桥隧无缝衔接、6 段 Ring Buffer 流式加载与**浮点原点回正（Floating-Origin Recentering）**，长距离零抖动。
- **程序化声学、动态路书与多端适配**：纯 WebAudio 合成水平对置引擎/涡轮泄压/雨声/碎石/隧道 IR 混响、速度自适应英文领航路书（停车即时静默）、竞速/巡航双模式评级、第一人称驾驶舱、三语漫画网格纸 UI（英/中/日）与移动端多点触控。
- **防退化 Agent 复现工程包**：随仓附带 `AGENTS.md`、`docs/SPEC_LOCK.md`、`docs/VERTICAL_SLICES.md`、`docs/PITFALLS_FROM_GIT.md` 及零本地路径 Playwright 自动化门禁（`qa/verify_gates.py`），让人类开发者与 AI Coding Agent 均可照着学习与 1:1 高水准复现，不劣化、不偷懒。

## 快速开始
1. 双击 `index.html` 或直接开启 GitHub Pages 托管仓库根目录即可在线试玩。
2. 在漫画网格纸启动面板确认画质与音频设置，点击 **`START STAGE`**（或按 `Enter` / `Esc`）发车。

## 按键说明
| 按键 | 功能 |
| :--- | :--- |
| `W / A / S / D` 或方向键 | 加速 / 刹车 / 转向 |
| `Space` | 手刹漂移 |
| `Shift` | 氮气加速 |
| `V` | 切换视角（第三人称追尾 / 第一人称驾驶舱） |
| `T` / `C` / `F` | 切换天气 / 时段 / 色彩滤镜 |
| `R` | 生成新赛道随机种子 |
| `M` | 静音开关 |
| `Esc` | 打开 / 关闭设置面板 |

## 从源码构建与全套门禁验收
```bash
# 1. 语法检查全部 12 个源码模块
node --check src/*.js

# 2. 确定性构建 index.html 并校验字节一致
python scripts/build.py
python scripts/build.py --check

# 3. 运行隐私、商标、外部 URL 与死代码合规门禁
python scripts/check_hygiene.py

# 4. 运行无头 WebGL2 L1+L2 全链路 Playwright 自动化验收
pip install -r qa/requirements.txt
playwright install chromium
python qa/verify_gates.py --html index.html --save-shots
```

## 开发者与 AI Agent 文档索引
- [`AGENTS.md`](./AGENTS.md) — 面向所有 AI Coding Agent 的防退化执行宪章
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — 12 模块依赖图、`window.PV` 契约、着色器与纹理索引
- [`docs/SPEC_LOCK.md`](./docs/SPEC_LOCK.md) — 不可妥协的数值与着色器规格锁
- [`docs/VERTICAL_SLICES.md`](./docs/VERTICAL_SLICES.md) — 7 个垂直切片施工顺序与逐片门禁
- [`docs/PITFALLS_FROM_GIT.md`](./docs/PITFALLS_FROM_GIT.md) — 12 条真实踩坑反例黑名单与修复公式
- [`docs/TESTING_HOOKS.md`](./docs/TESTING_HOOKS.md) — `window.__G` 43 个自动化探针 API 手册

## 致谢与协议
- 风格化植被、球面法线叶卡光照、弯曲草叶 LOD 与油画后处理思路受开源 WebGL 风景实验 [`lucienlmy/painted-valley`](https://github.com/lucienlmy/painted-valley) 等项目启发。
- 基于 [GNU Affero General Public License v3.0 (AGPL-3.0-or-later)](./LICENSE) 开源。
