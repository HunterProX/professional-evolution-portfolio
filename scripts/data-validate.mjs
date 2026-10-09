#!/usr/bin/env node
/**
 * data-validate.mjs — gate for the canonical data layer (`data/*.json`).
 *
 * Usage: npm run data:validate
 *
 * Checks:
 *   - required fields and types for profile, projects, evolution, evidence,
 *     case-studies
 *   - optional project `summary_es`, when present, is a non-empty string
 *   - project status and milestone status/source/phase enums
 *   - unique project slugs and unique milestone ids
 *   - every project `repo` URL lives under github.com/cristian-cardona-dev/
 *     (other owners such as HunterProX are rejected)
 *   - `personal-os` must not appear anywhere in projects.json
 *   - milestone dates are real ISO calendar dates
 *   - project `related` slugs resolve to declared projects
 *   - project `caseStudy` paths exist on disk
 *   - case studies: required shape, `projectSlug` resolves to a declared project,
 *     every GitHub URL inside a body is canonical, the source file exists, and
 *     each declared `caseStudy` path has a matching entry that maps back
 *   - evolution `projects` slugs resolve to declared projects
 *
 * Exits non-zero, one line per problem, on failure.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'data');

const REPO_OWNER = 'cristian-cardona-dev';
const REJECTED_OWNERS = ['hunterprox', 'tuuser'];
const FORBIDDEN_SUBSTRINGS = ['personal-os'];

const PROJECT_STATUSES = new Set(['prototype', 'demo', 'mvp', 'lab', 'live']);
const MILESTONE_STATUSES = new Set(['shipped', 'in-progress', 'planned']);
/**
 * A milestone may name the public snapshot as its source (the site's source
 * legend and badge catalog already advertise the `snapshot` badge); the gate
 * accepts the same three values the legend renders.
 */
const MILESTONE_SOURCES = new Set(['curated', 'git', 'snapshot']);
/**
 * Roadmap phase of a milestone. Optional: an entry without a `phase` simply
 * does not appear in the roadmap, so older data stays valid. `frontier` is the
 * only phase a `planned` milestone may sit in, because frontier means
 * "direction ahead"; a planned entry in an earlier phase would read as
 * unfinished past work rather than as direction.
 */
const MILESTONE_PHASES = new Set(['foundation', 'transition', 'frontier']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const errors = [];

function fail(message) {
  errors.push(message);
}

function readRaw(file) {
  const path = join(DATA_DIR, file);
  if (!existsSync(path)) {
    fail(`${file}: missing (expected at data/${file})`);
    return null;
  }
  return readFileSync(path, 'utf8');
}

function parseJson(file, raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`${file}: invalid JSON — ${error.message}`);
    return null;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function isIsoDate(value) {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isHttpUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function validateProfile(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fail('profile.json: expected an object');
    return;
  }
  for (const field of ['name', 'headline', 'email', 'reposOwner']) {
    if (!isNonEmptyString(data[field])) fail(`profile.json: "${field}" must be a non-empty string`);
  }
  const socials = data.socials;
  if (!socials || typeof socials !== 'object' || Array.isArray(socials)) {
    fail('profile.json: "socials" must be an object');
  } else {
    for (const field of ['github', 'linkedin']) {
      if (!isNonEmptyString(socials[field]) || !isHttpUrl(socials[field])) {
        fail(`profile.json: "socials.${field}" must be an https URL`);
      }
    }
  }
  for (const field of ['formEndpoint', 'formKey']) {
    const value = data[field];
    if (value !== null && !isNonEmptyString(value)) {
      fail(`profile.json: "${field}" must be a non-empty string or null`);
    }
  }
  if (isNonEmptyString(data.reposOwner) && data.reposOwner !== REPO_OWNER) {
    fail(`profile.json: "reposOwner" must be "${REPO_OWNER}"`);
  }
}

function validateRepoUrl(value, label) {
  if (!isNonEmptyString(value)) {
    fail(`${label}: "repo" must be a non-empty string`);
    return;
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`${label}: "repo" is not a valid URL: ${value}`);
    return;
  }
  if (url.protocol !== 'https:') fail(`${label}: "repo" must use https: ${value}`);
  if (url.hostname.toLowerCase() !== 'github.com') {
    fail(`${label}: "repo" host must be github.com, got "${url.hostname}"`);
  }
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 2) {
    fail(`${label}: "repo" path must be /<owner>/<repo>, got "${url.pathname}"`);
  } else if (segments[0].toLowerCase() !== REPO_OWNER) {
    fail(`${label}: "repo" owner must be "${REPO_OWNER}", got "${segments[0]}"`);
  }
  const lower = value.toLowerCase();
  for (const owner of REJECTED_OWNERS) {
    if (lower.includes(owner)) fail(`${label}: "repo" must not reference "${owner}": ${value}`);
  }
}

