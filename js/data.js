/* =============================================
   DATA.JS — Arvaan Collective Seed Data v3
   16 products across 8 categories
   ============================================= */
'use strict';

const SEED_PRODUCTS = [];

// ── Global Store Logic ──────────────────────────────────────────────────────
const Store = {
  get(key) { return JSON.parse(localStorage.getItem(`arvaan_${key}`)); },
  set(key, val) { localStorage.setItem(`arvaan_${key}`, JSON.stringify(val)); },

  getProducts() { return this.get('products') || []; },
  setProducts(p) { this.set('products', p); },

  // Tracks IDs that have been explicitly deleted so seed merges don't resurrect them
  getDeletedIds() { try { return this.get('deleted_product_ids') || []; } catch(e) { return []; } },
  addDeletedId(id) {
    const ids = this.getDeletedIds();
    const strId = String(id);
    if (!ids.includes(strId)) { 
      ids.push(strId); 
      this.set('deleted_product_ids', ids);
    }
  },
  addDeletedIds(idsArray) {
    const ids = this.getDeletedIds();
    let changed = false;
    idsArray.forEach(id => { 
      const strId = String(id);
      if (!ids.includes(strId)) {
        ids.push(strId);
        changed = true;
      }
    });
    if (changed) {
      this.set('deleted_product_ids', ids);
    }
  },

  getSellers() { return this.get('sellers') || []; },
  setSellers(s) { this.set('sellers', s); },

  getBuyers() { return this.get('buyers') || []; },
  setBuyers(u) { this.set('buyers', u); },

  getCurrentBuyer() { return this.get('current_buyer'); },
  getUser() { return this.getCurrentBuyer(); },
  setCurrentBuyer(u) { this.set('current_buyer', u); },
  clearCurrentBuyer() { localStorage.removeItem('arvaan_current_buyer'); },

  getCurrentSeller() { return this.get('current_seller'); },
  setCurrentSeller(s) { this.set('current_seller', s); },
  clearCurrentSeller() { localStorage.removeItem('arvaan_current_seller'); },

  getCart() { return this.get('cart') || []; },
  setCart(c) { this.set('cart', c); },
  getOrders() { return this.get('orders') || []; },
  setOrders(o) { this.set('orders', o); },
  getWishlist() { return this.get('wishlist') || []; },
  setWishlist(w) { this.set('wishlist', w); },
  getTransactions() { return this.get('transactions') || []; },
  setTransactions(t) { this.set('transactions', t); },

  init() {
    try {
      const rawVersion = localStorage.getItem('arvaan_seed_version');
      const savedVersion = rawVersion ? JSON.parse(rawVersion) : null;
      let currentProds = [];
      try {
        currentProds = this.getProducts() || [];
      } catch (e) {
        console.warn("Could not parse products, resetting catalog", e);
        this.setProducts([]);
      }
      
      console.log('Store.init: Checking seed version...', savedVersion);
      // Logic for version management is now primarily handled in CloudDB.bootstrap 
      // to ensure Firebase is cleared before local data is pulled back.
      
      if (!this.get('sellers') || this.get('sellers').length === 0) {
        this.setSellers([]);
      }
      
      // Ensure seed version is at least 14 to prevent unnecessary purges
      if (!savedVersion || savedVersion < 14) {
        localStorage.setItem('arvaan_seed_version', '14');
      }

      if (!this.get('buyers')) {
        this.setBuyers([]);
      }
    } catch (err) {
      console.error("Store.init CRASHED:", err);
    }
  },

  genId(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; },
  getSettings() { return this.get('settings') || { currency: 'INR', language: 'en' }; },
  setSettings(s) { this.set('settings', s); }
};

// Store.init() is now called from store.js to ensure UI is ready
// Store.init();

// ── AdminStore — Configuration Data Layer ──────────────────────────────────
// Shared between /admin panel and /store storefront via localStorage
// Keys: arvaan_admin_categories | arvaan_admin_homepage | arvaan_admin_filters | arvaan_admin_site

