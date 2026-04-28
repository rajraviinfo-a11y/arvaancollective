'use strict';
window.UI = null;

let currentCurrency = 'INR';
try {
  if (typeof Store !== 'undefined' && Store.getSettings) {
    currentCurrency = Store.getSettings().currency;
  }
} catch(e) { console.error("Currency init failed", e); }

const StoreState = {
  products: [],
  filteredProducts: [],
  currentCategory: 'All', 
  currentSubCategory: null, // NEW: Sub-category filtering
  selectedCategories: [], 
  selectedBrands: [],     // NEW: Multi-select brands/sellers
  currentFilter: null,    // 'deals', 'new'
  searchQuery: '',
  priceMax: 150000,
  minRating: 0,
  inStockOnly: false,     // NEW: Availability
  sortBy: 'popular',
  viewMode: 'grid',
  page: 1,
  pageSize: 12,
  currentProduct: null,
  checkoutStep: 1, 
  comparisonList: [],
  promoDiscount: 0, 
  isGiftWrapped: false,
  orderNotes: '',
  selectedAddressId: null,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const UI = {
  get(id) { return document.getElementById(id); },
  all(sel) { return document.querySelectorAll(sel); },
  safeSet(id, prop, val) { const el = this.get(id); if (el) el[prop] = val; },
  safeHTML(id, html) { const el = this.get(id); if (el) el.innerHTML = html; },
  safeHide(id) { const el = this.get(id); if (el) el.classList.add('hidden'); },
  safeShow(id) { const el = this.get(id); if (el) el.classList.remove('hidden'); },
  updateDebugUI() { /* Removed in production */ },
  
  showToast(title, msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${msg}</div>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 100);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }
};

// Make UI global for the debug interval and other scripts
window.UI = UI;





function formatCurrency(amt) {
  const code = currentCurrency || 'INR';
  if (code === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt / 83);
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
}

function getMaxPrice() {
  const products = StoreState.products.length > 0 ? StoreState.products : Store.getProducts();
  if (products.length === 0) return 150000; // Default sensible high
  const validPrices = products.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
  if (validPrices.length === 0) return 150000;
  return Math.ceil(Math.max(...validPrices) / 100) * 100;
}

function getStarsHTML(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 !== 0;
  let html = '';
  for (let i = 0; i < full; i++) html += '★';
  if (half) html += '½';
  while (html.replace(/<[^>]+>/g, '').length < 5) html += '☆';
  return `<span style="color:#f59e0b; letter-spacing:1px">${html}</span>`;
}

/**
 * --- Promo Code Manager ---
 */
const PromoMgr = {
  codes: {
    'WELCOME10': { type: 'percent', value: 10 },
    'ELEVATE': { type: 'shipping', value: 0 },
    'COLLECTIVE20': { type: 'percent', value: 20 },
    'SAVE5': { type: 'fixed', value: 5 }
  },
  apply(code) {
    code = code.toUpperCase();
    let promo = this.codes[code];
    
    // Check localStorage if not in hardcoded codes
    if (!promo) {
      const dbPromos = JSON.parse(localStorage.getItem('arvaan_promotions') || '[]');
      const dbMatch = dbPromos.find(p => p.code === code && p.active);
      if (dbMatch) {
        promo = { type: dbMatch.type === 'percentage' ? 'percent' : 'fixed', value: dbMatch.value };
      }
    }

    if (!promo) {
      showToast('Invalid Code', 'The promo code you entered is not valid.', 'error');
      return;
    }
    
    if (promo.type === 'percent') {
      StoreState.promoDiscount = promo.value;
      showToast('Promo Applied', `${promo.value}% discount has been applied!`, 'success');
    } else if (promo.type === 'fixed') {
      // Approximate as % of current subtotal for internal state consistency
      const sub = Cart.subtotal();
      StoreState.promoDiscount = (promo.value / sub) * 100;
      showToast('Promo Applied', `${formatCurrency(promo.value)} discount has been applied!`, 'success');
    } else if (promo.type === 'shipping') {
      StoreState.promoDiscount = 0.001; // Special marker for free shipping
      showToast('Promo Applied', `Free shipping applied!`, 'success');
    }
    
    updateCartUI();
    // Check if we are on a page with checkout step rendering
    if (UI.get('checkout-panel-1')) {
      renderCheckoutStep();
    }
  }
};

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(title, msg, type = 'info') {
  if (typeof UI !== 'undefined' && UI.showToast) {
    UI.showToast(title, msg, type);
  } else {
    console.log(`Toast: [${type}] ${title} - ${msg}`);
  }
}

// ── Cart Logic ───────────────────────────────────────────────────────────────
const Cart = {
  get() { return Store.getCart(); },
  add(productId, qty = 1, variant = null) {
    const cart = this.get();
    const products = Store.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const price = variant ? variant.price : product.price;
    const stock = variant ? variant.stock : product.stock;
    const cartId = variant ? `${productId}-${variant.name}` : productId;
    
    const existing = cart.find(item => item.cartId === cartId);
    if (existing) { 
      existing.qty = Math.min(existing.qty + qty, stock); 
    } else { 
      cart.push({ 
        cartId, 
        id: productId, 
        qty, 
        name: product.name + (variant ? ` (${variant.name})` : ''), 
        price, 
        image: product.images[0], 
        stock,
        variantName: variant ? variant.name : null,
        sellerId: product.seller || product.sellerId,
        weightGms: product.weightGms || 0
      }); 
    }
    Store.setCart(cart);
    updateCartUI();
    showToast('Added to cart!', product.name, 'success');
  },
  remove(cartId) {
    const cart = this.get().filter(item => item.cartId !== cartId);
    Store.setCart(cart);
    updateCartUI();
    showToast('Removed', 'Item removed from cart', 'info');
  },
  updateQty(productId, qty) {
    const cart = this.get();
    const item = cart.find(i => i.id === productId);
    if (item) { 
      item.qty = Math.max(1, Math.min(qty, item.stock)); 
      Store.setCart(cart); 
      updateCartUI(); 
    }
  },
  clear() { Store.setCart([]); updateCartUI(); },
  count() { return this.get().reduce((s, i) => s + i.qty, 0); },
  subtotal() { return this.get().reduce((s, i) => s + i.price * i.qty, 0); },
  shipping() { 
    if (this.subtotal() === 0) return 0;
    if (StoreState.promoDiscount === 0.001) return 0; // Free shipping promo

    const cart = this.get();
    const sellers = Store.getSellers();
    const sellerBuckets = {};

    // Group items by seller
    cart.forEach(item => {
      const sid = item.sellerId || 'seller1';
      if (!sellerBuckets[sid]) sellerBuckets[sid] = { subtotal: 0, weight: 0 };
      sellerBuckets[sid].subtotal += item.price * item.qty;
      sellerBuckets[sid].weight += (item.weightGms || 0) * item.qty;
    });

    let totalShipping = 0;
    Object.keys(sellerBuckets).forEach(sid => {
      const s = sellers.find(sel => sel.id === sid) || sellers[0];
      const bucket = sellerBuckets[sid];
      const config = s.shippingConfig || { freeThreshold: 1000, tiers: [{maxWeight:500, price:80}, {maxWeight:1000, price:160}] };

      if (bucket.subtotal >= config.freeThreshold) {
        // Free shipping for this seller
      } else {
        // Apply tiered shipping
        let tierPrice = 0;
        if (config.tiers && config.tiers.length > 0) {
          // Sort tiers by maxWeight just in case
          const sortedTiers = [...config.tiers].sort((a, b) => a.maxWeight - b.maxWeight);
          const match = sortedTiers.find(t => bucket.weight <= t.maxWeight);
          if (match) {
            tierPrice = match.price;
          } else {
            // Above highest tier? Use last tier or cap
            tierPrice = sortedTiers[sortedTiers.length - 1].price;
          }
        }
        totalShipping += tierPrice;
      }
    });

    return totalShipping;
  },
  discountAmt() {
    if (StoreState.promoDiscount > 1) return (this.subtotal() * StoreState.promoDiscount) / 100;
    return 0;
  },
  tax() { 
    const cart = this.get();
    const sellers = Store.getSellers();
    let totalTax = 0;

    cart.forEach(item => {
      const sid = item.sellerId || 'seller1';
      const s = sellers.find(sel => sel.id === sid) || sellers[0];
      const rate = (s.taxRate || 8.5) / 100;
      const itemSubtotal = item.price * item.qty;
      
      // Proportionally apply discount if any
      const discountRatio = this.subtotal() > 0 ? (this.subtotal() - this.discountAmt()) / this.subtotal() : 1;
      totalTax += (itemSubtotal * discountRatio) * rate;
    });

    return totalTax;
  },
  giftWrapFee() { return StoreState.isGiftWrapped ? 5.00 : 0; },
  total() { 
    if (this.subtotal() === 0) return 0;
    return Math.max(0, this.subtotal() - this.discountAmt() + this.shipping() + this.tax() + this.giftWrapFee()); 
  }
};

// ── Wishlist Logic ───────────────────────────────────────────────────────────
const WishlistMgr = {
  get() { return Store.getWishlist(); },
  toggle(productId) {
    return ensureAuthenticated(() => {
      const wl = this.get();
      const idx = wl.indexOf(productId);
      if (idx > -1) { 
        wl.splice(idx, 1); 
        showToast('Removed', 'Removed from wishlist', 'info'); 
      } else { 
        wl.push(productId); 
        showToast('Wishlisted!', 'Added to your wishlist ❤️', 'success'); 
      }
      Store.setWishlist(wl);
      return idx === -1;
    }, 'Please sign in to curate your wishlist.');
  },
  has(productId) { return this.get().includes(productId); }
};

