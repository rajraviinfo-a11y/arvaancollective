/* =============================================
   SELLER.JS — Seller Panel Logic
   ============================================= */

'use strict';

// ── State ────────────────────────────────────────────────────────────────────
const SellerState = {
  currentPage: 'dashboard',
  editingProductId: null,
  productSearch: '',
  orderSearch: '',
  currentSeller: null,
  // Wizard State
  currentWizardStep: 1,
  productGallery: [],
  variantMatrix: []
};

// ── Currency & Utility Helpers ───────────────────────────────────────────────
const CurrencyConfig = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 1/83 }
};

let currentCurrency = 'INR';
try {
  if (typeof Store !== 'undefined' && Store.getSettings) {
    currentCurrency = Store.getSettings().currency;
  }
} catch(e) { console.error("Currency init failed", e); }

function formatCurrency(amt) {
  const code = currentCurrency || 'INR';
  if (code === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt / 83);
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
}

function toBaseCurrency(val) {
  const code = currentCurrency || 'INR';
  if (code === 'USD') return val * 83; // Convert USD input to INR internal base
  return val; // Already in INR
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const SafeUI = {
  get(id) { return document.getElementById(id); },
  all(sel) { return document.querySelectorAll(sel); },
  safeHTML(id, html) { const el = this.get(id); if (el) el.innerHTML = html; },
  safeSet(id, prop, val) { const el = this.get(id); if (el) el[prop] = val; },
  safeHide(id) { const el = this.get(id); if (el) el.classList.add('hidden'); },
  safeShow(id) { const el = this.get(id); if (el) el.classList.remove('hidden'); }
};

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  setTimeout(() => {
    document.querySelectorAll('.modal-overlay:not(.active)').forEach(el => el.classList.add('hidden'));
  }, 350);
  document.body.style.overflow = '';
}

function toggleUserDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('user-dropdown-menu');
  if (menu) menu.classList.toggle('active');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-dropdown-menu');
  if (menu && menu.classList.contains('active') && !e.target.closest('.dropdown')) {
    menu.classList.remove('active');
  }
});

function showToast(title, msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${msg}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}


// ── Navigation ────────────────────────────────────────────────────────────────
// ── Navigation ────────────────────────────────────────────────────────────────
function initSellerPage() {
  Store.init();
  const saved = Auth.getSeller();
  
  const path = window.location.pathname;
  const isLoginPage = path.endsWith('seller.html');
  
  if (!saved) {
    // Redirect to login if not authenticated on a subpage
    if (!isLoginPage && (path.includes('seller-') || path.includes('/seller/'))) {
      window.location.href = 'seller.html';
      return;
    }
  } else {
    // If logged in and on login page, go to dashboard
    if (isLoginPage) {
      window.location.href = 'seller-dashboard.html';
      return;
    }
  }

  const page = path.split('/').pop().replace('seller-', '').replace('.html', '') || 'dashboard';
  
  SellerState.currentSeller = saved;
  if (saved) renderSellerApp();

  // Set active state in sidebar
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    const itemPage = n.getAttribute('data-page');
    if (itemPage === page) n.classList.add('active');
  });

  // Helper to render the current page section
  function renderCurrentPage() {
    if (page === 'dashboard' || page === 'seller') renderDashboard();
    if (page === 'products') renderProductsTable();
    if (page === 'promotions') renderPromotionsTable();
    if (page === 'reviews') renderReviewsTable();
    if (page === 'orders') renderOrdersTable();
    if (page === 'analytics') renderAnalytics();
    if (page === 'financials') renderFinancials();
    if (page === 'settings') renderSettings();
  }

  // Initial render with whatever is in localStorage right now
  renderCurrentPage();

  // Re-render after Firebase bootstrap completes so cloud data is shown
  document.addEventListener('arvaan:cloud-ready', () => {
    console.log('[SellerPage] Cloud ready — re-rendering page content');
    renderCurrentPage();
  }, { once: true });
}

function renderSellerApp() {
  const seller = SellerState.currentSeller;
  if (!seller) return;
  SafeUI.safeHTML('sidebar-seller-name', seller.name);
  SafeUI.safeHTML('sidebar-seller-email', seller.email);
  SafeUI.safeHTML('dropdown-seller-name', seller.name);
  SafeUI.safeHTML('dropdown-seller-email', seller.email);
  
  const avatarText = seller.name ? seller.name.charAt(0).toUpperCase() : 'S';
  SafeUI.safeHTML('sidebar-seller-avatar', avatarText);
  SafeUI.safeHTML('topbar-seller-avatar', avatarText);
}

function renderSellerAuthPage() {
  // Handle UI changes when logged out
}

function navigateTo(page) {
  const targetFile = `seller-${page}.html`;
  // If we are already on the page or it doesn't exist, just return
  if (window.location.pathname.includes(targetFile)) return;
  
  // For the main seller.html, redirect accordingly
  window.location.href = targetFile;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function changeDashboardPeriod(period, btn) {
  // Update UI segments
  document.querySelectorAll('.segment').forEach(s => s.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Trigger Skeletons (UX)
  const elements = [
    document.getElementById('stat-revenue'),
    document.getElementById('stat-orders'),
    document.getElementById('sales-map-container'),
    document.getElementById('top-products-list'),
    document.getElementById('top-customers-list')
  ];
  
  elements.forEach(el => {
    if (el) el.classList.add('skeleton');
    if (el && el.tagName === 'TBODY') el.innerHTML = '<tr><td colspan="4" style="height:100px"></td></tr>';
  });

  setTimeout(() => {
    elements.forEach(el => el && el.classList.remove('skeleton'));
    
    // Detect which page we are on to render correctly
    if (document.getElementById('section-analytics')) {
      const revTotal = orders.reduce((sum, o) => sum + o.total, 0);
      const avgOrder = orders.length ? revTotal / orders.length : 0;
      
      SafeUI.safeHTML('analytics-revenue', formatCurrency(revTotal));
      SafeUI.safeHTML('analytics-orders', String(orders.length));
      SafeUI.safeHTML('analytics-avg', formatCurrency(avgOrder));
      SafeUI.safeHTML('analytics-products', String(products.length));
      renderAnalytics(period === 'all' ? null : period);
    } else {
      renderDashboard(period === 'all' ? null : period);
    }
  }, 400);
}

function renderDashboard(daysLimit = null) {
  const seller = SellerState.currentSeller;
  const config = CurrencyConfig[currentCurrency] || CurrencyConfig.USD;
  const all_products = Store.getProducts().filter(p => p.sellerId === seller.id || p.seller === seller.id);
  const all_orders = Store.getOrders().filter(o => o.sellerId === seller.id);
  
  const revenue = all_orders.reduce((sum, o) => sum + o.total, 0);
  const pending = all_orders.filter(o => o.status === 'pending').length;
  
  SafeUI.safeHTML('stat-revenue', formatCurrency(revenue));
  SafeUI.safeHTML('stat-orders', String(all_orders.length));
  SafeUI.safeHTML('stat-products', String(all_products.length));
  SafeUI.safeHTML('stat-pending', String(pending));
  
  // Also update financial balance if in financials section
  SafeUI.safeHTML('fin-balance', formatCurrency(seller.payoutBalance || 0));
  SafeUI.safeHTML('fin-upcoming', formatCurrency(seller.upcomingPayout || 0));
  SafeUI.safeHTML('fin-alltime', formatCurrency(seller.totalSales || 0));

  // Filter by date
  let filtered_orders = all_orders;
  if (daysLimit) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysLimit);
    filtered_orders = all_orders.filter(o => new Date(o.date) >= cutoff);
  }

  // Growth Logic
  const now = new Date();
  const prevStart = new Date(now);
  prevStart.setMonth(now.getMonth() - 1);
  const prevOrders = Store.getOrders().filter(o => {
    const d = new Date(o.date);
    return o.sellerId === seller.id && d >= prevStart && d < now;
  });
  const prevRev = prevOrders.reduce((s, o) => s + o.total, 0);
  const revGrowth = prevRev === 0 ? 0 : ((revenue - prevRev) / prevRev) * 100;
  // Update Main Dashboard Stats (if present)
  if (document.getElementById('stat-revenue')) {
    document.getElementById('stat-revenue').textContent = formatCurrency(revenue);
    document.getElementById('stat-orders').textContent = ordersCount;
    document.getElementById('stat-products').textContent = all_products.length;
    document.getElementById('stat-pending').textContent = pending;
  }

  const revGrowthEl = document.getElementById('stat-revenue-growth');
  if (revGrowthEl) {
    revGrowthEl.textContent = `${revGrowth >= 0 ? '↑' : '↓'} ${Math.abs(revGrowth).toFixed(0)}%`;
    revGrowthEl.className = `stat-change ${revGrowth >= 0 ? 'up' : 'down'}`;
  }
  
  const orderGrowthEl = document.getElementById('stat-orders-growth');
  if (orderGrowthEl) {
    orderGrowthEl.textContent = `${orderGrowth >= 0 ? '↑' : '↓'} ${Math.abs(orderGrowth).toFixed(0)}%`;
    orderGrowthEl.className = `stat-change ${orderGrowth >= 0 ? 'up' : 'down'}`;
  }

  renderRevenueChart(all_orders);
  renderCategoryChart(all_orders, all_products);
  renderRecentOrdersTable(all_orders.slice().reverse().slice(0, 5));
  renderDashboardAlerts(all_products, all_orders);
}

function renderAnalytics(daysLimit = null) {
  const seller = SellerState.currentSeller;
  let all_orders = Store.getOrders().filter(o => o.sellerId === seller.id);
  const all_products = Store.getProducts().filter(p => p.seller === seller.id || p.sellerId === seller.id);

  if (daysLimit) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysLimit);
    all_orders = all_orders.filter(o => new Date(o.date) >= cutoff);
  }

  renderSalesMap(all_orders);
  renderTopProducts(all_orders, all_products);
  renderTopCustomers(all_orders);
}

function renderSalesMap(orders) {
  const container = document.getElementById('sales-map-container');
  if (!container) return;

  // City to SVG Coordinates (%)
  const cityMap = {
    'austin': { x: 18, y: 46, name: 'Austin, TX' },
    'new york': { x: 23, y: 38, name: 'New York, NY' },
    'seattle': { x: 14, y: 35, name: 'Seattle, WA' },
    'london': { x: 47, y: 32, name: 'London, UK' },
    'dubai': { x: 62, y: 48, name: 'Dubai, UAE' },
    'mumbai': { x: 71, y: 55, name: 'Mumbai, IN' },
    'tokyo': { x: 88, y: 45, name: 'Tokyo, JP' }
  };

  const salesByCity = {};
  orders.forEach(o => {
    const loc = o.address.split(',')[1]?.trim().toLowerCase() || o.address.toLowerCase();
    for (const [key, coords] of Object.entries(cityMap)) {
      if (loc.includes(key)) {
        if (!salesByCity[key]) salesByCity[key] = { ...coords, count: 0, revenue: 0 };
        salesByCity[key].count++;
        salesByCity[key].revenue += o.total;
        break;
      }
    }
  });

  const hotspots = Object.values(salesByCity);
  console.log(`[Sales Map] Rendering for ${orders.length} orders. Found ${hotspots.length} hotspots.`);

  const mapSvg = `
    <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" style="width:100%; height:100%; filter: drop-shadow(0 0 20px rgba(0,0,0,0.2))">
      <!-- Minimalist World Outlines -->
      <g fill="rgba(0,0,0,0.05)" stroke="var(--clr-border)" stroke-width="1.5" stroke-linejoin="round">
        <path d="M120,120 Q160,80 200,100 T280,90 T350,120 T400,100 T500,130 T600,110 T750,130 T850,110 T950,150 V300 Q900,350 800,320 T650,380 T500,350 T350,400 T200,350 T100,300 Z" />
        <circle cx="200" cy="150" r="100" opacity="0.04" fill="var(--clr-primary)" />
        <circle cx="700" cy="250" r="150" opacity="0.04" fill="var(--clr-primary)" />
      </g>
      
      <!-- Animated Hotspots -->
      ${hotspots.map(h => {
        const size = Math.min(18, 8 + h.count * 3);
        const svgX = (h.x / 100) * 1000;
        const svgY = (h.y / 100) * 500;
        return `
          <g class="hotspot-group" style="cursor:pointer" onmouseenter="showMapTooltip('${h.name}', ${h.count}, ${h.revenue}, event)" onmouseleave="hideMapTooltip()">
            <circle class="pulse-ring" cx="${svgX}" cy="${svgY}" r="${size * 1.5}" />
            <circle class="map-hotspot" cx="${svgX}" cy="${svgY}" r="${size / 2}" fill="var(--clr-primary)" filter="drop-shadow(0 0 8px var(--clr-primary))" />
          </g>
        `;
      }).join('')}
    </svg>
  `;

  container.innerHTML = mapSvg + `
    <div id="map-tooltip" class="glass-card" style="position:absolute; display:none; padding:12px 16px; border-radius:12px; font-size:0.8rem; z-index:100; pointer-events:none; background:var(--clr-bg-2); border:1px solid var(--clr-border); color:var(--clr-text); box-shadow:0 10px 30px rgba(0,0,0,0.1)"></div>
  `;

  // Update Legend
  const legend = document.getElementById('top-regions-list');
  if (legend) {
    const sorted = hotspots.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    if (sorted.length === 0) {
      legend.innerHTML = '<div style="font-size:0.7rem; color:var(--clr-text-3)">No geographic data yet.</div>';
    } else {
      legend.innerHTML = sorted.map(h => `
        <div class="map-region-row">
          <span style="font-weight:600">${h.name}</span>
          <span style="font-weight:700; color:var(--clr-primary)">${formatCurrency(h.revenue)}</span>
        </div>
      `).join('');
    }
  }
}

function showMapTooltip(name, count, revenue, event) {
  const tt = document.getElementById('map-tooltip');
  if (!tt) return;
  tt.style.display = 'block';
  tt.innerHTML = `
    <div style="font-weight:700; margin-bottom:4px">${name}</div>
    <div style="display:flex; justify-content:space-between; gap:12px">
      <span style="color:var(--clr-text-3)">Orders</span>
      <span style="font-weight:600">${count}</span>
    </div>
    <div style="display:flex; justify-content:space-between; gap:12px">
      <span style="color:var(--clr-text-3)">Revenue</span>
      <span style="font-weight:600; color:var(--clr-success)">${formatCurrency(revenue)}</span>
    </div>
  `;
  
  // Position tooltip
  const rect = event.currentTarget.getBoundingClientRect();
  const parentRect = tt.parentElement.getBoundingClientRect();
  tt.style.left = (rect.left - parentRect.left + rect.width / 2) + 'px';
  tt.style.top = (rect.top - parentRect.top - 70) + 'px';
  tt.style.transform = 'translateX(-50%)';
}

function hideMapTooltip() {
  const tt = document.getElementById('map-tooltip');
  if (tt) tt.style.display = 'none';
}