const ADMIN_DEFAULT_CATEGORIES = [
  { id: 'cat-electronics', name: 'Electronics', icon: '📱', slug: 'Electronics',
    description: 'Phones, tablets, audio & more', isVisible: true, order: 1,
    policy: { returnType: 'returnable', returnWindow: 7, returnCondition: 'original_packaging', freePickup: true, qualityCheck: true, replacement: true, warrantyClaim: true, refundMethod: 'both' },
    children: [
      { id: 'sub-mobiles',  name: 'Mobiles',  slug: 'Mobiles',  parentId: 'cat-electronics', isVisible: true, order: 0 },
      { id: 'sub-tablets',  name: 'Tablets',  slug: 'Tablets',  parentId: 'cat-electronics', isVisible: true, order: 1 },
      { id: 'sub-audio',    name: 'Audio',    slug: 'Audio',    parentId: 'cat-electronics', isVisible: true, order: 2 }
    ]
  },
  { id: 'cat-fashion', name: 'Fashion', icon: '👗', slug: 'Fashion',
    description: 'Apparel, footwear & accessories', isVisible: true, order: 2,
    policy: { returnType: 'exchange', returnWindow: 15, returnCondition: 'unused', freePickup: true, qualityCheck: false, replacement: false, warrantyClaim: false, refundMethod: 'store_credit' },
    children: [
      { id: 'sub-apparel',  name: 'Apparel',  slug: 'Apparel',  parentId: 'cat-fashion', isVisible: true, order: 0 },
      { id: 'sub-footwear', name: 'Footwear', slug: 'Footwear', parentId: 'cat-fashion', isVisible: true, order: 1 }
    ]
  },
  { id: 'cat-furniture', name: 'Furniture', icon: '🛋️', slug: 'Furniture',
    description: 'Living room, office & bedroom', isVisible: true, order: 3,
    policy: { returnType: 'returnable', returnWindow: 30, returnCondition: 'undamaged', freePickup: true, qualityCheck: true, replacement: false, warrantyClaim: true, refundMethod: 'both' },
    children: [
      { id: 'sub-living',    name: 'Living Room', slug: 'Living Room', parentId: 'cat-furniture', isVisible: true, order: 0 },
      { id: 'sub-workplace', name: 'Workplace',   slug: 'Workplace',   parentId: 'cat-furniture', isVisible: true, order: 1 }
    ]
  },
  { id: 'cat-kitchen', name: 'Kitchen', icon: '☕', slug: 'Kitchen',
    description: 'Appliances, cooking & dining', isVisible: true, order: 4,
    policy: { returnType: 'returnable', returnWindow: 10, returnCondition: 'original_packaging', freePickup: false, qualityCheck: true, replacement: true, warrantyClaim: true, refundMethod: 'original' },
    children: [
      { id: 'sub-appliances', name: 'Appliances', slug: 'Appliances', parentId: 'cat-kitchen', isVisible: true, order: 0 },
      { id: 'sub-cooking',    name: 'Cooking',    slug: 'Cooking',    parentId: 'cat-kitchen', isVisible: true, order: 1 }
    ]
  },
  { id: 'cat-wellness', name: 'Wellness', icon: '🌿', slug: 'Wellness',
    description: 'Personal care, skincare & fitness', isVisible: true, order: 5,
    policy: { returnType: 'non_returnable', returnWindow: 0, returnCondition: 'unused', freePickup: false, qualityCheck: false, replacement: false, warrantyClaim: false, refundMethod: 'original', nonReturnReason: 'Hygiene & safety regulations' },
    children: [
      { id: 'sub-personalcare', name: 'Personal Care', slug: 'Personal Care', parentId: 'cat-wellness', isVisible: true, order: 0 },
      { id: 'sub-skincare',     name: 'Skincare',      slug: 'Skincare',      parentId: 'cat-wellness', isVisible: true, order: 1 },
      { id: 'sub-fitness',      name: 'Fitness',       slug: 'Fitness',       parentId: 'cat-wellness', isVisible: true, order: 2 }
    ]
  },
  { id: 'cat-travel', name: 'Travel', icon: '🎒', slug: 'Travel',
    description: 'Luggage, bags & outdoor gear', isVisible: true, order: 6,
    policy: { returnType: 'returnable', returnWindow: 15, returnCondition: 'original_packaging', freePickup: true, qualityCheck: false, replacement: false, warrantyClaim: false, refundMethod: 'both' },
    children: [
      { id: 'sub-luggage',  name: 'Luggage',      slug: 'Luggage',      parentId: 'cat-travel', isVisible: true, order: 0 },
      { id: 'sub-outdoor',  name: 'Outdoor Gear', slug: 'Outdoor Gear', parentId: 'cat-travel', isVisible: true, order: 1 }
    ]
  },
  { id: 'cat-homedecor', name: 'Home Decor', icon: '🏠', slug: 'Home Decor',
    description: 'Lighting, wall art & decoratives', isVisible: true, order: 7,
    policy: { returnType: 'exchange', returnWindow: 7, returnCondition: 'undamaged', freePickup: false, qualityCheck: false, replacement: false, warrantyClaim: false, refundMethod: 'store_credit' },
    children: [
      { id: 'sub-lighting', name: 'Lighting', slug: 'Lighting', parentId: 'cat-homedecor', isVisible: true, order: 0 },
      { id: 'sub-wallart',  name: 'Wall Art', slug: 'Wall Art', parentId: 'cat-homedecor', isVisible: true, order: 1 }
    ]
  }
];

