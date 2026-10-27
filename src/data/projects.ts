export type Tone = 'pass' | 'fail' | 'neutral';

export interface ProjectLink {
  label: string;
  href: string;
  primary?: boolean;
}

export interface Metric {
  label: string;
  value: string;
  tone?: Tone;
  repo?: string;
}

export interface PanelItem {
  key: string;
  val: string;
  tone?: Tone;
}

export interface CardItem {
  title: string;
  body: string;
}

export interface StepItem {
  title: string;
  body: string;
}

export interface EcosystemRepo {
  name: string;
  role: string;
  desc: string;
  stack: string[];
  href: string;
}

export type Section =
  | { kind: 'prose'; title: string; body: string[] }
  | { kind: 'cards'; title: string; cards: CardItem[]; columns?: 2 | 3 }
  | { kind: 'list'; title: string; items: string[] }
  | { kind: 'panel'; title: string; lead?: string; label: string; items: PanelItem[] }
  | { kind: 'steps'; title: string; steps: StepItem[] }
  | { kind: 'table'; title: string; columns: string[]; rows: string[][]; note?: string }
  | { kind: 'ecosystem'; title: string; intro?: string; repos: EcosystemRepo[] };

export interface Project {
  id: string;
  name: string;
  index: string;
  category: string;
  accent: string;
  accentLight: string;
  summary: string;
  lede: string;
  stack: string[];
  links: ProjectLink[];
  metrics: Metric[];
  facts?: string[];
  diagram: string;
  license: string;
  sections: Section[];
  meta: {
    title: string;
    description: string;
  };
}

import projectsEs from './projects.es.json';
import projectsFr from './projects.fr.json';

const GH = 'https://github.com';

const localized: Record<string, Record<string, Project>> = {
  es: projectsEs as unknown as Record<string, Project>,
  fr: projectsFr as unknown as Record<string, Project>,
};

