// State Management
let models = [];
let config = { profiles: [], models: [] };
let currentFilter = 'all';
let currentSort = 'downloads-desc';
let searchQuery = '';

// DOM Elements
const modelsGrid = document.getElementById('models-grid');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const sortSelect = document.getElementById('sort-select');
const resetSearchBtn = document.getElementById('reset-search-btn');
const shuffleBtn = document.getElementById('shuffle-btn');

// Stats DOM
const statTotalModels = document.getElementById('stat-total-models');
const statTotalDownloads = document.getElementById('stat-total-downloads');
const statTotalLikes = document.getElementById('stat-total-likes');
const statTotalViews = document.getElementById('stat-total-views');

// Drawer DOM
const configBtn = document.getElementById('config-btn');
const syncInfoBtn = document.getElementById('sync-info-btn');
const configDrawer = document.getElementById('config-drawer');
const drawerClose = document.getElementById('drawer-close');
const drawerOverlay = document.getElementById('drawer-overlay');
const drawerContent = document.getElementById('drawer-content');
const drawerSaveBtn = document.getElementById('drawer-save-btn');
const drawerProfilesList = document.getElementById('drawer-profiles-list');
const copyCmdBtn = document.getElementById('copy-cmd-btn');

// Platform Style Mappings
const PLATFORMS = {
  printables: {
    name: 'Printables',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    hoverGlow: 'hover:shadow-amber-500/10 hover:border-amber-500/40',
    colorHex: '#F8A825',
    logo: `<svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm8.5 5.5v8.3l-8.5 4.2-8.5-4.2V7.5l8.5-4.2 8.5 4.2zm-12.7 3l4.2-2.1v4.2l-4.2 2.1V10.5zm8.4 2.1l-4.2 2.1V10.5l4.2-2.1v4.2z"/></svg>`
  },
  makerworld: {
    name: 'MakerWorld',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    hoverGlow: 'hover:shadow-emerald-500/10 hover:border-emerald-500/40',
    colorHex: '#00BFA6',
    logo: `<svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2v-5h2v5z"/></svg>`
  },
  thangs: {
    name: 'Thangs',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    hoverGlow: 'hover:shadow-blue-500/10 hover:border-blue-500/40',
    colorHex: '#2B6CB0',
    logo: `<svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192L12 .587z"/></svg>`
  }
};

// Initialize App
async function init() {
  renderSkeletons();
  await loadData();
  calculateStats();
  setupEventListeners();
  renderModels();
  renderConfigSummary();
}

// Render Skeleton Cards on Load
function renderSkeletons() {
  const template = document.getElementById('skeleton-template');
  loadingState.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const clone = template.content.cloneNode(true);
    loadingState.appendChild(clone);
  }
}

// Fetch JSON data strictly from models.json and profiles.config.json
async function loadData() {
  // Check if models are loaded via script tag (file:// protocol CORS bypass)
  if (window.modelsData && window.modelsData.length > 0) {
    models = window.modelsData;
    console.log('✅ Loaded data from window.modelsData (CORS bypass)');
  } else {
    try {
      // 1. Fetch models.json
      const modelsResponse = await fetch('models.json');
      if (!modelsResponse.ok) throw new Error('Failed to fetch models.json');
      models = await modelsResponse.json();
      console.log('✅ Loaded data from models.json');
    } catch (err) {
      console.error('❌ Could not load models.json:', err.message);
      showCorsError('models.json', err.message);
      return;
    }
  }

  try {
    // 2. Fetch profiles.config.json
    const configResponse = await fetch('profiles.config.json');
    if (!configResponse.ok) throw new Error('Failed to fetch profiles.config.json');
    config = await configResponse.json();
    console.log('✅ Loaded profiles.config.json');
  } catch (err) {
    console.warn('⚠️ Could not load profiles.config.json:', err.message);
  }
  
  // Initialize random shuffle orders
  shuffleModels();
  
  // Hide loading, show grid
  loadingState.classList.add('hidden');
  modelsGrid.classList.remove('hidden');
}

