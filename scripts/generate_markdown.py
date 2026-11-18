#!/usr/bin/env python3
"""Post-build: writes a Markdown twin next to every built ``index.html``.

``functions/_middleware.js`` serves these files when a request carries
``Accept: text/markdown``, which is how the site answers Markdown for Agents
without a runtime HTML converter. Generating them at build time keeps the
conversion testable and the request path cheap.

Usage: python3 scripts/generate_markdown.py [dist_dir]
"""
from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}

# Chrome, interactive widgets and non-content elements are dropped so the twin
# carries the page body, not the site shell (same idea as Cloudflare's converter).
SKIP = {
    "script", "style", "svg", "noscript", "template", "iframe", "canvas",
    "button", "form", "input", "select", "textarea", "nav", "header", "footer",
    "aside", "dialog",
}

HEADINGS = {"h1": 1, "h2": 2, "h3": 3, "h4": 4, "h5": 5, "h6": 6}
LIST_TAGS = {"ul", "ol"}

# Elements that stay inside the current paragraph rather than starting a new block.
INLINE_TAGS = {
    "a", "abbr", "b", "br", "cite", "code", "del", "em", "i", "img", "kbd",
    "label", "mark", "picture", "s", "small", "source", "span", "strong",
    "sub", "sup", "time", "u", "wbr",
}

# Tags that mean the element wraps a whole content block rather than a phrase.
BLOCKY = {
    "address", "article", "blockquote", "div", "dl", "dt", "dd", "figure",
    "figcaption", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "main", "ol",
    "p", "pre", "section", "table", "ul",
}


class Node:
    __slots__ = ("tag", "attrs", "children")

    def __init__(self, tag: str, attrs: dict[str, str] | None = None) -> None:
        self.tag = tag
        self.attrs = attrs or {}
        self.children: list[Node | str] = []


class TreeBuilder(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("#document")
        self.stack: list[Node] = [self.root]
        self.raw: str | None = None

    def handle_starttag(self, tag, attrs):
        node = Node(tag, {key: (value or "") for key, value in attrs})
        self.stack[-1].children.append(node)
        if tag in ("script", "style"):
            self.raw = tag
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, {key: (value or "") for key, value in attrs}))

    def handle_endtag(self, tag):
        if self.raw == tag:
            self.raw = None
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        if self.raw:
            return
        self.stack[-1].children.append(data)


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text)


def esc(text: str) -> str:
    """Escape the characters that would otherwise be read as Markdown syntax."""
    text = text.replace("\\", "\\\\")
    for char in "`*_[|":
        text = text.replace(char, "\\" + char)
    return text


def esc_lines(text: str) -> str:
    """Protect line starts from accidentally starting a heading or list."""
    lines = []
    for line in text.split("\n"):
        if line[:1] in {"#", "-", "+", ">", "="}:
            line = "\\" + line
        lines.append(line)
    return "\n".join(lines)


def descendants(node: Node, tag: str):
    for child in node.children:
        if isinstance(child, Node):
            if child.tag == tag:
                yield child
            else:
                yield from descendants(child, tag)


def raw_text(node: Node) -> str:
    parts = []
    for child in node.children:
        if isinstance(child, str):
            parts.append(child)
        elif child.tag not in SKIP:
            parts.append(raw_text(child))
    return "".join(parts)


def has_blocky_child(node: Node) -> bool:
    for child in node.children:
        if isinstance(child, Node) and child.tag in BLOCKY:
            return True
    return False


def concat_inline(children: list[Node | str], in_link: bool) -> str:
    parts: list[str] = []
    for child in children:
        part = inline(child, in_link)
        if not part:
            continue
        if parts:
            previous = parts[-1]
            if (
                not previous.endswith((" ", "\n"))
                and not part.startswith((" ", "\n"))
                and part[0] not in ",.;:)]}!"
            ):
                parts.append(" ")
        parts.append(part)
    return "".join(parts)


def inline(node: Node | str, in_link: bool = False) -> str:
    if isinstance(node, str):
        return esc(norm(node))
    if node.tag in SKIP:
        return ""
    # Server-rendered shells (the commit feed) are filled by JavaScript and hold only
    # a "loading" line at build time: in a Markdown twin that is a lie, not content.
    if "data-project-activity" in node.attrs:
        return ""

    # An <a> that wraps a whole card is a container, not a link: unwrap it so the
    # text and the links inside it survive instead of one enormous link.
    if node.tag == "a" and has_blocky_child(node):
        return concat_inline(node.children, in_link)

    inner = concat_inline(node.children, in_link)
    stripped = inner.strip()

    if node.tag == "br":
        return "\n"
    if node.tag == "img":
        alt = esc(node.attrs.get("alt", ""))
        src = node.attrs.get("src", "")
        if not src:
            return alt
        return f"![{alt}]({src})"
    if node.tag == "a":
        href = node.attrs.get("href", "")
        if in_link or not href or href.startswith(("javascript:", "#")):
            return stripped
        return f"[{stripped or esc(href)}]({href})"
    if node.tag in ("strong", "b"):
        return f"**{stripped}**" if stripped else ""
    if node.tag in ("em", "i"):
        return f"*{stripped}*" if stripped else ""
    if node.tag == "code":
        return f"`{stripped.replace('`', '')}`" if stripped else ""
    if node.tag in ("del", "s"):
        return f"~~{stripped}~~" if stripped else ""
    return inner


