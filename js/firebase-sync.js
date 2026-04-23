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

  // ── Universal Collection Sync (Products, Orders, Sellers, etc) ────────────
  async pullCollection(colName, localKey) {
    if (!this.ready) return null;
    try {
      const snap = await this.db.collection(colName).get();
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        localStorage.setItem(localKey, JSON.stringify(items));
        console.log(`CloudDB: Pulled ${items.length} ${colName} from Firestore`);
        return items;
      }
    } catch (e) {
      console.warn(`CloudDB: pullCollection(${colName}) failed`, e.message);
    }
    return null;
  },

  async pushCollection(colName, items) {
    if (!this.ready || !items || !items.length) return;
    try {
      // Firestore batch limit is 500 — chunk if needed
      const chunks = [];
      for (let i = 0; i < items.length; i += 400) {
        chunks.push(items.slice(i, i + 400));
      }
      for (const chunk of chunks) {
        const batch = this.db.batch();
        chunk.forEach(item => {
          if (!item.id) return;
          const ref = this.db.collection(colName).doc(String(item.id));
          batch.set(ref, item);
        });
        await batch.commit();
      }
      console.log(`CloudDB: Pushed ${items.length} ${colName} to Firestore`);
    } catch (e) {
      console.warn(`CloudDB: pushCollection(${colName}) failed`, e.message);
    }
  },

  // ── User Profiles ─────────────────────────────────────────────────────────
  async saveUserProfile(uid, profile) {
    if (!this.ready) return;
    try {
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

  // ── Cart / Wishlist ───────────────────────────────────────────────────────
  async saveUserList(colName, uid, items) {
    if (!this.ready || !uid) return;
    try {
      await this.db.collection(colName).doc(uid).set({ items, updatedAt: new Date().toISOString() });
    } catch (e) { console.warn(`CloudDB: saveUserList(${colName}) failed`, e.message); }
  },

  async pullUserList(colName, uid, localKey) {
    if (!this.ready || !uid) return null;
    try {
      const snap = await this.db.collection(colName).doc(uid).get();
      if (snap.exists) {
        const items = snap.data().items || [];
        localStorage.setItem(localKey, JSON.stringify(items));
        return items;
      }
    } catch (e) { console.warn(`CloudDB: pullUserList(${colName}) failed`, e.message); }
    return null;
  },

  async saveCart(uid, cart) { return this.saveUserList('carts', uid, cart); },
  async pullCart(uid) { return this.pullUserList('carts', uid, 'arvaan_cart'); },
  async saveWishlist(uid, list) { return this.saveUserList('wishlists', uid, list); },
  async pullWishlist(uid) { return this.pullUserList('wishlists', uid, 'arvaan_wishlist'); },

  // ── First-run Seeding: push defaults if Firestore is empty ───────────────
  async seedIfEmpty() {
    if (!this.ready) return;
    try {
      // Check config to determine if it's the first run
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

      // If products collection is empty, seed products
      const prodSnap = await this.db.collection('products').limit(1).get();
      if (prodSnap.empty && typeof SEED_PRODUCTS !== 'undefined') {
        console.log('CloudDB: First run — seeding products...');
        await this.pushCollection('products', SEED_PRODUCTS);
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
      // Parallel pull everything
      await Promise.all([
        this.pullConfig(),
        this.pullCollection('products', 'arvaan_products'),
        this.pullCollection('orders', 'arvaan_orders'),
        this.pullCollection('sellers', 'arvaan_sellers'),
        this.pullCollection('promotions', 'arvaan_promotions'),
        this.pullCollection('transactions', 'arvaan_transactions'),
        this.pullCollection('reviews', 'arvaan_reviews')
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
document.addEventListener('DOMContentLoaded', () => {
  CloudDB.bootstrap();

  // Patch AdminStore.set
  if (typeof AdminStore !== 'undefined') {
    const _origAdminSet = AdminStore.set.bind(AdminStore);
    AdminStore.set = function(k, v) {
      _origAdminSet(k, v);
      const syncKeys = ['site', 'homepage', 'categories', 'filters', 'pages'];
      if (syncKeys.includes(k)) CloudDB.pushConfig(k, v).catch(() => {});
    };
  }

  // Patch Store.set for generic collections
  if (typeof Store !== 'undefined') {
    const _origStoreSet = Store.set.bind(Store);
    Store.set = function(key, val) {
      _origStoreSet(key, val);
      
      const collections = ['products', 'orders', 'sellers', 'promotions', 'transactions', 'reviews'];
      if (collections.includes(key) && Array.isArray(val)) {
        clearTimeout(Store[`_${key}SyncTimer`]);
        Store[`_${key}SyncTimer`] = setTimeout(() => {
          CloudDB.pushCollection(key, val).catch(() => {});
        }, 800);
      }
    };
  }
});

// Expose globally
window.CloudDB = CloudDB;
