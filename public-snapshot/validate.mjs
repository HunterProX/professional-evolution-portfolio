#!/usr/bin/env node
/**
 * public-snapshot validator
 *
 * Node built-ins only (node:fs, node:path, node:url). No dependencies.
 *
 * Usage:
 *   node public-snapshot/validate.mjs
 *   node public-snapshot/validate.mjs --file <path.json>
 *   node public-snapshot/validate.mjs --expect-invalid <path.json>
 *
 * Exit codes:
 *   0  valid (or, with --expect-invalid: the file was correctly rejected)
 *   1  validation failed (or, with --expect-invalid: the file was wrongly accepted)
 *   2  harness error (missing/unreadable file, bad arguments)
 *
 * Design rule: the validator encodes *conservative editorial policy*, not just
 * JSON shape. Over-claiming is an error, not a warning.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(HERE, 'schema.json');
const DEFAULT_SNAPSHOT = join(HERE, 'snapshot.json');

/* ------------------------------------------------------------------ *
 * Constants — mirrored in schema.json. Drift is detected at runtime.
 * ------------------------------------------------------------------ */

const CLAIM_STATUSES = ['demonstrated', 'developing', 'aspirational', 'insufficient_evidence'];
const CLAIM_STATUSES_REQUIRING_EVIDENCE = ['demonstrated'];
const CLAIM_CATEGORIES = ['capability', 'direction', 'project', 'negative'];
const EVIDENCE_VERIFICATION = ['verified_independent', 'verified_self_reported', 'unverified_self_reported'];
const EVIDENCE_TYPES = [
  'professional_profile',
  'code_repository',
  'live_demo',
  'publication',
  'certificate',
  'employer_attestation',
];
const PROJECT_STATUSES = ['planned', 'in_progress_prototype', 'in_progress', 'released'];
const PROJECT_MATURITIES = ['not_started', 'prototype', 'alpha', 'beta', 'released'];
const MATURITIES_REQUIRING_GAPS = ['not_started', 'prototype', 'alpha'];
const GOAL_STATUSES = ['draft', 'requires_human_review'];
const GOAL_HORIZONS = ['short', 'medium', 'long'];
const POSITIONING_STATUSES = ['aspirational', 'developing', 'demonstrated'];
const SNAPSHOT_STATUSES = ['draft', 'in_review', 'approved'];
const SCHEMA_VERSION = '1.0.0';

const TOP_LEVEL_REQUIRED = [
  '$schema',
  'schema_version',
  'snapshot_id',
  'generated_at',
  'snapshot_status',
  'requires_human_review',
  'purpose',
  'exclusions',
  'identity',
  'claim_status_semantics',
  'claims',
  'evidence',
  'projects',
  'goals',
  'disclaimers',
];

/** Keys that must never appear: they would carry unverified personal facts. */
const DENIED_KEYS = [
  'location',
  'city',
  'country',
  'address',
  'postal_code',
  'email',
  'e_mail',
  'phone',
  'mobile',
  'salary',
  'compensation',
  'rate',
  'hourly_rate',
  'employer',
  'employers',
  'company',
  'client',
  'clients',
  'customer',
  'customers',
  'language_level',
  'english_level',
  'proficiency',
  'years_of_experience',
];

/** Keys that would pin a draft goal to an invented date or number. */
const DENIED_GOAL_KEYS = [
  'target_date',
  'target_dates',
  'deadline',
  'due_date',
  'due',
  'start_date',
  'end_date',
  'timeline',
  'milestones',
  'metric',
  'metrics',
  'kpi',
  'kpis',
  'target_metric',
  'baseline',
];

