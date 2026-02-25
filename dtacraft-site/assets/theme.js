(() => {
  const STORAGE_KEY = 'dtacraft_theme';
  const DARK_COLOR = '#070a0f';
  const LIGHT_COLOR = '#f4f2ee';

  const safeGet = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_err) {
      return null;
    }
  };

  const safeSet = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (_err) {
      /* no-op when storage is blocked */
    }
  };

  const getPreferredTheme = () => {
    const saved = safeGet();
    if (saved === 'light' || saved === 'dark') return saved;

    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    return 'dark';
  };

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

  const updateToggle = (button, theme) => {
    const parts = ensureToggleContents(button);
    if (!parts) return;

    const isLight = theme === 'light';
    const nextThemeLabel = isLight ? 'Dark' : 'Light';
    parts.label.textContent = nextThemeLabel;
    parts.icon.textContent = isLight ? '🌙' : '☀️';
    button.setAttribute('aria-pressed', String(isLight));
    button.setAttribute('aria-label', `Switch to ${nextThemeLabel} theme`);
  };

  const applyTheme = (theme) => {
    const normalizedTheme = theme === 'light' ? 'light' : 'dark';
    const isLight = normalizedTheme === 'light';
    document.documentElement.setAttribute('data-theme', normalizedTheme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isLight ? LIGHT_COLOR : DARK_COLOR);

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      updateToggle(button, normalizedTheme);
    });
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    safeSet(next);
    applyTheme(next);
  };

  const initialize = () => {
    applyTheme(getPreferredTheme());

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', toggleTheme);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