const ADMIN_DEFAULT_HOMEPAGE = {
  sections: [
    { type: 'hero', isEnabled: true, order: 0,
      config: { headline: "Shop India's Premium Brands at Best Prices", subText: 'From top electronics to artisan wellness — discover 10,000+ products with guaranteed quality.', ctaLabel: 'Shop All Products →', ctaUrl: 'shop.html', ctaSecondaryLabel: "🔥 Today's Deals", ctaSecondaryUrl: 'shop.html?filter=deals' }
    },
    { type: 'featured-categories', isEnabled: true, order: 1,
      config: { heading: 'Shop by Category', categoryIds: ['cat-electronics','cat-fashion','cat-furniture','cat-kitchen','cat-wellness','cat-travel'], maxItems: 6 }
    },
    { type: 'featured-products', isEnabled: true, order: 2,
      config: { heading: 'Best Sellers', rule: 'top-rated', maxItems: 8 }
    },
    { type: 'flash-sale', isEnabled: true, order: 3,
      config: { heading: "Today's Best Deals", subText: 'Limited time offers — grab them before they\'re gone!', rule: 'on-sale', maxItems: 8 }
    },
    { type: 'promo-banner', isEnabled: true, order: 4,
      config: {
        cards: [
          { eyebrow: '⚡ Limited Time', title: 'Up to 42% Off', sub: 'Flash deals on top brands, today only', cta: 'Shop Deals →', url: 'shop.html?filter=deals', style: 'dark' },
          { eyebrow: '📱 Tech Week', title: 'Premium Electronics', sub: 'Apple, Samsung, Sony, Dyson & more', cta: 'Explore Tech →', url: 'shop.html?cat=Electronics', style: 'warm' },
          { eyebrow: '🏪 For Sellers', title: 'Start Selling Today', sub: 'Join 2,000+ sellers — Zero listing charges', cta: 'Register Free →', url: '../seller/register.html', style: 'light' }
        ]
      }
    },
    { type: 'new-arrivals', isEnabled: true, order: 5,
      config: { heading: '✨ New Arrivals', rule: 'newest', maxItems: 8 }
    },
    { type: 'testimonials', isEnabled: true, order: 6, config: {} },
    { type: 'newsletter', isEnabled: true, order: 7, config: {} }
  ]
};

const ADMIN_DEFAULT_FILTERS = {
  'Electronics': [
    { id: 'f-el-brand', label: 'Brand', type: 'checkbox', values: ['Apple', 'Samsung', 'Sony', 'OnePlus', 'Realme'], order: 0, isActive: true },
    { id: 'f-el-price', label: 'Price Range', type: 'range', min: 0, max: 200000, step: 1000, unit: '₹', order: 1, isActive: true },
    { id: 'f-el-rating', label: 'Minimum Rating', type: 'radio', values: ['4★ & Above', '3★ & Above', '2★ & Above'], order: 2, isActive: true }
  ],
  'Fashion': [
    { id: 'f-fa-brand', label: 'Brand', type: 'checkbox', values: ['Nike', 'Adidas', 'Puma', 'Levi\'s', 'H&M'], order: 0, isActive: true },
    { id: 'f-fa-type',  label: 'Type',  type: 'checkbox', values: ['Apparel', 'Footwear', 'Accessories'], order: 1, isActive: true },
    { id: 'f-fa-price', label: 'Price Range', type: 'range', min: 0, max: 20000, step: 100, unit: '₹', order: 2, isActive: true }
  ],
  'Furniture': [
    { id: 'f-fu-room',  label: 'Room',  type: 'checkbox', values: ['Living Room', 'Bedroom', 'Workplace', 'Kitchen'], order: 0, isActive: true },
    { id: 'f-fu-price', label: 'Price Range', type: 'range', min: 0, max: 100000, step: 500, unit: '₹', order: 1, isActive: true }
  ],
  'Wellness': [
    { id: 'f-we-type',  label: 'Type',  type: 'checkbox', values: ['Personal Care', 'Skincare', 'Fitness', 'Nutrition'], order: 0, isActive: true },
    { id: 'f-we-price', label: 'Price Range', type: 'range', min: 0, max: 50000, step: 100, unit: '₹', order: 1, isActive: true }
  ],
  'Kitchen': [
    { id: 'f-ki-type',  label: 'Type',  type: 'checkbox', values: ['Appliances', 'Cookware', 'Storage', 'Dining'], order: 0, isActive: true },
    { id: 'f-ki-price', label: 'Price Range', type: 'range', min: 0, max: 30000, step: 100, unit: '₹', order: 1, isActive: true }
  ]
};

