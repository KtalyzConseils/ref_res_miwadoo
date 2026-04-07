/* ================================
   LISTING PAGE - listing.js
================================ */

let activeFilters = { cuisine: 'all', area: 'all', budget: 'all', sort: 'rank' };
let searchQuery = '';

function init() {
  buildFilters();
  renderGrid(RESTAURANTS);
  bindEvents();
  initCarousel();
}

function initCarousel() {
  const wrap  = document.getElementById('hero-carousel');
  const dotsW = document.getElementById('hero-dots');
  const label = document.getElementById('hero-slide-label');
  if (!wrap) return;

  // Prendre les 10 premiers restos avec vraie photo Google
  const picks = RESTAURANTS
    .filter(r => r.heroImage && r.heroImage.includes('lh3.googleusercontent'))
    .slice(0, 10);

  if (!picks.length) return;

  // Créer les slides
  picks.forEach((r, i) => {
    const slide = document.createElement('div');
    slide.className = 'c-slide' + (i === 0 ? ' active' : '');
    slide.style.backgroundImage = `url('${r.heroImage}')`;
    wrap.appendChild(slide);

    // Indicateur
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsW.appendChild(dot);
  });

  if (label) label.textContent = picks[0].name;

  let current = 0;
  const slides = wrap.querySelectorAll('.c-slide');
  const dots   = dotsW.querySelectorAll('.dot');

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    if (label) label.textContent = picks[current].name;
  }

  const timer = setInterval(() => goTo(current + 1), 5000);

  // Pause au survol
  wrap.closest('.hero')?.addEventListener('mouseenter', () => clearInterval(timer));
}

function buildFilters() {
  // Unique cuisines
  const cuisines = [...new Set(RESTAURANTS.map(r => r.cuisine))].sort();
  const cuisineWrap = document.getElementById('filter-cuisine');
  cuisines.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.cuisine = c;
    btn.textContent = c;
    btn.addEventListener('click', () => {
      activeFilters.cuisine = activeFilters.cuisine === c ? 'all' : c;
      document.querySelectorAll('[data-cuisine]').forEach(b => b.classList.toggle('active', b.dataset.cuisine === activeFilters.cuisine));
      applyFilters();
    });
    cuisineWrap.appendChild(btn);
  });

  // Unique areas
  const areas = [...new Set(RESTAURANTS.map(r => r.area))].sort();
  const areaWrap = document.getElementById('filter-area');
  areas.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.area = a;
    btn.textContent = a;
    btn.addEventListener('click', () => {
      activeFilters.area = activeFilters.area === a ? 'all' : a;
      document.querySelectorAll('[data-area]').forEach(b => b.classList.toggle('active', b.dataset.area === activeFilters.area));
      applyFilters();
    });
    areaWrap.appendChild(btn);
  });
}

function scrollToListing() {
  const section = document.getElementById('listing-section');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindEvents() {
  // Search input (live filtering, no scroll on keystroke)
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });
    // Enter key → apply + scroll
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { applyFilters(); scrollToListing(); }
    });
  }

  // Search button → apply + scroll
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => { applyFilters(); scrollToListing(); });
  }

  // Filter toggle button
  const filterToggle = document.getElementById('filter-toggle-btn');
  const filtersPanel = document.getElementById('filters-panel');
  if (filterToggle && filtersPanel) {
    // Set initial max-height so the transition works
    filtersPanel.style.maxHeight = filtersPanel.scrollHeight + 'px';
    filterToggle.addEventListener('click', () => {
      const hidden = filtersPanel.classList.toggle('filters-hidden');
      filterToggle.classList.toggle('active', !hidden);
      if (!hidden) filtersPanel.style.maxHeight = filtersPanel.scrollHeight + 'px';
    });
  }

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      activeFilters.sort = e.target.value;
      applyFilters();
    });
  }

  // Budget buttons
  document.querySelectorAll('[data-budget]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.budget;
      activeFilters.budget = activeFilters.budget === val ? 'all' : val;
      document.querySelectorAll('[data-budget]').forEach(b => b.classList.toggle('active', b.dataset.budget === activeFilters.budget));
      applyFilters();
    });
  });

  // Burger menu
  const burger = document.getElementById('burger-btn');
  const navLinks = document.getElementById('nav-links');
  if (burger) {
    burger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
}

