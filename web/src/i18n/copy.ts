/**
 * Typed bilingual copy catalog — the only place UI strings live.
 *
 * `en` is the reference implementation. `es` is typed as `Copy` as well, so a
 * missing or misspelled key is a compile error rather than an English string
 * leaking into the Spanish page. Parity between locales is a plan requirement:
 * every key added to `en` must be translated here in the same edit.
 *
 * Status labels and their tooltips follow the public snapshot's claim
 * semantics (`public-snapshot/snapshot.json` → `claim_status_semantics`), so a
 * label always means the same thing as the underlying evidence.
 *
 * Counts are functions instead of `{placeholder}` strings so an interpolated
 * value can never be forgotten at a call site.
 */

export type Locale = 'en' | 'es';

export const LOCALES: readonly Locale[] = ['en', 'es'] as const;

export type ClaimStatus = 'demonstrated' | 'developing' | 'aspirational' | 'insufficient';

export interface Copy {
  meta: {
    title: string;
    description: string;
    languageName: string;
  };
  a11y: {
    skipToContent: string;
    primaryNav: string;
    externalLink: string;
    opensInNewTab: string;
    required: string;
    onThisPage: string;
  };
  nav: {
    work: string;
    evolution: string;
    evidence: string;
    contact: string;
    menuLabel: string;
  };
  theme: {
    label: string;
    toggle: string;
    dark: string;
    light: string;
  };
  lang: {
    label: string;
    current: string;
    switchToEn: string;
    switchToEs: string;
  };
  hero: {
    eyebrow: string;
    oneLiner: string;
    principle: string;
    ctaWork: string;
    ctaEvidence: string;
    github: string;
    linkedin: string;
  };
  work: {
    eyebrow: string;
    heading: string;
    summary: string;
    viewAll: string;
    repo: string;
    caseStudy: string;
    related: string;
    relatedEmpty: string;
    screenshotPlaceholder: string;
    /** Accessible label of the tag filter bar on the work listing. */
    filterLabel: string;
    /** The button that clears the tag filter and shows every card. */
    filterAll: string;
  };
  /** Case-study detail page (`/work/<slug>/` and `/es/work/<slug>/`). */
  caseStudy: {
    /** Eyebrow above the project name. */
    eyebrow: string;
    /** Back link to the work listing. */
    back: string;
    /** Summary label that reveals the technical sections (progressive disclosure). */
    disclosure: string;
    /** Honest empty state for a project without case-study content. */
    empty: string;
    /** Heading of the closing CTA block. */
    ctaHeading: string;
    /** Label of the link to the contact section of the home page. */
    ctaContact: string;
  };
  projectStatus: {
    label: Record<'live' | 'mvp' | 'demo' | 'prototype' | 'lab', string>;
    hint: Record<'live' | 'mvp' | 'demo' | 'prototype' | 'lab', string>;
  };
  evolution: {
    eyebrow: string;
    heading: string;
    summary: string;
    viewAll: string;
    previewNote: string;
    shipped: string;
    inProgress: string;
    planned: string;
    sourceLabel: Record<'curated' | 'git' | 'snapshot', string>;
    /** Heading of the legend that explains what each source badge means. */
    sourcesNote: string;
    /** One line per source badge, shown next to its label in that legend. */
    sourceHint: Record<'curated' | 'git' | 'snapshot', string>;
    /** Heading above the complete timeline (the preview uses `summary`). */
    timelineHeading: string;
    evidenceLinks: (count: number) => string;
    /** Heading of the timeline half that covers what already happened. */
    completedHeading: string;
    /** One line under `completedHeading`. */
    completedNote: string;
    /** Heading of the timeline half that covers planned, not-yet-delivered work. */
    directionAheadHeading: string;
    /**
     * One line under `directionAheadHeading`. This is load-bearing copy: it is
     * the sentence that stops a reader treating a planned entry as a result.
     */
    directionAheadNote: string;
    /** Label before the project links of a milestone. */
    relatedLabel: string;
    /** Preview note used when the subset is "curated entries only". */
    curatedPreviewNote: string;
    /** Heading of the roadmap table on the evolution page. */
    roadmapHeading: string;
    /** One line under the roadmap heading. */
    roadmapNote: string;
    /** Label above the supporting-project links of one roadmap row. */
    roadmapProjectsLabel: string;
    /** Shown when a phase declares milestones but none of them link a project. */
    roadmapNoProjects: string;
    /** Roadmap phase names, in roadmap order. */
    phaseLabel: Record<'foundation' | 'transition' | 'frontier', string>;
    /** One line per phase, describing what that phase was about. */
    phaseFocus: Record<'foundation' | 'transition' | 'frontier', string>;
    /** Milestone count inside one roadmap row. */
    roadmapMilestones: (count: number) => string;
  };
  evidence: {
    eyebrow: string;
    heading: string;
    summary: string;
    /** One extra line under the page intro explaining how the list is built. */
    introNote: string;
    /** Heading above the grouped evidence list on the evidence page. */
    listHeading: string;
    count: (count: number) => string;
    empty: string;
    viewAll: string;
    statusLabel: Record<ClaimStatus, string>;
    statusHint: Record<ClaimStatus, string>;
  };
  /** Build-time GitHub activity feed (`components/ActivityFeed.astro`). */
  activity: {
    eyebrow: string;
    heading: string;
    /** Honesty note: the feed is a snapshot, not a live API call. */
    note: string;
    /** Honest empty state when the snapshot carries no records. */
    empty: string;
    /** Shown for a repository whose snapshot has no commit records. */
    noCommits: string;
    openPullRequests: (count: number) => string;
    latestRelease: (tag: string) => string;
  };
  contact: {
    eyebrow: string;
    heading: string;
    summary: string;
    formHeading: string;
    name: string;
    email: string;
    message: string;
    messageHint: string;
    submit: string;
    privacy: string;
    honeypot: string;
    fallbackHeading: string;
    fallbackNote: string;
    mailtoCta: string;
    emailLabel: string;
    /** Client-side validation messages for the POST branch. */
    fieldRequired: string;
    invalidEmail: string;
    /** Fallback branch: compose an email with a prefilled subject and body. */
    suggestionLabel: string;
    suggestionHint: string;
    suggestionSubject: string;
    suggestionCta: string;
  };
  suggestions: {
    eyebrow: string;
    heading: string;
    summary: string;
    cta: string;
    note: string;
  };
  /** Floating keyword-search assistant (`components/AssistantWidget.astro`). */
  assistant: {
    /** Accessible name of the floating open button. */
    open: string;
    /** Panel heading, referenced by the dialog's `aria-labelledby`. */
    title: string;
    /** Accessible name of the close button. */
    close: string;
    /** Honesty banner: what the assistant is, and what it is not. */
    banner: string;
    /** Search input placeholder. */
    placeholder: string;
    /** Submit button label. */
    submit: string;
    /** Heading above the suggested-question chips. */
    suggestedHeading: string;
    /**
     * The four suggested questions. Each chip carries a fixed English keyword
     * query (the canonical data is English, so a translated query could not
     * match it); the label here is what the visitor reads, in their language.
     */
    chips: { built: string; ai: string; contact: string; contrast: string };
    /** Label above the result list once a search has run. */
    results: string;
    /** No-match explanation: nothing was found, and where to go instead. */
    fallback: string;
    /** Fallback link that composes an email with the question as the body. */
    askByEmail: string;
    /** Subject line of the prefilled `mailto:` compose. */
    emailSubject: string;
  };
  /** Branded 404 page (`/404.html` and `/es/404.html`). */
  notFound: {
    eyebrow: string;
    heading: string;
    summary: string;
    home: string;
    work: string;
    evidence: string;
  };
  footer: {
    tagline: string;
    sourceRepository: string;
    snapshotLabel: string;
    themeNote: string;
    buildNote: string;
  };
}