const ADMIN_DEFAULT_SITE = {
  siteName: 'Arvaan Collective',
  tagline: "India's Premium Online Marketplace",
  primaryColor: '#6C3BFF',
  accentColor: '#FF6B35',
  
  // Theme & Identity
  appearance: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    logoUrl: '',
    faviconUrl: '',
    logoStyle: 'brand-text' // 'image' | 'brand-text'
  },
  
  // Layout & Global Behavior
  layout: {
    stickyHeader: true,
    productCardStyle: 'glass', // 'glass' | 'flat' | 'outline'
    defaultSort: 'trending',
    gridColumns: 4
  },
  
  // SEO & Marketing
  seo: {
    titleTemplate: '%s | Arvaan Collective',
    metaDescription: 'Shop electronics, fashion, home decor, wellness & more at Arvaan Collective. Free shipping on ₹999+. Genuine products. Easy returns.'
  },
  
  // Announcement Bar
  announcement: {
    active: true,
    text: '🚚 Free Delivery on orders above ₹999',
    link: 'shop.html'
  },
  
  // Advanced Hooks
  scripts: {
    customCss: '',
    googleAnalyticsId: '',
    fbPixelId: ''
  },

  maintenanceMode: false,

  footer: {
    copyright: '© 2026 Arvaan Collective. All rights reserved.',
    links: [
      { label: 'About', url: 'about.html' },
      { label: 'Contact', url: 'contact.html' },
      { label: 'FAQ', url: 'faq.html' },
      { label: 'Shipping Policy', url: 'shipping-policy.html' },
      { label: 'Return Policy', url: 'return-policy.html' },
      { label: 'Privacy Policy', url: 'privacy-policy.html' },
      { label: 'Terms of Service', url: 'terms-of-service.html' }
    ]
  },
  social: { instagram: '', facebook: '', twitter: '', youtube: '' },
  contact: { email: 'support@arvaancollective.com', phone: '+91 98765 43210', address: 'Mumbai, Maharashtra, India' },
  
  // Payment Settings
  payment: {
    upiEnabled: true,
    upiId: 'pay@upi',
    payeeName: 'Arvaan Collective',
    gateway: {
      enabled: false,
      type: 'razorpay',
      apiKey: '',
      mode: 'test'
    }
  }
};