export const projects: Project[] = [
  {
    id: 'dbwarden',
    name: 'DBWarden',
    index: '01',
    category: 'Database infrastructure',
    accent: '#b39d6a',
    accentLight: '#705f2f',
    summary:
      'Declarative schema compiler that derives deterministic database migrations from SQLAlchemy models.',
    lede: 'Your models are the source code. SQL is the output.',
    stack: ['Python 3.12+', 'SQLAlchemy 2.0', 'PostgreSQL', 'MySQL', 'MariaDB', 'SQLite', 'ClickHouse'],
    links: [
      { label: 'GitHub', href: `${GH}/dbwarden-org/dbwarden`, primary: true },
      { label: 'Docs', href: 'https://docs.dbwarden.org' },
      { label: 'PyPI', href: 'https://pypi.org/project/dbwarden/' },
      { label: 'Harness', href: 'https://harness.dbwarden.org' },
    ],
    metrics: [
      { label: 'DB backends', value: '5' },
      { label: 'Official plugins', value: '7' },
      { label: 'Test files', value: '166' },
      { label: 'Release', value: 'v0.20.10', repo: 'dbwarden-org/dbwarden' },
    ],
    facts: ['63K source LOC', '5 databases', 'Stable Alpha', 'Release harness'],
    diagram: 'Models → IR → Diff → SQL → Verification',
    license: 'MIT',
    meta: {
      title: 'DBWarden | Emiliano G.O.',
      description:
        'Declarative schema compiler for SQLAlchemy. Deterministic SQL + rollbacks, offline CI generation, impact analysis, 5 backends.',
    },
    sections: [
      {
        kind: 'prose',
        title: "Problem",
        body: [
          'Schema management tools fall into two camps. Imperative tools have you author changes: revision scripts that describe how to get from one schema version to the next. Declarative tools have you author the desired state and derive the changes for you. Most imperative tools ask you to maintain two representations of your schema: your ORM models and your migration files. When they drift, you find out at deploy time.',
        ],
      },
      {
        kind: 'prose',
        title: "Why it's hard",
        body: [
          'Schema drift is the core enemy. Making this deterministic requires a diff engine that handles renames, type changes, constraint changes, and ordering across five database backends with different DDL dialects. Every migration must carry both upgrade and rollback SQL, and the rollback must be tested against the actual database.',
        ],
      },
      {
        kind: 'cards',
        title: 'Capabilities',
        columns: 3,
        cards: [
          { title: 'Impact analysis', body: 'dbwarden check-impact scans the codebase with AST analysis and a grep fallback, then reports every reference to a column or table a migration changes before deploy.' },
          { title: 'Offline generation', body: 'Export model state once, then generate migrations in CI or on a machine with no database using make-migrations --offline.' },
          { title: 'Schema snapshots', body: 'Every migration writes a checksummed JSON snapshot. Snapshots power rename detection, offline diffs and column-level comparisons.' },
          { title: 'Typed Meta', body: 'A metaclass validates every class Meta attribute at import time; typos that would produce wrong DDL raise DBWardenConfigError immediately.' },
          { title: 'Reverse engineering', body: 'Generate SQLAlchemy models from a live database with generate-models, including backend metadata and a custom --base import.' },
          { title: 'Multi-database', body: 'One project can target several databases with isolated configs, per-database table ownership and optional databases that skip when missing.' },
        ],
      },
      {
        kind: 'steps',
        title: 'Workflow',
        steps: [
          { title: 'Point at existing models', body: 'DBWarden reads your SQLAlchemy models as the single source of truth.' },
          { title: 'make-migrations', body: 'Generates a baseline schema or diffs against the current database state.' },
          { title: 'Commit generated SQL', body: 'Plain SQL files: reviewable, committable, executable anywhere.' },
          { title: 'migrate', body: 'Applies pending migrations with convergence verification.' },
          { title: 'Optional: impact analysis, offline mode, plugins', body: 'AST-based breaking change detection, CI without a database, seeds/RBAC/FastAPI integration.' },
        ],
      },
      {
        kind: 'cards',
        title: 'Key decisions',
        columns: 2,
        cards: [
          { title: 'SQL-first output', body: 'Migrations are plain SQL files. No runtime, no generated Python. Reviewable, committable, executable anywhere.' },
          { title: 'Deterministic diff', body: 'Same models + same snapshot = same migration. Always. No hidden state, no ordering dependencies.' },
          { title: 'Strict rollback contract', body: 'Every migration carries upgrade + rollback SQL. Placeholder rollback refused by default.' },
          { title: 'Plugin architecture', body: '7 official plugins for seeds, RBAC, FastAPI, sandbox testing, and PostgreSQL/ClickHouse extensions.' },
        ],
      },
      {
        kind: 'prose',
        title: 'Safety model',
        body: [
          'Migration generation classifies every operation, splits type changes into expand-contract steps, and assigns severity. The CLI adds execution ceilings, pending-plan checks and structured impact reports, so a destructive change can be stopped before it reaches production.',
          'History stays auditable: checksummed snapshots, repeatable migrations, merge reconciliation and rebase support. Rollbacks are generated where safe; irreversible changes require an explicit declaration instead of a placeholder.',
        ],
      },
      {
        kind: 'list',
        title: 'Constraints',
        items: [
          'No migration runtime to install or version',
          'No generated Python scripts that quietly do the wrong thing',
          'No schema drift discovered in production',
          'Migrations that can be generated in CI without a database connection',
        ],
      },
      {
        kind: 'table',
        title: 'Supported databases',
        columns: ['Database', 'Round-trip', 'Notes'],
        rows: [
          ['PostgreSQL', 'Full', 'Identity and generated columns, partitioning, inheritance, exclusion constraints, enum types and advanced indexes.'],
          ['MySQL', 'Full', 'DDL parity, engine/charset/collation options, unsigned and on-update columns.'],
          ['ClickHouse', 'Full', 'MergeTree family, replicated engines, projections, dictionaries, materialized views and skip indexes.'],
          ['SQLite', 'Full', 'WITHOUT ROWID/STRICT, generated columns, table rebuilds for unsupported ALTERs.'],
          ['MariaDB', 'Partial', 'Schema layer complete; snapshot and reverse-engineering gaps remain.'],
        ],
        note: 'Round-trip means model → SQL → live database → model validation.',
      },
      {
        kind: 'prose',
        title: 'Status',
        body: [
          'Stable Alpha: pre-1.0 but production-ready. No breaking change ships without a 3-month deprecation window.',
        ],
      },
      {
        kind: 'panel',
        title: 'Test harness',
        lead: 'dbwarden Test Harness is a standalone black-box validation suite. It installs DBWarden as a consumer, invokes its public CLI, creates disposable real database instances via Testcontainers, and verifies the compiled SQL produces the correct schema. This is not a unit test suite; it is a release certification boundary.',
        label: 'Harness coverage',
        items: [
          { key: 'PyPI installation', val: 'PASS', tone: 'pass' },
          { key: 'CLI contract', val: 'PASS', tone: 'pass' },
          { key: '5 DB providers', val: 'PASS', tone: 'pass' },
          { key: 'Migration application', val: 'PASS', tone: 'pass' },
          { key: 'Constraint enforcement', val: 'PASS', tone: 'pass' },
          { key: 'Regeneration silence', val: 'PASS', tone: 'pass' },
          { key: 'Rollback / recovery', val: 'PASS', tone: 'pass' },
          { key: 'Plugin discovery', val: 'PASS', tone: 'pass' },
        ],
      },
      {
        kind: 'ecosystem',
        title: 'Ecosystem',
        intro: 'The compiler is the centre of a set of independently versioned tools.',
        repos: [
          {
            name: 'wlite',
            role: 'CLI + bindings',
            desc: 'Declarative SQLite schema management without the Python overhead. The same philosophy as DBWarden, stripped to what SQLite and C can do alone.',
            stack: ['C++', 'Rust', 'Python', 'Go', 'C#', 'Zig'],
            href: `${GH}/dbwarden-org/wlite`,
          },
          {
            name: 'libwlite',
            role: 'C library',
            desc: "DBWarden's SQLite engine extracted as a standalone C library. Parses .wlite model files, manages databases, compares schemas, and generates migrations.",
            stack: ['C11', 'SQLite3'],
            href: `${GH}/dbwarden-org/libwlite`,
          },
          {
            name: 'dbwarden-harness',
            role: 'Release certification',
            desc: 'Standalone black-box validation across five real databases: PyPI install, CLI contract, migration application, rollback, and plugin discovery.',
            stack: ['Python', 'Docker', 'Testcontainers'],
            href: `${GH}/dbwarden-org/dbwarden-harness`,
          },
          {
            name: 'dbwarden-redis',
            role: 'Migration locking',
            desc: 'Redis-backed distributed migration locking for concurrent deployers.',
            stack: ['Python', 'Redis'],
            href: `${GH}/dbwarden-org/dbwarden-redis`,
          },
          {
            name: 'dbwarden-fastapi',
            role: 'Web integration',
            desc: 'FastAPI session dependencies, health endpoints and migration routes.',
            stack: ['Python', 'FastAPI'],
            href: `${GH}/dbwarden-org/dbwarden-fastapi`,
          },
          {
            name: 'dbwarden-ch-rbac',
            role: 'ClickHouse RBAC',
            desc: 'Roles, users, grants, row policies, quotas and settings profiles for ClickHouse.',
            stack: ['Python', 'ClickHouse'],
            href: `${GH}/dbwarden-org/dbwarden-ch-rbac`,
          },
          {
            name: 'dbwarden-pgsql-types',
            role: 'Postgres types',
            desc: 'Custom ENUMs, domains, composite types and sequences.',
            stack: ['Python', 'PostgreSQL'],
            href: `${GH}/dbwarden-org/dbwarden-pgsql-types`,
          },
          {
            name: 'dbwarden-pgsql-rbac',
            role: 'Postgres RBAC',
            desc: 'Roles, grants, default privileges and row-level security policies.',
            stack: ['Python', 'PostgreSQL'],
            href: `${GH}/dbwarden-org/dbwarden-pgsql-rbac`,
          },
          {
            name: 'dbwarden-pgsql-extensions',
            role: 'Postgres extensions',
            desc: 'Extensions, event triggers, functions, triggers and storage parameters.',
            stack: ['Python', 'PostgreSQL'],
            href: `${GH}/dbwarden-org/dbwarden-pgsql-extensions`,
          },
          {
            name: 'dbwarden-plugin-template',
            role: 'Plugin template',
            desc: 'Scaffolding for building and testing new DBWarden plugins.',
            stack: ['Python'],
            href: `${GH}/dbwarden-org/dbwarden-plugin-template`,
          },
          {
            name: 'dbwarden-seeds',
            role: 'Seed data',
            desc: 'Code and file-based seed management with apply and rollback.',
            stack: ['Python'],
            href: `${GH}/dbwarden-org/dbwarden-seeds`,
          },
          {
            name: 'dbwarden-sandbox',
            role: 'Sandbox testing',
            desc: 'Testcontainers sandbox providers for safe migration replay.',
            stack: ['Python', 'Docker'],
            href: `${GH}/dbwarden-org/dbwarden-sandbox`,
          },
        ],
      },
      {
        kind: 'list',
        title: 'Tradeoffs',
        items: [
          'Requires SQLAlchemy 2.0+ (not compatible with legacy models)',
          'Schema compilation adds a build step vs. runtime migration',
          'Declarative approach means less control over migration ordering',
        ],
      },
    ],
  },
  {
    id: 'trustsight',
    name: 'TrustSight',
    index: '02',
    category: 'Security · Static analysis',
    accent: '#0092d2',
    accentLight: '#006498',
    summary:
      'Evidence-driven security analysis for AUR packages. It never executes code, never fetches sources, and fails closed when coverage is incomplete.',
    lede: 'A clean result is not proof of safety. It is a statement about detection.',
    stack: ['Python 3.11+', 'Arch Linux', 'SQLite', 'Ed25519', 'libgit2'],
    links: [
      { label: 'GitHub', href: `${GH}/emiliano-go/trustsight`, primary: true },
      { label: 'Docs', href: 'https://docs.trustsight.org' },
      { label: 'trustsight.org', href: 'https://trustsight.org' },
      { label: 'Watcher', href: 'https://watcher.trustsight.org' },
      { label: 'Harness', href: 'https://harness.trustsight.org' },
      { label: 'PyPI', href: 'https://pypi.org/project/trustsight/' },
    ],
    metrics: [
      { label: 'Documented rules', value: '257' },
      { label: 'Source URLs', value: '186K' },
      { label: 'Maintainer identities', value: '36K' },
      { label: 'Release', value: 'v0.25.0', repo: 'emiliano-go/trustsight' },
    ],
    facts: ['~7K tests', '257 documented rules', 'Signed baselines', 'IOC federation'],
    diagram: 'PKGBUILD / diff → Static analysis → Evidence + coverage → Risk assessment → Verdict',
    license: 'MIT',
    meta: {
      title: 'TrustSight | Emiliano G.O.',
      description:
        'Evidence-driven security analysis for AUR packages. Never executes code. Fail-closed by design. 257 documented rules, corpus-wide novelty detection.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          'AUR package updates are reviewed by humans reading PKGBUILD diffs. This process is slow, inconsistent, and misses structural attacks: piped shell scripts, checksum disabling, typosquatting, obfuscated commands, and maintainer takeovers. There is no automated tool that produces evidence without executing the package.',
        ],
      },
      {
        kind: 'prose',
        title: "Why it's hard",
        body: [
          'The hard constraint is never executing code. Static analysis of PKGBUILDs means reasoning about shell scripts, command injection, typosquatting, and maintainer behavior patterns without running anything.',
          'Corpus-wide cluster detection adds another layer: tracking roughly 186K source URLs and 36K maintainer identities to detect first-seen signals, orphan hijacking, and accelerated release cadence. The tool must fail closed; incomplete evidence must not silently become confidence.',
        ],
      },
      {
        kind: 'panel',
        title: 'Security model',
        label: 'Invariants',
        items: [
          { key: 'PKGBUILD execution', val: 'BLOCKED', tone: 'pass' },
          { key: 'Arbitrary network', val: 'BLOCKED', tone: 'pass' },
          { key: 'System modification', val: 'BLOCKED', tone: 'pass' },
          { key: 'Coverage loss', val: 'EXPLICIT', tone: 'neutral' },
          { key: 'Incomplete analysis', val: 'FAIL-CLOSED', tone: 'fail' },
        ],
      },
      {
        kind: 'cards',
        title: 'Detection categories',
        columns: 2,
        cards: [
          { title: 'Command injection', body: 'Piped shell scripts, obfuscated commands, build-environment tampering (LD_PRELOAD, and peers).' },
          { title: 'Supply chain', body: 'Checksum disabled, source URL swaps, unpinned build dependencies, GPG verification removed.' },
          { title: 'Typosquatting', body: 'Package-name and source-URL edit distance against known forge domains and popular packages.' },
          { title: 'Maintainer signals', body: 'Untrusted takeover, orphan hijacking, stale package revived, accelerated release cadence.' },
          { title: 'Novelty detection', body: 'First-seen URLs and maintainers against a signed seed database of ~186K source URLs and ~36K identities.' },
          { title: 'Sabotage payloads', body: 'Fork bombs, disk wiping, permission sabotage, coin miners; distinguishes build sandbox from system context.' },
          { title: 'Encoding attacks', body: 'Unicode bidi overrides, homoglyph codepoints, and reviewer-directed instruction templates.' },
          { title: 'IOC matching', body: 'Known-bad indicators against signed, federated baselines from the release channel.' },
        ],
      },
      {
        kind: 'cards',
        title: 'Key decisions',
        columns: 2,
        cards: [
          { title: 'Static analysis only', body: 'Never executes PKGBUILDs, never fetches URLs, runs before makepkg. The tool is a SAST tool by design.' },
          { title: 'Evidence, not proof', body: 'Every finding is traceable to a specific diff line, URL, or novelty record. The output is a structured evidence report, not a gate.' },
          { title: 'Signed baselines', body: 'Novelty seed and IOC baselines ship as signed GitHub release assets, verified against a pinned distribution key on import.' },
          { title: 'Configurable dependency depth', body: 'AUR dependencies are analyzed as packages in their own right, to a configurable depth. Coverage gaps stay explicit.' },
        ],
      },
      {
        kind: 'ecosystem',
        title: 'Ecosystem',
        intro: 'TrustSight is a core with five independent satellites: measurement, research, triage, the public site, and the live watcher feed.',
        repos: [
          {
            name: 'trustsight',
            role: 'Core · CLI · watcher',
            desc: 'The analysis engine, rule catalog, signed baselines, deterministic evidence reports, and the AUR watcher that feeds the public alert stream.',
            stack: ['Python', 'SQLite', 'libgit2'],
            href: `${GH}/emiliano-go/trustsight`,
          },
          {
            name: 'trustsight-harness',
            role: 'Adversarial measurement',
            desc: 'Turns "an LLM found N bypasses" into reproducible, cost-tracked campaigns against a pinned build. Also exposes an MCP server for feed and verification tools.',
            stack: ['Python', 'Docker', 'pytest'],
            href: `${GH}/emiliano-go/trustsight-harness`,
          },
          {
            name: 'trustsight-lab',
            role: 'Offline research',
            desc: 'Finds, ranks, and validates deterministic rule improvements in a throwaway worktree. Proposals require human review and the normal gates.',
            stack: ['Python', 'uv', 'pytest'],
            href: `${GH}/emiliano-go/trustsight-lab`,
          },
          {
            name: 'trustsight-triage-agent',
            role: 'Local-model triage',
            desc: 'One process, one local model. Cited FP/TP triage over watcher alerts with no remote gateway, queue, or job container.',
            stack: ['Python', 'Ollama', 'MCP'],
            href: `${GH}/emiliano-go/trustsight-triage-agent`,
          },
          {
            name: 'trustsight-web',
            role: 'Product site',
            desc: 'Single-page site for trustsight.org presenting the evidence-first review model: capabilities, calibration, configuration, and limits.',
            stack: ['Preact', 'Vite'],
            href: `${GH}/emiliano-go/trustsight-web`,
          },
          {
            name: 'trustsight-feed',
            role: 'Live alert feed',
            desc: 'Searchable archive of watcher alerts on Cloudflare Workers and D1, with per-rule explanations and full evidence documents.',
            stack: ['Workers', 'D1', 'Preact'],
            href: `${GH}/emiliano-go/trustsight-feed`,
          },
        ],
      },
      {
        kind: 'panel',
        title: 'Verification',
        lead: 'The harness turns "an LLM found N bypasses" into a reproducible, auditable, cost-tracked measurement against a pinned build.',
        label: 'Harness statuses',
        items: [
          { key: 'detected', val: 'rule fired', tone: 'pass' },
          { key: 'partial_evasion', val: 'another rule caught it', tone: 'neutral' },
          { key: 'fail_closed_catch', val: 'coverage gap blocked', tone: 'fail' },
          { key: 'bypass', val: 'returned UNFLAGGED', tone: 'fail' },
          { key: 'behavior_lost', val: 'attack chain not proven', tone: 'neutral' },
        ],
      },
      {
        kind: 'list',
        title: 'What it cannot see',
        items: [
          'Malicious upstream release tarballs (audits the PKGBUILD, not binaries)',
          'Deliberately unremarkable attacks (no diff signal = invisible)',
          'Runtime attacks (the tool never executes anything)',
          'Zero-day structural attacks (pattern-based, calibrated against the corpus)',
        ],
      },
    ],
  },
  {
    id: 'rypipe',
    name: 'rypipe',
    index: '03',
    category: 'Data · Ingestion framework',
    accent: '#c96a50',
    accentLight: '#9b4a32',
    summary:
      'Reusable ingestion framework. Rust core, Python bindings. Add a new format by implementing two traits.',
    lede: 'Adapters stay small. The engine owns scheduling, bounded memory, and Arrow export.',
    stack: ['Rust 1.78+', 'Python 3.10+', 'PyO3', 'Apache Arrow', 'mmap'],
    links: [
      { label: 'GitHub', href: `${GH}/emiliano-go/rypipe`, primary: true },
      { label: 'Docs', href: 'https://rypipe.emiliano-go.com' },
      { label: 'PyPI', href: 'https://pypi.org/project/rypipe/' },
      { label: 'crxml', href: `${GH}/emiliano-go/crxml` },
    ],
    metrics: [
      { label: 'Tests', value: '476' },
      { label: 'Parallel (crxml)', value: '7.63 GB/s', tone: 'pass' },
      { label: 'Documentation', value: '15.9K lines' },
      { label: 'Published', value: 'PyPI + crates.io', tone: 'pass' },
    ],
    facts: ['476 tests', '7.63 GB/s bounded', '4.23 GB/s full-RAM', '2.12 GB/s xmlstreamer-ng'],
    diagram: 'Format Adapter (Splitter + RecordParser) → Parallel Engine → Fused Plan → Arrow',
    license: 'MIT',
    meta: {
      title: 'rypipe | Emiliano G.O.',
      description:
        'Reusable Rust ingestion engine with Python bindings. Two-trait adapters. 7.63 GB/s bounded parallel on crxml.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'What is rypipe',
        body: [
          'rypipe is a reusable ingestion framework, not a single-format parser. It separates format-specific parsing from format-agnostic execution. Add a new format by implementing two small traits: Splitter and RecordParser.',
          'rypipe itself does not ship parsers. Those live in separate adapter packages. Install the engine plus the adapters you need. The framework handles parallel scheduling, memory-bounded execution, query pushdown, and a chainable pipeline API.',
        ],
      },
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          'Parsing row-oriented byte streams into columnar formats (Apache Arrow) usually requires writing a full engine per format. Each format gets its own parallel scheduler, memory manager, and execution infrastructure. The result is duplicated effort and inconsistent performance characteristics across formats.',
        ],
      },
      {
        kind: 'prose',
        title: "Why it's hard",
        body: [
          "The difficulty is separating format-specific parsing (two small traits) from format-agnostic execution (parallel scheduling, bounded memory, query pushdown, zero-copy Arrow export) while maintaining throughput at memory bandwidth. The adapter contract test suite verifies that any adapter produces identical output across single-thread, parallel, and bounded execution modes.",
        ],
      },
      {
        kind: 'prose',
        title: 'Measured throughput',
        body: [
          'Throughput depends on the adapter and workload. Latest benchmarks on a Ryzen 7 5800X: crxml reaches 4.23 GB/s full-RAM and 7.63 GB/s in bounded mode with an explicit schema on a 533 MB report; xmlstreamer-ng reaches 2.12 GB/s parallel (8 threads) and 1.36 GB/s bounded parallel on a 128 MiB feed.',
        ],
      },
      {
        kind: 'list',
        title: 'Constraints',
        items: [
          'Bounded memory: cannot load entire files into RAM',
          'Parallel execution must scale linearly with cores',
          'Pipeline stages must fuse into the parse loop (no Python round-trip)',
          'Adapter API must be minimal: two traits, not a full engine',
        ],
      },
      {
        kind: 'cards',
        title: 'Key decisions',
        columns: 2,
        cards: [
          { title: 'Two-trait adapter model', body: 'Adding a new format requires implementing Splitter and RecordParser. The engine handles everything else.' },
          { title: 'Predicate-first evaluation', body: 'Filters push down into the Rust parse loop. Rows that fail are rejected before any Python object is created.' },
          { title: 'Layout prediction via memcmp', body: 'Predicts row structure from byte patterns, skipping column discovery when the schema is known.' },
          { title: 'Zero-copy Arrow export', body: 'Data moves from parse buffers directly into Arrow arrays without intermediate copies.' },
        ],
      },
      {
        kind: 'prose',
        title: 'Origin',
        body: [
          'rypipe was originally developed as the ingestion engine for crxml, a Crystal Reports XML adapter. The engine design, performance characteristics, and API were shaped by production use with crxml. crxml is the reference adapter that proved the model: complex nested schemas, large files, parallel processing, and advanced filtering.',
        ],
      },
      {
        kind: 'list',
        title: 'Tradeoffs',
        items: [
          'Adapters must be written per format (not a universal parser)',
          'Rust core adds build complexity vs. pure Python',
          'Schema must be known upfront for maximum throughput',
        ],
      },
    ],
  },
  {
    id: 'kestrel',
    name: 'Kestrel',
    index: '11',
    category: 'Linux distribution · Desktop systems',
    accent: '#8a7bd8',
    accentLight: '#4b3d99',
    summary:
      'Standalone Arch-based Linux distribution with Hyprland + Quickshell and a kernel-level per-task scheduling bridge.',
    lede: 'One shaped desktop, one kernel, one scheduling vocabulary: the compositor, terminal and apps share a per-task hint consumed by sched_ext.',
    stack: ['Arch Linux', 'Hyprland', 'Quickshell', 'sched_ext', 'Btrfs', 'Shell'],
    links: [
      { label: 'GitHub', href: `${GH}/kestrel-distro/kestrel`, primary: true },
      { label: 'ISO', href: `${GH}/kestrel-distro/iso` },
      { label: 'Kernel', href: `${GH}/kestrel-distro/kernel` },
      { label: 'Docs', href: `${GH}/kestrel-distro/docs` },
    ],
    metrics: [
      { label: 'Base', value: 'ARCH' },
      { label: 'Desktop', value: 'HYPRLAND + QUICKSHELL' },
      { label: 'Install', value: 'ROOTFS COPY' },
      { label: 'Scheduler', value: 'scx_kestrel', tone: 'pass' },
    ],
    facts: ['Arch-based', 'Hyprland + Quickshell', 'sched_ext hint 0–1024', 'MIT'],
    diagram: 'Apps / Hyprland / foot → libkestrel-hint → kestrel-broker cgroups → linux-kestrel → scx_kestrel',
    license: 'MIT',
    meta: {
      title: 'Kestrel | Emiliano G.O.',
      description:
        'Standalone Arch-based Linux distribution with Hyprland, Quickshell and a per-task scheduling bridge from kernel to sched_ext.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          'Most distributions hand the desktop a scheduler and leave it there. The compositor, terminal and applications have no shared vocabulary for latency or throughput, so tuning happens through generic priorities and configuration layered on a generic system.',
          'Kestrel starts from Arch and replaces the parts that decide how the desktop feels: the compositor, shell, terminal, kernel and scheduler are built and shipped as one matched system.',
        ],
      },
      {
        kind: 'prose',
        title: 'What Kestrel is',
        body: [
          'Kestrel is a standalone Arch-based distribution with one shaped desktop: Hyprland, Quickshell, foot and fish. The compositor, shell, terminal, kernel and scheduler are built and shipped as one matched system.',
          'The kernel, linux-kestrel, is built with Clang ThinLTO on x86-64-v3, full preemption, 1000 Hz, sched_ext, DAMON reclaim and NTSYNC. Hyprland, Quickshell and their shared library closure are rebuilt with the same codegen flags, and the terminal is a foot fork that participates in the hint path.',
        ],
      },
      {
        kind: 'cards',
        title: 'The scheduling bridge',
        columns: 2,
        cards: [
          { title: 'Kernel hint', body: 'linux-kestrel appends sched_ext_hint to struct sched_attr; userspace sets 0..1024 with sched_setattr(2) and SCHED_FLAG_KESTREL_HINT (1ULL << 40).' },
          { title: 'Userspace library', body: 'libkestrel-hint and kestrel-hint set and read the hint for the desktop, terminals, browser and background work.' },
          { title: 'Broker', body: 'kestrel-broker places processes in kestrel-desktop, kestrel-term, kestrel-browser and kestrel-background cgroups.' },
          { title: 'Scheduler', body: 'scx_kestrel, an scx_layered fork, reads the hint through scx_bpf_task_hint and applies its baked layer set; scx_loader/scxctl switch schedulers at runtime.' },
        ],
      },
      {
        kind: 'cards',
        title: 'Heavy packages → kernel',
        columns: 3,
        cards: [
          { title: 'Hyprland', body: 'The compositor runs in kestrel-desktop. Frame-critical work carries a latency hint before dispatch, so scx_kestrel can prefer it when the desktop is under load.' },
          { title: 'Quickshell', body: 'The bar, launcher, notifications, OSD and screensaver share the kestrel-desktop class with the compositor; interactive UI stays on the same latency path.' },
          { title: 'Zen browser', body: 'Browser processes run in kestrel-browser. Foreground tabs and input carry the interactive hint; background tabs do not compete for the same budget.' },
          { title: 'foot terminal', body: 'One shared foot --server runs in kestrel-term with per-window clients, so terminal latency is isolated from browser and background work.' },
          { title: 'Background work', body: 'Builds, indexing and agent jobs go to kestrel-background, free to use spare cores without stealing latency from the desktop.' },
          { title: 'Kernel + scheduler', body: 'linux-kestrel exposes the 0..1024 hint through sched_ext; scx_kestrel reads it with scx_bpf_task_hint and combines it with its baked layer set.' },
        ],
      },
      {
        kind: 'prose',
        title: 'Optimization stack',
        body: [
          "Kestrel does not stop at runtime hints. Hyprland and Quickshell are built x86-64-v3 with Clang ThinLTO, and their shared Hyprland library closure is rebuilt with the same flags instead of Arch's generic -O2, so the desktop has one codegen. qt6-base-kestrel adds Wayland explicit sync (linux-drm-syncobj-v1), and linux-kestrel is Clang ThinLTO on x86-64-v3 with full preemption, 1000 Hz, sched_ext, DAMON reclaim and NTSYNC.",
          'The result is one optimization path from the heavy processes (Zen, Hyprland, Quickshell, foot, Obsidian, OBS) through their cgroup and per-task hint into the scheduler and kernel. Each class and each task carries explicit information instead of relying on ambient priority.',
        ],
      },
      {
        kind: 'prose',
        title: 'What is in the box',
        body: [
          'Hyprland manages windows and Quickshell provides the bar, launcher, notifications, OSD, screensaver and theming. foot runs as one shared server in the kestrel-term slice; fish is the login shell. Desktop applications include Neovim, Zen, Obsidian, LibreOffice, Kdenlive and OBS Studio.',
          'A single kestrel CLI covers themes, screenshots, packaging, hardware and system configuration. Updates are rolling Arch, with an automatic Btrfs snapshot before every upgrade and rollback from the boot menu. Agentic tooling is installed through mise.',
        ],
      },
      {
        kind: 'prose',
        title: 'Measuring',
        body: [
          'kestrel-bench runs inside the VM and checks the hint bridge end to end: it verifies set/get, broker and foot placement, runs a 3x scx_bpfland vs scx_kestrel A/B, measures the foot worker matrix, and samples peak PSS for the shipped processes. A change that does not move a metric does not ship.',
        ],
      },
      {
        kind: 'list',
        title: 'Status',
        items: [
          'Live ISO builds and boots the Kestrel kernel with the full desktop and hint bridge',
          'Hint bridge (linux-kestrel + libkestrel-hint + scx_kestrel) implemented and exercised by kestrel-bench',
          'Desktop, foot/fish defaults and themed toolchain in place',
          'Packaging and documentation are still catching up with the implementation',
        ],
      },
      {
        kind: 'ecosystem',
        title: 'Kestrel ecosystem',
        intro: 'The distribution is split across independently versioned repositories that share the same kernel, desktop and packaging contracts.',
        repos: [
          { name: 'iso', role: 'Live image', desc: 'archiso profile, installer and configurator, VM boot helper, signing and release tools.', stack: ['Shell', 'archiso'], href: `${GH}/kestrel-distro/iso` },
          { name: 'kernel', role: 'Kernel', desc: 'linux-kestrel recipe, hint patch, sched_ext integration and the bench harness.', stack: ['Shell', 'sched_ext'], href: `${GH}/kestrel-distro/kernel` },
          { name: 'desktop', role: 'Desktop closure', desc: 'kestrel-desktop metapackage and the matched Hyprland library closure.', stack: ['Shell', 'Hyprland'], href: `${GH}/kestrel-distro/desktop` },
          { name: 'foot', role: 'Terminal', desc: 'foot fork carrying the Kestrel per-task hint in the terminal process tree.', stack: ['C'], href: `${GH}/kestrel-distro/foot` },
          { name: 'hyprland', role: 'Compositor', desc: 'Lean Hyprland source package built x86-64-v3 with ThinLTO.', stack: ['C++'], href: `${GH}/kestrel-distro/hyprland` },
          { name: 'quickshell', role: 'Desktop shell', desc: 'Lean Quickshell source package with the QML intercept fixes.', stack: ['C++', 'QML'], href: `${GH}/kestrel-distro/quickshell` },
          { name: 'scx', role: 'Scheduler', desc: 'scx_kestrel, an scx_layered fork, plus the bake for its layer set.', stack: ['C', 'BPF'], href: `${GH}/kestrel-distro/scx` },
          { name: 'scx-loader', role: 'Scheduler loader', desc: 'Loader fork that knows scx_kestrel, packaged as scx-tools-kestrel.', stack: ['Rust'], href: `${GH}/kestrel-distro/scx-loader` },
          { name: 'qtbase', role: 'Qt base', desc: 'Qt base branch adding Wayland explicit sync (linux-drm-syncobj-v1).', stack: ['C++', 'Qt'], href: `${GH}/kestrel-distro/qtbase` },
          { name: 'packages', role: 'Package overlay', desc: 'Signed pacman [kestrel] overlay published to GitHub Pages.', stack: ['Shell', 'pacman'], href: `${GH}/kestrel-distro/packages` },
          { name: 'docs', role: 'Documentation', desc: 'Architecture, packaging, publishing and maintainer documentation.', stack: ['Markdown'], href: `${GH}/kestrel-distro/docs` },
        ],
      },
    ],
  },
  {
    id: 'postal',
    name: 'postal',
    index: '04',
    category: 'Native desktop · Messaging protocol',
    accent: '#2e9e6b',
    accentLight: '#1f6f4a',
    summary:
      'A standalone native WhatsApp client that speaks the multi-device protocol directly. No webview, no forced history download.',
    lede: 'SQLite is the durable archive. RAM is a bounded window. History sync is a program decision.',
    stack: ['Rust', 'Tauri 2', 'Svelte 5', 'SQLite', 'MIT'],
    links: [
      { label: 'GitHub', href: `${GH}/emiliano-go/postal`, primary: true },
      { label: 'Release v0.1.0', href: `${GH}/emiliano-go/postal/releases/tag/v0.1.0` },
    ],
    metrics: [
      { label: 'Rust tests', value: '352' },
      { label: 'Frontend tests', value: '66' },
      { label: 'Total LOC', value: '~68K' },
      { label: 'Version', value: 'v0.1.0' },
    ],
    diagram: 'Multi-device link → whatsapp-rust → Event loop → StoreWorker → SQLite + RAM window → Tauri → Svelte',
    license: 'MIT',
    meta: {
      title: 'postal | Emiliano G.O.',
      description:
        'Native WhatsApp multi-device client with no webview. Bounded memory, opt-in history sync, durable SQLite archive. 0.3% idle CPU.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          "Wrapping WhatsApp Web forces the client to download and hold the account's entire message history. That is tens of gigabytes on disk, multiple gigabytes of RAM, and performance that degrades as the history grows. The protocol itself does not require any of it.",
        ],
      },
      {
        kind: 'cards',
        title: 'Key decisions',
        columns: 2,
        cards: [
          { title: 'Native protocol, no webview', body: 'Built on whatsapp-rust pinned to a git revision newer than 0.7.0 for history-sync admission. The only webview renders Postal\'s own UI.' },
          { title: 'History sync is opt-in', body: 'Pairing pulls the recent window only. Full history (up to 10,000 days, phone permitting) is requested explicitly from Settings.' },
          { title: 'Disk and RAM decoupled', body: 'SQLite is a durable archive; the open conversation keeps a bounded message window (500 default, 50-2,000). Eviction never deletes disk rows.' },
          { title: 'Serialized store access', body: 'A StoreWorker gate holds an exclusive lease through each savepoint, so live and history batches never race while background work waits.' },
        ],
      },
      {
        kind: 'panel',
        title: 'Measured against a webview client',
        lead: 'Same account, same machine.',
        label: 'Comparison',
        items: [
          { key: 'Idle CPU', val: '~0.3% vs ~200%', tone: 'pass' },
          { key: 'Memory', val: '~600 MB vs 2.2 → 23 GB', tone: 'pass' },
          { key: 'History at pairing', val: 'none vs ~20 GB', tone: 'pass' },
          { key: 'Session DB compacted', val: '97 MB → 5.8 MB', tone: 'pass' },
          { key: 'Rows preserved', val: '399,620', tone: 'neutral' },
        ],
      },
      {
        kind: 'list',
        title: 'Tradeoffs',
        items: [
          'Databases, media, and backups are plaintext on disk; encryption is open work',
          'Releases are on hold until they cover every supported platform; installers build from master',
          'No calls, tray icon, status updates, communities, or album support yet',
        ],
      },
    ],
  },
  {
    id: 'neurafly',
    name: 'neurafly',
    index: '05',
    category: 'Terminal audio · Computational neuroscience',
    accent: '#d45f86',
    accentLight: '#a33458',
    summary:
      'Real audio in, real neurons firing, real time. A terminal visualizer wired to the actual FlyWire whole-brain connectome.',
    lede: '138,333 leaky integrate-and-fire neurons and 2,052,622 weighted synapses rendered as a living disk in braille.',
    stack: ['Rust', 'TUI / Braille', 'Audio DSP', 'FlyWire Connectome', 'MIT'],
    links: [
      { label: 'GitHub', href: `${GH}/emiliano-go/neurafly`, primary: true },
      { label: 'crates.io', href: 'https://crates.io/crates/neurafly' },
      { label: 'AUR', href: 'https://aur.archlinux.org/packages/neurafly' },
    ],
    metrics: [
      { label: 'Neurons', value: '138,333' },
      { label: 'Synapses', value: '2,052,622' },
      { label: 'Simulation tick', value: '100 Hz' },
      { label: 'Connectome data', value: '18 MB' },
    ],
    diagram: 'Audio → 2048-pt FFT → 24 log bands → LIF network (FlyWire v783) → Braille phosphor canvas',
    license: 'MIT',
    meta: {
      title: 'neurafly | Emiliano G.O.',
      description:
        'Terminal audio visualizer driven by the real FlyWire connectome: 138,333 spiking neurons and 2,052,622 synapses, rendered in braille.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          'Audio visualizers synthesize shapes from frequency data. The motion looks organic but carries no structure: bars, particles, and waveforms driven by the same FFT numbers. neurafly instead couples live system audio to a real biological wiring diagram, so activity propagates, reverberates, and decays through genuine fly-brain topology.',
        ],
      },
      {
        kind: 'cards',
        title: 'Key decisions',
        columns: 2,
        cards: [
          { title: 'Real connectome, not a model', body: 'Wiring comes from FlyWire release v783: 138,333 neurons and 2,052,622 weighted synapses. Inhibitory sign follows presynaptic neurotransmitter probabilities.' },
          { title: 'cava-style band processing', body: 'A 2048-point FFT folds into 24 logarithmic bands, each judged against its own rolling spectral floor, with equal-loudness EQ, auto-gain, and a peakiness gate.' },
          { title: 'Fixed-tick pipeline', body: 'Four modules (audio, sim, figure, canvas) share a fixed 100 Hz simulation tick, so each band injects current into its own neuron subset deterministically.' },
          { title: 'Terminal-native rendering', body: 'A float phosphor buffer at 2x4 sub-cell resolution folds into braille, and colors come exclusively from ANSI 30-37 so the disk adopts the user theme.' },
        ],
      },
      {
        kind: 'list',
        title: 'Tradeoffs',
        items: [
          'Linux only (PipeWire/PulseAudio) and a terminal with Unicode braille support',
          'The 18 MB connectome is excluded from the published crate, which falls back to a synthetic network',
          'Regenerating the network needs the Zenodo feather file and the Python preprocessing tooling',
        ],
      },
    ],
  },
  {
    id: 'easeo',
    name: 'easeo',
    index: '06',
    category: 'SEO metadata · Multi-language SDK',
    accent: '#a06ad9',
    accentLight: '#6b2fa0',
    summary:
      'A deterministic SEO metadata generator: one Rust core with Python, Node.js, and Rust APIs.',
    lede: 'Takes an entity, route, and site config, and returns canonical URL, title, description, robots, Open Graph, Twitter Cards, and JSON-LD.',
    stack: ['Rust core', 'Python', 'Node.js', 'JSON-LD', 'MIT'],
    links: [
      { label: 'GitHub', href: `${GH}/emiliano-go/easeo`, primary: true },
      { label: 'Docs', href: 'https://easeo.emiliano-go.com/' },
      { label: 'PyPI', href: 'https://pypi.org/project/easeo/' },
      { label: 'npm', href: 'https://www.npmjs.com/package/@easeo/core' },
      { label: 'crates.io', href: 'https://crates.io/crates/easeo-core' },
    ],
    metrics: [
      { label: 'Tests', value: '310' },
      { label: 'Entity types', value: '11' },
      { label: 'Integrations', value: '10' },
      { label: 'Docs pages', value: '64' },
    ],
    diagram: 'Entity + route + config → URL normalization → Fallback chains → Meta / OG / Twitter / JSON-LD → SHA-256 contract',
    license: 'MIT',
    meta: {
      title: 'easeo | Emiliano G.O.',
      description:
        'Deterministic SEO metadata from one Rust core with Python and Node.js bindings. Byte-for-byte identical output across languages.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          'SEO libraries tend to mix metadata generation with scoring, keyword analysis, and content rewriting. The output varies run to run, which makes it hard to snapshot-test, hash, cache, or diff. Platforms that render in more than one language end up with subtly different payloads per stack.',
        ],
      },
      {
        kind: 'cards',
        title: 'Key decisions',
        columns: 2,
        cards: [
          { title: 'One core, three bindings', body: 'All logic lives in easeo-core. Python and Node.js wrap the same engine, and the cross-language conformance suite asserts byte-for-byte identical output.' },
          { title: 'Pure determinism', body: 'No timestamps, randomness, environment reads, or hidden I/O. The same inputs always produce the same payload, so output can be hashed and committed.' },
          { title: 'SEO contracts for CI', body: 'build_seo_contract emits machine-readable SEO intent that can be committed and validated as code, catching metadata regressions in review.' },
          { title: 'Scoped extension registries', body: 'HookRegistry and SchemaRegistry add post-processing and custom JSON-LD without touching the core, scoped to a config rather than global.' },
        ],
      },
      {
        kind: 'list',
        title: 'Tradeoffs',
        items: [
          'Not a framework: adapters marshal inputs, they do not own application lifecycle',
          'Not a scoring, keyword-analysis, crawling, or content-rewriting tool',
          'Renders a head snippet, not a full document; alpha release status',
        ],
      },
    ],
  },
  {
    id: 'clickvault',
    name: 'ClickVault',
    index: '07',
    category: 'Security · Vault plugin',
    accent: '#f5c81b',
    accentLight: '#785f00',
    summary:
      'HashiCorp Vault database secrets engine plugin for ClickHouse. Dynamic credentials, password rotation, cluster-aware DDL.',
    lede: 'Creates short-lived ClickHouse users on demand and rotates passwords on a schedule.',
    stack: ['Go 1.26+', 'Vault SDK', 'ClickHouse', 'Database secrets'],
    links: [{ label: 'GitHub', href: `${GH}/emiliano-go/clickvault`, primary: true }],
    metrics: [
      { label: 'Source lines', value: '1,017' },
      { label: 'Test lines', value: '979' },
      { label: 'Codecov', value: '85.4%', tone: 'pass' },
      { label: 'CI enforced', value: 'YES', tone: 'pass' },
    ],
    diagram: 'Vault API → ClickVault plugin → Dynamic / Static / Rotate → ClickHouse cluster (ON CLUSTER DDL)',
    license: 'MIT',
    meta: {
      title: 'ClickVault | Emiliano G.O.',
      description:
        'HashiCorp Vault database secrets engine plugin for ClickHouse. Dynamic credentials, password rotation, cluster-aware DDL.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          "ClickHouse lacks native dynamic credential support in Vault's database secrets engine. Teams managing ClickHouse clusters need short-lived credentials and automated password rotation without manual intervention.",
        ],
      },
      {
        kind: 'prose',
        title: "Why it's hard",
        body: [
          "ClickHouse clusters use distributed DDL (ON CLUSTER) which most Vault plugins don't handle. Dynamic user creation must be atomic: if grants fail, the partially-created user must be cleaned up. Password rotation must work across replicated and non-replicated engines. The plugin must implement Vault's dbplugin.Database interface correctly while handling ClickHouse-specific syntax differences.",
        ],
      },
      {
        kind: 'panel',
        title: 'Security model',
        label: 'Invariants',
        items: [
          { key: 'SQL injection', val: 'BLOCKED', tone: 'pass' },
          { key: 'Concurrent access', val: 'MUTEX', tone: 'pass' },
          { key: 'Partial creation', val: 'CLEANUP', tone: 'pass' },
          { key: 'Username collision', val: 'GUARDED', tone: 'pass' },
          { key: 'TLS support', val: 'YES', tone: 'pass' },
        ],
      },
      {
        kind: 'cards',
        title: 'Key decisions',
        columns: 3,
        cards: [
          { title: 'Cluster-aware DDL', body: 'ON CLUSTER insertion ensures DDL propagates across the cluster. Handles both Replicated and non-Replicated engine tables.' },
          { title: 'Privilege verification', body: 'Connection verification checks that the service account has the required privileges before accepting configuration.' },
          { title: 'Cleanup on failure', body: 'If user creation partially succeeds (for example grants fail), the plugin removes the partially-created user to avoid orphaned accounts.' },
        ],
      },
    ],
  },
  {
    id: 'dsig',
    name: 'dsig',
    index: '08',
    category: 'Security · Cryptography',
    accent: '#7387e0',
    accentLight: '#4d5ec0',
    summary:
      'GPG message signing for Vencord / Vesktop. Authorship attestation for every message.',
    lede: 'Signs Discord messages with your GPG key. Verifies authorship, prevents impersonation. Compact and invisible footer formats.',
    stack: ['TypeScript', 'GPG / OpenPGP', 'Vencord', 'Discord'],
    links: [{ label: 'GitHub', href: `${GH}/emiliano-go/dsig`, primary: true }],
    metrics: [
      { label: 'Tests', value: '142' },
      { label: 'Test lines', value: '1,817' },
      { label: 'Source lines', value: '3,782' },
      { label: 'Footer size', value: '113 chars' },
    ],
    diagram: 'Message → Canonicalize (NFC, CRLF→LF) → OpenPGP signature → Invisible encoding → Footer',
    license: 'GPL-3.0',
    meta: {
      title: 'dsig | Emiliano G.O.',
      description:
        'GPG message signing for Vencord / Vesktop. Authorship attestation with compact or invisible encoding.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          'Discord has no native message signing. Anyone can impersonate anyone by copying their display name and avatar. There is no cryptographic way to verify that a message was actually written by the claimed author.',
        ],
      },
      {
        kind: 'panel',
        title: 'Threat model',
        label: 'Invariants',
        items: [
          { key: 'Message tampering', val: 'DETECTED', tone: 'pass' },
          { key: 'Author impersonation', val: 'BLOCKED', tone: 'pass' },
          { key: 'Replay attacks', val: 'NONCE', tone: 'pass' },
          { key: 'Key compromise', val: 'OUT OF SCOPE', tone: 'fail' },
          { key: 'gpg-agent isolation', val: 'THROWAWAY GNUPGHOME', tone: 'pass' },
        ],
      },
      {
        kind: 'cards',
        title: 'Key decisions',
        columns: 2,
        cards: [
          { title: 'Invisible encoding', body: "Signatures are encoded as Unicode invisible characters (zero-width spaces, non-joiners) appended to the message, tested against Discord's actual client behavior." },
          { title: 'Content canonicalization', body: 'NFC normalization, CRLF to LF conversion, whitespace collapsing. Prevents trivial bypasses via Unicode normalization or line-ending differences.' },
          { title: 'gpg-agent isolation', body: 'Verification uses a throwaway GNUPGHOME to prevent verification from accessing the signing key. Each verify operation runs in isolation.' },
          { title: 'Desktop-only by design', body: 'Web browsers cannot access gpg-agent. The plugin is desktop-only (Vencord/Vesktop) because the security model requires local key access.' },
        ],
      },
      {
        kind: 'list',
        title: 'Tradeoffs',
        items: [
          'Desktop-only (web cannot access gpg-agent)',
          'Requires GPG key pair setup',
          'Invisible encoding may be stripped by some clients',
          'Key compromise is out of scope (standard GPG limitation)',
        ],
      },
    ],
  },
  {
    id: 'xmlstreamer-ng',
    name: 'xmlstreamer-ng',
    index: '09',
    category: 'Data · XML streaming',
    accent: '#3f9e8a',
    accentLight: '#26695c',
    summary:
      'Fault-isolating XML feed streamer built on rypipe, adapted from carlosplanchon/xmlstreamer. Bounded memory, conservative recovery, explicit partial failures.',
    lede: 'A rypipe-based adaptation of carlosplanchon/xmlstreamer that streams huge or damaged XML feeds into Python records without hiding corrupted items.',
    stack: ['Python 3.11+', 'Rust (rypipe-core)', 'Apache Arrow', 'PyO3'],
    links: [
      { label: 'GitHub', href: `${GH}/emiliano-go/xmlstreamer-ng`, primary: true },
      { label: 'PyPI', href: 'https://pypi.org/project/xmlstreamer-ng/' },
      { label: 'rypipe', href: `${GH}/emiliano-go/rypipe` },
    ],
    metrics: [
      { label: 'Parallel throughput', value: '15.8M rows/s', tone: 'pass' },
      { label: 'Throughput', value: '2.12 GB/s', tone: 'pass' },
      { label: 'Bounded parallel', value: '10.2M rows/s' },
      { label: 'Peak RSS (bounded)', value: '202 MB' },
    ],
    facts: ['15.8M rows/s', '2.12 GB/s', '10.2M rows/s bounded', 'PyPI'],
    diagram: 'HTTP / GZIP / file → byte tokenizer → per-item Rust parser → flat records or Arrow batches',
    license: 'MIT',
    meta: {
      title: 'xmlstreamer-ng | Emiliano G.O.',
      description:
        'Fault-isolating XML streamer built on rypipe, adapted from carlosplanchon/xmlstreamer. Bounded memory, conservative recovery.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          'Large XML feeds from remote systems are often malformed, mis-encoded, or interrupted in transit. A strict parser loses the whole document to one broken record; an aggressive recovery parser can silently rewrite damaged markup into records that never existed.',
          'xmlstreamer-ng is built for the space between those two behaviours: deliver every intact item before and after localized corruption, never invent records, and report what was dropped instead of presenting incomplete processing as success.',
        ],
      },
      {
        kind: 'prose',
        title: 'Origin',
        body: [
          'xmlstreamer-ng is based on [carlosplanchon/xmlstreamer](https://github.com/carlosplanchon/xmlstreamer) by Carlos A. Planchón (MIT), and keeps its streaming, item-based approach to large or malformed XML feeds. The parsing engine is built on [rypipe](https://github.com/emiliano-go/rypipe) (rypipe-core), which provides the byte tokenizer, splitter, per-item parsing and Arrow execution.',
        ],
      },
      {
        kind: 'prose',
        title: "Why it's hard",
        body: [
          'Recovery has to be conservative without becoming useless. Separator tags must be recognized inside comments, CDATA, processing instructions and DOCTYPE while never being invented by them. Encoding detection must win over a lying XML declaration without corrupting valid UTF-8. Bounded memory must hold while items, markup sections and descriptors can each be larger than the read buffer.',
          'The columnar path adds a second contract: the same Rust engine has to produce Arrow batches under projection, filtering and parallel execution, with malformed-item drop semantics identical to the streaming path.',
        ],
      },
      {
        kind: 'prose',
        title: 'Performance',
        body: [
          'Latest benchmarks on a Ryzen 7 5800X over a 128 MiB feed with 951,898 items: the parallel XmlSource (8 threads) reaches 15.8M rows/s and 2.12 GB/s; bounded parallel streaming reaches 10.2M rows/s and 1.36 GB/s at 202 MB peak RSS.',
        ],
      },
      {
        kind: 'table',
        title: 'Benchmark results',
        columns: ['Engine', 'Mode', 'items/s', 'MB/s', 'Peak RSS'],
        rows: [
          ['xmlstreamer-ng', 'XmlSource parallel (8 threads)', '15.8M', '2122.6', '283 MB'],
          ['xmlstreamer-ng', 'Bounded parallel (8 threads)', '10.2M', '1364.7', '202 MB'],
          ['xmlstreamer-ng', 'XmlSource columnar', '4.6M', '621.6', '297 MB'],
          ['quick-xml (native)', 'parse + count only', '3.2M', '433.0', '14 MB'],
          ['lxml iterparse', 'per-item dicts', '304k', '40.8', '26 MB'],
          ['xmlstreamer (original)', 'per-item dicts', '103k', '13.8', '34 MB'],
        ],
        note: '128 MiB synthetic feed, 951,898 items, median of 5 runs on a Ryzen 7 5800X. Native rows parse and count only; they do not build records.',
      },
      {
        kind: 'cards',
        title: 'Key decisions',
        columns: 3,
        cards: [
          { title: 'Two APIs, one engine', body: 'StreamInterpreter keeps the per-item recovery contract; XmlSource exposes Arrow projection, filtering and parallel batches from the same Rust parser.' },
          { title: 'Explicit failure accounting', body: 'Malformed items are logged and counted, never silently repaired. The closing stats distinguish feed damage from items removed by the caller\'s filter.' },
          { title: 'Conservative recovery', body: 'Corruption contained inside an item drops that item only. Sections that never close are a documented choice via Sections(on_limit=...), announced with a warning.' },
        ],
      },
      {
        kind: 'panel',
        title: 'Guarantees',
        label: 'Contract',
        items: [
          { key: 'Damaged item', val: 'DROPPED + WARNED', tone: 'pass' },
          { key: 'Valid neighbours', val: 'DELIVERED', tone: 'pass' },
          { key: 'Invented records', val: 'NEVER', tone: 'pass' },
          { key: 'Memory', val: 'BOUNDED', tone: 'pass' },
          { key: 'Encoding lies', val: 'CONTENT WINS', tone: 'pass' },
        ],
      },
      {
        kind: 'list',
        title: 'Tradeoffs',
        items: [
          'Separator tag must not nest inside itself',
          'Items are built from element text, not XML attributes',
          'Untrusted, well-formed input may be better served by lxml.iterparse',
          'Per-item API is slower than the columnar/parallel adapter',
        ],
      },
    ],
  },
  {
    id: 'eclipse',
    name: 'eclipse',
    index: '10',
    category: 'ML · Distillation research',
    accent: '#d98a4a',
    accentLight: '#8f4d1b',
    summary:
      'Byte-level distillation rig for Ornith 1.5 9B. Exact EOT targets, a 48M byte student, and a reproducible feasibility study.',
    lede: 'Turns a 9B teacher’s token distribution into exact byte / End-Of-Token targets, then measures what a small byte student actually learns.',
    stack: ['Python', 'PyTorch', 'llama.cpp', 'CUDA'],
    links: [{ label: 'GitHub', href: `${GH}/emiliano-go/eclipse`, primary: true }],
    metrics: [
      { label: 'Held-out BPB', value: '0.818' },
      { label: 'Teacher KL', value: '0.317' },
      { label: 'Observed top-1', value: '0.865' },
      { label: 'Byte student', value: '48M' },
    ],
    facts: ['BPB 0.818', 'KL 0.317', 'top-1 0.865', '26.2M positions'],
    diagram: 'Teacher logits (llama.cpp) → byte trie → exact EOT targets → 48M byte student → BPB / KL eval',
    license: 'MIT',
    meta: {
      title: 'eclipse | Emiliano G.O.',
      description:
        'Byte-level distillation rig for Ornith 1.5 9B: exact End-Of-Token targets, a 48M byte student, and a controlled feasibility study.',
    },
    sections: [
      {
        kind: 'prose',
        title: 'Problem',
        body: [
          'Token-level distillation assumes the student shares the teacher’s tokenizer. A byte-level student does not, so the teacher’s next-token distribution has to be converted into a next-byte distribution with a well-defined terminal state.',
          'This project tests whether that conversion can be exact, whether a small byte student can learn from it, and whether End-Of-Token targets beat Marginalize-It and plain byte cross-entropy in a controlled comparison.',
        ],
      },
      {
        kind: 'prose',
        title: 'Setup',
        body: [
          'The teacher is Ornith-1.5-9B, a Qwen3.5 hybrid 9B model, quantized to Q5_K_M for bulk extraction and Q8_0 for the precision audit. The student is a ~48M dense byte Transformer with a 1,024-byte context and a 260-symbol vocabulary. The corpus is ~20 MB of NFC-normalized text and code: 6,592,718 training tokens and 136,916 validation tokens. Training runs on a single RTX 3070 8 GB.',
        ],
      },
      {
        kind: 'prose',
        title: 'Method',
        body: [
          'Teacher logits stream from llama.cpp and are converted against a byte-trie of the 248k-token vocabulary in DFS order, so each prefix subtree is a contiguous range. Byte distributions come from child subtree masses; the terminal node receives p(token) / mass(prefix) on the EOT symbol.',
          'Marginalize-It is derived from the same 260-dimensional row by zeroing EOT and renormalizing. Raw logits are never persisted; targets are stored as fp16 shards with explicit next-symbol labels.',
        ],
      },
      {
        kind: 'prose',
        title: 'Target conversion',
        body: [
          'A float32 cumulative sum in the Python converter could misallocate rare-prefix targets (up to 0.789 against a float64 reference). The C++ converter is the reference path and matches float64 to 1.3e-7.',
          'The 1M extraction produced 4,014,129 positions from 1,000,497 teacher tokens: 2.087 GB, 431 tokens/s, 38.7 minutes. Five positions underflow in fp16; the shard otherwise validates with exact row sums and counts.',
        ],
      },
      {
        kind: 'table',
        title: 'Objective comparison',
        columns: ['Objective', 'Val BPB', 'EOT-incl BPB', 'Teacher KL', 'Top-1'],
        rows: [
          ['EOT', '0.860', '0.921', '0.348', '0.862'],
          ['Marginalize-It', '0.771', '6.418', '0.404', '0.637'],
          ['Byte CE', '0.872', '0.937', '0.488', '0.865'],
        ],
        note: '1M tokens, 2,000 steps, 300,653 validation bytes. Marginalize-It wins content-only BPB by discarding EOT mass, which makes it undeployable.',
      },
      {
        kind: 'table',
        title: 'Held-out documents',
        columns: ['Objective', 'BPB', 'EOT-incl BPB', 'Teacher KL', 'Top-1', 'Greedy prefix'],
        rows: [
          ['EOT', '1.362', '1.473', '0.617', '0.790', '2.5'],
          ['Marginalize-It', '1.228', '6.562', '3.287', '0.583', '2.9'],
          ['Byte CE', '1.483', '1.615', '0.826', '0.787', '14.2'],
        ],
        note: '36 unseen documents, 420,313 bytes scored. The same documents were used for objective selection, so there is no untouched test split.',
      },
      {
        kind: 'table',
        title: 'Full-data training',
        columns: ['Metric', '1M positions', 'Full 26.2M positions'],
        rows: [
          ['BPB', '1.276', '0.818'],
          ['EOT-inclusive BPB', '1.378', '0.879'],
          ['Teacher KL', '0.575', '0.317'],
          ['Observed next-symbol top-1', '0.801', '0.865'],
          ['Valid UTF-8', '0.90', '1.00'],
          ['Greedy prefix (bytes)', '6.35', '7.25'],
        ],
        note: 'Full run: 10,000 steps, ~3.1 epochs. The validation curve is flat after ~8k steps; documentation reaches BPB 0.764, Python 1.143.',
      },
      {
        kind: 'cards',
        title: 'What it proves',
        columns: 2,
        cards: [
          { title: 'The pipeline works end to end', body: 'A 48M byte student learns the 9B teacher’s next-byte distribution on unseen documents: held-out BPB 0.818, teacher KL 0.317, observed next-symbol top-1 0.865, valid UTF-8 1.00.' },
          { title: 'Objective choice matters', body: 'EOT + 10% CE beat pure EOT and pure byte CE in the controlled 1M comparison. EOT is the only method with usable token boundaries; MI wins content BPB by discarding EOT mass.' },
        ],
      },
      {
        kind: 'list',
        title: 'Limits',
        items: [
          'Not a usable language model: free-running generation still compounds error (7.25-byte greedy match)',
          'No untouched test split; the 36 validation documents were also used for objective selection',
          'Teacher context (4,096 tokens) exceeds the student’s 1,024-symbol window, and windows can cross document boundaries',
          'Validated on a single RTX 3070 8 GB; scale is the dominant lever',
          'The result proves the pipeline, not the model',
        ],
      },
      {
        kind: 'prose',
        title: 'Next work',
        body: [
          'Next: a 24 GB GPU path with a 100–300M student and on-the-fly targets, a generation-focused objective, and a second seed or token-student control. The current result is a feasibility study, not a trained product.',
        ],
      },
    ],
  },
];

export function getProject(id: string, lang = 'en'): Project {
  const project = localized[lang]?.[id] ?? projects.find((p) => p.id === id);
  if (!project) throw new Error(`Unknown project: ${id}`);
  return project;
}

export function getProjects(lang = 'en'): Project[] {
  return projects.map((project) => getProject(project.id, lang));
}

export function neighbours(id: string): { prev: Project; next: Project } {
  const index = projects.findIndex((p) => p.id === id);
  return {
    prev: projects[(index - 1 + projects.length) % projects.length],
    next: projects[(index + 1) % projects.length],
  };
}

export function sectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
