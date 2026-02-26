(() => {
  // Compatibility shim for legacy pages that still use #themeToggle.
  // Modern pages use /assets/theme.js + [data-theme-toggle].
  if (document.querySelector('[data-theme-toggle]')) return;

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
      /* no-op */
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