// Display a detailed browser CORS restriction help screen if local file fetching fails
function showCorsError(fileName, errorMessage) {
  loadingState.classList.add('hidden');
  modelsGrid.classList.add('hidden');
  emptyState.classList.add('hidden');
  
  let errorEl = document.getElementById('cors-error-panel');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.id = 'cors-error-panel';
    errorEl.className = 'glass-card rounded-2xl p-8 max-w-xl mx-auto mt-8 text-center border-rose-500/20 shadow-glass-glowing';
    modelsGrid.parentNode.insertBefore(errorEl, modelsGrid);
  }

  errorEl.innerHTML = `
    <div class="mx-auto w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mb-4">
      <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 class="text-lg font-bold text-white mb-2 font-display">CORS Security Restriction</h3>
    <p class="text-sm text-slate-300 leading-relaxed mb-6">
      Browsers block direct requests to local JSON files (<code class="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono">${fileName}</code>) when opening HTML pages via the local <code class="bg-slate-950 px-1 py-0.5 rounded text-rose-300 font-mono">file://</code> protocol.
    </p>
    <div class="text-left bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 mb-6 space-y-2">
      <p class="font-semibold text-white">To resolve this, serve the directory using a local web server:</p>
      <div class="bg-slate-900 p-2.5 rounded flex items-center justify-between border border-slate-800">
        <code class="text-emerald-400 font-mono">npx http-server</code>
      </div>
      <p class="text-[10px] text-slate-500">Or execute: <code class="font-mono">python -m http.server 8000</code></p>
    </div>
    <div class="flex gap-3 justify-center">
      <a href="http://localhost:8080" target="_blank" class="bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
        Open Local Host (http://localhost:8080)
      </a>
    </div>
  `;
}

// Helper to Format Numbers (e.g. 15400 -> 15.4K)
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// Calculate Aggregate Metrics
function calculateStats() {
  const totalModels = models.length;
  const totalDownloads = models.reduce((acc, m) => acc + (m.downloads || 0), 0);
  const totalLikes = models.reduce((acc, m) => acc + (m.likes || 0), 0);
  const totalViews = models.reduce((acc, m) => acc + (m.views || 0), 0);

  animateCounter(statTotalModels, totalModels);
  animateCounter(statTotalDownloads, totalDownloads, true);
  animateCounter(statTotalLikes, totalLikes, true);
  animateCounter(statTotalViews, totalViews, true);
}

// Stats Counter Animation
function animateCounter(element, targetValue, format = false) {
  let startValue = 0;
  const duration = 800; // ms
  const frameRate = 1000 / 60; // 60fps
  const totalFrames = Math.round(duration / frameRate);
  const increment = targetValue / totalFrames;
  let currentFrame = 0;

  const timer = setInterval(() => {
    currentFrame++;
    startValue += increment;
    
    if (currentFrame >= totalFrames) {
      clearInterval(timer);
      element.textContent = format ? formatNumber(targetValue) : targetValue;
    } else {
      element.textContent = format ? formatNumber(Math.round(startValue)) : Math.round(startValue);
    }
  }, frameRate);
}

// Shuffle order helper
function shuffleModels() {
  models.forEach(m => {
    m.shuffleOrder = Math.random();
  });
}

// Filter and Sort Models
function getFilteredAndSortedModels() {
  let result = [...models];

  // 1. Apply platform filter
  if (currentFilter !== 'all') {
    result = result.filter(m => m.platform.toLowerCase() === currentFilter);
  }

  // 2. Apply search query
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.creator.toLowerCase().includes(q) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // 3. Apply sorting
  result.sort((a, b) => {
    switch (currentSort) {
      case 'downloads-desc':
        return (b.downloads || 0) - (a.downloads || 0);
      case 'likes-desc':
        return (b.likes || 0) - (a.likes || 0);
      case 'views-desc':
        return (b.views || 0) - (a.views || 0);
      case 'name-asc':
        return a.title.localeCompare(b.title);
      case 'name-desc':
        return b.title.localeCompare(a.title);
      case 'creator-asc':
        return a.creator.localeCompare(b.creator);
      case 'creator-desc':
        return b.creator.localeCompare(a.creator);
      case 'shuffle':
        return (a.shuffleOrder || 0) - (b.shuffleOrder || 0);
      case 'updated-desc':
        return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
      default:
        return 0;
    }
  });

  return result;
}

