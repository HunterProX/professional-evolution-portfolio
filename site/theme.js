(() => {
  const storageKey = "portfolio-theme";
  const root = document.documentElement;

  function readTheme() {
    try {
      return localStorage.getItem(storageKey) === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  }

  function updateToggle() {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;

    const light = root.dataset.theme === "light";
    const spanish = root.lang === "es";
    button.textContent = spanish ? (light ? "Tema claro" : "Tema oscuro") : (light ? "Light theme" : "Dark theme");
    button.setAttribute("aria-label", spanish
      ? (light ? "Tema claro activo. Cambiar a tema oscuro" : "Tema oscuro activo. Cambiar a tema claro")
      : (light ? "Light theme active. Switch to dark theme" : "Dark theme active. Switch to light theme"));
    button.setAttribute("aria-pressed", String(light));
  }

  function setTheme(theme) {
    const value = theme === "light" ? "light" : "dark";
    root.dataset.theme = value;
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // Keep the current page usable when storage is unavailable.
    }
    updateToggle();
  }

  function connectToggle() {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button || button.dataset.themeReady) return;

    button.dataset.themeReady = "true";
    button.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
    updateToggle();
  }

  root.dataset.theme = readTheme();
  window.portfolioTheme = { connectToggle, setTheme };
})();
