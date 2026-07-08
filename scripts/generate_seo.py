"""Pre-build: generates SEO JSON manifest for the portfolio using seoslug."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from seoslug import (
    SEOConfig,
    URLPolicy,
    SEOEntity,
    SEOOverrides,
    OGImage,
    Robots,
    build_seo_payload,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent

SITE_URL = "https://emiliano-go.com"
SITE_NAME = "Emiliano G.O."

SEO_CONFIG = SEOConfig(
    canonical_host="emiliano-go.com",
    public_base_url=SITE_URL,
    url_policy=URLPolicy(
        enforce_https=True,
        lowercase_paths=True,
        trailing_slash="preserve",
    ),
    site_name=SITE_NAME,
    title_template="{title}",
    default_og_image=OGImage(
        url=f"{SITE_URL}/og-image.png",
        width=1200,
        height=630,
        alt="Emiliano G.O. portfolio preview",
    ),
    default_robots=Robots(index=True, follow=True),
    publisher_name="Emiliano Gandini Outeda",
    locale="en_US",
    locale_alternate=["es_ES", "fr_FR"],
    twitter_site="@emiliano_gando",
)


def make_entity(title: str, description: str, entity_type: str = "page") -> SEOEntity:
    return SEOEntity(
        entity_type=entity_type,
        title=title,
        excerpt=description,
    )


ROUTES: list[tuple[str, str, str, str, SEOOverrides | None]] = [
    (
        "/",
        "Emiliano G.O. - Backend Engineer & Data Scientist",
        "Python developer focused on data pipelines, ETL infrastructure, and backend architecture. Based in Montevideo, Uruguay.",
        "home",
        SEOOverrides(twitter_creator="@emiliano_gando"),
    ),
    (
        "/projects/",
        "Projects - Emiliano G.O.",
        "DBWarden, schemap, and other Python packages - database tooling, ETL utilities, and open source projects by Emiliano Gandini Outeda.",
        "page",
        SEOOverrides(twitter_creator="@emiliano_gando"),
    ),
    (
        "/404.html",
        "404 - Page Not Found | Emiliano G.O.",
        "The page you are looking for does not exist.",
        "page",
        SEOOverrides(robots=Robots(index=False, follow=False)),
    ),
]


def main() -> int:
    manifest: dict[str, dict] = {}
    for route, title, description, entity_type, overrides in ROUTES:
        entity = make_entity(title, description, entity_type)
        payload = build_seo_payload(entity, route, SEO_CONFIG, overrides)
        manifest[route] = payload.to_dict()

    output = PROJECT_ROOT / "src" / "data" / "seo-manifest.json"
    output.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"Written {output} ({len(manifest)} routes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
