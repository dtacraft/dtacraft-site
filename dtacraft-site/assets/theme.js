(() => {
  const STORAGE_KEY = 'theme';
  const LEGACY_STORAGE_KEYS = ['dtacraft_theme', 'site_theme'];
  const VALID_THEMES = new Set(['light', 'dark', 'system']);
  const DARK_COLOR = '#070a0f';
  const LIGHT_COLOR = '#f4f2ee';
  const mediaQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  let preferredTheme = 'system';

  const normalizeTheme = (value) => (VALID_THEMES.has(value) ? value : null);

  const getStoredTheme = () => {
    try {
      const stored = normalizeTheme(localStorage.getItem(STORAGE_KEY));
      if (stored) return stored;

      for (const key of LEGACY_STORAGE_KEYS) {
        const legacy = normalizeTheme(localStorage.getItem(key));
        if (legacy) return legacy;
      }
    } catch (_error) {
      // no-op when storage is blocked
    }

    return 'system';
  };

  const setStoredTheme = (theme) => {
    if (!VALID_THEMES.has(theme)) return;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
      for (const key of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
    } catch (_error) {
      // no-op when storage is blocked
    }
  };

  const getSystemTheme = () => {
    if (!mediaQuery) return 'dark';
    return mediaQuery.matches ? 'dark' : 'light';
  };

  const getAppliedTheme = () =>
    preferredTheme === 'system' ? getSystemTheme() : preferredTheme;

  const ensureToggleContents = (button) => {
    if (!button) return null;

    let icon = button.querySelector('.theme-icon');
    if (!icon) {
      icon = document.createElement('span');
      icon.className = 'theme-icon';
      icon.setAttribute('aria-hidden', 'true');
      button.prepend(icon);
    }

    let label = button.querySelector('.theme-label, [data-theme-label]');
    if (!label) {
      label = document.createElement('span');
      label.className = 'theme-label';
      label.setAttribute('data-theme-label', '');
      button.append(label);
    } else {
      label.classList.add('theme-label');
      label.setAttribute('data-theme-label', '');
    }

    return { icon, label };
  };

  const updateToggle = (button) => {
    const parts = ensureToggleContents(button);
    if (!parts) return;

    const appliedTheme = getAppliedTheme();
    const nextTheme = appliedTheme === 'dark' ? 'light' : 'dark';
    parts.icon.textContent = preferredTheme === 'system' ? '🖥️' : appliedTheme === 'light' ? '🌙' : '☀️';
    parts.label.textContent = `Theme: ${preferredTheme === 'system' ? 'System' : appliedTheme === 'light' ? 'Light' : 'Dark'}`;
    button.setAttribute('aria-pressed', String(appliedTheme === 'light'));
    button.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    button.setAttribute('title', 'Click: toggle light/dark · Shift+Click: use system theme');
  };

  const updateThemeColorMeta = (appliedTheme) => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', appliedTheme === 'light' ? LIGHT_COLOR : DARK_COLOR);
  };

  const renderTheme = () => {
    const appliedTheme = getAppliedTheme();
    document.documentElement.dataset.theme = appliedTheme;
    document.documentElement.dataset.themePreference = preferredTheme;
    updateThemeColorMeta(appliedTheme);
    document.querySelectorAll('[data-theme-toggle], #themeToggle').forEach(updateToggle);
  };

  const setTheme = (theme) => {
    const normalized = normalizeTheme(theme) || 'system';
    preferredTheme = normalized;
    setStoredTheme(normalized);
    renderTheme();
  };

  const toggleTheme = (event) => {
    if (event.shiftKey) {
      setTheme('system');
      return;
    }

    const appliedTheme = getAppliedTheme();
    setTheme(appliedTheme === 'dark' ? 'light' : 'dark');
  };

  const onToggleClick = (event) => {
    const toggle = event.target.closest('[data-theme-toggle], #themeToggle');
    if (!toggle) return;
    event.preventDefault();
    toggleTheme(event);
  };

  const initialize = () => {
    preferredTheme = getStoredTheme();
    renderTheme();

    document.addEventListener('click', onToggleClick);

    if (mediaQuery) {
      mediaQuery.addEventListener('change', () => {
        if (preferredTheme === 'system') renderTheme();
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
