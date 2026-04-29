/* =============================================
   DATA.JS — Arvaan Collective Seed Data v3
   16 products across 8 categories
   ============================================= */
'use strict';

const SEED_PRODUCTS = [
  // ── TECH ──────────────────────────────────────────────────────────────────
  {
    id: 'p1', name: 'Sony WH-1000XM5 Headphones', category: 'Electronics', subCategory: 'Audio',
    price: 24999, originalPrice: 32999, discount: 24,
    rating: 4.9, reviews: 8412, stock: 28, sold: 5200, weightGms: 250,
    seller: 'seller1', featured: true, isNew: false, trending: true, isActive: true,
    tags: ['wireless', 'noise-cancelling', 'premium'],
    description: 'Industry-leading noise cancellation with 30-hour battery life. Crystal-clear calls with multipoint connection. Lightweight design for all-day comfort.',
    images: [
      'https://picsum.photos/seed/sony1/600/400',
      'https://picsum.photos/seed/sony2/600/400'
    ],
    specifications: { 'Driver': '30mm HD', 'Battery': '30 Hours', 'Connectivity': 'Bluetooth 5.2', 'Weight': '250g' }
  },
  {
    id: 'p2', name: 'Apple iPad Pro 12.9" M2', category: 'Electronics', subCategory: 'Tablets',
    price: 89900, originalPrice: 99900, discount: 10,
    rating: 4.8, reviews: 3241, stock: 14, sold: 890, weightGms: 682,
    seller: 'seller1', featured: true, isNew: true, trending: true, isActive: true,
    tags: ['apple', 'tablet', 'm2-chip'],
    description: 'The most advanced iPad yet with M2 chip, Liquid Retina XDR display, ProMotion 120Hz, and support for Apple Pencil and Magic Keyboard.',
    images: [
      'https://picsum.photos/seed/ipad1/600/400',
      'https://picsum.photos/seed/ipad2/600/400'
    ],
    specifications: { 'Chip': 'Apple M2', 'Display': '12.9" Liquid Retina XDR', 'Storage': '256GB', 'Battery': '10 Hours' }
  },
  {
    id: 'p3', name: 'Samsung Galaxy S24 Ultra', category: 'Electronics', subCategory: 'Mobiles',
    price: 129999, originalPrice: 149999, discount: 13,
    rating: 4.7, reviews: 5603, stock: 22, sold: 3100, weightGms: 232,
    seller: 'seller1', featured: false, isNew: true, trending: true, isActive: true,
    tags: ['samsung', '5G', 'AI-camera'],
    description: 'The ultimate smartphone with 200MP AI camera, built-in S Pen, and Galaxy AI features. Titanium frame with 5000mAh battery.',
    images: [
      'https://picsum.photos/seed/s24u1/600/400',
      'https://picsum.photos/seed/s24u2/600/400'
    ],
    specifications: { 'Camera': '200MP AI', 'Processor': 'Snapdragon 8 Gen 3', 'Battery': '5000mAh', 'Display': '6.8" QHD+' }
  },
  // ── FASHION ───────────────────────────────────────────────────────────────
  {
    id: 'p4', name: 'Nike Air Max 270 React', category: 'Fashion', subCategory: 'Footwear',
    price: 8995, originalPrice: 11995, discount: 25,
    rating: 4.6, reviews: 2180, stock: 42, sold: 1800, weightGms: 320,
    seller: 'seller2', featured: true, isNew: false, trending: true, isActive: true,
    tags: ['nike', 'running', 'sneakers'],
    description: 'Engineered for all-day comfort with React foam midsole and Max Air unit delivering exceptional cushioning. Lightweight mesh upper keeps you fresh.',
    images: [
      'https://picsum.photos/seed/nike1/600/400',
      'https://picsum.photos/seed/nike2/600/400'
    ],
    specifications: { 'Upper': 'Engineered Mesh', 'Sole': 'React + Max Air', 'Closure': 'Lace-Up', 'Available': 'US 6–13' }
  },
  {
    id: 'p5', name: 'Roadster Leather Biker Jacket', category: 'Fashion', subCategory: 'Apparel',
    price: 3499, originalPrice: 5999, discount: 42,
    rating: 4.5, reviews: 980, stock: 18, sold: 650, weightGms: 1100,
    seller: 'seller2', featured: false, isNew: false, trending: false, isActive: true,
    tags: ['leather', 'jacket', 'biker'],
    description: 'Premium PU leather biker jacket with asymmetric front zip, silver-tone hardware, and quilted shoulder detailing. A wardrobe essential.',
    images: [
      'https://picsum.photos/seed/jacket1/600/400',
      'https://picsum.photos/seed/jacket2/600/400'
    ],
    specifications: { 'Material': 'Premium PU', 'Lining': 'Poly Satin', 'Zipper': 'YKK Metal', 'Fit': 'Regular' }
  },
  // ── HOME & FURNITURE ──────────────────────────────────────────────────────
  {
    id: 'p6', name: 'Modular L-Shaped Sofa', category: 'Furniture', subCategory: 'Living Room',
    price: 34999, originalPrice: 54999, discount: 36,
    rating: 4.7, reviews: 340, stock: 6, sold: 88, weightGms: 85000,
    seller: 'seller1', featured: true, isNew: false, trending: false, isActive: true,
    tags: ['sofa', 'living-room', 'modular'],
    description: 'Premium fabric, deep seat cushions, and reconfigurable sections let you create your perfect seating arrangement. Available in 6 fabric colors.',
    images: [
      'https://picsum.photos/seed/sofa1/600/400',
      'https://picsum.photos/seed/sofa2/600/400'
    ],
    specifications: { 'Upholstery': 'Chenille Fabric', 'Fill': 'High-Density Foam', 'Legs': 'Solid Wood', 'Warranty': '3 Years' }
  },
  {
    id: 'p7', name: 'Ergonomic Mesh Office Chair', category: 'Furniture', subCategory: 'Workplace',
    price: 12999, originalPrice: 19999, discount: 35,
    rating: 4.8, reviews: 1204, stock: 34, sold: 820, weightGms: 15000,
    seller: 'seller1', featured: true, isNew: false, trending: true, isActive: true,
    tags: ['office', 'ergonomic', 'chair'],
    description: 'Breathable 3D mesh backrest, 4D armrests, adjustable lumbar support, and 135° recline. Built for 8+ hour work sessions.',
    images: [
      'https://picsum.photos/seed/chair1/600/400',
      'https://picsum.photos/seed/chair2/600/400'
    ],
    specifications: { 'Back': '3D Mesh', 'Armrests': '4D Adjustable', 'Recline': 'Up to 135°', 'Weight Limit': '130kg' }
  },
  // ── KITCHEN ───────────────────────────────────────────────────────────────
  {
    id: 'p8', name: 'Ninja Smart XL Blender', category: 'Kitchen', subCategory: 'Appliances',
    price: 5499, originalPrice: 7999, discount: 31,
    rating: 4.6, reviews: 2800, stock: 55, sold: 3400, weightGms: 2400,
    seller: 'seller2', featured: false, isNew: false, trending: false, isActive: true,
    tags: ['blender', 'kitchen', 'smart'],
    description: '1400W motor with Auto-iQ presets for smoothies, frozen drinks, and soups. 72oz total crushing pitcher destroys ice on contact.',
    images: [
      'https://picsum.photos/seed/blender1/600/400',
      'https://picsum.photos/seed/blender2/600/400'
    ],
    specifications: { 'Power': '1400W', 'Capacity': '72oz', 'Presets': 'Auto-iQ', 'BPA Free': 'Yes' }
  },
  {
    id: 'p9', name: 'Instant Pot Duo 7-in-1', category: 'Kitchen', subCategory: 'Cooking',
    price: 6299, originalPrice: 8999, discount: 30,
    rating: 4.9, reviews: 14200, stock: 80, sold: 12000, weightGms: 5400,
    seller: 'seller2', featured: false, isNew: false, trending: true, isActive: true,
    tags: ['instant-pot', 'pressure-cooker', 'multi-cooker'],
    description: 'Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer all in one. Cuts cooking time by up to 70%.',
    images: [
      'https://picsum.photos/seed/pot1/600/400',
      'https://picsum.photos/seed/pot2/600/400'
    ],
    specifications: { 'Functions': '7-in-1', 'Capacity': '6 Quart', 'Programs': '13 Built-in', 'Safety': '10 Mechanisms' }
  },
  // ── WELLNESS & BEAUTY ─────────────────────────────────────────────────────
  {
    id: 'p10', name: 'Dyson Supersonic Hair Dryer', category: 'Wellness', subCategory: 'Personal Care',
    price: 32900, originalPrice: 38900, discount: 15,
    rating: 4.8, reviews: 5600, stock: 19, sold: 4200, weightGms: 690,
    seller: 'seller1', featured: true, isNew: false, trending: true, isActive: true,
    tags: ['dyson', 'hair-dryer', 'premium'],
    description: 'Intelligent heat control prevents extreme heat damage. Air Multiplier technology creates a high-pressure, high-velocity jet of air for fast drying.',
    images: [
      'https://picsum.photos/seed/dryer1/600/400',
      'https://picsum.photos/seed/dryer2/600/400'
    ],
    specifications: { 'Motor': 'Dyson Digital V9', 'Settings': '3 speeds + 4 heat', 'Cable': '3m', 'Warranty': '2 Years' }
  },
  {
    id: 'p11', name: 'Forest Essentials Facial Kit', category: 'Wellness', subCategory: 'Skincare',
    price: 2499, originalPrice: 3200, discount: 22,
    rating: 4.7, reviews: 1890, stock: 64, sold: 3800, weightGms: 400,
    seller: 'seller2', featured: false, isNew: true, trending: false, isActive: true,
    tags: ['skincare', 'ayurveda', 'natural'],
    description: '5-piece Ayurvedic facial kit with Rose & Kashmiri Saffron cleanser, toner, moisturizer, serum, and face mask. Suitable for all skin types.',
    images: [
      'https://picsum.photos/seed/skincare1/600/400',
      'https://picsum.photos/seed/skincare2/600/400'
    ],
    specifications: { 'Type': 'Ayurvedic', 'Pieces': '5', 'Skin Type': 'All', 'Free From': 'Parabens, SLS' }
  },
  // ── TRAVEL & BAGS ─────────────────────────────────────────────────────────
  {
    id: 'p12', name: 'American Tourister 55cm Cabin Bag', category: 'Travel', subCategory: 'Luggage',
    price: 3799, originalPrice: 6499, discount: 42,
    rating: 4.5, reviews: 4120, stock: 45, sold: 6200, weightGms: 2100,
    seller: 'seller2', featured: false, isNew: false, trending: false, isActive: true,
    tags: ['luggage', 'cabin', 'spinner'],
    description: 'Textured polypropylene shell with 4 spinner wheels for 360° effortless rolling. TSA-approved lock and expandable compartment.',
    images: [
      'https://picsum.photos/seed/bag1/600/400',
      'https://picsum.photos/seed/bag2/600/400'
    ],
    specifications: { 'Material': 'Polypropylene', 'Wheels': '4 Double Spinner', 'Lock': 'TSA Approved', 'Size': '55cm Cabin' }
  },
  {
    id: 'p13', name: 'Wildcraft 45L Trekking Backpack', category: 'Travel', subCategory: 'Outdoor Gear',
    price: 2199, originalPrice: 3499, discount: 37,
    rating: 4.5, reviews: 2940, stock: 33, sold: 4800, weightGms: 1200,
    seller: 'seller2', featured: false, isNew: true, trending: false, isActive: true,
    tags: ['backpack', 'trekking', 'outdoor'],
    description: 'Rain-proof 45L pack with adjustable shoulder straps, ventilated back panel, hydration sleeve, and multiple zipped compartments.',
    images: [
      'https://picsum.photos/seed/trek1/600/400',
      'https://picsum.photos/seed/trek2/600/400'
    ],
    specifications: { 'Capacity': '45L', 'Material': 'Rip-Stop Nylon', 'Frame': 'Internal Aluminum', 'Rain Cover': 'Included' }
  },
  // ── HOME DECOR ────────────────────────────────────────────────────────────
  {
    id: 'p14', name: 'Himalayan Salt Lamp Set (3pcs)', category: 'Home Decor', subCategory: 'Lighting',
    price: 1299, originalPrice: 1999, discount: 35,
    rating: 4.6, reviews: 3400, stock: 92, sold: 7800, weightGms: 3000,
    seller: 'seller2', featured: false, isNew: false, trending: false, isActive: true,
    tags: ['salt-lamp', 'decor', 'wellness'],
    description: 'Set of 3 hand-crafted natural Himalayan pink salt lamps with dimmer cord. Warm amber glow creates a soothing ambiance in any room.',
    images: [
      'https://picsum.photos/seed/lamp1/600/400',
      'https://picsum.photos/seed/lamp2/600/400'
    ],
    specifications: { 'Pieces': '3', 'Type': 'Natural Himalayan', 'Dimmer': 'Included', 'Wattage': '15W' }
  },
  {
    id: 'p15', name: 'Boho Macramé Wall Hanging', category: 'Home Decor', subCategory: 'Wall Art',
    price: 899, originalPrice: 1299, discount: 30,
    rating: 4.8, reviews: 2100, stock: 48, sold: 4300, weightGms: 500,
    seller: 'seller2', featured: false, isNew: true, trending: false, isActive: true,
    tags: ['macrame', 'wall-art', 'boho'],
    description: 'Handwoven cotton macramé wall hanging with fringe details. 90cm × 45cm. Bring warmth and texture to any living room or bedroom.',
    images: [
      'https://picsum.photos/seed/boho1/600/400',
      'https://picsum.photos/seed/boho2/600/400'
    ],
    specifications: { 'Material': '100% Cotton', 'Size': '90cm × 45cm', 'Hanging': 'Wooden Stick', 'Style': 'Boho' }
  },
  // ── SPORTS ───────────────────────────────────────────────────────────────
  {
    id: 'p16', name: 'Yoga Mat Premium Anti-Slip (6mm)', category: 'Wellness', subCategory: 'Fitness',
    price: 1499, originalPrice: 2499, discount: 40,
    rating: 4.7, reviews: 6800, stock: 120, sold: 14000, weightGms: 1200,
    seller: 'seller2', featured: false, isNew: false, trending: true, isActive: true,
    tags: ['yoga', 'fitness', 'anti-slip'],
    description: '6mm thick NBR foam provides superior cushioning. Double-sided non-slip texture, alignment lines, and carrying strap included.',
    images: [
      'https://picsum.photos/seed/yoga1/600/400',
      'https://picsum.photos/seed/yoga2/600/400'
    ],
    specifications: { 'Thickness': '6mm', 'Material': 'NBR Foam', 'Size': '183cm × 61cm', 'Carry Strap': 'Included' }
  }
];

