import unittest

import contrib

# GitHub 기여 페이지의 실제 구조를 축약한 픽스처.
# 날짜 칸은 data-date를 갖고, 실제 수치는 id로 연결된 tool-tip 텍스트에 있다.
FIXTURE = """
<table>
<td data-date="2026-01-01" id="c-0" data-level="0" class="ContributionCalendar-day"></td>
<td data-date="2026-01-02" id="c-1" data-level="2" class="ContributionCalendar-day"></td>
<td data-date="2026-01-03" id="c-2" data-level="4" class="ContributionCalendar-day"></td>
<td data-date="2026-01-04" id="c-3" data-level="1" class="ContributionCalendar-day"></td>
</table>
<tool-tip for="c-0">No contributions on January 1st.</tool-tip>
<tool-tip for="c-1">7 contributions on January 2nd.</tool-tip>
<tool-tip for="c-2">1,204 contributions on January 3rd.</tool-tip>
<tool-tip for="c-3">1 contribution on January 4th.</tool-tip>
"""


class TestParse(unittest.TestCase):
    def test_parses_all_days(self):
        days = contrib.parse_days(FIXTURE)
        self.assertEqual(len(days), 4)

    def test_zero_for_no_contributions(self):
        self.assertEqual(contrib.parse_days(FIXTURE)["2026-01-01"], 0)

    def test_plain_count(self):
        self.assertEqual(contrib.parse_days(FIXTURE)["2026-01-02"], 7)

    def test_strips_thousands_separator(self):
        self.assertEqual(contrib.parse_days(FIXTURE)["2026-01-03"], 1204)

    def test_singular_contribution(self):
        self.assertEqual(contrib.parse_days(FIXTURE)["2026-01-04"], 1)

    def test_empty_html_raises(self):
        with self.assertRaises(ValueError):
            contrib.parse_days("<html><body>nothing</body></html>")


class TestSummarize(unittest.TestCase):
    def setUp(self):
        # 2026-01-02~05 연속 4일, 01-08~09 연속 2일
        self.days = {
            "2025-12-31": 5,
            "2026-01-01": 0,
            "2026-01-02": 3, "2026-01-03": 9, "2026-01-04": 2, "2026-01-05": 4,
            "2026-01-06": 0, "2026-01-07": 0,
            "2026-01-08": 6, "2026-01-09": 1, "2026-01-10": 0,
        }

    def test_total_sums_everything(self):
        self.assertEqual(contrib.summarize(self.days, "2026-01-10")["total"], 30)

    def test_year_total_excludes_other_years(self):
        self.assertEqual(contrib.summarize(self.days, "2026-01-10")["year_total"], 25)

    def test_max_combo(self):
        self.assertEqual(contrib.summarize(self.days, "2026-01-10")["max_combo"], 4)

    def test_current_combo_ignores_today_if_empty(self):
        # 오늘(01-10)이 0이면 어제까지 이어진 연속을 센다 -> 01-09, 01-08 = 2
        self.assertEqual(contrib.summarize(self.days, "2026-01-10")["current_combo"], 2)

    def test_current_combo_includes_today_if_active(self):
        self.assertEqual(contrib.summarize(self.days, "2026-01-09")["current_combo"], 2)

    def test_best_day(self):
        s = contrib.summarize(self.days, "2026-01-10")
        self.assertEqual(s["best_day"], 9)
        self.assertEqual(s["best_day_date"], "2026-01-03")

    def test_by_year_grouping(self):
        s = contrib.summarize(self.days, "2026-01-10")
        self.assertEqual(s["by_year"]["2025"], 5)
        self.assertEqual(s["by_year"]["2026"], 25)

    def test_year_progress(self):
        s = contrib.summarize(self.days, "2026-01-10")
        self.assertEqual(s["year_days_elapsed"], 10)
        self.assertEqual(s["year_active_days"], 6)

    def test_updated_is_today(self):
        self.assertEqual(contrib.summarize(self.days, "2026-01-10")["updated"], "2026-01-10")

    def test_empty_days_raises(self):
        with self.assertRaises(ValueError):
            contrib.summarize({}, "2026-01-10")


if __name__ == "__main__":
    unittest.main()
