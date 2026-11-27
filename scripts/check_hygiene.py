#!/usr/bin/env python3
"""Open-source hygiene, privacy, trademark, and dead-code gate for Hill Pass Trail."""
import argparse
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

ALLOWED_URLS_IN_SRC = {
    'http://www.w3.org/2000/svg',
}

FORBIDDEN_EXTS = {'.mp4', '.mov', '.mkv', '.avi', '.wmv', '.zip', '.rar', '.7z', '.psd', '.blend'}

PATTERNS = {
    'local_path': re.compile(
        r'(?:[A-Za-z]:\\(?:Users|Windows|Program Files|test|game)[^\s\'"`<>]*)'
        r'|(?:/Users/[A-Za-z0-9_.-]+)'
        r'|(?:/home/[A-Za-z0-9_.-]+)',
        re.I,
    ),
    'personal_or_internal': re.compile(
        r'(?:Ref\s*图\d|参考图|参考视频|水面参考)',
        re.I,
    ),
    'secret_or_email': re.compile(
        r'(?:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'
        r'|(?:AIza[0-9A-Za-z_-]{20,})'
        r'|(?:ghp_[0-9A-Za-z]{20,})'
        r'|(?:sk-[0-9A-Za-z]{20,})',
    ),
    'trademark_or_brand': re.compile(
        r'\b(?:GHIBLI|FUJI|WRC|FIA|rtx4060|RTX\s*4060|Subaru|Impreza|Lancia|Toyota|Mitsubishi|Porsche|'
        r'Ferrari|BMW|Audi|Honda|Nissan|Mazda|Ford\s+Motor|DiRT\s+Rally|Kodak|threejs-conference|Nintendo|Sony|Adobe|Photoshop)\b',
        re.I,
    ),
    'dead_if_false': re.compile(r'if\s*\(\s*false\s*\)'),
}

URL_RE = re.compile(r'https?://[^\s\'"`<>)]+')


def scan_src_dir(src_dir):
    issues = []
    js_texts = []
    if not os.path.isdir(src_dir):
        return [f'MISSING src dir: {src_dir}']

    for fname in sorted(os.listdir(src_dir)):
        fpath = os.path.join(src_dir, fname)
        if not os.path.isfile(fpath):
            continue
        with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
            txt = f.read()
        if fname.endswith('.js'):
            js_texts.append((fname, txt))
        lines = txt.splitlines()
        for idx, line in enumerate(lines, 1):
            for kind, pat in PATTERNS.items():
                for m in pat.finditer(line):
                    issues.append(f'{fname}:{idx} [{kind}] {m.group(0)!r} | {line.strip()[:120]}')
            for m in URL_RE.finditer(line):
                u = m.group(0).rstrip('.,;:')
                if u not in ALLOWED_URLS_IN_SRC:
                    issues.append(f'{fname}:{idx} [external_url] {u}')

    # Check unused build*Geo definitions across all JS modules
    all_js = '\n'.join(t for _, t in js_texts)
    for fname, txt in js_texts:
        for m in re.finditer(r'function\s+(build[A-Za-z0-9_]+)\s*\(', txt):
            name = m.group(1)
            refs = len(re.findall(r'\b' + re.escape(name) + r'\b', all_js))
            if refs <= 1:
                issues.append(f'{fname} [unused_builder] {name}')
    return issues


def scan_repo_tree(repo_root):
    issues = []
    skip_dirs = {'.git', '__pycache__', 'qa_out', 'node_modules'}
    for dirpath, dirnames, filenames in os.walk(repo_root):
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        for fn in filenames:
            ext = os.path.splitext(fn)[1].lower()
            rel = os.path.relpath(os.path.join(dirpath, fn), repo_root)
            if ext in FORBIDDEN_EXTS:
                issues.append(f'{rel} [forbidden_binary] {ext}')
    idx_path = os.path.join(repo_root, 'index.html')
    if os.path.isfile(idx_path):
        raw = open(idx_path, 'rb').read()
        if b'\r\n' in raw:
            issues.append('index.html [crlf_detected] must use LF line endings')
        head = raw[:2000].decode('utf-8', errors='replace')
        if 'SPDX-License-Identifier: AGPL-3.0-or-later' not in head:
            issues.append('index.html [missing_spdx] missing AGPL-3.0-or-later SPDX header')
    return issues


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src-dir', default=os.path.join(ROOT, 'src'))
    ap.add_argument('--repo-root', default=ROOT)
    ap.add_argument('--src-only', action='store_true')
    args = ap.parse_args()

    issues = scan_src_dir(args.src_dir)
    if not args.src_only:
        issues.extend(scan_repo_tree(args.repo_root))

    if issues:
        print(f'HYGIENE FAIL ({len(issues)} issues):')
        for item in issues:
            print('  -', item)
        sys.exit(1)
    print('HYGIENE PASS: 0 privacy/trademark/path/URL/dead-code/CRLF issues.')


if __name__ == '__main__':
    main()
