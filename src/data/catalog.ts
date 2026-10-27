import type { Lang } from '../i18n';

export interface CatalogLink {
  label: string;
  href: string;
}

export interface CatalogEntry {
  id: string;
  name: string;
  desc: Record<Lang, string>;
  stack: string[];
  links: CatalogLink[];
}

export const secondary: CatalogEntry[] = [
  {
    id: 'crxml',
    name: 'crxml',
    desc: {
      en: 'Crystal Reports XML parser built on the rypipe engine. 184 Python tests + 63 Rust tests, differential testing, bounded memory.',
      es: 'Parser XML de Crystal Reports construido sobre el motor rypipe. 184 tests de Python + 63 de Rust, pruebas diferenciales y memoria acotada.',
      fr: 'Parseur XML Crystal Reports construit sur le moteur rypipe. 184 tests Python + 63 tests Rust, tests différentiels et mémoire bornée.',
    },
    stack: ['Rust', 'Python', 'XML', 'Arrow'],
    links: [
      { label: 'GitHub', href: 'https://github.com/emiliano-go/crxml' },
      { label: 'PyPI', href: 'https://pypi.org/project/crxml/' },
    ],
  },
  {
    id: 'schemap',
    name: 'schemap',
    desc: {
      en: 'Automatic Pydantic v2 schemas from SQLAlchemy 2.0 ORM models. 149 tests, thorough edge-case coverage.',
      es: 'Esquemas Pydantic v2 automáticos a partir de modelos ORM de SQLAlchemy 2.0. 149 tests y cobertura exhaustiva de casos límite.',
      fr: 'Schémas Pydantic v2 automatiques à partir des modèles ORM SQLAlchemy 2.0. 149 tests et couverture exhaustive des cas limites.',
    },
    stack: ['Python', 'Pydantic', 'SQLAlchemy'],
    links: [
      { label: 'GitHub', href: 'https://github.com/emiliano-go/schemap' },
      { label: 'PyPI', href: 'https://pypi.org/project/schemap/' },
    ],
  },
  {
    id: 'detrack',
    name: 'detrack',
    desc: {
      en: 'Strip tracking parameters from URLs. 345 patterns, zero dependencies, 126 tests.',
      es: 'Elimina parámetros de seguimiento de URLs. 345 patrones, cero dependencias, 126 tests.',
      fr: 'Supprime les paramètres de suivi des URL. 345 motifs, zéro dépendance, 126 tests.',
    },
    stack: ['Python'],
    links: [
      { label: 'GitHub', href: 'https://github.com/emiliano-go/detrack' },
      { label: 'PyPI', href: 'https://pypi.org/project/detrack/' },
    ],
  },
  {
    id: 'dbwarden-harness',
    name: 'dbwarden-harness',
    desc: {
      en: 'Release-certification harness across 5 databases. 189 tests, 12 suites, MCP server.',
      es: 'Arnés de certificación de releases sobre 5 bases de datos. 189 tests, 12 suites, servidor MCP.',
      fr: 'Harnais de certification des releases sur 5 bases de données. 189 tests, 12 suites, serveur MCP.',
    },
    stack: ['Python', 'Docker', 'Testcontainers'],
    links: [{ label: 'GitHub', href: 'https://github.com/dbwarden-org/dbwarden-harness' }],
  },
  {
    id: 'vigil',
    name: 'vigil',
    desc: {
      en: 'Self-hosted GitHub activity tracker. Syncs every commit into ClickHouse, serves streaks and breakdowns over a REST API.',
      es: 'Rastreador de actividad de GitHub autoalojado. Sincroniza cada commit en ClickHouse y expone rachas y desgloses por API REST.',
      fr: "Suivi d'activité GitHub auto-hébergé. Synchronise chaque commit dans ClickHouse et expose séries et répartitions via une API REST.",
    },
    stack: ['Python', 'FastAPI', 'ClickHouse', 'Prefect'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/vigil' }],
  },
  {
    id: 'mapcreator',
    name: 'mapcreator',
    desc: {
      en: 'Browser-based multi-floor building map editor with A* pathfinding and JSON export. React 19 + Canvas, live demo.',
      es: 'Editor de mapas de edificios de varias plantas en el navegador, con búsqueda de rutas A* y exportación JSON. React 19 + Canvas, demo en vivo.',
      fr: 'Éditeur de plans de bâtiments multi-étages dans le navigateur, avec recherche de chemins A* et export JSON. React 19 + Canvas, démo en ligne.',
    },
    stack: ['TypeScript', 'React', 'Canvas', 'A*'],
    links: [
      { label: 'GitHub', href: 'https://github.com/emiliano-go/mapcreator' },
      { label: 'Demo', href: 'https://mapcreator.emiliano-go.com' },
    ],
  },
  {
    id: 'acrresolv',
    name: 'acrresolv',
    desc: {
      en: 'Hybrid acronym resolver: lookup + rules + T5-small fallback. 95.5% accuracy on unseen data, <1 ms rules path.',
      es: 'Resolvedor híbrido de acrónimos: búsqueda + reglas + fallback T5-small. 95,5 % de precisión en datos no vistos, ruta de reglas <1 ms.',
      fr: "Résolveur d'acronymes hybride : lookup + règles + repli T5-small. 95,5 % de précision sur des données inédites, chemin de règles <1 ms.",
    },
    stack: ['Python', 'T5-small', 'NLP'],
    links: [
      { label: 'GitHub', href: 'https://github.com/emiliano-go/acrresolv' },
      { label: 'PyPI', href: 'https://pypi.org/project/acrresolv/' },
    ],
  },
  {
    id: 'interferon',
    name: 'interferon',
    desc: {
      en: 'Docker sidecar watcher + Python SDK: container lifecycle events become typed immune signals over HTTP SSE.',
      es: 'Sidecar observador de Docker + SDK de Python: eventos de ciclo de vida de contenedores se convierten en señales inmunes tipadas por HTTP SSE.',
      fr: 'Sidecar observateur Docker + SDK Python : les événements de cycle de vie des conteneurs deviennent des signaux immunitaires typés via HTTP SSE.',
    },
    stack: ['Python', 'Docker', 'SSE'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/interferon' }],
  },
  {
    id: 'tagurl',
    name: 'tagurl',
    desc: {
      en: 'Natural-language query to ranked semantic tags and an SEO URL path. Design spec, implementation in progress.',
      es: 'Consulta en lenguaje natural a etiquetas semánticas rankeadas y una ruta URL SEO. Especificación de diseño, implementación en curso.',
      fr: 'Requête en langage naturel vers des tags sémantiques classés et un chemin URL SEO. Spécification de conception, implémentation en cours.',
    },
    stack: ['Python', 'NLP', 'SEO'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/tagurl' }],
  },
  {
    id: 'lambda-compiler',
    name: 'lambda-compiler',
    desc: {
      en: 'Compile Python lambdas into declarative filter specs via CPython bytecode analysis. Extracted from rypipe.',
      es: 'Compila lambdas de Python en especificaciones de filtro declarativas mediante análisis de bytecode de CPython. Extraído de rypipe.',
      fr: "Compile des lambdas Python en spécifications de filtre déclaratives via l'analyse du bytecode CPython. Extrait de rypipe.",
    },
    stack: ['Python', 'Bytecode'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/lambda-compiler' }],
  },
  {
    id: 'carpricepredictor',
    name: 'carpricepredictor',
    desc: {
      en: 'Linear-regression car price predictor: modular pipeline, FastAPI service, and browser front end, all containerized.',
      es: 'Predictor de precios de autos con regresión lineal: pipeline modular, servicio FastAPI y frontend web, todo en contenedores.',
      fr: 'Prédicteur de prix de voitures par régression linéaire : pipeline modulaire, service FastAPI et frontend web, entièrement conteneurisé.',
    },
    stack: ['Python', 'scikit-learn', 'FastAPI', 'Docker'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/carpricepredictor' }],
  },
  {
    id: 'autoimmune-disorder-prediction',
    name: 'autoimmune-disorder-prediction',
    desc: {
      en: 'ML exploration of the All Autoimmune Disorder 10k dataset: reproducible ingestion/cleaning pipeline plus EDA notebooks.',
      es: 'Exploración de ML del dataset All Autoimmune Disorder 10k: pipeline reproducible de ingesta/limpieza y notebooks de EDA.',
      fr: "Exploration ML du jeu de données All Autoimmune Disorder 10k : pipeline reproductible d'ingestion/nettoyage et notebooks EDA.",
    },
    stack: ['Python', 'scikit-learn', 'Jupyter', 'pandas'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/autoimmune-disorder-prediction' }],
  },
  {
    id: 'portable-oss',
    name: 'portable-oss',
    desc: {
      en: 'Config-driven dashboard for open source projects. One TOML file drives live GitHub and package stats, themes and generated project pages.',
      es: 'Panel configurable para proyectos open source. Un archivo TOML impulsa estadísticas en vivo de GitHub y paquetes, temas y páginas generadas.',
      fr: 'Tableau de bord configurable pour projets open source. Un fichier TOML pilote les statistiques GitHub et paquets en direct, les thèmes et les pages générées.',
    },
    stack: ['TypeScript', 'Astro', 'TOML'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/portable-oss' }],
  },
  {
    id: 'totem',
    name: 'totem',
    desc: {
      en: 'Persistent memory layer for engineering agents. MCP server + CLI for decisions, gotchas, invariants and assumptions.',
      es: 'Capa de memoria persistente para agentes de ingeniería. Servidor MCP + CLI para decisiones, gotchas, invariantes y supuestos.',
      fr: "Couche de mémoire persistante pour agents d'ingénierie. Serveur MCP + CLI pour décisions, pièges, invariants et hypothèses.",
    },
    stack: ['Python', 'SQLite', 'MCP'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/totem' }],
  },
  {
    id: 'RBG',
    name: 'RBG',
    desc: {
      en: 'Single-LLM control plane for coding agents: deterministic retrieval, verification and small learned models.',
      es: 'Plano de control con un solo LLM para agentes de programación: recuperación determinista, verificación y modelos pequeños entrenados.',
      fr: 'Plan de contrôle à LLM unique pour agents de codage : récupération déterministe, vérification et petits modèles entraînés.',
    },
    stack: ['Python', 'libSQL', 'MCP'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/RBG' }],
  },
  {
    id: 'gpg-mcp',
    name: 'gpg-mcp',
    desc: {
      en: 'Security-focused MCP server for GnuPG: sign, verify, encrypt, decrypt and manage keys without exposing private key material to the agent.',
      es: 'Servidor MCP centrado en seguridad para GnuPG: firmar, verificar, cifrar, descifrar y gestionar claves sin exponer material privado al agente.',
      fr: "Serveur MCP axé sécurité pour GnuPG : signer, vérifier, chiffrer, déchiffrer et gérer les clés sans exposer le matériel privé à l'agent.",
    },
    stack: ['Python', 'GnuPG', 'MCP'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/gpg-mcp' }],
  },
  {
    id: 'hestia',
    name: 'hestia',
    desc: {
      en: 'Self-hostable agentic project cockpit with persistent Totem memory.',
      es: 'Cockpit de proyectos agéntico autoalojable con memoria persistente de Totem.',
      fr: 'Cockpit de projet agentique auto-hébergeable avec mémoire persistante Totem.',
    },
    stack: ['Python', 'FastAPI', 'Totem'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/hestia' }],
  },
  {
    id: 'opencode-bgj',
    name: 'opencode-bgj',
    desc: {
      en: 'MCP server that gives coding agents supervised background shell jobs without blocking the turn.',
      es: 'Servidor MCP que da a los agentes de programación trabajos de shell en segundo plano supervisados sin bloquear el turno.',
      fr: "Serveur MCP qui donne aux agents de codage des tâches shell en arrière-plan supervisées sans bloquer le tour.",
    },
    stack: ['TypeScript', 'Bun', 'MCP'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/opencode-bgj' }],
  },
  {
    id: 'panopticon',
    name: 'panopticon',
    desc: {
      en: 'Read-only index of repositories, Git history, releases, packages and CI metadata, exposed as REST, MCP and a dashboard.',
      es: 'Índice de solo lectura de repositorios, historial Git, releases, paquetes y metadatos de CI, expuesto como REST, MCP y panel.',
      fr: 'Index en lecture seule des dépôts, de l’historique Git, des releases, des paquets et des métadonnées CI, exposé en REST, MCP et tableau de bord.',
    },
    stack: ['Python', 'FastAPI', 'SQLite', 'MCP'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/panopticon' }],
  },
  {
    id: 'laya-coding-decisions',
    name: 'laya-coding-decisions',
    desc: {
      en: 'Training data and tooling for a coding-agent judge used by the Hestia decision engine.',
      es: 'Datos de entrenamiento y herramientas para un juez de agentes de programación usado por el motor de decisiones de Hestia.',
      fr: "Données d'entraînement et outils pour un juge d'agents de codage utilisé par le moteur de décision Hestia.",
    },
    stack: ['Python', 'ML'],
    links: [{ label: 'GitHub', href: 'https://github.com/emiliano-go/laya-coding-decisions' }],
  },
];
