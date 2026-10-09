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

export const PROJECT_STATUSES = ['prototype', 'demo', 'mvp', 'lab', 'live'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MILESTONE_STATUSES = ['shipped', 'in-progress', 'planned'] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MILESTONE_SOURCES = ['curated', 'git'] as const;
export type MilestoneSource = (typeof MILESTONE_SOURCES)[number];

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

/** Newest milestone first; curated and git-derived entries share one ordering. */
export const milestonesByDateDesc: Milestone[] = [...milestones].sort((a, b) =>
  a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? 1 : -1,
);

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/** Cross-linked projects (similarity links declared in `data/projects.json`). */
export function relatedProjects(slug: string): Project[] {
  const project = getProjectBySlug(slug);
  if (!project) return [];
  return project.related
    .map((relatedSlug) => getProjectBySlug(relatedSlug))
    .filter((value): value is Project => value !== undefined);
}
