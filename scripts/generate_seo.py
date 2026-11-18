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
import os
import subprocess
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

# One Person/WebSite node per site, referenced by @id from every page, so search
# engines resolve all 45 URLs to the same human and the same site instead of 45
# anonymous publisher blobs.
PERSON_ID = f"{SITE_URL}/#person"
WEBSITE_ID = f"{SITE_URL}/#website"
CONTENT_DATES = PROJECT_ROOT / "src" / "data" / "content-dates.json"

# Components that carry the landing-page content. A change in any of them changes
# what the home page says, so they all feed its lastmod.
LANDING_COMPONENTS = [
    "src/components/Hero.astro",
    "src/components/About.astro",
    "src/components/Engineering.astro",
    "src/components/Studies.astro",
    "src/components/OpenSource.astro",
    "src/components/References.astro",
    "src/components/Activity.astro",
    "src/components/Work.astro",
    "src/components/Ecosystem.astro",
]

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
        "Evidence-driven security analysis for AUR packages. Never executes code. Fail-closed by design. 257 documented rules, corpus-wide novelty detection.",
    ),
    (
        "rypipe",
        "rypipe",
        "rypipe | Emiliano G.O.",
        "Reusable Rust ingestion engine with Python bindings. Two-trait adapters. 7.63 GB/s bounded parallel on crxml.",
    ),
    (
        "kestrel",
        "Kestrel",
        "Kestrel | Emiliano G.O.",
        "Standalone Arch-based Linux distribution with Hyprland, Quickshell and a per-task scheduling bridge from kernel to sched_ext.",
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
    (
        "xmlstreamer-ng",
        "xmlstreamer-ng",
        "xmlstreamer-ng | Emiliano G.O.",
        "Fault-isolating XML streamer built on rypipe, adapted from carlosplanchon/xmlstreamer. Bounded memory, conservative recovery.",
    ),
    (
        "eclipse",
        "eclipse",
        "eclipse | Emiliano G.O.",
        "Byte-level distillation rig for Ornith 1.5 9B: exact End-Of-Token targets and a 48M byte student.",
    ),
]