function renderTopCustomers(orders) {
  const container = document.getElementById('top-customers-list');
  if (!container) return;

  const customerStats = {};
  orders.forEach(o => {
    if (!customerStats[o.userId]) {
      customerStats[o.userId] = { userId: o.userId, orders: 0, ltv: 0 };
    }
    customerStats[o.userId].orders += 1;
    customerStats[o.userId].ltv += o.total;
  });

  const sorted = Object.values(customerStats).sort((a, b) => b.ltv - a.ltv).slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<tr><td colspan="4" class="text-center">No customer data available.</td></tr>';
    return;
  }

  container.innerHTML = sorted.map(c => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar avatar-sm" style="background:var(--clr-bg-3);font-size:0.65rem">${c.userId.charAt(0).toUpperCase()}</div>
          <div style="font-weight:600;font-size:0.8rem">${getUserName(c.userId)}</div>
        </div>
      </td>
      <td style="font-weight:600">${c.orders}</td>
      <td style="font-weight:700">${formatCurrency(c.ltv)}</td>
      <td class="text-right">
        <span class="badge ${c.ltv > 500 ? 'badge-success' : 'badge-ghost'}" style="font-size:0.65rem">
          ${c.ltv > 500 ? '⭐ VIP' : 'Active'}
        </span>
      </td>
    </tr>
  `).join('');
}

function renderDashboardAlerts(products, orders) {
  const alertsDiv = document.getElementById('dashboard-alerts');
  const lowStockList = document.getElementById('low-stock-list');
  const staleOrdersList = document.getElementById('stale-orders-list');
  if (!alertsDiv || !lowStockList || !staleOrdersList) return;

  const lowStock = products.filter(p => p.stock < 10);
  const staleOrders = orders.filter(o => {
    if (o.status !== 'pending' && o.status !== 'processing') return false;
    const orderDate = new Date(o.date);
    const now = new Date();
    const diff = (now - orderDate) / (1000 * 60 * 60 * 24);
    return diff > 2;
  });

  if (lowStock.length > 0 || staleOrders.length > 0) {
    alertsDiv.style.display = 'block';
    
    if (lowStock.length > 0) {
      lowStockList.innerHTML = lowStock.map(p => `
        <div style="margin-bottom:4px; display:flex; justify-content:space-between">
          <span>${escapeHtml(p.name)}</span>
          <span class="badge badge-danger" style="font-size:0.7rem">${p.stock} left</span>
        </div>`).join('');
    } else {
      lowStockList.textContent = 'All products healthy.';
    }

    if (staleOrders.length > 0) {
      staleOrdersList.innerHTML = staleOrders.map(o => `
        <div style="margin-bottom:4px; display:flex; justify-content:space-between">
          <span>Order ${o.id}</span>
          <span style="font-weight:700">${o.date}</span>
        </div>`).join('');
    } else {
      staleOrdersList.textContent = 'No stale orders.';
    }
  } else {
    alertsDiv.style.display = 'none';
  }
}

function renderRevenueChart(all_orders) {
  if (!all_orders) return;
  const canvas = document.getElementById('revenue-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.parentElement.offsetWidth || 500;
  const H = canvas.height = 200;
  const data = new Array(6).fill(0);
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('default', { month: 'short' }));
    
    // Calculate actual revenue for this month
    const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
    const monthRevenue = all_orders
      .filter(o => o.date.startsWith(monthStr))
      .reduce((s, o) => s + o.total, 0);
    data[5-i] = monthRevenue || (Math.random() * 2000 + 3000); // Baseline placeholder if no data
  }
  const max = Math.max(...data, 1000) * 1.1;
  const pad = { t: 20, r: 20, b: 40, l: 60 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = 'rgba(160,160,184,0.6)';
    ctx.font = '11px Inter'; ctx.textAlign = 'right';
    const curr = CurrencyConfig[window.currentCurrency || 'USD'] || CurrencyConfig.USD;
    ctx.fillText(curr.symbol + Math.round(max * (1 - i / 4) / 1000) + 'k', pad.l - 8, y + 4);
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
  grad.addColorStop(0, 'rgba(108,99,255,0.3)');
  grad.addColorStop(1, 'rgba(108,99,255,0)');

  const step = chartW / (data.length - 1);
  const pts = data.map((v, i) => ({ x: pad.l + i * step, y: pad.t + chartH - (v / max) * chartH }));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pad.t + chartH);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, pad.t + chartH);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach((p, i) => {
    if (i > 0) {
      const prev = pts[i - 1];
      const cx = (prev.x + p.x) / 2;
      ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
    }
  });
  ctx.strokeStyle = '#6C63FF'; ctx.lineWidth = 2.5; ctx.stroke();

  // Dots
  pts.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#6C63FF'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  });

  // X labels
  months.forEach((m, i) => {
    ctx.fillStyle = 'rgba(160,160,184,0.8)';
    ctx.font = '11px Inter'; ctx.textAlign = 'center';
    ctx.fillText(m, pad.l + i * step, H - 8);
  });
}

function renderCategoryChart(orders, all_products) {
  if (!orders || !all_products) return;
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 160;
  canvas.width = size; canvas.height = size;
  
  const seller = SellerState.currentSeller;
  const products = all_products;
  
  const catSales = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        catSales[p.category] = (catSales[p.category] || 0) + (item.price * item.qty);
      }
    });
  });

  const entries = Object.entries(catSales).sort((a,b) => b[1] - a[1]);
  const totalRev = entries.reduce((s, [, v]) => s + v, 0);
  
  if (totalRev === 0) {
    // Fallback if no sales yet
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.arc(size/2, size/2, 60, 0, Math.PI*2); ctx.fill();
    return;
  }

  const colors = ['#6C63FF', '#00D4AA', '#FF6B6B', '#FFD93D', '#4CAF50', '#2196F3'];
  let startAngle = -Math.PI / 2;
  const cx = size / 2, cy = size / 2, r = 60;
  entries.forEach(([cat, val], i) => {
    const sliceAngle = (val / totalRev) * 2 * Math.PI;
    ctx.fillStyle = `hsl(${i * 60}, 70%, 60%)`;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2);
    ctx.arc(size / 2, size / 2, 60, startAngle, startAngle + sliceAngle);
    ctx.fill();
    startAngle += sliceAngle;
  });
  
  // Inner circle
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--clr-bg').trim() || '#FFFFFF';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 45, 0, 2 * Math.PI);
  ctx.fill();
}

function renderTopProducts(orders, all_products) {
  const container = document.getElementById('top-products-list');
  if (!container) return;

  const productStats = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      if (!productStats[item.productId]) {
        productStats[item.productId] = { id: item.productId, name: item.name, sold: 0, revenue: 0, image: item.image };
      }
      productStats[item.productId].sold += item.qty;
      productStats[item.productId].revenue += item.price * item.qty;
    });
  });

  const sorted = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<tr><td colspan="4" class="text-center">No sales data yet.</td></tr>';
    return;
  }

  container.innerHTML = sorted.map(p => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <img src="${p.image}" style="width:32px;height:32px;border-radius:4px;object-fit:cover;border:1px solid var(--clr-border)">
          <div style="font-weight:600;font-size:0.8rem">${escapeHtml(p.name)}</div>
        </div>
      </td>
      <td><span class="badge badge-ghost">${p.sold}</span></td>
      <td style="font-weight:700">${formatCurrency(p.revenue)}</td>
      <td class="text-right">
        <a href="seller-products.html?id=${p.id}" class="btn btn-ghost btn-sm">👁️</a>
      </td>
    </tr>
  `).join('');
}

