(() => {
  const DARK_COLOR = '#070a0f';

  const applyDarkTheme = () => {
    document.documentElement.setAttribute('data-theme', 'dark');

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', DARK_COLOR);

    document.querySelectorAll('[data-theme-toggle], #themeToggle').forEach((button) => {
      button.setAttribute('aria-hidden', 'true');
      button.setAttribute('tabindex', '-1');
      button.style.display = 'none';
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDarkTheme, { once: true });
  } else {
    applyDarkTheme();
  }
})();