function applyFilters() {
  let result = [...RESTAURANTS];

  // Search
  if (searchQuery) {
    result = result.filter(r =>
      r.name.toLowerCase().includes(searchQuery) ||
      r.cuisine.toLowerCase().includes(searchQuery) ||
      r.area.toLowerCase().includes(searchQuery) ||
      r.tags.some(t => t.toLowerCase().includes(searchQuery))
    );
  }

  // Cuisine
  if (activeFilters.cuisine !== 'all') {
    result = result.filter(r => r.cuisine === activeFilters.cuisine);
  }

  // Area
  if (activeFilters.area !== 'all') {
    result = result.filter(r => r.area === activeFilters.area);
  }

  // Budget (seuils mis à jour selon les vrais budgets Cotonou)
  if (activeFilters.budget === 'low')  result = result.filter(r => r.budgetMax <= 5000);
  else if (activeFilters.budget === 'mid')  result = result.filter(r => r.budgetMax > 5000 && r.budgetMax <= 10000);
  else if (activeFilters.budget === 'high') result = result.filter(r => r.budgetMax > 10000);

  // Sort
  if (activeFilters.sort === 'rank')   result.sort((a, b) => a.rank - b.rank);
  else if (activeFilters.sort === 'rating') result.sort((a, b) => b.googleRating - a.googleRating);
  else if (activeFilters.sort === 'score')  result.sort((a, b) => b.miwadooScore - a.miwadooScore);
  else if (activeFilters.sort === 'budget') result.sort((a, b) => a.budgetMax - b.budgetMax);

  // Update counter
  const counter = document.getElementById('result-count');
  if (counter) counter.textContent = `${result.length} restaurant${result.length > 1 ? 's' : ''} trouvé${result.length > 1 ? 's' : ''}`;

  renderGrid(result);
}

function renderGrid(restaurants) {
  const grid = document.getElementById('restaurant-grid');
  if (!grid) return;

  if (restaurants.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🍽️</div>
        <h3>Aucun restaurant trouvé</h3>
        <p>Essayez de modifier vos filtres ou votre recherche.</p>
      </div>`;
    return;
  }

  grid.innerHTML = restaurants.map(r => renderCard(r)).join('');
}

function renderCard(r) {
  const fullStars = Math.floor(r.googleRating);
  const hasHalf = r.googleRating % 1 >= 0.5;
  let starsHtml = '★'.repeat(fullStars);
  if (hasHalf) starsHtml += '½';
  starsHtml += '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));

  return `
    <div class="restaurant-card" onclick="window.location.href='restaurant.html?id=${r.slug}'">
      <div class="card-image-wrap">
        <img src="${r.heroImage}" alt="${r.name}" loading="lazy"
          onerror="if(!this.dataset.tried){this.dataset.tried=1;this.src='https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop'}">
        <div class="rank-badge ${r.rank <= 3 ? 'top3' : ''}">#${r.rank}</div>
        <div class="card-badge" style="background:${r.badgeColor}">${r.badge}</div>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span>${r.area}</span>
          <span class="dot">•</span>
          <span>${r.cuisine}</span>
        </div>
        <div class="card-name">${r.name}</div>
        <div class="card-rating">
          <span class="stars">${starsHtml}</span>
          <span class="rating-value">${r.googleRating}</span>
          <span class="rating-count">(${r.googleUserRatingCount} avis)</span>
        </div>
        <p class="card-summary">${r.editorialSummary}</p>
        <div class="card-footer">
          <span class="price-label">💚 ${r.budgetLabel}</span>
          <a href="restaurant.html?id=${r.slug}" class="btn-detail">Voir la fiche →</a>
        </div>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', init);