function renderRecentOrdersTable(orders) {
  const tbody = document.getElementById('recent-orders-body');
  if (!tbody) return;
  if (!orders.length) { tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:32px">No orders yet</div></td></tr>`; return; }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><span style="font-weight:600">${o.id}</span></td>
      <td>${getUserName(o.userId)}</td>
      <td>${formatCurrency(o.total)}</td>
      <td>${getStatusBadge(o.status)}</td>
      <td>${formatDate(o.date)}</td>
    </tr>`).join('');
}

function getUserName(userId) {
  const buyers = Store.getBuyers();
  const user = buyers.find(u => u.id === userId);
  return user ? escapeHtml(user.name) : 'Guest';
}

function getStatusBadge(status) {
  if (!status) return '<span class="badge badge-ghost">Unknown</span>';
  const s = status.toLowerCase();
  let cls = 'badge-ghost';
  if (s === 'pending') cls = 'badge-warning';
  if (s === 'processing' || s === 'paid') cls = 'badge-info';
  if (s === 'ready_to_ship' || s === 'shipped') cls = 'badge-primary';
  if (s === 'delivered') cls = 'badge-success';
  if (s === 'cancelled') cls = 'badge-danger';
  
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch(e) { return dateStr; }
}


// ── Products Table ────────────────────────────────────────────────────────────
function renderProductsTable() {
  const seller = SellerState.currentSeller;
  let products = Store.getProducts().filter(p => p.seller === seller.id || p.sellerId === seller.id);
  if (SellerState.productSearch) {
    const q = SellerState.productSearch.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;
  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state" style="padding:32px"><div class="empty-icon">📦</div><h3>No products yet</h3><p>Add your first product!</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><input type="checkbox" class="product-chk" value="${p.id}" onclick="updateProductBulkButtons()"></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${p.images[0]}" style="width:40px;height:40px;object-fit:cover;border-radius:6px" onerror="this.src='https://placehold.co/40x40/1a1a2e/6C63FF?text=P'">
          <div>
            <div style="font-weight:600;font-size:.85rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(p.name)}</div>
            <div style="font-size:.72rem;color:var(--clr-text-3)">${p.id}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(p.category)}</td>
      <td>${escapeHtml(p.subCategory || p.sub_category || '-')}</td>
      <td>
        <div style="position:relative; width:90px">
          <input type="number" class="form-control btn-sm" value="${(p.price * (CurrencyConfig[currentCurrency]?.rate || 1)).toFixed(2)}" style="font-weight:700" onchange="quickUpdateProduct('${p.id}', 'price', this.value)">
        </div>
      </td>
      <td>
        <div class="stock-stepper" id="stepper-${p.id}">
          <button class="stock-stepper-btn" onclick="updateStockFromStepper('${p.id}', -1)" title="Decrease stock">−</button>
          <input type="number" class="form-control stock-stepper-input ${p.stock < 10 ? 'stock-critical' : ''}" id="stock-input-${p.id}" value="${p.stock}" min="0" onchange="quickUpdateProduct('${p.id}', 'stock', this.value)" onkeydown="if(event.key==='Enter') this.blur()">
          <button class="stock-stepper-btn" onclick="updateStockFromStepper('${p.id}', 1)" title="Increase stock">+</button>
        </div>
        ${p.stock < 10 ? `<div class="low-stock-badge">⚠ Low</div>` : ''}
      </td>
      <td>${(p.sold || 0).toLocaleString()}</td>
      <td>
        <span class="badge ${p.status === 'draft' ? 'badge-draft' : (p.isActive !== false ? 'badge-success' : 'badge-danger')}" style="cursor:pointer" onclick="toggleProductStatus('${p.id}')">
          ${p.status === 'draft' ? '📝 Draft' : (p.isActive !== false ? '✅ Active' : '🚫 Inactive')}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="openEditProduct('${p.id}')" title="Full Edit">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')" title="Delete Product">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

function quickUpdateProduct(id, field, value) {
  const products = Store.getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return;

  const rawVal = field === 'price' ? parseFloat(value) : parseInt(value, 10);
  if (isNaN(rawVal) || rawVal < 0) {
    showToast('Invalid Value', 'Please enter a valid non-negative number.', 'error');
    // Reset input to stored value
    const input = document.getElementById(`stock-input-${id}`);
    if (input) input.value = products[idx][field];
    return;
  }

  // If we're updating price, it's a local input, so back-convert to base (USD)
  const newVal = field === 'price' ? toBaseCurrency(rawVal) : rawVal;
  products[idx][field] = newVal;
  Store.setProducts(products);

  if (field === 'stock') {
    flashStockSuccess(id, newVal);
    if (newVal === 0) {
      showToast('Out of Stock', `"${products[idx].name}" is now out of stock!`, 'error');
    } else if (newVal < 10) {
      showToast('Low Stock', `"${products[idx].name}" has only ${newVal} units left.`, 'warning');
    } else {
      showToast('Stock Updated', `"${products[idx].name}" stock set to ${newVal} units.`, 'success');
    }
  } else {
    showToast('Price Updated', `"${products[idx].name}" price updated to ${formatCurrency(newVal)}`, 'success');
  }
}

function updateStockFromStepper(id, delta) {
  const input = document.getElementById(`stock-input-${id}`);
  if (!input) return;
  const current = parseInt(input.value, 10) || 0;
  const newVal = Math.max(0, current + delta);
  input.value = newVal;
  quickUpdateProduct(id, 'stock', newVal);
}

function flashStockSuccess(id, newStock) {
  const input = document.getElementById(`stock-input-${id}`);
  if (!input) return;

  // Update critical styling
  if (newStock < 10) {
    input.classList.add('stock-critical');
  } else {
    input.classList.remove('stock-critical');
  }

  // Update the low-stock badge dynamically
  const stepper = document.getElementById(`stepper-${id}`);
  if (stepper) {
    let badge = stepper.parentElement.querySelector('.low-stock-badge');
    if (newStock < 10 && !badge) {
      badge = document.createElement('div');
      badge.className = 'low-stock-badge';
      badge.textContent = '⚠ Low';
      stepper.parentElement.appendChild(badge);
    } else if (newStock >= 10 && badge) {
      badge.remove();
    }
  }

  // Green glow flash
  input.classList.add('updated-success');
  setTimeout(() => input.classList.remove('updated-success'), 1800);
}

function updateProductBulkButtons() {
  const selected = document.querySelectorAll('.product-chk:checked');
  const bulkBar = document.getElementById('product-bulk-actions');
  const countSpan = document.getElementById('selected-products-count');
  if (bulkBar) bulkBar.style.display = selected.length > 0 ? 'flex' : 'none';
  if (countSpan) countSpan.textContent = selected.length;
}

function toggleAllProducts(chk) {
  document.querySelectorAll('.product-chk').forEach(c => c.checked = chk.checked);
  updateProductBulkButtons();
}

function toggleProductStatus(id) {
  const products = Store.getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx > -1) {
    products[idx].isActive = products[idx].isActive === false;
    Store.setProducts(products);
    renderProductsTable();
    showToast('Status Updated', `"${products[idx].name}" is now ${products[idx].isActive !== false ? 'Active' : 'Inactive'}`);
  }
}

function bulkToggleProductStatus(active) {
  const selected = Array.from(document.querySelectorAll('.product-chk:checked')).map(c => c.value);
  const products = Store.getProducts();
  products.forEach(p => {
    if (selected.includes(p.id)) p.isActive = active;
  });
  Store.setProducts(products);
  renderProductsTable();
  showToast('Bulk Update', `Updated ${selected.length} products`);
}

function bulkDeleteProducts() {
  const selected = Array.from(document.querySelectorAll('.product-chk:checked')).map(c => String(c.value));
  if (!selected.length) return;
  if (!confirm(`Delete ${selected.length} products? This cannot be undone.`)) return;
  
  // Delete from cloud immediately if connected
  if (typeof CloudDB !== 'undefined' && CloudDB.ready) {
    selected.forEach(id => CloudDB.deleteItem('products', id));
  }
  
  // Record in permanent deleted-IDs list so seed merge never restores them
  Store.addDeletedIds(selected);
  const products = Store.getProducts().filter(p => !selected.includes(String(p.id)));
  Store.setProducts(products);
  renderProductsTable();
  showToast('Bulk Delete', `Removed ${selected.length} products`, 'info');
}

// ── Bulk Inventory Editor ───────────────────────────────────────────────────
function openBulkEditor() {
  const seller = SellerState.currentSeller;
  const products = Store.getProducts().filter(p => p.seller === seller.id || p.sellerId === seller.id);
  const tbody = document.getElementById('bulk-inventory-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No products found.</td></tr>';
  } else {
    tbody.innerHTML = products.map(p => `
      <tr data-id="${p.id}">
        <td>
          <div style="display:flex;align-items:center;gap:12px">
            <img src="${p.images[0]}" style="width:36px;height:36px;border-radius:4px;object-fit:cover;border:1px solid var(--clr-border)">
            <div style="font-weight:600;font-size:.85rem">${escapeHtml(p.name)}</div>
          </div>
        </td>
        <td style="font-size:.8rem;color:var(--clr-text-3)">${p.category}</td>
        <td>
          <div class="input-group">
            <input type="number" class="form-control btn-sm bulk-price" value="${p.price}" step="0.01" style="width:100%">
          </div>
        </td>
        <td>
          <input type="number" class="form-control btn-sm bulk-stock" value="${p.stock}" style="width:100%">
        </td>
        <td>
          <span class="badge ${p.stock > 10 ? 'badge-success' : 'badge-warning'}">${p.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
        </td>
      </tr>
    `).join('');
  }
  openModal('bulk-inventory-modal');
}

function saveBulkInventory() {
  const products = Store.getProducts();
  const rows = document.querySelectorAll('#bulk-inventory-table-body tr[data-id]');
  let updatedCount = 0;

  rows.forEach(row => {
    const id = row.dataset.id;
    const price = parseFloat(row.querySelector('.bulk-price').value);
    const stock = parseInt(row.querySelector('.bulk-stock').value);
    
    const idx = products.findIndex(p => p.id === id);
    if (idx > -1) {
      if (products[idx].price !== price || products[idx].stock !== stock) {
        products[idx].price = price;
        products[idx].stock = stock;
        updatedCount++;
      }
    }
  });

  if (updatedCount > 0) {
    Store.setProducts(products);
    renderProductsTable();
    showToast('Success', `Updated ${updatedCount} products!`, 'success');
  }
  closeAllModals();
}

// ── Financial Payouts ───────────────────────────────────────────────────────
function requestPayout() {
  const seller = SellerState.currentSeller;
  if (!seller || (seller.payoutBalance || 0) <= 0) {
    return showToast('Payout Failed', 'No balance available for payout.', 'error');
  }

  const amount = seller.payoutBalance;
  if (!confirm(`Request a payout of ${formatCurrency(amount)} to your bank?`)) return;

  // Add transaction
  const txns = Store.getTransactions();
  txns.unshift({
    id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
    sellerId: seller.id,
    type: 'payout',
    amount: -amount,
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
    description: `Payout to ${seller.bankInfo || 'Bank Account'}`
  });
  Store.setTransactions(txns);

  // Update seller balance
  const sellers = Store.getSellers();
  const idx = sellers.findIndex(s => s.id === seller.id);
  if (idx > -1) {
    sellers[idx].payoutBalance = 0;
    Store.setSellers(sellers);
    SellerState.currentSeller = sellers[idx];
    Store.setCurrentSeller(sellers[idx]);
    renderFinancials();
    showToast('Payout Requested', `${formatCurrency(amount)} is on its way!`, 'success');
  }
}


// ── Spec Row Helpers ─────────────────────────────────────────────────────────

// ── Spec Row Helpers ─────────────────────────────────────────────────────────
function addSpecRow(key = '', value = '') {
  const container = document.getElementById('pf-specs-container');
  if (!container) return;
  const row = document.createElement('div');
  row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center';
  row.innerHTML = `
    <input class="form-control spec-key" type="text" placeholder="e.g. Battery Life" value="${escapeHtml(key)}" style="font-size:.82rem">
    <input class="form-control spec-val" type="text" placeholder="e.g. 30 Hours" value="${escapeHtml(value)}" style="font-size:.82rem">
    <button type="button" class="btn btn-icon btn-ghost btn-icon-sm" onclick="this.closest('div').remove()" title="Remove">×</button>
  `;
  container.appendChild(row);
}

function getSpecsFromForm() {
  const specs = {};
  document.querySelectorAll('#pf-specs-container > div').forEach(row => {
    const k = row.querySelector('.spec-key')?.value.trim();
    const v = row.querySelector('.spec-val')?.value.trim();
    if (k && v) specs[k] = v;
  });
  return specs;
}

// ── Category Fields ──────────────────────────────────────────────────────────
const CAT_FIELD_MAP = {
  Electronics: 'electronics',
  Fashion:     'fashion',
  Books:       'books',
  Beauty:      'beauty',
  Health:      'beauty',
  Kitchen:     'home',
  Home:        'home',
  Furniture:   'home',
  Garden:      'home',
  Sports:      'sports',
  Toys:        'sports',
  Automotive:  'automotive'
};

function updateCategoryFields(category) {
  // Hide all cat-field groups first
  document.querySelectorAll('.cat-fields').forEach(el => el.style.display = 'none');
  const key = CAT_FIELD_MAP[category];
  if (key) {
    const group = document.getElementById('cat-fields-' + key);
    if (group) {
      group.style.display = 'block';
      group.style.animation = 'fadeIn 0.25s ease';
    }
  }
}

// ── Image Upload ──────────────────────────────────────────────────────────────
let uploadedImageDataUrl = null;

function setImagePreview(src) {
  const wrap = document.getElementById('img-preview-wrap');
  const zone = document.getElementById('pf-upload-zone');
  if (!wrap) return;
  wrap.innerHTML = src
    ? `<div style="position:relative;display:inline-block">
         <img src="${src}" class="img-preview" style="max-height:160px;border-radius:var(--radius-md);object-fit:cover" onerror="this.style.display='none'">
         <button type="button" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center" onclick="clearImagePreview()">×</button>
       </div>`
    : '';
  if (zone) {
    zone.style.borderColor = src ? 'var(--clr-primary)' : 'var(--clr-border)';
    zone.style.background = src ? 'rgba(108,99,255,0.06)' : 'rgba(255,255,255,0.02)';
  }
}

function clearImagePreview() {
  uploadedImageDataUrl = null;
  const urlInput = document.getElementById('pf-image-url');
  if (urlInput) urlInput.value = '';
  setImagePreview(null);
  // Reset file input
  const fileInput = document.getElementById('pf-image-file');
  if (fileInput) fileInput.value = '';
  const zone = document.getElementById('pf-upload-zone');
  if (zone) { zone.style.borderColor = 'var(--clr-border)'; zone.style.background = 'rgba(255,255,255,0.02)'; }
}

function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Invalid file', 'Please select an image file', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('File too large', 'Maximum file size is 5 MB', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImageDataUrl = e.target.result;
    // Clear URL field when a file is chosen
    const urlInput = document.getElementById('pf-image-url');
    if (urlInput) urlInput.value = '';
    setImagePreview(uploadedImageDataUrl);
  };
  reader.readAsDataURL(file);
}

function handleImageFileChange(event) {
  handleImageFile(event.target.files[0]);
}

function handleImageDrop(event) {
  event.preventDefault();
  const zone = document.getElementById('pf-upload-zone');
  if (zone) { zone.style.borderColor = 'var(--clr-border)'; zone.style.background = 'rgba(255,255,255,0.02)'; }
  const file = event.dataTransfer?.files[0];
  if (file) handleImageFile(file);
}

function handleImageUrlInput(value) {
  // When a URL is typed/pasted, clear any uploaded file
  if (value) {
    uploadedImageDataUrl = null;
    const fileInput = document.getElementById('pf-image-file');
    if (fileInput) fileInput.value = '';
    setImagePreview(value);
  } else {
    setImagePreview(null);
  }
}

// ── Product CRUD ──────────────────────────────────────────────────────────────
// ── Product CRUD (Wizard Flow) ───────────────────────────────────────────────
function openAddProduct() {
  SellerState.editingProductId = null;
  SellerState.productGallery = [];
  SellerState.variantMatrix = [];
  SellerState.currentWizardStep = 1;
  
  document.getElementById('product-modal-title').textContent = '📦 Add New Masterpiece';
  document.getElementById('product-form').reset();
  document.getElementById('pf-specs-container').innerHTML = '';
  document.getElementById('pf-gallery-container').innerHTML = '';
  document.getElementById('variants-container').innerHTML = '<p style="font-size:0.75rem; color:var(--clr-text-3); font-style:italic">Create variants to manage individual stock and price adjustments.</p>';
  
  moveWizard(0); // Reset to step 1
  addSpecRow();
  
  // Wire real-time preview
  attachPreviewListeners();
  openModal('product-form-modal');
}
function populateCategoryDropdown() {
  const catSelect = document.getElementById('pf-category');
  if (!catSelect) return;
  
  let categories = [];
  try {
    if (typeof AdminStore !== 'undefined') {
      categories = AdminStore.getCategories();
    }
  } catch (e) { console.error("Failed to get categories from AdminStore", e); }
  
  if (categories.length === 0) {
    // Fallback hardcoded
    categories = [
      { name: 'Electronics', children: [{ name: 'Mobiles' }, { name: 'Tablets' }, { name: 'Audio' }] },
      { name: 'Fashion', children: [{ name: 'Apparel' }, { name: 'Footwear' }] },
      { name: 'Furniture', children: [{ name: 'Living Room' }, { name: 'Workplace' }] }
    ];
  }
  
  catSelect.innerHTML = '<option value="">Select Category</option>' + 
    categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
}

function updateSubCategories(selectedSub = null) {
  const catName = document.getElementById('pf-category').value;
  const subSelect = document.getElementById('pf-sub-category');
  if (!subSelect) return;
  
  if (!catName) {
    subSelect.innerHTML = '<option value="">Select Category First</option>';
    return;
  }
  
  let categories = [];
  try {
    if (typeof AdminStore !== 'undefined') {
      categories = AdminStore.getCategories();
    }
  } catch (e) {}
  
  const category = categories.find(c => c.name === catName);
  const subs = category ? (category.children || []) : [];
  
  if (subs.length === 0) {
    subSelect.innerHTML = '<option value="">No sub-categories available</option>';
  } else {
    subSelect.innerHTML = '<option value="">Select Sub-Category</option>' + 
      subs.map(s => `<option value="${escapeHtml(s.name)}" ${selectedSub === s.name ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
  }
}

function openAddProduct() {
  SellerState.editingProductId = null;
  SellerState.productGallery = [];
  SellerState.variantMatrix = [];
  SellerState.currentWizardStep = 1;
  
  document.getElementById('product-modal-title').textContent = '📦 Add New Masterpiece';
  document.getElementById('product-form').reset();
  document.getElementById('pf-specs-container').innerHTML = '';
  addSpecRow();
  
  populateCategoryDropdown();
  updateSubCategories();
  
  renderGallery();
  renderVariantsMatrix();
  moveWizard(0);
  attachPreviewListeners();
  updateBoutiquePreview();
  openModal('product-form-modal');
}

function openEditProduct(productId) {
  const products = Store.getProducts();
  const p = products.find(pr => pr.id === productId);
  if (!p) return;
  
  SellerState.editingProductId = productId;
  SellerState.productGallery = p.images || (p.image ? [p.image] : []);
  SellerState.variantMatrix = p.variants || [];
  SellerState.currentWizardStep = 1;
  
  document.getElementById('product-modal-title').textContent = '✏️ Edit Masterpiece';
  const form = document.getElementById('product-form');

  // Determine current display rate to show local prices in form inputs
  const config = CurrencyConfig[currentCurrency] || CurrencyConfig.USD;

  // Load Data
  form.querySelector('#pf-name').value = p.name;
  form.querySelector('#pf-brand').value = p.brand || '';
  
  populateCategoryDropdown();
  form.querySelector('#pf-category').value = p.category;
  updateSubCategories(p.subCategory || p.sub_category || '');
  
  form.querySelector('#pf-description').value = p.description;
  form.querySelector('#pf-tags').value = (p.tags || []).join(', ');
  
  // Display local currency value in the input field
  form.querySelector('#pf-price').value = (p.price * config.rate).toFixed(2);
  form.querySelector('#pf-original-price').value = p.originalPrice ? (p.originalPrice * config.rate).toFixed(2) : '';
  
  form.querySelector('#pf-stock').value = p.stock;
  form.querySelector('#pf-weight').value = p.weightGms || 0;
  form.querySelector('#pf-low-stock').value = p.lowStockThreshold || '';
  form.querySelector('#pf-sku').value = p.sku || '';
  form.querySelector('#pf-tax').value = p.taxClass || p.tax_class || '18';

  // Specs
  document.getElementById('pf-specs-container').innerHTML = '';
  if (p.specifications) {
    Object.entries(p.specifications).forEach(([k, v]) => addSpecRow(k, v));
  } else {
    addSpecRow();
  }

  // Gallery
  renderGallery();
  
  // Variants
  renderVariantsMatrix();

  moveWizard(0);
  attachPreviewListeners();
  updateBoutiquePreview();
  openModal('product-form-modal');
}

function moveWizard(dir) {
  const newStep = SellerState.currentWizardStep + dir;
  if (newStep < 1 || newStep > 4) return;
  
  if (dir > 0 && !validateWizardStep()) return;

  SellerState.currentWizardStep = newStep;

  document.querySelectorAll('.wizard-step').forEach((s, i) => s.style.display = (i + 1 === newStep) ? 'block' : 'none');
  
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    if (dot) {
      dot.classList.toggle('active', i === newStep);
      dot.classList.toggle('done', i < newStep);
    }
  }

  const progress = ((newStep - 1) / 3) * 100;
  document.getElementById('wizard-progress').style.width = `${progress}%`;

  document.getElementById('pf-back-btn').style.visibility = (newStep === 1) ? 'hidden' : 'visible';
  document.getElementById('pf-next-btn').style.display = (newStep === 4) ? 'none' : 'inline-block';
  document.getElementById('pf-draft-btn').style.display = (newStep >= 1) ? 'inline-block' : 'none';
  document.getElementById('pf-save-btn').style.display = (newStep === 4) ? 'inline-block' : 'none';
}

function validateWizardStep() {
  const step = SellerState.currentWizardStep;
  if (step === 1) {
    const name = document.getElementById('pf-name').value.trim();
    if (!name) { showToast('Required', 'Please enter a product name.', 'warning'); return false; }
  }
  return true;
}

function attachPreviewListeners() {
  const fields = ['pf-name', 'pf-category', 'pf-sub-category', 'pf-price', 'pf-brand', 'pf-description', 'pf-tags'];
  fields.forEach(f => document.getElementById(f)?.addEventListener('input', updateBoutiquePreview));
}

function updateBoutiquePreview() {
  const name = document.getElementById('pf-name').value || 'Product Name';
  const cat = document.getElementById('pf-category').value;
  const subCat = document.getElementById('pf-sub-category').value;
  const price = parseFloat(document.getElementById('pf-price').value || 0);
  const brand = document.getElementById('pf-brand').value || 'ARVAAN';
  const desc = document.getElementById('pf-description').value || '';

  SafeUI.safeHTML('prev-card-name', name);
  SafeUI.safeHTML('prev-card-cat', subCat ? `${cat} › ${subCat}` : cat);
  SafeUI.safeHTML('prev-card-price', formatCurrency(toBaseCurrency(price)));
  SafeUI.safeHTML('prev-card-brand', brand.toUpperCase());
  
  const mainImg = SellerState.productGallery[0] || 'https://via.placeholder.com/400x533?text=Boutique+Preview';
  const imgEl = document.getElementById('prev-card-img');
  if (imgEl) imgEl.src = mainImg;

  SafeUI.safeHTML('seo-preview-title', `${name} | Arvaan Collective`);
  SafeUI.safeHTML('seo-preview-desc', desc.slice(0, 160) + (desc.length > 160 ? '...' : ''));
  SafeUI.safeHTML('seo-preview-slug', name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
}

function addGalleryImage() {
  const url = document.getElementById('pf-image-url').value.trim();
  if (!url) return;
  if (SellerState.productGallery.length >= 5) {
    showToast('Limit Reached', 'Maximum 5 images allowed.', 'warning');
    return;
  }
  SellerState.productGallery.push(url);
  document.getElementById('pf-image-url').value = '';
  renderGallery();
  updateBoutiquePreview();
}

function removeGalleryImage(index) {
  SellerState.productGallery.splice(index, 1);
  renderGallery();
  updateBoutiquePreview();
}

function renderGallery() {
  const container = document.getElementById('pf-gallery-container');
  if (!container) return;
  container.innerHTML = SellerState.productGallery.map((img, i) => `
    <div class="gallery-item">
      <img src="${img}">
      <button type="button" class="remove-btn" onclick="removeGalleryImage(${i})">×</button>
    </div>
  `).join('');
}

function handleImageFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    if (SellerState.productGallery.length >= 5) {
      showToast('Limit Reached', 'Maximum 5 images allowed.', 'warning');
      return;
    }
    SellerState.productGallery.push(event.target.result);
    renderGallery();
    updateBoutiquePreview();
  };
  reader.readAsDataURL(file);
}