const ADMIN_DEFAULT_PAGES = [
  { slug: 'faq', title: 'Frequently Asked Questions', lastUpdated: 'April 2026', isActive: true, isSeed: true, content: `<h2>How can we assist you?</h2><p>Find quick answers to common questions about shopping with Arvaan Collective.</p><h3>Orders & Payments</h3><p><strong>What payment methods do you accept?</strong><br>We accept all major Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), and Cash on Delivery (for eligible pin codes).</p><p><strong>Can I modify an order after placing it?</strong><br>Orders can be cancelled or modified within 2 hours of placement. Please visit the Orders section in your account.</p><h3>Shipping & Returns</h3><p><strong>Do you ship internationally?</strong><br>Currently, Arvaan Collective curates and ships exclusively within India. We plan to expand globally in late 2027.</p><p><strong>How long does a refund take?</strong><br>Following quality check approval at our facility, refunds typically reflect in your bank account within 5-7 business days.</p><h3>Account & Prestige Points</h3><p><strong>How does the Prestige Rewards program work?</strong><br>For every unit spent, you earn 1 Prestige Point. Points define your tier (Silver, Gold, Platinum) and unlock exclusive early-access sales and priority support. Points are valid for 12 months from the date of earning.</p>` },
  { slug: 'privacy-policy', title: 'Privacy Policy', lastUpdated: 'April 2026', isActive: true, isSeed: true, content: `<h2>Your Privacy is Our Priority</h2><p>We are fully committed to protecting your data and handling it with transparency.</p><h3>Information We Collect</h3><p>We collect device information, IP addresses, and account details securely encrypted at rest. We never sell your personal information to third-party data brokers.</p>` },
  { slug: 'terms-of-service', title: 'Terms of Service', lastUpdated: 'April 2026', isActive: true, isSeed: true, content: `<h2>Terms of Service</h2><p>By using Arvaan Collective, you agree to these conditions. Please read them carefully.</p><h3>Account Security</h3><p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</p>` },
  { slug: 'return-policy', title: 'Return Policy', lastUpdated: 'April 2026', isActive: true, isSeed: true, content: `<h2>Returns & Exchanges</h2><p>Our goal is 100% customer satisfaction.</p><h3>30-Day Guarantee</h3><p>If you are not entirely satisfied with your purchase, you may return the item in its original condition and packaging within 30 days of receipt for a full refund or exchange.</p>` },
  { slug: 'shipping-policy', title: 'Shipping Policy', lastUpdated: 'April 2026', isActive: true, isSeed: true, content: `<h2>Shipping Details</h2><p>Getting your purchase safely to you is our priority.</p><h3>Transit Times</h3><p>Standard delivery takes 3-5 business days. Express delivery guarantees arrival within 1-2 business days across major metros.</p>` },
  { slug: 'about', title: 'Our Story', lastUpdated: 'April 2026', isActive: true, isSeed: true, content: `<div style="text-align: center; max-width: 800px; margin: 0 auto; margin-bottom:40px;"><h2>Curating Excellence, Defining Lifestyle.</h2><p>Founded on the principles of uncompromising quality and artisanal precision, Arvaan Collective is more than a marketplace. We are a gallery of the fine works that represent the pinnacle of Indian and global craftsmanship.</p></div><h2>Our Vision</h2><p>We believe that luxury shouldn't be distant. It should be the quality of the tech you use daily, the comfort of the garments you wear, and the soul of the home you build.</p><p>Every product in our collective undergoes a rigorous 25-point quality assessment. If it doesn't meet the Arvaan standard, it doesn't enter our inventory. That is our promise to you.</p>` },
  { slug: 'contact', title: 'Contact Us', lastUpdated: 'April 2026', isActive: true, isSeed: true, content: `<h2>We're Here for You</h2><p>Have a question or need assistance? Reach out to our concierge service 24/7.</p><h3>Customer Support</h3><p>Email: support@arvaancollective.com<br>Phone: +91 98765 43210</p><h3>Corporate Office</h3><p>Arvaan Collective HQ<br>Bandra Kurla Complex<br>Mumbai, Maharashtra, India 400051</p>` }
];