// ── Comparison Manager ────────────────────────────────────────────────────────
const ComparisonMgr = {
  getList() { return StoreState.comparisonList; },
  add(productId) {
    const list = this.getList();
    if (list.includes(productId)) { showToast('Already added', 'This product is already in comparison', 'info'); return; }
    if (list.length >= 3) { showToast('Limit Reached', 'You can only compare up to 3 products', 'warning'); return; }
    list.push(productId);
    StoreState.comparisonList = list;
    this.renderDrawer();
    showToast('Added to Compare', 'Check the comparison drawer', 'success');
  },
  remove(productId) {
    StoreState.comparisonList = this.getList().filter(id => id !== productId);
    this.renderDrawer();
  },
  clear() {
    StoreState.comparisonList = [];
    this.renderDrawer();
  },
  renderDrawer() {
    const list = this.getList();
    const drawer = document.getElementById('comparison-drawer');
    const itemsEl = document.getElementById('comparison-items');
    const countEl = document.getElementById('comparison-count');
    if (!drawer || !itemsEl) return;

    if (list.length === 0) { drawer.classList.add('hidden'); return; }
    drawer.classList.remove('hidden');
    if (countEl) countEl.textContent = `(${list.length}/3)`;

    const products = Store.getProducts();
    itemsEl.innerHTML = list.map(id => {
      const p = products.find(prod => prod.id === id);
      return `<div class="comparison-item" style="position:relative">
        <img src="${p.images[0]}" style="width:40px;height:40px;object-fit:cover;border-radius:4px">
        <div style="position:absolute;top:-5px;right:-5px;background:var(--clr-danger);color:#fff;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer" onclick="ComparisonMgr.remove('${id}')">×</div>
      </div>`;
    }).join('');
  },
  renderModal() {
    const list = this.getList();
    const body = document.getElementById('comparison-modal-body');
    if (!body) return;
    const products = Store.getProducts().filter(p => list.includes(p.id));
    const allSpecs = [...new Set(products.flatMap(p => Object.keys(p.specifications)))];
    
    body.innerHTML = `
      <table class="comparison-table" style="width:100%; border-collapse:collapse">
        <thead>
          <tr>
            <th style="text-align:left;padding:12px;border-bottom:1px solid var(--clr-border)">Feature</th>
            ${products.map(p => `<td style="padding:12px;border-bottom:1px solid var(--clr-border);text-align:center">
              <img src="${p.images[0]}" style="width:80px;height:80px;border-radius:8px;margin-bottom:8px">
              <div style="font-weight:700">${p.name}</div>
              <div style="color:var(--clr-primary)">${formatCurrency(p.price)}</div>
            </td>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr><th style="text-align:left;padding:12px;border-bottom:1px solid var(--clr-border)">Rating</th>${products.map(p => `<td style="text-align:center;padding:12px;border-bottom:1px solid var(--clr-border)">${p.rating} ⭐</td>`).join('')}</tr>
          ${allSpecs.map(spec => `
            <tr>
              <th style="text-align:left;padding:12px;border-bottom:1px solid var(--clr-border)">${spec}</th>
              ${products.map(p => `<td style="text-align:center;padding:12px;border-bottom:1px solid var(--clr-border)">${p.specifications[spec] || '—'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>`;
    openModal('comparison-modal');
  }
};

// ── Rendering ────────────────────────────────────────────────────────────────
// ── Rendering & Formatting ───────────────────────────────────────────────────

function renderFeaturedProducts(limit = 8, categoryFilter = null) {
  const container = UI.get('featured-products');
  if (!container) return;
  
  let products = StoreState.products.filter(p => p.isActive !== false);
  if (categoryFilter) {
    products = products.filter(p => p.category === categoryFilter);
  } else {
    products = products.filter(p => p.featured || p.rating >= 4.5);
  }
  
  products = products.sort((a, b) => b.rating - a.rating).slice(0, limit);
  
  if (products.length === 0) {
    container.innerHTML = `<p style="padding:40px; text-align:center; color:var(--clr-text-3)">New masterful curations arriving soon.</p>`;
    return;
  }
  
  container.innerHTML = products.map(p => renderProductCard(p)).join('');
  addProductCardListeners();
}

function renderTrendingProducts(limit = 4) {
  const container = UI.get('trending-products');
  if (!container) return;
  
  const products = StoreState.products
    .filter(p => p.isActive !== false && (p.isNew || p.trending))
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, limit);
    
  if (products.length === 0) {
    container.innerHTML = `<p style="padding:40px; text-align:center; color:var(--clr-text-3)">Coming soon to the spotlight.</p>`;
    return;
  }
  
  container.innerHTML = products.map(p => renderProductCard(p)).join('');
  addProductCardListeners();
}

// (Consolidated into New Homepage Utilities)


function renderProductCard(p) {
  const isWishlisted = WishlistMgr.has(p.id);
  const secondaryImg = (p.images && p.images.length > 1) ? `<img class="product-img-secondary" src="${p.images[1]}" loading="lazy">` : '';
  const discountPct = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  
  let badgeHTML = '';
  if (p.isNew || p.new) badgeHTML = `<div class="product-badge badge-new">New</div>`;
  else if (discountPct > 0) badgeHTML = `<div class="product-badge badge-sale">${discountPct}% OFF</div>`;
  else if (p.trending) badgeHTML = `<div class="product-badge badge-hot">🔥 Hot</div>`;

  return `
  <div class="product-card fade-in" data-id="${p.id}" onclick="openProductDetail('${p.id}')">
    <div class="product-img-wrap">
      <img class="product-img" src="${p.images[0]}" alt="${escapeHtml(p.name)}" loading="lazy">
      ${secondaryImg}
      ${badgeHTML}
      <button class="product-wish-btn wish-btn ${isWishlisted ? 'wishlisted' : ''}" data-id="${p.id}" title="Add to Wishlist">${isWishlisted ? '❤️' : '🤍'}</button>
      <div class="product-actions-overlay">
        <button class="quick-action-btn qv-btn" data-id="${p.id}">👁️ Quick View</button>
        <button class="quick-action-btn add-cart-btn" data-id="${p.id}">🛒 Add to Cart</button>
      </div>
    </div>
    <div class="product-body">
      <div class="product-category">${p.category}</div>
      <div class="product-name">${escapeHtml(p.name)}</div>
      <div class="product-rating">
        <span class="stars-display">${getStarsHTML(p.rating)}</span>
        <span>${p.rating} (${p.reviews || 0})</span>
      </div>
      <div class="product-foot">
        <div class="product-price-block">
          <span class="product-price">${formatCurrency(p.price)}</span>
          ${p.originalPrice ? `<span class="product-price-original">${formatCurrency(p.originalPrice)}</span>` : ''}
          ${discountPct > 0 ? `<span class="product-discount">${discountPct}% off</span>` : ''}
        </div>
        <button class="add-cart-btn" data-id="${p.id}" onclick="event.stopPropagation(); Cart.add('${p.id}')">Add +</button>
      </div>
    </div>
  </div>`;
}

function addProductCardListeners() {
  document.querySelectorAll('.add-cart-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); Cart.add(btn.dataset.id); });
  document.querySelectorAll('.wish-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); const added = WishlistMgr.toggle(btn.dataset.id); btn.innerHTML = added ? '❤️' : '🤍'; });
  document.querySelectorAll('.compare-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); ComparisonMgr.add(btn.dataset.id); });
  document.querySelectorAll('.qv-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); openQuickView(btn.dataset.id); });
  document.querySelectorAll('.product-card').forEach(card => card.onclick = () => openProductDetail(card.dataset.id));
}

function renderProducts(gridId = 'products-grid', options = {}) {
  console.log('renderProducts called with gridId:', gridId);
  const grid = document.getElementById(gridId) || document.getElementById('products-grid');
  if (!grid) {
    console.warn('renderProducts: Grid element not found:', gridId);
    return;
  }

  let products = [...StoreState.products];
  console.log('renderProducts: Initial product count:', products.length);

  // Apply filters from options or global state
  if (options.category) {
    products = products.filter(p => p.category === options.category);
  } else if (options.filter === 'featured') {
    products = products.filter(p => p.featured);
  } else if (options.filter === 'popular' || options.filter === 'trending') {
    products = products.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  } else if (Object.keys(options).length === 0) {
    // If no specific options, use global StoreState (for Shop page)
    products = applyFilters();
    updateShopHeaders();
  }

  // Final count after filtering
  const total = products.length;
  const limit = options.limit || products.length;
  const start = (StoreState.page - 1) * StoreState.pageSize;
  const paginated = products.slice(start, start + StoreState.pageSize).slice(0, limit);

  if (paginated.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 100px 0;">
      <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
      <h3 style="font-size: 1.5rem; margin-bottom: 10px;">No products found</h3>
      <p style="color: var(--clr-text-3);">Try adjusting your refinements or clearing filters.</p>
      <button class="btn btn-outline" onclick="resetFilters()" style="margin-top: 20px;">Clear All Filters</button>
    </div>`;
  } else {
    grid.className = (StoreState.viewMode === 'list') ? 'products-list' : 'products-grid';
    grid.innerHTML = paginated.map(p => renderProductCard(p)).join('');
    addProductCardListeners();
  }

  // Update result counts
  const countEl = document.getElementById('result-count') || document.getElementById('product-count');
  if (countEl) countEl.textContent = `${total} items found`;

  // Render pagination if NOT in widget mode
  if (!options.limit) {
    const paginEl = document.getElementById('pagination-container') || document.getElementById('pagination');
    if (paginEl) renderPagination(paginEl, Math.ceil(total / StoreState.pageSize));
  }
}

// renderFilters moved to alias at line 786 to avoid duplicate declaration error

/**
 * --- Refinement Sidebar Rendering ---
 */
function renderSidebarFilters() {
  const sidebar = document.getElementById('shop-sidebar');
  if (!sidebar) return;

  const products = StoreState.products;
  const maxPrice = getMaxPrice();

  let adminFilters = [];
  try {
    if (typeof AdminStore !== 'undefined') {
      const catSlug = StoreState.currentCategory && StoreState.currentCategory !== 'All' 
        ? StoreState.currentCategory 
        : 'Electronics'; // Fallback
      adminFilters = AdminStore.getFilters(catSlug).filter(f => f.isActive);
    }
  } catch (e) { console.error("AdminStore not loaded", e); }

  if (adminFilters.length === 0) {
    // Fallback to minimal static if no admin config found
    const categories = [...new Set(products.map(p => p.category))].sort();
    const brands = [...new Set(products.map(p => p.brand || p.sellerName || 'Other'))].sort();
    sidebar.innerHTML = `
      <div class="sidebar-widget">
        <h4 class="sidebar-widget-title">Brand</h4>
        <div class="sidebar-filter-list">
          ${brands.slice(0,8).map(brand => `
            <label class="filter-checkbox-label">
              <input type="checkbox" value="${brand}" class="brand-filter" 
                     ${StoreState.selectedBrands.includes(brand) ? 'checked' : ''}>
              <span class="checkbox-custom"></span><span class="filter-label-text">${brand}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
    bindSidebarEvents();
    return;
  }

  // Generate strictly from AdminConfig
  sidebar.innerHTML = adminFilters.map(f => {
    
    if (f.type === 'checkbox') {
      return `
        <div class="sidebar-widget">
          <h4 class="sidebar-widget-title">${f.label}</h4>
          <div class="sidebar-filter-list">
            ${f.values.map(v => `
              <label class="filter-checkbox-label">
                <input type="checkbox" value="${v}" 
                       class="${f.label.toLowerCase() === 'brand' ? 'brand-filter' : 'generic-filter'}">
                <span class="checkbox-custom"></span><span class="filter-label-text">${v}</span>
              </label>
            `).join('')}
          </div>
        </div>`;
    }
    
    if (f.type === 'range') {
      const currentMax = StoreState.priceMax || f.max;
      return `
        <div class="sidebar-widget">
          <h4 class="sidebar-widget-title" style="display:flex; justify-content:space-between; width:100%;">
            <span>${f.label}</span>
            <span id="price-max-label" style="text-transform:none; font-weight:700">${f.unit || ''}${currentMax}</span>
          </h4>
          <input type="range" id="price-range" class="range-input" 
                 min="${f.min}" max="${f.max}" step="${f.step}" value="${currentMax}">
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--clr-text-3); margin-top:8px">
            <span>${f.unit || ''}${f.min}</span>
            <span>${f.unit || ''}${f.max}</span>
          </div>
        </div>`;
    }

    if (f.type === 'radio') {
      return `
        <div class="sidebar-widget">
          <h4 class="sidebar-widget-title">${f.label}</h4>
          <div class="sidebar-filter-list">
            ${f.values.map((v, i) => `
              <label class="filter-radio-label">
                <input type="radio" name="${f.id}" value="${v}" 
                       class="rating-filter">
                <span class="radio-custom"></span><span class="filter-label-text">${v}</span>
              </label>
            `).join('')}
          </div>
        </div>`;
    }

    return '';
  }).join('');

  // Append Reset button
  sidebar.innerHTML += `
    <div class="sidebar-widget" style="border-bottom:none; margin-bottom:0">
       <button class="btn btn-outline btn-sm" style="width:100%" onclick="resetFilters()">Reset All Filters</button>
    </div>
  `;

  // Attach Listeners
  sidebar.querySelectorAll('.cat-filter').forEach(cb => {
    cb.onchange = () => {
      const val = cb.value;
      if (cb.checked) StoreState.selectedCategories.push(val);
      else StoreState.selectedCategories = StoreState.selectedCategories.filter(c => c !== val);
      StoreState.page = 1;
      renderProducts();
    };
  });

  sidebar.querySelectorAll('.brand-filter').forEach(cb => {
    cb.onchange = () => {
      const val = cb.value;
      if (cb.checked) StoreState.selectedBrands.push(val);
      else StoreState.selectedBrands = StoreState.selectedBrands.filter(b => b !== val);
      StoreState.page = 1;
      renderProducts();
    };
  });

  const priceRange = sidebar.querySelector('#price-range');
  if (priceRange) {
    priceRange.oninput = (e) => {
      StoreState.priceMax = parseInt(e.target.value);
      const label = document.getElementById('price-max-label');
      if (label) label.textContent = formatCurrency(StoreState.priceMax);
      renderProducts();
    };
  }

  sidebar.querySelectorAll('.rating-filter').forEach(radio => {
    radio.onchange = () => {
      StoreState.minRating = parseInt(radio.value);
      StoreState.page = 1;
      renderProducts();
    };
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
  }
}

function closeAllModals() {
  // 1. Standard Modals
  document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  
  // 2. Drawers (Cart and Filter)
  document.querySelectorAll('.cart-drawer-overlay.open').forEach(el => {
    el.classList.remove('open');
  });

  // 3. Search Overlay
  document.getElementById('search-overlay')?.classList.remove('active');

  // Hide overlays after transition
  setTimeout(() => {
    document.querySelectorAll('.modal-overlay:not(.active), .cart-drawer-overlay:not(.open), .filter-drawer-overlay:not(.active)')
      .forEach(el => el.classList.add('hidden'));
  }, 350);

  // 4. Restore scroll
  document.body.style.overflow = '';
}

function openQuickView(productId) {
  const p = Store.getProducts().find(item => item.id === productId);
  if (!p) return;

  const content = document.getElementById('quick-view-content');
  if (!content) return;

  content.innerHTML = `
    <div class="quick-view-content">
      <div class="qv-gallery">
        <img src="${p.images[0]}" alt="${p.name}">
      </div>
      <div class="qv-info">
        <div class="text-sm text-muted" style="margin-bottom:8px">${p.category}</div>
        <h2 style="font-size:1.8rem; margin-bottom:15px">${p.name}</h2>
        <div class="product-rating" style="margin-bottom:20px">${getStarsHTML(p.rating)} (${p.rating})</div>
        <div class="product-price" style="font-size:1.5rem; font-weight:800; color:var(--clr-primary); margin-bottom:25px">${formatCurrency(p.price)}</div>
        <p style="font-size:0.9rem; color:var(--clr-text-2); margin-bottom:30px; line-height:1.6">${p.description}</p>
        <div style="display:flex; gap:15px">
          <button class="btn btn-primary btn-lg" style="flex:1" onclick="Cart.add('${p.id}'); closeAllModals();">Add to Curations</button>
          <button class="btn btn-outline btn-lg" onclick="window.location.href='product.html?id=${p.id}'">View Profile</button>
        </div>
      </div>
    </div>
  `;
  openModal('quick-view-modal');
}

function renderPagination(el, totalPages) {
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === StoreState.page ? 'active' : ''}" onclick="StoreState.page=${i};renderProducts();window.scrollTo(0,0)">${i}</button>`;
  }
  el.innerHTML = html;
}

// ── Filters & Search ─────────────────────────────────────────────────────────
function applyFilters() {
  let list = [...StoreState.products];
  const q = StoreState.searchQuery.toLowerCase();
  
  // 1. Category Filter (Multi-select)
  if (StoreState.selectedCategories.length > 0) {
    list = list.filter(p => StoreState.selectedCategories.includes(p.category));
  } else if (StoreState.currentCategory && StoreState.currentCategory !== 'All') {
    list = list.filter(p => p.category === StoreState.currentCategory);
    if (StoreState.currentSubCategory) {
      list = list.filter(p => p.subCategory === StoreState.currentSubCategory);
    }
  }

  // 2. Quick Filters (Deals, New)
  if (StoreState.currentFilter === 'deals') {
    list = list.filter(p => (p.discount || 0) > 0);
  } else if (StoreState.currentFilter === 'new') {
    list = list.filter(p => p.isNew === true);
  }

  // 3. Brand Filter (Multi-select)
  if (StoreState.selectedBrands.length > 0) {
    list = list.filter(p => StoreState.selectedBrands.includes(p.brand || p.sellerName || 'Other'));
  }

  // 4. Price Filter
  list = list.filter(p => p.price <= StoreState.priceMax);

  // 5. Rating Filter
  if (StoreState.minRating > 0) {
    list = list.filter(p => p.rating >= StoreState.minRating);
  }

  // 6. Search Filter
  if (q) {
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  // 7. Sorting
  if (StoreState.sortBy === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (StoreState.sortBy === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (StoreState.sortBy === 'newest') {
    list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  } else if (StoreState.sortBy === 'popular') {
    list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  }

  return list;
}

function resetFilters() {
  const max = getMaxPrice();
  StoreState.searchQuery = ''; 
  StoreState.currentCategory = 'All'; 
  StoreState.selectedCategories = [];
  StoreState.selectedBrands = [];
  StoreState.currentFilter = null; 
  StoreState.priceMax = max; 
  StoreState.minRating = 0;
  StoreState.inStockOnly = false;
  
  const navSearch = document.getElementById('nav-search-input');
  if (navSearch) navSearch.value = '';
  
  renderSidebarFilters();
  renderProducts();
}

function updateShopHeaders() {
  const shopTitle = document.getElementById('shop-title');
  const shopDesc = document.getElementById('shop-desc');
  const shopBrow = document.getElementById('shop-eyebrow');
  
  if (!shopTitle) return; // Not on the shop page header section

  if (StoreState.currentFilter === 'deals') {
    shopBrow.textContent = 'Limited Time Offers';
    shopTitle.textContent = "Flash Deals";
    shopDesc.textContent = "Discover our exclusive timed discounts on premium products. Act fast before these offers expire.";
  } else if (StoreState.currentFilter === 'new') {
    shopBrow.textContent = 'Just Arrived';
    shopTitle.textContent = "New Arrivals";
    shopDesc.textContent = "Be the first to explore the latest additions to the Arvaan collection. Fresh, premium, and meticulously sourced.";
  } else if (StoreState.currentCategory !== 'All') {
    shopBrow.textContent = 'Curated Collection';
    shopTitle.textContent = StoreState.currentCategory;
    shopDesc.textContent = `Explore our hand-picked selection of premium ${StoreState.currentCategory.toLowerCase()} perfectly curated for an elevated lifestyle.`;
  } else if (StoreState.searchQuery) {
    shopBrow.textContent = 'Search Results';
    shopTitle.textContent = `Results for "${StoreState.searchQuery}"`;
    shopDesc.textContent = "Browse the perfect matches we found in our catalog based on your search refinement.";
  } else {
    shopBrow.textContent = 'Inventory of Excellence';
    shopTitle.textContent = "The Master Collection";
    shopDesc.textContent = "Explore our fully curated catalog of artisanal tech, high-fashion, and modern masterpieces.";
  }
}


// ── Live Search Logic (NEW) ──
function initLiveSearch() {
  const trigger = document.getElementById('nav-search-box-trigger');
  const overlay = document.getElementById('search-overlay');
  const overlayInput = document.getElementById('overlay-search-input');
  const closeBtn = document.querySelector('.search-overlay-close');

  if (!trigger || !overlay) {
    // Fallback for pages without overlay
    initStandardSearch();
    return;
  }

  trigger.onclick = () => {
    overlay.classList.add('active');
    setTimeout(() => overlayInput.focus(), 100);
  };

  if (closeBtn) closeBtn.onclick = () => overlay.classList.remove('active');
  
  // Shortcut Ctrl + K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.add('active');
      overlayInput.focus();
    }
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
    }
  });

  overlayInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const resultsGrid = document.getElementById('overlay-search-results');
    if (!resultsGrid) return;

    if (q.length < 2) {
      resultsGrid.innerHTML = '';
      return;
    }

    const matches = Store.getProducts()
      .filter(p => (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)))
      .slice(0, 8);

    if (matches.length > 0) {
      resultsGrid.innerHTML = matches.map(p => `
        <div class="product-card" onclick="openProductDetail('${p.id}')" style="cursor:pointer; background:var(--clr-bg-3); border:1px solid var(--clr-border); padding:10px; border-radius:12px">
          <img src="${p.images[0]}" style="width:100%; aspect-ratio:1; object-fit:cover; border-radius:8px">
          <div style="padding:10px 0">
            <div style="font-weight:700; font-size:0.85rem; color:var(--clr-text)">${escapeHtml(p.name)}</div>
            <div style="font-size:0.75rem; color:var(--clr-primary-light)">${formatCurrency(p.price)}</div>
          </div>
        </div>
      `).join('');
    } else {
      resultsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--clr-text-3)">No masterpieces found</div>';
    }
  });
}