function generateVariants() {
  const color = prompt("Add a color variant (e.g. Midnight Black):");
  const size = prompt("Add a size variant (e.g. Extra Large):");
  if (!color && !size) return;
  
  const name = [color, size].filter(Boolean).join(' / ');
  SellerState.variantMatrix.push({
    name,
    price: toBaseCurrency(parseFloat(document.getElementById('pf-price').value || 0)),
    stock: parseInt(document.getElementById('pf-stock').value || 0),
    sku: `${document.getElementById('pf-sku').value || 'SKU'}-${name.replace(/\s+/g, '')}`
  });
  renderVariantsMatrix();
}

function renderVariantsMatrix() {
  const container = document.getElementById('variants-container');
  if (!container) return;
  
  if (SellerState.variantMatrix.length === 0) {
    container.innerHTML = '<p style="font-size:0.75rem; color:var(--clr-text-3); font-style:italic">No variants created yet.</p>';
    return;
  }

  container.innerHTML = `
    <table class="variant-matrix">
      <thead><tr><th>Variant</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
      <tbody>
        ${SellerState.variantMatrix.map((v, i) => `
          <tr>
            <td style="font-weight:700">${v.name}</td>
            <td><input type="number" class="variant-input-sm" value="${v.price}" onchange="updateVariant(${i}, 'price', this.value)"></td>
            <td><input type="number" class="variant-input-sm" value="${v.stock}" onchange="updateVariant(${i}, 'stock', this.value)"></td>
            <td><button type="button" class="btn btn-ghost btn-sm" onclick="removeVariant(${i})">🗑️</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateVariant(idx, key, val) {
  SellerState.variantMatrix[idx][key] = (key === 'name') ? val : parseFloat(val);
}

function removeVariant(idx) {
  SellerState.variantMatrix.splice(idx, 1);
  renderVariantsMatrix();
}

function saveProduct(e, status = 'published') {
  if (e) e.preventDefault();
  
  const form = document.getElementById('product-form');
  const nameInput = document.getElementById('pf-name');
  const catInput = document.getElementById('pf-category');
  
  const name = nameInput.value.trim();
  if (!name) return showToast('Required', 'Product Name is required', 'warning');
  
  const brand       = document.getElementById('pf-brand').value.trim();
  const category    = catInput.value;
  const subCategory = document.getElementById('pf-sub-category').value;
  const description = document.getElementById('pf-description').value.trim();
  const highlights  = document.getElementById('pf-tags').value.split(',').map(t => t.trim()).filter(Boolean);

  if (status === 'published' && !category) return showToast('Required', 'Category is required for publishing', 'warning');

  const priceLocal = parseFloat(document.getElementById('pf-price').value || 0);
  const origPriceLocal = parseFloat(document.getElementById('pf-original-price').value || 0);
  
  // Weights (NEW)
  const weightGms = parseFloat(document.getElementById('pf-weight').value || 0);
  
  // Convert local inputs to internal base currency (USD)
  const price = toBaseCurrency(priceLocal);
  const origPrice = origPriceLocal > 0 ? toBaseCurrency(origPriceLocal) : null;
  
  const stock       = parseInt(document.getElementById('pf-stock').value || 0);
  const lowStock    = parseInt(document.getElementById('pf-low-stock').value || 0);
  const sku         = document.getElementById('pf-sku').value.trim();
  const taxClass    = document.getElementById('pf-tax').value;

  const specs = {};
  document.querySelectorAll('.spec-row').forEach(row => {
    const k = row.querySelector('.spec-key').value.trim();
    const v = row.querySelector('.spec-val').value.trim();
    if (k && v) specs[k] = v;
  });

  const products = Store.getProducts();
  const isEditing = !!SellerState.editingProductId;
  const seller = Auth.getSeller();
  
  // Use SellerState.currentSeller as fallback if Auth.getSeller() is null
  const activeSeller = seller || SellerState.currentSeller;
  if (!activeSeller) return showToast('Error', 'No seller session found. Please log in again.', 'error');

  const existingProduct = isEditing ? products.find(p => String(p.id) === String(SellerState.editingProductId)) : null;

  const productData = {
    id: isEditing ? SellerState.editingProductId : `PRD-${Date.now()}`,
    name, brand, category, subCategory, description,
    price,
    originalPrice: origPrice > 0 ? origPrice : null,
    weightGms,
    stock, lowStockThreshold: lowStock,
    sku, taxClass,
    specifications: specs,
    tags: highlights,
    images: SellerState.productGallery.length ? SellerState.productGallery : ['https://via.placeholder.com/600x600?text=No+Image'],
    variants: SellerState.variantMatrix,
    sellerId: activeSeller.id,
    seller: activeSeller.id,
    isActive: status !== 'draft',
    status: status,
    sold: existingProduct?.sold || 0,
    rating: existingProduct?.rating || 4.5,
    reviewsCount: existingProduct?.reviewsCount || 0,
    dateAdded: existingProduct?.dateAdded || new Date().toISOString()
  };

  if (isEditing) {
    const idx = products.findIndex(p => p.id === SellerState.editingProductId);
    products[idx] = productData;
  } else {
    products.push(productData);
  }

  Store.setProducts(products);
  renderProductsTable();
  closeAllModals();
  showToast(
    isEditing ? 'Masterpiece Updated' : 'Product Saved', 
    `"${name}" is now ${status === 'draft' ? 'saved as draft' : 'live'}.`, 
    'success'
  );
}


function deleteProduct(productId) {
  const products = Store.getProducts();
  const strId = String(productId);
  const p = products.find(pr => String(pr.id) === strId);
  if (!p) return;
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  
  // Delete from cloud immediately if connected
  if (typeof CloudDB !== 'undefined' && CloudDB.ready) {
    CloudDB.deleteItem('products', strId);
  }
  
  // Record in permanent deleted-IDs list so seed merge never restores it
  Store.addDeletedId(strId);
  Store.setProducts(products.filter(pr => String(pr.id) !== strId));
  showToast('Product deleted', `"${p.name}" removed`, 'info');
  renderProductsTable();
}

// ── Orders Table ──────────────────────────────────────────────────────────────
// Track active orders tab in state
SellerState.orderStatusTab = SellerState.orderStatusTab || 'all';

function updateOrderTabActions() {
  const status = SellerState.orderStatusTab || 'all';
  const actionsBar = document.getElementById('order-tab-actions');
  if (!actionsBar) return;

  const quickActions = {
    pending: `
      <button class="btn btn-primary btn-sm" onclick="bulkTabAction('processing')">⚙️ Mark Processing</button>
      <button class="btn btn-outline btn-sm" onclick="generateBulkInvoices()">📄 Bulk Invoices</button>
    `,
    processing: `
      <button class="btn btn-primary btn-sm" onclick="bulkTabAction('ready_to_ship')">📦 Ready to Ship</button>
      <button class="btn btn-outline btn-sm" onclick="generateBulkLabels()">🏷️ Bulk Labels</button>
      <button class="btn btn-outline btn-sm" onclick="generateBulkInvoices()">📄 Bulk Invoices</button>
    `,
    ready_to_ship: `
      <button class="btn btn-primary btn-sm" onclick="bulkTabAction('shipped')">🚚 Mark Shipped</button>
      <button class="btn btn-outline btn-sm" onclick="generateBulkLabels()">🏷️ Bulk Labels</button>
    `,
    shipped: `<button class="btn btn-success btn-sm" onclick="bulkTabAction('delivered')">✅ Mark Delivered</button>`,
  };

  if (quickActions[status]) {
    actionsBar.innerHTML = quickActions[status];
    actionsBar.style.display = 'flex';
  } else {
    actionsBar.style.display = 'none';
  }
}

function switchOrderTab(btn, status) {
  SellerState.orderStatusTab = status;
  document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  updateOrderTabActions();
  renderOrdersTable();
}

function bulkTabAction(newStatus) {
  const checked = Array.from(document.querySelectorAll('.order-select:checked')).map(c => c.value);
  if (checked.length === 0) {
    showToast('No Selection', 'Please select at least one order.', 'warning');
    return;
  }
  const orders = Store.getOrders();
  let count = 0;
  orders.forEach(o => { if (checked.includes(o.id)) { o.status = newStatus; count++; } });
  Store.setOrders(orders);
  renderOrdersTable();
  showToast('Bulk Updated', `${count} order${count !== 1 ? 's' : ''} moved to "${newStatus.replace('_', ' ')}".`, 'success');
}

function renderOrdersTable() {
  const seller = SellerState.currentSeller;
  let allOrders = Store.getOrders()
    .filter(o => String(o.sellerId) === String(seller.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply search filter
  if (SellerState.orderSearch) {
    const q = SellerState.orderSearch.toLowerCase();
    allOrders = allOrders.filter(o =>
      o.id.toLowerCase().includes(q) || getUserName(o.userId).toLowerCase().includes(q)
    );
  }

  // Update all tab badge counts
  const statuses = ['all', 'pending', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled'];
  statuses.forEach(s => {
    const el = document.getElementById(`tab-count-${s}`);
    if (el) el.textContent = s === 'all' ? allOrders.length : allOrders.filter(o => o.status === s).length;
  });

  // Filter by active tab
  const activeTab = SellerState.orderStatusTab || 'all';
  const orders = activeTab === 'all' ? allOrders : allOrders.filter(o => o.status === activeTab);

  // Reset bulk selects
  const selectAllChk = document.getElementById('selectAllOrders');
  if (selectAllChk) selectAllChk.checked = false;
  updateBulkButtons();
  updateOrderTabActions();

  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  if (orders.length === 0) {
    const tabLabel = activeTab === 'all' ? 'orders' : `${activeTab.replace('_', ' ')} orders`;
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state" style="padding:48px"><div class="empty-icon">📭</div><h3>No ${tabLabel}</h3><p>Orders with this status will appear here.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><input type="checkbox" class="order-select" value="${o.id}" onchange="updateBulkButtons()"></td>
      <td style="font-family:monospace; font-weight:700; font-size:0.82rem">${o.id}</td>
      <td>
        <div style="font-weight:600">${getUserName(o.userId)}</div>
        <div style="font-size:0.72rem; color:var(--clr-text-3)">${o.address ? o.address.split(',').slice(-2).join(',').trim() : '—'}</div>
      </td>
      <td>
        <div style="font-weight:600">${o.items.length} item${o.items.length !== 1 ? 's' : ''}</div>
        <div style="font-size:0.72rem; color:var(--clr-text-3)">${o.items.map(i => i.name.split(' ').slice(0, 2).join(' ')).join(', ')}</div>
      </td>
      <td style="font-weight:700">${formatCurrency(o.total)}</td>
      <td>${getStatusBadge(o.status)}</td>
      <td>
        <div style="font-size:0.74rem">
          ${o.trackingId
            ? `<div style="font-weight:700; color:var(--clr-primary)">${o.carrier || ''}</div><div style="color:var(--clr-text-2)">${o.trackingId}</div>`
            : `<span style="color:var(--clr-text-3)">No tracking</span>`}
        </div>
      </td>
      <td style="font-size:0.78rem">${formatDate(o.date)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openProcessOrderModal('${o.id}')" title="Update Status">⚙️ Process</button>
      </td>
    </tr>
  `).join('');
}


function openShippingModal(orderId) {
  document.getElementById('ship-order-id').value = orderId;
  document.getElementById('ship-tracking').value = '';
  openModal('shipping-modal');
}

document.getElementById('shipping-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const id = document.getElementById('ship-order-id').value;
  const carrier = document.getElementById('ship-carrier').value;
  const tracking = document.getElementById('ship-tracking').value.trim();
  
  if (!tracking) return showToast('Error', 'Please enter a tracking number', 'error');
  
  const orders = Store.getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx > -1) {
    orders[idx].status = 'shipped';
    orders[idx].carrier = carrier;
    orders[idx].trackingId = tracking;
    Store.setOrders(orders);
    renderOrdersTable();
    closeModal('shipping-modal');
    showToast('Order Shipped', `Order ${id} marked as shipped via ${carrier}`);
  }
});

function updateBulkButtons() {
  const selected = Array.from(document.querySelectorAll('.order-select:checked')).map(c => c.value);
  const bulkBar = document.getElementById('order-bulk-actions');
  if (bulkBar) bulkBar.style.display = selected.length > 0 ? 'flex' : 'none';
}

function bulkUpdateOrdersStatus(status) {
  const selected = Array.from(document.querySelectorAll('.order-select:checked')).map(c => c.value);
  if (selected.length === 0) return;
  
  const orders = Store.getOrders();
  let count = 0;
  orders.forEach(o => {
    if (selected.includes(o.id)) {
      o.status = status;
      count++;
    }
  });

  Store.setOrders(orders);
  renderOrdersTable();
  showToast('Bulk Update', `Successfully updated ${count} orders to ${status.toUpperCase()}`);
}

function exportOrdersCSV() {
  const seller = SellerState.currentSeller;
  const orders = Store.getOrders().filter(o => o.sellerId === seller.id);
  if (orders.length === 0) return showToast('No data', 'There are no orders to export.', 'warning');

  let csv = 'Order ID,Date,Customer,Items,Total,Status,Carrier,Tracking\n';
  orders.forEach(o => {
    csv += `"${o.id}","${o.date}","${getUserName(o.userId)}",${o.items.length},${o.total},"${o.status}","${o.carrier || ''}","${o.trackingId || ''}"\n`;
  });

  downloadCSV(csv, `orders_${seller.id}_${new Date().toISOString().split('T')[0]}.csv`);
  showToast('Export Started', 'Your orders CSV is being generated.');
}

function generateShippingLabel(orderId) {
  const orders = Store.getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  // Build a printable label in a modal
  const customerName = getUserName(order.userId);
  const itemsList = order.items.map(i => `• ${escapeHtml(i.name)} × ${i.qty}`).join('<br>');
  const labelHtml = `
    <div id="shipping-label-print" style="font-family:'Courier New',monospace;border:2px dashed var(--clr-border);border-radius:var(--radius-lg);padding:var(--space-6);background:var(--clr-surface);max-width:480px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);border-bottom:1px solid var(--clr-border);padding-bottom:var(--space-3)">
        <div style="font-size:1.2rem;font-weight:700">🏪 Arvaan Collective</div>
        <div style="font-size:.75rem;color:var(--clr-text-3)">SHIPPING LABEL</div>
      </div>
      <div style="margin-bottom:var(--space-3)">
        <div style="font-size:.7rem;color:var(--clr-text-3);margin-bottom:2px">ORDER ID</div>
        <div style="font-weight:700;font-size:1.05rem;letter-spacing:.05em">${order.id}</div>
      </div>
      <div style="margin-bottom:var(--space-3)">
        <div style="font-size:.7rem;color:var(--clr-text-3);margin-bottom:2px">SHIP TO</div>
        <div style="font-weight:600">${escapeHtml(customerName)}</div>
        <div style="font-size:.85rem;color:var(--clr-text-2)">${escapeHtml(order.address)}</div>
      </div>
      <div style="margin-bottom:var(--space-3)">
        <div style="font-size:.7rem;color:var(--clr-text-3);margin-bottom:4px">ITEMS</div>
        <div style="font-size:.82rem;color:var(--clr-text-2);line-height:1.6">${itemsList}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);border-top:1px solid var(--clr-border);padding-top:var(--space-3);margin-top:var(--space-2)">
        <div>
          <div style="font-size:.7rem;color:var(--clr-text-3)">ORDER DATE</div>
          <div style="font-size:.82rem;font-weight:600">${formatDate(order.date)}</div>
        </div>
        <div>
          <div style="font-size:.7rem;color:var(--clr-text-3)">PAYMENT</div>
          <div style="font-size:.82rem;font-weight:600">${escapeHtml(order.paymentMethod)}</div>
        </div>
        <div>
          <div style="font-size:.7rem;color:var(--clr-text-3)">ORDER TOTAL</div>
          <div style="font-size:.82rem;font-weight:700">${formatCurrency(order.total)}</div>
        </div>
        <div>
          <div style="font-size:.7rem;color:var(--clr-text-3)">STATUS</div>
          <div style="font-size:.82rem">${getStatusBadge(order.status)}</div>
        </div>
      </div>
      <div style="margin-top:var(--space-4);text-align:center">
        <div style="font-size:2rem;letter-spacing:.25em;font-weight:700;border:1px solid var(--clr-border);display:inline-block;padding:6px 18px;border-radius:4px">${order.id}</div>
        <div style="font-size:.65rem;color:var(--clr-text-3);margin-top:4px">Scan or quote this ID at dispatch</div>
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);justify-content:flex-end;margin-top:var(--space-5)">
      <button class="btn btn-ghost" onclick="closeAllModals()">Close</button>
      <button class="btn btn-primary" onclick="printShippingLabel()">🖨️ Print Label</button>
    </div>
  `;

  // Inject into or create the label modal
  let modal = document.getElementById('shipping-label-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'shipping-label-modal';
    modal.innerHTML = `<div class="modal modal-lg"><div class="modal-header"><h3>🏷️ Shipping Label — ${order.id}</h3><button class="modal-close">×</button></div><div class="modal-body" id="shipping-label-body"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', closeAllModals);
  } else {
    modal.querySelector('.modal-header h3').textContent = `🏷️ Shipping Label — ${order.id}`;
  }
  document.getElementById('shipping-label-body').innerHTML = labelHtml;
  openModal('shipping-label-modal');
  showToast('Label Ready', `Shipping label for ${orderId} generated!`, 'success');
}

function printShippingLabel() {
  const labelEl = document.getElementById('shipping-label-print');
  if (!labelEl) return;
  const win = window.open('', '_blank', 'width=600,height=700');
  win.document.write(`<!DOCTYPE html><html><head><title>Shipping Label</title><style>body{font-family:'Courier New',monospace;padding:24px;background:#fff;color:#111}@media print{body{padding:0}}</style></head><body>${labelEl.outerHTML}<script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
}

function generateInvoice(orderId) {
  const orders = Store.getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const seller = SellerState.currentSeller;
  const customerName = getUserName(order.userId);
  const itemsListHtml = order.items.map(i => `
    <tr>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border)">${escapeHtml(i.name)}</td>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border);text-align:center">${i.qty}</td>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border);text-align:right">${formatCurrency(i.price)}</td>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border);text-align:right">${formatCurrency(i.price * i.qty)}</td>
    </tr>
  `).join('');

  const subtotal = order.subtotal || order.total; // Fix: Use order.subtotal if available
  const invoiceHtml = `
    <div id="invoice-print-content" style="font-family:'Inter',sans-serif;background:#fff;color:#111;padding:var(--space-6);border-radius:var(--radius-lg);max-width:700px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-6);border-bottom:2px solid #eaeaea;padding-bottom:var(--space-4)">
        <div>
          <div style="font-size:1.5rem;font-weight:800;color:#6C63FF;margin-bottom:4px;display:flex;align-items:center;gap:8px">
            <span style="background:#6C63FF;color:#fff;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;font-size:1rem">🏪</span>
            ${escapeHtml(seller.shopName || seller.name)}
          </div>
          <div style="font-size:.85rem;color:#555">${escapeHtml(seller.email)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.8rem;font-weight:300;color:#ccc;letter-spacing:2px">INVOICE</div>
          <div style="font-size:.85rem;font-weight:600;margin-top:4px"># ${order.id}</div>
          <div style="font-size:.85rem;color:#555">Date: ${formatDate(order.date)}</div>
          <div style="font-size:.85rem;color:#555">Status: <span style="text-transform:uppercase;font-size:.75rem">${order.status}</span></div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-6)">
        <div>
          <div style="font-size:.75rem;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:4px">Billed To</div>
          <div style="font-size:1rem;font-weight:600">${escapeHtml(customerName)}</div>
          <div style="font-size:.85rem;color:#555;max-width:200px;line-height:1.4;margin-top:4px">${escapeHtml(order.address || 'Address not provided')}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.75rem;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:4px">Payment Method</div>
          <div style="font-size:.9rem;font-weight:600">${escapeHtml(order.paymentMethod || 'N/A')}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:var(--space-6)">
        <thead>
          <tr style="background:#f8f9fa">
            <th style="padding:var(--space-2);text-align:left;font-size:.75rem;color:#555;text-transform:uppercase;border-bottom:2px solid #eaeaea">Item Description</th>
            <th style="padding:var(--space-2);text-align:center;font-size:.75rem;color:#555;text-transform:uppercase;border-bottom:2px solid #eaeaea">Qty</th>
            <th style="padding:var(--space-2);text-align:right;font-size:.75rem;color:#555;text-transform:uppercase;border-bottom:2px solid #eaeaea">Price</th>
            <th style="padding:var(--space-2);text-align:right;font-size:.75rem;color:#555;text-transform:uppercase;border-bottom:2px solid #eaeaea">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>

      <div style="display:flex;justify-content:flex-end">
        <div style="width:250px">
          <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid #eaeaea">
            <span style="font-size:.85rem;color:#555">Subtotal</span>
            <span style="font-size:.85rem;font-weight:600">${formatCurrency(subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid #eaeaea">
            <span style="font-size:.85rem;color:#555">Tax (0%)</span>
            <span style="font-size:.85rem;font-weight:600">$0.00</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-3) 0;margin-top:4px">
            <span style="font-size:1.1rem;font-weight:700">Total</span>
            <span style="font-size:1.2rem;font-weight:800;color:#6C63FF">${formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
      
      <div style="margin-top:var(--space-8);text-align:center;font-size:.75rem;color:#888;border-top:1px solid #eaeaea;padding-top:var(--space-3)">
        Thank you for your business! If you have any questions, please contact ${escapeHtml(seller.email)}.
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);justify-content:flex-end;margin-top:var(--space-5)">
      <button class="btn btn-ghost" onclick="closeAllModals()">Close</button>
      <button class="btn btn-primary" onclick="printInvoice()">🖨️ Print Invoice</button>
    </div>
  `;

  let modal = document.getElementById('invoice-print-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'invoice-print-modal';
    modal.innerHTML = `<div class="modal modal-lg"><div class="modal-header"><h3>📄 Invoice — ${order.id}</h3><button class="modal-close">×</button></div><div class="modal-body" id="invoice-print-body"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', closeAllModals);
  } else {
    modal.querySelector('.modal-header h3').textContent = `📄 Invoice — ${order.id}`;
  }
  document.getElementById('invoice-print-body').innerHTML = invoiceHtml;
  openModal('invoice-print-modal');
}

function printInvoice() {
  const labelEl = document.getElementById('invoice-print-content');
  if (!labelEl) return;
  const win = window.open('', '_blank', 'width=800,height=900');
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice</title><style>body{font-family:'Inter',sans-serif;padding:24px;background:#fff;color:#111;margin:0}@media print{body{padding:0;-webkit-print-color-adjust:exact;color-adjust:exact}}</style></head><body>${labelEl.outerHTML}<script>window.onload=()=>window.print()<\/script></body></html>`);
  win.document.close();
}

function openCustomInvoiceModal() {
  document.getElementById('custom-invoice-form').reset();
  document.getElementById('ci-items-container').innerHTML = '';
  addInvoiceItemRow();
  addInvoiceItemRow();
  openModal('custom-invoice-modal');
}

function addInvoiceItemRow() {
  const container = document.getElementById('ci-items-container');
  const row = document.createElement('div');
  row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:center';
  row.innerHTML = `
    <input class="form-control ci-item-desc" type="text" placeholder="Item description" required style="font-size:.82rem">
    <input class="form-control ci-item-qty" type="number" min="1" placeholder="Qty" value="1" required style="font-size:.82rem">
    <div style="position:relative">
      <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--clr-text-3)">$</span>
      <input class="form-control ci-item-price" type="number" step="0.01" min="0" placeholder="0.00" required style="font-size:.82rem;padding-left:20px">
    </div>
    <button type="button" class="btn btn-icon btn-ghost btn-icon-sm" onclick="this.closest('div').remove()" title="Remove">×</button>
  `;
  container.appendChild(row);
}

function generateCustomInvoice(e) {
  e.preventDefault();
  
  const seller = SellerState.currentSeller;
  const customerName = document.getElementById('ci-customer-name').value.trim();
  const customerEmail = document.getElementById('ci-customer-email').value.trim();
  const address = document.getElementById('ci-customer-address').value.trim();
  const taxRate = parseFloat(document.getElementById('ci-tax-rate').value) || 0;
  const discount = parseFloat(document.getElementById('ci-discount').value) || 0;

  const rows = document.querySelectorAll('#ci-items-container > div');
  const items = [];
  let subtotal = 0;
  
  rows.forEach(row => {
    const desc = row.querySelector('.ci-item-desc').value.trim();
    const qty = parseInt(row.querySelector('.ci-item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.ci-item-price').value) || 0;
    if (desc && qty > 0 && price >= 0) {
      items.push({ desc, qty, price });
      subtotal += (qty * price);
    }
  });

  if (items.length === 0) {
    showToast('Missing items', 'Please add at least one item to the invoice.', 'warning');
    return;
  }

  const taxAmount = subtotal * (taxRate / 100);
  const total = Math.max(0, subtotal + taxAmount - discount);
  const invoiceId = 'INV-' + Math.floor(Math.random()*1000000).toString().padStart(6, '0');
  const invoiceDate = new Date().toISOString();

  const itemsListHtml = items.map(i => `
    <tr>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border)">${escapeHtml(i.desc)}</td>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border);text-align:center">${i.qty}</td>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border);text-align:right">${formatCurrency(i.price)}</td>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border);text-align:right">${formatCurrency(i.price * i.qty)}</td>
    </tr>
  `).join('');

  const invoiceHtml = `
    <div id="invoice-print-content" style="font-family:'Inter',sans-serif;background:#fff;color:#111;padding:var(--space-6);border-radius:var(--radius-lg);max-width:700px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-6);border-bottom:2px solid #eaeaea;padding-bottom:var(--space-4)">
        <div>
          <div style="font-size:1.5rem;font-weight:800;color:#6C63FF;margin-bottom:4px;display:flex;align-items:center;gap:8px">
            <span style="background:#6C63FF;color:#fff;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;font-size:1rem">🏪</span>
            ${escapeHtml(seller.shopName || seller.name)}
          </div>
          <div style="font-size:.85rem;color:#555">${escapeHtml(seller.email)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.8rem;font-weight:300;color:#ccc;letter-spacing:2px">INVOICE</div>
          <div style="font-size:.85rem;font-weight:600;margin-top:4px"># ${invoiceId}</div>
          <div style="font-size:.85rem;color:#555">Date: ${formatDate(invoiceDate)}</div>
          <div style="font-size:.85rem;color:#555">Status: <span style="text-transform:uppercase;font-size:.75rem">DRAFT / UNPAID</span></div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-6)">
        <div>
          <div style="font-size:.75rem;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:4px">Billed To</div>
          <div style="font-size:1rem;font-weight:600">${escapeHtml(customerName)}</div>
          ${customerEmail ? `<div style="font-size:.85rem;color:#555;margin-top:2px">${escapeHtml(customerEmail)}</div>` : ''}
          <div style="font-size:.85rem;color:#555;max-width:250px;line-height:1.4;margin-top:4px">${escapeHtml(address || 'N/A')}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.75rem;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:4px">Terms</div>
          <div style="font-size:.9rem;font-weight:600">Due on receipt</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:var(--space-6)">
        <thead>
          <tr style="background:#f8f9fa">
            <th style="padding:var(--space-2);text-align:left;font-size:.75rem;color:#555;text-transform:uppercase;border-bottom:2px solid #eaeaea">Item Description</th>
            <th style="padding:var(--space-2);text-align:center;font-size:.75rem;color:#555;text-transform:uppercase;border-bottom:2px solid #eaeaea">Qty</th>
            <th style="padding:var(--space-2);text-align:right;font-size:.75rem;color:#555;text-transform:uppercase;border-bottom:2px solid #eaeaea">Unit Price</th>
            <th style="padding:var(--space-2);text-align:right;font-size:.75rem;color:#555;text-transform:uppercase;border-bottom:2px solid #eaeaea">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>

      <div style="display:flex;justify-content:flex-end">
        <div style="width:250px">
          <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid #eaeaea">
            <span style="font-size:.85rem;color:#555">Subtotal</span>
            <span style="font-size:.85rem;font-weight:600">${formatCurrency(subtotal)}</span>
          </div>
          ${discount > 0 ? `
          <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid #eaeaea;color:var(--clr-success)">
            <span style="font-size:.85rem">Discount</span>
            <span style="font-size:.85rem;font-weight:600">- ${formatCurrency(discount)}</span>
          </div>` : ''}
          ${taxAmount > 0 ? `
          <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid #eaeaea">
            <span style="font-size:.85rem;color:#555">Tax (${taxRate}%)</span>
            <span style="font-size:.85rem;font-weight:600">${formatCurrency(taxAmount)}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:var(--space-3) 0;margin-top:4px">
            <span style="font-size:1.1rem;font-weight:700">Total</span>
            <span style="font-size:1.2rem;font-weight:800;color:#6C63FF">${formatCurrency(total)}</span>
          </div>
        </div>
      </div>
      
      <div style="margin-top:var(--space-8);text-align:center;font-size:.75rem;color:#888;border-top:1px solid #eaeaea;padding-top:var(--space-3)">
        Thank you for your business! If you have any questions, please contact ${escapeHtml(seller.email)}.
      </div>
    </div>
    <div style="display:flex;gap:var(--space-3);justify-content:flex-end;margin-top:var(--space-5)">
      <button class="btn btn-ghost" onclick="closeAllModals()">Close</button>
      <button class="btn btn-primary" onclick="printInvoice()">🖨️ Print Invoice</button>
    </div>
  `;

  closeModal('custom-invoice-modal');

  let modal = document.getElementById('invoice-print-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'invoice-print-modal';
    modal.innerHTML = `<div class="modal modal-lg"><div class="modal-header"><h3>📄 Custom Invoice</h3><button class="modal-close">×</button></div><div class="modal-body" id="invoice-print-body"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', closeAllModals);
  } else {
    modal.querySelector('.modal-header h3').textContent = `📄 Custom Invoice`;
  }
  document.getElementById('invoice-print-body').innerHTML = invoiceHtml;
  openModal('invoice-print-modal');
}


function updateOrderStatus(orderId, newStatus) {
  const orders = Store.getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx > -1) {
    orders[idx].status = newStatus;
    Store.setOrders(orders);
    
    // Notification for Delivery
    if (newStatus === 'delivered' || newStatus === 'Delivered') {
      const buyers = Store.getBuyers();
      const user = buyers.find(u => u.id === orders[idx].userId);
      if (user) {
        NotificationSystem.sendDeliveryUpdate(orders[idx], user);
      }
    }

    showToast('Status updated', `Order ${orderId} → ${newStatus.replace(/_/g,' ')}`, 'success');
    renderOrdersTable();
    renderDashboard();
  }
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function renderAnalytics() {
  const seller = SellerState.currentSeller;
  const products = Store.getProducts().filter(p => p.seller === seller.id || p.sellerId === seller.id);
  const orders = Store.getOrders().filter(o => o.sellerId === seller.id);
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  document.getElementById('analytics-revenue').textContent = formatCurrency(revenue);
  document.getElementById('analytics-orders').textContent = orders.length;
  document.getElementById('analytics-avg').textContent = orders.length ? formatCurrency(revenue / orders.length) : formatCurrency(0);
  document.getElementById('analytics-products').textContent = products.length;

  renderWeeklyChart();
  renderTopCustomers();
}

function renderTopCustomers() {
  const seller = SellerState.currentSeller;
  const orders = Store.getOrders().filter(o => o.sellerId === seller.id);
  
  // Calculate LTV per customer
  const customers = {};
  orders.forEach(o => {
    if (!customers[o.userId]) {
      customers[o.userId] = { 
        name: getUserName(o.userId), 
        totalSpent: 0, 
        orderCount: 0,
        avatar: getBuyerAvatar(o.userId)
      };
    }
    customers[o.userId].totalSpent += o.total;
    customers[o.userId].orderCount += 1;
  });

  const sorted = Object.values(customers).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const listEl = document.getElementById('top-customers-list');
  if (!listEl) return;

  if (sorted.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;padding:var(--space-4);color:var(--clr-text-3);font-size:.85rem">No customer data yet</div>';
    return;
  }

  const maxSpend = sorted[0].totalSpent || 1;
  listEl.innerHTML = sorted.map(c => `
    <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) 0">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--clr-bg-3);display:flex;align-items:center;justify-content:center;font-size:.9rem">${c.avatar}</div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px">
          <span style="font-size:0.85rem;font-weight:600">${escapeHtml(c.name)}</span>
          <span style="font-size:0.85rem;font-weight:700;color:var(--clr-primary)">${formatCurrency(c.totalSpent)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <div class="progress-bar" style="flex:1;height:4px"><div class="progress-fill" style="width:${(c.totalSpent / maxSpend) * 100}%"></div></div>
          <span style="font-size:0.7rem;color:var(--clr-text-3)">${c.orderCount} orders</span>
        </div>
      </div>
    </div>
  `).join('');
}

function getBuyerAvatar(userId) {
  const buyers = Store.getBuyers();
  return buyers.find(b => b.id === userId)?.avatar || '👤';
}


function renderWeeklyChart() {
  const canvas = document.getElementById('weekly-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.parentElement.offsetWidth || 400;
  const H = canvas.height = 180;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = [0, 0, 0, 0, 0, 0, 0];
  
  const seller = SellerState.currentSeller;
  const orders = Store.getOrders().filter(o => o.sellerId === seller.id);
  
  orders.forEach(o => {
    const dayIdx = new Date(o.date).getDay();
    data[dayIdx] += o.total;
  });

  // Ensure bars have some height for visual effect if no orders
  const finalData = data.map(v => v || Math.floor(Math.random() * 500 + 500));
  const max = Math.max(...finalData, 1000) * 1.15;
  const pad = { t: 15, r: 15, b: 35, l: 55 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;
  const barW = chartW / data.length * 0.55;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = 'rgba(160,160,184,0.6)'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
    ctx.fillText('$' + Math.round(max * (1 - i / 4) / 1000) + 'k', pad.l - 5, y + 3);
  }
  finalData.forEach((v, i) => {
    const x = pad.l + (chartW / data.length) * i + (chartW / data.length - barW) / 2;
    const barH = (v / max) * chartH;
    const y = pad.t + chartH - barH;
    const grad = ctx.createLinearGradient(0, y, 0, pad.t + chartH);
    grad.addColorStop(0, '#6C63FF'); grad.addColorStop(1, 'rgba(108,99,255,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]) : ctx.rect(x, y, barW, barH);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,160,184,0.8)'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(days[i], x + barW / 2, H - 8);
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────
function renderSettings() {
  const seller = SellerState.currentSeller;
  if (!seller) return;

  // Card 1: Shop Info
  const shopNameInput = document.getElementById('settings-shop-name');
  if (shopNameInput) shopNameInput.value = seller.shopName || seller.name || '';
  const emailInput = document.getElementById('settings-email');
  if (emailInput) emailInput.value = seller.email || '';
  const phoneInput = document.getElementById('settings-phone');
  if (phoneInput) phoneInput.value = seller.phone || '';
  const addressInput = document.getElementById('settings-address');
  if (addressInput) addressInput.value = seller.address || '';
  const descInput = document.getElementById('settings-description');
  if (descInput) descInput.value = seller.description || '';
  const contactInput = document.getElementById('settings-contact-person');
  if (contactInput) contactInput.value = seller.contactPerson || '';

  // Card 2: Business & Tax
  const regNameInput = document.getElementById('settings-reg-name');
  if (regNameInput) regNameInput.value = seller.registeredName || '';
  const bizTypeSelect = document.getElementById('settings-biz-type');
  if (bizTypeSelect) bizTypeSelect.value = seller.businessType || 'Individual';
  const gstInput = document.getElementById('settings-gst');
  if (gstInput) gstInput.value = seller.gstNumber || '';
  const panInput = document.getElementById('settings-pan');
  if (panInput) panInput.value = seller.panNumber || '';

  // Card 3: Banking
  const bankNameInput = document.getElementById('settings-bank-name');
  if (bankNameInput) bankNameInput.value = seller.bankName || '';
  const accHolderInput = document.getElementById('settings-acc-holder');
  if (accHolderInput) accHolderInput.value = seller.accountHolder || '';
  const ifscInput = document.getElementById('settings-ifsc');
  if (ifscInput) ifscInput.value = seller.ifscCode || '';
  const branchInput = document.getElementById('settings-branch-name');
  if (branchInput) branchInput.value = seller.branchName || '';

  // Card 4: Shipping & Tax (NEW)
  const config = CurrencyConfig[currentCurrency] || CurrencyConfig.USD;
  
  const freeThresholdInput = document.getElementById('settings-free-threshold');
  if (freeThresholdInput) {
    const val = seller.shippingConfig?.freeThreshold || 1000;
    // If it's a seed or newly saved in base, convert to local for display
    freeThresholdInput.value = (val * config.rate).toFixed(0);
  }
  
  const taxRateInput = document.getElementById('settings-tax-rate');
  if (taxRateInput) taxRateInput.value = seller.taxRate || 8.5;
  
  if (seller.shippingConfig?.tiers) {
    const t1 = seller.shippingConfig.tiers[0];
    const t2 = seller.shippingConfig.tiers[1];
    if (t1) {
      if (document.getElementById('settings-tier1-weight')) document.getElementById('settings-tier1-weight').value = t1.maxWeight;
      if (document.getElementById('settings-tier1-price')) document.getElementById('settings-tier1-price').value = (t1.price * config.rate).toFixed(0);
    }
    if (t2) {
      if (document.getElementById('settings-tier2-weight')) document.getElementById('settings-tier2-weight').value = t2.maxWeight;
      if (document.getElementById('settings-tier2-price')) document.getElementById('settings-tier2-price').value = (t2.price * config.rate).toFixed(0);
    }
  }

  // Note: Account number is sensitive
  const accNumInput = document.getElementById('settings-acc-num');
  if (accNumInput && seller.accountNumber) accNumInput.placeholder = '••••••••' + seller.accountNumber.slice(-4);

  // Profile Header
  const avatarText = document.getElementById('profile-avatar-text');
  if (avatarText) avatarText.textContent = seller.name.charAt(0).toUpperCase();
  const sellerNameEl = document.getElementById('profile-seller-name');
  if (sellerNameEl) sellerNameEl.textContent = seller.shopName || seller.name;
  const sellerEmailEl = document.getElementById('profile-seller-email');
  if (sellerEmailEl) sellerEmailEl.textContent = seller.email;
}

function handleIFSCInput(val) {
  const ifsc = val.trim().toUpperCase();
  const statusEl = document.getElementById('ifsc-status');
  if (!statusEl) return;

  if (ifsc.length === 11) {
    statusEl.textContent = '⏳ Fetching...';
    statusEl.style.color = 'var(--clr-primary)';
    
    fetch(`https://ifsc.razorpay.com/${ifsc}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid IFSC');
        return res.json();
      })
      .then(data => {
        const bankEl = document.getElementById('settings-bank-name');
        if (bankEl) bankEl.value = data.BANK;
        const branchEl = document.getElementById('settings-branch-name');
        if (branchEl) branchEl.value = data.BRANCH;
        
        statusEl.textContent = '✅ Verified';
        statusEl.style.color = 'var(--clr-success)';
      })
      .catch(err => {
        statusEl.textContent = '❌ Invalid IFSC';
        statusEl.style.color = 'var(--clr-danger)';
        console.error('IFSC Lookup Error:', err);
      });
  } else {
    statusEl.textContent = '';
  }
}

function saveSettings(e) {
  e.preventDefault();
  const sellerId = SellerState.currentSeller?.id;
  if (!sellerId) return;

  const sellers = Store.getSellers();
  const idx = sellers.findIndex(s => s.id === sellerId);
  if (idx === -1) return;
  
  const gst = document.getElementById('settings-gst')?.value.trim().toUpperCase();
  const pan = document.getElementById('settings-pan')?.value.trim().toUpperCase();
  
  // GST Validation (India)
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (gst && !gstRegex.test(gst)) {
    return showToast('Invalid GSTIN', 'Please enter a valid 15-digit GST number.', 'error');
  }

  // PAN Validation (India)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (pan && !panRegex.test(pan)) {
    return showToast('Invalid PAN', 'Please enter a valid 10-digit PAN number.', 'error');
  }

  // Capture all fields
  const updated = {
    ...sellers[idx],
    shopName: document.getElementById('settings-shop-name')?.value.trim(),
    phone: document.getElementById('settings-phone')?.value.trim(),
    address: document.getElementById('settings-address')?.value.trim(),
    description: document.getElementById('settings-description')?.value.trim(),
    contactPerson: document.getElementById('settings-contact-person')?.value.trim(),
    registeredName: document.getElementById('settings-reg-name')?.value.trim(),
    businessType: document.getElementById('settings-biz-type')?.value,
    gstNumber: gst,
    panNumber: pan,
    bankName: document.getElementById('settings-bank-name')?.value.trim(),
    branchName: document.getElementById('settings-branch-name')?.value.trim(),
    accountHolder: document.getElementById('settings-acc-holder')?.value.trim(),
    ifscCode: document.getElementById('settings-ifsc')?.value.trim(),
    taxRate: parseFloat(document.getElementById('settings-tax-rate')?.value || 8.5),
    shippingConfig: {
      freeThreshold: toBaseCurrency(parseFloat(document.getElementById('settings-free-threshold')?.value || 1000)),
      tiers: [
        { 
          maxWeight: parseFloat(document.getElementById('settings-tier1-weight')?.value || 500), 
          price: toBaseCurrency(parseFloat(document.getElementById('settings-tier1-price')?.value || 80))
        },
        { 
          maxWeight: parseFloat(document.getElementById('settings-tier2-weight')?.value || 1000), 
          price: toBaseCurrency(parseFloat(document.getElementById('settings-tier2-price')?.value || 160))
        }
      ]
    }
  };

  // Only update account number if the field is not empty (it's a password field for security)
  const accNum = document.getElementById('settings-acc-num')?.value.trim();
  if (accNum) updated.accountNumber = accNum;

  // Persist
  sellers[idx] = updated;
  Store.setSellers(sellers);
  Store.setCurrentSeller(updated);
  SellerState.currentSeller = updated;

  // Update visual elements
  renderSellerApp();
  renderSettings();
  showToast('✅ Settings updated successfully!');
}

function changePassword(e) {
  if (e) e.preventDefault();
  const seller = SellerState.currentSeller;
  if (!seller) return;

  const currentPwd = document.getElementById('settings-current-pwd').value;
  const newPwd = document.getElementById('settings-new-pwd').value;
  const confirmPwd = document.getElementById('settings-confirm-pwd').value;

  // Validation
  if (currentPwd !== seller.password) {
    showToast('❌ Incorrect current password');
    return;
  }
  if (!newPwd || newPwd.length < 6) {
    showToast('❌ New password must be at least 6 characters');
    return;
  }
  if (newPwd !== confirmPwd) {
    showToast('❌ New passwords do not match');
    return;
  }

  // Update
  const sellers = Store.getSellers();
  const idx = sellers.findIndex(s => s.id === seller.id);
  if (idx > -1) {
    sellers[idx].password = newPwd;
    Store.setSellers(sellers);
    Store.setCurrentSeller(sellers[idx]);
    SellerState.currentSeller = sellers[idx];
    
    // Clear fields
    document.getElementById('settings-current-pwd').value = '';
    document.getElementById('settings-new-pwd').value = '';
    document.getElementById('settings-confirm-pwd').value = '';
    
    showToast('✅ Password updated successfully!');
  }
}

// ── Auth (Seller) ─────────────────────────────────────────────────────────────
function renderSellerAuthPage() {
  const appEl = document.getElementById('seller-app');
  const authEl = document.getElementById('seller-auth-page');
  if (appEl) appEl.style.display = 'none';
  if (authEl) authEl.style.display = 'flex';
}

function renderSellerApp() {
  const appEl = document.getElementById('seller-app');
  const authEl = document.getElementById('seller-auth-page');
  if (appEl) appEl.style.display = 'flex';
  if (authEl) authEl.style.display = 'none';
  // Update UI with seller info
  const seller = SellerState.currentSeller;
  document.getElementById('sidebar-seller-name').textContent = seller.shopName || seller.name;
  document.getElementById('sidebar-seller-email').textContent = seller.email;
  document.getElementById('sidebar-seller-avatar').textContent = seller.name.charAt(0).toUpperCase();
  const topbarAvatar = document.getElementById('topbar-seller-avatar');
  if (topbarAvatar) topbarAvatar.textContent = seller.name.charAt(0).toUpperCase();
  
  // Populate dropdown info
  const dropName = document.getElementById('dropdown-seller-name');
  const dropEmail = document.getElementById('dropdown-seller-email');
  if (dropName) dropName.textContent = seller.shopName || seller.name;
  if (dropEmail) dropEmail.textContent = seller.email;

  // Show nav badge for pending orders
  const orders = Store.getOrders().filter(o => o.sellerId === seller.id && (o.status === 'pending' || o.status === 'processing' || o.status === 'ready_to_ship'));
  const badge = document.getElementById('orders-nav-badge');
  if (badge) { badge.textContent = orders.length; badge.style.display = orders.length > 0 ? '' : 'none'; }
}

// ── Dropdown Logic ─────────────────────────────────────────────────────────────
function toggleUserDropdown(event) {
  event.stopPropagation();
  const menu = document.getElementById('user-dropdown-menu');
  if (menu) menu.classList.toggle('open');
}

// Close dropdowns on outside click
document.addEventListener('click', () => {
  const menus = document.querySelectorAll('.dropdown-menu');
  menus.forEach(m => m.classList.remove('open'));
});

// ── Financials ────────────────────────────────────────────────────────────────
function renderFinancials() {
  const seller = SellerState.currentSeller;
  if (!seller) return;

  const transactions = Store.getTransactions().filter(t => t.sellerId === seller.id);
  
  // Update stats
  document.getElementById('fin-balance').textContent = formatCurrency(seller.payoutBalance || 0);
  document.getElementById('fin-upcoming').textContent = formatCurrency(seller.upcomingPayout || 0);
  const totalEarned = transactions.filter(t => t.type === 'order_credit').reduce((s, t) => s + t.amount, 0);
  document.getElementById('fin-alltime').textContent = formatCurrency(totalEarned);
  if (document.getElementById('fin-bank-info')) {
    document.getElementById('fin-bank-info').textContent = `Bank: ${seller.bankInfo || 'Not Linked'}`;
  }

  // Render Table
  const tbody = document.getElementById('transactions-table-body');
  if (!tbody) return;

  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No transactions found.</td></tr>';
    return;
  }

  tbody.innerHTML = transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => `
    <tr>
      <td>${formatDate(t.date)}</td>
      <td style="font-family:monospace; font-size:0.85rem">${t.id}</td>
      <td>${t.description}</td>
      <td><span class="badge ${t.type === 'payout' ? 'badge-primary' : (t.type === 'fee' ? 'badge-danger' : 'badge-success')}">${t.type.toUpperCase().replace('_', ' ')}</span></td>
      <td style="font-weight:700; color: ${t.amount < 0 ? 'var(--clr-danger)' : 'var(--clr-success)'}">${formatCurrency(t.amount)}</td>
      <td><span class="badge ${t.status === 'completed' || t.status === 'released' ? 'badge-success' : 'badge-warning'}">${t.status.toUpperCase()}</span></td>
    </tr>
  `).join('');
}

function requestPayout() {
  const seller = SellerState.currentSeller;
  const balance = Number(seller.payoutBalance) || 0;
  if (balance <= 0) return showToast('Insufficient Funds', 'Your balance is zero.', 'warning');
  
  showToast('Payout Requested', `A transfer of ${formatCurrency(balance)} has been initiated to your bank account.`, 'success');
  
  // Mock balance reset
  seller.payoutBalance = 0;
  Auth.saveSeller(seller);
  const sellers = Store.getSellers();
  const idx = sellers.findIndex(s => s.id === seller.id);
  if (idx > -1) { sellers[idx] = seller; Store.setSellers(sellers); }
  
  renderFinancials();
}

function exportTransactionsCSV() {
  const seller = SellerState.currentSeller;
  const txns = Store.getTransactions().filter(t => t.sellerId === seller.id);
  let csv = 'Date,ID,Description,Type,Amount,Status\n';
  txns.forEach(t => csv += `${t.date},${t.id},${t.description},${t.type},${t.amount},${t.status}\n`);
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_${seller.id}_${Date.now()}.csv`;
  a.click();
}

// ── Fulfillment Logic ─────────────────────────────────────────────────────────
function openProcessOrderModal(orderId) {
  const order = Store.getOrders().find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('process-order-id').value = order.id;
  document.getElementById('process-order-status').value = order.status;
  document.getElementById('process-carrier').value = order.carrier || 'Default';
  document.getElementById('process-tracking-id').value = order.trackingId || '';
  
  toggleTrackingFields(order.status);
  updateStepper(order.status);
  
  // Update stepper on status change
  document.getElementById('process-order-status').onchange = (e) => {
    updateStepper(e.target.value);
    toggleTrackingFields(e.target.value);
  };

  openModal('order-process-modal');
}

function updateStepper(status) {
  const statuses = ['pending', 'processing', 'ready_to_ship', 'shipped', 'delivered'];
  const idx = statuses.indexOf(status);
  const percent = idx === -1 ? 0 : (idx / (statuses.length - 1)) * 100;
  
  const bar = document.getElementById('stepper-progress');
  if (bar) bar.style.width = percent + '%';

  document.querySelectorAll('#fulfillment-stepper .step').forEach((step, i) => {
    const circle = step.querySelector('.step-circle');
    const label = step.querySelector('span');
    
    if (i <= idx) {
      circle.style.background = 'var(--clr-primary)';
      circle.style.borderColor = 'var(--clr-primary)';
      circle.innerHTML = '✓';
      circle.style.color = '#fff';
      circle.style.fontSize = '10px';
      label.style.color = 'var(--clr-primary)';
    } else {
      circle.style.background = 'var(--clr-surface)';
      circle.style.borderColor = 'var(--clr-border)';
      circle.innerHTML = '';
      label.style.color = 'var(--clr-text-3)';
    }
  });
}

function toggleTrackingFields(status) {
  const fields = document.getElementById('tracking-fields');
  if (fields) {
    fields.style.display = (status === 'shipped' || status === 'delivered' || status === 'ready_to_ship') ? 'block' : 'none';
  }
}

function submitOrderStatusUpdate(e) {
  e.preventDefault();
  const id = document.getElementById('process-order-id').value;
  const status = document.getElementById('process-order-status').value;
  const carrier = document.getElementById('process-carrier').value;
  const trackingId = document.getElementById('process-tracking-id').value;

  const orders = Store.getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx > -1) {
    orders[idx].status = status;
    orders[idx].carrier = carrier;
    orders[idx].trackingId = trackingId;
    Store.setOrders(orders);

    renderOrdersTable();
    updateSidebarBadges();
    closeAllModals();
    showToast('Success', `Order ${id} updated to ${status}.`, 'success');
  }
}

function toggleAllOrders(mainCheckbox) {
  const items = document.querySelectorAll('.order-select');
  items.forEach(cb => cb.checked = mainCheckbox.checked);
  updateBulkButtons();
}




}

// ── Init ──────────────────────────────────────────────────────────────────────
function initSellerApp() {
  Store.init();
  const saved = Auth.getSeller();

  if (saved) {
    SellerState.currentSeller = saved;
    renderSellerApp();
    
    // Only navigate automatically if on the base seller.html
    const path = window.location.pathname;
    if (!path.includes('seller-')) {
       window.location.href = 'seller-dashboard.html';
    }
  } else {
    renderSellerAuthPage();
    
    // Check for registration mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'register') {
      window.location.href = 'register.html';
    }
  }

  // Nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.page));
  });

  // Seller login form
  document.getElementById('seller-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('seller-email').value.trim();
    const password = document.getElementById('seller-password').value;
    if (!email || !password) return showToast('Error', 'Please fill all fields', 'error');
    
    const result = Auth.loginSeller({ email, password });
    if (result.ok) {
      SellerState.currentSeller = result.seller;
      renderSellerApp();
      navigateTo('dashboard');
      showToast('Welcome back!', `Hello, ${result.seller.name.split(' ')[0]} 👋`, 'success');
    } else {
      showToast('Login Failed', result.message, 'error');
    }
  });

  // Seller logout
  document.getElementById('seller-logout-btn')?.addEventListener('click', () => {
    Auth.logoutSeller();
  });


  // Sidebar toggle (mobile)
  document.getElementById('sidebar-toggle-btn')?.addEventListener('click', () => {
    document.querySelector('.seller-sidebar')?.classList.toggle('open');
  });
  document.querySelector('.seller-sidebar')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('seller-sidebar')) document.querySelector('.seller-sidebar').classList.remove('open');
  });

  // Product search
  document.getElementById('product-search-input')?.addEventListener('input', debounce((e) => {
    SellerState.productSearch = e.target.value.trim();
    renderProductsTable();
  }, 300));

  // Order search
  document.getElementById('order-search-input')?.addEventListener('input', debounce((e) => {
    SellerState.orderSearch = e.target.value.trim();
    renderOrdersTable();
  }, 300));

  // Product form
  document.getElementById('product-form')?.addEventListener('submit', saveProduct);
  document.getElementById('add-product-btn')?.addEventListener('click', openAddProduct);
  document.getElementById('add-product-btn-2')?.addEventListener('click', openAddProduct);

  // Settings form
  document.getElementById('settings-form')?.addEventListener('submit', saveSettings);

  // Close modals
  document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => closeAllModals()));
}

