(function () {
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

    const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
    document.querySelectorAll('.main-nav .nav-link').forEach((link) => {
      const href = new URL(link.getAttribute('href'), window.location.origin).pathname.replace(/\/$/, '');
      if (href === currentPath) {
        link.setAttribute('aria-current', 'page');
        link.style.color = 'var(--text)';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', injectPartials);
})();
