#!/usr/bin/env python3
"""Consistency checks for the agent-discovery documents.

Every file under ``public/.well-known/`` is committed by hand, so this script is the
thing that keeps them honest: identifiers follow ARD's ``urn:air:`` form, the skills
index digests match the SKILL.md bytes on disk, every same-origin URL a document
promises actually resolves to a file or a Pages Function, and robots.txt carries
Content Signals. Run by ``npm test`` (after ``npm run build`` in CI).
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
WELL_KNOWN = PUBLIC / ".well-known"
SITE = "https://emiliano-go.com"

# Routes served by Pages Functions rather than by a static file.
FUNCTION_ROUTES = {"/api/katib", "/api/health", "/mcp"}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def load_json(path: Path, errors: list[str]):
    if not path.is_file():
        errors.append(f"missing {path.relative_to(ROOT)}")
        return None
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        errors.append(f"{path.relative_to(ROOT)}: invalid JSON ({exc})")
        return None


def same_origin_path(url: str) -> str | None:
    if not isinstance(url, str) or not url.startswith(SITE):
        return None
    path = url[len(SITE):] or "/"
    return path.split("?", 1)[0].split("#", 1)[0]


def resolves(path: str) -> bool:
    if path in FUNCTION_ROUTES:
        return True
    if path == "/":
        return (ROOT / "src/pages/index.astro").is_file()
    candidate = PUBLIC / path.lstrip("/")
    if candidate.is_file():
        return True
    if path.endswith("/") and (candidate / "index.html").is_file():
        return True
    if candidate.with_suffix(".html").is_file():
        return True
    route = path.strip("/")
    if route and (ROOT / "src/pages" / route).with_suffix(".astro").is_file():
        return True
    if route and (ROOT / "src/pages" / route / "index.astro").is_file():
        return True
    return False


def check_urls(document_name: str, urls: list[str], errors: list[str]) -> None:
    for url in urls:
        path = same_origin_path(url)
        if path is None:
            continue
        if not resolves(path):
            errors.append(f"{document_name}: {url} does not resolve to a file or function")


def collect_strings(value) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        out: list[str] = []
        for item in value.values():
            out.extend(collect_strings(item))
        return out
    if isinstance(value, list):
        out = []
        for item in value:
            out.extend(collect_strings(item))
        return out
    return []


def check_robots(errors: list[str]) -> None:
    path = PUBLIC / "robots.txt"
    if not path.is_file():
        errors.append("missing public/robots.txt")
        return
    text = read(path)

    if not re.search(r"^User-agent:\s*\*", text, re.M):
        errors.append("robots.txt: no wildcard User-agent group")
    signal = re.search(r"^Content-Signal:\s*(.+)$", text, re.M)
    if not signal:
        errors.append("robots.txt: no Content-Signal directive")
    else:
        value = signal.group(1)
        for key in ("ai-train", "search", "ai-input"):
            if not re.search(rf"\b{key}=(yes|no)\b", value):
                errors.append(f"robots.txt: Content-Signal is missing {key}")

    agentmap = re.search(r"^Agentmap:\s*(\S+)$", text, re.M)
    if not agentmap:
        errors.append("robots.txt: no Agentmap directive")
    elif same_origin_path(agentmap.group(1)) != "/.well-known/ai-catalog.json":
        errors.append("robots.txt: Agentmap should point at /.well-known/ai-catalog.json")

    if not re.search(r"^Sitemap:\s*\S+", text, re.M):
        errors.append("robots.txt: no Sitemap directive")


def check_headers(errors: list[str]) -> None:
    path = PUBLIC / "_headers"
    if not path.is_file():
        errors.append("missing public/_headers")
        return
    text = read(path)
    for relation in ("api-catalog", "service-desc", "service-doc", "describedby", "service-meta"):
        if f'rel="{relation}"' not in text:
            errors.append(f"_headers: no Link relation {relation}")
    for fragment in (
        "application/linkset+json",
        "/.well-known/api-catalog",
        "Vary: Accept",
    ):
        if fragment not in text:
            errors.append(f"_headers: missing {fragment}")
    if not re.search(r"^\s*Vary:\s*Accept", text, re.M):
        errors.append("_headers: Vary must include Accept (Markdown negotiation shares a URL with HTML)")


def check_api_catalog(errors: list[str]) -> None:
    data = load_json(WELL_KNOWN / "api-catalog", errors)
    if data is None:
        return
    linkset = data.get("linkset")
    if not isinstance(linkset, list) or not linkset:
        errors.append("api-catalog: \"linkset\" must be a non-empty array")
        return
    urls: list[str] = []
    for entry in linkset:
        anchor = entry.get("anchor")
        if not isinstance(anchor, str) or not anchor.startswith(SITE):
            errors.append(f"api-catalog: entry has no absolute anchor ({anchor!r})")
        relations = [key for key in entry if key != "anchor"]
        if not relations:
            errors.append(f"api-catalog: entry {anchor} has no link relations")
        if "service-desc" not in relations:
            errors.append(f"api-catalog: entry {anchor} has no service-desc")
        for relation in relations:
            for target in entry[relation]:
                if not isinstance(target, dict) or "href" not in target:
                    errors.append(f"api-catalog: {anchor} {relation} target needs an href")
                    continue
                urls.append(target["href"])
    check_urls("api-catalog", urls, errors)


def check_ai_catalog(errors: list[str]) -> None:
    data = load_json(WELL_KNOWN / "ai-catalog.json", errors)
    if data is None:
        return
    if not isinstance(data.get("specVersion"), str) or not data["specVersion"]:
        errors.append("ai-catalog.json: specVersion must be a non-empty string")
    host = data.get("host")
    if not isinstance(host, dict):
        errors.append("ai-catalog.json: missing host object")
    else:
        for key in ("displayName", "identifier"):
            if not isinstance(host.get(key), str) or not host[key]:
                errors.append(f"ai-catalog.json: host.{key} must be a non-empty string")

    entries = data.get("entries")
    if not isinstance(entries, list) or not entries:
        errors.append("ai-catalog.json: entries must be a non-empty array")
        return

    for index, entry in enumerate(entries):
        label = entry.get("identifier", f"entry {index}")
        identifier = entry.get("identifier")
        if not isinstance(identifier, str) or not identifier.startswith("urn:air:emiliano-go.com:"):
            errors.append(f"ai-catalog.json: {label}: identifier must be urn:air:emiliano-go.com:…")
        if not isinstance(entry.get("displayName"), str) or not entry["displayName"]:
            errors.append(f"ai-catalog.json: {label}: displayName required")
        media_type = entry.get("type")
        if not isinstance(media_type, str) or "/" not in media_type:
            errors.append(f"ai-catalog.json: {label}: type must be a media type")
        has_url, has_data = "url" in entry, "data" in entry
        if has_url == has_data:
            errors.append(f"ai-catalog.json: {label}: needs exactly one of url or data")
        queries = entry.get("representativeQueries")
        if not isinstance(queries, list) or not 2 <= len(queries) <= 5:
            errors.append(f"ai-catalog.json: {label}: representativeQueries needs 2-5 entries")
    check_urls("ai-catalog.json", [entry.get("url") for entry in entries if entry.get("url")], errors)


def check_server_card(errors: list[str]) -> None:
    data = load_json(WELL_KNOWN / "mcp" / "server-card.json", errors)
    if data is None:
        return
    info = data.get("serverInfo")
    if not isinstance(info, dict) or not info.get("name") or not info.get("version"):
        errors.append("server-card.json: serverInfo needs name and version")
    transport = data.get("transport")
    if not isinstance(transport, dict):
        errors.append("server-card.json: missing transport object")
    else:
        endpoint = transport.get("endpoint")
        if not isinstance(endpoint, str) or same_origin_path(endpoint) not in FUNCTION_ROUTES:
            errors.append("server-card.json: transport.endpoint must be a Function route")
        if not transport.get("type"):
            errors.append("server-card.json: transport.type required")
    if not isinstance(data.get("capabilities"), dict) or "tools" not in data["capabilities"]:
        errors.append("server-card.json: capabilities.tools required")
    declared = {tool.get("name") for tool in data.get("tools", [])}
    function = read(ROOT / "functions" / "mcp.js")
    for name in declared:
        if f"name: '{name}'" not in function:
            errors.append(f"server-card.json: tool {name} is not implemented in functions/mcp.js")
    check_urls("server-card.json", collect_strings(data), errors)


def check_agent_skills(errors: list[str]) -> None:
    index_path = WELL_KNOWN / "agent-skills" / "index.json"
    data = load_json(index_path, errors)
    if data is None:
        return
    schema = data.get("$schema")
    if not isinstance(schema, str) or not schema.endswith("schema.json") or "agentskills.io" not in schema:
        errors.append("agent-skills/index.json: $schema must reference the discovery schema")
    skills = data.get("skills")
    if not isinstance(skills, list) or not skills:
        errors.append("agent-skills/index.json: skills must be a non-empty array")
        return

    for skill in skills:
        name = skill.get("name", "")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
            errors.append(f"agent-skills/index.json: invalid skill name {name!r}")
            continue
        if skill.get("type") not in ("skill-md", "archive"):
            errors.append(f"agent-skills/index.json: {name}: type must be skill-md or archive")
        for key in ("description", "url", "digest"):
            if not skill.get(key):
                errors.append(f"agent-skills/index.json: {name}: {key} required")

        artifact = WELL_KNOWN / "agent-skills" / name / "SKILL.md"
        if not artifact.is_file():
            errors.append(f"agent-skills: missing artifact {artifact.relative_to(ROOT)}")
            continue
        digest = "sha256:" + hashlib.sha256(artifact.read_bytes()).hexdigest()
        if skill.get("digest") != digest:
            errors.append(f"agent-skills/index.json: {name}: digest is stale (expected {digest})")
        expected_url = f"{SITE}/.well-known/agent-skills/{name}/SKILL.md"
        if skill.get("url") != expected_url:
            errors.append(f"agent-skills/index.json: {name}: url should be {expected_url}")

        text = read(artifact)
        if not text.startswith("---\n"):
            errors.append(f"agent-skills/{name}/SKILL.md: missing YAML frontmatter")
        elif f"name: {name}" not in text.split("---")[1]:
            errors.append(f"agent-skills/{name}/SKILL.md: frontmatter name does not match the directory")


def check_auth_md(errors: list[str]) -> None:
    path = PUBLIC / "auth.md"
    if not path.is_file():
        errors.append("missing public/auth.md")
        return
    first_heading = next((line for line in read(path).splitlines() if line.startswith("# ")), "")
    if "auth.md" not in first_heading.lower():
        errors.append("auth.md: the H1 must mention auth.md")
    if "oauth-protected-resource" not in read(path):
        errors.append("auth.md: must state the OAuth protected-resource posture")


def check_protected_resource(errors: list[str]) -> None:
    data = load_json(WELL_KNOWN / "oauth-protected-resource", errors)
    if data is None:
        return
    resource = data.get("resource")
    if not isinstance(resource, str) or not resource.startswith(SITE):
        errors.append("oauth-protected-resource: resource must be an absolute URL on this origin")
    servers = data.get("authorization_servers")
    if not isinstance(servers, list):
        errors.append("oauth-protected-resource: authorization_servers must be an array")
    elif servers:
        errors.append(
            "oauth-protected-resource: an empty authorization_servers list is what makes this "
            "document honest; pointing at a server that cannot issue tokens would mislead agents"
        )
    if (WELL_KNOWN / "oauth-authorization-server").exists() or (WELL_KNOWN / "openid-configuration").exists():
        errors.append("a protected resource with no authorization server must not advertise issuer metadata")


def check_openapi(errors: list[str]) -> None:
    data = load_json(PUBLIC / "openapi.json", errors)
    if data is None:
        return
    if not str(data.get("openapi", "")).startswith("3."):
        errors.append("openapi.json: openapi must be a 3.x version")
    paths = data.get("paths")
    if not isinstance(paths, dict) or not paths:
        errors.append("openapi.json: paths must be a non-empty object")
        return
    for route in paths:
        if route not in FUNCTION_ROUTES:
            errors.append(f"openapi.json: {route} is not a Pages Function route")
    for required in ("info", "servers"):
        if required not in data:
            errors.append(f"openapi.json: missing {required}")


def check_routes(errors: list[str]) -> None:
    data = load_json(PUBLIC / "_routes.json", errors)
    if data is None:
        return
    excludes = data.get("exclude")
    if not isinstance(excludes, list) or "/*.md" not in excludes:
        errors.append("_routes.json: \"/*.md\" must be excluded so the ASSETS lookup cannot recurse")
    middleware = read(ROOT / "functions" / "_middleware.js")
    if "application/linkset+json" not in middleware:
        errors.append("_middleware.js must serve /.well-known/api-catalog as application/linkset+json")


def check_markdown_twins(errors: list[str]) -> None:
    dist = ROOT / "dist"
    if not dist.is_dir():
        return  # local `npm test` without a build
    pages = list(dist.rglob("index.html"))
    twins = list(dist.rglob("index.md"))
    if len(twins) != len(pages):
        errors.append(f"dist: {len(twins)} Markdown twins for {len(pages)} HTML pages; run npm run build")
    for twin in twins[:40]:
        text = twin.read_text(encoding="utf-8")
        if not text.startswith("---\n"):
            errors.append(f"dist/{twin.relative_to(dist)}: missing frontmatter")
        elif "title:" not in text.split("---\n", 2)[1]:
            errors.append(f"dist/{twin.relative_to(dist)}: frontmatter has no title")
    for page in pages:
        target = page.with_name("index.md")
        if not target.is_file():
            errors.append(f"dist: {page.relative_to(dist)} has no Markdown twin")


def check_build_output(errors: list[str]) -> None:
    """Guard the wiring: the files above only matter if the build actually ships them."""
    dist = ROOT / "dist"
    if not dist.is_dir():
        return  # local `npm test` without a build

    headers = dist / "_headers"
    if not headers.is_file():
        errors.append("dist: _headers was not copied; public/_headers must reach the output")
    elif 'rel="api-catalog"' not in read(headers):
        errors.append("dist/_headers: Link relations missing from the built output")

    routes = dist / "_routes.json"
    if not routes.is_file():
        errors.append("dist: _routes.json was not copied")
    else:
        try:
            excluded = json.loads(read(routes)).get("exclude", [])
        except json.JSONDecodeError:
            errors.append("dist/_routes.json: invalid JSON")
            excluded = []
        if "/*.md" not in excluded:
            errors.append("dist/_routes.json: /*.md must stay excluded")

    for relative in (".well-known/api-catalog", ".well-known/ai-catalog.json", ".well-known/oauth-protected-resource", "mcp/catalog.json", "auth.md", "openapi.json"):
        if not (dist / relative).is_file():
            errors.append(f"dist: {relative} missing from the build output")

    catalog = dist / "mcp" / "catalog.json"
    if catalog.is_file():
        try:
            data = json.loads(read(catalog))
        except json.JSONDecodeError:
            errors.append("dist/mcp/catalog.json: invalid JSON")
        else:
            if not isinstance(data.get("projects"), list) or not data["projects"]:
                errors.append("dist/mcp/catalog.json: no projects; /mcp would answer with an empty catalog")

    page = dist / "index.html"
    if page.is_file():
        html = read(page)
        for fragment in ('rel="ai-catalog"', 'rel="api-catalog"', "modelContext"):
            if fragment not in html:
                errors.append(f"dist/index.html: missing {fragment}")


def main() -> int:
    errors: list[str] = []
    check_robots(errors)
    check_headers(errors)
    check_api_catalog(errors)
    check_ai_catalog(errors)
    check_server_card(errors)
    check_agent_skills(errors)
    check_auth_md(errors)
    check_protected_resource(errors)
    check_openapi(errors)
    check_routes(errors)
    check_markdown_twins(errors)
    check_build_output(errors)

    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    skills = len(json.loads(read(WELL_KNOWN / "agent-skills" / "index.json"))["skills"])
    print(f"ok: robots.txt, auth.md, API catalog, ARD manifest, MCP card and {skills} agent-skill digests consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