function initStandardSearch() {
  const input = document.getElementById('nav-search-input');
  const dropdown = document.getElementById('search-results-dropdown');
  if (!input) return;

  input.addEventListener('input', (e) => {
    if (!dropdown) return;
    const q = e.target.value.trim().toLowerCase();
    if (q.length < 2) {
      dropdown.classList.add('hidden');
      return;
    }

    const matches = Store.getProducts()
      .filter(p => (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)))
      .slice(0, 6);

    if (matches.length > 0) {
      dropdown.innerHTML = matches.map(p => `
        <div class="search-result-item" onclick="openProductDetail('${p.id}');">
          <img src="${p.images[0]}" style="width:40px;height:40px;object-fit:cover;border-radius:4px">
          <div><div style="font-weight:700;font-size:0.85rem">${escapeHtml(p.name)}</div><div style="font-size:0.75rem;color:var(--clr-primary-light)">${formatCurrency(p.price)}</div></div>
        </div>
      `).join('');
      dropdown.classList.remove('hidden');
    }
  });
}

function quickSearch(cat) {
  const overlayInput = document.getElementById('overlay-search-input');
  if (overlayInput) {
    overlayInput.value = cat;
    overlayInput.dispatchEvent(new Event('input'));
  }
}

// ── Product Detail ───────────────────────────────────────────────────────────
function openProductDetail(productId) {
  // Navigate to dedicated product page
  window.location.href = `product.html?id=${productId}`;
}

