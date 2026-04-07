/**
 * MIWADOO – Scraper SerpAPI v2
 * Récupère : données de base + avis réels + horaires + téléphone
 *
 * Usage : node scraper.js
 * Budget API estimé : ~215 requêtes pour 100 restaurants
 *   - 15 recherches google_local  (~15 req)
 *   - 100 × google_maps           (détails)
 *   - 100 × google_maps_reviews   (avis)
 * ⚠️  Le cache évite de re-dépenser sur les restos déjà fetchés.
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API_KEY     = '88964efa2c17b9a340efe80fee7e8241c7c849af72420a0408b748ed24742da5';
const CACHE_FILE  = path.join(__dirname, 'data', 'cache.json');
const OUTPUT_FILE = path.join(__dirname, 'assets', 'js', 'restaurants.js');
const TARGET      = 100;
const DELAY_MS    = 800;

const SEARCH_QUERIES = [
  // Généralistes
  'restaurant Cotonou',
  'maquis restaurant Cotonou',
  'restauration rapide Cotonou',
  'restaurant africain Cotonou Benin',
  'restaurant populaire Cotonou',
  // Par quartier
  'restaurant Fidjrossè Cotonou',
  'restaurant Cadjèhoun Cotonou',
  'restaurant Haie Vive Cotonou',
  'restaurant Akpakpa Cotonou',
  'restaurant Dantokpa Cotonou',
  'restaurant Gbèdjromèdji Cotonou',
  // Par type de cuisine
  'fast food Cotonou',
  'pizza restaurant Cotonou',
  'grillades brochettes Cotonou',
  'maquis ivoirien Cotonou',
  'restaurant libanais Cotonou',
  'snack buvette Cotonou',
  'restaurant gastronomique Cotonou',
  'brasserie Cotonou',
];

// Images Unsplash HD de secours (tournantes selon l'index)
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
];

// ─── UTILITAIRES ──────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse: ' + data.slice(0, 300))); }
      });
    }).on('error', reject);
  });
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE))
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {}
  return { searches: {}, details: {}, reviews: {} };
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function priceSymbolToLevel(price) {
  if (!price) return 1;
  return Math.max(1, (price.match(/€|\$/g) || []).length);
}

function priceLevelToFCFA(level) {
  return { 1: '~4 500 FCFA / pers.', 2: '~9 000 FCFA / pers.', 3: '~18 000 FCFA / pers.' }[level] || '~4 500 FCFA / pers.';
}

function priceLevelToMax(level) {
  return { 1: 4500, 2: 9000, 3: 18000 }[level] || 4500;
}

function chooseBadge(rating, reviews, priceLevel) {
  if (priceLevel === 1 && rating >= 4.5) return { badge: 'Coup de cœur',    badgeColor: '#e23844' };
  if (priceLevel === 1)                  return { badge: 'Petit budget',     badgeColor: '#27ae60' };
  if (reviews >= 150)                    return { badge: 'Très populaire',   badgeColor: '#e67e22' };
  if (rating >= 4.5)                     return { badge: 'Qualité top',      badgeColor: '#2980b9' };
  return                                        { badge: 'Bon plan',         badgeColor: '#e23844' };
}

function computeScore(rating, reviews, priceLevel) {
  const prix      = (4 - priceLevel) / 3 * 100 * 0.40;
  const qualite   = Math.max(0, ((rating - 3) / 2)) * 100 * 0.25;
  const popularite = Math.min(reviews / 5, 100) * 0.15;
  const cadre     = 65 * 0.10;
  const service   = 65 * 0.10;
  return Math.round(Math.max(50, Math.min(99, prix + qualite + popularite + cadre + service)));
}

function extractArea(address) {
  if (!address) return 'Cotonou';
  const parts = address.split('·').map(s => s.trim()).reverse();
  for (const part of parts) {
    const clean = part
      .replace(/,?\s*B[eé]nin/gi, '')
      .replace(/[A-Z0-9]{4}\+[A-Z0-9]+/g, '')  // codes Plus
      .replace(/^\d+\s*/g, '')                   // numéros de rue en début
      .trim();
    if (clean.length >= 3 && clean.length <= 45 && !/^\d+$/.test(clean))
      return clean;
  }
  return 'Cotonou';
}

