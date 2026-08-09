#!/usr/bin/env python3
"""기여 통계를 수집해 assets/stats.json으로 쓴다.

실패하면 0이 아닌 코드로 종료하고 기존 파일을 건드리지 않는다.
"""

import json
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import contrib  # noqa: E402

USER = "playok"
START_YEAR = 2010
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "stats.json")


def main():
    today = os.environ.get("PLAYOK_TODAY") or date.today().isoformat()
    days = contrib.collect(USER, START_YEAR, today)
    stats = contrib.summarize(days, today)

    if stats["total"] <= 0:
        raise ValueError(f"총 기여가 {stats['total']} — 수집이 잘못됐다")

    path = os.path.normpath(OUT)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    print(f"wrote {path}: total={stats['total']} year={stats['year_total']}")


if __name__ == "__main__":
    sys.exit(main() or 0)