// Render Model Grid
function renderModels() {
  const filteredModels = getFilteredAndSortedModels();
  modelsGrid.innerHTML = '';

  if (filteredModels.length === 0) {
    modelsGrid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  modelsGrid.classList.remove('hidden');

  filteredModels.forEach((model, index) => {
    const platInfo = PLATFORMS[model.platform] || {
      name: model.platform,
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      hoverGlow: 'hover:border-slate-500/40',
      logo: ''
    };

    // Render tags
    const tagsHtml = (model.tags || [])
      .slice(0, 3)
      .map(tag => `<span class="bg-slate-950/80 backdrop-blur-md text-[10px] font-medium text-slate-300 px-2 py-0.5 rounded border border-slate-800">${tag}</span>`)
      .join('');

    const card = document.createElement('div');
    card.className = `glass-card rounded-2xl overflow-hidden shadow-glass ${platInfo.hoverGlow} border border-slate-800/80 hover:border-slate-700/60 transition-all duration-300 flex flex-col h-full group relative opacity-0 translate-y-4`;
    card.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.05}s`;

    card.innerHTML = `
      <!-- Thumbnail -->
      <div class="relative overflow-hidden aspect-video bg-slate-900/60 border-b border-slate-800/50">
        <img src="${model.imageUrl}" alt="${model.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
        
        <!-- Platform Badge -->
        <span class="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${platInfo.bg}">
          ${platInfo.logo}
          ${platInfo.name}
        </span>

        <!-- Tags Overlay -->
        <div class="absolute bottom-2 left-2 flex gap-1.5 flex-wrap">
          ${tagsHtml}
        </div>
      </div>

      <!-- Card Content -->
      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <!-- Creator name -->
          <span class="text-[10px] font-semibold uppercase tracking-wider text-indigo-400/80 font-mono">${model.creator}</span>
          
          <!-- Title -->
          <a href="${model.url}" target="_blank" class="block mt-1">
            <h4 class="text-sm font-bold text-white leading-snug line-clamp-2 hover:text-indigo-300 transition duration-200" title="${model.title}">
              ${model.title}
            </h4>
          </a>
        </div>

        <div>
          <!-- Metrics Row -->
          <div class="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-center text-xs">
            <div class="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-800/20 transition" title="Views">
              <svg class="w-4 h-4 text-cyan-400/80 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span class="font-bold text-slate-200 text-[11px]">${formatNumber(model.views || 0)}</span>
            </div>
            
            <div class="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-800/20 transition" title="Downloads">
              <svg class="w-4 h-4 text-emerald-400/80 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span class="font-bold text-slate-200 text-[11px]">${formatNumber(model.downloads || 0)}</span>
            </div>

            <div class="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-800/20 transition" title="Likes">
              <svg class="w-4 h-4 text-rose-400/80 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span class="font-bold text-slate-200 text-[11px]">${formatNumber(model.likes || 0)}</span>
            </div>
          </div>

          <!-- Quick Link -->
          <a href="${model.url}" target="_blank" class="mt-4 w-full bg-slate-900/60 hover:bg-indigo-600/90 text-slate-300 hover:text-white border border-slate-800 hover:border-indigo-500/50 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300">
            Get Files
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    `;

    modelsGrid.appendChild(card);
  });
}

// Add animation keyframes dynamically
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

// Populate Configuration Details in Drawer
function renderConfigSummary() {
  drawerProfilesList.innerHTML = '';
  
  if (!config.profiles || config.profiles.length === 0) {
    drawerProfilesList.innerHTML = '<p class="text-xs text-slate-500">No profiles configured.</p>';
  } else {
    config.profiles.forEach(p => {
      const platInfo = PLATFORMS[p.platform.toLowerCase()] || { name: p.platform };
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs';
      item.innerHTML = `
        <div>
          <span class="font-bold text-white block">${p.username || 'Creator'}</span>
          <span class="text-slate-400 text-[10px]">${platInfo.name}</span>
        </div>
        <a href="${p.url || '#'}" target="_blank" class="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
          Profile
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      `;
      drawerProfilesList.appendChild(item);
    });
  }
}

// Handle Event Listeners
function setupEventListeners() {
  // Search Query
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery.trim() !== '') {
      searchClear.classList.remove('hidden');
    } else {
      searchClear.classList.add('hidden');
    }
    renderModels();
  });

  // Clear Search
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.add('hidden');
    renderModels();
  });

  // Reset Search from Empty State
  resetSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.add('hidden');
    currentFilter = 'all';
    
    // Reset platform tabs active class
    document.querySelectorAll('.filter-tab').forEach(tab => {
      if (tab.getAttribute('data-platform') === 'all') {
        tab.className = 'filter-tab px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 bg-indigo-600 text-white shadow-sm';
      } else {
        tab.className = 'filter-tab px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 text-slate-400 hover:text-slate-200';
      }
    });

    renderModels();
  });

  // Platform Filter Tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      // Clear active styles from all
      document.querySelectorAll('.filter-tab').forEach(t => {
        t.className = 'filter-tab px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 text-slate-400 hover:text-slate-200';
      });

      // Apply active style to clicked
      e.target.className = 'filter-tab px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 bg-indigo-600 text-white shadow-sm';

      currentFilter = e.target.getAttribute('data-platform');
      renderModels();
    });
  });

  // Sorting Selection
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderModels();
  });

  // Shuffle Button Click
  shuffleBtn.addEventListener('click', () => {
    shuffleModels();
    currentSort = 'shuffle';
    sortSelect.value = 'shuffle';
    renderModels();
  });

  // Open Configuration Drawer
  configBtn.addEventListener('click', () => {
    configDrawer.classList.remove('hidden');
    setTimeout(() => {
      drawerOverlay.classList.remove('opacity-0');
      drawerOverlay.classList.add('opacity-100');
      drawerContent.classList.remove('translate-x-full');
      drawerContent.classList.add('translate-x-0');
    }, 10);
  });

  // Close Configuration Drawer
  const closeDrawer = () => {
    drawerOverlay.classList.remove('opacity-100');
    drawerOverlay.classList.add('opacity-0');
    drawerContent.classList.remove('translate-x-0');
    drawerContent.classList.add('translate-x-full');
    setTimeout(() => {
      configDrawer.classList.add('hidden');
    }, 300);
  };

  drawerClose.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);
  drawerSaveBtn.addEventListener('click', closeDrawer);

  // Sync Button - Alerts instructions
  syncInfoBtn.addEventListener('click', () => {
    alert("To synchronize and fetch live profile statistics, please run the local sync script in your terminal:\n\nnode sync.js\n\nOnce completed, reload the web page to load the fresh models.json file.");
  });

  // Copy sync command
  copyCmdBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('node sync.js').then(() => {
      const originalText = copyCmdBtn.textContent;
      copyCmdBtn.textContent = 'Copied!';
      copyCmdBtn.className = 'text-xs text-emerald-400 transition font-medium';
      setTimeout(() => {
        copyCmdBtn.textContent = originalText;
        copyCmdBtn.className = 'text-xs text-indigo-400 hover:text-indigo-300 transition font-medium';
      }, 1500);
    });
  });
}

// Run Initialization
document.addEventListener('DOMContentLoaded', init);
