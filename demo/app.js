import {
  createState,
  createEffect,
  createMemo,
  createEventBus,
  createRef,
} from '../dist/index.js';

// ============================================================
// State
// ============================================================
const pokemonList = createState([]);
const searchTerm = createState('');
const isLoading = createState(false);
const errorMsg = createState('');
const currentPage = createState(1);
const totalCount = createState(0);
const favorites = createState(JSON.parse(localStorage.getItem('sk_favorites') || '[]'));
const theme = createState(localStorage.getItem('sk_theme') || 'light');

const PAGE_SIZE = 20;

// ============================================================
// Event Bus
// ============================================================
const bus = createEventBus();

bus.on('notification', (msg) => {
  showToast(msg);
});

// ============================================================
// Computed / Memo
// ============================================================
const totalPages = createMemo(() => Math.ceil(totalCount.get() / PAGE_SIZE), [totalCount]);
const favCount = createMemo(() => favorites.get().length, [favorites]);

// ============================================================
// Refs
// ============================================================
const searchInputRef = createRef(null);

// ============================================================
// Effects — Persistence
// ============================================================
createEffect(() => {
  document.body.className = theme.get();
  localStorage.setItem('sk_theme', theme.get());
}, [theme]);

createEffect(() => {
  localStorage.setItem('sk_favorites', JSON.stringify(favorites.get()));
}, [favorites]);

// ============================================================
// API
// ============================================================
async function fetchPokemonList(page = 1) {
  isLoading.set(true);
  errorMsg.set('');
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${offset}`,
    );
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    totalCount.set(data.count);

    const details = await Promise.all(
      data.results.map((p) => fetch(p.url).then((r) => r.json())),
    );
    pokemonList.set(details);
  } catch (err) {
    errorMsg.set('Failed to load Pokémon. Please try again.');
    pokemonList.set([]);
  }
  isLoading.set(false);
}

async function searchPokemon(query) {
  if (!query.trim()) {
    currentPage.set(1);
    fetchPokemonList(1);
    return;
  }
  isLoading.set(true);
  errorMsg.set('');
  try {
    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${query.toLowerCase().trim()}`,
    );
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    pokemonList.set([data]);
    totalCount.set(1);
  } catch {
    errorMsg.set(`Pokémon "${query}" not found. Try another name or ID.`);
    pokemonList.set([]);
    totalCount.set(0);
  }
  isLoading.set(false);
}

// ============================================================
// Helpers
// ============================================================
function isFavorited(id) {
  return favorites.get().some((f) => f.id === id);
}

function toggleFavorite(pokemon) {
  const current = favorites.get();
  if (isFavorited(pokemon.id)) {
    favorites.set(current.filter((f) => f.id !== pokemon.id));
    bus.emit('notification', `${pokemon.name} removed from favorites`);
  } else {
    favorites.set([
      ...current,
      {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default,
      },
    ]);
    bus.emit('notification', `${pokemon.name} added to favorites!`);
  }
}

