# -*- coding: utf-8 -*-
"""Unit tests for docx-template-format (R5)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.docx_template_format import paragraph_format_for  # noqa: E402


class TestParagraphFormatFor(unittest.TestCase):
    def test_indented_bullet_bold_with_leading_space(self):
        raw = "\u3000 \u30fbコンピュータウイルス感染被疑事象はなし"
        self.assertTrue(paragraph_format_for(raw)["bold"])

    def test_section_bullet_not_bold(self):
        text = "・多要素認証（MFA）の全アカウント徹底"
        self.assertFalse(paragraph_format_for(text)["bold"])

    def test_monitor_bullet_bold(self):
        text = "・ネットワーク監視（疑わしい通信検知件数）：0件"
        self.assertTrue(paragraph_format_for(text)["bold"])

    def test_title_center_16pt(self):
        text = "２０２６年０５月情報セキュリティレポート"
        spec = paragraph_format_for(text)
        self.assertEqual(spec["size_pt"], 16)
        self.assertTrue(spec["bold"])


if __name__ == "__main__":
    unittest.main()