function initProductPage(p) {
  if (!p) return;
  StoreState.currentProduct = p;
  StoreState.selectedVariant = (p.variants && p.variants.length > 0) ? p.variants[0] : null;

  // Breadcrumbs & Basic Info
  const breadName = document.getElementById('bread-name');
  if (breadName) breadName.textContent = p.name;
  const breadCat = document.getElementById('bread-category');
  if (breadCat) breadCat.textContent = p.category;

  const detailName = document.getElementById('detail-name');
  if (detailName) detailName.textContent = p.name;
  const detailCat = document.getElementById('detail-category');
  if (detailCat) detailCat.textContent = p.category;

  // Narrative & Description
  const detailDesc = document.getElementById('detail-description');
  if (detailDesc) detailDesc.textContent = (p.description || '').split('.')[0] + '.';
  
  const narrativeBox = document.getElementById('detail-narrative');
  const narrativeText = document.getElementById('detail-narrative-text');
  if (narrativeBox && narrativeText && p.description && p.description.length > 100) {
    narrativeText.textContent = p.description;
    narrativeBox.classList.remove('hidden');
  }

  // Editorial Highlights
  const highlightsEl = document.getElementById('detail-highlights');
  if (highlightsEl) {
    const highlights = p.tags || [];
    highlightsEl.innerHTML = highlights.map(h => `<li class="editorial-item">${h}</li>`).join('');
  }

  // Variants Rendering
  renderVariantSelectors(p);

  // Gallery
  const mainImg = document.getElementById('detail-gallery-main');
  if (mainImg) mainImg.src = p.images[0];
  const thumbs = document.getElementById('detail-gallery-thumbs');
  if (thumbs) {
    thumbs.innerHTML = p.images.map((img, i) => `
      <img class="gallery-thumb ${i === 0 ? 'active' : ''}" src="${img}" onclick="updateProductGallery(this, '${img}')">
    `).join('');
  }

  updateDetailPriceAndStock(p);
  injectProductSchema(p);

  const ratingEl = document.getElementById('detail-rating');
  if (ratingEl) {
    ratingEl.innerHTML = `
      <div style="font-size:1.1rem">${getStarsHTML(p.rating)}</div>
      <div style="font-size:0.85rem; color:var(--clr-text-3); font-weight:600">(${p.rating} / 5.0) · ${p.reviewsCount || '12'}+ Patrons</div>
    `;
  }

  // Specifications
  const specs = document.getElementById('detail-specs');
  if (specs) {
    specs.innerHTML = Object.entries(p.specifications || {}).map(([k, v]) => `
      <div style="background:var(--clr-bg-3); padding:16px; border-radius:var(--radius-md); border:1px solid var(--clr-border)">
        <div style="font-size:0.7rem; color:var(--clr-text-3); text-transform:uppercase; font-weight:800; margin-bottom:4px">${k}</div>
        <div style="font-weight:700; color:var(--clr-text-1)">${v}</div>
      </div>
    `).join('');
  }

  // Return & Exchange Policy badges (from AdminStore category config)
  const policyEl = document.getElementById('detail-return-policy');
  if (policyEl && typeof AdminStore !== 'undefined') {
    try {
      const cats = AdminStore.getCategories();
      const cat = cats.find(c => c.slug === p.category || c.name === p.category);
      const pol = cat?.policy;
      if (pol) {
        const REFUND_MAP = { original:'Via original payment', store_credit:'Store credit/wallet', bank:'Bank transfer', both:'Original or store credit' };
        const COND_MAP = { unused:'Unused & sealed', original_packaging:'Original packaging', undamaged:'Undamaged', any:'Any condition' };
        let badges = [];
        if (pol.returnType === 'non_returnable') {
          badges.push(`<span class="policy-badge" style="background:#fee2e2;color:#dc2626;border-color:#fca5a5;">🚫 Non-Returnable${pol.nonReturnReason ? ' · ' + pol.nonReturnReason : ''}</span>`);
        } else if (pol.returnType === 'exchange') {
          badges.push(`<span class="policy-badge" style="background:#fef3c7;color:#92400e;border-color:#fde68a;">🔁 ${pol.returnWindow}-Day Exchange</span>`);
          if (pol.freePickup) badges.push(`<span class="policy-badge">🚚 Free pickup</span>`);
        } else {
          badges.push(`<span class="policy-badge" style="background:#d1fae5;color:#065f46;border-color:#6ee7b7;">↩️ ${pol.returnWindow}-Day Returns</span>`);
          if (pol.freePickup) badges.push(`<span class="policy-badge">🚚 Free pickup</span>`);
          if (pol.replacement) badges.push(`<span class="policy-badge">✅ Free replacement</span>`);
        }
        if (pol.warrantyClaim) badges.push(`<span class="policy-badge">🛡️ Warranty support</span>`);
        if (pol.refundMethod) badges.push(`<span class="policy-badge">💳 ${REFUND_MAP[pol.refundMethod] || ''}</span>`);
        if (pol.returnCondition && pol.returnType !== 'non_returnable') badges.push(`<span class="policy-badge">📦 ${COND_MAP[pol.returnCondition] || ''}</span>`);
        if (pol.qualityCheck) badges.push(`<span class="policy-badge">🔍 Quality check required</span>`);
        policyEl.innerHTML = badges.join('');
        policyEl.closest?.('[id="detail-policy-section"]')?.classList.remove('hidden');
      } else {
        policyEl.innerHTML = '<span class="policy-badge">ℹ️ Contact seller for return details</span>';
      }
    } catch(e) { /* silent fail */ }
  }

  // Interaction Bindings
  const addCartBtn = document.getElementById('detail-add-cart');
  if (addCartBtn) addCartBtn.onclick = () => {
    const qty = parseInt(document.getElementById('detail-qty')?.value || '1');
    Cart.add(p.id, qty, StoreState.selectedVariant);
  };

  const buyNowBtn = document.getElementById('detail-buy-now');
  if (buyNowBtn) buyNowBtn.onclick = () => {
    const qty = parseInt(document.getElementById('detail-qty')?.value || '1');
    Cart.add(p.id, qty, StoreState.selectedVariant);
    window.location.href = 'checkout.html';
  };

  const wishBtn = document.getElementById('detail-wish-btn');
  if (wishBtn) {
    const updateWishUI = () => { wishBtn.textContent = WishlistMgr.has(p.id) ? '❤️' : '🤍'; };
    updateWishUI();
    wishBtn.onclick = () => { WishlistMgr.toggle(p.id); updateWishUI(); };
  }

  // Sticky Box
  const stickyName = document.getElementById('sticky-name');
  if (stickyName) stickyName.textContent = p.name;
  const stickyPrice = document.getElementById('sticky-price');
  if (stickyPrice) stickyPrice.textContent = formatCurrency(p.price);
  const stickyImg = document.getElementById('sticky-img');
  if (stickyImg) stickyImg.src = p.images[0];
  const stickyAdd = document.getElementById('sticky-add-btn');
  if (stickyAdd) stickyAdd.onclick = () => Cart.add(p.id, 1, StoreState.selectedVariant);

  // Tab Switching
  document.querySelectorAll('.detail-tab-btn').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.detailTab;
      document.querySelectorAll('.detail-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(pnl => pnl.classList.toggle('hidden', pnl.id !== `detail-${tab}-panel`));
      document.querySelectorAll('.tab-panel').forEach(pnl => pnl.classList.toggle('active', pnl.id === `detail-${tab}-panel`));
    };
  });

  // Cross-sells
  renderProductReviews(p.id);
  renderRelatedProducts(p.id);
  renderFrequentlyBoughtTogether(p.id);
}

function renderVariantSelectors(p) {
  const container = document.getElementById('detail-variants');
  if (!container || !p.variants || p.variants.length === 0) return;

  // Simple grouping: if a name contains '/', assume Color / Size format
  const groups = { 'Options': p.variants };
  
  container.innerHTML = Object.entries(groups).map(([label, opts]) => `
    <div class="variant-group">
      <div class="variant-group-label">${label}</div>
      <div class="variant-options">
        ${opts.map(v => `
          <div class="variant-box ${StoreState.selectedVariant?.name === v.name ? 'active' : ''} ${v.stock === 0 ? 'disabled' : ''}" 
               onclick="selectProductVariant('${p.id}', '${v.name}')">
            ${v.name}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function selectProductVariant(pid, variantName) {
  const p = StoreState.currentProduct;
  if (!p || p.id !== pid) return;
  
  const v = p.variants.find(varnt => varnt.name === variantName);
  if (!v || v.stock === 0) return;
  
  StoreState.selectedVariant = v;
  renderVariantSelectors(p);
  updateDetailPriceAndStock(p);
}

function updateDetailPriceAndStock(p) {
  const activeVar = StoreState.selectedVariant;
  const price = activeVar ? activeVar.price : p.price;
  const stock = activeVar ? activeVar.stock : p.stock;
  const originalPrice = p.originalPrice;

  // Update Price
  const priceEl = document.getElementById('detail-price');
  if (priceEl) {
    const origHtml = originalPrice ? `<span class="product-price-original" style="text-decoration:line-through;color:var(--clr-text-3);font-size:1.1rem;margin-left:12px;vertical-align:middle">${formatCurrency(originalPrice)}</span>` : '';
    priceEl.innerHTML = `${formatCurrency(price)}${origHtml}`;
  }

  // Update Stock
  const stockEl = document.getElementById('detail-stock');
  if (stockEl) {
    if (stock > 0) {
      stockEl.innerHTML = `<span style="color:var(--clr-success); font-weight:700">● In Vault</span> · ${stock} units available`;
    } else {
      stockEl.innerHTML = `<span style="color:var(--clr-danger); font-weight:700">● Reserved</span> · Out of stock`;
    }
  }

  // Update Sticky Box
  const stickyPrice = document.getElementById('sticky-price');
  if (stickyPrice) stickyPrice.textContent = formatCurrency(price);
}

function injectProductSchema(p) {
  const existing = document.getElementById('product-schema');
  if (existing) existing.remove();
  
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": p.name,
    "image": p.images,
    "description": p.description,
    "brand": { "@type": "Brand", "name": "Arvaan Collective" },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "USD",
      "price": p.price,
      "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": p.rating,
      "reviewCount": p.reviewsCount || 12
    }
  };

  const script = document.createElement('script');
  script.id = 'product-schema';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}


function updateProductGallery(thumb, src) {
  const main = document.getElementById('detail-gallery-main');
  if (main) main.src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.toggle('active', t === thumb));
}

function renderFrequentlyBoughtTogether(id) {
  const products = Store.getProducts();
  const current = products.find(p => p.id === id);
  // Simple heuristic: products in different but related categories
  const relatedCats = {
    'Electronics': ['Home'],
    'Beauty': ['Fashion'],
    'Home': ['Electronics', 'Kitchen'],
    'Kitchen': ['Home']
  };
  const targetCats = relatedCats[current.category] || [];
  const boughtTogether = products
    .filter(p => targetCats.includes(p.category) && p.id !== id && p.isActive !== false)
    .slice(0, 2);
    
  const grid = document.getElementById('frequently-bought-grid');
  if (grid) {
    if (boughtTogether.length > 0) {
      grid.innerHTML = boughtTogether.map(p => renderProductCard(p)).join('');
      addProductCardListeners();
    } else {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--clr-text-3);padding:20px">Personalized recommendations arriving soon...</div>';
    }
  }
}

function renderRelatedProducts(id) {
  const products = Store.getProducts();
  const current = products.find(p => p.id === id);
  const related = products.filter(p => p.category === current.category && p.id !== id).slice(0, 4);
  const grid = document.getElementById('related-products-grid');
  if (grid) { grid.innerHTML = related.map(p => renderProductCard(p)).join(''); addProductCardListeners(); }
}

function renderProductReviews(id) {
  const reviews = Store.getReviews().filter(r => r.productId === id);
  const list = document.getElementById('detail-reviews-list');
  if (list) list.innerHTML = reviews.map(r => `<div style="padding:15px 0;border-bottom:1px solid var(--clr-border)"><strong>${r.userName}</strong> (${r.rating}⭐)<p>${r.comment}</p></div>`).join('');
}

// ── Main UI Callbacks ──────────────────────────────────────────────────────────


