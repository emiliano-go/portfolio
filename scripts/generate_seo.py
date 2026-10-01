"""Pre-build: generates the SEO JSON manifest and sitemap for every route using easeo.

Titles, descriptions and Person/JSON-LD fields are read from src/i18n/*.json so the
metadata stays in the same place as the copy it describes, and each language gets
metadata in its own language.

Outputs:
  src/data/seo-manifest.json  - consumed by src/components/Seo.astro
  public/sitemap.xml          - all routes with hreflang alternates

Exits non-zero if easeo reports a payload-level validation issue, so a too-long title
or a relative canonical fails the build rather than shipping.
"""
from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

from easeo import (
    Breadcrumb,
    Robots,
    SEOConfig,
    SEOEntity,
    SEOImage,
    SEOOverrides,
    URLPolicy,
    build_seo_payload,
    validate_payload,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent

SITE_URL = "https://emiliano-go.com"
TWITTER = "@emiliano_gando"

LOCALES: dict[str, str] = {
    "en": "en_US",
    "es": "es_ES",
    "fr": "fr_FR",
}

SAME_AS = [
    "https://github.com/emiliano-go",
    "https://www.linkedin.com/in/emiliano-go",
]

OG_IMAGE = SEOImage(
    url=f"{SITE_URL}/og-image.png",
    width=1200,
    height=630,
    alt="Emiliano G.O. - portfolio preview card",
)

# max-image-preview:large is what makes the OG card eligible for a large thumbnail
# in Google results; max-snippet:-1 lifts the snippet length cap.
INDEXABLE = Robots(index=True, follow=True, max_snippet=-1, max_image_preview="large")
NOINDEX = Robots(index=False, follow=False)

# Project case-study pages are English-only copy, but they exist under every language
# prefix and are linked from the localized project cards. (slug, breadcrumb name, title, excerpt)
WORK_PAGES = [
    (
        "dbwarden",
        "DBWarden",
        "DBWarden | Emiliano G.O.",
        "Declarative schema compiler for SQLAlchemy. Models \u2192 IR \u2192 Diff \u2192 SQL \u2192 Verification.",
    ),
    (
        "trustsight",
        "TrustSight",
        "TrustSight | Emiliano G.O.",
        "Evidence-driven security analysis for AUR packages. Never executes code. Fail-closed by design.",
    ),
    (
        "rypipe",
        "rypipe",
        "rypipe | Emiliano G.O.",
        "Reusable ingestion framework. Rust core, Python bindings. Add a new format by implementing two traits.",
    ),
    (
        "postal",
        "postal",
        "postal | Emiliano G.O.",
        "Native WhatsApp multi-device client with no webview. Bounded memory, opt-in history sync, durable SQLite archive.",
    ),
    (
        "neurafly",
        "neurafly",
        "neurafly | Emiliano G.O.",
        "Terminal audio visualizer driven by the real FlyWire connectome: 138,333 spiking neurons and 2,052,622 synapses, rendered in braille.",
    ),
    (
        "easeo",
        "easeo",
        "easeo | Emiliano G.O.",
        "Deterministic SEO metadata from one Rust core with Python and Node.js bindings. Byte-for-byte identical output across languages.",
    ),
    (
        "clickvault",
        "ClickVault",
        "ClickVault | Emiliano G.O.",
        "HashiCorp Vault database secrets engine plugin for ClickHouse.",
    ),
    (
        "dsig",
        "dsig",
        "dsig | Emiliano G.O.",
        "GPG message signing for Vencord / Vesktop. Authorship attestation.",
    ),
]


def load_i18n() -> dict[str, dict[str, str]]:
    return {
        lang: json.loads((PROJECT_ROOT / "src" / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
        for lang in LOCALES
    }


def build_config(locale: str | None, alternates: list[str] | None) -> SEOConfig:
    return SEOConfig(
        canonical_host="emiliano-go.com",
        public_base_url=SITE_URL,
        url_policy=URLPolicy(
            enforce_https=True,
            lowercase_paths=True,
            trailing_slash="preserve",
        ),
        site_name="Emiliano G.O.",
        title_template="{title}",
        default_og_image=OG_IMAGE,
        default_robots=INDEXABLE,
        publisher_name="Emiliano Gandini Outeda",
        locale=locale,
        locale_alternate=alternates,
        twitter_site=TWITTER,
    )


def person_node(t: dict[str, str], home_url: str) -> dict:
    """A Person node so search engines resolve the site to a human, not just a page."""
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": t["meta.ld.name"],
        "givenName": t["meta.ld.given"],
        "familyName": t["meta.ld.family"],
        "jobTitle": t["meta.ld.job"],
        "url": home_url,
        "image": OG_IMAGE.url,
        "sameAs": SAME_AS,
        "worksFor": {"@type": "Organization", "name": t["meta.ld.works"]},
        "alumniOf": {"@type": "EducationalOrganization", "name": t["meta.ld.alumni"]},
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Montevideo",
            "addressCountry": "UY",
        },
    }


def routes_for(prefix: str, t: dict[str, str]) -> list[tuple[str, SEOEntity, SEOOverrides, bool]]:
    """(route, entity, overrides, include_in_sitemap) for one language prefix.

    `prefix` is "" for the unprefixed entry pages and "/en" etc. for the real pages.
    """
    home = f"{prefix}/" or "/"
    projects = f"{prefix}/projects/"
    crumbs = [
        Breadcrumb(name=t["nav.logo"], url=home),
        Breadcrumb(name=t["nav.projects"].title(), url=projects),
    ]
    routes = [
        (
            home,
            SEOEntity(
                entity_type="home",
                title=t["meta.default.title"],
                excerpt=t["meta.default.desc"],
                same_as=SAME_AS,
            ),
            SEOOverrides(twitter_creator=TWITTER),
            True,
        ),
        (
            projects,
            SEOEntity(
                entity_type="page",
                title=t["projects.page.title"],
                excerpt=t["projects.page.desc"],
                breadcrumbs=crumbs,
            ),
            SEOOverrides(twitter_creator=TWITTER),
            True,
        ),
        (
            f"{prefix}/404/",
            SEOEntity(
                entity_type="page",
                title=t["page404.title"],
                excerpt=t["page404.sub"],
            ),
            SEOOverrides(robots=NOINDEX),
            False,
        ),
    ]
    # Unprefixed /work/* pages do not exist, so only emit work routes for real prefixes.
    if prefix:
        for slug, name, title, excerpt in WORK_PAGES:
            route = f"{prefix}/work/{slug}/"
            routes.append(
                (
                    route,
                    SEOEntity(
                        entity_type="page",
                        title=title,
                        excerpt=excerpt,
                        breadcrumbs=crumbs + [Breadcrumb(name=name, url=route)],
                    ),
                    SEOOverrides(twitter_creator=TWITTER),
                    True,
                )
            )
    return routes


def as_list(schema) -> list:
    if schema is None:
        return []
    return list(schema) if isinstance(schema, list) else [schema]


def build_sitemap(entries: list[tuple[str, dict[str, str]]]) -> str:
    """entries: (canonical url, {hreflang: url}) - one <url> per canonical."""
    today = date.today().isoformat()
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for loc, alternates in entries:
        lines.append("  <url>")
        lines.append(f"    <loc>{escape(loc)}</loc>")
        for hreflang, href in alternates.items():
            lines.append(
                f'    <xhtml:link rel="alternate" hreflang="{hreflang}" href="{escape(href)}" />'
            )
        lines.append(f"    <lastmod>{today}</lastmod>")
        lines.append("    <changefreq>monthly</changefreq>")
        lines.append(f"    <priority>{'1.0' if loc.rstrip('/') == SITE_URL else '0.8'}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main() -> int:
    i18n = load_i18n()
    manifest: dict[str, dict] = {}
    warnings: list[str] = []
    sitemap_paths: list[str] = []

    # "" covers the unprefixed entry pages (/ and /projects/), which the language
    # redirect stubs serve and which are what most people actually link to. Without
    # these the entry pages shipped with no description, canonical, OG or JSON-LD.
    for prefix in ("", "/en", "/es", "/fr"):
        lang = prefix.lstrip("/") or "en"
        t = i18n[lang]
        locale = LOCALES[lang]
        alternates = [v for k, v in LOCALES.items() if k != lang]
        config = build_config(locale, alternates)
        home_url = f"{SITE_URL}{prefix}/" or f"{SITE_URL}/"

        for route, entity, overrides, in_sitemap in routes_for(prefix, t):
            payload = build_seo_payload(entity, route, config, overrides)
            payload_dict = payload.to_dict()

            if entity.entity_type == "home":
                payload_dict["schema_jsonld"] = as_list(payload_dict.get("schema_jsonld")) + [
                    person_node(t, home_url)
                ]

            for issue in validate_payload(payload):
                if issue.severity == "info":
                    continue
                warnings.append(f"{route}: {issue.rule_id} {issue.message}")

            manifest[route] = payload_dict
            if in_sitemap and prefix:
                sitemap_paths.append(route)
            elif in_sitemap and not prefix:
                sitemap_paths.append(route)

    if warnings:
        print("SEO validation failed:", file=sys.stderr)
        for warning in warnings:
            print(f"  - {warning}", file=sys.stderr)
        return 1

    manifest_path = PROJECT_ROOT / "src" / "data" / "seo-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # One <url> per canonical, each advertising every language plus x-default.
    entries: list[tuple[str, dict[str, str]]] = []
    for route in sitemap_paths:
        suffix = route
        for lang in LOCALES:
            if route.startswith(f"/{lang}/"):
                suffix = route[len(lang) + 1 :]
                break
        alternates = {lang: f"{SITE_URL}/{lang}{suffix}" for lang in LOCALES}
        # /work/* has no unprefixed page; English is the x-default.
        if suffix.startswith("/work/"):
            alternates["x-default"] = f"{SITE_URL}/en{suffix}"
        else:
            alternates["x-default"] = f"{SITE_URL}{suffix}"
        entries.append((f"{SITE_URL}{route}", alternates))

    sitemap_path = PROJECT_ROOT / "public" / "sitemap.xml"
    sitemap_path.write_text(build_sitemap(entries), encoding="utf-8")

    print(f"Written {manifest_path} ({len(manifest)} routes)")
    print(f"Written {sitemap_path} ({len(entries)} urls)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
