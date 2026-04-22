/* =============================================
   ADMIN.JS — Arvaan Admin Panel Shared Logic
   Auth guard, toasts, modal helpers, drag-drop
   ============================================= */
'use strict';

// ── Auth Guard ────────────────────────────────────────────────────────────────
function adminAuthGuard() {
  if (typeof AdminStore === 'undefined' || !AdminStore.isLoggedIn()) {
    window.location.href = 'index.html';
  }
}

function adminLogout() {
  AdminStore.clearSession();
  window.location.href = 'index.html';
}

function openStorefrontPreview() {
  window.open('../store/index.html', '_blank');
}

// ── Toast Notifications ───────────────────────────────────────────────────────
function adminToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('admin-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'admin-toast-container';
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Modal Helpers ─────────────────────────────────────────────────────────────
function openAdminModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeAdminModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
}

// Close on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('admin-modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ── Topbar Setup ──────────────────────────────────────────────────────────────
function setupTopbar(pageTitle) {
  // Ensure we have a container for content
  const main = document.querySelector('.admin-main');
  if (main && !document.querySelector('.admin-sidebar')) {
    renderAdminSidebar();
  }

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = pageTitle;

  const session = AdminStore.getSession();
  const emailEl = document.getElementById('topbar-email');
  if (emailEl && session) emailEl.textContent = session.email;

  const avatarEl = document.getElementById('topbar-avatar');
  if (avatarEl && session) avatarEl.textContent = session.email[0].toUpperCase();

  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) logoutBtn.onclick = adminLogout;
}

// ── Centralized Sidebar ───────────────────────────────────────────────────────
function renderAdminSidebar() {
  const layout = document.querySelector('.admin-layout');
  if (!layout) return;

  // Remove existing sidebar if any
  const existing = document.querySelector('.admin-sidebar');
  if (existing) existing.remove();

  const currentPath = window.location.pathname;
  const page = currentPath.split('/').pop() || 'dashboard.html';

  const sidebar = document.createElement('aside');
  sidebar.className = 'admin-sidebar';
  sidebar.id = 'admin-sidebar';
  
  sidebar.innerHTML = `
    <div class="admin-sidebar-header">
      <div class="admin-brand">
        <div class="admin-brand-icon">A</div>
        <div>
          <div class="admin-brand-text">Arvaan Admin</div>
          <div class="admin-brand-sub">Storefront Manager</div>
        </div>
      </div>
    </div>
    
    <div class="admin-nav">
      <div class="admin-nav-section">
        <div class="admin-nav-label">Overview</div>
        <a href="dashboard.html" class="admin-nav-item ${page === 'dashboard.html' ? 'active' : ''}">
          <span class="nav-icon">📊</span> Dashboard
        </a>
        <a href="#" class="admin-nav-item preview-btn" onclick="openStorefrontPreview(); return false;" style="margin-top: 10px;">
          <span class="nav-icon">👁️</span> Live Storefront
        </a>
      </div>
      
      <div class="admin-nav-section">
        <div class="admin-nav-label">Storefront Content</div>
        <a href="categories.html" class="admin-nav-item ${page === 'categories.html' ? 'active' : ''}">
          <span class="nav-icon">📁</span> Category Manager
        </a>
        <a href="homepage.html" class="admin-nav-item ${page === 'homepage.html' ? 'active' : ''}">
          <span class="nav-icon">🏠</span> Homepage Manager
        </a>
        <a href="filters.html" class="admin-nav-item ${page === 'filters.html' ? 'active' : ''}">
          <span class="nav-icon">🎛️</span> Filters Manager
        </a>
        <a href="pages.html" class="admin-nav-item ${page === 'pages.html' ? 'active' : ''}">
          <span class="nav-icon">📄</span> Pages CMS
        </a>
      </div>
      
      <div class="admin-nav-section">
        <div class="admin-nav-label">Configuration</div>
        <a href="settings.html" class="admin-nav-item ${page === 'settings.html' ? 'active' : ''}">
          <span class="nav-icon">⚙️</span> Site Settings
        </a>
      </div>
    </div>
    
    <div class="admin-sidebar-footer">
      <a href="#" class="admin-nav-item" id="admin-logout-btn-sidebar" onclick="adminLogout()">
        <span class="nav-icon">🚪</span> Logout
      </a>
    </div>
  `;

  layout.insertBefore(sidebar, layout.firstChild);
}

// ── Analytics & Simulation ────────────────────────────────────────────────────
function getSimulatedTrends(days = 7) {
  const trends = [];
  const baseVisit = 1200;
  for (let i = 0; i < days; i++) {
    trends.push(Math.floor(baseVisit + (Math.random() * 800) - 200));
  }
  return trends;
}

function updatePulseMetrics() {
  const pulseEl = document.getElementById('pulse-visitors');
  if (!pulseEl) return;
  
  setInterval(() => {
    const current = parseInt(pulseEl.textContent);
    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
    pulseEl.textContent = Math.max(10, current + change);
  }, 4000);
}

