/* =============================================
   DATA.JS — Arvaan Collective Seed Data v3
   16 products across 8 categories
   ============================================= */
'use strict';

const SEED_PRODUCTS = [
  // ── TECH ──────────────────────────────────────────────────────────────────
  {
    id: 'p1', name: 'Sony WH-1000XM5 Headphones', category: 'Electronics',
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
    id: 'p2', name: 'Apple iPad Pro 12.9" M2', category: 'Electronics',
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
    id: 'p3', name: 'Samsung Galaxy S24 Ultra', category: 'Electronics',
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
    id: 'p4', name: 'Nike Air Max 270 React', category: 'Fashion',
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
    id: 'p5', name: 'Roadster Leather Biker Jacket', category: 'Fashion',
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
    id: 'p6', name: 'Modular L-Shaped Sofa', category: 'Furniture',
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
    id: 'p7', name: 'Ergonomic Mesh Office Chair', category: 'Furniture',
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
    id: 'p8', name: 'Ninja Smart XL Blender', category: 'Kitchen',
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
    id: 'p9', name: 'Instant Pot Duo 7-in-1', category: 'Kitchen',
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
    id: 'p10', name: 'Dyson Supersonic Hair Dryer', category: 'Wellness',
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
    id: 'p11', name: 'Forest Essentials Facial Kit', category: 'Wellness',
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
    id: 'p12', name: 'American Tourister 55cm Cabin Bag', category: 'Travel',
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
    id: 'p13', name: 'Wildcraft 45L Trekking Backpack', category: 'Travel',
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
    id: 'p14', name: 'Himalayan Salt Lamp Set (3pcs)', category: 'Home Decor',
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
    id: 'p15', name: 'Boho Macramé Wall Hanging', category: 'Home Decor',
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
    id: 'p16', name: 'Yoga Mat Premium Anti-Slip (6mm)', category: 'Wellness',
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
      // robust version 4 product state healing
      const rawVersion = localStorage.getItem('arvaan_seed_version');
      const savedVersion = rawVersion ? JSON.parse(rawVersion) : null;
      let currentProds = [];
      try {
        currentProds = this.getProducts() || [];
      } catch (e) {
        console.warn("Could not parse products, resetting catalog", e);
        this.setProducts([]);
      }
      
      if (savedVersion !== 6 || currentProds.length === 0) {
        const merged = [...SEED_PRODUCTS];
        
        currentProds.forEach(sp => {
          if (!merged.find(p => p.id === sp.id)) {
            // heal any nan prices that were created before toBaseCurrency fix
            if (isNaN(parseFloat(sp.price))) sp.price = sp.originalPrice || 999;
            merged.push(sp);
          }
        });
        
        this.setProducts(merged);
        this.set('seed_version', 6);
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