// ── Cart UI ───────────────────────────────────────────────────────────────────
function updateCartUI() {
  const cart = Cart.get();
  const count = Cart.count();

  // Update badge
  const countEl = UI.get('cart-count');
  if (countEl) { countEl.textContent = count > 0 ? count : ''; countEl.classList.toggle('hidden', count === 0); }
  const countDrawerEl = UI.get('cart-count-drawer');
  if (countDrawerEl) countDrawerEl.textContent = count;

  // Free shipping progress bar
  const subtotal = Cart.subtotal();
  const freeShippingThreshold = 999;
  const progress = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remaining = Math.max(freeShippingThreshold - subtotal, 0);
  const progressHTML = `
    <div class="shipping-progress-container">
      <div style="display:flex;justify-content:space-between;font-size:0.75rem;font-weight:700;margin-bottom:8px">
        <span style="color:${progress >= 100 ? '#1A7D3C' : '#555'}">${progress >= 100 ? '✓ Free Shipping Unlocked!' : `Add ${formatCurrency(remaining)} more for free shipping`}</span>
        <span>${Math.round(progress)}%</span>
      </div>
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
    </div>`;
  UI.safeHTML('cart-shipping-progress', progressHTML);

  // Cart items
  const itemsEl = UI.get('cart-items');
  if (itemsEl) {
    if (cart.length === 0) {
      itemsEl.innerHTML = `<div style="padding:60px 20px;text-align:center;color:var(--clr-text-3)"><div style="font-size:3rem;margin-bottom:16px">🛒</div><h4 style="font-weight:700;margin-bottom:8px;color:var(--clr-text)">Your cart is empty</h4><p style="font-size:0.875rem">Discover amazing products in our store!</p><a href="shop.html" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#000;color:#fff;border-radius:8px;font-weight:700;font-size:0.85rem">Browse Products</a></div>`;
    } else {
      itemsEl.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img class="cart-item-img" src="${item.image}" alt="${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${formatCurrency(item.price)}</div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
              <button onclick="Cart.updateQty('${item.id}', ${item.qty - 1})" style="width:26px;height:26px;border:1px solid var(--clr-border);background:#fff;border-radius:4px;font-weight:700;cursor:pointer">−</button>
              <span style="font-size:0.875rem;font-weight:600;min-width:20px;text-align:center">${item.qty}</span>
              <button onclick="Cart.updateQty('${item.id}', ${item.qty + 1})" style="width:26px;height:26px;border:1px solid var(--clr-border);background:#fff;border-radius:4px;font-weight:700;cursor:pointer">+</button>
              <span style="font-size:0.8rem;color:var(--clr-text-3);margin-left:4px">${formatCurrency(item.price * item.qty)}</span>
            </div>
          </div>
          <button class="cart-item-remove" onclick="Cart.remove('${item.cartId}')">✕</button>
        </div>`).join('');
    }
  }

  // Subtotal, shipping, total
  UI.safeHTML('cart-subtotal', formatCurrency(subtotal));
  const shippingLabel = UI.get('cart-shipping-label');
  if (shippingLabel) shippingLabel.textContent = Cart.shipping() === 0 ? 'Free' : formatCurrency(Cart.shipping());
  const totalEl = UI.get('cart-total');
  if (totalEl) totalEl.textContent = formatCurrency(Cart.total());
}

// ── Checkout Logic ────────────────────────────────────────────────────────────
function renderCheckoutStep() {
  const step = StoreState.checkoutStep || 1;
  const panelPrefix = UI.get('panel-1') ? 'panel-' : 'checkout-panel-';
  
  // Update Panels
  for (let i = 1; i <= 4; i++) {
    const p = UI.get(`${panelPrefix}${i}`);
    if (p) p.classList.toggle('active', i === step);
  }

  // Update Step Labels/Indicators if they exist
  const stepLabels = UI.all('.checkout-step-item');
  if (stepLabels.length > 0) {
    stepLabels.forEach((lbl, idx) => {
      const i = idx + 1;
      lbl.classList.toggle('active', i === step);
      lbl.classList.toggle('done', i < step);
      const num = lbl.querySelector('.step-num');
      if (num) num.textContent = i < step ? '✓' : i;
    });
  }

  // Update Summary if on checkout page
  if (typeof updateSummary === 'function') {
    updateSummary();
  } else {
    // Fallback simple summary rendering
    const summary = UI.get('order-summary-items') || UI.get('summary-items');
    if (summary) {
      let itemsHtml = Cart.get().map(i => `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>${i.name} x ${i.qty}</span><span>${formatCurrency(i.price * i.qty)}</span></div>`).join('');
      if (StoreState.isGiftWrapped) {
        itemsHtml += `<div style="display:flex;justify-content:space-between;margin-bottom:8px;color:var(--clr-primary)"><span>🎁 Premium Gift Wrapping</span><span>${formatCurrency(5)}</span></div>`;
      }
      summary.innerHTML = itemsHtml + `<div style="border-top:1px solid var(--clr-border);margin-top:10px;padding-top:10px;display:flex;justify-content:space-between;font-weight:800"><span>Total</span><span>${formatCurrency(Cart.total())}</span></div>`;
    }
  }

  if (step === 3 && typeof renderReview === 'function') {
    renderReview();
  }
}

function openCheckout() {
  if (Cart.count() === 0) {
    showToast('Cart Empty', 'Please add items to curate your collection.', 'info');
    return;
  }
  const isGuest = !window.Auth || !window.Auth.isLoggedInBuyer();
  if (isGuest) {
    // Flag so auth.js can redirect after login
    sessionStorage.setItem('arvaan_checkout_intent', '1');
    closeAllModals();
    setTimeout(() => {
      openModal('auth-modal');
      showToast('Login Required', 'Please sign in to proceed to checkout.', 'info');
    }, 300);
    return;
  }
  window.location.href = 'checkout.html';
}

function placeOrder() {
  const orders = Store.getOrders();
  const user = Auth.getBuyer();
  const cartItems = Cart.get();
  if (cartItems.length === 0) return;

  const products = Store.getProducts();
  const firstProd = products.find(p => p.id === cartItems[0].id);
  const sellerId = firstProd ? firstProd.seller : 'seller1';

  const newOrder = {
    id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
    userId: user.id,
    sellerId: sellerId,
    subtotal: Cart.subtotal(),
    shipping: Cart.shipping(),
    tax: Cart.tax(),
    giftWrapFee: Cart.giftWrapFee(),
    total: Cart.total(),
    status: 'pending',
    date: new Date().toISOString().slice(0, 10),
    items: cartItems,
    address: document.getElementById('addr-line1').value || 'Store Address',
    paymentMethod: 'Card',
    isGiftWrapped: StoreState.isGiftWrapped,
    orderNotes: document.getElementById('order-notes').value.trim()
  };
  orders.push(newOrder); 
  Store.setOrders(orders);
  Cart.clear(); 
  StoreState.checkoutStep = 4; 
  renderCheckoutStep();
  showToast('Order Placed!', 'Your curation is on its way.', 'success');
}

// ── Account UI ────────────────────────────────────────────────────────────────
function openAccountDashboard(tab = 'profile') {
  // Navigate to dedicated account page
  const dest = tab === 'orders' ? 'orders.html' : tab === 'wishlist' ? 'wishlist.html' : 'account.html';
  window.location.href = dest;
}

function switchAccountTab(tab) {
  document.querySelectorAll('.account-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.accountTab === tab));
  document.querySelectorAll('.account-panel').forEach(p => p.classList.toggle('hidden', p.id !== `account-${tab}`));
}

// ── Address Book Logic (NEW) ──
function getAddresses() {
  const user = Auth.getBuyer();
  if (!user) return [];
  return JSON.parse(localStorage.getItem(`arvaan_addresses_${user.id}`) || '[]');
}

function setAddresses(addresses) {
  const user = Auth.getBuyer();
  if (!user) return;
  localStorage.setItem(`arvaan_addresses_${user.id}`, JSON.stringify(addresses));
}

function renderAccountAddresses() {
  const addresses = getAddresses();
  const container = document.getElementById('address-list');
  if (!container) return;

  if (addresses.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--clr-text-3)">No saved addresses.</div>';
    return;
  }

  container.innerHTML = addresses.map(addr => `
    <div class="card" style="margin-bottom:10px;padding:15px;display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.02)">
      <div>
        <div style="font-weight:700">${escapeHtml(addr.name)}</div>
        <div style="font-size:0.85rem;color:var(--clr-text-2)">${escapeHtml(addr.line1)}, ${escapeHtml(addr.city)} ${escapeHtml(addr.zip)}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="removeAddress('${addr.id}')">🗑️</button>
    </div>
  `).join('');
}

function openAddressModal() {
  const name = prompt("Full Name:");
  if (!name) return;
  const line1 = prompt("Address Line 1:");
  if (!line1) return;
  const city = prompt("City:");
  if (!city) return;
  const zip = prompt("Zip Code:");
  if (!zip) return;
  
  const addresses = getAddresses();
  addresses.push({ id: genId('addr'), name, line1, city, zip });
  setAddresses(addresses);
  renderAccountAddresses();
  showToast('Success', 'Address added to your book.', 'success');
}

function removeAddress(id) {
  if (!confirm('Remove this address?')) return;
  const addresses = getAddresses().filter(a => a.id !== id);
  setAddresses(addresses);
  renderAccountAddresses();
}

function renderCheckoutAddresses() {
  const addresses = getAddresses();
  const selector = document.getElementById('saved-addresses-selector');
  const container = document.getElementById('checkout-address-list');
  if (!container || !selector) return;

  if (addresses.length > 0) {
    selector.style.display = 'block';
    container.innerHTML = addresses.map(addr => `
      <div class="address-chip ${StoreState.selectedAddressId === addr.id ? 'active' : ''}" 
           style="padding:10px;border:1px solid var(--clr-border);border-radius:6px;cursor:pointer;min-width:120px;text-align:center;background:rgba(255,255,255,0.03)"
           onclick="selectCheckoutAddress('${addr.id}')">
        <div style="font-weight:700;font-size:0.75rem">${escapeHtml(addr.name)}</div>
        <div style="font-size:0.65rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100px">${escapeHtml(addr.line1)}</div>
      </div>
    `).join('');
  } else {
    selector.style.display = 'none';
  }
}

function selectCheckoutAddress(id) {
  const addresses = getAddresses();
  const addr = addresses.find(a => a.id === id);
  if (!addr) return;

  StoreState.selectedAddressId = id;
  document.getElementById('addr-name').value = addr.name;
  document.getElementById('addr-line1').value = addr.line1;
  document.getElementById('addr-city').value = addr.city;
  document.getElementById('addr-zip').value = addr.zip;
  
  renderCheckoutAddresses();
}

function renderAccountProfile() {
  const user = Auth.getBuyer(); 
  if (!user) return;
  document.getElementById('prof-name').value = user.name;
  document.getElementById('prof-email').value = user.email;
  const points = (user && Store.getUserPoints) ? Store.getUserPoints(user.id) : 0;
  if (document.getElementById('account-points-balance')) {
    document.getElementById('account-points-balance').textContent = points.toLocaleString();
  }
}

function renderAccountOrders() {
  const user = Auth.getBuyer();
  const orders = Store.getOrders().filter(o => o.userId === user.id);
  const container = document.getElementById('order-history-list');
  if (container) {
    if (orders.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--clr-text-3)"><h3>No orders yet</h3><p>Begin your collection today.</p></div>';
      return;
    }
    container.innerHTML = orders.map(o => `
      <div class="card" style="margin-bottom:15px;padding:15px">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <div>
            <strong>Order ${o.id}</strong>
            <div style="font-size:0.8rem;color:var(--clr-text-3)">${o.date}</div>
          </div>
          <span class="badge badge-primary">${o.status.toUpperCase()}</span>
        </div>
        ${renderOrderTimeline(o.status)}
        ${o.trackingId ? `
          <div style="margin-top:15px; padding:10px; background:rgba(255,255,255,0.03); border-radius:4px; border:1px solid var(--clr-border)">
            <div style="font-size:0.75rem; color:var(--clr-text-3); text-transform:uppercase">Tracking Information</div>
            <div style="display:flex; justify-content:space-between; margin-top:4px">
              <span style="font-weight:700; color:var(--clr-primary-light)">${o.carrier}</span>
              <span style="font-family:monospace">${o.trackingId}</span>
            </div>
          </div>
        ` : ''}
        <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center">
          <span>${formatCurrency(o.total)}</span>
          <button class="btn btn-ghost btn-sm">Details →</button>
        </div>
      </div>`).join('');
  }
}

function renderOrderTimeline(status) {
  const stages = ['pending', 'processing', 'ready_to_ship', 'shipped', 'delivered'];
  const idx = stages.indexOf(status.toLowerCase());
  return `<div style="display:flex;gap:4px;margin-top:8px">${stages.map((s, i) => `<div style="flex:1;height:4px;background:${i <= idx ? 'var(--clr-primary)' : 'var(--clr-border)'};border-radius:2px" title="${s.replace(/_/g,' ')}"></div>`).join('')}</div>`;
}

/**
 * --- Global Configuration Bridge ---
 * Applies settings from Admin Panel to the storefront
 */
function applyGlobalConfig() {
  if (typeof AdminStore === 'undefined') return;
  const cfg = AdminStore.getSiteConfig();
  if (!cfg) return;

  console.log('[Store] Applying Global Admin Configuration:', cfg.siteName);

  // 1. Core Identity & SEO
  if (cfg.siteName) {
    const brands = document.querySelectorAll('.navbar-brand span, .footer-brand span');
    brands.forEach(b => b.textContent = cfg.siteName);
  }
  
  if (cfg.seo && cfg.seo.metaDescription) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', cfg.seo.metaDescription);
  }

  // 2. Theme Engine (Colors & Typography)
  const root = document.documentElement;
  if (cfg.primaryColor) root.style.setProperty('--clr-primary', cfg.primaryColor);
  if (cfg.accentColor)  root.style.setProperty('--clr-accent',  cfg.accentColor);
  
  if (cfg.appearance) {
    const hFont = cfg.appearance.headingFont || "'Playfair Display', serif";
    const bFont = cfg.appearance.bodyFont || "'Inter', sans-serif";
    
    root.style.setProperty('--font-heading', hFont);
    root.style.setProperty('--font-body',    bFont);
    
    // Load Fonts from Google
    const fontNames = [hFont, bFont].map(f => f.split(',')[0].replace(/'/g, '').replace(/ /g, '+'));
    const fontSet = [...new Set(fontNames)];
    const fontLink = `https://fonts.googleapis.com/css2?family=${fontSet.join('&family=')}:wght@300;400;500;600;700&display=swap`;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontLink;
    document.head.appendChild(link);
  }

  // 3. Maintenance Mode
  if (cfg.maintenanceMode) {
     const session = AdminStore.getSession();
     if (!session || !session.isLoggedIn) {
       document.body.innerHTML = `
         <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-family:var(--font-body); background:var(--clr-bg-alt);">
           <div style="font-size:4rem; margin-bottom:20px;">🏗️</div>
           <h1 style="font-family:var(--font-heading); font-size:2.5rem; margin-bottom:10px;">${cfg.siteName || 'Arvaan Collective'}</h1>
           <p style="color:var(--clr-text-2); max-width:500px; line-height:1.6;">We are currently performing scheduled maintenance to improve your shopping experience. Please check back shortly.</p>
           <div style="margin-top:30px; font-size:0.85rem; color:var(--clr-text-3);">${cfg.contact ? cfg.contact.email : ''}</div>
         </div>
       `;
       return;
     }
  }

  // 4. Announcement Bar
  const announce = document.getElementById('announce-bar');
  if (announce) {
    if (cfg.announcement && cfg.announcement.active) {
      announce.style.display = 'flex';
      const text = announce.querySelector('.announce-item');
      if (text) text.textContent = cfg.announcement.text;
    } else {
      announce.style.display = 'none';
      root.style.setProperty('--space-10', '0px'); 
      const main = document.querySelector('.store-main');
      if (main) main.style.paddingTop = '100px';
    }
  }

  // 5. Identity & Logo (Co-Branding)
  const brandingElements = document.querySelectorAll('.navbar-brand, .footer-brand');
  if (brandingElements.length > 0) {
    const siteName  = cfg.siteName || 'Arvaan Collective';
    const logoHeight = cfg.appearance?.logoHeight || 28;
    const logoUrl   = cfg.appearance?.logoUrl || '';
    const isTinted  = cfg.appearance?.tintLogo === true;
    const primaryColor = cfg.primaryColor || '#0A0A0A';

    const _applyBranding = (finalLogoUrl) => {
      brandingElements.forEach(el => {
        el.innerHTML = '';
        if (finalLogoUrl) {
          const img = document.createElement('img');
          img.src = finalLogoUrl;
          img.alt = siteName;
          img.className = 'nav-logo';
          img.style.height = logoHeight + 'px';
          img.style.width = 'auto';
          img.style.verticalAlign = 'middle';
          img.style.marginRight = '10px';
          el.appendChild(img);
        }
        const nameSpan = document.createElement('span');
        nameSpan.style.verticalAlign = 'middle';
        nameSpan.textContent = siteName;
        el.appendChild(nameSpan);
      });
    };

    if (logoUrl && isTinted) {
      // Canvas-based tinting: works only on logos with transparent backgrounds (PNG/SVG)
      const tempImg = new Image();
      tempImg.onload = function() {
        try {
          const ratio = Math.max(0.1, (tempImg.naturalWidth || 1) / (tempImg.naturalHeight || 1));
          const h = Math.max(2, logoHeight * 2); // 2× for retina
          const w = Math.max(2, Math.round(h * ratio));

          // --- Transparency check ---
          // Draw original image to a temp canvas to inspect its alpha channel
          const checkCanvas = document.createElement('canvas');
          checkCanvas.width  = w;
          checkCanvas.height = h;
          const checkCtx = checkCanvas.getContext('2d');
          checkCtx.drawImage(tempImg, 0, 0, w, h);
          const pixels = checkCtx.getImageData(0, 0, w, h).data;
          let hasTransparency = false;
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 250) { hasTransparency = true; break; }
          }

          if (!hasTransparency) {
            // Solid logo (JPEG / opaque PNG) — tinting would produce a color block; show original
            console.info('[Logo Tinting] Logo has no transparency — showing original.');
            _applyBranding(logoUrl);
            return;
          }

          // --- Apply tinting ---
          const canvas = document.createElement('canvas');
          canvas.width  = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');

          // 1. Fill with the primary theme color
          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, 0, w, h);

          // 2. destination-in: keeps color only where logo pixels are opaque
          ctx.globalCompositeOperation = 'destination-in';
          ctx.drawImage(tempImg, 0, 0, w, h);

          _applyBranding(canvas.toDataURL('image/png'));
        } catch (e) {
          console.warn('[Logo Tinting] Canvas error, using original:', e);
          _applyBranding(logoUrl);
        }
      };
      tempImg.onerror = () => _applyBranding(logoUrl);
      tempImg.src = logoUrl;
    } else {
      _applyBranding(logoUrl);
    }
  }

  // 6. Favicon Handling
  if (cfg.appearance && cfg.appearance.faviconUrl) {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.head.appendChild(link);
    }
    link.href = cfg.appearance.faviconUrl;
  }

  // 7. Custom Scripts & CSS
  if (cfg.scripts) {
    if (cfg.scripts.customCss) {
      let style = document.getElementById('admin-custom-css');
      if (!style) {
        style = document.createElement('style');
        style.id = 'admin-custom-css';
        document.head.appendChild(style);
      }
      style.textContent = cfg.scripts.customCss;
    }
  }
}

