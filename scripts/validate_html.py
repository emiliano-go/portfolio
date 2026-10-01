#!/usr/bin/env python3
"""Post-build: validates the SEO-critical markup of the built HTML pages.

Replaces the previous ``seoslug validate-html`` step after the easeo migration.
Stdlib only, no runtime dependency.

Per file it checks: non-empty <title>, meta[name=description], an absolute
<link rel="canonical">, og:title + og:image, and that every
<script type="application/ld+json"> block parses as JSON.
"""
from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path


class SeoHeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.description: str | None = None
        self.canonical: str | None = None
        self.og_title: str | None = None
        self.og_image: str | None = None
        self.jsonld_blocks: list[str] = []
        self._in_title = False
        self._in_jsonld = False
        self._jsonld: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {name: value for name, value in attrs}
        if tag == "title":
            self._in_title = True
        elif tag == "link" and attr.get("rel") == "canonical":
            self.canonical = attr.get("href")
        elif tag == "meta":
            name = (attr.get("name") or "").lower()
            prop = attr.get("property") or ""
            content = attr.get("content") or ""
            if name == "description":
                self.description = content
            elif prop == "og:title":
                self.og_title = content
            elif prop == "og:image":
                self.og_image = content
        elif tag == "script" and (attr.get("type") or "").lower() == "application/ld+json":
            self._in_jsonld = True
            self._jsonld = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._in_jsonld:
            self.jsonld_blocks.append("".join(self._jsonld))
            self._in_jsonld = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._in_jsonld:
            self._jsonld.append(data)


def validate(path: Path) -> list[str]:
    parser = SeoHeadParser()
    parser.feed(path.read_text(encoding="utf-8", errors="replace"))

    problems: list[str] = []
    if not parser.title.strip():
        problems.append("missing <title>")
    if not (parser.description or "").strip():
        problems.append("missing meta[name=description]")
    if not (parser.canonical or "").startswith("https://"):
        problems.append(f"canonical missing or not absolute: {parser.canonical!r}")
    if not (parser.og_title or "").strip():
        problems.append("missing og:title")
    if not (parser.og_image or "").startswith("https://"):
        problems.append(f"og:image missing or not absolute: {parser.og_image!r}")
    for index, block in enumerate(parser.jsonld_blocks):
        try:
            json.loads(block)
        except json.JSONDecodeError as err:
            problems.append(f"JSON-LD block {index} is not valid JSON: {err}")
    return problems


def main() -> int:
    paths = [Path(arg) for arg in sys.argv[1:]]
    if not paths:
        print("usage: validate_html.py <file.html> [...]", file=sys.stderr)
        return 2

    failed = 0
    for path in paths:
        problems = validate(path)
        if problems:
            failed += 1
            print(f"FAIL {path}", file=sys.stderr)
            for problem in problems:
                print(f"  - {problem}", file=sys.stderr)

    if failed:
        print(f"{failed}/{len(paths)} files failed SEO markup validation.", file=sys.stderr)
        return 1
    print(f"SEO markup OK: {len(paths)} files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
