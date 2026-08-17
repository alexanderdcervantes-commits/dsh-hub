#!/usr/bin/env python3
"""In-place GitHub metadata refresh for public/data/plugins.json (daily cron).

为什么不用 `build-data.py --enrich`：它会从 /root/china-ai-arbitrage 的外部源
整体重建文件——CI runner 上没有那个路径（每天必崩），且重建的输出 schema 不含
screenshots / image_w / image_h / *_zh_TW 这些由下游脚本注入已提交文件的字段
（当前文件 screenshots×101、image_w×10，重建即丢）。

本脚本只原地刷新既有 JSON 里的 stars / forks / pushed_at / license / language /
topics / has_manifest，其余字段（含键序）原样保留，updatedAt 推进到今天
（fresh() 的活跃榜以它为基准）。

失败语义（对齐 workflow 的安全要求）：单仓 API 失败沿用旧值不报错；文件只在
全部遍历结束后写入，且仅当至少一仓刷新成功。整体失败（无 token / 断网）exit 1
不写文件——workflow 步骤失败、跳过 commit，数据永不被清空。
"""
import importlib.util
import json
import sys
from datetime import date
from pathlib import Path

# build-data.py 文件名带连字符不能直接 import，用 importlib 取它的 gh_api
# （exec 只跑模块顶层：常量 + 函数定义，main() 有 __main__ 守卫不会执行）
_here = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location('build_data', _here / 'build-data.py')
build_data = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(build_data)
gh_api = build_data.gh_api

ROOT = _here.parent
DATA = ROOT / 'public/data/plugins.json'

# 与 build-data.py enrich() 保持同步的 manifest 根级标记
MARKERS = {'dsh.bundle', 'cordis.yml', 'cordis.patch.yml', 'dsh.plugin.json', '.dsh'}


def main():
    data = json.loads(DATA.read_text(encoding='utf-8'))
    plugins = data['plugins']
    ok = 0
    for i, p in enumerate(plugins):
        info = gh_api(f"repos/{p['repo']}")
        if info:
            ok += 1
            p['stars'] = info.get('stargazers_count', p.get('stars', 0))
            p['forks'] = info.get('forks_count', p.get('forks', 0))
            pushed = (info.get('pushed_at') or '')[:10]
            if pushed:
                p['pushed_at'] = pushed
            if info.get('language'):
                p['language'] = info['language']
            spdx = (info.get('license') or {}).get('spdx_id')
            if spdx and spdx != 'NOASSERTION':
                p['license'] = spdx
            if info.get('topics') is not None:
                p['topics'] = info['topics']
            tree = gh_api(f"repos/{p['repo']}/git/trees/{info.get('default_branch', 'main')}")
            if tree and 'tree' in tree:
                names = {t['path'] for t in tree['tree']}
                p['has_manifest'] = bool(MARKERS & names)
        if (i + 1) % 20 == 0:
            print(f'  refreshed {i + 1}/{len(plugins)}', file=sys.stderr)

    if ok == 0:
        print('✗ 0 repos refreshed (gh auth / network?) — plugins.json untouched',
              file=sys.stderr)
        sys.exit(1)

    data['updatedAt'] = date.today().isoformat()
    data['count'] = len(plugins)
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n',
                    encoding='utf-8')
    print(f'✓ refreshed {ok}/{len(plugins)} repos → {DATA}')


if __name__ == '__main__':
    main()
