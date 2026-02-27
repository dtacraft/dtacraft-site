(() => {
  // Compatibility shim for legacy pages that still use #themeToggle.
  // Modern pages use /assets/theme.js + [data-theme-toggle].
  if (document.querySelector('[data-theme-toggle]')) return;

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
      /* no-op */
    }

    try {
      const maxAge = 60 * 60 * 24 * 365;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
    } catch (_err) {
      /* no-op */
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

  const applyTheme = (theme) => {
    const isLight = theme === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isLight ? LIGHT_COLOR : DARK_COLOR);

    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.setAttribute('aria-pressed', String(isLight));
    const label = btn.querySelector('[data-theme-label]');
    if (label) label.textContent = isLight ? 'Dark' : 'Light';
  };

  const initialize = () => {
    applyTheme(getPreferredTheme());

    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      safeSet(next);
      applyTheme(next);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
