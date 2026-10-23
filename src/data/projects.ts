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
  diagram: string;
  license: string;
  sections: Section[];
  meta: {
    title: string;
    description: string;
  };
}

const GH = 'https://github.com';

export const projects: Project[] = [
  {
    id: 'dbwarden',
    name: 'DBWarden',
    index: '01',
    category: 'Database infrastructure',
    accent: '#b39d6a',
    accentLight: '#7a6a3a',
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
      { label: 'CLI commands', value: '14' },
      { label: 'Official plugins', value: '7' },
      { label: 'Release harness', value: 'FULL', tone: 'pass' },
    ],
    diagram: 'Models → IR → Diff → SQL → Verification',
    license: 'MIT',
    meta: {
      title: 'DBWarden | Emiliano G.O.',
      description:
        'Declarative schema compiler for SQLAlchemy. Models → IR → Diff → SQL → Verification. 5 backends, 7 plugins, release-certification harness.',
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
    accentLight: '#0072a8',
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
      { label: 'Release', value: 'v0.22.0' },
    ],
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
      { label: 'Throughput', value: '4.2 GB/s' },
      { label: 'Documentation', value: '15.9K lines' },
      { label: 'Published', value: 'PyPI + crates.io', tone: 'pass' },
    ],
    diagram: 'Format Adapter (Splitter + RecordParser) → Parallel Engine → Fused Plan → Arrow',
    license: 'MIT',
    meta: {
      title: 'rypipe | Emiliano G.O.',
      description:
        'Reusable ingestion framework. Rust core, Python bindings. Add a new format by implementing two traits. PyPI + crates.io, 4.2 GB/s parallel.',
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
    accentLight: '#8a6d00',
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
];

export function getProject(id: string): Project {
  const project = projects.find((p) => p.id === id);
  if (!project) throw new Error(`Unknown project: ${id}`);
  return project;
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
