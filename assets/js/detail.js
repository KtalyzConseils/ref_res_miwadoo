/* ================================
   DETAIL PAGE - detail.js
================================ */

function init() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('id');

  if (!slug) {
    window.location.href = 'index.html';
    return;
  }

  const restaurant = getRestaurantBySlug(slug);

  if (!restaurant) {
    document.body.innerHTML = `
      <div style="text-align:center;padding:80px 20px;">
        <div style="font-size:64px;margin-bottom:20px">🍽️</div>
        <h2 style="font-size:22px;font-weight:800;margin-bottom:12px">Restaurant introuvable</h2>
        <p style="color:#6c757d;margin-bottom:24px">Ce restaurant n'existe pas dans notre sélection.</p>
        <a href="index.html" style="background:#e23844;color:white;padding:12px 28px;border-radius:25px;font-weight:700;text-decoration:none;">← Retour à la liste</a>
      </div>`;
    return;
  }

  renderDetail(restaurant);

  // Burger menu
  const burger = document.getElementById('burger-btn');
  const navLinks = document.getElementById('nav-links');
  if (burger) burger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

function renderDetail(r) {
  document.title = `${r.name} – Top ${r.rank} | MIWADOO Restaurants Cotonou`;
  renderHero(r);
  renderMain(r);
  renderSidebar(r);
  renderRelated(r);
}

function starsHTML(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '★'.repeat(full);
  if (half) html += '½';
  html += '☆'.repeat(5 - full - (half ? 1 : 0));
  return html;
}

function renderHero(r) {
  const hero = document.getElementById('detail-hero');
  if (!hero) return;
  hero.innerHTML = `
    <img src="${r.heroImage}" alt="${r.name}"
      onerror="if(!this.dataset.tried){this.dataset.tried=1;this.src='https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop'}"
      style="width:100%;height:100%;object-fit:cover">
    <div class="detail-hero-overlay"></div>
    <div class="detail-hero-content">
      <div class="breadcrumb">
        <a href="index.html">Accueil</a> ›
        <a href="index.html">Restaurants</a> ›
        <span>${r.name}</span>
      </div>
      <div class="detail-rank-badge">
        <span>🏆</span> Top ${r.rank} Miwadoo
      </div>
      <h1 class="detail-name">${r.name}</h1>
      <div class="detail-hero-meta">
        <span class="stars" style="font-size:20px">${starsHTML(r.googleRating)}</span>
        <span class="rating-value" style="color:white;font-size:16px;font-weight:700">${r.googleRating}</span>
        <span class="rating-count" style="color:rgba(255,255,255,0.7)">(${r.googleUserRatingCount} avis Google)</span>
        <span class="detail-cuisine-tag">${r.cuisine}</span>
        <span class="detail-cuisine-tag">📍 ${r.area}, ${r.city}</span>
      </div>
    </div>`;
}

function renderMain(r) {
  const main = document.getElementById('detail-main');
  if (!main) return;

  const galleryHTML = r.gallery.length > 0 ? `
    <div class="detail-section">
      <h3><span class="icon">📸</span> Galerie photos</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;border-radius:10px;overflow:hidden">
        ${r.gallery.map((img, i) => `
          <div style="height:120px;overflow:hidden;border-radius:8px">
            <img src="${img}" alt="Photo ${i+1} ${r.name}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.parentElement.style.display='none'">
          </div>`).join('')}
      </div>
    </div>` : '';

  const strengthsHTML = r.strengths.map(s => `
    <li>
      <span class="check">✓</span>
      <span>${s}</span>
    </li>`).join('');

  const weaknessesHTML = r.weaknesses.map(w => `
    <li>
      <span class="warn">!</span>
      <span>${w}</span>
    </li>`).join('');

  const dishesHTML = r.recommendedDishes.map(d => `<span class="dish-tag">🍽 ${d}</span>`).join('');

  const reviewsHTML = (r.googleReviews && r.googleReviews.length > 0)
    ? r.googleReviews.map(rv => `
    <div class="review-item">
      <div class="review-header">
        <div class="review-author">
          <div class="review-avatar">${(rv.author || 'A')[0].toUpperCase()}</div>
          <div>
            <div class="review-name">${rv.author || 'Anonyme'}</div>
            <div class="review-date">${rv.date || ''}</div>
          </div>
        </div>
        <div class="review-stars">${'★'.repeat(Math.min(5, rv.rating || 5))}${'☆'.repeat(Math.max(0, 5 - (rv.rating || 5)))}</div>
      </div>
      <p class="review-text">"${rv.text}"</p>
    </div>`).join('')
    : `<div style="text-align:center;padding:28px 16px;color:var(--muted)">
        <div style="font-size:36px;margin-bottom:10px">💬</div>
        <p style="font-weight:600;color:var(--text);margin-bottom:6px">Pas encore d'avis disponibles</p>
        <p style="font-size:13px">Ce restaurant n'a pas encore d'avis Google accessibles.<br>Soyez le premier à partager votre expérience !</p>
        <a href="${r.mapsUrl}" target="_blank" style="display:inline-block;margin-top:14px;background:var(--primary);color:white;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:700;">
          Laisser un avis sur Google →
        </a>
      </div>`;

  main.innerHTML = `
    ${galleryHTML}

    <div class="detail-section">
      <h3><span class="icon">✍️</span> Avis Miwadoo</h3>
      <p class="editorial-summary">${r.editorialSummary}</p>
    </div>

    <div class="detail-section">
      <h3><span class="icon">✅</span> Points forts</h3>
      <ul class="strengths-list">${strengthsHTML}</ul>
      ${r.weaknesses.length > 0 ? `
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border)">
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);letter-spacing:0.5px;margin-bottom:12px">À noter</p>
        <ul class="weaknesses-list">${weaknessesHTML}</ul>
      </div>` : ''}
    </div>

    <div class="detail-section">
      <h3><span class="icon">⭐</span> Plats recommandés</h3>
      <div class="dishes-list">${dishesHTML}</div>
    </div>

    <div class="detail-section">
      <h3><span class="icon">💬</span> Avis Google</h3>
      <div class="reviews-list">${reviewsHTML}</div>
      <div class="google-badge" style="margin-top:16px">
        <span>🔍</span>
        Avis issus de Google Maps · Affichés avec attribution
      </div>
    </div>`;
}

