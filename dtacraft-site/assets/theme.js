(() => {
  const STORAGE_KEY = 'dtacraft_theme';
  const LEGACY_STORAGE_KEYS = ['theme', 'site_theme'];
  const COOKIE_KEY = 'dtacraft_theme';
  const DARK_COLOR = '#070a0f';
  const LIGHT_COLOR = '#f4f2ee';

  const safeGet = () => {
    try {
      const primary = localStorage.getItem(STORAGE_KEY);
      if (primary === 'light' || primary === 'dark') return primary;

      for (const key of LEGACY_STORAGE_KEYS) {
        const legacyValue = localStorage.getItem(key);
        if (legacyValue === 'light' || legacyValue === 'dark') return legacyValue;
      }

      return null;
    } catch (_err) {
      return null;
    }
  };

  const readCookieTheme = () => {
    try {
      const pairs = document.cookie ? document.cookie.split(';') : [];
      for (const pair of pairs) {
        const [rawKey, rawValue = ''] = pair.split('=');
        const key = rawKey.trim();
        if (key !== COOKIE_KEY) continue;

        const value = decodeURIComponent(rawValue.trim());
        if (value === 'light' || value === 'dark') return value;
      }
    } catch (_err) {
      return null;
    }

    return null;
  };

  const safeSet = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      for (const key of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
    } catch (_err) {
      /* no-op when storage is blocked */
    }

    try {
      const maxAge = 60 * 60 * 24 * 365;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
    } catch (_err) {
      /* no-op when cookies are blocked */
    }
  };

  const getPreferredTheme = () => {
    const saved = safeGet() || readCookieTheme();
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