def render_list(node: Node, ordered: bool) -> str:
    lines: list[str] = []
    index = 1
    for item in node.children:
        if not isinstance(item, Node) or item.tag != "li":
            continue
        marker = f"{index}. " if ordered else "- "
        index += 1

        head_parts: list[str] = []
        nested: list[Node] = []
        for child in item.children:
            if isinstance(child, Node) and child.tag in LIST_TAGS:
                nested.append(child)
            else:
                head_parts.append(inline(child))

        body = "".join(head_parts).strip()
        body_lines = body.split("\n") if body else [""]
        lines.append(marker + body_lines[0])
        pad = " " * len(marker)
        for line in body_lines[1:]:
            lines.append((pad + line).rstrip())

        for sub in nested:
            sub_md = render_list(sub, sub.tag == "ol")
            for line in sub_md.split("\n"):
                lines.append("  " + line if line else "")
    return "\n".join(lines)


def render_table(node: Node) -> str:
    rows: list[tuple[list[str], bool]] = []
    for row in descendants(node, "tr"):
        cells = []
        header = False
        for cell in row.children:
            if isinstance(cell, Node) and cell.tag in ("td", "th"):
                if cell.tag == "th":
                    header = True
                text = inline(cell).strip().replace("\n", " ")
                cells.append(text.replace("|", "\\|"))
        if cells:
            rows.append((cells, header))
    if not rows:
        return ""

    header_row: list[str] | None = None
    body_rows: list[list[str]] = []
    for cells, is_header in rows:
        if is_header and header_row is None:
            header_row = cells
        else:
            body_rows.append(cells)
    width = max(len(cells) for cells, _ in rows)
    if header_row is None:
        header_row = [""] * width
    header_row = header_row + [""] * (width - len(header_row))

    lines = ["| " + " | ".join(header_row) + " |", "| " + " | ".join(["---"] * width) + " |"]
    for cells in body_rows:
        cells = cells + [""] * (width - len(cells))
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)


def render_blocks(node: Node, out: list[str]) -> None:
    for child in node.children:
        if isinstance(child, str):
            text = esc_lines(esc(norm(child)).strip())
            if text:
                out.append(text)
            continue
        if child.tag in SKIP:
            continue
        if "data-project-activity" in child.attrs:
            continue

        if child.tag in HEADINGS:
            text = "".join(inline(grand) for grand in child.children).strip()
            if text:
                out.append("#" * HEADINGS[child.tag] + " " + text)
        elif child.tag == "pre":
            code = raw_text(child).strip("\n")
            language = ""
            for code_node in descendants(child, "code"):
                classes = code_node.attrs.get("class", "")
                match = re.search(r"language-([\w-]+)", classes)
                if match:
                    language = match.group(1)
                break
            out.append(f"```{language}\n{code}\n```")
        elif child.tag in LIST_TAGS:
            rendered = render_list(child, child.tag == "ol")
            if rendered:
                out.append(rendered)
        elif child.tag == "table":
            rendered = render_table(child)
            if rendered:
                out.append(rendered)
        elif child.tag == "blockquote":
            inner: list[str] = []
            render_blocks(child, inner)
            quoted = "\n\n".join(inner)
            if quoted:
                out.append("\n".join("> " + line if line else ">" for line in quoted.split("\n")))
        elif child.tag == "hr":
            out.append("---")
        elif child.tag == "p":
            text = "".join(inline(grand) for grand in child.children).strip()
            if text:
                out.append(text)
        elif child.tag == "a" and has_blocky_child(child):
            # A whole card wrapped in a link: keep the block structure and hang the
            # card's href on its heading instead of emitting one giant link.
            inner: list[str] = []
            render_blocks_with_inline(child, inner)
            href = child.attrs.get("href", "")
            if href and inner and inner[0].startswith("#"):
                heading = inner[0]
                level = len(heading) - len(heading.lstrip("#"))
                inner[0] = "#" * level + f" [{heading[level:].strip()}]({href})"
            out.extend(inner)
        else:
            inner: list[str] = []
            render_blocks_with_inline(child, inner)
            out.extend(inner)