function renderSidebar(r) {
  const sidebar = document.getElementById('detail-sidebar');
  if (!sidebar) return;

  const pct = r.miwadooScore;
  let scoreLabel = 'Excellent';
  if (pct < 75) scoreLabel = 'Très bien';
  if (pct < 80) scoreLabel = 'Bien';

  const priceStars = '€'.repeat(r.googlePriceLevel) + '○'.repeat(Math.max(0, 3 - r.googlePriceLevel));

  sidebar.innerHTML = `
    <div class="sidebar-cta">
      <h4>Commander chez ${r.name}</h4>
      <p>Disponible sur Miwadoo – Livraison rapide à Cotonou</p>
      <a href="${r.mapsUrl}" target="_blank" class="btn-maps" style="color:#e23844;border-color:rgba(255,255,255,0.3);margin-top:10px">📍 Voir sur la carte</a>
    </div>

    <div class="sidebar-card">
      <h4>Score Miwadoo</h4>
      <div class="score-circle-wrap">
        <div class="score-circle" style="--pct:${pct}">
          <div class="score-inner">
            <div class="score-number">${pct}</div>
            <div class="score-label">/100</div>
          </div>
        </div>
        <span class="score-desc"><strong>${scoreLabel}</strong><br>Classé <strong>#${r.rank}</strong> sur 19</span>
      </div>
      <div class="info-row" style="justify-content:center;border:none;padding:10px 0 0">
        <span style="font-size:12px;color:var(--muted);text-align:center">
          Basé sur 5 critères : prix, qualité, régularité, cadre, service
        </span>
      </div>
    </div>

    <div class="sidebar-card">
      <h4>Infos pratiques</h4>
      <div class="info-row">
        <div class="info-icon">⏰</div>
        <div class="info-content">
          <strong>Horaires</strong>
          ${r.openingHours}
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon">💰</div>
        <div class="info-content">
          <strong>Budget moyen</strong>
          ${r.budgetLabel} · ${priceStars}
        </div>
      </div>
      ${r.contactPhone ? `
      <div class="info-row">
        <div class="info-icon">📞</div>
        <div class="info-content">
          <strong>Téléphone</strong>
          <a href="tel:${r.contactPhone.replace(/\s/g, '')}" style="color:var(--primary)">${r.contactPhone}</a>
        </div>
      </div>` : ''}
      <div class="info-row">
        <div class="info-icon">📍</div>
        <div class="info-content">
          <strong>Quartier</strong>
          ${r.area} · ${r.city}
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon">🍽️</div>
        <div class="info-content">
          <strong>Cuisine</strong>
          ${r.cuisine}
        </div>
      </div>
    </div>

    <div class="sidebar-card">
      <h4>Tags</h4>
      <div class="tags-list">
        ${r.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
        <span class="tag" style="background:var(--primary-light);color:var(--primary);border-color:rgba(226,56,68,0.2)">${r.badge}</span>
      </div>
    </div>`;
}

function renderRelated(r) {
  const section = document.getElementById('related-section');
  if (!section) return;

  const related = RESTAURANTS
    .filter(x => x.id !== r.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  section.innerHTML = `
    <h2>Vous aimerez aussi</h2>
    <div class="related-grid">
      ${related.map(rel => {
        const starsH = '★'.repeat(Math.floor(rel.googleRating)) + '☆'.repeat(5 - Math.floor(rel.googleRating));
        return `
          <div class="restaurant-card" onclick="window.location.href='restaurant.html?id=${rel.slug}'" style="cursor:pointer">
            <div class="card-image-wrap" style="height:150px">
              <img src="${rel.heroImage}" alt="${rel.name}" loading="lazy">
              <div class="rank-badge ${rel.rank <= 3 ? 'top3' : ''}">#${rel.rank}</div>
              <div class="card-badge" style="background:${rel.badgeColor}">${rel.badge}</div>
            </div>
            <div class="card-body">
              <div class="card-meta"><span>${rel.area}</span><span class="dot">•</span><span>${rel.cuisine}</span></div>
              <div class="card-name">${rel.name}</div>
              <div class="card-rating">
                <span class="stars">${starsH}</span>
                <span class="rating-value">${rel.googleRating}</span>
              </div>
              <div class="card-footer">
                <span class="price-label">💚 ${rel.budgetLabel}</span>
                <a href="restaurant.html?id=${rel.slug}" class="btn-detail">Voir →</a>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

document.addEventListener('DOMContentLoaded', init);