// ── Initialization ────────────────────────────────────────────────────────────
function initStoreContent() {
  const path = window.location.pathname.toLowerCase();
  
  // Apply Global Admin Configuration first
  applyGlobalConfig();
  
  initAOS();
  updateGlobalLocalizations();
  initLiveSearch();
  updateCartUI();
  highlightActiveNavLinks();

  if (path.includes('product.html')) {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('id');
    const p = Store.getProducts().find(x => x.id === pid);
    if (p) initProductPage(p);
  } else if (path.includes('checkout.html')) {
    if (typeof renderCheckoutStep === 'function') renderCheckoutStep();
  } else if (path.includes('account.html')) {
    if (typeof renderAccountProfile === 'function') renderAccountProfile();
  } else if (path.includes('shop.html') || path.includes('electronics.html') || path.includes('fashion.html')) {
    initShopPage();
  } else if (path.includes('categories.html')) {
    initCategoriesPage();
  } else if (document.getElementById('dynamic-page-content')) {
    initDynamicPage();
  } else {
    initHomePage();
  }
}

function initDynamicPage() {
  const path = window.location.pathname.toLowerCase();
  const filename = path.split('/').pop() || '';
  let slug = filename.replace('.html', '');
  
  // Check for virtual routing via query parameters
  const params = new URLSearchParams(window.location.search);
  const vSlug = params.get('p') || params.get('v') || params.get('page');
  if (vSlug) slug = vSlug;
  
  const pageContainer = document.getElementById('dynamic-page-content');
  if (!pageContainer) return;

  const pages = typeof AdminStore !== 'undefined' ? AdminStore.getPages() : [];
  const page = pages.find(p => p.slug === slug);

  if (page && page.isActive !== false) {
    pageContainer.innerHTML = page.content;
    
    const finalTitle = page.seoTitle ? page.seoTitle : `${page.title} | Arvaan Collective`;
    document.title = finalTitle;

    const bcTitle = document.getElementById('breadcrumb-page-title');
    if (bcTitle) bcTitle.textContent = page.title;

    if (page.seoDesc) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = page.seoDesc;
    }

    const titleEl = document.querySelector('.section-heading');
    if (titleEl) titleEl.textContent = page.title;
    
    const heroWrap = document.querySelector('.page-header');
    if (page.heroImage && heroWrap) {
      heroWrap.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url('${page.heroImage}')`;
      heroWrap.style.backgroundSize = "cover";
      heroWrap.style.backgroundPosition = "center";
      heroWrap.style.padding = "100px 0";
      heroWrap.style.color = "white";
      
      const breadcrumb = heroWrap.querySelector('.breadcrumb');
      if (breadcrumb) {
        breadcrumb.querySelectorAll('a, span').forEach(el => el.style.color = 'rgba(255,255,255,0.8)');
      }
      
      if (titleEl) titleEl.style.color = "white";
    }
    
    // Auto-update any "Last Updated" text
    const updatedEl = document.querySelector('.page-last-updated');
    if (updatedEl && page.lastUpdated) {
      updatedEl.textContent = `Last Updated: ${page.lastUpdated}`;
      if (page.heroImage) updatedEl.style.color = "rgba(255,255,255,0.6)";
    }
  } else {
    pageContainer.innerHTML = '<div style="padding: 150px 0; text-align: center;"><div style="font-size:3rem; margin-bottom:20px;">🚧</div><h2 class="section-heading">Page Unavailable</h2><p class="text-muted" style="max-width:400px; margin: 0 auto 30px;">The requested page could not be located or is currently offline for maintenance.</p><a href="index.html" class="btn btn-primary">Return to Homepage</a></div>';
    
    const titleEl = document.querySelector('.section-heading');
    if (titleEl) titleEl.textContent = "Page Unavailable";
  }
}

// initHomePage is defined later at line 2121

function initShopPage() {
  console.log('initShopPage: Starting catalog initialization...');
  if (!StoreState.products || StoreState.products.length === 0) {
    const p = (typeof Store !== 'undefined') ? Store.getProducts() : [];
    if (p && p.length > 0) StoreState.products = p;
    else if (typeof SEED_PRODUCTS !== 'undefined') StoreState.products = SEED_PRODUCTS;
  }

  const max = getMaxPrice();
  StoreState.priceMax = max;
  
  const path = window.location.pathname.toLowerCase();
  const urlParams = new URLSearchParams(window.location.search);
  
  if (path.includes('electronics.html')) StoreState.currentCategory = 'Electronics';
  else if (path.includes('fashion.html')) StoreState.currentCategory = 'Fashion';
  
  if (urlParams.get('cat')) StoreState.currentCategory = urlParams.get('cat');
  if (urlParams.get('subcat')) StoreState.currentSubCategory = urlParams.get('subcat');
  if (urlParams.get('filter')) StoreState.currentFilter = urlParams.get('filter');
  if (urlParams.get('search')) StoreState.searchQuery = urlParams.get('search').toLowerCase();
  
  renderSidebarFilters();
  setTimeout(() => renderProducts(), 100);
}

function initCategoriesPage() {
  renderCategories('cat-grid', 12);
}

function initAOS() {
  if ('IntersectionObserver' in window) {
    const observerOptions = { threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('appear');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    UI.all('.fade-in-on-scroll').forEach(el => observer.observe(el));
  }
}

function updateGlobalLocalizations() {
  document.querySelectorAll('.localized-price').forEach(el => {
    const baseVal = parseFloat(el.dataset.base);
    if (!isNaN(baseVal)) {
      el.textContent = formatCurrency(baseVal);
    }
  });
}

function highlightActiveNavLinks() {
  const path = window.location.pathname;
  document.querySelectorAll('.cat-nav-link, .nav-action-btn').forEach(link => {
    const href = link.getAttribute('href');
    if (href && path.includes(href)) {
      link.classList.add('active');
    }
  });
}

function ensureAuthenticated(callback, toastMsg = 'Please sign in to continue.') {
  const isGuest = !window.Auth || !window.Auth.isLoggedInBuyer();
  if (isGuest) {
    closeAllModals();
    setTimeout(() => {
      openModal('auth-modal');
      showToast('Login Required', toastMsg, 'info');
    }, 300);
    return false;
  }
  return callback();
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
}

function bindGlobalUI() {
  // --- Auth & Session ---
  try {
    if (typeof updateAuthUI === 'function') updateAuthUI();
  } catch(e) { console.error("Auth init failed", e); }

  // --- Global Interactivity (Event Delegation) ---
  document.onclick = (e) => {
    const target = e.target;

    // 1. Dropdown Delegation
    const isUserToggle = target.closest('#user-dropdown-toggle');
    const isUserMenu = target.closest('#nav-user-menu');
    const isCatToggle = target.closest('#categories-dropdown-toggle');
    const isCatMenu = target.closest('#nav-categories-dropdown');

    if (isUserToggle) {
      const menu = document.getElementById('nav-user-menu');
      if (menu) menu.classList.toggle('active');
      return;
    }

    if (isCatToggle) {
      const menu = document.getElementById('nav-categories-dropdown');
      if (menu) menu.classList.toggle('active');
      return;
    }

    if (!isUserMenu && !isCatMenu) {
      closeAllDropdowns();
    }

    // 2. Modal & Drawer Triggers
    if (target.closest('.modal-close') || target.closest('.announce-close')) {
      closeAllModals();
      return;
    }

    if (target.classList.contains('modal-overlay') || 
        target.classList.contains('cart-drawer-overlay') || 
        target.classList.contains('filter-drawer-overlay')) {
      closeAllModals();
      return;
    }

    // Sign In Button
    if (target.closest('#nav-login-btn')) {
      openModal('auth-modal');
      return;
    }

    // Logout Action
    if (target.closest('#logout-btn')) {
      if (typeof Auth !== 'undefined') {
        Auth.logoutBuyer();
        showToast('Signed Out', 'Redirecting to homepage...', 'info');
        setTimeout(() => window.location.href = 'index.html', 1000);
      }
      return;
    }

    // 3. Gated Navigation Interceptors
    const wishLink = target.closest('a[href*="wishlist.html"]');
    if (wishLink && !wishLink.href.includes('javascript:')) {
      if (!ensureAuthenticated(() => true, 'Please sign in to view your wishlist.')) {
        e.preventDefault();
      }
      return;
    }

    const checkoutLink = target.closest('a[href*="checkout.html"]');
    if (checkoutLink && checkoutLink.id !== 'checkout-continue-shopping') {
      if (!ensureAuthenticated(() => true, 'Please sign in to proceed to checkout.')) {
        e.preventDefault();
      }
      return;
    }

    // 4. Mobile Menu
    if (target.closest('#mobile-menu-btn')) {
      toggleMobileMenu();
    }

    // 5. Cart Button (open drawer)
    if (target.closest('#cart-btn')) {
      e.preventDefault();
      openCartDrawer();
    }

    // 6. Checkout Button (inside cart drawer)
    if (target.closest('#cart-checkout-btn')) {
      e.preventDefault();
      openCheckout();
    }
  };

  // --- Theme Toggle ---
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    themeToggle.onclick = () => {
      document.body.classList.toggle('dark-theme');
      themeToggle.textContent = document.body.classList.contains('dark-theme') ? '🌙' : '☀️';
    };
  }

  // --- Search Bar (catalog page inline search) ---
  const catalogSearch = document.getElementById('search-input');
  if (catalogSearch) {
    catalogSearch.oninput = () => {
      StoreState.searchQuery = catalogSearch.value.trim().toLowerCase();
      StoreState.page = 1;
      renderProducts();
    };
  }

  // --- Back to Top ---
  if (typeof initBackToTop === 'function') initBackToTop();
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-overlay');
  if (drawer) {
    drawer.classList.remove('hidden');
    setTimeout(() => drawer.classList.add('open'), 10);
    document.body.style.overflow = 'hidden';
    updateCartUI();
  }
}


function renderGlobalNavigation() {
  const container = document.getElementById('categories-dropdown-menu');
  if (!container) return;

  let CATEGORIES = [];
  try {
    const adminCats = typeof AdminStore !== 'undefined' ? AdminStore.getCategories().filter(c => c.isVisible) : [];
    
    CATEGORIES = adminCats.map(cat => ({
      name: cat.name,
      icon: cat.icon || '📁',
      slug: cat.slug || cat.name,
      subs: (cat.children || []).filter(c => c.isVisible).map(c => c.name)
    }));

    // Prepend 'All'
    CATEGORIES.unshift({ name: 'All', icon: '✨', slug: 'All' });
    
    // Append Deals/New
    CATEGORIES.push({ name: 'Deals', icon: '🔥', slug: 'deals', isFilter: true });
    CATEGORIES.push({ name: 'New', icon: '✨', slug: 'new', isFilter: true });
    
  } catch(e) {
    console.error("Failed to load AdminStore categories, using fallback empty array", e);
  }

  const params = new URLSearchParams(window.location.search);
  const currentCat = params.get('cat');
  const currentSub = params.get('subcat');
  const currentFilter = params.get('filter');
  const path = window.location.pathname.toLowerCase();

  try {
    container.innerHTML = CATEGORIES.map((cat, idx) => {
      let href = 'shop.html';
      let isActive = false;

      if (cat.name === 'All') {
        isActive = (path.includes('shop.html') || path.endsWith('/')) && !currentCat && !currentFilter;
      } else if (cat.isFilter) {
        href = `shop.html?filter=${cat.slug}`;
        isActive = currentFilter === cat.slug;
      } else {
        href = `shop.html?cat=${encodeURIComponent(cat.slug)}`;
        isActive = currentCat === cat.slug || (path.includes('electronics.html') && cat.name === 'Electronics');
      }

      const hasSubs = cat.subs && cat.subs.length > 0;
      
      return `
        <div class="categories-menu-item-wrap ${hasSubs ? 'has-subs' : ''}">
          <a href="${href}" class="categories-menu-item ${isActive ? 'active' : ''}">
            <span class="cat-icon">${cat.icon}</span>
            <span class="cat-name">${cat.name}</span>
            ${hasSubs ? '<span class="cat-chevron">›</span>' : ''}
          </a>
          ${hasSubs ? `
            <div class="sub-menu">
              ${cat.subs.map(sub => `
                <a href="shop.html?cat=${encodeURIComponent(cat.slug)}&subcat=${encodeURIComponent(sub)}" 
                   class="sub-menu-item ${currentSub === sub ? 'active' : ''}">
                  ${sub}
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>`;
    }).join('');
  } catch (err) {
    console.error("Failed to render global navigation:", err);
  }
}

function renderGlobalFooter() {
  const footerContainer = document.getElementById('global-footer');
  if (!footerContainer) {
    console.warn("Footer container (#global-footer) not found.");
    return;
  }
  
  let tw = '#', ig = '#', fb = '#', yt = '#', ln = '#', wa = '#';
  try {
     const conf = AdminStore.getSiteConfig();
     if(conf && conf.social) {
       if(conf.social.twitter) tw = conf.social.twitter;
       if(conf.social.instagram) ig = conf.social.instagram;
       if(conf.social.facebook) fb = conf.social.facebook;
       if(conf.social.youtube) yt = conf.social.youtube;
       if(conf.social.linkedin) ln = conf.social.linkedin;
       if(conf.social.whatsapp) wa = conf.social.whatsapp;
     }
  } catch(e){}
  
  let companyLinks = [
    { label: 'About Us', slug: 'about' },
    { label: 'Contact Us', slug: 'contact' }
  ];

  let policyLinks = [
    { label: 'Shipping & Delivery', slug: 'shipping-policy' },
    { label: 'Return & Refund Policy', slug: 'return-policy' },
    { label: 'FAQs', slug: 'faq' },
    { label: 'Privacy Policy', slug: 'privacy-policy' },
    { label: 'Terms of Service', slug: 'terms-of-service' }
  ];

  try {
    if (typeof AdminStore !== 'undefined') {
      const allPages = AdminStore.getPages().filter(p => p.isActive !== false);
      
      // Update Company Links from AdminStore if they exist
      companyLinks = companyLinks.map(link => {
        const found = allPages.find(p => p.slug === link.slug);
        return found ? { label: found.title, slug: found.slug } : link;
      });

      // Update Policy Links from AdminStore
      policyLinks = policyLinks.map(link => {
        const found = allPages.find(p => p.slug === link.slug);
        return found ? { label: found.title, slug: found.slug } : link;
      });

      // Add any custom pages that aren't in the default sets
      const knownSlugs = [...companyLinks, ...policyLinks].map(l => l.slug);
      const customPages = allPages.filter(p => !knownSlugs.includes(p.slug));
      policyLinks = [...policyLinks, ...customPages.map(p => ({ label: p.title, slug: p.slug }))];
    }
  } catch (e) { console.error("Footer dynamic links failed", e); }

  let copyright = '© 2026 Arvaan Collective. All rights reserved.';
  let poweredBy = '';
  try {
     const conf = AdminStore.getSiteConfig();
     if (conf && conf.footer) {
       if (conf.footer.copyright) copyright = conf.footer.copyright;
       if (conf.footer.poweredBy) poweredBy = conf.footer.poweredBy;
     }
  } catch(e){}

  footerContainer.innerHTML = `
  <footer class="site-footer">
    <div class="page-container">
      <div class="footer-grid">
        <div class="footer-brand-col">
          <div class="footer-brand">✦ Arvaan <em>Collective</em></div>
          <p class="footer-tagline">India's trusted destination for premium curated products. Genuine brands. Best prices. Fastest delivery.</p>
          <div class="footer-social">
            ${ig !== '#' ? `<a href="${ig}" class="social-btn" target="_blank" title="Instagram">📸</a>` : ''}
            ${tw !== '#' ? `<a href="${tw}" class="social-btn" target="_blank" title="Twitter">𝕏</a>` : ''}
            ${fb !== '#' ? `<a href="${fb}" class="social-btn" target="_blank" title="Facebook">📘</a>` : ''}
            ${yt !== '#' ? `<a href="${yt}" class="social-btn" target="_blank" title="YouTube">▶️</a>` : ''}
            ${typeof ln !== 'undefined' && ln !== '#' ? `<a href="${ln}" class="social-btn" target="_blank" title="LinkedIn">💼</a>` : ''}
            ${typeof wa !== 'undefined' && wa !== '#' ? `<a href="${wa}" class="social-btn" target="_blank" title="WhatsApp">💬</a>` : ''}
          </div>
        </div>
        <div class="footer-links-col">
          <div class="footer-col-heading">Shop</div>
          <ul class="footer-links">
            <li><a href="shop.html">All Products</a></li>
            <li><a href="shop.html?filter=deals">Today's Deals</a></li>
            <li><a href="shop.html?filter=new">New Arrivals</a></li>
            <li><a href="shop.html?cat=Electronics">Electronics</a></li>
            <li><a href="shop.html?cat=Fashion">Fashion</a></li>
            <li><a href="shop.html?cat=Wellness">Wellness</a></li>
          </ul>
        </div>
        <div class="footer-links-col">
          <div class="footer-col-heading">Company</div>
          <ul class="footer-links">
            ${companyLinks.map(l => `<li><a href="pages.html?p=${l.slug}">${l.label}</a></li>`).join('')}
            <li><a href="../seller/seller.html">Seller Dashboard</a></li>
            <li><a href="../seller/register.html">Become a Seller</a></li>
          </ul>
        </div>
        <div class="footer-links-col">
          <div class="footer-col-heading">Help & Policies</div>
          <ul class="footer-links">
            ${policyLinks.map(l => `<li><a href="pages.html?p=${l.slug}">${l.label}</a></li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-legal">
          <span>${copyright}</span>
          ${poweredBy ? `<span class="powered-by" style="margin-left: 15px; opacity: 0.7; font-size: 0.8rem;">${poweredBy}</span>` : ''}
        </div>
        <div class="payment-icons">
          <span class="pay-icon" style="opacity:0.8">💳 Secure Payment</span>
          <span class="pay-icon" style="opacity:0.8">🔒 256-bit Encryption</span>
        </div>
      </div>
    </div>
  </footer>`;
}

function renderGlobalModals() {
  const modalContainer = document.getElementById('global-modals');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <!-- ══ CART DRAWER ══ -->
    <div class="cart-drawer-overlay" id="cart-overlay">
      <div class="cart-drawer">
        <div class="cart-header">
          <span>🛒 Your Cart (<span id="cart-count-drawer">0</span> items)</span>
          <button id="cart-close" class="modal-close">✕</button>
        </div>
        <div id="cart-shipping-progress"></div>
        <div class="cart-items" id="cart-items"></div>
        <div class="cart-promo-row">
          <input type="text" id="cart-promo-input" class="form-control" placeholder="Enter promo / coupon code">
          <button class="btn btn-outline" onclick="PromoMgr.apply(document.getElementById('cart-promo-input').value)">Apply</button>
        </div>
        <div class="cart-footer">
          <div class="cart-totals">
            <div class="cart-total-row"><span>Subtotal</span><span id="cart-subtotal">₹0</span></div>
            <div class="cart-total-row"><span>Shipping</span><span id="cart-shipping-label">Free</span></div>
            <div class="cart-total-row grand"><span>Total (incl. GST)</span><span id="cart-total">₹0</span></div>
          </div>
          <a href="javascript:void(0)" class="btn-checkout" id="cart-checkout-btn" onclick="openCheckout()">Proceed to Checkout →</a>
          <a href="shop.html" class="continue-shopping-link">← Continue Shopping</a>
        </div>
      </div>
    </div>

    <!-- ══ QUICK VIEW MODAL ══ -->
    <div class="modal-overlay" id="quick-view-modal">
      <div class="modal modal-lg quick-view-container">
        <button class="modal-close">✕</button>
        <div id="quick-view-content" class="quick-view-content"></div>
      </div>
    </div>

    <!-- ══ AUTH MODAL ══ -->
    <div class="modal-overlay" id="auth-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>Welcome to Arvaan</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="auth-tabs">
            <button class="auth-tab-btn active" data-auth-switch="login">Sign In</button>
            <button class="auth-tab-btn" data-auth-switch="register">Create Account</button>
          </div>
          <div id="auth-login" class="auth-tab-panel active">
            <form id="login-form">
              <div class="form-group"><label class="form-label">Email Address</label><input class="form-control" type="email" id="login-email" placeholder="you@example.com"></div>
              <div class="form-group" style="margin-top:14px"><label class="form-label">Password</label><input class="form-control" type="password" id="login-password" placeholder="Enter password"></div>
              <button class="btn btn-primary" type="submit" style="width:100%;margin-top:20px;padding:14px">Sign In →</button>
              <p style="text-align:center;margin-top:12px;font-size:0.8rem;color:var(--clr-text-3)">Demo: user@email.com / user123</p>
            </form>
          </div>
          <div id="auth-register" class="auth-tab-panel">
            <form id="register-form">
              <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" type="text" id="reg-name" placeholder="Your name"></div>
              <div class="form-group" style="margin-top:14px"><label class="form-label">Email</label><input class="form-control" type="email" id="reg-email" placeholder="you@example.com"></div>
              <div class="form-group" style="margin-top:14px"><label class="form-label">Password</label><input class="form-control" type="password" id="reg-password" placeholder="Min. 8 characters"></div>
              <div class="form-group" style="margin-top:14px"><label class="form-label">Confirm Password</label><input class="form-control" type="password" id="reg-confirm" placeholder="Repeat password"></div>
              <button class="btn btn-primary" type="submit" style="width:100%;margin-top:20px;padding:14px">Create Account →</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ COMPARISON MODAL ══ -->
    <div class="modal-overlay" id="comparison-modal">
      <div class="modal modal-lg">
        <div class="modal-header"><h3>Compare Products</h3><button class="modal-close">✕</button></div>
        <div id="comparison-modal-body" class="modal-body"></div>
      </div>
    </div>



    <!-- ══ TOAST ══ -->
    <div id="toast-container"></div>

    <!-- ══ BACK TO TOP ══ -->
    <button class="back-to-top" id="back-to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="Back to Top">↑</button>
  `;
}


function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-drawer-overlay');
  if (drawer && overlay) {
    const isActive = drawer.classList.contains('active');
    if (isActive) {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      renderMobileDrawer(); // Re-populate to be sure
    }
  }
}

function renderMobileDrawer() {
  const container = UI.get('mobile-cat-list');
  if (!container) return;
  const products = StoreState.products;
  const categories = [...new Set(products.map(p => p.category))];
  const icons = { 'Tech': '💻', 'Electronics': '🔌', 'Fashion': '👗', 'Furniture': '🛋️', 'Wellness': '🌿', 'Kitchen': '☕', 'Travel': '🎒', 'Home Decor': '🏠', 'Art': '🎨' };
  
  // Dynamic Auth Status
  const user = (typeof Auth !== 'undefined') ? Auth.getBuyer() : null;
  const authLink = UI.get('mobile-auth-link');
  if (authLink) {
    if (user) {
      authLink.innerHTML = `<span>👤</span> My Account (${user.name})`;
      authLink.href = 'account.html';
    } else {
      authLink.innerHTML = `<span>👤</span> My Account / Login`;
      authLink.href = 'account.html';
    }
  }

  container.innerHTML = categories.map(cat => `
    <a href="shop.html?cat=${encodeURIComponent(cat)}" class="mobile-nav-item" style="font-weight:400; font-size:0.9rem; padding:10px 0">
      <span>${icons[cat] || '✨'}</span> ${cat}
    </a>
  `).join('');
}


// ── New Homepage Utilities ─────────────────────────────────────────────────

function renderFlashDeals() {
  const grid = UI.get('flash-deals-grid');
  if (!grid) return;
  const deals = Store.getProducts()
    .filter(p => p.isActive !== false && p.discount && p.discount >= 20)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 8);
  if (!deals.length) { UI.get('flash-sale-section') && (UI.get('flash-sale-section').style.display = 'none'); return; }
  grid.innerHTML = deals.map(p => renderProductCard(p)).join('');
  addProductCardListeners();
}

function initFlashCountdown() {
  const hEl = UI.get('cd-hours');
  const mEl = UI.get('cd-mins');
  const sEl = UI.get('cd-secs');
  if (!hEl || !mEl || !sEl) return;

  function tick() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, midnight - now);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    hEl.textContent = String(h).padStart(2, '0');
    mEl.textContent = String(m).padStart(2, '0');
    sEl.textContent = String(s).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
}

function initProductTabs() {
  const tabs = document.querySelectorAll('.product-tab-btn');
  if (!tabs.length) return;
  tabs.forEach(btn => {
    btn.onclick = () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      renderFeaturedProducts(8, tab === 'all' ? null : tab);
    };
  });
}


function initHomePage() {
  let homeConfig = { sections: [] };
  try {
    if (typeof AdminStore !== 'undefined') {
      homeConfig = AdminStore.getHomepage();
    }
  } catch (e) {
    console.error("AdminStore error", e);
  }

  const sectionsList = homeConfig.sections || [];
  
  // Mapping admin section types to DOM IDs and existing render functions
  const sectionMap = {
    'hero': { selector: '#hero-section', render: null },
    'featured-categories': { selector: '#category-grid', render: renderCategoryChips },
    'featured-products': { selector: '#featured-products', render: () => renderFeaturedProducts(8) },
    'promo-banner': { selector: '.promo-feature-banner', render: null },
    'flash-sale': { selector: '#flash-sale-section', render: renderFlashDeals },
    'new-arrivals': { selector: '#trending-products', render: () => renderTrendingProducts(8) },
    'testimonials': { selector: '#testimonial-grid', render: renderReviews },
    'newsletter': { selector: '.newsletter-section', render: null }
  };

  const mainEl = document.querySelector('main');
  if (mainEl && !mainEl.style.display) {
    mainEl.style.display = 'flex';
    mainEl.style.flexDirection = 'column';
  }

  sectionsList.forEach(sec => {
    const mapping = sectionMap[sec.type];
    if (mapping) {
      // Find the parent section block to reorder and toggle (often the immediate parent of the selector or the section itself)
      const innerEl = document.querySelector(mapping.selector);
      const sectionEl = innerEl ? innerEl.closest('section') : null;
      
      if (sectionEl) {
        if (!sec.isEnabled) {
          sectionEl.style.display = 'none';
        } else {
          sectionEl.style.display = '';
          sectionEl.style.order = sec.order;
          if (mapping.render) mapping.render(sec.config);
        }
      }
    }
  });

  initRevealOnScroll();
  initHeroBadgePrice();
  initFlashCountdown();
  initProductTabs();
  initAnnounceBarRotation();
  initBackToTop();
  initNewsletterForm();
}

function renderReviews() {
  const container = UI.get('testimonial-grid');
  if (!container) return;
  const reviews = [
    { name: 'Priya S.', role: 'Verified Buyer · Tech', rating: 5, text: 'The Obsidian Chronos VIII exceeded every expectation. Packaging was immaculate, delivery was ahead of schedule, and the customer service was exceptional.' },
    { name: 'Raj M.', role: 'Verified Buyer · Furniture', rating: 5, text: 'The Echelon Chair transformed my home office. Build quality is outstanding. Arvaan Collective actually curates — not just aggregates random products.' },
    { name: 'Ananya K.', role: 'Verified Buyer · Wellness', rating: 5, text: 'Midnight Velvet Parfum is a masterpiece. The crystal vessel alone is worth the price. Fast shipping and beautifully gift-wrapped. Will be ordering again!' }
  ];
  
  container.innerHTML = reviews.map(t => `
    <div class="testimonial-card">
      <div style="font-size:1.1rem">${getStarsHTML(t.rating)}</div>
      <p style="margin:20px 0;font-style:italic;color:rgba(255,255,255,0.8);font-size:1.05rem;line-height:1.6">"${t.text}"</p>
      <div style="display:flex; align-items:center; gap:12px">
        <div style="width:3px; height:20px; background:var(--clr-primary)"></div>
        <div>
          <div style="font-weight:700; font-size:0.9rem">${t.name}</div>
          <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.1em">${t.role}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function initRevealOnScroll() {
  const els = document.querySelectorAll('.reveal-on-scroll');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('appear'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

function initHeroBadgePrice() {
  const priceEl = UI.get('hero-badge-price');
  if (!priceEl) return;
  const featuredProduct = StoreState.products.find(p => p.featured && p.isActive !== false);
  if (featuredProduct) priceEl.textContent = formatCurrency(featuredProduct.price);
}

function renderCategoryChips() {
  const container = UI.get('category-grid'); 
  if (!container) return;

  const products = StoreState.products;
  const categories = [...new Set(products.map(p => p.category))].slice(0, 8);
  const icons = { 'Tech': '💻', 'Electronics': '🔌', 'Fashion': '👗', 'Furniture': '🛋️', 'Wellness': '🌿', 'Kitchen': '☕', 'Travel': '🎒', 'Home Decor': '🏠', 'Art': '🎨' };
  container.innerHTML = categories.map(cat => {
    const count = products.filter(p => p.category === cat).length;
    return `
      <div class="cat-chip fade-in" onclick="window.location.href='shop.html?cat=${encodeURIComponent(cat)}'">
        <div class="cat-chip-icon">${icons[cat] || '✨'}</div>
        <div class="cat-chip-label">${cat}</div>
        <div class="cat-chip-count">${count} items</div>
      </div>`;
  }).join('');
}

function initAnnounceBarRotation() {
  const items = document.querySelectorAll('.announce-item');
  if (items.length < 2) return;
  let idx = 0;
  setInterval(() => {
    items[idx].classList.remove('active');
    idx = (idx + 1) % items.length;
    items[idx].classList.add('active');
  }, 4000);
}

function initBackToTop() {
  const btn = UI.get('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
}

function initNewsletterForm() {
  const form = UI.get('newsletter-form');
  if (!form) return;
  form.onsubmit = (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value;
    if (!email) return;
    showToast('Subscribed!', `${email} added to our VIP list. Expect exclusive offers!`, 'success');
    form.reset();
  };
}

// ── Entry Point ──
window.alert = () => {};
/**
 * --- Main Entry Point ---
 */
function initStore() {
  try {
    // 1. Core Data
    if (typeof Store !== 'undefined' && Store.init) {
       Store.init();
       StoreState.products = Store.getProducts();
    }
    
    // 2. Critical Shell Components
    renderGlobalNavigation();
    renderGlobalModals();
    renderGlobalFooter();
    renderMobileDrawer();

    // 3. Application Content
    initStoreContent();

    // 4. Global UI & Interactivity
    bindGlobalUI();
    if (typeof Auth !== 'undefined' && Auth.initListeners) {
      Auth.initListeners();
    }
  } catch (e) {
    console.error('initStore: Critical failure:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStore);
} else {
  initStore();
}


