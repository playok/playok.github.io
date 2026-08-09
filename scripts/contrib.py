"""GitHub 공개 기여 페이지에서 일별 기여 수를 수집한다.

인증이 필요 없고, 프로필 설정에 따라 비공개 저장소 기여까지 포함된 값이 나온다.
"""

import re
import urllib.request
from datetime import date, timedelta

UA = "Mozilla/5.0 (compatible; playok-arcade-stats/1.0)"
URL = "https://github.com/users/{user}/contributions?from={y}-01-01&to={y}-12-31"

_DAY_RE = re.compile(r'data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"')
_TIP_RE = re.compile(r'<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)</tool-tip>')
_COUNT_RE = re.compile(r"^([\d,]+)\s+contributions?")


def parse_days(html):
    """HTML에서 {날짜: 기여수}를 뽑는다. 하나도 못 찾으면 ValueError."""
    cells = dict((cid, d) for d, cid in _DAY_RE.findall(html))
    if not cells:
        raise ValueError("기여 칸(data-date)을 찾지 못했다 — 페이지 구조가 바뀐 것 같다")

    days = {}
    for cid, text in _TIP_RE.findall(html):
        if cid not in cells:
            continue
        m = _COUNT_RE.match(text.strip())
        days[cells[cid]] = int(m.group(1).replace(",", "")) if m else 0

    if not days:
        raise ValueError("툴팁(tool-tip)을 찾지 못했다 — 페이지 구조가 바뀐 것 같다")
    return days


def fetch_year(user, year, today):
    url = URL.format(user=user, y=year)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", "replace")
    days = parse_days(html)
    return {d: c for d, c in days.items() if d.startswith(str(year)) and d <= today}


def collect(user, start_year, today):
    merged = {}
    for year in range(start_year, int(today[:4]) + 1):
        merged.update(fetch_year(user, year, today))
    if not merged:
        raise ValueError("수집된 데이터가 없다")
    return merged


def summarize(days, today):
    if not days:
        raise ValueError("빈 데이터는 요약할 수 없다")

    ordered = sorted(days)
    year = int(today[:4])

    max_combo = run = 0
    prev = None
    for d in ordered:
        cur_date = date.fromisoformat(d)
        if days[d] > 0:
            run = run + 1 if prev and cur_date - prev == timedelta(days=1) else 1
            max_combo = max(max_combo, run)
        else:
            run = 0
        prev = cur_date

    cur = date.fromisoformat(today)
    if days.get(today, 0) == 0:
        cur -= timedelta(days=1)
    current = 0
    while days.get(cur.isoformat(), 0) > 0:
        current += 1
        cur -= timedelta(days=1)

    best_date = max(ordered, key=lambda d: days[d])
    by_year = {}
    for d, c in days.items():
        by_year[d[:4]] = by_year.get(d[:4], 0) + c

    this_year = {d: c for d, c in days.items() if d.startswith(str(year))}
    elapsed = (date.fromisoformat(today) - date(year, 1, 1)).days + 1

    return {
        "total": sum(days.values()),
        "year": year,
        "year_total": sum(this_year.values()),
        "max_combo": max_combo,
        "current_combo": current,
        "best_day": days[best_date],
        "best_day_date": best_date,
        "active_days": sum(1 for c in days.values() if c > 0),
        "year_days_elapsed": elapsed,
        "year_active_days": sum(1 for c in this_year.values() if c > 0),
        "by_year": by_year,
        "updated": today,
    }
