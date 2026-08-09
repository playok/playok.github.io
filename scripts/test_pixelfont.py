import unittest

import pixelfont as pf


class TestGlyphs(unittest.TestCase):
    def test_every_glyph_is_5x7(self):
        for ch, rows in pf.GLYPHS.items():
            self.assertEqual(len(rows), 7, f"{ch!r} must have 7 rows")
            for i, row in enumerate(rows):
                self.assertEqual(len(row), 5, f"{ch!r} row {i} must be 5 wide")
                self.assertTrue(set(row) <= {"#", "."}, f"{ch!r} row {i} bad chars")

    def test_required_charset_present(self):
        required = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:/-+&'"
        for ch in required:
            self.assertIn(ch, pf.GLYPHS, f"missing glyph {ch!r}")

    def test_space_is_blank(self):
        self.assertEqual(set("".join(pf.GLYPHS[" "])), {"."})


class TestRender(unittest.TestCase):
    def test_text_width_counts_gaps(self):
        # 3글자, px=2, gap=1 -> 3*5*2 + 2*(1*2) = 30 + 4 = 34
        self.assertEqual(pf.text_width("ABC", px=2, gap=1), 34)

    def test_empty_text_has_zero_width(self):
        self.assertEqual(pf.text_width("", px=3), 0)

    def test_rects_emitted_only_for_lit_pixels(self):
        out = pf.text_rects("I", x=0, y=0, px=1, color="#00f0ff")
        runs = 0
        for row in pf.GLYPHS["I"]:
            runs += len([r for r in row.split(".") if r])
        self.assertEqual(out.count("<rect"), runs)
        self.assertIn('fill="#00f0ff"', out)

    def test_space_emits_nothing(self):
        self.assertEqual(pf.text_rects(" ", x=0, y=0, px=4, color="#fff"), "")

    def test_unknown_char_falls_back_to_space(self):
        self.assertEqual(pf.text_rects("☃", x=0, y=0, px=4, color="#fff"), "")

    def test_scale_and_offset_applied(self):
        out = pf.text_rects("I", x=10, y=20, px=3, color="#fff")
        self.assertIn('width="3" height="3"', out)
        self.assertIn('x="10"', out)


class TestSvgHelpers(unittest.TestCase):
    def test_header_declares_size_and_viewbox(self):
        h = pf.svg_header(900, 280)
        self.assertIn('width="900"', h)
        self.assertIn('height="280"', h)
        self.assertIn('viewBox="0 0 900 280"', h)
        self.assertIn("http://www.w3.org/2000/svg", h)

    def test_footer_closes_svg(self):
        self.assertEqual(pf.svg_footer().strip(), "</svg>")

    def test_scanlines_cover_height(self):
        out = pf.scanlines(100, 20)
        self.assertEqual(out.count("<rect"), 10)  # 2px 간격

    def test_esc_escapes_xml(self):
        self.assertEqual(pf.esc("a&b<c>"), "a&amp;b&lt;c&gt;")


if __name__ == "__main__":
    unittest.main()