export const en: Copy = {
  meta: {
    title: 'Cristian Cardona — Professional Evolution',
    description:
      "Cristian Cardona's evidence-backed professional evolution from Full Stack and Cloud toward AI Engineering, AI Automation and Agentic Systems. Every capability claim points at an inspectable artifact.",
    languageName: 'English',
  },
  a11y: {
    skipToContent: 'Skip to main content',
    primaryNav: 'Primary',
    externalLink: 'External link',
    opensInNewTab: 'opens in a new tab',
    required: 'required',
    onThisPage: 'On this page',
  },
  nav: {
    work: 'Work',
    evolution: 'Evolution',
    evidence: 'Evidence',
    contact: 'Contact',
    menuLabel: 'Menu',
  },
  theme: {
    label: 'Theme',
    toggle: 'Switch colour theme',
    dark: 'Dark theme',
    light: 'Light theme',
  },
  lang: {
    label: 'Language',
    current: 'Current language',
    switchToEn: 'Read this page in English',
    switchToEs: 'Leer esta página en español',
  },
  hero: {
    eyebrow: 'Evidence before confidence',
    oneLiner:
      'A deliberately honest portfolio: work that is demonstrated, capabilities that are still developing, and the direction being built next.',
    principle:
      'Evidence before confidence. Direction is labelled as direction, and a prototype is never presented as a production system.',
    ctaWork: 'Explore the work',
    ctaEvidence: 'Inspect the evidence',
    github: 'GitHub',
    linkedin: 'LinkedIn',
  },
  work: {
    eyebrow: 'Selected work',
    heading: 'Projects with their limits visible.',
    summary:
      'A prototype can be useful without being production-ready. Planned work stays labelled as planned until there is something public to inspect.',
    viewAll: 'View all projects',
    repo: 'Repository',
    caseStudy: 'Case study',
    related: 'Related work',
    relatedEmpty: 'No related entries in the dataset yet.',
    screenshotPlaceholder: 'No screenshot published for this project yet.',
    filterLabel: 'Filter projects by tag',
    filterAll: 'All',
  },
  caseStudy: {
    eyebrow: 'Case study',
    back: 'Back to all projects',
    disclosure: 'Read technical details',
    empty:
      'No case study is published for this project yet. The repository below is the artifact you can inspect; no write-up is invented where none exists.',
    ctaHeading: 'Questions about this work?',
    ctaContact: 'Ask about this work',
  },
  projectStatus: {
    label: {
      live: 'Live',
      mvp: 'MVP',
      demo: 'Demo',
      prototype: 'Prototype',
      lab: 'Lab / planned',
    },
    hint: {
      live: 'Published and reachable now; the links and artifacts on this page resolve.',
      mvp: 'Minimum viable product: something usable exists, with the limits documented.',
      demo: 'Demonstration build. It does not imply availability or production use.',
      prototype:
        'Prototype: a public reproduction covered by tests, with no production system behind it.',
      lab: 'Lab or planned work. Not built and not deployed as a product.',
    },
  },
  evolution: {
    eyebrow: 'Evolution',
    heading: 'Where this comes from, and where it is going.',
    summary:
      'The trajectory is inspectable: each milestone links to the commits and artifacts behind it, and unreviewed git-derived entries are labelled as candidates.',
    viewAll: 'View the full timeline',
    previewNote: 'Showing the most recent entries only.',
    shipped: 'Shipped',
    inProgress: 'In progress',
    planned: 'Planned',
    sourceLabel: {
      curated: 'Curated',
      git: 'Derived from git',
      snapshot: 'Snapshot',
    },
    sourcesNote: 'How to read the source badge',
    sourceHint: {
      curated: 'Written by hand and reviewed before it is published.',
      git: 'Generated from the commit history and not yet reviewed: treat it as a candidate, not curated history.',
      snapshot:
        'Read from the public snapshot when the site builds; the next build picks up any change.',
    },
    timelineHeading: 'Full timeline',
    evidenceLinks: (count) => (count === 1 ? '1 evidence link' : `${count} evidence links`),
    completedHeading: 'Completed & ongoing',
    completedNote:
      'Work that is published or in flight. Every entry links to the commits and artifacts behind it.',
    directionAheadHeading: 'Direction ahead',
    directionAheadNote:
      'Not achievements. These entries record intent only: no artifact exists yet, and the links point at what would be extended.',
    relatedLabel: 'Related',
    curatedPreviewNote:
      'Showing the most recent hand-written milestones, delivered work first; unreviewed git candidates are on the full timeline.',
    roadmapHeading: 'Roadmap by phase',
    roadmapNote:
      'Derived from the milestones themselves: each phase lists the focus it covered and the projects that supported it. Phases describe what happened; only "Direction ahead" describes what is intended.',
    roadmapProjectsLabel: 'Supporting projects',
    roadmapNoProjects:
      'No milestone in this phase links a project, so no supporting project is listed.',
    phaseLabel: {
      foundation: 'Foundation',
      transition: 'Transition',
      frontier: 'Direction ahead',
    },
    phaseFocus: {
      foundation:
        'Making the evidence contract real: a published snapshot, bilingual locales, and an explicit boundary statement for every public reproduction.',
      transition:
        'Rebuilding on Astro over a validated data layer, keeping the legacy site live until the cutover gate passes.',
      frontier:
        'Intended, not started. Each row points at the repositories the next work would extend; none of it is built yet.',
    },
    roadmapMilestones: (count) => (count === 1 ? '1 milestone' : `${count} milestones`),
  },
  evidence: {
    eyebrow: 'Evidence',
    heading: 'Evidence, not a skill score.',
    summary:
      'Every statement carries a status. A missing public proof is shown as a gap instead of being filled with marketing language.',
    introNote:
      'The list below is generated from the public snapshot at build time. Items are grouped by the status of the claim they support, and nothing appears here without a public link.',
    listHeading: 'Published evidence',
    count: (count) => (count === 1 ? '1 linked evidence item' : `${count} linked evidence items`),
    empty:
      'No evidence items are published yet. This section is populated from the public snapshot at build time, and an empty list is shown rather than invented claims.',
    viewAll: 'View all evidence',
    statusLabel: {
      demonstrated: 'Demonstrated',
      developing: 'Developing',
      aspirational: 'Aspirational',
      insufficient: 'Insufficient evidence',
    },
    statusHint: {
      demonstrated: 'Supported by at least one public, checkable artifact that a third party can open.',
      developing:
        'Partially built or prototype-level: no public artifact yet, or the available one does not cover the whole claim.',
      aspirational: 'Stated direction or intent. Not started, or started but not verifiable.',
      insufficient: 'No public artifact exists today that could support the claim.',
    },
  },
  activity: {
    eyebrow: 'Open source',
    heading: 'Public GitHub activity',
    note: 'Captured at build time; no live API calls from this site.',
    empty: 'Snapshot captured at build time; no activity recorded.',
    noCommits: 'No recent commits recorded for this repository.',
    openPullRequests: (count) =>
      count === 1 ? '1 open pull request' : `${count} open pull requests`,
    latestRelease: (tag) => `Latest release ${tag}`,
  },
  contact: {
    eyebrow: 'Contact',
    heading: 'Start from the evidence.',
    summary:
      'Ask about a repository, a claim or a boundary. Answers cover what is publicly inspectable, not what is intended.',
    formHeading: 'Send a message',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    messageHint: 'Include the repository or the claim you want to inspect.',
    submit: 'Send message',
    privacy: 'Messages go straight to the inbox by email. Nothing is stored on this site.',
    honeypot: 'Leave this field empty',
    fallbackHeading: 'Direct form is still being built',
    fallbackNote:
      'No form endpoint is configured for this deployment, so this page does not collect messages yet. Writing by email reaches the same inbox.',
    mailtoCta: 'Write by email',
    emailLabel: 'Email address',
    fieldRequired: 'This field is required.',
    invalidEmail: 'Enter a valid email address.',
    suggestionLabel: 'Suggestion',
    suggestionHint:
      'Describe what to improve. This opens your email client with the subject and message already filled in.',
    suggestionSubject: 'Portfolio suggestion',
    suggestionCta: 'Compose email',
  },
  suggestions: {
    eyebrow: 'Suggestions',
    heading: 'Something missing? Say it in the open.',
    summary:
      'Suggestions are filed as public issues in the source repository, so the request and the response stay inspectable by anyone.',
    cta: 'Open a suggestion',
    note: 'Opens GitHub in a new tab.',
  },
  assistant: {
    open: 'Search this portfolio',
    title: 'Portfolio assistant',
    close: 'Close the assistant',
    banner:
      'This is a keyword search over the public data published on this site — not an AI model. It can only point at what is already published here, and it says so when it finds nothing.',
    placeholder: 'Projects, evidence, milestones…',
    submit: 'Search',
    suggestedHeading: 'Suggested questions',
    chips: {
      built: 'What has Cristian built?',
      ai: 'What AI work is demonstrated?',
      contact: 'How can I contact Cristian?',
      contrast: 'What is aspirational vs demonstrated?',
    },
    results: 'Published entries that match',
    fallback:
      'No published entry matches those words. The pages below hold the same content, and a question by email is answered from what is public.',
    askByEmail: 'Ask by email',
    emailSubject: 'Question about the portfolio',
  },
  notFound: {
    eyebrow: 'Not found',
    heading: 'Page not found',
    summary:
      'The address you requested is not published here. Nothing was moved without a record: the links below lead to the pages that do exist.',
    home: 'Go to the home page',
    work: 'See the work',
    evidence: 'Inspect the evidence',
  },
  footer: {
    tagline: 'Evidence before confidence.',
    sourceRepository: 'Source repository',
    snapshotLabel: 'Snapshot',
    themeNote: 'The theme is stored in your own browser; no server controls it.',
    buildNote: 'Static site built with Astro. No tracking and no third-party scripts.',
  },
};