// ─── FORMATER LES HORAIRES ─────────────────────────────────────────────────
function parseHours(hoursData) {
  if (!hoursData) return '';

  // Cas 1 : tableau de strings ["Monday: 9 AM–9 PM", ...]
  if (Array.isArray(hoursData) && typeof hoursData[0] === 'string') {
    return hoursData
      .map(h => h.replace(/(\w+):\s*/, m => m.replace(':', ' :').trim() + ' '))
      .join(' | ')
      .slice(0, 120);
  }

  // Cas 2 : objet { monday: "9 AM–9 PM", ... }
  if (typeof hoursData === 'object' && !Array.isArray(hoursData)) {
    const days = { monday:'Lun', tuesday:'Mar', wednesday:'Mer', thursday:'Jeu',
                   friday:'Ven', saturday:'Sam', sunday:'Dim' };
    return Object.entries(hoursData)
      .map(([d, h]) => `${days[d] || d}: ${h}`)
      .join(' | ')
      .slice(0, 120);
  }

  // Cas 3 : schedule [{day, hours}]
  if (Array.isArray(hoursData)) {
    return hoursData
      .map(s => `${s.day || ''}: ${s.hours || s.time || ''}`)
      .join(' | ')
      .slice(0, 120);
  }

  return '';
}

// ─── APPELS API ────────────────────────────────────────────────────────────

async function searchRestaurants(query, cache) {
  if (cache.searches[query]) {
    process.stdout.write(`  [cache] "${query}"\n`);
    return cache.searches[query];
  }
  const params = new URLSearchParams({
    engine: 'google_local', q: query,
    location: 'Cotonou, Benin', hl: 'fr', gl: 'bj',
    api_key: API_KEY,
  });
  process.stdout.write(`  [API]   "${query}"\n`);
  const data = await fetchJSON(`https://serpapi.com/search?${params}`);
  if (data.error) throw new Error('SerpAPI: ' + data.error);
  cache.searches[query] = data.local_results || [];
  saveCache(cache);
  await sleep(DELAY_MS);
  return cache.searches[query];
}

/**
 * Récupère horaires, téléphone, vraies photos et avis via google_maps (place_results).
 * Un seul appel API par restaurant couvre tout.
 */
async function getPlaceDetails(name, lat, lng, cache) {
  const key = 'det2_' + slugify(name);
  if (cache.details[key]) return cache.details[key];

  const ll = (lat && lng) ? `@${lat},${lng},17z` : `@6.3654,2.4183,14z`;
  const params = new URLSearchParams({
    engine: 'google_maps',
    q: `${name} Cotonou`,
    ll,
    hl: 'fr',
    api_key: API_KEY,
  });

  process.stdout.write(`    [API] Détails → ${name}\n`);
  const data = await fetchJSON(`https://serpapi.com/search?${params}`);
  const pr = data.place_results || {};

  // ── Horaires ──────────────────────────────────────────────────────────
  // Format SerpAPI : [{lundi:"Fermé"}, {mardi:"12:00–23:00"}, ...]
  let hoursText = '';
  if (Array.isArray(pr.hours)) {
    const shorts = { lundi:'Lun', mardi:'Mar', mercredi:'Mer', jeudi:'Jeu',
                     vendredi:'Ven', samedi:'Sam', dimanche:'Dim' };
    hoursText = pr.hours
      .map(obj => {
        const [day, h] = Object.entries(obj)[0] || [];
        return day ? `${shorts[day] || day}: ${h}` : null;
      })
      .filter(Boolean)
      .join(' | ');
  }

  // ── Vraie photo Google (lh3.googleusercontent.com) ───────────────────
  let thumbnail = '';
  if (Array.isArray(pr.images)) {
    const img = pr.images.find(i => i.thumbnail?.includes('lh3.googleusercontent'));
    thumbnail = img?.thumbnail || pr.images[0]?.thumbnail || '';
  }

  // ── Avis individuels via data_id (format 0x...) ─────────────────────
  let reviews = [];
  if (pr.data_id) {
    const rKey = 'rev3_' + pr.data_id;
    if (cache.reviews[rKey] !== undefined) {
      reviews = cache.reviews[rKey];
    } else {
      try {
        const rParams = new URLSearchParams({
          engine  : 'google_maps_reviews',
          data_id : pr.data_id,
          hl      : 'fr',
          api_key : API_KEY,
        });
        process.stdout.write(`    [API] Avis   → ${name}\n`);
        const rData = await fetchJSON(`https://serpapi.com/search?${rParams}`);
        await sleep(DELAY_MS);
        reviews = (rData.reviews || []).slice(0, 3).map(rv => ({
          author : rv.user?.name || rv.username || 'Client Google',
          rating : Number(rv.rating) || 5,
          text   : rv.snippet || rv.extracted_snippet?.original || rv.text || '',
          date   : rv.date   || rv.iso_date_of_last_edit || 'récemment',
        })).filter(rv => rv.text && rv.text.length > 5);
        cache.reviews[rKey] = reviews;
        saveCache(cache);
      } catch (e) {
        process.stdout.write(`    [warn] Avis: ${e.message}\n`);
        cache.reviews[rKey] = [];
        saveCache(cache);
      }
    }
  }

  // ── Tags thématiques (user_reviews.topics si dispo) ──────────────────
  const topics = (pr.user_reviews?.topics || []).slice(0, 5).map(t => t.keyword);

  const details = {
    phone     : pr.phone    || '',
    data_id   : pr.data_id  || '',
    hoursText,
    thumbnail,
    reviews,
    topics,
    mapsUrl : pr.gps_coordinates
      ? `https://www.google.com/maps/search/?api=1&query=${pr.gps_coordinates.latitude},${pr.gps_coordinates.longitude}`
      : '',
  };

  cache.details[key] = details;
  saveCache(cache);
  await sleep(DELAY_MS);
  return details;
}

