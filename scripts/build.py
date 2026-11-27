#!/usr/bin/env python3
"""Deterministic single-file bundler for Hill Pass Trail (LF-normalized, zero external deps)."""
import argparse
import hashlib
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'src')
OUT_HTML = os.path.join(ROOT, 'index.html')

MODULES = [
    'glsl_common.js', 'textures.js', 'frame_post.js', 'sky_backdrop.js',
    'track_ground.js', 'trees_foliage.js', 'blades_flowers.js',
    'cockpit_v4.js', 'rallycar.js', 'fx_rain.js', 'gameplay_mobile.js', 'hud_audio.js',
]

_DIV_PREV_WORDS = {
    'return', 'case', 'in', 'of', 'typeof', 'void',
    'delete', 'throw', 'new', 'else', 'do', 'yield', 'await',
}


def _prev_allows_regex(out_chars):
    j = len(out_chars) - 1
    while j >= 0 and out_chars[j] in ' \t\r\n':
        j -= 1
    if j < 0:
        return True
    ch = out_chars[j]
    if ch in '([{:;,=!?&|^~+-*%<>':
        return True
    if ch.isalnum() or ch in '_$':
        k = j
        while k >= 0 and (out_chars[k].isalnum() or out_chars[k] in '_$'):
            k -= 1
        word = ''.join(out_chars[k + 1:j + 1])
        return word in _DIV_PREV_WORDS
    return False


def minify_glsl_chunk(txt):
    txt = re.sub(r'/\*[\s\S]*?\*/', '', txt)
    lines = []
    for raw in txt.splitlines():
        line = re.sub(r'//[^\n]*', '', raw).strip()
        if not line:
            continue
        line = re.sub(r'[ \t]{2,}', ' ', line)
        lines.append(line)
    return '\n'.join(lines)


def minify_js_lossless(code):
    """Lexer-safe lossless JS + GLSL-template minifier (ASI-safe: preserves line breaks)."""
    n = len(code)
    i = 0
    out = []
    tpl_brace_stack = []

    while i < n:
        c = code[i]
        nxt = code[i + 1] if i + 1 < n else ''

        if c == '/' and nxt == '/':
            i += 2
            while i < n and code[i] != '\n':
                i += 1
            continue

        if c == '/' and nxt == '*':
            i += 2
            while i + 1 < n and not (code[i] == '*' and code[i + 1] == '/'):
                i += 1
            i += 2
            continue

        if c in ("'", '"'):
            q = c
            out.append(c)
            i += 1
            while i < n:
                ch = code[i]
                out.append(ch)
                if ch == '\\' and i + 1 < n:
                    i += 1
                    out.append(code[i])
                elif ch == q:
                    i += 1
                    break
                i += 1
            continue

        if c == '`':
            out.append(c)
            i += 1
            chunk = []
            while i < n:
                ch = code[i]
                if ch == '\\' and i + 1 < n:
                    chunk.append(ch)
                    chunk.append(code[i + 1])
                    i += 2
                    continue
                if ch == '$' and i + 1 < n and code[i + 1] == '{':
                    seg = ''.join(chunk)
                    if '#version' in seg or 'uniform ' in seg or 'gl_Position' in seg or 'vec3 ' in seg or 'float ' in seg:
                        seg = minify_glsl_chunk(seg)
                    out.append(seg)
                    chunk = []
                    out.append('${')
                    tpl_brace_stack.append(0)
                    i += 2
                    break
                if ch == '`':
                    seg = ''.join(chunk)
                    if '#version' in seg or 'uniform ' in seg or 'gl_Position' in seg or 'vec3 ' in seg or 'float ' in seg:
                        seg = minify_glsl_chunk(seg)
                    out.append(seg)
                    out.append('`')
                    i += 1
                    break
                chunk.append(ch)
                i += 1
            continue

        if tpl_brace_stack:
            if c == '{':
                tpl_brace_stack[-1] += 1
            elif c == '}':
                if tpl_brace_stack[-1] == 0:
                    tpl_brace_stack.pop()
                    out.append('}')
                    i += 1
                    chunk = []
                    while i < n:
                        ch = code[i]
                        if ch == '\\' and i + 1 < n:
                            chunk.append(ch)
                            chunk.append(code[i + 1])
                            i += 2
                            continue
                        if ch == '$' and i + 1 < n and code[i + 1] == '{':
                            seg = ''.join(chunk)
                            if '#version' in seg or 'uniform ' in seg or 'gl_Position' in seg or 'vec3 ' in seg or 'float ' in seg:
                                seg = minify_glsl_chunk(seg)
                            out.append(seg)
                            out.append('${')
                            tpl_brace_stack.append(0)
                            i += 2
                            break
                        if ch == '`':
                            seg = ''.join(chunk)
                            if '#version' in seg or 'uniform ' in seg or 'gl_Position' in seg or 'vec3 ' in seg or 'float ' in seg:
                                seg = minify_glsl_chunk(seg)
                            out.append(seg)
                            out.append('`')
                            i += 1
                            break
                        chunk.append(ch)
                        i += 1
                    continue
                else:
                    tpl_brace_stack[-1] -= 1

        if c == '/' and _prev_allows_regex(out):
            out.append(c)
            i += 1
            in_class = False
            while i < n:
                ch = code[i]
                out.append(ch)
                if ch == '\\' and i + 1 < n:
                    i += 1
                    out.append(code[i])
                elif ch == '[':
                    in_class = True
                elif ch == ']':
                    in_class = False
                elif ch == '/' and not in_class:
                    i += 1
                    while i < n and code[i].isalpha():
                        out.append(code[i])
                        i += 1
                    break
                i += 1
            continue

        out.append(c)
        i += 1

    joined = ''.join(out)
    cleaned = [raw.strip() for raw in joined.splitlines() if raw.strip()]
    return '\n'.join(cleaned) + '\n'


