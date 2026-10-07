const locale = document.documentElement.lang === "es" ? "es" : "en";
const basePath = window.location.pathname.includes("/en/") || window.location.pathname.includes("/es/") ? "../" : "";
export const state = { snapshot: null, activity: null, activityLoading: true, catalog: null, filter: "all" };
const $ = (selector) => document.querySelector(selector);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function t(key) {
  return key.split(".").reduce((value, part) => value?.[part], state.catalog?.ui) || key;
}

function statusPill(status) {
  return element("span", `status-pill status-${status}`, state.catalog?.status?.[status] || status.replaceAll("_", " "));
}

function label(group, value) {
  return state.catalog?.ui?.[group]?.[value] || value.replaceAll("_", " ");
}

function renderClaims() {
  const grid = $("#claims-grid");
  grid.replaceChildren();
  const claims = state.snapshot.claims.filter((claim) => state.filter === "all" || claim.status === state.filter);
  if (!claims.length) {
    grid.append(element("p", "empty-state", t("no_filter_results")));
    return;
  }
  for (const claim of claims) {
    const copy = state.catalog.claims[claim.id] || {};
    const card = element("article", "claim-card");
    const topline = element("div", "card-topline");
    topline.append(element("span", "category-label", label("category", claim.category)), statusPill(claim.status));
    card.append(topline, element("p", "claim-text", copy.text || claim.text));
    if (copy.notes || claim.notes) card.append(element("p", "claim-note", copy.notes || claim.notes));
    grid.append(card);
  }
}

function renderProjects() {
  const grid = $("#projects-grid");
  grid.replaceChildren();
  for (const project of state.snapshot.projects) {
    const copy = state.catalog.projects[project.id] || {};
    const card = element("article", "project-card");
    const topline = element("div", "card-topline");
    topline.append(element("span", "category-label", label("project_maturity", project.maturity)), statusPill(project.evidence_level));
    card.append(topline, element("h3", null, copy.name || project.name), element("p", "project-meta", `${label("project_status", project.status)} · ${project.public ? t("public") : t("not_public")}`));
    const list = element("ul", "project-list");
    const items = project.capabilities_demonstrated.length ? project.capabilities_demonstrated : project.capabilities_not_demonstrated.slice(0, 3);
    for (const item of items) list.append(element("li", null, item));
    card.append(list);
    grid.append(card);
  }
}

function renderEvidence() {
  const grid = $("#evidence-grid");
  grid.replaceChildren();
  for (const evidence of state.snapshot.evidence) {
    const card = element("article", "evidence-card");
    card.append(element("span", "category-label", label("evidence_type", evidence.type)), element("h3", null, evidence.title));
    const supportKey = evidence.supports_claims.length === 1 ? "evidence_support_one" : "evidence_support_many";
    const supportText = t(supportKey).replace("{count}", evidence.supports_claims.length);
    const note = element("p", "evidence-meta", `${label("verification_status", evidence.verification_status)} · ${supportText}`);
    card.append(note, element("p", "evidence-summary", evidence.notes));
    const link = element("a", "evidence-link", t("view_evidence"));
    link.href = evidence.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    card.append(link);
    grid.append(card);
  }
}

function renderGoals() {
  const grid = $("#goals-grid");
  grid.replaceChildren();
  for (const [horizon, goal] of Object.entries(state.snapshot.goals)) {
    const copy = state.catalog.goals[horizon] || {};
    const card = element("article", "goal-card");
    card.append(element("span", "category-label", label("goal_horizon", horizon)), element("h3", null, copy.statement || goal.statement), element("p", null, copy.question || goal.open_questions[0] || t("open_review")), statusPill(goal.status));
    grid.append(card);
  }
}

export function renderGithubActivity() {
  const grid = $("#github-activity-grid");
  grid.replaceChildren();
  if (!state.activity) {
    grid.append(element("p", state.activityLoading ? "loading-state" : "error-state", t(state.activityLoading ? "github_activity_loading" : "github_activity_unavailable")));
    return;
  }
  const status = state.activity.status;
  grid.append(element("p", "activity-status", `${t("github_activity_status")}: ${label("activity_availability", status.availability)}${status.stale ? ` · ${t("github_activity_stale")}${status.stale_reason ? ` · ${status.stale_reason}` : ""}` : ""}`), element("p", "activity-meta", `${t("github_activity_captured")}: ${state.activity.captured_at}`), element("p", "activity-meta", `${t("github_activity_message")}: ${status.message}`));
  const source = element("a", "activity-source", `${t("github_activity_source")}: ${state.activity.source.url}`);
  source.href = state.activity.source.url;
  source.target = "_blank";
  source.rel = "noreferrer";
  grid.append(source);
  const objects = (state.activity.repositories || []).flatMap((repo) => ["pull_requests", "commits", "releases", "deployments"].flatMap((kind) => (repo[kind] || []).map((item) => ({ ...item, kind }))));
  if (!objects.length) grid.append(element("p", "empty-state", t("github_activity_empty")));
  for (const item of objects) {
    const card = element("article", "activity-card");
    card.append(element("span", "category-label", label("activity_kind", item.kind)), element("h3", null, item.title), element("p", "activity-meta", item.captured_at));
    const link = element("a", "evidence-link", t("github_activity_open"));
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    card.append(link);
    grid.append(card);
  }
  const repos = element("div", "activity-repositories");
  repos.append(element("strong", null, t("github_activity_allowlist")));
  for (const url of state.activity.allowed_repositories || []) {
    const link = element("a", "evidence-link", url.replace("https://github.com/", ""));
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    repos.append(link);
  }
  grid.append(repos);
}