function removeFavorite(id) {
  const fav = favorites.get().find((f) => f.id === id);
  favorites.set(favorites.get().filter((f) => f.id !== id));
  if (fav) bus.emit('notification', `${fav.name} removed from favorites`);
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: var(--text); color: var(--bg);
    padding: 12px 20px; border-radius: 8px;
    font-size: 0.9rem; z-index: 1000;
    animation: fadeIn 0.3s;
    text-transform: capitalize;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function getMainStats(pokemon) {
  const statMap = { hp: 'HP', attack: 'ATK', defense: 'DEF', speed: 'SPD' };
  return pokemon.stats
    .filter((s) => statMap[s.stat.name])
    .map((s) => ({
      label: statMap[s.stat.name],
      value: s.base_stat,
      percent: Math.min((s.base_stat / 255) * 100, 100),
    }));
}

// ============================================================
// Render
// ============================================================
function render() {
  const app = document.getElementById('app');
  const list = pokemonList.get();
  const loading = isLoading.get();
  const error = errorMsg.get();
  const page = currentPage.get();
  const pages = totalPages.get();
  const currentTheme = theme.get();
  const favs = favorites.get();
  const search = searchTerm.get();

  app.innerHTML = `
    <header>
      <h1>🔴 <span>Pokémon</span> Explorer</h1>
      <button class="theme-toggle" data-action="toggle-theme">
        ${currentTheme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>

    <div class="search-bar">
      <input
        type="text"
        id="search-input"
        placeholder="Search by name or ID (e.g. pikachu, 25)..."
        value="${search}"
      />
      <button class="btn btn-primary" data-action="search">Search</button>
      ${search ? '<button class="btn btn-clear" data-action="clear-search">Clear</button>' : ''}
    </div>

    ${error ? `<div class="error-msg">${error}</div>` : ''}

    ${loading ? '<div class="loading">Loading Pokémon</div>' : ''}

    ${
      !loading && list.length > 0
        ? `
      <div class="grid">
        ${list
          .map(
            (p) => `
          <div class="card">
            <img src="${p.sprites.front_default || ''}" alt="${p.name}" />
            <h3>${p.name}</h3>
            <p class="pokemon-id">#${String(p.id).padStart(3, '0')}</p>
            <div class="types">
              ${p.types.map((t) => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`).join('')}
            </div>
            <div class="stats">
              ${getMainStats(p)
                .map(
                  (s) => `
                <div class="stat-row">
                  <span class="stat-label">${s.label}</span>
                  <div class="stat-bar"><div class="stat-fill" style="width:${s.percent}%"></div></div>
                  <span class="stat-value">${s.value}</span>
                </div>`,
                )
                .join('')}
            </div>
            <button class="fav-btn" data-action="toggle-fav" data-id="${p.id}" data-name="${p.name}" data-sprite="${p.sprites.front_default || ''}">
              ${isFavorited(p.id) ? '❤️' : '🤍'}
            </button>
          </div>
        `,
          )
          .join('')}
      </div>

      ${
        !search && pages > 1
          ? `
        <div class="pagination">
          <button class="btn btn-clear" data-action="prev-page" ${page <= 1 ? 'disabled' : ''}>← Previous</button>
          <span class="page-info">Page ${page} of ${pages}</span>
          <button class="btn btn-clear" data-action="next-page" ${page >= pages ? 'disabled' : ''}>Next →</button>
        </div>
      `
          : ''
      }
    `
        : ''
    }

    ${
      favs.length > 0
        ? `
      <div class="favorites-section">
        <h2>❤️ Favorites (${favCount.get()})</h2>
        <ul class="favorites-list">
          ${favs
            .map(
              (f) => `
            <li class="fav-item">
              <img src="${f.sprite}" alt="${f.name}" />
              <span>${f.name}</span>
              <button class="remove-fav" data-action="remove-fav" data-id="${f.id}">✕</button>
            </li>
          `,
            )
            .join('')}
        </ul>
      </div>
    `
        : ''
    }

    <footer>
      Built with ⚡ <a href="https://github.com/brunomariano/statekit" target="_blank">StateKit</a>
      · Data from <a href="https://pokeapi.co/" target="_blank">PokéAPI</a>
    </footer>
  `;

  // Restore focus on search input
  const input = document.getElementById('search-input');
  if (input && searchInputRef.current) {
    input.selectionStart = input.value.length;
    input.selectionEnd = input.value.length;
  }
  searchInputRef.current = input;
}

// ============================================================
// Event Delegation
// ============================================================
document.getElementById('app').addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  switch (action) {
    case 'toggle-theme':
      theme.set((t) => (t === 'light' ? 'dark' : 'light'));
      break;

    case 'search': {
      const input = document.getElementById('search-input');
      searchTerm.set(input.value);
      searchPokemon(input.value);
      break;
    }

    case 'clear-search':
      searchTerm.set('');
      currentPage.set(1);
      fetchPokemonList(1);
      break;

    case 'toggle-fav': {
      const id = Number(target.dataset.id);
      const name = target.dataset.name;
      const sprite = target.dataset.sprite;
      const pokemon = { id, name, sprites: { front_default: sprite } };
      toggleFavorite(pokemon);
      break;
    }

    case 'remove-fav':
      removeFavorite(Number(target.dataset.id));
      break;

    case 'prev-page':
      if (currentPage.get() > 1) {
        currentPage.set((p) => p - 1);
        fetchPokemonList(currentPage.get());
      }
      break;

    case 'next-page':
      if (currentPage.get() < totalPages.get()) {
        currentPage.set((p) => p + 1);
        fetchPokemonList(currentPage.get());
      }
      break;
  }
});

document.getElementById('app').addEventListener('keydown', (e) => {
  if (e.target.id === 'search-input' && e.key === 'Enter') {
    searchTerm.set(e.target.value);
    searchPokemon(e.target.value);
  }
});

// ============================================================
// Reactive render
// ============================================================
createEffect(render, [pokemonList, favorites, isLoading, errorMsg, theme, currentPage]);

// ============================================================
// Initial load
// ============================================================
fetchPokemonList(1);