const AdminStore = {
  _key(k) { return `arvaan_admin_${k}`; },
  get(k) { try { return JSON.parse(localStorage.getItem(this._key(k))); } catch(e) { return null; } },
  set(k, v) { localStorage.setItem(this._key(k), JSON.stringify(v)); },

  // Categories
  getCategories() { return this.get('categories') || ADMIN_DEFAULT_CATEGORIES; },
  setCategories(cats) { this.set('categories', cats); },

  // Homepage config
  getHomepage() { return this.get('homepage') || ADMIN_DEFAULT_HOMEPAGE; },
  setHomepage(cfg) { this.set('homepage', cfg); },

  // Filters per category slug
  getFilters(slug) {
    const all = this.get('filters') || ADMIN_DEFAULT_FILTERS;
    return all[slug] || [];
  },
  getAllFilters() { return this.get('filters') || ADMIN_DEFAULT_FILTERS; },
  setFilters(slug, filters) {
    const all = this.getAllFilters();
    all[slug] = filters;
    this.set('filters', all);
  },
  setAllFilters(all) { this.set('filters', all); },

  // Site settings
  getSiteConfig() { return this.get('site') || ADMIN_DEFAULT_SITE; },
  setSiteConfig(cfg) { this.set('site', cfg); },

  // Pages
  getPages() { return this.get('pages') || ADMIN_DEFAULT_PAGES; },
  setPages(pages) { this.set('pages', pages); },
  getPage(slug) { return this.getPages().find(p => p.slug === slug); },

  // Admin session
  getSession() { return this.get('session'); },
  setSession(s) { this.set('session', s); },
  clearSession() { localStorage.removeItem(this._key('session')); },
  isLoggedIn() { const s = this.getSession(); return !!(s && s.isLoggedIn); },

  // Admin credentials (hardcoded MVP)
  ADMIN_EMAIL: 'admin@arvaan.com',
  ADMIN_PASSWORD: 'admin123',

  login(email, password) {
    if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
      this.setSession({ isLoggedIn: true, email, loginAt: new Date().toISOString() });
      return true;
    }
    return false;
  },

  // Seed defaults on first run (idempotent)
  initDefaults() {
    if (!this.get('categories')) this.setCategories(ADMIN_DEFAULT_CATEGORIES);
    if (!this.get('homepage'))   this.setHomepage(ADMIN_DEFAULT_HOMEPAGE);
    if (!this.get('filters'))    this.setAllFilters(ADMIN_DEFAULT_FILTERS);
    if (!this.get('site'))       this.setSiteConfig(ADMIN_DEFAULT_SITE);
    if (!this.get('pages'))      this.setPages(ADMIN_DEFAULT_PAGES);
  },

  genId(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; }
};

window.AdminStore = AdminStore;
window.ADMIN_DEFAULT_CATEGORIES = ADMIN_DEFAULT_CATEGORIES;
window.ADMIN_DEFAULT_HOMEPAGE = ADMIN_DEFAULT_HOMEPAGE;
window.ADMIN_DEFAULT_FILTERS = ADMIN_DEFAULT_FILTERS;
window.ADMIN_DEFAULT_SITE = ADMIN_DEFAULT_SITE;

// ── Notification System ───────────────────────────────────────────────────
const NotificationSystem = {
  // Simulate sending email and SMS
  async send(recipient, subject, body, type = 'email') {
    console.log(`[NotificationSystem] Sending ${type} to ${recipient}...`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    
    // Log to a global notification log for audit
    const logs = JSON.parse(localStorage.getItem('arvaan_notifications') || '[]');
    logs.unshift({
      timestamp: new Date().toISOString(),
      recipient,
      subject,
      type,
      status: 'Sent (Simulated)'
    });
    localStorage.setItem('arvaan_notifications', JSON.stringify(logs.slice(0, 50)));
    
    return true;
  },

  async sendOrderConfirmation(order, user) {
    const subject = `Order Confirmed: ${order.id}`;
    const body = `Hi ${user.name},\n\nYour order ${order.id} for ${formatCurrency(order.total)} has been placed successfully. Thank you for shopping with Arvaan Collective!`;
    
    // Send to Email
    this.send(user.email, subject, body, 'email');
    // Send to Phone
    if (user.phone) {
      this.send(user.phone, 'Order Confirmed', `Your Arvaan order ${order.id} is confirmed. Total: ${formatCurrency(order.total)}.`, 'sms');
    }
  },

  async sendDeliveryUpdate(order, user) {
    const subject = `Order Delivered: ${order.id}`;
    const body = `Hi ${user.name},\n\nGood news! Your order ${order.id} has been delivered. We hope you love your new curation.`;
    
    this.send(user.email, subject, body, 'email');
    if (user.phone) {
      this.send(user.phone, 'Order Delivered', `Order ${order.id} delivered! Hope you enjoy your purchase from Arvaan Collective.`, 'sms');
    }
  }
};

/**
 * Apply Site Settings (colors, branding) to the UI
 */
function applyAdminSiteConfig() {
  if (typeof AdminStore === 'undefined') return;
  const cfg = AdminStore.getSiteConfig();
  if (!cfg) return;
  const root = document.documentElement;
  if (cfg.primaryColor) root.style.setProperty('--clr-primary', cfg.primaryColor);
  if (cfg.accentColor)  root.style.setProperty('--clr-accent',  cfg.accentColor);
}

window.applyAdminSiteConfig = applyAdminSiteConfig;

// Expose globally if in browser
if (typeof window !== 'undefined') {
  window.NotificationSystem = NotificationSystem;
}