// ── Global Store Logic ──────────────────────────────────────────────────────
const Store = {
  get(key) { return JSON.parse(localStorage.getItem(`arvaan_${key}`)); },
  set(key, val) { localStorage.setItem(`arvaan_${key}`, JSON.stringify(val)); },

  getProducts() { return this.get('products') || []; },
  setProducts(p) { this.set('products', p); },

  // Tracks IDs that have been explicitly deleted so seed merges don't resurrect them
  getDeletedIds() { try { return JSON.parse(localStorage.getItem('arvaan_deleted_product_ids') || '[]'); } catch(e) { return []; } },
  addDeletedId(id) {
    const ids = this.getDeletedIds();
    const strId = String(id);
    if (!ids.includes(strId)) { ids.push(strId); localStorage.setItem('arvaan_deleted_product_ids', JSON.stringify(ids)); }
  },
  addDeletedIds(idsArray) {
    const ids = this.getDeletedIds();
    idsArray.forEach(id => { 
      const strId = String(id);
      if (!ids.includes(strId)) ids.push(strId); 
    });
    localStorage.setItem('arvaan_deleted_product_ids', JSON.stringify(ids));
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
      if (savedVersion !== 9 || currentProds.length === 0) {
        console.log('Store.init: Refreshing product catalog to version 9...');
        const deletedIds = this.getDeletedIds();
        // Start from seed but skip any products the seller has explicitly deleted
        const merged = SEED_PRODUCTS.filter(p => !deletedIds.includes(String(p.id)));
        
        currentProds.forEach(sp => {
          if (!merged.find(p => String(p.id) === String(sp.id)) && !deletedIds.includes(String(sp.id))) {
            // heal any nan prices that were created before toBaseCurrency fix
            if (isNaN(parseFloat(sp.price))) sp.price = sp.originalPrice || 999;
            merged.push(sp);
          }
        });
        
        this.setProducts(merged);
        this.set('seed_version', 9);
        console.log('Store.init: Catalog refreshed to version 9.');
      }

      if (!this.get('sellers')) {
        this.setSellers([
          { id: 'seller1', name: 'Ravi Raj', email: 'seller@arvaan.com', password: 'seller123', shopName: 'Arvaan Official', joinDate: '2026-01-15', avatar: '🏪', payoutBalance: 24500, taxRate: 18, shippingConfig: { freeThreshold: 999, tiers: [{maxWeight:500,price:49},{maxWeight:2000,price:99},{maxWeight:5000,price:149}] } },
          { id: 'seller2', name: 'Priya Collections', email: 'priya@collections.com', password: 'seller123', shopName: 'Priya Collections', joinDate: '2026-02-01', avatar: '🛍️', payoutBalance: 18200, taxRate: 18, shippingConfig: { freeThreshold: 999, tiers: [{maxWeight:500,price:49},{maxWeight:2000,price:99}] } }
        ]);
      }

      if (!this.get('buyers')) {
        this.setBuyers([
          { id: 'u1', name: 'Demo User', email: 'user@email.com', password: 'user123', joinDate: '2026-03-01', avatar: '👤' }
        ]);
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

// Expose globally if in browser
if (typeof window !== 'undefined') {
  window.NotificationSystem = NotificationSystem;
}