def minify_html_head(html):
    def _clean_style(m):
        css = re.sub(r'/\*[\s\S]*?\*/', '', m.group(1))
        css = '\n'.join(l.strip() for l in css.splitlines() if l.strip())
        return '<style>\n' + css + '\n</style>'

    html = re.sub(r'<style>([\s\S]*?)</style>', _clean_style, html)
    html = re.sub(r'<!--[\s\S]*?-->', '', html)
    lines = [l.strip() for l in html.splitlines() if l.strip()]
    return '\n'.join(lines) + '\n'


LICENSE_HEADER = """<!--
  HILL PASS TRAIL — Endless Rainy Mountain Rally (Single-File WebGL2 Edition)
  SPDX-License-Identifier: AGPL-3.0-or-later
  Copyright (c) 2026 Hill Pass Trail Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.

  Algorithm Acknowledgments (standard published / public-domain techniques):
  - ACES Filmic Tone Mapping approximation (Krzysztof Narkowicz)
  - Interleaved Gradient Noise (Jorge Jimenez)
  - Mulberry32 PRNG, Kuwahara filter, and Poisson disk shadow sampling
-->
"""


def inject_license_header(html):
    if 'SPDX-License-Identifier:' in html[:1500]:
        return html
    if html.startswith('<!DOCTYPE html>\n'):
        return '<!DOCTYPE html>\n' + LICENSE_HEADER + html[len('<!DOCTYPE html>\n'):]
    return LICENSE_HEADER + html


def render_bundle(raw=False):
    parts = []
    raw_total = 0
    with open(os.path.join(SRC, 'shell_head.html'), 'r', encoding='utf-8') as f:
        head = f.read().replace('\r\n', '\n')
        raw_total += len(head.encode('utf-8'))
        parts.append(head if raw else minify_html_head(head))
    for m in MODULES:
        with open(os.path.join(SRC, m), 'r', encoding='utf-8') as f:
            txt = f.read().replace('\r\n', '\n')
            raw_total += len(txt.encode('utf-8'))
            parts.append(txt if raw else minify_js_lossless(txt))
    with open(os.path.join(SRC, 'shell_tail.html'), 'r', encoding='utf-8') as f:
        tail = f.read().replace('\r\n', '\n')
        raw_total += len(tail.encode('utf-8'))
        parts.append(tail)
    out = inject_license_header(''.join(parts)).replace('\r\n', '\n')
    return out, raw_total


def main():
    ap = argparse.ArgumentParser(description='Build single-file index.html from src/ modules.')
    ap.add_argument('--raw', action='store_true', help='Skip lossless minification.')
    ap.add_argument('--check', action='store_true', help='Verify index.html matches fresh build byte-for-byte.')
    ap.add_argument('--out', default=OUT_HTML, help='Output HTML path.')
    args = ap.parse_args()

    out, raw_total = render_bundle(raw=args.raw)
    out_bytes = out.encode('utf-8')
    digest = hashlib.sha256(out_bytes).hexdigest()[:16]

    if args.check:
        if not os.path.isfile(args.out):
            print(f'BUILD CHECK FAIL: missing {args.out}')
            sys.exit(1)
        disk = open(args.out, 'rb').read()
        if disk != out_bytes:
            print(f'BUILD CHECK FAIL: {args.out} ({len(disk):,} B) != fresh build ({len(out_bytes):,} B)')
            sys.exit(1)
        print(f'BUILD CHECK PASS: {args.out} ({len(out_bytes):,} B, sha256:{digest})')
        return

    with open(args.out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(out)
    pct = (1.0 - len(out_bytes) / max(1, raw_total)) * 100.0
    print(f'Built {args.out}: {len(out_bytes):,} bytes (raw {raw_total:,} bytes, saved {pct:.1f}%, sha256:{digest})')


if __name__ == '__main__':
    main()