// ── Drag and Drop Reorder ─────────────────────────────────────────────────────
function enableDragReorder(container, itemSelector, onReorder) {
  let dragSrc = null;

  function getItems() { return [...container.querySelectorAll(itemSelector)]; }

  container.addEventListener('dragstart', e => {
    const item = e.target.closest(itemSelector);
    if (!item) return;
    dragSrc = item;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragend', e => {
    const item = e.target.closest(itemSelector);
    if (item) item.classList.remove('dragging');
    container.querySelectorAll(`.drag-over`).forEach(el => el.classList.remove('drag-over'));
    if (onReorder) onReorder(getItems());
  });

  container.addEventListener('dragover', e => {
    e.preventDefault();
    const item = e.target.closest(itemSelector);
    if (!item || item === dragSrc) return;
    container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    item.classList.add('drag-over');
    const allItems = getItems();
    const srcIdx = allItems.indexOf(dragSrc);
    const tgtIdx = allItems.indexOf(item);
    if (srcIdx < tgtIdx) item.after(dragSrc);
    else item.before(dragSrc);
  });

  container.addEventListener('drop', e => {
    e.preventDefault();
    container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  });

  // Make items draggable
  const observer = new MutationObserver(() => {
    container.querySelectorAll(itemSelector).forEach(el => { el.draggable = true; });
  });
  observer.observe(container, { childList: true, subtree: true });
  container.querySelectorAll(itemSelector).forEach(el => { el.draggable = true; });
}

// ── Slug Generator ────────────────────────────────────────────────────────────
function generateSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}

// ── Tags Input ────────────────────────────────────────────────────────────────
function initTagsInput(wrapEl, initial = [], onChange) {
  let tags = [...initial];

  function render() {
    const input = wrapEl.querySelector('.tags-input');
    const chips = wrapEl.querySelectorAll('.tag-chip');
    chips.forEach(c => c.remove());

    tags.forEach((tag, i) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `${tag}<span class="tag-remove" data-i="${i}">×</span>`;
      wrapEl.insertBefore(chip, input);
    });

    wrapEl.querySelectorAll('.tag-remove').forEach(btn => {
      btn.onclick = () => { tags.splice(+btn.dataset.i, 1); render(); if (onChange) onChange(tags); };
    });
  }

  const input = wrapEl.querySelector('.tags-input');
  if (input) {
    input.onkeydown = e => {
      if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
        e.preventDefault();
        const val = input.value.trim().replace(/,$/, '');
        if (val && !tags.includes(val)) { tags.push(val); render(); if (onChange) onChange(tags); }
        input.value = '';
      }
      if (e.key === 'Backspace' && !input.value && tags.length) {
        tags.pop(); render(); if (onChange) onChange(tags);
      }
    };
  }

  wrapEl.onclick = () => { if (input) input.focus(); };
  render();
  return { getTags: () => tags, setTags: (t) => { tags = [...t]; render(); } };
}

// ── Color Input Sync ──────────────────────────────────────────────────────────
function initColorInput(swatchId, hexId, onChange) {
  const swatch = document.getElementById(swatchId);
  const hexInput = document.getElementById(hexId);
  if (!swatch || !hexInput) return;

  const colorInput = swatch.querySelector('input[type=color]');
  if (!colorInput) return;

  function sync(val) {
    colorInput.value = val;
    hexInput.value = val;
    swatch.style.background = val;
    if (onChange) onChange(val);
  }

  colorInput.oninput = () => sync(colorInput.value);
  hexInput.oninput = () => {
    const v = hexInput.value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) sync(v);
  };

  return { getValue: () => hexInput.value, setValue: (v) => sync(v) };
}

// ── Apply Admin Site Config to Storefront CSS vars ────────────────────────────
function applyAdminSiteConfig() {
  if (typeof AdminStore === 'undefined') return;
  const cfg = AdminStore.getSiteConfig();
  if (!cfg) return;
  const root = document.documentElement;
  if (cfg.primaryColor) root.style.setProperty('--clr-primary', cfg.primaryColor);
  if (cfg.accentColor)  root.style.setProperty('--clr-accent',  cfg.accentColor);
}

// ── Live Preview Link ─────────────────────────────────────────────────────────
function openStorefrontPreview() {
  const path = window.location.pathname;
  const storeBase = path.includes('/admin/') ? '../store/index.html' : 'store/index.html';
  window.open(storeBase, '_blank');
}

// Initialize defaults + expose
if (typeof AdminStore !== 'undefined') {
  AdminStore.initDefaults();
}

window.adminToast = adminToast;
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.setupTopbar = setupTopbar;
window.renderAdminSidebar = renderAdminSidebar;
window.adminLogout = adminLogout;
window.adminAuthGuard = adminAuthGuard;
window.enableDragReorder = enableDragReorder;
window.generateSlug = generateSlug;
window.initTagsInput = initTagsInput;
window.initColorInput = initColorInput;
window.applyAdminSiteConfig = applyAdminSiteConfig;
window.openStorefrontPreview = openStorefrontPreview;
window.getSimulatedTrends = getSimulatedTrends;
window.updatePulseMetrics = updatePulseMetrics;