function validateProjects(data) {
  if (!Array.isArray(data) || data.length === 0) {
    fail('projects.json: expected a non-empty array');
    return new Set();
  }
  const slugs = new Set();
  const relatedByIndex = new Map();
  data.forEach((project, index) => {
    const label = `projects.json[${index}]${isNonEmptyString(project?.slug) ? ` (${project.slug})` : ''}`;
    if (!project || typeof project !== 'object' || Array.isArray(project)) {
      fail(`${label}: expected an object`);
      return;
    }
    for (const field of ['slug', 'name', 'summary']) {
      if (!isNonEmptyString(project[field])) fail(`${label}: "${field}" must be a non-empty string`);
    }
    // Optional Spanish translation of `summary`; when present it must be a
    // non-empty string so the es locale never renders an empty paragraph.
    if (project.summary_es !== undefined && !isNonEmptyString(project.summary_es)) {
      fail(`${label}: "summary_es" must be a non-empty string when present`);
    }
    if (!isNonEmptyString(project.slug) || !SLUG.test(project.slug)) {
      fail(`${label}: "slug" must be lowercase kebab-case`);
    } else if (slugs.has(project.slug)) {
      fail(`${label}: duplicate slug "${project.slug}"`);
    } else {
      slugs.add(project.slug);
    }
    if (!PROJECT_STATUSES.has(project.status)) {
      fail(`${label}: "status" must be one of ${[...PROJECT_STATUSES].join(', ')}`);
    }
    validateRepoUrl(project.repo, label);
    if (project.caseStudy !== null && !isNonEmptyString(project.caseStudy)) {
      fail(`${label}: "caseStudy" must be a non-empty string or null`);
    } else if (isNonEmptyString(project.caseStudy) && !existsSync(join(ROOT, project.caseStudy))) {
      fail(`${label}: "caseStudy" file not found: ${project.caseStudy}`);
    }
    if (!Array.isArray(project.tags) || !isStringArray(project.tags)) {
      fail(`${label}: "tags" must be an array of non-empty strings`);
    }
    if (!Array.isArray(project.related)) {
      fail(`${label}: "related" must be an array of project slugs`);
    } else if (!isStringArray(project.related)) {
      fail(`${label}: "related" must contain project slugs`);
    } else {
      relatedByIndex.set(index, project.related);
      if (project.related.includes(project.slug)) {
        fail(`${label}: "related" must not include itself`);
      }
    }
    if (!Array.isArray(project.screenshots) || !isStringArray(project.screenshots)) {
      fail(`${label}: "screenshots" must be an array of non-empty strings`);
    }
  });

  // Cross-links are checked once every slug is known.
  data.forEach((project, index) => {
    for (const related of relatedByIndex.get(index) ?? []) {
      if (!slugs.has(related)) {
        fail(`projects.json[${index}] (${project?.slug}): "related" slug "${related}" does not match any project`);
      }
    }
  });

  return slugs;
}

