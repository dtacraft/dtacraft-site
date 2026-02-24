(() => {
  const STORAGE_KEY = 'dtacraft_theme';
  const DARK_COLOR = '#070a0f';
  const LIGHT_COLOR = '#f4f2ee';

  const getPreferredTheme = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
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

  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  });
})();
