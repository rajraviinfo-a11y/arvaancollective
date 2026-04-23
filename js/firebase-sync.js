/* =============================================
   FIREBASE-SYNC.JS — Arvaan Collective
   Cloud data layer: Firestore ↔ localStorage bridge
   Patches Store + AdminStore to also write to Firebase
   ============================================= */
'use strict';

const CloudDB = {
  db:   null,
  auth: null,
  ready: false,

  // ── Init ───────────────────────────────────────────────────────────────────
  init() {
    if (typeof firebase === 'undefined' || !window.db) {
      console.warn('CloudDB: Firebase not available, running offline mode.');
      return false;
    }
    this.db   = window.db;
    this.auth = window.auth;
    this.ready = true;
    return true;
  },

  // ── Config: Pull all admin config from Firestore → localStorage ────────────
  async pullConfig() {
    if (!this.ready) return;
    const keys = ['site', 'homepage', 'categories', 'filters', 'pages'];
    await Promise.all(keys.map(async (key) => {
      try {
        const snap = await this.db.collection('config').doc(key).get();
        if (snap.exists && snap.data().value !== undefined) {
          localStorage.setItem(`arvaan_admin_${key}`, JSON.stringify(snap.data().value));
        }
      } catch (e) {
        console.warn(`CloudDB: pullConfig(${key}) failed`, e.message);
      }
    }));
  },

  // ── Config: Push a single admin config doc to Firestore ───────────────────
  async pushConfig(key, value) {
    if (!this.ready) return;
    try {
      await this.db.collection('config').doc(key).set({ value });
    } catch (e) {
      console.warn(`CloudDB: pushConfig(${key}) failed`, e.message);
    }
  },

  // ── Products: Pull from Firestore → localStorage ──────────────────────────
  async pullProducts() {
    if (!this.ready) return null;
    try {
      const snap = await this.db.collection('products').get();
      if (!snap.empty) {
        const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        localStorage.setItem('arvaan_products', JSON.stringify(products));
        console.log(`CloudDB: Pulled ${products.length} products from Firestore`);
        return products;
      }
    } catch (e) {
      console.warn('CloudDB: pullProducts failed', e.message);
    }
    return null;
  },

  // ── Products: Push entire product array to Firestore (batch) ─────────────
  async pushProducts(products) {
    if (!this.ready || !products || !products.length) return;
    try {
      // Firestore batch limit is 500 — chunk if needed
      const chunks = [];
      for (let i = 0; i < products.length; i += 400) {
        chunks.push(products.slice(i, i + 400));
      }
      for (const chunk of chunks) {
        const batch = this.db.batch();
        chunk.forEach(p => {
          const ref = this.db.collection('products').doc(String(p.id));
          batch.set(ref, p);
        });
        await batch.commit();
      }
      console.log(`CloudDB: Pushed ${products.length} products to Firestore`);
    } catch (e) {
      console.warn('CloudDB: pushProducts failed', e.message);
    }
  },

  // ── Single product save ───────────────────────────────────────────────────
  async saveProduct(product) {
    if (!this.ready) return;
    try {
      await this.db.collection('products').doc(String(product.id)).set(product);
    } catch (e) {
      console.warn('CloudDB: saveProduct failed', e.message);
    }
  },

  // ── Single product delete ─────────────────────────────────────────────────
  async deleteProduct(productId) {
    if (!this.ready) return;
    try {
      await this.db.collection('products').doc(String(productId)).delete();
    } catch (e) {
      console.warn('CloudDB: deleteProduct failed', e.message);
    }
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  async pullOrders(uid = null) {
    if (!this.ready) return [];
    try {
      let query = this.db.collection('orders').orderBy('createdAt', 'desc');
      if (uid) query = query.where('buyerId', '==', uid);
      const snap = await query.get();
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem('arvaan_orders', JSON.stringify(orders));
      return orders;
    } catch (e) {
      console.warn('CloudDB: pullOrders failed', e.message);
      return [];
    }
  },

  async saveOrder(order) {
    if (!this.ready) return;
    try {
      await this.db.collection('orders').doc(String(order.id)).set(order);
    } catch (e) {
      console.warn('CloudDB: saveOrder failed', e.message);
    }
  },

  // ── User Profiles ─────────────────────────────────────────────────────────
  async saveUserProfile(uid, profile) {
    if (!this.ready) return;
    try {
      // Remove password before storing in Firestore
      const safeProfile = { ...profile };
      delete safeProfile.password;
      await this.db.collection('users').doc(uid).set(safeProfile, { merge: true });
    } catch (e) {
      console.warn('CloudDB: saveUserProfile failed', e.message);
    }
  },

  async getUserProfile(uid) {
    if (!this.ready) return null;
    try {
      const snap = await this.db.collection('users').doc(uid).get();
      return snap.exists ? snap.data() : null;
    } catch (e) {
      console.warn('CloudDB: getUserProfile failed', e.message);
      return null;
    }
  },

  // ── Cart (cloud sync for logged-in users) ─────────────────────────────────
  async saveCart(uid, cart) {
    if (!this.ready || !uid) return;
    try {
      await this.db.collection('carts').doc(uid).set({
        items: cart,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('CloudDB: saveCart failed', e.message);
    }
  },

  async pullCart(uid) {
    if (!this.ready || !uid) return null;
    try {
      const snap = await this.db.collection('carts').doc(uid).get();
      if (snap.exists) {
        const cart = snap.data().items || [];
        localStorage.setItem('arvaan_cart', JSON.stringify(cart));
        return cart;
      }
    } catch (e) {
      console.warn('CloudDB: pullCart failed', e.message);
    }
    return null;
  },

  // ── Wishlist (cloud sync for logged-in users) ─────────────────────────────
  async saveWishlist(uid, wishlist) {
    if (!this.ready || !uid) return;
    try {
      await this.db.collection('wishlists').doc(uid).set({
        items: wishlist,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('CloudDB: saveWishlist failed', e.message);
    }
  },

  async pullWishlist(uid) {
    if (!this.ready || !uid) return null;
    try {
      const snap = await this.db.collection('wishlists').doc(uid).get();
      if (snap.exists) {
        const wishlist = snap.data().items || [];
        localStorage.setItem('arvaan_wishlist', JSON.stringify(wishlist));
        return wishlist;
      }
    } catch (e) {
      console.warn('CloudDB: pullWishlist failed', e.message);
    }
    return null;
  },

  // ── First-run Seeding: push defaults if Firestore is empty ───────────────
  async seedIfEmpty() {
    if (!this.ready) return;
    try {
      // Check products
      const prodSnap = await this.db.collection('products').limit(1).get();
      if (prodSnap.empty && typeof SEED_PRODUCTS !== 'undefined') {
        console.log('CloudDB: First run — seeding products...');
        await this.pushProducts(SEED_PRODUCTS);
      }

      // Check config
      const cfgSnap = await this.db.collection('config').doc('site').get();
      if (!cfgSnap.exists) {
        console.log('CloudDB: First run — seeding admin config...');
        const seeds = [
          ['site',       window.ADMIN_DEFAULT_SITE],
          ['homepage',   window.ADMIN_DEFAULT_HOMEPAGE],
          ['categories', window.ADMIN_DEFAULT_CATEGORIES],
          ['filters',    window.ADMIN_DEFAULT_FILTERS],
          ['pages',      window.ADMIN_DEFAULT_PAGES],
        ];
        await Promise.all(seeds.map(([k, v]) => v ? this.pushConfig(k, v) : Promise.resolve()));
      }
    } catch (e) {
      console.warn('CloudDB: seedIfEmpty failed', e.message);
    }
  },

  // ── Main bootstrap: pull data then signal ready ───────────────────────────
  async bootstrap() {
    if (!this.init()) {
      document.dispatchEvent(new CustomEvent('arvaan:cloud-ready', { detail: { offline: true } }));
      return;
    }
    try {
      // Parallel pull: config + products
      await Promise.all([
        this.pullConfig(),
        this.pullProducts()
      ]);
      // Seed on first run (no-op if data already exists)
      await this.seedIfEmpty();
    } catch (e) {
      console.warn('CloudDB: bootstrap error', e.message);
    }
    document.dispatchEvent(new CustomEvent('arvaan:cloud-ready', { detail: { offline: false } }));
    console.log('✅ CloudDB bootstrap complete');
  }
};

// ── Patch Store & AdminStore after they are defined ───────────────────────────
// We wait for DOMContentLoaded so that data.js has already executed
document.addEventListener('DOMContentLoaded', () => {
  CloudDB.bootstrap();

  // Patch AdminStore.set → also write to Firestore
  if (typeof AdminStore !== 'undefined') {
    const _origAdminSet = AdminStore.set.bind(AdminStore);
    AdminStore.set = function(k, v) {
      _origAdminSet(k, v);
      // Only sync the known config keys
      const syncKeys = ['site', 'homepage', 'categories', 'filters', 'pages'];
      if (syncKeys.includes(k)) {
        CloudDB.pushConfig(k, v).catch(() => {});
      }
    };
  }

  // Patch Store.set → also write to Firestore for products & orders
  if (typeof Store !== 'undefined') {
    const _origStoreSet = Store.set.bind(Store);
    Store.set = function(key, val) {
      _origStoreSet(key, val);
      if (key === 'products' && Array.isArray(val)) {
        // Debounce to avoid hammering Firestore on rapid updates
        clearTimeout(Store._productSyncTimer);
        Store._productSyncTimer = setTimeout(() => {
          CloudDB.pushProducts(val).catch(() => {});
        }, 800);
      }
      if (key === 'orders' && Array.isArray(val)) {
        // Sync newest order (last in array)
        const latest = val[val.length - 1];
        if (latest) CloudDB.saveOrder(latest).catch(() => {});
      }
    };
  }
});

// Expose globally
window.CloudDB = CloudDB;