// --- Bulk Document Generation ---

function generateBulkLabels() {
  const checkedIds = Array.from(document.querySelectorAll('.order-select:checked')).map(c => c.value);
  if (!checkedIds.length) {
    showToast('No Selection', 'Please select at least one order.', 'warning');
    return;
  }
  const orders = Store.getOrders();
  const validStatuses = ['pending', 'processing', 'ready_to_ship'];
  
  let htmlResult = '';
  
  checkedIds.forEach(orderId => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !validStatuses.includes(order.status)) return;
    
    const customerName = getUserName(order.userId);
    const itemsList = order.items.map(i => `• ${escapeHtml(i.name)} × ${i.qty}`).join('<br>');
    
    htmlResult += `
      <div style="font-family:'Courier New',monospace;border:2px dashed var(--clr-border);border-radius:var(--radius-lg);padding:var(--space-6);background:var(--clr-surface);max-width:480px;margin:0 auto;page-break-after: always;margin-bottom:var(--space-6)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);border-bottom:1px solid var(--clr-border);padding-bottom:var(--space-3)">
          <div style="font-size:1.2rem;font-weight:700">🏪 Arvaan Collective</div>
          <div style="font-size:.75rem;color:var(--clr-text-3)">SHIPPING LABEL</div>
        </div>
        <div style="margin-bottom:var(--space-3)">
          <div style="font-size:.7rem;color:var(--clr-text-3);margin-bottom:2px">ORDER ID</div>
          <div style="font-weight:700;font-size:1.05rem;letter-spacing:.05em">${order.id}</div>
        </div>
        <div style="margin-bottom:var(--space-3)">
          <div style="font-size:.7rem;color:var(--clr-text-3);margin-bottom:2px">SHIP TO</div>
          <div style="font-weight:600">${escapeHtml(customerName)}</div>
          <div style="font-size:.85rem;color:var(--clr-text-2)">${escapeHtml(order.address)}</div>
        </div>
        <div style="margin-bottom:var(--space-3)">
          <div style="font-size:.7rem;color:var(--clr-text-3);margin-bottom:4px">ITEMS</div>
          <div style="font-size:.82rem;color:var(--clr-text-2);line-height:1.6">${itemsList}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);border-top:1px solid var(--clr-border);padding-top:var(--space-3);margin-top:var(--space-2)">
          <div>
            <div style="font-size:.7rem;color:var(--clr-text-3)">ORDER DATE</div>
            <div style="font-size:.82rem;font-weight:600">${formatDate(order.date)}</div>
          </div>
          <div>
            <div style="font-size:.7rem;color:var(--clr-text-3)">PAYMENT</div>
            <div style="font-size:.82rem;font-weight:600">${escapeHtml(order.paymentMethod)}</div>
          </div>
          <div>
            <div style="font-size:.7rem;color:var(--clr-text-3)">ORDER TOTAL</div>
            <div style="font-size:.82rem;font-weight:700">${formatCurrency(order.total)}</div>
          </div>
          <div>
            <div style="font-size:.7rem;color:var(--clr-text-3)">STATUS</div>
            <div style="font-size:.82rem">${getStatusBadge(order.status)}</div>
          </div>
        </div>
        <div style="margin-top:var(--space-4);text-align:center">
          <div style="font-size:2rem;letter-spacing:.25em;font-weight:700;border:1px solid var(--clr-border);display:inline-block;padding:6px 18px;border-radius:4px">${order.id}</div>
          <div style="font-size:.65rem;color:var(--clr-text-3);margin-top:4px">Scan or quote this ID at dispatch</div>
        </div>
      </div>
    `;
  });

  if (!htmlResult) {
    showToast('No valid orders', 'None of the selected orders are eligible for shipping labels.', 'warning');
    return;
  }

  htmlResult = `<div id="shipping-label-print">${htmlResult}</div>`;
  const footerHtml = `
    <div style="display:flex;gap:var(--space-3);justify-content:flex-end;margin-top:var(--space-5)">
      <button class="btn btn-ghost" onclick="closeAllModals()">Close</button>
      <button class="btn btn-primary" onclick="printShippingLabel()">🖨️ Print Labels</button>
    </div>
  `;

  let modal = document.getElementById('shipping-label-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'shipping-label-modal';
    modal.innerHTML = `<div class="modal modal-lg"><div class="modal-header"><h3>🏷️ Bulk Shipping Labels</h3><button class="modal-close">×</button></div><div class="modal-body" id="shipping-label-body"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', closeAllModals);
  } else {
    modal.querySelector('.modal-header h3').textContent = `🏷️ Bulk Shipping Labels`;
  }
  document.getElementById('shipping-label-body').innerHTML = htmlResult + footerHtml;
  openModal('shipping-label-modal');
}

function generateBulkInvoices() {
  const checkedIds = Array.from(document.querySelectorAll('.order-select:checked')).map(c => c.value);
  if (!checkedIds.length) {
    showToast('No Selection', 'Please select at least one order.', 'warning');
    return;
  }
  const orders = Store.getOrders();
  const seller = SellerState.currentSeller;
  
  let htmlResult = '';
  
  checkedIds.forEach(orderId => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const customerName = getUserName(order.userId);
    const itemsListHtml = order.items.map(i => `
      <tr>
        <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border)">${escapeHtml(i.name)}</td>
        <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border);text-align:center">${i.qty}</td>
        <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border);text-align:right">${formatCurrency(i.price)}</td>
        <td style="padding:var(--space-2);border-bottom:1px solid var(--clr-border);text-align:right">${formatCurrency(i.price * i.qty)}</td>
      </tr>
    `).join('');

    const subtotal = order.subtotal || order.total;
    htmlResult += `
      <div style="font-family:'Inter',sans-serif;background:#fff;color:#111;padding:var(--space-6);border-radius:var(--radius-lg);max-width:700px;margin:0 auto;page-break-after: always;margin-bottom:var(--space-6)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-6);border-bottom:2px solid #eaeaea;padding-bottom:var(--space-4)">
          <div>
            <div style="font-size:1.5rem;font-weight:800;color:#6C63FF;margin-bottom:4px;display:flex;align-items:center;gap:8px">
              <span style="background:#6C63FF;color:#fff;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;font-size:1rem">🏪</span>
              ${escapeHtml(seller.shopName || seller.name)}
            </div>
            <div style="font-size:.85rem;color:#555">${escapeHtml(seller.email)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.8rem;font-weight:300;color:#ccc;letter-spacing:2px">INVOICE</div>
            <div style="font-size:.85rem;font-weight:600;margin-top:4px"># ${order.id}</div>
            <div style="font-size:.85rem;color:#555">Date: ${formatDate(order.date)}</div>
            <div style="font-size:.85rem;color:#555">Status: <span style="text-transform:uppercase;font-size:.75rem">${order.status}</span></div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-6)">
          <div>
            <div style="font-size:.75rem;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:4px">Billed To</div>
            <div style="font-size:1rem;font-weight:600">${escapeHtml(customerName)}</div>
            <div style="font-size:.85rem;color:#555;max-width:200px;line-height:1.4;margin-top:4px">${escapeHtml(order.address || 'Address not provided')}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:.75rem;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:4px">Payment Method</div>
            <div style="font-size:.9rem;font-weight:600">${escapeHtml(order.paymentMethod || 'N/A')}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:var(--space-6)">
          <thead>
            <tr style="background:#f9f9f9">
              <th style="padding:var(--space-2);text-align:left;border-bottom:2px solid #eaeaea;font-size:.75rem;color:#888;text-transform:uppercase">Item</th>
              <th style="padding:var(--space-2);text-align:center;border-bottom:2px solid #eaeaea;font-size:.75rem;color:#888;text-transform:uppercase">Qty</th>
              <th style="padding:var(--space-2);text-align:right;border-bottom:2px solid #eaeaea;font-size:.75rem;color:#888;text-transform:uppercase">Price</th>
              <th style="padding:var(--space-2);text-align:right;border-bottom:2px solid #eaeaea;font-size:.75rem;color:#888;text-transform:uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>

        <div style="display:flex;justify-content:flex-end">
          <div style="width:250px">
            <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid #eaeaea">
              <span style="font-size:.85rem;color:#555">Subtotal</span>
              <span style="font-size:.85rem;font-weight:600">${formatCurrency(subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid #eaeaea">
              <span style="font-size:.85rem;color:#555">Tax (0%)</span>
              <span style="font-size:.85rem;font-weight:600">$0.00</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:var(--space-3) 0;margin-top:4px">
              <span style="font-size:1.1rem;font-weight:700">Total</span>
              <span style="font-size:1.2rem;font-weight:800;color:#6C63FF">${formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
        
        <div style="margin-top:var(--space-8);text-align:center;font-size:.75rem;color:#888;border-top:1px solid #eaeaea;padding-top:var(--space-3)">
          Thank you for your business! If you have any questions, please contact ${escapeHtml(seller.email)}.
        </div>
      </div>
    `;
  });

  htmlResult = `<div id="invoice-print-content">${htmlResult}</div>`;
  const footerHtml = `
    <div style="display:flex;gap:var(--space-3);justify-content:flex-end;margin-top:var(--space-5)">
      <button class="btn btn-ghost" onclick="closeAllModals()">Close</button>
      <button class="btn btn-primary" onclick="printInvoice()">🖨️ Print Invoices</button>
    </div>
  `;

  let modal = document.getElementById('invoice-print-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'invoice-print-modal';
    modal.innerHTML = `<div class="modal modal-lg"><div class="modal-header"><h3>📄 Bulk Invoices</h3><button class="modal-close">×</button></div><div class="modal-body" id="invoice-print-body"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', closeAllModals);
  } else {
    modal.querySelector('.modal-header h3').textContent = `📄 Bulk Invoices`;
  }
  document.getElementById('invoice-print-body').innerHTML = htmlResult + footerHtml;
  openModal('invoice-print-modal');
}

// ── Promotions Management ───────────────────────────────────────────────────

function getPromotions() {
  return JSON.parse(localStorage.getItem('arvaan_promotions') || '[]');
}

function setPromotions(promos) {
  localStorage.setItem('arvaan_promotions', JSON.stringify(promos));
}

function renderPromotionsTable() {
  const seller = SellerState.currentSeller;
  const tbody = document.getElementById('promotions-table-body');
  if (!tbody) return;
  
  const promos = getPromotions().filter(p => p.sellerId === seller.id).reverse();
  
  if (!promos.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:32px"><div class="empty-icon">🏷️</div><h3>No promotions active</h3><p>Create a discount code to boost sales!</p></div></td></tr>`;
    return;
  }
  
  tbody.innerHTML = promos.map(p => {
    const orders = Store.getOrders().filter(o => o.promoCode === p.code);
    const revGenerated = orders.reduce((s, o) => s + o.total, 0);
    return `
    <tr>
      <td>
        <div style="font-weight:700;font-family:monospace;font-size:1.05rem;letter-spacing:1px;color:var(--clr-primary)">${escapeHtml(p.code)}</div>
        <div style="font-size:0.7rem;color:var(--clr-text-3)">${p.type.toUpperCase()} DISCOUNT</div>
      </td>
      <td style="font-weight:700">${p.type === 'percentage' ? p.value + '%' : formatCurrency(p.value)}</td>
      <td>
        <div style="font-weight:700;color:var(--clr-success)">${formatCurrency(revGenerated)}</div>
        <div style="font-size:0.75rem;color:var(--clr-text-3)">Generated</div>
      </td>
      <td>${p.active ? '<span class="badge badge-success">Live</span>' : '<span class="badge badge-ghost">Paused</span>'}</td>
      <td>
        <div style="font-size:.85rem;font-weight:600">${p.usageCount} / ${p.limit || '∞'}</div>
        <div style="font-size:0.7rem;color:var(--clr-text-3)">Redemptions</div>
      </td>
      <td class="text-right">
        <div style="display:flex;gap:6px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" onclick="togglePromoStatus('${p.id}')">
            ${p.active ? '⏸️' : '▶️'}
          </button>
          <button class="btn btn-danger btn-sm" onclick="deletePromo('${p.id}')">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openCreatePromo() {
  document.getElementById('promo-form').reset();
  openModal('promo-modal');
}

function savePromo(e) {
  e.preventDefault();
  const seller = SellerState.currentSeller;
  const form = document.getElementById('promo-form');
  
  const code = form.querySelector('#promo-code').value.trim().toUpperCase();
  const type = form.querySelector('#promo-type').value;
  const value = parseFloat(form.querySelector('#promo-value').value) || 0;
  const limitInput = form.querySelector('#promo-limit').value;
  const limit = limitInput ? parseInt(limitInput) : null;
  const active = form.querySelector('#promo-active').checked;
  
  if (!code || !value) {
    showToast('Missing details', 'Please provide a promo code and discount value', 'error');
    return;
  }
  
  const promos = getPromotions();
  if (promos.some(p => p.code === code && p.sellerId === seller.id)) {
    showToast('Code exists', 'You already have a promo code with this name', 'error');
    return;
  }
  
  const newPromo = {
    id: genId('promo'),
    sellerId: seller.id,
    code, type, value, limit, active,
    usageCount: 0,
    createdAt: new Date().toISOString()
  };
  
  promos.push(newPromo);
  setPromotions(promos);
  
  closeModal('promo-modal');
  showToast('Promo Created!', `Discount code ${code} is now live.`, 'success');
  renderPromotionsTable();
}

function togglePromoStatus(id) {
  const promos = getPromotions();
  const p = promos.find(p => p.id === id);
  if (p) {
    p.active = !p.active;
    setPromotions(promos);
    renderPromotionsTable();
    showToast('Status Updated', `Promo ${p.code} is now ${p.active ? 'active' : 'disabled'}`, 'info');
  }
}

function deletePromo(id) {
  if (!confirm('Are you sure you want to delete this promo code?')) return;
  const promos = getPromotions().filter(p => p.id !== id);
  setPromotions(promos);
  renderPromotionsTable();
  showToast('Deleted', 'Promo code removed', 'info');
}

// ── Customer Reviews Management ────────────────────────────────────────────────

function renderReviewsTable() {
  const seller = SellerState.currentSeller;
  const tbody = document.getElementById('reviews-table-body');
  if (!tbody) return;
  
  const products = Store.getProducts().filter(p => p.seller === seller.id || p.sellerId === seller.id);
  
  const allReviewsGlob = Store.getReviews();
  let allReviews = [];
  
  products.forEach(p => {
    // Check global reviews
    const prodReviews = allReviewsGlob.filter(r => r.productId === p.id);
    prodReviews.forEach(r => {
      allReviews.push({ ...r, productName: p.name, productImage: p.images[0] });
    });
    
    // Fallback/Legacy: check per-product reviewsList
    if (p.reviewsList) {
      p.reviewsList.forEach(r => {
        if (!allReviews.find(ex => ex.id === r.id)) {
          allReviews.push({ ...r, productId: p.id, productName: p.name, productImage: p.images[0] });
        }
      });
    }
  });
  
  allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (!allReviews.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:32px"><div class="empty-icon">⭐</div><h3>No reviews yet</h3><p>When customers review your products, they will appear here.</p></div></td></tr>`;
    return;
  }
  
  tbody.innerHTML = allReviews.map(r => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${r.productImage}" style="width:40px;height:40px;object-fit:cover;border-radius:6px" onerror="this.src='https://placehold.co/40x40/1a1a2e/6C63FF?text=P'">
          <div style="font-weight:600;font-size:.85rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(r.productName)}</div>
        </div>
      </td>
      <td>
        ${getStarsHTML(r.rating)}
      </td>
      <td>
        <div style="font-weight:600;font-size:.85rem">${escapeHtml(r.title || '')}</div>
        <div style="font-size:.8rem;color:var(--clr-text-2);max-width:300px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(r.text)}</div>
      </td>
      <td style="font-size:.85rem">${formatDate(r.date)}</td>
      <td>
        ${r.sellerReply ? '<span class="badge badge-success">Replied</span>' : '<span class="badge badge-warning">Pending</span>'}
      </td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openReviewReply('${r.productId}', '${r.id}')">
          ${r.sellerReply ? 'Edit Reply' : 'Reply'}
        </button>
      </td>
    </tr>
  `).join('');
}

function openReviewReply(productId, reviewId) {
  const product = Store.getProducts().find(p => p.id === productId);
  if (!product || !product.reviewsList) return;
  const review = product.reviewsList.find(r => r.id === reviewId);
  if (!review) return;
  
  document.getElementById('reply-product-id').value = productId;
  document.getElementById('reply-review-id').value = reviewId;
  
  document.getElementById('review-reply-context').innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      ${getStarsHTML(review.rating)}
      <span style="font-size:.75rem;color:var(--clr-text-3)">${formatDate(review.date)}</span>
    </div>
    <div style="font-weight:600;margin-bottom:4px;font-size:.9rem">${escapeHtml(review.title || '')}</div>
    <div style="font-size:.85rem;color:var(--clr-text-2)">${escapeHtml(review.text)}</div>
  `;
  
  document.getElementById('review-reply-text').value = review.sellerReply || '';
  
  openModal('review-reply-modal');
}

function submitReviewReply(e) {
  e.preventDefault();
  const productId = document.getElementById('reply-product-id').value;
  const reviewId = document.getElementById('reply-review-id').value;
  const replyText = document.getElementById('review-reply-text').value.trim();
  
  if (!replyText) {
    showToast('Empty Reply', 'Please write a reply before submitting.', 'error');
    return;
  }
  
  const products = Store.getProducts();
  const pIdx = products.findIndex(p => p.id === productId);
  if (pIdx > -1 && products[pIdx].reviewsList) {
    const rIdx = products[pIdx].reviewsList.findIndex(r => r.id === reviewId);
    if (rIdx > -1) {
      products[pIdx].reviewsList[rIdx].sellerReply = replyText;
      products[pIdx].reviewsList[rIdx].sellerReplyDate = new Date().toISOString();
      Store.setProducts(products);
      
      closeModal('review-reply-modal');
      renderReviewsTable();
      showToast('Reply Posted', 'Your reply has been saved and is now visible to the customer.', 'success');
    }
  }
}

// ── Data Export ───────────────────────────────────────────────────────────────

function downloadCSV(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportProductsCSV() {
  const seller = SellerState.currentSeller;
  if (!seller) return;
  const products = Store.getProducts().filter(p => p.seller === seller.id || p.sellerId === seller.id);
  
  if (!products.length) {
    showToast('Export Failed', 'No products to export.', 'error');
    return;
  }
  
  const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'Sold', 'Rating'];
  const rows = products.map(p => [
    p.id,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.category.replace(/"/g, '""')}"`,
    p.price,
    p.stock,
    p.sold,
    p.rating
  ]);
  
  const csvContent = [headers.join(',')].concat(rows.map(r => r.join(','))).join('\n');
  downloadCSV(csvContent, `products_export_${new Date().toISOString().split('T')[0]}.csv`);
  showToast('Exported', 'Products exported successfully.', 'success');
}

function exportOrdersCSV() {
  const seller = SellerState.currentSeller;
  if (!seller) return;
  const orders = Store.getOrders().filter(o => o.sellerId === seller.id);
  
  if (!orders.length) {
    showToast('Export Failed', 'No orders to export.', 'error');
    return;
  }
  
  const headers = ['Order ID', 'Customer ID', 'Date', 'Status', 'Total Amount', 'Items Count'];
  const rows = orders.map(o => [
    o.id,
    o.userId,
    o.date,
    o.status,
    o.total,
    o.items.length
  ]);
  
  const csvContent = [headers.join(',')].concat(rows.map(r => r.join(','))).join('\n');
  downloadCSV(csvContent, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
  showToast('Exported', 'Orders exported successfully.', 'success');
}

// ── Notifications Management ──────────────────────────────────────────────────

function initNotifications() {
  const notifBtn = document.getElementById('topbar-notif-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.style.display = notifDropdown.style.display === 'none' ? 'block' : 'none';
      if (notifDropdown.style.display === 'block') {
        renderNotifications();
      }
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.style.display = 'none';
      }
    });
  }
}

function renderNotifications() {
  const seller = SellerState.currentSeller;
  const listEl = document.getElementById('notif-list');
  const badgeEl = document.getElementById('topbar-notif-badge');
  if (!listEl) return;
  
  if (!seller) return;
  
  let notifs = [];
  
  // High Priority: Low Stock
  const products = Store.getProducts().filter(p => p.seller === seller.id || p.sellerId === seller.id);
  products.forEach(p => {
    if (p.stock <= (p.lowStockThreshold || 10)) {
       notifs.push({
         type: 'warning',
         icon: '⚠️',
         title: 'Low Stock Alert',
         msg: `"${p.name}" has only ${p.stock} units left.`,
         time: new Date().toISOString(),
         read: false
       });
    }
  });
  
  // Medium Priority: New Orders (Pending)
  const orders = Store.getOrders().filter(o => o.sellerId === seller.id && o.status === 'pending');
  if (orders.length > 0) {
    notifs.push({
      type: 'info',
      icon: '🛍️',
      title: 'New Orders Pending',
      msg: `You have ${orders.length} order(s) awaiting processing.`,
      time: new Date().toISOString(),
      read: false
    });
  }
  
  // Sort notifs (in a real app, these would come from a DB)
  notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
  
  const hasHiddenAlerts = localStorage.getItem(`arvaan_seller_notifs_read_${seller.id}`);
  
  if (!notifs.length || hasHiddenAlerts === 'true') {
     listEl.innerHTML = `<div style="padding:var(--space-4);text-align:center;color:var(--clr-text-3);font-size:.85rem">No new notifications</div>`;
     if (badgeEl) badgeEl.style.display = 'none';
     return;
  }
  
  listEl.innerHTML = notifs.map(n => `
    <div style="padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--clr-border);display:flex;gap:var(--space-3);align-items:flex-start">
      <div style="font-size:1.2rem">${n.icon}</div>
      <div>
        <div style="font-weight:600;font-size:.85rem;margin-bottom:2px">${escapeHtml(n.title)}</div>
        <div style="font-size:.8rem;color:var(--clr-text-2)">${escapeHtml(n.msg)}</div>
      </div>
    </div>
  `).join('');
  
  if (badgeEl) {
    badgeEl.textContent = notifs.length;
    badgeEl.style.display = 'block';
  }
}

function markNotifsRead() {
  const seller = SellerState.currentSeller;
  if (!seller) return;
  localStorage.setItem(`arvaan_seller_notifs_read_${seller.id}`, 'true');
  renderNotifications();
}

document.addEventListener('DOMContentLoaded', () => {
  initSellerApp();
  initNotifications();
  // Also initial render of badges
  setTimeout(renderNotifications, 500);
});

function updateGlobalLocalizations() {
  document.querySelectorAll('.localized-price').forEach(el => {
    const baseVal = parseFloat(el.dataset.base);
    if (!isNaN(baseVal)) {
      el.textContent = formatCurrency(baseVal);
    }
  });
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { setTimeout(updateGlobalLocalizations, 100); });
} else {
  setTimeout(updateGlobalLocalizations, 100);
}
