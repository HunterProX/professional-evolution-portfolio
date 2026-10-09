/**
 * Canonical data layer — single source of truth for the portfolio.
 *
 * The JSON files under `data/` at the repository root are canonical
 * (`npm run data:validate` is the gate). They are imported here by relative
 * path so the Astro build consumes exactly the same bytes the validator checks.
 * From `web/src/lib/` the repository root is three levels up.
 * Edit the data files, never this module.
 */
import profileJson from '../../../data/profile.json';
import projectsJson from '../../../data/projects.json';
import evolutionJson from '../../../data/evolution.json';
import evidenceJson from '../../../data/evidence.json';
import caseStudiesJson from '../../../data/case-studies.json';

export const PROJECT_STATUSES = ['prototype', 'demo', 'mvp', 'lab', 'live'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MILESTONE_STATUSES = ['shipped', 'in-progress', 'planned'] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MILESTONE_SOURCES = ['curated', 'git'] as const;
export type MilestoneSource = (typeof MILESTONE_SOURCES)[number];

/**
 * Roadmap phase, in the order the roadmap reads. Optional on a milestone: an
 * entry without one simply does not appear in the roadmap, so a dataset that
 * predates the phases still renders.
 *
 * The split is chronological rather than aspirational — `foundation` and
 * `transition` describe what already happened, `frontier` is the only phase a
 * `planned` milestone may sit in, because frontier means "direction ahead".
 * `data-validate.mjs` enforces that pairing.
 */
export const MILESTONE_PHASES = ['foundation', 'transition', 'frontier'] as const;
export type MilestonePhase = (typeof MILESTONE_PHASES)[number];

export interface Profile {
  name: string;
  headline: string;
  email: string;
  socials: { github: string; linkedin: string };
  formEndpoint: string | null;
  formKey: string | null;
  reposOwner: string;
}

export interface Project {
  slug: string;
  name: string;
  summary: string;
  status: ProjectStatus;
  repo: string;
  caseStudy: string | null;
  tags: string[];
  related: string[];
  screenshots: string[];
}

export interface Milestone {
  id: string;
  date: string;
  title: string;
  narrative: string;
  evidence: string[];
  status: MilestoneStatus;
  source: MilestoneSource;
  /** Roadmap phase; absent when the milestone is not part of the roadmap. */
  phase?: MilestonePhase;
  /** Project slugs this milestone belongs to; absent means "no project link". */
  projects?: string[];
}

export interface EvidenceItem {
  label: string;
  url: string;
  status: string;
}

export interface Evidence {
  note: string;
  items: EvidenceItem[];
}

/** One `## …` section of a case study, body kept as raw markdown. */
export interface CaseStudySection {
  heading: string;
  body: string;
}

/** An entry of `data/case-studies.json`, derived from `case-studies/*.md`. */
export interface CaseStudy {
  /** Path of the source markdown, relative to the repository root. */
  source: string;
  /** File stem of the source markdown (legacy id, never renamed). */
  fileSlug: string;
  /** Project this case study documents, or `null` for a standalone entry. */
  projectSlug: string | null;
  /** The H1 of the source markdown, verbatim. */
  title: string;
  sections: CaseStudySection[];
}

/**
 * JSON imports widen string literals to `string`, so the canonical unions are
 * re-narrowed here. `npm run data:validate` is the gate that keeps the JSON
 * files inside those unions.
 */
function narrow<T>(value: unknown): T {
  return value as T;
}

export const profile: Profile = narrow(profileJson);
export const projects: Project[] = narrow(projectsJson);
export const milestones: Milestone[] = narrow(evolutionJson.milestones);
export const evidence: Evidence = narrow(evidenceJson);
export const caseStudies: CaseStudy[] = narrow(caseStudiesJson.caseStudies);

/** Newest milestone first; curated and git-derived entries share one ordering. */
export const milestonesByDateDesc: Milestone[] = [...milestones].sort((a, b) =>
  a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? 1 : -1,
);

/**
 * Milestones a human wrote and reviewed. The home preview uses this set only:
 * an unreviewed git candidate is not the first thing a visitor should read as
 * "what happened most recently".
 */
export const curatedMilestonesByDateDesc: Milestone[] = milestonesByDateDesc.filter(
  (milestone) => milestone.source === 'curated',
);

/** Projects a milestone links to, in `projects.json` order, unknown slugs dropped. */
export function milestoneProjects(milestone: Milestone): Project[] {
  if (!milestone.projects || milestone.projects.length === 0) return [];
  return milestone.projects
    .map((slug) => getProjectBySlug(slug))
    .filter((value): value is Project => value !== undefined);
}

/** One row of the roadmap table on `/evolution/`. */
export interface RoadmapRow {
  phase: MilestonePhase;
  /** Milestones carrying this phase, newest first. */
  milestones: Milestone[];
  /** Union of the milestones' project slugs, deduplicated and kept in order. */
  projects: Project[];
}

/**
 * Roadmap rows derived from the milestones themselves — no hand-written list.
 *
 * Only phases that at least one milestone declares are returned, so the table
 * never shows an empty row, and the phase order is fixed by `MILESTONE_PHASES`
 * so a data edit can add a phase but cannot reorder the narrative.
 */
export function roadmapRows(entries: Milestone[] = milestones): RoadmapRow[] {
  return MILESTONE_PHASES.map((phase) => {
    const inPhase = entries
      .filter((milestone) => milestone.phase === phase)
      .sort((a, b) =>
        a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? 1 : -1,
      );
    const slugs = [...new Set(inPhase.flatMap((milestone) => milestone.projects ?? []))];
    return {
      phase,
      milestones: inPhase,
      // Dataset order, not mention order, so the supporting list is stable.
      projects: projects.filter((project) => slugs.includes(project.slug)),
    };
  }).filter((row) => row.milestones.length > 0);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/**
 * Case study that documents a project, matched through the file→project
 * mapping the sync script validates. A project whose `caseStudy` is `null`
 * (or whose file has no mapping) returns `undefined`, which the case-study
 * page renders as the honest empty state instead of an invented write-up.
 */
export function caseStudyFor(slug: string): CaseStudy | undefined {
  return caseStudies.find((entry) => entry.projectSlug === slug);
}

/** Cross-linked projects (similarity links declared in `data/projects.json`). */
export function relatedProjects(slug: string): Project[] {
  const project = getProjectBySlug(slug);
  if (!project) return [];
  return project.related
    .map((relatedSlug) => getProjectBySlug(relatedSlug))
    .filter((value): value is Project => value !== undefined);
}