function validateEvolution(data, projectSlugs) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fail('evolution.json: expected an object with a "milestones" array');
    return;
  }
  if (!Array.isArray(data.milestones)) {
    fail('evolution.json: "milestones" must be an array');
    return;
  }
  const ids = new Set();
  data.milestones.forEach((milestone, index) => {
    const label = `evolution.json milestones[${index}]${isNonEmptyString(milestone?.id) ? ` (${milestone.id})` : ''}`;
    if (!milestone || typeof milestone !== 'object' || Array.isArray(milestone)) {
      fail(`${label}: expected an object`);
      return;
    }
    for (const field of ['id', 'date', 'title', 'narrative']) {
      if (!isNonEmptyString(milestone[field])) fail(`${label}: "${field}" must be a non-empty string`);
    }
    if (isNonEmptyString(milestone.id)) {
      if (!SLUG.test(milestone.id)) fail(`${label}: "id" must be lowercase kebab-case: ${milestone.id}`);
      if (ids.has(milestone.id)) fail(`${label}: duplicate milestone id "${milestone.id}"`);
      ids.add(milestone.id);
    }
    if (isNonEmptyString(milestone.date) && !isIsoDate(milestone.date)) {
      fail(`${label}: "date" must be a real ISO date (YYYY-MM-DD): ${milestone.date}`);
    }
    if (!MILESTONE_STATUSES.has(milestone.status)) {
      fail(`${label}: "status" must be one of ${[...MILESTONE_STATUSES].join(', ')}`);
    }
    if (!MILESTONE_SOURCES.has(milestone.source)) {
      fail(`${label}: "source" must be one of ${[...MILESTONE_SOURCES].join(', ')}`);
    }
    if (milestone.phase !== undefined) {
      if (!MILESTONE_PHASES.has(milestone.phase)) {
        fail(`${label}: "phase" must be one of ${[...MILESTONE_PHASES].join(', ')}`);
      } else if (milestone.status === 'planned' && milestone.phase !== 'frontier') {
        fail(`${label}: a "planned" milestone must sit in the "frontier" phase, not "${milestone.phase}"`);
      }
    }
    // `projects` is optional; when present every slug must resolve, otherwise
    // the "Related:" links would point at a page that does not exist.
    if (milestone.projects !== undefined) {
      if (!Array.isArray(milestone.projects) || !isStringArray(milestone.projects)) {
        fail(`${label}: "projects" must be an array of project slugs`);
      } else {
        if (milestone.projects.length === 0) {
          fail(`${label}: "projects" must list at least one slug or be omitted entirely`);
        }
        for (const slug of milestone.projects) {
          if (!projectSlugs.has(slug)) {
            fail(`${label}: "projects" slug "${slug}" does not match any project`);
          }
        }
      }
    }
    if (!Array.isArray(milestone.evidence) || milestone.evidence.length === 0) {
      fail(`${label}: "evidence" must be a non-empty array of URLs`);
    } else if (!isStringArray(milestone.evidence)) {
      fail(`${label}: "evidence" must contain non-empty strings`);
    } else {
      milestone.evidence.forEach((url, position) => {
        if (!isHttpUrl(url)) fail(`${label}: evidence[${position}] must be an https URL: ${url}`);
      });
    }
  });
}

/**
 * Every `github.com/<owner>/…` occurrence inside a case-study body or title must
 * name the canonical owner. This is the same rule the sync script enforces at
 * write time; repeating it here means a hand-edited file cannot smuggle a
 * legacy owner past the gate.
 */
function validateCanonicalUrls(text, label) {
  if (!isNonEmptyString(text)) return;
  const lower = text.toLowerCase();
  for (const owner of REJECTED_OWNERS) {
    if (lower.includes(`github.com/${owner}/`)) {
      fail(`${label}: GitHub URL must use ${REPO_OWNER}, found legacy owner "${owner}"`);
    }
  }
}

function validateCaseStudies(data, projectSlugs, projects) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fail('case-studies.json: expected an object with a "note" and "caseStudies"');
    return;
  }
  if (!isNonEmptyString(data.note)) fail('case-studies.json: "note" must be a non-empty string');
  if (!Array.isArray(data.caseStudies)) {
    fail('case-studies.json: "caseStudies" must be an array');
    return;
  }
  if (data.caseStudies.length === 0) {
    fail('case-studies.json: "caseStudies" must not be empty (every case-studies/*.md must be represented)');
  }

  const bySource = new Map();
  const fileSlugs = new Set();

  data.caseStudies.forEach((entry, index) => {
    const label = `case-studies.json caseStudies[${index}]${isNonEmptyString(entry?.fileSlug) ? ` (${entry.fileSlug})` : ''}`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      fail(`${label}: expected an object`);
      return;
    }
    for (const field of ['source', 'fileSlug', 'title']) {
      if (!isNonEmptyString(entry[field])) fail(`${label}: "${field}" must be a non-empty string`);
    }
    if (isNonEmptyString(entry.fileSlug)) {
      if (!SLUG.test(entry.fileSlug)) {
        fail(`${label}: "fileSlug" must be lowercase kebab-case: ${entry.fileSlug}`);
      } else if (fileSlugs.has(entry.fileSlug)) {
        fail(`${label}: duplicate "fileSlug" "${entry.fileSlug}"`);
      } else {
        fileSlugs.add(entry.fileSlug);
      }
    }
    if (isNonEmptyString(entry.source)) {
      if (!entry.source.startsWith('case-studies/') || !entry.source.endsWith('.md')) {
        fail(`${label}: "source" must be a case-studies/*.md path: ${entry.source}`);
      } else if (!existsSync(join(ROOT, entry.source))) {
        fail(`${label}: "source" file not found: ${entry.source}`);
      } else if (bySource.has(entry.source)) {
        fail(`${label}: duplicate "source" "${entry.source}"`);
      } else {
        bySource.set(entry.source, entry);
      }
    }
    // `null` is legal: an unmapped file is kept as a standalone entry rather
    // than dropped, so content is never silently lost.
    if (entry.projectSlug !== null) {
      if (!isNonEmptyString(entry.projectSlug)) {
        fail(`${label}: "projectSlug" must be a project slug or null`);
      } else if (!projectSlugs.has(entry.projectSlug)) {
        fail(`${label}: "projectSlug" "${entry.projectSlug}" does not match any project`);
      }
    }
    validateCanonicalUrls(entry.title, `${label} title`);

    if (!Array.isArray(entry.sections) || entry.sections.length === 0) {
      fail(`${label}: "sections" must be a non-empty array`);
      return;
    }
    entry.sections.forEach((section, position) => {
      const sectionLabel = `${label} sections[${position}]`;
      if (!section || typeof section !== 'object' || Array.isArray(section)) {
        fail(`${sectionLabel}: expected an object`);
        return;
      }
      for (const field of ['heading', 'body']) {
        if (!isNonEmptyString(section[field])) {
          fail(`${sectionLabel}: "${field}" must be a non-empty string`);
        }
      }
      if (isNonEmptyString(section.body)) validateCanonicalUrls(section.body, sectionLabel);
    });
  });

  // Mirror of the sync script's cross-check: a declared `caseStudy` path must
  // resolve to the entry that maps back to that same project.
  for (const project of projects) {
    if (!project || typeof project.caseStudy !== 'string' || project.caseStudy === '') continue;
    const entry = bySource.get(project.caseStudy);
    if (!entry) {
      fail(`projects.json (${project.slug}): caseStudy "${project.caseStudy}" has no case-studies.json entry`);
    } else if (entry.projectSlug !== project.slug) {
      fail(
        `projects.json (${project.slug}): caseStudy "${project.caseStudy}" maps to "${entry.projectSlug}" — the mapping and the project disagree`,
      );
    }
  }
}

