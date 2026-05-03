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
          const localKey = `arvaan_admin_${key}`;
          // Only pull from cloud if local config doesn't exist to prevent overwriting local admin changes
          if (!localStorage.getItem(localKey)) {
            localStorage.setItem(localKey, JSON.stringify(snap.data().value));
          }
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
      let cloudItems = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (typeof Store !== 'undefined') {
        // 1. Filter out deleted products if applicable
        if (colName === 'products') {
          const deletedIds = Store.getDeletedIds();
          if (deletedIds.length > 0) {
            cloudItems = cloudItems.filter(p => !deletedIds.includes(String(p.id)));
          }
        }

        // 2. Universal Merge: preserve local-only items not yet in Firestore
        const existingLocalRaw = localStorage.getItem(localKey);
        if (existingLocalRaw) {
          try {
            const localItems = JSON.parse(existingLocalRaw);
            if (Array.isArray(localItems)) {
              const cloudIds = new Set(cloudItems.map(p => String(p.id)));
              const localOnlyItems = localItems.filter(p => p.id && !cloudIds.has(String(p.id)));

              if (localOnlyItems.length > 0) {
                console.log(`CloudDB: Preserving ${localOnlyItems.length} local ${colName} items not in cloud`);
                // Re-push these to sync up
                this.pushCollection(colName, localOnlyItems).catch(() => {});
                cloudItems = [...cloudItems, ...localOnlyItems];
              }
            }
          } catch (e) { /* ignore parse errors */ }
        }
      }

      localStorage.setItem(localKey, JSON.stringify(cloudItems));
      console.log(`CloudDB: Sync complete for ${colName} (${cloudItems.length} items total)`);
      return cloudItems;
    } catch (e) {
      console.warn(`CloudDB: pullCollection(${colName}) failed`, e.message);
    }
    return null;
  },


  _clean(obj) {
    if (Array.isArray(obj)) return obj.map(v => this._clean(v));
    if (obj !== null && typeof obj === 'object') {
      const cleaned = {};
      Object.keys(obj).forEach(k => {
        const v = obj[k];
        if (v !== undefined) cleaned[k] = this._clean(v);
      });
      return cleaned;
    }
    return obj;
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
          if (!item || !item.id) return;
          const ref = this.db.collection(colName).doc(String(item.id));
          // Sanitize object to remove 'undefined' values which Firestore rejects
          const data = this._clean(item);
          batch.set(ref, data);
        });
        await batch.commit();
      }
      console.log(`CloudDB: Pushed ${items.length} ${colName} to Firestore`);
    } catch (e) {
      console.warn(`CloudDB: pushCollection(${colName}) failed`, e.message);
    }
  },

  async deleteItem(colName, docId) {
    if (!this.ready || !colName || !docId) return;
    try {
      await this.db.collection(colName).doc(String(docId)).delete();
      console.log(`CloudDB: Deleted ${docId} from ${colName}`);
    } catch (e) {
      console.warn(`CloudDB: deleteItem(${colName}, ${docId}) failed`, e.message);
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
  
  // ── Deleted IDs Synchronization ───────────────────────────────────────────
  async pullDeletedIds() {
    if (!this.ready) return [];
    try {
      const snap = await this.db.collection('deleted_ids').get();
      const ids = snap.docs.map(d => String(d.id));
      if (ids.length > 0) {
        // Merge with local deleted IDs
        const localIds = Store.getDeletedIds();
        const merged = Array.from(new Set([...localIds, ...ids]));
        localStorage.setItem('arvaan_deleted_product_ids', JSON.stringify(merged));
        console.log(`CloudDB: Pulled ${ids.length} deleted IDs from Firestore`);
      }
      return ids;
    } catch (e) {
      console.warn('CloudDB: pullDeletedIds failed', e.message);
      return [];
    }
  },

  async pushDeletedId(id) {
    if (!this.ready || !id) return;
    try {
      await this.db.collection('deleted_ids').doc(String(id)).set({ deletedAt: new Date().toISOString() });
      console.log(`CloudDB: Recorded tombstone for ${id} in Firestore`);
    } catch (e) {
      console.warn(`CloudDB: pushDeletedId(${id}) failed`, e.message);
    }
  },

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

        // If products collection is also empty, seed products
        if (typeof SEED_PRODUCTS !== 'undefined') {
          console.log('CloudDB: First run — seeding products...');
          await this.pushCollection('products', SEED_PRODUCTS);
        }
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
      // Sign in anonymously so Firestore security rules allow read/write
      // Sellers are not Firebase-authenticated; anonymous auth grants access
      if (this.auth && !this.auth.currentUser) {
        try {
          await this.auth.signInAnonymously();
          console.log('CloudDB: Signed in anonymously for Firestore access');
        } catch (authErr) {
          console.warn('CloudDB: Anonymous sign-in failed', authErr.message);
        }
      }

      // Parallel pull everything
      await Promise.all([
        this.pullConfig(),
        this.pullDeletedIds(), // Pull tombstones first
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
      
      const collections = ['products', 'orders', 'sellers', 'promotions', 'transactions', 'reviews', 'deleted_product_ids'];
      if (collections.includes(key) && Array.isArray(val)) {
        clearTimeout(Store[`_${key}SyncTimer`]);
        Store[`_${key}SyncTimer`] = setTimeout(() => {
          // Special handling for products: also explicitly delete any docs listed in deleted IDs
          if (key === 'products') {
            const deletedIds = Store.getDeletedIds();
            deletedIds.forEach(id => CloudDB.deleteItem('products', id).catch(() => {}));
          }
          
          // Special handling for deleted IDs: push individual docs to 'deleted_ids' collection
          if (key === 'deleted_product_ids') {
            val.forEach(id => CloudDB.pushDeletedId(id).catch(() => {}));
            return; // No need to call pushCollection for the whole array
          }

          CloudDB.pushCollection(key, val).catch(() => {});
        }, 800);
      }
    };
  }
});

// Expose globally
window.CloudDB = CloudDB;