/** Raw-text secret shapes. */
const SECRET_PATTERNS = [
  { code: 'SECRET_PRIVATE_KEY', re: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/ },
  { code: 'SECRET_SSH_KEY', re: /-----BEGIN OPENSSH PRIVATE KEY-----/ },
  { code: 'SECRET_OPENAI_KEY', re: /\bsk-[A-Za-z0-9_-]{16,}/ },
  { code: 'SECRET_GITHUB_TOKEN', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/ },
  { code: 'SECRET_AWS_KEY_ID', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { code: 'SECRET_SLACK_TOKEN', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { code: 'SECRET_JWT', re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\./ },
  { code: 'SECRET_ASSIGNED_CREDENTIAL', re: /["']?\b(?:api[_-]?key|secret|passwd|password|passphrase|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key|credential)s?["']?\s*[:=]\s*["']?[A-Za-z0-9_+/=-]{8,}/i },
];

/** Benign machine-set tokens removed before PII scanning. */
const BENIGN_TOKENS = [
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g, // ISO timestamp
  /\d{4}-\d{2}-\d{2}/g, // ISO date
  /\d{2}\/\d{2}\/\d{4}/g, // slash date
  /\b\d{1,2}:\d{2}(?::\d{2})?\b/g, // clock time
  /\bv?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\g/g, // semver
  /\b\d+\.\d+\b/g, // minor version / plain decimal
];

/** PII shapes applied to string values after benign tokens are stripped. */
const PII_PATTERNS = [
  { code: 'PII_EMAIL', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/ },
  { code: 'PII_EMAIL', re: /mailto:/i },
  { code: 'PII_PHONE_INTL', re: /\+\d[\d\s().-]{7,}\d/ },
  { code: 'PII_PHONE_GROUPED', re: /\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/ },
  { code: 'PII_IBAN', re: /\b[A-Z]{2}\d{2}[ ]?(?:[A-Z0-9]{4}[ ]?){2,6}[A-Z0-9]{1,4}\b/ },
  { code: 'PII_LONGCARD', re: /\b(?:\d[ -]*?){13,19}\b/ },
];

/**
 * Local or private filesystem paths.
 * `re`   — anchored, for scanning a single string value.
 * `loose` — unanchored, for scanning raw file text (quotes/indentation mean an
 *           anchored pattern will not match mid-line).
 */
const LOCAL_PATH_PATTERNS = [
  { code: 'PATH_WINDOWS_DRIVE', re: /^[A-Za-z]:[\\/]/, loose: /(?<![A-Za-z0-9])[A-Za-z]:[\\/]/ },
  { code: 'PATH_POSIX_ROOT', re: /^\/(?:home|Users|user|root|var|tmp|etc|opt|mnt|srv|private|Volumes|workspace|workspaces)\//, loose: /(?:^|[\s"'=(\[])\/(?:home|Users|user|root|var|tmp|etc|opt|mnt|srv|private|Volumes|workspace|workspaces)\// },
  { code: 'PATH_PARENT_ESCAPE', re: /(^|[\\/])\.\.([\\/]|$)/, loose: /(?:^|[\s"'=(\[])\.\.[\\/]/ },
  { code: 'PATH_FILE_URL', re: /^file:\/\//i, loose: /file:\/\//i },
  { code: 'PATH_UNC', re: /^\\\\/, loose: null },
];

/** Hosts that are not public. */
const PRIVATE_HOST_PATTERNS = [
  /^(?:localhost|localhost\.localdomain|127\.\d+\.\d+\.\d+|0\.0\.0\.0|::1|\[::1\])$/i,
  /^10\./,
  /^192\.168\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^[fF][cC][0-9A-Fa-f]{2}:/,
  /^[fF][eE][89abAB][0-9A-Fa-f]:/,
  /\.(?:local|internal|lan|home|corp|intranet|private|test|invalid|example)$/i,
];

/** Numeric or temporal assertions banned from draft goal prose. */
const GOAL_TEXT_BANS = [
  { code: 'GOAL_YEAR', re: /\b(?:19|20)\d{2}\b/, hint: 'Draft goals must not name a year.' },
  { code: 'GOAL_PERCENT', re: /%|percent|per cent/i, hint: 'Draft goals must not state a percentage.' },
  { code: 'GOAL_CURRENCY', re: /[$€£¥]|\b(?:USD|EUR|GBP)\b/, hint: 'Draft goals must not state money.' },
  {
    code: 'GOAL_DURATION',
    re: /\b\d+(?:\.\d+)?\s*(?:years?|yrs?|months?|mo|weeks?|wks?|days?|hours?|hrs?|quarters?)\b/i,
    hint: 'Draft goals must not state a duration.',
  },
  { code: 'GOAL_COUNT', re: /\b\d+\s+(?:projects?|clients?|customers?|repos?|repositories|artifacts?|people|engineers?|x\b)/i, hint: 'Draft goals must not state a count.' },
  { code: 'GOAL_BY_DATE', re: /\bby\s+(?:the\s+)?(?:end|start|close|beginning)\b|\bq[1-4]\b|\bnext\s+(?:week|month|quarter|year)\b/i, hint: 'Draft goals must not imply a deadline.' },
];

/* ------------------------------------------------------------------ *
 * Issue collection
 * ------------------------------------------------------------------ */

const issues = [];

function err(code, path, message, hint) {
  issues.push({ level: 'error', code, path, message, hint });
}
function warn(code, path, message, hint) {
  issues.push({ level: 'warning', code, path, message, hint });
}

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';

function readJson(path, label) {
  if (!existsSync(path)) {
    process.stderr.write(`HARNESS ERROR: ${label} not found at ${path}\n`);
    process.exit(2);
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    process.stderr.write(`HARNESS ERROR: ${label} is not valid JSON (${path})\n  ${e.message}\n`);
    process.exit(2);
  }
}

function requireObject(value, path) {
  if (!isObj(value)) {
    err('TYPE_OBJECT', path, `expected an object, got ${Array.isArray(value) ? 'array' : typeof value}`);
    return false;
  }
  return true;
}

/** Mirrors `additionalProperties: false` so an unexpected key is an error. */
function rejectUnknownKeys(obj, path, allowed) {
  if (!isObj(obj)) return;
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      err('KEY_UNKNOWN', path === '' ? key : `${path}.${key}`, `unexpected field "${key}"`, `Allowed: ${allowed.join(', ')}`);
    }
  }
}

function requireArray(value, path, { minItems = 0 } = {}) {
  if (!Array.isArray(value)) {
    err('TYPE_ARRAY', path, `expected an array, got ${typeof value}`);
    return false;
  }
  if (value.length < minItems) {
    err('ARRAY_TOO_SHORT', path, `expected at least ${minItems} item(s), found ${value.length}`);
    return false;
  }
  return true;
}

function requireString(value, path, { min = 1, max = 4000, pattern = null, patternHint = null } = {}) {
  if (!isStr(value)) {
    err('TYPE_STRING', path, `expected a string, got ${Array.isArray(value) ? 'array' : typeof value}`);
    return false;
  }
  const v = value.trim();
  if (v.length < min) {
    err('STRING_TOO_SHORT', path, `string is ${v.length} char(s), minimum is ${min}`);
    return false;
  }
  if (v.length > max) {
    err('STRING_TOO_LONG', path, `string is ${v.length} char(s), maximum is ${max}`);
    return false;
  }
  if (pattern && !pattern.test(v)) {
    err('STRING_PATTERN', path, `"${v}" does not match ${pattern}`, patternHint);
    return false;
  }
  return true;
}

function requireEnum(value, path, allowed, code) {
  if (!isStr(value) || !allowed.includes(value)) {
    err(code, path, `value ${JSON.stringify(value)} is not allowed`, `Allowed values: ${allowed.join(', ')}`);
    return false;
  }
  return true;
}

function requireBoolean(value, path, expected = null) {
  if (typeof value !== 'boolean') {
    err('TYPE_BOOLEAN', path, `expected a boolean, got ${typeof value}`);
    return false;
  }
  if (expected !== null && value !== expected) {
    err('VALUE_BOOLEAN', path, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
    return false;
  }
  return true;
}

function collectIds(list, pathRoot, prefix) {
  const ids = new Set();
  const seen = new Set();
  list.forEach((entry, i) => {
    if (!isObj(entry) || !isStr(entry.id)) return;
    const id = entry.id;
    if (seen.has(id)) {
      err('ID_DUPLICATE', `${pathRoot}[${i}].id`, `duplicate id "${id}"`, 'Ids must be unique across the whole document.');
      return;
    }
    seen.add(id);
    ids.add(id);
    if (!id.startsWith(prefix + '-')) {
      err('ID_PREFIX', `${pathRoot}[${i}].id`, `id "${id}" must start with "${prefix}-"`);
    }
  });
  return ids;
}

/* ------------------------------------------------------------------ *
 * URL policy
 * ------------------------------------------------------------------ */

function checkPublicHttpsUrl(value, path) {
  if (!isStr(value)) {
    err('TYPE_STRING', path, `expected a URL string, got ${typeof value}`);
    return null;
  }
  const raw = value.trim();
  if (!raw.startsWith('https://')) {
    if (raw.startsWith('http://')) {
      err('URL_SCHEME', path, 'http:// URLs are not allowed', 'Use https:// or drop the entry.');
    } else if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      err('URL_SCHEME', path, `scheme "${raw.split(':')[0]}" is not allowed`, 'Only https:// URLs are allowed.');
    } else {
      err('URL_NOT_ABSOLUTE', path, `"${raw}" is not an absolute https URL`, 'Local and relative paths are not admissible evidence.');
    }
    return null;
  }
  let u;
  try {
    u = new URL(raw);
  } catch {
    err('URL_INVALID', path, `"${raw}" is not a parseable URL`);
    return null;
  }
  if (u.protocol !== 'https:') {
    err('URL_SCHEME', path, `scheme "${u.protocol}" is not allowed`);
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (!host || !host.includes('.') || /^\d+$/.test(host)) {
    err('URL_HOST', path, `"${host}" is not a public DNS hostname`);
    return null;
  }
  for (const re of PRIVATE_HOST_PATTERNS) {
    if (re.test(host)) {
      err('URL_PRIVATE_HOST', path, `host "${host}" is loopback, link-local or private`, 'Evidence must be reachable on the public internet.');
      return null;
    }
  }
  if (u.username || u.password) {
    err('URL_CREDENTIALS', path, 'URL contains embedded credentials', 'Never inline credentials in an evidence URL.');
    return null;
  }
  return u;
}

/* ------------------------------------------------------------------ *
 * Global text policy (secrets, PII, local paths, http leakage)
 * ------------------------------------------------------------------ */

function stripBenign(text) {
  let out = text;
  for (const re of BENIGN_TOKENS) out = out.replace(new RegExp(re.source, re.flags), ' ');
  return out;
}

function scanString(value, path) {
  const text = stripBenign(value);
  for (const { code, re } of SECRET_PATTERNS) {
    if (re.test(value)) {
      err(code, path, 'value matches a credential/secret pattern', 'Remove the credential. If this was real, rotate it immediately.');
      break;
    }
  }
  for (const { code, re } of PII_PATTERNS) {
    if (re.test(text)) {
      err(code, path, 'value matches a personal-data pattern', 'This snapshot must carry no contact details or personal identifiers.');
      break;
    }
  }
}

function walk(node, path, { inGoals = false } = {}) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`, { inGoals }));
    return;
  }
  if (!isObj(node)) {
    if (isStr(node) && path !== '$schema') scanString(node, path);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    const childPath = path === '' ? key : `${path}.${key}`;
    const lower = key.toLowerCase();
    if (DENIED_KEYS.includes(lower)) {
      err('KEY_DENIED', childPath, `key "${key}" is not allowed in a public snapshot`, 'Personal facts (location, employer, client, contact, language level, tenure) stay out of this file.');
      continue;
    }
    if (inGoals && DENIED_GOAL_KEYS.includes(lower)) {
      err('GOAL_KEY_DENIED', childPath, `key "${key}" is not allowed on a draft goal`, 'Draft goals cannot carry dates, deadlines, metrics or targets.');
      continue;
    }
    if (key === '$schema') {
      if (value !== './schema.json') {
        err('SCHEMA_REF', childPath, `unexpected schema reference ${JSON.stringify(value)}`, 'Expected "./schema.json".');
      }
      continue;
    }
    walk(value, childPath, { inGoals: inGoals || (path === 'goals' ? true : inGoals) });
  }
}

/* ------------------------------------------------------------------ *
 * Structural + policy validation
 * ------------------------------------------------------------------ */

const CLAIM_FIELDS = ['id', 'text', 'category', 'status', 'evidence_refs', 'notes'];
const EVIDENCE_FIELDS = ['id', 'type', 'title', 'url', 'public', 'verification_status', 'supports_claims', 'notes'];
const PROJECT_FIELDS = [
  'id', 'name', 'status', 'maturity', 'public', 'public_urls',
  'evidence_level', 'claim_refs', 'capabilities_demonstrated',
  'capabilities_not_demonstrated', 'notes',
];
const GOAL_FIELDS = ['horizon', 'status', 'requires_human_review', 'statement', 'success_criteria', 'open_questions'];
const IDENTITY_FIELDS = ['professional_name', 'positioning', 'positioning_status', 'positioning_notes', 'public_urls'];

function validateClaims(doc) {
  if (!requireArray(doc.claims, 'claims', { minItems: 1 })) return;
  doc.claims.forEach((claim, i) => {
    const p = `claims[${i}]`;
    if (!requireObject(claim, p)) return;
    for (const key of CLAIM_FIELDS) {
      if (!(key in claim)) err('FIELD_MISSING', `${p}.${key}`, `required field "${key}" is missing`);
    }
    rejectUnknownKeys(claim, p, CLAIM_FIELDS);
    requireString(claim.id, `${p}.id`, { min: 3, max: 80, pattern: /^claim-[a-z0-9]+(?:-[a-z0-9]+)*$/, patternHint: 'Use lowercase kebab-case starting with "claim-".' });
    requireString(claim.text, `${p}.text`, { min: 10, max: 400 });
    requireEnum(claim.category, `${p}.category`, CLAIM_CATEGORIES, 'CLAIM_CATEGORY');
    requireEnum(claim.status, `${p}.status`, CLAIM_STATUSES, 'CLAIM_STATUS');
    requireString(claim.notes, `${p}.notes`, { min: 10 });
    if (requireArray(claim.evidence_refs, `${p}.evidence_refs`)) {
      claim.evidence_refs.forEach((ref, j) => requireString(ref, `${p}.evidence_refs[${j}]`, { min: 3 }));
      if (CLAIM_STATUSES_REQUIRING_EVIDENCE.includes(claim.status) && claim.evidence_refs.length === 0) {
        err(
          'CLAIM_EVIDENCE_REQUIRED',
          `${p}.evidence_refs`,
          `claim status "${claim.status}" requires at least one evidence reference`,
          'Add a public https evidence entry, or downgrade the status to developing / aspirational / insufficient_evidence.'
        );
      }
    }
  });
}

function validateEvidence(doc, claimIds) {
  if (!requireArray(doc.evidence, 'evidence')) return [];
  doc.evidence.forEach((ev, i) => {
    const p = `evidence[${i}]`;
    if (!requireObject(ev, p)) return;
    for (const key of EVIDENCE_FIELDS) {
      if (!(key in ev)) err('FIELD_MISSING', `${p}.${key}`, `required field "${key}" is missing`);
    }
    rejectUnknownKeys(ev, p, EVIDENCE_FIELDS);
    requireString(ev.id, `${p}.id`, { min: 3, max: 80, pattern: /^ev-[a-z0-9]+(?:-[a-z0-9]+)*$/, patternHint: 'Use lowercase kebab-case starting with "ev-".' });
    requireEnum(ev.type, `${p}.type`, EVIDENCE_TYPES, 'EVIDENCE_TYPE');
    requireString(ev.title, `${p}.title`, { min: 3, max: 200 });
    checkPublicHttpsUrl(ev.url, `${p}.url`);
    requireBoolean(ev.public, `${p}.public`, true);
    requireEnum(ev.verification_status, `${p}.verification_status`, EVIDENCE_VERIFICATION, 'EVIDENCE_VERIFICATION');
    requireString(ev.notes, `${p}.notes`, { min: 10 });
    if (requireArray(ev.supports_claims, `${p}.supports_claims`)) {
      ev.supports_claims.forEach((ref, j) => {
        if (requireString(ref, `${p}.supports_claims[${j}]`, { min: 3 })) {
          if (claimIds && !claimIds.has(ref)) {
            err('REF_UNKNOWN', `${p}.supports_claims[${j}]`, `"${ref}" does not match any claims[].id`);
          }
        }
      });
    }
  });
  return collectIds(doc.evidence, 'evidence', 'ev');
}

function crossCheckClaimEvidence(doc, claimIds, evidenceIds) {
  const byClaim = new Map();
  if (Array.isArray(doc.claims)) {
    doc.claims.forEach((c) => {
      if (isObj(c) && Array.isArray(c.evidence_refs)) byClaim.set(c.id, c.evidence_refs);
    });
  }
  const reciprocated = new Set();
  if (Array.isArray(doc.evidence)) {
    doc.evidence.forEach((ev) => {
      if (!isObj(ev) || !Array.isArray(ev.supports_claims)) return;
      ev.supports_claims.forEach((cid) => {
        if (byClaim.has(cid)) reciprocated.add(`${cid}->${ev.id}`);
      });
    });
  }
  byClaim.forEach((refs, cid) => {
    refs.forEach((rid) => {
      if (!evidenceIds.has(rid)) {
        err('REF_UNKNOWN', `claims[id=${cid}].evidence_refs`, `"${rid}" does not match any evidence[].id`);
      } else if (!reciprocated.has(`${cid}->${rid}`)) {
        warn(
          'REF_NOT_RECIPROCAL',
          `claims[id=${cid}].evidence_refs`,
          `evidence "${rid}" does not list claim "${cid}" in supports_claims`,
          'Keep both directions in sync so the graph stays traversable in either direction.'
        );
      }
    });
  });
}

function validateProjects(doc, claimIds) {
  if (!requireArray(doc.projects, 'projects', { minItems: 1 })) return;
  const projectIds = collectIds(doc.projects, 'projects', 'proj');
  doc.projects.forEach((pr, i) => {
    const p = `projects[${i}]`;
    if (!requireObject(pr, p)) return;
    for (const key of PROJECT_FIELDS) {
      if (!(key in pr)) err('FIELD_MISSING', `${p}.${key}`, `required field "${key}" is missing`);
    }
    rejectUnknownKeys(pr, p, PROJECT_FIELDS);
    requireString(pr.id, `${p}.id`, { min: 3, max: 80, pattern: /^proj-[a-z0-9]+(?:-[a-z0-9]+)*$/, patternHint: 'Use lowercase kebab-case starting with "proj-".' });
    requireString(pr.name, `${p}.name`, { min: 2, max: 120 });
    requireEnum(pr.status, `${p}.status`, PROJECT_STATUSES, 'PROJECT_STATUS');
    requireEnum(pr.maturity, `${p}.maturity`, PROJECT_MATURITIES, 'PROJECT_MATURITY');
    requireEnum(pr.evidence_level, `${p}.evidence_level`, CLAIM_STATUSES, 'EVIDENCE_LEVEL');
    requireString(pr.notes, `${p}.notes`, { min: 10 });

    if (typeof pr.public === 'boolean' && Array.isArray(pr.public_urls)) {
      if (pr.public === true && pr.public_urls.length === 0) {
        err('PROJECT_PUBLIC_NO_URL', `${p}.public_urls`, 'public is true but public_urls is empty', 'A public project needs at least one public https URL, or set public to false.');
      }
      if (pr.public === false && pr.public_urls.length > 0) {
        err('PROJECT_PRIVATE_WITH_URL', `${p}.public_urls`, 'public is false but public_urls is not empty', 'Not-yet-public work must not carry public URLs.');
      }
    }
    pr.public_urls?.forEach((u, j) => checkPublicHttpsUrl(u, `${p}.public_urls[${j}]`));

    if (requireArray(pr.claim_refs, `${p}.claim_refs`, { minItems: 1 })) {
      pr.claim_refs.forEach((ref, j) => {
        if (requireString(ref, `${p}.claim_refs[${j}]`, { min: 3 }) && claimIds && !claimIds.has(ref)) {
          err('REF_UNKNOWN', `${p}.claim_refs[${j}]`, `"${ref}" does not match any claims[].id`);
        }
      });
    }

    const gaps = pr.capabilities_not_demonstrated;
    if (Array.isArray(gaps) && MATURITIES_REQUIRING_GAPS.includes(pr.maturity) && gaps.length === 0) {
      err(
        'PROJECT_GAPS_MISSING',
        `${p}.capabilities_not_demonstrated`,
        `maturity "${pr.maturity}" requires an explicit list of what is NOT demonstrated`,
        'Prototype and planned work must state its gaps; silence reads as completeness.'
      );
    }

    // Prototype work may never be dressed up as production.
    if (pr.maturity === 'prototype' && pr.evidence_level === 'demonstrated') {
      err(
        'PROJECT_OVERCLAIM',
        `${p}.evidence_level`,
        'a prototype cannot carry evidence_level "demonstrated"',
        'Use "developing" at most, or publish the artifact and raise the level with review.'
      );
    }
  });

  // Identity public_urls should be backed by an evidence entry.
  const evidenceUrls = new Set(
    (doc.evidence || []).filter(isObj).map((e) => (isStr(e.url) ? e.url.trim().replace(/\/$/, '') : null)).filter(Boolean)
  );
  const idu = doc.identity?.public_urls;
  if (Array.isArray(idu)) {
    idu.forEach((u, j) => {
      if (isStr(u) && !evidenceUrls.has(u.trim().replace(/\/$/, ''))) {
        warn(
          'IDENTITY_URL_UNBACKED',
          `identity.public_urls[${j}]`,
          'this URL does not appear in evidence[].url',
          'Either add the matching evidence entry or remove the URL from identity.'
        );
      }
    });
  }
  return projectIds;
}

function validateGoals(doc) {
  const goals = doc.goals;
  if (!requireObject(goals, 'goals')) return;
  for (const h of GOAL_HORIZONS) {
    const p = `goals.${h}`;
    if (!(h in goals)) {
      err('FIELD_MISSING', p, `missing required goal horizon "${h}"`);
      continue;
    }
    const g = goals[h];
    if (!requireObject(g, p)) continue;
    for (const key of GOAL_FIELDS) {
      if (!(key in g)) err('FIELD_MISSING', `${p}.${key}`, `required field "${key}" is missing`);
    }
    // Denied goal keys (dates, metrics, targets) are reported by walk() with a
    // policy message; allowlist the rest so nothing else sneaks in.
    rejectUnknownKeys(
      g,
      p,
      GOAL_FIELDS.filter((k) => !DENIED_GOAL_KEYS.includes(k.toLowerCase()))
    );
    requireEnum(g.horizon, `${p}.horizon`, GOAL_HORIZONS, 'GOAL_HORIZON');
    if (g.horizon !== h) {
      err('GOAL_HORIZON_MISMATCH', `${p}.horizon`, `"${g.horizon}" must equal its slot "${h}"`);
    }
    requireEnum(g.status, `${p}.status`, GOAL_STATUSES, 'GOAL_STATUS');
    requireBoolean(g.requires_human_review, `${p}.requires_human_review`, true);
    if (requireString(g.statement, `${p}.statement`, { min: 20, max: 400 })) {
      for (const { code, re, hint } of GOAL_TEXT_BANS) {
        if (re.test(g.statement)) {
          err(code, `${p}.statement`, `goal statement matches a banned assertion pattern ${re}`, hint);
        }
      }
    }
    if (requireArray(g.success_criteria, `${p}.success_criteria`)) {
      g.success_criteria.forEach((s, j) => requireString(s, `${p}.success_criteria[${j}]`, { min: 5 }));
    }
    if (requireArray(g.open_questions, `${p}.open_questions`)) {
      g.open_questions.forEach((s, j) => requireString(s, `${p}.open_questions[${j}]`, { min: 5 }));
    }
  }
  for (const key of Object.keys(goals)) {
    if (!GOAL_HORIZONS.includes(key)) {
      err('GOAL_UNKNOWN_HORIZON', `goals.${key}`, `unknown goal horizon "${key}"`, `Allowed: ${GOAL_HORIZONS.join(', ')}`);
    }
  }
}

function validateIdentity(doc) {
  const p = 'identity';
  if (!requireObject(doc.identity, p)) return;
  for (const key of ['professional_name', 'positioning', 'positioning_status', 'positioning_notes', 'public_urls']) {
    if (!(key in doc.identity)) err('FIELD_MISSING', `${p}.${key}`, `required field "${key}" is missing`);
  }
  requireString(doc.identity.professional_name, `${p}.professional_name`, { min: 2, max: 120 });
  rejectUnknownKeys(doc.identity, p, IDENTITY_FIELDS);
  requireString(doc.identity.positioning, `${p}.positioning`, { min: 10, max: 300 });
  requireEnum(doc.identity.positioning_status, `${p}.positioning_status`, POSITIONING_STATUSES, 'POSITIONING_STATUS');
  requireString(doc.identity.positioning_notes, `${p}.positioning_notes`, { min: 10 });
  if (requireArray(doc.identity.public_urls, `${p}.public_urls`, { minItems: 1 })) {
    doc.identity.public_urls.forEach((u, j) => checkPublicHttpsUrl(u, `${p}.public_urls[${j}]`));
  }
}

function validateTopLevel(doc, schema) {
  if (!requireObject(doc, '$')) return;
  for (const key of TOP_LEVEL_REQUIRED) {
    if (!(key in doc)) err('FIELD_MISSING', `$.${key}`, `required field "${key}" is missing`);
  }
  if ('schema_version' in doc) requireEnum(doc.schema_version, '$.schema_version', [SCHEMA_VERSION], 'SCHEMA_VERSION');
  if ('snapshot_status' in doc) requireEnum(doc.snapshot_status, '$.snapshot_status', SNAPSHOT_STATUSES, 'SNAPSHOT_STATUS');
  if ('requires_human_review' in doc) requireBoolean(doc.requires_human_review, '$.requires_human_review', true);
  requireString(doc.snapshot_id, '$.snapshot_id', { min: 3, max: 80, pattern: /^[a-z0-9][a-z0-9-]*$/, patternHint: 'Use lowercase kebab-case.' });
  requireString(doc.generated_at, '$.generated_at', {
    min: 20,
    max: 32,
    pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    patternHint: 'Use an ISO-8601 UTC timestamp, e.g. 2026-01-31T00:00:00Z.',
  });
  if (isStr(doc.purpose)) requireString(doc.purpose, '$.purpose', { min: 20 });
  if (requireArray(doc.exclusions, '$.exclusions', { minItems: 1 })) {
    doc.exclusions.forEach((s, j) => requireString(s, `$.exclusions[${j}]`, { min: 10 }));
  }
  if (requireArray(doc.disclaimers, '$.disclaimers', { minItems: 1 })) {
    doc.disclaimers.forEach((s, j) => requireString(s, `$.disclaimers[${j}]`, { min: 10 }));
  }
  if (isObj(doc.claim_status_semantics)) {
    for (const s of CLAIM_STATUSES) {
      if (!(s in doc.claim_status_semantics)) {
        err('SEMANTICS_MISSING', `$.claim_status_semantics.${s}`, `no definition provided for status "${s}"`);
      } else {
        requireString(doc.claim_status_semantics[s], `$.claim_status_semantics.${s}`, { min: 10 });
      }
    }
  } else {
    err('TYPE_OBJECT', '$.claim_status_semantics', 'expected an object defining each claim status');
  }
  for (const key of Object.keys(doc)) {
    if (!TOP_LEVEL_REQUIRED.includes(key)) {
      err('KEY_UNKNOWN', `$.${key}`, `unexpected top-level field "${key}"`, `Allowed: ${TOP_LEVEL_REQUIRED.join(', ')}`);
    }
  }
  if (isObj(schema)) {
    const declared = schema.properties?.schema_version?.const;
    if (declared !== doc.schema_version) {
      err('SCHEMA_VERSION_DRIFT', '$.schema_version', `snapshot says ${JSON.stringify(doc.schema_version)}, schema declares ${JSON.stringify(declared)}`);
    }
  }
}

/**
 * Guard against validator/schema drift: the allowed sets used above must match
 * the enums declared in schema.json, otherwise the schema lies to consumers.
 */
function validateSchemaAgreement(schema) {
  const p = 'schema.json';
  if (!isObj(schema)) {
    err('SCHEMA_UNREADABLE', p, 'schema must be a JSON object');
    return;
  }
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    err('SCHEMA_DIALECT', `${p}.$schema`, `expected the 2020-12 dialect, got ${JSON.stringify(schema.$schema)}`);
  }
  const pairs = [
    ['claim.status', schema.$defs?.claim?.properties?.status?.enum, CLAIM_STATUSES],
    ['claim.category', schema.$defs?.claim?.properties?.category?.enum, CLAIM_CATEGORIES],
    ['evidence.type', schema.$defs?.evidence?.properties?.type?.enum, EVIDENCE_TYPES],
    ['evidence.verification_status', schema.$defs?.evidence?.properties?.verification_status?.enum, EVIDENCE_VERIFICATION],
    ['project.status', schema.$defs?.project?.properties?.status?.enum, PROJECT_STATUSES],
    ['project.maturity', schema.$defs?.project?.properties?.maturity?.enum, PROJECT_MATURITIES],
    ['project.evidence_level', schema.$defs?.project?.properties?.evidence_level?.enum, CLAIM_STATUSES],
    ['goal.status', schema.$defs?.goal?.properties?.status?.enum, GOAL_STATUSES],
    ['goal.horizon', schema.$defs?.goal?.properties?.horizon?.enum, GOAL_HORIZONS],
    ['identity.positioning_status', schema.$defs?.identity?.properties?.positioning_status?.enum, POSITIONING_STATUSES],
    ['snapshot_status', schema.properties?.snapshot_status?.enum, SNAPSHOT_STATUSES],
    ['schema_version', [schema.properties?.schema_version?.const], [SCHEMA_VERSION]],
  ];
  for (const [name, declared, expected] of pairs) {
    if (!Array.isArray(declared)) {
      err('SCHEMA_ENUM_MISSING', `${p}#${name}`, 'enum is not declared in the schema', 'Declare it so external tooling sees the same vocabulary.');
      continue;
    }
    const a = [...declared].sort().join(',');
    const b = [...expected].sort().join(',');
    if (a !== b) {
      err('SCHEMA_ENUM_DRIFT', `${p}#${name}`, `schema declares [${a}] but validator enforces [${b}]`);
    }
  }
  const goalProps = Object.keys(schema.$defs?.goal?.properties || {});
  for (const denied of DENIED_GOAL_KEYS) {
    if (goalProps.includes(denied)) {
      err('SCHEMA_GOAL_LEAK', `${p}#goal.properties.${denied}`, `the schema permits "${denied}" on a goal`, 'Draft goals must not be able to carry dates or metrics.');
    }
  }
}

function validateSnapshot(doc, schema, { scanRaw = null } = {}) {
  validateSchemaAgreement(schema);
  validateTopLevel(doc, schema);
  validateIdentity(doc);
  validateClaims(doc);
  const claimIds = collectIds(Array.isArray(doc.claims) ? doc.claims : [], 'claims', 'claim');
  const evidenceIds = validateEvidence(doc, claimIds);
  crossCheckClaimEvidence(doc, claimIds, evidenceIds);
  validateProjects(doc, claimIds);
  validateGoals(doc);
  walk(doc, '');
  if (isStr(scanRaw)) {
    for (const { code, re } of SECRET_PATTERNS) {
      if (re.test(scanRaw)) {
        err(code, '(raw file text)', 'the file contains a credential-shaped string', 'Remove the credential. If this was real, rotate it immediately.');
        break;
      }
    }
    for (const { code, loose } of LOCAL_PATH_PATTERNS) {
      if (!loose) continue;
      if (new RegExp(loose.source, loose.flags + 'm').test(stripBenign(scanRaw))) {
        err('PATH_LOCAL', '(raw file text)', `file text contains a local/private path shape (${code})`, 'Private filesystem paths must never appear as evidence; use a public https URL or drop the field.');
        break;
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Reporting
 * ------------------------------------------------------------------ */

function printReport(target, errors, warnings) {
  const lines = [];
  lines.push(`public-snapshot validator — ${target}`);
  lines.push('='.repeat(72));
  if (errors.length === 0) {
    lines.push('RESULT: PASS');
    lines.push('No blocking problems found.');
  } else {
    lines.push(`RESULT: FAIL — ${errors.length} error(s), ${warnings.length} warning(s)`);
    lines.push('');
    for (const e of errors) {
      lines.push(`  ERROR   ${e.code}  at ${e.path}`);
      lines.push(`          ${e.message}`);
      if (e.hint) lines.push(`          fix: ${e.hint}`);
    }
    if (warnings.length) {
      lines.push('');
      lines.push('  Warnings (non-blocking):');
      for (const w of warnings) {
        lines.push(`  WARNING ${w.code}  at ${w.path}`);
        lines.push(`          ${w.message}`);
        if (w.hint) lines.push(`          fix: ${w.hint}`);
      }
    }
    lines.push('');
    lines.push('  Next steps:');
    lines.push('    1. Fix every ERROR above, highest code first.');
    lines.push('    2. Re-run: node public-snapshot/validate.mjs');
    lines.push('    3. Any remaining WARNING can be accepted deliberately, or fixed.');
  }
  lines.push('');
  process.stdout.write(lines.join('\n'));
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opts = { target: DEFAULT_SNAPSHOT, expectInvalid: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') {
      if (!argv[i + 1]) { process.stderr.write('HARNESS ERROR: --file needs a path\n'); process.exit(2); }
      opts.target = resolve(argv[++i]);
      opts.expectInvalid = false;
    } else if (a === '--expect-invalid') {
      if (!argv[i + 1]) { process.stderr.write('HARNESS ERROR: --expect-invalid needs a path\n'); process.exit(2); }
      opts.target = resolve(argv[++i]);
      opts.expectInvalid = true;
    } else if (a === '--help' || a === '-h') {
      process.stdout.write(
        'Usage:\n' +
        '  node public-snapshot/validate.mjs\n' +
        '  node public-snapshot/validate.mjs --file <path.json>\n' +
        '  node public-snapshot/validate.mjs --expect-invalid <path.json>\n'
      );
      process.exit(0);
    } else {
      process.stderr.write(`HARNESS ERROR: unknown argument "${a}" (try --help)\n`);
      process.exit(2);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const schema = readJson(SCHEMA_PATH, 'schema.json');
const doc = readJson(opts.target, 'snapshot');
const raw = readFileSync(opts.target, 'utf8');

issues.length = 0;
validateSnapshot(doc, schema, { scanRaw: raw });

const errors = issues.filter((i) => i.level === 'error');
const warnings = issues.filter((i) => i.level === 'warning');
const relativeTarget = opts.target.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');

if (opts.expectInvalid) {
  if (errors.length === 0) {
    printReport(relativeTarget, errors, warnings);
    process.stdout.write('RESULT: BROKEN FIXTURE — this file was accepted but was expected to be rejected.\n');
    process.exit(1);
  }
  printReport(relativeTarget, errors, warnings);
  process.stdout.write(
    `RESULT: FIXTURE OK — rejected as expected (${errors.length} error(s), ${warnings.length} warning(s)).\n`
  );
  process.exit(0);
}

printReport(relativeTarget, errors, warnings);
if (errors.length === 0) {
  process.stdout.write(
    `Counts: ${(doc.claims || []).length} claim(s), ${(doc.evidence || []).length} evidence entr(y/ies), ` +
      `${(doc.projects || []).length} project(s), 3 goal horizon(s).\n`
  );
}
process.exit(errors.length === 0 ? 0 : 1);