function validateEvidence(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fail('evidence.json: expected an object with "note" and "items"');
    return;
  }
  if (!isNonEmptyString(data.note)) fail('evidence.json: "note" must be a non-empty string');
  if (!Array.isArray(data.items)) {
    fail('evidence.json: "items" must be an array');
    return;
  }
  data.items.forEach((item, index) => {
    const label = `evidence.json items[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      fail(`${label}: expected an object`);
      return;
    }
    for (const field of ['label', 'url', 'status']) {
      if (!isNonEmptyString(item[field])) fail(`${label}: "${field}" must be a non-empty string`);
    }
    if (isNonEmptyString(item.url) && !isHttpUrl(item.url)) fail(`${label}: "url" must be an https URL`);
  });
}

function main() {
  const profileRaw = readRaw('profile.json');
  const projectsRaw = readRaw('projects.json');
  const evolutionRaw = readRaw('evolution.json');
  const evidenceRaw = readRaw('evidence.json');
  const caseStudiesRaw = readRaw('case-studies.json');

  if (projectsRaw !== null) {
    const lower = projectsRaw.toLowerCase();
    for (const forbidden of FORBIDDEN_SUBSTRINGS) {
      if (lower.includes(forbidden)) {
        fail(`projects.json: forbidden substring "${forbidden}" found — private work must not be published here`);
      }
    }
  }

  const profile = profileRaw && parseJson('profile.json', profileRaw);
  const projects = projectsRaw && parseJson('projects.json', projectsRaw);
  const evolution = evolutionRaw && parseJson('evolution.json', evolutionRaw);
  const evidence = evidenceRaw && parseJson('evidence.json', evidenceRaw);
  const caseStudies = caseStudiesRaw && parseJson('case-studies.json', caseStudiesRaw);

  // projects.json is validated first: it owns the slug namespace every other
  // dataset cross-references.
  const projectSlugs = projects ? validateProjects(projects) : new Set();

  if (profile) validateProfile(profile);
  if (evolution) validateEvolution(evolution, projectSlugs);
  if (evidence) validateEvidence(evidence);
  if (caseStudies) validateCaseStudies(caseStudies, projectSlugs, projects ?? []);

  if (errors.length > 0) {
    console.error(`data:validate FAILED — ${errors.length} problem(s):`);
    for (const message of errors) console.error(`  ✗ ${message}`);
    process.exit(1);
  }

  const projectCount = projects.length;
  const milestoneCount = evolution.milestones.length;
  const evidenceCount = evidence.items.length;
  const caseStudyCount = caseStudies.caseStudies.length;
  console.log(
    `data:validate OK — profile 1, projects ${projectCount}, milestones ${milestoneCount}, evidence items ${evidenceCount}, case studies ${caseStudyCount}`,
  );
}

main();