// ─── CONSTRUCTION D'UN OBJET RESTAURANT ──────────────────────────────────

async function buildRestaurant(raw, rank, cache) {
  const rating     = raw.rating  || 4.0;
  const reviews    = raw.reviews || 0;
  const priceLevel = priceSymbolToLevel(raw.price);
  const lat        = raw.gps_coordinates?.latitude;
  const lng        = raw.gps_coordinates?.longitude;
  const { badge, badgeColor } = chooseBadge(rating, reviews, priceLevel);

  // Un seul appel : horaires + téléphone + photos + avis
  let det = { phone: '', hoursText: '', thumbnail: '', reviews: [], topics: [], mapsUrl: '' };
  try {
    det = await getPlaceDetails(raw.title, lat, lng, cache);
  } catch (e) {
    process.stdout.write(`    [warn] ${e.message}\n`);
  }

  // Image : vraie photo Google si dispo, sinon thumbnail SerpAPI, sinon Unsplash rotatif
  const heroImage =
    (det.thumbnail && det.thumbnail.includes('lh3.googleusercontent'))
      ? det.thumbnail
      : (raw.thumbnail && !raw.thumbnail.includes('serpapi.com/searches'))
        ? raw.thumbnail
        : FALLBACK_IMAGES[(rank - 1) % FALLBACK_IMAGES.length];

  // Tags : type de cuisine + sujets mentionnés dans les avis
  const tags = [
    slugify(raw.type || 'restaurant'),
    ...det.topics.map(t => slugify(t)),
  ].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 6);

  return {
    id    : rank,
    slug  : slugify(raw.title),
    rank,
    name  : raw.title,
    city  : 'Cotonou',
    area  : extractArea(raw.address),
    cuisine : raw.type || 'Cuisine locale',

    googleRating          : rating,
    googleUserRatingCount : reviews,
    googlePriceLevel      : priceLevel,

    heroImage,
    gallery : [],

    miwadooScore : computeScore(rating, reviews, priceLevel),
    budgetLabel  : priceLevelToFCFA(priceLevel),
    budgetMax    : priceLevelToMax(priceLevel),
    badge,
    badgeColor,

    editorialSummary  : raw.description || `${raw.title} est une adresse populaire à Cotonou, appréciée pour son rapport qualité‑prix.`,
    strengths         : ['À compléter après visite'],
    weaknesses        : [],
    recommendedDishes : ['À compléter après visite'],

    openingHours : det.hoursText || 'Horaires à confirmer',
    contactPhone : det.phone,
    mapsUrl      : det.mapsUrl || (lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw.title + ' Cotonou')}`),

    tags,
    googleReviews : det.reviews,
  };
}

// ─── GÉNÉRATION DU FICHIER restaurants.js ────────────────────────────────

function generateJS(list) {
  return `const RESTAURANTS = ${JSON.stringify(list, null, 2)};

