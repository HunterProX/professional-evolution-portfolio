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
    openMenu: string;
    closeMenu: string;
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
    evidenceLinks: (count: number) => string;
  };
  evidence: {
    eyebrow: string;
    heading: string;
    summary: string;
    count: (count: number) => string;
    empty: string;
    viewAll: string;
    statusLabel: Record<ClaimStatus, string>;
    statusHint: Record<ClaimStatus, string>;
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
  };
  suggestions: {
    eyebrow: string;
    heading: string;
    summary: string;
    cta: string;
    note: string;
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
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
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
    evidenceLinks: (count) => (count === 1 ? '1 evidence link' : `${count} evidence links`),
  },
  evidence: {
    eyebrow: 'Evidence',
    heading: 'Evidence, not a skill score.',
    summary:
      'Every statement carries a status. A missing public proof is shown as a gap instead of being filled with marketing language.',
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
  },
  suggestions: {
    eyebrow: 'Suggestions',
    heading: 'Something missing? Say it in the open.',
    summary:
      'Suggestions are filed as public issues in the source repository, so the request and the response stay inspectable by anyone.',
    cta: 'Open a suggestion',
    note: 'Opens GitHub in a new tab.',
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
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
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
    evidenceLinks: (count) =>
      count === 1 ? '1 enlace de evidencia' : `${count} enlaces de evidencia`,
  },
  evidence: {
    eyebrow: 'Evidencia',
    heading: 'Evidencia, no una puntuación de habilidades.',
    summary:
      'Cada afirmación lleva un estado. La falta de prueba pública se muestra como una laguna en lugar de rellenarse con lenguaje de marketing.',
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
  },
  suggestions: {
    eyebrow: 'Sugerencias',
    heading: '¿Falta algo? Dilo en abierto.',
    summary:
      'Las sugerencias se registran como incidencias públicas en el repositorio fuente, para que la petición y la respuesta queden inspeccionables por cualquiera.',
    cta: 'Abrir una sugerencia',
    note: 'Abre GitHub en una pestaña nueva.',
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