export const es: Copy = {
  meta: {
    title: 'Cristian Cardona — Evolución Profesional',
    description:
      'Evolución profesional de Cristian Cardona respaldada por evidencia: de Full Stack y Cloud hacia Ingeniería de IA, Automatización de IA y Sistemas Agénticos. Cada afirmación apunta a un artefacto inspeccionable.',
    languageName: 'Español',
  },
  a11y: {
    skipToContent: 'Saltar al contenido principal',
    primaryNav: 'Principal',
    externalLink: 'Enlace externo',
    opensInNewTab: 'se abre en una pestaña nueva',
    required: 'obligatorio',
    onThisPage: 'En esta página',
  },
  nav: {
    work: 'Trabajo',
    evolution: 'Evolución',
    evidence: 'Evidencia',
    contact: 'Contacto',
    menuLabel: 'Menú',
  },
  theme: {
    label: 'Tema',
    toggle: 'Cambiar el tema de color',
    dark: 'Tema oscuro',
    light: 'Tema claro',
  },
  lang: {
    label: 'Idioma',
    current: 'Idioma actual',
    switchToEn: 'Read this page in English',
    switchToEs: 'Leer esta página en español',
  },
  hero: {
    eyebrow: 'Evidencia antes que confianza',
    oneLiner:
      'Un portafolio deliberadamente honesto: trabajo demostrado, capacidades todavía en desarrollo y la dirección que se está construyendo.',
    principle:
      'Evidencia antes que confianza. La dirección se etiqueta como dirección, y un prototipo nunca se presenta como un sistema en producción.',
    ctaWork: 'Explorar el trabajo',
    ctaEvidence: 'Inspeccionar la evidencia',
    github: 'GitHub',
    linkedin: 'LinkedIn',
  },
  work: {
    eyebrow: 'Trabajo seleccionado',
    heading: 'Proyectos con sus límites a la vista.',
    summary:
      'Un prototipo puede ser útil sin estar listo para producción. El trabajo planificado sigue etiquetado como planificado hasta que exista algo público que inspeccionar.',
    viewAll: 'Ver todos los proyectos',
    repo: 'Repositorio',
    caseStudy: 'Estudio de caso',
    related: 'Trabajo relacionado',
    relatedEmpty: 'Todavía no hay entradas relacionadas en el conjunto de datos.',
    screenshotPlaceholder: 'Todavía no hay capturas publicadas para este proyecto.',
    filterLabel: 'Filtrar proyectos por etiqueta',
    filterAll: 'Todos',
  },
  caseStudy: {
    eyebrow: 'Estudio de caso',
    back: 'Volver a todos los proyectos',
    disclosure: 'Leer detalles técnicos',
    empty:
      'Todavía no hay un estudio de caso publicado para este proyecto. El repositorio de abajo es el artefacto que puedes inspeccionar; no se inventa un resumen donde no lo hay.',
    ctaHeading: '¿Preguntas sobre este trabajo?',
    ctaContact: 'Preguntar sobre este trabajo',
  },
  projectStatus: {
    label: {
      live: 'En vivo',
      mvp: 'MVP',
      demo: 'Demo',
      prototype: 'Prototipo',
      lab: 'Laboratorio / planificado',
    },
    hint: {
      live: 'Publicado y accesible ahora; los enlaces y artefactos de esta página se resuelven.',
      mvp: 'Producto mínimo viable: existe algo utilizable, con los límites documentados.',
      demo: 'Versión de demostración. No implica disponibilidad ni uso en producción.',
      prototype:
        'Prototipo: una reproducción pública cubierta por pruebas, sin ningún sistema en producción detrás.',
      lab: 'Trabajo de laboratorio o planificado. No está construido ni desplegado como producto.',
    },
  },
  evolution: {
    eyebrow: 'Evolución',
    heading: 'De dónde viene esto y hacia dónde va.',
    summary:
      'La trayectoria es inspeccionable: cada hito enlaza con los commits y artefactos que lo respaldan, y las entradas derivadas de git sin revisar se etiquetan como candidatas.',
    viewAll: 'Ver la línea de tiempo completa',
    previewNote: 'Se muestran solo las entradas más recientes.',
    shipped: 'Entregado',
    inProgress: 'En curso',
    planned: 'Planificado',
    sourceLabel: {
      curated: 'Curado',
      git: 'Derivado de git',
      snapshot: 'Instantánea',
    },
    sourcesNote: 'Cómo leer la insignia de origen',
    sourceHint: {
      curated: 'Escrito a mano y revisado antes de publicarse.',
      git: 'Generado a partir del historial de commits y todavía sin revisar: se trata de un candidato, no de historia curada.',
      snapshot:
        'Leído de la instantánea pública cuando se construye el sitio; la siguiente compilación recoge cualquier cambio.',
    },
    timelineHeading: 'Línea de tiempo completa',
    evidenceLinks: (count) =>
      count === 1 ? '1 enlace de evidencia' : `${count} enlaces de evidencia`,
    completedHeading: 'Completado y en curso',
    completedNote:
      'Trabajo publicado o en marcha. Cada entrada enlaza con los commits y artefactos que lo respaldan.',
    directionAheadHeading: 'Dirección por delante',
    directionAheadNote:
      'No son logros. Estas entradas solo registran intención: todavía no existe ningún artefacto y los enlaces apuntan a lo que se ampliaría.',
    relatedLabel: 'Relacionado',
    curatedPreviewNote:
      'Se muestran los hitos escritos a mano más recientes, con lo entregado primero; los candidatos de git sin revisar están en la línea de tiempo completa.',
    roadmapHeading: 'Hoja de ruta por fase',
    roadmapNote:
      'Derivada de los propios hitos: cada fase muestra el foco que cubrió y los proyectos que lo respaldaron. Las fases describen lo que ocurrió; solo «Dirección por delante» describe lo que se pretende.',
    roadmapProjectsLabel: 'Proyectos de apoyo',
    roadmapNoProjects:
      'Ningún hito de esta fase enlaza un proyecto, así que no se lista ninguno.',
    phaseLabel: {
      foundation: 'Fundación',
      transition: 'Transición',
      frontier: 'Dirección por delante',
    },
    phaseFocus: {
      foundation:
        'Hacer real el contrato de evidencia: una instantánea publicada, dos locales revisados y una declaración de límites explícita para cada reproducción pública.',
      transition:
        'Reconstruir sobre Astro con una capa de datos validada, manteniendo el sitio anterior en línea hasta que la puerta de corte se supere.',
      frontier:
        'Intencionado, no iniciado. Cada fila apunta a los repositorios que el próximo trabajo ampliaría; nada de eso está construido todavía.',
    },
    roadmapMilestones: (count) => (count === 1 ? '1 hito' : `${count} hitos`),
  },
  evidence: {
    eyebrow: 'Evidencia',
    heading: 'Evidencia, no una puntuación de habilidades.',
    summary:
      'Cada afirmación lleva un estado. La falta de prueba pública se muestra como una laguna en lugar de rellenarse con lenguaje de marketing.',
    introNote:
      'La lista siguiente se genera desde la instantánea pública en tiempo de compilación. Las entradas se agrupan por el estado de la afirmación que respaldan, y nada aparece aquí sin un enlace público.',
    listHeading: 'Evidencia publicada',
    count: (count) =>
      count === 1 ? '1 elemento de evidencia enlazado' : `${count} elementos de evidencia enlazados`,
    empty:
      'Todavía no hay elementos de evidencia publicados. Esta sección se completa desde la instantánea pública en tiempo de compilación, y se muestra una lista vacía en lugar de afirmaciones inventadas.',
    viewAll: 'Ver toda la evidencia',
    statusLabel: {
      demonstrated: 'Demostrado',
      developing: 'En desarrollo',
      aspirational: 'Aspiracional',
      insufficient: 'Evidencia insuficiente',
    },
    statusHint: {
      demonstrated:
        'Respaldado por al menos un artefacto público y verificable que un tercero puede abrir.',
      developing:
        'Parcialmente construido o a nivel de prototipo: sin artefacto público todavía, o el disponible no cubre toda la afirmación.',
      aspirational: 'Dirección o intención declarada. No iniciado, o iniciado pero no verificable.',
      insufficient: 'Hoy no existe ningún artefacto público que pueda respaldar la afirmación.',
    },
  },
  activity: {
    eyebrow: 'Código abierto',
    heading: 'Actividad pública en GitHub',
    note: 'Capturada en tiempo de compilación; este sitio no hace llamadas a la API en vivo.',
    empty: 'Instantánea capturada en tiempo de compilación; no hay actividad registrada.',
    noCommits: 'No hay commits recientes registrados para este repositorio.',
    openPullRequests: (count) =>
      count === 1 ? '1 pull request abierto' : `${count} pull requests abiertos`,
    latestRelease: (tag) => `Última versión ${tag}`,
  },
  contact: {
    eyebrow: 'Contacto',
    heading: 'Empieza por la evidencia.',
    summary:
      'Pregunta por un repositorio, una afirmación o un límite. Las respuestas cubren lo que es públicamente inspeccionable, no lo que está previsto.',
    formHeading: 'Enviar un mensaje',
    name: 'Nombre',
    email: 'Correo electrónico',
    message: 'Mensaje',
    messageHint: 'Incluye el repositorio o la afirmación que quieres inspeccionar.',
    submit: 'Enviar mensaje',
    privacy: 'Los mensajes llegan directamente al buzón por correo. No se guarda nada en este sitio.',
    honeypot: 'Deja este campo vacío',
    fallbackHeading: 'El formulario directo aún está en construcción',
    fallbackNote:
      'Esta publicación no tiene configurado un endpoint de formulario, así que la página todavía no recoge mensajes. Escribir por correo llega al mismo buzón.',
    mailtoCta: 'Escribir por correo',
    emailLabel: 'Dirección de correo',
    fieldRequired: 'Este campo es obligatorio.',
    invalidEmail: 'Introduce una dirección de correo electrónico válida.',
    suggestionLabel: 'Sugerencia',
    suggestionHint:
      'Describe qué mejorar. Esto abre tu cliente de correo con el asunto y el mensaje ya rellenados.',
    suggestionSubject: 'Sugerencia para el portafolio',
    suggestionCta: 'Redactar correo',
  },
  suggestions: {
    eyebrow: 'Sugerencias',
    heading: '¿Falta algo? Dilo en abierto.',
    summary:
      'Las sugerencias se registran como incidencias públicas en el repositorio fuente, para que la petición y la respuesta queden inspeccionables por cualquiera.',
    cta: 'Abrir una sugerencia',
    note: 'Abre GitHub en una pestaña nueva.',
  },
  assistant: {
    open: 'Buscar en este portafolio',
    title: 'Asistente del portafolio',
    close: 'Cerrar el asistente',
    banner:
      'Esto es una búsqueda por palabras clave sobre los datos públicos publicados en este sitio, no un modelo de IA. Solo puede señalar lo que ya está publicado aquí, y lo dice cuando no encuentra nada.',
    placeholder: 'Proyectos, evidencia, hitos…',
    submit: 'Buscar',
    suggestedHeading: 'Preguntas sugeridas',
    chips: {
      built: '¿Qué ha construido Cristian?',
      ai: '¿Qué trabajo de IA está demostrado?',
      contact: '¿Cómo contacto con Cristian?',
      contrast: '¿Qué es aspiracional y qué está demostrado?',
    },
    results: 'Entradas publicadas que coinciden',
    fallback:
      'Ninguna entrada publicada coincide con esas palabras. Las páginas de abajo contienen el mismo contenido, y una pregunta por correo se responde con lo que es público.',
    askByEmail: 'Preguntar por correo',
    emailSubject: 'Pregunta sobre el portafolio',
  },
  notFound: {
    eyebrow: 'No encontrado',
    heading: 'Página no encontrada',
    summary:
      'La dirección que has solicitado no está publicada aquí. Nada se movió sin dejar constancia: los enlaces de abajo llevan a las páginas que sí existen.',
    home: 'Ir a la página de inicio',
    work: 'Ver el trabajo',
    evidence: 'Inspeccionar la evidencia',
  },
  footer: {
    tagline: 'Evidencia antes que confianza.',
    sourceRepository: 'Repositorio fuente',
    snapshotLabel: 'Instantánea',
    themeNote: 'El tema se guarda en tu propio navegador; ningún servidor lo controla.',
    buildNote: 'Sitio estático construido con Astro. Sin rastreo y sin scripts de terceros.',
  },
};

export const copyByLocale: Record<Locale, Copy> = { en, es };

/** Default locale when a request carries no usable locale. */
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Resolve a copy catalog. Unknown locales fall back to the default locale so a
 * typo renders English rather than an empty page.
 */
export function getCopy(locale: string | undefined | null): Copy {
  return isLocale(locale) ? copyByLocale[locale] : copyByLocale[DEFAULT_LOCALE];
}