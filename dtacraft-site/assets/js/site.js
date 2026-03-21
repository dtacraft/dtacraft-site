(function () {
  function normalizePath(path) {
    if (!path || path === '/') return '/index.html';
    return path.replace(/\/$/, '') || '/index.html';
  }

  function enhanceNavigation() {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');

    if (!header || !toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('is-nav-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('is-nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  async function injectPartials() {
    const mountNodes = document.querySelectorAll('[data-include]');
    await Promise.all(Array.from(mountNodes).map(async (node) => {
      const key = node.getAttribute('data-include');
      const path = key === 'header' ? '/partials/header.html' : '/partials/footer.html';
      const response = await fetch(path);
      if (!response.ok) return;
      node.outerHTML = await response.text();
    }));

    const yearNode = document.getElementById('year');
    if (yearNode) yearNode.textContent = String(new Date().getFullYear());

    const currentPath = normalizePath(window.location.pathname);
    document.querySelectorAll('.main-nav .nav-link').forEach((link) => {
      const href = normalizePath(new URL(link.getAttribute('href'), window.location.origin).pathname);
      if (href === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    });

    enhanceNavigation();
  }

  document.addEventListener('DOMContentLoaded', injectPartials);
})();