function renderCommercialText() {
  for (const node of document.querySelectorAll("[data-ui-key]")) node.textContent = t(node.dataset.uiKey);
  for (const node of document.querySelectorAll("[data-ui-aria-key]")) node.setAttribute("aria-label", t(node.dataset.uiAriaKey));
}

function renderStaticText() {
  const map = {
    "#snapshot-version": `snapshot ${state.snapshot.schema_version} · ${state.catalog.status[state.snapshot.snapshot_status] || state.snapshot.snapshot_status}`,
    ".skip-link": t("skip_to_content"),
    '.primary-nav a[data-nav-key="evidence"]': t("evidence"),
    '.primary-nav a[data-nav-key="projects"]': t("nav_work"),
    '.primary-nav a[data-nav-key="professional_opportunities"]': t("nav_professional"),
    '.primary-nav a[data-nav-key="services_review"]': t("nav_services"),
    "[data-filter=all]": t("all_claims"),
    "[data-filter=demonstrated]": t("filter_demonstrated"),
    "[data-filter=developing]": t("filter_developing"),
    "[data-filter=aspirational]": t("filter_aspirational"),
    "[data-filter=insufficient_evidence]": t("filter_insufficient"),
    '[data-ui-key="full_stack_cloud"]': t("full_stack_cloud"),
    '[data-ui-key="ai_engineering"]': t("ai_engineering"),
    '[data-ui-key="ai_automation_agentic"]': t("ai_automation_agentic"),
    "#footer-snapshot-id": state.snapshot.snapshot_id,
    ".footer-meta a": t("source_repository"),
  };
  for (const [selector, text] of Object.entries(map)) {
    const node = $(selector);
    if (node) node.textContent = text;
  }
  document.title = state.catalog.meta.title;
  document.querySelector('meta[name="description"]').content = state.catalog.meta.description;
}

function showError(message) {
  for (const id of ["claims-grid", "projects-grid", "goals-grid"]) document.getElementById(id).replaceChildren(element("p", "error-state", message));
  $("#snapshot-version").textContent = t("snapshot_unavailable");
}

export async function boot({ snapshot, catalog, loadActivity } = {}) {
  state.activity = null;
  state.activityLoading = true;
  globalThis.window?.portfolioTheme?.connectToggle?.();
  document.querySelectorAll(".language-switcher a").forEach((link) => {
    if (link.getAttribute("lang") === locale) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    if (state.snapshot) renderClaims();
  }));
  const loadSnapshot = snapshot ? Promise.resolve(snapshot) : fetch(`${basePath}public-snapshot/snapshot.json`).then((response) => {
    if (!response.ok) throw new Error("snapshot");
    return response.json();
  });
  const loadCatalog = catalog ? Promise.resolve(catalog) : fetch(`${basePath}site/i18n/${locale}.json`).then((response) => {
    if (!response.ok) throw new Error("catalog");
    return response.json();
  });
  return Promise.all([loadSnapshot, loadCatalog]).then(([loadedSnapshot, loadedCatalog]) => {
    state.snapshot = loadedSnapshot;
    state.catalog = loadedCatalog;
    renderStaticText();
    renderCommercialText();
    renderClaims();
    renderProjects();
    renderEvidence();
    renderGoals();
    renderGithubActivity();
    const activityRequest = loadActivity ? loadActivity() : fetch(`${basePath}github-activity/snapshot.json`).then((response) => {
      if (!response.ok) throw new Error("activity");
      return response.json();
    });
    return activityRequest.then((activity) => {
      state.activity = activity;
      state.activityLoading = false;
      renderGithubActivity();
    }).catch(() => {
      state.activity = null;
      state.activityLoading = false;
      renderGithubActivity();
    });
  }).catch(() => {
    state.catalog = { ui: { snapshot_unavailable: "Snapshot unavailable", no_filter_results: "No claims match this evidence filter." }, status: {} };
    showError(t("snapshot_error"));
  });
}

if (!globalThis.__PORTFOLIO_TEST__) boot();