// ─── Utilitaires ─────────────────────────────────────────────────────────

function starsHTML(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let h = '★'.repeat(full);
  if (half) h += '½';
  h += '☆'.repeat(5 - full - (half ? 1 : 0));
  return h;
}

function priceLevelLabel(level) {
  return { 1: '€ Très accessible', 2: '€€ Accessible', 3: '€€€ Moyen' }[level] || '';
}

function getRestaurantBySlug(slug) {
  return RESTAURANTS.find(r => r.slug === slug) || null;
}
`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🍽️  MIWADOO Scraper v2 – Cotonou\n' + '─'.repeat(42));

  const cache = loadCache();
  const seen  = new Set();
  const rawList = [];

  // ── Étape 1 : Collecte ───────────────────────────────────────────────
  console.log('\n📡 Étape 1 : Recherche des restaurants...\n');
  for (const q of SEARCH_QUERIES) {
    if (rawList.length >= TARGET * 3) break;
    try {
      const results = await searchRestaurants(q, cache);
      for (const r of results) {
        if (r.place_id && !seen.has(r.place_id) && r.title && r.rating) {
          seen.add(r.place_id);
          rawList.push(r);
        }
      }
      console.log(`  → ${rawList.length} uniques\n`);
    } catch (e) { console.error(`  [erreur] ${q}: ${e.message}`); }
  }

  if (!rawList.length) {
    console.error('\n❌ Aucun résultat. Vérifiez clé API + connexion.\n');
    process.exit(1);
  }

  // ── Étape 2 : Tri bayésien (balance note × popularité) ───────────────
  const score = r => (r.rating || 0) * Math.log10((r.reviews || 0) + 2);
  const sorted = rawList
    .sort((a, b) => score(b) - score(a))
    .slice(0, TARGET);

  // ── Étape 3 : Enrichissement (avis + détails) ────────────────────────
  console.log(`\n📋 Étape 2 : Enrichissement des ${sorted.length} restaurants...\n`);
  const restaurants = [];

  for (let i = 0; i < sorted.length; i++) {
    const raw = sorted[i];
    console.log(`  [${String(i + 1).padStart(2)}/${sorted.length}] ${raw.title} — ${raw.rating}★ (${raw.reviews || 0} avis)`);
    try {
      restaurants.push(await buildRestaurant(raw, i + 1, cache));
    } catch (e) {
      console.error(`  [erreur] ${raw.title}: ${e.message}`);
    }
  }

  // ── Étape 4 : Écriture ───────────────────────────────────────────────
  console.log('\n💾 Étape 3 : Écriture de restaurants.js...\n');
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, generateJS(restaurants), 'utf8');

  // ── Résumé ───────────────────────────────────────────────────────────
  const avecAvis    = restaurants.filter(r => r.googleReviews.length > 0).length;
  const avecPhone   = restaurants.filter(r => r.contactPhone).length;
  const avecHoraires = restaurants.filter(r => r.openingHours !== 'Horaires à confirmer').length;

  console.log('─'.repeat(42));
  console.log(`✅ ${restaurants.length} restaurants écrits`);
  console.log(`   Avec avis Google    : ${avecAvis}/${restaurants.length}`);
  console.log(`   Avec téléphone      : ${avecPhone}/${restaurants.length}`);
  console.log(`   Avec horaires       : ${avecHoraires}/${restaurants.length}`);
  console.log('\n📌 À compléter manuellement : strengths, weaknesses, recommendedDishes, gallery');
  console.log('💡 Pense à ajuster budgetLabel/budgetMax dans restaurants.js après le scrape.\n');
}

main().catch(e => { console.error('\n❌ Erreur fatale :', e.message); process.exit(1); });