def work_pages(lang: str) -> list[tuple[str, str, str, str]]:
    """Localized work-page metadata. English is the committed source of truth."""
    if lang == "en":
        return WORK_PAGES
    localized = json.loads(
        (PROJECT_ROOT / "src" / "data" / f"projects.{lang}.json").read_text(encoding="utf-8")
    )
    return [
        (slug, name, localized[slug]["meta"]["title"], localized[slug]["meta"]["description"])
        for slug, name, _, _ in WORK_PAGES
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


def person_node(t: dict[str, str]) -> dict:
    """A Person node so search engines resolve the site to a human, not just a page."""
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": t["meta.ld.name"],
        "givenName": t["meta.ld.given"],
        "familyName": t["meta.ld.family"],
        "jobTitle": t["meta.ld.job"],
        "url": f"{SITE_URL}/",
        "image": OG_IMAGE.url,
        "sameAs": SAME_AS,
        "knowsAbout": [
            "Distributed systems",
            "Database internals",
            "Developer tooling",
            "Security engineering",
            "Data engineering",
        ],
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
            f"{prefix}/about/",
            SEOEntity(
                entity_type="page",
                title=t["about.page.title"],
                excerpt=t["about.page.desc"],
                breadcrumbs=[Breadcrumb(name=t["nav.logo"], url=home), Breadcrumb(name=t["nav.about"], url=f"{prefix}/about/")],
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
        lang = prefix.lstrip("/")
        for slug, name, title, excerpt in work_pages(lang):
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


def route_sources(route: str) -> list[str]:
    """Source files whose last commit is the honest lastmod for this route."""
    # The unprefixed entry pages are built from LangEntry and one set of strings, and
    # they are what x-default points at, so a wording change there is a change to them.
    entry = [f"src/components/LangEntry.astro", *[f"src/i18n/{code}.json" for code in LOCALES]]
    if route == "/":
        return ["src/pages/index.astro", *entry]
    if route == "/projects/":
        return ["src/pages/projects.astro", *entry]
    if route == "/about/":
        return ["src/pages/about.astro", *entry]
    if route == "/404/":
        return ["src/pages/404.astro"]

    lang = next((code for code in LOCALES if route.startswith(f"/{code}/")), "en")
    suffix = route[len(lang) + 1 :]
    if suffix == "/":
        return [f"src/pages/[lang]/index.astro", f"src/i18n/{lang}.json", *LANDING_COMPONENTS]
    if suffix == "/404/":
        return ["src/pages/[lang]/404.astro"]
    if suffix == "/about/":
        return ["src/pages/[lang]/about.astro", f"src/i18n/{lang}.json"]
    if suffix == "/projects/":
        return [
            "src/pages/[lang]/projects.astro",
            "src/data/catalog.ts",
            f"src/i18n/{lang}.json",
        ]
    if suffix.startswith("/work/"):
        slug = suffix.strip("/").split("/")[-1]
        # Only the content sources: a shared renderer (ProjectPage.astro) changes on
        # every layout tweak, and restamping 33 case studies for a CSS change is not
        # what lastmod is for.
        # A translated case study renders from its own JSON, so the English catalogue
        # is not a source for it: sharing it would date all 24 translated pages to an
        # English-only edit.
        localized = PROJECT_ROOT / "src" / "data" / f"projects.{lang}.json"
        sources = [f"src/pages/[lang]/work/{slug}.astro"]
        if lang != "en" and localized.exists():
            sources.append(f"src/data/projects.{lang}.json")
        else:
            sources.append("src/data/projects.ts")
        return sources
    return [f"src/pages/[lang]{suffix}index.astro"]


def git_is_usable() -> bool:
    """Full history is required: a shallow clone reports HEAD's date for every path.

    Cloudflare Pages checks out shallow, so trusting `git log -1` there would restamp
    all 45 sitemap entries with the deploy date, which is exactly the bug this avoids.
    """
    if os.environ.get("SEO_SKIP_GIT") == "1":
        return False
    if not (PROJECT_ROOT / ".git").exists():
        return False
    try:
        completed = subprocess.run(
            ["git", "-C", str(PROJECT_ROOT), "rev-parse", "--is-shallow-repository"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return False
    return completed.returncode == 0 and completed.stdout.strip() == "false"


def git_last_commit(paths: list[str]) -> str | None:
    """Most recent commit date touching any of these paths, or None if unknown."""
    if not (PROJECT_ROOT / ".git").exists():
        return None
    try:
        completed = subprocess.run(
            ["git", "-C", str(PROJECT_ROOT), "log", "-1", "--format=%cs", "--", *paths],
            capture_output=True,
            text=True,
            timeout=20,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    value = completed.stdout.strip()
    return value if completed.returncode == 0 and value else None


def load_content_dates() -> dict[str, str]:
    if not CONTENT_DATES.is_file():
        return {}
    try:
        raw = json.loads(CONTENT_DATES.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return {route: stamp for route, stamp in raw.items() if isinstance(stamp, str)}


def lastmod_resolver() -> "callable":
    """git when the checkout has history, the committed map otherwise (Docker)."""
    committed = load_content_dates()
    use_git = git_is_usable()

    def resolve(route: str) -> str:
        stamp = git_last_commit(route_sources(route)) if use_git else None
        return stamp or committed.get(route) or date.today().isoformat()

    return resolve


def link_schema(nodes, route: str, lang: str, lastmod: str, person: dict) -> list[dict]:
    """Wire the emitted nodes into one @id graph and add language + freshness.

    easeo emits them independently, which is valid but leaves `publisher` anonymous
    and says nothing about language. Both are cheap to state and expensive to infer.
    """
    url = f"{SITE_URL}{route}"
    graph = [node for node in as_list(nodes) if isinstance(node, dict)]
    has_breadcrumb = any(node.get("@type") == "BreadcrumbList" for node in graph)

    for node in graph:
        node_type = node.get("@type")
        if node_type == "WebPage":
            if route.endswith("/about/"):
                node["@type"] = "ProfilePage"
                node["mainEntity"] = {"@id": PERSON_ID}
            node["@id"] = f"{url}#webpage"
            node["inLanguage"] = lang
            node["isPartOf"] = {"@id": WEBSITE_ID}
            node["publisher"] = {"@id": PERSON_ID}
            node["author"] = {"@id": PERSON_ID}
            node["dateModified"] = lastmod
            if has_breadcrumb:
                node["breadcrumb"] = {"@id": f"{url}#breadcrumb"}
        elif node_type == "WebSite":
            node["@id"] = WEBSITE_ID
            node["inLanguage"] = lang
            node["publisher"] = {"@id": PERSON_ID}
        elif node_type == "BreadcrumbList":
            node["@id"] = f"{url}#breadcrumb"
        elif node_type == "Person":
            node["@id"] = PERSON_ID

    person_node_ = dict(person)
    person_node_["@id"] = PERSON_ID
    if not any(node.get("@id") == PERSON_ID for node in graph):
        graph.append(person_node_)

    # The home page only asks easeo for a WebSite entity, so it would be the one page
    # with no WebPage node: no dateModified, no inLanguage, nothing for a crawler to
    # date. State the page too, and let the WebSite keep describing the site.
    if not any(node.get("@type") in ("WebPage", "ProfilePage") for node in graph):
        homepage = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": f"{url}#webpage",
            "url": url,
            "inLanguage": lang,
            "isPartOf": {"@id": WEBSITE_ID},
            "publisher": {"@id": PERSON_ID},
            "author": {"@id": PERSON_ID},
            "dateModified": lastmod,
        }
        graph.append(homepage)
    return graph


def build_sitemap(entries: list[tuple[str, dict[str, str], str]]) -> str:
    """entries: (canonical url, {hreflang: url}, lastmod) - one <url> per canonical."""
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for loc, alternates, lastmod in entries:
        lines.append("  <url>")
        lines.append(f"    <loc>{escape(loc)}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append("    <changefreq>monthly</changefreq>")
        lines.append(f"    <priority>{'1.0' if loc.rstrip('/') == SITE_URL else '0.8'}</priority>")
        # xhtml:link is an extension element: the sitemap XSD requires it after the
        # core children, which strict validators enforce even though Google does not.
        for hreflang, href in alternates.items():
            lines.append(
                f'    <xhtml:link rel="alternate" hreflang="{hreflang}" href="{escape(href)}" />'
            )
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def _all_routes(i18n: dict[str, dict[str, str]]) -> list[str]:
    routes: list[str] = []
    for prefix in ("", "/en", "/es", "/fr"):
        lang = prefix.lstrip("/") or "en"
        for route, _entity, _overrides, _in_sitemap in routes_for(prefix, i18n[lang]):
            routes.append(route)
    return routes


def main() -> int:
    i18n = load_i18n()
    manifest: dict[str, dict] = {}
    warnings: list[str] = []
    sitemap_paths: list[str] = []
    lastmod_for = lastmod_resolver()
    lastmods: dict[str, str] = {}

    if "--write-dates" in sys.argv:
        dates = {route: lastmod_for(route) for route in sorted(_all_routes(i18n))}
        CONTENT_DATES.write_text(json.dumps(dates, indent=2) + "\n", encoding="utf-8")
        print(f"Written {CONTENT_DATES} ({len(dates)} routes)")
        return 0

    # "" covers the unprefixed entry pages (/ and /projects/), which the language
    # redirect stubs serve and which are what most people actually link to. Without
    # these the entry pages shipped with no description, canonical, OG or JSON-LD.
    for prefix in ("", "/en", "/es", "/fr"):
        lang = prefix.lstrip("/") or "en"
        t = i18n[lang]
        locale = LOCALES[lang]
        alternates = [v for k, v in LOCALES.items() if k != lang]
        config = build_config(locale, alternates)

        for route, entity, overrides, in_sitemap in routes_for(prefix, t):
            payload = build_seo_payload(entity, route, config, overrides)
            payload_dict = payload.to_dict()

            lastmod = lastmod_for(route)
            lastmods[route] = lastmod
            payload_dict["schema_jsonld"] = link_schema(
                payload_dict.get("schema_jsonld"), route, lang, lastmod, person_node(t)
            )

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
    entries: list[tuple[str, dict[str, str], str]] = []
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
        entries.append((f"{SITE_URL}{route}", alternates, lastmods.get(route, date.today().isoformat())))

    sitemap_path = PROJECT_ROOT / "public" / "sitemap.xml"
    sitemap_path.write_text(build_sitemap(entries), encoding="utf-8")

    print(f"Written {manifest_path} ({len(manifest)} routes)")
    print(f"Written {sitemap_path} ({len(entries)} urls)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