def render_blocks_with_inline(node: Node, out: list[str]) -> None:
    """Containers (div/section/...) mix block and inline children; keep both."""
    pending: list[str] = []

    def add(part: str) -> None:
        """Keep sibling elements from fusing, without touching authored spacing."""
        if not part:
            return
        if pending:
            previous = pending[-1]
            if (
                previous
                and not previous.endswith((" ", "\n"))
                and not part.startswith((" ", "\n"))
                and part[0] not in ",.;:)]}!"
            ):
                pending.append(" ")
        pending.append(part)

    def flush() -> None:
        text = esc_lines("".join(pending).strip())
        pending.clear()
        if text:
            out.append(text)

    for child in node.children:
        if isinstance(child, str):
            add(inline(child))
            continue
        if child.tag in SKIP:
            continue
        if "data-project-activity" in child.attrs:
            continue
        if child.tag == "a" and has_blocky_child(child):
            flush()
            scratch = Node("#wrapped")
            scratch.children = [child]
            render_blocks(scratch, out)
            continue
        if child.tag in INLINE_TAGS:
            add(inline(child))
            continue
        flush()
        scratch = Node("#wrapped")
        scratch.children = [child]
        render_blocks(scratch, out)
    flush()


def clean(body: str) -> str:
    body = re.sub(r"[ \t]+\n", "\n", body)
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body.strip() + "\n"


def meta_content(head: Node, *, name: str | None = None, prop: str | None = None) -> str | None:
    for child in head.children:
        if isinstance(child, Node) and child.tag == "meta":
            if name and child.attrs.get("name") == name:
                return child.attrs.get("content")
            if prop and child.attrs.get("property") == prop:
                return child.attrs.get("content")
    return None


def page_metadata(tree: Node) -> dict[str, str]:
    head = next((n for n in tree.children if isinstance(n, Node) and n.tag == "head"), None)
    meta: dict[str, str] = {}
    if head is None:
        return meta

    title = meta_content(head, name="title") or meta_content(head, prop="og:title")
    if not title:
        title_node = next((n for n in head.children if isinstance(n, Node) and n.tag == "title"), None)
        if title_node is not None:
            title = raw_text(title_node).strip()
    if title:
        meta["title"] = norm(title)

    description = meta_content(head, name="description") or meta_content(head, prop="og:description")
    if description:
        meta["description"] = norm(description).strip()

    image = meta_content(head, prop="og:image")
    if image:
        meta["image"] = image

    for child in head.children:
        if isinstance(child, Node) and child.tag == "link" and child.attrs.get("rel") == "canonical":
            if child.attrs.get("href"):
                meta["canonical"] = child.attrs["href"]
            break
    return meta


def frontmatter(meta: dict[str, str]) -> str:
    if not meta:
        return ""
    lines = ["---"]
    for key in ("title", "description", "image", "canonical"):
        if meta.get(key):
            lines.append(f"{key}: {json.dumps(meta[key], ensure_ascii=False)}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def convert(html: str) -> str:
    builder = TreeBuilder()
    builder.feed(html)
    builder.close()

    root = next((n for n in builder.root.children if isinstance(n, Node) and n.tag == "html"), builder.root)
    body = next((n for n in root.children if isinstance(n, Node) and n.tag == "body"), None)
    if body is None:
        return ""

    # Prefer <main>: it excludes the fixed nav, the language switcher and the footer.
    main = next((n for n in descendants(body, "main")), None)
    content = main if main is not None else body

    blocks: list[str] = []
    render_blocks_with_inline(content, blocks)
    body_md = clean("\n\n".join(block for block in blocks if block.strip()))
    return frontmatter(page_metadata(root)) + body_md


# `/` and `/projects` are client-side language entry points, so their own body is a
# language chooser rather than content. Their twins carry the English rendering,
# which is what those URLs resolve to, with a note explaining the choice.
ENTRY_SOURCES = {
    "index.html": "en/index.html",
    "projects/index.html": "en/projects/index.html",
}

ENTRY_NOTE = (
    "> Language: English. `emiliano-go.com` and `/projects` are locale entry points; "
    "the site also serves `/es/` and `/fr/`. The canonical English URLs are "
    "<https://emiliano-go.com/en/> and <https://emiliano-go.com/en/projects/>."
)


def twin(dist: Path, page: Path) -> str:
    relative = page.relative_to(dist).as_posix()
    markdown = convert(page.read_text(encoding="utf-8"))
    source = ENTRY_SOURCES.get(relative)
    if not source:
        return markdown

    alternative = dist / source
    if not alternative.is_file():
        return markdown

    alternative_markdown = convert(alternative.read_text(encoding="utf-8"))
    body = alternative_markdown.split("\n---\n", 1)[-1].strip()
    header = markdown.split("\n---\n", 1)[0] + "\n---\n"
    return f"{header}\n{ENTRY_NOTE}\n\n{body}\n"


def main(argv: list[str]) -> int:
    dist = Path(argv[1]).resolve() if len(argv) > 1 else DIST
    if not dist.is_dir():
        print(f"error: {dist} does not exist; run `npm run build` first", file=sys.stderr)
        return 1

    pages = sorted(dist.rglob("index.html"))
    for page in pages:
        markdown = twin(dist, page)
        if not markdown.strip():
            print(f"error: {page.relative_to(dist)} produced no Markdown", file=sys.stderr)
            return 1
        target = page.with_name("index.md")
        target.write_text(markdown, encoding="utf-8")

    print(f"ok: wrote {len(pages)} Markdown twins into {dist.name}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
