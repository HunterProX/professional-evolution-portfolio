#!/usr/bin/env node
/**
 * data-validate.mjs — gate for the canonical data layer (`data/*.json`).
 *
 * Usage: npm run data:validate
 *
 * Checks:
 *   - required fields and types for profile, projects, evolution, evidence
 *   - project status and milestone status/source enums
 *   - unique project slugs and unique milestone ids
 *   - every project `repo` URL lives under github.com/cristian-cardona-dev/
 *     (other owners such as HunterProX are rejected)
 *   - `personal-os` must not appear anywhere in projects.json
 *   - milestone dates are real ISO calendar dates
 *   - project `related` slugs resolve to declared projects
 *   - project `caseStudy` paths exist on disk
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
const MILESTONE_SOURCES = new Set(['curated', 'git']);

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
    return;
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
}

function validateEvolution(data) {
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
    const label = `evolution.json milestones[${index}]`;
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

  if (profile) validateProfile(profile);
  if (projects) validateProjects(projects);
  if (evolution) validateEvolution(evolution);
  if (evidence) validateEvidence(evidence);

  if (errors.length > 0) {
    console.error(`data:validate FAILED — ${errors.length} problem(s):`);
    for (const message of errors) console.error(`  ✗ ${message}`);
    process.exit(1);
  }

  const projectCount = projects.length;
  const milestoneCount = evolution.milestones.length;
  const evidenceCount = evidence.items.length;
  console.log(
    `data:validate OK — profile 1, projects ${projectCount}, milestones ${milestoneCount}, evidence items ${evidenceCount}`,
  );
}

main();
