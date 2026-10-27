"""WCAG contrast checks for the palette and project accent colors.

Text tokens must reach 4.5:1 (AA normal text) against bg, surface and
surface-raised. Interactive borders must reach 3:1. Project accent colors are
checked for dark mode (accent) and light mode (accentLight).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEXT_TOKENS = (
    "text-dim",
    "text-muted",
    "text-base",
    "text-bright",
    "text-head",
    "accent",
    "accent-dim",
    "accent-muted",
    "star",
    "gold",
    "gold-dim",
    "edu",
    "success",
    "fail",
)


def srgb(channel: int) -> float:
    c = channel / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)


def contrast(a: str, b: str) -> float:
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def block(css: str, selector: str) -> dict[str, str]:
    match = re.search(re.escape(selector) + r"\s*\{(.*?)\}", css, re.S)
    if not match:
        return {}
    return dict(re.findall(r"(--color-[\w-]+):\s*(#[0-9a-fA-F]{6})", match.group(1)))


def palette(css: str, base: str, high: str) -> dict[str, str]:
    values = block(css, base)
    if high:
        values.update(block(css, high))
    return values


def project_accents() -> list[tuple[str, str, str]]:
    text = (ROOT / "src/data/projects.ts").read_text(encoding="utf-8")
    out = []
    for match in re.finditer(
        r"id: '([^']+)',.*?accent: '(#[0-9a-fA-F]{6})',\s*accentLight: '(#[0-9a-fA-F]{6})',",
        text,
        re.S,
    ):
        out.append(match.groups())
    return out


def main() -> int:
    css = (ROOT / "src/styles/global.css").read_text(encoding="utf-8")
    errors: list[str] = []

    schemes = {
        "dark": palette(css, "@theme", ""),
        "light": palette(css, "html.light", ""),
        "high-dark": palette(css, "@theme", 'html[data-contrast="high"]'),
        "high-light": palette(css, "html.light", 'html.light[data-contrast="high"]'),
    }

    for name, colors in schemes.items():
        for surface in ("bg", "surface", "surface-raised"):
            bg = colors.get(f"--color-{surface}")
            if not bg:
                continue
            for token in TEXT_TOKENS:
                fg = colors.get(f"--color-{token}")
                if not fg:
                    continue
                ratio = contrast(fg, bg)
                if ratio < 4.5:
                    errors.append(f"{name}: --color-{token} ({fg}) on --color-{surface} ({bg}) = {ratio:.2f}")
        border = colors.get("--color-border")
        for surface in ("bg", "surface", "surface-raised"):
            bg = colors.get(f"--color-{surface}")
            if border and bg and contrast(border, bg) < 3.0:
                errors.append(f"{name}: --color-border ({border}) on --color-{surface} = {contrast(border, bg):.2f}")

    dark_bg = schemes["dark"].get("--color-bg", "#0a0c0e")
    dark_surface = schemes["dark"].get("--color-surface", "#111418")
    light_bg = schemes["light"].get("--color-bg", "#f4f6f8")
    light_surface = schemes["light"].get("--color-surface", "#eaecf0")
    for project, accent, accent_light in project_accents():
        for label, fg, bg in (
            ("dark/bg", accent, dark_bg),
            ("dark/surface", accent, dark_surface),
            ("light/bg", accent_light, light_bg),
            ("light/surface", accent_light, light_surface),
        ):
            ratio = contrast(fg, bg)
            if ratio < 4.5:
                errors.append(f"{project}: accent {fg} on {label} = {ratio:.2f}")

    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    print(f"ok: contrast passes for {len(schemes)} schemes and {len(project_accents())} project accents")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
