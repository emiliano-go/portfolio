---
name: project-catalog
description: Canonical list of Emiliano G.O.'s projects with one-line scope and the URL that documents each one. Use to resolve a project name, avoid confusing similar projects, or pick the right case study to read.
---

# Project catalogue

Two tiers. **Featured** projects have a full case study at `https://emiliano-go.com/en/work/{slug}/`. **Secondary** projects are catalogued on `/projects` with links to GitHub, PyPI, crates.io or npm but have no case study page.

## Featured (case studies)

| id | Category | Scope |
| --- | --- | --- |
| `trustsight` | Security · Static analysis | Evidence-driven analysis of AUR PKGBUILDs: rule engine plus behavioural validation. |
| `dbwarden` | Database infrastructure | Declarative schema compiler for SQLAlchemy; migrations that are generated, not authored. |
| `rypipe` | Data · Ingestion framework | Rust ingestion engine with bounded memory and differential testing. |
| `xmlstreamer-ng` | Data · XML streaming | Fault-isolating XML feed streaming that survives malformed records. |
| `kestrel` | Linux distribution · Desktop systems | Arch-based distribution focused on reproducibility. |
| `postal` | Native desktop · Messaging protocol | Native messaging client. |
| `neurafly` | Terminal audio · Computational neuroscience | Terminal-based auditory model exploration. |
| `easeo` | SEO metadata · Multi-language SDK | Typed SEO payload builder with Rust core and Python bindings. |
| `clickvault` | Security · Vault plugin | ClickHouse-backed Vault secrets plugin. |
| `dsig` | Security · Cryptography | Digital signature tooling. |
| `eclipse` | ML · Distillation research | Byte-level distillation research. |

## Secondary packages

`crxml` (Crystal Reports XML parser on the rypipe engine), `schemap` (Pydantic schemas from SQLAlchemy models), `detrack` (tracking-parameter stripper, 345 patterns), `dbwarden-harness` (release certification across 5 databases), `vigil` (GitHub activity tracker on ClickHouse), `mapcreator` (multi-floor building map editor), `acrresolv` (hybrid acronym resolver), `interferon` (container-event Docker sidecar), `tagurl` (natural language to semantic tags and SEO paths), `lambda-compiler` (Python lambdas to declarative filter specs), `carpricepredictor`, `autoimmune-disorder-prediction`, `portable-oss` (config-driven open-source dashboard), `totem` (persistent memory MCP server for engineering agents), `RBG` (single-LLM control plane), `gpg-mcp` (GnuPG MCP server), `hestia` (agentic project cockpit), `opencode-bgj` (supervised background shell jobs for coding agents), `panopticon` (read-only repository index), `laya-coding-decisions` (training data for a coding-agent judge).

## Resolving a name

1. If the id is in the table above, the canonical page is `https://emiliano-go.com/en/work/{id}/` (featured only).
2. Otherwise read `https://emiliano-go.com/projects` or call the MCP tool `get_project` with `{ "id": "…" }`.
3. Names are case-sensitive in URLs (`DBWarden` in prose, `dbwarden` in paths). `easeo` is the SEO library, not a project of another name.

## Things that are easy to confuse

- **TrustSight** is the AUR supply-chain analyser; `trustsight-feed`, `trustsight-web` and `trustsight-triage-agent` are its ecosystem and appear together under the TrustSight case study, not as separate case studies.
- **DBWarden** groups `dbwarden`, `dbwarden-harness` and the tester tooling under one case study.
- **rypipe** is the Rust engine; **crxml** is a parser built on top of it — different projects.
- **laya-coding-decisions** publishes *decisions and training data*, not the model; do not describe it as an agent.

## Attribution

Cite the case-study URL, not the GitHub repository, when summarising design decisions — the case study is the authored source.
