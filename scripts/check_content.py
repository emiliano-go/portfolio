"""Consistency checks for the project catalog, routes, SEO artifacts and llms files.

Run after `npm run build` (or `npm run seo`) so the generated manifest and sitemap
are current. Exits non-zero on the first inconsistency.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCALES = ("en", "es", "fr")


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def project_ids() -> set[str]:
    return set(re.findall(r"^    id: '([^']+)',", read("src/data/projects.ts"), re.M))


def work_page_ids() -> set[str]:
    return {p.stem for p in (ROOT / "src/pages/[lang]/work").glob("*.astro")}


def seo_work_slugs() -> set[str]:
    text = read("scripts/generate_seo.py")
    block = text.split("WORK_PAGES = [", 1)[1].split("]", 1)[0]
    return set(re.findall(r'^\s{8}"([a-z0-9-]+)",', block, re.M))


def catalog_names() -> set[str]:
    names = set(re.findall(r"^    name: '([^']+)',", read("src/data/projects.ts"), re.M))
    names |= set(re.findall(r"^    name: '([^']+)',", read("src/data/catalog.ts"), re.M))
    return names


def i18n_keys(lang: str) -> set[str]:
    return set(json.loads(read(f"src/i18n/{lang}.json")))


def localized_projects(lang: str) -> dict:
    return json.loads(read(f"src/data/projects.{lang}.json"))


def main() -> int:
    errors: list[str] = []

    ids = project_ids()
    pages = work_page_ids()
    seo_slugs = seo_work_slugs()

    if ids != pages:
        errors.append(f"project ids vs work pages: only in data={sorted(ids - pages)}, only in pages={sorted(pages - ids)}")
    if ids != seo_slugs:
        errors.append(f"project ids vs SEO WORK_PAGES: only in data={sorted(ids - seo_slugs)}, only in SEO={sorted(seo_slugs - ids)}")

    llms = (read("public/llms.txt") + read("public/llms-full.txt")).lower()
    missing_llms = sorted(name for name in catalog_names() if name.lower() not in llms)
    if missing_llms:
        errors.append(f"projects missing from llms files: {missing_llms}")

    en_keys = i18n_keys("en")
    for lang in ("es", "fr"):
        missing_keys = en_keys - i18n_keys(lang)
        if missing_keys:
            errors.append(f"{lang}: missing i18n keys: {sorted(missing_keys)[:10]}")

        localized = localized_projects(lang)
        if set(localized) != ids:
            errors.append(f"{lang}: localized project ids differ from English")

    es_projects = localized_projects("es")
    fr_projects = localized_projects("fr")
    for pid in ids:
        es_sections = [s["kind"] for s in es_projects[pid]["sections"]]
        fr_sections = [s["kind"] for s in fr_projects[pid]["sections"]]
        if es_sections != fr_sections:
            errors.append(f"{pid}: es/fr section structure differs")
        if len(es_projects[pid].get("facts", [])) != len(fr_projects[pid].get("facts", [])):
            errors.append(f"{pid}: es/fr facts differ")
        if not es_projects[pid]["summary"].strip() or not fr_projects[pid]["summary"].strip():
            errors.append(f"{pid}: empty localized summary")

    manifest = json.loads(read("src/data/seo-manifest.json"))
    expected_manifest = 4 * 3 + len(ids) * len(LOCALES)
    if len(manifest) != expected_manifest:
        errors.append(f"SEO manifest has {len(manifest)} routes, expected {expected_manifest}")

    sitemap = read("public/sitemap.xml")
    sitemap_urls = len(re.findall(r"<url>", sitemap))
    expected_sitemap = 2 + 2 * len(LOCALES) + len(ids) * len(LOCALES)
    if sitemap_urls != expected_sitemap:
        errors.append(f"sitemap has {sitemap_urls} URLs, expected {expected_sitemap}")

    for required in ("public/_headers", "public/site.webmanifest", "public/.well-known/security.txt", "LICENSE"):
        if not (ROOT / required).exists():
            errors.append(f"missing {required}")

    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    print(f"ok: {len(ids)} case studies, {len(catalog_names())} catalog entries, {sitemap_urls} sitemap URLs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
