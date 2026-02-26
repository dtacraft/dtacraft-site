(() => {
  const byId = (id) => document.getElementById(id);

  const applyGameFilters = () => {
    const cards = [...document.querySelectorAll('[data-game-card]')];
    if (!cards.length) return;
    const status = byId('filter-status')?.value || 'all';
    const platform = byId('filter-platform')?.value || 'all';
    const genre = byId('filter-genre')?.value || 'all';

    cards.forEach((card) => {
      const okStatus = status === 'all' || card.dataset.status === status;
      const okPlatform = platform === 'all' || card.dataset.platforms.includes(platform);
      const okGenre = genre === 'all' || card.dataset.genre === genre;
      card.style.display = okStatus && okPlatform && okGenre ? '' : 'none';
    });
  };

  const renderDevlog = async () => {
    const list = byId('devlog-list');
    if (!list) return;
    const query = (byId('devlog-search')?.value || '').toLowerCase();
    const activeCategory = byId('devlog-category')?.value || 'all';
    const activeGame = list.dataset.game || 'all';

    try {
      const posts = await fetch('/assets/devlog-posts.json').then((r) => r.json());
      const filtered = posts.filter((post) => {
        const matchQ = !query || `${post.title} ${post.excerpt}`.toLowerCase().includes(query);
        const matchC = activeCategory === 'all' || post.category === activeCategory;
        const matchG = activeGame === 'all' || post.game === activeGame;
        return matchQ && matchC && matchG;
      });

      list.innerHTML = filtered.map((post) => `
        <article class="card">
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <div class="badges"><span class="badge">${post.category}</span><span class="badge">${post.date}</span><span class="badge">${post.game}</span></div>
        </article>`).join('') || '<p>No posts match current filters.</p>';
    } catch {
      list.innerHTML = '<p>Unable to load devlog entries.</p>';
    }
  };

  const loadLatestUpdate = async () => {
    const nodes = document.querySelectorAll('[data-latest-update]');
    if (!nodes.length) return;
    try {
      const data = await fetch('/content/changelog.json').then((r) => r.json());
      nodes.forEach((node) => {
        const key = node.dataset.latestUpdate || 'deadhand-protocol';
        const item = data.games[key];
        if (!item) return;
        node.innerHTML = `<strong>v${item.latest_version || item.version}</strong> · ${item.last_update_date || item.date}<br>${item.short_update_snippet || item.summary}`;
      });
    } catch {
      nodes.forEach((node) => { node.textContent = 'Latest update data unavailable.'; });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    ['filter-status','filter-platform','filter-genre'].forEach((id) => byId(id)?.addEventListener('change', applyGameFilters));
    ['devlog-search','devlog-category'].forEach((id) => byId(id)?.addEventListener('input', renderDevlog));
    applyGameFilters();
    renderDevlog();
    loadLatestUpdate();
  });
})();
